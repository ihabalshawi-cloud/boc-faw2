import React, { useState, useRef, useEffect } from "react";
import { Plus, ChevronRight, Printer, Trash2, Settings, Camera, X, Download, Pencil, Archive } from "lucide-react";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { ACCOUNTS, INITIAL_EQUIPMENT, MONTHS_AR } from "../constants";
import { useToast, useConfirm } from "../contexts";

const WKEY    = "maint_work_log";
const CFGKEY  = "maint_rpt_cfg";
const DEFAULT_CFG = { maintSupervisors:[], shiftSupervisors:[], viewers:[] };
const WORK_TYPES  = ["صيانة دورية","صيانة طارئة","فحص","إصلاح","تنظيف","تشغيل","أخرى"];
const SC = { "مكتمل":"bg-emerald-100 text-emerald-700","جاري":"bg-blue-100 text-blue-700","متوقف":"bg-amber-100 text-amber-700" };
const toYMD = d => d.toISOString().slice(0,10);

function readB64(file) {
  return new Promise(res => { const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(file); });
}

function exportCSV(rows, filename) {
  const BOM = "﻿";
  const csv = BOM + rows.map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.download = filename; a.click();
}

function archiveJSON(entries, label) {
  const data = JSON.stringify({ label, exportedAt: new Date().toISOString(), entries }, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data],{type:"application/json"}));
  a.download = `أرشيف-${label}.json`; a.click();
}

function printReport(entries, title, subtitle) {
  const rows = entries.map((e,i)=>`<tr><td>${i+1}</td><td>${e.date||""}</td><td style="text-align:right">${e.equipmentName||"—"}</td><td>${e.workType||""}</td><td style="text-align:right">${e.description||""}</td><td>${e.hours||0}</td><td>${e.status||""}</td></tr>${e.images?.length?`<tr><td colspan="7" style="padding:6px;background:#fafafa"><div style="display:flex;gap:8px;flex-wrap:wrap">${e.images.map(img=>`<img src="${img}" style="height:80px;width:80px;object-fit:cover;border-radius:6px;border:1px solid #ccc"/>`).join("")}</div></td></tr>`:""}`).join("");
  const totalHours = entries.reduce((s,e)=>s+(Number(e.hours)||0),0);
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:20px;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #000;padding:5px 6px;text-align:center}th{background:#f0f0f0}h2,p.hdr{text-align:center;margin:3px 0}.sigs{display:flex;justify-content:space-between;margin-top:30px}@media print{@page{margin:1.5cm}}</style></head><body><p class="hdr" style="font-weight:bold">شركة نفط البصرة — هيأة الصيانة الهندسية — القسم: السيطرة والنظم</p><h2>${title}</h2><p class="hdr" style="color:#555">${subtitle}</p><table><thead><tr><th>ت</th><th>التاريخ</th><th>المعدة</th><th>نوع العمل</th><th>الوصف</th><th>الساعات</th><th>الحالة</th></tr></thead><tbody>${rows}<tr><td colspan="5" style="font-weight:bold;text-align:right">الإجمالي</td><td style="font-weight:bold">${totalHours}</td><td></td></tr></tbody></table><div class="sigs"><div style="text-align:center"><p>رئيس الشعبة</p><br/><br/><p>.................................</p></div><div style="text-align:center"><p>مدير القسم</p><br/><br/><p>.................................</p></div></div></body></html>`;
  const win=window.open("","_blank"); win.document.write(html); win.document.close(); win.print();
}

function SignaturePad({ onSign }) {
  const cvs=useRef(); const drawing=useRef(false); const last=useRef([0,0]);
  useEffect(()=>{ const c=cvs.current.getContext("2d"); c.strokeStyle="#1e293b"; c.lineWidth=2; c.lineCap=c.lineJoin="round"; },[]);
  const xy=(e)=>{ const r=cvs.current.getBoundingClientRect(),s=e.touches?.[0]||e; return[s.clientX-r.left,s.clientY-r.top]; };
  const start=(e)=>{ e.preventDefault(); drawing.current=true; last.current=xy(e); };
  const move=(e)=>{ if(!drawing.current)return; e.preventDefault(); const[x,y]=xy(e),c=cvs.current.getContext("2d"); c.beginPath(); c.moveTo(last.current[0],last.current[1]); c.lineTo(x,y); c.stroke(); last.current=[x,y]; };
  const end=()=>{ if(drawing.current){drawing.current=false; onSign(cvs.current.toDataURL());} };
  const clear=()=>{ const c=cvs.current; c.getContext("2d").clearRect(0,0,c.width,c.height); onSign(null); };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-secondary">التوقيع الإلكتروني *</label>
        <button type="button" onClick={clear} className="text-xs text-red-500 hover:underline">مسح</button>
      </div>
      <canvas ref={cvs} width={800} height={160} className="w-full rounded-xl border border-color bg-white dark:bg-white touch-none cursor-crosshair" style={{height:"120px"}}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
      <p className="text-[11px] text-secondary mt-1">وقّع بإصبعك (على الجوال) أو بالماوس</p>
    </div>
  );
}

