import { useState, useEffect, useCallback } from "react";
import { 
  LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User, 
  CheckCircle, Wifi, WifiOff, RefreshCw, FileText, Clock, Calendar,
  Bell, ThumbsUp, ThumbsDown, Plus, Trash2, Edit3, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Printer, Download, Search, Award,
  TrendingUp, TrendingDown, PieChart, Activity, AlertTriangle, Mail, Send,
  Key, Lock, Unlock, UserCheck, UserCog, Briefcase, Building2
} from "lucide-react";

const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";

// ========== صلاحيات النظام ==========
const ROLES = {
  // صلاحيات المشرف العام (ايهاب الشاوي)
  SUPER_ADMIN: {
    level: 5,
    name: "مشرف عام",
    permissions: {
      employees: { view: true, add: true, edit: true, delete: true, assignRole: true },
      requests: { view: true, approve: true, reject: true, delete: true },
      inventory: { view: true, add: true, edit: true, delete: true, transfer: true },
      furniture: { view: true, add: true, edit: true, delete: true },
      attendance: { view: true, edit: true, export: true },
      training: { view: true, assign: true, evaluate: true },
      reports: { view: true, export: true, print: true },
      settings: { view: true, edit: true },
      audit: { view: true },
      users: { view: true, add: true, edit: true, delete: true, resetPassword: true }
    }
  },
  // صلاحيات المدير الإداري (اباذر)
  ADMIN: {
    level: 4,
    name: "مدير إداري",
    permissions: {
      employees: { view: true, add: false, edit: false, delete: false, assignRole: false },
      requests: { view: true, approve: true, reject: true, delete: false },
      inventory: { view: true, add: false, edit: false, delete: false, transfer: false },
      furniture: { view: true, add: false, edit: false, delete: false },
      attendance: { view: true, edit: true, export: true },
      training: { view: true, assign: false, evaluate: false },
      reports: { view: true, export: true, print: true },
      settings: { view: false, edit: false },
      audit: { view: true },
      users: { view: true, add: false, edit: false, delete: false, resetPassword: false }
    }
  },
  // صلاحيات مدير المخزن
  INVENTORY_MANAGER: {
    level: 3,
    name: "مدير مخزن",
    permissions: {
      employees: { view: true, add: false, edit: false, delete: false, assignRole: false },
      requests: { view: true, approve: false, reject: false, delete: false },
      inventory: { view: true, add: true, edit: true, delete: true, transfer: true },
      furniture: { view: true, add: true, edit: true, delete: true },
      attendance: { view: false, edit: false, export: false },
      training: { view: false, assign: false, evaluate: false },
      reports: { view: true, export: true, print: true },
      settings: { view: false, edit: false },
      audit: { view: false },
      users: { view: false, add: false, edit: false, delete: false, resetPassword: false }
    }
  },
  // صلاحيات منسق التدريب
  TRAINING_COORDINATOR: {
    level: 3,
    name: "منسق تدريب",
    permissions: {
      employees: { view: true, add: false, edit: false, delete: false, assignRole: false },
      requests: { view: false, approve: false, reject: false, delete: false },
      inventory: { view: false, add: false, edit: false, delete: false, transfer: false },
      furniture: { view: false, add: false, edit: false, delete: false },
      attendance: { view: false, edit: false, export: false },
      training: { view: true, assign: true, evaluate: true },
      reports: { view: true, export: true, print: true },
      settings: { view: false, edit: false },
      audit: { view: false },
      users: { view: false, add: false, edit: false, delete: false, resetPassword: false }
    }
  },
  // صلاحيات مشرف الحضور
  ATTENDANCE_ADMIN: {
    level: 2,
    name: "مشرف حضور",
    permissions: {
      employees: { view: true, add: false, edit: false, delete: false, assignRole: false },
      requests: { view: false, approve: false, reject: false, delete: false },
      inventory: { view: false, add: false, edit: false, delete: false, transfer: false },
      furniture: { view: false, add: false, edit: false, delete: false },
      attendance: { view: true, edit: true, export: true },
      training: { view: false, assign: false, evaluate: false },
      reports: { view: true, export: true, print: true },
      settings: { view: false, edit: false },
      audit: { view: false },
      users: { view: false, add: false, edit: false, delete: false, resetPassword: false }
    }
  },
  // صلاحيات الموظف العادي
  EMPLOYEE: {
    level: 1,
    name: "موظف",
    permissions: {
      employees: { view: false, add: false, edit: false, delete: false, assignRole: false },
      requests: { view: true, approve: false, reject: false, delete: true },
      inventory: { view: false, add: false, edit: false, delete: false, transfer: false },
      furniture: { view: false, add: false, edit: false, delete: false },
      attendance: { view: true, edit: true, export: false },
      training: { view: true, assign: false, evaluate: false },
      reports: { view: true, export: false, print: true },
      settings: { view: false, edit: false },
      audit: { view: false },
      users: { view: false, add: false, edit: false, delete: false, resetPassword: false }
    }
  }
};

