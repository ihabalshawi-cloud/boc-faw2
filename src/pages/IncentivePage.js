import React, { useState } from "react";
import { ChevronRight, Settings, Check, X, Printer, Trash2, Users, Download } from "lucide-react";
import { storage } from "../utils";
import { ACCOUNTS } from "../constants";
import { exportWorkExcel } from "../incentiveExcel";
import { useToast, useConfirm } from "../contexts";

const EKEY = "boc_inc_entries";
const WKEY = "boc_inc_works";
const CFGKEY = "boc_incentive_cfg";
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const SC = { "مسودة":"bg-gray-100 text-gray-600","بانتظار المراجعة":"bg-amber-100 text-amber-700","موافق عليها":"bg-emerald-100 text-emerald-700","مرفوضة":"bg-red-100 text-red-700" };
const DEFAULT_CFG = { amounts:{أ:100000,ب:75000,ج:50000}, morningSupervisors:[2,3], shiftSupervisors:[] };
const sk = e => e?.title==="عقد"?"عقود":e?.shift==="صباحي"?"صباحي":(e?.group||"؟");

function exportCSV(rows, filename) {
  const BOM = "﻿";
  const csv = BOM + rows.map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.download = filename; a.click();
}

function printEntriesList(entries, cfg, title) {
  const amounts = cfg?.amounts||DEFAULT_CFG.amounts;
  const rows = entries.map((e,i)=>`<tr><td>${i+1}</td><td style="text-align:right">${e.empName}</td><td>${e.jobNum}</td><td>${sk(e)}</td><td style="font-weight:bold">${e.category}</td><td style="font-weight:bold;color:#16a34a">${(amounts[e.category]||0).toLocaleString()}</td></tr>`).join("");
  const total = entries.reduce((s,e)=>s+(amounts[e.category]||0),0);
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #000;padding:6px 8px;text-align:center}th{background:#f0f0f0}h2{text-align:center}@media print{@page{margin:1.5cm}}</style>
  </head><body>
  <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px"><p style="margin:2px;font-weight:bold">هيأة الصيانة الهندسية</p><p style="margin:2px">القسم: السيطرة والنظم</p></div>
  <h2>${title}</h2>
  <table><thead><tr><th>ت</th><th>الاسم الثلاثي</th><th>الرقم الوظيفي</th><th>النوبة/المجموعة</th><th>الفئة</th><th>المبلغ (د.ع)</th></tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td colspan="5" style="text-align:left;font-weight:bold">الإجمالي</td><td style="font-weight:bold;color:#16a34a">${total.toLocaleString()}</td></tr></tfoot></table>
  <script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close();
}

