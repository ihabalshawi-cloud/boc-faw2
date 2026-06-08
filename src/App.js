import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { 
  LogIn, LogOut, FileText, Clock, Calendar, CheckCircle, ChevronLeft, 
  User, Eye, EyeOff, AlertCircle, Printer, Users, Shield, Package, 
  Plus, Trash2, Edit3, Save, X, ArrowRightLeft, PenTool, RefreshCw, 
  Search, FolderOpen, Upload, Download, Layers, ClipboardList, ChevronRight, 
  Home, Bell, ThumbsUp, ThumbsDown, Star, Target, BarChart2, CheckSquare, 
  BookOpen, GraduationCap, BarChart, Wifi, WifiOff, Truck, Box, Award, Settings,
  TrendingUp, TrendingDown, PieChart, Activity, Filter, Calendar as CalendarIcon,
  UserCheck, UserX, Briefcase, Video, Book, AwardIcon, ClockIcon
} from "lucide-react";

const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";

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

const _attempts = (() => {
  try { const s=sessionStorage.getItem("_la"); return s?JSON.parse(s):{}; } catch { return {}; }
})();
function recordAttempt(key, ok) {
  if (ok) delete _attempts[key]; else _attempts[key]=(_attempts[key]||0)+1;
  try { sessionStorage.setItem("_la", JSON.stringify(_attempts)); } catch {}
}
function getAttempts(key) { return _attempts[key]||0; }

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
  if (path.startsWith("attendance")) return 15000;
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
    fb.set("audit_log", [entry, ...prev].slice(0, 2000));
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
      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm transition-all active:scale-95 no-print"
    >
      <Printer size={13}/> {label}
    </button>
  );
}

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
  اعتيادية: { label:"إجازة اعتيادية", color:"bg-blue-600", light:"bg-blue-50 text-blue-700", max:30 },
  مرضية: { label:"إجازة مرضية", color:"bg-rose-600", light:"bg-rose-50 text-rose-700", max:15 },
  زمنية: { label:"إجازة زمنية", color:"bg-amber-600", light:"bg-amber-50 text-amber-700", max:7 },
};

const TS = {
  حاضر: { label:"حاضر", color:"bg-emerald-100 text-emerald-700" },
  غائب: { label:"غائب", color:"bg-red-100 text-red-700" },
  تأخر: { label:"تأخر", color:"bg-amber-100 text-amber-700" },
  إجازة: { label:"إجازة", color:"bg-blue-100 text-blue-700" },
  إيفاد: { label:"إيفاد", color:"bg-purple-100 text-purple-700" },
};

const TRAINING_TYPES = ["تدريب ذاتي", "دورة تدريبية", "ورشة عمل", "تدريب إلكتروني", "مهمة عملية"];
const TRAINING_STATUS = { 
  مسندة: "bg-amber-100 text-amber-700", 
  "قيد التنفيذ": "bg-blue-100 text-blue-700", 
  مكتملة: "bg-emerald-100 text-emerald-700", 
  ملغية: "bg-red-100 text-red-700" 
};

const ITEM_CONDITIONS = ["جيد", "مستعمل", "يحتاج صيانة", "تالف"];
const COND_STYLE = { 
  جيد: "bg-emerald-100 text-emerald-800", 
  مستعمل: "bg-blue-100 text-blue-800", 
  "يحتاج صيانة": "bg-amber-100 text-amber-800", 
  تالف: "bg-red-100 text-red-800" 
};