// ========== الكادر الكامل مع الصلاحيات ==========
const ACCOUNTS = [
  // ========== المشرف العام (Super Admin) - ايهاب الشاوي ==========
  {id:1, jobNum:"728004", password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7801165298", role:"SUPER_ADMIN", email:"admin@boc.iq"},
  
  // ========== المدير الإداري - اباذر صالح ==========
  {id:31, jobNum:"689766", password:"3002", name:"اباذر صالح عبد الحسين عيسى", title:"مدير إداري", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7801446130", role:"ADMIN", email:"abather@boc.iq"},
  
  // ========== مدير المخزن - محمد عبد الكاظم ==========
  {id:9, jobNum:"790885", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي", title:"مدير مخزن", dept:"شعبة مستودع الفاو", shift:"صباحي", edu:"دبلوم", phone:"7808779038", role:"INVENTORY_MANAGER", email:"mohammed@boc.iq"},
  
  // ========== منسق التدريب - علاء محسن ==========
  {id:20, jobNum:"719048", password:"2009", name:"علاء محسن عذبي جعفر الجعفر", title:"منسق تدريب", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"دبلوم", phone:"7803572745", role:"TRAINING_COORDINATOR", email:"alaa@boc.iq"},
  
  // ========== مشرف الحضور - حسن عادل ==========
  {id:32, jobNum:"690174", password:"3003", name:"حسن عادل عمران يوسف", title:"مشرف حضور", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7729488795", role:"ATTENDANCE_ADMIN", email:"hassan@boc.iq"},
  
  // ========== مشرف الحضور - سجاد علي ==========
  {id:33, jobNum:"689331", password:"3004", name:"سجاد علي راضي علي", title:"مشرف حضور", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7703283076", role:"ATTENDANCE_ADMIN", email:"sajjad@boc.iq"},
  
  // ========== باقي الموظفين (صلاحية موظف عادي) ==========
  {id:2, jobNum:"727466", password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7705559125", role:"EMPLOYEE"},
  {id:3, jobNum:"737283", password:"1003", name:"عمر طاهر خزعل سبهان المياحي", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7710872949", role:"EMPLOYEE"},
  {id:4, jobNum:"756571", password:"1004", name:"ليث شاكر حمود زعيتر الربيعه", title:"معاون مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7714991063", role:"EMPLOYEE"},
  {id:5, jobNum:"790850", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي", edu:"دبلوم", phone:"7709043148", role:"EMPLOYEE"},
  {id:6, jobNum:"758795", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي", edu:"دبلوم", phone:"7707315475", role:"EMPLOYEE"},
  {id:7, jobNum:"719242", password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم", phone:"7831644210", role:"EMPLOYEE"},
  {id:8, jobNum:"790869", password:"1008", name:"محمود كاظم هاشم محمد المنصوري", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم", phone:"7703145733", role:"EMPLOYEE"},
  {id:10, jobNum:"813877", password:"1010", name:"محمد اسماعيل احمد رمضان العلي", title:"مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7725549815", role:"EMPLOYEE"},
  {id:11, jobNum:"439193", password:"1011", name:"علي طاهر خزعل سبهان المياحي", title:"حرفي اقدم", dept:"شعبة المرافئ", shift:"صباحي", edu:"ابتدائية", phone:"7705770208", role:"EMPLOYEE"},
  {id:12, jobNum:"701130", password:"2001", name:"عبد الله علي زباري يسر عباده", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"بكالوريوس", phone:"7705706145", role:"EMPLOYEE"},
  {id:13, jobNum:"751480", password:"2002", name:"امين حميد فاضل حسين العلي", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"مناوبة", group:"A", edu:"دبلوم معهد نفط", phone:"7715949652", role:"EMPLOYEE"},
  {id:14, jobNum:"719269", password:"2003", name:"حسين علي احمد قاسم عبادي", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم", phone:"7712679994", role:"EMPLOYEE"},
  {id:15, jobNum:"719498", password:"2004", name:"جاسم مزعل حاتم ديوان الحسين", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم", phone:"7821188777", role:"EMPLOYEE"},
  {id:16, jobNum:"719277", password:"2005", name:"باسم هاشم جاسم هاشم الفارس", title:"م.مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7702792993", role:"EMPLOYEE"},
  {id:17, jobNum:"719293", password:"2006", name:"هاشم جابر جعفر شناوة عباس", title:"م.مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7732166112", role:"EMPLOYEE"},
  {id:18, jobNum:"719463", password:"2007", name:"عبد الحميد سامي موسى بدر العيسى", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7705559870", role:"EMPLOYEE"},
  {id:19, jobNum:"736732", password:"2008", name:"احسان عبد الصمد داود", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7714658958", role:"EMPLOYEE"},
  {id:21, jobNum:"735922", password:"2010", name:"علي طارق ياسين مهودر العيداني", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"بكالوريوس", phone:"7703137777", role:"EMPLOYEE"},
  {id:22, jobNum:"732249", password:"2011", name:"علي باقر حنتوش مليس العلي", title:"م.ر. مبرمجين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"بكالوريوس", phone:"7706072225", role:"EMPLOYEE"},
  {id:23, jobNum:"726508", password:"2012", name:"يوسف عباس ياسين احمد ياسين", title:"مدير فني", dept:"شعبة مستودع الفاو", shift:"مناوبة", group:"C", edu:"دبلوم", phone:"7715498830", role:"EMPLOYEE"},
  {id:24, jobNum:"719129", password:"2013", name:"ضياء بدر حمادي اسماعيل الغانم", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم", phone:"7718695345", role:"EMPLOYEE"},
  {id:25, jobNum:"719099", password:"2014", name:"عدنان جواد كاظم جعفر العطية", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم", phone:"7709048893", role:"EMPLOYEE"},
  {id:26, jobNum:"732834", password:"2015", name:"احسان جواد كاظم حسين السليم", title:"مهندس", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"بكالوريوس", phone:"7705666922", role:"EMPLOYEE"},
  {id:27, jobNum:"724939", password:"2016", name:"حيدر عبد الحسن خضير جاسم", title:"مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"D", edu:"معادل للاعدادية", phone:"7712766100", role:"EMPLOYEE"},
  {id:28, jobNum:"718939", password:"2017", name:"واثق حسين عبد الشيخ حسن المحسن", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم", phone:"7707040209", role:"EMPLOYEE"},
  {id:29, jobNum:"719005", password:"2018", name:"صدام عبد الواحد سلمان عيسى العيسى", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7712443251", role:"EMPLOYEE"},
  {id:30, jobNum:"690414", password:"3001", name:"عبد الله عيسى موسى موني", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7735632535", role:"EMPLOYEE"},
  {id:34, jobNum:"690174", password:"3003", name:"حسن عادل عمران يوسف", title:"مشرف حضور", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7729488795", role:"ATTENDANCE_ADMIN"},
  {id:35, jobNum:"689331", password:"3004", name:"سجاد علي راضي علي", title:"مشرف حضور", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7703283076", role:"ATTENDANCE_ADMIN"},
];

const LEAVE_TYPES = {
  اعتيادية: { label: "إجازة اعتيادية", max: 30, color: "bg-blue-100 text-blue-700" },
  مرضية: { label: "إجازة مرضية", max: 15, color: "bg-rose-100 text-rose-700" },
  زمنية: { label: "إجازة زمنية", max: 7, color: "bg-amber-100 text-amber-700" },
};

const INITIAL_INVENTORY = [
  { id:1, code:"2301280010", name:"مقاومة متغيرة", category:"أجهزة قياس", qty:1, minAlert:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
  { id:2, code:"2301243008", name:"مولد ذبذبات", category:"أجهزة قياس", qty:1, minAlert:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
  { id:3, code:"5869856050", name:"NEEDLE SOLENOID 1/2 TUBE", category:"صمامات", qty:2, minAlert:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
  { id:4, code:"", name:"كيج 60 psi صغير", category:"مقاييس ضغط", qty:25, minAlert:5, condition:"جيد", location:"مخزن الآلات الدقيقة" },
  { id:5, code:"", name:"عكس مختلف الانواع حرف T", category:"قطع توصيل", qty:150, minAlert:20, condition:"جيد", location:"مخزن الآلات الدقيقة" },
];

const storage = {
  get: (key, defaultValue = null) => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; } catch { return defaultValue; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  }
};

// ========== Firebase API ==========
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

function printElement(elementId) {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }
  const html = `<html dir="rtl"><head><meta charset="UTF-8"/><title>تقرير</title>
  <style>body{padding:20mm;font-family:Arial} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px}</style></head>
  <body>${el.innerHTML}</body></html>`;
  const win = window.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  setTimeout(() => win.close(), 1000);
}

function PrintButton({ targetId }) {
  return (<button onClick={() => printElement(targetId)} className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border px-3 py-2 rounded-xl"><Printer size={13}/> طباعة</button>);
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
    let isValid = (pass.trim() === account.password);
    if (!isValid && isConnected) {
      const fbPass = await FirebaseAPI.getPassword(account.id);
      if (fbPass && pass.trim() === fbPass) isValid = true;
    }
    if (isValid) {
      if (isConnected && pass.trim() === account.password) {
        await FirebaseAPI.savePassword(account.id, pass.trim());
      }
      sessionStorage.setItem("boc_session", JSON.stringify({ acctId: account.id, expiry: Date.now() + 8 * 3600000 }));
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
          <p className="text-sm text-slate-300 mt-2">شعبة مستودع الفاو - نظام الإدارة المتكامل</p>
        </div>
        <div className="mb-4 flex items-center justify-center gap-2 text-xs">
          {isConnected ? <><Wifi size={12} className="text-emerald-400"/><span>متصل</span></> : <><WifiOff size={12} className="text-amber-400"/><span>غير متصل</span></>}
        </div>
        <div className="space-y-4">
          <input type="text" value={user} onChange={e=>setUser(e.target.value)} placeholder="الرقم الوظيفي" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          <div className="relative">
            <input type={showP?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="كلمة المرور" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            <button onClick={()=>setShowP(!showP)} className="absolute left-4 top-3 text-slate-400">{showP?<EyeOff size={18}/>:<Eye size={18}/>}</button>
          </div>
          {err && <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-xl">{err}</div>}
          <button onClick={handleLogin} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">{loading?"جاري التحقق...":"تسجيل الدخول"}</button>
        </div>
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>🔑 <strong className="text-blue-300">728004</strong> / <strong className="text-blue-300">1001</strong> (مشرف عام)</p>
          <p className="text-xs mt-1">🔑 <strong>689766</strong> / <strong>3002</strong> (مدير إداري)</p>
        </div>
      </div>
    </div>
  );
}

// ========== تغيير كلمة المرور ==========
function ChangePasswordPage({ emp, onLogout }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();

  const handleChange = async () => {
    if (!newPass || newPass.length < 4) { setMsg("كلمة المرور يجب أن تكون 4 خانات"); return; }
    if (newPass !== confirm) { setMsg("كلمات المرور غير متطابقة"); return; }
    setLoading(true);
    try {
      if (isConnected) await FirebaseAPI.savePassword(emp.id, newPass);
      setMsg("✅ تم تغيير كلمة المرور بنجاح");
      setTimeout(() => onLogout(), 1500);
    } catch { setMsg("❌ حدث خطأ"); }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="font-bold text-xl mb-4">تغيير كلمة المرور</h2>
        <p className="text-sm text-slate-500 mb-4">{emp.name}</p>
        <div className="space-y-3">
          <input type={showN?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="كلمة المرور الجديدة" className="w-full border rounded-xl px-4 py-3"/>
          <input type={showN?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="تأكيد كلمة المرور" className="w-full border rounded-xl px-4 py-3"/>
          <button onClick={()=>setShowN(!showN)} className="text-sm text-blue-500">{showN?"إخفاء":"إظهار"}</button>
          {msg && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-center">{msg}</div>}
          <button onClick={handleChange} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl">{loading?"جاري الحفظ...":"حفظ"}</button>
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
    if (!form.purpose) { setToast("الغرض مطلوب"); setTimeout(()=>setToast(""),2000); return; }
    const days = Math.ceil((new Date(form.dateTo) - new Date(form.dateFrom)) / 86400000) + 1;
    const newReq = { id:Date.now(), ...form, days, status:"بانتظار المراجعة", submittedAt:new Date().toISOString(), empId:emp.id, empName:emp.name };
    if (isConnected) await FirebaseAPI.saveRequest(newReq);
    setRequests([newReq, ...requests]);
    setShowForm(false);
    setToast("✅ تم إرسال طلبك");
    setTimeout(()=>setToast(""),2000);
  };

  const deleteReq = async (id) => {
    if (window.confirm("حذف؟")) {
      if (isConnected) await FirebaseAPI.deleteRequest(id);
      setRequests(requests.filter(r => r.id !== id));
      setToast("✅ تم الحذف");
      setTimeout(()=>setToast(""),2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-xl">طلبات الإجازة</h2>
        <button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-xl"><Plus size={16}/> طلب جديد</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-2xl p-5 border">
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="w-full border rounded-xl p-3 mb-3">
            {Object.entries(LEAVE_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="date" value={form.dateFrom} onChange={e=>setForm({...form,dateFrom:e.target.value})} className="border rounded-xl p-3"/>
            <input type="date" value={form.dateTo} onChange={e=>setForm({...form,dateTo:e.target.value})} className="border rounded-xl p-3"/>
          </div>
          <input value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="الغرض" className="w-full border rounded-xl p-3 mb-3"/>
          <div className="flex gap-3">
            <button onClick={()=>setShowForm(false)} className="flex-1 py-2 border rounded-xl">إلغاء</button>
            <button onClick={handleSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">إرسال</button>
          </div>
        </div>
      )}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400"><FileText size={40} className="mx-auto"/><p>لا توجد طلبات</p></div>
      ) : (
        requests.map(r => (
          <div key={r.id} className="bg-white rounded-2xl p-4 border">
            <div className="flex justify-between">
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${LEAVE_TYPES[r.type]?.color}`}>{LEAVE_TYPES[r.type]?.label}</span>
                <p className="mt-2">{r.dateFrom} إلى {r.dateTo} — {r.days} يوم</p>
                <p className="text-sm text-slate-500">{r.purpose}</p>
                <p className="text-xs text-slate-400 mt-1">الحالة: {r.status}</p>
              </div>
              {r.status === "بانتظار المراجعة" && (
                <button onClick={()=>deleteReq(r.id)} className="text-red-400"><Trash2 size={18}/></button>
              )}
            </div>
          </div>
        ))
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl">{toast}</div>}
    </div>
  );
}

// ========== الموافقات (للمشرف العام والمدير الإداري) ==========
function ApprovalsPage({ emp, rolePermissions }) {
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState("");
  const { isConnected } = useConnectionStatus();
  const canApprove = rolePermissions?.requests?.approve || false;

  useEffect(() => {
    const load = async () => {
      const all = isConnected ? await FirebaseAPI.getAllRequests() : storage.get("all_requests", []);
      setRequests(all.filter(r => r.status === "بانتظار المراجعة"));
    };
    load();
  }, [isConnected]);

  const updateStatus = async (id, status) => {
    if (!canApprove) { setToast("⚠️ ليس لديك صلاحية للموافقة"); setTimeout(()=>setToast(""),2000); return; }
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updated = { ...req, status, decidedAt: new Date().toISOString(), decidedBy: emp.name };
    if (isConnected) await FirebaseAPI.saveRequest(updated);
    const notif = { id:Date.now(), type:status==="موافق عليها"?"موافقة":"رفض", title:status==="موافق عليها"?"✅ تمت الموافقة":"❌ تم الرفض", body:`${req.type} — ${req.days} يوم`, timestamp:new Date().toISOString(), read:false };
    if (isConnected) await FirebaseAPI.saveNotification(req.empId, notif);
    setRequests(requests.filter(r => r.id !== id));
    setToast(`✅ تم ${status==="موافق عليها"?"قبول":"رفض"}`);
    setTimeout(()=>setToast(""),2000);
  };

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">الطلبات المعلقة ({requests.length})</h2>
      {!canApprove && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <p className="text-amber-800 text-sm">⚠️ ليس لديك صلاحية الموافقة على الطلبات</p>
        </div>
      )}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center"><CheckCircle size={40} className="mx-auto text-slate-300"/><p>لا توجد طلبات</p></div>
      ) : (
        requests.map(r => (
          <div key={r.id} className="bg-white rounded-2xl p-4 border mb-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">{r.empName}</p>
                <p className="text-sm">{r.type} — {r.days} يوم</p>
                <p className="text-xs text-slate-500">{r.purpose}</p>
              </div>
              {canApprove && (
                <div className="flex gap-2">
                  <button onClick={()=>updateStatus(r.id,"موافق عليها")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">قبول</button>
                  <button onClick={()=>updateStatus(r.id,"مرفوضة")} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs">رفض</button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl">{toast}</div>}
    </div>
  );
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
  };

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">الإشعارات</h2>
      {notifs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center"><Bell size={40} className="mx-auto text-slate-300"/><p>لا توجد إشعارات</p></div>
      ) : (
        notifs.map(n => (
          <div key={n.id} onClick={()=>markRead(n.id)} className={`bg-white rounded-2xl p-4 border mb-3 cursor-pointer ${n.read ? "opacity-70" : "border-blue-200 bg-blue-50"}`}>
            <div className="flex gap-3">
              <div className={`p-2 rounded-xl ${n.type==="موافقة"?"bg-emerald-100":"bg-red-100"}`}>
                {n.type==="موافقة"?<ThumbsUp size={16}/>:<ThumbsDown size={16}/>}
              </div>
              <div>
                <p className="font-bold">{n.title}</p>
                <p className="text-sm">{n.body}</p>
                <p className="text-xs text-slate-400">{new Date(n.timestamp).toLocaleString()}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"/>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ========== نظام المخزن (للمشرف العام ومدير المخزن فقط) ==========
function InventorySystem({ showAlert, rolePermissions }) {
  const [items, setItems] = useState(() => storage.get("inventory_items", INITIAL_INVENTORY));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أجهزة قياس", qty:1, minAlert:1, condition:"جيد", location:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  
  const canEdit = rolePermissions?.inventory?.edit || false;
  const canAdd = rolePermissions?.inventory?.add || false;
  const canDelete = rolePermissions?.inventory?.delete || false;
  
  useEffect(() => { storage.set("inventory_items", items); }, [items]);
  
  const categories = ["الكل", ...new Set(items.map(i=>i.category))];
  const filtered = items.filter(i => (i.name.includes(search) || i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  
  const lowStockItems = items.filter(i => i.qty <= i.minAlert);
  
  const updateQuantity = (id, newQty) => {
    if (!canEdit) { showToast("⚠️ ليس لديك صلاحية تعديل المخزن"); return; }
    const item = items.find(i => i.id === id);
    if (newQty <= item.minAlert && newQty > 0) { showToast(`⚠️ تنبيه: كمية ${item.name} أصبحت منخفضة`); }
    setItems(items.map(i => i.id === id ? { ...i, qty: newQty } : i));
  };
  
  const saveItem = () => {
    if (!canAdd && !canEdit) { showToast("⚠️ ليس لديك صلاحية"); return; }
    if (!form.name) return showToast("الاسم مطلوب");
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false);
    showToast("✅ تم الحفظ");
  };
  
  const deleteItem = (id) => { 
    if (!canDelete) { showToast("⚠️ ليس لديك صلاحية حذف"); return; }
    if(window.confirm("حذف؟")) { setItems(items.filter(i=>i.id!==id)); showToast("✅ تم الحذف"); } 
  };
  const openEdit = (it) => { setEditId(it.id); setForm({...it}); setAdding(false); };
  const openAdd = () => { setAdding(true); setEditId(null); setForm({ code:"", name:"", category:"أجهزة قياس", qty:1, minAlert:1, condition:"جيد", location:"مخزن الآلات الدقيقة" }); };
  
  return (
    <div className="space-y-4">
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3"><AlertTriangle size={24} className="text-amber-600"/><div><p className="font-bold text-amber-800">⚠️ تنبيه: مخزون منخفض</p>
          <div className="flex flex-wrap gap-2 mt-2">{lowStockItems.map(i => (<span key={i.id} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs">{i.name}: {i.qty}/{i.minAlert}</span>))}</div></div></div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1"><div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="flex gap-2">
          {canAdd && <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة صنف</button>}
          <PrintButton targetId="print-inventory" label="طباعة"/>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.length}</p><p className="text-[10px]">إجمالي الأصناف</p></div>
        <div className="bg-slate-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.reduce((s,i)=>s+i.qty,0)}</p><p className="text-[10px]">إجمالي القطع</p></div>
        <div className="bg-emerald-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.filter(i=>i.condition==="جيد").length}</p><p className="text-[10px]">حالة جيدة</p></div>
        <div className="bg-amber-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{lowStockItems.length}</p><p className="text-[10px]">مخزون منخفض</p></div>
      </div>
      
      {(adding || editId) && (canAdd || canEdit) && (<div className="bg-white rounded-2xl border-2 border-blue-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة صنف":"تعديل صنف"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[["الاسم *","name"],["الرمز","code"],["الفئة","category"],["الكمية","qty"],["حد التنبيه","minAlert"],["الموقع","location"]].map(([l,k])=>(
          <div key={k}><label className="block text-[10px] font-bold text-slate-500 mb-1">{l}</label>
          <input value={form[k]} onChange={e=>setForm({...form,[k]:k==="qty"||k==="minAlert"?Number(e.target.value):e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
        ))}
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة</label>
        <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
          {["جيد","مستعمل","يحتاج صيانة","تالف","عاطل"].map(c=><option key={c}>{c}</option>)}
        </select></div>
      </div>
      <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
      
      <div id="print-inventory" className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-slate-50 border-b"><th>الاسم</th><th>الرمز</th><th>الفئة</th><th>الكمية</th><th>حد التنبيه</th><th>الحالة</th><th>الموقع</th>{canEdit && <th>إجراءات</th>}</tr></thead>
        <tbody>{filtered.map(it=>{
          const isLow = it.qty <= it.minAlert;
          return (<tr key={it.id} className={`border-b hover:bg-slate-50 ${isLow ? "bg-amber-50" : ""}`}>
            <td className="px-3 py-2 font-semibold">{it.name} {isLow && <span className="text-amber-600 text-[10px] mr-1">⚠️</span>}</td>
            <td className="px-3 py-2 font-mono">{it.code||"—"}</td><td className="px-3 py-2">{it.category}</td>
            <td className="px-3 py-2"><div className="flex items-center gap-1">{canEdit && <button onClick={()=>updateQuantity(it.id, Math.max(0, it.qty-1))} className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded">-</button>}
            <span className={`font-bold w-8 text-center ${isLow ? "text-amber-600" : "text-slate-800"}`}>{it.qty}</span>
            {canEdit && <button onClick={()=>updateQuantity(it.id, it.qty+1)} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded">+</button>}</div></td>
            <td className="px-3 py-2 text-center"><span className="text-xs text-slate-400">{it.minAlert}</span></td>
            <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":it.condition==="تالف"||it.condition==="عاطل"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
            <td className="px-3 py-2">{it.location}</td>
            {canEdit && <td className="px-3 py-2"><div className="flex gap-1"><button onClick={()=>openEdit(it)} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td>}</tr>);
        })}</tbody></table></div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== إدارة الموظفين (للمشرف العام فقط) ==========
function EmployeeManager({ employees, setEmployees, rolePermissions }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"", phone:"", email:"", role:"EMPLOYEE" });
  const [adding, setAdding] = useState(false);
  const filtered = employees.filter(e => e.name.includes(search) || e.jobNum.includes(search));
  
  const canEdit = rolePermissions?.employees?.edit || false;
  const canAdd = rolePermissions?.employees?.add || false;
  const canDelete = rolePermissions?.employees?.delete || false;
  const canAssignRole = rolePermissions?.employees?.assignRole || false;
  
  const save = () => {
    if (!form.name || !form.jobNum) return;
    if (adding) setEmployees([...employees, { ...form, id: Date.now(), password:"1000" }]);
    else setEmployees(employees.map(e => e.id===editId ? { ...form, id:editId, password:e.password } : e));
    setAdding(false); setEditId(null);
  };
  
  const deleteEmp = (id) => {
    if (!canDelete) { alert("ليس لديك صلاحية حذف"); return; }
    if(window.confirm("حذف الموظف؟")) setEmployees(employees.filter(e => e.id !== id));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="flex-1 border rounded-xl px-3 py-2"/>
        {canAdd && <button onClick={()=>{setAdding(true); setForm({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"", phone:"", email:"", role:"EMPLOYEE" });}} className="px-4 py-2 bg-blue-600 text-white rounded-xl"><Plus size={14}/> إضافة</button>}
      </div>
      {(adding || editId) && (canAdd || canEdit) && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم" className="border rounded-xl p-2"/>
            <input value={form.jobNum} onChange={e=>setForm({...form,jobNum:e.target.value})} placeholder="الرقم" className="border rounded-xl p-2"/>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="المسمى" className="border rounded-xl p-2"/>
            <input value={form.edu} onChange={e=>setForm({...form,edu:e.target.value})} placeholder="المؤهل" className="border rounded-xl p-2"/>
            <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="الهاتف" className="border rounded-xl p-2"/>
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="البريد" className="border rounded-xl p-2" type="email"/>
            <select value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} className="border rounded-xl p-2">
              <option>قسم السيطرة والنظم</option><option>شعبة مستودع الفاو</option><option>شعبة المرافئ</option>
            </select>
            <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} className="border rounded-xl p-2">
              <option>صباحي</option><option>مناوبة</option>
            </select>
            {canAssignRole && (
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="border rounded-xl p-2">
                <option value="EMPLOYEE">موظف عادي</option>
                <option value="ATTENDANCE_ADMIN">مشرف حضور</option>
                <option value="INVENTORY_MANAGER">مدير مخزن</option>
                <option value="TRAINING_COORDINATOR">منسق تدريب</option>
                <option value="ADMIN">مدير إداري</option>
                <option value="SUPER_ADMIN">مشرف عام</option>
              </select>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={()=>{setAdding(false);setEditId(null);}} className="flex-1 py-2 border rounded-xl">إلغاء</button>
            <button onClick={save} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">حفظ</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr><th className="p-3 text-right">الاسم</th><th>الرقم</th><th>المسمى</th><th>القسم</th><th>الدوام</th><th>الصلاحية</th>{canDelete && <th></th>}</tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="border-t"><td className="p-3">{e.name}</td><td className="p-3">{e.jobNum}</td><td className="p-3">{e.title}<td><td className="p-3">{e.dept}</td><td className="p-3">{e.shift}{e.group?` [${e.group}]`:""}</td>
              <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.role==="SUPER_ADMIN"?"bg-red-100 text-red-800":e.role==="ADMIN"?"bg-amber-100 text-amber-800":e.role==="INVENTORY_MANAGER"?"bg-blue-100 text-blue-800":e.role==="ATTENDANCE_ADMIN"?"bg-green-100 text-green-800":"bg-slate-100 text-slate-600"}`}>{ROLES[e.role]?.name || "موظف"}</span></td>
              {canDelete && <td className="p-3"><button onClick={()=>deleteEmp(e.id)} className="text-red-400"><Trash2 size={14}/></button></td>}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========== لوحة التحكم الرئيسية مع الصلاحيات ==========
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const [employees, setEmployees] = useState(ACCOUNTS);
  const [allRequests, setAllRequests] = useState([]);
  const [inventory, setInventory] = useState(() => storage.get("inventory_items", INITIAL_INVENTORY));
  const { isConnected } = useConnectionStatus();
  
  // جلب صلاحيات المستخدم الحالي
  const rolePermissions = ROLES[emp.role] || ROLES.EMPLOYEE;
  const userRole = rolePermissions;
  
  // تحديد القائمة بناءً على الصلاحيات
  const menuItems = [
    { id: "home", label: "الرئيسية", icon: <Home size={18}/>, permission: true },
    { id: "requests", label: "طلباتي", icon: <FileText size={18}/>, permission: true },
    { id: "notifications", label: "الإشعارات", icon: <Bell size={18}/>, permission: true },
    { id: "changepass", label: "تغيير كلمة المرور", icon: <Shield size={18}/>, permission: true },
  ];
  
  // إضافة الموافقات (للمشرف العام والمدير الإداري)
  if (rolePermissions.requests?.approve) {
    menuItems.unshift({ id: "approvals", label: "الموافقات", icon: <ThumbsUp size={18}/>, permission: true });
  }
  
  // إضافة المخزن (للمشرف العام ومدير المخزن)
  if (rolePermissions.inventory?.view) {
    menuItems.push({ id: "inventory", label: "المخزن", icon: <Package size={18}/>, permission: true });
  }
  
  // إدارة الموظفين (للمشرف العام فقط)
  if (rolePermissions.employees?.view) {
    menuItems.push({ id: "employees", label: "الموظفين", icon: <Users size={18}/>, permission: true });
  }

  useEffect(() => {
    const load = async () => {
      if (isConnected) setAllRequests(await FirebaseAPI.getAllRequests());
      else setAllRequests(storage.get("all_requests", []));
    };
    load();
  }, [isConnected]);

  const requestsByStatus = {
    pending: allRequests.filter(r => r.status === "بانتظار المراجعة").length,
    approved: allRequests.filter(r => r.status === "موافق عليها").length,
    rejected: allRequests.filter(r => r.status === "مرفوضة").length
  };
  const totalRequests = allRequests.length;
  const completionRate = totalRequests > 0 ? Math.round((requestsByStatus.approved / totalRequests) * 100) : 0;
  
  const lowStockCount = inventory.filter(i => i.qty <= i.minAlert).length;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold">BOC</span></div>
          <div><h1 className="font-bold">شركة نفط البصرة</h1><p className="text-xs text-slate-500">شعبة مستودع الفاو - نظام الإدارة المتكامل</p></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            {isConnected ? <><Wifi size={12} className="text-emerald-500"/><span>متصل</span></> : <><WifiOff size={12} className="text-amber-500"/><span>غير متصل</span></>}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">{emp.name}</p>
            <div className="flex items-center gap-1">
              <Shield size={10} className="text-slate-400"/>
              <p className="text-xs text-slate-500">{rolePermissions.name}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row">
        <aside className="md:w-64 bg-white border-l min-h-screen p-4">
          <nav className="space-y-1">
            {menuItems.filter(item => item.permission).map(item => (
              <button key={item.id} onClick={()=>setView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${view===item.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs">
            <p className="font-bold mb-2 flex items-center gap-2"><Key size={12}/> صلاحياتك</p>
            <ul className="space-y-1 text-[11px] text-slate-600">
              {rolePermissions.requests?.approve && <li>✓ الموافقة على الطلبات</li>}
              {rolePermissions.inventory?.edit && <li>✓ إدارة المخزن</li>}
              {rolePermissions.employees?.edit && <li>✓ إدارة الموظفين</li>}
              {rolePermissions.attendance?.edit && <li>✓ إدارة الحضور</li>}
              {rolePermissions.training?.assign && <li>✓ إسناد التدريب</li>}
              {rolePermissions.reports?.export && <li>✓ تصدير التقارير</li>}
            </ul>
          </div>
        </aside>
        <main className="flex-1 p-6">
          {view === "home" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"><User size={32} className="text-white"/></div>
                  <div><h2 className="text-2xl font-bold">مرحباً، {emp.name.split(" ")[0]}</h2><p className="opacity-80">تم تسجيل الدخول بنجاح - {rolePermissions.name}</p></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center justify-between"><Users size={20} className="text-blue-500"/><span className="text-2xl font-bold text-blue-600">{employees.length}</span></div><p className="text-sm text-slate-600 mt-1">إجمالي الموظفين</p></div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center justify-between"><FileText size={20} className="text-amber-500"/><span className="text-2xl font-bold text-amber-600">{requestsByStatus.pending}</span></div><p className="text-sm text-slate-600 mt-1">طلبات معلقة</p></div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center justify-between"><CheckCircle size={20} className="text-emerald-500"/><span className="text-2xl font-bold text-emerald-600">{completionRate}%</span></div><p className="text-sm text-slate-600 mt-1">نسبة الإنجاز</p></div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center justify-between"><Package size={20} className="text-violet-500"/><span className="text-2xl font-bold text-violet-600">{lowStockCount}</span></div><p className="text-sm text-slate-600 mt-1">مخزون منخفض</p></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart size={18}/> حالة الطلبات</h3>
                  <div className="space-y-3">{[
                    { label: "بانتظار المراجعة", value: requestsByStatus.pending, color: "bg-amber-500" },
                    { label: "موافق عليها", value: requestsByStatus.approved, color: "bg-emerald-500" },
                    { label: "مرفوضة", value: requestsByStatus.rejected, color: "bg-red-500" }
                  ].map(s => { const percent = totalRequests > 0 ? Math.round(s.value / totalRequests * 100) : 0;
                    return (<div key={s.label}><div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span>{percent}% ({s.value})</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${s.color} rounded-full`} style={{width:`${percent}%`}}/></div></div>);
                  })}</div>
                </div>
                
                <div className="bg-white rounded-2xl p-5 shadow-sm border"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2<Users size={18}/> توزيع الموظفين حسب الصلاحيات</h3>
                  <div className="space-y-3">{Object.entries({
                    "مشرف عام": employees.filter(e=>e.role==="SUPER_ADMIN").length,
                    "مدير إداري": employees.filter(e=>e.role==="ADMIN").length,
                    "مدير مخزن": employees.filter(e=>e.role==="INVENTORY_MANAGER").length,
                    "منسق تدريب": employees.filter(e=>e.role==="TRAINING_COORDINATOR").length,
                    "مشرف حضور": employees.filter(e=>e.role==="ATTENDANCE_ADMIN").length,
                    "موظف": employees.filter(e=>e.role==="EMPLOYEE").length
                  }).filter(([_,v]) => v > 0).map(([label, count]) => {
                    const percent = employees.length > 0 ? Math.round(count / employees.length * 100) : 0;
                    return (<div key={label}><div className="flex justify-between text-sm mb-1"><span>{label}</span><span>{percent}% ({count})</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full bg-blue-500 rounded-full`} style={{width:`${percent}%`}}/></div></div>);
                  })}</div>
                </div>
              </div>
            </div>
          )}
          {view === "requests" && <RequestsPage emp={emp} />}
          {view === "approvals" && <ApprovalsPage emp={emp} rolePermissions={rolePermissions} />}
          {view === "notifications" && <NotificationsPage emp={emp} />}
          {view === "inventory" && <InventorySystem showAlert={true} rolePermissions={rolePermissions} />}
          {view === "employees" && <EmployeeManager employees={employees} setEmployees={setEmployees} rolePermissions={rolePermissions} />}
          {view === "changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  return user ? <Dashboard emp={user} onLogout={()=>{sessionStorage.clear(); setUser(null);}} /> : <LoginScreen onLogin={setUser} />;
}