import React, { useState, useEffect, useRef } from "react";
import { Save, CheckCircle, FileText, Clock, Printer, Download, Upload, Globe } from "lucide-react";
import { storage } from "../utils";
import { useToast, useConfirm } from "../contexts";
import { useGDrive } from "../gdrive";

function SignaturePad({ onSave, label = "التوقيع" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };
  const stopDraw = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onSave && onSave(null);
  };
  const save = () => { onSave && onSave(canvasRef.current.toDataURL("image/png")); };

  return (
    <div className="border border-color rounded-lg p-2 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-secondary">{label}</span>
        <div className="flex gap-1">
          <button type="button" onClick={clear} className="text-xs px-2 py-0.5 rounded border border-color hover:bg-hover text-secondary">مسح</button>
          <button type="button" onClick={save} className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">حفظ التوقيع</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={90}
        className="border border-dashed border-gray-300 rounded cursor-crosshair touch-none w-full bg-gray-50"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}

// ========== نموذج الإجازة الاعتيادية ==========
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      const diff = Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1;
      if (diff > 0) setDays(String(diff));
    }
  }, [fromDate, toDate]);

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, fromDate, toDate, days, purpose, reqDate, sigDataUrl });
    toast.success("✅ تم حفظ بيانات الإجازة الاعتيادية");
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
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const html = buildAnnualHtml();
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File([new Blob([html], { type: "text/html" })], `اجازة-اعتيادية-${safeName}-${reqDate || "بدون-تاريخ"}.html`, { type: "text/html" });
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast.success("تم رفع نموذج الإجازة الاعتيادية إلى Drive");
    } catch (e) {
      toast.error("فشل رفع الملف: " + e.message);
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
      toast.success("تم تصدير نموذج الإجازة الاعتيادية");
      if (gDrive.isReady) {
        setUploadPct(0);
        const file = new File([outBuf], fname, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
        setDriveLink(result.webViewLink);
        toast.success("تم رفع النموذج إلى Drive");
      }
    } catch(e) {
      toast.error("فشل التصدير: " + e.message);
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
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, leaveDate, leaveTime, clinicDT, notes, returnDate, returnTime, sigDataUrl });
    toast.success("تم حفظ بيانات الإجازة المرضية");
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
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
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
      toast.success("تم رفع نموذج الإجازة المرضية إلى Drive");
    } catch (e) {
      toast.error("فشل رفع الملف: " + e.message);
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
      toast.success("تم تصدير نموذج الإجازة المرضية");
      if (gDrive.isReady) {
        setUploadPct(0);
        const file = new File([outBuf], fname, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
        setDriveLink(result.webViewLink);
        toast.success("تم رفع النموذج إلى Drive");
      }
    } catch(e) {
      toast.error("فشل التصدير: " + e.message);
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

      {/* توقيع المسؤول */}
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع المسؤول (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم التوقيع ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
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
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
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

// ========== نموذج إجازة خارج القطر ==========
function OutOfCountryLeaveForm({ emp }) {
  const now = new Date();
  const toast = useToast();
  const gDrive = useGDrive();
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, country, days, salaryType, purpose, reqDate, refNum, sigDataUrl });
    toast.success("تم حفظ بيانات إجازة خارج القطر");
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
  ولمدة
  ( <span class="blank">&nbsp;${days || "____"}&nbsp;</span> يوما )
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

<div class="note">
  <strong>ملاحظة :</strong>
  يرسل الطلب الى الهيئة الادارية في حال طلب الاجازة ( براتب تام) لاكثر من 3 اشهر ولغاية 4 اشهر وفي حال طلب الاجازة ( بدون راتب )
</div>

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

<div class="fwd-body">
  نرفق لكم اعلاه طلب السيد
  <span style="border-bottom:1.5px solid #333;padding:0 6px;font-weight:bold">&nbsp;${name}&nbsp;</span>
  للتفضل بالموافقة على منحه الاجازة المطلوبة وحسب صلاحيتكم
</div>

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
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        WidthType, AlignmentType, VerticalAlign, BorderStyle, ShadingType,
        UnderlineType,
      } = await import("docx");

      // ── border helpers ──
      const SB  = { style: BorderStyle.SINGLE,  size: 8,  color: "444444" };
      const DB  = { style: BorderStyle.DOTTED,  size: 4,  color: "AAAAAA" };
      const DSH = { style: BorderStyle.DASHED,  size: 8,  color: "555555" };
      const NB  = { style: BorderStyle.NONE,    size: 0,  color: "FFFFFF" };

      // ── text helpers ──
      const ar = (text, opts = {}) => new TextRun({
        text,
        rightToLeft: true,
        font: "Times New Roman",
        size: opts.sz || 22,
        bold: opts.b || false,
        underline: opts.u ? { type: UnderlineType.SINGLE } : undefined,
      });

      const p = (runs, opts = {}) => new Paragraph({
        bidirectional: true,
        alignment: opts.al !== undefined ? opts.al : AlignmentType.RIGHT,
        spacing: { before: opts.sb !== undefined ? opts.sb : 80, after: opts.sa !== undefined ? opts.sa : 80 },
        border: opts.bdr,
        children: Array.isArray(runs) ? runs : [runs],
      });

      // ── cell helper ──
      const tc = (content, opts = {}) => new TableCell({
        width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
        rowSpan: opts.rs,
        columnSpan: opts.cs,
        verticalAlign: VerticalAlign.CENTER,
        shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
        borders: {
          top:    opts.bt !== undefined ? opts.bt : SB,
          bottom: opts.bb !== undefined ? opts.bb : SB,
          left:   opts.bl !== undefined ? opts.bl : SB,
          right:  opts.br !== undefined ? opts.br : SB,
        },
        children: Array.isArray(content) ? content : [content],
      });

      // ── HEADER TABLE ──
      const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            tc([p(ar("شركة نفط البصرة", { b: true, sz: 22 }), { al: AlignmentType.CENTER, sb: 40, sa: 20 }),
                p(ar("(شركة عامة)", { sz: 20 }),              { al: AlignmentType.CENTER, sb: 20, sa: 40 })],
               { rs: 2, fill: "F0F0F0" }),
            tc(p(ar("عنوان النموذج", { sz: 18 }), { al: AlignmentType.CENTER }), { fill: "FAFAFA" }),
            tc(p(ar("نموذج طلب اجازة خارج جمهورية العراق", { b: true, sz: 24 }), { al: AlignmentType.CENTER, sb: 40, sa: 40 }), { cs: 2 }),
            tc([p(ar("B.O.C",              { b: true, sz: 28 }), { al: AlignmentType.CENTER, sb: 30, sa: 10 }),
                p(ar("شركة نفط البصرة",   { sz: 14 }),           { al: AlignmentType.CENTER, sb: 0,  sa: 30 })],
               { rs: 2 }),
          ]}),
          new TableRow({ children: [
            tc(p(ar("رمز النموذج", { sz: 18 }), { al: AlignmentType.CENTER }), { fill: "FAFAFA" }),
            tc(p(ar("BOC-P-HR/F05", { b: true, sz: 20 }), { al: AlignmentType.CENTER })),
            tc([p(ar("رقم الإصدار: 1",        { sz: 18 }), { al: AlignmentType.CENTER, sb: 30, sa: 20 }),
                p(ar("تاريخ الإصدار: 2023/4/10", { sz: 18 }), { al: AlignmentType.CENTER, sb: 20, sa: 30 })]),
          ]}),
        ],
      });

      // ── FIELDS TABLE ──
      const fieldsTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          ["الاسم الثلاثي :", name || ""],
          ["الرقم الوظيفي :", jobNum || ""],
          ["العنوان الوظيفي :", jobTitle || ""],
          ["تاريخ تقديم الطلب :", fmtDate(reqDate)],
        ].map(([lbl, val]) => new TableRow({ children: [
          tc(p(ar(lbl, { b: true }),  { sb: 80, sa: 80 }), { w: 30, bt: NB, bb: DB, bl: NB, br: NB }),
          tc(p(ar(val),               { sb: 80, sa: 80 }), { w: 70, bt: NB, bb: SB, bl: NB, br: NB }),
        ]})),
      });

      // ── REQUEST PARAGRAPH (bordered box) ──
      const PB = { value: "single", size: 8, color: "333333" };
      const reqPara = p([
        ar("ارجو التفضل بالموافقة على منحي اجازة اعتيادية خارج جمهورية العراق ( "),
        ar(country || "_______________", { b: true }),
        ar(" ) ولمدة ( "),
        ar(days || "____", { b: true }),
        ar(" يوما ) ( "),
        ar(salaryType || "براتب", { b: true }),
        ar(" لغرض ) ( "),
        ar(purpose || "___________________________", { b: true }),
        ar(" ) وابتدآ من تاريخ الانفكاك ."),
      ], { sb: 160, sa: 160, bdr: { top: PB, bottom: PB, left: PB, right: PB } });

      // ── 4-COLUMN SIGNATURE TABLE ──
      const sigCell = (title) => tc([
        p(ar(title, { b: true, sz: 20 }), { al: AlignmentType.CENTER, sb: 60, sa: 300 }),
        p(ar(""), { sb: 0, sa: 60 }),
      ]);
      const sig4Table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          sigCell("مسؤول الشعبة"),
          sigCell("مدير القسم"),
          sigCell("مدير هيأة الصيانة الهندسية"),
          sigCell("المعاون المختص"),
        ]})],
      });

      // ── NOTE ──
      const PBD = { value: "dotted", size: 4, color: "999999" };
      const notePara = p([
        ar("ملاحظة : ", { b: true, sz: 20 }),
        ar("يرسل الطلب الى الهيئة الادارية في حال طلب الاجازة ( براتب تام) لاكثر من 3 اشهر ولغاية 4 اشهر وفي حال طلب الاجازة ( بدون راتب )", { sz: 20 }),
      ], { sb: 100, sa: 100, bdr: { top: PBD, bottom: PBD, left: PBD, right: PBD } });

      // ── DASHED SEPARATOR ──
      const sep = p(ar(""), { sb: 240, sa: 240,
        bdr: { bottom: { value: "dashed", size: 8, color: "555555" } }
      });

      // ── FORWARDING LETTER HEADER (2-col, no-border table) ──
      const fwdHeaderTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          tc([
            p([ar("من / "), ar(dept || "قسم السيطرة والنظم", { b: true })], { sb: 60, sa: 60 }),
            p(ar("الى / السيد مدير هيأة الصيانة الهندسية"),                  { sb: 60, sa: 60 }),
          ], { bt: NB, bb: NB, bl: NB, br: NB }),
          tc([
            p([ar("العـــدد : "), ar(refNum || "________", { b: true })], { al: AlignmentType.RIGHT, sb: 60, sa: 60 }),
            p([ar("التاريخ : "), ar(fmtDate(reqDate), { b: true })],       { al: AlignmentType.RIGHT, sb: 60, sa: 60 }),
          ], { bt: NB, bb: NB, bl: NB, br: NB }),
        ]})],
      });

      // ── FWD SIGNATURE BOX ──
      const fwdSigTable = new Table({
        width: { size: 45, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          tc([
            p(ar("توقيع مدير الهيئة الادارية", { b: true, sz: 20 }), { al: AlignmentType.CENTER, sb: 60, sa: 260 }),
            p(ar("التوقيع : ________________", { sz: 20 }),            { al: AlignmentType.CENTER, sb: 40, sa: 60 }),
          ]),
        ]})],
      });

      // ── BUILD DOCUMENT ──
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size:   { width: 11906, height: 16838 },
              margin: { top: 1700, right: 1360, bottom: 1700, left: 1360 },
            },
          },
          children: [
            headerTable,
            p(ar(""), { sb: 120, sa: 0 }),
            p(ar("م/ إجازة اعتيادية خارج جمهورية العراق", { b: true, sz: 26, u: true }), { sb: 80, sa: 140 }),
            fieldsTable,
            p(ar(""), { sb: 80, sa: 0 }),
            reqPara,
            p(ar("مع التقدير ...", { sz: 22 }), { sb: 120, sa: 120 }),
            sig4Table,
            p(ar(""), { sb: 60, sa: 0 }),
            notePara,
            sep,
            fwdHeaderTable,
            p(ar("م/ طلب اجازة اعتيادية خارج جمهورية العراق", { b: true, sz: 24, u: true }), { sb: 120, sa: 80 }),
            p([
              ar("نرفق لكم اعلاه طلب السيد "),
              ar(name || "___________", { b: true, u: true }),
              ar(" للتفضل بالموافقة على منحه الاجازة المطلوبة وحسب صلاحيتكم"),
            ], { sb: 80, sa: 120 }),
            p(ar("مع التقدير...", { sz: 22 }), { sb: 120, sa: 180 }),
            fwdSigTable,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File(
        [blob],
        `اجازة-خارج-العراق-${safeName}-${reqDate || "بدون-تاريخ"}.docx`,
        { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
      );
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast.success("تم حفظ الاستمارة كملف Word في Drive");
    } catch (e) {
      console.error("docx build error:", e);
      toast.error("فشل إنشاء ملف Word: " + e.message);
    } finally {
      setUploadPct(-1);
    }
  };

  const fillFromTemplate = async () => {
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    if (!templateId.trim()) { toast.warning("يرجى إدخال معرف ملف القالب"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const { default: JSZip } = await import("jszip");

      // تنزيل القالب
      let arrayBuffer;
      try {
        arrayBuffer = await gDrive.downloadFile(templateId.trim());
      } catch (dlErr) {
        throw new Error("فشل تنزيل القالب من Drive: " + dlErr.message);
      }
      if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error("الملف المُنزَّل فارغ — تحقق من File ID");

      const zip = await JSZip.loadAsync(arrayBuffer);

      const esc = (s) => String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

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

      // دمج النصوص المقسّمة بين عناصر XML المتجاورة
      // Word يقسّم {{النص}} أحياناً على عدة <w:r> مما يمنع الاستبدال
      const mergeRuns = (xmlContent) =>
        xmlContent.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (para) =>
          para.replace(
            /<\/w:t><\/w:r>(\s*<w:r[^>]*>)(\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>/g,
            ""
          )
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

      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File(
        [blob],
        `اجازة-خارج-العراق-${safeName}-${reqDate || "بدون-تاريخ"}.docx`,
        { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
      );
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result?.webViewLink || null);
      toast.success(`تم تعبئة ${replacedCount} حقل ورفع النسخة المعبأة إلى Drive ✅`);
    } catch (e) {
      console.error("fillFromTemplate error:", e);
      alert("خطأ في تعبئة القالب:\n\n" + e.message);
      toast.error("فشل تعبئة القالب");
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
        <label className="block text-xs font-bold text-secondary mb-2">توقيع مسؤول الشعبة (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم التوقيع ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
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
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        {gDrive.isReady && (
          <button onClick={uploadAsWord} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "Word في Drive"}
          </button>
        )}
        <a href="/templates/leave-ooc.xlsx" download className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-200"><Download size={14}/> تنزيل النموذج</a>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== نموذج الإجازة الزمنية ==========
function TimeLeaveForm({ emp }) {
  const now = new Date();
  const toast = useToast();
  const gDrive = useGDrive();
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

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, leaveDate, departureTime, returnTime, hours, reason, sigDataUrl });
    toast.success("تم حفظ بيانات الإجازة الزمنية");
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
    const html = buildTimeHtml();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const uploadToDrive = async () => {
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const html = buildTimeHtml();
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File([new Blob([html], { type: "text/html" })], `اجازة-زمنية-${safeName}-${leaveDate || "بدون-تاريخ"}.html`, { type: "text/html" });
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast.success("تم رفع نموذج الإجازة الزمنية إلى Drive");
    } catch (e) {
      toast.error("فشل رفع الملف: " + e.message);
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
      toast.success("تم تصدير نموذج الإجازة الزمنية");
      if (gDrive.isReady) {
        setUploadPct(0);
        const file = new File([outBuf], fname, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
        setDriveLink(result.webViewLink);
        toast.success("تم رفع النموذج إلى Drive");
      }
    } catch(e) {
      toast.error("فشل التصدير: " + e.message);
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
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الإجازة</label><input type="date" value={leaveDate} onChange={e=>setLeaveDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
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
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        {gDrive.isReady && (
          <button onClick={uploadToDrive} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "رفع إلى Drive"}
          </button>
        )}
        <button onClick={exportToExcel} disabled={xlExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"><Download size={14}/> {xlExporting ? "جاري التصدير..." : "تصدير إكسل"}</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
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
