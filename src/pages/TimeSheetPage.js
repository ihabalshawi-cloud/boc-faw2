import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, Calendar, X, AlertTriangle, FileCheck, Printer, Upload, Plus, Trash2, Bell } from "lucide-react";
import { useToast, useConfirm } from "../contexts";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useGDrive } from "../gdrive";
import {
  TS_CODES_ALL, MONTHS_AR_TS, DAY_NAMES_AR, SHIFT_TEXT_COLORS, getShiftForDay,
  INITIAL_TS, TAB_INFO, calcTsStats, TsEmployeeRow,
} from "./TimeSheetHelpers";
import { importFromBuffer, exportToTemplate, buildHTMLTable } from "./TimeSheetExporters";
import { buildExcelFormattedHTML, buildOfficialFormHTML } from "./TimeSheetPrintBuilders";
import { TsImportPanel, TsExportPanel } from "./TimeSheetPanels";

const STORAGE_KEY       = "boc_timesheet_v7";
const STORAGE_PREV_KEYS = ["boc_timesheet_v6", "boc_timesheet_v5"];

function toArr(v) {
  let arr;
  if (Array.isArray(v)) arr = v;
  else if (v && typeof v === "object") {
    const ks = Object.keys(v);
    if (ks.length > 0 && ks.every(k => /^\d+$/.test(k)))
      arr = ks.sort((a,b)=>Number(a)-Number(b)).map(k=>v[k]);
    else arr = [];
  } else arr = [];
  return arr.filter(e => e && typeof e === "object").map(e => ({
    ...e, days: e.days || {}, hours: e.hours || {},
  }));
}

function dedup(arr) {
  const seen = new Set();
  return arr.filter(e => { const k = e.id || e.name; if (seen.has(k)) return false; seen.add(k); return true; });
}

