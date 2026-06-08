import { useState, useEffect, useCallback } from "react";
import { 
  LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User, 
  CheckCircle, Wifi, WifiOff, RefreshCw, FileText, Clock, Calendar,
  Bell, ThumbsUp, ThumbsDown, Plus, Trash2, Edit3, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Printer, Download, Search, Award
} from "lucide-react";

const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";

const ACCOUNTS = [
  {id:1, jobNum:"728004", password:"1001", name:"ايهاب عبد اللطيف", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"admin"},
  {id:2, jobNum:"727466", password:"1002", name:"عدي فيصل عبد الهادي", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:3, jobNum:"737283", password:"1003", name:"عمر طاهر خزعل", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:4, jobNum:"756571", password:"1004", name:"ليث شاكر حمود", title:"معاون مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:5, jobNum:"790850", password:"1005", name:"اسعد عبد الامام", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي"},
];

const LEAVE_TYPES = {
  اعتيادية: { label: "إجازة اعتيادية", max: 30, color: "bg-blue-100 text-blue-700" },
  مرضية: { label: "إجازة مرضية", max: 15, color: "bg-rose-100 text-rose-700" },
  زمنية: { label: "إجازة زمنية", max: 7, color: "bg-amber-100 text-amber-700" },
};

const TRAINING_TYPES = ["تدريب ذاتي", "دورة تدريبية", "ورشة عمل"];
const ITEM_CONDITIONS = ["جيد", "مستعمل", "يحتاج صيانة", "تالف"];
const FURNITURE_CATS = ["أثاث مكتبي", "أجهزة حاسوب", "معدات مكتبية"];

const storage = {
  get: (key, defaultValue = null) => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; } catch { return defaultValue; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  }
};

const FirebaseAPI = {
  checkConnection: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${FIREBASE_URL}/.json`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch { return false; }
  },
  savePassword: async (empId, password) => {
    try { await fetch(`${FIREBASE_URL}/passwords/${empId}.json`, { method: "PUT", body: JSON.stringify(password) }); return true; } catch { return false; }
  },
  getPassword: async (empId) => {
    try { const res = await fetch(`${FIREBASE_URL}/passwords/${empId}.json`); if (!res.ok) return null; const data = await res.json(); return typeof data === "string" ? data : null; } catch { return null; }
  },
  saveRequest: async (request) => {
    try { await fetch(`${FIREBASE_URL}/requests/${request.id}.json`, { method: "PUT", body: JSON.stringify(request) }); return true; } catch { return false; }
  },
  getAllRequests: async () => {
    try { const res = await fetch(`${FIREBASE_URL}/requests.json`); if (!res.ok) return []; const data = await res.json(); return data ? Object.values(data) : []; } catch { return []; }
  },
  deleteRequest: async (id) => {
    try { await fetch(`${FIREBASE_URL}/requests/${id}.json`, { method: "DELETE" }); return true; } catch { return false; }
  },
  saveNotification: async (empId, notification) => {
    try { await fetch(`${FIREBASE_URL}/notifications/${empId}/${notification.id}.json`, { method: "PUT", body: JSON.stringify(notification) }); return true; } catch { return false; }
  },
  getNotifications: async (empId) => {
    try { const res = await fetch(`${FIREBASE_URL}/notifications/${empId}.json`); if (!res.ok) return []; const data = await res.json(); return data ? Object.values(data).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)) : []; } catch { return []; }
  },
  saveAttendance: async (empId, date, record) => {
    try { await fetch(`${FIREBASE_URL}/attendance/${empId}/${date}.json`, { method: "PUT", body: JSON.stringify(record) }); return true; } catch { return false; }
  },
  getAttendance: async (empId) => {
    try { const res = await fetch(`${FIREBASE_URL}/attendance/${empId}.json`); if (!res.ok) return {}; const data = await res.json(); return data || {}; } catch { return {}; }
  },
  saveTraining: async (empId, training) => {
    try { await fetch(`${FIREBASE_URL}/training/${empId}/${training.id}.json`, { method: "PUT", body: JSON.stringify(training) }); return true; } catch { return false; }
  },
  getTrainings: async (empId) => {
    try { const res = await fetch(`${FIREBASE_URL}/training/${empId}.json`); if (!res.ok) return []; const data = await res.json(); return data ? Object.values(data) : []; } catch { return []; }
  }
};

function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const checkConnection = useCallback(async () => {
    setChecking(true);
    const connected = await FirebaseAPI.checkConnection();
    setIsConnected(connected);
    setChecking(false);
  }, []);
  useEffect(() => { checkConnection(); const interval = setInterval(checkConnection, 30000); return () => clearInterval(interval); }, [checkConnection]);
  return { isConnected, checking };
}

function printElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/><title>تقرير</title><style>body{padding:20mm;font-family:Arial} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px}</style></head><body>${el.innerHTML}</body></html>`;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 500);
}

