import { useState, useEffect, useCallback, useRef } from "react";
import { 
  LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User, 
  CheckCircle, Wifi, WifiOff, RefreshCw, FileText, Clock, Calendar,
  Bell, ThumbsUp, ThumbsDown, Plus, Trash2, Edit3, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Printer, Download, Search, Award,
  TrendingUp, TrendingDown, PieChart, Activity, AlertTriangle, Key,
  CalendarDays, MessageSquare, FileJson, Mail, Send, Upload, Target, CheckSquare
} from "lucide-react";

// ========== تكوين البريد الإلكتروني (EmailJS) ==========
const EMAILJS_CONFIG = {
  serviceId: "service_boc_faw",
  templateId: "template_boc_faw", 
  publicKey: "YOUR_PUBLIC_KEY"
};

// ========== تكوين Telegram ==========
const TELEGRAM_CONFIG = {
  botToken: "YOUR_BOT_TOKEN",
  chatId: "YOUR_CHAT_ID"
};

const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";

// ========== الصلاحيات ==========
const ROLES = {
  SUPER_ADMIN: { level: 5, name: "مشرف عام", permissions: { employees: { view: true, add: true, edit: true, delete: true, assignRole: true }, requests: { view: true, approve: true, reject: true }, inventory: { view: true, add: true, edit: true, delete: true }, tasks: { view: true, assign: true, evaluate: true }, reports: { view: true, export: true } } },
  ADMIN: { level: 4, name: "مدير إداري", permissions: { employees: { view: true }, requests: { view: true, approve: true, reject: true }, inventory: { view: true }, tasks: { view: true, assign: true }, reports: { view: true, export: true } } },
  INVENTORY_MANAGER: { level: 3, name: "مدير مخزن", permissions: { inventory: { view: true, add: true, edit: true, delete: true }, reports: { view: true, export: true } } },
  TASK_MANAGER: { level: 3, name: "مدير مهام", permissions: { tasks: { view: true, assign: true, evaluate: true }, reports: { view: true, export: true } } },
  EMPLOYEE: { level: 1, name: "موظف", permissions: { requests: { view: true, add: true }, tasks: { view: true }, reports: { view: true } } }
};

// ========== بيانات الموظفين ==========
const ACCOUNTS = [
  {id:1, jobNum:"728004", password:"1001", name:"ايهاب عبد اللطيف", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"SUPER_ADMIN", email:"admin@boc.iq"},
  {id:31, jobNum:"689766", password:"3002", name:"اباذر صالح", title:"مدير إداري", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"ADMIN", email:"abather@boc.iq"},
  {id:9, jobNum:"790885", password:"1009", name:"محمد عبد الكاظم", title:"مدير مخزن", dept:"شعبة مستودع الفاو", shift:"صباحي", role:"INVENTORY_MANAGER", email:"mohammed@boc.iq"},
  {id:20, jobNum:"719048", password:"2009", name:"علاء محسن", title:"مدير مهام", dept:"قسم السيطرة والنظم", shift:"مناوبة", role:"TASK_MANAGER", email:"alaa@boc.iq"},
  {id:2, jobNum:"727466", password:"1002", name:"عدي فيصل", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"EMPLOYEE", email:"adi@boc.iq"},
  {id:3, jobNum:"737283", password:"1003", name:"عمر طاهر", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"EMPLOYEE", email:"omar@boc.iq"},
  {id:4, jobNum:"756571", password:"1004", name:"ليث شاكر", title:"معاون مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"EMPLOYEE", email:"laith@boc.iq"},
  {id:5, jobNum:"790850", password:"1005", name:"اسعد عبد الامام", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي", role:"EMPLOYEE", email:"asad@boc.iq"},
];

const LEAVE_TYPES = {
  اعتيادية: { label: "إجازة اعتيادية", max: 30, color: "bg-blue-100 text-blue-700", icon: "🏖️" },
  مرضية: { label: "إجازة مرضية", max: 15, color: "bg-rose-100 text-rose-700", icon: "🏥" },
  زمنية: { label: "إجازة زمنية", max: 7, color: "bg-amber-100 text-amber-700", icon: "⏱️" },
};

const INITIAL_INVENTORY = [
  { id:1, code:"2301280010", name:"مقاومة متغيرة", category:"أجهزة قياس", qty:5, minAlert:2, condition:"جيد", location:"الرف A1" },
  { id:2, code:"2301243008", name:"مولد ذبذبات", category:"أجهزة قياس", qty:2, minAlert:1, condition:"جيد", location:"الرف A2" },
  { id:3, code:"5869856050", name:"NEEDLE SOLENOID", category:"صمامات", qty:15, minAlert:5, condition:"جيد", location:"الرف B1" },
  { id:4, code:"", name:"كيج 60 psi", category:"مقاييس ضغط", qty:25, minAlert:10, condition:"جيد", location:"الرف C1" },
  { id:5, code:"", name:"كماشة كهرباء", category:"عدد يدوية", qty:8, minAlert:3, condition:"مستعمل", location:"الرف D1" },
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
  },
  saveTask: async (task) => {
    try { await fetch(`${FIREBASE_URL}/tasks/${task.id}.json`, { method: "PUT", body: JSON.stringify(task) }); return true; } catch { return false; }
  },
  getAllTasks: async () => {
    try { const res = await fetch(`${FIREBASE_URL}/tasks.json`); if (!res.ok) return []; const data = await res.json(); return data ? Object.values(data) : []; } catch { return []; }
  }
};

// ========== إشعارات البريد الإلكتروني ==========
async function sendEmail(toEmail, toName, subject, message) {
  if (EMAILJS_CONFIG.publicKey === "YOUR_PUBLIC_KEY") return false;
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId,
        template_id: EMAILJS_CONFIG.templateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: { to_email: toEmail, to_name: toName, subject, message, from_name: "نظام BOC الفاو" }
      })
    });
    return response.ok;
  } catch { return false; }
}