function TimeSheetPage({ emp }) {
  const addToast = useToast();
  const confirm  = useConfirm();
  const gDrive   = useGDrive();

  const [tsMonth, setTsMonth] = useState(() => new Date().getMonth());
  const [tsYear,  setTsYear]  = useState(() => new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("malak");
  const [data, setData] = useState(() => {
    const raw = storage.get(STORAGE_KEY, null);
    if (!raw || typeof raw !== "object") {
      // v7 first load: migrate malak/contracts from any older key, always reset drivers
      let malak = [], contracts = [];
      for (const key of STORAGE_PREV_KEYS) {
        const prev = storage.get(key, null);
        if (prev && typeof prev === "object") {
          malak     = dedup(toArr(prev.malak));
          contracts = dedup(toArr(prev.contracts));
          break;
        }
      }
      return {
        malak:     malak.length     ? malak     : INITIAL_TS.malak,
        contracts: contracts.length ? contracts : INITIAL_TS.contracts,
        drivers:   INITIAL_TS.drivers,
      };
    }
    const malak     = dedup(toArr(raw.malak));
    const contracts = dedup(toArr(raw.contracts));
    const drivers   = dedup(toArr(raw.drivers));
    return {
      malak:     malak.length     ? malak     : INITIAL_TS.malak,
      contracts: contracts.length ? contracts : INITIAL_TS.contracts,
      drivers:   drivers.length   ? drivers   : INITIAL_TS.drivers,
    };
  });
  const [editCell,       setEditCell]       = useState(null);
  const [showLegend,     setShowLegend]     = useState(false);
  const [searchEmp,      setSearchEmp]      = useState("");
  const [importing,      setImporting]      = useState(false);
  const [showImport,     setShowImport]     = useState(false);
  const [importDriveId,  setImportDriveId]  = useState("");
  const [exporting,      setExporting]      = useState(false);
  const [showExport,     setShowExport]     = useState(false);
  const [exportDriveId,  setExportDriveId]  = useState("");
  const exportFileRef = useRef(null);
  const fileInputRef  = useRef(null);

  const persistTs = useCallback((updated) => {
    storage.set(STORAGE_KEY, updated);
    FirebaseAPI.saveTimesheet(updated);
  }, []);

  useEffect(() => {
    FirebaseAPI.loadTimesheet().then(d => {
      if (d && Array.isArray(d.malak) && d.malak.length) {
        const clean = { malak: dedup(d.malak), contracts: dedup(d.contracts || []), drivers: dedup(d.drivers || []) };
        setData(clean); storage.set(STORAGE_KEY, clean);
      }
    });
  }, []);

  useEffect(() => {
    if (new Date().getDate() === 25)
      addToast("تذكير: اليوم الخامس والعشرون — يُرجى تصدير تقرير التايم شيت", "warning");
  }, []);

  const importFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importFromBuffer(ev.target.result, { data, persistTs, setData, setShowImport, addToast, setImporting });
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const importFromDrive = async () => {
    if (!importDriveId.trim()) { addToast("أدخل File ID من Drive", "warning"); return; }
    if (!gDrive?.isReady) { addToast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setImporting(true);
    try {
      const buf = await gDrive.downloadFile(importDriveId.trim());
      await importFromBuffer(buf, { data, persistTs, setData, setShowImport, addToast, setImporting });
    } catch (e) {
      addToast("فشل تنزيل الملف من Drive: " + e.message, "error");
      setImporting(false);
    }
  };

  const exportFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => exportToTemplate(ev.target.result, {
      emps: data[activeTab]||[], tabLabel: TAB_INFO[activeTab].label, tsYear, tsMonth, addToast, setExporting, setShowExport
    });
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const exportFromDrive = async () => {
    if (!exportDriveId.trim()) { addToast("أدخل File ID من Drive", "warning"); return; }
    if (!gDrive?.isReady) { addToast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setExporting(true);
    try {
      const buf = await gDrive.downloadFile(exportDriveId.trim());
      await exportToTemplate(buf, {
        emps: data[activeTab]||[], tabLabel: TAB_INFO[activeTab].label, tsYear, tsMonth, addToast, setExporting, setShowExport
      });
    } catch (e) {
      addToast("فشل تنزيل القالب من Drive: " + e.message, "error");
      setExporting(false);
    }
  };

  const exportFromBuiltin = async () => {
    setExporting(true);
    const templateMap = {
      malak:     { path: "/templates/timesheet-malak.xlsx",     dayColStart: 5 },
      contracts: { path: "/templates/timesheet-contracts.xlsx", dayColStart: 5 },
      drivers:   { path: "/templates/timesheet-drivers.xlsx",   dayColStart: 4 },
    };
    const { path, dayColStart } = templateMap[activeTab] || templateMap.malak;
    try {
      await exportToTemplate(
        await (await fetch(path)).arrayBuffer(),
        { emps: data[activeTab]||[], tabLabel: TAB_INFO[activeTab].label, tsYear, tsMonth, addToast, setExporting, setShowExport, dayColStart }
      );
    } catch(e) { addToast("فشل: "+e.message, "error"); setExporting(false); }
  };

  const daysInMonth = useMemo(() => new Date(tsYear, tsMonth + 1, 0).getDate(), [tsYear, tsMonth]);
  const days = useMemo(() => Array.from({length: daysInMonth}, (_, i) => i + 1), [daysInMonth]);
  const employees = useMemo(() => {
    const list = data[activeTab] || [];
    if (!searchEmp.trim()) return list;
    return list.filter(e => e.name.includes(searchEmp.trim()) || e.id.includes(searchEmp.trim()));
  }, [data, activeTab, searchEmp]);

  const updateCell = useCallback((tabKey, empId, day, field, value) => {
    setData(prev => {
      const updated = {
        ...prev,
        [tabKey]: prev[tabKey].map(e => {
          if (e.id !== empId) return e;
          if (field === "code") {
            const newDays = {...e.days};
            if (value === "") delete newDays[String(day)];
            else newDays[String(day)] = value;
            return {...e, days: newDays};
          } else {
            const newHours = {...e.hours};
            const n = parseInt(value);
            if (!value || isNaN(n)) delete newHours[String(day)];
            else newHours[String(day)] = n;
            return {...e, hours: newHours};
          }
        })
      };
      persistTs(updated);
      return updated;
    });
  }, [persistTs]);

  const updateNotes = useCallback((tabKey, empId, notes) => {
    setData(prev => {
      const updated = {...prev, [tabKey]: prev[tabKey].map(e => e.id===empId ? {...e, notes} : e)};
      persistTs(updated);
      return updated;
    });
  }, [persistTs]);

  const addEmployee = (tabKey) => {
    const id = prompt("أدخل الرقم الوظيفي (أو الاسم للسائقين):");
    if (!id?.trim()) return;
    const name = prompt("أدخل الاسم الكامل:");
    if (!name?.trim()) return;
    const newEmp = {id:id.trim(), name:name.trim(), movement:"", days:{}, hours:{}, notes:""};
    setData(prev => { const u = {...prev, [tabKey]: [...prev[tabKey], newEmp]}; persistTs(u); return u; });
    addToast("تمت إضافة الموظف", "success");
  };

  const deleteEmployee = useCallback(async (tabKey, empId, empName) => {
    const ok = await confirm(`هل تريد حذف ${empName}؟`);
    if (!ok) return;
    setData(prev => { const u = {...prev, [tabKey]: prev[tabKey].filter(e => e.id !== empId)}; persistTs(u); return u; });
    addToast("تم حذف الموظف", "success");
  }, [confirm, addToast, persistTs]);

  const editDriverName = useCallback((tabKey, empId, currentName) => {
    const newName = prompt("تعديل اسم السائق:", currentName);
    if (!newName?.trim() || newName.trim() === currentName) return;
    setData(prev => {
      const u = {...prev, [tabKey]: prev[tabKey].map(e => e.id === empId ? {...e, name:newName.trim(), id:newName.trim()} : e)};
      persistTs(u); return u;
    });
    addToast("تم تعديل اسم السائق", "success");
  }, [persistTs, addToast]);

  const summaryStats = useMemo(() => {
    const list = dedup(data[activeTab] || []);
    const all = list.map(e => calcTsStats(e));
    return {
      total:  list.length,
      hours:  all.reduce((s, st) => s + st.totalHours, 0),
      leave:  all.reduce((s, st) => s + st.leaveDays,  0),
      absent: all.reduce((s, st) => s + st.absenceDays,0),
      rest:   all.reduce((s, st) => s + st.restDays,   0),
    };
  }, [data, activeTab]);

  const resetData = async () => {
    const ok = await confirm("هل تريد إعادة تعيين جميع البيانات للبيانات الأصلية؟");
    if (!ok) return;
    persistTs(INITIAL_TS); setData(INITIAL_TS);
    addToast("تمت إعادة التعيين للبيانات الأصلية", "success");
  };

  const resetTab = async () => {
    const ok = await confirm(`هل تريد تصفير جميع رموز الحضور لتبويب ${TAB_INFO[activeTab].label}؟`);
    if (!ok) return;
    setData(prev => {
      const u = {...prev, [activeTab]: prev[activeTab].map(e => ({...e, days:{}, hours:{}}))};
      persistTs(u); return u;
    });
    addToast(`تم تصفير بيانات ${TAB_INFO[activeTab].label}`, "success");
  };

  const fillWeekend = async () => {
    if (activeTab === "drivers") {
      const ok = await confirm("ملء أيام الجمعة (R) والسبت (Y) لجميع السائقين؟");
      if (!ok) return;
      setData(prev => {
        const u = {...prev, drivers: prev.drivers.map(e => {
          const newDays = {...e.days};
          days.forEach(d => {
            const dow = new Date(tsYear, tsMonth, d).getDay();
            if (dow === 5) newDays[String(d)] = "R";
            if (dow === 6) newDays[String(d)] = "Y";
          });
          return {...e, days: newDays};
        })};
        persistTs(u); return u;
      });
      addToast("تم ملء أيام الجمعة والسبت لجميع السائقين", "success");
      return;
    }
    const morningCount = (data[activeTab]||[]).filter(e=>e.isMorning).length;
    if (morningCount === 0) { addToast("لا يوجد كادر صباحي في هذا التبويب", "warning"); return; }
    const ok = await confirm(`ملء أيام الجمعة (R) والسبت (Y) للكادر الصباحي في ${TAB_INFO[activeTab].label}؟`);
    if (!ok) return;
    setData(prev => {
      const u = {
        ...prev,
        [activeTab]: prev[activeTab].map(e => {
          if (!e.isMorning) return e;
          const newDays = {...e.days};
          days.forEach(d => {
            const dow = new Date(tsYear, tsMonth, d).getDay();
            if (dow === 5) newDays[String(d)] = "R";
            if (dow === 6) newDays[String(d)] = "Y";
          });
          return {...e, days: newDays};
        })
      };
      persistTs(u); return u;
    });
    addToast("تم ملء رموز عطلة نهاية الأسبوع للكادر الصباحي", "success");
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const html = buildHTMLTable(data[activeTab]||[], TAB_INFO[activeTab].title, MONTHS_AR_TS[tsMonth], tsYear, tsMonth, days);
    downloadBlob(new Blob(["﻿"+html], {type:"application/vnd.ms-excel;charset=utf-8"}),
      `تايم_شيت_${TAB_INFO[activeTab].label}_${tsYear}_${String(tsMonth+1).padStart(2,"0")}.xls`);
    addToast("تم تصدير الملف بتنسيق Excel", "success");
  };

  const exportExcelFormatted = () => {
    const html = buildExcelFormattedHTML(data[activeTab]||[], TAB_INFO[activeTab].label, tsYear, tsMonth, days);
    downloadBlob(new Blob(["﻿"+html], {type:"application/vnd.ms-excel"}),
      `تايم_شيت_${TAB_INFO[activeTab].label}_${tsYear}_${String(tsMonth+1).padStart(2,"0")}.xls`);
    addToast("تم تصدير الملف بنجاح بالتنسيق الرسمي ✅", "success");
  };

  const printInIframe = (html, w, h, delay=800) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `position:fixed;top:-999px;left:-999px;width:${w}px;height:${h}px;border:none;`;
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 3000);
    }, delay);
  };

  const exportPDF = () => {
    const html = buildHTMLTable(data[activeTab]||[], TAB_INFO[activeTab].title, MONTHS_AR_TS[tsMonth], tsYear, tsMonth, days);
    const printHTML = html.replace("<body>", `<body><style>@page{size:A3 landscape;margin:10mm;} @media print{body{zoom:0.7;}}</style>`);
    printInIframe(printHTML, 1400, 900);
    addToast("جارٍ فتح نافذة الطباعة / تصدير PDF", "info");
  };

  const exportOfficialForm = () => {
    const html = buildOfficialFormHTML(data[activeTab]||[], TAB_INFO[activeTab].title, MONTHS_AR_TS[tsMonth], tsYear, tsMonth, days);
    printInIframe(html, 1500, 1000, 900);
    addToast("جارٍ طباعة الفورمة الرسمية", "info");
  };

  const dayIsToday = (d) => d===new Date().getDate()&&tsMonth===new Date().getMonth()&&tsYear===new Date().getFullYear();

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">سجل الحضور والانصراف (تايم شيت)</h1>
          <p className="text-sm text-secondary mt-0.5">رقم العمل: 3432960600 — مستودع الفاو — قسم السيطرة والنظم</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={tsMonth} onChange={e=>setTsMonth(+e.target.value)}
            className="text-sm border border-color rounded-lg px-2 py-1.5 bg-surface text-primary">
            {MONTHS_AR_TS.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <select value={tsYear} onChange={e=>setTsYear(+e.target.value)}
            className="text-sm border border-color rounded-lg px-2 py-1.5 bg-surface text-primary">
            {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fillWeekend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-orange-500 text-white hover:bg-orange-600">
            <Calendar size={14}/> ج/س صباحي
          </button>
          <button onClick={resetTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600">
            <X size={14}/> تصفير
          </button>
          <button onClick={()=>setShowLegend(v=>!v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-secondary">
            <AlertTriangle size={14}/> دليل الرموز
          </button>
          <button onClick={()=>{setShowExport(v=>!v);setShowImport(false);}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-700 text-white hover:bg-green-800">
            <FileCheck size={14}/> تصدير بيانات اكسل
          </button>
          <button onClick={exportOfficialForm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">
            <Printer size={14}/> طباعة / PDF
          </button>
          <button onClick={()=>{setShowImport(v=>!v);setShowExport(false);}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
            <Upload size={14}/> استيراد Excel
          </button>
        </div>
      </div>

      {showImport && (
        <TsImportPanel
          gDrive={gDrive} importing={importing}
          importDriveId={importDriveId} setImportDriveId={setImportDriveId}
          importFromFile={importFromFile} importFromDrive={importFromDrive}
          fileInputRef={fileInputRef}
        />
      )}

      {showExport && (
        <TsExportPanel
          gDrive={gDrive} exporting={exporting} activeTab={activeTab}
          exportDriveId={exportDriveId} setExportDriveId={setExportDriveId}
          exportFromFile={exportFromFile} exportFromDrive={exportFromDrive}
          exportFromBuiltin={exportFromBuiltin}
          exportFileRef={exportFileRef}
        />
      )}

      {showLegend && (
        <div className="card rounded-xl p-4 border border-color">
          <h3 className="font-bold text-sm mb-3 text-primary">دليل رموز الحضور والانصراف</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(TS_CODES_ALL).map(([code,info])=>(
              <div key={code} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${info.color}`}>
                <span className="font-black text-sm w-5 text-center">{code}</span>
                <span>{info.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {new Date().getDate() === 25 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <Bell size={18} className="text-amber-600 shrink-0"/>
          <p className="text-sm text-amber-800 font-medium">تذكير: اليوم الخامس والعشرون — يُرجى مراجعة وتصدير تقرير التايم شيت</p>
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-color pb-0">
        {Object.entries(TAB_INFO).map(([key,info])=>(
          <button key={key} onClick={()=>{setActiveTab(key);setSearchEmp("");setEditCell(null);}}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-md transition-colors border-b-2 ${activeTab===key?"border-[#C87A2E] text-[#C87A2E] bg-[#FDF3E7]":"border-transparent text-secondary hover:text-primary"}`}>
            {info.label}
            <span className="mr-1.5 text-xs text-gray-400 ts-mono">({data[key]?.length||0})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{TAB_INFO[activeTab].title}</p>
          <p className="text-xs text-secondary">شهر {MONTHS_AR_TS[tsMonth]} {tsYear} — {daysInMonth} يوم</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400"/>
            <input value={searchEmp} onChange={e=>setSearchEmp(e.target.value)} placeholder="بحث عن موظف..."
              className="text-sm border border-color rounded-lg pr-8 pl-3 py-1.5 bg-surface text-primary w-48"/>
          </div>
          <button onClick={()=>addEmployee(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-[#C87A2E] text-white hover:bg-[#B06D27] transition-colors">
            <Plus size={14}/> إضافة
          </button>
          <button onClick={resetData} title="إعادة تعيين للبيانات الأصلية"
            className="p-1.5 rounded-lg text-sm btn-secondary text-red-500 hover:text-red-700">
            <Trash2 size={14}/>
          </button>
        </div>
      </div>

      <div className="card rounded-xl border border-color overflow-hidden">
        <div className="overflow-x-auto" dir="ltr">
          <table className="text-xs border-collapse" style={{minWidth:`${200+daysInMonth*30+240}px`}} dir="ltr">
            <thead>
              <tr>
                <th className="border border-gray-200 px-2 py-2 text-center ts-header" style={{position:"sticky",left:0,zIndex:10,minWidth:activeTab==="drivers"?"28px":"70px",fontSize:"11px"}}>الرقم</th>
                <th className="border border-gray-200 px-2 py-2 text-left ts-header" style={{position:"sticky",left:activeTab==="drivers"?"28px":"70px",zIndex:10,minWidth:"150px"}}>الاسم</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header ts-mono" style={{minWidth:"58px",fontSize:"10px"}}>الدوام الإضافي</th>
                {days.map(d=>{
                  const dow = new Date(tsYear, tsMonth, d).getDay();
                  const isWe = dow===5||dow===6;
                  const shift = getShiftForDay(tsYear, tsMonth, d);
                  const todayFlag = dayIsToday(d);
                  return (
                    <th key={d} className={`border border-gray-200 py-1 text-center ts-mono ${todayFlag?"ts-today":isWe?"ts-we":"ts-header"}`} style={{minWidth:"30px"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:todayFlag?"#166534":isWe?"#C87A2E":undefined}}>{d}</div>
                      <div style={{fontSize:"8px",color:isWe?"#C87A2E":"#9ca3af",lineHeight:"1"}}>{DAY_NAMES_AR[dow]}</div>
                      <div style={{fontSize:"8px",fontWeight:"bold",color:SHIFT_TEXT_COLORS[shift]||"#374151",lineHeight:"1.2"}}>{shift}</div>
                    </th>
                  );
                })}
                <th className="border border-gray-200 px-1 py-2 text-center ts-header ts-mono" style={{minWidth:"52px",color:"#C87A2E"}}>ساعات</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#15803d"}}>إجازة</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#dc2626"}}>غياب</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#6b7280"}}>عطل</th>
                <th className="border border-gray-200 px-2 py-2 text-right ts-header" style={{minWidth:"100px"}}>ملاحظات</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"32px"}}></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, idx) => (
                <TsEmployeeRow
                  key={e.id} e={e} idx={idx} days={days} tsYear={tsYear} tsMonth={tsMonth}
                  activeTab={activeTab} editCell={editCell} setEditCell={setEditCell}
                  updateCell={updateCell} updateNotes={updateNotes}
                  deleteEmployee={deleteEmployee} editDriverName={editDriverName}
                  codes={TAB_INFO[activeTab].codes} isLTR={true}
                />
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={9+daysInMonth} className="text-center py-8 text-secondary text-sm">لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:"إجمالي الموظفين",    val:summaryStats.total,  color:"text-[#C87A2E]"},
          {label:"إجمالي ساعات العمل", val:summaryStats.hours,  color:"text-[#C87A2E]"},
          {label:"إجمالي أيام الإجازة",val:summaryStats.leave,  color:"text-green-600"},
          {label:"إجمالي أيام الغياب", val:summaryStats.absent, color:"text-red-600"},
          {label:"إجمالي أيام العطل",  val:summaryStats.rest,   color:"text-gray-600"},
        ].map(s=>(
          <div key={s.label} className="card rounded-xl p-3 border border-color text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-secondary mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-secondary text-center">انقر على أي خلية في صف (أ) لتغيير رمز الحضور • انقر على أي خلية في صف (ق) لإدخال عدد الساعات • يتم الحفظ تلقائياً</p>
    </div>
  );
}

export default TimeSheetPage;
