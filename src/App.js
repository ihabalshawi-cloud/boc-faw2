import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { LogIn, LogOut, FileText, Clock, Calendar, CheckCircle, ChevronLeft, User, Eye, EyeOff, AlertCircle, Printer, Users, Shield, Package, Plus, Trash2, Edit3, Save, X, ArrowRightLeft, PenTool, RefreshCw, Search, FolderOpen, Upload, Download, Layers, ClipboardList, ChevronRight, Home, Bell, ThumbsUp, ThumbsDown, Star, Target, BarChart2, CheckSquare, BookOpen, GraduationCap, BarChart } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG
═══════════════════════════════════════════════════════════ */
const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";
const FIREBASE_API_KEY = "AIzaSyDWb0WhoO-NVLnbE5b8un63O6x-sH0RDco";

/* ═══════════════════════════════════════════════════════════
   SECURITY LAYER
═══════════════════════════════════════════════════════════ */
const SEC_KEY = [66, 79, 67, 70, 77];
const SEC = {
  encode: (str) => {
    if (!str) return "";
    try {
      const utf8Str = unescape(encodeURIComponent(str));
      const xorChars = utf8Str.split("").map((c,i) =>
        String.fromCharCode(c.charCodeAt(0) ^ SEC_KEY[i % SEC_KEY.length])
      ).join("");
      return btoa(xorChars);
    } catch { return str; }
  },
  decode: (str) => {
    if (!str) return "";
    try {
      const b64 = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}=)$/;
      if (!b64.test(str.trim())) return str;
      const xorChars = atob(str.trim());
      const utf8Str = xorChars.split("").map((c,i) =>
        String.fromCharCode(c.charCodeAt(0) ^ SEC_KEY[i % SEC_KEY.length])
      ).join("");
      return decodeURIComponent(escape(utf8Str));
    } catch { return str; }
  },
  verify: (input, stored) => {
    if (!input || !stored) return false;
    if (input.trim() === stored.trim()) return true;
    try {
      return input.trim() === SEC.decode(stored).trim();
    } catch { return false; }
  },
};

// Rate limiting
const _attempts = (() => {
  try { const s=sessionStorage.getItem("_la"); return s?JSON.parse(s):{}; } catch { return {}; }
})();
function recordAttempt(key, ok) {
  if (ok) delete _attempts[key]; else _attempts[key]=(_attempts[key]||0)+1;
  try { sessionStorage.setItem("_la", JSON.stringify(_attempts)); } catch {}
}
function getAttempts(key) { return _attempts[key]||0; }

// Idle timeout
let _idleTimer = null;
function setupIdleDetection(onLogout) {
  const reset = () => {
    clearTimeout(_idleTimer);
    _idleTimer = setTimeout(()=>{ 
      sessionStorage.removeItem("boc_session"); 
      onLogout(); 
    }, 30*60*1000);
  };
  ["mousemove","keypress","click","touchstart"].forEach(e=>window.addEventListener(e,reset,{passive:true}));
  reset();
  return ()=>{ clearTimeout(_idleTimer); ["mousemove","keypress","click","touchstart"].forEach(e=>window.removeEventListener(e,reset)); };
}