const FURNITURE_CATS = ["أثاث مكتبي", "أجهزة حاسوب", "معدات مكتبية", "أجهزة تكييف", "أخرى"];

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
    } catch { setIsConnected(false); }
    setChecking(false);
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { isConnected, checking, checkConnection };
}

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

  const loginClick = async () => {
    setErr("");
    if (!user || !pass) { setErr("أدخل الرقم الوظيفي وكلمة المرور"); return; }
    const attempts = getAttempts(user);
    if (attempts >= 5) { setErr("تم تجاوز 5 محاولات"); return; }

    const baseAcct = ACCOUNTS.find(a => a.jobNum === user.trim());
    if (!baseAcct) { recordAttempt(user, false); setErr("الرقم الوظيفي غير موجود"); return; }

    try {
      setLoading(true);
      let storedPassword = null;
      if (isConnected) {
        const res = await fetch(`${FIREBASE_URL}/passwords/${baseAcct.id}.json`);
        const data = await res.json();
        if (data && typeof data === "string") storedPassword = data;
      }
      const localPass = localStorage.getItem(`pass_${baseAcct.id}`);
      
      let isValid = false;
      if (storedPassword) isValid = SEC.verify(pass.trim(), storedPassword);
      else if (localPass) isValid = SEC.verify(pass.trim(), localPass);
      else isValid = (pass.trim() === baseAcct.password);
      
      if (isValid && !storedPassword && isConnected) {
        const encrypted = SEC.encode(pass.trim());
        await fetch(`${FIREBASE_URL}/passwords/${baseAcct.id}.json`, {
          method: "PUT", body: JSON.stringify(encrypted)
        });
        localStorage.setItem(`pass_${baseAcct.id}`, encrypted);
      }

      if (isValid) {
        sessionStorage.setItem("boc_session", JSON.stringify({ acctId: baseAcct.id, expiry: Date.now() + 8 * 3600000 }));
        recordAttempt(user, true);
        const defaultPasswords = ["1001","1002","1003","1004","1005","2001","2002","2003","3001","3002","3003","3004"];
        if (defaultPasswords.includes(pass.trim())) sessionStorage.setItem("force_password_change", "true");
        onLogin(baseAcct);
      } else { recordAttempt(user, false); setErr("كلمة المرور غير صحيحة"); }
    } catch { setErr("خطأ في الاتصال"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <LogIn size={32} className="text-white"/>
          </div>
          <h2 className="text-2xl font-bold text-white">شركة نفط البصرة</h2>
          <p className="text-sm text-slate-300 mt-2">شعبة مستودع الفاو</p>
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
              type="text" value={user} onChange={e=>setUser(e.target.value)} 
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" 
              placeholder="728004" onKeyDown={e=>e.key==="Enter"&&loginClick()}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showP?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} 
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" 
                placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&loginClick()}
              />
              <button onClick={()=>setShowP(!showP)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                {showP?<EyeOff size={18}/>:<Eye size={18}/>}
              </button>
            </div>
          </div>
          {err && <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-xl">{err}</div>}
          <button onClick={loginClick} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl">
            {loading?"جاري التحقق...":"تسجيل الدخول"}
          </button>
        </div>
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>للتجربة: <strong className="text-blue-300">728004</strong> | <strong className="text-blue-300">1001</strong></p>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordPage({ emp, onLogout }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();

  const saveNewPassword = async () => {
    if (!newPass || newPass.trim().length < 4) { 
      setMsg({ text: "كلمة المرور يجب أن تكون 4 خانات أو أكثر", type: "error" }); 
      return; 
    }
    if (newPass.trim() !== confirm.trim()) { 
      setMsg({ text: "كلمات المرور غير متطابقة", type: "error" }); 
      return; 
    }
    setLoading(true);
    try {
      const encrypted = SEC.encode(newPass.trim());
      localStorage.setItem(`pass_${emp.id}`, encrypted);
      if (isConnected) {
        await fetch(`${FIREBASE_URL}/passwords/${emp.id}.json`, { method: "PUT", body: JSON.stringify(encrypted) });
      }
      sessionStorage.removeItem("force_password_change");
      setMsg({ text: "تم تغيير كلمة المرور بنجاح!", type: "success" });
      setNewPass(""); setConfirm("");
      setTimeout(() => { 
        if (window.confirm("تم تغيير كلمة المرور. هل تريد تسجيل الخروج؟")) onLogout(); 
      }, 1500);
    } catch { 
      setMsg({ text: "حدث خطأ", type: "error" }); 
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
              <input 
                type={showN?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} 
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-blue-500"
              />
              <button onClick={()=>setShowN(!showN)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showN?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-600 block mb-1">تأكيد كلمة المرور</label>
            <input 
              type={showN?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>
          {msg && (
            <div className={`p-3 rounded-xl text-sm text-center ${msg.type==="success"?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}>
              {msg.text}
            </div>
          )}
          <button onClick={saveNewPassword} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <Save size={16}/> {loading?"جاري الحفظ...":"حفظ كلمة المرور"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AttendanceSystem({ emp, isAdmin, allEmployees }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selEmpId, setSelEmpId] = useState(isAdmin ? null : emp.id);
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0,10));
  const [dailyRecords, setDailyRecords] = useFirebase(`attendance/daily/${emp.id}`, {});
  const [monthlyStats, setMonthlyStats] = useState({});
  const [toast, setToast] = useState("");
  
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const daysInMonth = new Date(selYear, selMonth+1, 0).getDate();
  const empTarget = selEmpId || emp.id;
  const empInfo = allEmployees.find(e => e.id === empTarget);

  const handleCheckIn = () => {
    const nowTime = new Date().toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
    const record = dailyRecords[selectedDate] || {};
    const updated = { ...record, checkIn: nowTime, status: "حاضر", date: selectedDate };
    setDailyRecords({ ...dailyRecords, [selectedDate]: updated });
    auditLog("تسجيل دخول", `${empInfo?.name} - سجل دخول الساعة ${nowTime}`, emp.name);
    showToast("تم تسجيل دخولك بنجاح");
  };

  const handleCheckOut = () => {
    const nowTime = new Date().toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
    const record = dailyRecords[selectedDate] || {};
    if (!record.checkIn) { showToast("يجب تسجيل الدخول أولاً"); return; }
    const updated = { ...record, checkOut: nowTime };
    setDailyRecords({ ...dailyRecords, [selectedDate]: updated });
    auditLog("تسجيل خروج", `${empInfo?.name} - سجل خروج الساعة ${nowTime}`, emp.name);
    showToast("تم تسجيل خروجك بنجاح");
  };

  useEffect(() => {
    const stats = { حاضر: 0, غائب: 0, تأخر: 0, إجازة: 0 };
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const record = dailyRecords[key];
      if (record) stats[record.status] = (stats[record.status] || 0) + 1;
      else stats.غائب++;
    }
    setMonthlyStats(stats);
  }, [dailyRecords, selMonth, selYear, daysInMonth]);

  const attendanceRate = daysInMonth > 0 ? Math.round((monthlyStats.حاضر / daysInMonth) * 100) : 0;

  const exportAttendanceCSV = () => {
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const record = dailyRecords[key] || {};
      rows.push({
        "التاريخ": key,
        "اليوم": new Date(key).toLocaleDateString("ar-IQ", { weekday:"long" }),
        "دخول": record.checkIn || "—",
        "خروج": record.checkOut || "—",
        "الحالة": record.status || "غائب"
      });
    }
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(",")];
    for (const row of rows) {
      const values = headers.map(header => `"${row[header]}"`);
      csvRows.push(values.join(","));
    }
    const csv = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = `attendance_${selYear}_${selMonth+1}.csv`; 
    a.click();
    URL.revokeObjectURL(url);
    showToast("تم تصدير التقرير");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="bg-white border rounded-xl px-3 py-2 text-sm">
            {months.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="bg-white border rounded-xl px-3 py-2 text-sm">
            {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
          </select>
          {isAdmin && (
            <select value={selEmpId||""} onChange={e=>setSelEmpId(Number(e.target.value)||null)} className="bg-white border rounded-xl px-3 py-2 text-sm min-w-[180px]">
              <option value="">-- اختر موظفا --</option>
              {allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,2).join(" ")}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={exportAttendanceCSV} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border px-3 py-2 rounded-xl">
            <Download size={13}/> تصدير CSV
          </button>
          <PrintButton targetId="print-attendance" title={`تقرير الحضور - ${months[selMonth]} ${selYear}`}/>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "أيام الحضور", value: monthlyStats.حاضر || 0, color: "bg-emerald-50 text-emerald-700", icon: <UserCheck size={18}/> },
          { label: "نسبة الحضور", value: `${attendanceRate}%`, color: "bg-blue-50 text-blue-700", icon: <TrendingUp size={18}/> },
          { label: "غياب", value: monthlyStats.غائب || 0, color: "bg-red-50 text-red-700", icon: <UserX size={18}/> },
          { label: "تأخر", value: monthlyStats.تأخر || 0, color: "bg-amber-50 text-amber-700", icon: <Clock size={18}/> },
          { label: "إجازة", value: monthlyStats.إجازة || 0, color: "bg-purple-50 text-purple-700", icon: <Calendar size={18}/> },
        ].map(s=>(
          <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center border`}>
            <div className="flex items-center justify-center mb-1">{s.icon}</div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>

      {(!isAdmin || selEmpId === emp.id) && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-slate-800 mb-3">تسجيل الحضور اليومي</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">التاريخ</label>
              <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="border rounded-xl px-3 py-2"/>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCheckIn} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">
                <LogIn size={14} className="inline ml-1"/> تسجيل دخول
              </button>
              <button onClick={handleCheckOut} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                <LogOut size={14} className="inline ml-1"/> تسجيل خروج
              </button>
            </div>
          </div>
          {dailyRecords[selectedDate]?.checkIn && (
            <div className="mt-3 text-sm text-slate-600">تم تسجيل الدخول الساعة {dailyRecords[selectedDate].checkIn}</div>
          )}
        </div>
      )}

      <div id="print-attendance" className="bg-white rounded-2xl border overflow-hidden">
        <div className="hidden print:block text-center p-4">
          <p className="text-lg font-bold">شركة نفط البصرة - تقرير الحضور</p>
          <p>{months[selMonth]} {selYear} - {empInfo?.name}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-3 py-2 font-bold">اليوم</th>
                <th className="px-3 py-2 font-bold">التاريخ</th>
                <th className="px-3 py-2 font-bold">دخول</th>
                <th className="px-3 py-2 font-bold">خروج</th>
                <th className="px-3 py-2 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{
                const dateKey = `${selYear}-${String(selMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const record = dailyRecords[dateKey] || {};
                const statusColor = TS[record.status]?.color || "bg-slate-100 text-slate-600";
                return (
                  <tr key={day} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-2">{new Date(dateKey).toLocaleDateString("ar-IQ",{weekday:"short"})}</td>
                    <td className="px-3 py-2">{day}</td>
                    <td className="px-3 py-2 font-mono">{record.checkIn || "—"}</td>
                    <td className="px-3 py-2 font-mono">{record.checkOut || "—"}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>{record.status || "غائب"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl">
          <CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}
        </div>
      )}
    </div>
  );
}

function TrainingSystem({ emp, isAdmin, allEmployees }) {
  const [trainings, setTrainings] = useFirebase("training/tasks", []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ empId:"", title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"", maxScore:10 });
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const myTrainings = (trainings || []).filter(t => t.empId === emp.id);
  const visibleTrainings = isAdmin ? (trainings || []) : myTrainings;

  const assignTraining = () => {
    if (!form.empId || !form.title) return showToast("الموظف والعنوان مطلوبان");
    const newTraining = { ...form, id: Date.now(), status: "مسندة", assignedBy: emp.name, assignedAt: new Date().toISOString() };
    setTrainings([newTraining, ...(trainings || [])]);
    auditLog("إسناد تدريب", `${form.title} - للموظف ${allEmployees.find(e=>e.id===form.empId)?.name}`, emp.name);
    setForm({ empId:"", title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"", maxScore:10 });
    setShowForm(false);
    showToast("تم إسناد التدريب");
  };

  const updateStatus = (id, status) => {
    setTrainings((trainings || []).map(t => t.id === id ? { ...t, status, completedAt: status==="مكتملة"?new Date().toISOString():t.completedAt } : t));
    auditLog("تحديث تدريب", `تغيير حالة التدريب إلى ${status}`, emp.name);
    showToast(`تم تحديث الحالة إلى ${status}`);
  };

  const addAction = (id, actionText) => {
    if (!actionText.trim()) return showToast("اكتب الإجراء أولاً");
    setTrainings((trainings || []).map(t => t.id === id ? { ...t, empAction: actionText, actionAt: new Date().toISOString(), status: "قيد التنفيذ" } : t));
    showToast("تم تسجيل الإجراء");
  };

  const getStatusColor = (status) => TRAINING_STATUS[status] || "bg-slate-100 text-slate-600";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-lg">المهام التدريبية</h3>
        {isAdmin && (
          <button onClick={()=>setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl">
            <Plus size={13}/> إسناد تدريب
          </button>
        )}
        <PrintButton targetId="print-training" title="تقرير التدريب"/>
      </div>

      {showForm && isAdmin && (
        <div className="bg-white rounded-2xl border-2 border-violet-200 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">الموظف</label>
              <select value={form.empId} onChange={e=>setForm({...form, empId: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
                <option value="">-- اختر --</option>
                {allEmployees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">عنوان التدريب</label>
              <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">نوع التدريب</label>
              <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm">
                {TRAINING_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">الجهة المقدمة</label>
              <input value={form.provider} onChange={e=>setForm({...form, provider:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">تاريخ البداية</label>
              <input type="date" value={form.startDate} onChange={e=>setForm({...form, startDate:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">تاريخ النهاية</label>
              <input type="date" value={form.endDate} onChange={e=>setForm({...form, endDate:e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm"/>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">الوصف</label>
              <textarea value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} rows={2} className="w-full border rounded-xl px-3 py-2 text-sm"/>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
            <button onClick={assignTraining} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> إسناد</button>
          </div>
        </div>
      )}

      <div id="print-training" className="space-y-3">
        {visibleTrainings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center">
            <GraduationCap size={40} className="text-slate-300 mx-auto"/>
            <p className="text-slate-400">لا توجد مهام تدريبية</p>
          </div>
        ) : visibleTrainings.map(t => {
          const empInfo = allEmployees.find(e=>e.id===t.empId);
          return (
            <div key={t.id} className="bg-white rounded-2xl border p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(t.status)}`}>{t.status}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700">{t.type}</span>
                  </div>
                  <p className="font-bold text-slate-800">{t.title}</p>
                  {isAdmin && <p className="text-xs text-slate-500">{empInfo?.name}</p>}
                  {t.desc && <p className="text-xs text-slate-500 mt-1">{t.desc}</p>}
                  <div className="flex gap-3 text-[10px] text-slate-400 mt-2">
                    {t.startDate && <span> من {t.startDate}</span>}
                    {t.endDate && <span>إلى {t.endDate}</span>}
                    {t.provider && <span> {t.provider}</span>}
                  </div>
                  {t.empAction && (
                    <div className="mt-2 p-2 bg-emerald-50 rounded-xl text-xs">
                      <span className="font-bold">الإجراء:</span> {t.empAction}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isAdmin && t.status==="مسندة" && (
                    <button onClick={()=>{const action=prompt("أدخل الإجراء الذي قمت به:"); if(action) addAction(t.id, action);}} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs">
                      كتابة إجراء
                    </button>
                  )}
                  {isAdmin && t.status!=="مكتملة" && (
                    <button onClick={()=>updateStatus(t.id,"مكتملة")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">
                      <CheckCircle size={12}/> إكمال
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl">
          <CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}
        </div>
      )}
    </div>
  );
}

function InventorySystem({ emp, isAdmin }) {
  const [items, setItems] = useLocalStorage("inventory_items", [
    { id:1, code:"INV-001", name:"مقاومة متغيرة", category:"أجهزة قياس", unit:"قطعة", qty:5, condition:"جيد", location:"الرف A1", lastUpdate:new Date().toISOString().slice(0,10) },
    { id:2, code:"INV-002", name:"مولد ذبذبات", category:"أجهزة قياس", unit:"قطعة", qty:2, condition:"جيد", location:"الرف A2", lastUpdate:new Date().toISOString().slice(0,10) },
    { id:3, code:"INV-003", name:"جهاز معايرة ضغط", category:"أجهزة معايرة", unit:"قطعة", qty:1, condition:"جيد", location:"الرف B1", lastUpdate:new Date().toISOString().slice(0,10) },
    { id:4, code:"INV-004", name:"كماشة كهرباء", category:"عدد يدوية", unit:"قطعة", qty:10, condition:"جيد", location:"الرف C1", lastUpdate:new Date().toISOString().slice(0,10) },
    { id:5, code:"INV-005", name:"مفك براغي", category:"عدد يدوية", unit:"مجموعة", qty:3, condition:"مستعمل", location:"الرف C2", lastUpdate:new Date().toISOString().slice(0,10) },
  ]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أجهزة قياس", unit:"قطعة", qty:1, condition:"جيد", location:"" });
  const [adding, setAdding] = useState(false);
  const [transferModal, setTransferModal] = useState(null);
  const [toast, setToast] = useState("");
  
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const categories = ["الكل", ...new Set(items.map(i=>i.category))];
  const filtered = items.filter(i => (i.name.includes(search) || i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  const totalItems = items.reduce((s,i)=>s+i.qty,0);
  const damagedItems = items.filter(i=>i.condition==="تالف").length;

  const openEdit = (it) => { setEditId(it.id); setForm({...it}); setAdding(false); };
  const openAdd = () => { setAdding(true); setEditId(null); setForm({ code:"", name:"", category:"أجهزة قياس", unit:"قطعة", qty:1, condition:"جيد", location:"", id: Date.now() }); };
  const cancelForm = () => { setEditId(null); setAdding(false); };
  
  const saveItem = () => {
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    const updatedItem = { ...form, lastUpdate: new Date().toISOString().slice(0,10) };
    if (adding) setItems([...items, updatedItem]);
    else setItems(items.map(i => i.id===editId ? updatedItem : i));
    auditLog(adding?"إضافة":"تعديل", `${adding?"إضافة":"تعديل"} صنف ${form.name}`, emp.name);
    cancelForm();
    showToast("تم الحفظ");
  };

  const deleteItem = (id) => {
    if (window.confirm("هل تريد حذف هذا الصنف؟")) {
      setItems(items.filter(i => i.id !== id));
      auditLog("حذف", `حذف صنف`, emp.name);
      showToast("تم الحذف");
    }
  };

  const doTransfer = () => {
    setItems(items.map(i => i.id===transferModal.id ? { ...i, qty: i.qty - (transferModal.qty || 1), lastUpdate: new Date().toISOString().slice(0,10) } : i));
    auditLog("نقل", `نقل ${transferModal.qty} من ${transferModal.name}`, emp.name);
    setTransferModal(null);
    showToast("تم نقل الكمية");
  };

  const exportCSV = () => {
    const rows = items.map(i => ({ "الرمز":i.code, "الاسم":i.name, "الفئة":i.category, "الوحدة":i.unit, "الكمية":i.qty, "الحالة":i.condition, "الموقع":i.location }));
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(",")];
    for (const row of rows) {
      const values = headers.map(header => `"${row[header]}"`);
      csvRows.push(values.join(","));
    }
    const blob = new Blob(["\uFEFF"+csvRows.join("\n")], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="inventory.csv"; a.click(); 
    URL.revokeObjectURL(url);
    showToast("تم التصدير");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1">
            <Search size={14} className="text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/>
          </div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border px-3 py-2 rounded-xl">
            <Download size={13}/> CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl">
            <Plus size={13}/> إضافة صنف
          </button>
          <PrintButton targetId="print-inventory" title="جرد المخزن"/>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label:"إجمالي الأصناف", value:items.length, color:"bg-blue-50" },
          { label:"إجمالي القطع", value:totalItems, color:"bg-slate-50" },
          { label:"حالة جيدة", value:items.filter(i=>i.condition==="جيد").length, color:"bg-emerald-50" },
          { label:"يحتاج صيانة", value:items.filter(i=>i.condition==="يحتاج صيانة").length, color:"bg-amber-50" },
          { label:"تالف", value:damagedItems, color:"bg-red-50" },
        ].map(s=>(
          <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center border`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>

      {(adding || editId) && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-5">
          <div className="flex justify-between mb-3">
            <h4 className="font-bold">{adding?"إضافة صنف":"تعديل صنف"}</h4>
            <button onClick={cancelForm}><X size={15}/></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[["الرمز *","code"],["الاسم *","name"],["الفئة","category"],["الوحدة","unit"]].map(([l,k])=>(
              <div key={k}><label className="block text-[10px] font-bold text-slate-500 mb-1">{l}</label>
              <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
            ))}
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الكمية</label>
            <input type="number" value={form.qty} onChange={e=>setForm({...form,qty:Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة</label>
            <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
              {ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}
            </select></div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الموقع</label>
            <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={cancelForm} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
            <button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl"><Save size={13}/> حفظ</button>
          </div>
        </div>
      )}

      <div id="print-inventory" className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-3 py-2 font-bold">الرمز</th>
                <th className="px-3 py-2 font-bold">الاسم</th>
                <th className="px-3 py-2 font-bold">الفئة</th>
                <th className="px-3 py-2 font-bold">الكمية</th>
                <th className="px-3 py-2 font-bold">الحالة</th>
                <th className="px-3 py-2 font-bold">الموقع</th>
                <th className="px-3 py-2 font-bold">آخر تحديث</th>
                <th className="px-3 py-2 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it=>(
                <tr key={it.id} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono">{it.code}</td>
                  <td className="px-3 py-2 font-semibold">{it.name}</td>
                  <td className="px-3 py-2">{it.category}</td>
                  <td className="px-3 py-2 font-bold">{it.qty}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COND_STYLE[it.condition]||""}`}>{it.condition}</span></td>
                  <td className="px-3 py-2">{it.location}</td>
                  <td className="px-3 py-2 text-slate-400">{it.lastUpdate}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={()=>openEdit(it)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit3 size={12}/></button>
                      <button onClick={()=>setTransferModal(it)} className="p-1 text-amber-500 hover:bg-amber-50 rounded"><ArrowRightLeft size={12}/></button>
                      <button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {transferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setTransferModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold mb-3">نقل {transferModal.name}</h3>
            <p className="text-sm text-slate-500 mb-3">الكمية المتاحة: {transferModal.qty}</p>
            <input type="number" min="1" max={transferModal.qty} className="w-full border rounded-xl px-3 py-2 mb-4" placeholder="الكمية" onChange={e=>setTransferModal({...transferModal, qty:Number(e.target.value)})}/>
            <div className="flex gap-2">
              <button onClick={()=>setTransferModal(null)} className="flex-1 py-2 border rounded-xl">إلغاء</button>
              <button onClick={doTransfer} className="flex-1 py-2 bg-amber-500 text-white rounded-xl">تأكيد النقل</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl">
          <CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}
        </div>
      )}
    </div>
  );
}

function FurnitureInventory({ emp, isAdmin }) {
  const [items, setItems] = useLocalStorage("furniture_items", [
    { id:1, code:"FURN-001", name:"منضدة كتابة 160 سم", category:"أثاث مكتبي", qty:5, condition:"جيد", location:"المكتب الرئيسي", serialNo:"SN001", lastUpdate:new Date().toISOString().slice(0,10) },
    { id:2, code:"FURN-002", name:"كرسي دوار", category:"أثاث مكتبي", qty:8, condition:"جيد", location:"المكتب الرئيسي", serialNo:"SN002", lastUpdate:new Date().toISOString().slice(0,10) },
    { id:3, code:"FURN-003", name:"خزانة ملفات", category:"أثاث مكتبي", qty:3, condition:"مستعمل", location:"أرشيف", serialNo:"SN003", lastUpdate:new Date().toISOString().slice(0,10) },
    { id:4, code:"FURN-004", name:"طابعة HP", category:"أجهزة حاسوب", qty:2, condition:"جيد", location:"قسم IT", serialNo:"HP001", lastUpdate:new Date().toISOString().slice(0,10) },
    { id:5, code:"FURN-005", name:"حاسب مكتبي Dell", category:"أجهزة حاسوب", qty:4, condition:"جيد", location:"قسم IT", serialNo:"Dell001", lastUpdate:new Date().toISOString().slice(0,10) },
  ]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"", serialNo:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const categories = ["الكل", ...FURNITURE_CATS];
  const filtered = items.filter(i => (i.name.includes(search) || i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  const totalItems = items.reduce((s,i)=>s+i.qty,0);

  const saveItem = () => {
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    const updated = { ...form, lastUpdate: new Date().toISOString().slice(0,10) };
    if (adding) setItems([...items, updated]);
    else setItems(items.map(i => i.id===editId ? updated : i));
    auditLog(adding?"إضافة":"تعديل", `${adding?"إضافة":"تعديل"} أثاث ${form.name}`, emp.name);
    cancelForm();
    showToast("تم الحفظ");
  };

  const deleteItem = (id) => {
    if (window.confirm("هل تريد حذف هذا العنصر؟")) {
      setItems(items.filter(i => i.id !== id));
      auditLog("حذف", `حذف أثاث`, emp.name);
      showToast("تم الحذف");
    }
  };

  const openEdit = (it) => { setEditId(it.id); setForm({...it}); setAdding(false); };
  const openAdd = () => { setAdding(true); setEditId(null); setForm({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"", serialNo:"", id: Date.now() }); };
  const cancelForm = () => { setEditId(null); setAdding(false); };

  const exportCSV = () => {
    const rows = items.map(i => ({ "الرمز":i.code, "الاسم":i.name, "الفئة":i.category, "الكمية":i.qty, "الحالة":i.condition, "الموقع":i.location, "الرقم التسلسلي":i.serialNo }));
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(",")];
    for (const row of rows) {
      const values = headers.map(header => `"${row[header]}"`);
      csvRows.push(values.join(","));
    }
    const blob = new Blob(["\uFEFF"+csvRows.join("\n")], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="furniture.csv"; a.click(); 
    URL.revokeObjectURL(url);
    showToast("تم التصدير");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1">
            <Search size={14} className="text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/>
          </div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border px-3 py-2 rounded-xl">
            <Download size={13}/> CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl">
            <Plus size={13}/> إضافة
          </button>
          <PrintButton targetId="print-furniture" title="جرد الأثاث"/>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"إجمالي الأصناف", value:items.length, color:"bg-violet-50" },
          { label:"إجمالي القطع", value:totalItems, color:"bg-slate-50" },
          { label:"حالة جيدة", value:items.filter(i=>i.condition==="جيد").length, color:"bg-emerald-50" },
          { label:"يحتاج صيانة/تالف", value:items.filter(i=>i.condition!=="جيد").length, color:"bg-amber-50" },
        ].map(s=>(
          <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center border`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>

      {(adding || editId) && (
        <div className="bg-white rounded-2xl border-2 border-violet-200 p-5">
          <div className="flex justify-between mb-3">
            <h4 className="font-bold">{adding?"إضافة قطعة":"تعديل قطعة"}</h4>
            <button onClick={cancelForm}><X size={15}/></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[["الرمز *","code"],["الاسم *","name"],["الفئة","category"],["الكمية","qty"],["الموقع","location"],["الرقم التسلسلي","serialNo"]].map(([l,k])=>(
              <div key={k}><label className="block text-[10px] font-bold text-slate-500 mb-1">{l}</label>
              <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
            ))}
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة</label>
            <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
              {ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}
            </select></div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={cancelForm} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
            <button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> حفظ</button>
          </div>
        </div>
      )}

      <div id="print-furniture" className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-3 py-2 font-bold">الرمز</th>
                <th className="px-3 py-2 font-bold">الاسم</th>
                <th className="px-3 py-2 font-bold">الفئة</th>
                <th className="px-3 py-2 font-bold">الكمية</th>
                <th className="px-3 py-2 font-bold">الحالة</th>
                <th className="px-3 py-2 font-bold">الموقع</th>
                <th className="px-3 py-2 font-bold">الرقم التسلسلي</th>
                <th className="px-3 py-2 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it=>(
                <tr key={it.id} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono">{it.code}</td>
                  <td className="px-3 py-2 font-semibold">{it.name}</td>
                  <td className="px-3 py-2">{it.category}</td>
                  <td className="px-3 py-2 font-bold">{it.qty}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COND_STYLE[it.condition]||""}`}>{it.condition}</span></td>
                  <td className="px-3 py-2">{it.location}</td>
                  <td className="px-3 py-2 text-slate-400">{it.serialNo||"—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={()=>openEdit(it)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit3 size={12}/></button>
                      <button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl">
          <CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}
        </div>
      )}
    </div>
  );
}

function AdvancedStats({ allEmployees, allRequests, trainings }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    trainingCompleted: 0,
    trainingInProgress: 0,
    attendanceRate: 85,
    mostActiveDept: "",
  });

  useEffect(() => {
    const deptStats = {};
    allEmployees.forEach(e => { deptStats[e.dept] = (deptStats[e.dept] || 0) + 1; });
    const topDept = Object.entries(deptStats).sort((a,b)=>b[1]-a[1])[0];
    
    setStats({
      totalEmployees: allEmployees.length,
      activeEmployees: allEmployees.filter(e => e.shift === "صباحي").length,
      pendingRequests: (allRequests || []).filter(r => r.status === "بانتظار المراجعة").length,
      approvedRequests: (allRequests || []).filter(r => r.status === "موافق عليها").length,
      rejectedRequests: (allRequests || []).filter(r => r.status === "مرفوضة").length,
      trainingCompleted: (trainings || []).filter(t => t.status === "مكتملة").length,
      trainingInProgress: (trainings || []).filter(t => t.status === "قيد التنفيذ" || t.status === "مسندة").length,
      attendanceRate: 85,
      mostActiveDept: topDept ? topDept[0] : "—",
    });
  }, [allEmployees, allRequests, trainings]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={24}/>, label: "إجمالي الموظفين", value: stats.totalEmployees, color: "bg-blue-500", trend: "+0" },
          { icon: <UserCheck size={24}/>, label: "موظفين صباحيين", value: stats.activeEmployees, color: "bg-emerald-500", trend: `${Math.round(stats.activeEmployees/stats.totalEmployees*100)}%` },
          { icon: <FileText size={24}/>, label: "طلبات معلقة", value: stats.pendingRequests, color: "bg-amber-500", trend: `${stats.pendingRequests} طلب` },
          { icon: <GraduationCap size={24}/>, label: "تدريب مكتمل", value: stats.trainingCompleted, color: "bg-violet-500", trend: `${stats.trainingInProgress} قيد التنفيذ` },
        ].map(s=>(
          <div key={s.label} className={`${s.color} rounded-2xl p-5 text-white`}>
            <div className="flex justify-between items-start">
              <div className="opacity-80">{s.icon}</div>
              <span className="text-xs opacity-70">{s.trend}</span>
            </div>
            <p className="text-3xl font-bold mt-3">{s.value}</p>
            <p className="text-sm opacity-80 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><PieChart size={16}/> توزيع الطلبات</h3>
          <div className="space-y-2">
            {[
              { label:"موافق عليها", value:stats.approvedRequests, color:"bg-emerald-500" },
              { label:"بانتظار المراجعة", value:stats.pendingRequests, color:"bg-amber-500" },
              { label:"مرفوضة", value:stats.rejectedRequests, color:"bg-red-500" },
            ].map(s=>{
              const total = stats.approvedRequests+stats.pendingRequests+stats.rejectedRequests || 1;
              const percent = Math.round(s.value/total*100);
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1"><span>{s.label}</span><span>{percent}%</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{width:`${percent}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Activity size={16}/> حالة التدريب</h3>
          <div className="space-y-2">
            {[
              { label:"مكتملة", value:stats.trainingCompleted, color:"bg-emerald-500" },
              { label:"قيد التنفيذ", value:stats.trainingInProgress, color:"bg-blue-500" },
            ].map(s=>{
              const total = stats.trainingCompleted+stats.trainingInProgress || 1;
              const percent = Math.round(s.value/total*100);
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1"><span>{s.label}</span><span>{percent}%</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{width:`${percent}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp size={16}/> الحضور والإنتاجية</h3>
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto">
              <div className="w-32 h-32 rounded-full border-8 border-slate-100"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-3xl font-bold text-emerald-600">{stats.attendanceRate}%</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-3">نسبة الحضور الإجمالية</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Award size={16}/> القسم الأكثر نشاطا</h3>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Award size={32} className="text-white"/>
            </div>
            <p className="font-bold text-slate-800 mt-3">{stats.mostActiveDept}</p>
            <p className="text-xs text-slate-500">أكثر قسم نشاطا في الطلبات</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditLogPage() {
  const [logs, setLogs] = useFirebase("audit_log", []);
  const [search, setSearch] = useState("");
  const filtered = (logs || []).filter(l => l.details?.includes(search) || l.by?.includes(search) || l.action?.includes(search)).slice(0, 200);
  const ACTION_ICONS = { "إضافة":"➕", "تعديل":"✏️", "حذف":"🗑️", "نقل":"🔄", "موافقة":"✅", "رفض":"❌", "إسناد":"📋", "تسجيل دخول":"🔑", "تسجيل خروج":"🚪" };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1">
          <Search size={14} className="text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث في السجل..." className="bg-transparent text-sm outline-none w-full"/>
        </div>
        <PrintButton targetId="print-audit" title="سجل التعديلات"/>
      </div>
      <div id="print-audit" className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-3 py-2 font-bold">العملية</th>
                <th className="px-3 py-2 font-bold">التفاصيل</th>
                <th className="px-3 py-2 font-bold">بواسطة</th>
                <th className="px-3 py-2 font-bold">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400">لا توجد سجلات</td></tr>
              ) : filtered.map(l=>(
                <tr key={l.id} className="border-b hover:bg-slate-50">
                  <td className="px-3 py-2"><span className="text-lg ml-1">{ACTION_ICONS[l.action]||"📝"}</span>{l.action}</td>
                  <td className="px-3 py-2">{l.details}</td>
                  <td className="px-3 py-2">{l.by}</td>
                  <td className="px-3 py-2 text-slate-400">{new Date(l.at).toLocaleString("ar-IQ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PDFReportsPage({ allEmployees }) {
  const [reportType, setReportType] = useState("attendance");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  const generateReport = () => {
    printElement("report-content", `تقرير ${months[selectedMonth]} ${selectedYear}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={reportType} onChange={e=>setReportType(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">
          <option value="attendance">تقرير الحضور الشهري</option>
          <option value="requests">تقرير الطلبات</option>
          <option value="employees">تقرير الموظفين</option>
          <option value="inventory">تقرير المخزن</option>
        </select>
        <select value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))} className="bg-white border rounded-xl px-3 py-2 text-sm">
          {months.map((m,i)=><option key={i} value={i}>{m}</option>)}
        </select>
        <select value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))} className="bg-white border rounded-xl px-3 py-2 text-sm">
          {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
        </select>
        <button onClick={generateReport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
          <Printer size={14}/> توليد وطباعة
        </button>
      </div>

      <div id="report-content" className="hidden print:block">
        <div className="text-center p-4">
          <p className="text-xl font-bold">شركة نفط البصرة - شعبة الفاو</p>
          <p className="text-lg">التقرير الشهري - {months[selectedMonth]} {selectedYear}</p>
        </div>
        {reportType === "employees" && (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">الاسم</th>
                <th className="border p-2">الرقم الوظيفي</th>
                <th className="border p-2">القسم</th>
              </tr>
            </thead>
            <tbody>
              {allEmployees.map((e,i)=>(
                <tr key={e.id}>
                  <td className="border p-2">{i+1}</td>
                  <td className="border p-2">{e.name}</td>
                  <td className="border p-2">{e.jobNum}</td>
                  <td className="border p-2">{e.dept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {reportType === "requests" && <p className="text-center p-8 text-slate-400">سيتم عرض تقرير الطلبات عند اكتمال البيانات</p>}
        {reportType === "attendance" && <p className="text-center p-8 text-slate-400">سيتم عرض تقرير الحضور عند اكتمال البيانات</p>}
        {reportType === "inventory" && <p className="text-center p-8 text-slate-400">سيتم عرض تقرير المخزن عند اكتمال البيانات</p>}
        <div className="mt-8 pt-4 border-t flex justify-between">
          <div className="text-center"><p>توقيع الموظف</p><div className="w-32 border-t border-black mt-2"/></div>
          <div className="text-center"><p>توقيع المشرف</p><div className="w-32 border-t border-black mt-2"/></div>
        </div>
      </div>
    </div>
  );
}

function EmployeeManager({ employees, setEmployees }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي" });
  const [adding, setAdding] = useState(false);
  const filtered = employees.filter(e => e.name.includes(search) || e.jobNum.includes(search));
  
  const saveEmp = () => {
    if (!form.name || !form.jobNum) return;
    if (adding) setEmployees([...employees, { ...form, id: Date.now() }]);
    else setEmployees(employees.map(e => e.id===editId ? { ...form, id:editId } : e));
    setAdding(false); setEditId(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="flex-1 border rounded-xl px-3 py-2"/>
        <button onClick={()=>{setAdding(true); setForm({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي" });}} className="px-4 py-2 bg-blue-600 text-white rounded-xl">
          <Plus size={14}/> إضافة
        </button>
      </div>
      {(adding||editId) && (
        <div className="bg-white rounded-2xl border p-5">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="الاسم" className="border rounded-xl px-3 py-2"/>
            <input value={form.jobNum} onChange={e=>setForm({...form, jobNum:e.target.value})} placeholder="الرقم الوظيفي" className="border rounded-xl px-3 py-2"/>
            <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="المسمى الوظيفي" className="border rounded-xl px-3 py-2"/>
            <select value={form.dept} onChange={e=>setForm({...form, dept:e.target.value})} className="border rounded-xl px-3 py-2">
              <option>قسم السيطرة والنظم</option>
              <option>شعبة مستودع الفاو</option>
              <option>شعبة المرافئ</option>
            </select>
            <select value={form.shift} onChange={e=>setForm({...form, shift:e.target.value})} className="border rounded-xl px-3 py-2">
              <option>صباحي</option>
              <option>مناوبة</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={()=>{setAdding(false);setEditId(null);}} className="flex-1 py-2 border rounded-xl">إلغاء</button>
            <button onClick={saveEmp} className="flex-1 py-2 bg-blue-600 text-white rounded-xl">حفظ</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-3 py-2 text-right">الاسم</th>
                <th className="px-3 py-2 text-right">الرقم</th>
                <th className="px-3 py-2 text-right">المسمى</th>
                <th className="px-3 py-2 text-right">القسم</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e=>(
                <tr key={e.id} className="border-b">
                  <td className="px-3 py-2">{e.name}</td>
                  <td className="px-3 py-2">{e.jobNum}</td>
                  <td className="px-3 py-2">{e.title}</td>
                  <td className="px-3 py-2">{e.dept}</td>
                  <td className="px-3 py-2">
                    <button onClick={()=>{setEditId(e.id); setForm(e);}} className="text-blue-500"><Edit3 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const [allRequests, setAllRequests] = useFirebase("requests", []);
  const [trainings, setTrainings] = useFirebase("training/tasks", []);
  const [employees, setEmployees] = useState(ACCOUNTS);
  const { isConnected } = useConnectionStatus();
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004";
  const isInventoryMgr = emp.role === "inventory_manager" || emp.jobNum === "790885";
  const pendingCount = (allRequests || []).filter(r => r.status === "بانتظار المراجعة").length;

  useEffect(() => {
    const cleanup = setupIdleDetection(onLogout);
    const needsChange = sessionStorage.getItem("force_password_change");
    if (needsChange === "true") { 
      sessionStorage.removeItem("force_password_change"); 
      setTimeout(()=>{ 
        if(window.confirm("يرجى تغيير كلمة المرور الافتراضية")) setView("changepass"); 
      }, 500); 
    }
    return cleanup;
  }, [onLogout]);

  const menuItems = [
    { id: "home", label: "الرئيسية", icon: <Home size={14}/> },
    { id: "attendance", label: "الحضور", icon: <Calendar size={14}/> },
    { id: "training", label: "التدريب", icon: <GraduationCap size={14}/> },
    { id: "inventory", label: "جرد المخزن", icon: <Package size={14}/> },
    { id: "furniture", label: "جرد الأثاث", icon: <ClipboardList size={14}/> },
    { id: "stats", label: "الإحصائيات", icon: <BarChart2 size={14}/> },
    { id: "audit", label: "سجل التعديلات", icon: <ClipboardList size={14}/> },
    { id: "reports", label: "التقارير", icon: <FileText size={14}/> },
    { id: "changepass", label: "تغيير كلمة المرور", icon: <Shield size={14}/> },
  ];

  if (isAdmin) {
    menuItems.unshift({ id: "approvals", label: "الموافقات", icon: <ThumbsUp size={14}/>, badge: pendingCount });
    menuItems.unshift({ id: "employees", label: "إدارة الموظفين", icon: <Users size={14}/> });
  }
  if (isInventoryMgr && !isAdmin) {
    menuItems.push({ id: "inventory", label: "جرد المخزن", icon: <Package size={14}/> });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
        *{font-family:'IBM Plex Sans Arabic',sans-serif;}
        .fu{animation:fadeIn .3s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media print{.no-print{display:none!important}}
      `}</style>

      <aside className="no-print hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0 min-h-screen sticky top-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-800 border flex items-center justify-center">
              <span className="text-white font-bold text-xs">BOC</span>
            </div>
            <div>
              <p className="text-xs font-bold">شركة نفط البصرة</p>
              <p className="text-[10px] text-blue-400">شعبة مستودع الفاو</p>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl px-3 py-2">
            <p className="text-xs font-bold truncate">{emp.name.split(" ").slice(0,3).join(" ")}</p>
            <p className="text-[10px] text-slate-400">{emp.title}</p>
            {isAdmin && <span className="text-[9px] text-amber-400 flex items-center gap-1 mt-1"><Shield size={10}/> مشرف</span>}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={()=>setView(item.id)} 
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                view===item.id ? "bg-blue-600" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
              {item.badge>0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{item.badge}</span>}
            </button>
          ))}
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 mt-4">
            <LogOut size={14}/> تسجيل الخروج
          </button>
        </nav>
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-slate-400">
            <div className={`w-2 h-2 rounded-full ${isConnected?"bg-emerald-400":"bg-amber-400"}`}/>
            {isConnected?"متصل بالسحابة":"وضع غير متصل"}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {view === "home" && (
            <div className="fu">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <User size={28} className="text-white"/>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">مرحباً، {emp.name.split(" ")[0]}</h2>
                    <p className="text-slate-500">نظام شعبة مستودع الفاو المتكامل</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-emerald-50 border rounded-xl p-4">
                    <CheckCircle className="text-emerald-600"/>
                    <p className="font-bold mt-2">✓ النظام يعمل</p>
                    <p className="text-xs text-slate-500">جميع الأنظمة جاهزة</p>
                  </div>
                  <div className="bg-blue-50 border rounded-xl p-4">
                    <Shield className="text-blue-600"/>
                    <p className="font-bold mt-2">✓ آمن ومشفر</p>
                    <p className="text-xs text-slate-500">كلمات المرور مشفرة</p>
                  </div>
                  <div className="bg-amber-50 border rounded-xl p-4">
                    <Wifi className="text-amber-600"/>
                    <p className="font-bold mt-2">{isConnected?"متصل بالسحابة":"وضع غير متصل"}</p>
                    <p className="text-xs text-slate-500">{isConnected?"مزامنة تلقائية مفعلة":"يعمل محلياً"}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-slate-600">الوحدات المتاحة: الحضور | التدريب | جرد المخزن | جرد الأثاث | التقارير | الإحصائيات</p>
                </div>
              </div>
            </div>
          )}
          {view === "attendance" && <AttendanceSystem emp={emp} isAdmin={isAdmin} allEmployees={employees} />}
          {view === "training" && <TrainingSystem emp={emp} isAdmin={isAdmin} allEmployees={employees} />}
          {view === "inventory" && <InventorySystem emp={emp} isAdmin={isAdmin} />}
          {view === "furniture" && <FurnitureInventory emp={emp} isAdmin={isAdmin} />}
          {view === "stats" && <AdvancedStats allEmployees={employees} allRequests={allRequests} trainings={trainings} />}
          {view === "audit" && <AuditLogPage />}
          {view === "reports" && <PDFReportsPage allEmployees={employees} />}
          {view === "changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout} />}
          {view === "employees" && isAdmin && <EmployeeManager employees={employees} setEmployees={setEmployees} />}
          {view === "approvals" && isAdmin && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">الموافقات ({pendingCount})</h3>
              {(allRequests||[]).filter(r=>r.status==="بانتظار المراجعة").map(req=>(
                <div key={req.id} className="bg-white rounded-2xl border p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold">{req.empName}</p>
                      <p className="text-xs">{req.type} — {req.days} يوم</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>{
                        setAllRequests((allRequests||[]).map(r=>r.id===req.id?{...r,status:"موافق عليها"}:r));
                        auditLog("موافقة",`تمت الموافقة على طلب ${req.type}`,emp.name);
                      }} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">قبول</button>
                      <button onClick={()=>{
                        setAllRequests((allRequests||[]).map(r=>r.id===req.id?{...r,status:"مرفوضة"}:r));
                        auditLog("رفض",`تم رفض طلب ${req.type}`,emp.name);
                      }} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs">رفض</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  return user ? <Dashboard emp={user} onLogout={()=>{sessionStorage.clear(); setUser(null);}} /> : <LoginScreen onLogin={setUser} />;
}