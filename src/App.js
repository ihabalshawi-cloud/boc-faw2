import { useState, useEffect, useCallback, useRef } from "react";
import { 
  LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User, 
  CheckCircle, Wifi, WifiOff, RefreshCw, FileText, Clock, Calendar,
  Bell, ThumbsUp, ThumbsDown, Plus, Trash2, Edit3, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star, ArrowRightLeft,
  Printer, Download, Search, Award, Moon, Sun, MessageSquare, 
  CheckSquare, Mic, MicOff, Volume2, TrendingUp, AlertTriangle,
  Activity, Target, ChevronDown, ChevronUp, Send, Paperclip
} from "lucide-react";
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts";

// ========== الثوابت ==========
const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";
const LOW_STOCK_THRESHOLD = 3;

// ⚠️ بيانات المستخدمين — سري للاستخدام الرسمي فقط
// المشرف والمخول الوحيد: ايهاب الشاوي (i.shawi)
const ACCOUNTS = [
  // ══ موظفو الدوام الصباحي ══
  {id:1,  username:"i.shawi",    jobNum:"728004", password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي",        title:"ر. مهندسين",    dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"admin"},
  {id:2,  username:"o.rubaie",   jobNum:"727466", password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه",     title:"ر. مهندسين",    dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:3,  username:"om.miyahi",  jobNum:"737283", password:"1003", name:"عمر طاهر خزعل سبهان المياحي",               title:"م.ر. مهندسين",  dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:4,  username:"l.rubaie",   jobNum:"756571", password:"1004", name:"ليث شاكر حمود زعيتر الربيعه",               title:"معاون مهندس",   dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:5,  username:"as.nassari", jobNum:"790850", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري",         title:"م.مدير فني",    dept:"شعبة مستودع الفاو",   shift:"صباحي"},
  {id:6,  username:"sb.nassari", jobNum:"758795", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري",         title:"م.مدير فني",    dept:"شعبة مستودع الفاو",   shift:"صباحي"},
  {id:7,  username:"a.amir",     jobNum:"719242", password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير",   title:"مدير فني",      dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:8,  username:"m.mansouri", jobNum:"790869", password:"1008", name:"محمود كاظم هاشم محمد المنصوري",             title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:9,  username:"m.tamimi",   jobNum:"790885", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي",         title:"محاسب اقدم",    dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"inventory_manager"},
  {id:10, username:"m.ali",      jobNum:"813877", password:"1010", name:"محمد اسماعيل احمد رمضان العلي",             title:"مهندس",         dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:11, username:"al.miyahi",  jobNum:"439193", password:"1011", name:"علي طاهر خزعل سبهان المياحي",               title:"حرفي اقدم",     dept:"شعبة المرافئ",         shift:"صباحي"},
  // ══ موظفو المناوبة — المجموعة A ══
  {id:12, username:"ab.abbada",  jobNum:"701130", password:"2001", name:"عبدالله علي زباري",                         title:"م.مدير فني",    dept:"شعبة مستودع الفاو",   shift:"مناوبة", group:"A"},
  {id:13, username:"am.ali",     jobNum:"751480", password:"2002", name:"امين حميد فاضل حسين العلي",                 title:"م.مدير فني",    dept:"شعبة مستودع الفاو",   shift:"مناوبة", group:"A"},
  {id:14, username:"h.abadi",    jobNum:"719269", password:"2003", name:"حسين علي احمد قاسم عبادي",                  title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"A"},
  {id:15, username:"j.hussain",  jobNum:"719498", password:"2004", name:"جاسم مزعل حاتم ديوان الحسين",               title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"A"},
  {id:16, username:"b.faris",    jobNum:"719277", password:"2005", name:"باسم هاشم جاسم هاشم الفارس",                title:"م.مدير فني",    dept:"شعبة المرافئ",         shift:"مناوبة", group:"A"},
  // ══ موظفو المناوبة — المجموعة B ══
  {id:17, username:"h.shnawa",   jobNum:"719293", password:"2006", name:"هاشم جابر جعفر شناوة عباس",                 title:"م.مدير فني",    dept:"شعبة المرافئ",         shift:"مناوبة", group:"B"},
  {id:18, username:"ab.eissa",   jobNum:"719463", password:"2007", name:"عبد الحميد سامي موسى بدر العيسى",           title:"مدير فني",      dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"B"},
  {id:19, username:"ih.dawod",   jobNum:"736732", password:"2008", name:"احسان عبد الصمد داود",                      title:"مدير فني",      dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"B"},
  {id:20, username:"al.jafar",   jobNum:"719048", password:"2009", name:"علاء محسن عذبي جعفر الجعفر",                title:"مدير فني",      dept:"شعبة مستودع الفاو",   shift:"مناوبة", group:"B"},
  // ══ موظفو المناوبة — المجموعة C ══
  {id:21, username:"al.aidani",  jobNum:"735922", password:"2010", name:"علي طارق ياسين مهودر العيداني",             title:"م.ر. مهندسين",  dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"C"},
  {id:22, username:"al.ali",     jobNum:"732249", password:"2011", name:"علي باقر حنتوش مليس العلي",                 title:"م.ر. مبرمجين",  dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"C"},
  {id:23, username:"y.yaseen",   jobNum:"726508", password:"2012", name:"يوسف عباس ياسين احمد ياسين",                title:"مدير فني",      dept:"شعبة مستودع الفاو",   shift:"مناوبة", group:"C"},
  {id:24, username:"dh.ghanim",  jobNum:"719129", password:"2013", name:"ضياء بدر حمادي اسماعيل الغانم",             title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"C"},
  {id:25, username:"ad.atiya",   jobNum:"719099", password:"2014", name:"عدنان جواد كاظم جعفر العطية",               title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"C"},
  // ══ موظفو المناوبة — المجموعة D ══
  {id:26, username:"ih.saleem",  jobNum:"732834", password:"2015", name:"احسان جواد كاظم حسين السليم",               title:"مهندس",         dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"D"},
  {id:27, username:"h.jasim",    jobNum:"724939", password:"2016", name:"حيدر عبد الحسن خضير جاسم",                  title:"مدير فني",      dept:"شعبة المرافئ",         shift:"مناوبة", group:"D"},
  {id:28, username:"w.mahsen",   jobNum:"718939", password:"2017", name:"واثق حسين عبد الشيخ حسن المحسن",            title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"D"},
  {id:29, username:"sd.eissa",   jobNum:"719005", password:"2018", name:"صدام عبد الواحد سلمان عيسى العيسى",         title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"D"},
  // ══ موظفو العقد ══
  {id:30, username:"ab.mouni",   jobNum:"690414", password:"3001", name:"عبد الله عيسى موسى موني",                   title:"عقد",           dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:31, username:"ab.eissa2",  jobNum:"689766", password:"3002", name:"اباذر صالح عبد الحسين عيسى",               title:"عقد",           dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"attendance_admin"},
  {id:32, username:"h.omran",    jobNum:"690174", password:"3003", name:"حسن عادل عمران يوسف",                       title:"عقد",           dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"attendance_admin"},
  {id:33, username:"sj.ali",     jobNum:"689331", password:"3004", name:"سجاد علي راضي علي",                         title:"عقد",           dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"attendance_admin"},
];

const LEAVE_TYPES = {
  اعتيادية: { label: "إجازة اعتيادية", max: 30, color: "bg-blue-100 text-blue-700" },
  مرضية: { label: "إجازة مرضية", max: 15, color: "bg-rose-100 text-rose-700" },
  زمنية: { label: "إجازة زمنية", max: 7, color: "bg-amber-100 text-amber-700" },
};

const TRAINING_TYPES = ["تدريب ذاتي", "دورة تدريبية", "ورشة عمل", "تدريب إلكتروني"];
const ITEM_CONDITIONS = ["جيد", "مستعمل", "يحتاج صيانة", "تالف", "تم الشطب"];
const FURNITURE_CATS = ["أثاث مكتبي", "أجهزة تكييف", "أجهزة حاسوب", "معدات مكتبية", "أجهزة منزلية"];
const INVENTORY_CATS = ["أجهزة قياس", "أجهزة معايرة", "عدد يدوية", "عدد كهربائية", "معدات ميكانيكية", "معدات كهربائية", "صمامات", "توصيلات", "مقاييس ضغط", "قطع غيار", "قطع إلكترونية", "مواد استهلاكية"];
const TASK_PRIORITIES = ["عالية", "متوسطة", "منخفضة"];
const TASK_STATUSES = ["معلقة", "قيد التنفيذ", "مكتملة"];
const EVAL_CRITERIA = ["الانضباط والالتزام", "جودة العمل", "التعاون والعمل الجماعي", "المبادرة والإبداع", "الالتزام بالمواعيد"];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

// ========== الأدوات المشتركة ==========
const storage = {
  get: (key, def = null) => { try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : def; } catch { return def; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; } }
};

// تشغيل صوت تنبيه
function playAlert(type = "notification") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "message") { osc.frequency.value = 880; gain.gain.value = 0.1; }
    else if (type === "warning") { osc.frequency.value = 440; osc.type = "square"; gain.gain.value = 0.05; }
    else { osc.frequency.value = 660; gain.gain.value = 0.08; }
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

// طلب إذن الإشعارات وإرسالها
function sendDesktopNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(p => { if (p === "granted") new Notification(title, { body }); });
  }
}

function printElement(elementId, title = "تقرير") {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>${title}</title>
  <style>*{font-family:Arial,sans-serif;} body{padding:20mm;} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px;text-align:right} .no-print{display:none}</style></head>
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
  return (<button onClick={() => targetId ? printElement(targetId) : window.print()} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl shadow-sm border btn-secondary"><Printer size={13}/> {label}</button>);
}