// Firebase REST helpers مع تحسين معالجة الأخطاء
const fb = {
  async get(path) {
    try {
      const response = await fetch(`${FIREBASE_URL}/${path}.json`);
      if (!response.ok) {
        console.error(`HTTP Error ${response.status}: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      if (data && typeof data === "object" && data.error) {
        console.error("Firebase Error:", data.error);
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Fetch error for ${path}:`, error.message);
      return null;
    }
  },
  async set(path, data) {
    try {
      const response = await fetch(`${FIREBASE_URL}/${path}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        console.error(`Failed to set ${path}: ${response.status}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Set error for ${path}:`, error.message);
      return false;
    }
  },
  async push(path, data) {
    try {
      const response = await fetch(`${FIREBASE_URL}/${path}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result?.name;
    } catch { return null; }
  },
  async patch(path, data) {
    try {
      await fetch(`${FIREBASE_URL}/${path}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch {}
  },
};

// Global cache
const _fbCache = {};
const _fbListeners = {};
const _fbPolls = {};

function _fbNotify(path, data) {
  _fbCache[path] = data;
  (_fbListeners[path]||new Set()).forEach(cb=>cb(data));
}

function _pollInterval(path) {
  if (path.startsWith("notifications")) return 5000;
  if (path.startsWith("requests"))      return 8000;
  if (path.startsWith("training"))      return 10000;
  if (path.startsWith("login_history")) return 30000;
  return 20000;
}

function _fbStart(path) {
  if (_fbPolls[path]) return;
  fb.get(path).then(data => { _fbNotify(path, data ?? null); });
  _fbPolls[path] = setInterval(()=>{
    if (!(_fbListeners[path]?.size>0)) return;
    fb.get(path).then(data=>{ if(data!==null) _fbNotify(path,data); });
  }, _pollInterval(path));
}

function useFirebase(path, initial) {
  const [val, setVal] = useState(()=> _fbCache[path] !== undefined ? _fbCache[path] : initial);
  const [ready, setReady] = useState(_fbCache[path] !== undefined);

  useEffect(()=>{
    if (!_fbListeners[path]) _fbListeners[path] = new Set();
    const cb = (data)=>{ setVal(data); setReady(true); };
    _fbListeners[path].add(cb);
    if (_fbCache[path] !== undefined){ setVal(_fbCache[path]); setReady(true); }
    _fbStart(path);
    return ()=>{ _fbListeners[path]?.delete(cb); };
  }, [path]);

  const set = useCallback((v)=>{
    setVal(prev=>{
      const next = typeof v === "function" ? v(prev) : v;
      _fbNotify(path, next);
      fb.set(path, next);
      return next;
    });
  }, [path]);

  return [val, set, ready];
}

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(()=>{
    try { const s=localStorage.getItem(key); return s?JSON.parse(s):initial; }
    catch { return initial; }
  });
  const set = useCallback((v)=>{
    setVal(prev=>{
      const next = typeof v==="function"?v(prev):v;
      try { localStorage.setItem(key,JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, set];
}

function auditLog(action, details, empName) {
  const entry = {
    id: Date.now(),
    action,
    details,
    by: empName,
    at: new Date().toISOString(),
  };
  fb.get("audit_log").then(existing => {
    const prev = Array.isArray(existing) ? existing : [];
    fb.set("audit_log", [entry, ...prev].slice(0, 1000));
  });
}

function printElement(elementId, title = "تقرير") {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *{font-family:'IBM Plex Sans Arabic',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
    body{background:#fff;color:#1e293b;font-size:11pt;padding:20mm 15mm}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:right}
    th{background:#f1f5f9;font-weight:700}
    @page{size:A4;margin:15mm}
    tr{page-break-inside:avoid}
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
}

function PrintButton({ targetId, label = "طباعة / PDF", title }) {
  return (
    <button
      onClick={() => targetId ? printElement(targetId, title) : window.print()}
      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-3 py-2 rounded-xl shadow-sm transition-all active:scale-95 no-print">
      <Printer size={13}/> {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACCOUNTS - الكادر الكامل
═══════════════════════════════════════════════════════════ */
const ACCOUNTS = [
  {id:1,  jobNum:"728004", password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي",       title:"ر. مهندسين",   dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7801165298", role:"admin"},
  {id:2,  jobNum:"727466", password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه",    title:"ر. مهندسين",   dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7705559125"},
  {id:3,  jobNum:"737283", password:"1003", name:"عمر طاهر خزعل سبهان المياحي",              title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7710872949"},
  {id:4,  jobNum:"756571", password:"1004", name:"ليث شاكر حمود زعيتر الربيعه",              title:"معاون مهندس",  dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7714991063"},
  {id:5,  jobNum:"790850", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري",        title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"صباحي", edu:"دبلوم",        phone:"7709043148"},
  {id:6,  jobNum:"758795", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري",        title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"صباحي", edu:"دبلوم",        phone:"7707315475"},
  {id:7,  jobNum:"719242", password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير",  title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",        phone:"7831644210"},
  {id:8,  jobNum:"790869", password:"1008", name:"محمود كاظم هاشم محمد المنصوري",            title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",        phone:"7703145733"},
  {id:9,  jobNum:"790885", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي",        title:"محاسب اقدم",  dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",        phone:"7808779038", role:"inventory_manager"},
  {id:10, jobNum:"813877", password:"1010", name:"محمد اسماعيل احمد رمضان العلي",            title:"مهندس",        dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7725549815"},
  {id:11, jobNum:"439193", password:"1011", name:"علي طاهر خزعل سبهان المياحي",              title:"حرفي اقدم",    dept:"شعبة المرافئ",       shift:"صباحي", edu:"ابتدائية",     phone:"7705770208"},
  {id:12, jobNum:"701130", password:"2001", name:"عبد الله علي زباري يسر عباده",             title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"بكالوريوس",      phone:"7705706145"},
  {id:13, jobNum:"751480", password:"2002", name:"امين حميد فاضل حسين العلي",                title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"A", edu:"دبلوم معهد نفط", phone:"7715949652"},
  {id:14, jobNum:"719269", password:"2003", name:"حسين علي احمد قاسم عبادي",                 title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم",          phone:"7712679994"},
  {id:15, jobNum:"719498", password:"2004", name:"جاسم مزعل حاتم ديوان الحسين",              title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم",          phone:"7821188777"},
  {id:16, jobNum:"719277", password:"2005", name:"باسم هاشم جاسم هاشم الفارس",               title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"B", edu:"دبلوم",          phone:"7702792993"},
  {id:17, jobNum:"719293", password:"2006", name:"هاشم جابر جعفر شناوة عباس",                title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"B", edu:"دبلوم",          phone:"7732166112"},
  {id:18, jobNum:"719463", password:"2007", name:"عبد الحميد سامي موسى بدر العيسى",          title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم",          phone:"7705559870"},
  {id:19, jobNum:"736732", password:"2008", name:"احسان عبد الصمد داود",                     title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم",          phone:"7714658958"},
  {id:20, jobNum:"719048", password:"2009", name:"علاء محسن عذبي جعفر الجعفر",              title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"دبلوم",          phone:"7711534971"},
  {id:21, jobNum:"732249", password:"2010", name:"علي باقر حنتوش",                           title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"C", edu:"دبلوم",          phone:"7705000000"},
  {id:22, jobNum:"719051", password:"2011", name:"علي صلاح مهدي العيداني",                   title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"دبلوم",          phone:"7711000000"},
  {id:23, jobNum:"733501", password:"2012", name:"يوسف ياسين علي ياسين",                     title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"C", edu:"دبلوم",          phone:"7713000000"},
  {id:24, jobNum:"719381", password:"2013", name:"ضياء عبد الامير محمد الغانم",              title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم",          phone:"7714000000"},
  {id:25, jobNum:"719502", password:"2014", name:"عدنان عبد الجليل عطية",                    title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم",          phone:"7715000000"},
  {id:26, jobNum:"736721", password:"2015", name:"احسان محمد سليم السليم",                   title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم",          phone:"7716000000"},
  {id:27, jobNum:"724939", password:"2016", name:"حيدر عبد الحسن خضير جاسم",                 title:"مدير فني",     dept:"شعبة المرافئ",       shift:"مناوبة", group:"D", edu:"معادل للاعدادية", phone:"7712766100"},
  {id:30, jobNum:"690414", password:"3001", name:"عبد الله عيسى موسى موني",                  title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7735632535"},
  {id:31, jobNum:"689766", password:"3002", name:"اباذر صالح عبد الحسين عيسى",               title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7801446130", role:"attendance_admin"},
  {id:32, jobNum:"690174", password:"3003", name:"حسن عادل عمران يوسف",                       title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7729488795", role:"attendance_admin"},
  {id:33, jobNum:"689331", password:"3004", name:"سجاد علي راضي علي",                        title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7703283076", role:"attendance_admin"},
];

const TS = {
  "2":  { label:"مناوبة ثنائية",               cat:"عمل",    color:"bg-blue-600 text-white" },
  "3":  { label:"مناوبة ثلاثية",               cat:"عمل",    color:"bg-blue-800 text-white" },
  "O":  { label:"المقيم الصباحي",              cat:"عمل",    color:"bg-emerald-600 text-white" },
  "V":  { label:"استراحة مقيم",                cat:"راحة",   color:"bg-teal-100 text-teal-800" },
  "L":  { label:"إجازة اعتيادية",              cat:"إجازة",  color:"bg-blue-100 text-blue-800" },
  "S":  { label:"إجازة مرضية",                 cat:"إجازة",  color:"bg-rose-100 text-rose-800" },
  "T":  { label:"إجازة بدون راتب/داخل",        cat:"إجازة",  color:"bg-orange-100 text-orange-800" },
  "H":  { label:"إجازة بدون راتب/خارج",        cat:"إجازة",  color:"bg-orange-200 text-orange-900" },
  "7":  { label:"إجازة اعتيادية خارج العراق",  cat:"إجازة",  color:"bg-indigo-100 text-indigo-800" },
  "M":  { label:"إجازة أمومة",                 cat:"إجازة",  color:"bg-pink-100 text-pink-800" },
  "K":  { label:"إجازة أمومة بأمر إداري",      cat:"إجازة",  color:"bg-pink-200 text-pink-900" },
  "D":  { label:"أيام العدة",                  cat:"إجازة",  color:"bg-pink-100 text-pink-700" },
  "J":  { label:"مجاز دراسي",                  cat:"إجازة",  color:"bg-violet-100 text-violet-800" },
  "I":  { label:"إيفاد داخل العراق / دورة",    cat:"إيفاد",  color:"bg-amber-100 text-amber-800" },
  "G":  { label:"دورة داخل محافظة البصرة",     cat:"إيفاد",  color:"bg-amber-200 text-amber-900" },
  "P":  { label:"إيفاد خارج العراق",           cat:"إيفاد",  color:"bg-amber-300 text-amber-900" },
  "N":  { label:"استراحة مناوبة",              cat:"راحة",   color:"bg-slate-100 text-slate-600" },
  "R":  { label:"استراحة",                     cat:"راحة",   color:"bg-slate-200 text-slate-500" },
  "X":  { label:"غياب",                        cat:"غياب",   color:"bg-red-200 text-red-900 font-bold" },
  "Y":  { label:"عطلة رسمية",                  cat:"عطلة",   color:"bg-slate-300 text-slate-600" },
  "B":  { label:"أيام بقسم آخر",               cat:"متنوع",  color:"bg-purple-100 text-purple-800" },
  "U":  { label:"تفرغ",                        cat:"متنوع",  color:"bg-teal-100 text-teal-700" },
  "":   { label:"—",                            cat:"",       color:"bg-slate-50 text-slate-300" },
};

const LEAVE_TYPES = {
  اعتيادية: { label:"إجازة اعتيادية", color:"bg-blue-600",  light:"bg-blue-50 text-blue-700 border-blue-200",   max:30, unit:"يوم" },
  مرضية:    { label:"إجازة مرضية",    color:"bg-rose-600",  light:"bg-rose-50 text-rose-700 border-rose-200",   max:15, unit:"يوم" },
  زمنية:    { label:"إجازة زمنية",    color:"bg-amber-600", light:"bg-amber-50 text-amber-700 border-amber-200", max:7,  unit:"يوم", hourly:true, hoursPerDay:7, morningOnly:true },
};

function arabicDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ar-IQ", { year:"numeric", month:"long", day:"numeric" });
}

function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(1, Math.ceil((new Date(b)-new Date(a))/86400000)+1);
}

function toArabicNum(n) {
  return String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
}

/* ═══════════════════════════════════════════════════════════
   LOGIN SCREEN (المصحح بالكامل)
═══════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  // اختبار الاتصال بقاعدة البيانات عند تحميل الصفحة
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch(`${FIREBASE_URL}/.json`);
        if (response.ok) {
          setTestStatus({ success: true, message: "✅ الاتصال بقاعدة البيانات ناجح" });
        } else {
          setTestStatus({ success: false, message: `⚠️ خطأ ${response.status}: تأكد من Firebase Rules` });
        }
      } catch (error) {
        setTestStatus({ success: false, message: `❌ فشل الاتصال: ${error.message}` });
      }
    };
    testConnection();
    
    // محاولة استعادة الجلسة
    try {
      const saved = sessionStorage.getItem("boc_session");
      if (saved) {
        const { acct, expiry } = JSON.parse(saved);
        if (expiry > Date.now()) { onLogin(acct); }
        else { sessionStorage.removeItem("boc_session"); }
      }
    } catch {}
  }, [onLogin]);

  const loginClick = async () => {
    setErr("");
    if (!user || !pass) { setErr("أدخل الرقم الوظيفي وكلمة المرور"); return; }
    
    const attempts = getAttempts(user);
    if (attempts >= 5) { setErr('تم تجاوز 5 محاولات — انتظر أو افتح نافذة Incognito'); return; }

    const baseAcct = ACCOUNTS.find(a => a.jobNum === user.trim() || a.username === user.trim());
    if (!baseAcct) { 
      recordAttempt(user, false);
      setErr("الرقم الوظيفي غير موجود"); 
      return; 
    }

    try {
      setLoading(true);
      
      // محاولة قراءة كلمة المرور من Firebase
      let storedPassword = null;
      let connectionError = false;
      
      try {
        // أولاً: الموقع الجديد (المستخدم أثناء تغيير كلمة المرور)
        const resNew = await fetch(`${FIREBASE_URL}/employees/${baseAcct.id}/password.json`);
        if (resNew.ok) {
          const rawNew = await resNew.json();
          if (rawNew && typeof rawNew === "string" && rawNew.length > 0) {
            storedPassword = rawNew;
          }
        }
        
        // إذا لم نجد، جرب الموقع القديم
        if (!storedPassword) {
          const resOld = await fetch(`${FIREBASE_URL}/passwords/${baseAcct.jobNum}.json`);
          if (resOld.ok) {
            const rawOld = await resOld.json();
            if (rawOld && typeof rawOld === "string" && rawOld.length > 0) {
              storedPassword = rawOld;
            }
          }
        }
      } catch (e) {
        console.warn("Error reading password:", e);
        connectionError = true;
      }

      let isValid = false;
      
      if (storedPassword) {
        isValid = SEC.verify(pass.trim(), storedPassword);
      } else {
        // استخدام كلمة المرور الافتراضية من القائمة
        isValid = (pass.trim() === baseAcct.password);
        
        // إذا كانت صحيحة، قم بتشفيرها وحفظها في Firebase
        if (isValid && !connectionError) {
          const encrypted = SEC.encode(pass.trim());
          await fetch(`${FIREBASE_URL}/employees/${baseAcct.id}/password.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(encrypted)
          }).catch(e => console.warn("Could not save encrypted password:", e));
        }
      }

      if (isValid) {
        // تسجيل الدخول في السجل
        const loginEntry = {
          id: Date.now(),
          empId: baseAcct.id,
          empName: baseAcct.name,
          empTitle: baseAcct.title,
          empDept: baseAcct.dept,
          username: baseAcct.jobNum,
          loginAt: new Date().toISOString(),
          device: navigator.userAgent.includes("Mobile") ? "موبايل" : "كمبيوتر",
        };
        
        try {
          const existing = await fb.get("login_history");
          const prev = Array.isArray(existing) ? existing : [];
          await fb.set("login_history", [loginEntry, ...prev].slice(0, 500));
        } catch (e) { console.warn("Could not save login history:", e); }
        
        // حفظ الجلسة
        try {
          sessionStorage.setItem("boc_session", JSON.stringify({
            acct: baseAcct,
            expiry: Date.now() + 8 * 60 * 60 * 1000
          }));
        } catch (e) {}
        
        recordAttempt(user, true);
        
        // إشعار بتغيير كلمة المرور إذا كانت افتراضية
        const isDefaultPass = ["1001","1002","1003","1004","1005","1006","1007","1008","1009","1010","1011",
                                "2001","2002","2003","2004","2005","2006","2007","2008","2009","2010",
                                "2011","2012","2013","2014","2015","2016","3001","3002","3003","3004"].includes(pass.trim());
        if (isDefaultPass) {
          setTimeout(() => {
            if (window.confirm("⚠️ أنت تستخدم كلمة المرور الافتراضية. هل تريد تغييرها الآن لأسباب أمنية؟")) {
              // سيتم فتح صفحة تغيير كلمة المرور بعد تسجيل الدخول
              sessionStorage.setItem("force_password_change", "true");
            }
          }, 1000);
        }
        
        onLogin(baseAcct);
      } else {
        recordAttempt(user, false);
        setErr("كلمة المرور غير صحيحة");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErr("خطأ في الاتصال بقاعدة البيانات، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"/>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]"/>
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <LogIn size={28} className="text-white"/>
          </div>
          <h2 className="text-xl font-black text-white">شركة نفط البصرة</h2>
          <p className="text-xs text-slate-400 mt-1">شعبة مستودع الفاو — نظام الإجازات والطلبات</p>
        </div>
        
        {/* حالة الاتصال */}
        {testStatus && (
          <div className={`mb-4 text-center text-xs p-2 rounded-xl ${testStatus.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {testStatus.message}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">الرقم الوظيفي</label>
            <div className="relative">
              <input type="text" value={user} onChange={e=>setUser(e.target.value)} disabled={loading}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3.5 pr-11 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                placeholder="مثال: 728004" onKeyDown={e=>e.key==="Enter"&&loginClick()} dir="ltr"/>
              <User size={18} className="absolute right-4 top-4 text-slate-500"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">كلمة المرور</label>
            <div className="relative">
              <input type={showP?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} disabled={loading}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-3.5 pr-11 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&loginClick()} dir="ltr"/>
              <Shield size={18} className="absolute right-4 top-4 text-slate-500"/>
              <button type="button" onClick={()=>setShowP(!showP)} className="absolute left-4 top-4 text-slate-500 hover:text-slate-300">
                {showP?<EyeOff size={18}/>:<Eye size={18}/>}
              </button>
            </div>
          </div>
          {err && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0"/><span>{err}</span>
            </div>
          )}
          <button onClick={loginClick} disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <LogIn size={16}/> {loading?"جاري التحقق...":"تسجيل الدخول"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHANGE PASSWORD PAGE (المصحح بالكامل)
═══════════════════════════════════════════════════════════ */
function ChangePasswordPage({ emp, onLogout }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const saveNewPassword = async () => {
    if (!newPass || newPass.trim().length < 4) {
      setMsg({ text: "⚠️ كلمة المرور يجب أن تكون 4 خانات أو أكثر", type: "error" });
      return;
    }
    if (newPass.trim() !== confirm.trim()) {
      setMsg({ text: "⚠️ كلمات المرور غير متطابقة", type: "error" });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const encryptedPassword = SEC.encode(newPass.trim());

      // حفظ في الموقع الجديد
      const response1 = await fetch(`${FIREBASE_URL}/employees/${emp.id}/password.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encryptedPassword)
      });

      // تحديث الموقع القديم للتوافق
      await fetch(`${FIREBASE_URL}/passwords/${emp.jobNum}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encryptedPassword)
      });

      if (!response1.ok) throw new Error("فشل الحفظ");

      // تحديث الجلسة الحالية
      try {
        const sessionData = sessionStorage.getItem("boc_session");
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.acct && parsed.acct.id === emp.id) {
            parsed.acct.password = encryptedPassword;
            sessionStorage.setItem("boc_session", JSON.stringify(parsed));
          }
        }
      } catch (e) {}

      // تحديث كائن المستخدم الحالي
      emp.password = encryptedPassword;

      // تسجيل في سجل التعديلات
      auditLog("تغيير كلمة مرور", `${emp.name} — تم تغيير كلمة المرور`, emp.name);

      setMsg({ text: "✅ تم تغيير كلمة المرور بنجاح!", type: "success" });
      setNewPass("");
      setConfirm("");

      // إزالة علامة强迫 تغيير كلمة المرور
      sessionStorage.removeItem("force_password_change");

      // اقتراح تسجيل الخروج
      setTimeout(() => {
        if (window.confirm("تم تغيير كلمة المرور بنجاح.\nهل تريد تسجيل الخروج واستخدام الكلمة الجديدة؟")) {
          if (typeof onLogout === 'function') onLogout();
        }
      }, 1500);

    } catch (error) {
      console.error(error);
      setMsg({ text: "❌ فشل الاتصال بقاعدة البيانات، حاول مجدداً", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center justify-center min-h-[60vh] p-4">
      <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">تغيير كلمة المرور</h2>
            <p className="text-xs text-slate-500">قم بتأمين حسابك بكلمة مرور جديدة</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showN ? "text" : "password"}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-all text-center font-mono"
              />
              <button onClick={() => setShowN(!showN)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showN ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">تأكيد كلمة المرور</label>
            <input
              type={showN ? "text" : "password"}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-all text-center font-mono"
            />
          </div>

          {msg && (
            <div className={`p-3 rounded-xl text-xs font-bold text-center border ${msg.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
              {msg.text}
            </div>
          )}

          <button
            onClick={saveNewPassword}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 py-3 rounded-xl active:scale-95 transition-all disabled:opacity-50"
          >
            <Save size={14} /> {loading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 max-w-md">
        <p className="font-bold text-slate-700 mb-1">📌 ملاحظة:</p>
        <p>• الرقم الوظيفي هو اسم المستخدم الرسمي</p>
        <p>• إذا نسيت كلمة مرورك، اطلب من المشرف إعادة تعيينها</p>
        <p>• بعد التغيير، سيُطلب منك تسجيل الدخول مجدداً</p>
      </div>
    </div>
  );
}

// تبسيط باقي الكود - Dashboard مبسط للاختبار
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  
  // التحقق من الحاجة لتغيير كلمة المرور
  useEffect(() => {
    const needsChange = sessionStorage.getItem("force_password_change");
    if (needsChange === "true") {
      sessionStorage.removeItem("force_password_change");
      setTimeout(() => {
        if (window.confirm("🔐 لأسباب أمنية، يرجى تغيير كلمة المرور الافتراضية الآن.")) {
          setView("changepass");
        }
      }, 500);
    }
  }, []);

  // إعداد تسجيل الخروج التلقائي
  useEffect(() => {
    const cleanup = setupIdleDetection(onLogout);
    return cleanup;
  }, [onLogout]);

  return (
    <div className="min-h-screen bg-[#f0f4fa] flex flex-col md:flex-row" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
        *{font-family:'IBM Plex Sans Arabic',sans-serif;box-sizing:border-box;}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .3s ease both}
        @media print{ .no-print{display:none!important} }
      `}</style>

      {/* Sidebar بسيط */}
      <aside className="no-print hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0 min-h-screen sticky top-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-800 border border-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">BOC</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">شركة نفط البصرة</p>
              <p className="text-[10px] text-blue-400">شعبة مستودع الفاو</p>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl px-3 py-2">
            <p className="text-xs font-bold text-slate-200 truncate">{emp.name.split(" ").slice(0,3).join(" ")}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{emp.title} · {emp.shift}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setView("home")} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${view==="home" ? "bg-blue-600" : "text-slate-400 hover:bg-slate-800"}`}>
            <Home size={14}/> الرئيسية
          </button>
          <button onClick={() => setView("changepass")} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${view==="changepass" ? "bg-blue-600" : "text-slate-400 hover:bg-slate-800"}`}>
            <Shield size={14}/> تغيير كلمة المرور
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 mt-4">
            <LogOut size={14}/> تسجيل الخروج
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {view === "home" && (
            <div className="fu">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h1 className="text-xl font-bold text-slate-800 mb-2">مرحباً، {emp.name.split(" ")[0]}</h1>
                <p className="text-slate-500">تم تسجيل الدخول بنجاح</p>
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-emerald-800 text-sm">
                  ✅ النظام يعمل بشكل طبيعي
                </div>
              </div>
            </div>
          )}
          {view === "changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout} />}
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function LeaveSystem() {
  const [user, setUser] = useState(null);

  const handleLogin = (acct) => {
    setUser(acct);
  };

  const handleLogout = () => {
    try { sessionStorage.removeItem("boc_session"); } catch {}
    sessionStorage.removeItem("force_password_change");
    setUser(null);
  };

  return user
    ? <Dashboard emp={user} onLogout={handleLogout}/>
    : <LoginScreen onLogin={handleLogin}/>;
}