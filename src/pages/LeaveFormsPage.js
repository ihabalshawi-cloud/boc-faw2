import React, { useState, useEffect } from "react";
import { Save, CheckCircle, FileText, Printer, Download, Upload, Send } from "lucide-react";
import { storage } from "../utils";
import { useToast } from "../contexts";
import { useGDrive } from "../gdrive";
import SignaturePad from "./LeaveSignaturePad";
import AnnualLeaveForm from "./AnnualLeaveForm";
import OutOfCountryLeaveForm from "./OutOfCountryLeaveForm";
import TimeLeaveForm from "./TimeLeaveForm";

// ========== نموذج الإجازة المرضية ==========
function SickLeaveForm({ emp }) {
  const toast = useToast();
  const gDrive = useGDrive();
  const STORAGE_KEY = `sick_leave_${emp.id}`;
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);
  const [xlExporting, setXlExporting] = useState(false);

  const [name,        setName]        = useState(emp.name);
  const [jobNum,      setJobNum]      = useState(emp.jobNum || "");
  const [jobTitle,    setJobTitle]    = useState(emp.title || "");
  const [leaveDate,   setLeaveDate]   = useState("");
  const [leaveTime,   setLeaveTime]   = useState("");
  const [clinicDT,    setClinicDT]    = useState("");
  const [notes,       setNotes]       = useState("");
  const [returnDate,  setReturnDate]  = useState("");
  const [returnTime,  setReturnTime]  = useState("");
  const [sigDataUrl,  setSigDataUrl]  = useState(null);
  const [empSigDataUrl, setEmpSigDataUrl] = useState(null);
  const [status,       setStatus]       = useState("draft");

  useEffect(() => {
    const s = storage.get(STORAGE_KEY, null);
    if (s) {
      setName(s.name || emp.name);
      setJobNum(s.jobNum || emp.jobNum || "");
      setJobTitle(s.jobTitle || emp.title || "");
      setLeaveDate(s.leaveDate || "");
      setLeaveTime(s.leaveTime || "");
      setClinicDT(s.clinicDT || "");
      setNotes(s.notes || "");
      setReturnDate(s.returnDate || "");
      setReturnTime(s.returnTime || "");
      setSigDataUrl(s.sigDataUrl || null);
      setEmpSigDataUrl(s.empSigDataUrl || null);
      setStatus(s.status || "draft");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, leaveDate, leaveTime, clinicDT, notes, returnDate, returnTime, sigDataUrl, empSigDataUrl, status: "draft" });
    toast("تم حفظ المسودة", "success");
  };
  const saveAndSubmit = () => {
    if (!empSigDataUrl) { toast("توقيع الموظف إلزامي للتقديم", "warning"); return; }
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, leaveDate, leaveTime, clinicDT, notes, returnDate, returnTime, sigDataUrl, empSigDataUrl, status: "submitted" });
    toast("تم تقديم الإجازة المرضية بنجاح", "success");
  };

  const fmtDate = (d) => {
    if (!d) return "_______________";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
  };
  const fmtTime = (t) => t || "____ : ____";
  const fmtDT   = (v) => {
    if (!v) return "_______________";
    const dt = new Date(v);
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}  ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
  };

  const buildSickHtml = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:130px;max-height:45px;display:block;"/>`
      : "";
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>
<title>نموذج إجازة مرضية</title>
<style>
  @page{size:A4 portrait;margin:12mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;font-size:12pt;direction:rtl;color:#111}
  table{border-collapse:collapse;width:100%}
  .hdr td{border:1px solid #000;padding:5px 8px;vertical-align:middle;text-align:center}
  .lbl-cell{background:#D0D0D0;font-weight:bold;font-size:10pt;width:90px}
  .main-cell{font-weight:bold;font-size:12pt}
  .co-cell{background:#A0A0A0;font-weight:bold;font-size:11pt;width:120px}
  .logo-cell{font-weight:bold;font-size:22pt;width:110px}
  .phone{font-weight:bold;font-size:11pt;direction:ltr;text-align:left;margin:10px 0 2px}
  .co-name{text-align:center;font-weight:bold;font-size:13pt;margin:4px 0 2px}
  .form-title{text-align:center;font-weight:bold;font-size:13pt;margin:2px 0 12px;border-bottom:1.5px dotted #999;padding-bottom:6px}
  .field{font-weight:bold;font-size:12pt;padding:8px 0 3px;border-bottom:1.5px dotted #999;margin-bottom:4px}
  .field span{font-weight:normal;margin-right:6px}
  .sec-label{font-weight:bold;font-size:12pt;margin-top:20px;margin-bottom:3px}
  .sig-space{border-bottom:2px solid #000;min-height:48px;margin-bottom:14px;padding:4px 0}
  .footer{text-align:center;font-size:9pt;font-style:italic;border-top:1px solid #000;border-bottom:1px solid #000;padding:5px;margin-top:24px}
</style></head>
<body>
<table class="hdr">
  <tr>
    <td class="logo-cell" rowspan="2">☯</td>
    <td class="lbl-cell">عنوان النموذج</td>
    <td class="main-cell">نـمـوذج اجـازة مرضيـة</td>
    <td class="co-cell">شركة نفط البصرة</td>
  </tr>
  <tr>
    <td class="lbl-cell">رمز النموذج</td>
    <td style="text-align:center;font-size:10pt">BOC-P-13//F02 &nbsp;&nbsp;&nbsp; رقم الإصدار: 1 &nbsp;&nbsp;&nbsp; تاريخ الإصدار: 2019/1/7</td>
    <td></td>
  </tr>
</table>
<div class="phone">372-3000-400</div>
<div class="co-name">شركة نفط البصرة (شركة عامة )</div>
<div class="form-title">إستمارة ترك العمل للعلاج الطبي</div>
<div class="field">الاسم : <span>${name}</span></div>
<div class="field">الرقم : <span>${jobNum}</span></div>
<div class="field">المهنة : <span>${jobTitle}</span></div>
<div class="field">تاريخ ترك العمل : <span>${fmtDate(leaveDate)}</span></div>
<div class="field">وقت ترك العمل : <span>${fmtTime(leaveTime)}</span></div>
<div class="sec-label">المسؤول</div>
<div class="sig-space">${sigHtml}</div>
<div class="field">تاريخ وقت مراجعة المستوصف : <span>${fmtDT(clinicDT)}</span></div>
<div class="field" style="min-height:28px">الملاحظات : <span>${notes}</span></div>
<div class="sec-label">الطبيب</div>
<div class="sig-space"></div>
<div class="field">تاريخ عودته الى العمل : <span>${fmtDate(returnDate)}</span></div>
<div class="field">وقت عودته الى العمل : <span>${fmtTime(returnTime)}</span></div>
<div class="footer">* يعتبر هذا النموذج ملك لشركة نفط البصرة . لا يجوزظ نسخه او الكشف عن محتواه بدون موافقة خطية مسبقة من قبل شركة نفط البصرة</div>
</body></html>`;
  };

  const printForm = () => {
    const html = buildSickHtml();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const uploadToDrive = async () => {
    if (!gDrive.isReady) { toast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const html = buildSickHtml();
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const dateStr = leaveDate || new Date().toISOString().split("T")[0];
      const file = new File(
        [new Blob([html], { type: "text/html" })],
        `اجازة-مرضية-${safeName}-${dateStr}.html`,
        { type: "text/html" }
      );
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast("تم رفع نموذج الإجازة المرضية إلى Drive", "success");
    } catch (e) {
      toast("فشل رفع الملف: " + e.message, "error");
    } finally {
      setUploadPct(-1);
    }
  };

  const exportToExcel = async () => {
    setXlExporting(true);
    try {
      const res = await fetch("/templates/leave-sick.xlsx");
      const buf0 = await res.arrayBuffer();
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf0);
      const ws = wb.worksheets[0];
      const set = (r, v) => { ws.getCell(r).value = v ?? null; };
      const fmtD = d => {
        if (!d) return "";
        const dt = new Date(d + "T00:00:00");
        return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
      };
      const fmtDT = v => {
        if (!v) return "";
        const dt = new Date(v);
        return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}  ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
      };
      set("C5",  fmtD(new Date().toISOString().split("T")[0]));
      set("I8",  name);
      set("I9",  String(jobNum || ""));
      set("I10", jobTitle);
      set("I11", fmtD(leaveDate));
      set("I12", leaveTime || "");
      set("I16", fmtDT(clinicDT));
      set("I18", notes);
      set("I24", fmtD(returnDate));
      set("I25", returnTime || "");
      const outBuf = await wb.xlsx.writeBuffer();
      const safeName = (name || "موظف").replace(/\s+/g, "_");
      const fname = `اجازة_مرضية_${safeName}_${leaveDate || "بدون_تاريخ"}.xlsx`;
      const blob = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      toast("تم تصدير نموذج الإجازة المرضية", "success");
      if (gDrive.isReady) {
        setUploadPct(0);
        const file = new File([outBuf], fname, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
        setDriveLink(result.webViewLink);
        toast("تم رفع النموذج إلى Drive", "success");
      }
    } catch(e) {
      toast("فشل التصدير: " + e.message, "error");
    } finally {
      setXlExporting(false); setUploadPct(-1);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة مرضية — إستمارة ترك العمل للعلاج الطبي</h2><p className="text-xs text-secondary">BOC-P-13//F02 — طباعة A4 portrait</p></div>
      </div>

      {/* بيانات الموظف */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">الاسم</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">المهنة</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>

      {/* ترك العمل */}
      <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 space-y-3">
        <p className="text-xs font-bold text-rose-700">بيانات ترك العمل</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ ترك العمل</label><input type="date" value={leaveDate} onChange={e=>setLeaveDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وقت ترك العمل</label><input type="time" value={leaveTime} onChange={e=>setLeaveTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        </div>
      </div>

      {/* توقيع الموظف */}
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع الموظف <span className="text-rose-500 font-medium">* إلزامي للتقديم</span></label>
        <SignaturePad onSave={setEmpSigDataUrl} label="ارسم توقيعك ثم اضغط حفظ التوقيع"/>
        {empSigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={empSigDataUrl} alt="توقيع الموظف" className="max-h-14"/></div>}
      </div>

      {/* توقيع المسؤول */}
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع المسؤول (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم التوقيع ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع المسؤول" className="max-h-14"/></div>}
      </div>

      {/* مراجعة المستوصف */}
      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 space-y-3">
        <p className="text-xs font-bold text-blue-700">بيانات المستوصف</p>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ/وقت مراجعة المستوصف</label><input type="datetime-local" value={clinicDT} onChange={e=>setClinicDT(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الملاحظات</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none"/></div>
      </div>

      {/* العودة للعمل */}
      <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 space-y-3">
        <p className="text-xs font-bold text-emerald-700">بيانات العودة للعمل</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ العودة للعمل</label><input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وقت العودة للعمل</label><input type="time" value={returnTime} onChange={e=>setReturnTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        <button onClick={saveDraft} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ مسودة</button>
        <button onClick={saveAndSubmit} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Send size={14}/> حفظ وتقديم</button>
        {gDrive.isReady && (
          <button onClick={uploadToDrive} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "رفع إلى Drive"}
          </button>
        )}
        <button onClick={exportToExcel} disabled={xlExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"><Download size={14}/> {xlExporting ? "جاري التصدير..." : "تصدير إكسل"}</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== صفحة نماذج الإجازات ==========
function LeaveFormsPrintPage({ emp }) {
  const [tab, setTab] = useState("time");
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={()=>setTab("time")}   className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="time"  ?"bg-teal-600 text-white border-teal-600"  :"btn-secondary border-color"}`}>إجازة زمنية</button>
        <button onClick={()=>setTab("sick")}   className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="sick"  ?"bg-rose-500 text-white border-rose-500"  :"btn-secondary border-color"}`}>إجازة مرضية</button>
        <button onClick={()=>setTab("annual")} className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="annual"?"bg-blue-600 text-white border-blue-600":"btn-secondary border-color"}`}>إجازة اعتيادية</button>
        <button onClick={()=>setTab("ooc")}    className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="ooc"   ?"bg-violet-600 text-white border-violet-600":"btn-secondary border-color"}`}>إجازة خارج القطر</button>
      </div>
      {tab==="time"   && <TimeLeaveForm emp={emp}/>}
      {tab==="sick"   && <SickLeaveForm emp={emp}/>}
      {tab==="annual" && <AnnualLeaveForm emp={emp}/>}
      {tab==="ooc"    && <OutOfCountryLeaveForm emp={emp}/>}
    </div>
  );
}

export default LeaveFormsPrintPage;
