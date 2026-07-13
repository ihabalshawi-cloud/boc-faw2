import React, { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Save, FileText, Trash2, Download, CheckCircle, Bell, ThumbsUp, ThumbsDown, X, Printer } from "lucide-react";
import { ACCOUNTS, LEAVE_TYPES } from "../constants";
import { storage, passStore, exportCSV, hashPassword, fmtIraqi } from "../utils";
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
        const mine = list.filter(r => r && Number(r.empId) === Number(emp.id));
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
                  <p className="text-sm">من {fmtIraqi(req.dateFrom)} إلى {fmtIraqi(req.dateTo)} — {req.days} يوم</p>
                  <p className="text-xs text-secondary mt-1">{req.purpose}</p>
                  <p className="text-[10px] text-secondary mt-0.5">{fmtIraqi((req.submittedAt||"").slice(0,10))}</p>
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
export { RequestsPage, NotificationsPage };
