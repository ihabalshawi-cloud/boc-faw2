import React, { useState } from "react";
import { Save, Plus, Trash2, Edit3, Layers, FileText, FileCheck, Briefcase, X } from "lucide-react";
import { useToast, useConfirm } from "../contexts";

const PHASE_STATUSES = ["مكتملة","قيد التنفيذ","لم تبدأ","متأخرة"];
const PHASE_STATUS_COLORS = {"مكتملة":"bg-emerald-100 text-emerald-700","قيد التنفيذ":"bg-blue-100 text-blue-700","لم تبدأ":"bg-gray-100 text-gray-600","متأخرة":"bg-red-100 text-red-700"};
const PROJ_STATUSES = ["قيد التنفيذ","مكتمل","متوقف","قيد التخطيط"];
const PROJ_PRIORITIES = ["عالي","متوسط","منخفض"];
const INSP_RESULTS = ["ناجح","فاشل","يحتاج متابعة"];
const INSP_RESULT_COLORS = {"ناجح":"bg-emerald-100 text-emerald-700","فاشل":"bg-red-100 text-red-700","يحتاج متابعة":"bg-amber-100 text-amber-700"};

export function PhasesTab({ proj, addPhase, editPhase, delPhase }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", status:"لم تبدأ", progress:0, startDate:"", endDate:"", responsible:"" });
  const addToast = useToast();
  const confirm = useConfirm();

  const resetForm = () => setForm({ name:"", status:"لم تبدأ", progress:0, startDate:"", endDate:"", responsible:"" });

  const submitAdd = () => {
    if (!form.name.trim()) return;
    addPhase(proj.id, form); resetForm(); setShowAdd(false); addToast("تمت إضافة المرحلة","success");
  };
  const submitEdit = () => {
    if (!form.name.trim()) return;
    editPhase(proj.id, editId, form); setEditId(null); addToast("تم حفظ التعديل","success");
  };
  const startEdit = (ph) => { setEditId(ph.id); setForm({ name:ph.name, status:ph.status, progress:ph.progress, startDate:ph.startDate, endDate:ph.endDate, responsible:ph.responsible }); setShowAdd(false); };
  const doDelete = async (phId) => {
    if (await confirm("حذف هذه المرحلة؟", { title:"حذف المرحلة", ok:"حذف" })) { delPhase(proj.id, phId); addToast("تم الحذف","info"); }
  };

  const FormRow = ({ label, children }) => (
    <div><label className="block text-xs font-bold text-secondary mb-1">{label}</label>{children}</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><Layers size={16}/> مراحل المشروع</h3>
        <button onClick={()=>{ setShowAdd(!showAdd); setEditId(null); resetForm(); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> مرحلة جديدة
        </button>
      </div>

      {(showAdd || editId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget){setShowAdd(false);setEditId(null);}}}>
          <div className="card rounded-2xl w-full max-w-lg shadow-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm">{editId ? "تعديل المرحلة" : "مرحلة جديدة"}</h4>
              <button onClick={()=>{setShowAdd(false);setEditId(null);}} className="text-secondary hover:text-red-500"><X size={15}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormRow label="اسم المرحلة">
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: تركيب الأنابيب"/>
              </FormRow>
              <FormRow label="المسؤول">
                <input value={form.responsible} onChange={e=>setForm({...form,responsible:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم المسؤول"/>
              </FormRow>
              <FormRow label="الحالة">
                <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                  {PHASE_STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </FormRow>
              <FormRow label="نسبة الإنجاز %">
                <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
              </FormRow>
              <FormRow label="تاريخ البدء">
                <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
              </FormRow>
              <FormRow label="تاريخ الانتهاء">
                <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
              </FormRow>
            </div>
            <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
              <button onClick={()=>{ setShowAdd(false); setEditId(null); }} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
              <button onClick={editId ? submitEdit : submitAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> {editId?"حفظ":"إضافة"}</button>
            </div>
          </div>
        </div>
      )}

      {(proj.phases||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><Layers size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد مراحل بعد</p></div>
      )}

      <div className="space-y-3">
        {(proj.phases||[]).map(ph => (
          <div key={ph.id} className={`card rounded-xl border p-4 transition-all ${editId===ph.id?"border-blue-400":"border-color"}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{ph.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PHASE_STATUS_COLORS[ph.status]}`}>{ph.status}</span>
                </div>
                <div className="text-xs text-secondary mt-0.5">{ph.responsible} · {ph.startDate} — {ph.endDate}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>startEdit(ph)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit3 size={14}/></button>
                <button onClick={()=>doDelete(ph.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${ph.status==="مكتملة"?"bg-emerald-500":ph.status==="قيد التنفيذ"?"bg-blue-500":ph.status==="متأخرة"?"bg-red-500":"bg-gray-300"}`}
                  style={{width:`${ph.progress}%`}}/>
              </div>
              <span className="text-sm font-bold w-10 text-left">{ph.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsTab({ proj, addReport, delReport, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], author: emp.name, work:"", issues:"لا توجد", progress: proj.progress });
  const addToast = useToast();
  const confirm = useConfirm();

  const submit = () => {
    if (!form.work.trim()) return;
    addReport(proj.id, form); setShowAdd(false); setForm({ date:new Date().toISOString().split("T")[0], author:emp.name, work:"", issues:"لا توجد", progress:proj.progress });
    addToast("تم إضافة التقرير","success");
  };
  const doDelete = async (rId) => {
    if (await confirm("حذف هذا التقرير؟", { title:"حذف التقرير", ok:"حذف" })) { delReport(proj.id, rId); addToast("تم الحذف","info"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FileText size={16}/> التقارير اليومية</h3>
        <button onClick={()=>setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> تقرير جديد
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div className="card rounded-2xl w-full max-w-lg shadow-2xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm">تقرير يومي جديد</h4>
              <button onClick={()=>setShowAdd(false)} className="text-secondary hover:text-red-500"><X size={15}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold text-secondary mb-1">التاريخ</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
              <div><label className="block text-xs font-bold text-secondary mb-1">اسم المُعِد</label>
                <input value={form.author} onChange={e=>setForm({...form,author:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
              <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">الأعمال المنجزة اليوم</label>
                <textarea value={form.work} onChange={e=>setForm({...form,work:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="صف الأعمال المنجزة اليوم..."/></div>
              <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">الملاحظات والعقبات</label>
                <textarea value={form.issues} onChange={e=>setForm({...form,issues:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="اكتب لا توجد إذا لم تكن هناك عقبات"/></div>
              <div><label className="block text-xs font-bold text-secondary mb-1">نسبة الإنجاز الكلية % (تحديث)</label>
                <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            </div>
            <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
              <button onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
              <button onClick={submit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ التقرير</button>
            </div>
          </div>
        </div>
      )}

      {(proj.reports||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FileText size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد تقارير يومية بعد</p></div>
      )}

      <div className="space-y-3">
        {[...(proj.reports||[])].reverse().map(r => (
          <div key={r.id} className="card rounded-xl border border-color p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{r.date}</span>
                  <span className="text-xs text-secondary">· {r.author}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">إنجاز: {r.progress}%</span>
                </div>
              </div>
              <button onClick={()=>doDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
            </div>
            <div className="space-y-1.5 text-sm">
              <div><span className="font-bold text-secondary text-xs">الأعمال المنجزة: </span><span>{r.work}</span></div>
              <div><span className="font-bold text-secondary text-xs">الملاحظات والعقبات: </span><span className={r.issues==="لا توجد"?"text-emerald-600 text-xs":"text-amber-600 text-xs"}>{r.issues}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AddProjectModal({ onClose, onAdd, existingIds }) {
  const [form, setForm] = useState({ name:"", status:"قيد التخطيط", priority:"متوسط", manager:"", budget:"", spent:"0", progress:"0", startDate:new Date().toISOString().split("T")[0], endDate:"", desc:"" });
  const submit = () => {
    if (!form.name.trim()) return;
    const newId = `P${String(existingIds.length+1).padStart(3,"0")}`;
    const usedId = existingIds.includes(newId) ? `P${Date.now()}` : newId;
    onAdd({ ...form, id:usedId, budget:+form.budget||0, spent:+form.spent||0, progress:+form.progress||0, team:form.manager?[form.manager]:[], phases:[], reports:[], docs:[], inspections:[] });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="card rounded-2xl border border-color p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Briefcase size={18}/> مشروع جديد</h3>
          <button onClick={onClose} className="text-secondary hover:text-red-500"><X size={18}/></button>
        </div>
        <div className="space-y-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">اسم المشروع *</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم المشروع"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">مدير المشروع</label>
            <input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم مدير المشروع"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">الحالة</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {PROJ_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">الأولوية</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {PROJ_PRIORITIES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ البدء</label>
              <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الانتهاء</label>
              <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">الميزانية ($)</label>
              <input type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr" placeholder="0"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نسبة الإنجاز %</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="0"/></div>
          </div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وصف المشروع</label>
            <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="وصف مختصر للمشروع..."/></div>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-color">
          <button onClick={onClose} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
          <button onClick={submit} disabled={!form.name.trim()} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50"><Plus size={14}/> إنشاء المشروع</button>
        </div>
      </div>
    </div>
  );
}

export function InspectionsTab({ proj, addInsp, delInsp, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date:new Date().toISOString().split("T")[0], inspector:emp.name, section:"", result:"ناجح", notes:"" });
  const addToast = useToast();
  const confirm = useConfirm();

  const submit = () => {
    if (!form.section.trim()) return;
    addInsp(proj.id, form); setShowAdd(false); setForm({ date:new Date().toISOString().split("T")[0], inspector:emp.name, section:"", result:"ناجح", notes:"" });
    addToast("تم تسجيل الفحص","success");
  };
  const doDelete = async (iId) => {
    if (await confirm("حذف هذا الفحص؟", { title:"حذف الفحص", ok:"حذف" })) { delInsp(proj.id, iId); addToast("تم الحذف","info"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FileCheck size={16}/> سجل الفحوصات</h3>
        <button onClick={()=>setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> فحص جديد
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div className="card rounded-2xl w-full max-w-lg shadow-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm">تسجيل فحص جديد</h4>
              <button onClick={()=>setShowAdd(false)} className="text-secondary hover:text-red-500"><X size={15}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الفحص</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
              <div><label className="block text-xs font-bold text-secondary mb-1">المفتش</label>
                <input value={form.inspector} onChange={e=>setForm({...form,inspector:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
              <div><label className="block text-xs font-bold text-secondary mb-1">القسم / الموقع المفحوص</label>
                <input value={form.section} onChange={e=>setForm({...form,section:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: قسم A — الوصلات"/></div>
              <div><label className="block text-xs font-bold text-secondary mb-1">نتيجة الفحص</label>
                <select value={form.result} onChange={e=>setForm({...form,result:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                  {INSP_RESULTS.map(r=><option key={r}>{r}</option>)}</select></div>
              <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">ملاحظات الفحص</label>
                <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="ملاحظات ونتائج الفحص..."/></div>
            </div>
            <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
              <button onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
              <button onClick={submit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ الفحص</button>
            </div>
          </div>
        </div>
      )}

      {(proj.inspections||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FileCheck size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد فحوصات مسجلة بعد</p></div>
      )}

      <div className="space-y-3">
        {[...(proj.inspections||[])].reverse().map(insp => (
          <div key={insp.id} className="card rounded-xl border border-color p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{insp.section}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${INSP_RESULT_COLORS[insp.result]}`}>{insp.result}</span>
              </div>
              <button onClick={()=>doDelete(insp.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
            </div>
            <div className="text-xs text-secondary mb-1">{insp.date} · {insp.inspector}</div>
            {insp.notes && <p className="text-sm text-primary">{insp.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
