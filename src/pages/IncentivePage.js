import React, { useState } from "react";
import { Plus, ChevronRight, Settings, Check, X, Printer, AlertCircle, Trash2 } from "lucide-react";
import { storage } from "../utils";
import { ACCOUNTS } from "../constants";
import { useToast, useConfirm } from "../contexts";

const IKEY = "boc_incentive_v1";
const CFGKEY = "boc_incentive_cfg";
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const STATUS_COLOR = {
  "مسودة":"bg-gray-100 text-gray-600",
  "بانتظار المراجعة":"bg-amber-100 text-amber-700",
  "موافق عليها":"bg-emerald-100 text-emerald-700",
  "مرفوضة":"bg-red-100 text-red-700",
};
const DEFAULT_CFG = { amounts:{ أ:100000, ب:75000, ج:50000 }, morningSupervisors:[2,3], shiftSupervisors:[] };

// ─── Print ─────────────────────────────────────────────────────────────────────
function printForm(form, cfg) {
  const amounts = cfg?.amounts || DEFAULT_CFG.amounts;
  const d = new Date(form.createdAt);
  const rows = (form.employees||[]).map((e,i)=>`<tr><td>${i+1}</td><td style="text-align:right">${e.empName}</td><td>${e.jobNum}</td><td style="font-weight:bold">${e.category}</td><td style="font-weight:bold;color:#16a34a">${(amounts[e.category]||0).toLocaleString()}</td></tr>`).join("");
  const total = (form.employees||[]).reduce((s,e)=>s+(amounts[e.category]||0),0);
  const typeBoxes = ["مكافأة تشغيلية","مكافأة استثمارية"].map(t=>`<span style="margin-left:20px">${t===form.formType?"☑":"☐"} ${t}</span>`).join("");
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>استمارة مكافآت</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #000;padding:6px 8px;text-align:center}th{background:#f0f0f0}.sigs{display:flex;justify-content:space-between;margin-top:40px}.note{border:1px solid #000;padding:8px;margin-top:15px;font-size:11px}@media print{@page{margin:1.5cm}}</style>
  </head><body>
  <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px">
    <p style="margin:2px;font-weight:bold">شركة نفط البصرة</p>
    <p style="margin:2px">هيأة الصيانة الهندسية &nbsp;|&nbsp; القسم: السيطرة والنظم</p>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <div style="border:1px solid #000;padding:6px 12px">${typeBoxes}</div>
    <h2 style="margin:0;font-size:15px">استمارة منح مكافآت</h2>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px">
    <span>إلى / السيد مدير هيأة الصيانة الهندسية</span>
    <span>الرقم التسلسلي: ${form.seqNum||"___"} &nbsp;&nbsp; التاريخ: ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}</span>
  </div>
  <p style="margin:4px 0">أدناه أسماء المستحقين للمكافآت وحسب ما مبين أدناه:</p>
  <p style="margin:6px 0"><strong>عنوان العمل وموقعه والمبررات الموجبة:</strong></p>
  <div style="border:1px solid #000;padding:10px;min-height:60px;white-space:pre-line;margin-bottom:8px">${form.workDescription||""}</div>
  <p style="margin:4px 0">رقم العمل: <strong>${form.workNumber||"_____________"}</strong></p>
  <table><thead><tr><th>ت</th><th>الاسم الثلاثي</th><th>الرقم الوظيفي</th><th>الفئة</th><th>المبلغ (د.ع)</th></tr></thead>
  <tbody>${rows}<tr><td colspan="4" style="font-weight:bold;text-align:right;padding-left:20px">الإجمالي</td><td style="font-weight:bold;color:#16a34a">${total.toLocaleString()}</td></tr></tbody></table>
  <div class="sigs">
    <div class="sig" style="text-align:center"><p style="margin:0;font-weight:bold">مدير القسم</p><br/><br/><p style="margin:0">.................................</p></div>
    <div class="sig" style="text-align:center"><p style="margin:0;font-weight:bold">مدير هيأة الصيانة الهندسية</p><br/><br/><p style="margin:0">.................................</p></div>
  </div>
  <div class="note">ملاحظة: يعتبر توقيع مدير القسم أو الهيأة تأييد بعدم تكرار مبررات منح المكافأة خلال الشهر الواحد وحضورهم خلال فترة منح المكافأة.</div>
  </body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close(); w.print();
}

