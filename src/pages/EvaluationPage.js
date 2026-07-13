import React, { useState, useEffect } from "react";
import { Save, Download, Star, Plus, CheckCircle, Settings, Edit2 } from "lucide-react";
import { MONTHS_IRAQI, EVAL_CRITERIA, EVAL_CRITERIA_DATA } from "../constants";
import { FirebaseAPI } from "../firebase";
import { sendBackgroundPush } from "../components/Shared";

const BULK_RATINGS=["متوسط","جيد","جيد جدا","ممتاز"];
const BULK_REQ={متوسط:5,جيد:20,"جيد جدا":40,ممتاز:35};
const BULK_RCOLOR={متوسط:"bg-red-100 text-red-700",جيد:"bg-amber-100 text-amber-700","جيد جدا":"bg-blue-100 text-blue-700",ممتاز:"bg-emerald-100 text-emerald-700"};
const BULK_DEPT="شعبة سيطرة مستودع الفاو والمرافئ";
const GL=(s)=>s>=90?"ممتاز":s>=75?"جيد جداً":s>=60?"جيد":s>=50?"مقبول":"ضعيف";
const GC=(s)=>s>=90?"text-emerald-600":s>=75?"text-blue-600":s>=60?"text-amber-600":"text-red-600";

// ── نظام التقييم الذاتي ─────────────────────────────────────────────────────
// أول 11 مرسل → حدّ أقصى جيد جداً | 12-17 → جيد | 18+ → متوسط
// من يملك مهارة القيادة → يمكنه الوصول لممتاز
const SELF_GRADES=["متوسط","جيد","جيد جداً","ممتاز"];
const SGC={ممتاز:"text-emerald-600","جيد جداً":"text-blue-600",جيد:"text-amber-600",متوسط:"text-orange-500"};
function calcSelfGrade(rawPct,rank,hasLeadership){
  if(hasLeadership){
    if(rawPct>=90)return{grade:"ممتاز",color:"text-emerald-600"};
    if(rawPct>=75)return{grade:"جيد جداً",color:"text-blue-600"};
    if(rawPct>=60)return{grade:"جيد",color:"text-amber-600"};
    return{grade:"متوسط",color:"text-orange-500"};
  }
  if(rank>17)return{grade:"متوسط",color:"text-orange-500"};
  if(rank>11){
    if(rawPct>=60)return{grade:"جيد",color:"text-amber-600"};
    return{grade:"متوسط",color:"text-orange-500"};
  }
  if(rawPct>=75)return{grade:"جيد جداً",color:"text-blue-600"};
  if(rawPct>=60)return{grade:"جيد",color:"text-amber-600"};
  return{grade:"متوسط",color:"text-orange-500"};
}

