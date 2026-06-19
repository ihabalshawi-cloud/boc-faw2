import React, { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Save, FileText, Plus, Trash2, Download,
  CheckCircle, Bell, ThumbsUp, ThumbsDown } from "lucide-react";
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
  const [requests, setRequests] = useState(() => storage.get(`requests_${emp.id}`, []));
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type:"اعتيادية", dateFrom:new Date().toISOString().slice(0,10), dateTo:new Date().toISOString().slice(0,10), purpose:"" });
  const [errors, setErrors] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const showToast = useToast();
  const confirm = useConfirm();
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 250); return () => clearTimeout(t); }, []);

  const handleSubmit = () => {
    if (!formData.purpose.trim()) { setErrors({purpose:"الغرض مطلوب"}); return; }
    if (new Date(formData.dateFrom) > new Date(formData.dateTo)) { setErrors({date:"تاريخ البداية يجب أن يكون قبل تاريخ النهاية"}); return; }
    const days = Math.ceil((new Date(formData.dateTo) - new Date(formData.dateFrom)) / 86400000) + 1;
    const maxDays = LEAVE_TYPES[formData.type].max;
    if (days > maxDays) { setErrors({days:`الحد الأقصى ${maxDays} يوم`}); return; }
    const newReq = { id:Date.now(), ...formData, days, status:"بانتظار المراجعة", submittedAt:new Date().toISOString(), empId:emp.id, empName:emp.name };
    const allReqs = storage.get("all_requests", []);
    storage.set("all_requests", [newReq, ...allReqs]);
    setRequests([newReq, ...requests]);
    setShowForm(false);
    setFormData({ type:"اعتيادية", dateFrom:new Date().toISOString().slice(0,10), dateTo:new Date().toISOString().slice(0,10), purpose:"" });
    setErrors({});
    showToast("تم إرسال طلبك بنجاح", "success");
    sendDesktopNotification("طلب إجازة", "تم إرسال طلبك بنجاح وهو الآن بانتظار المراجعة");
    playAlert("notification");
  };

  const deleteRequest = async (id) => {
    if (!await confirm("هل تريد حذف هذا الطلب؟", { danger: true, ok: "حذف", title: "حذف الطلب" })) return;
    {
      const updated = requests.filter(r => r.id !== id);
      setRequests(updated);
      storage.set(`requests_${emp.id}`, updated);
      showToast("تم حذف الطلب", "success");
    }
  };

  const getStatusBadge = (s) => s==="بانتظار المراجعة"?"bg-amber-100 text-amber-700":s==="موافق عليها"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">طلبات الإجازة</h3>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(requests.map(r=>({الاسم:r.empName,نوع_الإجازة:r.type,من:r.dateFrom,إلى:r.dateTo,عدد_الأيام:r.days,الحالة:r.status,الغرض:r.purpose})),"طلبات_الإجازة")} className="btn-secondary flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-color"><Download size={13}/> CSV</button>
          <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><Plus size={16}/> طلب جديد</button>
        </div>
      </div>
      {showForm && (<div className="card rounded-2xl p-5 border-color border"><h4 className="font-bold mb-4">طلب إجازة جديد</h4>
        <div className="space-y-3">
          <select value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})} className="input w-full rounded-xl px-4 py-2">{Object.entries(LEAVE_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
          <div className="grid grid-cols-2 gap-3"><input type="date" value={formData.dateFrom} onChange={e=>setFormData({...formData,dateFrom:e.target.value})} className="input rounded-xl px-4 py-2"/><input type="date" value={formData.dateTo} onChange={e=>setFormData({...formData,dateTo:e.target.value})} className="input rounded-xl px-4 py-2"/></div>
          <input value={formData.purpose} onChange={e=>setFormData({...formData,purpose:e.target.value})} placeholder="الغرض من الإجازة" className="input w-full rounded-xl px-4 py-2"/>
          {errors.purpose && <p className="text-red-500 text-xs">{errors.purpose}</p>}{errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}{errors.days && <p className="text-red-500 text-xs">{errors.days}</p>}
          <div className="flex gap-3"><button onClick={()=>setShowForm(false)} className="flex-1 py-2 border border-color rounded-xl">إلغاء</button><button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">إرسال</button></div>
        </div></div>)}
      {pageLoading
        ? <div className="space-y-3">{[...Array(3)].map((_,i)=><SkeletonCard key={i} lines={3}/>)}</div>
        : requests.length===0
          ? <div className="card rounded-2xl p-8 text-center border-color border"><FileText size={40} className="mx-auto mb-3 text-secondary"/><p className="text-secondary">لا توجد طلبات إجازة</p></div>
          : requests.map(req=>(<div key={req.id} className="card rounded-2xl p-4 border-color border"><div className="flex justify-between items-start">
        <div><div className="flex gap-2 mb-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${LEAVE_TYPES[req.type]?.color}`}>{LEAVE_TYPES[req.type]?.label}</span><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>{req.status}</span></div>
        <p className="text-sm">من {req.dateFrom} إلى {req.dateTo} — {req.days} يوم</p><p className="text-xs text-secondary mt-1">{req.purpose}</p></div>
        {req.status==="بانتظار المراجعة" && <button onClick={()=>deleteRequest(req.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>}</div></div>))}
    </div>
  );
}

// ========== الموافقات ==========