function PrintButton({ targetId }) {
  return (<button onClick={() => printElement(targetId)} className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border px-3 py-2 rounded-xl"><Printer size={13}/> طباعة</button>);
}

function SyncButton({ onSync, isSyncing }) {
  return (<button onClick={onSync} disabled={isSyncing} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold"><RefreshCw size={12} className={isSyncing ? "animate-spin" : ""}/> {isSyncing ? "جاري المزامنة..." : "مزامنة"}</button>);
}

// ========== شاشة تسجيل الدخول ==========
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("boc_session");
      if (saved) {
        const { acctId, expiry } = JSON.parse(saved);
        if (expiry > Date.now()) {
          const acct = ACCOUNTS.find(a => a.id === acctId);
          if (acct) onLogin(acct);
        } else sessionStorage.removeItem("boc_session");
      }
    } catch {}
  }, [onLogin]);

  const handleLogin = async () => {
    setErr("");
    if (!user || !pass) { setErr("أدخل الرقم الوظيفي وكلمة المرور"); return; }
    const account = ACCOUNTS.find(a => a.jobNum === user.trim());
    if (!account) { setErr("الرقم الوظيفي غير موجود"); return; }
    setLoading(true);
    let isValid = false;
    if (pass.trim() === account.password) isValid = true;
    if (!isValid) { const stored = storage.get(`pass_${account.id}`); if (stored && pass.trim() === stored) isValid = true; }
    if (!isValid && isConnected) { const fbPass = await FirebaseAPI.getPassword(account.id); if (fbPass && pass.trim() === fbPass) isValid = true; }
    if (isValid) {
      if (isConnected && pass.trim() === account.password) { await FirebaseAPI.savePassword(account.id, pass.trim()); storage.set(`pass_${account.id}`, pass.trim()); }
      sessionStorage.setItem("boc_session", JSON.stringify({ acctId: account.id, expiry: Date.now() + 8 * 3600000 }));
      const defaultPasswords = ["1001","1002","1003","1004","1005"];
      if (defaultPasswords.includes(pass.trim())) sessionStorage.setItem("force_password_change", "true");
      onLogin(account);
    } else { setErr("كلمة المرور غير صحيحة"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4"><LogIn size={32} className="text-white"/></div>
          <h2 className="text-2xl font-bold text-white">شركة نفط البصرة</h2>
          <p className="text-sm text-slate-300 mt-2">شعبة مستودع الفاو</p>
        </div>
        <div className="mb-4 flex items-center justify-center gap-2 text-xs">
          {isConnected ? <><Wifi size={12} className="text-emerald-400"/><span className="text-emerald-400">✓ متصل بالسحابة</span></> : <><WifiOff size={12} className="text-amber-400"/><span className="text-amber-400">⚠ غير متصل</span></>}
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-200 mb-2">الرقم الوظيفي</label>
            <input type="text" value={user} onChange={e=>setUser(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg" placeholder="728004" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
          <div><label className="block text-sm font-bold text-slate-200 mb-2">كلمة المرور</label>
            <div className="relative"><input type={showP?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              <button onClick={()=>setShowP(!showP)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{showP?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
          {err && <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-xl">{err}</div>}
          <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl text-lg">{loading?"جاري التحقق...":"تسجيل الدخول"}</button>
        </div>
        <div className="mt-6 text-center text-sm text-slate-400"><p>🔑 <strong className="text-blue-300">728004</strong> | <strong className="text-blue-300">1001</strong></p></div>
      </div>
    </div>
  );
}

// ========== تغيير كلمة المرور ==========
function ChangePasswordPage({ emp, onLogout }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();

  const handleChange = async () => {
    if (!newPass || newPass.trim().length < 4) { setMsg("⚠️ كلمة المرور يجب أن تكون 4 خانات"); return; }
    if (newPass.trim() !== confirm.trim()) { setMsg("⚠️ كلمات المرور غير متطابقة"); return; }
    setLoading(true);
    try {
      storage.set(`pass_${emp.id}`, newPass.trim());
      if (isConnected) await FirebaseAPI.savePassword(emp.id, newPass.trim());
      sessionStorage.removeItem("force_password_change");
      setMsg("✅ تم تغيير كلمة المرور بنجاح!");
      setNewPass(""); setConfirm("");
      setTimeout(() => { if (window.confirm("هل تريد تسجيل الخروج؟")) onLogout(); }, 1500);
    } catch { setMsg("❌ حدث خطأ"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 border-b pb-3 mb-4"><div className="p-2 bg-blue-100 rounded-xl"><Shield size={20} className="text-blue-600"/></div><div><h2 className="font-bold">تغيير كلمة المرور</h2><p className="text-xs text-slate-500">{emp.name}</p></div></div>
        <div className="space-y-4">
          <div><label className="text-sm font-bold block mb-1">كلمة المرور الجديدة</label><div className="relative"><input type={showN?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} className="w-full border rounded-xl px-4 py-3 pl-10"/>
            <button onClick={()=>setShowN(!showN)} className="absolute left-3 top-1/2 -translate-y-1/2">{showN?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
          <div><label className="text-sm font-bold block mb-1">تأكيد كلمة المرور</label><input type={showN?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full border rounded-xl px-4 py-3"/></div>
          {msg && <div className="p-3 rounded-xl text-sm text-center bg-emerald-50 text-emerald-700">{msg}</div>}
          <button onClick={handleChange} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Save size={16}/> {loading?"جاري الحفظ...":"حفظ"}</button>
        </div>
      </div>
    </div>
  );
}

// ========== طلبات الإجازة ==========
function RequestsPage({ emp }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type:"اعتيادية", dateFrom:new Date().toISOString().slice(0,10), dateTo:new Date().toISOString().slice(0,10), purpose:"" });
  const [toast, setToast] = useState("");
  const { isConnected } = useConnectionStatus();
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(() => {
    const load = async () => {
      if (isConnected) {
        const all = await FirebaseAPI.getAllRequests();
        setRequests(all.filter(r => r.empId === emp.id));
      } else {
        setRequests(storage.get(`requests_${emp.id}`, []));
      }
    };
    load();
  }, [emp.id, isConnected]);

  const handleSubmit = async () => {
    if (!form.purpose.trim()) { showToast("الغرض مطلوب"); return; }
    const days = Math.ceil((new Date(form.dateTo) - new Date(form.dateFrom)) / 86400000) + 1;
    const newReq = { id:Date.now(), ...form, days, status:"بانتظار المراجعة", submittedAt:new Date().toISOString(), empId:emp.id, empName:emp.name };
    if (isConnected) await FirebaseAPI.saveRequest(newReq);
    const updated = [newReq, ...requests];
    setRequests(updated);
    storage.set(`requests_${emp.id}`, updated);
    setShowForm(false);
    showToast("✅ تم إرسال طلبك");
  };

  const deleteReq = async (id) => {
    if (window.confirm("حذف؟")) {
      if (isConnected) await FirebaseAPI.deleteRequest(id);
      const updated = requests.filter(r => r.id !== id);
      setRequests(updated);
      storage.set(`requests_${emp.id}`, updated);
      showToast("✅ تم الحذف");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h3 className="font-bold text-lg">طلبات الإجازة</h3><button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm"><Plus size={16}/> طلب جديد</button></div>
      {showForm && (<div className="bg-white rounded-2xl p-5 border"><h4 className="font-bold mb-4">طلب جديد</h4>
        <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full border rounded-xl px-4 py-2 mb-3">{Object.entries(LEAVE_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
        <div className="grid grid-cols-2 gap-3 mb-3"><input type="date" value={form.dateFrom} onChange={e=>setForm({...form,dateFrom:e.target.value})} className="border rounded-xl px-4 py-2"/><input type="date" value={form.dateTo} onChange={e=>setForm({...form,dateTo:e.target.value})} className="border rounded-xl px-4 py-2"/></div>
        <input value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="الغرض" className="w-full border rounded-xl px-4 py-2 mb-3"/>
        <div className="flex gap-3"><button onClick={()=>setShowForm(false)} className="flex-1 py-2 border rounded-xl">إلغاء</button><button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">إرسال</button></div>
      </div>)}
      {requests.length===0?<div className="bg-white rounded-2xl p-8 text-center text-slate-400"><FileText size={40} className="mx-auto"/><p>لا توجد طلبات</p></div>:
      requests.map(r=>(<div key={r.id} className="bg-white rounded-2xl p-4 border"><div className="flex justify-between"><div><span className={`px-2 py-1 rounded-full text-xs ${LEAVE_TYPES[r.type]?.color}`}>{LEAVE_TYPES[r.type]?.label}</span><p className="mt-2 text-sm">{r.dateFrom} إلى {r.dateTo} — {r.days} يوم</p><p className="text-xs text-slate-400">{r.purpose}</p></div>
      {r.status==="بانتظار المراجعة" && <button onClick={()=>deleteReq(r.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>}</div></div>))}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-5 py-3 rounded-2xl"><CheckCircle size={14} className="inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== الموافقات ==========
function ApprovalsPage({ emp }) {
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState("");
  const { isConnected } = useConnectionStatus();
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(() => {
    const load = async () => {
      const all = isConnected ? await FirebaseAPI.getAllRequests() : storage.get("all_requests", []);
      setRequests(all.filter(r => r.status === "بانتظار المراجعة"));
    };
    load();
  }, [isConnected]);

  const updateStatus = async (id, status) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updated = { ...req, status, decidedAt: new Date().toISOString(), decidedBy: emp.name };
    if (isConnected) await FirebaseAPI.saveRequest(updated);
    const notif = { id:Date.now(), type:status==="موافق عليها"?"موافقة":"رفض", title:status==="موافق عليها"?"✅ تمت الموافقة":"❌ تم الرفض", body:`${req.type} — ${req.days} يوم`, timestamp:new Date().toISOString(), read:false };
    if (isConnected) await FirebaseAPI.saveNotification(req.empId, notif);
    setRequests(requests.filter(r => r.id !== id));
    showToast(`✅ تم ${status==="موافق عليها"?"قبول":"رفض"}`);
  };

  return (<div><h3 className="font-bold text-lg mb-4">الطلبات المعلقة ({requests.length})</h3>
  {requests.length===0?<div className="bg-white rounded-2xl p-8 text-center"><CheckCircle size={40} className="mx-auto text-slate-300"/><p>لا توجد طلبات</p></div>:
  requests.map(r=>(<div key={r.id} className="bg-white rounded-2xl p-4 border mb-3"><div className="flex justify-between"><div><p className="font-bold">{r.empName}</p><p className="text-sm">{r.type} — {r.days} يوم</p><p className="text-xs text-slate-400">{r.purpose}</p></div>
  <div className="flex gap-2"><button onClick={()=>updateStatus(r.id,"موافق عليها")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">قبول</button><button onClick={()=>updateStatus(r.id,"مرفوضة")} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs">رفض</button></div></div></div>))}
  {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-5 py-3 rounded-2xl"><CheckCircle size={14} className="inline ml-2"/>{toast}</div>}</div>);
}

// ========== الإشعارات ==========
function NotificationsPage({ emp }) {
  const [notifs, setNotifs] = useState([]);
  const { isConnected } = useConnectionStatus();

  useEffect(() => {
    const load = async () => {
      const data = isConnected ? await FirebaseAPI.getNotifications(emp.id) : storage.get(`notifications_${emp.id}`, []);
      setNotifs(data);
    };
    load();
  }, [emp.id, isConnected]);

  const markRead = async (id) => {
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifs(updated);
    const n = notifs.find(n => n.id === id);
    if (n && isConnected) await FirebaseAPI.saveNotification(emp.id, { ...n, read: true });
    storage.set(`notifications_${emp.id}`, updated);
  };

  return (<div><h3 className="font-bold text-lg mb-4">الإشعارات</h3>
  {notifs.length===0?<div className="bg-white rounded-2xl p-8 text-center"><Bell size={40} className="mx-auto text-slate-300"/><p>لا توجد إشعارات</p></div>:
  notifs.map(n=>(<div key={n.id} onClick={()=>markRead(n.id)} className={`bg-white rounded-2xl p-4 border mb-3 cursor-pointer ${n.read?"opacity-70":"border-blue-200 bg-blue-50/30"}`}>
    <div className="flex gap-3"><div className={`p-2 rounded-xl ${n.type==="موافقة"?"bg-emerald-100":"bg-red-100"}`}>{n.type==="موافقة"?<ThumbsUp size={16}/>:<ThumbsDown size={16}/>}</div>
    <div><p className="font-bold">{n.title}</p><p className="text-sm">{n.body}</p><p className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleString()}</p></div>
    {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"/>}</div>
  </div>))}</div>);
}

// ========== الحضور ==========
function AttendanceSystem({ emp, isAdmin, allEmployees }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selEmp, setSelEmp] = useState(isAdmin ? null : emp.id);
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0,10));
  const [records, setRecords] = useState({});
  const [toast, setToast] = useState("");
  const { isConnected } = useConnectionStatus();
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const daysInMonth = new Date(year, month+1, 0).getDate();

  useEffect(() => {
    const load = async () => {
      const target = selEmp || emp.id;
      const data = isConnected ? await FirebaseAPI.getAttendance(target) : storage.get(`attendance_${target}`, {});
      setRecords(data);
    };
    load();
  }, [selEmp, emp.id, isConnected]);

  const checkIn = async () => {
    const time = new Date().toLocaleTimeString();
    const updated = { ...records, [selectedDate]: { ...records[selectedDate], checkIn: time, status: "حاضر" } };
    setRecords(updated);
    if (isConnected) await FirebaseAPI.saveAttendance(emp.id, selectedDate, updated[selectedDate]);
    storage.set(`attendance_${emp.id}`, updated);
    setToast("✅ تم تسجيل الدخول");
    setTimeout(()=>setToast(""),2000);
  };

  const checkOut = async () => {
    if (!records[selectedDate]?.checkIn) { setToast("⚠️ سجل الدخول أولاً"); setTimeout(()=>setToast(""),2000); return; }
    const time = new Date().toLocaleTimeString();
    const updated = { ...records, [selectedDate]: { ...records[selectedDate], checkOut: time } };
    setRecords(updated);
    if (isConnected) await FirebaseAPI.saveAttendance(emp.id, selectedDate, updated[selectedDate]);
    storage.set(`attendance_${emp.id}`, updated);
    setToast("✅ تم تسجيل الخروج");
    setTimeout(()=>setToast(""),2000);
  };

  const present = Object.values(records).filter(r => r?.checkIn).length;

  return (<div className="space-y-4">
    <div className="flex gap-2"><select value={month} onChange={e=>setMonth(Number(e.target.value))} className="border rounded-xl px-3 py-2">{months.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
    <select value={year} onChange={e=>setYear(Number(e.target.value))} className="border rounded-xl px-3 py-2">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
    {isAdmin && <select value={selEmp||""} onChange={e=>setSelEmp(Number(e.target.value)||null)} className="border rounded-xl px-3 py-2">{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>}
    <PrintButton targetId="print-attendance"/></div>
    <div className="grid grid-cols-3 gap-3"><div className="bg-emerald-50 p-3 text-center rounded-xl"><p className="text-2xl font-bold">{present}</p><p className="text-xs">حضور</p></div>
    <div className="bg-red-50 p-3 text-center rounded-xl"><p className="text-2xl font-bold">{daysInMonth - present}</p><p className="text-xs">غياب</p></div>
    <div className="bg-blue-50 p-3 text-center rounded-xl"><p className="text-2xl font-bold">{Math.round(present/daysInMonth*100)}%</p><p className="text-xs">نسبة</p></div></div>
    <div className="bg-white rounded-2xl border p-4"><h3 className="font-bold mb-3">تسجيل اليوم</h3>
      <div className="flex gap-4 items-end"><div><label className="text-xs">التاريخ</label><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="border rounded-xl px-3 py-2"/></div>
      <div className="flex gap-2"><button onClick={checkIn} className="px-4 py-2 bg-emerald-600 text-white rounded-xl"><LogIn size={14} className="inline ml-1"/> دخول</button>
      <button onClick={checkOut} className="px-4 py-2 bg-blue-600 text-white rounded-xl"><LogOut size={14} className="inline ml-1"/> خروج</button></div></div>
      {records[selectedDate]?.checkIn && <div className="mt-3 text-sm text-green-600">✓ دخل الساعة {records[selectedDate].checkIn}</div>}
      {records[selectedDate]?.checkOut && <div className="text-sm text-blue-600">✓ خرج الساعة {records[selectedDate].checkOut}</div>}</div>
    <div id="print-attendance" className="bg-white rounded-2xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50"><th>اليوم</th><th>التاريخ</th><th>دخول</th><th>خروج</th><th>الحالة</th></tr></thead>
    <tbody>{Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; const r = records[key]||{};
    return(<tr key={d}><td>{new Date(key).toLocaleDateString("ar-IQ",{weekday:"short"})}</td><td>{d}</td><td>{r.checkIn||"—"}</td><td>{r.checkOut||"—"}</td><td>{r.checkIn?"حاضر":"غائب"}</td></tr>)})}</tbody></table></div></div>
    {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-5 py-3 rounded-2xl">{toast}</div>}
  </div>);
}

// ========== التدريب ==========
function TrainingSystem({ emp, isAdmin }) {
  const [trainings, setTrainings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", type:"تدريب ذاتي", desc:"" });
  const [toast, setToast] = useState("");
  const { isConnected } = useConnectionStatus();

  useEffect(() => {
    const load = async () => {
      const data = isConnected ? await FirebaseAPI.getTrainings(emp.id) : storage.get(`trainings_${emp.id}`, []);
      setTrainings(data);
    };
    load();
  }, [emp.id, isConnected]);

  const addTraining = async () => {
    if (!form.title) return;
    const newT = { ...form, id: Date.now(), status: "مسندة", assignedAt: new Date().toISOString() };
    const updated = [newT, ...trainings];
    setTrainings(updated);
    if (isConnected) await FirebaseAPI.saveTraining(emp.id, newT);
    storage.set(`trainings_${emp.id}`, updated);
    setShowForm(false);
    setToast("✅ تم الإضافة");
    setTimeout(()=>setToast(""),2000);
  };

  const complete = async (id) => {
    const updated = trainings.map(t => t.id === id ? { ...t, status: "مكتملة" } : t);
    setTrainings(updated);
    const t = trainings.find(t => t.id === id);
    if (t && isConnected) await FirebaseAPI.saveTraining(emp.id, { ...t, status: "مكتملة" });
    storage.set(`trainings_${emp.id}`, updated);
    setToast("✅ تم الإكمال");
    setTimeout(()=>setToast(""),2000);
  };

  return (<div className="space-y-4"><div className="flex justify-between"><h3 className="font-bold text-lg">المهام التدريبية</h3>
    {isAdmin && <button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm"><Plus size={13}/> إضافة</button>}
    <PrintButton targetId="print-training"/></div>
    {showForm && isAdmin && (<div className="bg-white rounded-2xl border p-5"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="العنوان" className="w-full border rounded-xl px-3 py-2 mb-3"/>
    <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full border rounded-xl px-3 py-2 mb-3">{TRAINING_TYPES.map(t=><option key={t}>{t}</option>)}</select>
    <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} placeholder="الوصف" className="w-full border rounded-xl px-3 py-2 mb-3"/>
    <div className="flex gap-2"><button onClick={()=>setShowForm(false)} className="flex-1 py-2 border rounded-xl">إلغاء</button><button onClick={addTraining} className="flex-1 py-2 bg-violet-600 text-white rounded-xl">إضافة</button></div></div>)}
    <div id="print-training" className="space-y-3">{trainings.length===0?<div className="bg-white rounded-2xl p-8 text-center"><GraduationCap size={40} className="mx-auto text-slate-300"/><p>لا توجد مهام</p></div>:
    trainings.map(t=>(<div key={t.id} className="bg-white rounded-2xl border p-4"><div className="flex justify-between"><div><span className={`px-2 py-0.5 rounded-full text-[10px] ${t.status==="مكتملة"?"bg-emerald-100":"bg-amber-100"}`}>{t.status}</span>
    <p className="font-bold mt-1">{t.title}</p><p className="text-xs text-slate-500">{t.desc}</p></div>
    {isAdmin && t.status!=="مكتملة" && <button onClick={()=>complete(t.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl"><CheckCircle size={12}/> إكمال</button>}</div></div>))}</div>
    {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-5 py-3 rounded-2xl">{toast}</div>}
  </div>);
}

// ========== جرد المخزن ==========
function InventorySystem() {
  const [items, setItems] = useState(() => storage.get("inventory_items", [
    { id:1, code:"INV-001", name:"مقاومة متغيرة", category:"أجهزة قياس", qty:5, condition:"جيد", location:"الرف A1" },
    { id:2, code:"INV-002", name:"مولد ذبذبات", category:"أجهزة قياس", qty:2, condition:"جيد", location:"الرف A2" },
  ]));
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const filtered = items.filter(i => i.name.includes(search) || i.code.includes(search));

  const save = () => {
    if (!form.code || !form.name) return;
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false);
    setToast("✅ تم الحفظ");
    setTimeout(()=>setToast(""),2000);
  };

  return (<div className="space-y-4"><div className="flex gap-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="flex-1 border rounded-xl px-3 py-2"/>
    <button onClick={()=>{setAdding(true); setForm({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"" });}} className="px-4 py-2 bg-blue-600 text-white rounded-xl"><Plus size={13}/> إضافة</button>
    <PrintButton targetId="print-inventory"/></div>
    {(adding || editId) && (<div className="bg-white rounded-2xl border p-5"><div className="grid grid-cols-2 gap-3"><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="الرمز" className="border rounded-xl px-3 py-2"/>
    <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم" className="border rounded-xl px-3 py-2"/>
    <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="border rounded-xl px-3 py-2"><option>أجهزة قياس</option><option>أجهزة معايرة</option><option>عدد يدوية</option></select>
    <input type="number" value={form.qty} onChange={e=>setForm({...form,qty:Number(e.target.value)})} className="border rounded-xl px-3 py-2"/>
    <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="border rounded-xl px-3 py-2">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select>
    <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="الموقع" className="border rounded-xl px-3 py-2"/></div>
    <div className="flex gap-2 mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="flex-1 py-2 border rounded-xl">إلغاء</button><button onClick={save} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">حفظ</button></div></div>)}
    <div id="print-inventory" className="bg-white rounded-2xl border overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-slate-50"><th>الرمز</th><th>الاسم</th><th>الفئة</th><th>الكمية</th><th>الحالة</th><th>الموقع</th><th></th></table></thead>
    <tbody>{filtered.map(it=>(<tr key={it.id}><td>{it.code}</td><td>{it.name}</td><td>{it.category}</td><td>{it.qty}</td><td>{it.condition}</td><td>{it.location}</td>
    <td><button onClick={()=>{setEditId(it.id); setForm(it);}} className="text-blue-500"><Edit3 size={14}/></button></td></tr>))}</tbody></table></div></div>
    {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-5 py-3 rounded-2xl">{toast}</div>}
  </div>);
}

// ========== جرد الأثاث ==========
function FurnitureInventory() {
  const [items, setItems] = useState(() => storage.get("furniture_items", [
    { id:1, code:"FURN-001", name:"منضدة كتابة", category:"أثاث مكتبي", qty:5, condition:"جيد", location:"المكتب الرئيسي" },
  ]));
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const filtered = items.filter(i => i.name.includes(search) || i.code.includes(search));

  const save = () => {
    if (!form.code || !form.name) return;
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false);
    setToast("✅ تم الحفظ");
    setTimeout(()=>setToast(""),2000);
  };

  return (<div className="space-y-4"><div className="flex gap-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="flex-1 border rounded-xl px-3 py-2"/>
    <button onClick={()=>{setAdding(true); setForm({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"" });}} className="px-4 py-2 bg-violet-600 text-white rounded-xl"><Plus size={13}/> إضافة</button>
    <PrintButton targetId="print-furniture"/></div>
    {(adding || editId) && (<div className="bg-white rounded-2xl border p-5"><div className="grid grid-cols-2 gap-3"><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="الرمز" className="border rounded-xl px-3 py-2"/>
    <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم" className="border rounded-xl px-3 py-2"/>
    <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="border rounded-xl px-3 py-2">{FURNITURE_CATS.map(c=><option key={c}>{c}</option>)}</select>
    <input type="number" value={form.qty} onChange={e=>setForm({...form,qty:Number(e.target.value)})} className="border rounded-xl px-3 py-2"/>
    <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="border rounded-xl px-3 py-2">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select>
    <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="الموقع" className="border rounded-xl px-3 py-2"/></div>
    <div className="flex gap-2 mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="flex-1 py-2 border rounded-xl">إلغاء</button><button onClick={save} className="flex-1 py-2 bg-violet-600 text-white rounded-xl">حفظ</button></div></div>)}
    <div id="print-furniture" className="bg-white rounded-2xl border overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-slate-50"><th>الرمز</th><th>الاسم</th><th>الفئة</th><th>الكمية</th><th>الحالة</th><th>الموقع</th><th></th></tr></thead>
    <tbody>{filtered.map(it=>(<tr key={it.id}><td>{it.code}</td><td>{it.name}</td><td>{it.category}</td><td>{it.qty}</td><td>{it.condition}</td><td>{it.location}</td>
    <td><button onClick={()=>{setEditId(it.id); setForm(it);}} className="text-blue-500"><Edit3 size={14}/></button></td></tr>))}</tbody></table></div></div>
    {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-5 py-3 rounded-2xl">{toast}</div>}
  </div>);
}

// ========== إدارة الموظفين ==========
function EmployeeManager({ employees, setEmployees }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي" });
  const [adding, setAdding] = useState(false);
  const filtered = employees.filter(e => e.name.includes(search) || e.jobNum.includes(search));
  const save = () => {
    if (!form.name || !form.jobNum) return;
    if (adding) setEmployees([...employees, { ...form, id: Date.now(), password:"1000" }]);
    else setEmployees(employees.map(e => e.id===editId ? form : e));
    setAdding(false); setEditId(null);
  };
  return (<div className="space-y-4"><div className="flex gap-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="flex-1 border rounded-xl px-3 py-2"/>
    <button onClick={()=>{setAdding(true); setForm({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي" });}} className="px-4 py-2 bg-blue-600 text-white rounded-xl"><Plus size={14}/> إضافة</button></div>
    {(adding||editId) && (<div className="bg-white rounded-2xl border p-5"><div className="grid grid-cols-2 gap-3"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم" className="border rounded-xl px-3 py-2"/>
    <input value={form.jobNum} onChange={e=>setForm({...form,jobNum:e.target.value})} placeholder="الرقم" className="border rounded-xl px-3 py-2"/>
    <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="المسمى" className="border rounded-xl px-3 py-2"/>
    <select value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} className="border rounded-xl px-3 py-2"><option>قسم السيطرة والنظم</option><option>شعبة مستودع الفاو</option><option>شعبة المرافئ</option></select>
    <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} className="border rounded-xl px-3 py-2"><option>صباحي</option><option>مناوبة</option></select></div>
    <div className="flex gap-2 mt-4"><button onClick={()=>{setAdding(false);setEditId(null);}} className="flex-1 py-2 border rounded-xl">إلغاء</button><button onClick={save} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">حفظ</button></div></div>)}
    <div className="bg-white rounded-2xl border overflow-hidden"><table className="w-full text-sm"><thead><tr><th>الاسم</th><th>الرقم</th><th>المسمى</th><th>القسم</th><th></th></tr></thead>
    <tbody>{filtered.map(e=><tr key={e.id}><td>{e.name}</td><td>{e.jobNum}</td><td>{e.title}</td><td>{e.dept}</td><td><button onClick={()=>{setEditId(e.id); setForm(e);}}><Edit3 size={14}/></button></td></tr>)}</tbody></table></div></div>);
}

// ========== إحصائيات ==========
function StatsPage({ employees }) {
  return (<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white"><Users size={28}/><p className="text-3xl font-bold">{employees.length}</p><p className="text-sm">الموظفين</p></div>
    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white"><Award size={28}/><p className="text-3xl font-bold">{employees.filter(e=>e.role==="admin").length}</p><p className="text-sm">مشرفين</p></div>
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white"><Clock size={28}/><p className="text-3xl font-bold">{employees.filter(e=>e.shift==="مناوبة").length}</p><p className="text-sm">مناوبين</p></div>
    <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl p-5 text-white"><Calendar size={28}/><p className="text-3xl font-bold">{employees.filter(e=>e.shift==="صباحي").length}</p><p className="text-sm">صباحيين</p></div>
  </div>);
}

// ========== سجل التعديلات ==========
function AuditLogPage() {
  const [logs, setLogs] = useState(() => storage.get("audit_log", []));
  return (<div className="bg-white rounded-2xl border overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-slate-50"><th>العملية</th><th>التفاصيل</th><th>بواسطة</th><th>التاريخ</th></tr></thead>
  <tbody>{logs.length===0?<tr><td colSpan={4} className="text-center py-8">لا توجد سجلات</td></tr>:
  logs.slice(0,50).map(l=><tr key={l.id}><td>{l.action}</td><td>{l.details}</td><td>{l.by}</td><td>{new Date(l.at).toLocaleString()}</td></tr>)}</tbody></table></div>);
}

// ========== اللوحة الرئيسية ==========
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const [employees, setEmployees] = useState(ACCOUNTS);
  const [allRequests, setAllRequests] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isConnected } = useConnectionStatus();
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004";
  const pendingCount = allRequests.filter(r => r.status === "بانتظار المراجعة").length;

  useEffect(() => {
    const load = async () => {
      if (isConnected) {
        const reqs = await FirebaseAPI.getAllRequests();
        setAllRequests(reqs);
      } else {
        setAllRequests(storage.get("all_requests", []));
      }
    };
    load();
  }, [isConnected]);

  useEffect(() => {
    const needsChange = sessionStorage.getItem("force_password_change");
    if (needsChange) { sessionStorage.removeItem("force_password_change"); setTimeout(() => { if(window.confirm("🔐 يرجى تغيير كلمة المرور")) setView("changepass"); }, 500); }
  }, []);

  const handleSync = async () => {
    if (!isConnected) { alert("لا يوجد اتصال"); return; }
    setIsSyncing(true);
    const reqs = await FirebaseAPI.getAllRequests();
    setAllRequests(reqs);
    storage.set("all_requests", reqs);
    setIsSyncing(false);
    alert("✅ تمت المزامنة");
  };

  const menuItems = [
    { id: "home", label: "الرئيسية", icon: <Home size={18}/> },
    { id: "requests", label: "الطلبات", icon: <FileText size={18}/> },
    { id: "attendance", label: "الحضور", icon: <Calendar size={18}/> },
    { id: "training", label: "التدريب", icon: <GraduationCap size={18}/> },
    { id: "inventory", label: "المخزن", icon: <Package size={18}/> },
    { id: "furniture", label: "الأثاث", icon: <ClipboardList size={18}/> },
    { id: "notifications", label: "الإشعارات", icon: <Bell size={18}/> },
    { id: "stats", label: "الإحصائيات", icon: <BarChart size={18}/> },
    { id: "audit", label: "سجل التعديلات", icon: <ClipboardList size={18}/> },
    { id: "changepass", label: "تغيير كلمة المرور", icon: <Shield size={18}/> },
  ];
  if (isAdmin) {
    menuItems.unshift({ id: "approvals", label: "الموافقات", icon: <ThumbsUp size={18}/>, badge: pendingCount });
    menuItems.unshift({ id: "employees", label: "الموظفين", icon: <Users size={18}/> });
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 flex-wrap">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-sm">BOC</span></div>
        <div><h1 className="font-bold text-slate-800">شركة نفط البصرة</h1><p className="text-xs text-slate-500">شعبة مستودع الفاو</p></div></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">{isConnected ? <><Wifi size={12} className="text-emerald-500"/><span>متصل</span></> : <><WifiOff size={12} className="text-amber-500"/><span>غير متصل</span></>}</div>
          {isAdmin && isConnected && <SyncButton onSync={handleSync} isSyncing={isSyncing} />}
          <div><p className="text-sm font-bold">{emp.name}</p><p className="text-xs text-slate-500">{emp.title}</p></div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row">
        <aside className="md:w-64 bg-white border-l min-h-screen p-4"><nav className="space-y-1">{menuItems.map(item => (<button key={item.id} onClick={()=>setView(item.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold ${view===item.id?"bg-blue-50 text-blue-700":"text-slate-600 hover:bg-slate-50"}`}>
          <span className="flex items-center gap-3">{item.icon}{item.label}</span>{item.badge>0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{item.badge}</span>}
        </button>))}</nav>
        <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs"><p className="font-bold">ℹ️ النظام</p><p>✓ مزامنة سحابية</p><p>✓ يعمل دون اتصال</p></div></aside>
        <main className="flex-1 p-6">
          {view==="home" && <div className="bg-white rounded-2xl p-8"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center"><User size={28} className="text-white"/></div><div><h2 className="text-xl font-bold">مرحباً، {emp.name}</h2><p className="text-slate-500">تم تسجيل الدخول بنجاح</p></div></div>
          <div className="grid grid-cols-2 gap-4 mt-6"><div className="bg-emerald-50 border rounded-xl p-4"><CheckCircle className="text-emerald-600"/><p className="font-bold mt-2">✓ النظام يعمل</p>{isConnected && <p className="text-xs text-emerald-600">متصل بالسحابة</p>}</div>
          <div className="bg-blue-50 border rounded-xl p-4"><Shield className="text-blue-600"/><p className="font-bold mt-2">✓ آمن ومشفر</p><p className="text-xs text-blue-600">بياناتك متزامنة</p></div></div></div>}
          {view==="requests" && <RequestsPage emp={emp} />}
          {view==="approvals" && isAdmin && <ApprovalsPage emp={emp} />}
          {view==="notifications" && <NotificationsPage emp={emp} />}
          {view==="attendance" && <AttendanceSystem emp={emp} isAdmin={isAdmin} allEmployees={employees} />}
          {view==="training" && <TrainingSystem emp={emp} isAdmin={isAdmin} />}
          {view==="inventory" && <InventorySystem />}
          {view==="furniture" && <FurnitureInventory />}
          {view==="employees" && isAdmin && <EmployeeManager employees={employees} setEmployees={setEmployees} />}
          {view==="stats" && <StatsPage employees={employees} />}
          {view==="audit" && <AuditLogPage />}
          {view==="changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  return user ? <Dashboard emp={user} onLogout={()=>{sessionStorage.clear(); setUser(null);}} /> : <LoginScreen onLogin={setUser} />;
}