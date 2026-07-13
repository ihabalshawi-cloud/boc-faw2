import React, { useState, useEffect, useRef } from "react";
import { Download, CheckCircle, ThumbsUp, ThumbsDown, X, PenTool, Printer, Send } from "lucide-react";
import { ACCOUNTS } from "../constants";
import { storage, fmtIraqi } from "../utils";
import { FirebaseAPI } from "../firebase";
import { EmpPopover, playAlert, sendBackgroundPush } from "../components/Shared";
import { hasPermission } from "../permissions";

function InlineSigPad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const getPos = (e, c) => { const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height; return e.touches?{x:(e.touches[0].clientX-r.left)*sx,y:(e.touches[0].clientY-r.top)*sy}:{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy}; };
  const startDraw = (e) => { e.preventDefault(); drawing.current=true; lastPos.current=getPos(e,canvasRef.current); };
  const draw = (e) => { e.preventDefault(); if(!drawing.current)return; const c=canvasRef.current,ctx=c.getContext("2d"),p=getPos(e,c); ctx.beginPath();ctx.moveTo(lastPos.current.x,lastPos.current.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle="#1a1a1a";ctx.lineWidth=2;ctx.lineCap="round";ctx.stroke();lastPos.current=p; };
  const stopDraw = () => { drawing.current=false; };
  const clear = () => canvasRef.current.getContext("2d").clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
  return (
    <div className="space-y-2">
      <p className="text-xs text-secondary flex items-center gap-1"><PenTool size={12}/> ارسم توقيعك أدناه للموافقة</p>
      <canvas ref={canvasRef} width={380} height={80} className="border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair touch-none w-full bg-gray-50"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}/>
      <div className="flex gap-2 justify-end">
        <button onClick={clear} className="text-xs px-3 py-1.5 rounded border border-color">مسح</button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded border border-color">إلغاء</button>
        <button onClick={()=>onSave(canvasRef.current.toDataURL("image/png"))} className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded">تأكيد الموافقة</button>
      </div>
    </div>
  );
}

