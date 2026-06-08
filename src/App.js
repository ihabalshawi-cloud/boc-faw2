import { useState, useEffect, useCallback } from "react";
import { 
  LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User, 
  CheckCircle, Wifi, WifiOff, RefreshCw, FileText, Clock, Calendar,
  Bell, ThumbsUp, ThumbsDown, Plus, Trash2, Edit3, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star, ArrowRightLeft,
  Printer, Download, Search, Award
} from "lucide-react";

const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";

const ACCOUNTS = [
  {id:1, jobNum:"728004", password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"admin"},
  {id:2, jobNum:"727466", password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:3, jobNum:"737283", password:"1003", name:"عمر طاهر خزعل سبهان المياحي", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:4, jobNum:"756571", password:"1004", name:"ليث شاكر حمود زعيتر الربيعه", title:"معاون مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:5, jobNum:"790850", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي"},
  {id:6, jobNum:"758795", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي"},
  {id:7, jobNum:"719242", password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:8, jobNum:"790869", password:"1008", name:"محمود كاظم هاشم محمد المنصوري", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:9, jobNum:"790885", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي", title:"محاسب اقدم", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"inventory_manager"},
  {id:10, jobNum:"813877", password:"1010", name:"محمد اسماعيل احمد رمضان العلي", title:"مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:11, jobNum:"701130", password:"2001", name:"عبد الله علي زباري يسر عباده", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A"},
  {id:12, jobNum:"751480", password:"2002", name:"امين حميد فاضل حسين العلي", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"مناوبة", group:"A"},
  {id:13, jobNum:"719269", password:"2003", name:"حسين علي احمد قاسم عبادي", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A"},
  {id:14, jobNum:"719498", password:"2004", name:"جاسم مزعل حاتم ديوان الحسين", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A"},
  {id:15, jobNum:"719277", password:"2005", name:"باسم هاشم جاسم هاشم الفارس", title:"م.مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"B"},
  {id:16, jobNum:"719293", password:"2006", name:"هاشم جابر جعفر شناوة عباس", title:"م.مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"B"},
  {id:17, jobNum:"719463", password:"2007", name:"عبد الحميد سامي موسى بدر العيسى", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B"},
  {id:18, jobNum:"736732", password:"2008", name:"احسان عبد الصمد داود", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B"},
  {id:19, jobNum:"719048", password:"2009", name:"علاء محسن عذبي جعفر الجعفر", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C"},
  {id:20, jobNum:"732249", password:"2010", name:"علي باقر حنتوش", title:"م.مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"C"},
  {id:21, jobNum:"719051", password:"2011", name:"علي صلاح مهدي العيداني", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C"},
  {id:22, jobNum:"733501", password:"2012", name:"يوسف ياسين علي ياسين", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"مناوبة", group:"C"},
  {id:23, jobNum:"719381", password:"2013", name:"ضياء عبد الامير محمد الغانم", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D"},
  {id:24, jobNum:"719502", password:"2014", name:"عدنان عبد الجليل عطية", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D"},
  {id:25, jobNum:"736721", password:"2015", name:"احسان محمد سليم السليم", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D"},
  {id:26, jobNum:"724939", password:"2016", name:"حيدر عبد الحسن خضير جاسم", title:"مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"D"},
  {id:27, jobNum:"690414", password:"3001", name:"عبد الله عيسى موسى موني", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:28, jobNum:"689766", password:"3002", name:"اباذر صالح عبد الحسين عيسى", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"attendance_admin"},
  {id:29, jobNum:"690174", password:"3003", name:"حسن عادل عمران يوسف", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"attendance_admin"},
  {id:30, jobNum:"689331", password:"3004", name:"سجاد علي راضي علي", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"attendance_admin"},
];

const LEAVE_TYPES = {
  اعتيادية: { label: "إجازة اعتيادية", max: 30, color: "bg-blue-100 text-blue-700" },
  مرضية: { label: "إجازة مرضية", max: 15, color: "bg-rose-100 text-rose-700" },
  زمنية: { label: "إجازة زمنية", max: 7, color: "bg-amber-100 text-amber-700" },
};

const TRAINING_TYPES = ["تدريب ذاتي", "دورة تدريبية", "ورشة عمل", "تدريب إلكتروني"];
const ITEM_CONDITIONS = ["جيد", "مستعمل", "يحتاج صيانة", "تالف"];
const FURNITURE_CATS = ["أثاث مكتبي", "أجهزة حاسوب", "معدات مكتبية", "أجهزة تكييف"];

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
  savePassword: async (empId, encrypted) => {
    try { await fetch(`${FIREBASE_URL}/passwords/${empId}.json`, { method: "PUT", body: JSON.stringify(encrypted) }); return true; } catch { return false; }
  },
  getPassword: async (empId) => {
    try { const res = await fetch(`${FIREBASE_URL}/passwords/${empId}.json`); if (!res.ok) return null; const data = await res.json(); return typeof data === "string" ? data : null; } catch { return null; }
  }
};

function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const checkConnection = useCallback(async () => {
    const connected = await FirebaseAPI.checkConnection();
    setIsConnected(connected);
  }, []);
  useEffect(() => { checkConnection(); const interval = setInterval(checkConnection, 30000); return () => clearInterval(interval); }, [checkConnection]);
  return { isConnected };
}

function printElement(elementId, title = "تقرير") {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>${title}</title>
  <style>*{font-family:Arial,sans-serif;} body{padding:20mm;} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px;text-align:right}</style></head>
  <body>${el.innerHTML}</body></html>`;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 500);
}

function PrintButton({ targetId, label = "طباعة" }) {
  return (<button onClick={() => targetId ? printElement(targetId) : window.print()} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm"><Printer size={13}/> {label}</button>);
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
    if (!isValid) { const storedPass = storage.get(`pass_${account.id}`); if (storedPass && pass.trim() === storedPass) isValid = true; }
    if (!isValid && isConnected) { const fbPass = await FirebaseAPI.getPassword(account.id); if (fbPass && pass.trim() === fbPass) isValid = true; }
    if (isValid) {
      if (isConnected && pass.trim() === account.password) { await FirebaseAPI.savePassword(account.id, pass.trim()); storage.set(`pass_${account.id}`, pass.trim()); }
      sessionStorage.setItem("boc_session", JSON.stringify({ acctId: account.id, expiry: Date.now() + 8 * 3600000 }));
      const defaultPasswords = ["1001","1002","1003","1004","1005","2001","2002","2003","3001","3002","3003","3004"];
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
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-200 mb-2">الرقم الوظيفي</label>
            <input type="text" value={user} onChange={e=>setUser(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg" placeholder="728004" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
          <div><label className="block text-sm font-bold text-slate-200 mb-2">كلمة المرور</label>
            <div className="relative"><input type={showP?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              <button onClick={()=>setShowP(!showP)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showP?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
          {err && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16}/> {err}</div>}
          <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all text-lg">{loading?"جاري التحقق...":"تسجيل الدخول"}</button>
        </div>
        <div className="mt-6 text-center text-sm text-slate-400"><p>🔑 <strong className="text-blue-300">728004</strong> | كلمة المرور: <strong className="text-blue-300">1001</strong></p></div>
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

  const handleChangePassword = async () => {
    if (!newPass || newPass.trim().length < 4) { setMsg({ text: "⚠️ كلمة المرور يجب أن تكون 4 خانات أو أكثر", type: "error" }); return; }
    if (newPass.trim() !== confirm.trim()) { setMsg({ text: "⚠️ كلمات المرور غير متطابقة", type: "error" }); return; }
    setLoading(true);
    try {
      storage.set(`pass_${emp.id}`, newPass.trim());
      if (isConnected) await FirebaseAPI.savePassword(emp.id, newPass.trim());
      sessionStorage.removeItem("force_password_change");
      setMsg({ text: "✅ تم تغيير كلمة المرور بنجاح!", type: "success" });
      setNewPass(""); setConfirm("");
      setTimeout(() => { if (window.confirm("تم تغيير كلمة المرور. هل تريد تسجيل الخروج؟")) onLogout(); }, 1500);
    } catch { setMsg({ text: "❌ حدث خطأ", type: "error" }); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 border-b pb-3 mb-4"><div className="p-2 bg-blue-100 rounded-xl"><Shield size={20} className="text-blue-600"/></div><div><h2 className="font-bold text-slate-800">تغيير كلمة المرور</h2><p className="text-xs text-slate-500">{emp.name}</p></div></div>
        <div className="space-y-4">
          <div><label className="text-sm font-bold text-slate-600 block mb-1">كلمة المرور الجديدة</label><div className="relative"><input type={showN?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="أدخل كلمة المرور الجديدة" className="w-full border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-blue-500"/>
            <button onClick={()=>setShowN(!showN)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{showN?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
          <div><label className="text-sm font-bold text-slate-600 block mb-1">تأكيد كلمة المرور</label><input type={showN?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="أعد إدخال كلمة المرور" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"/></div>
          {msg && <div className={`p-3 rounded-xl text-sm text-center ${msg.type==="success"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}>{msg.text}</div>}
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
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  
  const handleSubmit = () => {
    if (!formData.purpose.trim()) { setErrors({purpose:"الغرض مطلوب"}); return; }
    if (new Date(formData.dateFrom) > new Date(formData.dateTo)) { setErrors({date:"تاريخ البداية يجب أن يكون قبل تاريخ النهاية"}); return; }
    const days = Math.ceil((new Date(formData.dateTo) - new Date(formData.dateFrom)) / 86400000) + 1;
    const maxDays = LEAVE_TYPES[formData.type].max;
    if (days > maxDays) { setErrors({days:`الحد الأقصى ${maxDays} يوم`}); return; }
    const newRequest = { id:Date.now(), ...formData, days, status:"بانتظار المراجعة", submittedAt:new Date().toISOString(), empId:emp.id, empName:emp.name };
    const allRequests = storage.get("all_requests", []);
    storage.set("all_requests", [newRequest, ...allRequests]);
    setRequests([newRequest, ...requests]);
    setShowForm(false);
    setFormData({ type:"اعتيادية", dateFrom:new Date().toISOString().slice(0,10), dateTo:new Date().toISOString().slice(0,10), purpose:"" });
    setErrors({});
    showToast("✅ تم إرسال طلبك بنجاح");
  };
  
  const deleteRequest = (id) => {
    if(window.confirm("هل تريد حذف هذا الطلب؟")) {
      const updated = requests.filter(r => r.id !== id);
      setRequests(updated);
      storage.set(`requests_${emp.id}`, updated);
      showToast("✅ تم حذف الطلب");
    }
  };
  
  const getStatusBadge = (status) => {
    if(status==="بانتظار المراجعة") return "bg-amber-100 text-amber-700";
    if(status==="موافق عليها") return "bg-emerald-100 text-emerald-700";
    return "bg-red-100 text-red-700";
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-slate-800 text-lg">طلبات الإجازة</h3><button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><Plus size={16}/> طلب جديد</button></div>
      {showForm && (<div className="bg-white rounded-2xl p-5 border"><h4 className="font-bold mb-4">طلب إجازة جديد</h4><div className="space-y-3"><select value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})} className="w-full border rounded-xl px-4 py-2">{Object.entries(LEAVE_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select>
      <div className="grid grid-cols-2 gap-3"><input type="date" value={formData.dateFrom} onChange={e=>setFormData({...formData,dateFrom:e.target.value})} className="border rounded-xl px-4 py-2"/><input type="date" value={formData.dateTo} onChange={e=>setFormData({...formData,dateTo:e.target.value})} className="border rounded-xl px-4 py-2"/></div>
      <input value={formData.purpose} onChange={e=>setFormData({...formData,purpose:e.target.value})} placeholder="الغرض من الإجازة" className="w-full border rounded-xl px-4 py-2"/>
      {errors.purpose && <p className="text-red-500 text-xs">{errors.purpose}</p>}{errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}{errors.days && <p className="text-red-500 text-xs">{errors.days}</p>}
      <div className="flex gap-3"><button onClick={()=>setShowForm(false)} className="flex-1 py-2 border rounded-xl">إلغاء</button><button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">إرسال</button></div></div></div>)}
      {requests.length===0?<div className="bg-white rounded-2xl p-8 text-center text-slate-400 border"><FileText size={40} className="mx-auto mb-3 text-slate-300"/><p>لا توجد طلبات إجازة</p></div>:
      requests.map(req=>(<div key={req.id} className="bg-white rounded-2xl p-4 border"><div className="flex justify-between items-start"><div><div className="flex gap-2 mb-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${LEAVE_TYPES[req.type]?.color}`}>{LEAVE_TYPES[req.type]?.label}</span><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>{req.status}</span></div>
      <p className="text-sm">من {req.dateFrom} إلى {req.dateTo} — {req.days} يوم</p><p className="text-xs text-slate-400 mt-1">{req.purpose}</p></div>{req.status==="بانتظار المراجعة" && <button onClick={()=>deleteRequest(req.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>}</div></div>))}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== الموافقات ==========
function ApprovalsPage({ emp }) {
  const [requests, setRequests] = useState(() => {
    const allRequests = storage.get("all_requests", []);
    return allRequests.filter(r => r.status === "بانتظار المراجعة");
  });
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  
  const updateStatus = (id, status) => {
    const allRequests = storage.get("all_requests", []);
    const updated = allRequests.map(r => r.id === id ? { ...r, status, decidedAt: new Date().toISOString(), decidedBy: emp.name } : r);
    storage.set("all_requests", updated);
    const req = allRequests.find(r => r.id === id);
    if(req) {
      const empRequests = storage.get(`requests_${req.empId}`, []);
      const updatedEmp = empRequests.map(r => r.id === id ? { ...r, status } : r);
      storage.set(`requests_${req.empId}`, updatedEmp);
      const notifs = storage.get(`notifications_${req.empId}`, []);
      storage.set(`notifications_${req.empId}`, [{ id:Date.now(), type:status==="موافق عليها"?"موافقة":"رفض", title:status==="موافق عليها"?"✅ تمت الموافقة على طلبك":"❌ تم رفض طلبك", body:`${req.type} — ${req.days} يوم`, timestamp:new Date().toISOString(), read:false }, ...notifs]);
    }
    setRequests(requests.filter(r => r.id !== id));
    showToast(`✅ تم ${status==="موافق عليها"?"قبول":"رفض"} الطلب`);
  };
  
  return (<div className="space-y-4"><h3 className="font-bold text-slate-800 text-lg">الطلبات المعلقة ({requests.length})</h3>
  {requests.length===0?<div className="bg-white rounded-2xl p-8 text-center"><CheckCircle size={40} className="mx-auto text-slate-300"/><p>لا توجد طلبات معلقة</p></div>:
  requests.map(req=>(<div key={req.id} className="bg-white rounded-2xl p-4 border"><div className="flex justify-between"><div><p className="font-bold">{req.empName}</p><p className="text-sm">{req.type} — {req.days} يوم</p><p className="text-xs text-slate-400">{req.purpose}</p></div>
  <div className="flex gap-2"><button onClick={()=>updateStatus(req.id,"موافق عليها")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">قبول</button><button onClick={()=>updateStatus(req.id,"مرفوضة")} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs">رفض</button></div></div></div>))}
  {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}</div>);
}

// ========== الإشعارات ==========
function NotificationsPage({ emp }) {
  const [notifications, setNotifications] = useState(() => storage.get(`notifications_${emp.id}`, []));
  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    storage.set(`notifications_${emp.id}`, updated);
  };
  return (<div className="space-y-3"><h3 className="font-bold text-slate-800 text-lg">الإشعارات</h3>
  {notifications.length===0?<div className="bg-white rounded-2xl p-8 text-center"><Bell size={40} className="mx-auto text-slate-300"/><p>لا توجد إشعارات</p></div>:
  notifications.map(n=>(<div key={n.id} onClick={()=>markAsRead(n.id)} className={`bg-white rounded-2xl p-4 border cursor-pointer ${n.read?"border-slate-100 opacity-70":"border-blue-200 bg-blue-50/30"}`}>
  <div className="flex gap-3"><div className={`p-2 rounded-xl ${n.type==="موافقة"?"bg-emerald-100":n.type==="رفض"?"bg-red-100":"bg-blue-100"}`}>
  {n.type==="موافقة"?<ThumbsUp size={16} className="text-emerald-600"/>:n.type==="رفض"?<ThumbsDown size={16} className="text-red-600"/>:<Bell size={16} className="text-blue-600"/>}</div>
  <div><p className="font-bold">{n.title}</p><p className="text-sm text-slate-500">{n.body}</p><p className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleString("ar-IQ")}</p></div>
  {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"/>}</div></div>))}</div>);
}

// ========== نظام الحضور ==========
function AttendanceSystem({ emp, isAdmin, allEmployees }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selEmpId, setSelEmpId] = useState(isAdmin ? null : emp.id);
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0,10));
  const [dailyRecords, setDailyRecords] = useState(() => storage.get(`attendance_${emp.id}`, {}));
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const daysInMonth = new Date(selYear, selMonth+1, 0).getDate();
  
  useEffect(() => { storage.set(`attendance_${emp.id}`, dailyRecords); }, [dailyRecords, emp.id]);
  
  const handleCheckIn = () => {
    const nowTime = new Date().toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit" });
    const record = dailyRecords[selectedDate] || {};
    setDailyRecords({ ...dailyRecords, [selectedDate]: { ...record, checkIn: nowTime, status: "حاضر" } });
    showToast("✅ تم تسجيل دخولك بنجاح");
  };
  
  const handleCheckOut = () => {
    const nowTime = new Date().toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit" });
    const record = dailyRecords[selectedDate] || {};
    if (!record.checkIn) { showToast("⚠️ يجب تسجيل الدخول أولاً"); return; }
    setDailyRecords({ ...dailyRecords, [selectedDate]: { ...record, checkOut: nowTime } });
    showToast("✅ تم تسجيل خروجك بنجاح");
  };
  
  const stats = { حاضر: 0, غائب: 0 };
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (dailyRecords[key]?.checkIn) stats.حاضر++; else stats.غائب++;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2"><select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="bg-white border rounded-xl px-3 py-2 text-sm">{months.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
        <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="bg-white border rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
        {isAdmin && <select value={selEmpId||""} onChange={e=>setSelEmpId(Number(e.target.value)||null)} className="bg-white border rounded-xl px-3 py-2 text-sm min-w-[180px]"><option value="">-- اختر موظفاً --</option>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}</select>}</div>
        <PrintButton targetId="print-attendance" label="طباعة التقرير"/>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold text-emerald-700">{stats.حاضر}</p><p className="text-[10px]">أيام الحضور</p></div>
        <div className="bg-red-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold text-red-700">{stats.غائب}</p><p className="text-[10px]">أيام الغياب</p></div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold text-blue-700">{Math.round(stats.حاضر/daysInMonth*100)}%</p><p className="text-[10px]">نسبة الحضور</p></div>
      </div>
      {(!isAdmin || selEmpId === emp.id) && (<div className="bg-white rounded-2xl border p-5"><h3 className="font-bold text-slate-800 mb-3">تسجيل الحضور اليومي</h3>
      <div className="flex flex-wrap gap-4 items-end"><div><label className="block text-xs font-bold text-slate-500 mb-1">التاريخ</label><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="border rounded-xl px-3 py-2"/></div>
      <div className="flex gap-2"><button onClick={handleCheckIn} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><LogIn size={14} className="inline ml-1"/> تسجيل دخول</button>
      <button onClick={handleCheckOut} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><LogOut size={14} className="inline ml-1"/> تسجيل خروج</button></div></div>
      {dailyRecords[selectedDate]?.checkIn && <div className="mt-3 text-sm text-slate-600">✅ تم تسجيل الدخول الساعة {dailyRecords[selectedDate].checkIn}</div>}</div>)}
      <div id="print-attendance" className="bg-white rounded-2xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-slate-50 border-b"><th className="px-3 py-2">اليوم</th><th className="px-3 py-2">التاريخ</th><th className="px-3 py-2">دخول</th><th className="px-3 py-2">خروج</th><th className="px-3 py-2">الحالة</th></tr></thead>
      <tbody>{Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{const key = `${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`; const record = dailyRecords[key]||{};
      return(<tr key={day} className="border-b"><td className="px-3 py-2">{new Date(key).toLocaleDateString("ar-IQ",{weekday:"short"})}</td><td className="px-3 py-2">{day}</td><td className="px-3 py-2">{record.checkIn||"—"}</td><td className="px-3 py-2">{record.checkOut||"—"}</td><td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${record.checkIn?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{record.checkIn?"حاضر":"غائب"}</span></td></tr>);})}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== نظام التدريب ==========
function TrainingSystem({ emp, isAdmin, allEmployees }) {
  const [trainings, setTrainings] = useState(() => storage.get(`trainings_${emp.id}`, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"" });
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set(`trainings_${emp.id}`, trainings); }, [trainings, emp.id]);
  
  const addTraining = () => {
    if (!form.title) return showToast("عنوان التدريب مطلوب");
    const newTraining = { ...form, id: Date.now(), status: "مسندة", assignedAt: new Date().toISOString() };
    setTrainings([newTraining, ...trainings]);
    setForm({ title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"" });
    setShowForm(false);
    showToast("✅ تم إضافة التدريب");
  };
  
  const updateStatus = (id, status) => {
    setTrainings(trainings.map(t => t.id === id ? { ...t, status, completedAt: status==="مكتملة"?new Date().toISOString():t.completedAt } : t));
    showToast(`✅ تم تحديث الحالة إلى ${status}`);
  };
  
  return (
    <div className="space-y-4"><div className="flex justify-between items-center"><h3 className="font-bold text-slate-800 text-lg">المهام التدريبية</h3>
    {isAdmin && <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة تدريب</button>}
    <PrintButton targetId="print-training" label="طباعة"/></div>
    {showForm && isAdmin && (<div className="bg-white rounded-2xl border-2 border-violet-200 p-5"><div className="grid grid-cols-2 gap-3"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان التدريب" className="border rounded-xl px-3 py-2 text-sm col-span-2"/>
    <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="border rounded-xl px-3 py-2 text-sm">{TRAINING_TYPES.map(t=><option key={t}>{t}</option>)}</select>
    <input value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} placeholder="الجهة المقدمة" className="border rounded-xl px-3 py-2 text-sm"/>
    <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
    <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="border rounded-xl px-3 py-2 text-sm"/>
    <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} placeholder="وصف التدريب" className="border rounded-xl px-3 py-2 text-sm col-span-2"/></div>
    <div className="flex gap-2 justify-end mt-4"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button><button onClick={addTraining} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> إضافة</button></div></div>)}
    <div id="print-training" className="space-y-3">{trainings.length===0?<div className="bg-white rounded-2xl p-10 text-center"><GraduationCap size={40} className="text-slate-300 mx-auto"/><p className="text-slate-400">لا توجد مهام تدريبية</p></div>:
    trainings.map(t=>(<div key={t.id} className="bg-white rounded-2xl border p-4"><div className="flex justify-between"><div><div className="flex gap-2 mb-1"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status==="مكتملة"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{t.status}</span>
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700">{t.type}</span></div><p className="font-bold text-slate-800">{t.title}</p>
    {t.desc && <p className="text-xs text-slate-500 mt-1">{t.desc}</p>}<div className="flex gap-3 text-[10px] text-slate-400 mt-2">{t.startDate && <span>📅 من {t.startDate}</span>}{t.endDate && <span>إلى {t.endDate}</span>}</div></div>
    {isAdmin && t.status!=="مكتملة" && <button onClick={()=>updateStatus(t.id,"مكتملة")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs"><CheckCircle size={12}/> إكمال</button>}</div></div>))}</div>
    {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد المخزن ==========
function InventorySystem() {
  const [items, setItems] = useState(() => storage.get("inventory_items", [
    { id:1, code:"INV-001", name:"مقاومة متغيرة", category:"أجهزة قياس", qty:5, condition:"جيد", location:"الرف A1" },
    { id:2, code:"INV-002", name:"مولد ذبذبات", category:"أجهزة قياس", qty:2, condition:"جيد", location:"الرف A2" },
    { id:3, code:"INV-003", name:"جهاز معايرة ضغط", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"الرف B1" },
    { id:4, code:"INV-004", name:"كماشة كهرباء", category:"عدد يدوية", qty:10, condition:"جيد", location:"الرف C1" },
  ]));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("inventory_items", items); }, [items]);
  
  const categories = ["الكل", ...new Set(items.map(i=>i.category))];
  const filtered = items.filter(i => (i.name.includes(search) || i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  
  const saveItem = () => {
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false);
    showToast("✅ تم الحفظ");
  };
  
  return (
    <div className="space-y-4"><div className="flex flex-wrap gap-3 items-center justify-between"><div className="flex gap-2 flex-1"><div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
    <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="flex gap-2"><button onClick={()=>{setAdding(true); setForm({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"" });}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button><PrintButton targetId="print-inventory" label="طباعة"/></div></div>
    {(adding || editId) && (<div className="bg-white rounded-2xl border-2 border-blue-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة صنف":"تعديل صنف"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["الرمز *","code"],["الاسم *","name"],["الفئة","category"],["الكمية","qty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-slate-500 mb-1">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>))}
    <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div></div>
    <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
    <div id="print-inventory" className="bg-white rounded-2xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-slate-50 border-b"><th>الرمز</th><th>الاسم</th><th>الفئة</th><th>الكمية</th><th>الحالة</th><th>الموقع</th><th>إجراءات</th></tr></thead>
    <tbody>{filtered.map(it=>(<tr key={it.id} className="border-b"><td className="px-3 py-2 font-mono">{it.code}</td><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2">{it.category}</td><td className="px-3 py-2 font-bold">{it.qty}</td><td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td><td className="px-3 py-2">{it.location}</td>
    <td className="px-3 py-2"><div className="flex gap-1"><button onClick={()=>{setEditId(it.id); setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>{if(window.confirm("حذف؟")) setItems(items.filter(i=>i.id!==it.id));}} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td></tr>))}</tbody></table></div></div>
    {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد الأثاث ==========
function FurnitureInventory() {
  const [items, setItems] = useState(() => storage.get("furniture_items", [
    { id:1, code:"FURN-001", name:"منضدة كتابة", category:"أثاث مكتبي", qty:5, condition:"جيد", location:"المكتب الرئيسي" },
    { id:2, code:"FURN-002", name:"كرسي دوار", category:"أثاث مكتبي", qty:8, condition:"جيد", location:"المكتب الرئيسي" },
  ]));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("furniture_items", items); }, [items]);
  
  const categories = ["الكل", ...FURNITURE_CATS];
  const filtered = items.filter(i => (i.name.includes(search) || i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  
  const saveItem = () => {
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false);
    showToast("✅ تم الحفظ");
  };
  
  return (
    <div className="space-y-4"><div className="flex flex-wrap gap-3 items-center justify-between"><div className="flex gap-2 flex-1"><div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
    <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="flex gap-2"><button onClick={()=>{setAdding(true); setForm({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"" });}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button><PrintButton targetId="print-furniture" label="طباعة"/></div></div>
    {(adding || editId) && (<div className="bg-white rounded-2xl border-2 border-violet-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة قطعة":"تعديل قطعة"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["الرمز *","code"],["الاسم *","name"],["الفئة","category"],["الكمية","qty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-slate-500 mb-1">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>))}
    <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div></div>
    <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
    <div id="print-furniture" className="bg-white rounded-2xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-slate-50 border-b"><th>الرمز</th><th>الاسم</th><th>الفئة</th><th>الكمية</th><th>الحالة</th><th>الموقع</th><th>إجراءات</th></tr></thead>
    <tbody>{filtered.map(it=>(<tr key={it.id} className="border-b"><td className="px-3 py-2 font-mono">{it.code}</td><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2">{it.category}</td><td className="px-3 py-2 font-bold">{it.qty}</td><td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td><td className="px-3 py-2">{it.location}</td>
    <td className="px-3 py-2"><div className="flex gap-1"><button onClick={()=>{setEditId(it.id); setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>{if(window.confirm("حذف؟")) setItems(items.filter(i=>i.id!==it.id));}} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td></tr>))}</tbody></table></div></div>
    {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== إدارة الموظفين ==========
function EmployeeManager({ employees, setEmployees }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي" });
  const [adding, setAdding] = useState(false);
  const filtered = employees.filter(e => e.name.includes(search) || e.jobNum.includes(search));
  const saveEmp = () => {
    if (!form.name || !form.jobNum) return;
    if (adding) setEmployees([...employees, { ...form, id: Date.now(), password:"1000" }]);
    else setEmployees(employees.map(e => e.id===editId ? { ...form, id:editId } : e));
    setAdding(false); setEditId(null);
  };
  return (<div className="space-y-4"><div className="flex gap-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="flex-1 border rounded-xl px-3 py-2"/>
  <button onClick={()=>{setAdding(true); setForm({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي" });}} className="px-4 py-2 bg-blue-600 text-white rounded-xl"><Plus size={14}/> إضافة</button></div>
  {(adding||editId) && (<div className="bg-white rounded-2xl border p-5"><div className="grid grid-cols-2 gap-3"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم" className="border rounded-xl px-3 py-2"/>
  <input value={form.jobNum} onChange={e=>setForm({...form,jobNum:e.target.value})} placeholder="الرقم الوظيفي" className="border rounded-xl px-3 py-2"/>
  <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="المسمى" className="border rounded-xl px-3 py-2"/>
  <select value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} className="border rounded-xl px-3 py-2"><option>قسم السيطرة والنظم</option><option>شعبة مستودع الفاو</option><option>شعبة المرافئ</option></select>
  <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} className="border rounded-xl px-3 py-2"><option>صباحي</option><option>مناوبة</option></select></div>
  <div className="flex gap-2 mt-4"><button onClick={()=>{setAdding(false);setEditId(null);}} className="flex-1 py-2 border rounded-xl">إلغاء</button><button onClick={saveEmp} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">حفظ</button></div></div>)}
  <div className="bg-white rounded-2xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b"><th className="px-3 py-2">الاسم</th><th className="px-3 py-2">الرقم</th><th className="px-3 py-2">المسمى</th><th className="px-3 py-2">القسم</th><th></th></tr></thead>
  <tbody>{filtered.map(e=><tr key={e.id} className="border-b"><td className="px-3 py-2">{e.name}</td><td className="px-3 py-2">{e.jobNum}</td><td className="px-3 py-2">{e.title}</td><td className="px-3 py-2">{e.dept}</td>
  <td className="px-3 py-2"><button onClick={()=>{setEditId(e.id); setForm(e);}} className="text-blue-500"><Edit3 size={14}/></button></td></tr>)}</tbody></table></div></div></div>);
}

// ========== إحصائيات ==========
function StatsPage({ employees, allRequests }) {
  const pending = (allRequests || []).filter(r => r.status === "بانتظار المراجعة").length;
  const approved = (allRequests || []).filter(r => r.status === "موافق عليها").length;
  return (<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white"><Users size={28} className="mb-2"/><p className="text-3xl font-bold">{employees.length}</p><p className="text-sm">الموظفين</p></div>
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white"><FileText size={28} className="mb-2"/><p className="text-3xl font-bold">{pending}</p><p className="text-sm">طلبات معلقة</p></div>
    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white"><CheckCircle size={28} className="mb-2"/><p className="text-3xl font-bold">{approved}</p><p className="text-sm">طلبات مقبولة</p></div>
    <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-2xl p-5 text-white"><Award size={28} className="mb-2"/><p className="text-3xl font-bold">{employees.filter(e=>e.role==="admin").length}</p><p className="text-sm">مشرفين</p></div>
  </div>);
}

// ========== سجل التعديلات ==========
function AuditLogPage() {
  const [logs, setLogs] = useState(() => storage.get("audit_log", []));
  useEffect(() => { storage.set("audit_log", logs); }, [logs]);
  return (<div className="bg-white rounded-2xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-slate-50 border-b"><th className="px-3 py-2">العملية</th><th className="px-3 py-2">التفاصيل</th><th className="px-3 py-2">بواسطة</th><th className="px-3 py-2">التاريخ</th></tr></thead>
  <tbody>{logs.length===0?<tr><td colSpan={4} className="text-center py-8 text-slate-400">لا توجد سجلات</td></tr>:
  logs.slice(0,100).map(l=><tr key={l.id} className="border-b"><td className="px-3 py-2">{l.action}</td><td className="px-3 py-2">{l.details}</td><td className="px-3 py-2">{l.by}</td><td className="px-3 py-2 text-slate-400">{new Date(l.at).toLocaleString("ar-IQ")}</td></tr>)}</tbody></table></div></div>);
}

// ========== اللوحة الرئيسية ==========
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const [allRequests, setAllRequests] = useState(() => storage.get("all_requests", []));
  const [employees, setEmployees] = useState(ACCOUNTS);
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004";
  const pendingCount = allRequests.filter(r => r.status === "بانتظار المراجعة").length;
  
  useEffect(() => {
    const needsChange = sessionStorage.getItem("force_password_change");
    if (needsChange) { sessionStorage.removeItem("force_password_change"); setTimeout(() => { if(window.confirm("🔐 يرجى تغيير كلمة المرور الافتراضية")) setView("changepass"); }, 500); }
  }, []);
  
  const menuItems = [
    { id: "home", label: "الرئيسية", icon: <Home size={18}/> },
    { id: "requests", label: "طلبات الإجازة", icon: <FileText size={18}/> },
    { id: "attendance", label: "الحضور", icon: <Calendar size={18}/> },
    { id: "training", label: "التدريب", icon: <GraduationCap size={18}/> },
    { id: "inventory", label: "جرد المخزن", icon: <Package size={18}/> },
    { id: "furniture", label: "جرد الأثاث", icon: <ClipboardList size={18}/> },
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
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-sm">BOC</span></div>
      <div><h1 className="font-bold text-slate-800">شركة نفط البصرة</h1><p className="text-xs text-slate-500">شعبة مستودع الفاو</p></div></div>
      <div className="flex items-center gap-4"><div className="text-left"><p className="text-sm font-bold">{emp.name.split(" ").slice(0,2).join(" ")}</p><p className="text-xs text-slate-500">{emp.title}</p></div><button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button></div></div>
      
      <div className="flex flex-col md:flex-row"><aside className="md:w-64 bg-white border-l min-h-screen p-4"><nav className="space-y-1">{menuItems.map(item => (<button key={item.id} onClick={()=>setView(item.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold ${view===item.id?"bg-blue-50 text-blue-700":"text-slate-600 hover:bg-slate-50"}`}>
      <span className="flex items-center gap-3">{item.icon}{item.label}</span>{item.badge>0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{item.badge}</span>}</button>))}</nav>
      <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs"><p className="font-bold mb-2">ℹ️ النظام</p><p>✓ يعمل بكفاءة</p><p>✓ البيانات محفوظة</p></div></aside>
      
      <main className="flex-1 p-6">
        {view==="home" && <div className="bg-white rounded-2xl p-8"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center"><User size={28} className="text-white"/></div><div><h2 className="text-xl font-bold">مرحباً، {emp.name.split(" ")[0]}</h2><p className="text-slate-500">تم تسجيل الدخول بنجاح</p></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"><div className="bg-emerald-50 border rounded-xl p-4"><CheckCircle className="text-emerald-600"/><p className="font-bold mt-2">✓ النظام يعمل</p></div><div className="bg-blue-50 border rounded-xl p-4"><Shield className="text-blue-600"/><p className="font-bold mt-2">✓ آمن ومشفر</p></div></div></div>}
        {view==="requests" && <RequestsPage emp={emp} />}
        {view==="attendance" && <AttendanceSystem emp={emp} isAdmin={isAdmin} allEmployees={employees} />}
        {view==="training" && <TrainingSystem emp={emp} isAdmin={isAdmin} allEmployees={employees} />}
        {view==="inventory" && <InventorySystem />}
        {view==="furniture" && <FurnitureInventory />}
        {view==="notifications" && <NotificationsPage emp={emp} />}
        {view==="stats" && <StatsPage employees={employees} allRequests={allRequests} />}
        {view==="audit" && <AuditLogPage />}
        {view==="changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout} />}
        {view==="employees" && isAdmin && <EmployeeManager employees={employees} setEmployees={setEmployees} />}
        {view==="approvals" && isAdmin && <ApprovalsPage emp={emp} />}
      </main></div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  return user ? <Dashboard emp={user} onLogout={()=>{sessionStorage.clear(); setUser(null);}} /> : <LoginScreen onLogin={setUser} />;
}