// ========== إشعارات Telegram ==========
async function sendTelegram(message) {
  if (TELEGRAM_CONFIG.botToken === "YOUR_BOT_TOKEN") return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CONFIG.chatId, text: message, parse_mode: "HTML" })
    });
    return response.ok;
  } catch { return false; }
}

// ========== إشعارات سطح المكتب ==========
async function showDesktopNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/logo192.png" });
  } else if (Notification.permission !== "denied") {
    await Notification.requestPermission();
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/logo192.png" });
    }
  }
}

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

function PrintButton({ targetId, label = "طباعة" }) {
  return (<button onClick={() => printElement(targetId)} className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white border px-3 py-2 rounded-xl"><Printer size={13}/> {label}</button>);
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
          <p className="text-sm text-slate-300 mt-2">شعبة مستودع الفاو - النظام المتكامل</p>
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
          <p>🔑 <strong className="text-blue-300">728004</strong> / <strong className="text-blue-300">1001</strong></p>
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

// ========== بطاقات KPI متحركة ==========
function KPICards({ data }) {
  const [animatedValues, setAnimatedValues] = useState({});
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues(data);
    }, 100);
    return () => clearTimeout(timer);
  }, [data]);

  const cards = [
    { key: "employees", label: "الموظفين", icon: <Users size={20}/>, color: "from-blue-500 to-blue-600" },
    { key: "pendingRequests", label: "طلبات معلقة", icon: <FileText size={20}/>, color: "from-amber-500 to-amber-600" },
    { key: "completedTasks", label: "مهام منجزة", icon: <CheckCircle size={20}/>, color: "from-emerald-500 to-emerald-600" },
    { key: "lowStock", label: "مخزون منخفض", icon: <AlertTriangle size={20}/>, color: "from-red-500 to-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.key} className={`bg-gradient-to-r ${card.color} rounded-2xl p-5 text-white shadow-lg transition-all duration-300 hover:scale-105`}>
          <div className="flex items-center justify-between">
            <div className="opacity-80">{card.icon}</div>
            <span className="text-3xl font-bold animate-in zoom-in duration-500">{animatedValues[card.key] || 0}</span>
          </div>
          <p className="text-sm opacity-90 mt-2">{card.label}</p>
        </div>
      ))}
    </div>
  );
}

