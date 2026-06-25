import React, { useState, useEffect } from "react";
import { Save, FileText, Clock, Plus, Trash2, X, Printer, Download, Heart, UserPlus } from "lucide-react";
import { MARITAL_STATUS_LIST, PROCEDURE_TYPES, MONTHS_IRAQI } from "../constants";
import { buildHealthInsurancePrintHTML } from "./HealthInsurancePrintBuilder";
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

  const buildPrintHTML = (forWord = false) =>
    buildHealthInsurancePrintHTML({ emp, rows, marital, phone, formEnvelope, formSequence, month, year, filledRows, totalAmount, forWord });

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
    }
  };

  const exportFromBuiltin = async () => {
    setInsExporting(true);
    try {
      const buf = await (await fetch("/templates/health-insurance.xlsx")).arrayBuffer();
      await exportToInsuranceTemplate(buf);
    } catch(e) { addToast("فشل تحميل القالب: "+e.message,"error"); setInsExporting(false); }
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

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end pb-4">
          <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 btn-secondary border border-color rounded-xl font-bold text-sm"><Save size={14}/> حفظ مسودة</button>
          <button onClick={saveToHistory} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700"><Save size={14}/> حفظ في السجل</button>
          <button onClick={exportFromBuiltin} disabled={insExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"><Download size={14}/> {insExporting?"جاري التصدير...":"تصدير إكسل"}</button>
          <button onClick={exportWord} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700"><Download size={14}/> تصدير Word</button>
          <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"><Printer size={14}/> طباعة الاستمارة</button>
        </div>
      </>)}
    </div>
  );
}


export default HealthInsuranceForm;
