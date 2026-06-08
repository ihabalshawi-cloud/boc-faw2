import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { 
  LogIn, LogOut, FileText, Clock, Calendar, CheckCircle, ChevronLeft, 
  User, Eye, EyeOff, AlertCircle, Printer, Users, Shield, Package, 
  Plus, Trash2, Edit3, Save, X, ArrowRightLeft, PenTool, RefreshCw, 
  Search, FolderOpen, Upload, Download, Layers, ClipboardList, ChevronRight, 
  Home, Bell, ThumbsUp, ThumbsDown, Star, Target, BarChart2, CheckSquare, 
  BookOpen, GraduationCap, BarChart, Wifi, WifiOff, Truck, Box, Award, Settings
} from "lucide-react";

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

// Firebase REST helpers
const fb = {
  async get(path) {
    try {
      const response = await fetch(`${FIREBASE_URL}/${path}.json`);
      if (!response.ok) return null;
      return await response.json();
    } catch { return null; }
  },
  async set(path, data) {
    try {
      await fetch(`${FIREBASE_URL}/${path}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch {}
  },
  async push(path, data) {
    try {
      const response = await fetch(`${FIREBASE_URL}/${path}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return result?.name;
    } catch { return null; }
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
  if (path.startsWith("requests")) return 8000;
  if (path.startsWith("training")) return 10000;
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
      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm transition-all active:scale-95 no-print">
      <Printer size={13}/> {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACCOUNTS - الكادر الكامل (33 موظف)
═══════════════════════════════════════════════════════════ */
const ACCOUNTS = [
  {id:0, jobNum:"728004", password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"admin"},
  {id:1, jobNum:"727466", password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:2, jobNum:"737283", password:"1003", name:"عمر طاهر خزعل سبهان المياحي", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:3, jobNum:"756571", password:"1004", name:"ليث شاكر حمود زعيتر الربيعه", title:"معاون مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:4, jobNum:"790850", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي"},
  {id:5, jobNum:"758795", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي"},
  {id:6, jobNum:"719242", password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:7, jobNum:"790869", password:"1008", name:"محمود كاظم هاشم محمد المنصوري", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:8, jobNum:"790885", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي", title:"محاسب اقدم", dept:"قسم السيطرة والنظم", shift:"صباحي", role:"inventory_manager"},
  {id:9, jobNum:"813877", password:"1010", name:"محمد اسماعيل احمد رمضان العلي", title:"مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:10, jobNum:"439193", password:"1011", name:"علي طاهر خزعل سبهان المياحي", title:"حرفي اقدم", dept:"شعبة المرافئ", shift:"صباحي"},
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
  {id:31, jobNum:"300101", password:"3005", name:"كرار عماد خلف (عقد)", title:"عقد", dept:"شعبة مستودع الفاو", shift:"صباحي"},
  {id:32, jobNum:"300102", password:"3006", name:"مصطفى كامل ناصر (عقد)", title:"عقد", dept:"شعبة مستودع الفاو", shift:"صباحي"},
];

/* ═══════════════════════════════════════════════════════════
   TIMESHEET CODES
═══════════════════════════════════════════════════════════ */
const TS = {
  "2": { label:"مناوبة ثنائية", cat:"عمل", color:"bg-blue-600 text-white" },
  "3": { label:"مناوبة ثلاثية", cat:"عمل", color:"bg-blue-800 text-white" },
  "O": { label:"المقيم الصباحي", cat:"عمل", color:"bg-emerald-600 text-white" },
  "V": { label:"استراحة مقيم", cat:"راحة", color:"bg-teal-100 text-teal-800" },
  "L": { label:"إجازة اعتيادية", cat:"إجازة", color:"bg-blue-100 text-blue-800" },
  "S": { label:"إجازة مرضية", cat:"إجازة", color:"bg-rose-100 text-rose-800" },
  "T": { label:"إجازة بدون راتب", cat:"إجازة", color:"bg-orange-100 text-orange-800" },
  "H": { label:"إجازة خارج العراق", cat:"إجازة", color:"bg-orange-200 text-orange-900" },
  "J": { label:"مجاز دراسي", cat:"إجازة", color:"bg-violet-100 text-violet-800" },
  "I": { label:"إيفاد", cat:"إيفاد", color:"bg-amber-100 text-amber-800" },
  "N": { label:"استراحة مناوبة", cat:"راحة", color:"bg-slate-100 text-slate-600" },
  "R": { label:"استراحة", cat:"راحة", color:"bg-slate-200 text-slate-500" },
  "X": { label:"غياب", cat:"غياب", color:"bg-red-200 text-red-900 font-bold" },
  "Y": { label:"عطلة رسمية", cat:"عطلة", color:"bg-slate-300 text-slate-600" },
  "": { label:"—", cat:"", color:"bg-slate-50 text-slate-300" },
};

const LEAVE_TYPES = {
  اعتيادية: { label:"إجازة اعتيادية", color:"bg-blue-600", light:"bg-blue-50 text-blue-700", max:30 },
  مرضية: { label:"إجازة مرضية", color:"bg-rose-600", light:"bg-rose-50 text-rose-700", max:15 },
  زمنية: { label:"إجازة زمنية", color:"bg-amber-600", light:"bg-amber-50 text-amber-700", max:7, hourly:true },
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

// دالة للتحقق من حالة الاتصال
function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${FIREBASE_URL}/.json`, { signal: controller.signal });
      clearTimeout(timeoutId);
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { isConnected, checking, checkConnection };
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
        } else {
          sessionStorage.removeItem("boc_session");
        }
      }
    } catch {}
  }, [onLogin]);

  const loginClick = async () => {
    setErr("");
    if (!user || !pass) { setErr("أدخل الرقم الوظيفي وكلمة المرور"); return; }
    
    const attempts = getAttempts(user);
    if (attempts >= 5) { setErr('تم تجاوز 5 محاولات'); return; }

    const baseAcct = ACCOUNTS.find(a => a.jobNum === user.trim() || a.username === user.trim());
    if (!baseAcct) { 
      recordAttempt(user, false);
      setErr("الرقم الوظيفي غير موجود"); 
      return; 
    }

    try {
      setLoading(true);
      
      let storedPassword = null;
      if (isConnected) {
        try {
          const res = await fetch(`${FIREBASE_URL}/passwords/${baseAcct.id}.json`);
          const data = await res.json();
          if (data && typeof data === "string") storedPassword = data;
        } catch {}
      }
      
      const localPass = localStorage.getItem(`pass_${baseAcct.id}`);
      
      let isValid = false;
      if (storedPassword) {
        isValid = SEC.verify(pass.trim(), storedPassword);
      } else if (localPass) {
        isValid = SEC.verify(pass.trim(), localPass);
      } else {
        isValid = (pass.trim() === baseAcct.password);
        if (isValid && isConnected) {
          const encrypted = SEC.encode(pass.trim());
          await fetch(`${FIREBASE_URL}/passwords/${baseAcct.id}.json`, {
            method: "PUT",
            body: JSON.stringify(encrypted)
          });
          localStorage.setItem(`pass_${baseAcct.id}`, encrypted);
        }
      }

      if (isValid) {
        sessionStorage.setItem("boc_session", JSON.stringify({
          acctId: baseAcct.id,
          expiry: Date.now() + 8 * 60 * 60 * 1000
        }));
        
        recordAttempt(user, true);
        
        const defaultPasswords = ["1001","1002","1003","1004","1005","2001","2002","2003","3001","3002","3003","3004"];
        if (defaultPasswords.includes(pass.trim())) {
          sessionStorage.setItem("force_password_change", "true");
        }
        
        onLogin(baseAcct);
      } else {
        recordAttempt(user, false);
        setErr("كلمة المرور غير صحيحة");
      }
    } catch (error) {
      setErr("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <LogIn size={32} className="text-white"/>
          </div>
          <h2 className="text-2xl font-bold text-white">شركة نفط البصرة</h2>
          <p className="text-sm text-slate-300 mt-2">شعبة مستودع الفاو — النظام المتكامل</p>
        </div>
        
        <div className="mb-4 flex items-center justify-center gap-2 text-xs">
          {isConnected ? (
            <><Wifi size={12} className="text-emerald-400"/><span className="text-emerald-400">متصل بالسحابة</span></>
          ) : (
            <><WifiOff size={12} className="text-amber-400"/><span className="text-amber-400">غير متصل (محلي)</span></>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">الرقم الوظيفي</label>
            <input 
              type="text" value={user} onChange={(e) => setUser(e.target.value)} 
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
              placeholder="728004" onKeyDown={(e) => e.key === "Enter" && loginClick()}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showP ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} 
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && loginClick()}
              />
              <button onClick={() => setShowP(!showP)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                {showP ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>
          {err && <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-xl">{err}</div>}
          <button onClick={loginClick} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl">
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>للتجربة: <strong className="text-blue-300">728004</strong> | <strong className="text-blue-300">1001</strong></p>
        </div>
      </div>
    </div>
  );
}

// ========== صفحة تغيير كلمة المرور ==========
function ChangePasswordPage({ emp, onLogout }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();

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
    try {
      const encrypted = SEC.encode(newPass.trim());
      localStorage.setItem(`pass_${emp.id}`, encrypted);
      
      if (isConnected) {
        await fetch(`${FIREBASE_URL}/passwords/${emp.id}.json`, {
          method: "PUT",
          body: JSON.stringify(encrypted)
        });
      }
      
      sessionStorage.removeItem("force_password_change");
      setMsg({ text: "✅ تم تغيير كلمة المرور بنجاح!", type: "success" });
      setNewPass("");
      setConfirm("");
      
      setTimeout(() => {
        if (window.confirm("تم تغيير كلمة المرور. هل تريد تسجيل الخروج؟")) {
          onLogout();
        }
      }, 1500);
    } catch (error) {
      setMsg({ text: "❌ حدث خطأ", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 border-b pb-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-xl"><Shield size={20} className="text-blue-600"/></div>
          <div><h2 className="font-bold text-slate-800">تغيير كلمة المرور</h2><p className="text-xs text-slate-500">{emp.name}</p></div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-600 block mb-1">كلمة المرور الجديدة</label>
            <div className="relative">
              <input type={showN ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-blue-500"/>
              <button onClick={() => setShowN(!showN)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showN ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-600 block mb-1">تأكيد كلمة المرور</label>
            <input type={showN ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"/>
          </div>
          {msg && (
            <div className={`p-3 rounded-xl text-sm text-center ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {msg.text}
            </div>
          )}
          <button onClick={saveNewPassword} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save size={16}/> {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== توقيع إلكتروني ==========
function SignaturePad({ onSave, existingSig, storageKey }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(!!existingSig);
  const [preview, setPreview] = useState(() => {
    if (existingSig) return existingSig;
    if (storageKey) {
      try { return localStorage.getItem(storageKey) || null; } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (preview && !existingSig) onSave(preview);
  }, []);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    if (e.touches) return { x: (e.touches[0].clientX - r.left) * scaleX, y: (e.touches[0].clientY - r.top) * scaleY };
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
  };

  const start = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const {x,y} = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x,y);
    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const {x,y} = getPos(e, canvas);
    ctx.lineTo(x,y);
    ctx.strokeStyle = "#1e3a6e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSig(true);
  };

  const end = () => setDrawing(false);
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    setHasSig(false);
    setPreview(null);
    if (storageKey) { try { localStorage.removeItem(storageKey); } catch {} }
    onSave(null);
  };
  const save = () => {
    const url = canvasRef.current.toDataURL("image/png");
    setPreview(url);
    if (storageKey) { try { localStorage.setItem(storageKey, url); } catch {} }
    onSave(url);
  };

  if (preview) {
    return (
      <div className="relative border-2 border-blue-200 rounded-xl overflow-hidden bg-slate-50">
        <img src={preview} alt="التوقيع" className="h-20 w-full object-contain"/>
        <button onClick={()=>{setPreview(null); onSave(null);}} className="absolute top-1 left-1 bg-white/80 text-red-500 rounded-lg p-1"><RefreshCw size={12}/></button>
      </div>
    );
  }

  return (
    <div>
      <div className="border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/30 overflow-hidden touch-none" style={{cursor:"crosshair"}}>
        <canvas ref={canvasRef} width={280} height={80}
          onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
          className="w-full"/>
      </div>
      <div className="flex gap-2 mt-1.5">
        <button onClick={clear} className="flex-1 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg">مسح</button>
        {hasSig && <button onClick={save} className="flex-1 py-1 text-[10px] font-bold text-blue-700 bg-blue-100 rounded-lg">حفظ التوقيع</button>}
      </div>
      <p className="text-[9px] text-slate-400 mt-1 text-center">ارسم توقيعك باستخدام الماوس أو الإصبع</p>
    </div>
  );
}

// ========== نموذج طلب إجازة ==========
function LeaveForm({ emp, onSubmit, onCancel, history }) {
  const today = new Date().toISOString().slice(0,10);
  const [type, setType] = useState("اعتيادية");
  const [dateFrom, setFrom] = useState(today);
  const [dateTo, setTo] = useState(today);
  const [purpose, setPurpose] = useState("");
  const [isAbroad, setAbroad] = useState(false);
  const [err, setErr] = useState("");
  const [sig, setSig] = useState(null);
  const [showSig, setShowSig] = useState(false);

  const cfg = LEAVE_TYPES[type];
  const days = daysBetween(dateFrom, dateTo);
  const monthlyStats = { اعتيادية:0, مرضية:0, زمنية:0 };
  history?.forEach(h => { if (h.type && monthlyStats[h.type] !== undefined) monthlyStats[h.type] += h.days; });

  const handleSubmit = () => {
    if (!purpose.trim()) return setErr("يرجى تحديد غرض الإجازة");
    if (!sig) return setErr("يرجى رسم توقيعك قبل تقديم الطلب");
    if (days > cfg.max) return setErr(`الحد الأقصى ${cfg.max} يوم`);
    setErr("");
    onSubmit({ type, dateFrom, dateTo, days, purpose, isAbroad, empSig: sig });
  };

  const monthName = new Date().toLocaleDateString("ar-IQ",{month:"long",year:"numeric"});

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl"><ChevronLeft size={18}/></button>
        <div><h2 className="text-base font-bold text-slate-800">نموذج طلب إجازة</h2><p className="text-xs text-slate-500">{monthName}</p></div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b-2 border-slate-200">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr><td className="border px-3 py-2 font-bold w-32">شركة نفط البصرة</td><td className="border px-3 py-2">عنوان النموذج</td><td className="border px-3 py-2 font-bold">نموذج اجازة {type}</td>
              <td rowSpan="2" className="border px-4 py-2 text-center"><div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center mx-auto"><span className="text-slate-600 font-bold text-xs">BOC</span></div></td></tr>
              <tr><td className="border px-3 py-2">هيأة الصيانة</td><td className="border px-3 py-2">رقم الإصدار</td><td className="border px-3 py-2 font-mono">BOC-P-07/F06</td></tr>
            </tbody>
          </table>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-xl p-3 text-xs">
            <div><span className="text-slate-500">الاسم: </span><strong>{emp.name.split(" ").slice(0,3).join(" ")}</strong></div>
            <div><span className="text-slate-500">الرقم: </span><strong>{emp.jobNum}</strong></div>
            <div><span className="text-slate-500">القسم: </span><strong>{emp.dept}</strong></div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[{key:"اعتيادية",color:"bg-blue-50 text-blue-700"},{key:"مرضية",color:"bg-rose-50 text-rose-700"},{key:"زمنية",color:"bg-amber-50 text-amber-700"}].map(t=>(
              <div key={t.key} className={`border rounded-xl p-2.5 text-center ${t.color}`}>
                <p className="text-[9px] font-bold">{t.key}</p>
                <p className="text-base font-bold">{toArabicNum(monthlyStats[t.key]||0)}</p>
                <p className="text-[9px] opacity-60">يوم هذا الشهر</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">نوع الإجازة</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(LEAVE_TYPES).map(([k,v])=>(
                <button key={k} onClick={()=>{setType(k);setErr("");}}
                  className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${type===k ? v.light+" border-current shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border space-y-3">
            <p className="text-sm text-slate-700 font-semibold">يرجى منحي {cfg?.label} لمدة:</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1.5">من تاريخ</label>
                <input type="date" value={dateFrom} onChange={e=>setFrom(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm"/></div>
              <div><label className="block text-[11px] font-bold text-slate-500 mb-1.5">إلى تاريخ</label>
                <input type="date" value={dateTo} onChange={e=>setTo(e.target.value)} min={dateFrom} className="w-full border rounded-xl px-3 py-2 text-sm"/></div>
            </div>
            <div className="flex items-center justify-between bg-white rounded-xl border px-4 py-2.5">
              <span className="text-sm text-slate-600">مدة الإجازة</span>
              <span className={`text-sm font-bold ${days>cfg.max?"text-red-600":"text-blue-700"}`}>{toArabicNum(days)} يوم</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">لغرض</label>
            <input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="اكتب غرض الإجازة..." className="w-full border rounded-xl px-3 py-2.5 text-sm"/>
          </div>

          <div onClick={()=>setAbroad(p=>!p)} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${isAbroad?"border-red-400 bg-red-50":"border-slate-200 bg-slate-50"}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isAbroad?"bg-red-500 border-red-500":"border-slate-300 bg-white"}`}>
              {isAbroad && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div><p className={`text-sm font-bold ${isAbroad?"text-red-700":"text-slate-700"}`}>🛂 الإجازة خارج العراق</p></div>
          </div>

          <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/30">
            <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><PenTool size={14} className="text-blue-600"/> توقيع مقدم الطلب <span className="text-red-500 text-xs">*مطلوب</span></p>
            {sig ? (
              <div className="space-y-2">
                <div className="bg-white border rounded-xl p-2"><img src={sig} alt="توقيع" className="h-16 w-48 object-contain"/></div>
                <button onClick={()=>{setSig(null);setShowSig(false);}} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl">إعادة الرسم</button>
              </div>
            ) : (
              !showSig ? <button onClick={()=>setShowSig(true)} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-blue-700 bg-white border-2 border-blue-300 rounded-xl"><PenTool size={15}/> اضغط للتوقيع</button>
              : <SignaturePad onSave={s=>{setSig(s);setShowSig(false);}} storageKey={`leave_sig_${emp.id}`}/>
            )}
          </div>

          {err && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"><AlertCircle size={14} className="text-red-500"/><p className="text-red-600 text-xs">{err}</p></div>}

          <div className="flex gap-3 pt-2">
            <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl shadow-md active:scale-95 transition-all"
              style={{background:`linear-gradient(135deg, ${type==="اعتيادية"?"#2563eb":type==="مرضية"?"#dc2626":"#d97706"})`}}>تقديم الطلب</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== إيصال الطلب ==========
function LeaveReceipt({ emp, leave, onClose }) {
  const cfg = LEAVE_TYPES[leave.type];
  const ref = `BOC-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl"><ChevronLeft size={18}/></button>
        <div><h2 className="text-base font-bold text-slate-800">تم تقديم الطلب بنجاح</h2><p className="text-xs text-slate-500">رقم المرجع: {ref}</p></div>
        <PrintButton targetId="print-leave" title={`إجازة ${leave.type} — ${emp.name}`}/>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3 mb-5">
        <CheckCircle size={20} className="text-emerald-600"/>
        <div><p className="text-sm font-bold text-emerald-800">تم إرسال طلبك بنجاح</p><p className="text-xs text-emerald-600">سيتم مراجعته من قبل المسؤول المخول</p></div>
      </div>

      <div id="print-leave" className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b-2 border-slate-200">
          <table className="w-full text-xs border-collapse">
            <tbody><tr><td className="border px-3 py-2 font-bold w-32">شركة نفط البصرة</td><td className="border px-3 py-2">عنوان النموذج</td><td className="border px-3 py-2 font-bold">نموذج اجازة {leave.type}</td>
            <td rowSpan="2" className="border px-4 py-2 text-center"><div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center mx-auto"><span className="text-slate-600 font-bold text-xs">BOC</span></div></td></tr>
            <tr><td className="border px-3 py-2"/><td className="border px-3 py-2">رمز النموذج</td><td className="border px-3 py-2 font-mono font-bold">BOC-P-13/F13 | رقم الإصدار: 1</td></tr></tbody>
          </table>
        </div>
        <div className="p-7 space-y-5">
          <div className="flex justify-between"><span className="text-sm text-slate-600">التاريخ: {arabicDate(new Date().toISOString().slice(0,10))}</span><span className="text-sm text-slate-600">المرجع: {ref}</span></div>
          <div className={`text-center text-sm font-bold border-2 rounded-xl py-2.5 ${cfg.light}`}>م / {cfg.label}</div>
          <div className="space-y-4">
            {[["الاسم الثلاثي", emp.name], ["الرقم الوظيفي", emp.jobNum], ["العنوان الوظيفي", emp.title], ["القسم / الشعبة", emp.dept]].map(([l,v])=>(
              <div key={l} className="flex items-center border-b border-dashed border-slate-200 pb-3"><span className="text-sm text-slate-500 w-36">{l}</span><span className="text-sm font-bold text-slate-800">{v}</span></div>
            ))}
          </div>
          <div className="bg-slate-50 border rounded-xl p-4">
            <p className="text-sm text-slate-700">يرجى منحي إجازة {cfg.label} لمدة <strong>{toArabicNum(leave.days)} يوم</strong> اعتباراً من {arabicDate(leave.dateFrom)} ولغاية {arabicDate(leave.dateTo)}</p>
            <p className="text-sm text-slate-700 mt-2">لغرض <strong>{leave.purpose}</strong></p>
            {leave.isAbroad && <p className="text-sm font-bold text-red-700 mt-2">🛂 الإجازة تتضمن سفراً خارج العراق</p>}
          </div>
          <div className="flex justify-between pt-6">
            <div className="text-center"><p className="text-xs text-slate-500 mb-10">توقيع المخول</p><div className="w-36 border-t border-slate-400"/></div>
            <div className="text-center"><p className="text-xs text-slate-500 mb-4">توقيع صاحب الإجازة</p><div className="w-36 border-t-2 border-blue-800 mt-6 relative"><span className="absolute -top-3 left-1/2 -translate-x-1/2 text-blue-800 text-xs font-bold whitespace-nowrap">{emp.name}</span></div></div>
          </div>
        </div>
      </div>

      <button onClick={onClose} className="mt-4 w-full py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl">العودة إلى لوحة التحكم</button>
    </div>
  );
}

// ========== طلب مواد ==========
function MaterialRequest({ emp, empSignatures, setEmpSignatures }) {
  const today = new Date().toISOString().slice(0,10);
  const [fromDate, setFrom] = useState(today);
  const [toDate, setTo] = useState(today);
  const [items, setItems] = useState([{ vocabNo:"", description:"", unit:"", qty:"", st:"", cc:"", jobNo:"", debit:"", cebit:"" }]);
  const [remarks, setRemarks] = useState("");
  const [sig, setSig] = useState(() => empSignatures[emp.id] || null);
  const [showSigPad, setShowSigPad] = useState(!empSignatures[emp.id]);
  const [submitted, setSubmitted] = useState(false);
  const [reqNum] = useState(`REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`);

  const saveSig = (url) => {
    setSig(url);
    if (url) { setEmpSignatures(p => ({...p, [emp.id]: url})); localStorage.setItem(`boc_sig_${emp.id}`, url); setShowSigPad(false); }
    else { setEmpSignatures(p => { const n={...p}; delete n[emp.id]; return n; }); localStorage.removeItem(`boc_sig_${emp.id}`); }
  };

  const addItem = () => setItems(p => [...p, { vocabNo:"", description:"", unit:"", qty:"", st:"", cc:"", jobNo:"", debit:"", cebit:"" }]);
  const removeItem = (i) => setItems(p => p.filter((_,idx)=>idx!==i));
  const setItem = (i, k, v) => setItems(p => p.map((it,idx) => idx===i ? {...it,[k]:v} : it));
  const handleSubmit = () => { if (!sig) { alert("يرجى رسم توقيعك أولاً"); return; } setSubmitted(true); };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3 mb-4">
          <CheckCircle size={22} className="text-emerald-600"/>
          <div><p className="font-bold text-emerald-800">تم إرسال طلب المواد بنجاح</p><p className="text-xs text-emerald-600">رقم الطلب: <strong>{reqNum}</strong></p></div>
        </div>
        <div id="print-material" className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
          <div className="border-b-2 border-slate-200"><table className="w-full text-[10px] border-collapse"><tbody><tr><td className="border px-2 py-1.5 font-bold w-28">شركة نفط البصرة</td>
          <td className="border px-2 py-1.5"><div className="font-bold">طلب مواد من المخزن</div><div className="text-slate-500">Vocab No: {reqNum}</div></td>
          <td rowSpan="2" className="border px-3 py-2 text-center w-16"><div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center mx-auto"><span className="text-slate-600 font-bold text-[9px]">BOC</span></div></td></tr>
          <tr><td className="border px-2 py-1 text-slate-500">رمز النموذج</td><td className="border px-2 py-1 font-mono font-bold">BOC-P-07/F09 | رقم الإصدار: 1</td></tr></tbody></table></div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="text-slate-500">من تاريخ: </span><strong>{new Date(fromDate).toLocaleDateString("ar-IQ")}</strong></div>
              <div><span className="text-slate-500">إلى تاريخ: </span><strong>{new Date(toDate).toLocaleDateString("ar-IQ")}</strong></div>
              <div><span className="text-slate-500">الاسم: </span><strong>{emp.name}</strong></div>
              <div><span className="text-slate-500">الرقم الوظيفي: </span><strong>{emp.jobNum}</strong></div>
            </div>
            <table className="w-full border-collapse text-[10px]"><thead><tr className="bg-slate-50">{["ت","Vocabulary No.","الوصف","الوحدة","الكمية","ST","CC","Job No.","Debit","Cebit"].map(h=>(
              <th key={h} className="border border-slate-200 px-1 py-1.5 text-center font-bold">{h}</th>))}</tr></thead>
            <tbody>{items.map((it,i)=>(
              <tr key={i}><td className="border px-1 py-2 text-center text-slate-400">{i+1}</td>
              {["vocabNo","description","unit","qty","st","cc","jobNo","debit","cebit"].map(k=><td key={k} className="border px-1 py-2 text-center">{it[k]||"—"}</td>)}</tr>))}</tbody></table>
            {remarks && <p className="text-xs text-slate-600 border-t pt-2"><strong>ملاحظات:</strong> {remarks}</p>}
            <div className="flex justify-between pt-4">
              <div className="text-center"><p className="text-[10px] text-slate-500 mb-6">توقيع المخول</p><div className="w-36 border-t border-slate-400"/></div>
              <div className="text-center"><p className="text-[10px] text-slate-500 mb-2">توقيع مقدم الطلب</p>{sig && <img src={sig} alt="توقيع" className="h-14 w-40 object-contain border rounded-lg bg-white"/>}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4"><button onClick={()=>setSubmitted(false)} className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">طلب جديد</button><PrintButton targetId="print-material" label="طباعة / PDF"/></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b-2 border-slate-200"><table className="w-full text-[10px] border-collapse"><tbody><tr><td className="border px-2 py-1.5 font-bold w-28">شركة نفط البصرة</td>
        <td className="border px-2 py-1.5"><div className="font-bold">طلب مواد من المخزن</div><div className="text-slate-400 text-[9px]">Vocab No. 3725501110</div></td>
        <td rowSpan="2" className="border px-3 py-2 text-center w-16"><div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center mx-auto"><span className="text-slate-600 font-bold text-[9px]">BOC</span></div></td></tr>
        <tr><td className="border px-2 py-1 text-slate-500">رمز النموذج</td><td className="border px-2 py-1 font-mono font-bold">BOC-P-07/F09 | رقم الإصدار: 1</td></tr></tbody></table></div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">من تاريخ</label><input type="date" value={fromDate} onChange={e=>setFrom(e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-xs"/></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">إلى تاريخ</label><input type="date" value={toDate} onChange={e=>setTo(e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-xs"/></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">الاسم</label><div className="border rounded-lg px-2 py-1.5 text-xs bg-slate-50">{emp.name}</div></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">الرقم الوظيفي</label><div className="border rounded-lg px-2 py-1.5 text-xs bg-slate-50 font-mono">{emp.jobNum}</div></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">العنوان الوظيفي</label><div className="border rounded-lg px-2 py-1.5 text-xs bg-slate-50">{emp.title}</div></div>
            <div><label className="block text-[10px] font-bold text-slate-400 mb-1">القسم</label><div className="border rounded-lg px-2 py-1.5 text-xs bg-slate-50">{emp.dept}</div></div>
          </div>

          <div className="overflow-x-auto"><table className="w-full border-collapse text-[10px]"><thead><tr className="bg-slate-50">{["ت","Vocabulary No.","الوصف","الوحدة","الكمية","ST","CC","Job No.","Debit","Cebit",""].map(h=>(
            <th key={h} className="border border-slate-200 px-1 py-2 text-center font-bold">{h}</th>))}</tr></thead>
          <tbody>{items.map((it,i)=>(
            <tr key={i}><td className="border border-slate-100 px-1 py-1 text-center text-slate-400">{i+1}</td>
            {["vocabNo","description","unit","qty","st","cc","jobNo","debit","cebit"].map(k=>(
              <td key={k} className="border border-slate-100 p-0.5"><input value={it[k]} onChange={e=>setItem(i,k,e.target.value)} className="w-full border-b border-slate-200 px-1 py-1 text-xs focus:outline-none focus:border-blue-400 bg-transparent text-center"/></td>))}
            <td className="border border-slate-100 px-1 py-1 text-center">{items.length>1 && <button onClick={()=>removeItem(i)} className="text-red-400"><X size={11}/></button>}</td></tr>))}</tbody></table></div>
          <button onClick={addItem} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"><Plus size={13}/> إضافة صف</button>

          <div><label className="block text-[10px] font-bold text-slate-400 mb-1">ملاحظات</label><textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={2} className="w-full border rounded-xl px-3 py-2 text-xs"/></div>

          <div className="border-t pt-4">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="text-center flex-1"><p className="text-[10px] text-slate-500 font-bold mb-8">توقيع المخول</p><div className="border-t border-slate-300 w-40 mx-auto"/></div>
              <div className="flex-1"><p className="text-[10px] text-slate-500 font-bold mb-2 text-center">توقيع مقدم الطلب</p>
                {showSigPad ? <SignaturePad onSave={saveSig} existingSig={sig} storageKey={`boc_sig_${emp.id}`}/>
                : sig ? <div className="relative text-center"><img src={sig} alt="توقيع" className="h-16 w-full max-w-[200px] object-contain border rounded-xl bg-white mx-auto"/><button onClick={()=>setShowSigPad(true)} className="text-[9px] text-blue-500 hover:underline mt-0.5">تغيير التوقيع</button></div>
                : <button onClick={()=>setShowSigPad(true)} className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-xs font-bold text-blue-600 flex items-center justify-center gap-2"><PenTool size={14}/> رسم التوقيع</button>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <button onClick={handleSubmit} className="w-full py-3 text-sm font-bold text-white rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md" style={{background:"linear-gradient(135deg,#1d4ed8,#1e40af)"}}><Package size={16}/> إرسال طلب المواد</button>
    </div>
  );
}

// ========== إدارة الموظفين ==========
function EmployeeManager({ employees, setEmployees }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي", group:"A", edu:"بكالوريوس", phone:"" });
  const [adding, setAdding] = useState(false);
  const [delConf, setDelConf] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const filtered = employees.filter(e => e.name.includes(search) || e.jobNum.includes(search));
  const openEdit = (emp) => { setEditId(emp.id); setForm({...emp}); setAdding(false); };
  const openAdd = () => { setAdding(true); setEditId(null); setForm({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي", group:"A", edu:"بكالوريوس", phone:"", id: Date.now() }); };
  const cancelForm = () => { setEditId(null); setAdding(false); };
  const saveEmp = () => {
    if (!form.name.trim() || !form.jobNum.trim()) return showToast("الاسم والرقم الوظيفي مطلوبان");
    if (adding) setEmployees(p => [...p, {...form, id: Date.now()}]);
    else setEmployees(p => p.map(e => e.id===editId ? {...form, id:editId} : e));
    cancelForm();
  };
  const deleteEmp = (id) => { setEmployees(p => p.filter(e => e.id!==id)); setDelConf(null); showToast("✓ تم حذف الموظف"); };

  const DEPT_COLORS = { "قسم السيطرة والنظم":"bg-blue-100 text-blue-800", "شعبة مستودع الفاو":"bg-emerald-100 text-emerald-800", "شعبة المرافئ":"bg-indigo-100 text-indigo-800" };
  const SHIFT_COLORS = { صباحي:"bg-amber-100 text-amber-700", مناوبة:"bg-indigo-100 text-indigo-700" };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1"><Search size={13} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-xs outline-none w-full"/></div>
        <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-4 py-2 rounded-xl"><Plus size={14}/> إضافة موظف</button>
        <span className="text-xs text-slate-400">{employees.length} موظف</span>
      </div>

      {(adding || editId) && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-5">
          <div className="flex justify-between mb-4"><h4 className="font-bold">{adding ? "إضافة موظف" : "تعديل موظف"}</h4><button onClick={cancelForm}><X size={15}/></button></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[["الاسم الكامل","name"],["الرقم الوظيفي","jobNum"],["العنوان الوظيفي","title"],["رقم الهاتف","phone"]].map(([l,k])=>(
              <div key={k}><label className="block text-[11px] font-bold text-slate-500 mb-1">{l}</label><input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-xs"/></div>
            ))}
            <div><label className="block text-[11px] font-bold text-slate-500 mb-1">القسم</label><select value={form.dept} onChange={e=>setForm(p=>({...p,dept:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-xs"><option>قسم السيطرة والنظم</option><option>شعبة مستودع الفاو</option><option>شعبة المرافئ</option></select></div>
            <div><label className="block text-[11px] font-bold text-slate-500 mb-1">نظام الدوام</label><select value={form.shift} onChange={e=>setForm(p=>({...p,shift:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-xs"><option>صباحي</option><option>مناوبة</option></select></div>
            {form.shift==="مناوبة" && <div><label className="block text-[11px] font-bold text-slate-500 mb-1">المجموعة</label><select value={form.group} onChange={e=>setForm(p=>({...p,group:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-xs"><option>A</option><option>B</option><option>C</option><option>D</option></select></div>}
          </div>
          <div className="flex gap-2 justify-end mt-4"><button onClick={cancelForm} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button><button onClick={saveEmp} className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl"><Save size={13}/> حفظ</button></div>
        </div>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b bg-slate-50">{["#","الاسم","الرقم","المسمى","القسم","الدوام","الهاتف","إجراءات"].map(h=><th key={h} className="px-3 py-3 text-[10px] font-bold text-slate-400">{h}</th>)}</tr></thead>
      <tbody>{filtered.map((emp,i)=>(
        <tr key={emp.id} className="border-b border-slate-50"><td className="px-3 py-3 text-slate-400">{String(emp.id).slice(-3)}</td><td className="px-3 py-3 font-semibold">{emp.name}</td><td className="px-3 py-3 font-mono">{emp.jobNum}</td>
        <td className="px-3 py-3">{emp.title}</td><td className="px-3 py-3"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DEPT_COLORS[emp.dept]||""}`}>{emp.dept}</span></td>
        <td className="px-3 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SHIFT_COLORS[emp.shift]||""}`}>{emp.shift}{emp.group?` [${emp.group}]`:""}</span></td>
        <td className="px-3 py-3 font-mono">{emp.phone}</td><td className="px-3 py-3"><div className="flex gap-1"><button onClick={()=>openEdit(emp)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={12}/></button><button onClick={()=>setDelConf(emp.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button></div></td></tr>))}</tbody></table></div></div>

      {delConf && (<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setDelConf(null)}><div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center" onClick={e=>e.stopPropagation()}><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-500"/></div><p className="font-bold mb-1">تأكيد الحذف</p><p className="text-sm text-slate-500 mb-5">هل تريد حذف هذا الموظف؟</p><div className="flex gap-2"><button onClick={()=>setDelConf(null)} className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button><button onClick={()=>deleteEmp(delConf)} className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-xl">حذف</button></div></div></div>)}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== لوحة التحكم الرئيسية الكاملة ==========
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const [receipt, setReceipt] = useState(null);
  const [empSignatures, setEmpSignatures] = useLocalStorage("boc_signatures", {});
  const [allRequests, setAllRequests] = useFirebase("requests", []);
  const [employees, setEmployees] = useFirebase("employees", ACCOUNTS);
  const [notifications, setNotifications] = useFirebase(`notifications/${emp.id}`, []);
  const [history, setHistory] = useFirebase(`history/${emp.id}`, []);
  const { isConnected } = useConnectionStatus();

  const isAdmin = emp.role === "admin" || emp.jobNum === "728004";
  const isInventoryMgr = emp.role === "inventory_manager" || emp.jobNum === "790885";
  const pendingCount = (allRequests || []).filter(r => r.status === "بانتظار المراجعة").length;
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  useEffect(() => {
    const cleanup = setupIdleDetection(onLogout);
    return cleanup;
  }, [onLogout]);

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

  const handleSubmit = (leave) => {
    const rec = { ...leave, id: Date.now(), submittedAt: new Date().toISOString(), status: "بانتظار المراجعة", empId: emp.id, empName: emp.name, empTitle: emp.title, empDept: emp.dept, empJobNum: emp.jobNum };
    setHistory([rec, ...(history || [])]);
    setAllRequests([rec, ...(allRequests || [])]);
    setReceipt(rec);
    setView("receipt");
  };

  const handleApproval = (reqId, decision, adminNote = "") => {
    const newStatus = decision === "approve" ? "موافق عليها" : decision === "cancel" ? "ملغي" : "مرفوضة";
    const timestamp = new Date().toISOString();
    const updatedRequests = (allRequests || []).map(r => r.id === reqId ? { ...r, status: newStatus, decidedAt: timestamp, decidedBy: emp.name, adminNote } : r);
    setAllRequests(updatedRequests);
    fb.get(`history/${updatedRequests.find(r=>r.id===reqId)?.empId}`).then(empHist => {
      const prev = Array.isArray(empHist) ? empHist : [];
      fb.set(`history/${updatedRequests.find(r=>r.id===reqId)?.empId}`, prev.map(h => h.id === reqId ? { ...h, status: newStatus, decidedAt: timestamp, decidedBy: emp.name, adminNote } : h));
    });
  };

  const getMonthlyUsed = (type) => (history || []).filter(h => h.type === type && new Date(h.submittedAt).getMonth() === new Date().getMonth()).reduce((s,h)=>s+h.days, 0);
  const monthlyTotal = ["اعتيادية","مرضية","زمنية"].reduce((s,t)=>s+getMonthlyUsed(t), 0);
  const monthName = new Date().toLocaleDateString("ar-IQ",{month:"long",year:"numeric"});

  const menuItems = [
    { id: "home", label: "الرئيسية", icon: <Home size={14}/> },
    { id: "form", label: "طلب إجازة", icon: <FileText size={14}/> },
    { id: "materials", label: "طلب مواد", icon: <Package size={14}/> },
    { id: "attendance", label: "الحضور", icon: <Calendar size={14}/> },
    { id: "training", label: "التدريب", icon: <GraduationCap size={14}/> },
    { id: "reports", label: "التقارير", icon: <BarChart size={14}/> },
    { id: "changepass", label: "تغيير كلمة المرور", icon: <Shield size={14}/> },
  ];

  if (!isAdmin) {
    menuItems.push({ id: "notifications", label: "الإشعارات", icon: <Bell size={14}/>, badge: unreadCount });
  }

  if (isAdmin) {
    menuItems.push(
      { id: "approvals", label: "الموافقات", icon: <ThumbsUp size={14}/>, badge: pendingCount },
      { id: "employees", label: "إدارة الموظفين", icon: <Users size={14}/> },
      { id: "inventory", label: "جرد المخزن", icon: <Layers size={14}/> },
      { id: "furniture", label: "جرد الأثاث", icon: <ClipboardList size={14}/> },
      { id: "projects", label: "المشاريع", icon: <FolderOpen size={14}/> },
      { id: "loginhistory", label: "سجل الدخول", icon: <Clock size={14}/> },
      { id: "auditlog", label: "سجل التعديلات", icon: <ClipboardList size={14}/> }
    );
  }

  if (isInventoryMgr && !isAdmin) {
    menuItems.push(
      { id: "inventory", label: "جرد المخزن", icon: <Layers size={14}/> },
      { id: "furniture", label: "جرد الأثاث", icon: <ClipboardList size={14}/> }
    );
  }

  const STATUS_STYLE = { "بانتظار المراجعة": "bg-amber-100 text-amber-700", "موافق عليها": "bg-emerald-100 text-emerald-700", "مرفوضة": "bg-red-100 text-red-700" };

  return (
    <div className="min-h-screen bg-[#f0f4fa] flex flex-col md:flex-row" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');*{font-family:'IBM Plex Sans Arabic',sans-serif;}@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu .3s ease both}@media print{.no-print{display:none!important}}`}</style>

      {/* Sidebar */}
      <aside className="no-print hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0 min-h-screen sticky top-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-full bg-blue-800 border border-blue-600 flex items-center justify-center"><span className="text-white font-bold text-xs">BOC</span></div>
          <div><p className="text-xs font-bold text-white">شركة نفط البصرة</p><p className="text-[10px] text-blue-400">شعبة مستودع الفاو</p></div></div>
          <div className="bg-slate-800 rounded-xl px-3 py-2"><p className="text-xs font-bold text-slate-200 truncate">{emp.name.split(" ").slice(0,3).join(" ")}</p><p className="text-[10px] text-slate-400">{emp.title}</p>{isAdmin && <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1 mt-1"><Shield size={10}/> مشرف</span>}</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${view===item.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
              {item.badge > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{item.badge}</span>}
            </button>
          ))}
          <div className="border-t border-slate-800 pt-3 mt-3">
            <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40"><LogOut size={14}/> تسجيل الخروج</button>
          </div>
        </nav>
        <div className="px-3 pb-3"><div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-slate-400"><div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}/>{isConnected ? "متصل بالسحابة" : "وضع غير متصل"}</div></div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="no-print md:hidden bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center"><span className="text-white font-bold text-[10px]">BOC</span></div><p className="text-white text-xs font-bold">شعبة الفاو</p></div><button onClick={onLogout} className="text-white/70"><LogOut size={16}/></button></header>

        <main className="flex-1 p-4 md:p-6 space-y-5 pb-24 md:pb-6 overflow-y-auto">
          {view === "home" && (
            <div className="fu space-y-5">
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden"><div className="p-5 flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-xl">{emp.name[0]}</div>
              <div className="flex-1"><p className="font-bold text-slate-900">مرحباً، {emp.name.split(" ")[0]}</p><p className="text-xs text-slate-500">{emp.title} · {emp.dept}</p><div className="flex gap-2 mt-1.5"><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{emp.jobNum}</span><span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{emp.shift}{emp.group?` [${emp.group}]`:""}</span></div></div></div>
              <div className="border-t px-5 py-3 bg-slate-50 flex justify-between items-center flex-wrap gap-2"><p className="text-[11px] font-bold text-slate-600">إجازاتي في {monthName}</p><div className="flex gap-2 flex-wrap">{[
                {key:"اعتيادية",color:"text-blue-700 bg-blue-50",max:30},{key:"مرضية",color:"text-rose-700 bg-rose-50",max:15},{key:"زمنية",color:"text-amber-700 bg-amber-50",max:7}
              ].map(t=><span key={t.key} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${t.color}`}>{t.key}: {toArabicNum(getMonthlyUsed(t.key))}/{t.max}</span>)}<span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-200">إجمالي: {toArabicNum(monthlyTotal)}</span></div></div></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="bg-orange-50 border border-orange-200 rounded-2xl p-4"><span className="text-2xl">⚠️</span><p className="text-sm font-bold text-orange-800">اعتيادية أكثر من ٣ أيام</p><p className="text-[11px] text-orange-700">يجب موافقة مدير القسم</p></div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4"><span className="text-2xl">🛂</span><p className="text-sm font-bold text-red-800">السفر خارج العراق</p><p className="text-[11px] text-red-700">يجب موافقة مدير الهيأة</p></div></div>

              <div><h3 className="text-sm font-bold text-slate-700 mb-3">تقديم طلب إجازة</h3><div className="grid grid-cols-3 gap-3">{[
                {type:"اعتيادية",icon:"🏖️",gradient:"from-blue-600 to-blue-800"},{type:"مرضية",icon:"🏥",gradient:"from-rose-600 to-rose-800"},{type:"زمنية",icon:"⏱️",gradient:"from-amber-500 to-amber-700"}
              ].map(lt=><button key={lt.type} onClick={()=>setView("form")} className={`bg-gradient-to-br ${lt.gradient} text-white rounded-2xl p-5 text-right shadow-md`}><span className="text-3xl mb-2 block">{lt.icon}</span><p className="font-bold text-sm">{LEAVE_TYPES[lt.type].label}</p><p className="text-white/70 text-xs mt-1">حتى {LEAVE_TYPES[lt.type].max} يوم</p></button>)}</div></div>

              <div><h3 className="text-sm font-bold text-slate-700 mb-3 flex justify-between">تاريخ طلباتي<span className="text-[11px] text-slate-400">إجمالي: {(history||[]).length}</span></h3>
              {(history||[]).length === 0 ? <div className="bg-white border-dashed border rounded-2xl p-8 text-center"><FileText size={24} className="text-slate-300 mx-auto"/><p className="text-sm text-slate-400">لا يوجد طلبات</p></div>
              : <div className="space-y-2">{(history||[]).map(h => {
                const live = (allRequests||[]).find(r => r.id === h.id);
                const status = live?.status || h.status;
                const adminNote = live?.adminNote || "";
                return (<div key={h.id} className={`bg-white rounded-2xl border p-4 ${status==="موافق عليها"?"border-emerald-200":status==="مرفوضة"?"border-red-200":"border-slate-200"}`}>
                  <div className="flex justify-between"><span className="text-xs font-bold">{LEAVE_TYPES[h.type]?.label} — {toArabicNum(h.days)} يوم</span><span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[status]||""}`}>{status}</span></div>
                  <p className="text-[11px] text-slate-500 mt-1">من {arabicDate(h.dateFrom)} إلى {arabicDate(h.dateTo)}</p>
                  {adminNote && <div className="text-[11px] bg-blue-50 rounded-xl p-2.5 mt-2"><span className="font-bold text-blue-700">📋 ملاحظة:</span> {adminNote}</div>}
                </div>);
              })}</div>}</div>
            </div>
          )}

          {view === "form" && <LeaveForm emp={emp} history={history} onSubmit={handleSubmit} onCancel={()=>setView("home")}/>}
          {view === "receipt" && receipt && <LeaveReceipt emp={emp} leave={receipt} onClose={()=>setView("home")}/>}
          {view === "materials" && <MaterialRequest emp={emp} empSignatures={empSignatures} setEmpSignatures={setEmpSignatures}/>}
          {view === "changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout}/>}
          {view === "employees" && isAdmin && <EmployeeManager employees={employees} setEmployees={setEmployees}/>}
          {view === "attendance" && <div className="bg-white rounded-2xl p-8 text-center"><Clock size={40} className="mx-auto text-slate-300"/><p className="text-slate-500 mt-2">نظام الحضور - قيد التطوير</p></div>}
          {view === "training" && <div className="bg-white rounded-2xl p-8 text-center"><GraduationCap size={40} className="mx-auto text-slate-300"/><p className="text-slate-500 mt-2">نظام التدريب - قيد التطوير</p></div>}
          {view === "reports" && <div className="bg-white rounded-2xl p-8 text-center"><BarChart size={40} className="mx-auto text-slate-300"/><p className="text-slate-500 mt-2">التقارير - قيد التطوير</p></div>}
          {view === "notifications" && !isAdmin && <div className="space-y-3"><h2 className="font-bold text-slate-800">إشعاراتي</h2>{(notifications||[]).length===0?<div className="bg-white rounded-2xl p-10 text-center"><Bell size={28} className="text-slate-300 mx-auto"/><p className="text-sm text-slate-400">لا توجد إشعارات</p></div>:notifications.map(n=><div key={n.id} className={`bg-white rounded-2xl border p-4 ${n.read?"border-slate-200":"border-blue-300 bg-blue-50/30"}`}><p className="font-bold">{n.title}</p><p className="text-sm text-slate-500">{n.body}</p></div>)}</div>}
          {view === "approvals" && isAdmin && <div className="space-y-4"><h2 className="font-bold text-slate-800">الموافقات ({pendingCount})</h2>{(allRequests||[]).filter(r=>r.status==="بانتظار المراجعة").map(req=><div key={req.id} className="bg-white rounded-2xl border p-4"><div className="flex justify-between"><div><p className="font-bold">{req.empName}</p><p className="text-xs text-slate-500">{req.type} — {req.days} يوم</p></div><div className="flex gap-2"><button onClick={()=>handleApproval(req.id,"approve")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">قبول</button><button onClick={()=>handleApproval(req.id,"reject")} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold">رفض</button></div></div></div>)}</div>}
          {view === "inventory" && <div className="bg-white rounded-2xl p-8 text-center"><Package size={40} className="mx-auto text-slate-300"/><p className="text-slate-500 mt-2">جرد المخزن - قيد التطوير</p></div>}
          {view === "furniture" && <div className="bg-white rounded-2xl p-8 text-center"><ClipboardList size={40} className="mx-auto text-slate-300"/><p className="text-slate-500 mt-2">جرد الأثاث - قيد التطوير</p></div>}
          {view === "projects" && <div className="bg-white rounded-2xl p-8 text-center"><FolderOpen size={40} className="mx-auto text-slate-300"/><p className="text-slate-500 mt-2">المشاريع - قيد التطوير</p></div>}
          {view === "loginhistory" && isAdmin && <div className="bg-white rounded-2xl p-8 text-center"><Clock size={40} className="mx-auto text-slate-300"/><p className="text-slate-500 mt-2">سجل الدخول - قيد التطوير</p></div>}
          {view === "auditlog" && isAdmin && <div className="bg-white rounded-2xl p-8 text-center"><ClipboardList size={40} className="mx-auto text-slate-300"/><p className="text-slate-500 mt-2">سجل التعديلات - قيد التطوير</p></div>}
        </main>
      </div>
    </div>
  );
}

// ========== التطبيق الرئيسي ==========
export default function App() {
  const [user, setUser] = useState(null);

  return user ? <Dashboard emp={user} onLogout={() => { sessionStorage.clear(); setUser(null); }} /> : <LoginScreen onLogin={setUser} />;
}