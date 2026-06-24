import React, { useState } from "react";
import { Save, CheckCircle, Plus, Trash2, Edit3, X, Search, Send, Wrench } from "lucide-react";
import { EQ_TYPES, EQ_STATUS_COLORS } from "../constants";
import { useToast } from "../contexts";

// ── لوحة تفاصيل المعدة ──
export function EqDetailPanel({ eq, records, canManage, onEdit, onDelete, onRequestMaint, onChangeStatus, onComplete }) {
  const [histTab, setHistTab] = useState("info");
  const openRecs = records.filter(r=>r.status!=="مكتملة");
  const doneRecs = records.filter(r=>r.status==="مكتملة");
  return (
    <div className="card rounded-2xl border border-color overflow-hidden">
      {/* header */}
      <div className={`p-4 ${eq.status==="جيد"?"bg-emerald-50":eq.status==="معطل"?"bg-red-50":eq.status==="تحت صيانة"?"bg-sky-50":"bg-amber-50"}`}>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-bold text-sm leading-snug">{eq.name}</h3>
          {canManage && (
            <div className="flex gap-1">
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/60 text-blue-600"><Edit3 size={13}/></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-white/60 text-red-500"><Trash2 size={13}/></button>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${EQ_STATUS_COLORS[eq.status]}`}>{eq.status}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${EQ_TYPES[eq.type]?.badge||"bg-gray-100"}`}>{EQ_TYPES[eq.type]?.label||eq.type}</span>
          {eq.critical && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">حرجة</span>}
        </div>
      </div>
      {/* sub-tabs */}
      <div className="flex border-b border-color text-xs">
        {[["info","المعلومات"],["hist","السجل"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setHistTab(id)}
            className={`flex-1 py-2 font-bold transition-colors ${histTab===id?"border-b-2 border-blue-600 text-blue-600":"text-secondary"}`}>{lbl}</button>
        ))}
      </div>
      {/* info */}
      {histTab === "info" && (
        <div className="p-4 space-y-2 text-sm">
          {[
            ["الرمز",        eq.id],
            ["الطاقة",       eq.capacity],
            ["الموقع",       eq.location],
            ["الشركة المصنعة",eq.manufacturer],
            ["الموديل",      eq.model],
            ["سنة التركيب",  eq.yearInstalled],
            ["آخر صيانة",    eq.lastMaintenance],
            ["الصيانة القادمة",eq.nextMaintenance],
            ["عدد العطلات",  eq.totalFailures],
          ].map(([lbl,val])=> val ? (
            <div key={lbl} className="flex gap-2">
              <span className="text-secondary text-xs font-bold w-28 shrink-0">{lbl}:</span>
              <span className={`text-xs ${lbl==="عدد العطلات"&&eq.totalFailures>2?"text-red-600 font-bold":""}`}>{val}</span>
            </div>
          ) : null)}
          {eq.notes && <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-100">📝 {eq.notes}</div>}
          {/* status change */}
          <div className="pt-2 border-t border-color">
            <p className="text-xs font-bold text-secondary mb-1.5">تغيير الحالة:</p>
            <div className="flex flex-wrap gap-1">
              {["جيد","تحتاج صيانة","تحت صيانة","معطل"].filter(s=>s!==eq.status).map(s=>(
                <button key={s} onClick={()=>onChangeStatus(eq.id,s)}
                  className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-colors ${EQ_STATUS_COLORS[s]}`}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={onRequestMaint} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold mt-2 flex items-center justify-center gap-2">
            <Wrench size={14}/> طلب صيانة
          </button>
        </div>
      )}
      {/* history */}
      {histTab === "hist" && (
        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {records.length === 0 && <p className="text-xs text-secondary text-center py-6">لا يوجد سجل صيانة</p>}
          {openRecs.map(r=>(
            <div key={r.id} className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-bold">{r.type}</span>
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">قيد التنفيذ</span>
              </div>
              <p className="text-secondary">{r.description}</p>
              <p className="text-secondary mt-1">{new Date(r.requestedAt).toLocaleDateString("ar-IQ")}</p>
            </div>
          ))}
          {doneRecs.map(r=>(
            <div key={r.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-bold">{r.type}</span>
                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">مكتملة</span>
              </div>
              <p className="text-secondary">{r.description}</p>
              <p className="text-secondary mt-1">{r.completedAt ? new Date(r.completedAt).toLocaleDateString("ar-IQ") : "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── تبويب الصيانة ──
export function EqMaintenanceTab({ records, equipment, onComplete, onRequest }) {
  const [subTab, setSubTab] = useState("open");
  const [form, setForm]     = useState({ eqId:"", desc:"", type:"دورية" });
  const addToast = useToast();
  const open = records.filter(r=>r.status!=="مكتملة");
  const done = records.filter(r=>r.status==="مكتملة");

  const submit = () => {
    if (!form.eqId || !form.desc.trim()) { addToast("يرجى تحديد المعدة والوصف","warning"); return; }
    onRequest(form.eqId, form.desc, form.type);
    setForm({ eqId:"", desc:"", type:"دورية" });
    setSubTab("open");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {[["open",`طلبات مفتوحة (${open.length})`],["add","طلب جديد"],["done",`مكتملة (${done.length})`]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setSubTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${subTab===id?"bg-blue-600 text-white border-blue-600":"btn-secondary border-color"}`}>{lbl}</button>
        ))}
      </div>

      {subTab === "add" && (
        <div className="card rounded-2xl border border-color p-5">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Wrench size={15}/> طلب صيانة جديد</h4>
          <div className="space-y-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">المعدة *</label>
              <select value={form.eqId} onChange={e=>setForm({...form,eqId:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                <option value="">— اختر المعدة —</option>
                {equipment.map(eq=><option key={eq.id} value={eq.id}>{eq.name} ({eq.id})</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نوع الصيانة</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {["دورية","طارئة","وقائية","إصلاح عطل","تفتيش"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-bold text-secondary mb-1">وصف العمل / العطل *</label>
              <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={3} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="اشرح طبيعة العمل أو وصف العطل..."/></div>
          </div>
          <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-color">
            <button onClick={()=>setSubTab("open")} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> تسجيل الطلب</button>
          </div>
        </div>
      )}

      {subTab === "open" && (
        <div className="space-y-3">
          {open.length === 0 && <div className="text-center py-10 text-secondary"><CheckCircle size={32} className="mx-auto mb-2 text-emerald-400 opacity-60"/><p className="text-sm">لا توجد طلبات صيانة مفتوحة</p></div>}
          {open.map(r=>(
            <div key={r.id} className="card rounded-xl border border-color p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-sm">{r.equipmentName}</p>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{r.type}</span>
                    <span className="text-[10px] text-secondary">{new Date(r.requestedAt).toLocaleDateString("ar-IQ")}</span>
                  </div>
                </div>
                <button onClick={()=>onComplete(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shrink-0">
                  <CheckCircle size={12}/> إكمال
                </button>
              </div>
              <p className="text-xs text-secondary">{r.description}</p>
            </div>
          ))}
        </div>
      )}

      {subTab === "done" && (
        <div className="card rounded-2xl border border-color overflow-hidden">
          {done.length === 0 ? <p className="text-center py-8 text-secondary text-sm">لا توجد سجلات مكتملة</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-color bg-hover text-xs">
                  <th className="p-3 text-right">المعدة</th><th className="p-3 text-right">النوع</th>
                  <th className="p-3 text-right">الوصف</th><th className="p-3 text-right">تاريخ الإكمال</th>
                </tr></thead>
                <tbody>
                  {done.map(r=>(
                    <tr key={r.id} className="border-t border-color hover:bg-hover">
                      <td className="p-3 font-bold text-xs">{r.equipmentName}</td>
                      <td className="p-3"><span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">{r.type}</span></td>
                      <td className="p-3 text-xs text-secondary max-w-[200px] truncate">{r.description}</td>
                      <td className="p-3 text-xs text-secondary">{r.completedAt?new Date(r.completedAt).toLocaleDateString("ar-IQ"):"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── نموذج إضافة/تعديل معدة ──
export function EqFormModal({ onClose, onSave, initial, isEdit, existingIds=[] }) {
  const blank = { id:"", name:"", type:"OIL_TANK", capacity:"", location:"", manufacturer:"", model:"", yearInstalled:"", status:"جيد", critical:false, nextMaintenance:"", lastMaintenance:"", notes:"" };
  const [form, setForm] = useState(initial || blank);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const submit = () => {
    if (!form.name.trim()) return;
    if (!isEdit && !form.id.trim()) { form.id = `EQ-${Date.now()}`; }
    onSave(form);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="card rounded-2xl border border-color p-6 w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2"><Wrench size={18}/> {isEdit?"تعديل المعدة":"إضافة معدة جديدة"}</h3>
          <button onClick={onClose} className="text-secondary hover:text-red-500"><X size={18}/></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">اسم المعدة *</label>
            <input value={form.name} onChange={e=>f("name",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم المعدة"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">رمز المعدة {!isEdit&&"*"}</label>
            <input value={form.id} onChange={e=>f("id",e.target.value)} disabled={isEdit} className="input w-full rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-60" placeholder="T-OIL-001" dir="ltr"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">فئة المعدة</label>
            <select value={form.type} onChange={e=>f("type",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm">
              {Object.entries(EQ_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الحالة</label>
            <select value={form.status} onChange={e=>f("status",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm">
              {["جيد","تحتاج صيانة","تحت صيانة","معطل"].map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الطاقة / السعة</label>
            <input value={form.capacity} onChange={e=>f("capacity",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: 500 م³/ساعة"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">سنة التركيب</label>
            <input type="number" value={form.yearInstalled} onChange={e=>f("yearInstalled",+e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="2020" dir="ltr"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الشركة المصنعة</label>
            <input value={form.manufacturer} onChange={e=>f("manufacturer",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الموديل</label>
            <input value={form.model} onChange={e=>f("model",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">آخر صيانة</label>
            <input type="date" value={form.lastMaintenance} onChange={e=>f("lastMaintenance",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الصيانة القادمة</label>
            <input type="date" value={form.nextMaintenance} onChange={e=>f("nextMaintenance",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">الموقع</label>
            <input value={form.location} onChange={e=>f("location",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: محطة الضخ الرئيسية"/></div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">ملاحظات</label>
            <textarea value={form.notes} onChange={e=>f("notes",e.target.value)} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none"/></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="crit" checked={form.critical} onChange={e=>f("critical",e.target.checked)} className="w-4 h-4"/>
            <label htmlFor="crit" className="text-sm font-bold cursor-pointer">معدة حرجة</label>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-color">
          <button onClick={onClose} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
          <button onClick={submit} disabled={!form.name.trim()} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            <Save size={14}/> {isEdit?"حفظ التعديل":"إضافة المعدة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── مودال طلب صيانة ──
export function EqRequestModal({ eq, onClose, onSubmit }) {
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("دورية");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="card rounded-2xl border border-color p-6 w-full max-w-md shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><Wrench size={16}/> طلب صيانة</h3>
          <button onClick={onClose} className="text-secondary hover:text-red-500"><X size={16}/></button>
        </div>
        <p className="text-sm font-bold mb-4 text-blue-700">{eq.name} — {eq.id}</p>
        <div className="space-y-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">نوع الصيانة</label>
            <select value={type} onChange={e=>setType(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm">
              {["دورية","طارئة","وقائية","إصلاح عطل","تفتيش"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وصف العمل / العطل *</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="صف طبيعة العمل أو العطل..."/></div>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-color">
          <button onClick={onClose} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
          <button onClick={()=>desc.trim()&&onSubmit(desc,type)} disabled={!desc.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            <Send size={14}/> تسجيل الطلب
          </button>
        </div>
      </div>
    </div>
  );
}