// ── Entry Form ─────────────────────────────────────────────────────────────────
function EntryForm({ emp, allEquipment, onSave, onCancel, initial = null }) {
  const toast   = useToast();
  const fileRef = useRef();
  const [date,   setDate]   = useState(initial?.date   || toYMD(new Date()));
  const [eqId,   setEqId]   = useState(initial?.equipmentId  || "");
  const [eqName, setEqName] = useState(initial?.equipmentId==="__other"?initial.equipmentName:"");
  const [wType,  setWType]  = useState(initial?.workType   || WORK_TYPES[0]);
  const [desc,   setDesc]   = useState(initial?.description || "");
  const [hours,  setHours]  = useState(initial?.hours  || 1);
  const [status, setStatus] = useState(initial?.status || "مكتمل");
  const [images,    setImages]    = useState(initial?.images    || []);
  const [signature, setSignature] = useState(initial?.signature || null);

  const addImages = async (files) => {
    const rem = 4 - images.length;
    if (rem <= 0) { toast("الحد الأقصى 4 صور","warning"); return; }
    const b64s = await Promise.all(Array.from(files).slice(0,rem).map(readB64));
    setImages(p=>[...p,...b64s]);
  };

  const save = () => {
    if (!desc.trim())  { toast("أدخل وصف العمل","warning"); return; }
    if (!signature)    { toast("يجب التوقيع الإلكتروني قبل الحفظ","warning"); return; }
    const eq = allEquipment.find(e=>e.id===eqId);
    onSave({ id:initial?.id||Date.now(), date, equipmentId:eqId, equipmentName:eqId==="__other"?eqName:(eq?.name||""),
      workType:wType, description:desc, hours:Number(hours)||1, status, images, signature,
      technicianId:initial?.technicianId||emp.id, technicianName:initial?.technicianName||emp.name,
      shift:initial?.shift||(emp.shift==="صباحي"?"صباحي":(emp.group||"")), createdAt:initial?.createdAt||new Date().toISOString() });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronRight size={16}/> رجوع</button>
        <h2 className="font-bold">{initial?"تعديل سجل عمل":"إضافة سجل عمل"}</h2>
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
        <div>
          <label className="text-xs text-secondary block mb-1">الصور ({images.length}/4)</label>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>addImages(e.target.files)}/>
          <div className="flex gap-2 flex-wrap">
            {images.map((img,i)=>(
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-color shrink-0">
                <img src={img} alt="" className="w-full h-full object-cover"/>
                <button onClick={()=>setImages(p=>p.filter((_,j)=>j!==i))} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"><X size={10} className="text-white"/></button>
              </div>
            ))}
            {images.length<4&&(
              <button onClick={()=>fileRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-color flex flex-col items-center justify-center hover:bg-hover transition-colors gap-1">
                <Camera size={18} className="text-secondary"/><span className="text-[10px] text-secondary">إضافة</span>
              </button>
            )}
          </div>
        </div>
        <SignaturePad onSign={setSignature}/>
        {signature&&<p className="text-xs text-emerald-600 font-medium">✓ تم التوقيع</p>}
        <button onClick={save} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">حفظ السجل</button>
      </div>
    </div>
  );
}

