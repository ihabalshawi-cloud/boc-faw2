import React, { useState, useEffect } from "react";
import { Save, CheckCircle, FileText, Printer, Download, Upload, Send } from "lucide-react";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { ACCOUNTS } from "../constants";
import { useToast } from "../contexts";
import { useGDrive } from "../gdrive";
import SignaturePad from "./LeaveSignaturePad";

function AnnualLeaveForm({ emp }) {
  const now = new Date();
  const toast = useToast();
  const gDrive = useGDrive();
  const STORAGE_KEY = `annual_leave_${emp.id}`;
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);
  const [xlExporting, setXlExporting] = useState(false);

  const [name, setName] = useState(emp.name);
  const [jobNum, setJobNum] = useState(emp.jobNum || "");
  const [jobTitle, setJobTitle] = useState(emp.title || "");
  const [dept, setDept] = useState(emp.dept || "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [days, setDays] = useState("");
  const [purpose, setPurpose] = useState("");
  const [reqDate, setReqDate] = useState(now.toISOString().split("T")[0]);
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    const saved = storage.get(STORAGE_KEY, null);
    if (saved) {
      setName(saved.name || emp.name);
      setJobNum(saved.jobNum || emp.jobNum || "");
      setJobTitle(saved.jobTitle || emp.title || "");
      setDept(saved.dept || emp.dept || "");
      setFromDate(saved.fromDate || "");
      setToDate(saved.toDate || "");
      setDays(saved.days || "");
      setPurpose(saved.purpose || "");
      setReqDate(saved.reqDate || now.toISOString().split("T")[0]);
      setSigDataUrl(saved.sigDataUrl || null);
      setStatus(saved.status || "draft");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      const diff = Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1;
      if (diff > 0) setDays(String(diff));
    }
  }, [fromDate, toDate]);

  const saveDraft = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, fromDate, toDate, days, purpose, reqDate, sigDataUrl, status: "draft" });
    toast("تم حفظ المسودة", "success");
  };
  const saveAndSubmit = () => {
    if (!sigDataUrl) { toast("توقيع طالب الإجازة إلزامي للتقديم", "warning"); return; }
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, fromDate, toDate, days, purpose, reqDate, sigDataUrl, status: "submitted" });
    const daysNum = days ? Number(days) : 1;
    const newReq = { id: Date.now(), type: "اعتيادية", dateFrom: fromDate, dateTo: toDate, purpose, days: daysNum, status: "بانتظار المراجعة", submittedAt: new Date().toISOString(), empId: emp.id, empName: name, empSigDataUrl: sigDataUrl };
    const allReqs = [newReq, ...storage.get("all_requests", [])];
    storage.set("all_requests", allReqs);
    FirebaseAPI.saveRequests(allReqs);
    storage.set(`requests_${emp.id}`, [newReq, ...storage.get(`requests_${emp.id}`, [])]);
    ACCOUNTS.filter(a => a.role === "admin" || a.username === "i.shawi").forEach(admin => {
      const key = `notifications_${admin.id}`;
      const notifs = [{ id: Date.now() + admin.id, type: "طلب_إجازة", title: `📋 طلب إجازة اعتيادية — ${name}`, body: `اعتيادية — ${daysNum} يوم | ${purpose}`, timestamp: new Date().toISOString(), read: false, reqId: newReq.id }, ...storage.get(key, [])];
      storage.set(key, notifs); FirebaseAPI.saveNotifications(admin.id, notifs);
    });
    toast("تم تقديم الإجازة الاعتيادية بنجاح", "success");
  };

  const fmtDateParts = (d) => {
    if (!d) return { y:"______", m:"______", day:"____" };
    const dt = new Date(d);
    return { y: dt.getFullYear(), m: String(dt.getMonth()+1).padStart(2,"0"), day: String(dt.getDate()).padStart(2,"0") };
  };

  const buildAnnualHtml = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:130px;max-height:55px;display:block;margin:auto;"/>`
      : `<div style="min-height:44px"></div>`;
    const rp = fmtDateParts(reqDate);
    const fp = fmtDateParts(fromDate);
    const sentenceDays = days || "______";
    const sentencePurpose = purpose || "_________________________________";
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>إجازة اعتيادية</title>
<style>
  @page{size:A5 landscape;margin:7mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;direction:rtl}
  .doc-header{width:100%;border-collapse:collapse;font-size:8pt}
  .doc-header td{border:1px solid #555;padding:3px 6px;text-align:center;vertical-align:middle}
  .dh-company{font-size:9.5pt;font-weight:bold;background:#f0f0f0;width:16%}
  .dh-label{font-size:7.5pt;color:#444;text-align:right;padding-right:5px;background:#fafafa;width:13%}
  .dh-main{font-size:10pt;font-weight:bold;width:40%}
  .dh-code{font-size:8pt;font-weight:bold;width:18%}
  .dh-info-cell{width:11%}
  .dh-logo{width:10%;padding:2px}
  .ref-num{text-align:left;direction:ltr;font-size:7.5pt;margin:1px 0 5px;padding-left:4px}
  .main-box{border:2px solid #222;padding:7px 10px}
  .top-date{font-size:8.5pt;text-align:left;direction:ltr;margin-bottom:4px}
  .top-title{font-size:11pt;font-weight:bold;text-align:center;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:6px}
  .field-row{display:flex;align-items:baseline;gap:8px;margin-bottom:5px;flex-wrap:wrap}
  .lbl{font-weight:bold;white-space:nowrap;font-size:9pt}
  .val{min-width:50px;flex:1;font-size:9pt}
  .sentence{font-size:9.5pt;margin:7px 0;line-height:2.3;border:1px solid #ccc;padding:5px 8px;background:#fafafa}
  .blank{display:inline-block;min-width:36px;text-align:center;font-weight:bold;padding:0 2px}
  .blank-lg{min-width:110px}
  .sig-row{display:flex;gap:10px;margin-top:8px}
  .sig-box{border:1px solid #333;text-align:center;padding:5px 4px;min-height:60px;flex:1}
  .sig-title{font-weight:bold;font-size:8.5pt;margin-bottom:4px}
  .disclaimer{font-size:6.5pt;text-align:center;margin-top:5px;color:#555;border-top:1px dotted #aaa;padding-top:3px}
</style></head>
<body>
<table class="doc-header">
  <tr>
    <td rowspan="2" class="dh-company">شركة نفط البصرة<br/>(شركة عامة)</td>
    <td class="dh-label">عنوان النموذج</td>
    <td colspan="3" class="dh-main">نموذج إجازة اعتيادية</td>
    <td rowspan="2" class="dh-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="52" height="52">
        <rect width="120" height="120" fill="white"/>
        <path d="M 17.8,31.3 A 54,54 0 0,1 113.8,55.3 L 93.9,57 A 34,34 0 0,0 32.2,40.5 Z" fill="#cc1122" transform="translate(6,6)"/>
        <path d="M 113.8,55.3 A 54,54 0 0,1 113.8,64.7 L 93.9,63 A 34,34 0 0,0 93.9,57 Z" fill="white" transform="translate(6,6)"/>
        <path d="M 113.8,64.7 A 54,54 0 0,1 17.8,88.7 L 32.2,79.5 A 34,34 0 0,0 93.9,63 Z" fill="#111111" transform="translate(6,6)"/>
        <circle cx="60" cy="60" r="30" fill="white"/>
        <path d="M60,37 C72,51 80,63 80,71 Q80,90 60,90 Q40,90 40,71 C40,63 48,51 60,37Z" fill="#1e8b3a"/>
        <ellipse cx="53" cy="52" rx="4" ry="7" fill="rgba(255,255,255,0.55)" transform="rotate(-25,53,52)"/>
        <text x="60" y="22" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="8.5" font-weight="bold">شركة نفط البصرة</text>
        <text x="60" y="106" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="9.5" font-weight="bold" letter-spacing="1">B.O.C</text>
      </svg>
    </td>
  </tr>
  <tr>
    <td class="dh-label">رمز النموذج</td>
    <td class="dh-code">BOC-P-13/F03</td>
    <td class="dh-info-cell">رقم الإصدار: 2</td>
    <td class="dh-info-cell">تاريخ الإصدار: 2022/6/1</td>
  </tr>
</table>
<div class="ref-num">372.3000.450</div>
<div class="main-box">
  <div class="top-date">التاريخ: &nbsp;${rp.day}&nbsp; / &nbsp;${rp.m}&nbsp; / &nbsp;${rp.y}</div>
  <div class="top-title">م/ إجازة اعتيادية</div>
  <div class="field-row"><span class="lbl">الاسم الثلاثي:</span><span class="val">${name}</span></div>
  <div class="field-row"><span class="lbl">الرقم الوظيفي:</span><span class="val">${jobNum}</span></div>
  <div class="field-row"><span class="lbl">العنوان الوظيفي:</span><span class="val">${jobTitle}</span></div>
  <div class="sentence">
    يرجى منحي إجازة اعتيادية لمدة
    (<span class="blank">&nbsp;${sentenceDays}&nbsp;</span>)
    يوماً اعتباراً من
    (<span class="blank">&nbsp;${fp.day}&nbsp;</span> / <span class="blank">&nbsp;${fp.m}&nbsp;</span> / <span class="blank">&nbsp;${fp.y}&nbsp;</span>)
    لغرض (<span class="blank blank-lg">&nbsp;${sentencePurpose}&nbsp;</span>)
  </div>
  <div class="sig-row">
    <div class="sig-box"><div class="sig-title">توقيع طالب الإجازة</div>${sigHtml}</div>
    <div class="sig-box"><div class="sig-title">توقيع المسؤول</div></div>
  </div>
</div>
<div class="disclaimer">يعتبر هذا النموذج ملك لشركة نفط البصرة فقط، لايجوز نسخه او الكشف عن محتواه بدون موافقة خطية مسبقة من قبل شركة نفط البصرة.</div>
</body></html>`;
  };

  const printForm = () => {
    const html = buildAnnualHtml();
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
      const html = buildAnnualHtml();
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File([new Blob([html], { type: "text/html" })], `اجازة-اعتيادية-${safeName}-${reqDate || "بدون-تاريخ"}.html`, { type: "text/html" });
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast("تم رفع نموذج الإجازة الاعتيادية إلى Drive", "success");
    } catch (e) {
      toast("فشل رفع الملف: " + e.message, "error");
    } finally {
      setUploadPct(-1);
    }
  };

  const exportToExcel = async () => {
    setXlExporting(true);
    try {
      const res = await fetch("/templates/leave-annual.xlsx");
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
      set("C5",  fmtD(reqDate));
      set("I8",  name);
      set("I9",  String(jobNum || ""));
      set("I10", jobTitle);
      set("I11", fmtD(reqDate));
      set("D13", days ? String(days) : "");
      set("G13", fmtD(fromDate));
      set("I14", purpose);
      const outBuf = await wb.xlsx.writeBuffer();
      const safeName = (name || "موظف").replace(/\s+/g, "_");
      const fname = `اجازة_اعتيادية_${safeName}_${reqDate || "بدون_تاريخ"}.xlsx`;
      const blob = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      toast("تم تصدير نموذج الإجازة الاعتيادية", "success");
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
    <div className="p-6 max-w-2xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة اعتيادية</h2><p className="text-xs text-secondary">BOC-P-13/F03 — طباعة A5 landscape</p></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">الاسم الثلاثي</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">العنوان الوظيفي</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">من تاريخ</label><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">إلى تاريخ</label><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">عدد الأيام</label><input type="number" min="1" value={days} onChange={e=>setDays(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">غرض الإجازة</label><input value={purpose} onChange={e=>setPurpose(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الطلب</label><input type="date" value={reqDate} onChange={e=>setReqDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع طالب الإجازة (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم توقيعك ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
      </div>
      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        <button onClick={saveDraft} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ مسودة</button>
        <button onClick={saveAndSubmit} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm"><Send size={14}/> حفظ وتقديم</button>
        {gDrive.isReady && (
          <button onClick={uploadToDrive} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "رفع إلى Drive"}
          </button>
        )}
        <button onClick={exportToExcel} disabled={xlExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"><Download size={14}/> {xlExporting ? "جاري التصدير..." : "تصدير إكسل"}</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

export default AnnualLeaveForm;
