import React, { useState, useEffect, useRef, useMemo } from "react";
import { Save, Plus, Trash2, X, Download, FolderOpen, FileCheck } from "lucide-react";
import { GDRIVE_WARN_PCT, GDRIVE_CRIT_PCT, FIREBASE_STORAGE_BUCKET } from "../constants";
import { useToast, useConfirm } from "../contexts";
import { useGDrive } from "../gdrive";
export { InspectionsTab } from "./ProjectTabs";

const DOC_TYPES = ["وثيقة هندسية","عقد","تقرير","خطة","رسم","أخرى"];

// ========== نظام تخزين الملفات المحلي المتقدم ==========
// استخدام IndexedDB للملفات الكبيرة (أكثر من 5MB)
const FileStorage = {
  dbName: "BOC_ProjectFiles",
  dbVersion: 1,
  db: null,

  initDB: () => {
    return new Promise((resolve, reject) => {
      if (FileStorage.db) { resolve(FileStorage.db); return; }
      const request = indexedDB.open(FileStorage.dbName, FileStorage.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { FileStorage.db = request.result; resolve(FileStorage.db); };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("files")) {
          const store = db.createObjectStore("files", { keyPath: "id" });
          store.createIndex("projectId", "projectId", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  },

  saveFile: async (projectId, docId, file, metadata) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const transaction = FileStorage.db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");
        const fileRecord = {
          id: docId, projectId, name: metadata.name, type: metadata.type,
          size: file.size, timestamp: Date.now(), uploadedBy: metadata.uploadedBy,
          date: metadata.date, data: e.target.result,
        };
        const request = store.put(fileRecord);
        request.onsuccess = () => resolve(fileRecord);
        request.onerror = () => reject(request.error);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  getFile: async (fileId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readonly");
      const store = transaction.objectStore("files");
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  deleteFile: async (fileId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readwrite");
      const store = transaction.objectStore("files");
      const request = store.delete(fileId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  getProjectFiles: async (projectId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readonly");
      const store = transaction.objectStore("files");
      const index = store.index("projectId");
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  getStorageUsage: async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
      };
    }
    return null;
  }
};

// رفع ملف إلى Firebase Storage عبر REST API (بدون SDK)
export const uploadToFirebaseStorage = (file, path, onProgress) => new Promise((resolve, reject) => {
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o?uploadType=media&name=${encodeURIComponent(path)}`;
  const xhr = new XMLHttpRequest();
  xhr.upload.addEventListener("progress", e => {
    if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
  });
  xhr.onload = () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      const token = data.downloadTokens;
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o/${encodeURIComponent(data.name)}?alt=media&token=${token}`;
      resolve({ url: downloadUrl, path: data.name, size: data.size });
    } else {
      reject(new Error(`فشل الرفع (${xhr.status}): ${xhr.responseText}`));
    }
  };
  xhr.onerror = () => reject(new Error("خطأ في الشبكة أثناء الرفع"));
  xhr.open("POST", url);
  xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
  xhr.send(file);
});

// حد افتراضي لخطة Firebase المجانية (Spark) — 5GB تخزين.
const FIREBASE_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
export const fmtStorageSize = (b) => b >= 1e9 ? (b/1e9).toFixed(2)+" GB" : b >= 1e6 ? (b/1e6).toFixed(1)+" MB" : b >= 1e3 ? (b/1e3).toFixed(0)+" KB" : b+" B";

// يحسب الاستخدام الفعلي لمخزن Firebase Storage عبر سرد كل الملفات وجمع أحجامها
export const getFirebaseStorageUsage = async () => {
  try {
    let usage = 0, pageToken;
    do {
      const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o?maxResults=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      (data.items || []).forEach(it => { usage += Number(it.size || 0); });
      pageToken = data.nextPageToken;
    } while (pageToken);
    const limit = FIREBASE_STORAGE_LIMIT_BYTES;
    const pct = Math.round((usage / limit) * 100);
    return { usage, limit, pct, usageStr: fmtStorageSize(usage), limitStr: fmtStorageSize(limit), freeStr: fmtStorageSize(Math.max(limit - usage, 0)) };
  } catch { return null; }
};

// ── تبويب الوثائق ──
export function DocsTab({ proj, addDoc, delDoc, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "وثيقة هندسية", date: new Date().toISOString().split("T")[0], size: "", uploadedBy: emp.name });
  const [fileData, setFileData] = useState(null);
  const [fileMime, setFileMime] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [localFiles, setLocalFiles] = useState([]);
  const [storageUsage, setStorageUsage] = useState(null);
  const [fbUsage, setFbUsage] = useState(null);
  const fileRef = useRef(null);
  const addToast = useToast();
  const confirm = useConfirm();
  const gDrive = useGDrive();

  useEffect(() => { loadLocalFiles(); checkStorage(); }, [proj.id]);
  useEffect(() => { getFirebaseStorageUsage().then(setFbUsage); }, []);

  const loadLocalFiles = async () => {
    try { const files = await FileStorage.getProjectFiles(proj.id); setLocalFiles(files); }
    catch (err) { console.error("Error loading local files:", err); }
  };

  const checkStorage = async () => { setStorageUsage(await FileStorage.getStorageUsage()); };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileMime(file.type);
    setForm(prev => ({ ...prev, name: prev.name || file.name, size: (file.size / 1024).toFixed(0) + " KB" }));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFileData(ev.target.result);
      reader.readAsDataURL(file);
    } else { setFileData(null); }
  };

  const resetForm = () => {
    setShowAdd(false);
    setForm({ name: "", type: "وثيقة هندسية", date: new Date().toISOString().split("T")[0], size: "", uploadedBy: emp.name });
    setFileData(null); setFileMime(""); setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadViaFirebase = async () => {
    const path = `projects/${proj.id}/${Date.now()}_${selectedFile.name}`;
    const result = await uploadToFirebaseStorage(selectedFile, path, pct => setUploadPct(pct));
    addDoc(proj.id, {
      ...form, fileData: null, fileMime: fileMime || null,
      fileUrl: result.url, firebasePath: result.path,
      size: form.size || (Number(result.size) / 1024).toFixed(0) + " KB",
      storageType: "firebase"
    });
    addToast("تم رفع الملف إلى Firebase Storage ✅", "success");
    getFirebaseStorageUsage().then(setFbUsage);
  };

  const uploadViaDrive = async () => {
    const result = await gDrive.uploadFile(selectedFile, pct => setUploadPct(pct));
    addDoc(proj.id, {
      ...form, fileData: null, fileMime: fileMime || null,
      driveFileId: result.id, driveViewLink: result.webViewLink, driveDownloadLink: result.webContentLink,
      size: form.size || (Number(result.size) / 1024).toFixed(0) + " KB",
      storageType: "google_drive"
    });
    addToast("تم رفع الملف إلى Google Drive ✅", "success");
  };

  const submit = async () => {
    if (!form.name.trim()) { addToast("يرجى إدخال اسم الوثيقة", "warning"); return; }
    setUploading(true); setUploadPct(0);
    try {
      if (selectedFile) {
        const nearFull = fbUsage && fbUsage.pct >= GDRIVE_WARN_PCT;
        if (nearFull && gDrive.isReady) {
          addToast(`⚠️ مساحة Firebase اقتربت من الامتلاء (${fbUsage.pct}%) — يتم الرفع إلى Google Drive`, "warning");
          await uploadViaDrive();
        } else {
          try {
            await uploadViaFirebase();
          } catch (fbErr) {
            if (gDrive.isReady) {
              addToast("تعذّر الرفع إلى Firebase، تتم المحاولة عبر Google Drive كاحتياطي...", "warning");
              await uploadViaDrive();
            } else {
              throw fbErr;
            }
          }
        }
      } else {
        addDoc(proj.id, { ...form, fileData: null, storageType: "metadata" });
        addToast("تمت إضافة الوثيقة", "success");
      }
      resetForm();
    } catch (e) { addToast(`فشل الرفع: ${e.message}`, "error"); }
    finally { setUploading(false); setUploadPct(0); }
  };

  const doDelete = async (doc) => {
    if (!await confirm("حذف هذه الوثيقة؟", { title: "حذف الوثيقة", ok: "حذف" })) return;
    if (doc.localFileId) { await FileStorage.deleteFile(doc.localFileId); await loadLocalFiles(); await checkStorage(); }
    if (doc.driveFileId && gDrive.isReady) await gDrive.deleteFile(doc.driveFileId);
    if (doc.firebasePath) {
      try {
        await fetch(`https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o/${encodeURIComponent(doc.firebasePath)}`, { method: "DELETE" });
      } catch {}
    }
    delDoc(proj.id, doc.id);
    addToast("تم الحذف", "info");
  };

  const downloadFile = (doc) => {
    if (doc.fileUrl) { window.open(doc.fileUrl, "_blank"); return; }
    if (doc.driveDownloadLink) { window.open(doc.driveDownloadLink, "_blank"); return; }
    if (doc.fileData) {
      const a = document.createElement("a");
      a.href = doc.fileData; a.download = doc.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    addToast("لا يوجد ملف للتحميل", "warning");
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const docIcons = { "وثيقة هندسية": "🗂️", "عقد": "📋", "تقرير": "📊", "خطة": "📅", "رسم": "📐", "أخرى": "📄" };
  const isImage = (mime) => mime && mime.startsWith("image/");

  const allDocs = useMemo(() => {
    const projectDocs = proj.docs || [];
    const localDocs = localFiles.map(f => ({
      id: f.id, name: f.name, type: f.type || "وثيقة",
      date: new Date(f.timestamp).toISOString().split("T")[0],
      size: formatBytes(f.size), uploadedBy: f.uploadedBy,
      fileData: f.data, fileMime: f.type, localFileId: f.id, storageType: "local"
    }));
    const localIds = new Set(localDocs.map(d => d.localFileId));
    return [...projectDocs.filter(d => !d.localFileId || !localIds.has(d.localFileId)), ...localDocs];
  }, [proj.docs, localFiles]);

  return (
    <div className="space-y-4">
      {storageUsage && (
        <div className={`rounded-xl p-3 flex items-center justify-between text-xs border ${storageUsage.percent > 80 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-2">
            <span>💾</span>
            <span className="font-medium">التخزين المحلي:</span>
            <span>{formatBytes(storageUsage.usage)} / {formatBytes(storageUsage.quota)}</span>
          </div>
          <div className="flex-1 max-w-[200px] mx-3">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${storageUsage.percent > 80 ? "bg-red-500" : storageUsage.percent > 60 ? "bg-amber-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(100, storageUsage.percent)}%` }} />
            </div>
          </div>
          <span className={storageUsage.percent > 80 ? "text-red-600 font-bold" : "text-gray-600"}>{storageUsage.percent}% مستخدم</span>
        </div>
      )}

      {fbUsage && fbUsage.pct >= GDRIVE_WARN_PCT && (
        <div className={`rounded-xl p-3 flex items-center justify-between text-xs border ${fbUsage.pct >= GDRIVE_CRIT_PCT ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span className="font-medium">Firebase Storage:</span>
            <span>{fbUsage.usageStr} / {fbUsage.limitStr}</span>
          </div>
          <span className={fbUsage.pct >= GDRIVE_CRIT_PCT ? "text-red-600 font-bold" : "text-amber-600 font-medium"}>
            {fbUsage.pct}% — {gDrive.isReady ? "الرفع التالي سيتم عبر Google Drive احتياطياً" : "متاح: " + fbUsage.freeStr}
          </span>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold">{previewDoc.name}</span>
              <button onClick={() => setPreviewDoc(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            {isImage(previewDoc.fileMime) && (previewDoc.fileData || previewDoc.fileUrl)
              ? <img src={previewDoc.fileData || previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full rounded-xl" />
              : <div className="text-center py-8 text-secondary">
                  <p className="text-5xl mb-3">{previewDoc.storageType === "firebase" ? "🔥" : previewDoc.driveFileId ? "☁️" : "📄"}</p>
                  <p>{previewDoc.name}</p>
                </div>
            }
            <button onClick={() => downloadFile(previewDoc)} className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Download size={14} /> {previewDoc.driveFileId ? "فتح في Google Drive" : previewDoc.fileUrl ? "فتح الملف" : "تحميل الملف"}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FolderOpen size={16} /> وثائق المشروع ({allDocs.length})</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            🔥 Firebase Storage
          </span>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            <Plus size={14} /> إضافة وثيقة / صورة
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card rounded-2xl border border-color p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">إضافة وثيقة أو صورة</h4>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🔥 Firebase Storage</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">اسم الوثيقة</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم الملف أو الوثيقة" /></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نوع الوثيقة</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm">
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الرفع</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">رُفع بواسطة</label>
              <input value={form.uploadedBy} onChange={e => setForm({ ...form, uploadedBy: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-1">اختر ملف أو صورة</label>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                  onChange={handleFileSelect}
                  className="block text-sm text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                {selectedFile && <button onClick={() => { setFileData(null); setFileMime(""); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-red-400 hover:text-red-600"><X size={16} /></button>}
              </div>
              {fileData && isImage(fileMime) && <img src={fileData} alt="معاينة" className="mt-2 max-h-32 rounded-lg border border-color object-contain" />}
              {selectedFile && !isImage(fileMime) && <p className="mt-1 text-xs text-emerald-600 font-medium">✓ تم اختيار: {selectedFile.name} ({form.size})</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={resetForm} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} disabled={uploading} className="relative overflow-hidden flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 min-w-[100px]">
              {uploading && uploadPct > 0 && <span className="absolute inset-0 bg-blue-400/50 transition-all" style={{ width: `${uploadPct}%` }} />}
              <span className="relative">
                {uploading ? <><span className="animate-spin">⏳</span> {uploadPct > 0 ? `${uploadPct}%` : "جارٍ الرفع..."}</> : <><Save size={14} /> إضافة</>}
              </span>
            </button>
          </div>
        </div>
      )}

      {allDocs.length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FolderOpen size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد وثائق بعد</p></div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allDocs.map(d => (
          <div key={d.id} className="card rounded-xl border border-color p-3">
            {isImage(d.fileMime) && (d.fileData || d.fileUrl) && (
              <div className="mb-2 cursor-pointer" onClick={() => setPreviewDoc(d)}>
                <img src={d.fileData || d.fileUrl} alt={d.name} className="w-full h-32 object-cover rounded-lg border border-color hover:opacity-90 transition-opacity" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="text-2xl cursor-pointer" onClick={() => (d.fileData || d.fileUrl) && setPreviewDoc(d)}>
                {isImage(d.fileMime) ? "🖼️" : (d.fileData || d.fileUrl) ? "📎" : (docIcons[d.type] || "📄")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{d.name}</p>
                <p className="text-xs text-secondary mt-0.5">{d.type} · {d.date}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {d.size && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono">{d.size}</span>}
                  <span className="text-[10px] text-secondary">{d.uploadedBy}</span>
                  {d.storageType === "local" && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">📁 محلي</span>}
                  {d.storageType === "gdrive" && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">☁️ Drive</span>}
                  {d.storageType === "firebase" && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">🔥 Firebase</span>}
                  <button onClick={() => downloadFile(d)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                    <Download size={10} /> تحميل
                  </button>
                  {isImage(d.fileMime) && (d.fileData || d.fileUrl) && (
                    <button onClick={() => setPreviewDoc(d)} className="text-[10px] text-purple-600 hover:underline">عرض</button>
                  )}
                </div>
              </div>
              <button onClick={() => doDelete(d)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg flex-shrink-0"><Trash2 size={14} /></button>
            </div>
            {d.firebasePath && (
              <div className="mt-1 pt-1 border-t border-color flex items-center gap-1">
                <span className="text-[10px] text-orange-600 font-medium">🔥 Firebase Storage</span>
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">فتح</a>
              </div>
            )}
            {d.driveFileId && (
              <div className="mt-1 pt-1 border-t border-color flex items-center gap-1">
                <span className="text-[10px] text-emerald-600 font-medium">☁️ Google Drive</span>
                <a href={d.driveViewLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">فتح</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