// تصدير CSV
function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = [headers.join(","), ...data.map(r => headers.map(h => `"${(r[h]||"").toString().replace(/"/g,'""')}"`).join(","))];
  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
}

// ========== Firebase API (لا تغيير على منطق الأمان) ==========
const FirebaseAPI = {
  checkConnection: async () => {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`${FIREBASE_URL}/.json`, { signal: ctrl.signal });
      clearTimeout(tid);
      return res.ok;
    } catch { return false; }
  },
  savePassword: async (empId, encrypted) => {
    try { await fetch(`${FIREBASE_URL}/passwords/${empId}.json`, { method: "PUT", body: JSON.stringify(encrypted) }); return true; } catch { return false; }
  },
  getPassword: async (empId) => {
    try { const res = await fetch(`${FIREBASE_URL}/passwords/${empId}.json`); if (!res.ok) return null; const d = await res.json(); return typeof d === "string" ? d : null; } catch { return null; }
  },
  // Chat
  sendMessage: async (msg) => {
    try { await fetch(`${FIREBASE_URL}/chat.json`, { method: "POST", body: JSON.stringify(msg) }); return true; } catch { return false; }
  },
  getMessages: async (limit = 50) => {
    try { 
      const res = await fetch(`${FIREBASE_URL}/chat.json?orderBy="timestamp"&limitToLast=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data) return [];
      return Object.entries(data).map(([k,v]) => ({ ...v, _key: k })).sort((a,b) => a.timestamp - b.timestamp);
    } catch { return []; }
  },
};

// ========== Hook: حالة الاتصال ==========
function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const check = useCallback(async () => { setIsConnected(await FirebaseAPI.checkConnection()); }, []);
  useEffect(() => { check(); const t = setInterval(check, 30000); return () => clearInterval(t); }, [check]);
  return { isConnected };
}

// ========== Hook: الوضع الليلي ==========
function useDarkMode() {
  const [dark, setDark] = useState(() => storage.get("dark_mode", false));
  useEffect(() => {
    storage.set("dark_mode", dark);
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return [dark, setDark];
}

// ========== Hook: التنبيهات الذكية ==========
function useSmartAlerts(employees) {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const found = [];
    // مخزون منخفض
    const inv = storage.get("inventory_items", []);
    inv.filter(i => i.qty <= LOW_STOCK_THRESHOLD).forEach(i => {
      found.push({ id: `inv_${i.id}`, type: "warning", msg: `مخزون منخفض: ${i.name} (${i.qty} متبقي)` });
    });
    // طلبات معلقة أكثر من 3 أيام
    const allReq = storage.get("all_requests", []);
    const threeDaysAgo = Date.now() - 3 * 86400000;
    allReq.filter(r => r.status === "بانتظار المراجعة" && new Date(r.submittedAt).getTime() < threeDaysAgo).forEach(r => {
      found.push({ id: `req_${r.id}`, type: "info", msg: `طلب ${r.empName} معلق منذ أكثر من 3 أيام` });
    });
    setAlerts(found);
    if (found.length > 0) playAlert("warning");
  }, []);
  return alerts;
}

// ========== شاشة تسجيل الدخول ==========
function LoginScreen({ onLogin, dark }) {
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
        if (expiry > Date.now()) { const a = ACCOUNTS.find(x => x.id === acctId); if (a) onLogin(a); }
        else sessionStorage.removeItem("boc_session");
      }
    } catch {}
  }, [onLogin]);

  const handleLogin = async () => {
    setErr("");
    if (!user || !pass) { setErr("أدخل الرقم الوظيفي وكلمة المرور"); return; }
    const account = ACCOUNTS.find(a => a.jobNum === user.trim() || a.username === user.trim().toLowerCase());
    if (!account) { setErr("اسم المستخدم أو الرقم الوظيفي غير موجود"); return; }
    setLoading(true);
    let isValid = false;
    if (pass.trim() === account.password) isValid = true;
    if (!isValid) { const sp = storage.get(`pass_${account.id}`); if (sp && pass.trim() === sp) isValid = true; }
    if (!isValid && isConnected) { const fp = await FirebaseAPI.getPassword(account.id); if (fp && pass.trim() === fp) isValid = true; }
    if (isValid) {
      if (isConnected && pass.trim() === account.password) { await FirebaseAPI.savePassword(account.id, pass.trim()); storage.set(`pass_${account.id}`, pass.trim()); }
      sessionStorage.setItem("boc_session", JSON.stringify({ acctId: account.id, expiry: Date.now() + 8 * 3600000 }));
      const defaultPasswords = ["1001","1002","1003","1004","1005","1006","1007","1008","1009","1010","1011","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","3001","3002","3003","3004"];
      if (defaultPasswords.includes(pass.trim())) sessionStorage.setItem("force_password_change", "true");
      onLogin(account);
    } else { setErr("كلمة المرور غير صحيحة"); }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${dark ? "from-gray-900 to-gray-800" : "from-slate-900 to-slate-800"} flex items-center justify-center p-4`} dir="rtl">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4"><LogIn size={32} className="text-white"/></div>
          <h2 className="text-2xl font-bold text-white">شركة نفط البصرة</h2>
          <p className="text-sm text-slate-300 mt-2">شعبة مستودع الفاو</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {isConnected ? <><Wifi size={12} className="text-emerald-400"/><span className="text-xs text-emerald-400">متصل</span></> : <><WifiOff size={12} className="text-amber-400"/><span className="text-xs text-amber-400">غير متصل</span></>}
          </div>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-200 mb-2">اسم المستخدم أو الرقم الوظيفي</label>
            <input type="text" value={user} onChange={e=>setUser(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg" placeholder="i.shawi أو 728004" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
          <div><label className="block text-sm font-bold text-slate-200 mb-2">كلمة المرور</label>
            <div className="relative"><input type={showP?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              <button onClick={()=>setShowP(!showP)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showP?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
          {err && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16}/> {err}</div>}
          <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all text-lg">{loading?"جاري التحقق...":"تسجيل الدخول"}</button>
        </div>
        <div className="mt-6 text-center text-sm text-slate-400"><p>🔑 <strong className="text-blue-300">i.shawi</strong> | كلمة المرور: <strong className="text-blue-300">1001</strong></p></div>
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
      <div className="card rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 border-b border-color pb-3 mb-4"><div className="p-2 bg-blue-100 rounded-xl"><Shield size={20} className="text-blue-600"/></div><div><h2 className="font-bold">تغيير كلمة المرور</h2><p className="text-xs text-secondary">{emp.name}</p></div></div>
        <div className="space-y-4">
          <div><label className="text-sm font-bold block mb-1">كلمة المرور الجديدة</label><div className="relative"><input type={showN?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="أدخل كلمة المرور الجديدة" className="input w-full rounded-xl px-4 py-3 pl-10"/>
            <button onClick={()=>setShowN(!showN)} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">{showN?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
          <div><label className="text-sm font-bold block mb-1">تأكيد كلمة المرور</label><input type={showN?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="أعد إدخال كلمة المرور" className="input w-full rounded-xl px-4 py-3"/></div>
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
    const newReq = { id:Date.now(), ...formData, days, status:"بانتظار المراجعة", submittedAt:new Date().toISOString(), empId:emp.id, empName:emp.name };
    const allReqs = storage.get("all_requests", []);
    storage.set("all_requests", [newReq, ...allReqs]);
    setRequests([newReq, ...requests]);
    setShowForm(false);
    setFormData({ type:"اعتيادية", dateFrom:new Date().toISOString().slice(0,10), dateTo:new Date().toISOString().slice(0,10), purpose:"" });
    setErrors({});
    showToast("✅ تم إرسال طلبك بنجاح");
    sendDesktopNotification("طلب إجازة", "تم إرسال طلبك بنجاح وهو الآن بانتظار المراجعة");
    playAlert("notification");
  };

  const deleteRequest = (id) => {
    if(window.confirm("هل تريد حذف هذا الطلب؟")) {
      const updated = requests.filter(r => r.id !== id);
      setRequests(updated);
      storage.set(`requests_${emp.id}`, updated);
      showToast("✅ تم حذف الطلب");
    }
  };

  const getStatusBadge = (s) => s==="بانتظار المراجعة"?"bg-amber-100 text-amber-700":s==="موافق عليها"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">طلبات الإجازة</h3>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(requests.map(r=>({الاسم:r.empName,النوع:r.type,من:r.dateFrom,إلى:r.dateTo,أيام:r.days,الحالة:r.status})),"طلبات_الإجازة")} className="btn-secondary flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
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
      {requests.length===0?<div className="card rounded-2xl p-8 text-center border-color border"><FileText size={40} className="mx-auto mb-3 text-secondary"/><p className="text-secondary">لا توجد طلبات إجازة</p></div>:
      requests.map(req=>(<div key={req.id} className="card rounded-2xl p-4 border-color border"><div className="flex justify-between items-start">
        <div><div className="flex gap-2 mb-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${LEAVE_TYPES[req.type]?.color}`}>{LEAVE_TYPES[req.type]?.label}</span><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>{req.status}</span></div>
        <p className="text-sm">من {req.dateFrom} إلى {req.dateTo} — {req.days} يوم</p><p className="text-xs text-secondary mt-1">{req.purpose}</p></div>
        {req.status==="بانتظار المراجعة" && <button onClick={()=>deleteRequest(req.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>}</div></div>))}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
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
    requests.map(req=>(<div key={req.id} className="card rounded-2xl p-4 border-color border"><div className="flex justify-between"><div><p className="font-bold">{req.empName}</p><p className="text-sm">{req.type} — {req.days} يوم</p><p className="text-xs text-secondary">{req.purpose}</p>
    <p className="text-xs text-secondary mt-1">{new Date(req.submittedAt).toLocaleDateString("ar-IQ")}</p></div>
    <div className="flex gap-2 items-start"><button onClick={()=>updateStatus(req.id,"موافق عليها")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">قبول</button><button onClick={()=>updateStatus(req.id,"مرفوضة")} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs">رفض</button></div></div></div>))}
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
function AttendanceSystem({ emp, isAdmin, allEmployees }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selEmpId, setSelEmpId] = useState(isAdmin ? null : emp.id);
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0,10));
  const [dailyRecords, setDailyRecords] = useState(() => storage.get(`attendance_${emp.id}`, {}));
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const daysInMonth = new Date(selYear, selMonth+1, 0).getDate();

  useEffect(() => { storage.set(`attendance_${emp.id}`, dailyRecords); }, [dailyRecords, emp.id]);

  const handleCheckIn = () => {
    const t = new Date().toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit" });
    setDailyRecords({ ...dailyRecords, [selectedDate]: { ...(dailyRecords[selectedDate]||{}), checkIn: t, status:"حاضر" } });
    showToast("✅ تم تسجيل دخولك بنجاح"); playAlert("notification");
  };
  const handleCheckOut = () => {
    const t = new Date().toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit" });
    if (!dailyRecords[selectedDate]?.checkIn) { showToast("⚠️ يجب تسجيل الدخول أولاً"); return; }
    setDailyRecords({ ...dailyRecords, [selectedDate]: { ...dailyRecords[selectedDate], checkOut: t } });
    showToast("✅ تم تسجيل خروجك بنجاح"); playAlert("notification");
  };

  const stats = { حاضر: 0, غائب: 0 };
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (dailyRecords[k]?.checkIn) stats.حاضر++; else stats.غائب++;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{MONTHS_AR.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
          {isAdmin && <select value={selEmpId||""} onChange={e=>setSelEmpId(Number(e.target.value)||null)} className="input rounded-xl px-3 py-2 text-sm min-w-[180px]"><option value="">-- اختر موظفاً --</option>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}</select>}
        </div>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{const k=`${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;const r=dailyRecords[k]||{};return{اليوم:d,التاريخ:k,دخول:r.checkIn||"—",خروج:r.checkOut||"—",الحالة:r.checkIn?"حاضر":"غائب"}}),"سجل_الحضور")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
          <PrintButton targetId="print-attendance" label="طباعة التقرير"/>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-100"><p className="text-2xl font-bold text-emerald-700">{stats.حاضر}</p><p className="text-[10px] text-emerald-600">أيام الحضور</p></div>
        <div className="bg-red-50 rounded-2xl p-3 text-center border border-red-100"><p className="text-2xl font-bold text-red-700">{stats.غائب}</p><p className="text-[10px] text-red-600">أيام الغياب</p></div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-100"><p className="text-2xl font-bold text-blue-700">{Math.round(stats.حاضر/daysInMonth*100)}%</p><p className="text-[10px] text-blue-600">نسبة الحضور</p></div>
      </div>
      {(!isAdmin || selEmpId === emp.id) && (<div className="card rounded-2xl border-color border p-5"><h3 className="font-bold mb-3">تسجيل الحضور اليومي</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-xs font-bold text-secondary mb-1">التاريخ</label><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="input rounded-xl px-3 py-2"/></div>
          <div className="flex gap-2"><button onClick={handleCheckIn} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><LogIn size={14} className="inline ml-1"/> تسجيل دخول</button>
            <button onClick={handleCheckOut} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><LogOut size={14} className="inline ml-1"/> تسجيل خروج</button></div>
        </div>
        {dailyRecords[selectedDate]?.checkIn && <div className="mt-3 text-sm text-emerald-600">✅ تم تسجيل الدخول الساعة {dailyRecords[selectedDate].checkIn}</div>}
      </div>)}
      <div id="print-attendance" className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-opacity-50 border-b border-color"><th className="px-3 py-2">اليوم</th><th className="px-3 py-2">التاريخ</th><th className="px-3 py-2">دخول</th><th className="px-3 py-2">خروج</th><th className="px-3 py-2">الحالة</th></tr></thead>
        <tbody>{Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{const k=`${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const r=dailyRecords[k]||{};
          return(<tr key={day} className="border-b border-color"><td className="px-3 py-2">{new Date(k).toLocaleDateString("ar-IQ",{weekday:"short"})}</td><td className="px-3 py-2">{day}</td><td className="px-3 py-2">{r.checkIn||"—"}</td><td className="px-3 py-2">{r.checkOut||"—"}</td>
            <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.checkIn?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{r.checkIn?"حاضر":"غائب"}</span></td></tr>);})}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== نظام التدريب ==========
function TrainingSystem({ emp, isAdmin }) {
  const [trainings, setTrainings] = useState(() => storage.get(`trainings_${emp.id}`, []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"" });
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set(`trainings_${emp.id}`, trainings); }, [trainings, emp.id]);

  const addTraining = () => {
    if (!form.title) return showToast("عنوان التدريب مطلوب");
    setTrainings([{ ...form, id: Date.now(), status:"مسندة", assignedAt: new Date().toISOString() }, ...trainings]);
    setForm({ title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"" });
    setShowForm(false); showToast("✅ تم إضافة التدريب");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">المهام التدريبية</h3>
        <div className="flex gap-2">{isAdmin && <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>}
        <PrintButton targetId="print-training" label="طباعة"/></div></div>
      {showForm && isAdmin && (<div className="card rounded-2xl border-2 border-violet-200 p-5">
        <div className="grid grid-cols-2 gap-3">
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان التدريب" className="input rounded-xl px-3 py-2 text-sm col-span-2"/>
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="input rounded-xl px-3 py-2 text-sm">{TRAINING_TYPES.map(t=><option key={t}>{t}</option>)}</select>
          <input value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} placeholder="الجهة المقدمة" className="input rounded-xl px-3 py-2 text-sm"/>
          <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input rounded-xl px-3 py-2 text-sm"/>
          <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input rounded-xl px-3 py-2 text-sm"/>
          <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} placeholder="وصف التدريب" className="input rounded-xl px-3 py-2 text-sm col-span-2"/>
        </div>
        <div className="flex gap-2 justify-end mt-4"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm text-secondary btn-secondary rounded-xl border">إلغاء</button><button onClick={addTraining} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> إضافة</button></div>
      </div>)}
      <div id="print-training" className="space-y-3">{trainings.length===0?<div className="card rounded-2xl p-10 text-center border-color border"><GraduationCap size={40} className="text-secondary mx-auto"/><p className="text-secondary">لا توجد مهام تدريبية</p></div>:
        trainings.map(t=>(<div key={t.id} className="card rounded-2xl border-color border p-4"><div className="flex justify-between">
          <div><div className="flex gap-2 mb-1"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status==="مكتملة"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{t.status}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700">{t.type}</span></div>
            <p className="font-bold">{t.title}</p>{t.desc && <p className="text-xs text-secondary mt-1">{t.desc}</p>}
            <div className="flex gap-3 text-[10px] text-secondary mt-2">{t.startDate && <span>📅 من {t.startDate}</span>}{t.endDate && <span>إلى {t.endDate}</span>}</div></div>
          {isAdmin && t.status!=="مكتملة" && <button onClick={()=>setTrainings(trainings.map(x=>x.id===t.id?{...x,status:"مكتملة"}:x))} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs"><CheckCircle size={12}/> إكمال</button>}</div></div>))}</div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد المخزن ==========
function InventorySystem() {
  const [items, setItems] = useState(() => storage.get("inventory_items", [
    // ═══ أجهزة القياس والمعايرة ═══
    {id:1,   code:"2301280010", name:"مقاومة متغيرة",                       category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"2489"},
    {id:2,   code:"2301243008", name:"مولد ذبذبات",                          category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"JB21280"},
    {id:3,   code:"2309443025", name:"جهاز معايرة مقياس الضغط",             category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"2605079"},
    {id:4,   code:"2309443011", name:"جهاز معايرة مقياس الضغط",             category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"12064"},
    {id:5,   code:"2301373023", name:"جهاز مقياس متعدد الاغراض",            category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"22460049"},
    {id:6,   code:"2301390031", name:"جهاز قياس الضغط بالاوزان",            category:"أجهزة معايرة",    qty:1,  condition:"تالف",        location:"شعبة الآلات الدقيقة", serialNo:"1B77"},
    {id:7,   code:"2308513026", name:"جهاز معايرة الضغوط",                  category:"أجهزة معايرة",    qty:1,  condition:"يحتاج صيانة", location:"ورشة الصيانة",         serialNo:"2414"},
    {id:8,   code:"2301493004", name:"جهاز معايرة المزدوجات درجة الحرارة",  category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"B3-C511"},
    {id:9,   code:"2301293019", name:"جهاز تمييز الحساسات الحرارية",        category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"2645"},
    {id:10,  code:"2335613000", name:"جهاز فحص الفولتيه",                   category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"SS22344089"},
    {id:11,  code:"2336263013", name:"جهاز كشف مسار القابولات",             category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"SS257676213"},
    {id:12,  code:"2335070006", name:"جهاز راسم الذبذبات",                  category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"RS-248-898"},
    {id:13,  code:"2311183002", name:"كاميرا تصوير حرارية",                 category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"TL-12513120"},
    {id:14,  code:"2503163065", name:"ايفو ميتر",                           category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"263458"},
    {id:15,  code:"",           name:"ايفو ميتر",                           category:"أجهزة قياس",      qty:1,  condition:"يحتاج صيانة", location:"ورشة الصيانة",         serialNo:"90410374"},
    {id:16,  code:"2501035893", name:"كوسرة طيارية",                        category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:17,  code:"2505133097", name:"منكنة",                               category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:18,  code:"2505503033", name:"جهاز ضغط يدوي هوائي",                category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"13104"},
    {id:19,  code:"2505503013", name:"جهاز ضغط يدوي هوائي",                category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"220828"},
    {id:20,  code:"2507973015", name:"جهاز ضغط هايدروليك",                 category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"17093"},
    {id:21,  code:"2507973016", name:"جهاز ضغط هايدروليك",                 category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"17077"},
    {id:22,  code:"2509133009", name:"جهاز معايرة الحرارة",                 category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"204822"},
    {id:23,  code:"2503303018", name:"جهاز معايرة الحرارة",                 category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"2594143"},
    {id:24,  code:"2503513013", name:"جهاز معايرة التيار الكهربائي الواطئ", category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"2029006"},
    {id:25,  code:"2511233055", name:"كلاب ميتر",                           category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"1400004"},
    {id:26,  code:"2511090188", name:"ميتر",                                category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"MEQ-2"},
    {id:27,  code:"2504786015", name:"ضاغطة هواء",                         category:"معدات ميكانيكية", qty:1,  condition:"يحتاج صيانة", location:"ورشة الصيانة"},
    {id:28,  code:"2505073613", name:"مقياس ضغط هايدروليك",                category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"2605162"},
    {id:29,  code:"2510593033", name:"جهاز قياس الحرارة",                   category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"12157"},
    {id:30,  code:"2503303032", name:"جهاز قياس الحرارة الدقيق",            category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"227-005"},
    {id:31,  code:"",           name:"دريل كهربائي",                        category:"عدد كهربائية",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:32,  code:"",           name:"منفاخ هواء",                         category:"عدد كهربائية",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:33,  code:"2313973022", name:"ماكنة لحام",                          category:"عدد كهربائية",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:34,  code:"",           name:"جهاز معايرة هايدروليك",               category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"S.N117079/17092"},
    {id:35,  code:"",           name:"جهاز معايرة هوائي",                   category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"S.N2041104"},
    {id:36,  code:"",           name:"جهاز معايرة الحراري",                 category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"S.N2034224"},
    {id:37,  code:"",           name:"جهاز معايرة الحراري BL-7",            category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"S.N2642"},
    {id:38,  code:"",           name:"جهاز معايرة ضغط بالاوزان",            category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"S.N3164"},
    {id:39,  code:"2624033",    name:"جهاز متعدد الاغراض مع قياس الضغط",   category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"FLUKE726"},
    {id:40,  code:"26242703",   name:"جهاز متعدد الاغراض مع قياس الضغط",   category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"FLUKE700P27"},
    {id:41,  code:"",           name:"جهاز معايرة الضغط بالهواء",           category:"أجهزة معايرة",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"S.N13081"},
    // ═══ الصمامات والتوصيلات ═══
    {id:42,  code:"5869856100", name:"VALVE SOLINOID EXPROOF 3WA",          category:"صمامات",          qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:43,  code:"5899710065", name:"VALVE NEEDLE",                        category:"صمامات",          qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:44,  code:"5869892300", name:"VALVE SWITCHING",                     category:"صمامات",          qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:45,  code:"5869996510", name:"VALVE CHAAK INODC250",                category:"صمامات",          qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:46,  code:"5869856050", name:"NEEDLE SOLINOID 1/2 TUBE",            category:"صمامات",          qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:47,  code:"5883202040", name:"NEEDLE VALVE P-N215129",               category:"صمامات",          qty:4,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:48,  code:"5889835125", name:"NEEDLE VALVE P-N915370",               category:"صمامات",          qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:49,  code:"5863208250", name:"NEEDLE VALVE 4F-V6LN-SS",             category:"صمامات",          qty:21, condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:50,  code:"00-036-3401", name:"FNPTV BALL 1/2 NEEDLE",              category:"صمامات",          qty:7,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:51,  code:"",           name:"ايفو ميتر",                           category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"57440394"},
    {id:52,  code:"",           name:"FLUKE 9110016",                       category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة", serialNo:"9110016"},
    {id:53,  code:"",           name:"صمام ذاتي التفريق",                   category:"صمامات",          qty:1,  condition:"تالف",        location:"شعبة الآلات الدقيقة"},
    // ═══ عدد يدوية وأدوات ═══
    {id:54,  code:"",           name:"قلم حديد",                            category:"عدد يدوية",       qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:55,  code:"",           name:"عدة قلم حديد مختلفة",                 category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:56,  code:"",           name:"كاغد جام",                            category:"مواد استهلاكية",  qty:8,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:57,  code:"",           name:"فرشاة سيم",                           category:"عدد يدوية",       qty:6,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:58,  code:"",           name:"شريط صمغ",                            category:"مواد استهلاكية",  qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:59,  code:"",           name:"عدة غلقوز",                           category:"عدد يدوية",       qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:60,  code:"",           name:"منكنة بوري",                          category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:61,  code:"",           name:"منظم ضغط نيتروجين",                  category:"معدات ميكانيكية", qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:62,  code:"",           name:"برغي مختلف الاحجام",                  category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:63,  code:"",           name:"تيب حراري",                           category:"مواد استهلاكية",  qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:64,  code:"",           name:"درنفيس فحص",                          category:"عدد يدوية",       qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:65,  code:"",           name:"لاوي مع مقص",                         category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:66,  code:"",           name:"بكرة كيبل سيار",                      category:"معدات كهربائية",  qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:67,  code:"",           name:"منشار كهربائي",                       category:"عدد كهربائية",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:68,  code:"",           name:"عدة اخراج بوري حديد",                 category:"عدد يدوية",       qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:69,  code:"",           name:"واشر ربل دايفرام",                    category:"قطع غيار",        qty:10, condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:70,  code:"",           name:"ريكريتر كبير",                        category:"قطع غيار",        qty:3,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:71,  code:"",           name:"بوري انبوب 6 متر",                    category:"معدات ميكانيكية", qty:20, condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:72,  code:"",           name:"افيوميتر لون ازرق",                   category:"أجهزة قياس",      qty:2,  condition:"تالف",        location:"شعبة الآلات الدقيقة"},
    {id:73,  code:"",           name:"ريكوليتر لون اسود صغير",              category:"قطع غيار",        qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:74,  code:"",           name:"كرنات",                               category:"عدد يدوية",       qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:75,  code:"",           name:"برشر سويج",                           category:"معدات ميكانيكية", qty:3,  condition:"تالف",        location:"شعبة الآلات الدقيقة"},
    {id:76,  code:"",           name:"سبانة حجم 55",                        category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:77,  code:"",           name:"رافعة هايدروليك",                     category:"معدات ميكانيكية", qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:78,  code:"",           name:"حجر كوسرة",                           category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:79,  code:"",           name:"ربت (2 كارتون)",                       category:"مواد استهلاكية",  qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:80,  code:"",           name:"عدة النكي",                           category:"عدد يدوية",       qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:81,  code:"",           name:"عدة لغم",                             category:"عدد يدوية",       qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:82,  code:"",           name:"عدة سباين مختلفة",                    category:"عدد يدوية",       qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:83,  code:"",           name:"مبرد (كارتون)",                        category:"مواد استهلاكية",  qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:84,  code:"",           name:"برينة مختلفة الحجم",                  category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:85,  code:"",           name:"عدة درنفيس مختلفة الحجم",             category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:86,  code:"",           name:"تفلون (كارتون)",                       category:"مواد استهلاكية",  qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:87,  code:"",           name:"كلوب صغير (كارتون)",                  category:"عدد يدوية",       qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:88,  code:"",           name:"صولدر (صغير)",                        category:"مواد استهلاكية",  qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:89,  code:"",           name:"شريط ربط حجم صغير",                  category:"مواد استهلاكية",  qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:90,  code:"",           name:"توصالة ترامل",                        category:"معدات كهربائية",  qty:1,  condition:"جيد",         location:"استخدام دائمي"},
    {id:91,  code:"",           name:"تيغة (كارتون)",                        category:"مواد استهلاكية",  qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:92,  code:"",           name:"واير لحيم (كارتون)",                   category:"مواد استهلاكية",  qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:93,  code:"",           name:"فرش صبغ (كارتون)",                     category:"مواد استهلاكية",  qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:94,  code:"",           name:"كابسة ربت",                           category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:95,  code:"",           name:"مسدس صمغ",                            category:"عدد يدوية",       qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:96,  code:"",           name:"برينة صغيرة",                         category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:97,  code:"",           name:"قلقوز",                               category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:98,  code:"",           name:"كماشة",                               category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:99,  code:"",           name:"عدة استخراج ربل",                     category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:100, code:"",           name:"منشار تيغة",                          category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:101, code:"",           name:"كماشة حجم كبير",                      category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:102, code:"",           name:"جاكوج",                               category:"عدد يدوية",       qty:3,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:103, code:"",           name:"كبان كبير",                           category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:104, code:"",           name:"كاوية لحيم",                          category:"عدد كهربائية",    qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:105, code:"",           name:"سكور سبانة كبير",                     category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:106, code:"",           name:"كندك كبير",                           category:"عدد يدوية",       qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    // ═══ مقاييس الضغط (كيج) ═══
    {id:107, code:"",           name:"كيج 30 psi صغير",                     category:"مقاييس ضغط",      qty:6,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:108, code:"",           name:"كيج 60 psi صغير",                     category:"مقاييس ضغط",      qty:25, condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:109, code:"",           name:"كيج 30 psi صغير (نوع ثاني)",          category:"مقاييس ضغط",      qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:110, code:"",           name:"كيج kgf/cm² 250 كبير",                category:"مقاييس ضغط",      qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:111, code:"",           name:"كيج 25 kg/cm² كبير",                  category:"مقاييس ضغط",      qty:8,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    // ═══ صمامات إضافية ═══
    {id:112, code:"",           name:"صمام 1/2 HGVS12NC",                   category:"صمامات",          qty:14, condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:113, code:"",           name:"صمام مختلف الاستخدام 5 اتجاهات كبير", category:"صمامات",          qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:114, code:"",           name:"مقياس ضغط برشر سويج",                 category:"مقاييس ضغط",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:115, code:"",           name:"عكس مختلف حرف T",                     category:"توصيلات",         qty:150,condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:116, code:"",           name:"عكس مختلف حرف L",                     category:"توصيلات",         qty:110,condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:117, code:"",           name:"نبلة مختلف الاستخدام والاحجام",        category:"توصيلات",         qty:100,condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:118, code:"",           name:"كيج 50 KG",                           category:"مقاييس ضغط",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:119, code:"",           name:"كيج 25 psi وسط",                      category:"مقاييس ضغط",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:120, code:"",           name:"مرسلة ضغط",                           category:"أجهزة قياس",      qty:7,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:121, code:"",           name:"مرسلة جريان",                         category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:122, code:"584-5002-529", name:"كيج 10 Kg كبير",                    category:"مقاييس ضغط",      qty:9,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:123, code:"",           name:"كيج 16 Kg كبير",                      category:"مقاييس ضغط",      qty:10, condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:124, code:"",           name:"كيج 100°C كبير",                      category:"مقاييس ضغط",      qty:2,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    // ═══ قطع إلكترونية ومتنوعة ═══
    {id:125, code:"",           name:"PIC كارت",                            category:"قطع إلكترونية",   qty:8,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:126, code:"",           name:"لوحة اشارة",                          category:"قطع إلكترونية",   qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:127, code:"",           name:"مفتاح تشغيل",                         category:"قطع إلكترونية",   qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:128, code:"",           name:"ثرموستات متحسس حرارة RTD",            category:"قطع إلكترونية",   qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:129, code:"",           name:"بريس ضغط",                            category:"أجهزة قياس",      qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:130, code:"",           name:"رولة صبغ حجم صغير",                   category:"مواد استهلاكية",  qty:1,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:131, code:"",           name:"متحكم ضغط",                           category:"قطع إلكترونية",   qty:3,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:132, code:"",           name:"بايب سبانة قياس 8 انج",               category:"عدد يدوية",       qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:133, code:"",           name:"بايب سبانة قياس 10 انج",              category:"عدد يدوية",       qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:134, code:"",           name:"كندك قياس مختلف الاحجام",             category:"عدد يدوية",       qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:135, code:"",           name:"قاشطة متعددة",                        category:"عدد يدوية",       qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:136, code:"",           name:"كابسة ترامل",                         category:"معدات كهربائية",  qty:5,  condition:"جيد",         location:"شعبة الآلات الدقيقة"},
    {id:137, code:"0020261519", name:"عكس سبيل",                            category:"توصيلات",         qty:12, condition:"جيد",         location:"شعبة الآلات الدقيقة"},
  ]));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"", minQty:3, serialNo:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("inventory_items", items); }, [items]);

  const categories = ["الكل", ...INVENTORY_CATS];
  const filtered = items.filter(i => (i.name.includes(search)||i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  const lowStock = items.filter(i => i.qty <= (i.minQty || LOW_STOCK_THRESHOLD));

  const saveItem = () => {
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false); showToast("✅ تم الحفظ");
  };

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-600 shrink-0"/><div><p className="text-xs font-bold text-amber-800">تنبيه مخزون منخفض ({lowStock.length} صنف)</p><p className="text-xs text-amber-700">{lowStock.map(i=>i.name).join(" • ")}</p></div></div>}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1"><div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(items.map(i=>({الرمز:i.code,الاسم:i.name,رقم_الصنع:i.serialNo||"",الفئة:i.category,الكمية:i.qty,الحالة:i.condition,الموقع:i.location})),"المخزون_شعبة_الآلات_الدقيقة")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
          <button onClick={()=>{setAdding(true);setForm({code:"",name:"",category:"أجهزة قياس",qty:1,condition:"جيد",location:"شعبة الآلات الدقيقة",minQty:3,serialNo:""});}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>
          <PrintButton targetId="print-inventory" label="طباعة"/></div>
      </div>
      {(adding||editId) && (<div className="card rounded-2xl border-2 border-blue-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة صنف":"تعديل صنف"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["الرمز الرمزي","code"],["الاسم *","name"],["رقم الصنع","serialNo"],["الكمية","qty"],["الحد الأدنى","minQty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>))}
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الفئة</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{INVENTORY_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
      <div id="print-inventory" className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-color"><th className="px-3 py-2">الرمز</th><th className="px-3 py-2">الاسم</th><th className="px-3 py-2">رقم الصنع</th><th className="px-3 py-2">الفئة</th><th className="px-3 py-2">الكمية</th><th className="px-3 py-2">الحالة</th><th className="px-3 py-2">الموقع</th><th className="px-3 py-2 no-print">إجراءات</th></tr></thead>
        <tbody>{filtered.map(it=>(<tr key={it.id} className={`border-b border-color ${it.qty<=(it.minQty||3)?"bg-amber-50/50":""}`}>
          <td className="px-3 py-2 font-mono text-[10px]">{it.code||"—"}</td><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2 font-mono text-[10px] text-secondary">{it.serialNo||"—"}</td><td className="px-3 py-2">{it.category}</td>
          <td className="px-3 py-2 font-bold">{it.qty} {it.qty<=(it.minQty||3)&&<span className="text-amber-500">⚠️</span>}</td>
          <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":it.condition==="تالف"||it.condition==="تم الشطب"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
          <td className="px-3 py-2 text-[10px]">{it.location}</td>
          <td className="px-3 py-2 no-print"><div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>{if(window.confirm("حذف؟"))setItems(items.filter(i=>i.id!==it.id));}} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td></tr>))}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد الأثاث ==========
function FurnitureInventory() {
  const [items, setItems] = useState(() => storage.get("furniture_items", [
    // ═══ أجهزة تكييف وتبريد ═══
    {id:1,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:2,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:3,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:4,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:5,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:6,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:7,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تالف",        location:"المخزن"},
    {id:8,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تالف",        location:"المخزن"},
    {id:9,  code:"1504688400",   name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:10, code:"1504688401",   name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:11, code:"1523114957",   name:"مروحة عمودية",                  category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:12, code:"1523114958",   name:"مروحة عمودية",                  category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:13, code:"1515674402",   name:"ثلاجة عمودية فستل 16 قدم",     category:"أجهزة منزلية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    // ═══ أثاث مكتبي - منضدات ═══
    {id:14, code:"1402228079",   name:"منضدة كتابة 160 م",             category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:15, code:"1402228080",   name:"منضدة كتابة 160 م",             category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:16, code:"1402035187",   name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:17, code:"1402035188",   name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:18, code:"1402035189",   name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:19, code:"1402035190",   name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:20, code:"1402024339",   name:"كرسي دوار جلد",                 category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:21, code:"1402024340",   name:"كرسي دوار جلد",                 category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:22, code:"1402214928",   name:"مكتبة خشب",                    category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:23, code:"1402214929",   name:"مكتبة خشب",                    category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:24, code:"1402284803",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:25, code:"لا يوجد",      name:"سرير منام",                     category:"أثاث مكتبي",     qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:26, code:"لا يوجد",      name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:3, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:27, code:"لا يوجد",      name:"كرسي دوار جلد",                 category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    // ═══ أجهزة حاسوب ومعدات مكتبية ═══
    {id:28, code:"",             name:"حاسبة HP",                      category:"أجهزة حاسوب",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:29, code:"1901114388",   name:"طابعة كانون",                   category:"معدات مكتبية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    // ═══ أجهزة تكييف إضافية ═══
    {id:30, code:"لا يوجد",      name:"مكيف هواء كرافت 1.5 طن",        category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:31, code:"1513674126",   name:"ثلاجة فستل 9 قدم",              category:"أجهزة منزلية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:32, code:"1403114492",   name:"مكنسة كهربائية",                category:"معدات مكتبية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:33, code:"لا يوجد",      name:"مدفأة زيتية",                   category:"أجهزة منزلية",   qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:34, code:"لا يوجد",      name:"سخان ماء",                      category:"أجهزة منزلية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:35, code:"1403014212",   name:"طباخ كهربائي",                  category:"أجهزة منزلية",   qty:1, condition:"تالف",        location:"المخزن"},
    {id:36, code:"1403024031",   name:"فرن كهربائي",                   category:"أجهزة منزلية",   qty:1, condition:"تالف",        location:"المخزن"},
    // ═══ منضدات ومزيد من الأثاث ═══
    {id:37, code:"1402139368",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:38, code:"1402139370",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:39, code:"1402139371",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:40, code:"1402139372",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:41, code:"1402139369",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:42, code:"1402123785",   name:"منضدة كتابة خشب",               category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:43, code:"1402123786",   name:"منضدة كتابة خشب",               category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:44, code:"1402208897",   name:"مكتبة بابين",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:45, code:"1402208898",   name:"مكتبة بابين",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:46, code:"14022149284929",name:"مكتبة بابين",                  category:"أثاث مكتبي",     qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:47, code:"1402203092",   name:"مكتبة بابين",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:48, code:"1402208899",   name:"مكتبة بابين",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:49, code:"1402225456",   name:"منضدة كتابة مع ملحق",            category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:50, code:"1402225457",   name:"منضدة كتابة مع ملحق",            category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:51, code:"1401644198",   name:"كرسي بلاستك",                   category:"أثاث مكتبي",     qty:13,condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:52, code:"1504443042",   name:"سبلت 4 طن LG",                  category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:53, code:"1402198907",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:54, code:"1402198908",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:55, code:"1402198909",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:56, code:"1402194054",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:57, code:"1522042001",   name:"براد ماء",                      category:"أجهزة منزلية",   qty:1, condition:"تالف",        location:"المخزن"},
    {id:58, code:"1402113052",   name:"منضدة عمل",                     category:"أثاث مكتبي",     qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:59, code:"05K130042835", name:"مروحة عمودية",                  category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:60, code:"1401263016",   name:"شمعة ملابس",                    category:"أثاث مكتبي",     qty:4, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:61, code:"1402193333",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:62, code:"1402033212",   name:"كرسي ذو مسند",                  category:"أثاث مكتبي",     qty:6, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:63, code:"1402033212",   name:"كرسي ذو مسند",                  category:"أثاث مكتبي",     qty:6, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:64, code:"1402133738",   name:"منضدة كتابة خشب",               category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"المخزن"},
    {id:65, code:"1402134055",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
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
  const filtered = items.filter(i => (i.name.includes(search)||i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));

  const saveItem = () => {
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false); showToast("✅ تم الحفظ");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1"><div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(items.map(i=>({الرمز:i.code,الاسم:i.name,الفئة:i.category,الكمية:i.qty,الحالة:i.condition,الموقع:i.location})),"الأثاث")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
          <button onClick={()=>{setAdding(true);setForm({code:"",name:"",category:"أثاث مكتبي",qty:1,condition:"جيد",location:""});}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>
          <PrintButton targetId="print-furniture" label="طباعة"/></div>
      </div>
      {(adding||editId) && (<div className="card rounded-2xl border-2 border-violet-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة قطعة":"تعديل قطعة"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["الرمز *","code"],["الاسم *","name"],["الكمية","qty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>))}
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div></div>
        <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
      <div id="print-furniture" className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-color"><th className="px-3 py-2">الرمز</th><th className="px-3 py-2">الاسم</th><th className="px-3 py-2">الفئة</th><th className="px-3 py-2">الكمية</th><th className="px-3 py-2">الحالة</th><th className="px-3 py-2">الموقع</th><th className="px-3 py-2 no-print">إجراءات</th></tr></thead>
        <tbody>{filtered.map(it=>(<tr key={it.id} className="border-b border-color"><td className="px-3 py-2 font-mono">{it.code}</td><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2">{it.category}</td><td className="px-3 py-2 font-bold">{it.qty}</td>
          <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
          <td className="px-3 py-2">{it.location}</td><td className="px-3 py-2 no-print"><div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>{if(window.confirm("حذف؟"))setItems(items.filter(i=>i.id!==it.id));}} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td></tr>))}</tbody></table></div></div>
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
  return (<div className="space-y-4">
    <div className="flex gap-3"><div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
      <button onClick={()=>exportCSV(employees.map(e=>({الاسم:e.name,الرقم:e.jobNum,المسمى:e.title,القسم:e.dept,النوبة:e.shift})),"الموظفون")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/></button>
      <button onClick={()=>{setAdding(true);setForm({name:"",jobNum:"",title:"",dept:"قسم السيطرة والنظم",shift:"صباحي"});}} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-1"><Plus size={14}/> إضافة</button></div>
    {(adding||editId) && (<div className="card rounded-2xl border-color border p-5"><div className="grid grid-cols-2 gap-3">
      <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم" className="input rounded-xl px-3 py-2"/>
      <input value={form.jobNum} onChange={e=>setForm({...form,jobNum:e.target.value})} placeholder="الرقم الوظيفي" className="input rounded-xl px-3 py-2"/>
      <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="المسمى" className="input rounded-xl px-3 py-2"/>
      <select value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} className="input rounded-xl px-3 py-2"><option>قسم السيطرة والنظم</option><option>شعبة مستودع الفاو</option><option>شعبة المرافئ</option></select>
      <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} className="input rounded-xl px-3 py-2"><option>صباحي</option><option>مناوبة</option></select></div>
      <div className="flex gap-2 mt-4"><button onClick={()=>{setAdding(false);setEditId(null);}} className="flex-1 py-2 border border-color rounded-xl">إلغاء</button><button onClick={saveEmp} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">حفظ</button></div></div>)}
    <div className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-color"><th className="px-3 py-2">الاسم</th><th className="px-3 py-2">الرقم</th><th className="px-3 py-2">المسمى</th><th className="px-3 py-2">القسم</th><th></th></tr></thead>
      <tbody>{filtered.map(e=><tr key={e.id} className="border-b border-color"><td className="px-3 py-2">{e.name}</td><td className="px-3 py-2">{e.jobNum}</td><td className="px-3 py-2">{e.title}</td><td className="px-3 py-2">{e.dept}</td>
        <td className="px-3 py-2"><button onClick={()=>{setEditId(e.id);setForm(e);}} className="text-blue-500"><Edit3 size={14}/></button></td></tr>)}</tbody></table></div></div>
  </div>);
}

// ========== لوحة التحكم التحليلية (جديدة) ==========
function AnalyticsDashboard({ employees, allRequests }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // بيانات الطلبات حسب الشهر
  const monthlyData = MONTHS_AR.slice(0, currentMonth+1).map((month, i) => {
    const monthReqs = allRequests.filter(r => {
      const d = new Date(r.submittedAt);
      return d.getMonth() === i && d.getFullYear() === currentYear;
    });
    return { month: month.slice(0,3), موافق: monthReqs.filter(r=>r.status==="موافق عليها").length, مرفوض: monthReqs.filter(r=>r.status==="مرفوضة").length, معلق: monthReqs.filter(r=>r.status==="بانتظار المراجعة").length };
  });

  // توزيع الطلبات حسب النوع
  const typeData = Object.entries(LEAVE_TYPES).map(([k, v]) => ({
    name: v.label, value: allRequests.filter(r => r.type === k).length
  })).filter(d => d.value > 0);

  // حالة المخزون
  const invItems = storage.get("inventory_items", []);
  const condData = ITEM_CONDITIONS.map(c => ({ name: c, value: invItems.filter(i => i.condition === c).length })).filter(d => d.value > 0);

  // KPIs
  const pendingReqs = allRequests.filter(r => r.status === "بانتظار المراجعة").length;
  const approvedReqs = allRequests.filter(r => r.status === "موافق عليها").length;
  const totalInv = invItems.reduce((s, i) => s + Number(i.qty), 0);
  const lowStockCount = invItems.filter(i => i.qty <= (i.minQty || LOW_STOCK_THRESHOLD)).length;

  const kpis = [
    { label: "إجمالي الموظفين", value: employees.length, icon: <Users size={24}/>, color: "from-blue-500 to-blue-600" },
    { label: "طلبات معلقة", value: pendingReqs, icon: <Clock size={24}/>, color: "from-amber-500 to-amber-600" },
    { label: "طلبات مقبولة", value: approvedReqs, icon: <CheckCircle size={24}/>, color: "from-emerald-500 to-emerald-600" },
    { label: "مخزون منخفض", value: lowStockCount, icon: <AlertTriangle size={24}/>, color: "from-red-500 to-red-600" },
    { label: "إجمالي المخزون", value: totalInv, icon: <Package size={24}/>, color: "from-violet-500 to-violet-600" },
    { label: "مشرفين النظام", value: employees.filter(e=>e.role==="admin").length, icon: <Shield size={24}/>, color: "from-indigo-500 to-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg">لوحة التحكم التحليلية</h3>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((k,i) => (<div key={i} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white`}>
          <div className="flex items-center justify-between"><div>{k.icon}</div><p className="text-3xl font-bold">{k.value}</p></div>
          <p className="text-sm mt-2 text-white/80">{k.label}</p>
        </div>))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">الطلبات الشهرية ({currentYear})</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ReBarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
              <XAxis dataKey="month" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip />
              <Bar dataKey="موافق" fill="#10b981" radius={[3,3,0,0]}/>
              <Bar dataKey="مرفوض" fill="#ef4444" radius={[3,3,0,0]}/>
              <Bar dataKey="معلق" fill="#f59e0b" radius={[3,3,0,0]}/>
            </ReBarChart>
          </ResponsiveContainer>
        </div>

        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">توزيع أنواع الإجازات</h4>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                  {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-secondary text-sm">لا توجد بيانات</div>}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">حالة المخزون</h4>
          {condData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={condData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                  {condData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[180px] flex items-center justify-center text-secondary text-sm">لا توجد بيانات</div>}
        </div>

        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">توزيع الموظفين حسب القسم</h4>
          <ResponsiveContainer width="100%" height={180}>
            <ReBarChart data={[...new Set(employees.map(e=>e.dept))].map(d=>({dept:d.replace("قسم ","").replace("شعبة ",""), عدد:employees.filter(e=>e.dept===d).length}))}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
              <XAxis dataKey="dept" tick={{fontSize:9}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip />
              <Bar dataKey="عدد" fill="#6366f1" radius={[3,3,0,0]}/>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ========== نظام المهام (جديد) ==========
function TasksSystem({ emp, isAdmin, allEmployees }) {
  const [tasks, setTasks] = useState(() => storage.get("tasks_system", []));
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("الكل");
  const [form, setForm] = useState({ title:"", desc:"", assignedTo:"", priority:"متوسطة", dueDate:"", status:"معلقة" });
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("tasks_system", tasks); }, [tasks]);

  const myTasks = tasks.filter(t => t.assignedTo === emp.id || (isAdmin && filter !== "الكل" ? t.status === filter : true));
  const displayed = isAdmin ? (filter==="الكل" ? tasks : tasks.filter(t=>t.status===filter)) : tasks.filter(t=>t.assignedTo===emp.id);

  const addTask = () => {
    if (!form.title) return showToast("عنوان المهمة مطلوب");
    const assignee = allEmployees.find(e => e.id === Number(form.assignedTo));
    const newTask = { ...form, id: Date.now(), createdBy: emp.name, createdAt: new Date().toISOString(), assignedToName: assignee?.name || "غير محدد" };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    // إشعار
    if (assignee) {
      const notifs = storage.get(`notifications_${assignee.id}`, []);
      storage.set(`notifications_${assignee.id}`, [{ id:Date.now(), type:"مهمة", title:"📋 مهمة جديدة", body:form.title, timestamp:new Date().toISOString(), read:false }, ...notifs]);
    }
    setShowForm(false); setForm({ title:"", desc:"", assignedTo:"", priority:"متوسطة", dueDate:"", status:"معلقة" });
    showToast("✅ تم إضافة المهمة"); playAlert("notification");
  };

  const updateStatus = (id, status) => {
    setTasks(tasks.map(t => t.id===id ? { ...t, status } : t));
    showToast(`✅ تم تحديث الحالة`);
  };

  const deleteTask = (id) => {
    if(window.confirm("حذف المهمة؟")) { setTasks(tasks.filter(t=>t.id!==id)); showToast("✅ تم الحذف"); }
  };

  const priorityColor = (p) => p==="عالية"?"bg-red-100 text-red-700":p==="متوسطة"?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700";
  const statusColor = (s) => s==="مكتملة"?"bg-emerald-100 text-emerald-700":s==="قيد التنفيذ"?"bg-blue-100 text-blue-700":"bg-slate-100 text-slate-700";

  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "مكتملة");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">نظام المهام</h3>
        <div className="flex gap-2">
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="input rounded-xl px-3 py-2 text-sm"><option>الكل</option>{TASK_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
          {isAdmin && <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 px-3 py-2 rounded-xl"><Plus size={13}/> مهمة جديدة</button>}
        </div>
      </div>

      {overdue.length > 0 && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-600 shrink-0"/><p className="text-xs font-bold text-red-800">{overdue.length} مهمة متأخرة: {overdue.map(t=>t.title).join(" • ")}</p></div>}

      {showForm && isAdmin && (
        <div className="card rounded-2xl border-2 border-emerald-200 p-5">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان المهمة *" className="input rounded-xl px-3 py-2 text-sm col-span-2"/>
            <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} placeholder="تفاصيل المهمة" className="input rounded-xl px-3 py-2 text-sm col-span-2"/>
            <select value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} className="input rounded-xl px-3 py-2 text-sm"><option value="">-- تعيين لـ --</option>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}</select>
            <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input rounded-xl px-3 py-2 text-sm">{TASK_PRIORITIES.map(p=><option key={p}>{p}</option>)}</select>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">تاريخ الاستحقاق</label><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="input rounded-xl px-3 py-2 text-sm w-full"/></div>
          </div>
          <div className="flex gap-2 justify-end mt-4"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={addTask} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl"><Save size={13}/> إضافة</button></div>
        </div>
      )}

      <div className="space-y-3">{displayed.length===0?<div className="card rounded-2xl p-8 text-center border-color border"><CheckSquare size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد مهام</p></div>:
        displayed.map(t=>(<div key={t.id} className={`card rounded-2xl border p-4 ${new Date(t.dueDate)<new Date()&&t.status!=="مكتملة"?"border-red-200":"border-color"}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1"><div className="flex flex-wrap gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityColor(t.priority)}`}>{t.priority}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(t.status)}`}>{t.status}</span>
              {t.dueDate && new Date(t.dueDate) < new Date() && t.status!=="مكتملة" && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">متأخرة</span>}
            </div>
            <p className="font-bold">{t.title}</p>
            {t.desc && <p className="text-xs text-secondary mt-1">{t.desc}</p>}
            <div className="flex gap-3 text-[10px] text-secondary mt-2">
              <span>👤 {t.assignedToName}</span>
              {t.dueDate && <span>📅 {t.dueDate}</span>}
              <span>بواسطة {t.createdBy}</span>
            </div></div>
            <div className="flex gap-1 mr-2">
              {t.status === "معلقة" && <button onClick={()=>updateStatus(t.id,"قيد التنفيذ")} className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px]">بدء</button>}
              {t.status === "قيد التنفيذ" && <button onClick={()=>updateStatus(t.id,"مكتملة")} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px]">إكمال</button>}
              {isAdmin && <button onClick={()=>deleteTask(t.id)} className="p-1 text-red-400"><Trash2 size={12}/></button>}
            </div>
          </div></div>))}</div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== الدردشة الداخلية (Firebase) (جديدة) ==========
function InternalChat({ emp, isConnected }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!isConnected) {
      setMessages(storage.get("chat_offline", []));
      return;
    }
    const msgs = await FirebaseAPI.getMessages(50);
    setMessages(msgs);
    storage.set("chat_offline", msgs);
  }, [isConnected]);

  useEffect(() => { loadMessages(); const t = setInterval(loadMessages, 5000); return () => clearInterval(t); }, [loadMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const msg = { text: text.trim(), sender: emp.name, senderId: emp.id, timestamp: Date.now(), dept: emp.dept };
    setText("");
    if (isConnected) { await FirebaseAPI.sendMessage(msg); await loadMessages(); }
    else { const offline = storage.get("chat_offline", []); storage.set("chat_offline", [...offline, { ...msg, _key: Date.now().toString() }]); setMessages(prev => [...prev, msg]); }
    playAlert("message");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">الدردشة الداخلية</h3>
        <div className="flex items-center gap-2 text-xs">{isConnected?<><Wifi size={12} className="text-emerald-500"/><span className="text-emerald-600">متصل</span></>:<><WifiOff size={12} className="text-amber-500"/><span className="text-amber-600">غير متصل (محلي)</span></>}</div>
      </div>
      <div className="flex-1 card rounded-2xl border-color border p-4 overflow-y-auto space-y-3">
        {messages.length === 0 && <div className="text-center text-secondary py-8"><MessageSquare size={40} className="mx-auto mb-2"/><p>لا توجد رسائل بعد</p></div>}
        {messages.map((m,i) => {
          const isMine = m.senderId === emp.id;
          return (<div key={m._key||i} className={`flex ${isMine?"justify-start":"justify-end"}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine?"bg-blue-600 text-white":"card border border-color"}`}>
              {!isMine && <p className="text-[10px] font-bold text-secondary mb-1">{m.sender}</p>}
              <p className="text-sm">{m.text}</p>
              <p className={`text-[10px] mt-1 ${isMine?"text-blue-200":"text-secondary"}`}>{new Date(m.timestamp).toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})}</p>
            </div>
          </div>);
        })}
        <div ref={bottomRef}/>
      </div>
      <div className="flex gap-2 mt-3">
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="اكتب رسالة..." className="input flex-1 rounded-xl px-4 py-3"/>
        <button onClick={send} disabled={!text.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"><Send size={18}/></button>
      </div>
    </div>
  );
}

// ========== التقييم الشهري (جديد) ==========
function EvaluationSystem({ emp, isAdmin, allEmployees }) {
  const [evals, setEvals] = useState(() => storage.get("evaluations", []));
  const [showForm, setShowForm] = useState(false);
  const [selEmp, setSelEmp] = useState("");
  const [selMonth, setSelMonth] = useState(new Date().getMonth());
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [scores, setScores] = useState(Object.fromEntries(EVAL_CRITERIA.map(c=>[c,3])));
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("evaluations", evals); }, [evals]);

  const saveEval = () => {
    if (!selEmp) return showToast("اختر الموظف");
    const emp2 = allEmployees.find(e=>e.id===Number(selEmp));
    const total = Math.round(Object.values(scores).reduce((s,v)=>s+v,0) / EVAL_CRITERIA.length * 20);
    const newEval = { id:Date.now(), empId:Number(selEmp), empName:emp2?.name, month:selMonth, year:selYear, scores:{...scores}, total, notes, evaluatedBy:emp.name, createdAt:new Date().toISOString() };
    setEvals([newEval, ...evals.filter(e=>!(e.empId===Number(selEmp)&&e.month===selMonth&&e.year===selYear))]);
    setShowForm(false); showToast("✅ تم حفظ التقييم");
  };

  const myEvals = isAdmin ? evals : evals.filter(e=>e.empId===emp.id);

  const gradeLabel = (s) => s>=90?"ممتاز":s>=75?"جيد جداً":s>=60?"جيد":s>=50?"مقبول":"ضعيف";
  const gradeColor = (s) => s>=90?"text-emerald-600":s>=75?"text-blue-600":s>=60?"text-amber-600":"text-red-600";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">التقييم الشهري</h3>
        {isAdmin && <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 px-3 py-2 rounded-xl"><Plus size={13}/> تقييم جديد</button>}
      </div>

      {showForm && isAdmin && (
        <div className="card rounded-2xl border-2 border-indigo-200 p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <select value={selEmp} onChange={e=>setSelEmp(e.target.value)} className="input rounded-xl px-3 py-2 text-sm"><option value="">-- اختر موظفاً --</option>{allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}</select>
            <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{MONTHS_AR.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
            <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="input rounded-xl px-3 py-2 text-sm">{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
          </div>
          <div className="space-y-3">
            {EVAL_CRITERIA.map(c => (<div key={c} className="flex items-center gap-3">
              <span className="text-sm flex-1">{c}</span>
              <div className="flex gap-1">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setScores({...scores,[c]:n})} className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${scores[c]>=n?"bg-indigo-600 text-white":"border border-color"}`}>{n}</button>)}</div>
            </div>))}
          </div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="ملاحظات التقييم" className="input rounded-xl px-3 py-2 text-sm w-full"/>
          <div className="flex gap-2 justify-end"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveEval} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl"><Save size={13}/> حفظ التقييم</button></div>
        </div>
      )}

      <div className="space-y-3">{myEvals.length===0?<div className="card rounded-2xl p-8 text-center border-color border"><Star size={40} className="mx-auto text-secondary"/><p className="text-secondary">لا توجد تقييمات</p></div>:
        myEvals.map(ev=>(<div key={ev.id} className="card rounded-2xl border-color border p-4">
          <div className="flex justify-between items-start">
            <div><p className="font-bold">{ev.empName}</p><p className="text-xs text-secondary">{MONTHS_AR[ev.month]} {ev.year} — بواسطة {ev.evaluatedBy}</p>
              {ev.notes && <p className="text-xs text-secondary mt-1 italic">{ev.notes}</p>}
              <div className="flex flex-wrap gap-2 mt-2">{EVAL_CRITERIA.map(c=><span key={c} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{c}: {ev.scores[c]}/5</span>)}</div>
            </div>
            <div className="text-center"><p className={`text-3xl font-bold ${gradeColor(ev.total)}`}>{ev.total}%</p><p className={`text-xs font-bold ${gradeColor(ev.total)}`}>{gradeLabel(ev.total)}</p></div>
          </div></div>))}</div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== البحث الصوتي (جديد) ==========
function VoiceSearchBar({ onSearch, placeholder = "بحث..." }) {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("المتصفح لا يدعم البحث الصوتي"); return; }
    const recognition = new SR();
    recognition.lang = "ar-IQ";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => { const q = e.results[0][0].transcript; setQuery(q); onSearch(q); };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  return (
    <div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1">
      <Search size={14} className="text-secondary shrink-0"/>
      <input value={query} onChange={e=>{setQuery(e.target.value);onSearch(e.target.value);}} placeholder={placeholder} className="bg-transparent text-sm outline-none w-full"/>
      <button onClick={startVoice} className={`p-1 rounded-lg transition-colors ${listening?"text-red-500 animate-pulse":"text-secondary hover:text-blue-500"}`}>
        {listening ? <MicOff size={14}/> : <Mic size={14}/>}
      </button>
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

// ========== اللوحة الرئيسية ==========
function Dashboard({ emp, onLogout, dark, setDark }) {
  const [view, setView] = useState("home");
  const [allRequests, setAllRequests] = useState(() => storage.get("all_requests", []));
  const [employees, setEmployees] = useState(ACCOUNTS);
  const { isConnected } = useConnectionStatus();
  const smartAlerts = useSmartAlerts(employees);
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004" || emp.username === "i.shawi";
  const pendingCount = allRequests.filter(r => r.status === "بانتظار المراجعة").length;
  const unreadNotifs = (storage.get(`notifications_${emp.id}`, [])).filter(n => !n.read).length;

  useEffect(() => {
    const nc = sessionStorage.getItem("force_password_change");
    if (nc) { sessionStorage.removeItem("force_password_change"); setTimeout(() => { if(window.confirm("🔐 يرجى تغيير كلمة المرور الافتراضية")) setView("changepass"); }, 500); }
    // طلب إذن الإشعارات عند الدخول
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  // تحديث allRequests عند تغيير الـ view
  useEffect(() => { setAllRequests(storage.get("all_requests", [])); }, [view]);

  const menuItems = [
    { id:"home", label:"الرئيسية", icon:<Home size={17}/> },
    { id:"analytics", label:"لوحة التحليلات", icon:<BarChart size={17}/> },
    { id:"requests", label:"طلبات الإجازة", icon:<FileText size={17}/> },
    { id:"attendance", label:"الحضور", icon:<Calendar size={17}/> },
    { id:"training", label:"التدريب", icon:<GraduationCap size={17}/> },
    { id:"tasks", label:"المهام", icon:<CheckSquare size={17}/> },
    { id:"inventory", label:"جرد الآلات الدقيقة", icon:<Package size={17}/> },
    { id:"furniture", label:"جرد الأثاث 2025", icon:<ClipboardList size={17}/> },
    { id:"chat", label:"الدردشة", icon:<MessageSquare size={17}/> },
    { id:"evaluation", label:"التقييم", icon:<Star size={17}/> },
    { id:"notifications", label:"الإشعارات", icon:<Bell size={17}/>, badge:unreadNotifs },
    { id:"audit", label:"سجل التعديلات", icon:<ClipboardList size={17}/> },
    { id:"changepass", label:"تغيير المرور", icon:<Shield size={17}/> },
  ];
  if (isAdmin) {
    menuItems.unshift({ id:"approvals", label:"الموافقات", icon:<ThumbsUp size={17}/>, badge:pendingCount });
    menuItems.unshift({ id:"employees", label:"الموظفين", icon:<Users size={17}/> });
  }

  return (
    <div className="min-h-screen bg-main" dir="rtl">
      {/* Header */}
      <div className="header-bar px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-sm">BOC</span></div>
          <div><h1 className="font-bold">شركة نفط البصرة</h1><p className="text-xs text-secondary">شعبة مستودع الفاو</p></div>
        </div>
        <div className="flex items-center gap-3">
          {/* Smart Alerts badge */}
          {smartAlerts.length > 0 && <div className="relative"><AlertTriangle size={20} className="text-amber-500"/><span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{smartAlerts.length}</span></div>}
          {/* Connection */}
          <div className="flex items-center gap-1">{isConnected?<Wifi size={14} className="text-emerald-500"/>:<WifiOff size={14} className="text-amber-500"/>}</div>
          {/* Dark Mode Toggle */}
          <button onClick={()=>setDark(!dark)} className="p-2 rounded-xl btn-secondary border border-color">{dark?<Sun size={16}/>:<Moon size={16}/>}</button>
          <div className="text-left"><p className="text-sm font-bold">{emp.name.split(" ").slice(0,2).join(" ")}</p><p className="text-xs text-secondary">{emp.title}</p></div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="md:w-60 sidebar border-l min-h-screen p-3">
          <nav className="space-y-0.5">
            {menuItems.map(item => (
              <button key={item.id} onClick={()=>setView(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${view===item.id?"bg-blue-600 text-white":"text-secondary hover:bg-hover"}`}>
                <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
                {item.badge>0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{item.badge}</span>}
              </button>
            ))}
          </nav>
          {/* Smart Alerts */}
          {smartAlerts.length > 0 && <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-[10px] font-bold text-amber-800 mb-1">⚠️ تنبيهات ذكية</p>
            {smartAlerts.slice(0,3).map(a=><p key={a.id} className="text-[10px] text-amber-700 mt-1">{a.msg}</p>)}
          </div>}
          <div className="mt-3 p-3 bg-hover rounded-xl text-[10px]"><p className="font-bold mb-1">ℹ️ النظام</p><p>✓ يعمل بكفاءة</p><p>✓ البيانات محفوظة</p><p>✓ {isConnected?"متصل بالخادم":"وضع محلي"}</p></div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-5">
          {view==="home" && (
            <div className="space-y-5">
              <div className="card rounded-2xl p-6 border-color border">
                <div className="flex items-center gap-4"><div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center"><User size={28} className="text-white"/></div>
                  <div><h2 className="text-xl font-bold">مرحباً، {emp.name.split(" ")[0]}</h2><p className="text-secondary text-sm">{emp.title} — {emp.dept}</p><p className="text-secondary text-xs">{new Date().toLocaleDateString("ar-IQ",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p></div>
                </div>
              </div>
              {/* Quick Stats */}
              <AnalyticsDashboard employees={employees} allRequests={allRequests} />
            </div>
          )}
          {view==="analytics" && <AnalyticsDashboard employees={employees} allRequests={allRequests}/>}
          {view==="requests" && <RequestsPage emp={emp}/>}
          {view==="attendance" && <AttendanceSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>}
          {view==="training" && <TrainingSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>}
          {view==="tasks" && <TasksSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>}
          {view==="inventory" && <InventorySystem/>}
          {view==="furniture" && <FurnitureInventory/>}
          {view==="chat" && <InternalChat emp={emp} isConnected={isConnected}/>}
          {view==="evaluation" && <EvaluationSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>}
          {view==="notifications" && <NotificationsPage emp={emp}/>}
          {view==="audit" && <AuditLogPage/>}
          {view==="changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout}/>}
          {view==="employees" && isAdmin && <EmployeeManager employees={employees} setEmployees={setEmployees}/>}
          {view==="approvals" && isAdmin && <ApprovalsPage emp={emp}/>}
        </main>
      </div>
    </div>
  );
}

// ========== التطبيق الرئيسي ==========
export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useDarkMode();

  // CSS المتغيرات حسب الوضع
  const style = `
    :root { color-scheme: light; }
    .dark { color-scheme: dark; }
    .bg-main { background: ${dark?"#0f172a":"#f8fafc"}; }
    .card { background: ${dark?"#1e293b":"#ffffff"}; color: ${dark?"#e2e8f0":"#1e293b"}; }
    .header-bar { background: ${dark?"#1e293b":"#ffffff"}; border-bottom: 1px solid ${dark?"#334155":"#e2e8f0"}; }
    .sidebar { background: ${dark?"#1e293b":"#ffffff"}; }
    .input { background: ${dark?"#0f172a":"#ffffff"}; border: 1px solid ${dark?"#334155":"#e2e8f0"}; color: ${dark?"#e2e8f0":"#1e293b"}; }
    .input::placeholder { color: ${dark?"#64748b":"#94a3b8"}; }
    .btn-secondary { background: ${dark?"#1e293b":"#ffffff"}; color: ${dark?"#94a3b8":"#475569"}; }
    .bg-hover { background: ${dark?"#0f172a":"#f1f5f9"}; }
    .text-secondary { color: ${dark?"#64748b":"#64748b"}; }
    .border-color { border-color: ${dark?"#334155":"#e2e8f0"} !important; }
    select option { background: ${dark?"#1e293b":"#ffffff"}; color: ${dark?"#e2e8f0":"#1e293b"}; }
    * { transition: background-color 0.2s, border-color 0.2s, color 0.1s; }
  `;

  return (
    <>
      <style>{style}</style>
      {user 
        ? <Dashboard emp={user} onLogout={()=>{sessionStorage.clear();setUser(null);}} dark={dark} setDark={setDark}/>
        : <LoginScreen onLogin={setUser} dark={dark}/>
      }
    </>
  );
}
