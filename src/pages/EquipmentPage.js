import React, { useState, useEffect } from "react";
import { AlertCircle, Save, CheckCircle, Clock, Calendar, Plus, Trash2, Edit3, X,
  BarChart, Download, Search, AlertTriangle, Send, Wrench, Box, TrendingUp, TrendingDown } from "lucide-react";
import { EQ_TYPES, EQ_STATUS_COLORS, INITIAL_EQUIPMENT, INITIAL_MAINT_SPARE_PARTS } from "../constants";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { SVGPieChart } from "../components/Charts";

function EquipmentMaintenance({ emp, isAdmin }) {
  // إضافة/حذف/تعديل مواصفات المعدات من قبل المشرف العام فقط
  const canManage = isAdmin;
  const [equipment, setEquipmentState] = useState(() => storage.get("equipment", INITIAL_EQUIPMENT));
  const [records,   setRecords]   = useState(() => storage.get("maintenance_records", []));
  const [tab,       setTab]       = useState("dashboard");
  const [selId,     setSelId]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [typeFilter,setTypeFilter]= useState("الكل");
  const [stFilter,  setStFilter]  = useState("الكل");
  const [showAdd,   setShowAdd]   = useState(false);
  const [editEq,    setEditEq]    = useState(null);
  const [showReqForm, setShowReqForm] = useState(false);
  const addToast = useToast();
  const confirm  = useConfirm();

  // أي تعديل يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const saveEq = (updated) => {
    setEquipmentState(updated);
    storage.set("equipment", updated);
    FirebaseAPI.saveEquipmentList(updated);
  };
  const saveRec = (updated) => { setRecords(updated);   storage.set("maintenance_records", updated); };
  useEffect(() => {
    FirebaseAPI.loadEquipmentList().then(list => {
      if (list) { setEquipmentState(list); storage.set("equipment", list); }
    });
  }, []);

  const sel = equipment.find(e => e.id === selId);

  // ── derived stats ──
  const byStatus = (s) => equipment.filter(e => e.status === s).length;
  const byType   = (t) => equipment.filter(e => e.type === t).length;
  const openRecs  = records.filter(r => r.status !== "مكتملة");
  const today     = new Date();
  const upcoming  = equipment.filter(e => {
    if (!e.nextMaintenance) return false;
    const diff = (new Date(e.nextMaintenance) - today) / 86400000;
    return diff >= 0 && diff <= 45 && e.status === "جيد";
  }).sort((a,b) => new Date(a.nextMaintenance)-new Date(b.nextMaintenance));
  const overdue   = equipment.filter(e => e.nextMaintenance && new Date(e.nextMaintenance) < today && e.status !== "معطل" && e.status !== "تحت صيانة");

  // ── filtered list ──
  const filtered = equipment.filter(e =>
    (e.name.includes(search) || e.id.includes(search) || (e.location||"").includes(search)) &&
    (typeFilter === "الكل" || e.type === typeFilter) &&
    (stFilter   === "الكل" || e.status === stFilter)
  );

  // ── CRUD equipment (المشرف العام فقط) ──
  const addEquipment = (form) => {
    if (!canManage) return;
    const newId = form.id || `EQ-${Date.now()}`;
    saveEq([...equipment, { ...form, id:newId, totalFailures:0 }]);
    setShowAdd(false); addToast("تم إضافة المعدة", "success");
  };
  const updateEquipment = (id, changes) => {
    if (!canManage) return;
    saveEq(equipment.map(e => e.id === id ? { ...e, ...changes } : e));
    setEditEq(null); addToast("تم حفظ التعديل", "success");
  };
  const deleteEquipment = async (id) => {
    if (!canManage) return;
    if (await confirm("هل تريد حذف هذه المعدة نهائياً؟", { title:"حذف المعدة", ok:"حذف", danger:true })) {
      saveEq(equipment.filter(e => e.id !== id));
      if (selId === id) setSelId(null);
      addToast("تم الحذف", "info");
    }
  };

  // ── maintenance ──
  const requestMaintenance = (eqId, desc, type) => {
    const eq = equipment.find(e => e.id === eqId);
    if (!eq) return;
    const rec = { id:`REC-${Date.now()}`, equipmentId:eqId, equipmentName:eq.name, eqType:eq.type, type, description:desc, status:"قيد التنفيذ", requestedAt:new Date().toISOString() };
    saveRec([rec, ...records]);
    saveEq(equipment.map(e => e.id === eqId ? { ...e, status:"تحت صيانة", totalFailures:(e.totalFailures||0)+1 } : e));
    setShowReqForm(false); addToast("تم تسجيل طلب الصيانة", "success");
  };
  const completeMaintenance = (recId, intervalDays = 90) => {
    const rec = records.find(r => r.id === recId); if (!rec) return;
    const now = new Date();
    const next = new Date(now.getTime() + intervalDays*86400000);
    saveEq(equipment.map(e => e.id === rec.equipmentId ? { ...e, status:"جيد", lastMaintenance:now.toISOString().slice(0,10), nextMaintenance:next.toISOString().slice(0,10) } : e));
    saveRec(records.map(r => r.id === recId ? { ...r, status:"مكتملة", completedAt:now.toISOString() } : r));
    addToast("تم إكمال الصيانة بنجاح ✓", "success");
  };
  const changeStatus = (eqId, newStatus) => {
    saveEq(equipment.map(e => e.id === eqId ? { ...e, status:newStatus } : e));
    addToast("تم تحديث الحالة", "info");
  };

  const tabBtns = [
    { id:"dashboard", label:"لوحة التحكم" },
    { id:"list",      label:"المعدات" },
    { id:"maint",     label:`الصيانة${openRecs.length?` (${openRecs.length})`:""}` },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* tabs */}
      <div className="flex gap-1.5 border-b border-color pb-3">
        {tabBtns.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab===t.id?"bg-blue-600 text-white":"text-secondary hover:bg-hover"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ لوحة التحكم ════ */}
      {tab === "dashboard" && (
        <div className="space-y-5">
          {/* alerts */}
          {overdue.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5"/>
              <div>
                <p className="text-xs font-bold text-red-800">صيانة متأخرة ({overdue.length} معدة)</p>
                <p className="text-xs text-red-700 mt-0.5">{overdue.map(e=>e.name).join(" • ")}</p>
              </div>
            </div>
          )}
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:"إجمالي المعدات",  value:equipment.length,       color:"from-blue-500 to-blue-600" },
              { label:"تعمل بشكل جيد",  value:byStatus("جيد"),         color:"from-emerald-500 to-emerald-600" },
              { label:"تحتاج صيانة",    value:byStatus("تحتاج صيانة"), color:"from-amber-500 to-amber-600" },
              { label:"تحت صيانة",      value:byStatus("تحت صيانة"),   color:"from-sky-500 to-sky-600" },
              { label:"معطلة",           value:byStatus("معطل"),         color:"from-red-500 to-red-600" },
            ].map((k,i) => (
              <div key={i} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white`}>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-white/80 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Equipment by type */}
          <div className="card rounded-2xl border border-color p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Wrench size={15}/> المعدات حسب الفئة</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(EQ_TYPES).map(([key, meta]) => {
                const total = byType(key);
                const good  = equipment.filter(e=>e.type===key&&e.status==="جيد").length;
                if (total === 0) return null;
                return (
                  <button key={key} onClick={()=>{ setTypeFilter(key); setTab("list"); }}
                    className="text-right p-3 rounded-xl border border-color hover:bg-hover transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${meta.badge}`}>{meta.label}</span>
                      <span className="text-lg font-bold">{total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round(good/total*100)}%`}}/>
                    </div>
                    <p className="text-[10px] text-secondary mt-1">{good} / {total} تعمل بشكل جيد</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-column: upcoming maintenance + critical equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card rounded-2xl border border-color p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Calendar size={15}/> صيانة دورية قادمة (45 يوم)</h3>
              {upcoming.length === 0 ? <p className="text-xs text-secondary text-center py-4">لا توجد مواعيد قريبة</p> :
              upcoming.map(e => {
                const days = Math.ceil((new Date(e.nextMaintenance)-today)/86400000);
                return (
                  <div key={e.id} className="flex justify-between items-center py-2 border-b border-color last:border-0">
                    <div>
                      <p className="text-xs font-bold">{e.name}</p>
                      <p className="text-[10px] text-secondary">{e.nextMaintenance}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${days<=7?"bg-red-100 text-red-700":days<=20?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700"}`}>
                      {days} يوم
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="card rounded-2xl border border-color p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={15}/> المعدات الحرجة</h3>
              {equipment.filter(e=>e.critical).map(e => (
                <div key={e.id} className="flex justify-between items-center py-2 border-b border-color last:border-0 cursor-pointer hover:bg-hover rounded-lg px-1" onClick={()=>{ setSelId(e.id); setTab("list"); }}>
                  <div>
                    <p className="text-xs font-bold">{e.name}</p>
                    <p className="text-[10px] text-secondary">{EQ_TYPES[e.type]?.label}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${EQ_STATUS_COLORS[e.status]}`}>{e.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ قائمة المعدات ════ */}
      {tab === "list" && (
        <div>
          {/* toolbar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex-1 min-w-[160px] flex items-center gap-2 input rounded-xl px-3 py-2">
              <Search size={14} className="text-secondary shrink-0"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث باسم / رمز / موقع…" className="bg-transparent text-sm outline-none w-full"/>
            </div>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">
              <option value="الكل">كل الفئات</option>
              {Object.entries(EQ_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={stFilter} onChange={e=>setStFilter(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">
              <option value="الكل">كل الحالات</option>
              {["جيد","تحتاج صيانة","تحت صيانة","معطل"].map(s=><option key={s}>{s}</option>)}
            </select>
            {canManage && (
              <button onClick={()=>setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">
                <Plus size={14}/> إضافة معدة
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* equipment list */}
            <div className="lg:col-span-2 space-y-2">
              {filtered.length === 0 && <p className="text-center py-10 text-secondary text-sm">لا توجد نتائج</p>}
              {filtered.map(eq => (
                <div key={eq.id} onClick={()=>setSelId(selId===eq.id?null:eq.id)}
                  className={`card rounded-xl border p-3.5 cursor-pointer transition-all flex items-center gap-3 ${selId===eq.id?"border-blue-400 bg-blue-50/30":"border-color hover:bg-hover"}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${eq.status==="جيد"?"bg-emerald-500":eq.status==="معطل"?"bg-red-500":eq.status==="تحت صيانة"?"bg-sky-500":"bg-amber-500"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{eq.name}</span>
                      {eq.critical && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">حرجة</span>}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${EQ_TYPES[eq.type]?.badge||"bg-gray-100 text-gray-700"}`}>{EQ_TYPES[eq.type]?.label||eq.type}</span>
                    </div>
                    <p className="text-[11px] text-secondary mt-0.5 truncate">{eq.location} · {eq.id}</p>
                    <p className="text-[11px] text-secondary">الصيانة القادمة: {eq.nextMaintenance||"—"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ${EQ_STATUS_COLORS[eq.status]||"bg-gray-100"}`}>{eq.status}</span>
                </div>
              ))}
            </div>

            {/* detail panel */}
            <div>
              {sel ? (
                <EqDetailPanel eq={sel} records={records.filter(r=>r.equipmentId===sel.id)}
                  canManage={canManage}
                  onEdit={()=>setEditEq({...sel})} onDelete={()=>deleteEquipment(sel.id)}
                  onRequestMaint={()=>setShowReqForm(true)} onChangeStatus={changeStatus}
                  onComplete={completeMaintenance}/>
              ) : (
                <div className="card rounded-2xl border border-color p-8 text-center">
                  <Wrench size={36} className="mx-auto text-secondary mb-3 opacity-50"/>
                  <p className="text-sm text-secondary font-medium">اختر معدة لعرض التفاصيل</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ الصيانة ════ */}
      {tab === "maint" && (
        <EqMaintenanceTab records={records} equipment={equipment} onComplete={completeMaintenance} onRequest={requestMaintenance}/>
      )}

      {/* modals */}
      {canManage && showAdd && <EqFormModal onClose={()=>setShowAdd(false)}  onSave={addEquipment}   existingIds={equipment.map(e=>e.id)}/>}
      {canManage && editEq  && <EqFormModal onClose={()=>setEditEq(null)}   onSave={d=>updateEquipment(d.id,d)} initial={editEq} isEdit/>}
      {showReqForm && sel && (
        <EqRequestModal eq={sel} onClose={()=>setShowReqForm(false)}
          onSubmit={(desc,type)=>requestMaintenance(sel.id,desc,type)}/>
      )}
    </div>
  );
}

// ── لوحة تفاصيل المعدة ──
function EqDetailPanel({ eq, records, canManage, onEdit, onDelete, onRequestMaint, onChangeStatus, onComplete }) {
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
function EqMaintenanceTab({ records, equipment, onComplete, onRequest }) {
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
function EqFormModal({ onClose, onSave, initial, isEdit, existingIds=[] }) {
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
function EqRequestModal({ eq, onClose, onSubmit }) {
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

// ========== قطع غيار الصيانة ==========
function MaintenanceParts() {
  const [parts, setParts] = useState(() => storage.get("maint_spare_parts", INITIAL_MAINT_SPARE_PARTS));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code:"", name:"", category:"ميكانيكية", qty:0, minAlert:1, unit:"قطعة", price:0, location:"" });
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const confirm = useConfirm();
  useEffect(() => { storage.set("maint_spare_parts", parts); }, [parts]);

  const deletePart = async (id) => {
    if (await confirm("هل تريد حذف هذه القطعة؟", { danger: true, ok: "حذف", title: "حذف القطعة" }))
      setParts(parts.filter(x => x.id !== id));
  };

  const categories = ["الكل", ...new Set(parts.map(p => p.category))];
  const filtered = parts.filter(p => (p.name.includes(search)||p.code.includes(search)) && (filterCat==="الكل"||p.category===filterCat));
  const lowStock = parts.filter(p => p.qty <= p.minAlert);

  const addPart = () => {
    if (!form.name || !form.code) return showToast("الاسم والرمز مطلوبان");
    setParts([...parts, { ...form, id:"SP-"+Date.now() }]);
    setShowForm(false);
    setForm({ code:"", name:"", category:"ميكانيكية", qty:0, minAlert:1, unit:"قطعة", price:0, location:"" });
    showToast("✅ تم الإضافة");
  };
  const updateQty = (id, delta) => setParts(parts.map(p => p.id===id ? {...p, qty:Math.max(0,p.qty+delta)} : p));

  return (
    <div className="space-y-4">
      {lowStock.length>0 && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-600 shrink-0"/><div><p className="text-xs font-bold text-amber-800">مخزون منخفض ({lowStock.length} صنف)</p><p className="text-xs text-amber-700">{lowStock.map(p=>p.name).join(" • ")}</p></div></div>}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 input rounded-xl px-3 py-2"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select>
        <button onClick={()=>exportCSV(parts.map(p=>({الرمز:p.code,الاسم:p.name,الفئة:p.category,الكمية:p.qty,الوحدة:p.unit,السعر:p.price,الموقع:p.location})),"قطع_الغيار")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> CSV</button>
        <button onClick={()=>{setShowForm(true);setForm({code:"",name:"",category:"ميكانيكية",qty:0,minAlert:1,unit:"قطعة",price:0,location:""});}} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-1.5 text-sm font-bold"><Plus size={14}/> إضافة</button>
      </div>

      {showForm && (
        <div className="card rounded-2xl border-2 border-blue-200 p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[["الرمز","code"],["الاسم","name"],["الوحدة","unit"],["الموقع","location"]].map(([l,k])=>(
              <div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            ))}
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الفئة</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"><option>ميكانيكية</option><option>كهربائية</option><option>مواد استهلاكية</option><option>فلتر</option></select></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الكمية</label><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:Number(e.target.value)})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">حد التنبيه</label><input type="number" value={form.minAlert} onChange={e=>setForm({...form,minAlert:Number(e.target.value)})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">السعر ($)</label><input type="number" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          </div>
          <div className="flex gap-2 justify-end mt-4"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={addPart} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl">حفظ</button></div>
        </div>
      )}

      <div className="card rounded-2xl border-color border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-color bg-slate-50"><th className="px-3 py-2 text-right">الرمز</th><th className="px-3 py-2 text-right">الاسم</th><th className="px-3 py-2 text-right">الفئة</th><th className="px-3 py-2 text-right">الكمية</th><th className="px-3 py-2 text-right">الحد</th><th className="px-3 py-2 text-right">السعر</th><th className="px-3 py-2 text-right">الموقع</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} className={`border-t border-color hover:bg-hover ${p.qty<=p.minAlert?"bg-amber-50/30":""}`}>
                  <td className="px-3 py-2 font-mono text-xs">{p.code}</td>
                  <td className="px-3 py-2">{p.name} {p.qty<=p.minAlert&&<span className="text-amber-500">⚠️</span>}</td>
                  <td className="px-3 py-2 text-xs">{p.category}</td>
                  <td className="px-3 py-2"><div className="flex items-center gap-1"><button onClick={()=>updateQty(p.id,-1)} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">-</button><span className="w-8 text-center font-bold">{p.qty}</span><button onClick={()=>updateQty(p.id,1)} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">+</button></div></td>
                  <td className="px-3 py-2 text-xs">{p.minAlert} {p.unit}</td>
                  <td className="px-3 py-2 text-xs">${p.price}</td>
                  <td className="px-3 py-2 text-xs text-secondary">{p.location}</td>
                  <td className="px-3 py-2"><button onClick={()=>deletePart(p.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13}/></button></td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={8} className="text-center py-8 text-secondary">لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== تقارير الصيانة ==========
function MaintenanceAnalytics() {
  const equipment = storage.get("equipment", INITIAL_EQUIPMENT);
  const parts     = storage.get("maint_spare_parts", INITIAL_MAINT_SPARE_PARTS);
  const records   = storage.get("maintenance_records", []);
  const totalCost  = equipment.reduce((s, e) => s + (e.maintenanceCost || 300), 0);
  const partsValue = parts.reduce((s, p) => s + (p.price * p.qty), 0);
  const mostFailing = [...equipment].sort((a, b) => b.totalFailures - a.totalFailures).slice(0, 3);
  const byStatus = [
    { name:"جيد",          value:equipment.filter(e=>e.status==="جيد").length },
    { name:"يحتاج صيانة",  value:equipment.filter(e=>e.status==="تحتاج صيانة").length },
    { name:"تحت صيانة",    value:equipment.filter(e=>e.status==="تحت صيانة").length },
    { name:"معطل",         value:equipment.filter(e=>e.status==="معطل").length },
  ].filter(x=>x.value>0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white"><div className="flex justify-between items-center"><Wrench size={20}/><span className="text-3xl font-bold">{equipment.length}</span></div><p className="text-xs mt-2 opacity-90">إجمالي المعدات</p></div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white"><div className="flex justify-between items-center"><AlertTriangle size={20}/><span className="text-3xl font-bold">{equipment.filter(e=>e.critical).length}</span></div><p className="text-xs mt-2 opacity-90">معدات حرجة</p></div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white"><div className="flex justify-between items-center"><Clock size={20}/><span className="text-3xl font-bold">{equipment.filter(e=>new Date(e.nextMaintenance)<=new Date()).length}</span></div><p className="text-xs mt-2 opacity-90">صيانة مستحقة</p></div>
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white"><div className="flex justify-between items-center"><Box size={20}/><span className="text-3xl font-bold">{parts.length}</span></div><p className="text-xs mt-2 opacity-90">قطع غيار</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card rounded-2xl p-5 border-color border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18}/> تحليل التكاليف</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl"><span className="text-sm">إجمالي تكاليف الصيانة (تقديري)</span><span className="text-xl font-bold text-blue-600">${totalCost.toLocaleString()}</span></div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl"><span className="text-sm">قيمة قطع الغيار</span><span className="text-xl font-bold text-amber-600">${partsValue.toLocaleString()}</span></div>
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl"><span className="text-sm">طلبات صيانة مكتملة</span><span className="text-xl font-bold text-emerald-600">{records.filter(r=>r.status==="مكتملة").length}</span></div>
          </div>
        </div>

        <div className="card rounded-2xl p-5 border-color border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingDown size={18}/> أكثر المعدات عطلاً</h3>
          <div className="space-y-2">
            {mostFailing.map((e, idx)=>(
              <div key={e.id} className="flex justify-between items-center p-2 border-b border-color last:border-0">
                <div className="flex items-center gap-2"><span className="text-base">{idx===0?"🥇":idx===1?"🥈":"🥉"}</span><span className="text-sm">{e.name}</span></div>
                <span className={`font-bold text-sm ${e.totalFailures>2?"text-red-600":"text-amber-600"}`}>{e.totalFailures} عطل</span>
              </div>
            ))}
            {mostFailing.length===0 && <p className="text-center text-secondary text-sm py-4">لا توجد بيانات</p>}
          </div>
        </div>

        <div className="card rounded-2xl p-5 border-color border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart size={18}/> توزيع حالة المعدات</h3>
          <SVGPieChart data={byStatus} colors={["#10b981","#f59e0b","#3b82f6","#ef4444"]} height={160} donut={true}/>
        </div>

        <div className="card rounded-2xl p-5 border-color border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><AlertCircle size={18}/> توصيات</h3>
          <div className="space-y-3">
            {equipment.filter(e=>e.critical&&e.status!=="جيد").length>0 && <div className="p-3 bg-red-50 rounded-xl border border-red-100"><p className="font-bold text-red-700 text-sm">⚠️ أولوية عالية</p><p className="text-xs text-red-600 mt-1">معدات حرجة تحتاج صيانة فورية</p></div>}
            {parts.filter(p=>p.qty<=p.minAlert).length>0 && <div className="p-3 bg-amber-50 rounded-xl border border-amber-100"><p className="font-bold text-amber-700 text-sm">📦 مخزون قطع الغيار</p><p className="text-xs text-amber-600 mt-1">يوجد {parts.filter(p=>p.qty<=p.minAlert).length} صنف بمخزون منخفض</p></div>}
            {equipment.filter(e=>new Date(e.nextMaintenance)<=new Date()).length>0 && <div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><p className="font-bold text-blue-700 text-sm">🗓️ صيانة مستحقة</p><p className="text-xs text-blue-600 mt-1">{equipment.filter(e=>new Date(e.nextMaintenance)<=new Date()).length} معدة تجاوزت موعد صيانتها</p></div>}
            {[...Array(3)].every(()=>true) && equipment.filter(e=>e.critical&&e.status!=="جيد").length===0 && parts.filter(p=>p.qty<=p.minAlert).length===0 && equipment.filter(e=>new Date(e.nextMaintenance)<=new Date()).length===0 && <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100"><p className="font-bold text-emerald-700 text-sm">✅ الوضع جيد</p><p className="text-xs text-emerald-600 mt-1">لا توجد تنبيهات حرجة حالياً</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EquipmentMaintenance;
export { MaintenanceParts, MaintenanceAnalytics };