function ApprovalsPage({ emp }) {
  const isSupervisor = emp.username === "i.shawi";
  const isAdmin = emp.role === "admin";
  const isAttendanceAdmin = emp.role === "attendance_admin";
  const canArchive = isSupervisor || isAdmin || isAttendanceAdmin;
  const canExportLeave = hasPermission(emp, "EXPORT_LEAVE_EXCEL");
  const sortDesc = (a,b) => { if(!a||!b) return 0; return new Date(b.decidedAt||b.submittedAt)-new Date(a.decidedAt||a.submittedAt); };
  const [requests, setRequests] = useState(() => storage.get("all_requests", []).filter(r => r && r.status === "بانتظار المراجعة"));
  const [approved, setApproved] = useState(() => storage.get("all_requests", []).filter(r => r && r.status === "موافق عليها" && !r.archived).sort(sortDesc));
  const [archived, setArchived] = useState(() => storage.get("all_requests", []).filter(r => r && r.archived).sort(sortDesc));
  const [sigReqId, setSigReqId] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const applyList = (list) => {
    storage.set("all_requests", list);
    setRequests(list.filter(r => r && r.status === "بانتظار المراجعة"));
    setApproved(list.filter(r => r && r.status === "موافق عليها" && !r.archived).sort(sortDesc));
    setArchived(list.filter(r => r && r.archived).sort(sortDesc));
  };
  const refreshApproved = () => {
    const all = storage.get("all_requests", []);
    setApproved(all.filter(r => r && r.status === "موافق عليها" && !r.archived).sort(sortDesc));
    setArchived(all.filter(r => r && r.archived).sort(sortDesc));
  };
  const archiveReq = (id) => {
    const all = storage.get("all_requests", []).map(r => r.id === id ? {...r, archived:true} : r);
    storage.set("all_requests", all); FirebaseAPI.saveRequests(all);
    refreshApproved(); showToast("📁 تم أرشفة الطلب");
  };
  const restoreReq = (id) => {
    const all = storage.get("all_requests", []).map(r => r.id === id ? {...r, archived:false} : r);
    storage.set("all_requests", all); FirebaseAPI.saveRequests(all);
    refreshApproved(); showToast("↩️ تم استرداد الطلب من الأرشيف");
  };

  const exportReqExcel = (req) => {
    const supSig = req.sigDataUrl ? `<img src="${req.sigDataUrl}" width="130" height="45"/>` : "(غير موقّع)";
    const empSig = req.empSigDataUrl ? `<img src="${req.empSigDataUrl}" width="130" height="45"/>` : "(غير موقّع)";
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'/><style>body{font-family:Arial;direction:rtl}table{border-collapse:collapse;width:600pt}td,th{border:1pt solid #000;padding:6pt 8pt;font-size:11pt}th{background:#d6e4f0;font-weight:bold}.ttl{font-size:14pt;font-weight:bold;text-align:center}.sig-td{height:60pt;vertical-align:middle;text-align:center}</style></head><body><table><tr><td colspan="4" class="ttl">شركة نفط البصرة — شعبة مستودع الفاو</td></tr><tr><td colspan="4" class="ttl">نموذج إجازة ${req.type}</td></tr><tr><th>الموظف</th><td>${req.empName||""}</td><th>نوع الإجازة</th><td>${req.type||""}</td></tr><tr><th>من</th><td>${req.dateFrom||""}</td><th>إلى</th><td>${req.dateTo||""}</td></tr><tr><th>عدد الأيام</th><td>${req.days||""}</td><th>الغرض</th><td>${req.purpose||""}</td></tr><tr><th>تاريخ الطلب</th><td>${req.submittedAt?new Date(req.submittedAt).toLocaleDateString("ar-IQ"):""}</td><th>تاريخ الموافقة</th><td>${req.decidedAt?new Date(req.decidedAt).toLocaleDateString("ar-IQ"):""}</td></tr><tr><th>وافق عليها</th><td colspan="3">${req.decidedBy||""}</td></tr><tr><td class="sig-td">توقيع الموظف<br/>${empSig}<br/><small>${req.empName||""}</small></td><td colspan="3" class="sig-td">توقيع مسؤول الشعبة<br/>${supSig}<br/><small>${req.decidedBy||"إيهاب الشاوي"}</small></td></tr></table></body></html>`;
    const blob = new Blob(["﻿"+html],{type:"application/vnd.ms-excel;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url;
    a.download = `إجازة_${req.empName}_${req.type}_${req.dateFrom||""}`.replace(/\s/g,"_")+".xls";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const exportToTemplate = async (req) => {
    const empAcct = ACCOUNTS.find(a => a.id === req.empId) || {};
    const fmtD = d => { if (!d) return ""; const dt = new Date(d+"T00:00:00"); return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`; };
    const addImg = async (wb, ws, dataUrl, col, row) => { if (!dataUrl?.startsWith("data:")) return; try { const imgId = wb.addImage({base64:dataUrl.split(",")[1],extension:"png"}); ws.addImage(imgId,{tl:{col,row},ext:{width:130,height:45}}); } catch {} };
    try {
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const wb = new ExcelJS.Workbook();
      const safe = (req.empName||"موظف").replace(/\s+/g,"_");
      const t = req.type||"";
      let fname = "";
      if (t.includes("اعتيادية")) {
        await wb.xlsx.load(await (await fetch("/templates/leave-annual.xlsx")).arrayBuffer());
        const ws = wb.worksheets[0]; const set=(r,v,sz=13)=>{const c=ws.getCell(r);c.value=v??null;if(v!=null&&v!=='')c.font={...(c.font||{}),size:sz};};
        set("A5",fmtD((req.submittedAt||"").split("T")[0])); set("I8",req.empName||""); set("I9",String(empAcct.jobNum||"")); set("I10",empAcct.title||""); set("I11",fmtD((req.submittedAt||"").split("T")[0])); set("D13",fmtD(req.dateFrom)); set("G13",String(req.days||"")); set("I14",req.purpose||"");
        await addImg(wb,ws,req.sigDataUrl,1,17); await addImg(wb,ws,req.empSigDataUrl,8,17);
        fname=`اجازة_اعتيادية_${safe}_${req.dateFrom||""}.xlsx`;
      } else if (t.includes("مرضية")) {
        await wb.xlsx.load(await (await fetch("/templates/leave-sick.xlsx")).arrayBuffer());
        const ws = wb.worksheets[0]; const set=(r,v)=>{ws.getCell(r).value=v??null;};
        set("C5",fmtD((req.submittedAt||"").split("T")[0])); set("I8",req.empName||""); set("I9",String(empAcct.jobNum||"")); set("I10",empAcct.title||""); set("I11",fmtD(req.dateFrom)); set("I24",fmtD(req.dateTo));
        await addImg(wb,ws,req.empSigDataUrl,1,27); await addImg(wb,ws,req.sigDataUrl,7,27);
        fname=`اجازة_مرضية_${safe}_${req.dateFrom||""}.xlsx`;
      } else if (t.includes("زمنية")) {
        await wb.xlsx.load(await (await fetch("/templates/leave-time.xlsx")).arrayBuffer());
        const ws = wb.worksheets[0]; const set=(r,v)=>{ws.getCell(r).value=v??null;};
        const setBold=(r,v)=>{const c=ws.getCell(r);c.value=v??null;c.font={...(c.font||{}),bold:true};};
        set("C1","شركة نفط البصرة"); set("C2",empAcct.dept||"");
        setBold("F1","الرقم /"); setBold("F2","التاريخ/"); set("G1",null); set("G2",fmtD(req.dateFrom));
        set("C7",req.empName||""); set("E7",String(empAcct.jobNum||"")); set("G7",empAcct.title||"");
        set("D8","شعبة سيطرة مستودع الفاو والمرافئ");
        await addImg(wb,ws,req.empSigDataUrl,2,11); await addImg(wb,ws,req.sigDataUrl,6,11);
        fname=`اجازة_زمنية_${safe}_${req.dateFrom||""}.xlsx`;
      } else if (t.includes("خارج العراق")) {
        await wb.xlsx.load(await (await fetch("/templates/leave-ooc.xlsx")).arrayBuffer());
        const ws=wb.worksheets[0]; const set=(r,v)=>{ws.getCell(r).value=v??null;};
        set("D5",fmtD((req.submittedAt||"").split("T")[0]));
        set("D9",String(req.days||"")); set("H10",req.purpose||"");
        set("D16",req.empName||""); set("D17",String(empAcct.jobNum||""));
        set("D18",empAcct.title||""); set("D19",fmtD((req.submittedAt||"").split("T")[0]));
        await addImg(wb,ws,req.empSigDataUrl,1,14); await addImg(wb,ws,req.sigDataUrl,7,22);
        fname=`اجازة_خارج_العراق_${safe}_${req.dateFrom||""}.xlsx`;
      } else { exportReqExcel(req); return; }
      const outBuf = await wb.xlsx.writeBuffer();
      const a = document.createElement("a"); a.href=URL.createObjectURL(new Blob([outBuf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})); a.download=fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      showToast(`✅ تم تصدير نموذج ${t}`);
    } catch { showToast("⚠️ فشل التصدير — سيتم التصدير بالتنسيق البديل"); exportReqExcel(req); }
  };

  useEffect(() => {
    const load = () => FirebaseAPI.loadRequests().then(list => { if (list && list.length > 0) applyList(list); });
    load();
    const t = setInterval(load, 15000);
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = (id, status, sigDataUrl=null) => {
    const allRequests = storage.get("all_requests", []);
    const updated = allRequests.map(r => r.id === id ? { ...r, status, decidedAt:new Date().toISOString(), decidedBy:emp.name, sigDataUrl } : r);
    storage.set("all_requests", updated);
    FirebaseAPI.saveRequests(updated);
    const req = allRequests.find(r => r.id === id);
    if(req) {
      const empReqs = storage.get(`requests_${req.empId}`, []);
      storage.set(`requests_${req.empId}`, empReqs.map(r => r.id === id ? { ...r, status, sigDataUrl } : r));
      const empNotifs = [{ id:Date.now(), type:status==="موافق عليها"?"موافقة":"رفض",
        title:status==="موافق عليها"?"✅ تمت الموافقة على طلبك":"❌ تم رفض طلبك",
        body:`${req.type} — ${req.days} يوم`, timestamp:new Date().toISOString(), read:false },
        ...storage.get(`notifications_${req.empId}`, [])];
      storage.set(`notifications_${req.empId}`, empNotifs);
      FirebaseAPI.saveNotifications(req.empId, empNotifs);
      sendBackgroundPush(req.empId, empNotifs[0].title, empNotifs[0].body, empNotifs[0].type);
    }
    setRequests(requests.filter(r => r.id !== id));
    setSigReqId(null);
    refreshApproved();
    showToast(`✅ تم ${status==="موافق عليها"?"قبول":"رفض"} الطلب`);
    playAlert("notification");
  };

  const pushToAdmin = (req) => {
    if (req.pushedToAdmin) { showToast("⚠️ تم إرسال هذا الطلب للإداري مسبقاً"); return; }
    exportToTemplate(req);
    const all = storage.get("all_requests", []);
    const updated = all.map(r => r.id===req.id ? {...r, pushedToAdmin:true, pushedAt:new Date().toISOString()} : r);
    storage.set("all_requests", updated);
    FirebaseAPI.saveRequests(updated);
    ACCOUNTS.filter(a=>a.role==="admin"||a.role==="attendance_admin").forEach(admin => {
      const nk = `notifications_${admin.id}`;
      const adminNotifs = [{ id:Date.now()+admin.id, type:"أرشفة_إجازة",
        title:`📋 إجازة مرحّلة للأرشفة — ${req.empName}`,
        body:`${req.type} — ${req.days} يوم | وافق: ${req.decidedBy}`,
        timestamp:new Date().toISOString(), read:false, reqId:req.id }, ...storage.get(nk,[])];
      storage.set(nk, adminNotifs);
      FirebaseAPI.saveNotifications(admin.id, adminNotifs);
    });
    refreshApproved();
    showToast("📋 تم الترحيل للإداري وتحميل نموذج الإكسل");
  };

  const printForm = (req) => {
    const supSig = req.sigDataUrl ? `<img src="${req.sigDataUrl}" style="max-width:150px;max-height:50px;"/>` : "(غير موقّع)";
    const empSig = req.empSigDataUrl ? `<img src="${req.empSigDataUrl}" style="max-width:150px;max-height:50px;"/>` : "(غير موقّع)";
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>نموذج إجازة</title>
<style>body{font-family:Arial,sans-serif;padding:30px;direction:rtl}table{border-collapse:collapse;width:100%}td,th{border:1px solid #000;padding:8px;text-align:right}h2,h3{text-align:center}.sigs{display:flex;justify-content:space-around;margin-top:30px;text-align:center}</style>
</head><body><h2>شركة نفط البصرة — شعبة مستودع الفاو</h2>
<h3>نموذج إجازة ${req.type} — موافق عليها</h3>
<table><tr><th>الموظف</th><td>${req.empName}</td><th>نوع الإجازة</th><td>${req.type}</td></tr>
<tr><th>من</th><td>${req.dateFrom}</td><th>إلى</th><td>${req.dateTo}</td></tr>
<tr><th>عدد الأيام</th><td>${req.days}</td><th>الغرض</th><td>${req.purpose||""}</td></tr>
<tr><th>تاريخ الطلب</th><td>${new Date(req.submittedAt).toLocaleDateString("ar-IQ")}</td><th>تاريخ الموافقة</th><td>${req.decidedAt?new Date(req.decidedAt).toLocaleDateString("ar-IQ"):""}</td></tr>
<tr><th>وافق عليها</th><td colspan="3">${req.decidedBy||""}</td></tr></table>
<div class="sigs"><div><p>توقيع الموظف</p>${empSig}<p style="font-size:11px;margin-top:4px;">${req.empName}</p></div><div><p>مسؤول الشعبة</p>${supSig}<p style="font-size:11px;margin-top:4px;">إيهاب عبد اللطيف الشاوي</p></div></div>
</body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>w.print(),400);
  };

  const pushedCount = approved.filter(r => r.pushedToAdmin).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">الطلبات المعلقة ({requests.length})</h3>
        {!isSupervisor && <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">للاطلاع فقط — الموافقة من صلاحية مسؤول الشعبة</span>}
      </div>
      {requests.length===0
        ? <div className="card rounded-2xl p-8 text-center border-color border"><CheckCircle size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد طلبات معلقة</p></div>
        : requests.map(req=>{
          const reqEmp=ACCOUNTS.find(e=>e.id===req.empId)||{name:req.empName};
          return (
            <div key={req.id} className="card rounded-2xl p-4 border-color border space-y-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold"><EmpPopover emp={reqEmp}>{req.empName}</EmpPopover></p>
                  <p className="text-sm">{req.type} — {req.days} يوم</p>
                  <p className="text-xs text-secondary">{req.purpose}</p>
                  <p className="text-xs text-secondary mt-1">{fmtIraqi((req.submittedAt||"").slice(0,10))}</p>
                </div>
                {isSupervisor && sigReqId !== req.id && (
                  <div className="flex gap-2 items-start">
                    <button onClick={()=>setSigReqId(req.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs flex items-center gap-1"><PenTool size={11}/> قبول + توقيع</button>
                    <button onClick={()=>updateStatus(req.id,"مرفوضة")} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs">رفض</button>
                  </div>
                )}
              </div>
              {isSupervisor && sigReqId === req.id && (
                <InlineSigPad onSave={(sig)=>updateStatus(req.id,"موافق عليها",sig)} onCancel={()=>setSigReqId(null)}/>
              )}
            </div>
          );
        })
      }

      {approved.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-bold text-base border-t border-color pt-4">
            سجل الإجازات الموافق عليها ({approved.length})
            {pushedCount>0 && <span className="mr-2 text-[11px] bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-bold">📋 {pushedCount} مرحّلة</span>}
          </h3>
          {approved.map(req=>(
            <div key={req.id} className={`card rounded-2xl p-4 border space-y-1 ${req.pushedToAdmin?"border-violet-200 bg-violet-50/30":"border-emerald-200 bg-emerald-50/30"}`}>
              <div className="flex justify-between items-start">
                <div>
                  {req.pushedToAdmin && <span className="inline-block text-[10px] text-violet-700 font-bold bg-violet-100 px-1.5 py-0.5 rounded-full mb-1">📋 مرحّلة للإداري</span>}
                  <p className="font-bold text-sm">{req.empName}</p>
                  <p className="text-xs">{req.type} — {req.days} يوم | {req.purpose}</p>
                  <p className="text-[10px] text-secondary">وافق: {req.decidedBy} — {req.decidedAt?fmtIraqi(req.decidedAt.slice(0,10)):""}</p>
                </div>
                <div className="flex gap-2 items-start flex-wrap justify-end">
                  {canExportLeave && (req.pushedToAdmin || isAdmin || isAttendanceAdmin) && (
                    <button onClick={()=>exportToTemplate(req)} className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Download size={10}/> تصدير Excel</button>
                  )}
                  <button onClick={()=>printForm(req)} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Printer size={10}/> طباعة</button>
                  {isSupervisor && !req.pushedToAdmin && (
                    <button onClick={()=>pushToAdmin(req)} className="px-2.5 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Send size={10}/> ادفع للإداري</button>
                  )}
                  {canArchive && <button onClick={()=>archiveReq(req.id)} className="px-2.5 py-1.5 bg-gray-600 text-white rounded-lg text-[11px]">📁 أرشفة</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {canArchive && archived.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-bold text-base border-t border-color pt-4 text-gray-500">📁 الأرشيف ({archived.length})</h3>
          {archived.map(req=>(
            <div key={req.id} className="card rounded-2xl p-4 border-gray-200 border bg-gray-50/50 space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm text-gray-600">{req.empName}</p>
                  <p className="text-xs text-gray-500">{req.type} — {req.days} يوم | {req.purpose}</p>
                  <p className="text-[10px] text-secondary">وافق: {req.decidedBy} — {req.decidedAt?fmtIraqi(req.decidedAt.slice(0,10)):""}</p>
                </div>
                <div className="flex gap-2 items-start">
                  {canExportLeave && (req.pushedToAdmin || isAdmin || isAttendanceAdmin) && (
                    <button onClick={()=>exportToTemplate(req)} className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Download size={10}/> تصدير Excel</button>
                  )}
                  <button onClick={()=>printForm(req)} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Printer size={10}/> طباعة</button>
                  <button onClick={()=>restoreReq(req.id)} className="px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-[11px]">↩️ استرداد</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

export default ApprovalsPage;
