import React, { useState, useEffect } from "react";
import { Save, CheckCircle, FileText, Printer, Upload, Send } from "lucide-react";
import { storage, fmtIraqi, todayISO } from "../utils";
import { FirebaseAPI } from "../firebase";
import { ACCOUNTS } from "../constants";
import { useToast } from "../contexts";
import { sendBackgroundPush } from "../components/Shared";
import { useGDrive } from "../gdrive";
import SignaturePad from "./LeaveSignaturePad";

function FingerprintExemptionForm({ emp }) {
  const toast = useToast();
  const gDrive = useGDrive();
  const isRegularEmp = !["admin","inventory_manager","attendance_admin"].includes(emp.role) && emp.username !== "i.shawi";
  const STORAGE_KEY = `fp_exempt_${emp.id}`;
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);

  const [name,          setName]          = useState(emp.name);
  const [jobNum,        setJobNum]        = useState(emp.jobNum || "");
  const [jobTitle,      setJobTitle]      = useState(emp.title || "");
  const [exemptDate,    setExemptDate]    = useState(todayISO());
  const [location,      setLocation]      = useState("مستودع الفاو");
  const [reason,        setReason]        = useState("");
  const [empSigDataUrl, setEmpSigDataUrl] = useState(null);
  const [status,        setStatus]        = useState("draft");

  useEffect(() => {
    const s = storage.get(STORAGE_KEY, null);
    if (s) {
      setName(s.name || emp.name);
      setJobNum(s.jobNum || emp.jobNum || "");
      setJobTitle(s.jobTitle || emp.title || "");
      setExemptDate(s.exemptDate || todayISO());
      setLocation(s.location || "مستودع الفاو");
      setReason(s.reason || "");
      setEmpSigDataUrl(s.empSigDataUrl || null);
      setStatus(s.status || "draft");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, exemptDate, location, reason, empSigDataUrl, status: "draft" });
    toast("تم حفظ المسودة", "success");
  };

  const saveAndSubmit = async () => {
    if (status === "submitted") {
      const saved = storage.get(STORAGE_KEY, {});
      if (saved.exemptDate === exemptDate) { toast("تم تقديم هذا الطلب مسبقاً — يرجى الانتظار حتى تتم مراجعته", "warning"); return; }
    }
    if (!empSigDataUrl) { toast("توقيع مقدم الطلب إلزامي للتقديم", "warning"); return; }
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, exemptDate, location, reason, empSigDataUrl, status: "submitted", submittedDate: todayISO() });
    setStatus("submitted");
    const newReq = {
      id: Date.now(),
      type: "إعفاء بصمة",
      dateFrom: exemptDate,
      dateTo: exemptDate,
      purpose: reason || `إعفاء من البصمة في ${location}`,
      days: 1,
      status: "بانتظار المراجعة",
      submittedAt: new Date().toISOString(),
      empId: emp.id,
      empName: name,
      empSigDataUrl,
      location,
    };
    const prevAll = await FirebaseAPI.loadRequests() || storage.get("all_requests", []);
    const allReqs = [newReq, ...prevAll.filter(r => r && r.id !== newReq.id)];
    storage.set("all_requests", allReqs);
    const saved = await FirebaseAPI.saveRequests(allReqs);
    if (!saved) { toast("⚠️ تعذّر حفظ الطلب على الخادم — تحقق من الاتصال وأعد المحاولة", "error"); return; }
    storage.set(`requests_${emp.id}`, [newReq, ...storage.get(`requests_${emp.id}`, [])]);
    ACCOUNTS.filter(a => a.role === "admin" || a.username === "i.shawi").forEach(admin => {
      const key = `notifications_${admin.id}`;
      const notifs = [{
        id: Date.now() + admin.id,
        type: "طلب_إجازة",
        title: `📋 طلب إعفاء بصمة — ${name}`,
        body: `إعفاء بتاريخ ${exemptDate} | ${reason || location}`,
        timestamp: new Date().toISOString(),
        read: false,
        reqId: newReq.id,
      }, ...storage.get(key, [])];
      storage.set(key, notifs);
      FirebaseAPI.saveNotifications(admin.id, notifs);
      sendBackgroundPush(admin.id, notifs[0].title, notifs[0].body, notifs[0].type);
    });
    toast("تم تقديم طلب الإعفاء بنجاح", "success");
  };

  const fmtDate = (d) => {
    if (!d) return "___/___/______";
    const dt = new Date(d + "T00:00:00");
    return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
  };

  const buildHtml = () => {
    const sigHtml = empSigDataUrl
      ? `<img src="${empSigDataUrl}" style="max-width:130px;max-height:55px;display:block;margin:auto;"/>`
      : `<div style="min-height:44px"></div>`;
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>طلب إعفاء من البصمة</title>
<style>
  @page{size:A5 landscape;margin:7mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:10pt;direction:rtl}
  .doc-header{width:100%;border-collapse:collapse;font-size:8.5pt}
  .doc-header td{border:1px solid #555;padding:3px 6px;text-align:center;vertical-align:middle}
  .dh-company{font-size:9pt;font-weight:bold;background:#f0f0f0;width:16%}
  .dh-label{font-size:7.5pt;color:#444;text-align:right;padding-right:5px;background:#fafafa;width:13%}
  .dh-main{font-size:10.5pt;font-weight:bold;width:42%}
  .dh-code{font-size:8pt;font-weight:bold;width:29%}
  .main-box{border:2px solid #222;padding:10px 14px;margin-top:8px}
  .top-title{font-size:11.5pt;font-weight:bold;text-align:center;border-bottom:1px solid #ccc;padding-bottom:6px;margin-bottom:10px}
  .field-row{display:flex;align-items:baseline;gap:8px;margin-bottom:7px;flex-wrap:wrap}
  .lbl{font-weight:bold;white-space:nowrap;font-size:9.5pt}
  .val{min-width:50px;flex:1;font-size:9.5pt;border-bottom:1px dotted #888}
  .sentence{font-size:10pt;margin:10px 0;line-height:2.6;border:1px solid #ccc;padding:8px 10px;background:#fafafa}
  .blank{display:inline-block;min-width:50px;text-align:center;font-weight:bold;padding:0 3px;border-bottom:1.5px solid #333}
  .blank-lg{min-width:140px}
  .sig-row{display:flex;gap:12px;margin-top:12px}
  .sig-box{border:1px solid #333;text-align:center;padding:6px;min-height:65px;flex:1}
  .sig-title{font-weight:bold;font-size:8.5pt;margin-bottom:4px}
  .disclaimer{font-size:6.5pt;text-align:center;margin-top:6px;color:#555;border-top:1px dotted #aaa;padding-top:3px}
</style></head>
<body>
<table class="doc-header">
  <tr>
    <td rowspan="2" class="dh-company">شركة نفط البصرة<br/>(شركة عامة)</td>
    <td class="dh-label">عنوان النموذج</td>
    <td class="dh-main">طلب إعفاء من أداء البصمة الإلكترونية</td>
    <td class="dh-code">BOC-ATT-EX — ليوم واحد</td>
  </tr>
  <tr>
    <td class="dh-label">القسم / الشعبة</td>
    <td colspan="2" style="text-align:center;font-size:9pt">${emp.dept || ""}</td>
  </tr>
</table>
<div class="main-box">
  <div class="top-title">م/ طلب إعفاء من أداء البصمة الإلكترونية</div>
  <div class="field-row">
    <span class="lbl">الاسم الثلاثي :</span><span class="val">${name}</span>
  </div>
  <div class="field-row">
    <span class="lbl">الرقم الوظيفي :</span><span class="val">${jobNum}</span>
    <span class="lbl" style="margin-right:16px">العنوان الوظيفي :</span><span class="val">${jobTitle}</span>
  </div>
  <div class="sentence">
    أرجو التفضل بإعفائي من أداء البصمة الإلكترونية في موقع
    <span class="blank">&nbsp;${location || "___________"}&nbsp;</span>
    بتاريخ
    <span class="blank">&nbsp;${fmtDate(exemptDate)}&nbsp;</span>
    وذلك لـ
    <span class="blank blank-lg">&nbsp;${reason || "___________________________________"}&nbsp;</span>
    <br/>مع التقدير
  </div>
  <div class="sig-row">
    <div class="sig-box"><div class="sig-title">توقيع مقدم الطلب</div>${sigHtml}</div>
    <div class="sig-box"><div class="sig-title">موافقة مسؤول الشعبة</div><div style="min-height:44px"></div></div>
  </div>
</div>
<div class="disclaimer">يعتبر هذا النموذج ملك لشركة نفط البصرة فقط، لا يجوز نسخه أو الكشف عن محتواه بدون موافقة خطية مسبقة من قبل شركة نفط البصرة.</div>
</body></html>`;
  };

  const printForm = () => {
    const html = buildHtml();
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
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File([new Blob([buildHtml()], { type: "text/html" })], `اعفاء-بصمة-${safeName}-${exemptDate}.html`, { type: "text/html" });
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast("تم رفع نموذج الإعفاء إلى Drive", "success");
    } catch (e) {
      toast("فشل رفع الملف: " + e.message, "error");
    } finally {
      setUploadPct(-1);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white"/></div>
        <div>
          <h2 className="text-xl font-bold text-primary">طلب إعفاء من البصمة الإلكترونية</h2>
          <p className="text-xs text-secondary">ليوم واحد — يُقدَّم لمسؤول الشعبة</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">الاسم الثلاثي</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">العنوان الوظيفي</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>

      <div className="p-3 rounded-xl border border-orange-200 bg-orange-50 space-y-3">
        <p className="text-xs font-bold text-orange-700">بيانات الإعفاء</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">تاريخ الإعفاء</label>
            <input type="date" value={exemptDate} onChange={e=>setExemptDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/>
            {exemptDate && <p className="text-[10px] text-orange-700 mt-0.5">{fmtIraqi(exemptDate)}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary mb-1">الموقع</label>
            <input value={location} onChange={e=>setLocation(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">سبب الإعفاء</label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} placeholder="مثال: مراجعة باب الزبير لمتابعة استمارة تغيير العنوان الوظيفي" className="input w-full rounded-lg px-3 py-2 text-sm resize-none"/>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm leading-relaxed text-primary">
        أرجو التفضل بإعفائي من أداء البصمة الإلكترونية في موقع{" "}
        <span className="font-bold text-orange-700">{location || "___"}</span>{" "}
        بتاريخ{" "}
        <span className="font-bold text-orange-700">{exemptDate ? fmtDate(exemptDate) : "___"}</span>{" "}
        وذلك لـ{" "}
        <span className="font-bold text-orange-700">{reason || "___"}</span>
        <br/><span className="text-secondary">مع التقدير</span>
      </div>

      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع مقدم الطلب <span className="text-orange-600 font-medium">* إلزامي للتقديم</span></label>
        <SignaturePad onSave={setEmpSigDataUrl} label="ارسم توقيعك ثم اضغط حفظ التوقيع"/>
        {empSigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={empSigDataUrl} alt="توقيع" className="max-h-14"/></div>}
      </div>

      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        {!isRegularEmp && <button onClick={saveDraft} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ مسودة</button>}
        <button onClick={saveAndSubmit} className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700"><Send size={14}/> حفظ وتقديم</button>
        {gDrive.isReady && (
          <button onClick={uploadToDrive} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "رفع إلى Drive"}
          </button>
        )}
        {!isRegularEmp && <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600"><Printer size={14}/> طباعة الاستمارة</button>}
      </div>
    </div>
  );
}

export default FingerprintExemptionForm;
