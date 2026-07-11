import React, { useState, useEffect } from "react";
import { Save, CheckCircle, FileText, Printer, Download, Upload, Globe, Send } from "lucide-react";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { ACCOUNTS } from "../constants";
import { useToast } from "../contexts";
import { sendBackgroundPush } from "../components/Shared";
import { useGDrive } from "../gdrive";
import SignaturePad from "./LeaveSignaturePad";
import { buildOocDocx } from "./oocDocxBuilder";

function OutOfCountryLeaveForm({ emp }) {
  const now = new Date();
  const toast = useToast();
  const gDrive = useGDrive();
  const isRegularEmp = !["admin","inventory_manager","attendance_admin"].includes(emp.role) && emp.username !== "i.shawi";
  const STORAGE_KEY = `ooc_leave_${emp.id}`;

  const [name, setName] = useState(emp.name);
  const [jobNum, setJobNum] = useState(emp.jobNum || "");
  const [jobTitle, setJobTitle] = useState(emp.title || "");
  const [dept, setDept] = useState(emp.dept || "");
  const [country, setCountry] = useState("");
  const [days, setDays] = useState("");
  const [salaryType, setSalaryType] = useState("براتب");
  const [purpose, setPurpose] = useState("");
  const [reqDate, setReqDate] = useState(now.toISOString().split("T")[0]);
  const [refNum, setRefNum] = useState("");
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const [empSigDataUrl, setEmpSigDataUrl] = useState(null);
  const [status, setStatus] = useState("draft");
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);
  const [templateId, setTemplateId] = useState(() => storage.get("template_id_ooc", ""));

  useEffect(() => {
    const saved = storage.get(STORAGE_KEY, null);
    if (saved) {
      setName(saved.name || emp.name);
      setJobNum(saved.jobNum || emp.jobNum || "");
      setJobTitle(saved.jobTitle || emp.title || "");
      setDept(saved.dept || emp.dept || "");
      setCountry(saved.country || "");
      setDays(saved.days || "");
      setSalaryType(saved.salaryType || "براتب");
      setPurpose(saved.purpose || "");
      setReqDate(saved.reqDate || now.toISOString().split("T")[0]);
      setRefNum(saved.refNum || "");
      setSigDataUrl(saved.sigDataUrl || null);
      setEmpSigDataUrl(saved.empSigDataUrl || null);
      setStatus(saved.status || "draft");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, country, days, salaryType, purpose, reqDate, refNum, sigDataUrl, empSigDataUrl, status: "draft" });
    toast("تم حفظ المسودة", "success");
  };
  const saveAndSubmit = () => {
    if (status === "submitted") {
      const today = new Date().toISOString().split("T")[0];
      const saved = storage.get(STORAGE_KEY, {});
      if (saved.submittedDate === today && saved.reqDate === reqDate) { toast("تم تقديم هذا الطلب مسبقاً — يرجى الانتظار حتى تتم مراجعته", "warning"); return; }
    }
    if (!empSigDataUrl) { toast("توقيع الموظف إلزامي للتقديم", "warning"); return; }
    const today = new Date().toISOString().split("T")[0];
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, country, days, salaryType, purpose, reqDate, refNum, sigDataUrl, empSigDataUrl, status: "submitted", submittedDate: today });
    setStatus("submitted");
    const daysNum = days ? Number(days) : 1;
    const newReq = { id: Date.now(), type: "خارج العراق", dateFrom: reqDate, dateTo: reqDate, purpose: `${country || ""} — ${purpose || ""}`.trim(), days: daysNum, status: "بانتظار المراجعة", submittedAt: new Date().toISOString(), empId: emp.id, empName: name, empSigDataUrl };
    const allReqs = [newReq, ...storage.get("all_requests", [])];
    storage.set("all_requests", allReqs);
    FirebaseAPI.saveRequests(allReqs);
    storage.set(`requests_${emp.id}`, [newReq, ...storage.get(`requests_${emp.id}`, [])]);
    ACCOUNTS.filter(a => a.role === "admin" || a.username === "i.shawi").forEach(admin => {
      const key = `notifications_${admin.id}`;
      const notifs = [{ id: Date.now() + admin.id, type: "طلب_إجازة", title: `📋 طلب إجازة خارج العراق — ${name}`, body: `${country || ""} — ${daysNum} يوم`, timestamp: new Date().toISOString(), read: false, reqId: newReq.id }, ...storage.get(key, [])];
      storage.set(key, notifs); FirebaseAPI.saveNotifications(admin.id, notifs); sendBackgroundPush(admin.id, notifs[0].title, notifs[0].body, notifs[0].type);
    });
    toast("تم تقديم الطلب بنجاح", "success");
  };

  const fmtDate = (d) => {
    if (!d) return "____/____/____";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
  };

  const BOC_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="60" height="60">
    <rect width="120" height="120" fill="white"/>
    <path d="M 17.8,31.3 A 54,54 0 0,1 113.8,55.3 L 93.9,57 A 34,34 0 0,0 32.2,40.5 Z" fill="#cc1122" transform="translate(6,6)"/>
    <path d="M 113.8,55.3 A 54,54 0 0,1 113.8,64.7 L 93.9,63 A 34,34 0 0,0 93.9,57 Z" fill="white" transform="translate(6,6)"/>
    <path d="M 113.8,64.7 A 54,54 0 0,1 17.8,88.7 L 32.2,79.5 A 34,34 0 0,0 93.9,63 Z" fill="#111111" transform="translate(6,6)"/>
    <circle cx="60" cy="60" r="30" fill="white"/>
    <path d="M60,37 C72,51 80,63 80,71 Q80,90 60,90 Q40,90 40,71 C40,63 48,51 60,37Z" fill="#1e8b3a"/>
    <ellipse cx="53" cy="52" rx="4" ry="7" fill="rgba(255,255,255,0.55)" transform="rotate(-25,53,52)"/>
    <text x="60" y="22" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="8.5" font-weight="bold">شركة نفط البصرة</text>
    <text x="60" y="106" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="9.5" font-weight="bold" letter-spacing="1">B.O.C</text>
  </svg>`;

  const buildOocHtml = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:120px;max-height:50px;display:block;margin:8px auto 0;"/>`
      : "";
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>
<title>نموذج طلب اجازة خارج جمهورية العراق</title>
<style>
  @page{size:A4 portrait;margin:15mm 12mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:11pt;direction:rtl;color:#111}
  table{border-collapse:collapse}
  .hdr{width:100%;margin-bottom:10px}
  .hdr td{border:1px solid #444;padding:5px 8px;vertical-align:middle;text-align:center}
  .hdr-company{font-size:12pt;font-weight:bold;background:#f0f0f0;width:20%;text-align:center}
  .hdr-lbl{font-size:9pt;color:#555;text-align:right;padding-right:6px;background:#fafafa;width:14%}
  .hdr-val{font-size:11.5pt;font-weight:bold;width:44%}
  .hdr-info{font-size:9pt;width:22%}
  .hdr-logo{width:10%;padding:3px}
  .subject{font-size:13pt;font-weight:bold;margin:14px 0 10px;text-decoration:underline}
  .flds{width:100%;margin-bottom:14px}
  .flds td{padding:6px 10px;border-bottom:1px dotted #bbb;font-size:11pt}
  .fld-lbl{font-weight:bold;width:32%;white-space:nowrap}
  .fld-val{border-bottom:1.5px solid #333}
  .req{font-size:11.5pt;line-height:2.6;border:1.5px solid #333;padding:10px 14px;margin-bottom:12px;background:#fefefe}
  .blank{display:inline-block;border-bottom:1.5px solid #333;min-width:70px;text-align:center;padding:0 4px;font-weight:bold}
  .blank-lg{min-width:130px}
  .salut{font-size:11pt;text-align:right;margin-bottom:16px}
  .sig4{display:flex;gap:8px;margin:14px 0 8px}
  .sbox{flex:1;border:1.5px solid #333;text-align:center;padding:5px 3px;min-height:80px}
  .stitle{font-weight:bold;font-size:10pt;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:6px}
  .note{font-size:9.5pt;border:1px dotted #888;padding:7px 12px;margin-top:8px;line-height:1.8;color:#333}
  .sep{border-top:2px dashed #444;margin:22px 0 16px}
  .fwd-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
  .fwd-meta{font-size:11pt;line-height:2.2}
  .fwd-meta span{font-weight:bold;border-bottom:1.5px solid #333;min-width:60px;display:inline-block;padding:0 4px}
  .fwd-refs{font-size:11pt;line-height:2.2;text-align:left;direction:ltr}
  .fwd-refs span{border-bottom:1.5px solid #333;min-width:80px;display:inline-block;text-align:center}
  .fwd-subj{font-size:12pt;font-weight:bold;text-decoration:underline;margin:10px 0 12px}
  .fwd-body{font-size:11pt;line-height:2.4;margin-bottom:10px}
  .fwd-sigrow{display:flex;justify-content:flex-start;margin-top:20px}
  .fwd-sigbox{border:1.5px solid #333;text-align:center;padding:6px 24px;min-height:70px;min-width:220px}
</style></head>
<body>
<table class="hdr">
  <tr>
    <td rowspan="2" class="hdr-company">شركة نفط البصرة<br/>(شركة عامة)</td>
    <td class="hdr-lbl">عنوان النموذج</td>
    <td colspan="2" class="hdr-val">نموذج طلب اجازة خارج جمهورية العراق</td>
    <td rowspan="2" class="hdr-logo">${BOC_LOGO}</td>
  </tr>
  <tr>
    <td class="hdr-lbl">رمز النموذج</td>
    <td class="hdr-info" style="font-weight:bold">BOC-P-HR/F05</td>
    <td class="hdr-info">رقم الإصدار: 1 &nbsp;|&nbsp; تاريخ الإصدار: 2023/4/10</td>
  </tr>
</table>
<div class="subject">م/ إجازة اعتيادية خارج جمهورية العراق</div>
<table class="flds">
  <tr><td class="fld-lbl">الاسم الثلاثي :</td><td class="fld-val">${name}</td></tr>
  <tr><td class="fld-lbl">الرقم الوظيفي :</td><td class="fld-val">${jobNum}</td></tr>
  <tr><td class="fld-lbl">العنوان الوظيفي :</td><td class="fld-val">${jobTitle}</td></tr>
  <tr><td class="fld-lbl">تاريخ تقديم الطلب :</td><td class="fld-val">${fmtDate(reqDate)}</td></tr>
</table>
<div class="req">
  ارجو التفضل بالموافقة على منحي اجازة اعتيادية خارج جمهورية العراق
  ( <span class="blank blank-lg">&nbsp;${country || "_______________"}&nbsp;</span> )
  ولمدة ( <span class="blank">&nbsp;${days || "____"}&nbsp;</span> يوما )
  ( <span class="blank">&nbsp;${salaryType}&nbsp;</span> لغرض )
  ( <span class="blank blank-lg">&nbsp;${purpose || "___________________________"}&nbsp;</span> )
  وابتدآ من تاريخ الانفكاك .
</div>
<div class="salut">مع التقدير ...</div>
<div class="sig4">
  <div class="sbox"><div class="stitle">مسؤول الشعبة</div>${sigHtml}</div>
  <div class="sbox"><div class="stitle">مدير القسم</div></div>
  <div class="sbox"><div class="stitle">مدير هيأة الصيانة الهندسية</div></div>
  <div class="sbox"><div class="stitle">المعاون المختص</div></div>
</div>
<div class="note"><strong>ملاحظة :</strong> يرسل الطلب الى الهيئة الادارية في حال طلب الاجازة ( براتب تام) لاكثر من 3 اشهر ولغاية 4 اشهر وفي حال طلب الاجازة ( بدون راتب )</div>
<div class="sep"></div>
<div class="fwd-top">
  <div class="fwd-meta">
    <div>من / <span>${dept || "قسم السيطرة والنظم"}</span></div>
    <div>الى / السيد مدير هيأة الصيانة الهندسية</div>
  </div>
  <div class="fwd-refs" dir="rtl">
    <div>العـــدد : <span>${refNum || "________"}</span></div>
    <div>التاريخ : <span>${fmtDate(reqDate)}</span></div>
  </div>
</div>
<div class="fwd-subj">م/ طلب اجازة اعتيادية خارج جمهورية العراق</div>
<div class="fwd-body">نرفق لكم اعلاه طلب السيد <span style="border-bottom:1.5px solid #333;padding:0 6px;font-weight:bold">&nbsp;${name}&nbsp;</span> للتفضل بالموافقة على منحه الاجازة المطلوبة وحسب صلاحيتكم</div>
<div class="salut">مع التقدير...</div>
<div class="fwd-sigrow">
  <div class="fwd-sigbox">
    <div class="stitle">توقيع مدير الهيئة الادارية</div>
    <div style="margin-top:8px;font-size:10pt">التوقيع : ________________</div>
  </div>
</div>
</body></html>`;
  };

  const printForm = () => {
    const html = buildOocHtml();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const uploadAsWord = async () => {
    if (!gDrive.isReady) { toast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const blob = await buildOocDocx({ name, jobNum, jobTitle, dept, country, days, salaryType, purpose, reqDate, refNum, fmtDate });
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File(
        [blob],
        `اجازة-خارج-العراق-${safeName}-${reqDate || "بدون-تاريخ"}.docx`,
        { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
      );
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast("تم حفظ الاستمارة كملف Word في Drive", "success");
    } catch (e) {
      console.error("docx build error:", e);
      toast("فشل إنشاء ملف Word: " + e.message, "error");
    } finally {
      setUploadPct(-1);
    }
  };

  const fillFromTemplate = async () => {
    if (!gDrive.isReady) { toast("يرجى ربط Google Drive أولاً", "warning"); return; }
    if (!templateId.trim()) { toast("يرجى إدخال معرف ملف القالب", "warning"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const { default: JSZip } = await import("jszip");
      let arrayBuffer;
      try {
        arrayBuffer = await gDrive.downloadFile(templateId.trim());
      } catch (dlErr) {
        throw new Error("فشل تنزيل القالب من Drive: " + dlErr.message);
      }
      if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error("الملف المُنزَّل فارغ — تحقق من File ID");
      const zip = await JSZip.loadAsync(arrayBuffer);
      const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const replacements = {
        "{{الاسم}}":           esc(name),
        "{{الرقم_الوظيفي}}":  esc(jobNum),
        "{{العنوان_الوظيفي}}": esc(jobTitle),
        "{{القسم}}":           esc(dept),
        "{{البلد}}":           esc(country),
        "{{الأيام}}":          esc(days),
        "{{الراتب}}":          esc(salaryType),
        "{{الغرض}}":           esc(purpose),
        "{{التاريخ}}":         esc(fmtDate(reqDate)),
        "{{العدد}}":           esc(refNum),
      };
      const mergeRuns = (xmlContent) =>
        xmlContent.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (para) =>
          para.replace(/<\/w:t><\/w:r>(\s*<w:r[^>]*>)(\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>/g, "")
        );
      let replacedCount = 0;
      for (const path of Object.keys(zip.files).filter(f => f.startsWith("word/") && f.endsWith(".xml"))) {
        let content = await zip.file(path).async("string");
        content = mergeRuns(content);
        for (const [ph, val] of Object.entries(replacements)) {
          const before = content;
          content = content.split(ph).join(val);
          if (content !== before) replacedCount++;
        }
        zip.file(path, content);
      }
      if (replacedCount === 0) {
        const phList = Object.keys(replacements).join("  ");
        throw new Error(`لم يُعثر على أي حقل قابل للاستبدال في القالب.\n\nتأكد أن ملف القالب يحتوي على أحد هذه النصوص:\n${phList}`);
      }
      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File([blob], `اجازة-خارج-العراق-${safeName}-${reqDate || "بدون-تاريخ"}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result?.webViewLink || null);
      toast(`تم تعبئة ${replacedCount} حقل ورفع النسخة المعبأة إلى Drive ✅`, "success");
    } catch (e) {
      console.error("fillFromTemplate error:", e);
      alert("خطأ في تعبئة القالب:\n\n" + e.message);
      toast("فشل تعبئة القالب", "error");
    } finally {
      setUploadPct(-1);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center"><Globe size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة خارج جمهورية العراق</h2><p className="text-xs text-secondary">BOC-P-HR/F05 — ملف Word في Drive + طباعة A4</p></div>
      </div>

      <div><label className="block text-xs font-bold text-secondary mb-1">الاسم الثلاثي</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">العنوان الوظيفي</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">القسم (للكتاب المرفق)</label><input value={dept} onChange={e=>setDept(e.target.value)} placeholder="مثال: قسم السيطرة والنظم" className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ تقديم الطلب</label><input type="date" value={reqDate} onChange={e=>setReqDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">البلد / الجمهورية المقصودة</label><input value={country} onChange={e=>setCountry(e.target.value)} placeholder="مثال: جمهورية الهند" className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">مدة الإجازة (يوم)</label><input type="number" min="1" value={days} onChange={e=>setDays(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">نوع الراتب</label>
          <select value={salaryType} onChange={e=>setSalaryType(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm">
            <option value="براتب">براتب</option>
            <option value="بدون راتب">بدون راتب</option>
          </select>
        </div>
        <div><label className="block text-xs font-bold text-secondary mb-1">رقم العدد (للكتاب المرفق)</label><input value={refNum} onChange={e=>setRefNum(e.target.value)} placeholder="مثال: 1234" className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">الغرض من الإجازة</label><input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="مثال: مرافقة علاج مريض" className="input w-full rounded-lg px-3 py-2 text-sm"/></div>

      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع الموظف <span className="text-violet-600 font-medium">* إلزامي للتقديم</span></label>
        <SignaturePad onSave={setEmpSigDataUrl} label="ارسم توقيعك ثم اضغط حفظ التوقيع"/>
        {empSigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={empSigDataUrl} alt="توقيع الموظف" className="max-h-14"/></div>}
      </div>

      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع مسؤول الشعبة (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم التوقيع ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع المسؤول" className="max-h-14"/></div>}
      </div>

      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800 leading-relaxed">
        <strong>ملاحظة:</strong> يرسل الطلب الى الهيئة الادارية في حال طلب الاجازة (براتب تام) لأكثر من 3 اشهر ولغاية 4 اشهر وفي حال طلب الاجازة (بدون راتب)
      </div>

      {gDrive.isReady && (
        <div className="p-4 rounded-xl border border-violet-200 bg-violet-50 space-y-3">
          <p className="text-xs font-bold text-violet-800">تعبئة قالب Word موجود في Drive</p>
          <div className="flex gap-2">
            <input
              value={templateId}
              onChange={e => { setTemplateId(e.target.value); storage.set("template_id_ooc", e.target.value); }}
              placeholder="معرّف ملف القالب في Drive (File ID)"
              className="input flex-1 rounded-lg px-3 py-2 text-sm font-mono"
              dir="ltr"
            />
            <button
              onClick={fillFromTemplate}
              disabled={uploadPct >= 0 || !templateId.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 whitespace-nowrap"
            >
              <FileText size={14}/> {uploadPct >= 0 ? `${uploadPct}%` : "تعبئة القالب"}
            </button>
          </div>
          <p className="text-[11px] text-violet-600">
            ستجد معرّف الملف في رابط Drive: .../file/d/<strong>FILE_ID</strong>/view
            — ضع في القالب العناصر النصية: {"{{الاسم}}"} {"{{البلد}}"} {"{{الأيام}}"} {"{{الراتب}}"} {"{{الغرض}}"} {"{{التاريخ}}"} {"{{العدد}}"} إلخ.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        {!isRegularEmp && <button onClick={saveDraft} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ مسودة</button>}
        <button onClick={saveAndSubmit} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm"><Send size={14}/> حفظ وتقديم</button>
        {gDrive.isReady && (
          <button onClick={uploadAsWord} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "Word في Drive"}
          </button>
        )}
        <a href="/templates/leave-ooc.xlsx" download className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-200"><Download size={14}/> تنزيل النموذج</a>
        {!isRegularEmp && <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>}
      </div>
    </div>
  );
}

export default OutOfCountryLeaveForm;