// ========== رسوم بيانية مبسطة ==========
function ChartsSection({ attendanceData, requestsByType, equipmentStatus, topEmployees }) {
  const total = attendanceData.present + attendanceData.absent;
  const attendancePercent = total > 0 ? Math.round((attendanceData.present / total) * 100) : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* نسبة الحضور */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18}/> نسبة الحضور والغياب</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32">
            <div className="w-32 h-32 rounded-full border-8 border-slate-100"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-3xl font-bold text-emerald-600">{attendancePercent}%</p>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div><div className="flex justify-between text-sm"><span>حاضر</span><span>{attendanceData.present} يوم</span></div><div className="h-2 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${(attendanceData.present/total)*100}%`}}/></div></div>
            <div><div className="flex justify-between text-sm"><span>غائب</span><span>{attendanceData.absent} يوم</span></div><div className="h-2 bg-slate-100 rounded-full"><div className="h-full bg-red-500 rounded-full" style={{width:`${(attendanceData.absent/total)*100}%`}}/></div></div>
          </div>
        </div>
      </div>

      {/* توزيع الطلبات حسب النوع */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart size={18}/> توزيع الطلبات</h3>
        <div className="space-y-3">
          {Object.entries(requestsByType).map(([type, count]) => {
            const totalReqs = Object.values(requestsByType).reduce((a,b)=>a+b,1);
            const percent = Math.round((count / totalReqs) * 100);
            const colors = { اعتيادية: "bg-blue-500", مرضية: "bg-rose-500", زمنية: "bg-amber-500" };
            return (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1"><span>{LEAVE_TYPES[type]?.label || type}</span><span>{percent}% ({count})</span></div>
                <div className="h-2 bg-slate-100 rounded-full"><div className={`h-full ${colors[type]} rounded-full transition-all duration-500`} style={{width:`${percent}%`}}/></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* حالة المعدات */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2><Package size={18}/> حالة المعدات</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-emerald-50 rounded-xl p-3"><p className="text-2xl font-bold text-emerald-600">{equipmentStatus.good}</p><p className="text-xs">جيد</p></div>
          <div className="bg-amber-50 rounded-xl p-3"><p className="text-2xl font-bold text-amber-600">{equipmentStatus.used}</p><p className="text-xs">مستعمل</p></div>
          <div className="bg-red-50 rounded-xl p-3"><p className="text-2xl font-bold text-red-600">{equipmentStatus.damaged}</p><p className="text-xs">تالف</p></div>
        </div>
      </div>

      {/* أكثر الموظفين طلباً */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2><Award size={18}/> الأكثر طلباً للإجازات</h3>
        <div className="space-y-2">
          {topEmployees.slice(0,5).map((emp, idx) => (
            <div key={emp.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2"><span className="text-lg">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "📋"}</span><span className="text-sm">{emp.name}</span></div>
              <span className="text-sm font-bold text-blue-600">{emp.count} طلب</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== تقويم تفاعلي ==========
function InteractiveCalendar({ leaves, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const dayNames = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];
  
  const getLeavesOnDate = (date) => {
    const dateStr = date.toISOString().slice(0,10);
    return leaves.filter(l => l.dateFrom <= dateStr && l.dateTo >= dateStr);
  };
  
  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    onDateClick?.(date);
  };
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-slate-100 rounded-xl">◀</button>
        <h3 className="font-bold text-lg">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-slate-100 rounded-xl">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayNames.map(d => <div key={d} className="text-xs font-bold text-slate-400 py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, idx) => {
          if (day === null) return <div key={idx} className="p-2"></div>;
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const leavesOnDay = getLeavesOnDate(date);
          const hasLeave = leavesOnDay.length > 0;
          const isSelected = selectedDate?.toDateString() === date.toDateString();
          return (
            <div key={day} onClick={() => handleDateClick(day)} className={`p-2 rounded-xl cursor-pointer transition-all ${hasLeave ? "bg-blue-100" : "hover:bg-slate-50"} ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
              <span className="text-sm">{day}</span>
              {hasLeave && <div className="w-1 h-1 bg-blue-500 rounded-full mx-auto mt-1"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== طلبات الإجازة ==========
function RequestsPage({ emp, onNotification }) {
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
    
    // Desktop notification
    showDesktopNotification("طلب إجازة جديد", `تم إرسال طلب ${form.type} لمدة ${days} أيام`);
    
    // Email notification to admin
    const admin = ACCOUNTS.find(a => a.role === "SUPER_ADMIN");
    if (admin?.email) {
      await sendEmail(admin.email, admin.name, `طلب إجازة جديد من ${emp.name}`, `النوع: ${form.type}\nالمدة: ${days} أيام\nمن: ${form.dateFrom}\nإلى: ${form.dateTo}`);
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
                <button onClick={async () => {
                  if (window.confirm("حذف؟")) {
                    if (isConnected) await FirebaseAPI.deleteRequest(r.id);
                    setRequests(requests.filter(req => req.id !== r.id));
                    setToast("✅ تم الحذف");
                    setTimeout(()=>setToast(""),2000);
                  }
                }} className="text-red-400"><Trash2 size={18}/></button>
              )}
            </div>
          </div>
        ))
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl">{toast}</div>}
    </div>
  );
}

// ========== الموافقات ==========
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
    if (!canApprove) return;
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const updated = { ...req, status, decidedAt: new Date().toISOString(), decidedBy: emp.name };
    if (isConnected) await FirebaseAPI.saveRequest(updated);
    const notif = { id:Date.now(), type:status==="موافق عليها"?"موافقة":"رفض", title:status==="موافق عليها"?"✅ تمت الموافقة":"❌ تم الرفض", body:`${req.type} — ${req.days} يوم`, timestamp:new Date().toISOString(), read:false };
    if (isConnected) await FirebaseAPI.saveNotification(req.empId, notif);
    
    // Desktop notification
    showDesktopNotification(status==="موافق عليها"?"تمت الموافقة على طلبك":"تم رفض طلبك", `${req.type} — ${req.days} يوم`);
    
    // Email notification
    const employee = ACCOUNTS.find(e => e.id === req.empId);
    if (employee?.email) {
      await sendEmail(employee.email, employee.name, status==="موافق عليها"?"✅ تمت الموافقة":"❌ تم الرفض", `${req.type} — ${req.days} يوم`);
    }
    
    setRequests(requests.filter(r => r.id !== id));
    setToast(`✅ تم ${status==="موافق عليها"?"قبول":"رفض"}`);
    setTimeout(()=>setToast(""),2000);
  };

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">الطلبات المعلقة ({requests.length})</h2>
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