function ApprovalsPage({ emp }) {
  const [requests, setRequests] = useState(() => storage.get("all_requests", []).filter(r => r.status === "بانتظار المراجعة"));
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const updateStatus = (id, status) => {
    const allRequests = storage.get("all_requests", []);
    const updated = allRequests.map(r => r.id === id ? { ...r, status, decidedAt: new Date().toISOString(), decidedBy: emp.name } : r);
    storage.set("all_requests", updated);
    const req = allRequests.find(r => r.id === id);
    if(req) {
      const empReqs = storage.get(`requests_${req.empId}`, []);
      storage.set(`requests_${req.empId}`, empReqs.map(r => r.id === id ? { ...r, status } : r));
      const notifs = storage.get(`notifications_${req.empId}`, []);
      storage.set(`notifications_${req.empId}`, [{ id:Date.now(), type:status==="موافق عليها"?"موافقة":"رفض", title:status==="موافق عليها"?"✅ تمت الموافقة على طلبك":"❌ تم رفض طلبك", body:`${req.type} — ${req.days} يوم`, timestamp:new Date().toISOString(), read:false }, ...notifs]);
    }
    setRequests(requests.filter(r => r.id !== id));
    showToast(`✅ تم ${status==="موافق عليها"?"قبول":"رفض"} الطلب`);
    playAlert("notification");
  };

  return (<div className="space-y-4"><h3 className="font-bold text-lg">الطلبات المعلقة ({requests.length})</h3>
    {requests.length===0?<div className="card rounded-2xl p-8 text-center border-color border"><CheckCircle size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد طلبات معلقة</p></div>:
    requests.map(req=>{const reqEmp=ACCOUNTS.find(e=>e.id===req.empId)||{name:req.empName};return(<div key={req.id} className="card rounded-2xl p-4 border-color border"><div className="flex justify-between"><div><p className="font-bold"><EmpPopover emp={reqEmp}>{req.empName}</EmpPopover></p><p className="text-sm">{req.type} — {req.days} يوم</p><p className="text-xs text-secondary">{req.purpose}</p>
    <p className="text-xs text-secondary mt-1">{new Date(req.submittedAt).toLocaleDateString("ar-IQ")}</p></div>
    <div className="flex gap-2 items-start"><button onClick={()=>updateStatus(req.id,"موافق عليها")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">قبول</button><button onClick={()=>updateStatus(req.id,"مرفوضة")} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs">رفض</button></div></div></div>)})}
    {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
  </div>);
}

// ========== الإشعارات ==========

function NotificationsPage({ emp }) {
  const [notifications, setNotifications] = useState(() => storage.get(`notifications_${emp.id}`, []));
  
  const markAsRead = (id) => {
    const u = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(u); storage.set(`notifications_${emp.id}`, u);
  };
  
  const markAllRead = () => {
    const u = notifications.map(n => ({ ...n, read: true }));
    setNotifications(u); storage.set(`notifications_${emp.id}`, u);
  };

  const unread = notifications.filter(n => !n.read).length;

  return (<div className="space-y-3">
    <div className="flex justify-between items-center"><h3 className="font-bold text-lg">الإشعارات {unread>0&&<span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>}</h3>
    {unread>0&&<button onClick={markAllRead} className="text-xs text-blue-600 underline">تحديد الكل كمقروء</button>}</div>
    {notifications.length===0?<div className="card rounded-2xl p-8 text-center border-color border"><Bell size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد إشعارات</p></div>:
    notifications.map(n=>(<div key={n.id} onClick={()=>markAsRead(n.id)} className={`card rounded-2xl p-4 border cursor-pointer transition-all ${n.read?"border-color opacity-70":"border-blue-300"}`}>
      <div className="flex gap-3"><div className={`p-2 rounded-xl ${n.type==="موافقة"?"bg-emerald-100":n.type==="رفض"?"bg-red-100":"bg-blue-100"}`}>
        {n.type==="موافقة"?<ThumbsUp size={16} className="text-emerald-600"/>:n.type==="رفض"?<ThumbsDown size={16} className="text-red-600"/>:<Bell size={16} className="text-blue-600"/>}</div>
      <div className="flex-1"><p className="font-bold">{n.title}</p><p className="text-sm text-secondary">{n.body}</p><p className="text-[10px] text-secondary">{new Date(n.timestamp).toLocaleString("ar-IQ")}</p></div>
      {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"/>}</div></div>))}</div>);
}

// ========== نظام الحضور ==========

function AuditLogPage() {
  const [logs] = useState(() => storage.get("audit_log", []));
  return (<div className="space-y-3">
    <h3 className="font-bold text-lg">سجل التعديلات</h3>
    <div className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-color"><th className="px-3 py-2">العملية</th><th className="px-3 py-2">التفاصيل</th><th className="px-3 py-2">بواسطة</th><th className="px-3 py-2">التاريخ</th></tr></thead>
      <tbody>{logs.length===0?<tr><td colSpan={4} className="text-center py-8 text-secondary">لا توجد سجلات</td></tr>:
      logs.slice(0,100).map(l=><tr key={l.id} className="border-b border-color"><td className="px-3 py-2">{l.action}</td><td className="px-3 py-2">{l.details}</td><td className="px-3 py-2">{l.by}</td><td className="px-3 py-2 text-secondary">{new Date(l.at).toLocaleString("ar-IQ")}</td></tr>)}</tbody></table></div></div>
  </div>);
}

// ========== استمارة الضمان الصحي ==========
// ========== ثوابت إدارة المشاريع ==========

// ========== التايم شيت ==========

export default ChangePasswordPage;
export { RequestsPage, ApprovalsPage, NotificationsPage, AuditLogPage };
