import React, { useState, useEffect } from "react";
import { Save, CheckCircle, Clock, Printer, Download, Upload, Send } from "lucide-react";
import { storage, fmtIraqi } from "../utils";
import { FirebaseAPI } from "../firebase";
import { ACCOUNTS } from "../constants";
import { useToast } from "../contexts";
import { sendBackgroundPush } from "../components/Shared";
import { useGDrive } from "../gdrive";
import SignaturePad from "./LeaveSignaturePad";

function TimeLeaveForm({ emp }) {
  const now = new Date();
  const toast = useToast();
  const gDrive = useGDrive();
  const isRegularEmp = !["admin","inventory_manager","attendance_admin"].includes(emp.role) && emp.username !== "i.shawi";
  const STORAGE_KEY = `time_leave_${emp.id}`;

  const [name, setName] = useState(emp.name);
  const [jobNum, setJobNum] = useState(emp.jobNum || "");
  const [jobTitle, setJobTitle] = useState(emp.title || "");
  const [dept, setDept] = useState(emp.dept || "");
  const [leaveDate, setLeaveDate] = useState(now.toISOString().split("T")[0]);
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const [status, setStatus] = useState("draft");
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);
  const [xlExporting, setXlExporting] = useState(false);

  useEffect(() => {
    const saved = storage.get(STORAGE_KEY, null);
    if (saved) {
      setName(saved.name || emp.name);
      setJobNum(saved.jobNum || emp.jobNum || "");
      setJobTitle(saved.jobTitle || emp.title || "");
      setDept(saved.dept || emp.dept || "");
      setLeaveDate(saved.leaveDate || now.toISOString().split("T")[0]);
      setDepartureTime(saved.departureTime || "");
      setReturnTime(saved.returnTime || "");
      setHours(saved.hours || "");
      setReason(saved.reason || "");
      setSigDataUrl(saved.sigDataUrl || null);
      setStatus(saved.status || "draft");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (departureTime && returnTime) {
      const [dh, dm] = departureTime.split(":").map(Number);
      const [rh, rm] = returnTime.split(":").map(Number);
      const diff = (rh * 60 + rm) - (dh * 60 + dm);
      if (diff > 0) setHours((diff / 60).toFixed(1).replace(/\.0$/, ""));
    }
  }, [departureTime, returnTime]);

  const saveDraft = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, leaveDate, departureTime, returnTime, hours, reason, sigDataUrl, status: "draft" });
    toast("تم حفظ المسودة", "success");
  };
  const saveAndSubmit = async () => {
    if (status === "submitted") {
      const today = new Date().toISOString().split("T")[0];
      const saved = storage.get(STORAGE_KEY, {});
      if (saved.submittedDate === today && saved.leaveDate === leaveDate) { toast("تم تقديم هذا الطلب مسبقاً — يرجى الانتظار حتى تتم مراجعته", "warning"); return; }
    }
    if (!sigDataUrl) { toast("توقيع الموظف إلزامي للتقديم", "warning"); return; }
    const today = new Date().toISOString().split("T")[0];
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, leaveDate, departureTime, returnTime, hours, reason, sigDataUrl, status: "submitted", submittedDate: today });
    setStatus("submitted");
    const purpose = reason || (hours ? `${hours} ساعة` : "إجازة زمنية");
    const newReq = { id: Date.now(), type: "زمنية", dateFrom: leaveDate, dateTo: leaveDate, purpose, days: 1, status: "بانتظار المراجعة", submittedAt: new Date().toISOString(), empId: emp.id, empName: name, empSigDataUrl: sigDataUrl };
    const prevAll = await FirebaseAPI.loadRequests() || storage.get("all_requests", []);
    const allReqs = [newReq, ...prevAll.filter(r => r && r.id !== newReq.id)];
    storage.set("all_requests", allReqs);
    const saved = await FirebaseAPI.saveRequests(allReqs);
    if (!saved) { toast("⚠️ تعذّر حفظ الطلب على الخادم — تحقق من الاتصال وأعد المحاولة", "error"); return; }
    storage.set(`requests_${emp.id}`, [newReq, ...storage.get(`requests_${emp.id}`, [])]);
    ACCOUNTS.filter(a => a.role === "admin" || a.username === "i.shawi").forEach(admin => {
      const key = `notifications_${admin.id}`;
      const notifs = [{ id: Date.now() + admin.id, type: "طلب_إجازة", title: `📋 طلب إجازة زمنية — ${name}`, body: `زمنية — ${hours || "؟"} ساعة | ${reason}`, timestamp: new Date().toISOString(), read: false, reqId: newReq.id }, ...storage.get(key, [])];
      storage.set(key, notifs); FirebaseAPI.saveNotifications(admin.id, notifs); sendBackgroundPush(admin.id, notifs[0].title, notifs[0].body, notifs[0].type);
    });
    toast("تم تقديم الإجازة الزمنية بنجاح", "success");
  };

  const fmtDate = (d) => {
    if (!d) return "____/____/____";
    const dt = new Date(d);
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
  };

  const fmtTime = (t) => t || "____ : ____";

  const buildTimeHtml = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:120px;max-height:50px;display:block;margin:auto;"/>`
      : `<div style="min-height:40px"></div>`;
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>إجازة زمنية</title>
<style>
  @page{size:A5 portrait;margin:8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;direction:rtl}
  .header{display:flex;border:1.5px solid #333;margin-bottom:5px}
  .h-logo{width:42px;border-left:1px solid #333;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10.5pt}
  .h-mid{flex:1;text-align:center;padding:4px 6px}
  .h-ref{width:85px;border-right:1px solid #333;padding:3px 5px;font-size:7.5pt;text-align:center;line-height:1.6}
  .company{font-size:10.5pt;font-weight:bold}
  .csub{font-size:8pt;color:#444}
  .form-title{font-size:11pt;font-weight:bold;text-align:center;margin-bottom:6px;border:1.5px solid #333;padding:4px}
  .fr{display:flex;align-items:baseline;gap:6px;margin-bottom:5px;border-bottom:1px dotted #bbb;padding-bottom:3px}
  .lbl{font-weight:bold;font-size:8.5pt;min-width:70px;white-space:nowrap}
  .val{flex:1;font-size:9pt}
  .time-row{display:flex;gap:10px;margin:8px 0}
  .time-box{flex:1;border:1.5px solid #333;text-align:center;padding:6px 4px}
  .time-label{font-weight:bold;font-size:8pt;margin-bottom:4px;border-bottom:1px solid #ccc;padding-bottom:2px}
  .time-val{font-size:11pt;font-weight:bold;direction:ltr}
  .sentence{font-size:9pt;margin:6px 0;line-height:2.0;border:1px solid #ccc;padding:5px 8px;background:#fafafa}
  .blank{display:inline-block;min-width:40px;text-align:center;font-weight:bold;border-bottom:1px solid #555;padding:0 2px}
  .sig-row{display:flex;gap:8px;margin-top:8px}
  .sig-box{border:1.5px solid #333;text-align:center;padding:5px 4px;min-height:58px;flex:1}
  .sig-title{font-weight:bold;font-size:8pt;margin-bottom:3px}
  .fn{font-size:7pt;margin-top:5px;text-align:center;border-top:1px dotted #aaa;padding-top:3px;color:#555}
</style></head>
<body>
<div class="header">
  <div class="h-logo">BOC</div>
  <div class="h-mid">
    <div class="company">شركة نفط البصرة (شركة عامة)</div>
    <div class="csub">إدارة الموارد البشرية — شعبة مستودع الفاو</div>
  </div>
  <div class="h-ref"><div>BOC-P-13/F04</div><div>2022/6/1</div><div>372-3000-400</div></div>
</div>
<div class="form-title">نموذج إجازة زمنية</div>
<div class="fr"><span class="lbl">الاسم الثلاثي:</span><span class="val">${name}</span></div>
<div class="fr"><span class="lbl">الرقم الوظيفي:</span><span class="val">${jobNum}</span></div>
<div class="fr"><span class="lbl">العنوان الوظيفي:</span><span class="val">${jobTitle}</span></div>
<div class="fr"><span class="lbl">القسم / الشعبة:</span><span class="val">${dept || "—"}</span></div>
<div class="fr"><span class="lbl">تاريخ الإجازة:</span><span class="val">${fmtDate(leaveDate)}</span></div>
<div class="time-row">
  <div class="time-box">
    <div class="time-label">وقت المغادرة</div>
    <div class="time-val">${fmtTime(departureTime)}</div>
  </div>
  <div class="time-box">
    <div class="time-label">وقت العودة</div>
    <div class="time-val">${fmtTime(returnTime)}</div>
  </div>
  <div class="time-box">
    <div class="time-label">عدد الساعات</div>
    <div class="time-val">${hours || "—"}</div>
  </div>
</div>
<div class="sentence">
  السبب / الغرض: &nbsp;<span class="blank">&nbsp;${reason || "___________________________________"}&nbsp;</span>
</div>
<div class="sig-row">
  <div class="sig-box"><div class="sig-title">توقيع الموظف</div>${sigHtml}</div>
  <div class="sig-box"><div class="sig-title">توقيع المسؤول المباشر</div></div>
</div>
<div class="fn">تحتفظ الجهة بنسخة وتسلم نسخة للموظف</div>
</body></html>`;
  };

  const printForm = () => {
    const toolbar = `<style>@media print{#_pb{display:none!important}}</style><div id="_pb" style="position:sticky;top:0;z-index:9999;background:#1a1a2e;display:flex;gap:10px;padding:8px 14px;direction:rtl;align-items:center"><button onclick="window.print()" style="background:#C87A2E;color:#fff;border:none;padding:7px 18px;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer;font-family:Arial,sans-serif">&#128424; طباعة</button><button onclick="window.close()" style="background:#dc2626;color:#fff;border:none;padding:7px 18px;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer;font-family:Arial,sans-serif">&#x2715; إغلاق</button><span style="color:#9ca3af;font-size:11px;font-family:Arial,sans-serif">معاينة قبل الطباعة</span></div>`;
    const finalHtml = buildTimeHtml().replace("</body>", toolbar + "</body>");
    const win = window.open("", "_blank", "width=960,height=720");
    if (win) { win.document.write(finalHtml); win.document.close(); win.focus(); }
  };

  const uploadToDrive = async () => {
    if (!gDrive.isReady) { toast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const html = buildTimeHtml();
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File([new Blob([html], { type: "text/html" })], `اجازة-زمنية-${safeName}-${leaveDate || "بدون-تاريخ"}.html`, { type: "text/html" });
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast("تم رفع نموذج الإجازة الزمنية إلى Drive", "success");
    } catch (e) {
      toast("فشل رفع الملف: " + e.message, "error");
    } finally {
      setUploadPct(-1);
    }
  };

  const exportToExcel = async () => {
    setXlExporting(true);
    try {
      const res = await fetch("/templates/leave-time.xlsx");
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
      set("F2", fmtD(leaveDate));
      set("C7", name);
      set("E7", String(jobNum || ""));
      set("G7", jobTitle);
      set("D8", dept);
      set("G8", departureTime || "");
      set("C9", returnTime || "");
      const outBuf = await wb.xlsx.writeBuffer();
      const safeName = (name || "موظف").replace(/\s+/g, "_");
      const fname = `اجازة_زمنية_${safeName}_${leaveDate || "بدون_تاريخ"}.xlsx`;
      const blob = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      toast("تم تصدير نموذج الإجازة الزمنية", "success");
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
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center"><Clock size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة زمنية</h2><p className="text-xs text-secondary">BOC-P-13/F04 — طباعة A5 portrait</p></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">الاسم الثلاثي</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">العنوان الوظيفي</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">القسم / الشعبة</label><input value={dept} onChange={e=>setDept(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الإجازة</label><input type="date" value={leaveDate} onChange={e=>setLeaveDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/>{leaveDate&&<p className="text-[10px] text-blue-600 mt-0.5">{fmtIraqi(leaveDate)}</p>}</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">وقت المغادرة</label>
          <input type="time" value={departureTime} onChange={e=>setDepartureTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">وقت العودة</label>
          <input type="time" value={returnTime} onChange={e=>setReturnTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">عدد الساعات</label>
          <input value={hours} onChange={e=>setHours(e.target.value)} placeholder="محسوب تلقائياً" className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/>
        </div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">السبب / الغرض</label><textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="مثال: مراجعة طبية، أمور شخصية..."/></div>
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع الموظف (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم توقيعك ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
      </div>
      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        {!isRegularEmp && <button onClick={saveDraft} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ مسودة</button>}
        <button onClick={saveAndSubmit} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm"><Send size={14}/> حفظ وتقديم</button>
        {gDrive.isReady && (
          <button onClick={uploadToDrive} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "رفع إلى Drive"}
          </button>
        )}
        <button onClick={exportToExcel} disabled={xlExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"><Download size={14}/> {xlExporting ? "جاري التصدير..." : "تصدير إكسل"}</button>
        {!isRegularEmp && <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>}
      </div>
    </div>
  );
}

export default TimeLeaveForm;
