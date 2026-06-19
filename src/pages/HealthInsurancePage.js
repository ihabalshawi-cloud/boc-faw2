import React, { useState, useEffect, useRef } from "react";
import { Save, FileText, Clock, Plus, Trash2, X, Printer, Download, Heart, UserPlus } from "lucide-react";
import { MARITAL_STATUS_LIST, PROCEDURE_TYPES, MONTHS_IRAQI } from "../constants";
import { storage } from "../utils";
import { useToast, useConfirm } from "../contexts";

function HealthInsuranceForm({ emp }) {
  const now = new Date();
  const STORAGE_KEY  = `health_ins_${emp.id}`;
  const HISTORY_KEY  = `health_ins_history_${emp.id}`;
  const addToast = useToast();
  const confirm  = useConfirm();

  const emptyRow = (i) => ({ id:i, beneficiary:"", date:"", procedure:"", amount:"", opType:"", notes:"" });

  // ── form state ──
  const [phone,        setPhone]        = useState("");
  const [marital,      setMarital]      = useState("متزوج");
  const [month,        setMonth]        = useState(now.getMonth());
  const [year,         setYear]         = useState(now.getFullYear());
  const [formEnvelope, setFormEnvelope] = useState("");
  const [formSequence, setFormSequence] = useState("");
  const [beneficiaries,setBeneficiaries]= useState([emp.name]);
  const [newBenef,     setNewBenef]     = useState("");
  const [rows,         setRows]         = useState(() => Array.from({length:10},(_,i)=>emptyRow(i+1)));
  const [activeView,   setActiveView]   = useState("form"); // "form" | "history" | "preview"
  const [savedForms,   setSavedForms]   = useState(() => storage.get(HISTORY_KEY, []));
  const [insExporting, setInsExporting] = useState(false);
  const [showInsExport,setShowInsExport]= useState(false);
  const insFileRef = useRef(null);

  useEffect(() => {
    const d = storage.get(STORAGE_KEY);
    if (!d) return;
    setPhone(d.phone||""); setMarital(d.marital||"متزوج");
    setMonth(d.month??now.getMonth()); setYear(d.year??now.getFullYear());
    setFormEnvelope(d.formEnvelope||""); setFormSequence(d.formSequence||"");
    setBeneficiaries(d.beneficiaries||[emp.name]);
    setRows(d.rows||Array.from({length:10},(_,i)=>emptyRow(i+1)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deadlineBase = new Date(now.getFullYear(), now.getMonth(), 17);
  const deadline  = now.getDate() > 17 ? new Date(now.getFullYear(), now.getMonth()+1, 17) : deadlineBase;
  const daysLeft  = Math.ceil((deadline - now) / 86400000);
  const filledRows   = rows.filter(r => r.beneficiary && r.procedure);
  const totalAmount  = rows.reduce((s,r) => s + (Number(r.amount)||0), 0);
  const updateRow = (idx, field, val) => setRows(rows.map((r,i) => i===idx ? {...r,[field]:val} : r));
  const addRow = () => setRows([...rows, emptyRow(rows.length+1)]);
  const removeRow = (idx) => setRows(rows.filter((_,i)=>i!==idx));

  const addBenef = () => {
    const n = newBenef.trim();
    if (!n) return;
    if (beneficiaries.includes(n)) { addToast("الاسم موجود مسبقاً","warning"); return; }
    setBeneficiaries([...beneficiaries, n]); setNewBenef("");
    addToast("تمت الإضافة","success");
  };

  const getFormData = () => ({ phone, marital, month, year, formEnvelope, formSequence, beneficiaries, rows });

  const save = () => {
    storage.set(STORAGE_KEY, getFormData());
    addToast("تم حفظ الاستمارة","success");
  };

  const saveToHistory = () => {
    const label = `${MONTHS_IRAQI[month]} ${year} — ${filledRows.length} مراجعة`;
    const entry = { id: Date.now(), label, savedAt: new Date().toISOString(), data: getFormData() };
    const updated = [entry, ...savedForms.slice(0, 49)];
    setSavedForms(updated);
    storage.set(HISTORY_KEY, updated);
    storage.set(STORAGE_KEY, getFormData());
    addToast("تم حفظ الاستمارة في السجل","success");
  };

  const loadFromHistory = (entry) => {
    const d = entry.data;
    setPhone(d.phone||""); setMarital(d.marital||"متزوج");
    setMonth(d.month??0); setYear(d.year??now.getFullYear());
    setFormEnvelope(d.formEnvelope||""); setFormSequence(d.formSequence||"");
    setBeneficiaries(d.beneficiaries||[emp.name]);
    setRows(d.rows||Array.from({length:10},(_,i)=>emptyRow(i+1)));
    setActiveView("form"); addToast("تم تحميل الاستمارة","info");
  };

  const deleteFromHistory = async (id) => {
    if (await confirm("حذف هذه الاستمارة من السجل؟", { title:"حذف", ok:"حذف", danger:true })) {
      const updated = savedForms.filter(f=>f.id!==id);
      setSavedForms(updated); storage.set(HISTORY_KEY, updated);
      addToast("تم الحذف","info");
    }
  };

  // ── Build print HTML (shared between print and Word export) ──
  const buildPrintHTML = (forWord = false) => {
    const PROC_COLS = [...PROCEDURE_TYPES].reverse();
    const printRows = rows.slice(0, 15).concat(
      Array.from({length: Math.max(0, 10-rows.length)}, (_,i)=>emptyRow(rows.length+i+1))
    );
    const procHeadCols = PROC_COLS.map(pt =>
      `<th style="width:13mm"><div class="th-vert">${pt}</div></th>`
    ).join("");
    const dataRows = printRows.map((r,i) => `
      <tr style="height:9mm">
        <td style="text-align:center">${i+1}</td>
        <td class="td-name">${r.beneficiary||""}</td>
        <td class="td-date">${r.date ? r.date.split("-").reverse().join("/") : ""}</td>
        ${PROC_COLS.map(pt=>`<td class="td-amt">${r.procedure===pt ? (r.amount ? Number(r.amount).toLocaleString() : "✓") : ""}</td>`).join("")}
        <td class="td-amt">${r.opType||""}</td>
        <td class="td-amt">${r.notes||""}</td>
      </tr>`).join("");

    const wordHeader = forWord ? `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="UTF-8"/><meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15"><meta name=Originator content="Microsoft Word 15">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->` : `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>`;

    return `${wordHeader}
<title>استمارة طلب التعويض للموظفين</title>
<style>
  @page{size:A4 landscape;margin:7mm 8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;font-size:8.5pt;direction:rtl;color:#000}
  /* ===== HEADER ===== */
  .hbox{border:2px solid #000;margin-bottom:3mm;width:100%}
  .htitle{text-align:center;font-size:14pt;font-weight:bold;padding:2.5mm;border-bottom:2px solid #000;background:#D9D9D9}
  .hgrid{display:grid;grid-template-columns:1fr 1fr 1fr;direction:rtl;width:100%}
  .hcol{padding:2mm 3mm;border-left:1px solid #000;vertical-align:top}
  .hcol:last-child{border-left:none}
  .frow{display:flex;align-items:baseline;gap:3px;padding:2px 0;min-height:18px;border-bottom:1px solid #ddd}
  .frow:last-child{border-bottom:none}
  .fl{font-weight:bold;white-space:nowrap;font-size:7.5pt;min-width:100px}
  .fv{flex:1;border-bottom:1.5px solid #000;font-size:8.5pt;padding-bottom:1px;padding-right:4px}
  .section-lbl{text-align:center;font-weight:bold;font-size:10pt;background:#D9D9D9;border-bottom:1px solid #000;padding:1.5mm 0}
  /* ===== TABLE ===== */
  table{border-collapse:collapse;width:100%;table-layout:fixed}
  th,td{border:1px solid #000;text-align:center;vertical-align:middle;font-size:6.5pt;padding:0 1px;word-break:break-all}
  th{background:#D9D9D9;font-weight:bold}
  .th-vert{writing-mode:vertical-rl;text-orientation:mixed;transform:rotate(180deg);height:26mm;font-size:5.5pt;line-height:1.3}
  .td-name{text-align:right;font-size:8pt;padding-right:1.5mm}
  .td-date{font-size:7pt}
  .td-amt{font-size:7.5pt;font-weight:bold}
  /* ===== FOOTER ===== */
  .footer-area{margin-top:3mm;font-size:8pt;direction:rtl}
  .sigrow{display:grid;grid-template-columns:repeat(4,1fr);gap:8mm;margin-top:3mm;text-align:center}
  .sigcell{font-weight:bold;font-size:9pt}
  .sigline{margin-top:10mm;border-top:1.5px solid #000;padding-top:1mm;font-size:7pt;font-weight:normal}
  .summary-box{border:1px solid #000;padding:2mm;margin-top:2mm;display:flex;gap:8mm;justify-content:center;background:#f8f8f8}
</style></head><body>
<div class="hbox">
  <div class="htitle">استمارة طلب التعويض للموظفين — لجنة الضمان الصحي المركزية</div>
  <div class="hgrid">
    <div class="hcol">
      <div class="section-lbl">بيانات الموظف</div>
      <div class="frow"><span class="fl">اسم الموظف:</span><span class="fv">${emp.name}</span></div>
      <div class="frow"><span class="fl">الرقم الوظيفي:</span><span class="fv">${emp.jobNum||""}</span></div>
      <div class="frow"><span class="fl">الحالة الزوجية:</span><span class="fv">${marital}</span></div>
      <div class="frow"><span class="fl">رقم الهاتف:</span><span class="fv">${phone}</span></div>
      <div class="frow"><span class="fl">توقيع الموظف:</span><span class="fv">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>
    <div class="hcol">
      <div class="section-lbl">الصيانة الهندسية / السيطرة والنظم</div>
      <div class="frow"><span class="fl">الشهـر:</span><span class="fv">${MONTHS_IRAQI[month]} ${year}</span></div>
      <div class="frow"><span class="fl">تاريخ تقديم الطلب:</span><span class="fv">${now.toLocaleDateString("ar-IQ")}</span></div>
      <div class="frow"><span class="fl">رقم الظرف:</span><span class="fv">${formEnvelope}</span></div>
      <div class="frow"><span class="fl">التسلسل:</span><span class="fv">${formSequence}</span></div>
    </div>
    <div class="hcol">
      <div class="section-lbl">ملخص الطلب</div>
      <div class="frow"><span class="fl">عدد المراجعات:</span><span class="fv">${filledRows.length}</span></div>
      <div class="frow"><span class="fl">المجموع الكلي:</span><span class="fv">${totalAmount.toLocaleString()} دينار</span></div>
      <div class="frow"><span class="fl">اسم الهيأة/القسم:</span><span class="fv">الصيانة الهندسية / السيطرة والنظم</span></div>
      <div class="frow"><span class="fl">&nbsp;</span><span class="fv">&nbsp;</span></div>
      <div class="frow"><span class="fl">&nbsp;</span><span class="fv">&nbsp;</span></div>
    </div>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:7mm">ت</th>
      <th rowspan="2" style="width:35mm">اسم المنتفع</th>
      <th rowspan="2" style="width:17mm">تاريخ المراجعة</th>
      <th colspan="${PROC_COLS.length}" style="font-size:8.5pt;background:#B8CCE4">نوع الإجراء الطبي</th>
      <th rowspan="2" style="width:18mm">نوع العملية</th>
      <th rowspan="2" style="width:20mm">ملاحظات</th>
    </tr>
    <tr>${procHeadCols}</tr>
  </thead>
  <tbody>${dataRows}</tbody>
  <tfoot>
    <tr style="background:#D9D9D9;font-weight:bold">
      <td colspan="3" style="text-align:right;padding:1.5mm;font-size:8pt">المجموع الكلي (${filledRows.length} مراجعة)</td>
      ${PROC_COLS.map(()=>`<td></td>`).join("")}
      <td style="font-size:9pt">${totalAmount.toLocaleString()}</td>
      <td></td>
    </tr>
  </tfoot>
</table>
<div class="footer-area">
  <div>اسم وتوقيع المخول: ___________________________________</div>
  <div class="sigrow">
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">رئيس اللجنة<div class="sigline">الاسم والتوقيع</div></div>
  </div>
</div>
</body></html>`;
  };

  const printForm = () => {
    const html = buildPrintHTML(false);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const exportWord = () => {
    const html = buildPrintHTML(true);
    const blob = new Blob(["﻿" + html], { type: "application/msword" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `استمارة_ضمان_${emp.name.replace(/\s+/g,"_")}_${MONTHS_IRAQI[month]}_${year}.doc`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast("تم تصدير الاستمارة كملف Word","success");
  };

  const exportToInsuranceTemplate = async (buffer) => {
    try {
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.worksheets[0];

      // ExcelJS: cell.value = x يغير القيمة فقط دون المساس بالتنسيق
      const set = (ref, v) => { ws.getCell(ref).value = v ?? null; };

      // ── الهيدر — خرائط الخلايا مبنية على الملف الفعلي ──
      set("B2",  "هيأة الصيانة الهندسية / قسم السيطرة والنظم");  // اسم الهيأة/القسم (B2:G3)
      set("AB2", emp.name);
      set("B4",  phone);                                            // رقم الهاتف (B4:G4)
      set("AB4", String(emp.jobNum || ""));
      set("B5",  filledRows.length);                               // عدد المراجعات (B5:C5)
      set("B6",  new Date().toLocaleDateString("ar-IQ"));          // تاريخ تقديم الطلب (B6:C6)
      set("M6",  MONTHS_IRAQI[month] + " " + year);               // الشهر (M6:R6)
      set("AB6", marital);
      set("B7",  rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)); // المجموع (B7:C7)
      set("M7",  String(formSequence));
      set("Y7",  formEnvelope);

      // ── خرائط أعمدة أنواع الإجراءات (Master cell لكل دمج) ──
      const PROC_COL = {
        "الامراض المستعصية":                              "B",
        "العمليات الصغرى":                               "C",
        "العمليات الوسطى":                               "E",
        "العمليات الكبرى":                               "H",
        "العمليات فوق الكبرى":                           "K",
        "معالجة اسنان":                                  "N",
        "اشعة وسونار":                                   "O",
        "نظارات طبية":                                   "Q",
        "تحاليل مختبرية":                                "S",
        "الرنين والمفراس/الايكو/تخطيط القلب":            "U",
        "العلاجات (الادوية)":                            "Y",
        "اجور الطبيب":                                   "Z",
      };

      // مسح بيانات الجدول (صفوف 14-23) مع الحفاظ على التنسيق
      const CLEAR_COLS = ["B","C","E","H","K","N","O","Q","S","U","Y","Z","AC","AD"];
      for (let r = 14; r <= 23; r++) {
        for (const col of CLEAR_COLS) ws.getCell(col + r).value = null;
      }

      // تعبئة صفوف المراجعات
      const dataRows = rows.filter(r => r.beneficiary && r.procedure);
      dataRows.forEach((row, idx) => {
        const r = 14 + idx;
        if (r > 23) return;
        set("AD" + r, row.beneficiary);
        if (row.date) set("AC" + r, row.date);
        const col = PROC_COL[row.procedure];
        if (col) ws.getCell(col + r).value = row.amount ? Number(row.amount) : "✓";
      });

      const outBuf = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a      = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `استمارة_ضمان_${emp.name.replace(/\s+/g,"_")}_${MONTHS_IRAQI[month]}_${year}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(a.href);
      addToast("تم تصدير الاستمارة بنجاح","success");
    } catch(e) {
      addToast("فشل تصدير الإكسل: " + e.message, "error");
    } finally {
      setInsExporting(false);
      setShowInsExport(false);
    }
  };

  const exportFromInsFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInsExporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => exportToInsuranceTemplate(ev.target.result);
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Deadline banner */}
      <div className={`rounded-2xl p-3 flex items-center gap-3 border ${daysLeft<=3?"bg-red-50 border-red-200":daysLeft<=7?"bg-amber-50 border-amber-200":"bg-blue-50 border-blue-200"}`}>
        <Clock size={18} className={daysLeft<=3?"text-red-500":daysLeft<=7?"text-amber-500":"text-blue-500"}/>
        <div className="flex-1">
          <p className={`font-bold text-sm ${daysLeft<=3?"text-red-700":daysLeft<=7?"text-amber-700":"text-blue-700"}`}>الموعد النهائي: يوم 17 من كل شهر</p>
          <p className={`text-xs ${daysLeft<=3?"text-red-600":daysLeft<=7?"text-amber-600":"text-blue-600"}`}>
            {daysLeft===0?"⚠️ اليوم هو آخر يوم!":daysLeft===1?"⚠️ باقي يوم واحد!":` باقي ${daysLeft} يوم`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setActiveView(activeView==="history"?"form":"history")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border transition-colors ${activeView==="history"?"bg-violet-600 text-white border-violet-600":"btn-secondary border-color"}`}>
            <Clock size={13}/> السجل ({savedForms.length})
          </button>
        </div>
      </div>

      {/* ════ سجل الاستمارات المحفوظة ════ */}
      {activeView === "history" && (
        <div className="card rounded-2xl border border-color p-5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Clock size={16}/> الاستمارات المحفوظة</h3>
          {savedForms.length === 0 ? (
            <div className="text-center py-10 text-secondary"><FileText size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد استمارات محفوظة بعد</p></div>
          ) : (
            <div className="space-y-2">
              {savedForms.map(f => (
                <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-color hover:bg-hover transition-colors">
                  <div>
                    <p className="font-bold text-sm">{f.label}</p>
                    <p className="text-xs text-secondary">{new Date(f.savedAt).toLocaleString("ar-IQ")}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={()=>loadFromHistory(f)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                      <Download size={12}/> تحميل
                    </button>
                    <button onClick={()=>deleteFromHistory(f.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════ نموذج الاستمارة ════ */}
      {activeView === "form" && (<>
        {/* Header info */}
        <div className="card rounded-2xl border-color border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Heart size={18} className="text-red-500"/> استمارة طلب التعويض الصحي</h3>
            <span className="text-xs text-secondary">الصيانة الهندسية / السيطرة والنظم</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-[10px] font-bold text-secondary mb-1">اسم الموظف</label>
              <input value={emp.name} readOnly className="input w-full rounded-xl px-3 py-2 text-sm opacity-60 cursor-not-allowed"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الرقم الوظيفي</label>
              <input value={emp.jobNum||""} readOnly className="input w-full rounded-xl px-3 py-2 text-sm opacity-60 cursor-not-allowed"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة الزوجية</label>
              <select value={marital} onChange={e=>setMarital(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm">
                {MARITAL_STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">رقم الهاتف</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07X XXXX XXXX" className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الشهر</label>
              <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="input w-full rounded-xl px-3 py-2 text-sm">
                {MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">السنة</label>
              <select value={year} onChange={e=>setYear(Number(e.target.value))} className="input w-full rounded-xl px-3 py-2 text-sm">
                {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">رقم الظرف</label>
              <input value={formEnvelope} onChange={e=>setFormEnvelope(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">التسلسل</label>
              <input value={formSequence} onChange={e=>setFormSequence(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <p className="text-2xl font-bold text-blue-700">{filledRows.length}</p>
              <p className="text-xs text-blue-600">عدد المراجعات</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-xl font-bold text-emerald-700">{totalAmount.toLocaleString()} د.ع</p>
              <p className="text-xs text-emerald-600">المجموع الكلي</p>
            </div>
          </div>
        </div>

        {/* Beneficiaries */}
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 flex items-center gap-2 text-sm"><UserPlus size={15} className="text-blue-500"/> المشمولون بالضمان الصحي</h4>
          <div className="flex gap-2 mb-3">
            <input value={newBenef} onChange={e=>setNewBenef(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBenef()}
              placeholder="اسم أحد أفراد العائلة..." className="input flex-1 rounded-xl px-3 py-2 text-sm"/>
            <button onClick={addBenef} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-1"><Plus size={13}/> إضافة</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {beneficiaries.map((b,i)=>(
              <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${i===0?"bg-blue-100 text-blue-800 border border-blue-200":"bg-slate-100 text-slate-700 border border-slate-200"}`}>
                {i===0&&<span className="opacity-60 text-[10px]">موظف</span>}
                {b}
                {i>0&&<button onClick={()=>setBeneficiaries(beneficiaries.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><X size={11}/></button>}
              </span>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card rounded-2xl border-color border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" dir="rtl" style={{minWidth:"900px"}}>
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
                  <th rowSpan={2} className="px-2 py-2 text-center w-8">ت</th>
                  <th rowSpan={2} className="px-2 py-2 text-right min-w-[130px]">اسم المنتفع</th>
                  <th rowSpan={2} className="px-2 py-2 text-right w-[120px]">تاريخ المراجعة</th>
                  <th rowSpan={2} className="px-2 py-2 text-right min-w-[180px]">نوع الإجراء الطبي</th>
                  <th rowSpan={2} className="px-2 py-2 text-right w-[90px]">المبلغ (دينار)</th>
                  <th rowSpan={2} className="px-2 py-2 text-right min-w-[130px]">نوع العملية</th>
                  <th rowSpan={2} className="px-2 py-2 text-right min-w-[120px]">ملاحظات</th>
                  <th rowSpan={2} className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row,idx)=>(
                  <tr key={idx} className={`border-t border-color ${row.beneficiary&&row.procedure?"bg-emerald-50/30":""} ${idx%2===1?"bg-hover/20":""}`}>
                    <td className="px-2 py-1 text-center font-bold text-secondary text-[10px]">{idx+1}</td>
                    <td className="px-1 py-1">
                      <select value={row.beneficiary} onChange={e=>updateRow(idx,"beneficiary",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs">
                        <option value="">— اختر —</option>
                        {beneficiaries.map((b,i)=><option key={i} value={b}>{b}</option>)}</select></td>
                    <td className="px-1 py-1"><input type="date" value={row.date} onChange={e=>updateRow(idx,"date",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs"/></td>
                    <td className="px-1 py-1">
                      <select value={row.procedure} onChange={e=>updateRow(idx,"procedure",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs">
                        <option value="">— اختر —</option>
                        {PROCEDURE_TYPES.map(p=><option key={p} value={p}>{p}</option>)}</select></td>
                    <td className="px-1 py-1"><input type="number" min="0" value={row.amount} onChange={e=>updateRow(idx,"amount",e.target.value)} placeholder="0" className="input w-full rounded-lg px-2 py-1.5 text-xs" dir="ltr"/></td>
                    <td className="px-1 py-1">
                      <select value={row.opType||""} onChange={e=>updateRow(idx,"opType",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs">
                        <option value="">—</option>
                        <option value="العمليات الصغرى">الصغرى</option>
                        <option value="العمليات الوسطى">الوسطى</option>
                        <option value="العمليات الكبرى">الكبرى</option>
                        <option value="العمليات فوق الكبرى">فوق الكبرى</option>
                      </select></td>
                    <td className="px-1 py-1"><input value={row.notes||""} onChange={e=>updateRow(idx,"notes",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs"/></td>
                    <td className="px-1 py-1 text-center">
                      {rows.length > 1 && <button onClick={()=>removeRow(idx)} className="text-red-400 hover:text-red-600 p-0.5"><X size={13}/></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-blue-200 bg-blue-50">
                  <td colSpan={4} className="px-3 py-2 font-bold text-blue-800 text-xs">المجموع ({filledRows.length} مراجعة)</td>
                  <td className="px-3 py-2 font-bold text-blue-800 text-xs">{totalAmount.toLocaleString()}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-3 border-t border-color">
            <button onClick={addRow} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"><Plus size={14}/> إضافة سطر</button>
          </div>
        </div>

        {/* لوحة تصدير قالب الإكسل */}
        {showInsExport && (
          <div className="card rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-2">
                <Download size={15}/> تصدير إلى قالب إكسل
              </h4>
              <button onClick={()=>setShowInsExport(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <p className="text-xs text-emerald-700">اختر ملف قالب الإكسل الخاص باستمارة الضمان الصحي — سيتم ملء البيانات مع الحفاظ على التنسيق الأصلي.</p>
            <input ref={insFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={exportFromInsFile}/>
            <button
              onClick={()=>insFileRef.current?.click()}
              disabled={insExporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-60">
              {insExporting ? <span className="animate-spin">⏳</span> : <Download size={14}/>}
              {insExporting ? "جاري التصدير..." : "اختيار ملف القالب"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end pb-4">
          <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 btn-secondary border border-color rounded-xl font-bold text-sm"><Save size={14}/> حفظ مسودة</button>
          <button onClick={saveToHistory} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700"><Save size={14}/> حفظ في السجل</button>
          <button onClick={()=>setShowInsExport(v=>!v)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700"><Download size={14}/> تصدير إكسل</button>
          <button onClick={exportWord} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700"><Download size={14}/> تصدير Word</button>
          <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"><Printer size={14}/> طباعة الاستمارة</button>
        </div>
      </>)}
    </div>
  );
}


export default HealthInsuranceForm;