function printWork(work, entries) {
  const d = new Date(work.createdAt);
  const rows = entries.map((e,i)=>`<tr><td>${i+1}</td><td style="text-align:right">${e.empName}</td><td>${e.jobNum}</td><td style="font-weight:bold">${e.category}</td></tr>`).join("");
  const tBoxes = ["مكافأة تشغيلية","مكافأة استثمارية"].map(t=>`<span style="margin-left:24px">${t===work.formType?"☑":"☐"} ${t}</span>`).join("");
  const digs = (work.workNum||"").replace(/\s/g,"").split("").map(c=>`<span style="display:inline-block;width:22px;height:22px;border:1px solid #000;text-align:center;line-height:22px;margin:0 1px">${c}</span>`).join("");
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>استمارة مكافآت</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #000;padding:6px 8px;text-align:center}th{background:#f0f0f0}.sigs{display:flex;justify-content:space-between;margin-top:40px}p{margin:4px 0}@media print{@page{margin:1.5cm}}</style>
  </head><body>
  <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px"><p style="font-weight:bold">هيأة الصيانة الهندسية</p><p>القسم: السيطرة والنظم</p></div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="border:1px solid #ccc;padding:5px 12px;font-size:12px">${tBoxes}</div><span style="font-size:12px">الرقم التسلسلي: ${work.seqNum||"___"}</span></div>
  <p>إلى / السيد مدير هيأة الصيانة الهندسية &nbsp;&nbsp;&nbsp;&nbsp; التاريخ: ${d.getDate()}/ ${d.getMonth()+1} /${d.getFullYear()}</p>
  <p style="margin-top:10px">أدناه أسماء المستحقين للمكافآت وحسب ما مبين أدناه:</p>
  <p>عنوان العمل وموقعه والمبررات الموجبة:</p>
  <div style="border:1px solid #ccc;padding:10px;min-height:70px;white-space:pre-line;font-size:12px;margin-bottom:8px">${work.workDesc||""}</div>
  <p>رقم العمل &nbsp;&nbsp; ${digs||"____________________"}</p>
  <table><thead><tr><th>ت</th><th>الاسم الثلاثي</th><th>الرقم الوظيفي</th><th>الفئة</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="sigs"><div style="text-align:center"><p style="font-weight:bold">مدير القسم</p><br/><br/><p>.................................</p></div><div style="text-align:center"><p style="font-weight:bold">مدير هيأة الصيانة الهندسية</p><br/><br/><p>.................................</p></div></div>
  </body></html>`;
  const win = window.open("","_blank"); win.document.write(html); win.document.close(); win.print();
}

// ── Employee: self-register only ───────────────────────────────────────────────
function MyRegistration({ emp, entries, setEntries }) {
  const toast = useToast();
  const confirm = useConfirm();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [cat,   setCat]   = useState("أ");
  const myEntries  = entries.filter(e=>e.empId===emp.id).sort((a,b)=>b.id-a.id);
  const alreadyThis = myEntries.find(e=>e.month===month&&e.year===year);

  const save = () => {
    if (alreadyThis) { toast("لقد سجلت لهذا الشهر مسبقاً","warning"); return; }
    const entry = { id:Date.now(), empId:emp.id, empName:emp.name, jobNum:emp.jobNum,
      category:cat, month, year, shiftKey:sk(emp), isContract:emp.title==="عقد",
      addedAt:new Date().toISOString() };
    const up = [entry,...entries]; setEntries(up); storage.set(EKEY,up);
    toast("تم تسجيلك بنجاح","success");
  };

  const del = async (id) => {
    if (await confirm("حذف هذا التسجيل؟")) {
      const up = entries.filter(e=>e.id!==id); setEntries(up); storage.set(EKEY,up);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="font-bold text-sm text-secondary">تسجيل نفسك في المكافأة</h3>
      <div className="card rounded-2xl border border-color p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-secondary block mb-1">الشهر</label>
            <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color">
              {MONTHS_AR.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
            </select></div>
          <div><label className="text-xs text-secondary block mb-1">السنة</label>
            <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
        </div>
        {alreadyThis ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-emerald-700">✓ مسجل — فئة {alreadyThis.category}</p>
            <p className="text-xs text-emerald-600">{MONTHS_AR[month-1]} {year}</p>
          </div>
        ) : (
          <>
            <div><label className="text-xs text-secondary block mb-1">الفئة</label>
              <div className="flex gap-2">
                {["أ","ب","ج"].map(c=>(
                  <button key={c} onClick={()=>setCat(c)} className={`flex-1 py-2 rounded-lg border font-bold text-sm transition-colors ${cat===c?"bg-blue-600 text-white border-blue-600":"border-color hover:bg-hover"}`}>{c}</button>
                ))}
              </div></div>
            <button onClick={save} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">تسجيل نفسي</button>
          </>
        )}
      </div>
      {myEntries.length > 0 && (
        <div>
          <p className="text-xs font-bold text-secondary mb-2">سجل تسجيلاتي</p>
          <div className="space-y-1">
            {myEntries.map(e=>(
              <div key={e.id} className="flex items-center justify-between card rounded-xl border border-color p-3">
                <div><span className="text-sm font-medium">{MONTHS_AR[e.month-1]} {e.year}</span>
                  <span className="text-xs text-secondary mr-2">فئة {e.category}</span></div>
                <button onClick={()=>del(e.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared table of registrations ──────────────────────────────────────────────
function EntriesTable({ entries, cfg, label }) {
  const amounts = cfg?.amounts||DEFAULT_CFG.amounts;
  const total   = entries.reduce((s,e)=>s+(amounts[e.category]||0),0);
  if (!entries.length) return <p className="text-xs text-secondary text-center py-6">{label ? `لا توجد تسجيلات في ${label}` : "لا توجد تسجيلات"}</p>;
  return (
    <div className="card rounded-2xl border border-color overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-color">
        <p className="font-bold text-sm"><Users size={13} className="inline ml-1 mb-0.5"/>{label} ({entries.length})</p>
        <span className="text-xs font-bold text-emerald-600">{total.toLocaleString()} د.ع</span>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm min-w-[360px]">
        <thead className="bg-hover text-xs text-secondary"><tr>
          <th className="p-2 text-center">ت</th><th className="p-2 text-right">الاسم</th>
          <th className="p-2 text-center">الوظيفي</th><th className="p-2 text-center">الفئة</th><th className="p-2 text-center">المبلغ</th>
        </tr></thead>
        <tbody>{entries.map((e,i)=>(
          <tr key={e.id} className="border-t border-color">
            <td className="p-2 text-center text-xs text-secondary">{i+1}</td>
            <td className="p-2 font-medium">{e.empName}</td>
            <td className="p-2 text-center text-secondary">{e.jobNum}</td>
            <td className="p-2 text-center font-bold text-blue-600 text-base">{e.category}</td>
            <td className="p-2 text-center font-bold text-emerald-600">{(amounts[e.category]||0).toLocaleString()}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

// ── Supervisor: enter work description (one per month per group) ───────────────
function WorkForm({ emp, shiftKey, works, setWorks, month, year }) {
  const toast = useToast();
  const existing = works.find(w=>w.shiftKey===shiftKey&&w.month===month&&w.year===year&&w.status!=="مرفوضة");
  const [fType,  setFType]  = useState(existing?.formType||"مكافأة تشغيلية");
  const [desc,   setDesc]   = useState(existing?.workDesc||"");
  const [wNum,   setWNum]   = useState(existing?.workNum||"");
  const [seqNum, setSeqNum] = useState(existing?.seqNum||"");

  if (existing && existing.status !== "مسودة") return (
    <div className="card rounded-2xl border border-color p-4 space-y-2">
      <p className="text-xs text-secondary">العمل المُدخل لـ {MONTHS_AR[month-1]} {year}</p>
      <p className="text-sm font-medium whitespace-pre-line">{existing.workDesc}</p>
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${SC[existing.status]}`}>{existing.status}</span>
    </div>
  );

  const save = (status) => {
    if (!desc.trim()) { toast("أدخل وصف العمل","warning"); return; }
    let up;
    if (existing) {
      up = works.map(w=>w.id===existing.id?{...w,formType:fType,workDesc:desc,workNum:wNum,seqNum,status}:w);
    } else {
      up = [{id:Date.now(),month,year,shiftKey,formType:fType,workDesc:desc,workNum:wNum,seqNum,enteredBy:emp.id,status,createdAt:new Date().toISOString()},...works];
    }
    setWorks(up); storage.set(WKEY,up);
    toast(status==="بانتظار المراجعة"?"تم الإرسال للمراجعة":"تم الحفظ","success");
  };

  return (
    <div className="card rounded-2xl border border-color p-4 space-y-3">
      <h4 className="font-bold text-sm">العمل المنجز — {shiftKey} — {MONTHS_AR[month-1]} {year}</h4>
      <div className="flex gap-2">
        {["مكافأة تشغيلية","مكافأة استثمارية"].map(t=>(
          <button key={t} onClick={()=>setFType(t)} className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${fType===t?"bg-blue-600 text-white border-blue-600":"border-color hover:bg-hover"}`}>{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-secondary block mb-1">الرقم التسلسلي</label>
          <input value={seqNum} onChange={e=>setSeqNum(e.target.value)} placeholder="اختياري" className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
        <div><label className="text-xs text-secondary block mb-1">رقم العمل</label>
          <input value={wNum} onChange={e=>setWNum(e.target.value)} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
      </div>
      <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="عنوان العمل والمبررات الموجبة..." className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color resize-none"/>
      <div className="flex gap-3">
        <button onClick={()=>save("مسودة")} className="flex-1 py-2 btn-secondary border border-color rounded-xl text-sm">حفظ مسودة</button>
        <button onClick={()=>save("بانتظار المراجعة")} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">إرسال للمراجعة</button>
      </div>
    </div>
  );
}

// ── Supervisor: view their group's registrations + enter work ──────────────────
function GroupView({ emp, entries, works, setWorks, shiftKey, cfg }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());
  const groupEntries    = entries.filter(e=>e.month===month&&e.year===year&&!e.isContract);
  const contractEntries = entries.filter(e=>e.isContract&&e.month===month&&e.year===year);
  const existingWork    = works.find(w=>w.shiftKey===shiftKey&&w.month===month&&w.year===year&&w.status!=="مرفوضة");

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-secondary block mb-1">الشهر</label>
          <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color">
            {MONTHS_AR.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select></div>
        <div><label className="text-xs text-secondary block mb-1">السنة</label>
          <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
      </div>
      <WorkForm emp={emp} shiftKey={shiftKey} works={works} setWorks={setWorks} month={month} year={year}/>
      {existingWork && groupEntries.length > 0 && (
        <div className="flex justify-end gap-2">
          <button onClick={()=>exportWorkExcel(existingWork,groupEntries)} className="flex items-center gap-1 px-3 py-1.5 btn-secondary border border-color rounded-lg text-sm"><Download size={13}/> Excel</button>
          <button onClick={()=>printWork(existingWork,groupEntries)} className="flex items-center gap-1 px-3 py-1.5 btn-secondary border border-color rounded-lg text-sm"><Printer size={13}/> طباعة</button>
        </div>
      )}
      <EntriesTable entries={groupEntries} cfg={cfg} label="جميع المسجلين"/>
      {contractEntries.length > 0 && <EntriesTable entries={contractEntries} cfg={cfg} label="العقود"/>}
    </div>
  );
}

// ── Admin: work detail + approve/reject ────────────────────────────────────────
function WorkDetail({ work, entries, emp, cfg, works, setWorks, onBack }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [comment, setComment] = useState(work.comment||"");
  const wEntries = entries.filter(e=>e.shiftKey===work.shiftKey&&e.month===work.month&&e.year===work.year&&!e.isContract);
  const enteredBy = ACCOUNTS.find(a=>a.id===work.enteredBy);

  const approve = async (status) => {
    if (status==="مرفوضة"&&!comment.trim()) { toast("أضف سبب الرفض","warning"); return; }
    if (await confirm(`${status==="موافق عليها"?"الموافقة على":"رفض"} هذا العمل؟`)) {
      const up = works.map(w=>w.id===work.id?{...w,status,approvedBy:emp.id,approvedAt:new Date().toISOString(),comment}:w);
      setWorks(up); storage.set(WKEY,up); onBack();
    }
  };

  const del = async () => {
    if (await confirm("حذف هذا العمل نهائياً؟")) {
      const up = works.filter(w=>w.id!==work.id); setWorks(up); storage.set(WKEY,up); onBack();
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronRight size={16}/> رجوع</button>
        <h2 className="font-bold flex-1">تفاصيل العمل</h2>
        <button onClick={()=>exportWorkExcel(work,wEntries)} className="flex items-center gap-1 px-3 py-1.5 btn-secondary border border-color rounded-lg text-sm"><Download size={14}/> Excel</button>
        <button onClick={()=>printWork(work,wEntries)} className="flex items-center gap-1 px-3 py-1.5 btn-secondary border border-color rounded-lg text-sm"><Printer size={14}/> طباعة</button>
        <button onClick={del} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15}/></button>
      </div>
      <div className="card rounded-2xl border border-color p-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SC[work.status]}`}>{work.status}</span>
          <span className="text-sm font-bold">{work.formType}</span>
          <span className="text-xs text-secondary">{MONTHS_AR[(work.month||1)-1]} {work.year} — {work.shiftKey}</span>
        </div>
        <p className="text-sm bg-hover rounded-lg p-3 whitespace-pre-line">{work.workDesc}</p>
        <p className="text-xs text-secondary">رقم العمل: {work.workNum||"—"} | أدخله: {enteredBy?.name?.split(" ").slice(0,2).join(" ")||"—"}</p>
        {work.comment && <p className="text-xs bg-amber-50 p-2 rounded-lg border border-amber-100">{work.comment}</p>}
      </div>
      <EntriesTable entries={wEntries} cfg={cfg} label={work.shiftKey}/>
      {work.status==="بانتظار المراجعة" && (
        <div className="card rounded-2xl border border-color p-4 space-y-3">
          <h3 className="font-bold text-sm">مراجعة العمل</h3>
          <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="ملاحظات (إلزامي عند الرفض)..." rows={2} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color resize-none"/>
          <div className="flex gap-3">
            <button onClick={()=>approve("مرفوضة")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50"><X size={15}/> رفض</button>
            <button onClick={()=>approve("موافق عليها")} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"><Check size={15}/> موافقة</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────────
function SettingsView({ cfg, onSave, onBack }) {
  const toast = useToast();
  const [amounts,    setAmounts]    = useState({...DEFAULT_CFG.amounts,...(cfg?.amounts||{})});
  const [morningSups,setMorningSups]= useState(cfg?.morningSupervisors||[2,3]);
  const [shiftSups,  setShiftSups]  = useState(cfg?.shiftSupervisors||[]);
  const all = ACCOUNTS.filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  const tog = (setter,list,id) => setter(list.includes(id)?list.filter(x=>x!==id):[...list,id]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronRight size={16}/> رجوع</button>
        <h2 className="font-bold">إعدادات المكافآت</h2>
      </div>
      <div className="card rounded-2xl border border-color p-4 space-y-3">
        <h3 className="font-bold text-sm">مبالغ الفئات (دينار عراقي)</h3>
        {["أ","ب","ج"].map(c=>(
          <div key={c} className="flex items-center gap-3">
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">{c}</span>
            <input type="number" value={amounts[c]} onChange={e=>setAmounts(p=>({...p,[c]:Number(e.target.value)}))} className="flex-1 input-base rounded-lg px-3 py-2 text-sm border border-color"/>
            <span className="text-xs text-secondary">د.ع</span>
          </div>
        ))}
      </div>
      <div className="card rounded-2xl border border-color p-4 space-y-2">
        <h3 className="font-bold text-sm">مسؤولو الصباحي</h3>
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {all.filter(e=>e.shift==="صباحي").map(e=>(
            <label key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover cursor-pointer">
              <input type="checkbox" checked={morningSups.includes(e.id)} onChange={()=>tog(setMorningSups,morningSups,e.id)} className="w-4 h-4"/>
              <span className="text-sm">{e.name.split(" ").slice(0,3).join(" ")}</span>
              <span className="text-xs text-secondary mr-auto">{e.jobNum}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="card rounded-2xl border border-color p-4 space-y-2">
        <h3 className="font-bold text-sm">مسؤولو النوبات</h3>
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {all.filter(e=>e.shift==="مناوبة").map(e=>(
            <label key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover cursor-pointer">
              <input type="checkbox" checked={shiftSups.includes(e.id)} onChange={()=>tog(setShiftSups,shiftSups,e.id)} className="w-4 h-4"/>
              <span className="text-sm">{e.name.split(" ").slice(0,3).join(" ")}</span>
              <span className="text-xs text-secondary mr-auto">مج {e.group||"—"}</span>
            </label>
          ))}
        </div>
      </div>
      <button onClick={()=>{onSave({amounts,morningSupervisors:morningSups,shiftSupervisors:shiftSups});toast("تم حفظ الإعدادات","success");}} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">
        حفظ الإعدادات
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function IncentivePage({ emp }) {
  const isAdmin      = emp.role==="admin"||emp.username==="i.shawi";
  const [entries, setEntries] = useState(()=>storage.get(EKEY,[]));
  const [works,   setWorks]   = useState(()=>storage.get(WKEY,[]));
  const [cfg,     setCfg]     = useState(()=>storage.get(CFGKEY,DEFAULT_CFG));
  const [pv,      setPv]      = useState("main");
  const [selWork, setSelWork] = useState(null);
  const [tab,     setTab]     = useState("reg");
  const [aMonth,  setAMonth]  = useState(new Date().getMonth()+1);
  const [aYear,   setAYear]   = useState(new Date().getFullYear());

  const isMorningSup = (cfg.morningSupervisors||[]).includes(emp.id);
  const isShiftSup   = (cfg.shiftSupervisors||[]).includes(emp.id);
  const isSup        = isMorningSup || isShiftSup;
  const myShiftKey   = sk(emp);

  const saveCfg = c => { setCfg(c); storage.set(CFGKEY,c); };

  if (pv==="settings"&&isAdmin) return <SettingsView cfg={cfg} onSave={c=>{saveCfg(c);setPv("main");}} onBack={()=>setPv("main")}/>;
  if (pv==="detail"&&selWork) return (
    <WorkDetail work={selWork} entries={entries} emp={emp} cfg={cfg} works={works} setWorks={setWorks}
      onBack={()=>{setSelWork(null);setPv("main");}}/>
  );

  const header = (
    <div className="flex items-center justify-between">
      <div><h2 className="font-bold text-lg">نظام المكافآت الشهرية</h2>
        <p className="text-xs text-secondary">أ: {(cfg?.amounts?.أ||100000).toLocaleString()} | ب: {(cfg?.amounts?.ب||75000).toLocaleString()} | ج: {(cfg?.amounts?.ج||50000).toLocaleString()} دينار</p>
      </div>
      {isAdmin && <button onClick={()=>setPv("settings")} className="p-2 btn-secondary rounded-xl border border-color"><Settings size={16}/></button>}
    </div>
  );

  const Tabs = ({items}) => (
    <div className="flex gap-1 border-b border-color">
      {items.map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k?"border-blue-600 text-blue-600":"border-transparent text-secondary hover:text-primary"}`}>{l}</button>
      ))}
    </div>
  );

  // Admin
  if (isAdmin) {
    const pending = works.filter(w=>w.status==="بانتظار المراجعة");
    const allForMonth = entries.filter(e=>e.month===aMonth&&e.year===aYear&&!e.isContract);
    const contractsForMonth = entries.filter(e=>e.month===aMonth&&e.year===aYear&&e.isContract);
    return (
      <div className="space-y-4" dir="rtl">
        {header}
        <Tabs items={[["reg","تسجيلي"],["all",`المسجلون${allForMonth.length?` (${allForMonth.length})`:"" }`],["works",`الأعمال${pending.length?` (${pending.length})`:"" }`],["contracts","العقود"]]}/>
        {tab==="reg" && <MyRegistration emp={emp} entries={entries} setEntries={setEntries}/>}
        {tab==="all" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-secondary block mb-1">الشهر</label>
                <select value={aMonth} onChange={e=>setAMonth(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color">
                  {MONTHS_AR.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                </select></div>
              <div><label className="text-xs text-secondary block mb-1">السنة</label>
                <input type="number" value={aYear} onChange={e=>setAYear(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
            </div>
            {allForMonth.length>0&&(
              <div className="flex gap-2 justify-end">
                <button onClick={()=>printEntriesList(allForMonth,cfg,`المسجلون — ${MONTHS_AR[aMonth-1]} ${aYear}`)} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Printer size={14}/> طباعة</button>
                <button onClick={()=>{const h=["ت","الاسم","الرقم الوظيفي","النوبة","الفئة","المبلغ"];const r=allForMonth.map((e,i)=>[i+1,e.empName,e.jobNum,sk(e),e.category,(cfg?.amounts||DEFAULT_CFG.amounts)[e.category]||0]);exportCSV([h,...r],`مسجلون-${MONTHS_AR[aMonth-1]}-${aYear}.csv`);}} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Download size={14}/> Excel</button>
              </div>
            )}
            <EntriesTable entries={allForMonth} cfg={cfg} label="جميع المسجلين"/>
          </div>
        )}
        {tab==="works" && (works.length===0 ? (
          <div className="text-center py-12 text-secondary"><p className="text-4xl mb-2">📋</p><p>لا توجد أعمال مدخلة</p></div>
        ) : (
          <div className="space-y-2">
            {[...works].sort((a,b)=>b.id-a.id).map(w=>(
              <button key={w.id} onClick={()=>{setSelWork(w);setPv("detail");}} className="w-full card rounded-2xl border border-color p-4 text-right hover:bg-hover transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-center mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${SC[w.status]}`}>{w.status}</span>
                      <span className="text-xs text-secondary">{MONTHS_AR[(w.month||1)-1]} {w.year} — {w.shiftKey}</span>
                    </div>
                    <p className="text-sm font-medium line-clamp-1">{w.workDesc||"—"}</p>
                    <p className="text-xs text-secondary mt-1">{entries.filter(e=>e.shiftKey===w.shiftKey&&e.month===w.month&&e.year===w.year&&!e.isContract).length} موظف مسجل</p>
                  </div>
                  <ChevronRight size={15} className="text-secondary shrink-0 mt-1"/>
                </div>
              </button>
            ))}
          </div>
        ))}
        {tab==="contracts" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-secondary block mb-1">الشهر</label>
                <select value={aMonth} onChange={e=>setAMonth(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color">
                  {MONTHS_AR.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                </select></div>
              <div><label className="text-xs text-secondary block mb-1">السنة</label>
                <input type="number" value={aYear} onChange={e=>setAYear(Number(e.target.value))} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
            </div>
            {contractsForMonth.length>0&&(
              <div className="flex gap-2 justify-end">
                <button onClick={()=>printEntriesList(contractsForMonth,cfg,`العقود — ${MONTHS_AR[aMonth-1]} ${aYear}`)} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Printer size={14}/> طباعة</button>
                <button onClick={()=>{const h=["ت","الاسم","الرقم الوظيفي","النوبة","الفئة","المبلغ"];const r=contractsForMonth.map((e,i)=>[i+1,e.empName,e.jobNum,sk(e),e.category,(cfg?.amounts||DEFAULT_CFG.amounts)[e.category]||0]);exportCSV([h,...r],`عقود-${MONTHS_AR[aMonth-1]}-${aYear}.csv`);}} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Download size={14}/> Excel</button>
              </div>
            )}
            <EntriesTable entries={contractsForMonth} cfg={cfg} label="العقود"/>
          </div>
        )}
      </div>
    );
  }

  // Supervisor
  if (isSup) return (
    <div className="space-y-4" dir="rtl">
      {header}
      <Tabs items={[["reg","تسجيلي"],["group","مجموعتي"]]}/>
      {tab==="reg"   && <MyRegistration emp={emp} entries={entries} setEntries={setEntries}/>}
      {tab==="group" && <GroupView emp={emp} entries={entries} works={works} setWorks={setWorks} shiftKey={myShiftKey} cfg={cfg}/>}
    </div>
  );

  // Regular employee
  return (
    <div className="space-y-4" dir="rtl">
      {header}
      <MyRegistration emp={emp} entries={entries} setEntries={setEntries}/>
    </div>
  );
}
