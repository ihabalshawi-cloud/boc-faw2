import React, { useState, useEffect, useRef } from "react";
import { Shield, Eye, EyeOff, Save, FileText, Trash2, Download,
  CheckCircle, Bell, ThumbsUp, ThumbsDown, X, PenTool, Printer, Send } from "lucide-react";
import { ACCOUNTS, LEAVE_TYPES } from "../constants";
import { storage, passStore, exportCSV, hashPassword } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { EmpPopover, SkeletonCard, useConnectionStatus, playAlert } from "../components/Shared";

function ChangePasswordPage({ emp, onLogout }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();
  const toast = useToast();
  const askConfirm = useConfirm();

  const handleChangePassword = async () => {
    if (!newPass || newPass.trim().length < 4) { toast("كلمة المرور يجب أن تكون 4 خانات أو أكثر", "warning"); return; }
    if (newPass.trim() !== confirm.trim()) { toast("كلمات المرور غير متطابقة", "error"); return; }
    setLoading(true);
    try {
      const hashed = await hashPassword(newPass.trim());
      if (!hashed) { toast("المتصفح لا يدعم التشفير — حاول مجدداً أو استخدم متصفحاً حديثاً", "error"); return; }
      passStore.set(`pass_${emp.id}`, hashed);
      storage.set(`pass_set_${emp.id}`, true);
      if (isConnected) {
        await FirebaseAPI.savePassword(emp.id, hashed);
        FirebaseAPI.markPasswordChanged(emp.id);
        FirebaseAPI.clearInitHash(emp.jobNum);
      }
      sessionStorage.removeItem("force_password_change");
      toast("تم تغيير كلمة المرور بنجاح!", "success");
      setNewPass(""); setConfirm("");
      if (await askConfirm("تم تغيير كلمة المرور. هل تريد تسجيل الخروج الآن؟", { title: "تسجيل الخروج", ok: "خروج" })) onLogout();
    } catch { toast("حدث خطأ أثناء الحفظ", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 border-b border-color pb-3 mb-4"><div className="p-2 bg-blue-100 rounded-xl"><Shield size={20} className="text-blue-600"/></div><div><h2 className="font-bold">تغيير كلمة المرور</h2><p className="text-xs text-secondary">{emp.name}</p></div></div>
        <div className="space-y-4">
          <div><label className="text-sm font-bold block mb-1">كلمة المرور الجديدة</label><div className="relative"><input type={showN?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="أدخل كلمة المرور الجديدة" className="input w-full rounded-xl px-4 py-3 pl-10"/>
            <button onClick={()=>setShowN(!showN)} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">{showN?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
          <div><label className="text-sm font-bold block mb-1">تأكيد كلمة المرور</label><input type={showN?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="أعد إدخال كلمة المرور" className="input w-full rounded-xl px-4 py-3"/></div>
          <button onClick={handleChangePassword} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Save size={16}/> {loading?"جاري الحفظ...":"حفظ كلمة المرور"}</button>
        </div>
      </div>
    </div>
  );
}

// ========== طلبات الإجازة ==========

function RequestsPage({ emp }) {
  const [requests, setRequests] = useState(() => storage.get(`requests_${emp.id}`, []));
  const [pageLoading, setPageLoading] = useState(true);
  const showToast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const load = () => FirebaseAPI.loadRequests().then(list => {
      if (list && list.length > 0) {
        storage.set("all_requests", list);
        const mine = list.filter(r => Number(r.empId) === Number(emp.id));
        if (mine.length > 0) { storage.set(`requests_${emp.id}`, mine); setRequests(mine); }
      }
    });
    load();
    const poll = setInterval(load, 20000);
    const t = setTimeout(() => setPageLoading(false), 250);
    return () => { clearInterval(poll); clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emp.id]);

  const deleteRequest = async (id) => {
    if (!await confirm("هل تريد إلغاء هذا الطلب؟", { danger: true, ok: "إلغاء الطلب", title: "إلغاء الطلب" })) return;
    const updated = requests.filter(r => r.id !== id);
    setRequests(updated);
    storage.set(`requests_${emp.id}`, updated);
    const allReqs = storage.get("all_requests", []).filter(r => r.id !== id);
    storage.set("all_requests", allReqs); FirebaseAPI.saveRequests(allReqs);
    showToast("تم إلغاء الطلب", "success");
  };

  const printApprovedReq = (req) => {
    const supSig = req.sigDataUrl ? `<img src="${req.sigDataUrl}" style="max-width:150px;max-height:50px;"/>` : "(غير موقّع)";
    const empSig = req.empSigDataUrl ? `<img src="${req.empSigDataUrl}" style="max-width:150px;max-height:50px;"/>` : "(غير موقّع)";
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>إجازة موافق عليها</title><style>body{font-family:Arial,sans-serif;padding:30px;direction:rtl}table{border-collapse:collapse;width:100%}td,th{border:1px solid #000;padding:8px;text-align:right}h2{text-align:center}.sigs{display:flex;justify-content:space-around;margin-top:30px;text-align:center}</style></head><body>
    <h2>شركة نفط البصرة — شعبة مستودع الفاو</h2>
    <h3 style="text-align:center">نموذج إجازة ${req.type} — موافق عليها</h3>
    <table><tr><th>الموظف</th><td>${req.empName}</td><th>نوع الإجازة</th><td>${req.type}</td></tr>
    <tr><th>من</th><td>${req.dateFrom}</td><th>إلى</th><td>${req.dateTo}</td></tr>
    <tr><th>عدد الأيام</th><td>${req.days}</td><th>الغرض</th><td>${req.purpose}</td></tr>
    <tr><th>تاريخ الطلب</th><td>${new Date(req.submittedAt).toLocaleDateString("ar-IQ")}</td><th>تاريخ الموافقة</th><td>${req.decidedAt?new Date(req.decidedAt).toLocaleDateString("ar-IQ"):""}</td></tr>
    <tr><th>وافق عليها</th><td colspan="3">${req.decidedBy||""}</td></tr></table>
    <div class="sigs"><div><p>توقيع الموظف</p>${empSig}<p style="font-size:11px;margin-top:4px;">${req.empName}</p></div><div><p>مسؤول الشعبة</p>${supSig}<p style="font-size:11px;margin-top:4px;">إيهاب عبد اللطيف الشاوي</p></div></div>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>w.print(),400);
  };

  const getStatusBadge = (s) => s==="بانتظار المراجعة"?"bg-amber-100 text-amber-700":s==="موافق عليها"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">حالة طلبات الإجازة</h3>
        <button onClick={()=>exportCSV(requests.map(r=>({الاسم:r.empName,نوع_الإجازة:r.type,من:r.dateFrom,إلى:r.dateTo,عدد_الأيام:r.days,الحالة:r.status,الغرض:r.purpose})),"طلبات_الإجازة")} className="btn-secondary flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-color"><Download size={13}/> CSV</button>
      </div>
      {pageLoading
        ? <div className="space-y-3">{[...Array(3)].map((_,i)=><SkeletonCard key={i} lines={3}/>)}</div>
        : requests.length===0
          ? <div className="card rounded-2xl p-8 text-center border-color border"><FileText size={40} className="mx-auto mb-3 text-secondary"/><p className="text-secondary">لا توجد طلبات — قدّم طلبك من تبويب نماذج الإجازة</p></div>
          : requests.map(req=>(
            <div key={req.id} className="card rounded-2xl p-4 border-color border">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${LEAVE_TYPES[req.type]?.color||"bg-gray-100 text-gray-700"}`}>{req.type}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>{req.status}</span>
                  </div>
                  <p className="text-sm">من {req.dateFrom} إلى {req.dateTo} — {req.days} يوم</p>
                  <p className="text-xs text-secondary mt-1">{req.purpose}</p>
                  <p className="text-[10px] text-secondary mt-0.5">{new Date(req.submittedAt||Date.now()).toLocaleDateString("ar-IQ")}</p>
                  {req.sigDataUrl && <p className="text-[10px] text-emerald-600 mt-1">✔ موقّع إلكترونياً بواسطة {req.decidedBy}</p>}
                </div>
                <div className="flex gap-2 items-start">
                  {req.status==="موافق عليها" && <button onClick={()=>printApprovedReq(req)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="طباعة"><Printer size={15}/></button>}
                  {req.status==="بانتظار المراجعة" && <button onClick={()=>deleteRequest(req.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="إلغاء الطلب"><Trash2 size={16}/></button>}
                </div>
              </div>
            </div>
          ))}
    </div>
  );
}

// ========== لوحة التوقيع الداخلية ==========
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

// ========== الموافقات ==========
function ApprovalsPage({ emp }) {
  const isSupervisor = emp.username === "i.shawi";
  const isAdmin = emp.role === "admin";
  const isAttendanceAdmin = emp.role === "attendance_admin";
  const canArchive = isSupervisor || isAdmin || isAttendanceAdmin;
  const sortDesc = (a,b) => new Date(b.decidedAt||b.submittedAt)-new Date(a.decidedAt||a.submittedAt);
  const [requests, setRequests] = useState(() => storage.get("all_requests", []).filter(r => r.status === "بانتظار المراجعة"));
  const [approved, setApproved] = useState(() => storage.get("all_requests", []).filter(r => r.status === "موافق عليها" && !r.archived).sort(sortDesc));
  const [archived, setArchived] = useState(() => storage.get("all_requests", []).filter(r => r.archived).sort(sortDesc));
  const [pushed, setPushed] = useState(() => storage.get("all_requests", []).filter(r => r.pushedToAdmin && !r.archived));
  const [sigReqId, setSigReqId] = useState(null);
  const [activeTab, setActiveTab] = useState("مرحّلة");
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const applyList = (list) => {
    storage.set("all_requests", list);
    setRequests(list.filter(r => r.status === "بانتظار المراجعة"));
    setApproved(list.filter(r => r.status === "موافق عليها" && !r.archived).sort(sortDesc));
    setArchived(list.filter(r => r.archived).sort(sortDesc));
    setPushed(list.filter(r => r.pushedToAdmin && !r.archived));
  };
  const refreshApproved = () => {
    const all = storage.get("all_requests", []);
    setApproved(all.filter(r => r.status === "موافق عليها" && !r.archived).sort(sortDesc));
    setArchived(all.filter(r => r.archived).sort(sortDesc));
    setPushed(all.filter(r => r.pushedToAdmin && !r.archived));
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
        const ws = wb.worksheets[0]; const set=(r,v)=>{ws.getCell(r).value=v??null;};
        set("C5",fmtD((req.submittedAt||"").split("T")[0])); set("I8",req.empName||""); set("I9",String(empAcct.jobNum||"")); set("I10",empAcct.title||""); set("I11",fmtD((req.submittedAt||"").split("T")[0])); set("D13",String(req.days||"")); set("G13",fmtD(req.dateFrom)); set("I14",req.purpose||"");
        await addImg(wb,ws,req.empSigDataUrl,1,17); await addImg(wb,ws,req.sigDataUrl,7,17);
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
        set("F2",fmtD(req.dateFrom)); set("C7",req.empName||""); set("E7",String(empAcct.jobNum||"")); set("G7",empAcct.title||""); set("D8",empAcct.dept||"");
        await addImg(wb,ws,req.empSigDataUrl,2,11); await addImg(wb,ws,req.sigDataUrl,6,11);
        fname=`اجازة_زمنية_${safe}_${req.dateFrom||""}.xlsx`;
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
    return () => clearInterval(t);
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
    }
    setRequests(requests.filter(r => r.id !== id));
    setSigReqId(null);
    refreshApproved();
    showToast(`✅ تم ${status==="موافق عليها"?"قبول":"رفض"} الطلب`);
    playAlert("notification");
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

  const pushToAdmin = (req) => {
    exportReqExcel(req);
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

  return (
    <div className="space-y-4">
      {isAttendanceAdmin && (
        <div className="flex gap-1 border-b border-color pb-0 -mb-2">
          <button onClick={()=>setActiveTab("مرحّلة")} className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${activeTab==="مرحّلة"?"border-violet-600 text-violet-700":"border-transparent text-secondary hover:text-primary"}`}>
            📋 إجازات مرحّلة إليك{pushed.length>0&&<span className="mr-1.5 bg-violet-100 text-violet-700 rounded-full px-1.5 text-[10px]">{pushed.length}</span>}
          </button>
          <button onClick={()=>setActiveTab("كل")} className={`px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${activeTab==="كل"?"border-violet-600 text-violet-700":"border-transparent text-secondary hover:text-primary"}`}>
            📄 جميع الطلبات
          </button>
        </div>
      )}

      {isAttendanceAdmin && activeTab==="مرحّلة" && (
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-base text-violet-700">📋 الإجازات المرحّلة إليك ({pushed.length})</h3>
          {pushed.length===0
            ? <div className="card rounded-2xl p-8 text-center border-color border"><p className="text-secondary text-sm">لا توجد إجازات مرحّلة بعد</p></div>
            : pushed.map(req=>(
              <div key={req.id} className="card rounded-2xl p-4 border-violet-200 border bg-violet-50/30 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm">{req.empName}</p>
                    <p className="text-xs">{req.type} — {req.days} يوم | {req.purpose}</p>
                    <p className="text-xs text-secondary">{req.dateFrom} ← {req.dateTo}</p>
                    <p className="text-[10px] text-secondary">وافق: {req.decidedBy} — {req.pushedAt?new Date(req.pushedAt).toLocaleDateString("ar-IQ"):""}</p>
                  </div>
                  <div className="flex gap-2 items-start flex-wrap justify-end">
                    <button onClick={()=>exportToTemplate(req)} className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Download size={10}/> تصدير Excel</button>
                    <button onClick={()=>printForm(req)} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Printer size={10}/> طباعة</button>
                    <button onClick={()=>archiveReq(req.id)} className="px-2.5 py-1.5 bg-gray-600 text-white rounded-lg text-[11px]">📁 أرشفة</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {(!isAttendanceAdmin || activeTab==="كل") && <>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">الطلبات المعلقة ({requests.length})</h3>
        {!isSupervisor && <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">للاطلاع فقط — الموافقة من صلاحية المشرف العام</span>}
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
                  <p className="text-xs text-secondary mt-1">{new Date(req.submittedAt).toLocaleDateString("ar-IQ")}</p>
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
          <h3 className="font-bold text-base border-t border-color pt-4">سجل الإجازات الموافق عليها ({approved.length})</h3>
          {approved.map(req=>(
            <div key={req.id} className="card rounded-2xl p-4 border-emerald-200 border bg-emerald-50/30 space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-sm">{req.empName}</p>
                  <p className="text-xs">{req.type} — {req.days} يوم | {req.purpose}</p>
                  <p className="text-[10px] text-secondary">وافق: {req.decidedBy} — {req.decidedAt?new Date(req.decidedAt).toLocaleDateString("ar-IQ"):""}</p>
                </div>
                <div className="flex gap-2 items-start flex-wrap justify-end">
                  <button onClick={()=>printForm(req)} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Printer size={10}/> طباعة النموذج</button>
                  {isSupervisor && !req.pushedToAdmin && (
                    <button onClick={()=>pushToAdmin(req)} className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Send size={10}/> ادفع للإداري</button>
                  )}
                  {req.pushedToAdmin && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-1 rounded-lg">✓ أُرسل للإداري</span>}
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
                  <p className="text-[10px] text-secondary">وافق: {req.decidedBy} — {req.decidedAt?new Date(req.decidedAt).toLocaleDateString("ar-IQ"):""}</p>
                </div>
                <div className="flex gap-2 items-start">
                  <button onClick={()=>printForm(req)} className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] flex items-center gap-1"><Printer size={10}/> طباعة</button>
                  <button onClick={()=>restoreReq(req.id)} className="px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-[11px]">↩️ استرداد</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </> }
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== الإشعارات مع الفلترة ==========

const NOTIF_FILTERS = [
  { key:"الكل",         match: () => true },
  { key:"طلبات إجازة",  match: n => n.type==="طلب_إجازة" },
  { key:"الموافقات",    match: n => n.type==="موافقة"||n.type==="موافقة_مشرف"||n.type==="رفض" },
  { key:"مهام",         match: n => n.type==="مهمة" },
];

function NotificationsPage({ emp }) {
  const [notifications, setNotifications] = useState(() => storage.get(`notifications_${emp.id}`, []));
  const [filter, setFilter] = useState("الكل");

  useEffect(() => {
    FirebaseAPI.loadNotifications(emp.id).then(list => {
      if (list && list.length > 0) {
        const merged = [...list];
        const local = storage.get(`notifications_${emp.id}`, []);
        local.forEach(n => { if (!merged.some(m => m.id === n.id)) merged.push(n); });
        merged.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(merged);
        storage.set(`notifications_${emp.id}`, merged);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emp.id]);

  const saveNotifs = (list) => {
    setNotifications(list);
    storage.set(`notifications_${emp.id}`, list);
    FirebaseAPI.saveNotifications(emp.id, list);
  };

  const markAsRead = (id) => saveNotifs(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => saveNotifs(notifications.map(n => ({ ...n, read: true })));
  const deleteNotif = (id) => saveNotifs(notifications.filter(n => n.id !== id));

  const unread = notifications.filter(n => !n.read).length;
  const activeFilter = NOTIF_FILTERS.find(f => f.key === filter);
  const displayed = notifications.filter(activeFilter.match);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">الإشعارات {unread>0&&<span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>}</h3>
        {unread>0&&<button onClick={markAllRead} className="text-xs text-blue-600 underline">تحديد الكل كمقروء</button>}
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {NOTIF_FILTERS.map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filter===f.key?"bg-[#C87A2E] text-white":"btn-secondary border border-color text-secondary"}`}>
            {f.key}
          </button>
        ))}
      </div>
      {displayed.length===0
        ? <div className="card rounded-2xl p-8 text-center border-color border"><Bell size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد إشعارات</p></div>
        : displayed.map(n=>(
          <div key={n.id} className={`card rounded-2xl p-4 border cursor-pointer transition-all ${n.read?"border-color opacity-70":"border-blue-300"}`}>
            <div className="flex gap-3 items-start" onClick={()=>markAsRead(n.id)}>
              <div className={`p-2 rounded-xl shrink-0 ${n.type==="موافقة"||n.type==="موافقة_مشرف"?"bg-emerald-100":n.type==="رفض"?"bg-red-100":n.type==="طلب_إجازة"?"bg-amber-100":n.type==="مهمة"?"bg-violet-100":"bg-blue-100"}`}>
                {n.type==="موافقة"||n.type==="موافقة_مشرف"?<ThumbsUp size={16} className="text-emerald-600"/>:n.type==="رفض"?<ThumbsDown size={16} className="text-red-600"/>:<Bell size={16} className="text-blue-600"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{n.title}</p>
                <p className="text-xs text-secondary">{n.body}</p>
                <p className="text-[10px] text-secondary mt-0.5">{new Date(n.timestamp).toLocaleString("ar-IQ")}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"/>}
              <button onClick={e=>{e.stopPropagation();deleteNotif(n.id);}} className="text-secondary hover:text-red-500 shrink-0"><X size={14}/></button>
            </div>
          </div>
        ))
      }
    </div>
  );
}

export default ChangePasswordPage;
export { RequestsPage, ApprovalsPage, NotificationsPage };
