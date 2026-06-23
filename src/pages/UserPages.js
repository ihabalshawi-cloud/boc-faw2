import React, { useState, useEffect, useRef } from "react";
import { Shield, Eye, EyeOff, Save, FileText, Plus, Trash2, Download,
  CheckCircle, Bell, ThumbsUp, ThumbsDown, X, PenTool, Printer, Send } from "lucide-react";
import { ACCOUNTS, LEAVE_TYPES } from "../constants";
import { storage, passStore, exportCSV, hashPassword } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { EmpPopover, SkeletonCard, useConnectionStatus, sendDesktopNotification, playAlert } from "../components/Shared";

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
      if (isConnected) await FirebaseAPI.savePassword(emp.id, hashed);
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
  const DRAFT_KEY = `draft_leave_${emp.id}`;
  const [requests, setRequests] = useState(() => storage.get(`requests_${emp.id}`, []));
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(() => storage.get(DRAFT_KEY, { type:"اعتيادية", dateFrom:new Date().toISOString().slice(0,10), dateTo:new Date().toISOString().slice(0,10), purpose:"" }));
  const [errors, setErrors] = useState({});
  const [empSigUrl, setEmpSigUrl] = useState("");
  const sigCanvasRef = useRef(null);
  const sigDrawing = useRef(false);
  const sigLastPos = useRef(null);
  const [pageLoading, setPageLoading] = useState(true);
  const showToast = useToast();
  const confirm = useConfirm();
  const { isConnected } = useConnectionStatus();
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 250); return () => clearTimeout(t); }, []);
  useEffect(() => { if (showForm) storage.set(DRAFT_KEY, formData); }, [formData, showForm, DRAFT_KEY]);

  const getSigPos = (e, c) => { const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height; return e.touches?{x:(e.touches[0].clientX-r.left)*sx,y:(e.touches[0].clientY-r.top)*sy}:{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy}; };
  const sigStartDraw = (e) => { e.preventDefault(); sigDrawing.current=true; sigLastPos.current=getSigPos(e,sigCanvasRef.current); };
  const sigDraw = (e) => { e.preventDefault(); if(!sigDrawing.current)return; const c=sigCanvasRef.current,ctx=c.getContext("2d"),p=getSigPos(e,c); ctx.beginPath();ctx.moveTo(sigLastPos.current.x,sigLastPos.current.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle="#1a1a1a";ctx.lineWidth=2;ctx.lineCap="round";ctx.stroke();sigLastPos.current=p; setEmpSigUrl(c.toDataURL("image/png")); };
  const sigStop = () => { sigDrawing.current=false; };
  const clearSig = () => { const c=sigCanvasRef.current; if(c) c.getContext("2d").clearRect(0,0,c.width,c.height); setEmpSigUrl(""); };

  const saveAllRequests = (list) => {
    storage.set("all_requests", list);
    if (isConnected) FirebaseAPI.saveRequests(list);
  };

  const notifyAdmin = (req) => {
    const admins = ACCOUNTS.filter(a => a.role === "admin" || a.username === "i.shawi");
    admins.forEach(admin => {
      const key = `notifications_${admin.id}`;
      const notifs = storage.get(key, []);
      storage.set(key, [{ id:Date.now()+admin.id, type:"طلب_إجازة",
        title:`📋 طلب إجازة — ${emp.name}`,
        body:`${req.type} — ${req.days} يوم | الغرض: ${req.purpose}`,
        timestamp:new Date().toISOString(), read:false, reqId:req.id }, ...notifs]);
    });
  };

  const handleSaveDraft = () => {
    storage.set(DRAFT_KEY, formData);
    setShowForm(false);
    setEmpSigUrl(""); clearSig();
    showToast("تم حفظ المسودة — ستجد بياناتك محفوظة عند فتح النموذج مجدداً", "success");
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.purpose.trim()) newErrors.purpose = "الغرض مطلوب";
    if (!empSigUrl) newErrors.sig = "التوقيع الإلكتروني إلزامي";
    if (new Date(formData.dateFrom) > new Date(formData.dateTo)) newErrors.date = "تاريخ البداية يجب أن يكون قبل تاريخ النهاية";
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    const days = Math.ceil((new Date(formData.dateTo) - new Date(formData.dateFrom)) / 86400000) + 1;
    const maxDays = LEAVE_TYPES[formData.type].max;
    if (days > maxDays) { setErrors({days:`الحد الأقصى ${maxDays} يوم`}); return; }
    const newReq = { id:Date.now(), ...formData, days, status:"بانتظار المراجعة", submittedAt:new Date().toISOString(), empId:emp.id, empName:emp.name, empSigDataUrl:empSigUrl };
    const allReqs = storage.get("all_requests", []);
    const updated = [newReq, ...allReqs];
    saveAllRequests(updated);
    setRequests([newReq, ...requests]);
    notifyAdmin(newReq);
    const leaveKey = formData.type==="اعتيادية" ? `annual_leave_${emp.id}` : formData.type==="مرضية" ? `sick_leave_${emp.id}` : `time_leave_${emp.id}`;
    storage.set(leaveKey, { name:emp.name, jobNum:emp.jobNum||"", jobTitle:emp.title||"", dept:emp.dept||"", fromDate:formData.dateFrom, toDate:formData.dateTo, leaveDate:formData.dateFrom, purpose:formData.purpose, sigDataUrl:empSigUrl });
    setShowForm(false);
    const blank = { type:"اعتيادية", dateFrom:new Date().toISOString().slice(0,10), dateTo:new Date().toISOString().slice(0,10), purpose:"" };
    setFormData(blank);
    storage.set(DRAFT_KEY, null);
    setErrors({}); setEmpSigUrl(""); clearSig();
    showToast("تم إرسال طلبك — سيصل إشعار للمشرف", "success");
    sendDesktopNotification("طلب إجازة", "تم إرسال طلبك بنجاح وهو الآن بانتظار المراجعة");
    playAlert("notification");
  };

  const deleteRequest = async (id) => {
    if (!await confirm("هل تريد حذف هذا الطلب؟", { danger: true, ok: "حذف", title: "حذف الطلب" })) return;
    const updated = requests.filter(r => r.id !== id);
    setRequests(updated);
    storage.set(`requests_${emp.id}`, updated);
    const allReqs = storage.get("all_requests", []);
    saveAllRequests(allReqs.filter(r => r.id !== id));
    showToast("تم حذف الطلب", "success");
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
    <div class="sigs"><div><p>توقيع الموظف</p>${empSig}</div><div><p>توقيع المشرف العام</p>${supSig}</div></div>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>w.print(),400);
  };

  const getStatusBadge = (s) => s==="بانتظار المراجعة"?"bg-amber-100 text-amber-700":s==="موافق عليها"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">طلبات الإجازة</h3>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(requests.map(r=>({الاسم:r.empName,نوع_الإجازة:r.type,من:r.dateFrom,إلى:r.dateTo,عدد_الأيام:r.days,الحالة:r.status,الغرض:r.purpose})),"طلبات_الإجازة")} className="btn-secondary flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-color"><Download size={13}/> CSV</button>
          <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><Plus size={16}/> طلب جديد</button>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}>
          <div className="card rounded-2xl w-full max-w-md shadow-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold">طلب إجازة جديد</h4>
              <button onClick={()=>setShowForm(false)} className="text-secondary hover:text-red-500"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <select value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})} className="input w-full rounded-xl px-4 py-2">{Object.entries(LEAVE_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
              <div className="grid grid-cols-2 gap-3"><input type="date" value={formData.dateFrom} onChange={e=>setFormData({...formData,dateFrom:e.target.value})} className="input rounded-xl px-4 py-2"/><input type="date" value={formData.dateTo} onChange={e=>setFormData({...formData,dateTo:e.target.value})} className="input rounded-xl px-4 py-2"/></div>
              <input value={formData.purpose} onChange={e=>setFormData({...formData,purpose:e.target.value})} placeholder="الغرض من الإجازة" className="input w-full rounded-xl px-4 py-2"/>
              {formData.purpose && <p className="text-[10px] text-emerald-600">✓ مسودة محفوظة تلقائياً</p>}
              {errors.purpose && <p className="text-red-500 text-xs">{errors.purpose}</p>}
              {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
              {errors.days && <p className="text-red-500 text-xs">{errors.days}</p>}

              <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold flex items-center gap-1.5"><PenTool size={12}/> توقيع الموظف <span className="text-red-500 text-[10px]">* إلزامي للتقديم</span></p>
                <canvas ref={sigCanvasRef} width={380} height={80}
                  className={`border-2 rounded-lg cursor-crosshair touch-none w-full bg-gray-50 ${empSigUrl?"border-emerald-400":"border-dashed border-gray-300"}`}
                  onMouseDown={sigStartDraw} onMouseMove={sigDraw} onMouseUp={sigStop} onMouseLeave={sigStop}
                  onTouchStart={sigStartDraw} onTouchMove={sigDraw} onTouchEnd={sigStop}/>
                <div className="flex justify-between items-center text-xs">
                  {empSigUrl ? <span className="text-emerald-600 font-bold">✓ تم التوقيع</span> : <span className="text-secondary">ارسم توقيعك بالماوس أو اللمس</span>}
                  <button type="button" onClick={clearSig} className="text-secondary hover:text-red-500">مسح</button>
                </div>
                {errors.sig && <p className="text-red-500 text-xs">{errors.sig}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={()=>setShowForm(false)} className="py-2 px-3 border border-color rounded-xl text-sm text-secondary">إلغاء</button>
                <button onClick={handleSaveDraft} className="flex-1 py-2 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-bold transition-colors">حفظ مسودة</button>
                <button onClick={handleSubmit} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${empSigUrl?"bg-blue-600 hover:bg-blue-700 text-white":"bg-blue-300 text-white cursor-not-allowed"}`}>حفظ وتقديم</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {pageLoading
        ? <div className="space-y-3">{[...Array(3)].map((_,i)=><SkeletonCard key={i} lines={3}/>)}</div>
        : requests.length===0
          ? <div className="card rounded-2xl p-8 text-center border-color border"><FileText size={40} className="mx-auto mb-3 text-secondary"/><p className="text-secondary">لا توجد طلبات إجازة</p></div>
          : requests.map(req=>(
            <div key={req.id} className="card rounded-2xl p-4 border-color border">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 mb-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${LEAVE_TYPES[req.type]?.color}`}>{LEAVE_TYPES[req.type]?.label}</span><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>{req.status}</span></div>
                  <p className="text-sm">من {req.dateFrom} إلى {req.dateTo} — {req.days} يوم</p>
                  <p className="text-xs text-secondary mt-1">{req.purpose}</p>
                  {req.sigDataUrl && <p className="text-[10px] text-emerald-600 mt-1">✔ موقّع إلكترونياً بواسطة {req.decidedBy}</p>}
                </div>
                <div className="flex gap-2 items-start">
                  {req.status==="موافق عليها" && <button onClick={()=>printApprovedReq(req)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="طباعة"><Printer size={15}/></button>}
                  {req.status==="بانتظار المراجعة" && <button onClick={()=>deleteRequest(req.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>}
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
  const { isConnected } = useConnectionStatus();
  const [requests, setRequests] = useState(() => storage.get("all_requests", []).filter(r => r.status === "بانتظار المراجعة"));
  const [approved, setApproved] = useState(() => storage.get("all_requests", []).filter(r => r.status === "موافق عليها").sort((a,b)=>new Date(b.decidedAt||b.submittedAt)-new Date(a.decidedAt||a.submittedAt)));
  const [sigReqId, setSigReqId] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const refreshApproved = () => setApproved(storage.get("all_requests",[]).filter(r=>r.status==="موافق عليها").sort((a,b)=>new Date(b.decidedAt||b.submittedAt)-new Date(a.decidedAt||a.submittedAt)));

  const updateStatus = (id, status, sigDataUrl=null) => {
    const allRequests = storage.get("all_requests", []);
    const updated = allRequests.map(r => r.id === id ? { ...r, status, decidedAt:new Date().toISOString(), decidedBy:emp.name, sigDataUrl } : r);
    storage.set("all_requests", updated);
    if (isConnected) FirebaseAPI.saveRequests(updated);
    const req = allRequests.find(r => r.id === id);
    if(req) {
      const empReqs = storage.get(`requests_${req.empId}`, []);
      storage.set(`requests_${req.empId}`, empReqs.map(r => r.id === id ? { ...r, status, sigDataUrl } : r));
      const notifEmp = storage.get(`notifications_${req.empId}`, []);
      storage.set(`notifications_${req.empId}`, [{ id:Date.now(), type:status==="موافق عليها"?"موافقة":"رفض",
        title:status==="موافق عليها"?"✅ تمت الموافقة على طلبك":"❌ تم رفض طلبك",
        body:`${req.type} — ${req.days} يوم`, timestamp:new Date().toISOString(), read:false }, ...notifEmp]);
    }
    setRequests(requests.filter(r => r.id !== id));
    setSigReqId(null);
    refreshApproved();
    showToast(`✅ تم ${status==="موافق عليها"?"قبول":"رفض"} الطلب`);
    playAlert("notification");
  };

  const pushToAdmin = (req) => {
    const all = storage.get("all_requests", []);
    const updated = all.map(r => r.id===req.id ? {...r, pushedToAdmin:true, pushedAt:new Date().toISOString()} : r);
    storage.set("all_requests", updated);
    if (isConnected) FirebaseAPI.saveRequests(updated);
    ACCOUNTS.filter(a=>a.role==="admin").forEach(admin => {
      const nk = `notifications_${admin.id}`;
      storage.set(nk, [{ id:Date.now()+admin.id, type:"أرشفة_إجازة",
        title:`📁 إجازة للأرشفة — ${req.empName}`,
        body:`${req.type} — ${req.days} يوم | وافق: ${req.decidedBy}`,
        timestamp:new Date().toISOString(), read:false, reqId:req.id }, ...storage.get(nk,[])]);
    });
    refreshApproved();
    showToast("📁 تم الدفع للإداري وحفظ النسخة للأرشيف");
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
<div class="sigs"><div><p>توقيع الموظف</p>${empSig}</div><div><p>توقيع المشرف العام</p>${supSig}</div></div>
</body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>w.print(),400);
  };

  return (
    <div className="space-y-4">
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

  const markAsRead = (id) => {
    const u = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(u); storage.set(`notifications_${emp.id}`, u);
  };
  const markAllRead = () => {
    const u = notifications.map(n => ({ ...n, read: true }));
    setNotifications(u); storage.set(`notifications_${emp.id}`, u);
  };
  const deleteNotif = (id) => {
    const u = notifications.filter(n => n.id !== id);
    setNotifications(u); storage.set(`notifications_${emp.id}`, u);
  };

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

// ========== سجل التعديلات ==========

function AuditLogPage() {
  const [logs] = useState(() => storage.get("audit_log", []));
  return (<div className="space-y-3">
    <h3 className="font-bold text-lg">سجل التعديلات</h3>
    <div className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-color"><th className="px-3 py-2">العملية</th><th className="px-3 py-2">التفاصيل</th><th className="px-3 py-2">بواسطة</th><th className="px-3 py-2">التاريخ</th></tr></thead>
      <tbody>{logs.length===0?<tr><td colSpan={4} className="text-center py-8 text-secondary">لا توجد سجلات</td></tr>:
      logs.slice(0,100).map(l=><tr key={l.id} className="border-b border-color"><td className="px-3 py-2">{l.action}</td><td className="px-3 py-2">{l.details}</td><td className="px-3 py-2">{l.by}</td><td className="px-3 py-2 text-secondary">{new Date(l.at).toLocaleString("ar-IQ")}</td></tr>)}</tbody></table></div></div>
  </div>);
}

export default ChangePasswordPage;
export { RequestsPage, ApprovalsPage, NotificationsPage, AuditLogPage };