// ─── Create Form ───────────────────────────────────────────────────────────────
function CreateForm({ emp, employees, cfg, onSave, onCancel }) {
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year, setYear]  = useState(now.getFullYear());
  const [fType, setFType] = useState("مكافأة تشغيلية");
  const [desc, setDesc]   = useState("");
  const [wNum, setWNum]   = useState("");
  const [seqNum, setSeqNum] = useState("");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState({}); // empId → category

  const pool = (employees||ACCOUNTS).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  const shown = pool.filter(e=>e.name.includes(search)||String(e.jobNum).includes(search));

  const toggle = (e) => setSel(p=>{ const n={...p}; if(n[e.id]) delete n[e.id]; else n[e.id]="أ"; return n; });
  const setCat = (id,c) => setSel(p=>({...p,[id]:c}));

  const submit = (status) => {
    if (!desc.trim()) { toast("أدخل وصف العمل","warning"); return; }
    if (!Object.keys(sel).length) { toast("اختر موظفاً واحداً على الأقل","warning"); return; }
    const emps = Object.entries(sel).map(([id,cat])=>{ const e=pool.find(x=>String(x.id)===id); return {empId:Number(id),empName:e?.name||"",jobNum:e?.jobNum||"",category:cat}; });
    onSave({ id:Date.now(), month, year, formType:fType, workDescription:desc, workNumber:wNum, seqNum, employees:emps, enteredBy:emp.id, status, createdAt:new Date().toISOString() });
    toast(status==="بانتظار المراجعة"?"تم إرسال الاستمارة للمراجعة":"تم حفظ المسودة","success");
  };

  const amounts = cfg?.amounts||DEFAULT_CFG.amounts;
  const total = Object.entries(sel).reduce((s,[,c])=>s+(amounts[c]||0),0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronRight size={16}/> رجوع</button>
        <h2 className="font-bold">إنشاء استمارة مكافآت</h2>
      </div>
      <div className="card rounded-2xl border-color border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-secondary block mb-1">الشهر</label>
            <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color">
              {MONTHS_AR.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
            </select></div>
          <div><label className="text-xs text-secondary block mb-1">السنة</label>
            <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
        </div>
        <div><label className="text-xs text-secondary block mb-1">نوع المكافأة</label>
          <div className="flex gap-2">
            {["مكافأة تشغيلية","مكافأة استثمارية"].map(t=>(
              <button key={t} onClick={()=>setFType(t)} className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${fType===t?"bg-blue-600 text-white border-blue-600":"border-color hover:bg-hover"}`}>{t}</button>
            ))}
          </div></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-secondary block mb-1">الرقم التسلسلي</label>
            <input value={seqNum} onChange={e=>setSeqNum(e.target.value)} placeholder="اختياري" className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
          <div><label className="text-xs text-secondary block mb-1">رقم العمل</label>
            <input value={wNum} onChange={e=>setWNum(e.target.value)} placeholder="0060692343" className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
        </div>
        <div><label className="text-xs text-secondary block mb-1">عنوان العمل والمبررات *</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="اكتب وصف العمل والمبررات الموجبة..." className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color resize-none"/></div>
      </div>
      <div className="card rounded-2xl border-color border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">المستحقون ({Object.keys(sel).length} محدد)</h3>
          <span className="text-xs font-bold text-emerald-600">إجمالي: {total.toLocaleString()} د.ع</span>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو الرقم الوظيفي..." className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color mb-3"/>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {shown.map(e=>(
            <div key={e.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${sel[e.id]?"bg-blue-50 border border-blue-100":"border border-transparent hover:bg-hover"}`}>
              <input type="checkbox" checked={!!sel[e.id]} onChange={()=>toggle(e)} className="w-4 h-4 shrink-0"/>
              <div className="flex-1 min-w-0" onClick={()=>toggle(e)}>
                <p className="text-sm font-medium truncate">{e.name}</p>
                <p className="text-xs text-secondary">{e.jobNum} — {e.title}</p>
              </div>
              {sel[e.id] && (
                <div className="flex gap-1">
                  {["أ","ب","ج"].map(c=>(
                    <button key={c} onClick={()=>setCat(e.id,c)} className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${sel[e.id]===c?"bg-blue-600 text-white border-blue-600":"border-color hover:bg-hover"}`}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={()=>submit("مسودة")} className="flex-1 py-2.5 btn-secondary border border-color rounded-xl text-sm">حفظ كمسودة</button>
        <button onClick={()=>submit("بانتظار المراجعة")} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">إرسال للمراجعة</button>
      </div>
    </div>
  );
}

// ─── Form Detail ───────────────────────────────────────────────────────────────
function FormDetail({ form, emp, isAdmin, cfg, onBack, onApprove, onDelete }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [comment, setComment] = useState(form.comment||"");
  const amounts = cfg?.amounts||DEFAULT_CFG.amounts;
  const by = ACCOUNTS.find(a=>a.id===form.enteredBy);
  const total = (form.employees||[]).reduce((s,e)=>s+(amounts[e.category]||0),0);

  const doApprove = async (status) => {
    if (status==="مرفوضة"&&!comment.trim()) { toast("أضف سبب الرفض","warning"); return; }
    if (await confirm(`هل تريد ${status==="موافق عليها"?"الموافقة على":"رفض"} هذه الاستمارة؟`))
      onApprove(form.id, status, comment);
  };
  const doDelete = async () => {
    if (await confirm("حذف هذه الاستمارة نهائياً؟")) onDelete(form.id);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronRight size={16}/> رجوع</button>
        <h2 className="font-bold flex-1">تفاصيل الاستمارة</h2>
        <button onClick={()=>printForm(form,cfg)} className="flex items-center gap-1 px-3 py-1.5 btn-secondary border border-color rounded-lg text-sm"><Printer size={14}/> طباعة</button>
        {(isAdmin||form.enteredBy===emp.id)&&form.status==="مسودة"&&(
          <button onClick={doDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15}/></button>
        )}
      </div>
      <div className="card rounded-2xl border-color border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[form.status]}`}>{form.status}</span>
          <span className="text-sm font-bold">{form.formType}</span>
          <span className="text-secondary text-xs">{MONTHS_AR[(form.month||1)-1]} {form.year}</span>
          {form.seqNum&&<span className="text-xs text-secondary">رقم: {form.seqNum}</span>}
        </div>
        <div className="text-xs text-secondary space-y-0.5">
          <p>رقم العمل: {form.workNumber||"—"}</p>
          <p>أدخله: {by?.name?.split(" ").slice(0,3).join(" ")||"—"} • {new Date(form.createdAt).toLocaleDateString("ar-IQ")}</p>
          {form.approvedBy&&<p>راجعه: {ACCOUNTS.find(a=>a.id===form.approvedBy)?.name?.split(" ").slice(0,2).join(" ")||"—"}</p>}
        </div>
        <div><p className="text-xs text-secondary mb-1">وصف العمل:</p>
          <p className="text-sm bg-hover rounded-lg p-3 whitespace-pre-line">{form.workDescription}</p></div>
        {form.comment&&<div className="bg-amber-50 rounded-lg p-3 text-xs"><p className="text-secondary mb-0.5">ملاحظة:</p><p>{form.comment}</p></div>}
      </div>
      <div className="card rounded-2xl border-color border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-color">
          <h3 className="font-bold text-sm">المستحقون ({form.employees?.length||0})</h3>
          <span className="font-bold text-sm text-emerald-600">{total.toLocaleString()} د.ع</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-hover text-xs text-secondary"><tr><th className="p-2 text-center">ت</th><th className="p-2 text-right">الاسم</th><th className="p-2 text-center">الرقم الوظيفي</th><th className="p-2 text-center">الفئة</th><th className="p-2 text-center">المبلغ</th></tr></thead>
            <tbody>
              {(form.employees||[]).map((e,i)=>(
                <tr key={e.empId} className="border-t border-color">
                  <td className="p-2 text-center text-xs text-secondary">{i+1}</td>
                  <td className="p-2 font-medium">{e.empName}</td>
                  <td className="p-2 text-center text-secondary">{e.jobNum}</td>
                  <td className="p-2 text-center"><span className="font-bold text-blue-600 text-base">{e.category}</span></td>
                  <td className="p-2 text-center font-bold text-emerald-600">{(amounts[e.category]||0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isAdmin&&form.status==="بانتظار المراجعة"&&(
        <div className="card rounded-2xl border-color border p-4 space-y-3">
          <h3 className="font-bold text-sm">مراجعة الاستمارة</h3>
          <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="ملاحظات (إلزامي عند الرفض)..." rows={2} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color resize-none"/>
          <div className="flex gap-3">
            <button onClick={()=>doApprove("مرفوضة")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50"><X size={15}/> رفض</button>
            <button onClick={()=>doApprove("موافق عليها")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"><Check size={15}/> موافقة</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────────
function SettingsView({ cfg, employees, onSave, onBack }) {
  const toast = useToast();
  const [amounts, setAmounts] = useState({...DEFAULT_CFG.amounts,...(cfg?.amounts||{})});
  const [morningSups, setMorningSups] = useState(cfg?.morningSupervisors||[2,3]);
  const [shiftSups,   setShiftSups]   = useState(cfg?.shiftSupervisors||[]);
  const all = (employees||ACCOUNTS).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  const toggle = (setter, list, id) => setter(list.includes(id)?list.filter(x=>x!==id):[...list,id]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronRight size={16}/> رجوع</button>
        <h2 className="font-bold">إعدادات نظام المكافآت</h2>
      </div>
      <div className="card rounded-2xl border-color border p-4 space-y-3">
        <h3 className="font-bold text-sm">مبالغ الفئات (دينار عراقي)</h3>
        {["أ","ب","ج"].map(c=>(
          <div key={c} className="flex items-center gap-3">
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">{c}</span>
            <input type="number" value={amounts[c]} onChange={e=>setAmounts(p=>({...p,[c]:Number(e.target.value)}))} className="flex-1 input-base rounded-lg px-3 py-2 text-sm border border-color"/>
            <span className="text-xs text-secondary">د.ع</span>
          </div>
        ))}
      </div>
      <div className="card rounded-2xl border-color border p-4 space-y-2">
        <h3 className="font-bold text-sm">مسؤولو الإدخال — الدوام الصباحي</h3>
        <p className="text-xs text-secondary">فقط هؤلاء يمكنهم إنشاء استمارة الصباحي</p>
        <div className="space-y-0.5 max-h-44 overflow-y-auto">
          {all.filter(e=>e.shift==="صباحي").map(e=>(
            <label key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover cursor-pointer">
              <input type="checkbox" checked={morningSups.includes(e.id)} onChange={()=>toggle(setMorningSups,morningSups,e.id)} className="w-4 h-4"/>
              <span className="text-sm">{e.name.split(" ").slice(0,3).join(" ")}</span>
              <span className="text-xs text-secondary mr-auto">{e.jobNum}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="card rounded-2xl border-color border p-4 space-y-2">
        <h3 className="font-bold text-sm">مسؤولو الإدخال — النوبات</h3>
        <p className="text-xs text-secondary">كل مسؤول يمكنه إدخال عمل واحد شهرياً لنوبته</p>
        <div className="space-y-0.5 max-h-52 overflow-y-auto">
          {all.filter(e=>e.shift==="مناوبة").map(e=>(
            <label key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover cursor-pointer">
              <input type="checkbox" checked={shiftSups.includes(e.id)} onChange={()=>toggle(setShiftSups,shiftSups,e.id)} className="w-4 h-4"/>
              <span className="text-sm">{e.name.split(" ").slice(0,3).join(" ")}</span>
              <span className="text-xs text-secondary mr-auto">مج {e.group||"—"}</span>
            </label>
          ))}
        </div>
      </div>
      <button onClick={()=>{ onSave({amounts,morningSupervisors:morningSups,shiftSupervisors:shiftSups}); toast("تم حفظ الإعدادات","success"); }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">
        حفظ الإعدادات
      </button>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function IncentivePage({ emp, employees }) {
  const isAdmin = emp.role==="admin"||emp.username==="i.shawi";
  const [forms, setForms] = useState(()=>storage.get(IKEY,[]));
  const [cfg,   setCfg]   = useState(()=>storage.get(CFGKEY,DEFAULT_CFG));
  const [pv, setPv]       = useState("list");
  const [sel, setSel]     = useState(null);
  const [tab, setTab]     = useState("all");

  const isMorningSup = (cfg.morningSupervisors||[]).includes(emp.id);
  const isShiftSup   = (cfg.shiftSupervisors||[]).includes(emp.id);
  const canCreate    = isAdmin||isMorningSup||isShiftSup;

  const now = new Date();
  const alreadyThisMonth = !isAdmin && forms.some(f=>f.enteredBy===emp.id&&f.month===now.getMonth()+1&&f.year===now.getFullYear()&&f.status!=="مرفوضة");

  const save = list => { setForms(list); storage.set(IKEY,list); };
  const saveCfg = c => { setCfg(c); storage.set(CFGKEY,c); };

  const visible = forms.filter(f=>isAdmin||f.enteredBy===emp.id||f.employees?.some(e=>String(e.empId)===String(emp.id)));
  const pending = visible.filter(f=>f.status==="بانتظار المراجعة");
  const filtered = tab==="pending"?pending:tab==="mine"?visible.filter(f=>f.enteredBy===emp.id):visible;

  if (pv==="create") return <CreateForm emp={emp} employees={employees} cfg={cfg} onSave={f=>{save([f,...forms]);setPv("list");}} onCancel={()=>setPv("list")}/>;
  if (pv==="detail"&&sel) return (
    <FormDetail form={sel} emp={emp} isAdmin={isAdmin} cfg={cfg}
      onBack={()=>{setSel(null);setPv("list");}}
      onApprove={(id,status,comment)=>{const u=forms.map(f=>f.id===id?{...f,status,approvedBy:emp.id,approvedAt:new Date().toISOString(),comment}:f);save(u);setSel(u.find(f=>f.id===id));}}
      onDelete={id=>{save(forms.filter(f=>f.id!==id));setSel(null);setPv("list");}}
    />
  );
  if (pv==="settings"&&isAdmin) return <SettingsView cfg={cfg} employees={employees} onSave={c=>{saveCfg(c);setPv("list");}} onBack={()=>setPv("list")}/>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-lg">نظام المكافآت الشهرية</h2>
          <p className="text-secondary text-xs">أ: {(cfg?.amounts?.أ||100000).toLocaleString()} | ب: {(cfg?.amounts?.ب||75000).toLocaleString()} | ج: {(cfg?.amounts?.ج||50000).toLocaleString()} دينار</p>
        </div>
        <div className="flex gap-2">
          {isAdmin&&<button onClick={()=>setPv("settings")} className="p-2 btn-secondary rounded-xl border border-color" title="إعدادات"><Settings size={16}/></button>}
          {canCreate&&!alreadyThisMonth&&(
            <button onClick={()=>setPv("create")} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"><Plus size={15}/> استمارة جديدة</button>
          )}
          {canCreate&&alreadyThisMonth&&(
            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs"><AlertCircle size={13}/> تم الإدخال لهذا الشهر</div>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-color">
        {[["all","الكل",visible.length],["mine","استماراتي",visible.filter(f=>f.enteredBy===emp.id).length],["pending","معلقة",pending.length]].map(([k,l,c])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k?"border-blue-600 text-blue-600":"border-transparent text-secondary hover:text-primary"}`}>
            {l} <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${tab===k?"bg-blue-100 text-blue-700":"bg-hover text-secondary"}`}>{c}</span>
          </button>
        ))}
      </div>

      {filtered.length===0?(
        <div className="text-center py-16 text-secondary">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-medium">لا توجد استمارات</p>
          {canCreate&&!alreadyThisMonth&&<p className="text-xs mt-1">اضغط «استمارة جديدة» لإنشاء أولى استماراتك</p>}
        </div>
      ):(
        <div className="space-y-2">
          {[...filtered].sort((a,b)=>b.id-a.id).map(f=>{
            const by=ACCOUNTS.find(a=>a.id===f.enteredBy);
            const tot=(f.employees||[]).reduce((s,e)=>s+(cfg?.amounts?.[e.category]||0),0);
            return (
              <button key={f.id} onClick={()=>{setSel(f);setPv("detail");}} className="w-full card rounded-2xl border-color border p-4 text-right hover:bg-hover transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLOR[f.status]}`}>{f.status}</span>
                      <span className="text-xs text-secondary">{MONTHS_AR[(f.month||1)-1]} {f.year}</span>
                      <span className="text-xs text-secondary">— {f.formType}</span>
                    </div>
                    <p className="text-sm font-medium line-clamp-1">{f.workDescription||"—"}</p>
                    <p className="text-xs text-secondary mt-1">{f.employees?.length||0} موظف • {tot.toLocaleString()} د.ع • {by?.name?.split(" ").slice(0,2).join(" ")||"—"}</p>
                  </div>
                  <ChevronRight size={15} className="text-secondary shrink-0 mt-1"/>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