function BulkEvaluationPanel({ emp, allEmployees }) {
  const now=new Date();
  const [selMonth,setSelMonth]=useState(now.getMonth());
  const [selYear,setSelYear]=useState(now.getFullYear());
  const [ratings,setRatings]=useState({});
  const [toast,setToast]=useState("");
  const T=(m)=>{setToast(m);setTimeout(()=>setToast(""),3000);};
  useEffect(()=>{FirebaseAPI.loadBulkEval(selYear,selMonth).then(d=>setRatings(d?.ratings||{}));},[selYear,selMonth]);
  const dist=BULK_RATINGS.reduce((a,r)=>({...a,[r]:Object.values(ratings).filter(x=>x===r).length}),{});
  const pct=(n)=>allEmployees.length>0?Math.round(n/allEmployees.length*100):0;
  const save=async()=>T((await FirebaseAPI.saveBulkEval(selYear,selMonth,{ratings,savedBy:emp.name,month:selMonth,year:selYear}))?"✅ تم الحفظ":"⚠️ فشل الحفظ");
  const exportXls=async()=>{
    try{
      const mod=await import("exceljs");const ExcelJS=mod.default||mod;
      const wb=new ExcelJS.Workbook();await wb.xlsx.load(await(await fetch("/templates/eval-monthly.xlsx")).arrayBuffer());
      const ws=wb.worksheets[0];ws.getCell("B2").value=" "+MONTHS_IRAQI[selMonth]+" "+selYear;
      ws.eachRow((row,rn)=>{if(rn<4)return;const jn=String(row.getCell(2).value||"").trim();const e=allEmployees.find(x=>String(x.jobNum)===jn);if(e&&ratings[e.id])row.getCell(4).value=ratings[e.id];});
      const buf=await wb.xlsx.writeBuffer();const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));a.download=`تقييم_${MONTHS_IRAQI[selMonth]}_${selYear}.xlsx`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(a.href);T("✅ تم التصدير");
    }catch{T("⚠️ فشل التصدير");}
  };
  const printPDF=()=>{
    const rows=allEmployees.map((e,i)=>`<tr><td>${i+1}</td><td>${e.jobNum}</td><td>${e.name}</td><td>${BULK_DEPT}</td><td>${ratings[e.id]||"—"}</td></tr>`).join("");
    const w=window.open("","_blank");w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/><title>تقييم</title><style>body{font-family:Arial;padding:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #000;padding:6px;text-align:right}h2,h3{text-align:center}th{background:#e8e8e8}</style></head><body><h2>شركة نفط البصرة</h2><h3>التقييم الشهري — ${MONTHS_IRAQI[selMonth]} ${selYear}</h3><table><thead><tr><th>ت</th><th>الرقم الوظيفي</th><th>اسم الموظف</th><th>الشعبة</th><th>التقييم</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
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
        <tbody>{allEmployees.map((e,i)=>(<tr key={e.id} className="border-b border-color"><td className="px-3 py-2 text-secondary text-xs">{i+1}</td><td className="px-3 py-2 font-mono text-secondary text-xs">{e.jobNum}</td><td className="px-3 py-2 font-medium">{e.name}</td><td className="px-3 py-2 text-center"><select value={ratings[e.id]||""} onChange={ev=>setRatings(p=>({...p,[e.id]:ev.target.value}))} className="input text-xs rounded-lg px-2 py-1"><option value="">—</option>{BULK_RATINGS.map(r=><option key={r}>{r}</option>)}</select></td></tr>))}</tbody></table></div></div>
      {toast&&<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

function IndividualEvalPanel({ emp, allEmployees }) {
  const [evals,setEvals]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [selEmp,setSelEmp]=useState("");
  const [selMonth,setSelMonth]=useState(new Date().getMonth());
  const [selYear,setSelYear]=useState(new Date().getFullYear());
  const [scores,setScores]=useState(Object.fromEntries(EVAL_CRITERIA.map(c=>[c,3])));
  const [notes,setNotes]=useState("");
  const [toast,setToast]=useState("");
  const T=(m)=>{setToast(m);setTimeout(()=>setToast(""),3000);};
  useEffect(()=>{FirebaseAPI.loadEvaluations().then(list=>{if(list&&list.length>0)setEvals(list);});},[]);
  const saveEval=()=>{
    if(!selEmp)return T("اختر الموظف");
    const emp2=allEmployees.find(e=>e.id===Number(selEmp));
    const total=Math.round(Object.values(scores).reduce((s,v)=>s+v,0)/EVAL_CRITERIA.length*20);
    const newEval={id:Date.now(),empId:Number(selEmp),empName:emp2?.name,month:selMonth,year:selYear,scores:{...scores},total,notes,evaluatedBy:emp.name,createdAt:new Date().toISOString()};
    const updated=[newEval,...evals.filter(e=>!(e.empId===Number(selEmp)&&e.month===selMonth&&e.year===selYear))];
    setEvals(updated);FirebaseAPI.saveEvaluations(updated);setShowForm(false);T("✅ تم حفظ التقييم");
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">التقييمات الفردية</h3><button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 px-3 py-2 rounded-xl"><Plus size={13}/> تقييم جديد</button></div>
      {showForm&&(<div className="card rounded-2xl border-2 border-indigo-200 p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <select value={selEmp} onChange={e=>setSelEmp(e.target.value)} className="input rounded-xl px-3 py-2 text-sm"><option value="">-- اختر موظفاً --</option>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}</select>
          <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
        </div>
        <div className="space-y-3">{EVAL_CRITERIA.map(c=>(<div key={c} className="flex items-center gap-3"><span className="text-sm flex-1">{c}</span><div className="flex gap-1">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setScores({...scores,[c]:n})} className={`w-8 h-8 rounded-full text-sm font-bold ${scores[c]===n?"bg-indigo-600 text-white":"border border-color"}`}>{n}</button>)}</div></div>))}</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="ملاحظات التقييم" className="input rounded-xl px-3 py-2 text-sm w-full"/>
        <div className="flex gap-2 justify-end"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveEval} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl"><Save size={13}/> حفظ</button></div>
      </div>)}
      <div className="space-y-3">{evals.length===0?<div className="card rounded-2xl p-8 text-center border-color border"><Star size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد تقييمات</p></div>:
        evals.map(ev=>(<div key={ev.id} className="card rounded-2xl border-color border p-4"><div className="flex justify-between items-start"><div><p className="font-bold">{ev.empName}</p><p className="text-xs text-secondary">{MONTHS_IRAQI[ev.month]} {ev.year} — بواسطة {ev.evaluatedBy}</p>{ev.notes&&<p className="text-xs text-secondary italic mt-1">{ev.notes}</p>}<div className="flex flex-wrap gap-1 mt-2">{EVAL_CRITERIA.map(c=><span key={c} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{c}: {ev.scores?.[c]||0}/5</span>)}</div></div><div className="text-center shrink-0 mr-4"><p className={`text-3xl font-bold ${GC(ev.total)}`}>{ev.total}%</p><p className={`text-xs font-bold ${GC(ev.total)}`}>{GL(ev.total)}</p></div></div></div>))}</div>
      {toast&&<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

function AssignPanel({ allEmployees }) {
  const now=new Date();
  const [selMonth,setSelMonth]=useState(now.getMonth());
  const [selYear,setSelYear]=useState(now.getFullYear());
  const [assignments,setAssignments]=useState({});
  const [leadershipIds,setLeadershipIds]=useState([]);
  const [showLdr,setShowLdr]=useState(false);
  const [toast,setToast]=useState("");
  const T=(m)=>{setToast(m);setTimeout(()=>setToast(""),3000);};
  useEffect(()=>{
    FirebaseAPI.loadEvalAssignments(selYear,selMonth).then(d=>setAssignments(d||{}));
    FirebaseAPI.loadEvalCfg().then(d=>setLeadershipIds(d?.leadershipIds||[]));
  },[selYear,selMonth]);
  const toggleA=(id)=>setAssignments(p=>{const k=String(id);const next={...p};next[k]?delete next[k]:(next[k]=true);return next;});
  const toggleL=(id)=>setLeadershipIds(p=>p.includes(String(id))?p.filter(x=>x!==String(id)):[...p,String(id)]);
  const assignAll=()=>setAssignments(Object.fromEntries(allEmployees.map(e=>[String(e.id),true])));
  const clearAll=()=>setAssignments({});
  const save=async()=>{
    const ok1=await FirebaseAPI.saveEvalAssignments(selYear,selMonth,assignments);
    const ok2=await FirebaseAPI.saveEvalCfg({leadershipIds});
    if(ok1&&ok2){
      const monthLabel=MONTHS_IRAQI[selMonth];
      const title=`⭐ إسناد تقييم ذاتي — ${monthLabel} ${selYear}`;
      const body="تم إسنادك للتقييم الذاتي، يرجى فتح التطبيق وإتمام التقييم";
      await Promise.all(Object.keys(assignments).map(async(eid)=>{
        const notif={id:Date.now()+Number(eid),type:"تقييم",title,body,timestamp:new Date().toISOString(),read:false};
        const prev=await FirebaseAPI.loadNotifications(eid)||[];
        await FirebaseAPI.saveNotifications(eid,[notif,...prev]);
        sendBackgroundPush(eid,title,body,"تقييم");
      }));
    }
    T(ok1&&ok2?"✅ تم الحفظ والإشعار":"⚠️ فشل الحفظ");
  };
  const assignedCount=Object.keys(assignments).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2"><select value={selMonth} onChange={e=>setSelMonth(+e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select><select value={selYear} onChange={e=>setSelYear(+e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select></div>
        <div className="flex gap-2"><button onClick={assignAll} className="text-xs font-bold text-indigo-600 border border-indigo-200 px-3 py-2 rounded-xl">تحديد الكل</button><button onClick={clearAll} className="text-xs font-bold text-secondary border border-color px-3 py-2 rounded-xl">إلغاء الكل</button><button onClick={save} className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 px-3 py-2 rounded-xl"><Save size={13}/>حفظ</button></div>
      </div>
      <p className="text-sm text-secondary">مُسند لـ {assignedCount} موظف من أصل {allEmployees.length}</p>
      <div className="card rounded-2xl border border-color overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm" dir="rtl"><thead><tr className="bg-gray-50 border-b border-color"><th className="px-3 py-2 text-right">الموظف</th><th className="px-3 py-2 text-right">الرقم</th><th className="px-3 py-2 text-center">إسناد تقييم ذاتي</th></tr></thead>
        <tbody>{allEmployees.map(e=>(<tr key={e.id} className="border-b border-color"><td className="px-3 py-2 font-medium">{e.name.split(" ").slice(0,3).join(" ")}</td><td className="px-3 py-2 text-secondary text-xs">{e.jobNum}</td><td className="px-3 py-2 text-center"><button onClick={()=>toggleA(e.id)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${assignments[String(e.id)]?"bg-indigo-600 text-white":"border border-color text-secondary hover:bg-indigo-50"}`}>{assignments[String(e.id)]?"✓ مُسند":"إسناد"}</button></td></tr>))}</tbody></table></div></div>
      <div className="card rounded-2xl border border-amber-200 overflow-hidden">
        <button onClick={()=>setShowLdr(p=>!p)} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-amber-700 hover:bg-amber-50">
          <Settings size={15}/> إعدادات معيار القيادة (تفعيل درجة ممتاز) {showLdr?"▲":"▼"}
        </button>
        {showLdr&&<div className="border-t border-amber-200 p-4 space-y-2">
          <p className="text-xs text-secondary mb-3">الموظفون المفعّلون هنا يمكنهم الحصول على تقييم <strong>ممتاز</strong> — الباقون لا يتجاوزون <strong>جيد جداً</strong></p>
          {allEmployees.map(e=>(<div key={e.id} className="flex items-center justify-between py-1.5 border-b border-color last:border-0">
            <div><p className="text-sm">{e.name.split(" ").slice(0,3).join(" ")}</p><p className="text-xs text-secondary">{e.title}</p></div>
            <button onClick={()=>toggleL(e.id)} className={`px-3 py-1 rounded-lg text-xs font-bold ${leadershipIds.includes(String(e.id))?"bg-amber-500 text-white":"border border-color text-secondary"}`}>{leadershipIds.includes(String(e.id))?"✓ مفعّل":"تفعيل"}</button>
          </div>))}
        </div>}
      </div>
      {toast&&<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

function ResultsPanel({ allEmployees }) {
  const now=new Date();
  const [selMonth,setSelMonth]=useState(now.getMonth());
  const [selYear,setSelYear]=useState(now.getFullYear());
  const [evals,setEvals]=useState({});
  const [editId,setEditId]=useState(null);
  const [editGrade,setEditGrade]=useState("");
  const [editNote,setEditNote]=useState("");
  const [toast,setToast]=useState("");
  const T=(m)=>{setToast(m);setTimeout(()=>setToast(""),3000);};
  useEffect(()=>{setEditId(null);FirebaseAPI.loadSelfEvals(selYear,selMonth).then(d=>setEvals(d||{}));},[selYear,selMonth]);
  const submitted=allEmployees.filter(e=>evals[String(e.id)]).sort((a,b)=>(evals[String(a.id)]?.rank||99)-(evals[String(b.id)]?.rank||99));
  const startEdit=(e)=>{const ev=evals[String(e.id)];const gi=calcSelfGrade(ev.rawTotal||ev.total||0,ev.rank||99,ev.hasLeadership);setEditId(e.id);setEditGrade(ev.adminGrade||gi.grade);setEditNote(ev.adminNote||"");};
  const saveOverride=async(e)=>{
    if(!editNote.trim())return T("⚠️ يجب كتابة سبب التعديل");
    const eid=String(e.id);
    const updated={...evals[eid],adminGrade:editGrade,adminNote:editNote};
    const ok=await FirebaseAPI.saveSelfEval(selYear,selMonth,eid,updated);
    if(ok){setEvals(p=>({...p,[eid]:updated}));setEditId(null);T("✅ تم حفظ التعديل");}
    else T("⚠️ فشل الحفظ");
  };
  const exportXls=async()=>{
    try{
      const mod=await import("exceljs");const ExcelJS=mod.default||mod;
      const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet("التقييم الذاتي");
      ws.addRow(["الترتيب","الرقم الوظيفي","الموظف",...EVAL_CRITERIA_DATA.filter(c=>!c.leadership).map(c=>c.name),"القيادة","النسبة%","التقييم","ملاحظة المشرف","تاريخ الإرسال"]);
      submitted.forEach(e=>{
        const ev=evals[String(e.id)];const s=ev.scores||{};
        const rawPct=ev.rawTotal||ev.total||0;
        const gi=calcSelfGrade(rawPct,ev.rank||99,ev.hasLeadership);
        ws.addRow([ev.rank||"—",e.jobNum,e.name,...EVAL_CRITERIA_DATA.filter(c=>!c.leadership).map(c=>s[c.id]||"—"),s.leadership||"—",rawPct,ev.adminGrade||gi.grade,ev.adminNote||"",ev.submittedAt?new Date(ev.submittedAt).toLocaleDateString("ar-IQ"):"—"]);
      });
      const buf=await wb.xlsx.writeBuffer();const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));a.download=`تقييم_ذاتي_${MONTHS_IRAQI[selMonth]}_${selYear}.xlsx`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(a.href);T("✅ تم التصدير");
    }catch{T("⚠️ فشل التصدير");}
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2"><select value={selMonth} onChange={e=>setSelMonth(+e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select><select value={selYear} onChange={e=>setSelYear(+e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select></div>
        <button onClick={exportXls} className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 px-3 py-2 rounded-xl"><Download size={13}/>تصدير Excel</button>
      </div>
      <p className="text-sm text-secondary">أرسل تقييمه {submitted.length} موظف — الترتيب: أول 11 → جيد جداً | 12-17 → جيد | 18+ → متوسط | القيادة → ممتاز</p>
      {submitted.length===0
        ?<div className="card rounded-2xl p-8 text-center border-color border"><Star size={40} className="mx-auto text-secondary mb-2"/><p className="text-secondary">لا توجد تقييمات ذاتية مرسلة لهذه الفترة</p></div>
        :<div className="space-y-2">
          {submitted.map(e=>{
            const ev=evals[String(e.id)];
            const rawPct=ev.rawTotal||ev.total||0;
            const gi=calcSelfGrade(rawPct,ev.rank||99,ev.hasLeadership);
            const fg=ev.adminGrade||gi.grade;
            const fc=SGC[fg]||gi.color;
            return(
              <div key={e.id} className="card rounded-2xl border border-color overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-secondary bg-gray-100 dark:bg-gray-700 w-7 h-7 rounded-full flex items-center justify-center shrink-0">{ev.rank||"—"}</span>
                    <div>
                      <p className="font-bold text-sm">{e.name.split(" ").slice(0,3).join(" ")}</p>
                      <p className="text-xs text-secondary">{e.jobNum}{ev.hasLeadership&&" · قيادة ⭐"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className={`font-bold text-lg ${fc}`}>{fg}{ev.adminGrade&&" ✎"}</p>
                      <p className="text-xs text-secondary">{rawPct}%</p>
                    </div>
                    <button onClick={()=>editId===e.id?setEditId(null):startEdit(e)} className="p-2 rounded-xl border border-color hover:bg-indigo-50 transition-colors" title="تعديل التقييم">
                      <Edit2 size={13} className="text-indigo-600"/>
                    </button>
                  </div>
                </div>
                {ev.adminNote&&<p className="px-4 pb-2 text-xs text-amber-700 italic border-t border-color pt-2">ملاحظة المشرف: {ev.adminNote}</p>}
                {editId===e.id&&(
                  <div className="border-t border-color p-4 bg-indigo-50 dark:bg-indigo-900/20 space-y-3">
                    <p className="text-xs font-bold text-indigo-700">تعديل التقييم النهائي للموظف: {e.name.split(" ")[0]}</p>
                    <div className="flex gap-2 flex-wrap">
                      {SELF_GRADES.map(g=><button key={g} onClick={()=>setEditGrade(g)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${editGrade===g?`${SGC[g]?.replace("text","bg").replace("600","100")||""} border-current`:"border-color hover:bg-indigo-50"}`}>{g}</button>)}
                    </div>
                    <textarea value={editNote} onChange={ev2=>setEditNote(ev2.target.value)} rows={2} placeholder="سبب تعديل التقييم (إلزامي)" className="input rounded-xl px-3 py-2 text-sm w-full"/>
                    <div className="flex gap-2 justify-end">
                      <button onClick={()=>setEditId(null)} className="px-4 py-2 text-xs border border-color rounded-xl">إلغاء</button>
                      <button onClick={()=>saveOverride(e)} className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl"><Save size={12}/>حفظ التعديل</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      }
      {toast&&<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

export function EvaluationSystem({ emp, isAdmin, allEmployees }) {
  const now=new Date();
  const [tab,setTab]=useState("bulk");
  const [selfStatus,setSelfStatus]=useState("loading");
  const [selfData,setSelfData]=useState(null);
  const [leadershipIds,setLeadershipIds]=useState([]);
  const [myEvals,setMyEvals]=useState([]);
  const [selMonth]=useState(now.getMonth());
  const [selYear]=useState(now.getFullYear());
  const [scores,setScores]=useState(()=>Object.fromEntries(EVAL_CRITERIA_DATA.map(c=>[c.id,2])));
  const [selfNotes,setSelfNotes]=useState("");
  const [toast,setToast]=useState("");
  const T=(m)=>{setToast(m);setTimeout(()=>setToast(""),3000);};

  useEffect(()=>{
    if(!isAdmin){
      const eid=String(emp.id);
      FirebaseAPI.loadEvalAssignments(selYear,selMonth).then(d=>{
        if(d===null){setSelfStatus("error");return;}
        if(!d[eid]){setSelfStatus("not_assigned");return;}
        FirebaseAPI.loadSelfEvals(selYear,selMonth).then(se=>{
          if(se?.[eid]){setSelfStatus("submitted");setSelfData(se[eid]);}
          else setSelfStatus("assigned");
        });
      });
      FirebaseAPI.loadEvalCfg().then(d=>setLeadershipIds(d?.leadershipIds||[]));
      FirebaseAPI.loadEvaluations().then(list=>{if(list)setMyEvals(list.filter(e=>e?.empId===emp.id));});
    }
  },[isAdmin,emp.id,selYear,selMonth]);

  const criteria=EVAL_CRITERIA_DATA.filter(c=>!c.leadership||leadershipIds.includes(String(emp.id)));
  const hasLeadership=leadershipIds.includes(String(emp.id));

  const submitSelf=async()=>{
    const existingSubs=await FirebaseAPI.loadSelfEvals(selYear,selMonth);
    const rank=existingSubs?Object.keys(existingSubs).filter(k=>k!==String(emp.id)).length+1:1;
    const rawTotal=Math.round(criteria.reduce((s,c)=>s+scores[c.id],0)/(criteria.length*5)*100);
    const {grade}=calcSelfGrade(rawTotal,rank,hasLeadership);
    const activeScores=Object.fromEntries(criteria.map(c=>[c.id,scores[c.id]]));
    const data={scores:activeScores,rawTotal,total:rawTotal,grade,rank,hasLeadership,notes:selfNotes,submittedAt:new Date().toISOString(),empName:emp.name};
    const ok=await FirebaseAPI.saveSelfEval(selYear,selMonth,String(emp.id),data);
    if(ok){setSelfStatus("submitted");setSelfData(data);T("✅ تم إرسال التقييم");}
    else T("⚠️ فشل الإرسال");
  };

  const ADMIN_TABS=[{id:"bulk",label:"📊 جماعي"},{id:"individual",label:"⭐ فردي"},{id:"assign",label:"🎯 إسناد"},{id:"results",label:"📋 النتائج"}];
  const submittedGI=selfData?calcSelfGrade(selfData.rawTotal||selfData.total||0,selfData.rank||1,selfData.hasLeadership):null;
  const submittedFG=selfData?.adminGrade||submittedGI?.grade;

  return (
    <div className="space-y-4">
      {isAdmin&&<div className="flex gap-1 border-b border-color -mb-2 overflow-x-auto">{ADMIN_TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${tab===t.id?"border-indigo-600 text-indigo-700":"border-transparent text-secondary hover:text-primary"}`}>{t.label}</button>)}</div>}

      {isAdmin&&tab==="bulk"&&<BulkEvaluationPanel emp={emp} allEmployees={allEmployees}/>}
      {isAdmin&&tab==="individual"&&<IndividualEvalPanel emp={emp} allEmployees={allEmployees}/>}
      {isAdmin&&tab==="assign"&&<AssignPanel allEmployees={allEmployees}/>}
      {isAdmin&&tab==="results"&&<ResultsPanel allEmployees={allEmployees}/>}

      {!isAdmin&&<div className="space-y-6">
        <div>
          <h3 className="font-bold text-lg mb-1">التقييم الذاتي — {MONTHS_IRAQI[selMonth]} {selYear}</h3>
          {hasLeadership&&<p className="text-xs text-amber-600 mb-3">⭐ مفعّل لديك معيار القيادة — يمكنك الحصول على تقييم ممتاز</p>}
          {!hasLeadership&&<p className="text-xs text-secondary mb-3">الحد الأقصى للتقييم الاعتيادي: جيد جداً — التقييم الأول إرسالاً يحظى بأعلى الفرص</p>}
          {selfStatus==="loading"&&<div className="card rounded-2xl p-6 text-center border-color border"><p className="text-secondary">جارٍ التحميل...</p></div>}
          {selfStatus==="error"&&<div className="card rounded-2xl p-8 text-center border-color border border-red-200 bg-red-50 dark:bg-red-900/20"><p className="text-red-600 font-bold mb-1">تعذّر الاتصال بقاعدة البيانات</p><p className="text-xs text-secondary">تحقق من اتصالك بالإنترنت أو تواصل مع المشرف</p><button onClick={()=>{setSelfStatus("loading");FirebaseAPI.loadEvalAssignments(selYear,selMonth).then(d=>{if(d===null){setSelfStatus("error");return;}const eid=String(emp.id);if(!d[eid]){setSelfStatus("not_assigned");return;}FirebaseAPI.loadSelfEvals(selYear,selMonth).then(se=>{if(se?.[eid]){setSelfStatus("submitted");setSelfData(se[eid]);}else setSelfStatus("assigned");});});}} className="mt-3 px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl">إعادة المحاولة</button></div>}
          {selfStatus==="not_assigned"&&<div className="card rounded-2xl p-8 text-center border-color border"><Star size={40} className="mx-auto text-secondary mb-2"/><p className="text-secondary">لم يُسند لك تقييم ذاتي لهذا الشهر</p></div>}
          {selfStatus==="submitted"&&<div className="card rounded-2xl p-6 text-center border-color border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20"><CheckCircle size={32} className="mx-auto text-emerald-500 mb-2"/><p className="font-bold text-emerald-700">تم إرسال تقييمك بنجاح</p>{selfData&&<><p className={`text-3xl font-bold mt-2 ${SGC[submittedFG]||submittedGI?.color}`}>{selfData.rawTotal||selfData.total}%</p><p className={`text-xl font-bold ${SGC[submittedFG]||submittedGI?.color}`}>{submittedFG}</p><p className="text-xs text-secondary mt-1">ترتيبك في الإرسال: {selfData.rank}</p>{selfData.adminNote&&<p className="text-xs text-amber-600 mt-2 italic">ملاحظة المشرف: {selfData.adminNote}</p>}</>}</div>}
          {selfStatus==="assigned"&&<div className="card rounded-2xl border-2 border-indigo-200 p-5 space-y-3">
            <p className="text-sm font-bold text-indigo-700">قيّم نفسك في المعايير التالية (2 = مقبول، 3 = جيد، 4 = متميز، 5 = استثنائي)</p>
            {criteria.map(c=>(<div key={c.id} className="border border-color rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm">{c.name}{c.leadership&&" ⭐"}</span>
                <div className="flex gap-1">{[2,3,4,5].map(n=><button key={n} onClick={()=>setScores(p=>({...p,[c.id]:n}))} className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${scores[c.id]===n?"bg-indigo-600 text-white":"border border-color hover:bg-indigo-50"}`}>{n}</button>)}</div>
              </div>
              <p className="text-xs text-secondary">{c.levels[scores[c.id]]}</p>
            </div>))}
            <textarea value={selfNotes} onChange={e=>setSelfNotes(e.target.value)} rows={2} placeholder="ملاحظات إضافية (اختياري)" className="input rounded-xl px-3 py-2 text-sm w-full"/>
            <button onClick={submitSelf} className="w-full py-3 font-bold text-white bg-indigo-600 rounded-xl flex items-center justify-center gap-2"><Save size={14}/>إرسال التقييم</button>
          </div>}
        </div>
        {myEvals.length>0&&<div>
          <h3 className="font-bold text-lg mb-3">تقييماتي السابقة</h3>
          <div className="space-y-3">{myEvals.map(ev=>(<div key={ev.id} className="card rounded-2xl border-color border p-4"><div className="flex justify-between items-start"><div><p className="text-sm text-secondary">{MONTHS_IRAQI[ev.month]} {ev.year} — بواسطة {ev.evaluatedBy}</p>{ev.notes&&<p className="text-xs text-secondary italic mt-1">{ev.notes}</p>}<div className="flex flex-wrap gap-1 mt-2">{EVAL_CRITERIA.map(c=><span key={c} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{c}: {ev.scores?.[c]||0}/5</span>)}</div></div><div className="text-center shrink-0 mr-4"><p className={`text-3xl font-bold ${GC(ev.total)}`}>{ev.total}%</p><p className={`text-xs font-bold ${GC(ev.total)}`}>{GL(ev.total)}</p></div></div></div>))}</div>
        </div>}
      </div>}
      {toast&&<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

export { BulkEvaluationPanel };
