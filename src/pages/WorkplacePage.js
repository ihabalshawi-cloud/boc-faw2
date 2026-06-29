import React, { useState, useEffect } from "react";
import { LogIn, LogOut, Save, CheckCircle, Plus, Trash2, Download, CheckSquare, AlertTriangle,
  GraduationCap, Star } from "lucide-react";
import { MONTHS_AR, MONTHS_IRAQI, TRAINING_TYPES, TASK_PRIORITIES, TASK_STATUSES, EVAL_CRITERIA } from "../constants";
import { storage, exportCSV } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { EmpPopover, PrintButton, SkeletonMsg, playAlert } from "../components/Shared";

function AttendanceSystem({ emp, isAdmin, allEmployees }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selEmpId, setSelEmpId] = useState(isAdmin ? null : emp.id);
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0,10));
  const [dailyRecords, setDailyRecords] = useState(() => storage.get(`attendance_${emp.id}`, {}));
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const daysInMonth = new Date(selYear, selMonth+1, 0).getDate();

  useEffect(() => { storage.set(`attendance_${emp.id}`, dailyRecords); }, [dailyRecords, emp.id]);

  const handleCheckIn = () => {
    const t = new Date().toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit" });
    setDailyRecords({ ...dailyRecords, [selectedDate]: { ...(dailyRecords[selectedDate]||{}), checkIn: t, status:"حاضر" } });
    showToast("✅ تم تسجيل دخولك بنجاح"); playAlert("notification");
  };
  const handleCheckOut = () => {
    const t = new Date().toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit" });
    if (!dailyRecords[selectedDate]?.checkIn) { showToast("⚠️ يجب تسجيل الدخول أولاً"); return; }
    setDailyRecords({ ...dailyRecords, [selectedDate]: { ...dailyRecords[selectedDate], checkOut: t } });
    showToast("✅ تم تسجيل خروجك بنجاح"); playAlert("notification");
  };

  const stats = { حاضر: 0, غائب: 0 };
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (dailyRecords[k]?.checkIn) stats.حاضر++; else stats.غائب++;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
          {isAdmin && <select value={selEmpId||""} onChange={e=>setSelEmpId(Number(e.target.value)||null)} className="input rounded-xl px-3 py-2 text-sm min-w-[180px]"><option value="">-- اختر موظفاً --</option>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}</select>}
        </div>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{const k=`${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const r=dailyRecords[k]||{};return{اليوم:d,التاريخ:k,دخول:r.checkIn||"—",خروج:r.checkOut||"—",الحالة:r.checkIn?"حاضر":"غائب"}}),"سجل_الحضور")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
          <PrintButton targetId="print-attendance" label="طباعة التقرير"/>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-100"><p className="text-2xl font-bold text-emerald-700">{stats.حاضر}</p><p className="text-[10px] text-emerald-600">أيام الحضور</p></div>
        <div className="bg-red-50 rounded-2xl p-3 text-center border border-red-100"><p className="text-2xl font-bold text-red-700">{stats.غائب}</p><p className="text-[10px] text-red-600">أيام الغياب</p></div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-100"><p className="text-2xl font-bold text-blue-700">{Math.round(stats.حاضر/daysInMonth*100)}%</p><p className="text-[10px] text-blue-600">نسبة الحضور</p></div>
      </div>
      {(!isAdmin || selEmpId === emp.id) && (<div className="card rounded-2xl border-color border p-5"><h3 className="font-bold mb-3">تسجيل الحضور اليومي</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-xs font-bold text-secondary mb-1">التاريخ</label><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="input rounded-xl px-3 py-2"/></div>
          <div className="flex gap-2"><button onClick={handleCheckIn} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><LogIn size={14} className="inline ml-1"/> تسجيل دخول</button>
            <button onClick={handleCheckOut} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><LogOut size={14} className="inline ml-1"/> تسجيل خروج</button></div>
        </div>
        {dailyRecords[selectedDate]?.checkIn && <div className="mt-3 text-sm text-emerald-600">✅ تم تسجيل الدخول الساعة {dailyRecords[selectedDate].checkIn}</div>}
      </div>)}
      <div id="print-attendance" className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-opacity-50 border-b border-color"><th className="px-3 py-2">اليوم</th><th className="px-3 py-2">التاريخ</th><th className="px-3 py-2">دخول</th><th className="px-3 py-2">خروج</th><th className="px-3 py-2">الحالة</th></tr></thead>
        <tbody>{Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{const k=`${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const r=dailyRecords[k]||{};
          return(<tr key={day} className="border-b border-color"><td className="px-3 py-2">{new Date(k).toLocaleDateString("ar-IQ",{weekday:"short"})}</td><td className="px-3 py-2">{day}</td><td className="px-3 py-2">{r.checkIn||"—"}</td><td className="px-3 py-2">{r.checkOut||"—"}</td>
            <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.checkIn?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{r.checkIn?"حاضر":"غائب"}</span></td></tr>);})}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== نظام التدريب ==========
