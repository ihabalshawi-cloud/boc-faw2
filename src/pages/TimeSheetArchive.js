import React, { useEffect, useRef, useState } from "react";
import { Archive, Download, Trash2, RotateCcw, ClipboardList } from "lucide-react";
import { MONTHS_AR_TS } from "./TimeSheetHelpers";
import { storage, EXPORT_LOG_KEY } from "../utils";
import { useConfirm } from "../contexts";
import { FirebaseAPI } from "../firebase";

export const ARCHIVE_KEY = "boc_ts_archive";

export function archiveMonth(data, year, month) {
  const key  = `${year}-${String(month + 1).padStart(2, "0")}`;
  const prev = storage.get(ARCHIVE_KEY, []);
  const entry = {
    key, year, month,
    monthName:  MONTHS_AR_TS[month],
    archivedAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(data)),
  };
  const updated = [entry, ...prev.filter(a => a.key !== key)].slice(0, 12);
  storage.set(ARCHIVE_KEY, updated);
  return updated;
}

function downloadArchive(entry) {
  const blob = new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `تايم-شيت-${entry.monthName}-${entry.year}.json`,
  });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(a.href);
}

export function useAutoArchive(data, tsArchives, setTsArchives, addToast) {
  const ref = useRef({ data, tsArchives });
  useEffect(() => { ref.current = { data, tsArchives }; });

  useEffect(() => {
    // Load from Firebase on mount and merge with localStorage
    FirebaseAPI.loadArchive().then(fbList => {
      if (!fbList?.length) return;
      const local = storage.get(ARCHIVE_KEY, []);
      const merged = [...local];
      fbList.forEach(e => { if (!merged.some(l => l.key === e.key)) merged.push(e); });
      merged.sort((a, b) => b.key.localeCompare(a.key));
      const limited = merged.slice(0, 12);
      storage.set(ARCHIVE_KEY, limited);
      setTsArchives(limited);
    }).catch(() => {});

    const isLastDay = () => {
      const now = new Date();
      return now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    };

    const tryAutoArchive = () => {
      if (!isLastDay()) return;
      const now = new Date();
      const y = now.getFullYear(), m = now.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const { data: d, tsArchives: arch } = ref.current;
      if (arch.some(a => a.key === key)) return;
      const updated = archiveMonth(d, y, m);
      setTsArchives(updated);
      FirebaseAPI.saveArchive(updated).catch(() => {});
      addToast(`تمت الأرشفة التلقائية لشهر ${MONTHS_AR_TS[m]} ${y} 📦`, "success");
    };

    tryAutoArchive();

    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() === 59) tryAutoArchive();
    }, 60_000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function ArchivePanel({ archives, setArchives, onRestore }) {
  const confirm = useConfirm();
  const [exportLog] = useState(() => storage.get(EXPORT_LOG_KEY, []));

  const del = async (key) => {
    if (!await confirm("حذف هذا الأرشيف نهائياً؟")) return;
    const updated = archives.filter(a => a.key !== key);
    storage.set(ARCHIVE_KEY, updated);
    setArchives(updated);
    FirebaseAPI.saveArchive(updated).catch(() => {});
  };

  return (
    <div className="card rounded-xl border border-color p-4 space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Archive size={15} className="text-[#C87A2E]"/> أرشيف التايم شيت
          <span className="text-xs text-secondary font-normal">({archives.length} شهر)</span>
        </h3>
      </div>

      {archives.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <Archive size={32} className="mx-auto mb-2 opacity-20"/>
          <p className="text-sm">لا توجد أشهر مؤرشفة بعد</p>
          <p className="text-xs mt-1">اضغط "أرشفة الشهر" لحفظ نسخة من البيانات الحالية</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {archives.map(entry => (
            <div key={entry.key}
              className="flex items-center justify-between gap-3 px-3 py-2.5 bg-hover rounded-xl border border-color">
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary truncate">
                  {entry.monthName} {entry.year}
                </p>
                <p className="text-xs text-secondary">
                  أُرشف: {new Date(entry.archivedAt).toLocaleDateString("ar-IQ")}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => downloadArchive(entry)} title="تنزيل كـ JSON"
                  className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">
                  <Download size={13}/>
                </button>
                <button onClick={() => onRestore(entry)} title="استعادة بيانات هذا الشهر"
                  className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors">
                  <RotateCcw size={13}/>
                </button>
                <button onClick={() => del(entry.key)} title="حذف الأرشيف"
                  className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors">
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {exportLog.length > 0 && (
        <div className="mt-3 pt-3 border-t border-color">
          <p className="text-xs font-bold text-secondary flex items-center gap-1.5 mb-2">
            <ClipboardList size={13}/> سجل التصديرات الأخيرة
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {exportLog.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-hover">
                <span className="text-primary truncate">{e.label}</span>
                <span className="text-secondary shrink-0 mr-2">{new Date(e.at).toLocaleDateString("ar-IQ")} {new Date(e.at).toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