// ========== نظام المهام والأعمال ==========
function TasksSystem({ emp, rolePermissions }) {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", assignedTo:"", priority:"متوسطة", dueDate:new Date().toISOString().slice(0,10), maxScore:10 });
  const [toast, setToast] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const { isConnected } = useConnectionStatus();
  const canAssign = rolePermissions?.tasks?.assign || false;
  const canEvaluate = rolePermissions?.tasks?.evaluate || false;

  useEffect(() => {
    const load = async () => {
      if (isConnected) {
        const all = await FirebaseAPI.getAllTasks();
        setTasks(all.filter(t => t.assignedTo === emp.id || canAssign));
      } else {
        setTasks(storage.get(`tasks_${emp.id}`, []));
      }
    };
    load();
  }, [emp.id, isConnected, canAssign]);

  const assignTask = async () => {
    if (!form.title || !form.assignedTo) { setToast("العنوان والموظف مطلوبان"); setTimeout(()=>setToast(""),2000); return; }
    const newTask = { id:Date.now(), ...form, status:"مسندة", assignedBy:emp.name, assignedAt:new Date().toISOString(), employeeAction:"", score:null, fileUrl:null };
    if (isConnected) await FirebaseAPI.saveTask(newTask);
    setTasks([newTask, ...tasks]);
    setShowForm(false);
    setForm({ title:"", description:"", assignedTo:"", priority:"متوسطة", dueDate:new Date().toISOString().slice(0,10), maxScore:10 });
    setToast("✅ تم إسناد المهمة");
    setTimeout(()=>setToast(""),2000);
    
    // Desktop notification للموظف
    const employee = ACCOUNTS.find(e => e.id === Number(form.assignedTo));
    if (employee) {
      showDesktopNotification(`مهمة جديدة: ${form.title}`, `تم إسناد مهمة إليك تنتهي في ${form.dueDate}`);
      if (employee.email) {
        await sendEmail(employee.email, employee.name, `مهمة جديدة: ${form.title}`, `التفاصيل: ${form.description}\nتاريخ الاستحقاق: ${form.dueDate}`);
      }
    }
  };

  const submitTask = async (id, actionText, file) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    let fileUrl = null;
    if (file) {
      const reader = new FileReader();
      fileUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }
    const updated = { ...task, status:"مراجعة", employeeAction:actionText, submittedAt:new Date().toISOString(), fileUrl };
    if (isConnected) await FirebaseAPI.saveTask(updated);
    setTasks(tasks.map(t => t.id === id ? updated : t));
    setToast("✅ تم إرسال المهمة للمراجعة");
    setTimeout(()=>setToast(""),2000);
  };

  const evaluateTask = async (id, score, feedback) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = { ...task, status: score >= (task.maxScore * 0.7) ? "مقبولة" : "مرفوضة", score, feedback, evaluatedAt:new Date().toISOString(), evaluatedBy:emp.name };
    if (isConnected) await FirebaseAPI.saveTask(updated);
    setTasks(tasks.map(t => t.id === id ? updated : t));
    setToast(`✅ تم تقييم المهمة: ${updated.status}`);
    setTimeout(()=>setToast(""),2000);
    
    // إشعار للموظف
    const employee = ACCOUNTS.find(e => e.id === task.assignedTo);
    if (employee) {
      showDesktopNotification(`تقييم مهمتك: ${task.title}`, `الدرجة: ${score}/${task.maxScore}`);
    }
  };

  const getPriorityColor = (priority) => {
    if(priority === "عالية") return "bg-red-100 text-red-700";
    if(priority === "متوسطة") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const getStatusColor = (status) => {
    if(status === "مسندة") return "bg-amber-100 text-amber-700";
    if(status === "مراجعة") return "bg-blue-100 text-blue-700";
    if(status === "مقبولة") return "bg-emerald-100 text-emerald-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-xl">المهام والأعمال</h2>
        {canAssign && <button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-violet-600 text-white rounded-xl"><Plus size={16}/> إسناد مهمة</button>}
      </div>
      
      {showForm && canAssign && (
        <div className="bg-white rounded-2xl p-5 border-2 border-violet-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان المهمة" className="w-full border rounded-xl p-3"/></div>
            <div className="col-span-2"><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="وصف المهمة" rows={3} className="w-full border rounded-xl p-3"/></div>
            <select value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} className="border rounded-xl p-3">
              <option value="">-- اختر الموظف --</option>
              {ACCOUNTS.filter(a => a.id !== emp.id).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="border rounded-xl p-3">
              <option value="عالية">عالية</option><option value="متوسطة">متوسطة</option><option value="منخفضة">منخفضة</option>
            </select>
            <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="border rounded-xl p-3"/>
            <input type="number" value={form.maxScore} onChange={e=>setForm({...form,maxScore:Number(e.target.value)})} placeholder="الدرجة القصوى" className="border rounded-xl p-3"/>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={()=>setShowForm(false)} className="flex-1 py-2 border rounded-xl">إلغاء</button>
            <button onClick={assignTask} className="flex-1 py-2 bg-violet-600 text-white rounded-xl">إسناد</button>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center"><Target size={40} className="mx-auto text-slate-300"/><p>لا توجد مهام</p></div>
        ) : (
          tasks.map(t => {
            const assignedEmp = ACCOUNTS.find(e => e.id === t.assignedTo);
            const isMyTask = t.assignedTo === emp.id;
            const isEvaluator = canEvaluate;
            return (
              <div key={t.id} className="bg-white rounded-2xl p-4 border shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(t.status)}`}>{t.status}</span>
                    </div>
                    <p className="font-bold text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                    <div className="flex gap-3 text-[10px] text-slate-400 mt-2">
                      <span>📅 تاريخ الاستحقاق: {t.dueDate}</span>
                      <span>🎯 الدرجة القصوى: {t.maxScore}</span>
                      {assignedEmp && <span>👤 الموظف: {assignedEmp.name}</span>}
                      {t.score && <span>⭐ الدرجة: {t.score}/{t.maxScore}</span>}
                    </div>
                    {t.employeeAction && <div className="mt-2 p-2 bg-slate-50 rounded-lg text-xs"><span className="font-bold">✍️ الإجراء:</span> {t.employeeAction}</div>}
                    {t.fileUrl && <a href={t.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600"><Download size={12}/> تحميل الملف</a>}
                    {t.feedback && <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs"><span className="font-bold">📝 ملاحظة المشرف:</span> {t.feedback}</div>}
                  </div>
                  <div>
                    {isMyTask && t.status === "مسندة" && (
                      <button onClick={() => {
                        const action = prompt("أدخل وصف الإجراء الذي قمت به:");
                        if (action) {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.onchange = (e) => submitTask(t.id, action, e.target.files[0]);
                          fileInput.click();
                        }
                      }} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs">تقديم الإنجاز</button>
                    )}
                    {isEvaluator && t.status === "مراجعة" && (
                      <div className="flex gap-2">
                        <input id={`score_${t.id}`} type="number" min="0" max={t.maxScore} placeholder="الدرجة" className="w-20 border rounded-lg px-2 py-1 text-xs"/>
                        <input id={`feedback_${t.id}`} placeholder="ملاحظة" className="w-32 border rounded-lg px-2 py-1 text-xs"/>
                        <button onClick={() => {
                          const score = Number(document.getElementById(`score_${t.id}`).value);
                          const feedback = document.getElementById(`feedback_${t.id}`).value;
                          evaluateTask(t.id, score, feedback);
                        }} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">تقييم</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl">{toast}</div>}
    </div>
  );
}

// ========== نظام التقارير الذكية ==========
function SmartReports({ allRequests, employees, inventory }) {
  const [reportType, setReportType] = useState("attendance");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0,10));
  
  const exportToCSV = () => {
    let data = [];
    if (reportType === "requests") {
      data = allRequests.map(r => ({ "الموظف":r.empName, "النوع":r.type, "عدد الأيام":r.days, "الحالة":r.status, "تاريخ التقديم":r.submittedAt?.slice(0,10) }));
    } else if (reportType === "employees") {
      data = employees.map(e => ({ "الاسم":e.name, "الرقم الوظيفي":e.jobNum, "القسم":e.dept, "الدور":ROLES[e.role]?.name }));
    } else if (reportType === "inventory") {
      data = inventory.map(i => ({ "الاسم":i.name, "الرمز":i.code, "الكمية":i.qty, "الحالة":i.condition, "الموقع":i.location }));
    }
    const headers = Object.keys(data[0] || {});
    const csvRows = [headers.join(",")];
    for (const row of data) {
      const values = headers.map(header => `"${row[header] || ""}"`);
      csvRows.push(values.join(","));
    }
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${reportType}_report.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  
  const exportToPDF = () => {
    const content = document.getElementById("report-content");
    if (content) printElement("report-content", `تقرير ${reportType}`);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={reportType} onChange={e=>setReportType(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">
          <option value="attendance">تقرير الحضور</option>
          <option value="requests">تقرير الطلبات</option>
          <option value="employees">تقرير الموظفين</option>
          <option value="inventory">تقرير المخزن</option>
        </select>
        <button onClick={exportToCSV} className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 px-3 py-2 rounded-xl"><Download size={13}/> CSV</button>
        <button onClick={exportToPDF} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Printer size={13}/> PDF</button>
      </div>
      
      <div id="report-content" className="bg-white rounded-2xl border p-5">
        <div className="text-center mb-4 border-b pb-2">
          <p className="text-lg font-bold">شركة نفط البصرة - شعبة الفاو</p>
          <p className="text-sm text-slate-500">تقرير {reportType} - {new Date().toLocaleDateString("ar-IQ")}</p>
        </div>
        {reportType === "employees" && (
          <table className="w-full text-sm"><thead><tr className="bg-slate-50"><th className="p-2">الاسم</th><th>الرقم</th><th>القسم</th><th>الدور</th></tr></thead>
          <tbody>{employees.map(e => (<tr key={e.id} className="border-t"><td className="p-2">{e.name}</td><td>{e.jobNum}</td><td>{e.dept}</td><td>{ROLES[e.role]?.name}</td></tr>))}</tbody></table>
        )}
        {reportType === "requests" && (
          <table className="w-full text-sm"><thead><tr className="bg-slate-50"><th className="p-2">الموظف</th><th>النوع</th><th>عدد الأيام</th><th>الحالة</th></tr></thead>
          <tbody>{allRequests.slice(0,50).map(r => (<tr key={r.id} className="border-t"><td className="p-2">{r.empName}</td><td>{r.type}</td><td>{r.days}</td><td>{r.status}</td></tr>))}</tbody></table>
        )}
        {reportType === "inventory" && (
          <table className="w-full text-sm"><thead><tr className="bg-slate-50"><th className="p-2">الاسم</th><th>الرمز</th><th>الكمية</th><th>الحالة</th></tr></thead>
          <tbody>{inventory.map(i => (<tr key={i.id} className="border-t"><td className="p-2">{i.name}</td><td>{i.code}</td><td>{i.qty}</td><td>{i.condition}</td></tr>))}</tbody></table>
        )}
      </div>
    </div>
  );
}

// ========== نظام المخزن ==========
function InventorySystem({ rolePermissions }) {
  const [items, setItems] = useState(() => storage.get("inventory_items", INITIAL_INVENTORY));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const canEdit = rolePermissions?.inventory?.edit || false;
  
  const categories = ["الكل", ...new Set(items.map(i=>i.category))];
  const filtered = items.filter(i => (i.name.includes(search) || i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  const lowStockItems = items.filter(i => i.qty <= i.minAlert);
  
  const updateQuantity = (id, newQty) => {
    if (!canEdit) { showToast("⚠️ ليس لديك صلاحية تعديل المخزن"); return; }
    setItems(items.map(i => i.id === id ? { ...i, qty: Math.max(0, newQty) } : i));
  };
  
  useEffect(() => { storage.set("inventory_items", items); }, [items]);

  return (
    <div className="space-y-4">
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3"><AlertTriangle size={24} className="text-amber-600"/><div><p className="font-bold text-amber-800">⚠️ تنبيه: مخزون منخفض</p>
          <div className="flex flex-wrap gap-2 mt-2">{lowStockItems.map(i => (<span key={i.id} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs">{i.name}: {i.qty}/{i.minAlert}</span>))}</div></div></div>
        </div>
      )}
      
      <div className="flex gap-3">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2">{categories.map(c=><option key={c}>{c}</option>)}</select>
        <PrintButton targetId="print-inventory" label="طباعة"/>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-2xl p-3 text-center"><p className="text-2xl font-bold">{items.length}</p><p className="text-[10px]">إجمالي الأصناف</p></div>
        <div className="bg-slate-50 rounded-2xl p-3 text-center"><p className="text-2xl font-bold">{items.reduce((s,i)=>s+i.qty,0)}</p><p className="text-[10px]">إجمالي القطع</p></div>
        <div className="bg-emerald-50 rounded-2xl p-3 text-center"><p className="text-2xl font-bold">{items.filter(i=>i.condition==="جيد").length}</p><p className="text-[10px]">حالة جيدة</p></div>
        <div className="bg-amber-50 rounded-2xl p-3 text-center"><p className="text-2xl font-bold">{lowStockItems.length}</p><p className="text-[10px]">مخزون منخفض</p></div>
      </div>
      
      <div id="print-inventory" className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-slate-50"><th>الاسم</th><th>الرمز</th><th>الفئة</th><th>الكمية</th><th>الحالة</th><th>الموقع</th>{canEdit && <th></th>}<tr></thead>
        <tbody>{filtered.map(it=>{
          const isLow = it.qty <= it.minAlert;
          return (<tr key={it.id} className={`border-b ${isLow ? "bg-amber-50" : ""}`}>
            <td className="p-3 font-semibold">{it.name} {isLow && <span className="text-amber-600">⚠️</span>}</td>
            <td className="p-3 font-mono">{it.code||"—"}</td><td className="p-3">{it.category}</td>
            <td className="p-3"><div className="flex items-center gap-1">{canEdit && <button onClick={()=>updateQuantity(it.id, it.qty-1)} className="px-2 py-0.5 bg-red-100 rounded">-</button>}
            <span className="font-bold w-8 text-center">{it.qty}</span>{canEdit && <button onClick={()=>updateQuantity(it.id, it.qty+1)} className="px-2 py-0.5 bg-emerald-100 rounded">+</button>}</div></td>
            <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100":it.condition==="تالف"?"bg-red-100":"bg-amber-100"}`}>{it.condition}</span></td>
            <td className="p-3">{it.location}</td>{canEdit && <td className="p-3"><button onClick={()=>{if(window.confirm("حذف?")) setItems(items.filter(i=>i.id!==it.id));}} className="text-red-400"><Trash2 size={14}/></button></td>}</tr>);
        })}</tbody></table></div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-2xl">{toast}</div>}
    </div>
  );
}

// ========== إدارة الموظفين ==========
function EmployeeManager({ employees, setEmployees, rolePermissions }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"EMPLOYEE", email:"" });
  const [adding, setAdding] = useState(false);
  const filtered = employees.filter(e => e.name.includes(search) || e.jobNum.includes(search));
  const canEdit = rolePermissions?.employees?.edit || false;
  const canAdd = rolePermissions?.employees?.add || false;
  const canAssignRole = rolePermissions?.employees?.assignRole || false;
  
  const save = () => {
    if (!form.name || !form.jobNum) return;
    if (adding) setEmployees([...employees, { ...form, id: Date.now(), password:"1000" }]);
    else setEmployees(employees.map(e => e.id===editId ? { ...form, id:editId, password:e.password } : e));
    setAdding(false); setEditId(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="flex-1 border rounded-xl px-3 py-2"/>
        {canAdd && <button onClick={()=>{setAdding(true); setForm({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"EMPLOYEE", email:"" });}} className="px-4 py-2 bg-blue-600 text-white rounded-xl"><Plus size={14}/> إضافة</button>}
      </div>
      {(adding || editId) && (canAdd || canEdit) && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم" className="border rounded-xl p-2"/>
            <input value={form.jobNum} onChange={e=>setForm({...form,jobNum:e.target.value})} placeholder="الرقم" className="border rounded-xl p-2"/>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="المسمى" className="border rounded-xl p-2"/>
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="البريد" className="border rounded-xl p-2" type="email"/>
            <select value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} className="border rounded-xl p-2">
              <option>قسم السيطرة والنظم</option><option>شعبة مستودع الفاو</option><option>شعبة المرافئ</option>
            </select>
            <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} className="border rounded-xl p-2"><option>صباحي</option><option>مناوبة</option></select>
            {canAssignRole && (
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="border rounded-xl p-2">
                <option value="EMPLOYEE">موظف عادي</option>
                <option value="INVENTORY_MANAGER">مدير مخزن</option>
                <option value="TASK_MANAGER">مدير مهام</option>
                <option value="ADMIN">مدير إداري</option>
                <option value="SUPER_ADMIN">مشرف عام</option>
              </select>
            )}
          </div>
          <div className="flex gap-2 mt-4"><button onClick={()=>{setAdding(false);setEditId(null);}} className="flex-1 py-2 border rounded-xl">إلغاء</button><button onClick={save} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">حفظ</button></div>
        </div>
      )}
      <div className="bg-white rounded-2xl border overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3">الاسم</th><th>الرقم</th><th>المسمى</th><th>القسم</th><th>الصلاحية</th></tr></thead>
      <tbody>{filtered.map(e => (<tr key={e.id} className="border-t"><td className="p-3">{e.name}</td><td className="p-3">{e.jobNum}</td><td className="p-3">{e.title}</td><td className="p-3">{e.dept}<td><td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.role==="SUPER_ADMIN"?"bg-red-100":e.role==="ADMIN"?"bg-amber-100":"bg-slate-100"}`}>{ROLES[e.role]?.name}</span></td></tr>))}</tbody></table></div>
    </div>
  );
}

// ========== اللوحة الرئيسية ==========
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const [employees, setEmployees] = useState(ACCOUNTS);
  const [allRequests, setAllRequests] = useState([]);
  const [inventory, setInventory] = useState(() => storage.get("inventory_items", INITIAL_INVENTORY));
  const [tasks, setTasks] = useState([]);
  const { isConnected } = useConnectionStatus();
  const rolePermissions = ROLES[emp.role] || ROLES.EMPLOYEE;
  
  // إحصائيات للرسوم البيانية
  const attendanceData = { present: 22, absent: 8 };
  const requestsByType = {
    اعتيادية: allRequests.filter(r => r.type === "اعتيادية").length,
    مرضية: allRequests.filter(r => r.type === "مرضية").length,
    زمنية: allRequests.filter(r => r.type === "زمنية").length
  };
  const equipmentStatus = {
    good: inventory.filter(i => i.condition === "جيد").length,
    used: inventory.filter(i => i.condition === "مستعمل").length,
    damaged: inventory.filter(i => i.condition === "تالف" || i.condition === "عاطل").length
  };
  const topEmployees = Object.entries(allRequests.reduce((acc, r) => {
    acc[r.empName] = (acc[r.empName] || 0) + 1;
    return acc;
  }, {})).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  
  // إحصائيات بطاقات KPI
  const kpiData = {
    employees: employees.length,
    pendingRequests: allRequests.filter(r => r.status === "بانتظار المراجعة").length,
    completedTasks: tasks.filter(t => t.status === "مقبولة").length,
    lowStock: inventory.filter(i => i.qty <= i.minAlert).length
  };
  
  // إجازات التقويم
  const leaves = allRequests.filter(r => r.status === "موافق عليها");
  
  useEffect(() => {
    const load = async () => {
      if (isConnected) {
        setAllRequests(await FirebaseAPI.getAllRequests());
        setTasks(await FirebaseAPI.getAllTasks());
      } else {
        setAllRequests(storage.get("all_requests", []));
        setTasks(storage.get("all_tasks", []));
      }
    };
    load();
  }, [isConnected]);
  
  const menuItems = [
    { id: "home", label: "الرئيسية", icon: <Home size={18}/> },
    { id: "requests", label: "طلباتي", icon: <FileText size={18}/> },
    { id: "tasks", label: "المهام", icon: <Target size={18}/> },
    { id: "notifications", label: "الإشعارات", icon: <Bell size={18}/> },
    { id: "reports", label: "التقارير", icon: <BarChart size={18}/> },
    { id: "inventory", label: "المخزن", icon: <Package size={18}/> },
    { id: "changepass", label: "تغيير كلمة المرور", icon: <Shield size={18}/> },
  ];
  
  if (rolePermissions.requests?.approve) menuItems.unshift({ id: "approvals", label: "الموافقات", icon: <ThumbsUp size={18}/> });
  if (rolePermissions.employees?.view) menuItems.push({ id: "employees", label: "الموظفين", icon: <Users size={18}/> });

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold">BOC</span></div>
        <div><h1 className="font-bold">شركة نفط البصرة</h1><p className="text-xs text-slate-500">شعبة مستودع الفاو - النظام المتكامل</p></div></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">{isConnected ? <><Wifi size={12} className="text-emerald-500"/><span>متصل</span></> : <><WifiOff size={12} className="text-amber-500"/><span>غير متصل</span></>}</div>
          <div className="text-left"><p className="text-sm font-bold">{emp.name}</p><div className="flex items-center gap-1"><Shield size={10} className="text-slate-400"/><p className="text-xs text-slate-500">{rolePermissions.name}</p></div></div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row">
        <aside className="md:w-64 bg-white border-l min-h-screen p-4">
          <nav className="space-y-1">{menuItems.map(item => (<button key={item.id} onClick={()=>setView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${view===item.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>{item.icon}{item.label}</button>))}</nav>
          <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs"><p className="font-bold mb-2">📊 إحصائيات سريعة</p><p>✓ {kpiData.employees} موظف</p><p>✓ {kpiData.pendingRequests} طلب معلق</p><p>✓ {kpiData.completedTasks} مهمة منجزة</p></div>
        </aside>
        <main className="flex-1 p-6">
          {view === "home" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-4"><div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"><User size={32} className="text-white"/></div>
                <div><h2 className="text-2xl font-bold">مرحباً، {emp.name.split(" ")[0]}</h2><p className="opacity-80">تم تسجيل الدخول بنجاح - {rolePermissions.name}</p></div></div>
              </div>
              <KPICards data={kpiData} />
              <ChartsSection attendanceData={attendanceData} requestsByType={requestsByType} equipmentStatus={equipmentStatus} topEmployees={topEmployees} />
              <InteractiveCalendar leaves={leaves} onDateClick={(date) => console.log("Selected:", date)} />
            </div>
          )}
          {view === "requests" && <RequestsPage emp={emp} />}
          {view === "approvals" && <ApprovalsPage emp={emp} rolePermissions={rolePermissions} />}
          {view === "tasks" && <TasksSystem emp={emp} rolePermissions={rolePermissions} />}
          {view === "notifications" && <NotificationsPage emp={emp} />}
          {view === "reports" && <SmartReports allRequests={allRequests} employees={employees} inventory={inventory} />}
          {view === "inventory" && <InventorySystem rolePermissions={rolePermissions} />}
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