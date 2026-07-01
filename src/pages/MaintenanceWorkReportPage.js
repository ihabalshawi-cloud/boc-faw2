import React, { useState } from "react";
import { Plus, ChevronRight, Printer, Trash2 } from "lucide-react";
import { storage } from "../utils";
import { ACCOUNTS, INITIAL_EQUIPMENT, MONTHS_AR } from "../constants";
import { useToast, useConfirm } from "../contexts";

const WKEY = "maint_work_log";
const WORK_TYPES = ["صيانة دورية","صيانة طارئة","فحص","إصلاح","تنظيف","تشغيل","أخرى"];
const SC = { "مكتمل":"bg-emerald-100 text-emerald-700","جاري":"bg-blue-100 text-blue-700","متوقف":"bg-amber-100 text-amber-700" };
const toYMD = d => d.toISOString().slice(0,10);

// ── Print ──────────────────────────────────────────────────────────────────────
function printReport(entries, title, subtitle) {
  const rows = entries.map((e,i)=>`
    <tr><td>${i+1}</td><td>${e.date||""}</td><td style="text-align:right">${e.equipmentName||"—"}</td>
    <td>${e.workType||""}</td><td style="text-align:right">${e.description||""}</td>
    <td>${e.hours||0}</td><td style="text-align:right">${e.technicianName||""}</td><td>${e.status||""}</td></tr>`).join("");
  const totalHours = entries.reduce((s,e)=>s+(Number(e.hours)||0),0);
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #000;padding:5px 6px;text-align:center}th{background:#f0f0f0}h2,p.hdr{text-align:center;margin:3px 0}.sigs{display:flex;justify-content:space-between;margin-top:30px}@media print{@page{margin:1.5cm}}</style>
  </head><body>
  <p class="hdr" style="font-weight:bold">شركة نفط البصرة — هيأة الصيانة الهندسية — القسم: السيطرة والنظم</p>
  <h2>${title}</h2><p class="hdr" style="color:#555">${subtitle}</p>
  <table><thead><tr><th>ت</th><th>التاريخ</th><th>المعدة</th><th>نوع العمل</th><th>الوصف</th><th>الساعات</th><th>الفني</th><th>الحالة</th></tr></thead>
  <tbody>${rows}<tr><td colspan="5" style="font-weight:bold;text-align:right;padding-left:12px">الإجمالي</td><td style="font-weight:bold">${totalHours}</td><td colspan="2"></td></tr></tbody></table>
  <div class="sigs"><div style="text-align:center"><p>رئيس الشعبة</p><br/><br/><p>.................................</p></div><div style="text-align:center"><p>مدير القسم</p><br/><br/><p>.................................</p></div></div>
  </body></html>`;
  const win = window.open("","_blank"); win.document.write(html); win.document.close(); win.print();
}

// ── Add Entry Form ─────────────────────────────────────────────────────────────
function EntryForm({ emp, allEquipment, onSave, onCancel }) {
  const toast = useToast();
  const [date,   setDate]   = useState(toYMD(new Date()));
  const [eqId,   setEqId]   = useState("");
  const [eqName, setEqName] = useState("");
  const [wType,  setWType]  = useState(WORK_TYPES[0]);
  const [desc,   setDesc]   = useState("");
  const [hours,  setHours]  = useState(1);
  const [status, setStatus] = useState("مكتمل");

  const save = () => {
    if (!desc.trim()) { toast("أدخل وصف العمل","warning"); return; }
    const eq = allEquipment.find(e=>e.id===eqId);
    onSave({ id:Date.now(), date, equipmentId:eqId, equipmentName:eqId==="__other"?eqName:(eq?.name||""),
      workType:wType, description:desc, hours:Number(hours)||1, status,
      technicianId:emp.id, technicianName:emp.name,
      shift:emp.shift==="صباحي"?"صباحي":(emp.group||""), createdAt:new Date().toISOString() });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronRight size={16}/> رجوع</button>
        <h2 className="font-bold">إضافة سجل عمل</h2>
      </div>
      <div className="card rounded-2xl border border-color p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-secondary block mb-1">التاريخ</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
          <div><label className="text-xs text-secondary block mb-1">الساعات</label>
            <input type="number" value={hours} min={0.5} step={0.5} onChange={e=>setHours(e.target.value)} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
        </div>
        <div><label className="text-xs text-secondary block mb-1">المعدة / الموقع</label>
          <select value={eqId} onChange={e=>setEqId(e.target.value)} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color">
            <option value="">— اختر معدة —</option>
            {allEquipment.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
            <option value="__other">أخرى (اكتب أدناه)</option>
          </select>
          {eqId==="__other"&&<input value={eqName} onChange={e=>setEqName(e.target.value)} placeholder="اسم المعدة أو الموقع..." className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color mt-2"/>}
        </div>
        <div><label className="text-xs text-secondary block mb-1">نوع العمل</label>
          <div className="flex flex-wrap gap-1.5">
            {WORK_TYPES.map(t=>(
              <button key={t} onClick={()=>setWType(t)} className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${wType===t?"bg-blue-600 text-white border-blue-600":"border-color hover:bg-hover"}`}>{t}</button>
            ))}
          </div></div>
        <div><label className="text-xs text-secondary block mb-1">وصف العمل المنجز *</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="اكتب تفاصيل العمل المنجز..." className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color resize-none"/></div>
        <div><label className="text-xs text-secondary block mb-1">الحالة</label>
          <div className="flex gap-2">
            {["مكتمل","جاري","متوقف"].map(s=>(
              <button key={s} onClick={()=>setStatus(s)} className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors ${status===s?"bg-blue-600 text-white border-blue-600":"border-color hover:bg-hover"}`}>{s}</button>
            ))}
          </div></div>
        <button onClick={save} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">حفظ السجل</button>
      </div>
    </div>
  );
}

// ── Daily View ─────────────────────────────────────────────────────────────────
function DailyView({ entries, date, setDate, emp, isAdmin, onDelete, onAdd }) {
  const confirm = useConfirm();
  const dayEntries = entries.filter(e=>e.date===date).sort((a,b)=>b.id-a.id);
  const totalHours = dayEntries.reduce((s,e)=>s+(Number(e.hours)||0),0);
  const del = async (id) => { if (await confirm("حذف هذا السجل؟")) onDelete(id); };
  const doPrint = () => { const d=new Date(date+"T00:00:00"); printReport(dayEntries,"تقرير العمل اليومي",`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`); };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[160px]"><label className="text-xs text-secondary block mb-1">اختر التاريخ</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
        <div className="flex gap-2">
          {dayEntries.length>0&&<button onClick={doPrint} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Printer size={14}/> طباعة</button>}
          <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"><Plus size={14}/> إضافة</button>
        </div>
      </div>
      {dayEntries.length>0&&(
        <div className="card rounded-2xl border border-color p-3 grid grid-cols-3 gap-2 text-center">
          <div><p className="text-xl font-bold text-blue-600">{dayEntries.length}</p><p className="text-xs text-secondary">سجل</p></div>
          <div className="border-x border-color"><p className="text-xl font-bold text-emerald-600">{totalHours}</p><p className="text-xs text-secondary">ساعة</p></div>
          <div><p className="text-xl font-bold text-amber-600">{dayEntries.filter(e=>e.status==="جاري").length}</p><p className="text-xs text-secondary">جاري</p></div>
        </div>
      )}
      {dayEntries.length===0 ? (
        <div className="text-center py-14 text-secondary">
          <p className="text-5xl mb-3">🔧</p><p className="font-medium">لا توجد سجلات لهذا اليوم</p>
          <button onClick={onAdd} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">+ إضافة سجل</button>
        </div>
      ) : (
        <div className="space-y-2">
          {dayEntries.map(e=>(
            <div key={e.id} className="card rounded-2xl border border-color p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SC[e.status]}`}>{e.status}</span>
                    <span className="text-xs font-bold text-blue-600">{e.workType}</span>
                    <span className="text-xs text-secondary">{e.hours} ساعة</span>
                  </div>
                  {e.equipmentName&&<p className="text-sm font-medium">{e.equipmentName}</p>}
                  <p className="text-sm text-secondary mt-0.5 line-clamp-3">{e.description}</p>
                  <p className="text-xs text-secondary mt-1.5">{e.technicianName}</p>
                </div>
                {(isAdmin||e.technicianId===emp.id)&&(
                  <button onClick={()=>del(e.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg shrink-0"><Trash2 size={13}/></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Monthly View ───────────────────────────────────────────────────────────────
function MonthlyView({ entries, emp, isAdmin }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());

  const monthEntries = entries.filter(e=>{
    if (!e.date) return false;
    const d = new Date(e.date+"T00:00:00");
    return d.getMonth()===month && d.getFullYear()===year;
  }).sort((a,b)=>a.date.localeCompare(b.date)||b.id-a.id);

  const totalHours = monthEntries.reduce((s,e)=>s+(Number(e.hours)||0),0);
  const doPrint = () => printReport(monthEntries,"تقرير العمل الشهري",`${MONTHS_AR[month]} ${year}`);

  const byDate = monthEntries.reduce((acc,e)=>{ (acc[e.date]||(acc[e.date]=[])).push(e); return acc; },{});
  const byType = WORK_TYPES.reduce((acc,t)=>{ acc[t]=monthEntries.filter(e=>e.workType===t).length; return acc; },{});

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-1">
          <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="flex-1 input-base rounded-lg px-3 py-2 text-sm border border-color">
            {MONTHS_AR.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="w-24 input-base rounded-lg px-3 py-2 text-sm border border-color"/>
        </div>
        {monthEntries.length>0&&<button onClick={doPrint} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Printer size={14}/> طباعة</button>}
      </div>
      {monthEntries.length>0&&(
        <div className="grid grid-cols-3 gap-3">
          <div className="card rounded-2xl border border-color p-3 text-center"><p className="text-xl font-bold text-blue-600">{monthEntries.length}</p><p className="text-xs text-secondary">إجمالي السجلات</p></div>
          <div className="card rounded-2xl border border-color p-3 text-center"><p className="text-xl font-bold text-emerald-600">{totalHours}</p><p className="text-xs text-secondary">إجمالي الساعات</p></div>
          <div className="card rounded-2xl border border-color p-3 text-center"><p className="text-xl font-bold text-amber-600">{Object.keys(byDate).length}</p><p className="text-xs text-secondary">يوم عمل</p></div>
        </div>
      )}
      {monthEntries.length>0&&(
        <div className="card rounded-2xl border border-color p-4">
          <h4 className="font-bold text-sm mb-3">توزيع نوع الأعمال</h4>
          <div className="space-y-1.5">
            {WORK_TYPES.filter(t=>byType[t]>0).map(t=>(
              <div key={t} className="flex items-center gap-2">
                <span className="text-xs text-secondary w-28 shrink-0">{t}</span>
                <div className="flex-1 bg-hover rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-blue-500 rounded-full" style={{width:`${Math.round(byType[t]/monthEntries.length*100)}%`}}/>
                </div>
                <span className="text-xs font-bold w-5 text-right">{byType[t]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {monthEntries.length===0 ? (
        <div className="text-center py-14 text-secondary"><p className="text-5xl mb-3">📊</p><p className="font-medium">لا توجد سجلات لهذا الشهر</p></div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byDate).sort(([a],[b])=>b.localeCompare(a)).map(([dt,dEntries])=>{
            const d = new Date(dt+"T00:00:00");
            const dHrs = dEntries.reduce((s,e)=>s+(Number(e.hours)||0),0);
            return (
              <div key={dt} className="card rounded-2xl border border-color overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-hover border-b border-color">
                  <span className="text-sm font-bold">{d.getDate()} {MONTHS_AR[d.getMonth()]} {d.getFullYear()}</span>
                  <span className="text-xs text-secondary">{dEntries.length} سجل • {dHrs} ساعة</span>
                </div>
                {dEntries.map(e=>(
                  <div key={e.id} className="px-4 py-3 border-b border-color last:border-0">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${SC[e.status]}`}>{e.status}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-blue-600">{e.workType}{e.equipmentName?` — ${e.equipmentName}`:""}</p>
                        <p className="text-sm mt-0.5">{e.description}</p>
                        <p className="text-xs text-secondary mt-0.5">{e.technicianName} • {e.hours} ساعة</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function MaintenanceWorkReport({ emp }) {
  const isAdmin = emp.role==="admin"||emp.username==="i.shawi";
  const allEquipment = storage.get("equipment", INITIAL_EQUIPMENT);
  const [entries, setEntries] = useState(()=>storage.get(WKEY,[]));
  const [tab, setTab]   = useState("daily");
  const [pv,  setPv]    = useState("list");
  const [date, setDate] = useState(toYMD(new Date()));

  const save = (entry) => {
    const up = [entry,...entries]; setEntries(up); storage.set(WKEY,up); setPv("list");
  };
  const del = (id) => {
    const up = entries.filter(e=>e.id!==id); setEntries(up); storage.set(WKEY,up);
  };

  const visible = isAdmin ? entries : entries.filter(e=>e.technicianId===emp.id);

  if (pv==="add") return <EntryForm emp={emp} allEquipment={allEquipment} onSave={save} onCancel={()=>setPv("list")}/>;

  return (
    <div className="space-y-4" dir="rtl">
      <h2 className="font-bold text-lg">تقارير العمل الصيانة</h2>
      <div className="flex gap-1 border-b border-color">
        {[["daily","التقرير اليومي"],["monthly","التقرير الشهري"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k?"border-blue-600 text-blue-600":"border-transparent text-secondary hover:text-primary"}`}>{l}</button>
        ))}
      </div>
      {tab==="daily"   && <DailyView   entries={visible} date={date} setDate={setDate} emp={emp} isAdmin={isAdmin} onDelete={del} onAdd={()=>setPv("add")}/>}
      {tab==="monthly" && <MonthlyView entries={visible} emp={emp} isAdmin={isAdmin}/>}
    </div>
  );
}