// ── Daily View ─────────────────────────────────────────────────────────────────
function DailyView({ entries, date, setDate, emp, isAdmin, canWrite, onDelete, onAdd, onEdit }) {
  const confirm    = useConfirm();
  const dayEntries = entries.filter(e=>e.date===date).sort((a,b)=>b.id-a.id);
  const totalHours = dayEntries.reduce((s,e)=>s+(Number(e.hours)||0),0);
  const alreadyLogged = entries.some(e=>e.date===date && e.technicianId===emp.id);
  const del = async (id) => { if (await confirm("حذف هذا السجل؟")) onDelete(id); };
  const doPrint = () => { const d=new Date(date+"T00:00:00"); printReport(dayEntries,"تقرير العمل اليومي",`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`); };
  const doExport = () => {
    const header = ["ت","التاريخ","المعدة","نوع العمل","الوصف","الساعات","الفني","الحالة"];
    const rows = dayEntries.map((e,i)=>[i+1,e.date||"",e.equipmentName||"",e.workType||"",e.description||"",e.hours||0,e.technicianName||"",e.status||""]);
    exportCSV([header,...rows],`تقرير-يومي-${date}.csv`);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex-1 min-w-[160px]"><label className="text-xs text-secondary block mb-1">اختر التاريخ</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full input-base rounded-lg px-3 py-2 text-sm border border-color"/></div>
        <div className="flex gap-2">
          {dayEntries.length>0&&<button onClick={doPrint} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Printer size={14}/> طباعة</button>}
          {dayEntries.length>0&&<button onClick={doExport} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Download size={14}/> Excel</button>}
          {canWrite&&!alreadyLogged&&<button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"><Plus size={14}/> إضافة</button>}
          {canWrite&&alreadyLogged&&<span className="px-3 py-2 text-xs text-amber-600 font-medium bg-amber-50 rounded-xl border border-amber-200">سجّلت اليوم ✓</span>}
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
          {canWrite&&!alreadyLogged&&<button onClick={onAdd} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">+ إضافة سجل</button>}
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
                  <p className="text-sm text-secondary mt-0.5">{e.description}</p>
                  <p className="text-xs text-secondary mt-1.5">{e.technicianName}</p>
                  {e.signature&&(
                    <div className="mt-2 pt-2 border-t border-color">
                      <p className="text-[10px] text-secondary mb-1">توقيع الكاتب</p>
                      <img src={e.signature} alt="توقيع" className="h-10 max-w-[140px] object-contain opacity-80"/>
                    </div>
                  )}
                  {e.images?.length>0&&(
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {e.images.map((img,i)=>(
                        <img key={i} src={img} alt="" onClick={()=>window.open(img,"_blank")}
                          className="w-16 h-16 rounded-xl object-cover border border-color cursor-pointer hover:opacity-90 transition-opacity"/>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {isAdmin&&<button onClick={()=>onEdit(e)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg"><Pencil size={13}/></button>}
                  {(isAdmin||e.technicianId===emp.id)&&<button onClick={()=>del(e.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13}/></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Monthly View ───────────────────────────────────────────────────────────────
function MonthlyView({ entries, isAdmin, onDelete, onUpdate }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  const [gallery, setGallery] = useState(false);
  const confirm = useConfirm();
  const toast   = useToast();
  const fRefs   = useRef({});

  const monthEntries = entries.filter(e=>{
    if (!e.date) return false;
    const d = new Date(e.date+"T00:00:00");
    return d.getMonth()===month && d.getFullYear()===year;
  }).sort((a,b)=>a.date.localeCompare(b.date)||b.id-a.id);

  const totalHours = monthEntries.reduce((s,e)=>s+(Number(e.hours)||0),0);
  const byDate = monthEntries.reduce((acc,e)=>{ (acc[e.date]||(acc[e.date]=[])).push(e); return acc; },{});
  const byType = WORK_TYPES.reduce((acc,t)=>{ acc[t]=monthEntries.filter(e=>e.workType===t).length; return acc; },{});
  const allImgs = monthEntries.flatMap(e=>(e.images||[]).map(img=>({img,date:e.date,eq:e.equipmentName||""})));

  const doPrint = () => printReport(monthEntries,"تقرير العمل الشهري",`${MONTHS_AR[month]} ${year}`);
  const doExport = () => {
    const h = ["ت","التاريخ","المعدة","نوع العمل","الوصف","الساعات","الحالة"];
    exportCSV([h,...monthEntries.map((e,i)=>[i+1,e.date||"",e.equipmentName||"",e.workType||"",e.description||"",e.hours||0,e.status||""])],`تقرير-شهري-${MONTHS_AR[month]}-${year}.csv`);
  };
  const printGallery = () => {
    if (!allImgs.length) { toast("لا توجد صور هذا الشهر","warning"); return; }
    const html=`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>صور ${MONTHS_AR[month]} ${year}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px}h2{text-align:center}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}div.c{text-align:center;page-break-inside:avoid}img{max-width:220px;max-height:180px;object-fit:contain;border:1px solid #ccc;border-radius:4px}p{font-size:10px;color:#555;margin:3px 0}@media print{@page{margin:1.5cm}}</style>
    </head><body><h2>صور تقرير ${MONTHS_AR[month]} ${year}</h2><div class="g">${allImgs.map(x=>`<div class="c"><img src="${x.img}"/><p>${x.date}${x.eq?` — ${x.eq}`:""}</p></div>`).join("")}</div></body></html>`;
    const w=window.open("","_blank"); w.document.write(html); w.document.close(); w.print();
  };
  const addImg = async (entry, files) => {
    const cur=entry.images||[]; if(cur.length>=8){toast("الحد الأقصى 8 صور","warning");return;}
    const b64s=await Promise.all(Array.from(files).slice(0,8-cur.length).map(readB64));
    onUpdate({...entry,images:[...cur,...b64s]});
  };
  const delImg = (entry,i) => onUpdate({...entry,images:(entry.images||[]).filter((_,j)=>j!==i)});
  const delEntry = async (id) => { if(await confirm("حذف هذا السجل من التقرير الشهري؟")) onDelete(id); };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-1">
          <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="flex-1 input-base rounded-lg px-3 py-2 text-sm border border-color">
            {MONTHS_AR.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="w-24 input-base rounded-lg px-3 py-2 text-sm border border-color"/>
        </div>
        {monthEntries.length>0&&(
          <div className="flex gap-2 flex-wrap">
            <button onClick={doPrint} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Printer size={14}/> طباعة</button>
            <button onClick={doExport} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Download size={14}/> Excel</button>
            {allImgs.length>0&&<button onClick={printGallery} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Camera size={14}/> طباعة الصور</button>}
            {isAdmin&&<button onClick={()=>archiveJSON(monthEntries,`${MONTHS_AR[month]}-${year}`)} className="flex items-center gap-1 px-3 py-2 btn-secondary border border-color rounded-xl text-sm"><Archive size={14}/> أرشفة</button>}
          </div>
        )}
      </div>
      {monthEntries.length>0&&(
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="card rounded-2xl border border-color p-3 text-center"><p className="text-xl font-bold text-blue-600">{monthEntries.length}</p><p className="text-xs text-secondary">إجمالي السجلات</p></div>
            <div className="card rounded-2xl border border-color p-3 text-center"><p className="text-xl font-bold text-emerald-600">{totalHours}</p><p className="text-xs text-secondary">إجمالي الساعات</p></div>
            <div className="card rounded-2xl border border-color p-3 text-center"><p className="text-xl font-bold text-amber-600">{Object.keys(byDate).length}</p><p className="text-xs text-secondary">يوم عمل</p></div>
          </div>
          <div className="card rounded-2xl border border-color p-4">
            <h4 className="font-bold text-sm mb-3">توزيع نوع الأعمال</h4>
            <div className="space-y-1.5">
              {WORK_TYPES.filter(t=>byType[t]>0).map(t=>(
                <div key={t} className="flex items-center gap-2">
                  <span className="text-xs text-secondary w-28 shrink-0">{t}</span>
                  <div className="flex-1 bg-hover rounded-full h-2 overflow-hidden"><div className="h-2 bg-blue-500 rounded-full" style={{width:`${Math.round(byType[t]/monthEntries.length*100)}%`}}/></div>
                  <span className="text-xs font-bold w-5 text-right">{byType[t]}</span>
                </div>
              ))}
            </div>
          </div>
          {allImgs.length>0&&(
            <div className="card rounded-2xl border border-color p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm">جميع صور الشهر ({allImgs.length})</h4>
                <button onClick={()=>setGallery(g=>!g)} className="text-xs text-blue-600 hover:underline">{gallery?"إخفاء":"عرض الكل"}</button>
              </div>
              {gallery&&<div className="flex flex-wrap gap-2">{allImgs.map((x,i)=>(
                <div key={i}><img src={x.img} alt="" onClick={()=>window.open(x.img,"_blank")} className="w-20 h-20 rounded-xl object-cover border border-color cursor-pointer hover:opacity-90"/>
                <p className="text-[9px] text-secondary mt-0.5 text-center max-w-[80px] truncate">{x.date}</p></div>
              ))}</div>}
            </div>
          )}
        </>
      )}
      {monthEntries.length===0 ? (
        <div className="text-center py-14 text-secondary"><p className="text-5xl mb-3">📊</p><p className="font-medium">لا توجد سجلات لهذا الشهر</p></div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byDate).sort(([a],[b])=>b.localeCompare(a)).map(([dt,dEntries])=>{
            const d = new Date(dt+"T00:00:00");
            return (
              <div key={dt} className="card rounded-2xl border border-color overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-hover border-b border-color">
                  <span className="text-sm font-bold">{d.getDate()} {MONTHS_AR[d.getMonth()]} {d.getFullYear()}</span>
                  <span className="text-xs text-secondary">{dEntries.length} سجل • {dEntries.reduce((s,e)=>s+(Number(e.hours)||0),0)} ساعة</span>
                </div>
                {dEntries.map(e=>(
                  <div key={e.id} className="px-4 py-3 border-b border-color last:border-0">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${SC[e.status]}`}>{e.status}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-blue-600">{e.workType}{e.equipmentName?` — ${e.equipmentName}`:""}</p>
                        <p className="text-sm mt-0.5">{e.description}</p>
                        <p className="text-xs text-secondary mt-0.5">{e.hours} ساعة</p>
                        <div className="flex gap-2 mt-2 flex-wrap items-center">
                          {(e.images||[]).map((img,i)=>(
                            <div key={i} className="relative">
                              <img src={img} alt="" onClick={()=>window.open(img,"_blank")} className="w-16 h-16 rounded-xl object-cover border border-color cursor-pointer hover:opacity-90"/>
                              {isAdmin&&<button onClick={()=>delImg(e,i)} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"><X size={10} className="text-white"/></button>}
                            </div>
                          ))}
                          {isAdmin&&(e.images?.length||0)<8&&(
                            <>
                              <input type="file" accept="image/*" multiple className="hidden" ref={el=>fRefs.current[e.id]=el} onChange={ev=>addImg(e,ev.target.files)}/>
                              <button onClick={()=>fRefs.current[e.id]?.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-color flex flex-col items-center justify-center hover:bg-hover gap-1">
                                <Camera size={14} className="text-secondary"/><span className="text-[9px] text-secondary">إضافة</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {isAdmin&&<button onClick={()=>delEntry(e.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg shrink-0"><Trash2 size={13}/></button>}
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

// ── Settings ───────────────────────────────────────────────────────────────────
function SettingsView({ cfg, onSave, onBack }) {
  const toast = useToast();
  const [maintSups, setMaintSups] = useState(cfg?.maintSupervisors||[]);
  const [shiftSups, setShiftSups] = useState(cfg?.shiftSupervisors||[]);
  const [viewers,   setViewers]   = useState(cfg?.viewers||[]);
  const all = ACCOUNTS.filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  const tog = (setter,list,id) => setter(list.includes(id)?list.filter(x=>x!==id):[...list,id]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronRight size={16}/> رجوع</button>
        <h2 className="font-bold">صلاحيات التقرير</h2>
      </div>
      <div className="card rounded-2xl border border-color p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"/><h3 className="font-bold text-sm">تعديل وكتابة — مسؤولو الصيانة</h3></div>
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {all.map(e=>(
            <label key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover cursor-pointer">
              <input type="checkbox" checked={maintSups.includes(e.id)} onChange={()=>tog(setMaintSups,maintSups,e.id)} className="w-4 h-4"/>
              <span className="text-sm flex-1">{e.name.split(" ").slice(0,3).join(" ")}</span>
              <span className="text-xs text-secondary">{e.title}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="card rounded-2xl border border-color p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"/><h3 className="font-bold text-sm">تعديل وكتابة — مسؤولو النوبات</h3></div>
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {all.filter(e=>e.shift==="مناوبة").map(e=>(
            <label key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover cursor-pointer">
              <input type="checkbox" checked={shiftSups.includes(e.id)} onChange={()=>tog(setShiftSups,shiftSups,e.id)} className="w-4 h-4"/>
              <span className="text-sm flex-1">{e.name.split(" ").slice(0,3).join(" ")}</span>
              <span className="text-xs text-secondary">مج {e.group||"—"}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="card rounded-2xl border border-color p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"/><h3 className="font-bold text-sm">مشاهدة فقط</h3></div>
        <p className="text-xs text-secondary">يشاهدون التقارير دون إمكانية التعديل أو الإضافة</p>
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {all.map(e=>(
            <label key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover cursor-pointer">
              <input type="checkbox" checked={viewers.includes(e.id)} onChange={()=>tog(setViewers,viewers,e.id)} className="w-4 h-4"/>
              <span className="text-sm flex-1">{e.name.split(" ").slice(0,3).join(" ")}</span>
              <span className="text-xs text-secondary">{e.title||e.group||""}</span>
            </label>
          ))}
        </div>
      </div>
      <button onClick={()=>{onSave({maintSupervisors:maintSups,shiftSupervisors:shiftSups,viewers});toast("تم حفظ الإعدادات","success");}} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">
        حفظ الإعدادات
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function MaintenanceWorkReport({ emp }) {
  const isAdmin      = emp.role==="admin"||emp.username==="i.shawi";
  const allEquipment = storage.get("equipment", INITIAL_EQUIPMENT);
  const [entries, setEntries] = useState(()=>storage.get(WKEY,[]));
  const [cfg,     setCfg]     = useState(()=>storage.get(CFGKEY,DEFAULT_CFG));
  const [tab,  setTab]  = useState("daily");
  const [pv,   setPv]   = useState("list");
  const [date, setDate] = useState(toYMD(new Date()));

  const toast      = useToast();
  const [editEntry, setEditEntry] = useState(null);
  const canWrite   = isAdmin || (cfg.maintSupervisors||[]).includes(emp.id) || (cfg.shiftSupervisors||[]).includes(emp.id);
  const canView    = isAdmin || canWrite || (cfg.viewers||[]).includes(emp.id);

  useEffect(() => {
    FirebaseAPI.loadMaintWorkLog().then(list => { if (list?.length) { setEntries(list); storage.set(WKEY,list); } });
    FirebaseAPI.loadMaintCfg().then(c => { if (c) { setCfg(c); storage.set(CFGKEY,c); } });
  }, []);

  const saveCfg    = c => { setCfg(c); storage.set(CFGKEY,c); FirebaseAPI.saveMaintCfg(c); };
  const save       = entry => {
    const alreadyToday = !isAdmin && entries.some(e=>e.date===entry.date && e.technicianId===emp.id);
    if (alreadyToday) { toast("لقد سجّلت تقريراً لهذا اليوم من قبل، يُسمح بتقرير واحد يومياً","warning"); return; }
    const up=[entry,...entries]; setEntries(up); storage.set(WKEY,up); FirebaseAPI.saveMaintWorkLog(up); setPv("list");
  };
  const update     = entry => { const up=entries.map(e=>e.id===entry.id?entry:e); setEntries(up); storage.set(WKEY,up); FirebaseAPI.saveMaintWorkLog(up); setEditEntry(null); setPv("list"); };
  const del        = id    => { const up=entries.filter(e=>e.id!==id); setEntries(up); storage.set(WKEY,up); FirebaseAPI.saveMaintWorkLog(up); };

  if (!canView && !isAdmin) return (
    <div className="text-center py-20 text-secondary" dir="rtl">
      <p className="text-5xl mb-3">🔒</p>
      <p className="font-bold text-base text-primary">غير مصرّح بالوصول</p>
      <p className="text-sm mt-1">تواصل مع المشرف لمنحك صلاحية مشاهدة التقارير</p>
    </div>
  );
  if (pv==="add"&&canWrite)  return <EntryForm emp={emp} allEquipment={allEquipment} onSave={save} onCancel={()=>setPv("list")}/>;
  if (pv==="edit"&&isAdmin)  return <EntryForm emp={emp} allEquipment={allEquipment} onSave={update} onCancel={()=>{setEditEntry(null);setPv("list");}} initial={editEntry}/>;
  if (pv==="settings"&&isAdmin) return <SettingsView cfg={cfg} onSave={c=>{saveCfg(c);setPv("list");}} onBack={()=>setPv("list")}/>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">تقارير العمل الصيانة</h2>
        {isAdmin&&<button onClick={()=>setPv("settings")} className="p-2 btn-secondary rounded-xl border border-color"><Settings size={16}/></button>}
      </div>
      <div className="flex gap-1 border-b border-color">
        {[["daily","التقرير اليومي"],["monthly","التقرير الشهري"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k?"border-blue-600 text-blue-600":"border-transparent text-secondary hover:text-primary"}`}>{l}</button>
        ))}
      </div>
      {tab==="daily"   && <DailyView   entries={entries} date={date} setDate={setDate} emp={emp} isAdmin={isAdmin} canWrite={canWrite} onDelete={del} onAdd={()=>setPv("add")} onEdit={e=>{setEditEntry(e);setPv("edit");}}/>}
      {tab==="monthly" && <MonthlyView entries={entries} isAdmin={isAdmin} onDelete={del} onUpdate={update}/>}
    </div>
  );
}