function TrainingSystem({ emp, isAdmin }) {
  const [trainings, setTrainings] = useState(() => storage.get(`trainings_${emp.id}`, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"" });
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set(`trainings_${emp.id}`, trainings); }, [trainings, emp.id]);

  const addTraining = () => {
    if (!form.title) return showToast("عنوان التدريب مطلوب");
    setTrainings([{ ...form, id: Date.now(), status:"مسندة", assignedAt: new Date().toISOString() }, ...trainings]);
    setForm({ title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"" });
    setShowForm(false); showToast("✅ تم إضافة التدريب");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">المهام التدريبية</h3>
        <div className="flex gap-2">{isAdmin && <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>}
        <PrintButton targetId="print-training" label="طباعة"/></div></div>
      {showForm && isAdmin && (<div className="card rounded-2xl border-2 border-violet-200 p-5">
        <div className="grid grid-cols-2 gap-3">
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان التدريب" className="input rounded-xl px-3 py-2 text-sm col-span-2"/>
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="input rounded-xl px-3 py-2 text-sm">{TRAINING_TYPES.map(t=><option key={t}>{t}</option>)}</select>
          <input value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} placeholder="الجهة المقدمة" className="input rounded-xl px-3 py-2 text-sm"/>
          <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input rounded-xl px-3 py-2 text-sm"/>
          <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input rounded-xl px-3 py-2 text-sm"/>
          <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} placeholder="وصف التدريب" className="input rounded-xl px-3 py-2 text-sm col-span-2"/>
        </div>
        <div className="flex gap-2 justify-end mt-4"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm text-secondary btn-secondary rounded-xl border">إلغاء</button><button onClick={addTraining} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> إضافة</button></div>
      </div>)}
      <div id="print-training" className="space-y-3">{trainings.length===0?<div className="card rounded-2xl p-10 text-center border-color border"><GraduationCap size={40} className="text-secondary mx-auto"/><p className="text-secondary">لا توجد مهام تدريبية</p></div>:
        trainings.map(t=>(<div key={t.id} className="card rounded-2xl border-color border p-4"><div className="flex justify-between">
          <div><div className="flex gap-2 mb-1"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status==="مكتملة"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{t.status}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700">{t.type}</span></div>
            <p className="font-bold">{t.title}</p>{t.desc && <p className="text-xs text-secondary mt-1">{t.desc}</p>}
            <div className="flex gap-3 text-[10px] text-secondary mt-2">{t.startDate && <span>📅 من {t.startDate}</span>}{t.endDate && <span>إلى {t.endDate}</span>}</div></div>
          {isAdmin && t.status!=="مكتملة" && <button onClick={()=>setTrainings(trainings.map(x=>x.id===t.id?{...x,status:"مكتملة"}:x))} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs"><CheckCircle size={12}/> إكمال</button>}</div></div>))}</div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد المخزن ==========

function TasksSystem({ emp, isAdmin, allEmployees }) {
  const [tasks, setTasks] = useState(() => storage.get("tasks_system", []));
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("الكل");
  const [form, setForm] = useState({ title:"", desc:"", assignedTo:"", priority:"متوسطة", dueDate:"", status:"معلقة" });
  const [toast, setToast] = useState("");
  const showToast = (msg, type) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const confirm = useConfirm();
  useEffect(() => { storage.set("tasks_system", tasks); FirebaseAPI.saveTasks(tasks); }, [tasks]);
  useEffect(() => {
    FirebaseAPI.loadTasks().then(list => { if (list && list.length > 0) { setTasks(list); storage.set("tasks_system", list); } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayed = isAdmin ? (filter==="الكل" ? tasks : tasks.filter(t=>t.status===filter)) : tasks.filter(t=>t.assignedTo===emp.id);

  const addTask = () => {
    if (!form.title) return showToast("عنوان المهمة مطلوب");
    const assignee = allEmployees.find(e => e.id === Number(form.assignedTo));
    const newTask = { ...form, id: Date.now(), createdBy: emp.name, createdAt: new Date().toISOString(), assignedToName: assignee?.name || "غير محدد" };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    // إشعار
    if (assignee) {
      const notifs = storage.get(`notifications_${assignee.id}`, []);
      storage.set(`notifications_${assignee.id}`, [{ id:Date.now(), type:"مهمة", title:"📋 مهمة جديدة", body:form.title, timestamp:new Date().toISOString(), read:false }, ...notifs]);
    }
    setShowForm(false); setForm({ title:"", desc:"", assignedTo:"", priority:"متوسطة", dueDate:"", status:"معلقة" });
    showToast("✅ تم إضافة المهمة"); playAlert("notification");
  };

  const updateStatus = (id, status) => {
    setTasks(tasks.map(t => t.id===id ? { ...t, status } : t));
    showToast(`✅ تم تحديث الحالة`);
  };

  const deleteTask = async (id) => {
    if (await confirm("هل تريد حذف هذه المهمة؟", { danger: true, ok: "حذف", title: "حذف المهمة" })) { setTasks(tasks.filter(t=>t.id!==id)); showToast("تم حذف المهمة", "success"); }
  };

  const priorityColor = (p) => p==="عالية"?"bg-red-100 text-red-700":p==="متوسطة"?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700";
  const statusColor = (s) => s==="مكتملة"?"bg-emerald-100 text-emerald-700":s==="قيد التنفيذ"?"bg-blue-100 text-blue-700":"bg-slate-100 text-slate-700";

  const overdue = tasks.filter(t => t && t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "مكتملة");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">نظام المهام</h3>
        <div className="flex gap-2">
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="input rounded-xl px-3 py-2 text-sm"><option>الكل</option>{TASK_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
          <button onClick={()=>exportCSV(tasks.map(t=>({العنوان:t.title,الوصف:t.desc||"",المكلف:t.assignedToName,الأولوية:t.priority,الحالة:t.status,الاستحقاق:t.dueDate||"",بواسطة:t.createdBy})),"المهام")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> CSV</button>
          {isAdmin && <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 px-3 py-2 rounded-xl"><Plus size={13}/> مهمة جديدة</button>}
        </div>
      </div>

      {overdue.length > 0 && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-600 shrink-0"/><p className="text-xs font-bold text-red-800">{overdue.length} مهمة متأخرة: {overdue.filter(Boolean).map(t=>t?.title||"").filter(Boolean).join(" • ")}</p></div>}

      {showForm && isAdmin && (
        <div className="card rounded-2xl border-2 border-emerald-200 p-5">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان المهمة *" className="input rounded-xl px-3 py-2 text-sm col-span-2"/>
            <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} placeholder="تفاصيل المهمة" className="input rounded-xl px-3 py-2 text-sm col-span-2"/>
            <select value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} className="input rounded-xl px-3 py-2 text-sm"><option value="">-- تعيين لـ --</option>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}</select>
            <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input rounded-xl px-3 py-2 text-sm">{TASK_PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">تاريخ الاستحقاق</label><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="input rounded-xl px-3 py-2 text-sm w-full"/></div>
          </div>
          <div className="flex gap-2 justify-end mt-4"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={addTask} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl"><Save size={13}/> إضافة</button></div>
        </div>
      )}

      <div className="space-y-3">{displayed.length===0?<div className="card rounded-2xl p-8 text-center border-color border"><CheckSquare size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد مهام</p></div>:
        displayed.map(t=>(<div key={t.id} className={`card rounded-2xl border p-4 ${new Date(t.dueDate)<new Date()&&t.status!=="مكتملة"?"border-red-200":"border-color"}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1"><div className="flex flex-wrap gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColor(t.priority)}`}>{t.priority}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(t.status)}`}>{t.status}</span>
              {t.dueDate && new Date(t.dueDate) < new Date() && t.status!=="مكتملة" && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">متأخرة</span>}
            </div>
            <p className="font-bold">{t.title}</p>
            {t.desc && <p className="text-xs text-secondary mt-1">{t.desc}</p>}
            <div className="flex gap-3 text-[10px] text-secondary mt-2">
              <span>👤 <EmpPopover emp={allEmployees.find(e=>e.id===Number(t.assignedTo))}>{t.assignedToName}</EmpPopover></span>
              {t.dueDate && <span>📅 {t.dueDate}</span>}
              <span>بواسطة {t.createdBy}</span>
            </div></div>
            <div className="flex gap-1 mr-2">
              {t.status === "معلقة" && <button onClick={()=>updateStatus(t.id,"قيد التنفيذ")} className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px]">بدء</button>}
              {t.status === "قيد التنفيذ" && <button onClick={()=>updateStatus(t.id,"مكتملة")} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px]">إكمال</button>}
              {isAdmin && <button onClick={()=>deleteTask(t.id)} className="p-1 text-red-400"><Trash2 size={12}/></button>}
            </div>
          </div></div>))}</div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== التقييم الشهري الجماعي ==========

const BULK_RATINGS = ["متوسط","جيد","جيد جدا","ممتاز"];
const BULK_REQ = {متوسط:5,جيد:20,"جيد جدا":40,ممتاز:35};
const BULK_RCOLOR = {متوسط:"bg-red-100 text-red-700",جيد:"bg-amber-100 text-amber-700","جيد جدا":"bg-blue-100 text-blue-700",ممتاز:"bg-emerald-100 text-emerald-700"};
const BULK_DEPT = "شعبة سيطرة مستودع الفاو والمرافئ";

function BulkEvaluationPanel({ emp, allEmployees }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [ratings, setRatings] = useState({});
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { FirebaseAPI.loadBulkEval(selYear,selMonth).then(d=>{ setRatings(d?.ratings||{}); }); }, [selYear,selMonth]);
  const setR = (id,r) => setRatings(prev=>({...prev,[id]:r}));
  const dist = BULK_RATINGS.reduce((a,r)=>({...a,[r]:Object.values(ratings).filter(x=>x===r).length}),{});
  const pct = (n) => allEmployees.length>0?Math.round(n/allEmployees.length*100):0;
  const save = async () => { const ok=await FirebaseAPI.saveBulkEval(selYear,selMonth,{ratings,savedBy:emp.name,month:selMonth,year:selYear}); showToast(ok?"✅ تم الحفظ":"⚠️ فشل الحفظ"); };
  const exportXls = async () => {
    try {
      const mod=await import("exceljs"); const ExcelJS=mod.default||mod;
      const wb=new ExcelJS.Workbook(); await wb.xlsx.load(await(await fetch("/templates/eval-monthly.xlsx")).arrayBuffer());
      const ws=wb.worksheets[0];
      ws.getCell("B2").value=" "+MONTHS_IRAQI[selMonth]+" "+selYear;
      ws.eachRow((row,rn)=>{if(rn<4)return;const jn=String(row.getCell(2).value||"").trim();if(!jn)return;const e=allEmployees.find(x=>String(x.jobNum)===jn);if(e&&ratings[e.id])row.getCell(4).value=ratings[e.id];});
      const buf=await wb.xlsx.writeBuffer(); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})); a.download=`تقييم_${MONTHS_IRAQI[selMonth]}_${selYear}.xlsx`; document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(a.href);
      showToast("✅ تم التصدير");
    } catch { showToast("⚠️ فشل التصدير"); }
  };
  const printPDF = () => {
    const rows=allEmployees.map((e,i)=>`<tr><td>${i+1}</td><td>${e.jobNum}</td><td>${e.name}</td><td>${BULK_DEPT}</td><td>${ratings[e.id]||"—"}</td></tr>`).join("");
    const w=window.open("","_blank"); w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/><title>تقييم</title><style>body{font-family:Arial;padding:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #000;padding:6px;text-align:right}h2,h3{text-align:center}th{background:#e8e8e8}</style></head><body><h2>شركة نفط البصرة</h2><h3>التقييم الشهري — ${MONTHS_IRAQI[selMonth]} ${selYear}</h3><table><thead><tr><th>ت</th><th>الرقم الوظيفي</th><th>اسم الموظف</th><th>الشعبة</th><th>التقييم</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close();w.focus();setTimeout(()=>w.print(),400);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2"><select value={selMonth} onChange={e=>setSelMonth(+e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select><select value={selYear} onChange={e=>setSelYear(+e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select></div>
        <div className="flex gap-2"><button onClick={save} className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 px-3 py-2 rounded-xl"><Save size={13}/>حفظ</button><button onClick={exportXls} className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 px-3 py-2 rounded-xl"><Download size={13}/>Excel</button><button onClick={printPDF} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Star size={13}/>PDF</button></div>
      </div>
      <div className="grid grid-cols-4 gap-2">{BULK_RATINGS.map(r=><div key={r} className={`rounded-xl p-2 text-center text-xs ${BULK_RCOLOR[r]}`}><p className="font-bold text-lg">{dist[r]}</p><p className="font-bold">{r}</p><p className="text-[10px]">{pct(dist[r])}% / مطلوب {BULK_REQ[r]}%</p></div>)}</div>
      <div className="card rounded-2xl border border-color overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm" dir="rtl"><thead><tr className="bg-gray-50 border-b border-color"><th className="px-3 py-2 text-right font-semibold">ت</th><th className="px-3 py-2 text-right font-semibold">الرقم</th><th className="px-3 py-2 text-right font-semibold">الموظف</th><th className="px-3 py-2 text-center font-semibold">التقييم</th></tr></thead>
        <tbody>{allEmployees.map((e,i)=>(<tr key={e.id} className="border-b border-color"><td className="px-3 py-2 text-secondary text-xs">{i+1}</td><td className="px-3 py-2 font-mono text-secondary text-xs">{e.jobNum}</td><td className="px-3 py-2 font-medium">{e.name}</td><td className="px-3 py-2 text-center"><select value={ratings[e.id]||""} onChange={ev=>setR(e.id,ev.target.value)} className="input text-xs rounded-lg px-2 py-1"><option value="">—</option>{BULK_RATINGS.map(r=><option key={r}>{r}</option>)}</select></td></tr>))}</tbody></table></div></div>
      {toast&&<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== التقييم الشهري الفردي ==========

function EvaluationSystem({ emp, isAdmin, allEmployees }) {
  const [evalTab, setEvalTab] = useState(isAdmin ? "bulk" : "individual");
  const [evals, setEvals] = useState(() => storage.get("evaluations", []));
  const [showForm, setShowForm] = useState(false);
  const [selEmp, setSelEmp] = useState("");
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [scores, setScores] = useState(Object.fromEntries(EVAL_CRITERIA.map(c=>[c,3])));
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("evaluations", evals); FirebaseAPI.saveEvaluations(evals); }, [evals]);
  useEffect(() => {
    FirebaseAPI.loadEvaluations().then(list => { if (list && list.length > 0) { setEvals(list); storage.set("evaluations", list); } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveEval = () => {
    if (!selEmp) return showToast("اختر الموظف");
    const emp2 = allEmployees.find(e=>e.id===Number(selEmp));
    const total = Math.round(Object.values(scores).reduce((s,v)=>s+v,0) / EVAL_CRITERIA.length * 20);
    const newEval = { id:Date.now(), empId:Number(selEmp), empName:emp2?.name, month:selMonth, year:selYear, scores:{...scores}, total, notes, evaluatedBy:emp.name, createdAt:new Date().toISOString() };
    setEvals([newEval, ...evals.filter(e=>!(e.empId===Number(selEmp)&&e.month===selMonth&&e.year===selYear))]);
    setShowForm(false); showToast("✅ تم حفظ التقييم");
    FirebaseAPI.loadBulkEval(selYear,selMonth).then(d=>{FirebaseAPI.saveBulkEval(selYear,selMonth,{...(d||{}),ratings:{...(d?.ratings||{}),[Number(selEmp)]:total>=90?"ممتاز":total>=75?"جيد جدا":total>=60?"جيد":"متوسط"},month:selMonth,year:selYear});});
  };

  const myEvals = isAdmin ? evals : evals.filter(e=>e.empId===emp.id);
  const gradeLabel = (s) => s>=90?"ممتاز":s>=75?"جيد جداً":s>=60?"جيد":s>=50?"مقبول":"ضعيف";
  const gradeColor = (s) => s>=90?"text-emerald-600":s>=75?"text-blue-600":s>=60?"text-amber-600":"text-red-600";

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex gap-1 border-b border-color pb-0 -mb-2">
          <button onClick={()=>setEvalTab("bulk")} className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${evalTab==="bulk"?"border-indigo-600 text-indigo-700":"border-transparent text-secondary hover:text-primary"}`}>📊 التقييم الجماعي</button>
          <button onClick={()=>setEvalTab("individual")} className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${evalTab==="individual"?"border-indigo-600 text-indigo-700":"border-transparent text-secondary hover:text-primary"}`}>⭐ التقييمات الفردية</button>
        </div>
      )}

      {isAdmin && evalTab==="bulk" && <BulkEvaluationPanel emp={emp} allEmployees={allEmployees}/>}

      {(!isAdmin || evalTab==="individual") && (<>
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">التقييم الشهري</h3>
        {isAdmin && <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 px-3 py-2 rounded-xl"><Plus size={13}/> تقييم جديد</button>}
      </div>

      {showForm && isAdmin && (
        <div className="card rounded-2xl border-2 border-indigo-200 p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <select value={selEmp} onChange={e=>setSelEmp(e.target.value)} className="input rounded-xl px-3 py-2 text-sm"><option value="">-- اختر موظفاً --</option>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}</select>
            <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
            <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
          </div>
          <div className="space-y-3">
            {EVAL_CRITERIA.map(c => (<div key={c} className="flex items-center gap-3">
              <span className="text-sm flex-1">{c}</span>
              <div className="flex gap-1">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setScores({...scores,[c]:n})} className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${scores[c]>=n?"bg-indigo-600 text-white":"border border-color"}`}>{n}</button>)}</div>
            </div>))}
          </div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="ملاحظات التقييم" className="input rounded-xl px-3 py-2 text-sm w-full"/>
          <div className="flex gap-2 justify-end"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveEval} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl"><Save size={13}/> حفظ التقييم</button></div>
        </div>
      )}

      <div className="space-y-3">{myEvals.length===0?<div className="card rounded-2xl p-8 text-center border-color border"><Star size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد تقييمات</p></div>:
        myEvals.map(ev=>(<div key={ev.id} className="card rounded-2xl border-color border p-4">
          <div className="flex justify-between items-start">
            <div><p className="font-bold">{ev.empName}</p><p className="text-xs text-secondary">{MONTHS_IRAQI[ev.month]} {ev.year} — بواسطة {ev.evaluatedBy}</p>
              {ev.notes && <p className="text-xs text-secondary mt-1 italic">{ev.notes}</p>}
              <div className="flex flex-wrap gap-2 mt-2">{EVAL_CRITERIA.map(c=><span key={c} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{c}: {ev.scores[c]}/5</span>)}</div>
            </div>
            <div className="text-center"><p className={`text-3xl font-bold ${gradeColor(ev.total)}`}>{ev.total}%</p><p className={`text-xs font-bold ${gradeColor(ev.total)}`}>{gradeLabel(ev.total)}</p></div>
          </div></div>))}</div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
      </>)}
    </div>
  );
}

export default AttendanceSystem;
export { TrainingSystem, TasksSystem, EvaluationSystem };
