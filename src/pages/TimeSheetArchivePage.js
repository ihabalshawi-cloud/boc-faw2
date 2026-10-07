import React, { useState, useEffect } from "react";
import { Archive, ChevronDown, ChevronUp, Download } from "lucide-react";
import { FirebaseAPI } from "../firebase";
import { MONTHS_AR_TS } from "./TimeSheetHelpers";
import { buildHTMLTable } from "./TimeSheetExporters";

const TABS = ["malak","contracts","drivers"];
const TAB_LABELS = { malak:"الملاك", contracts:"العقود", drivers:"السواق" };

function keyLabel(key) {
  const [year, mon] = key.split("_").map(Number);
  return `${MONTHS_AR_TS[mon - 1]} ${year}`;
}

function exportMonthExcel(data, key) {
  const [year, mon] = key.split("_").map(Number);
  const month = mon - 1;
  const days = new Date(year, month + 1, 0).getDate();
  const daysArr = Array.from({length: days}, (_, i) => i + 1);
  const tab = TABS.find(t => (data[t]||[]).length > 0) || "malak";
  const html = buildHTMLTable(data[tab]||[], TAB_LABELS[tab], MONTHS_AR_TS[month], year, month, daysArr);
  const blob = new Blob(["﻿"+html], {type:"application/vnd.ms-excel;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `أرشيف_تايم_شيت_${MONTHS_AR_TS[month]}_${year}.xls`;
  a.click();
}

function ArchiveCard({ archKey }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("malak");

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (data) return;
    setLoading(true);
    const [year, mon] = archKey.split("_").map(Number);
    const d = await FirebaseAPI.loadTimesheetArchive(year, mon - 1);
    setData(d); setLoading(false);
  };

  const totals = data ? TABS.map(t => (data[t]||[]).length) : [];
  const totalEmps = totals.reduce((s,n) => s+n, 0);

  return (
    <div className="card rounded-2xl border border-color overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center justify-between p-4 hover:bg-hover transition-colors">
        <div className="flex items-center gap-3">
          <Archive size={16} className="text-slate-500"/>
          <span className="font-bold text-primary">{keyLabel(archKey)}</span>
          {data && <span className="text-xs text-secondary bg-hover px-2 py-0.5 rounded-full">{totalEmps} موظف</span>}
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <button onClick={e=>{e.stopPropagation();exportMonthExcel(data,archKey);}}
              className="flex items-center gap-1 px-2.5 py-1 text-xs btn-secondary border border-color rounded-lg">
              <Download size={12}/> Excel
            </button>
          )}
          {open ? <ChevronUp size={16} className="text-secondary"/> : <ChevronDown size={16} className="text-secondary"/>}
        </div>
      </button>

      {open && (
        <div className="border-t border-color p-4 space-y-3">
          {loading && <p className="text-center text-secondary text-sm py-4">جاري التحميل...</p>}
          {!loading && !data && <p className="text-center text-secondary text-sm py-4">تعذّر تحميل البيانات</p>}
          {!loading && data && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {TABS.map((t,i) => (
                  <div key={t} className="text-center p-2 bg-hover rounded-xl">
                    <p className="text-lg font-bold text-blue-600">{(data[t]||[]).length}</p>
                    <p className="text-xs text-secondary">{TAB_LABELS[t]}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 border-b border-color">
                {TABS.filter(t => (data[t]||[]).length > 0).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px ${activeTab===t?"border-blue-600 text-blue-600":"border-transparent text-secondary"}`}>
                    {TAB_LABELS[t]}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto max-h-48 rounded-xl border border-color">
                <table className="text-xs w-full">
                  <tbody>
                    {(data[activeTab]||[]).slice(0,20).map(e => (
                      <tr key={e.id} className="border-b border-color last:border-0">
                        <td className="p-2 font-medium">{e.name}</td>
                        <td className="p-2 text-secondary">{e.movement||"—"}</td>
                        <td className="p-2 text-secondary">{Object.keys(e.days||{}).length} يوم</td>
                      </tr>
                    ))}
                    {(data[activeTab]||[]).length > 20 && (
                      <tr><td colSpan="3" className="p-2 text-center text-secondary">... و{(data[activeTab]||[]).length - 20} آخرين</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function TimeSheetArchivePage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FirebaseAPI.listTimesheetArchives().then(k => { setKeys(k||[]); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-secondary">جاري تحميل الأرشيف...</div>;

  return (
    <div className="space-y-4 p-4" dir="rtl">
      <div className="flex items-center gap-3">
        <Archive size={20} className="text-slate-600"/>
        <h1 className="text-xl font-bold text-primary">أرشيف التايم شيت</h1>
      </div>
      {keys.length === 0
        ? (
          <div className="text-center py-20 text-secondary">
            <Archive size={48} className="mx-auto mb-4 opacity-30"/>
            <p className="font-bold text-base">لا توجد أرشيفات بعد</p>
            <p className="text-sm mt-1">اضغط زر "أرشفة الشهر" في صفحة التايم شيت لحفظ شهر</p>
          </div>
        )
        : keys.map(key => <ArchiveCard key={key} archKey={key}/>)
      }
    </div>
  );
}
