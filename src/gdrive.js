import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { GDRIVE_PROXY, GDRIVE_WARN_PCT, GDRIVE_CRIT_PCT } from "./constants";

// ── Raw API ───────────────────────────────────────────────────────────────────
let _saEmail = null; // يُعبأ من ping

export const GDriveAPI = {
  checkConnection: async () => {
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 5000);
      const res  = await fetch(`${GDRIVE_PROXY}?action=ping`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) return false;
      const data = await res.json();
      if (data.saEmail) _saEmail = data.saEmail;
      return data.ok === true;
    } catch { return false; }
  },

  uploadFile: async (file, onProgress) => {
    const CHUNK = 2 * 1024 * 1024;
    const mime  = file.type || "application/octet-stream";

    if (file.size <= 3 * 1024 * 1024) {
      let res;
      try {
        res = await fetch(`${GDRIVE_PROXY}?action=upload`, {
          method: "POST",
          headers: { "x-filename": encodeURIComponent(file.name), "x-file-mime": mime, "Content-Type": mime },
          body: file,
        });
      } catch { throw new Error("تعذّر الوصول إلى خادم الرفع"); }
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        const r = b.error?.errors?.[0]?.reason || "";
        const m = b.error?.message || b.error || "";
        if (r === "storageQuotaExceeded") {
          if (b.error?._quotaFix === "service_account_quota")
            throw new Error("خطأ في إعداد Drive: Service Account لا يملك مساحة تخزين — أضف GDRIVE_REFRESH_TOKEN في إعدادات Vercel");
          throw new Error("امتلأت مساحة Google Drive — احذف ملفات قديمة أو رفّع الحصة");
        }
        throw new Error(String(m) || `خطأ HTTP ${res.status}`);
      }
      onProgress?.(100);
      return await res.json();
    }

    let initRes;
    try {
      initRes = await fetch(`${GDRIVE_PROXY}?action=resumable-init`, {
        method: "POST",
        headers: { "x-filename": encodeURIComponent(file.name), "x-file-mime": mime, "x-file-size": String(file.size) },
      });
    } catch { throw new Error("تعذّر الوصول إلى خادم الرفع"); }
    if (!initRes.ok) {
      const b = await initRes.json().catch(() => ({}));
      if (b._quotaFix === "service_account_quota")
        throw new Error("خطأ في إعداد Drive: Service Account لا يملك مساحة تخزين — أضف GDRIVE_REFRESH_TOKEN في إعدادات Vercel");
      throw new Error(b.error || `فشل بدء الجلسة: HTTP ${initRes.status}`);
    }
    const { sessionUri } = await initRes.json();

    let offset = 0;
    while (offset < file.size) {
      const end   = Math.min(offset + CHUNK, file.size);
      const chunk = file.slice(offset, end);
      let chunkRes;
      try {
        chunkRes = await fetch(`${GDRIVE_PROXY}?action=resumable-chunk`, {
          method: "POST",
          headers: { "x-session-uri": sessionUri, "x-content-range": `bytes ${offset}-${end - 1}/${file.size}`, "Content-Type": mime },
          body: chunk,
        });
      } catch { throw new Error("انقطع الاتصال أثناء الرفع — حاول مجدداً"); }

      if (chunkRes.status === 200 || chunkRes.status === 201) {
        onProgress?.(100);
        return await chunkRes.json();
      }
      if (chunkRes.status === 308) {
        const range = chunkRes.headers.get("Range");
        offset = range ? parseInt(range.split("-")[1], 10) + 1 : end;
        onProgress?.(Math.round((offset / file.size) * 100));
      } else {
        const b = await chunkRes.json().catch(() => ({}));
        const r = b.error?.errors?.[0]?.reason || "";
        if (r === "storageQuotaExceeded") {
          if (b.error?._quotaFix === "service_account_quota")
            throw new Error("خطأ في إعداد Drive: Service Account لا يملك مساحة تخزين — أضف GDRIVE_REFRESH_TOKEN في إعدادات Vercel");
          throw new Error("امتلأت مساحة Google Drive — احذف ملفات قديمة أو رفّع الحصة");
        }
        throw new Error(b.error?.message || `خطأ في الجزء ${chunkRes.status}`);
      }
    }
    throw new Error("انتهى الرفع بدون إجابة نهائية");
  },

  getQuota: async () => {
    try {
      const res = await fetch(`${GDRIVE_PROXY}?action=quota`);
      if (!res.ok) return null;
      const { storageQuota, _authWarning } = await res.json();
      if (!storageQuota) return null;
      const limit  = Number(storageQuota.limit || 0);
      const usage  = Number(storageQuota.usage || 0);
      const pct    = limit > 0 ? Math.round((usage / limit) * 100) : 0;
      const fmtGB  = b => b >= 1e9 ? (b/1e9).toFixed(2)+" GB" : b >= 1e6 ? (b/1e6).toFixed(1)+" MB" : b >= 1e3 ? (b/1e3).toFixed(0)+" KB" : b+" B";
      return {
        limit, usage, pct,
        limitStr: limit > 0 ? fmtGB(limit) : "—",
        usageStr: fmtGB(usage),
        freeStr:  limit > 0 ? fmtGB(limit - usage) : "غير محدود",
        serviceAccountWarning: _authWarning === "service_account_no_quota",
      };
    } catch { return null; }
  },

  deleteFile: async (fileId) => {
    if (!fileId) return;
    try { await fetch(`${GDRIVE_PROXY}?action=delete&fileId=${encodeURIComponent(fileId)}`, { method: "DELETE" }); } catch {}
  },

  downloadFile: async (fileId) => {
    const res = await fetch(`${GDRIVE_PROXY}?action=download&fileId=${encodeURIComponent(fileId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || `HTTP ${res.status}`;
      if (res.status === 404 || res.status === 403 || /not found|forbidden|access/i.test(msg)) {
        const saHint = _saEmail
          ? `شارك الملف مع:\n${_saEmail}\n(Drive → Share → أضف هذا البريد → Viewer)`
          : `افتح Drive → Share → أضف بريد Service Account → Viewer`;
        throw new Error(`لا يمكن الوصول إلى ملف القالب (${res.status}).\n\n${saHint}`);
      }
      throw new Error(`فشل تنزيل الملف: ${msg}`);
    }
    return await res.arrayBuffer();
  },
};

// ── React Context ─────────────────────────────────────────────────────────────
export const GDriveContext = createContext({
  isReady: false, quota: null,
  refreshQuota:  async () => {},
  uploadFile:    async () => { throw new Error("not connected"); },
  deleteFile:    async () => {},
  downloadFile:  async () => { throw new Error("not connected"); },
});

export const useGDrive = () => useContext(GDriveContext);

export function GDriveProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [quota, setQuota]     = useState(null);

  const refreshQuota = useCallback(async () => {
    const q = await GDriveAPI.getQuota();
    if (q) setQuota(q);
  }, []);

  useEffect(() => {
    GDriveAPI.checkConnection().then(ok => {
      setIsReady(ok);
      if (ok) refreshQuota();
    });
  }, [refreshQuota]);

  const uploadFile = useCallback(async (file, onProgress) => {
    const result = await GDriveAPI.uploadFile(file, onProgress);
    GDriveAPI.getQuota().then(q => { if (q) setQuota(q); });
    return result;
  }, []);

  const deleteFile = useCallback(async (fileId) => {
    await GDriveAPI.deleteFile(fileId);
    GDriveAPI.getQuota().then(q => { if (q) setQuota(q); });
  }, []);

  const downloadFile = useCallback(async (fileId) => {
    return await GDriveAPI.downloadFile(fileId);
  }, []);

  return (
    <GDriveContext.Provider value={{ isReady, quota, refreshQuota, uploadFile, deleteFile, downloadFile }}>
      {children}
    </GDriveContext.Provider>
  );
}

// Re-export config constants so components can still use GDRIVE_WARN_PCT / GDRIVE_CRIT_PCT
export { GDRIVE_WARN_PCT, GDRIVE_CRIT_PCT };
