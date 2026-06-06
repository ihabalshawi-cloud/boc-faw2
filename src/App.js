import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { LogIn, LogOut, FileText, Clock, Calendar, CheckCircle, ChevronLeft, User, Eye, EyeOff, AlertCircle, Printer, Users, Shield, Package, Plus, Trash2, Edit3, Save, X, ArrowRightLeft, PenTool, RefreshCw, Search, FolderOpen, Upload, Download, Layers, ClipboardList, ChevronRight, Home, Bell, ThumbsUp, ThumbsDown, Star, Target, BarChart2, CheckSquare, BookOpen, GraduationCap, BarChart, MessageCircle } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG
   ضع إعدادات Firebase الخاصة بك هنا بعد إنشاء المشروع
   https://console.firebase.google.com
═══════════════════════════════════════════════════════════ */
const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";

/* ── Firebase REST helpers (بدون SDK — يعمل مع أي مشروع React) ── */
const fb = {
  async get(path) {
    try {
      const r = await fetch(`${FIREBASE_URL}/${path}.json`);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  },
  async set(path, data) {
    try {
      await fetch(`${FIREBASE_URL}/${path}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {}
  },
  async push(path, data) {
    try {
      const r = await fetch(`${FIREBASE_URL}/${path}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      return j?.name; // Firebase push key
    } catch { return null; }
  },
  async patch(path, data) {
    try {
      await fetch(`${FIREBASE_URL}/${path}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {}
  },
  // Real-time listener using Server-Sent Events
  listen(path, callback) {
    const url = `${FIREBASE_URL}/${path}.json`;
    let es;
    try {
      es = new EventSource(url);
      es.addEventListener("put", (e) => {
        try { callback(JSON.parse(e.data)?.data ?? null); } catch {}
      });
      es.addEventListener("patch", (e) => {
        try { callback(JSON.parse(e.data)?.data ?? null); } catch {}
      });
    } catch {}
    return () => { try { es?.close(); } catch {} };
  },
};

/* ── localStorage fallback (للبيانات الشخصية غير المشتركة) ── */
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch { return initial; }
  });
  const set = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, set];
}

/* ── Firebase hook — مزامنة فورية بين كل المتصفحات ── */
function useFirebase(path, initial) {
  const [val, setVal] = useState(initial);
  const [ready, setReady] = useState(false);

  // Load once on mount
  useEffect(() => {
    fb.get(path).then(data => {
      if (data !== null) setVal(data);
      setReady(true);
    });
  }, [path]);

  // Real-time listener via SSE (Server-Sent Events) — فوري
  useEffect(() => {
    const unsub = fb.listen(path, (data) => {
      if (data !== null) setVal(data);
    });
    return unsub;
  }, [path]);

  // Polling fallback every 5s for notifications paths — ضمان وصول الإشعارات
  useEffect(() => {
    if (!path.startsWith("notifications") && !path.startsWith("requests") && !path.startsWith("training")) return;
    const interval = setInterval(() => {
      fb.get(path).then(data => { if (data !== null) setVal(data); });
    }, 5000);
    return () => clearInterval(interval);
  }, [path]);

  const set = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      fb.set(path, next);
      return next;
    });
  }, [path]);

  return [val, set, ready];
}

/* ═══════════════════════════════════════════════════════════
   PRINT / PDF UTILITY
   — uses window.print() which browsers convert to PDF natively
   — wraps content in a dedicated print frame for clean output
═══════════════════════════════════════════════════════════ */
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
    h1,h2,h3{margin-bottom:8px}
    .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:9pt;font-weight:700;border:1px solid #cbd5e1}
    .damaged{background:#fef2f2;color:#991b1b}
    .good{background:#f0fdf4;color:#166534}
    img.sig{height:40px;border:1px solid #e2e8f0;border-radius:6px;padding:2px}
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

/* ── PDF via print dialog (works on all platforms including mobile) ── */
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
   ACCOUNTS — كادر شعبة الفاو / قسم السيطرة والنظم
   المصدر: ملف كادر الشعبة
═══════════════════════════════════════════════════════════ */
const ACCOUNTS = [
  // ══ الصباحي (11 موظف) ══
  {id:1,  username:"i.shawi",    password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي",       jobNum:"728004", title:"ر. مهندسين",    dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7801165298"},
  {id:2,  username:"o.rubaie",   password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه",    jobNum:"727466", title:"ر. مهندسين",    dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7705559125"},
  {id:3,  username:"om.miyahi",  password:"1003", name:"عمر طاهر خزعل سبهان المياحي",              jobNum:"737283", title:"م.ر. مهندسين",  dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7710872949"},
  {id:4,  username:"l.rubaie",   password:"1004", name:"ليث شاكر حمود زعيتر الربيعه",              jobNum:"756571", title:"معاون مهندس",   dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7714991063"},
  {id:5,  username:"as.nassari", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري",        jobNum:"790850", title:"م.مدير فني",    dept:"شعبة مستودع الفاو",  shift:"صباحي", edu:"دبلوم",     phone:"7709043148"},
  {id:6,  username:"sb.nassari", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري",        jobNum:"758795", title:"م.مدير فني",    dept:"شعبة مستودع الفاو",  shift:"صباحي", edu:"دبلوم",     phone:"7707315475"},
  {id:7,  username:"a.amir",     password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير",  jobNum:"719242", title:"مدير فني",      dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",     phone:"7831644210"},
  {id:8,  username:"m.mansouri", password:"1008", name:"محمود كاظم هاشم محمد المنصوري",            jobNum:"790869", title:"م.مدير فني",    dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",     phone:"7703145733"},
  {id:9,  username:"m.tamimi",   password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي",        jobNum:"790885", title:"محاسب اقدم",   dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",     phone:"7808779038"},
  {id:10, username:"m.ali",      password:"1010", name:"محمد اسماعيل احمد رمضان العلي",            jobNum:"813877", title:"مهندس",         dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7725549815"},
  {id:11, username:"al.miyahi",  password:"1011", name:"علي طاهر خزعل سبهان المياحي",              jobNum:"439193", title:"حرفي اقدم",     dept:"شعبة المرافئ",       shift:"صباحي", edu:"ابتدائية",  phone:"7705770208"},
  // ══ المناوبة (18 موظف) ══
  {id:12, username:"ab.abbada",  password:"2001", name:"عبد الله علي زباري يسر عباده",             jobNum:"701130", title:"م.ر. مهندسين",  dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"بكالوريوس",      phone:"7705706145"},
  {id:13, username:"am.ali",     password:"2002", name:"امين حميد فاضل حسين العلي",                jobNum:"751480", title:"م.مدير فني",    dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"A", edu:"دبلوم معهد نفط", phone:"7715949652"},
  {id:14, username:"h.abadi",    password:"2003", name:"حسين علي احمد قاسم عبادي",                 jobNum:"719269", title:"م.مدير فني",    dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم",           phone:"7712679994"},
  {id:15, username:"j.hussain",  password:"2004", name:"جاسم مزعل حاتم ديوان الحسين",              jobNum:"719498", title:"م.مدير فني",    dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم",           phone:"7821188777"},
  {id:16, username:"b.faris",    password:"2005", name:"باسم هاشم جاسم هاشم الفارس",               jobNum:"719277", title:"م.مدير فني",    dept:"شعبة المرافئ",       shift:"مناوبة", group:"B", edu:"دبلوم",           phone:"7702792993"},
  {id:17, username:"h.shnawa",   password:"2006", name:"هاشم جابر جعفر شناوة عباس",                jobNum:"719293", title:"م.مدير فني",    dept:"شعبة المرافئ",       shift:"مناوبة", group:"B", edu:"دبلوم",           phone:"7732166112"},
  {id:18, username:"ab.eissa",   password:"2007", name:"عبد الحميد سامي موسى بدر العيسى",          jobNum:"719463", title:"مدير فني",      dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم",           phone:"7705559870"},
  {id:19, username:"ih.dawod",   password:"2008", name:"احسان عبد الصمد داود",                     jobNum:"736732", title:"مدير فني",      dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم",           phone:"7714658958"},
  {id:20, username:"al.jafar",   password:"2009", name:"علاء محسن عذبي جعفر الجعفر",               jobNum:"719048", title:"مدير فني",      dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"C", edu:"دبلوم",           phone:"7803572745"},
  {id:21, username:"al.aidani",  password:"2010", name:"علي طارق ياسين مهودر العيداني",            jobNum:"735922", title:"م.ر. مهندسين",  dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"بكالوريوس",      phone:"7703137777"},
  {id:22, username:"al.ali",     password:"2011", name:"علي باقر حنتوش مليس العلي",                jobNum:"732249", title:"م.ر. مبرمجين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"بكالوريوس",      phone:"7706072225"},
  {id:23, username:"y.yaseen",   password:"2012", name:"يوسف عباس ياسين احمد ياسين",               jobNum:"726508", title:"مدير فني",      dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"C", edu:"دبلوم",           phone:"7715498830"},
  {id:24, username:"dh.ghanim",  password:"2013", name:"ضياء بدر حمادي اسماعيل الغانم",            jobNum:"719129", title:"م.مدير فني",    dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم",           phone:"7718695345"},
  {id:25, username:"ad.atiya",   password:"2014", name:"عدنان جواد كاظم جعفر العطية",              jobNum:"719099", title:"م.مدير فني",    dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم",           phone:"7709048893"},
  {id:26, username:"ih.saleem",  password:"2015", name:"احسان جواد كاظم حسين السليم",              jobNum:"732834", title:"مهندس",         dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"بكالوريوس",      phone:"7705666922"},
  {id:27, username:"h.jasim",    password:"2016", name:"حيدر عبد الحسن خضير جاسم",                 jobNum:"724939", title:"مدير فني",      dept:"شعبة المرافئ",       shift:"مناوبة", group:"D", edu:"معادل للاعدادية", phone:"7712766100"},
  {id:28, username:"w.mahsen",   password:"2017", name:"واثق حسين عبد الشيخ حسن المحسن",           jobNum:"718939", title:"م.مدير فني",    dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم",           phone:"7707040209"},
  {id:29, username:"sd.eissa",   password:"2018", name:"صدام عبد الواحد سلمان عيسى العيسى",        jobNum:"719005", title:"م.مدير فني",    dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم",           phone:"7712443251"},
  // ══ العقد (4 موظفين) ══
  {id:30, username:"ab.mouni",   password:"3001", name:"عبد الله عيسى موسى موني",                  jobNum:"690414", title:"عقد",           dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7735632535"},
  {id:31, username:"ab.eissa2",  password:"3002", name:"اباذر صالح عبد الحسين عيسى",               jobNum:"689766", title:"عقد",           dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7801446130"},
  {id:32, username:"h.omran",    password:"3003", name:"حسن عادل عمران يوسف",                       jobNum:"690174", title:"عقد",           dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7729488795"},
  {id:33, username:"sj.ali",     password:"3004", name:"سجاد علي راضي علي",                        jobNum:"689331", title:"عقد",           dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7703283076"},
];

const LEAVE_TYPES = {
  اعتيادية: { label:"إجازة اعتيادية", color:"bg-blue-600",   light:"bg-blue-50 text-blue-700 border-blue-200",   max:30 },
  مرضية:    { label:"إجازة مرضية",    color:"bg-rose-600",   light:"bg-rose-50 text-rose-700 border-rose-200",   max:15 },
  زمنية:    { label:"إجازة زمنية",    color:"bg-amber-600",  light:"bg-amber-50 text-amber-700 border-amber-200", max:7  },
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
   LOGIN
═══════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [showP, setShowP] = useState(false);
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setErr("");
    setLoading(true);
    setTimeout(() => {
      const acct = ACCOUNTS.find(a => a.username === user.trim() && a.password === pass.trim());
      if (acct) { onLogin(acct); }
      else { setErr("اسم المستخدم أو كلمة المرور غير صحيحة"); setLoading(false); }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
         style={{background:"linear-gradient(135deg,#0a1628 0%,#0d2348 50%,#0a1628 100%)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
        *{font-family:'IBM Plex Sans Arabic','Noto Naskh Arabic',sans-serif;box-sizing:border-box;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadeIn .5s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .8s linear infinite}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #0f2147 inset!important;-webkit-text-fill-color:#e2e8f0!important;}
      `}</style>

      <div className="w-full max-w-sm fadein">
        {/* Header */}
        <div className="text-center mb-8">
          {/* BOC logo placeholder */}
          <div className="mx-auto mb-4 w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center"
               style={{background:"radial-gradient(circle,#1e4080,#0a1e45)"}}>
            <span className="text-white font-bold text-xl tracking-wider">BOC</span>
          </div>
          <h1 className="text-white text-xl font-bold leading-tight">شركة نفط البصرة</h1>
          <p className="text-blue-300 text-xs mt-1 tracking-wide">نظام الإجازات والطلبات الإدارية</p>
          <div className="mt-3 text-[10px] text-blue-400 border border-blue-800 rounded-lg px-3 py-1.5 inline-block bg-blue-950/40">
            قسم السيطرة والنظم / شعبة مستودع الفاو / شعبة المرافئ
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 border border-white/10"
             style={{background:"rgba(15,33,71,0.85)",backdropFilter:"blur(20px)"}}>
          <h2 className="text-white text-base font-bold mb-5 text-center">تسجيل الدخول</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-blue-300 mb-1.5">اسم المستخدم</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5"
                   style={{background:"rgba(255,255,255,0.05)"}}>
                <User size={15} className="text-blue-400 shrink-0"/>
                <input value={user} onChange={e=>setUser(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handle()}
                  placeholder="مثال: i.shawi"
                  className="bg-transparent outline-none text-sm text-slate-200 w-full placeholder:text-slate-600"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-300 mb-1.5">كلمة المرور</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5"
                   style={{background:"rgba(255,255,255,0.05)"}}>
                <input value={pass} onChange={e=>setPass(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handle()}
                  type={showP?"text":"password"}
                  placeholder="••••"
                  className="bg-transparent outline-none text-sm text-slate-200 w-full placeholder:text-slate-600"/>
                <button onClick={()=>setShowP(p=>!p)} className="text-blue-400 hover:text-blue-200 shrink-0">
                  {showP ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {err && (
              <div className="flex items-center gap-2 bg-red-950/60 border border-red-700/50 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0"/>
                <p className="text-red-300 text-xs">{err}</p>
              </div>
            )}

            <button onClick={handle} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
              style={{background:"linear-gradient(135deg,#1d4ed8,#1e40af)"}}>
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"/>
                : <><LogIn size={15}/> دخول</>}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-600 mt-5">
            للدعم التقني: قسم تقنية المعلومات
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEAVE REQUEST FORM — matches BOC-P-13/F13
   + monthly counter, >3 day approval warning, abroad warning
═══════════════════════════════════════════════════════════ */
function LeaveForm({ emp, onSubmit, onCancel, history }) {
  const today = new Date().toISOString().slice(0,10);
  const [type,     setType]    = useState("اعتيادية");
  const [dateFrom, setFrom]    = useState(today);
  const [dateTo,   setTo]      = useState(today);
  const [purpose,  setPurpose] = useState("");
  const [isAbroad, setAbroad]  = useState(false);
  const [err,      setErr]     = useState("");
  const [warnings, setWarnings]= useState([]);

  const days = daysBetween(dateFrom, dateTo);
  const cfg  = LEAVE_TYPES[type];

  // ── Monthly stats from existing history
  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();

  const monthlyStats = useMemo(() => {
    const stats = { اعتيادية:0, مرضية:0, زمنية:0, total:0 };
    history.forEach(h => {
      const d = new Date(h.submittedAt);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        stats[h.type] = (stats[h.type] || 0) + h.days;
        stats.total   += h.days;
      }
    });
    return stats;
  }, [history, thisMonth, thisYear]);

  // ── Live warnings shown inline as the user fills the form
  useEffect(() => {
    const w = [];
    if (type === "اعتيادية" && days > 3) {
      w.push({
        level: "orange",
        icon: "⚠️",
        title: "يلزم موافقة مدير القسم",
        body: `مدة الإجازة المطلوبة (${days} أيام) تتجاوز الحد المحدد (٣ أيام متواصلة). يجب الحصول على موافقة مدير القسم قبل تقديم الطلب.`,
      });
    }
    if (isAbroad) {
      w.push({
        level: "red",
        icon: "🛂",
        title: "يلزم موافقة مدير الهيأة والأمر الإداري",
        body: "الإجازة خارج العراق أو تتضمن موافقة سفر. يجب الحصول على موافقة مدير الهيأة وانتظار صدور الأمر الإداري الرسمي قبل السفر.",
      });
    }
    setWarnings(w);
  }, [type, days, isAbroad]);

  const handleSubmit = () => {
    if (!purpose.trim()) { setErr("يرجى تحديد غرض الإجازة"); return; }
    if (days > cfg.max)  { setErr(`الحد الأقصى للإجازة ${cfg.label} هو ${cfg.max} يوم`); return; }
    setErr("");
    onSubmit({ type, dateFrom, dateTo, days, purpose, isAbroad, warnings: warnings.map(w=>w.title) });
  };

  const monthName = new Date().toLocaleDateString("ar-IQ", { month: "long", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ChevronLeft size={18}/>
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-800">نموذج طلب إجازة</h2>
          <p className="text-xs text-slate-500">BOC-P-13/F13 · رقم الإصدار: 1</p>
        </div>
      </div>

      {/* ── Monthly counter strip ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar size={13} className="text-blue-600"/> إجازاتي خلال {monthName}
          </p>
          <span className="text-[10px] text-slate-400">إجمالي: <strong className="text-slate-700">{toArabicNum(monthlyStats.total)} يوم</strong></span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key:"اعتيادية", label:"اعتيادية", color:"bg-blue-50 border-blue-200 text-blue-700",  max:30 },
            { key:"مرضية",    label:"مرضية",    color:"bg-rose-50 border-rose-200 text-rose-700",  max:15 },
            { key:"زمنية",    label:"زمنية",    color:"bg-amber-50 border-amber-200 text-amber-700",max:7 },
          ].map(t => {
            const used = monthlyStats[t.key] || 0;
            const pct  = Math.min(100, (used/t.max)*100);
            return (
              <div key={t.key} className={`border rounded-xl p-3 ${t.color}`}>
                <p className="text-[10px] font-bold mb-1">{t.label}</p>
                <p className="text-lg font-bold leading-none">{toArabicNum(used)}<span className="text-[10px] font-normal opacity-60"> / {t.max}</span></p>
                <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                       style={{width:`${pct}%`, background:"currentColor", opacity:0.6}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">

        {/* Official header */}
        <div className="border-b-2 border-slate-200">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-bold text-slate-700 w-32">شركة نفط البصرة</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">عنوان النموذج</td>
                <td className="border border-slate-200 px-3 py-2 font-bold text-slate-800">
                  نموذج اجازة {type}
                </td>
                <td rowSpan="2" className="border border-slate-200 px-4 py-2 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center mx-auto">
                    <span className="text-slate-600 font-bold text-xs">BOC</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2"/>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">رمز النموذج</td>
                <td className="border border-slate-200 px-3 py-2">
                  <span className="font-mono font-bold text-slate-700">BOC-P-13/F13</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-500">رقم الإصدار: 1</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-500">تاريخ الإصدار: 15/3/2020</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6 space-y-5">
          {/* Date row + type selector */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="text-sm text-slate-500">
              التاريخ: <span className="font-bold text-slate-800">{arabicDate(today)}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(LEAVE_TYPES).map(([k,v])=>(
                <button key={k} onClick={()=>{ setType(k); setErr(""); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${type===k?`${v.color} text-white border-transparent`:"border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`text-center text-sm font-bold border rounded-xl py-2 ${LEAVE_TYPES[type].light}`}>
            م / {LEAVE_TYPES[type].label}
          </div>

          {/* Employee info */}
          <div className="space-y-3">
            {[
              ["الاسم الثلاثي",   emp.name],
              ["الرقم الوظيفي",   emp.jobNum],
              ["العنوان الوظيفي", emp.title],
              ["القسم / الشعبة",  emp.dept],
            ].map(([l,v])=>(
              <div key={l} className="flex items-center border-b border-dashed border-slate-200 pb-3">
                <span className="text-sm text-slate-500 w-36 shrink-0">{l}</span>
                <span className="text-sm font-bold text-slate-800 flex-1 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50">{v}</span>
              </div>
            ))}
          </div>

          {/* Duration */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <p className="text-sm text-slate-700 font-semibold">يرجى منحي {LEAVE_TYPES[type].label} لمدة:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">من تاريخ</label>
                <input type="date" value={dateFrom} onChange={e=>{ setFrom(e.target.value); setErr(""); }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">إلى تاريخ</label>
                <input type="date" value={dateTo} onChange={e=>{ setTo(e.target.value); setErr(""); }} min={dateFrom}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-2.5">
              <span className="text-sm text-slate-600">مدة الإجازة</span>
              <span className={`text-sm font-bold ${days > cfg.max ? "text-red-600":"text-blue-700"}`}>
                {toArabicNum(days)} يوم
                {days > cfg.max && <span className="text-xs text-red-500 mr-2">(يتجاوز الحد الأقصى {cfg.max} يوم)</span>}
              </span>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">لغرض</label>
            <input value={purpose} onChange={e=>{ setPurpose(e.target.value); setErr(""); }}
              placeholder="اكتب غرض الإجازة..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          </div>

          {/* Abroad toggle */}
          <div
            onClick={()=>setAbroad(p=>!p)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
              isAbroad ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
              isAbroad ? "bg-red-500 border-red-500" : "border-slate-300 bg-white"
            }`}>
              {isAbroad && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div>
              <p className={`text-sm font-bold ${isAbroad?"text-red-700":"text-slate-700"}`}>🛂 الإجازة خارج العراق / تتضمن موافقة سفر</p>
              <p className="text-[11px] text-slate-500 mt-0.5">ضع علامة إذا كنت ستسافر خارج العراق أو تحتاج إلى أمر إداري للسفر</p>
            </div>
          </div>

          {/* ── WARNINGS ── */}
          {warnings.map((w, i) => (
            <div key={i} className={`rounded-xl border-2 p-4 space-y-1 ${
              w.level === "red"
                ? "bg-red-50 border-red-300"
                : "bg-orange-50 border-orange-300"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{w.icon}</span>
                <p className={`text-sm font-bold ${w.level==="red"?"text-red-800":"text-orange-800"}`}>{w.title}</p>
              </div>
              <p className={`text-xs leading-relaxed pr-7 ${w.level==="red"?"text-red-700":"text-orange-700"}`}>{w.body}</p>
            </div>
          ))}

          {err && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 shrink-0"/>
              <p className="text-red-600 text-xs">{err}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between pt-2">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-6">توقيع المخول</p>
              <div className="w-32 border-t border-slate-300"/>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-6">توقيع صاحب الإجازة</p>
              <div className="w-32 border-t border-slate-300"/>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              إلغاء
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{background:"linear-gradient(135deg,#1d4ed8,#1e40af)"}}>
              <FileText size={15}/>
              تقديم الطلب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEAVE RECEIPT (printable preview)
═══════════════════════════════════════════════════════════ */
function LeaveReceipt({ emp, leave, onClose }) {
  const cfg = LEAVE_TYPES[leave.type];
  const ref = `BOC-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ChevronLeft size={18}/>
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-800">تم تقديم الطلب بنجاح</h2>
          <p className="text-xs text-slate-500">رقم المرجع: {ref}</p>
        </div>
        <PrintButton targetId="print-leave" title={`إجازة ${leave.type} — ${emp.name}`}/>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3 mb-5">
        <CheckCircle size={20} className="text-emerald-600 shrink-0"/>
        <div>
          <p className="text-sm font-bold text-emerald-800">تم إرسال طلبك بنجاح</p>
          <p className="text-xs text-emerald-600 mt-0.5">سيتم مراجعته من قبل المسؤول المخول وإشعارك بالقرار</p>
        </div>
      </div>

      {/* ── Approval warnings on receipt ── */}
      {leave.warnings && leave.warnings.length > 0 && (
        <div className="space-y-3 mb-5">
          {leave.warnings.includes("يلزم موافقة مدير القسم") && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 flex gap-3">
              <span className="text-xl shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-bold text-orange-800">تنبيه: يلزم موافقة مدير القسم</p>
                <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                  طلبك يتجاوز ٣ أيام اعتيادية متواصلة. يجب الحصول على موافقة خطية من مدير القسم قبل اعتماد هذا الطلب.
                </p>
              </div>
            </div>
          )}
          {leave.warnings.includes("يلزم موافقة مدير الهيأة والأمر الإداري") && (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex gap-3">
              <span className="text-xl shrink-0">🛂</span>
              <div>
                <p className="text-sm font-bold text-red-800">تنبيه: يلزم موافقة مدير الهيأة</p>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  الإجازة تتضمن سفراً خارج العراق. يجب الحصول على موافقة مدير الهيأة وانتظار صدور الأمر الإداري الرسمي قبل السفر. <strong>لا تسافر قبل صدور الأمر الإداري.</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Receipt — printable */}
      <div id="print-leave" className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm print:shadow-none print:border-black">
        {/* Header table */}
        <div className="border-b-2 border-slate-200">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-bold text-slate-700 w-32">شركة نفط البصرة</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">عنوان النموذج</td>
                <td className="border border-slate-200 px-3 py-2 font-bold text-slate-800">نموذج اجازة {leave.type === "اعتيادية" ? "اعتيادية" : leave.type === "مرضية" ? "مرضية" : "زمنية"}</td>
                <td rowSpan="2" className="border border-slate-200 px-4 py-2 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center mx-auto">
                    <span className="text-slate-600 font-bold text-xs">BOC</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2"/>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">رمز النموذج</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-700 font-mono font-bold">BOC-P-13/F13 | رقم الإصدار: 1 | تاريخ الإصدار: 15/3/2020</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-7 space-y-5">
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">التاريخ: <strong>{arabicDate(new Date().toISOString().slice(0,10))}</strong></span>
            <span className="text-sm text-slate-600">المرجع: <strong className="font-mono">{ref}</strong></span>
          </div>

          <div className={`text-center text-sm font-bold border-2 rounded-xl py-2.5 ${cfg.light}`}>
            م / {cfg.label}
          </div>

          <div className="space-y-4">
            {[
              ["الاسم الثلاثي",    emp.name],
              ["الرقم الوظيفي",    emp.jobNum],
              ["العنوان الوظيفي",  emp.title],
              ["القسم / الشعبة",   emp.dept],
            ].map(([l,v])=>(
              <div key={l} className="flex items-center border-b border-dashed border-slate-200 pb-3">
                <span className="text-sm text-slate-500 w-36 shrink-0">{l}</span>
                <span className="text-sm font-bold text-slate-800">{v}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="text-sm text-slate-700">
              يرجى منحي إجازة {cfg.label} لمدة{" "}
              <strong className="text-slate-900">({toArabicNum(leave.days)} {leave.days===1?"يوم":"أيام"})</strong>{" "}
              اعتباراً من{" "}
              <strong className="text-slate-900">({arabicDate(leave.dateFrom)})</strong>{" "}
              ولغاية{" "}
              <strong className="text-slate-900">({arabicDate(leave.dateTo)})</strong>
            </p>
            <p className="text-sm text-slate-700">
              لغرض <strong className="text-slate-900">({leave.purpose})</strong>
            </p>
            {leave.isAbroad && (
              <p className="text-sm font-bold text-red-700 flex items-center gap-1.5 mt-1">
                🛂 الإجازة تتضمن سفراً خارج العراق — بانتظار الأمر الإداري
              </p>
            )}
          </div>

          <div className="flex justify-between pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-10">توقيع المخول</p>
              <div className="w-36 border-t border-slate-400"/>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-4">توقيع صاحب الإجازة</p>
              <div className="w-36 border-t-2 border-blue-800 mt-6 relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-blue-800 text-xs font-bold whitespace-nowrap">{emp.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onClose} className="mt-4 w-full py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
        العودة إلى لوحة التحكم
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN — EMPLOYEE MANAGER  (صلاحية: ايهاب الشاوي فقط)
═══════════════════════════════════════════════════════════ */
const DEPTS  = ["قسم السيطرة والنظم","شعبة مستودع الفاو","شعبة المرافئ"];
const SHIFTS = ["صباحي","مناوبة"];
const GROUPS = ["A","B","C","D"];
const EDU_LIST = ["بكالوريوس","دبلوم","دبلوم معهد نفط","اعدادية","معادل للاعدادية","ابتدائية"];
const EMP_TYPES = ["رسمي","عقد"];

const EMPTY_EMP = { name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي", group:"A", edu:"بكالوريوس", phone:"", empType:"رسمي", username:"", password:"" };

function EmployeeManager({ employees, setEmployees }) {
  const [search, setSearch]     = useState("");
  const [editId, setEditId]     = useState(null);
  const [form,   setForm]       = useState(EMPTY_EMP);
  const [adding, setAdding]     = useState(false);
  const [delConf, setDelConf]   = useState(null);
  const [moveEmp, setMoveEmp]   = useState(null);
  const [moveDept, setMoveDept] = useState("");
  const [toast, setToast]       = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const filtered = employees.filter(e =>
    e.name.includes(search) || e.jobNum.includes(search) ||
    e.title.includes(search) || e.dept.includes(search)
  );

  const openEdit = (emp) => { setEditId(emp.id); setForm({...emp}); setAdding(false); };
  const openAdd  = ()    => { setAdding(true); setEditId(null); setForm({...EMPTY_EMP, id: Date.now()}); };
  const cancelForm = ()  => { setEditId(null); setAdding(false); };

  const saveEmp = () => {
    if (!form.name.trim() || !form.jobNum.trim()) return showToast("الاسم والرقم الوظيفي مطلوبان");
    if (adding) {
      setEmployees(p => [...p, {...form, id: Date.now()}]);
      showToast("✓ تم إضافة الموظف");
    } else {
      setEmployees(p => p.map(e => e.id===editId ? {...form, id:editId} : e));
      showToast("✓ تم حفظ التعديلات");
    }
    cancelForm();
  };

  const deleteEmp = (id) => {
    setEmployees(p => p.filter(e => e.id!==id));
    setDelConf(null);
    showToast("✓ تم حذف الموظف");
  };

  const moveEmpDept = () => {
    if (!moveDept) return;
    setEmployees(p => p.map(e => e.id===moveEmp.id ? {...e, dept:moveDept} : e));
    setMoveEmp(null);
    showToast(`✓ تم نقل ${moveEmp.name} إلى ${moveDept}`);
  };

  const SHIFT_COLORS = { صباحي:"bg-amber-100 text-amber-700", مناوبة:"bg-indigo-100 text-indigo-700" };
  const DEPT_COLORS  = {
    "قسم السيطرة والنظم":"bg-blue-100 text-blue-800",
    "شعبة مستودع الفاو": "bg-emerald-100 text-emerald-800",
    "شعبة المرافئ":      "bg-indigo-100 text-indigo-800",
  };

  const Field = ({label, children}) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const sel = inp + " cursor-pointer appearance-none";

  return (
    <div className="space-y-4 fu">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[180px] shadow-sm">
          <Search size={13} className="text-slate-400 shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرقم أو القسم..."
            className="bg-transparent text-xs outline-none text-slate-700 w-full placeholder:text-slate-400"/>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-sm">
          <Plus size={14}/> إضافة موظف
        </button>
        <span className="text-xs text-slate-400">{employees.length} موظف إجمالاً</span>
      </div>

      {/* Add / Edit form */}
      {(adding || editId) && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              {adding ? <><Plus size={14} className="text-blue-600"/> إضافة موظف جديد</>
                      : <><Edit3 size={14} className="text-blue-600"/> تعديل بيانات الموظف</>}
            </h4>
            <button onClick={cancelForm} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={15}/></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="الاسم الكامل *">
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className={inp} placeholder="الاسم الرباعي"/>
            </Field>
            <Field label="الرقم الوظيفي *">
              <input value={form.jobNum} onChange={e=>setForm(p=>({...p,jobNum:e.target.value}))} className={inp} placeholder="xxxxxx"/>
            </Field>
            <Field label="العنوان الوظيفي">
              <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={inp} placeholder="مدير فني / مهندس..."/>
            </Field>
            <Field label="القسم / الشعبة">
              <select value={form.dept} onChange={e=>setForm(p=>({...p,dept:e.target.value}))} className={sel}>
                {DEPTS.map(d=><option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="نظام الدوام">
              <select value={form.shift} onChange={e=>setForm(p=>({...p,shift:e.target.value}))} className={sel}>
                {SHIFTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>
            {form.shift==="مناوبة" && (
              <Field label="المجموعة">
                <select value={form.group} onChange={e=>setForm(p=>({...p,group:e.target.value}))} className={sel}>
                  {GROUPS.map(g=><option key={g}>{g}</option>)}
                </select>
              </Field>
            )}
            <Field label="التحصيل الدراسي">
              <select value={form.edu} onChange={e=>setForm(p=>({...p,edu:e.target.value}))} className={sel}>
                {EDU_LIST.map(e=><option key={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="نوع التوظيف">
              <select value={form.empType||"رسمي"} onChange={e=>setForm(p=>({...p,empType:e.target.value}))} className={sel}>
                {EMP_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="رقم الهاتف">
              <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className={inp} placeholder="07xx..."/>
            </Field>
            <Field label="اسم المستخدم">
              <input value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} className={inp} placeholder="xxx.xxx"/>
            </Field>
            <Field label="كلمة المرور">
              <input value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} className={inp} placeholder="xxxx"/>
            </Field>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={cancelForm} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
            <button onClick={saveEmp}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all">
              <Save size={13}/> حفظ
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["#","الاسم الكامل","الرقم الوظيفي","العنوان الوظيفي","القسم","الدوام","التحصيل","الهاتف","إجراءات"].map(h=>(
                  <th key={h} className="px-3 py-3 text-[10px] font-bold text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp,i)=>(
                <tr key={emp.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${i===filtered.length-1?"border-b-0":""}`}>
                  <td className="px-3 py-3 text-slate-400 font-mono">{String(emp.id).slice(-3)}</td>
                  <td className="px-3 py-3 font-semibold text-slate-800 whitespace-nowrap max-w-[180px] truncate">{emp.name}</td>
                  <td className="px-3 py-3 font-mono text-slate-600">{emp.jobNum}</td>
                  <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{emp.title}</td>
                  <td className="px-3 py-3"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DEPT_COLORS[emp.dept]||""}`}>{emp.dept}</span></td>
                  <td className="px-3 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SHIFT_COLORS[emp.shift]||""}`}>{emp.shift}{emp.group?` [${emp.group}]`:""}</span></td>
                  <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{emp.edu}</td>
                  <td className="px-3 py-3 font-mono text-slate-500">{emp.phone}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>openEdit(emp)} title="تعديل"
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={12}/></button>
                      <button onClick={()=>{setMoveEmp(emp); setMoveDept(emp.dept);}} title="نقل"
                        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><ArrowRightLeft size={12}/></button>
                      <button onClick={()=>setDelConf(emp.id)} title="حذف"
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      {delConf && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setDelConf(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center" dir="rtl" onClick={e=>e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={20} className="text-red-500"/></div>
            <p className="font-bold text-slate-800 mb-1">تأكيد الحذف</p>
            <p className="text-sm text-slate-500 mb-5">هل تريد حذف هذا الموظف نهائياً؟ لا يمكن التراجع.</p>
            <div className="flex gap-2">
              <button onClick={()=>setDelConf(null)} className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
              <button onClick={()=>deleteEmp(delConf)} className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700">حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* Move modal */}
      {moveEmp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setMoveEmp(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" dir="rtl" onClick={e=>e.stopPropagation()}>
            <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><ArrowRightLeft size={14} className="text-amber-500"/>نقل موظف</h4>
            <p className="text-xs text-slate-500 mb-4">{moveEmp.name}</p>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">القسم / الشعبة الجديدة</label>
            <select value={moveDept} onChange={e=>setMoveDept(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-5 bg-white appearance-none">
              {DEPTS.map(d=><option key={d}>{d}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={()=>setMoveEmp(null)} className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
              <button onClick={moveEmpDept} className="flex-1 py-2 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600">نقل</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl">
          <CheckCircle size={14} className="text-emerald-400"/>{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MATERIAL REQUEST — طلب مواد من المخزن (BOC-P-07/F09)
═══════════════════════════════════════════════════════════ */
function SignaturePad({ onSave, existingSig, storageKey }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig,  setHasSig]  = useState(!!existingSig);
  const [preview, setPreview] = useState(() => {
    // Try to load from localStorage first
    if (existingSig) return existingSig;
    if (storageKey) {
      try { return localStorage.getItem(storageKey) || null; } catch {}
    }
    return null;
  });

  // if loaded from storage, notify parent immediately
  useEffect(() => {
    if (preview && !existingSig) onSave(preview);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    if (e.touches) return {
      x: (e.touches[0].clientX - r.left) * scaleX,
      y: (e.touches[0].clientY - r.top)  * scaleY
    };
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top)  * scaleY
    };
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

  return (
    <div>
      {preview ? (
        <div className="relative border-2 border-blue-200 rounded-xl overflow-hidden bg-slate-50">
          <img src={preview} alt="التوقيع" className="h-20 w-full object-contain"/>
          <button onClick={()=>{setPreview(null); onSave(null);}}
            className="absolute top-1 left-1 bg-white/80 text-red-500 rounded-lg p-1 hover:bg-white">
            <RefreshCw size={12}/>
          </button>
        </div>
      ) : (
        <div>
          <div className="border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/30 overflow-hidden touch-none"
               style={{cursor:"crosshair"}}>
            <canvas ref={canvasRef} width={280} height={80}
              onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
              onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
              className="w-full"/>
          </div>
          <div className="flex gap-2 mt-1.5">
            <button onClick={clear} className="flex-1 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200">مسح</button>
            {hasSig && <button onClick={save} className="flex-1 py-1 text-[10px] font-bold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200">حفظ التوقيع</button>}
          </div>
          <p className="text-[9px] text-slate-400 mt-1 text-center">ارسم توقيعك باستخدام الماوس أو الإصبع</p>
        </div>
      )}
    </div>
  );
}

const EMPTY_ITEM = { vocabNo:"", description:"", unit:"", qty:"", st:"", cc:"", jobNo:"", debit:"", cebit:"" };

function MaterialRequest({ emp, empSignatures, setEmpSignatures }) {
  const today = new Date().toISOString().slice(0,10);
  const [fromDate, setFrom]    = useState(today);
  const [toDate,   setTo]      = useState(today);
  const [items,    setItems]   = useState([{...EMPTY_ITEM}]);
  const [remarks,  setRemarks] = useState("");
  const [sig, setSig] = useState(() => {
    // Load from empSignatures state or localStorage
    if (empSignatures[emp.id]) return empSignatures[emp.id];
    try { return localStorage.getItem(`boc_sig_${emp.id}`) || null; } catch { return null; }
  });
  const [showSigPad, setShowSigPad] = useState(!empSignatures[emp.id] && !(() => { try { return localStorage.getItem(`boc_sig_${emp.id}`); } catch { return null; } })());
  const [submitted, setSubmitted]   = useState(false);
  const [reqNum]   = useState(`REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`);

  const saveSig = (url) => {
    setSig(url);
    if (url) {
      setEmpSignatures(p => ({...p, [emp.id]: url}));
      try { localStorage.setItem(`boc_sig_${emp.id}`, url); } catch {}
      setShowSigPad(false);
    } else {
      setEmpSignatures(p => { const n={...p}; delete n[emp.id]; return n; });
      try { localStorage.removeItem(`boc_sig_${emp.id}`); } catch {}
    }
  };

  const addItem    = () => setItems(p => [...p, {...EMPTY_ITEM}]);
  const removeItem = (i) => setItems(p => p.filter((_,idx)=>idx!==i));
  const setItem    = (i, k, v) => setItems(p => p.map((it,idx) => idx===i ? {...it,[k]:v} : it));

  const handleSubmit = () => {
    if (!sig) { alert("يرجى رسم توقيعك أولاً"); return; }
    setSubmitted(true);
  };

  const inp2 = "w-full border-b border-slate-200 px-1 py-1 text-xs focus:outline-none focus:border-blue-400 bg-transparent text-center";

  if (submitted) return (
    <div className="max-w-2xl mx-auto fu">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3 mb-4">
        <CheckCircle size={22} className="text-emerald-600 shrink-0"/>
        <div>
          <p className="font-bold text-emerald-800">تم إرسال طلب المواد بنجاح</p>
          <p className="text-xs text-emerald-600 mt-0.5">رقم الطلب: <strong className="font-mono">{reqNum}</strong></p>
        </div>
      </div>
      <div id="print-material" className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        {/* BOC header */}
        <div className="border-b-2 border-slate-200">
          <table className="w-full text-[10px] border-collapse">
            <tbody>
              <tr>
                <td className="border border-slate-200 px-2 py-1.5 font-bold w-28">شركة نفط البصرة</td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <div className="font-bold text-[11px]">طلب مواد من المخزن</div>
                  <div className="text-slate-500">Vocab No: {reqNum}</div>
                </td>
                <td rowSpan="2" className="border border-slate-200 px-3 py-2 text-center w-16">
                  <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center mx-auto">
                    <span className="text-slate-600 font-bold text-[9px]">BOC</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-2 py-1 text-slate-500">رمز النموذج</td>
                <td className="border border-slate-200 px-2 py-1 font-mono font-bold">BOC-P-07/F09 | رقم الإصدار: 1 | التاريخ: {new Date(today).toLocaleDateString("ar-IQ")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="text-slate-500">من تاريخ: </span><strong>{new Date(fromDate).toLocaleDateString("ar-IQ")}</strong></div>
            <div><span className="text-slate-500">إلى تاريخ: </span><strong>{new Date(toDate).toLocaleDateString("ar-IQ")}</strong></div>
            <div><span className="text-slate-500">الاسم: </span><strong>{emp.name}</strong></div>
            <div><span className="text-slate-500">الرقم الوظيفي: </span><strong className="font-mono">{emp.jobNum}</strong></div>
            <div><span className="text-slate-500">العنوان الوظيفي: </span><strong>{emp.title}</strong></div>
            <div><span className="text-slate-500">القسم: </span><strong>{emp.dept}</strong></div>
          </div>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-50">
                {["ت","Vocabulary No.","الوصف / Description","الوحدة Unit","الكمية Qty","ST","CC","Job No.","Debit","Cebit"].map(h=>(
                  <th key={h} className="border border-slate-200 px-1 py-1.5 text-center font-bold text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it,i)=>(
                <tr key={i}>
                  <td className="border border-slate-200 px-1 py-2 text-center text-slate-400">{i+1}</td>
                  {["vocabNo","description","unit","qty","st","cc","jobNo","debit","cebit"].map(k=>(
                    <td key={k} className="border border-slate-200 px-1 py-2 text-center">{it[k]||"—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {remarks && <p className="text-xs text-slate-600 border-t pt-2"><strong>ملاحظات:</strong> {remarks}</p>}
          <div className="flex justify-between pt-4">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 mb-6">توقيع المخول / Authorized Signature</p>
              <div className="w-36 border-t border-slate-400"/>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 mb-2">توقيع مقدم الطلب</p>
              {sig && <img src={sig} alt="توقيع" className="h-14 w-40 object-contain border border-slate-200 rounded-lg bg-white"/>}
              <p className="text-[10px] text-slate-600 mt-1 font-bold">{emp.name}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={()=>setSubmitted(false)} className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">طلب جديد</button>
        <PrintButton targetId="print-material" label="طباعة / PDF" title={`طلب مواد — ${emp.name}`}/>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 fu">
      {/* Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b-2 border-slate-200">
          <table className="w-full text-[10px] border-collapse">
            <tbody>
              <tr>
                <td className="border border-slate-200 px-2 py-1.5 font-bold w-28">شركة نفط البصرة</td>
                <td className="border border-slate-200 px-2 py-1.5">
                  <div className="font-bold text-[11px]">طلب مواد من المخزن</div>
                  <div className="text-slate-400 text-[9px]">Vocab No. 3725501110</div>
                </td>
                <td rowSpan="2" className="border border-slate-200 px-3 py-2 text-center w-16">
                  <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center mx-auto">
                    <span className="text-slate-600 font-bold text-[9px]">BOC</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-2 py-1 text-slate-500">رمز النموذج</td>
                <td className="border border-slate-200 px-2 py-1 font-mono font-bold text-[9px]">BOC-P-07/F09 | رقم الإصدار: 1 | تاريخ الإصدار: 2018/8/1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 space-y-4">
          {/* Info row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">من تاريخ / FROM</label>
              <input type="date" value={fromDate} onChange={e=>setFrom(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">إلى تاريخ / TO</label>
              <input type="date" value={toDate} onChange={e=>setTo(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الاسم</label>
              <div className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-50 text-slate-700 font-semibold">{emp.name}</div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الرقم الوظيفي</label>
              <div className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-50 font-mono">{emp.jobNum}</div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">العنوان الوظيفي</label>
              <div className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-50">{emp.title}</div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">القسم / الشعبة</label>
              <div className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-50">{emp.dept}</div>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-50">
                  {["ت","Vocabulary No.","الوصف / Description","الوحدة Unit","الكمية Qty","ST","CC","Job No.","Debit","Cebit",""].map(h=>(
                    <th key={h} className="border border-slate-200 px-1 py-2 text-center font-bold text-[9px] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it,i)=>(
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="border border-slate-100 px-1 py-1 text-center text-slate-400">{i+1}</td>
                    {[
                      {k:"vocabNo",      w:"70px"},
                      {k:"description",  w:"140px"},
                      {k:"unit",         w:"50px"},
                      {k:"qty",          w:"50px"},
                      {k:"st",           w:"40px"},
                      {k:"cc",           w:"40px"},
                      {k:"jobNo",        w:"70px"},
                      {k:"debit",        w:"60px"},
                      {k:"cebit",        w:"60px"},
                    ].map(({k,w})=>(
                      <td key={k} className="border border-slate-100 p-0.5" style={{minWidth:w}}>
                        <input value={it[k]} onChange={e=>setItem(i,k,e.target.value)}
                          className={inp2}/>
                      </td>
                    ))}
                    <td className="border border-slate-100 px-1 py-1 text-center">
                      {items.length>1 && (
                        <button onClick={()=>removeItem(i)} className="text-red-400 hover:text-red-600 p-0.5"><X size={11}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={13}/> إضافة صف
          </button>

          {/* Remarks */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">ملاحظات / Remarks</label>
            <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"/>
          </div>

          {/* Signature section */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              {/* Authorized */}
              <div className="text-center flex-1">
                <p className="text-[10px] text-slate-500 font-bold mb-8">توقيع المخول / Authorized Signature</p>
                <div className="border-t border-slate-300 w-40 mx-auto"/>
              </div>
              {/* Requester */}
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 font-bold mb-2 text-center">توقيع مقدم الطلب / Requester Signature</p>
                {showSigPad ? (
                  <SignaturePad onSave={saveSig} existingSig={sig} storageKey={`boc_sig_${emp.id}`}/>
                ) : sig ? (
                  <div className="relative text-center">
                    <img src={sig} alt="توقيع" className="h-16 w-full max-w-[200px] object-contain border border-slate-200 rounded-xl bg-white mx-auto"/>
                    <p className="text-[10px] text-slate-700 font-bold mt-1">{emp.name}</p>
                    <button onClick={()=>setShowSigPad(true)}
                      className="text-[9px] text-blue-500 hover:underline mt-0.5 block mx-auto">تغيير التوقيع</button>
                  </div>
                ) : (
                  <button onClick={()=>setShowSigPad(true)}
                    className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2">
                    <PenTool size={14}/> رسم التوقيع
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit}
        className="w-full py-3 text-sm font-bold text-white rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
        style={{background:"linear-gradient(135deg,#1d4ed8,#1e40af)"}}>
        <Package size={16}/> إرسال طلب المواد
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOGIN HISTORY — سجل الدخول والخروج (ادمن فقط)
═══════════════════════════════════════════════════════════ */
function LoginHistoryPage() {
  const [loginHistory, , ready] = useFirebase("login_history", null);
  const [search, setSearch]       = useState("");
  const [filterDept, setFilterDept] = useState("الكل");

  // null = still loading, [] = loaded but empty, [...] = has data
  const isLoading = loginHistory === null && !ready;
  const history   = Array.isArray(loginHistory) ? loginHistory : [];

  const depts = ["الكل", ...Array.from(new Set(history.map(h => h.empDept).filter(Boolean)))];

  const filtered = history.filter(h => {
    const ms = h.empName?.includes(search) || h.username?.includes(search);
    const md = filterDept === "الكل" || h.empDept === filterDept;
    return ms && md;
  });

  // stats
  const today = new Date().toDateString();
  const todayLogins = history.filter(h => new Date(h.loginAt).toDateString() === today);
  const uniqueToday = new Set(todayLogins.map(h => h.empId)).size;

  return (
    <div className="space-y-4 fu">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-700">{todayLogins.length}</p>
          <p className="text-[10px] text-slate-500">دخول اليوم</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{uniqueToday}</p>
          <p className="text-[10px] text-slate-500">موظف دخل اليوم</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-700">{history.length}</p>
          <p className="text-[10px] text-slate-500">إجمالي السجلات</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center no-print">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[160px] shadow-sm">
          <Search size={13} className="text-slate-400 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم الموظف أو اسم المستخدم..."
            className="bg-transparent text-xs outline-none text-slate-700 w-full placeholder:text-slate-400"/>
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-sm appearance-none">
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <PrintButton targetId="print-login-history" title="سجل الدخول"/>
        <span className="text-xs text-slate-400">{filtered.length} سجل</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"/>
          <p className="text-sm text-slate-400">جاري تحميل السجلات...</p>
        </div>
      ) : (
        <div id="print-login-history" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Print header */}
          <div className="hidden print:block text-center p-4 border-b">
            <p className="text-lg font-bold">شركة نفط البصرة — شعبة الفاو</p>
            <p className="text-sm">سجل الدخول — {new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 no-print">
            <h3 className="font-bold text-slate-700 text-sm">سجل دخول الموظفين</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["الموظف", "اسم المستخدم", "القسم", "المسمى", "التاريخ", "الوقت", "الجهاز"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-[10px] font-bold text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">لا توجد سجلات</td></tr>
                ) : filtered.map((h, i) => {
                  const isToday = new Date(h.loginAt).toDateString() === today;
                  return (
                    <tr key={h.id || i}
                      className={`border-b border-slate-50 transition-colors hover:bg-slate-50/60 ${isToday ? "bg-blue-50/30" : ""} ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                      <td className="px-3 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {isToday && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1.5 mb-0.5"/>}
                        {h.empName?.split(" ").slice(0, 3).join(" ")}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-600">{h.username}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          h.empDept === "قسم السيطرة والنظم" ? "bg-blue-100 text-blue-800" :
                          h.empDept === "شعبة مستودع الفاو" ? "bg-emerald-100 text-emerald-800" :
                          "bg-indigo-100 text-indigo-800"
                        }`}>{h.empDept}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{h.empTitle}</td>
                      <td className="px-3 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {new Date(h.loginAt).toLocaleDateString("ar-IQ")}
                      </td>
                      <td className="px-3 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {new Date(h.loginAt).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${h.device === "موبايل" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {h.device === "موبايل" ? "📱" : "💻"} {h.device}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APPROVAL PAGE — صفحة الموافقات (ادمن فقط: ايهاب الشاوي)
═══════════════════════════════════════════════════════════ */
function ApprovalPage({ allRequests, onApprove, notifications, setNotifications, emp }) {
  const [filter, setFilter]       = useState("بانتظار المراجعة");
  const [noteModal, setNoteModal] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [activeSection, setActiveSection] = useState("requests"); // requests | notifications

  const filtered = allRequests.filter(r => filter === "الكل" || r.status === filter);
  const pending  = allRequests.filter(r => r.status === "بانتظار المراجعة").length;
  const approved = allRequests.filter(r => r.status === "موافق عليها").length;
  const rejected = allRequests.filter(r => r.status === "مرفوضة").length;

  const STATUS_BADGE = {
    "بانتظار المراجعة": "bg-amber-100 text-amber-800 border-amber-300",
    "موافق عليها":      "bg-emerald-100 text-emerald-800 border-emerald-300",
    "مرفوضة":           "bg-red-100 text-red-800 border-red-300",
  };

  const doApprove = (id) => { onApprove(id, "approve", "تمت الموافقة وتدقيق متطلبات العمل الأساسية."); };
  const doReject  = (id) => { setNoteModal(id); setAdminNote(""); };
  const confirmReject = () => {
    if (noteModal) { onApprove(noteModal, "reject", adminNote); setNoteModal(null); }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4 fu">
      {/* Section toggle */}
      <div className="flex gap-2 no-print">
        <button onClick={() => setActiveSection("requests")}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${activeSection === "requests" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
          <ClipboardList size={13}/> الطلبات الواردة
          {pending > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pending}</span>}
        </button>
        <button onClick={() => setActiveSection("notifications")}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${activeSection === "notifications" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
          <Bell size={13}/> الإشعارات
          {unreadCount > 0 && <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </button>
      </div>

      {/* ── REQUESTS SECTION ── */}
      {activeSection === "requests" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "بانتظار المراجعة", v: pending, c: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
              { l: "موافق عليها",      v: approved, c: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
              { l: "مرفوضة",          v: rejected, c: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
            ].map(s => (
              <div key={s.l} className={`${s.bg} border ${s.border} rounded-2xl p-3 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                   onClick={() => setFilter(s.l)}>
                <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-[10px] text-slate-500">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar no-print">
            {["الكل", "بانتظار المراجعة", "موافق عليها", "مرفوضة"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                  filter === f ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}>
                {f} {f !== "الكل" && <span className="text-[9px] opacity-70">({allRequests.filter(r => r.status === f).length})</span>}
              </button>
            ))}
            <PrintButton targetId="print-approvals" title="تقرير الطلبات"/>
          </div>

          {/* Requests list */}
          <div id="print-approvals" className="space-y-3">
            {/* Print header */}
            <div className="hidden print:block text-center mb-4">
              <p className="text-lg font-bold">شركة نفط البصرة — شعبة الفاو</p>
              <p className="text-sm">تقرير الطلبات — {new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <CheckCircle size={28} className="text-slate-300 mx-auto mb-2"/>
                <p className="text-sm text-slate-400">لا توجد طلبات {filter !== "الكل" ? filter : ""}</p>
              </div>
            ) : (
              filtered.map(req => (
                <div key={req.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  req.status === "بانتظار المراجعة" ? "border-amber-200 border-r-4 border-r-amber-400" : "border-slate-200"
                }`}>
                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {req.empName?.[0] || "م"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{req.empName}</p>
                        <p className="text-[11px] text-slate-500">{req.empTitle} · {req.empDept}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{req.empJobNum}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_BADGE[req.status] || ""}`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Request details */}
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEAVE_TYPES[req.type]?.light || "bg-slate-100 text-slate-600"}`}>
                          {LEAVE_TYPES[req.type]?.label || req.type}
                        </span>
                        <span className="text-xs font-bold text-blue-700">{toArabicNum(req.days)} يوم</span>
                        {req.isAbroad && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🛂 خارج العراق</span>}
                        {req.warnings?.length > 0 && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⚠️ تحتاج موافقة خاصة</span>}
                      </div>
                      <p className="text-xs text-slate-600">
                        من <strong>{arabicDate(req.dateFrom)}</strong> إلى <strong>{arabicDate(req.dateTo)}</strong>
                      </p>
                      <p className="text-xs text-slate-500">الغرض: <strong>{req.purpose}</strong></p>
                      <p className="text-[10px] text-slate-400">
                        تاريخ التقديم: {new Date(req.submittedAt).toLocaleDateString("ar-IQ")} — {new Date(req.submittedAt).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {req.adminNote && (
                        <p className="text-xs text-slate-600 border-t border-slate-200 pt-1.5 mt-1.5">
                          <span className="font-bold">ملاحظة المشرف:</span> {req.adminNote}
                        </p>
                      )}
                      {req.decidedAt && (
                        <p className="text-[10px] text-slate-400">
                          {req.status === "موافق عليها" ? "✅" : "❌"} القرار بتاريخ: {new Date(req.decidedAt).toLocaleDateString("ar-IQ")} — {req.decidedBy}
                        </p>
                      )}
                    </div>

                    {/* Action buttons — only for pending */}
                    {req.status === "بانتظار المراجعة" && (
                      <div className="flex gap-2 mt-3 no-print">
                        <button onClick={() => doApprove(req.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl active:scale-95 transition-all shadow-sm">
                          <ThumbsUp size={14}/> موافقة
                        </button>
                        <button onClick={() => doReject(req.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl active:scale-95 transition-all shadow-sm">
                          <ThumbsDown size={14}/> رفض
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── NOTIFICATIONS SECTION ── */}
      {activeSection === "notifications" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between no-print">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Bell size={14} className="text-blue-600"/> الإشعارات
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
                تعيين الكل كمقروء
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <Bell size={28} className="text-slate-300 mx-auto mb-2"/>
              <p className="text-sm text-slate-400">لا توجد إشعارات</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id}
                className={`bg-white rounded-2xl border p-4 flex items-start gap-3 shadow-sm transition-colors ${
                  n.read ? "border-slate-200" : "border-blue-300 bg-blue-50/30"
                }`}
                onClick={() => !n.read && setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === "طلب_جديد" ? "bg-amber-100" :
                  n.type === "موافقة" ? "bg-emerald-100" : "bg-red-100"
                }`}>
                  {n.type === "طلب_جديد" ? <FileText size={16} className="text-amber-600"/> :
                   n.type === "موافقة" ? <ThumbsUp size={16} className="text-emerald-600"/> :
                   <ThumbsDown size={16} className="text-red-500"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {new Date(n.timestamp).toLocaleDateString("ar-IQ")} — {new Date(n.timestamp).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-2"/>}
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject note modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={() => setNoteModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <ThumbsDown size={16} className="text-red-600"/>
              </div>
              <h3 className="font-bold text-slate-800">تأكيد الرفض</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">أضف ملاحظة توضح سبب الرفض (اختياري):</p>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
              rows={3} placeholder="سبب الرفض أو ملاحظة للموظف..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"/>
            <div className="flex gap-2">
              <button onClick={() => setNoteModal(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
              <button onClick={confirmReject}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 active:scale-95 transition-all">
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════ */
function Dashboard({ emp, onLogout }) {
  const [view,    setView]    = useState("home");
  const [receipt, setReceipt] = useState(null);

  // ── LOCAL (personal, per-device)
  const [empSignatures, setEmpSignatures] = useLocalStorage("boc_signatures", {});

  // ── FIREBASE (shared across ALL browsers/devices in real-time)
  const [allRequests,   setAllRequests]   = useFirebase("requests",              []);
  const [employees,     setEmployees]     = useFirebase("employees",             ACCOUNTS);
  const [transferLog,   setTransferLog]   = useFirebase("transfers",             []);
  const [notifications, setNotifications] = useFirebase(`notifications/${emp.id}`, []);

  // Personal history (also on Firebase, keyed per employee)
  const [history, setHistory] = useFirebase(`history/${emp.id}`, []);

  const isAdmin = emp.username === "i.shawi";

  // ── Login history logger — defined BEFORE useEffect
  const logLogin = useCallback(() => {
    const entry = {
      id: Date.now(),
      empId: emp.id,
      empName: emp.name,
      empTitle: emp.title,
      empDept: emp.dept,
      username: emp.username,
      loginAt: new Date().toISOString(),
      device: navigator.userAgent.includes("Mobile") ? "موبايل" : "كمبيوتر",
    };
    fb.get("login_history").then(existing => {
      const prev = Array.isArray(existing) ? existing : [];
      fb.set("login_history", [entry, ...prev].slice(0, 500));
    });
  }, [emp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Log login on mount
  useEffect(() => { logLogin(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pending count for admin badge
  const pendingCount = useMemo(() =>
    (Array.isArray(allRequests) ? allRequests : []).filter(r => r.status === "بانتظار المراجعة").length
  , [allRequests]);

  // Unread notifications count
  const unreadCount = useMemo(() =>
    (Array.isArray(notifications) ? notifications : []).filter(n => !n.read).length
  , [notifications]);

  const handleSubmit = (leave) => {
    const rec = {
      ...leave,
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      status: "بانتظار المراجعة",
      empId: emp.id,
      empName: emp.name,
      empTitle: emp.title,
      empDept: emp.dept,
      empJobNum: emp.jobNum,
    };

    // Save to employee's personal history (Firebase)
    const newHistory = [rec, ...history];
    setHistory(newHistory);

    // Save to global requests (Firebase) — visible to admin immediately
    const newRequests = Array.isArray(allRequests) ? [rec, ...allRequests] : [rec];
    setAllRequests(newRequests);

    // Send notification to admin (id=1 = i.shawi)
    const adminNotif = {
      id: Date.now() + 1,
      type: "طلب_جديد",
      title: `🔔 طلب ${LEAVE_TYPES[leave.type]?.label || leave.type} جديد`,
      body: `${emp.name.split(" ").slice(0, 2).join(" ")} — ${leave.days} يوم`,
      requestId: rec.id,
      timestamp: new Date().toISOString(),
      read: false,
    };
    fb.get(`notifications/1`).then(existing => {
      const prev = Array.isArray(existing) ? existing : [];
      fb.set(`notifications/1`, [adminNotif, ...prev]);
    });

    setReceipt(rec);
    setView("receipt");
  };

  // ── Admin: approve or reject a request
  const handleApproval = useCallback((reqId, decision, adminNote = "") => {
    const newStatus  = decision === "approve" ? "موافق عليها" : "مرفوضة";
    const timestamp  = new Date().toISOString();
    const req        = (Array.isArray(allRequests) ? allRequests : []).find(r => r.id === reqId);
    if (!req) return;

    // 1. Update in global requests (Firebase)
    const updatedRequests = (Array.isArray(allRequests) ? allRequests : []).map(r =>
      r.id === reqId ? { ...r, status: newStatus, decidedAt: timestamp, decidedBy: emp.name, adminNote } : r
    );
    setAllRequests(updatedRequests);

    // 2. Update employee's personal history (Firebase)
    fb.get(`history/${req.empId}`).then(empHist => {
      const prev = Array.isArray(empHist) ? empHist : [];
      const updated = prev.map(h =>
        h.id === reqId ? { ...h, status: newStatus, decidedAt: timestamp, decidedBy: emp.name, adminNote } : h
      );
      fb.set(`history/${req.empId}`, updated);
    });

    // 3. Notify the employee (Firebase)
    const empNotif = {
      id: Date.now(),
      type: decision === "approve" ? "موافقة" : "رفض",
      title: decision === "approve"
        ? `✅ تمت الموافقة على إجازتك`
        : `❌ تم رفض طلب إجازتك`,
      body: `${LEAVE_TYPES[req.type]?.label || req.type} — ${req.days} يوم${adminNote ? " | ملاحظة: " + adminNote : ""}`,
      requestId: reqId,
      timestamp,
      read: false,
    };
    fb.get(`notifications/${req.empId}`).then(existing => {
      const prev = Array.isArray(existing) ? existing : [];
      fb.set(`notifications/${req.empId}`, [empNotif, ...prev]);
    });

    // 4. If admin is viewing their own notification feed, refresh it
    if (req.empId === emp.id) {
      setNotifications(prev => [empNotif, ...(Array.isArray(prev) ? prev : [])]);
    }
  }, [allRequests, emp, setAllRequests, setNotifications]);

  const STATUS_STYLE = {
    "بانتظار المراجعة": "bg-amber-50 text-amber-700 border-amber-200",
    "موافق عليها":      "bg-emerald-50 text-emerald-700 border-emerald-200",
    "مرفوضة":           "bg-red-50 text-red-700 border-red-200",
  };

  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();
  const monthName = new Date().toLocaleDateString("ar-IQ",{month:"long",year:"numeric"});

  const getMonthlyUsed = useCallback((type) => history.filter(h => {
    const d = new Date(h.submittedAt);
    return h.type===type && d.getMonth()===thisMonth && d.getFullYear()===thisYear;
  }).reduce((s,h)=>s+h.days, 0), [history, thisMonth, thisYear]);

  const monthlyTotal = useMemo(()=>
    ["اعتيادية","مرضية","زمنية"].reduce((s,t)=>s+getMonthlyUsed(t), 0)
  , [getMonthlyUsed]);

  return (
    <div className="min-h-screen bg-[#f0f4fa] flex flex-col md:flex-row" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
        *{font-family:'IBM Plex Sans Arabic',sans-serif;box-sizing:border-box;}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .3s ease both}
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        input,select,textarea,button{-webkit-tap-highlight-color:transparent}
        body{-webkit-overflow-scrolling:touch;overscroll-behavior-y:none}
        @media print{
          .no-print{display:none!important}
          body,html{background:white!important}
          aside,header,footer,nav{display:none!important}
          #print-area,table{border-color:#000!important}
          .fu{animation:none!important}
          tr{break-inside:avoid}
        }
      `}</style>

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="no-print hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-800 border border-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">BOC</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">شركة نفط البصرة</p>
              <p className="text-[10px] text-blue-400">شعبة مستودع الفاو</p>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl px-3 py-2">
            <p className="text-xs font-bold text-slate-200 truncate">{emp.name.split(" ").slice(0,3).join(" ")}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{emp.title} · {emp.shift}</p>
            {isAdmin && <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1 mt-1"><Shield size={10}/> مشرف ومخول</span>}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { id:"home",       label:"الرئيسية",        icon:<Home size={14}/> },
            { id:"evaluation", label:"التقييم الشهري",  icon:<Star size={14}/> },
            { id:"training",   label:"التدريب",          icon:<GraduationCap size={14}/> },
            { id:"reports",    label:"التقارير",         icon:<BarChart size={14}/> },
            { id:"materials",  label:"طلب مواد",         icon:<Package size={14}/> },
            { id:"inventory",  label:"جرد المخزن",       icon:<Layers size={14}/> },
            { id:"furniture",  label:"جرد الأثاث",       icon:<ClipboardList size={14}/> },
            { id:"projects",   label:"المشاريع",         icon:<FolderOpen size={14}/> },
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setView(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                view===tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}

          {/* Notifications for non-admin */}
          {!isAdmin && (
            <button onClick={()=>{setView("notifications");setNotifications((Array.isArray(notifications)?notifications:[]).map(n=>({...n,read:true})));}}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                view==="notifications" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}>
              <span className="flex items-center gap-2.5"><Bell size={14}/> الإشعارات</span>
              {unreadCount>0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
          )}

          {/* Admin section */}
          {isAdmin && (
            <div className="border-t border-slate-800 pt-3 mt-3 space-y-0.5">
              <p className="text-[10px] font-bold text-slate-500 px-3 mb-2">صلاحيات المشرف</p>
              <button onClick={()=>setView("approvals")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  view==="approvals" ? "bg-amber-600 text-white" : "text-amber-400 hover:bg-slate-800"
                }`}>
                <span className="flex items-center gap-2.5"><ThumbsUp size={14}/> الموافقات</span>
                {pendingCount>0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
              </button>
              <button onClick={()=>setView("loginhistory")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  view==="loginhistory" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}>
                <Clock size={14}/> سجل الدخول
              </button>
              <button onClick={()=>setView("employees")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  view==="employees" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}>
                <Users size={14}/> إدارة الموظفين
              </button>
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 transition-colors">
            <LogOut size={14}/> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── RIGHT SIDE: header + content ── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile topbar */}
        <header className="no-print md:hidden" style={{background:"linear-gradient(135deg,#0d2348,#1a3a6e)"}}>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[10px]">BOC</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-xs font-bold">شركة نفط البصرة — شعبة الفاو</p>
            </div>
            <button onClick={()=>setView(isAdmin?"approvals":"notifications")}
              className="relative text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10">
              <Bell size={17}/>
              {(isAdmin?pendingCount:unreadCount)>0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {isAdmin?pendingCount:unreadCount}
                </span>
              )}
            </button>
            <button onClick={onLogout} className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10">
              <LogOut size={16}/>
            </button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="no-print fixed bottom-0 right-0 left-0 z-40 md:hidden"
             style={{background:"rgba(255,255,255,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid #e2e8f0",paddingBottom:"env(safe-area-inset-bottom)"}}>
          <div className="flex">
            {[
              { id:"home",      label:"الرئيسية",  icon:<Home size={18}/> },
              { id:"evaluation",label:"التقييم",   icon:<Star size={18}/> },
              { id:"training",  label:"التدريب",   icon:<GraduationCap size={18}/> },
              { id:"reports",   label:"التقارير",  icon:<BarChart size={18}/> },
              { id:"materials", label:"مواد",       icon:<Package size={18}/> },
              ...(isAdmin ? [
                { id:"approvals",    label:"الموافقات",  icon:<ThumbsUp size={18}/>, badge: pendingCount },
                { id:"loginhistory", label:"الدخول",     icon:<Clock size={18}/> },
                { id:"employees",    label:"الموظفون",   icon:<Shield size={18}/> },
              ] : [
                { id:"notifications", label:"إشعاراتي", icon:<Bell size={18}/>, badge: unreadCount },
              ]),
            ].map(tab=>(
              <button key={tab.id} onClick={()=>{
                setView(tab.id);
                if(tab.id==="notifications"&&unreadCount>0){
                  setNotifications(prev=>(Array.isArray(prev)?prev:[]).map(n=>({...n,read:true})));
                }
              }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors relative ${
                  view===tab.id ? "text-blue-600" : "text-slate-400"
                }`}>
                <span className={`p-1.5 rounded-xl transition-all relative ${view===tab.id?"bg-blue-100":""}`}>
                  {tab.icon}
                  {tab.badge>0 && (
                    <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-bold leading-none">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 p-4 md:p-6 space-y-5 pb-24 md:pb-6 overflow-y-auto">

        {view === "home" && (
          <div className="fu space-y-5">

            {/* Welcome + monthly snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                     style={{background:"linear-gradient(135deg,#1d4ed8,#1e40af)"}}>
                  {emp.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900">مرحباً، {emp.name.split(" ")[0]}</p>
                    {isAdmin && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Shield size={10}/> مشرف</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{emp.title} · {emp.dept}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{emp.jobNum}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">{emp.shift}{emp.group?` [${emp.group}]`:""}</span>
                  </div>
                </div>
              </div>
              {/* Monthly counter strip */}
              <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex flex-wrap items-center gap-2 justify-between">
                <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1 shrink-0">
                  <Calendar size={12} className="text-blue-500"/> إجازاتي في {monthName}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {key:"اعتيادية",color:"text-blue-700 bg-blue-50 border-blue-200",max:30},
                    {key:"مرضية",   color:"text-rose-700 bg-rose-50 border-rose-200", max:15},
                    {key:"زمنية",   color:"text-amber-700 bg-amber-50 border-amber-200",max:7},
                  ].map(t=>(
                    <span key={t.key} className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${t.color}`}>
                      {t.key}: {toArabicNum(getMonthlyUsed(t.key))}/{t.max}
                    </span>
                  ))}
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700">
                    إجمالي: {toArabicNum(monthlyTotal)} يوم
                  </span>
                </div>
              </div>
            </div>

            {/* Rules banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
                <span className="text-2xl shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-bold text-orange-800">اعتيادية أكثر من ٣ أيام</p>
                  <p className="text-[11px] text-orange-700 mt-1 leading-relaxed">يجب الحصول على موافقة مدير القسم قبل تقديم الطلب</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                <span className="text-2xl shrink-0">🛂</span>
                <div>
                  <p className="text-sm font-bold text-red-800">السفر خارج العراق</p>
                  <p className="text-[11px] text-red-700 mt-1 leading-relaxed">يجب موافقة مدير الهيأة وانتظار الأمر الإداري قبل السفر</p>
                </div>
              </div>
            </div>

            {/* Leave type buttons */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">تقديم طلب إجازة</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {type:"اعتيادية",icon:"🏖️",desc:"حتى 30 يوم", gradient:"from-blue-600 to-blue-800"},
                  {type:"مرضية",   icon:"🏥",desc:"حتى 15 يوم", gradient:"from-rose-600 to-rose-800"},
                  {type:"زمنية",   icon:"⏱️",desc:"حتى 7 أيام", gradient:"from-amber-500 to-amber-700"},
                ].map(lt=>(
                  <button key={lt.type} onClick={()=>setView("form")}
                    className={`bg-gradient-to-br ${lt.gradient} text-white rounded-2xl p-5 text-right shadow-md hover:shadow-lg active:scale-95 transition-all`}>
                    <span className="text-3xl mb-3 block">{lt.icon}</span>
                    <p className="font-bold text-sm">{LEAVE_TYPES[lt.type].label}</p>
                    <p className="text-white/70 text-xs mt-1">{lt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── My Pending Tasks widget (non-admin) ── */}
            {!isAdmin && <MyTasksWidget emp={emp} onNavigate={setView}/>}

            {/* History — shows live status from allRequests */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
                تاريخ طلباتي ونتائجها
                <span className="text-[11px] font-normal text-slate-400">إجمالي: {toArabicNum((Array.isArray(history)?history:[]).length)}</span>
              </h3>
              {(Array.isArray(history)?history:[]).length === 0
                ? <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                    <FileText size={24} className="text-slate-300 mx-auto mb-2"/>
                    <p className="text-sm text-slate-400">لا يوجد طلبات سابقة في أرشيفك الشخصي</p>
                  </div>
                : <div className="space-y-2">
                    {(Array.isArray(history)?history:[]).map(h => {
                      const live = (Array.isArray(allRequests)?allRequests:[]).find(r => r.id === h.id);
                      const status = live?.status || h.status;
                      const adminNote = live?.adminNote || h.adminNote || "";
                      return (
                        <div key={h.id} className={`bg-white rounded-2xl border p-4 flex flex-col gap-2 shadow-sm ${
                          status==="موافق عليها" ? "border-emerald-200" :
                          status==="مرفوضة" ? "border-red-200" : "border-slate-200"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {LEAVE_TYPES[h.type]?.label||h.type} — {toArabicNum(h.days)} يوم
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[status]||""}`}>
                              {status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            من {arabicDate(h.dateFrom)} إلى {arabicDate(h.dateTo)}
                            {h.purpose && ` | لغرض: ${h.purpose}`}
                          </p>
                          {h.isAbroad && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full w-fit">🛂 خارج العراق</span>}
                          {/* Admin note — displayed prominently */}
                          {adminNote && (
                            <div className="text-[11px] bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-slate-700 shadow-sm">
                              <span className="font-bold text-blue-700">📋 تقرير وملاحظات المشرف:</span> {adminNote}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          </div>
        )}

        {view === "form" && (
          <div className="fu">
            <LeaveForm emp={emp} history={history} onSubmit={handleSubmit} onCancel={()=>setView("home")}/>
          </div>
        )}

        {view === "receipt" && receipt && (
          <div className="fu">
            <LeaveReceipt emp={emp} leave={receipt} onClose={()=>setView("home")}/>
          </div>
        )}

        {view === "training" && (
          <div className="fu">
            <div className="flex items-center gap-3 mb-4 no-print">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <GraduationCap size={16} className="text-violet-600"/>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">التدريب والتطوير</h2>
                <p className="text-[11px] text-slate-500">المهام التدريبية · طلبات المشاركة · إشعارات واتساب</p>
              </div>
            </div>
            <TrainingPage emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
          </div>
        )}

        {view === "reports" && (
          <div className="fu">
            <div className="flex items-center gap-3 mb-4 no-print">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <BarChart size={16} className="text-blue-600"/>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">التقارير</h2>
                <p className="text-[11px] text-slate-500">يومي · أسبوعي · شهري</p>
              </div>
            </div>
            <ReportsPage emp={emp} isAdmin={isAdmin}/>
          </div>
        )}

        {view === "evaluation" && (
          <div className="fu">
            <div className="flex items-center gap-3 mb-4 no-print">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Star size={16} className="text-amber-600"/>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">التقييم الشهري</h2>
                <p className="text-[11px] text-slate-500">المهام · الحضور · المشاركة · المبادرة</p>
              </div>
            </div>
            <EvaluationPage emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
          </div>
        )}

        {view === "materials" && (
          <div className="fu">
            <MaterialRequest emp={emp} empSignatures={empSignatures} setEmpSignatures={setEmpSignatures}/>
          </div>
        )}

        {view === "inventory" && (
          <div className="fu">
            <div className="flex items-center justify-between mb-4 no-print">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-blue-600"/>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">جرد محتويات المخزن</h2>
                  <p className="text-[11px] text-slate-500">شعبة مستودع الفاو — الرئيسي</p>
                </div>
              </div>
            </div>
            <InventoryPage emp={emp} transferLog={transferLog} setTransferLog={setTransferLog}/>
          </div>
        )}

        {view === "furniture" && (
          <div className="fu">
            <div className="flex items-center justify-between mb-4 no-print">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-violet-600"/>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">جرد الأثاث والمعدات</h2>
                  <p className="text-[11px] text-slate-500">المكاتب والأجهزة ومعدات الموقع</p>
                </div>
              </div>
            </div>
            <FurnitureInventory emp={emp} transferLog={transferLog} setTransferLog={setTransferLog}/>
          </div>
        )}

        {view === "notifications" && !isAdmin && (
          <div className="fu space-y-4">
            <div className="flex items-center justify-between no-print">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-blue-600"/>
                </div>
                <h2 className="text-base font-bold text-slate-800">إشعاراتي</h2>
              </div>
              {unreadCount > 0 && (
                <button onClick={()=>setNotifications(prev=>prev.map(n=>({...n,read:true})))}
                  className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl">
                  تعيين الكل كمقروء
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <Bell size={28} className="text-slate-300 mx-auto mb-2"/>
                <p className="text-sm text-slate-400">لا توجد إشعارات بعد</p>
                <p className="text-xs text-slate-300 mt-1">ستصلك إشعارات عند الموافقة على طلباتك أو رفضها</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(n=>(
                  <div key={n.id}
                    className={`bg-white rounded-2xl border p-4 flex items-start gap-3 shadow-sm ${
                      n.read ? "border-slate-200" : "border-blue-300 bg-blue-50/30"
                    }`}
                    onClick={()=>!n.read && setNotifications(prev=>prev.map(x=>x.id===n.id?{...x,read:true}:x))}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type==="موافقة"?"bg-emerald-100":n.type==="رفض"?"bg-red-100":"bg-amber-100"
                    }`}>
                      {n.type==="موافقة"
                        ? <ThumbsUp size={16} className="text-emerald-600"/>
                        : n.type==="رفض"
                        ? <ThumbsDown size={16} className="text-red-500"/>
                        : <Bell size={16} className="text-amber-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${n.read?"text-slate-700":"text-slate-900"}`}>{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.timestamp).toLocaleDateString("ar-IQ")} — {new Date(n.timestamp).toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})}
                      </p>
                    </div>
                    {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-2"/>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "loginhistory" && isAdmin && (
          <div className="fu">
            <div className="flex items-center gap-3 mb-4 no-print">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-white"/>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">سجل دخول الموظفين</h2>
                <p className="text-[11px] text-slate-500">مراقبة من دخل وخرج — محدّث لحظياً</p>
              </div>
            </div>
            <LoginHistoryPage/>
          </div>
        )}

        {view === "approvals" && isAdmin && (
          <div className="fu">
            <div className="flex items-center gap-3 mb-4 no-print">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <ThumbsUp size={16} className="text-emerald-600"/>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">الموافقات والإشعارات</h2>
                <p className="text-[11px] text-amber-600 font-semibold">صلاحية المشرف — ايهاب الشاوي</p>
              </div>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {pendingCount} طلب معلق
                </span>
              )}
            </div>
            <ApprovalPage
              allRequests={allRequests}
              onApprove={handleApproval}
              notifications={notifications}
              setNotifications={setNotifications}
              emp={emp}
            />
          </div>
        )}

        {view === "employees" && isAdmin && (
          <div className="fu">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-amber-600"/>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">إدارة الموظفين</h2>
                <p className="text-[11px] text-amber-600 font-semibold">صلاحية مشرف — ايهاب الشاوي فقط</p>
              </div>
            </div>
            <EmployeeManager employees={employees} setEmployees={setEmployees}/>
          </div>
        )}

        {view === "projects" && (
          <div className="fu">
            <ProjectsPage emp={emp}/>
          </div>
        )}

      </main>
      </div>{/* closes flex-1 flex-col right panel */}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INVENTORY — جرد محتويات المخزن
═══════════════════════════════════════════════════════════ */
const ITEM_CONDITIONS = ["جيد","مستعمل","يحتاج صيانة","تالف"];
const COND_STYLE = {
  "جيد":          "bg-emerald-100 text-emerald-800 border-emerald-200",
  "مستعمل":       "bg-blue-100 text-blue-800 border-blue-200",
  "يحتاج صيانة":  "bg-amber-100 text-amber-800 border-amber-200",
  "تالف":         "bg-red-100 text-red-800 border-red-300 font-bold animate-pulse",
};
const INIT_STOCK = [
  // ── أجهزة قياس ومعايرة
  {id:1,  code:"2301280010", name:"مقاومة متغيرة",                          category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:2,  code:"2301243008", name:"مولد ذبذبات",                            category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:3,  code:"2309443025", name:"جهاز معايرة مقياس الضغط (1)",           category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:4,  code:"2309443011", name:"جهاز معايرة مقياس الضغط (2)",           category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:5,  code:"2301373023", name:"جهاز مقياس متعدد الاغراض",              category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:6,  code:"2301390031", name:"جهاز قياس الضغط بالأوزان (1B77)",      category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"تالف",        location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:7,  code:"2308513026", name:"جهاز معايرة الضغوط",                    category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"مستعمل",      location:"ورشة",                 lastUpdate:"2024-01-01"},
  {id:8,  code:"2301493004", name:"جهاز معايرة المزدوجات (درجة الحرارة)", category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:9,  code:"2301293019", name:"جهاز تمييز الحساسات الحرارية",          category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:10, code:"2335613000", name:"جهاز فحص الفولتية (SS22344089)",       category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:11, code:"2336263013", name:"جهاز كشف مسار الكابلات (SS257676213)", category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:12, code:"2335070006", name:"جهاز راسم الذبذبات (RS-248-898)",      category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:13, code:"2311183002", name:"كاميرا تصوير حرارية (TL-12513120)",    category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:14, code:"2503163065", name:"ايفو ميتر (263458)",                    category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:15, code:"—",          name:"ايفو ميتر (90410374) — ورشة",          category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"مستعمل",      location:"ورشة",                 lastUpdate:"2024-01-01"},
  {id:16, code:"—",          name:"ايفو ميتر (57440394)",                  category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:17, code:"—",          name:"FLUKE (9110016)",                        category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2023-08-27"},
  {id:18, code:"2501035893", name:"كوسرة طيارية",                          category:"عدد يدوية",     unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:19, code:"2505133097", name:"منكنة",                                  category:"عدد يدوية",     unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:20, code:"2505503033", name:"جهاز ضغط يدوي هوائي (13104)",          category:"أجهزة ضغط",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:21, code:"2505503013", name:"جهاز ضغط يدوي هوائي (220828)",         category:"أجهزة ضغط",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:22, code:"2507973015", name:"جهاز ضغط هيدروليك (17093)",            category:"أجهزة ضغط",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:23, code:"2507973016", name:"جهاز ضغط هيدروليك (17077)",            category:"أجهزة ضغط",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:24, code:"2509133009", name:"جهاز معايرة الحرارة (204822)",         category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:25, code:"2503303018", name:"جهاز معايرة الحرارة (2594143)",        category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:26, code:"2503513013", name:"جهاز معايرة التيار الكهربائي الواطئ", category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:27, code:"2511233055", name:"كلاب ميتر (1400004)",                   category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:28, code:"2511090188", name:"ميتر MEQ-2",                            category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:29, code:"2504786015", name:"ضاغطة هواء — ورشة",                    category:"أجهزة ضغط",    unit:"قطعة", qty:1,   condition:"مستعمل",      location:"ورشة",                 lastUpdate:"2024-01-01"},
  {id:30, code:"2505073613", name:"مقياس ضغط هيدروليك (2605162)",         category:"أجهزة ضغط",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:31, code:"2510593033", name:"جهاز قياس الحرارة (12157)",            category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:32, code:"2503303032", name:"جهاز قياس الحرارة الدقيق (227-005)",  category:"أجهزة قياس",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  // ── عدد كهربائية
  {id:33, code:"—",          name:"دريل كهربائي",                          category:"عدد كهربائية",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:34, code:"—",          name:"منفاخ هواء",                            category:"عدد يدوية",     unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:35, code:"2313973022", name:"ماكنة لحام",                            category:"عدد كهربائية",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:36, code:"—",          name:"منشار كهربائي",                         category:"عدد كهربائية",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  // ── أجهزة معايرة إضافية
  {id:37, code:"SN117079",   name:"جهاز معايرة هيدروليك",                  category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:38, code:"SN2041104",  name:"جهاز معايرة هوائي",                     category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:39, code:"SN2034224",  name:"جهاز معايرة الحرارة",                   category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:40, code:"SN2642",     name:"جهاز معايرة الحراري BL-7",              category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:41, code:"SN3164",     name:"جهاز معايرة ضغط بالأوزان",             category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:42, code:"SN13081",    name:"جهاز معايرة الضغط بالهواء",            category:"أجهزة معايرة",  unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:43, code:"2624033",    name:"FLUKE 726 — متعدد الاغراض مع قياس الضغط", category:"أجهزة قياس", unit:"قطعة", qty:1,  condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:44, code:"26242703",   name:"FLUKE 700P27 — متعدد الاغراض مع قياس الضغط", category:"أجهزة قياس", unit:"قطعة", qty:1, condition:"جيد",       location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  // ── صمامات
  {id:45, code:"5869856100", name:"VALVE SOLENOID EXPROOF 3WAY",           category:"صمامات",        unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:46, code:"5899710065", name:"VALVE NEEDLE",                          category:"صمامات",        unit:"قطعة", qty:2,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:47, code:"5869892300", name:"VALVE SWITCHING",                       category:"صمامات",        unit:"قطعة", qty:2,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:48, code:"5869996510", name:"VALVE CHECK INODC250",                  category:"صمامات",        unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:49, code:"5869856050", name:"NEEDLE SOLENOID 1/2 TUBE",             category:"صمامات",        unit:"قطعة", qty:2,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:50, code:"5883202040", name:"NEEDLE VALVE P-N215129",               category:"صمامات",        unit:"قطعة", qty:4,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:51, code:"5889835125", name:"NEEDLE VALVE P-N915370",               category:"صمامات",        unit:"قطعة", qty:5,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:52, code:"5863208250", name:"NEEDLE VALVE 4F-V6LN-SS",              category:"صمامات",        unit:"قطعة", qty:21,  condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:53, code:"00-036-3401",name:"FNPTV BALL 1/2 NEEDLE",               category:"صمامات",        unit:"قطعة", qty:7,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:54, code:"—",          name:"صمام ذاتي التفريق",                    category:"صمامات",        unit:"قطعة", qty:1,   condition:"تالف",        location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:55, code:"—",          name:"صمام 1/2 HGVS12NC",                   category:"صمامات",        unit:"قطعة", qty:14,  condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:56, code:"—",          name:"صمام مختلف الاستخدام (5 اتجاهات كبير)", category:"صمامات",     unit:"قطعة", qty:5,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  // ── مقاييس ضغط (كيجات)
  {id:57, code:"—",          name:"كيج 30 par صغير",                      category:"مقاييس ضغط",   unit:"قطعة", qty:6,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:58, code:"—",          name:"كيج 60 psi صغير",                      category:"مقاييس ضغط",   unit:"قطعة", qty:25,  condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:59, code:"—",          name:"كيج 30 psi صغير",                      category:"مقاييس ضغط",   unit:"قطعة", qty:2,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:60, code:"—",          name:"كيج 250 kgf/cm2 كبير",                 category:"مقاييس ضغط",   unit:"قطعة", qty:5,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:61, code:"—",          name:"كيج 25 kg/cm2 كبير",                   category:"مقاييس ضغط",   unit:"قطعة", qty:8,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:62, code:"584-5002-529",name:"كيج 10 Kg كبير",                      category:"مقاييس ضغط",   unit:"قطعة", qty:9,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:63, code:"—",          name:"كيج 16 kg كبير",                       category:"مقاييس ضغط",   unit:"قطعة", qty:10,  condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:64, code:"—",          name:"كيج 100C كبير",                        category:"مقاييس ضغط",   unit:"قطعة", qty:2,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:65, code:"—",          name:"كيج 50 KG",                            category:"مقاييس ضغط",   unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:66, code:"—",          name:"كيج 25 par وسط",                       category:"مقاييس ضغط",   unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  // ── مرسلات وأجهزة تحكم
  {id:67, code:"—",          name:"مرسلة ضغط",                            category:"أجهزة تحكم",   unit:"قطعة", qty:7,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:68, code:"—",          name:"مرسلة جريان",                          category:"أجهزة تحكم",   unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:69, code:"—",          name:"PIC كارت",                             category:"أجهزة تحكم",   unit:"قطعة", qty:8,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:70, code:"—",          name:"متحكم ضغط",                            category:"أجهزة تحكم",   unit:"قطعة", qty:3,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:71, code:"—",          name:"لوحة اشارة",                           category:"أجهزة تحكم",   unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:72, code:"—",          name:"مفتاح تشغيل",                          category:"أجهزة تحكم",   unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:73, code:"—",          name:"ثرموستات متحسس حرارة RTD",            category:"أجهزة تحكم",   unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  // ── قطع توصيل وعدد يدوية
  {id:74, code:"—",          name:"عكس مختلف الانواع حرف T",             category:"قطع توصيل",    unit:"قطعة", qty:150, condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:75, code:"—",          name:"عكس مختلف الانواع حرف L",             category:"قطع توصيل",    unit:"قطعة", qty:110, condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:76, code:"—",          name:"نبلة مختلف الاستخدام والاحجام",        category:"قطع توصيل",    unit:"قطعة", qty:100, condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:77, code:"0020261519", name:"عكس سبيل",                             category:"قطع توصيل",    unit:"قطعة", qty:12,  condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:78, code:"—",          name:"كماشة",                                category:"عدد يدوية",     unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:79, code:"—",          name:"كماشة حجم كبير",                       category:"عدد يدوية",     unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:80, code:"—",          name:"جاكوز",                                category:"عدد يدوية",     unit:"قطعة", qty:3,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:81, code:"—",          name:"كاوية لحيم",                           category:"عدد يدوية",     unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:82, code:"—",          name:"مسدس صمغ",                             category:"عدد يدوية",     unit:"قطعة", qty:2,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:83, code:"—",          name:"بايب سبانة 8 انش",                    category:"عدد يدوية",     unit:"قطعة", qty:5,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:84, code:"—",          name:"بايب سبانة 10 انش",                   category:"عدد يدوية",     unit:"قطعة", qty:5,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:85, code:"—",          name:"افيوميتر (أزرق)",                      category:"أجهزة قياس",    unit:"قطعة", qty:2,   condition:"تالف",        location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:86, code:"—",          name:"برشر سويج",                            category:"عدد يدوية",     unit:"قطعة", qty:3,   condition:"تالف",        location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:87, code:"—",          name:"منظم ضغط نيتروجين",                   category:"أجهزة ضغط",    unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
  {id:88, code:"—",          name:"رافعة هيدروليك",                       category:"عدد يدوية",     unit:"قطعة", qty:1,   condition:"جيد",         location:"مخزن الآلات الدقيقة", lastUpdate:"2024-01-01"},
];


const SITES = ["موقع الفاو الرئيسي","موقع المرافئ","موقع المستودع","موقع البصرة","موقع أبو الخصيب"];

function InventoryPage({ emp, transferLog, setTransferLog }) {
  const [items, setItems] = useLocalStorage("boc_stock", INIT_STOCK);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [filterCond, setFilterCond] = useState("الكل");
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({});
  const [adding, setAdding]       = useState(false);
  const [transferModal, setTransferModal] = useState(null);
  const [xferForm, setXferForm]   = useState({ qty:"1", site:"", note:"" });
  const [toast, setToast]         = useState("");

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(""),3000); };

  const cats = ["الكل", ...Array.from(new Set(items.map(i=>i.category)))];
  const filtered = items.filter(it=>{
    const ms = it.name.includes(search)||it.code.includes(search)||it.location.includes(search);
    const mc = filterCat==="الكل"||it.category===filterCat;
    const mco = filterCond==="الكل"||it.condition===filterCond;
    return ms&&mc&&mco;
  });

  const openEdit = (it) => { setEditId(it.id); setForm({...it}); setAdding(false); };
  const openAdd  = ()   => { setAdding(true); setEditId(null); setForm({id:Date.now(),code:"",name:"",category:"كهربائي",unit:"قطعة",qty:1,condition:"جيد",location:"",lastUpdate:new Date().toISOString().slice(0,10)}); };
  const cancelForm = () => { setEditId(null); setAdding(false); };

  const saveItem = () => {
    if (!form.code||!form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems(p=>[...p,{...form,id:Date.now()}]);
    else setItems(p=>p.map(it=>it.id===editId?{...form,id:editId,lastUpdate:new Date().toISOString().slice(0,10)}:it));
    showToast("✓ تم الحفظ");
    cancelForm();
  };

  const openTransfer = (it) => { setTransferModal(it); setXferForm({qty:"1",site:"",note:""}); };

  const doTransfer = () => {
    if (!xferForm.site||!xferForm.qty) return showToast("يرجى تحديد الموقع والكمية");
    const q = parseInt(xferForm.qty);
    if (q > transferModal.qty) return showToast("الكمية تتجاوز الرصيد المتاح");
    setItems(p=>p.map(it=>it.id===transferModal.id?{...it,qty:it.qty-q,lastUpdate:new Date().toISOString().slice(0,10)}:it));
    const log = {
      id:Date.now(), type:"مخزن",
      itemCode:transferModal.code, itemName:transferModal.name,
      qty:q, unit:transferModal.unit,
      fromSite:"موقع الفاو الرئيسي", toSite:xferForm.site,
      note:xferForm.note, user:emp.name,
      timestamp:new Date().toISOString(),
    };
    setTransferLog(p=>[log,...p]);
    setTransferModal(null);
    showToast(`✓ تم توثيق إرسال ${q} ${transferModal.unit} إلى ${xferForm.site}`);
  };

  const inpC = "w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const selC = inpC+" appearance-none cursor-pointer";

  return (
    <div className="space-y-4 fu">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center no-print">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[160px] shadow-sm">
          <Search size={13} className="text-slate-400 shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو الرمز..." className="bg-transparent text-xs outline-none text-slate-700 w-full placeholder:text-slate-400"/>
        </div>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-sm appearance-none">
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={filterCond} onChange={e=>setFilterCond(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-sm appearance-none">
          {["الكل",...ITEM_CONDITIONS].map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl shadow-sm">
          <Plus size={13}/> إضافة مادة
        </button>
        <PrintButton targetId="print-inventory" title="جرد المخزن — شعبة الفاو"/>
        <span className="text-xs text-slate-400">{filtered.length} مادة</span>
      </div>

      {/* Add/Edit form */}
      {(adding||editId) && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 shadow-sm no-print">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800 text-sm">{adding?"إضافة مادة جديدة":"تعديل المادة"}</h4>
            <button onClick={cancelForm} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={14}/></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[["الرمز *","code"],["الاسم *","name"],["الفئة","category"],["الوحدة","unit"]].map(([l,k])=>(
              <div key={k}>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{l}</label>
                <input value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className={inpC}/>
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الكمية</label>
              <input type="number" min="0" value={form.qty||0} onChange={e=>setForm(p=>({...p,qty:parseInt(e.target.value)||0}))} className={inpC}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الحالة</label>
              <select value={form.condition||"جيد"} onChange={e=>setForm(p=>({...p,condition:e.target.value}))} className={selC}>
                {ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الموقع / الرف</label>
              <input value={form.location||""} onChange={e=>setForm(p=>({...p,location:e.target.value}))} className={inpC}/>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={cancelForm} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
            <button onClick={saveItem} className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
              <Save size={12}/> حفظ
            </button>
          </div>
        </div>
      )}

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <div className="text-center mb-2">
          <p className="text-lg font-bold">شركة نفط البصرة — شعبة الفاو</p>
          <p className="text-sm">تقرير جرد المخزن — {new Date().toLocaleDateString("ar-IQ",{year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
      </div>

      {/* Table */}
      <div id="print-inventory" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <Package size={14} className="text-blue-600"/> جرد محتويات المخزن
          </h3>
          <div className="flex gap-2">
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
              تالف: {items.filter(i=>i.condition==="تالف").length}
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
              يحتاج صيانة: {items.filter(i=>i.condition==="يحتاج صيانة").length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["الرمز","اسم المادة","الفئة","الوحدة","الكمية","الحالة","الموقع","آخر تحديث","إجراءات"].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-[10px] font-bold text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((it,i)=>{
                const isDamaged = it.condition==="تالف";
                return (
                  <tr key={it.id}
                    className={`border-b border-slate-50 transition-colors ${isDamaged?"bg-red-50/40":"hover:bg-slate-50/60"} ${i===filtered.length-1?"border-b-0":""}`}>
                    <td className={`px-3 py-3 font-mono font-bold ${isDamaged?"text-red-600":"text-slate-600"}`}>
                      {isDamaged && "⚠ "}{it.code}
                    </td>
                    <td className={`px-3 py-3 font-semibold ${isDamaged?"text-red-700":"text-slate-800"}`}>{it.name}</td>
                    <td className="px-3 py-3 text-slate-500">{it.category}</td>
                    <td className="px-3 py-3 text-slate-500">{it.unit}</td>
                    <td className="px-3 py-3">
                      <span className={`font-bold text-sm ${isDamaged?"text-red-600":it.qty<5?"text-amber-600":"text-slate-800"}`}>
                        {it.qty}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${COND_STYLE[it.condition]||""}`}>
                        {isDamaged&&"🔴 "}{it.condition}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{it.location}</td>
                    <td className="px-3 py-3 text-slate-400 font-mono text-[10px]">{it.lastUpdate}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 no-print">
                        <button onClick={()=>openEdit(it)} title="تعديل" className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={12}/></button>
                        <button onClick={()=>openTransfer(it)} title="إرسال لموقع آخر" className="p-1 text-amber-500 hover:bg-amber-50 rounded-lg"><ArrowRightLeft size={12}/></button>
                        <button onClick={()=>{ if(window.confirm("حذف هذه المادة؟")) setItems(p=>p.filter(x=>x.id!==it.id)); }} title="حذف" className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Log */}
      {transferLog.filter(t=>t.type==="مخزن").length>0 && (
        <div id="print-inv-transfers" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-amber-600"/> سجل حركات الإرسال — المخزن
            </h3>
            <PrintButton targetId="print-inv-transfers" title="سجل حركات المخزن"/>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  {["التاريخ والوقت","الرمز","المادة","الكمية","من","إلى","ملاحظة","المستخدم"].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-[10px] font-bold text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transferLog.filter(t=>t.type==="مخزن").map((t,i)=>(
                  <tr key={t.id} className={`border-b border-slate-50 ${i%2===0?"":"bg-slate-50/30"}`}>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleDateString("ar-IQ")} {new Date(t.timestamp).toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">{t.itemCode}</td>
                    <td className="px-3 py-2.5 text-slate-700 font-semibold">{t.itemName}</td>
                    <td className="px-3 py-2.5 font-bold text-blue-700">{t.qty} {t.unit}</td>
                    <td className="px-3 py-2.5 text-slate-500">{t.fromSite}</td>
                    <td className="px-3 py-2.5 text-emerald-700 font-semibold">{t.toSite}</td>
                    <td className="px-3 py-2.5 text-slate-400">{t.note||"—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-semibold">{t.user.split(" ").slice(0,2).join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setTransferModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><ArrowRightLeft size={15} className="text-amber-500"/> إرسال مادة إلى موقع آخر</h3>
              <button onClick={()=>setTransferModal(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={15}/></button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs">
              <p className="font-bold text-slate-700">{transferModal.code} — {transferModal.name}</p>
              <p className="text-slate-500 mt-1">الرصيد المتاح: <strong className="text-blue-700">{transferModal.qty} {transferModal.unit}</strong></p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">الموقع المستلم *</label>
                <select value={xferForm.site} onChange={e=>setXferForm(p=>({...p,site:e.target.value}))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white appearance-none">
                  <option value="">-- اختر الموقع --</option>
                  {SITES.filter(s=>s!=="موقع الفاو الرئيسي").map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">الكمية المُرسلة *</label>
                <input type="number" min="1" max={transferModal.qty} value={xferForm.qty} onChange={e=>setXferForm(p=>({...p,qty:e.target.value}))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">ملاحظة</label>
                <input value={xferForm.note} onChange={e=>setXferForm(p=>({...p,note:e.target.value}))} placeholder="سبب الإرسال..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
                📋 سيتم توثيق هذه الحركة تلقائياً بالوقت والتاريخ باسم: <strong>{emp.name.split(" ").slice(0,2).join(" ")}</strong>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setTransferModal(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
              <button onClick={doTransfer} className="flex-1 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 active:scale-95 transition-all">
                تأكيد الإرسال
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl no-print">
          <CheckCircle size={14} className="text-emerald-400"/>{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FURNITURE INVENTORY — جرد الأثاث والمعدات
═══════════════════════════════════════════════════════════ */
const FURN_CATS = ["أثاث مكتبي","أجهزة حاسوب","معدات مكتبية","أجهزة اتصال","أخرى"];
const INIT_FURN = [
  // ── مكيفات هواء — قسم السيطرة والنظم شعبة الفاو
  {id:1,  code:"لا يوجد",      name:"سبلت 2 طن LG (1)",               category:"أجهزة تكييف",  qty:1,  condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:2,  code:"لا يوجد",      name:"سبلت 2 طن LG (2)",               category:"أجهزة تكييف",  qty:1,  condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:3,  code:"لا يوجد",      name:"سبلت 2 طن LG (3)",               category:"أجهزة تكييف",  qty:1,  condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:4,  code:"لا يوجد",      name:"سبلت 2 طن LG (4)",               category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:5,  code:"لا يوجد",      name:"سبلت 2 طن LG (5)",               category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:6,  code:"لا يوجد",      name:"سبلت 2 طن LG (6) — عاطل",       category:"أجهزة تكييف",  qty:1,  condition:"تالف",         location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:7,  code:"لا يوجد",      name:"سبلت 2 طن LG (7) — تالف مخزن",  category:"أجهزة تكييف",  qty:1,  condition:"تالف",         location:"المخزن",                     serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:8,  code:"لا يوجد",      name:"سبلت 2 طن LG (8) — عاطل مخزن",  category:"أجهزة تكييف",  qty:1,  condition:"تالف",         location:"المخزن",                     serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:9,  code:"1504688400",   name:"سبلت 2 طن LG (9)",               category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1504688400",  lastUpdate:"2025-01-01"},
  {id:10, code:"1504688401",   name:"سبلت 2 طن LG (10)",              category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1504688401",  lastUpdate:"2025-01-01"},
  {id:11, code:"لا يوجد",      name:"مكيف هواء كرافت 1.5 طن",        category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:12, code:"1504443042",   name:"سبلت 4 طن LG",                   category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1504443042",  lastUpdate:"2025-01-01"},
  // ── مراوح
  {id:13, code:"1523114957",   name:"مروحة عمودية (1)",               category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1523114957",  lastUpdate:"2025-01-01"},
  {id:14, code:"1523114958",   name:"مروحة عمودية (2)",               category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1523114958",  lastUpdate:"2025-01-01"},
  {id:15, code:"05K130042835", name:"مروحة عمودية (3)",               category:"أجهزة تكييف",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"05K130042835",lastUpdate:"2025-01-01"},
  // ── أثاث مكتبي — منضدات
  {id:16, code:"1402228079",   name:"منضدة كتابة 160 سم (1)",         category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402228079",  lastUpdate:"2025-01-01"},
  {id:17, code:"1402228080",   name:"منضدة كتابة 160 سم (2)",         category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402228080",  lastUpdate:"2025-01-01"},
  {id:18, code:"1402139368",   name:"منضدة كتابة — تم الشطب",        category:"أثاث مكتبي",   qty:1,  condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو", serialNo:"1402139368",  lastUpdate:"2025-01-01"},
  {id:19, code:"1402139370",   name:"منضدة كتابة — تالف",            category:"أثاث مكتبي",   qty:1,  condition:"تالف",         location:"السيطرة والنظم شعبة الفاو", serialNo:"1402139370",  lastUpdate:"2025-01-01"},
  {id:20, code:"1402139371",   name:"منضدة كتابة — تم الشطب",        category:"أثاث مكتبي",   qty:1,  condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو", serialNo:"1402139371",  lastUpdate:"2025-01-01"},
  {id:21, code:"1402139372",   name:"منضدة كتابة (1)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402139372",  lastUpdate:"2025-01-01"},
  {id:22, code:"1402139369",   name:"منضدة كتابة — تم الشطب",        category:"أثاث مكتبي",   qty:1,  condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو", serialNo:"1402139369",  lastUpdate:"2025-01-01"},
  {id:23, code:"1402123785",   name:"منضدة كتابة خشب — تالف",        category:"أثاث مكتبي",   qty:1,  condition:"تالف",         location:"السيطرة والنظم شعبة الفاو", serialNo:"1402123785",  lastUpdate:"2025-01-01"},
  {id:24, code:"1402123786",   name:"منضدة كتابة خشب (2)",            category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402123786",  lastUpdate:"2025-01-01"},
  {id:25, code:"1402225456",   name:"منضدة كتابة مع ملحق (1)",        category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402225456",  lastUpdate:"2025-01-01"},
  {id:26, code:"1402225457",   name:"منضدة كتابة مع ملحق (2)",        category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402225457",  lastUpdate:"2025-01-01"},
  {id:27, code:"1402134055",   name:"منضدة كتابة",                    category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402134055",  lastUpdate:"2025-01-01"},
  {id:28, code:"1402133738",   name:"منضدة كتابة خشب — تالف مخزن",  category:"أثاث مكتبي",   qty:1,  condition:"تالف",         location:"المخزن",                     serialNo:"1402133738",  lastUpdate:"2025-01-01"},
  {id:29, code:"1402113052",   name:"منضدة عمل",                      category:"أثاث مكتبي",   qty:2,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402113052",  lastUpdate:"2025-01-01"},
  // ── كراسي
  {id:30, code:"1402035187",   name:"كرسي مداولة (1)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402035187",  lastUpdate:"2025-01-01"},
  {id:31, code:"1402035188",   name:"كرسي مداولة (2)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402035188",  lastUpdate:"2025-01-01"},
  {id:32, code:"1402035189",   name:"كرسي مداولة (3)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402035189",  lastUpdate:"2025-01-01"},
  {id:33, code:"1402035190",   name:"كرسي مداولة (4)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402035190",  lastUpdate:"2025-01-01"},
  {id:34, code:"لا يوجد",      name:"كرسي مداولة (3 قطع)",            category:"أثاث مكتبي",   qty:3,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:35, code:"1402024339",   name:"كرسي دوار جلد (1)",              category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402024339",  lastUpdate:"2025-01-01"},
  {id:36, code:"1402024340",   name:"كرسي دوار جلد (2)",              category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402024340",  lastUpdate:"2025-01-01"},
  {id:37, code:"لا يوجد",      name:"كرسي دوار جلد",                  category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:38, code:"1401644198",   name:"كرسي بلاستك (13 قطعة) — تالف",  category:"أثاث مكتبي",   qty:13, condition:"تالف",         location:"السيطرة والنظم شعبة الفاو", serialNo:"1401644198",  lastUpdate:"2025-01-01"},
  {id:39, code:"1402033212",   name:"كرسي ذو مسند (6) — تالف",       category:"أثاث مكتبي",   qty:6,  condition:"تالف",         location:"السيطرة والنظم شعبة الفاو", serialNo:"1402033212",  lastUpdate:"2025-01-01"},
  {id:40, code:"1402033212",   name:"كرسي ذو مسند (6)",               category:"أثاث مكتبي",   qty:6,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402033212",  lastUpdate:"2025-01-01"},
  // ── مكتبات ودواليب
  {id:41, code:"1402214928",   name:"مكتبة خشب (1) — تالف",          category:"أثاث مكتبي",   qty:1,  condition:"تالف",         location:"السيطرة والنظم شعبة الفاو", serialNo:"1402214928",  lastUpdate:"2025-01-01"},
  {id:42, code:"1402214929",   name:"مكتبة خشب (2) — تالف",          category:"أثاث مكتبي",   qty:1,  condition:"تالف",         location:"السيطرة والنظم شعبة الفاو", serialNo:"1402214929",  lastUpdate:"2025-01-01"},
  {id:43, code:"1402208897",   name:"مكتبة بابين (1)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402208897",  lastUpdate:"2025-01-01"},
  {id:44, code:"1402208898",   name:"مكتبة بابين (2)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402208898",  lastUpdate:"2025-01-01"},
  {id:45, code:"14022149284929",name:"مكتبة بابين (2 قطعة)",          category:"أثاث مكتبي",   qty:2,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"14022149284929",lastUpdate:"2025-01-01"},
  {id:46, code:"1402203092",   name:"مكتبة بابين (4)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402203092",  lastUpdate:"2025-01-01"},
  {id:47, code:"1402208899",   name:"مكتبة بابين (5)",                category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402208899",  lastUpdate:"2025-01-01"},
  {id:48, code:"1402284803",   name:"دولاب حديد (1)",                  category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402284803",  lastUpdate:"2025-01-01"},
  {id:49, code:"1402198907",   name:"دولاب حديد (2)",                  category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402198907",  lastUpdate:"2025-01-01"},
  {id:50, code:"1402198908",   name:"دولاب حديد (3)",                  category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402198908",  lastUpdate:"2025-01-01"},
  {id:51, code:"1402198909",   name:"دولاب حديد (4)",                  category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402198909",  lastUpdate:"2025-01-01"},
  {id:52, code:"1402194054",   name:"دولاب حديد (5)",                  category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402194054",  lastUpdate:"2025-01-01"},
  {id:53, code:"1402193333",   name:"دولاب حديد (6)",                  category:"أثاث مكتبي",   qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1402193333",  lastUpdate:"2025-01-01"},
  // ── أجهزة كهربائية منزلية
  {id:54, code:"1515674402",   name:"ثلاجة عمودية فستل 16 قدم",       category:"أجهزة كهربائية",qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1515674402",  lastUpdate:"2025-01-01"},
  {id:55, code:"1513674126",   name:"ثلاجة فستل 9 قدم",               category:"أجهزة كهربائية",qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1513674126",  lastUpdate:"2025-01-01"},
  {id:56, code:"1522042001",   name:"براد ماء — عاطل مخزن",           category:"أجهزة كهربائية",qty:1,  condition:"تالف",         location:"المخزن",                     serialNo:"1522042001",  lastUpdate:"2025-01-01"},
  {id:57, code:"لا يوجد",      name:"مدفأة زيتية (2 قطعة)",           category:"أجهزة كهربائية",qty:2,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:58, code:"1403014212",   name:"طباخ كهربائي — تالف مخزن",      category:"أجهزة كهربائية",qty:1,  condition:"تالف",         location:"المخزن",                     serialNo:"1403014212",  lastUpdate:"2025-01-01"},
  {id:59, code:"1403024031",   name:"فرن كهربائي — تالف مخزن",       category:"أجهزة كهربائية",qty:1,  condition:"تالف",         location:"المخزن",                     serialNo:"1403024031",  lastUpdate:"2025-01-01"},
  {id:60, code:"1403114492",   name:"مكنسة كهربائية",                 category:"أجهزة كهربائية",qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1403114492",  lastUpdate:"2025-01-01"},
  // ── معدات مكتبية
  {id:61, code:"1901114388",   name:"طابعة كانون",                    category:"معدات مكتبية",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1901114388",  lastUpdate:"2025-01-01"},
  {id:62, code:"—",            name:"حاسبة HP",                       category:"معدات مكتبية",  qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"—",           lastUpdate:"2025-01-01"},
  // ── متنوعات
  {id:63, code:"لا يوجد",      name:"سرير منام (2 قطعة)",             category:"أثاث متنوع",    qty:2,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
  {id:64, code:"1401263016",   name:"شماعة ملابس (4 قطع)",            category:"أثاث متنوع",    qty:4,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"1401263016",  lastUpdate:"2025-01-01"},
  {id:65, code:"لا يوجد",      name:"سخان ماء",                       category:"أجهزة كهربائية",qty:1,  condition:"جيد",          location:"السيطرة والنظم شعبة الفاو", serialNo:"لا يوجد",     lastUpdate:"2025-01-01"},
];


function FurnitureInventory({ emp, transferLog, setTransferLog }) {
  const [items, setItems] = useLocalStorage("boc_furniture", INIT_FURN);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("الكل");
  const [filterCond, setFilterCond] = useState("الكل");
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState({});
  const [adding, setAdding]         = useState(false);
  const [transferModal, setTModal]  = useState(null);
  const [xferForm, setXferForm]     = useState({qty:"1",site:"",note:""});
  const [toast, setToast]           = useState("");

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(""),3000); };

  const fcats = ["الكل",...FURN_CATS];
  const filtered = items.filter(it=>{
    const ms = it.name.includes(search)||it.code.includes(search)||it.serialNo?.includes(search)||it.location.includes(search);
    const mc = filterCat==="الكل"||it.category===filterCat;
    const mco = filterCond==="الكل"||it.condition===filterCond;
    return ms&&mc&&mco;
  });

  const openEdit = (it) => { setEditId(it.id); setForm({...it}); setAdding(false); };
  const openAdd  = ()   => { setAdding(true); setEditId(null); setForm({id:Date.now(),code:"",name:"",category:"أثاث مكتبي",qty:1,condition:"جيد",location:"",serialNo:"",lastUpdate:new Date().toISOString().slice(0,10)}); };
  const cancelForm = () => { setEditId(null); setAdding(false); };

  const saveItem = () => {
    if (!form.code||!form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems(p=>[...p,{...form,id:Date.now()}]);
    else setItems(p=>p.map(it=>it.id===editId?{...form,id:editId,lastUpdate:new Date().toISOString().slice(0,10)}:it));
    showToast("✓ تم الحفظ"); cancelForm();
  };

  const doTransfer = () => {
    if (!xferForm.site||!xferForm.qty) return showToast("يرجى تحديد الموقع والكمية");
    const q = parseInt(xferForm.qty);
    if (q > transferModal.qty) return showToast("الكمية تتجاوز المتاح");
    setItems(p=>p.map(it=>it.id===transferModal.id?{...it,qty:it.qty-q,lastUpdate:new Date().toISOString().slice(0,10)}:it));
    const log = {
      id:Date.now(), type:"أثاث",
      itemCode:transferModal.code, itemName:transferModal.name,
      qty:q, unit:"قطعة",
      fromSite:"موقع الفاو الرئيسي", toSite:xferForm.site,
      note:xferForm.note, user:emp.name,
      timestamp:new Date().toISOString(),
    };
    setTransferLog(p=>[log,...p]);
    setTModal(null);
    showToast(`✓ تم توثيق النقل إلى ${xferForm.site}`);
  };

  const inpC = "w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const selC = inpC+" appearance-none cursor-pointer";

  const damagedCount  = items.filter(i=>i.condition==="تالف").length;
  const needsMaint    = items.filter(i=>i.condition==="يحتاج صيانة").length;
  const totalItems    = items.reduce((s,i)=>s+i.qty,0);

  return (
    <div className="space-y-4 fu">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center no-print">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[160px] shadow-sm">
          <Search size={13} className="text-slate-400 shrink-0"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم أو الرقم التسلسلي..." className="bg-transparent text-xs outline-none text-slate-700 w-full placeholder:text-slate-400"/>
        </div>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-sm appearance-none">
          {fcats.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={filterCond} onChange={e=>setFilterCond(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer shadow-sm appearance-none">
          {["الكل",...ITEM_CONDITIONS].map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl shadow-sm">
          <Plus size={13}/> إضافة
        </button>
        <PrintButton targetId="print-furniture" title="جرد الأثاث — شعبة الفاو"/>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {[
          {l:"إجمالي القطع",    v:totalItems,    c:"text-slate-800",   bg:"bg-white"},
          {l:"أصناف مسجلة",     v:items.length,  c:"text-blue-700",    bg:"bg-blue-50"},
          {l:"حالة جيدة",       v:items.filter(i=>i.condition==="جيد").length, c:"text-emerald-700", bg:"bg-emerald-50"},
          {l:"يحتاج صيانة",     v:needsMaint,    c:"text-amber-700",   bg:"bg-amber-50"},
          {l:"تالف",            v:damagedCount,  c:"text-red-700",     bg:"bg-red-50"},
        ].map(s=>(
          <div key={s.l} className={`${s.bg} border border-slate-200 rounded-xl p-3 text-center shadow-sm`}>
            <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
            <p className="text-[10px] text-slate-500">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {(adding||editId) && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 shadow-sm no-print">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800 text-sm">{adding?"إضافة قطعة أثاث / معدة جديدة":"تعديل البيانات"}</h4>
            <button onClick={cancelForm} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={14}/></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[["الرمز *","code"],["الاسم *","name"],["الرقم التسلسلي","serialNo"],["الموقع","location"]].map(([l,k])=>(
              <div key={k}>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{l}</label>
                <input value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className={inpC}/>
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الفئة</label>
              <select value={form.category||"أثاث مكتبي"} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className={selC}>
                {FURN_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الكمية</label>
              <input type="number" min="0" value={form.qty||0} onChange={e=>setForm(p=>({...p,qty:parseInt(e.target.value)||0}))} className={inpC}/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">الحالة</label>
              <select value={form.condition||"جيد"} onChange={e=>setForm(p=>({...p,condition:e.target.value}))} className={selC}>
                {ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={cancelForm} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
            <button onClick={saveItem} className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
              <Save size={12}/> حفظ
            </button>
          </div>
        </div>
      )}

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <p className="text-lg font-bold text-center">شركة نفط البصرة — شعبة الفاو</p>
        <p className="text-sm text-center">تقرير جرد الأثاث والمعدات — {new Date().toLocaleDateString("ar-IQ",{year:"numeric",month:"long",day:"numeric"})}</p>
      </div>

      {/* Table */}
      <div id="print-furniture" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 no-print">
          <h3 className="font-bold text-slate-700 text-sm">جرد الأثاث والمعدات المكتبية — {filtered.length} صنف</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["الرمز","الرقم التسلسلي","الاسم","الفئة","الكمية","الحالة","الموقع","آخر تحديث","إجراءات"].map(h=>(
                  <th key={h} className="px-3 py-2.5 text-[10px] font-bold text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((it,i)=>{
                const isDamaged = it.condition==="تالف";
                return (
                  <tr key={it.id}
                    className={`border-b border-slate-50 transition-colors ${isDamaged?"bg-red-50/50 border-red-100":"hover:bg-slate-50/60"} ${i===filtered.length-1?"border-b-0":""}`}>
                    <td className={`px-3 py-3 font-mono font-bold ${isDamaged?"text-red-600":"text-slate-600"}`}>{isDamaged&&"⚠ "}{it.code}</td>
                    <td className="px-3 py-3 font-mono text-[10px] text-slate-500">{it.serialNo||"—"}</td>
                    <td className={`px-3 py-3 font-semibold ${isDamaged?"text-red-800":"text-slate-800"}`}>{it.name}</td>
                    <td className="px-3 py-3 text-slate-500">{it.category}</td>
                    <td className={`px-3 py-3 font-bold text-sm ${isDamaged?"text-red-600":"text-slate-800"}`}>{it.qty}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${COND_STYLE[it.condition]||""}`}>
                        {isDamaged&&"🔴 "}{it.condition}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{it.location}</td>
                    <td className="px-3 py-3 text-slate-400 font-mono text-[10px]">{it.lastUpdate}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 no-print">
                        <button onClick={()=>openEdit(it)} className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={12}/></button>
                        <button onClick={()=>{setTModal(it);setXferForm({qty:"1",site:"",note:""});}} className="p-1 text-amber-500 hover:bg-amber-50 rounded-lg" title="نقل"><ArrowRightLeft size={12}/></button>
                        <button onClick={()=>{ if(window.confirm("حذف هذه القطعة؟")) setItems(p=>p.filter(x=>x.id!==it.id)); }} className="p-1 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer log for furniture */}
      {transferLog.filter(t=>t.type==="أثاث").length>0 && (
        <div id="print-furn-transfers" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-amber-600"/> سجل حركات النقل — الأثاث
            </h3>
            <PrintButton targetId="print-furn-transfers" title="سجل حركات الأثاث"/>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  {["التاريخ والوقت","الرمز","القطعة","الكمية","من","إلى","ملاحظة","المستخدم"].map(h=>(
                    <th key={h} className="px-3 py-2 text-[10px] font-bold text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transferLog.filter(t=>t.type==="أثاث").map((t,i)=>(
                  <tr key={t.id} className={`border-b border-slate-50 ${i%2===0?"":"bg-slate-50/30"}`}>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleDateString("ar-IQ")} {new Date(t.timestamp).toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">{t.itemCode}</td>
                    <td className="px-3 py-2.5 text-slate-700 font-semibold">{t.itemName}</td>
                    <td className="px-3 py-2.5 font-bold text-blue-700">{t.qty} {t.unit}</td>
                    <td className="px-3 py-2.5 text-slate-500">{t.fromSite}</td>
                    <td className="px-3 py-2.5 text-emerald-700 font-semibold">{t.toSite}</td>
                    <td className="px-3 py-2.5 text-slate-400">{t.note||"—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-semibold">{t.user.split(" ").slice(0,2).join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setTModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><ArrowRightLeft size={15} className="text-amber-500"/> نقل قطعة إلى موقع آخر</h3>
              <button onClick={()=>setTModal(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={15}/></button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs">
              <p className="font-bold text-slate-700">{transferModal.code} — {transferModal.name}</p>
              <p className="text-slate-500 mt-0.5">الرقم التسلسلي: <span className="font-mono">{transferModal.serialNo||"—"}</span></p>
              <p className="text-slate-500 mt-0.5">الكمية المتاحة: <strong className="text-blue-700">{transferModal.qty}</strong></p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">الموقع المستلم *</label>
                <select value={xferForm.site} onChange={e=>setXferForm(p=>({...p,site:e.target.value}))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white appearance-none">
                  <option value="">-- اختر الموقع --</option>
                  {SITES.filter(s=>s!=="موقع الفاو الرئيسي").map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">الكمية *</label>
                <input type="number" min="1" max={transferModal.qty} value={xferForm.qty} onChange={e=>setXferForm(p=>({...p,qty:e.target.value}))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">ملاحظة</label>
                <input value={xferForm.note} onChange={e=>setXferForm(p=>({...p,note:e.target.value}))} placeholder="سبب النقل..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
                📋 سيُسجَّل بالوقت والتاريخ باسم: <strong>{emp.name.split(" ").slice(0,2).join(" ")}</strong>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setTModal(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
              <button onClick={doTransfer} className="flex-1 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 active:scale-95 transition-all">تأكيد النقل</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl no-print">
          <CheckCircle size={14} className="text-emerald-400"/>{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROJECTS PAGE — مشاريع مستودع الفاو
═══════════════════════════════════════════════════════════ */
const DOC_TYPES = ["مخططات","فحوصات","عقود","تقارير","أوامر تغيير","شهادات","مراسلات","أخرى"];
const PROJ_STATUS = ["نشط","منجز","معلق","ملغي"];
const PROJ_STATUS_STYLE = {
  "نشط":   "bg-emerald-100 text-emerald-800 border-emerald-200",
  "منجز":  "bg-blue-100 text-blue-800 border-blue-200",
  "معلق":  "bg-amber-100 text-amber-800 border-amber-200",
  "ملغي":  "bg-red-100 text-red-800 border-red-200",
};

const INIT_PROJECTS = [
  { id:1, code:"FAO-2024-001", name:"صيانة أنابيب المرحلة الأولى", status:"نشط",   startDate:"2024-01-15", contractor:"شركة النفط الوطنية", value:"250,000,000", docs:[] },
  { id:2, code:"FAO-2024-002", name:"تركيب منظومة سيطرة DCS",      status:"نشط",   startDate:"2024-03-01", contractor:"Honeywell Iraq",      value:"180,000,000", docs:[] },
  { id:3, code:"FAO-2023-005", name:"إنشاء مستودع إضافي",           status:"منجز",  startDate:"2023-06-01", contractor:"شركة البناء الحديث",  value:"95,000,000",  docs:[] },
];

function ProjectsPage({ emp }) {
  const [projects, setProjects] = useLocalStorage("boc_projects", INIT_PROJECTS);
  const [selectedProj, setSelectedProj] = useState(null);
  const [showAddProj, setShowAddProj] = useState(false);
  const [projForm, setProjForm]       = useState({ code:"", name:"", status:"نشط", startDate:"", contractor:"", value:"" });
  const [docTypeFilter, setDocFilter] = useState("الكل");
  const [docSearch, setDocSearch]     = useState("");
  const [toast, setToast]             = useState("");
  const [uploadErr, setUploadErr]     = useState("");
  const fileRef                       = useRef();
  const [selectedDocType, setSelDocType] = useState("مخططات");

  const showToast = (m,isErr=false) => {
    setToast({msg:m,err:isErr});
    setTimeout(()=>setToast(""),3500);
  };

  // current project docs filtered
  const proj = selectedProj ? projects.find(p=>p.id===selectedProj) : null;
  const filteredDocs = proj ? proj.docs.filter(d=>{
    const mt = docTypeFilter==="الكل"||d.type===docTypeFilter;
    const ms = d.name.toLowerCase().includes(docSearch.toLowerCase());
    return mt&&ms;
  }) : [];

  const handleFileUpload = (e) => {
    setUploadErr("");
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const errors=[], newDocs=[];
    files.forEach(file=>{
      // prevent duplicate by name+size
      const duplicate = proj.docs.find(d=>d.name===file.name && d.size===file.size);
      if (duplicate) { errors.push(`"${file.name}" موجود مسبقاً`); return; }
      const ext = file.name.split(".").pop().toLowerCase();
      const docEntry = {
        id: Date.now()+Math.random(),
        name: file.name,
        type: selectedDocType,
        size: file.size,
        sizeLabel: file.size>1048576 ? `${(file.size/1048576).toFixed(1)} MB` : `${(file.size/1024).toFixed(0)} KB`,
        ext,
        uploadedBy: emp.name.split(" ").slice(0,2).join(" "),
        uploadedAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
      };
      newDocs.push(docEntry);
    });
    if (errors.length) { setUploadErr(errors.join(" | ")); }
    if (newDocs.length) {
      setProjects(p=>p.map(pr=>pr.id===selectedProj
        ? {...pr, docs:[...pr.docs,...newDocs]}
        : pr
      ));
      showToast(`✓ تم رفع ${newDocs.length} وثيقة`);
    }
    e.target.value="";
  };

  const deleteDoc = (docId) => {
    setProjects(p=>p.map(pr=>pr.id===selectedProj
      ? {...pr, docs:pr.docs.filter(d=>d.id!==docId)}
      : pr
    ));
    showToast("✓ تم حذف الوثيقة");
  };

  const saveProject = () => {
    if (!projForm.code||!projForm.name) return showToast("رمز المشروع والاسم مطلوبان",true);
    if (projects.find(p=>p.code===projForm.code)) return showToast("رمز المشروع موجود مسبقاً",true);
    setProjects(p=>[...p,{...projForm,id:Date.now(),docs:[]}]);
    setShowAddProj(false);
    setProjForm({code:"",name:"",status:"نشط",startDate:"",contractor:"",value:""});
    showToast("✓ تم إضافة المشروع");
  };

  const EXT_ICON = {
    pdf:"📄",png:"🖼",jpg:"🖼",jpeg:"🖼",dwg:"📐",doc:"📝",docx:"📝",
    xls:"📊",xlsx:"📊",ppt:"📋",pptx:"📋",zip:"📦",default:"📎"
  };
  const getIcon = (ext) => EXT_ICON[ext]||EXT_ICON.default;

  const docTypeCounts = proj ? DOC_TYPES.reduce((acc,t)=>({...acc,[t]:proj.docs.filter(d=>d.type===t).length}),{}) : {};

  const inpC="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const selC=inpC+" appearance-none cursor-pointer";

  return (
    <div className="space-y-4 fu">

      {/* ── Project list view ── */}
      {!selectedProj && (
        <>
          <div className="flex flex-wrap gap-2 items-center no-print">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 flex-1">
              <FolderOpen size={16} className="text-blue-600"/> مشاريع موقع مستودع الفاو
            </h2>
            <button onClick={()=>setShowAddProj(p=>!p)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl shadow-sm">
              <Plus size={13}/> مشروع جديد
            </button>
            <PrintButton targetId="print-projects" title="مشاريع شعبة الفاو"/>
          </div>

          {/* Add project form */}
          {showAddProj && (
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-sm no-print">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Plus size={13} className="text-blue-600"/> إضافة مشروع جديد</h4>
                <button onClick={()=>setShowAddProj(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={14}/></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-400 mb-1">رمز المشروع *</label>
                  <input value={projForm.code} onChange={e=>setProjForm(p=>({...p,code:e.target.value}))} className={inpC} placeholder="FAO-2026-XXX"/></div>
                <div><label className="block text-[10px] font-bold text-slate-400 mb-1">اسم المشروع *</label>
                  <input value={projForm.name} onChange={e=>setProjForm(p=>({...p,name:e.target.value}))} className={inpC} placeholder="اسم المشروع"/></div>
                <div><label className="block text-[10px] font-bold text-slate-400 mb-1">الحالة</label>
                  <select value={projForm.status} onChange={e=>setProjForm(p=>({...p,status:e.target.value}))} className={selC}>
                    {PROJ_STATUS.map(s=><option key={s}>{s}</option>)}
                  </select></div>
                <div><label className="block text-[10px] font-bold text-slate-400 mb-1">تاريخ البدء</label>
                  <input type="date" value={projForm.startDate} onChange={e=>setProjForm(p=>({...p,startDate:e.target.value}))} className={inpC}/></div>
                <div><label className="block text-[10px] font-bold text-slate-400 mb-1">المقاول / الجهة</label>
                  <input value={projForm.contractor} onChange={e=>setProjForm(p=>({...p,contractor:e.target.value}))} className={inpC} placeholder="اسم الشركة"/></div>
                <div><label className="block text-[10px] font-bold text-slate-400 mb-1">قيمة العقد (دينار)</label>
                  <input value={projForm.value} onChange={e=>setProjForm(p=>({...p,value:e.target.value}))} className={inpC} placeholder="مثال: 250,000,000"/></div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={()=>setShowAddProj(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
                <button onClick={saveProject} className="flex items-center gap-1 px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
                  <Save size={12}/> حفظ المشروع
                </button>
              </div>
            </div>
          )}

          {/* Print header */}
          <div className="hidden print:block text-center mb-4">
            <p className="text-lg font-bold">شركة نفط البصرة — شعبة الفاو</p>
            <p className="text-sm">قائمة المشاريع — {new Date().toLocaleDateString("ar-IQ",{year:"numeric",month:"long",day:"numeric"})}</p>
          </div>

          {/* Projects grid */}
          <div id="print-projects" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(pr=>(
              <div key={pr.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] text-slate-400">{pr.code}</p>
                      <p className="font-bold text-slate-900 text-sm leading-snug mt-0.5">{pr.name}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${PROJ_STATUS_STYLE[pr.status]||""}`}>
                      {pr.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex gap-1"><span className="text-slate-400">المقاول:</span><span className="font-medium text-slate-700 truncate">{pr.contractor||"—"}</span></div>
                    <div className="flex gap-1"><span className="text-slate-400">البدء:</span><span>{pr.startDate ? new Date(pr.startDate).toLocaleDateString("ar-IQ") : "—"}</span></div>
                    <div className="flex gap-1"><span className="text-slate-400">القيمة:</span><span className="font-semibold text-slate-700">{pr.value ? pr.value+" د.ع" : "—"}</span></div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex gap-2 flex-wrap">
                      {DOC_TYPES.slice(0,4).map(t=>{
                        const cnt = pr.docs.filter(d=>d.type===t).length;
                        return cnt>0 ? (
                          <span key={t} className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100">
                            {t} ({cnt})
                          </span>
                        ) : null;
                      })}
                      {pr.docs.length===0 && <span className="text-[10px] text-slate-400">لا توجد وثائق</span>}
                    </div>
                    <button onClick={()=>setSelectedProj(pr.id)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-xl transition-colors no-print">
                      فتح <ChevronRight size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Document manager for selected project ── */}
      {selectedProj && proj && (
        <div className="space-y-4">
          {/* Back + header */}
          <div className="flex items-center gap-3 no-print">
            <button onClick={()=>{setSelectedProj(null);setDocFilter("الكل");setDocSearch("");}}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronLeft size={18}/>
            </button>
            <div className="flex-1">
              <p className="font-mono text-[10px] text-slate-400">{proj.code}</p>
              <h3 className="font-bold text-slate-900 text-base">{proj.name}</h3>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${PROJ_STATUS_STYLE[proj.status]||""}`}>{proj.status}</span>
            <PrintButton targetId="print-proj-docs" title={`وثائق ${proj?.name||''}`}/>
          </div>

          {/* Print header */}
          <div className="hidden print:block text-center mb-4">
            <p className="text-lg font-bold">شركة نفط البصرة — شعبة الفاو</p>
            <p className="text-base font-semibold">{proj.name} ({proj.code})</p>
            <p className="text-sm">قائمة الوثائق — {new Date().toLocaleDateString("ar-IQ",{year:"numeric",month:"long",day:"numeric"})}</p>
          </div>

          {/* Doc type tabs + counts */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar no-print">
            {["الكل",...DOC_TYPES].map(t=>{
              const cnt = t==="الكل" ? proj.docs.length : (docTypeCounts[t]||0);
              return (
                <button key={t} onClick={()=>setDocFilter(t)}
                  className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    docTypeFilter===t
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}>
                  {t} {cnt>0&&<span className={`text-[9px] px-1.5 rounded-full font-bold ${docTypeFilter===t?"bg-white/20 text-white":"bg-slate-100 text-slate-500"}`}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          {/* Upload zone */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-5 no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Upload size={14} className="text-blue-500"/> رفع وثائق جديدة</p>
                <p className="text-[11px] text-slate-400 mt-0.5">PDF, DWG, Word, Excel, صور — يُمنع التكرار تلقائياً</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={selectedDocType} onChange={e=>setSelDocType(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer bg-white appearance-none">
                  {DOC_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
                <button onClick={()=>fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm">
                  <Upload size={13}/> اختيار ملفات
                </button>
              </div>
            </div>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileUpload}
              accept=".pdf,.dwg,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"/>
            {uploadErr && (
              <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5"/>
                <p className="text-[11px] text-red-700 font-semibold">{uploadErr}</p>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm no-print">
            <Search size={13} className="text-slate-400 shrink-0"/>
            <input value={docSearch} onChange={e=>setDocSearch(e.target.value)} placeholder="بحث في الوثائق..."
              className="bg-transparent text-xs outline-none text-slate-700 w-full placeholder:text-slate-400"/>
          </div>

          {/* Documents list */}
          <div id="print-proj-docs">
          {filteredDocs.length===0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <FolderOpen size={28} className="text-slate-300 mx-auto mb-2"/>
              <p className="text-sm text-slate-400">لا توجد وثائق {docTypeFilter!=="الكل"?"من نوع "+docTypeFilter:""}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-slate-600">{filteredDocs.length} وثيقة</p>
              </div>
              <div className="divide-y divide-slate-50">
                {filteredDocs.map(doc=>(
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                    <span className="text-2xl shrink-0">{getIcon(doc.ext)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-100">{doc.type}</span>
                        <span className="text-[9px] text-slate-400">{doc.sizeLabel}</span>
                        <span className="text-[9px] text-slate-400">{doc.uploadedBy}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(doc.uploadedAt).toLocaleDateString("ar-IQ")} {new Date(doc.uploadedAt).toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 no-print">
                      <a href={doc.url} download={doc.name}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="تحميل">
                        <Download size={14}/>
                      </a>
                      <button onClick={()=>deleteDoc(doc.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                    {/* print row */}
                    <div className="hidden print:flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-mono">{doc.ext.toUpperCase()}</span>
                      <span>{doc.sizeLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl no-print ${toast.err?"bg-red-600":"bg-slate-900"}`}>
          {toast.err ? <AlertCircle size={14} className="text-red-200"/> : <CheckCircle size={14} className="text-emerald-400"/>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EVALUATION CONSTANTS
═══════════════════════════════════════════════════════════ */
const EVAL_CRITERIA = [
  { key:"attendance",    label:"الحضور والانضباط",         icon:"📅", defaultWeight:20, desc:"الحضور التام يعطي الدرجة الكاملة — تُخصم الإجازات" },
  { key:"tasks",         label:"إنجاز المهام",              icon:"✅", defaultWeight:40, desc:"مجموع درجات المهام المنجزة خلال الشهر" },
  { key:"participation", label:"المشاركة والدورات",         icon:"🎓", defaultWeight:20, desc:"المشاركة في الأعمال الجماعية والدورات التدريبية" },
  { key:"initiative",    label:"المبادرة الذاتية",           icon:"💡", defaultWeight:20, desc:"التنظيف، الصيانة، التجهيز، الإضافات للشعبة" },
];

const TASK_STATUS_STYLE = {
  "قيد التنفيذ":       "bg-amber-100 text-amber-800 border-amber-200",
  "مُرسلة للمراجعة":  "bg-blue-100 text-blue-800 border-blue-200",
  "مقبولة":            "bg-emerald-100 text-emerald-800 border-emerald-200",
  "مرفوضة":            "bg-red-100 text-red-800 border-red-200",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg","image/png","image/jpg"];

function getMonthDueDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 15).toISOString().slice(0,10);
}

/* ── CSV utilities ── */
const csv = {
  parse(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h=>h.trim().replace(/^"|"$/g,""));
    return lines.slice(1).map(line=>{
      const vals = line.split(",").map(v=>v.trim().replace(/^"|"$/g,""));
      return Object.fromEntries(headers.map((h,i)=>[h,vals[i]||""]));
    });
  },
  stringify(rows, headers) {
    const h = headers || Object.keys(rows[0]||{});
    const lines = [h.join(","), ...rows.map(r=>h.map(k=>`"${(r[k]||"").toString().replace(/"/g,'""')}"`).join(","))];
    return lines.join("\n");
  },
  download(content, filename) {
    const BOM = "\uFEFF"; // UTF-8 BOM for Arabic in Excel
    const blob = new Blob([BOM+content],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=filename; a.click();
    URL.revokeObjectURL(url);
  },
};

/* ── File upload to Firebase Storage via REST ── */
const STORAGE_URL = "https://firebasestorage.googleapis.com/v0/b/faop-scada.appspot.com/o";
async function uploadFileToStorage(file, path) {
  try {
    const encoded = encodeURIComponent(path);
    const r = await fetch(`${STORAGE_URL}?uploadType=media&name=${encoded}`, {
      method:"POST",
      headers:{"Content-Type": file.type},
      body: file,
    });
    if (!r.ok) throw new Error("Upload failed");
    const data = await r.json();
    return `https://firebasestorage.googleapis.com/v0/b/faop-scada.appspot.com/o/${encoded}?alt=media&token=${data.downloadTokens}`;
  } catch {
    // Fallback: convert to base64 and store in Firebase DB (for files <1MB)
    if (file.size > 1024*1024) throw new Error("الملف كبير جداً للتخزين الاحتياطي");
    return new Promise((res,rej)=>{
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   MAINTENANCE EQUIPMENT DATA
═══════════════════════════════════════════════════════════ */
const PUMP_EQUIPMENT = [
  "مضخة الخام #1","مضخة الخام #2","مضخة الخام #3",
  "مضخة نقل #1","مضخة نقل #2",
  "مضخة المياه #1","مضخة المياه #2",
];
const TANK_EQUIPMENT = [
  "خزان #1 (10,000 م³)","خزان #2 (10,000 م³)",
  "خزان #3 (5,000 م³)","خزان المياه الرئيسي",
  "خزان الوقود الاحتياطي",
];
const MAINT_TYPES = [
  "فحص دوري","تشحيم","تغيير زيت","إحكام وصلات",
  "فحص ضغط","تنظيف فلتر","اختبار تشغيل","إصلاح طارئ","استبدال قطعة",
];
const MAINT_STATUS = ["سليم","يحتاج متابعة","يحتاج إصلاح","متوقف عن العمل"];
const MAINT_STATUS_STYLE = {
  "سليم":              "bg-emerald-100 text-emerald-800",
  "يحتاج متابعة":     "bg-amber-100 text-amber-800",
  "يحتاج إصلاح":      "bg-orange-100 text-orange-800",
  "متوقف عن العمل":   "bg-red-100 text-red-800 font-bold",
};

const EMPTY_MAINT_ENTRY = { equipment:"", type:"فحص دوري", status:"سليم", notes:"", hours:"", technician:"" };

/* ── Daily Maintenance Form (admin fills) ── */
function DailyMaintenanceForm({ todayKey, dailyLogs, setDailyLogs, emp, showToast }) {
  const existing = dailyLogs[todayKey];
  const [entries, setEntries] = useState(existing?.entries || [{ ...EMPTY_MAINT_ENTRY }]);
  const [generalNote, setGeneralNote] = useState(existing?.generalNote || "");
  const [saved, setSaved] = useState(!!existing);

  const addEntry = () => setEntries(p => [...p, { ...EMPTY_MAINT_ENTRY }]);
  const removeEntry = (i) => setEntries(p => p.filter((_, xi) => xi !== i));
  const setEntry = (i, k, v) => setEntries(p => p.map((e, xi) => xi === i ? { ...e, [k]: v } : e));

  const save = () => {
    if (entries.every(e => !e.equipment)) return showToast("أضف معدة واحدة على الأقل");
    const log = {
      entries: entries.filter(e => e.equipment),
      generalNote,
      recordedBy: emp.name,
      recordedAt: new Date().toISOString(),
      date: todayKey,
    };
    setDailyLogs(prev => ({ ...prev, [todayKey]: log }));
    setSaved(true);
    showToast("✓ تم حفظ تقرير الصيانة اليومي");
  };

  const inpS = "w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white appearance-none";

  return (
    <div className="space-y-4">
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-800">
          <CheckCircle size={13} className="text-emerald-600"/> تقرير اليوم محفوظ
          <button onClick={() => setSaved(false)} className="mr-auto text-blue-600 font-bold hover:underline">تعديل</button>
        </div>
      )}

      {/* Entries table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              {["المعدة / الجهاز","نوع الصيانة","الحالة","ساعات التشغيل","الفني المنفذ","ملاحظات",""].map(h=>(
                <th key={h} className="px-2 py-2.5 text-right font-bold text-[10px] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i} className={`border-b border-slate-100 ${i%2===0?"bg-white":"bg-slate-50/40"}`}>
                <td className="p-1.5 min-w-[160px]">
                  <select value={entry.equipment} onChange={e=>setEntry(i,"equipment",e.target.value)} className={inpS}>
                    <option value="">-- اختر معدة --</option>
                    <optgroup label="مضخات">
                      {PUMP_EQUIPMENT.map(eq=><option key={eq}>{eq}</option>)}
                    </optgroup>
                    <optgroup label="خزانات">
                      {TANK_EQUIPMENT.map(eq=><option key={eq}>{eq}</option>)}
                    </optgroup>
                  </select>
                </td>
                <td className="p-1.5 min-w-[130px]">
                  <select value={entry.type} onChange={e=>setEntry(i,"type",e.target.value)} className={inpS}>
                    {MAINT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </td>
                <td className="p-1.5 min-w-[140px]">
                  <select value={entry.status} onChange={e=>setEntry(i,"status",e.target.value)} className={inpS}>
                    {MAINT_STATUS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-1.5 min-w-[80px]">
                  <input type="number" min="0" value={entry.hours} onChange={e=>setEntry(i,"hours",e.target.value)}
                    placeholder="ساعة" className={inpS+" text-center"}/>
                </td>
                <td className="p-1.5 min-w-[120px]">
                  <input value={entry.technician} onChange={e=>setEntry(i,"technician",e.target.value)}
                    placeholder="اسم الفني" className={inpS}/>
                </td>
                <td className="p-1.5 min-w-[160px]">
                  <input value={entry.notes} onChange={e=>setEntry(i,"notes",e.target.value)}
                    placeholder="ملاحظات..." className={inpS}/>
                </td>
                <td className="p-1.5 text-center">
                  {entries.length>1 && (
                    <button onClick={()=>removeEntry(i)} className="text-red-400 hover:text-red-600 p-0.5"><X size={13}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addEntry} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
        <Plus size={12}/> إضافة معدة
      </button>

      {/* General note */}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 mb-1">ملاحظات عامة على الموقع</label>
        <textarea value={generalNote} onChange={e=>setGeneralNote(e.target.value)} rows={2}
          placeholder="أي ملاحظات عامة على الموقع أو المنظومة..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"/>
      </div>

      <button onClick={save}
        className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm">
        <Save size={14}/> حفظ تقرير الصيانة
      </button>
    </div>
  );
}

/* ── Read-only daily log card ── */
function DailyLogCard({ day, log }) {
  if (!log) return null;
  const entries = Array.isArray(log.entries) ? log.entries : [];
  const hasAlert = entries.some(e => e.status === "متوقف عن العمل" || e.status === "يحتاج إصلاح");

  return (
    <div className={`px-4 py-4 ${hasAlert ? "bg-red-50/30" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${hasAlert ? "bg-red-500" : "bg-emerald-400"}`}/>
        <p className="text-[11px] font-bold text-slate-600">
          {new Date(day).toLocaleDateString("ar-IQ",{weekday:"long",day:"numeric",month:"long"})}
        </p>
        {hasAlert && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⚠️ تنبيه</span>}
        <span className="text-[10px] text-slate-400 mr-auto">{log.recordedBy?.split(" ").slice(0,2).join(" ")}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-100">
              {["المعدة","نوع الصيانة","الحالة","ساعات التشغيل","الفني","ملاحظات"].map(h=>(
                <th key={h} className="px-2 py-1.5 text-right font-bold text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className={`border-b border-slate-100 ${e.status==="متوقف عن العمل"?"bg-red-50":e.status==="يحتاج إصلاح"?"bg-orange-50":""}`}>
                <td className="px-2 py-1.5 font-semibold text-slate-700 whitespace-nowrap">{e.equipment}</td>
                <td className="px-2 py-1.5 text-slate-600">{e.type}</td>
                <td className="px-2 py-1.5">
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${MAINT_STATUS_STYLE[e.status]||""}`}>{e.status}</span>
                </td>
                <td className="px-2 py-1.5 text-center text-slate-500">{e.hours ? `${e.hours}س` : "—"}</td>
                <td className="px-2 py-1.5 text-slate-500 whitespace-nowrap">{e.technician||"—"}</td>
                <td className="px-2 py-1.5 text-slate-500">{e.notes||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {log.generalNote && (
        <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-100 pt-2">
          <span className="font-bold">ملاحظات عامة:</span> {log.generalNote}
        </p>
      )}
    </div>
  );
}

/* ── Employee Score Card with ONE objection per month ── */
function EmployeeScoreCard({ emp, monthKey, months, selMonth, selYear, totalScore, taskScore, attendanceScore, participationScore, initiativeScore, criteria, tasksList, showToast }) {
  const objPath = `evaluation/objections/${emp.id}/${monthKey}`;
  const [objection, setObjection] = useFirebase(objPath, null);
  const [objText, setObjText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasSubmitted = !!objection;
  const isFinalized = objection?.status === "مقبول" || objection?.status === "مرفوض";

  const submitObjection = () => {
    if (!objText.trim()) return showToast("اكتب ملاحظتك أولاً");
    if (objText.trim().length < 10) return showToast("الملاحظة قصيرة جداً — أضف تفاصيل");
    setSubmitting(true);
    setObjection({
      text: objText.trim(),
      empId: emp.id,
      empName: emp.name,
      submittedAt: new Date().toISOString(),
      status: "بانتظار المراجعة",
      adminReply: "",
    });
    // Notify admin
    fb.get("notifications/1").then(existing => {
      const prev = Array.isArray(existing) ? existing : [];
      fb.set("notifications/1", [{
        id: Date.now(), type: "اعتراض",
        title: `📝 اعتراض على تقييم ${months[selMonth]}`,
        body: `${emp.name.split(" ").slice(0,2).join(" ")} — ${objText.trim().slice(0,60)}`,
        timestamp: new Date().toISOString(), read: false,
      }, ...prev]);
    });
    showToast("✓ تم إرسال اعتراضك — سيتم الرد عليك من المشرف");
    setSubmitting(false);
  };

  const scoreColor = totalScore>=85?"text-emerald-600":totalScore>=70?"text-blue-600":totalScore>=50?"text-amber-600":"text-red-600";
  const scoreBg    = totalScore>=85?"bg-emerald-50 border-emerald-200":totalScore>=70?"bg-blue-50 border-blue-200":totalScore>=50?"bg-amber-50 border-amber-200":"bg-red-50 border-red-200";

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className={`bg-white rounded-2xl border-2 ${scoreBg} p-5 shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-slate-800">تقييمك الشهري</p>
            <p className="text-xs text-slate-500">{months[selMonth]} {selYear}</p>
          </div>
          <div className="text-center">
            <p className={`text-5xl font-bold ${scoreColor}`}>{totalScore}</p>
            <p className="text-xs text-slate-400 mt-1">من 100 درجة</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {criteria.map(c=>{
            const sc = c.key==="tasks"?taskScore:c.key==="attendance"?attendanceScore:c.key==="participation"?participationScore:initiativeScore;
            return (
              <div key={c.key} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-36 shrink-0">{c.icon} {c.label} ({c.weight}%)</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${sc>=80?"bg-emerald-500":sc>=60?"bg-blue-500":sc>=40?"bg-amber-400":"bg-red-400"}`} style={{width:`${sc}%`}}/>
                </div>
                <span className="text-xs font-bold text-slate-700 w-8">{sc}</span>
              </div>
            );
          })}
        </div>

        {/* Approved tasks */}
        {tasksList.filter(t=>t.status==="مقبولة").length>0 && (
          <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-600">المهام المقبولة:</p>
            {tasksList.filter(t=>t.status==="مقبولة").map(t=>(
              <div key={t.id} className="flex items-center gap-2 text-xs">
                <CheckSquare size={11} className="text-emerald-500 shrink-0"/>
                <span className="flex-1 text-slate-600">{t.title}</span>
                <span className="font-bold text-emerald-700">{t.adminScore}/{t.maxScore}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Objection section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-500"/> الاعتراض على التقييم
        </h4>
        <p className="text-[11px] text-slate-400 mb-4">
          يُسمح بتقديم اعتراض واحد فقط لكل تقييم شهري — قرار المشرف نهائي
        </p>

        {!hasSubmitted && (
          <div className="space-y-3">
            <textarea value={objText} onChange={e=>setObjText(e.target.value)} rows={3}
              placeholder="اكتب ملاحظتك أو اعتراضك على هذا التقييم بوضوح وتفصيل..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"/>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-red-500">⚠️ لا يمكن التعديل بعد الإرسال</p>
              <button onClick={submitObjection} disabled={submitting}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl active:scale-95 transition-all">
                <Save size={13}/> إرسال الاعتراض
              </button>
            </div>
          </div>
        )}

        {hasSubmitted && (
          <div className={`rounded-xl border p-4 space-y-3 ${
            objection.status==="مقبول"?"bg-emerald-50 border-emerald-200":
            objection.status==="مرفوض"?"bg-red-50 border-red-200":
            "bg-amber-50 border-amber-200"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                objection.status==="مقبول"?"bg-emerald-200 text-emerald-800":
                objection.status==="مرفوض"?"bg-red-200 text-red-800":
                "bg-amber-200 text-amber-800"
              }`}>
                {objection.status==="مقبول"?"✅ مقبول":objection.status==="مرفوض"?"❌ مرفوض":"⏳ بانتظار المراجعة"}
              </span>
              <span className="text-[10px] text-slate-400">{new Date(objection.submittedAt).toLocaleDateString("ar-IQ")}</span>
              {isFinalized && <span className="text-[10px] font-bold text-slate-500 mr-auto">القرار نهائي</span>}
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-[11px] font-bold text-slate-600 mb-1">اعتراضك:</p>
              <p className="text-sm text-slate-700">{objection.text}</p>
            </div>
            {objection.adminReply && (
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-[11px] font-bold text-slate-600 mb-1">رد المشرف:</p>
                <p className="text-sm text-slate-700">{objection.adminReply}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Admin monthly report with objection management ── */
function AdminMonthlyReport({ months, selMonth, selYear, dailyLogs, monthKey, allEmployees, totalScore, taskScore, attendanceScore, participationScore, initiativeScore, tasksList, criteria, ScoreBar, emp, showToast }) {
  const [objections] = useFirebase(`evaluation/objections`, {});
  const [replyText, setReplyText]   = useState({});

  const thisMonthObjs = Object.entries(objections || {}).reduce((acc, [empId, months]) => {
    const obj = months[monthKey];
    if (obj && obj.status === "بانتظار المراجعة") {
      acc.push({ empId, ...obj });
    }
    return acc;
  }, []);

  const resolveObjection = (empId, decision, reply) => {
    const path = `evaluation/objections/${empId}/${monthKey}`;
    fb.get(path).then(existing => {
      if (!existing) return;
      fb.set(path, { ...existing, status: decision, adminReply: reply, resolvedAt: new Date().toISOString(), resolvedBy: emp.name });
    });
    // Notify employee
    fb.get(`notifications/${empId}`).then(existing => {
      const prev = Array.isArray(existing) ? existing : [];
      fb.set(`notifications/${empId}`, [{
        id: Date.now(), type: decision === "مقبول" ? "موافقة" : "رفض",
        title: decision === "مقبول" ? "✅ تم قبول اعتراضك على التقييم" : "❌ تم رفض اعتراضك على التقييم",
        body: reply || `قرار المشرف على اعتراض ${months[selMonth]} ${selYear}: ${decision}`,
        timestamp: new Date().toISOString(), read: false,
      }, ...prev]);
    });
    showToast(`✓ تم ${decision === "مقبول" ? "قبول" : "رفض"} الاعتراض وإشعار الموظف`);
  };

  // Get all maintenance entries for the month and flag critical
  const allDailyEntries = Object.entries(dailyLogs)
    .filter(([d]) => d.slice(0,7) === `${selYear}-${String(selMonth+1).padStart(2,"0")}`)
    .sort(([a],[b]) => b.localeCompare(a));

  const criticalItems = allDailyEntries.flatMap(([day, log]) =>
    (log.entries||[]).filter(e => e.status === "متوقف عن العمل" || e.status === "يحتاج إصلاح")
      .map(e => ({ ...e, day }))
  );

  return (
    <div id="print-monthly" className="space-y-5">
      {/* Print header */}
      <div className="hidden print:block text-center mb-6">
        <p className="text-xl font-bold">شركة نفط البصرة — شعبة مستودع الفاو</p>
        <p className="text-base font-semibold mt-1">التقرير الشهري الشامل للصيانة والتقييم</p>
        <p className="text-sm text-slate-600">{months[selMonth]} {selYear}</p>
      </div>

      {/* Critical alerts */}
      {criticalItems.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
          <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
            <AlertCircle size={15} className="text-red-600"/> تنبيهات تحتاج إجراء ({criticalItems.length})
          </h4>
          <div className="space-y-1.5">
            {criticalItems.map((e,i)=>(
              <div key={i} className="flex items-center gap-2 text-xs bg-white/60 rounded-lg px-3 py-2">
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${MAINT_STATUS_STYLE[e.status]||""}`}>{e.status}</span>
                <span className="font-semibold text-slate-700">{e.equipment}</span>
                <span className="text-slate-500">— {e.type}</span>
                <span className="text-slate-400 mr-auto font-mono text-[10px]">{e.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <h4 className="font-bold text-slate-800 text-sm">ملخص أعمال الصيانة — {months[selMonth]} {selYear}</h4>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l:"أيام التقرير", v: allDailyEntries.length, c:"text-blue-700", bg:"bg-blue-50" },
              { l:"إجمالي العمليات", v: allDailyEntries.reduce((s,[,log])=>s+(log.entries?.length||0),0), c:"text-slate-700", bg:"bg-slate-50" },
              { l:"تنبيهات حرجة", v: criticalItems.length, c:"text-red-700", bg:"bg-red-50" },
              { l:"أعمال اكتملت", v: allDailyEntries.reduce((s,[,log])=>s+(log.entries?.filter(e=>e.status==="سليم").length||0),0), c:"text-emerald-700", bg:"bg-emerald-50" },
            ].map(s=>(
              <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending objections */}
      {thisMonthObjs.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600"/>
            <h4 className="font-bold text-amber-800 text-sm">اعتراضات على التقييم تنتظر ردك ({thisMonthObjs.length})</h4>
          </div>
          <div className="divide-y divide-slate-50">
            {thisMonthObjs.map((obj,i) => {
              const empInfo = allEmployees.find(e=>String(e.id)===String(obj.empId));
              return (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {empInfo?.name?.[0]||"م"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{empInfo?.name?.split(" ").slice(0,3).join(" ")||"موظف"}</p>
                      <p className="text-[10px] text-slate-400">{empInfo?.dept} · {new Date(obj.submittedAt).toLocaleDateString("ar-IQ")}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700">{obj.text}</div>
                  <div className="space-y-2">
                    <textarea value={replyText[obj.empId]||""} onChange={e=>setReplyText(p=>({...p,[obj.empId]:e.target.value}))}
                      placeholder="رد المشرف (مطلوب للقبول والرفض)..." rows={2}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"/>
                    <div className="flex gap-2">
                      <button onClick={()=>resolveObjection(obj.empId,"مقبول",replyText[obj.empId]||"")}
                        className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl">
                        <ThumbsUp size={12}/> قبول الاعتراض
                      </button>
                      <button onClick={()=>resolveObjection(obj.empId,"مرفوض",replyText[obj.empId]||"")}
                        className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl">
                        <ThumbsDown size={12}/> رفض الاعتراض
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Training tasks in monthly report — with include/exclude control */}
      <TrainingTasksMonthly
        months={months} selMonth={selMonth} selYear={selYear}
        allEmployees={allEmployees} showToast={showToast}
      />
    </div>
  );
}

/* ── Training tasks monthly summary (for admin monthly report) ── */
function TrainingTasksMonthly({ months, selMonth, selYear, allEmployees, showToast }) {
  const [trainings, setTrainings] = useFirebase("training/tasks", []);
  const tasksList = Array.isArray(trainings) ? trainings : [];

  const monthStart = new Date(selYear, selMonth, 1).toISOString().slice(0,10);
  const monthEnd   = new Date(selYear, selMonth+1, 0).toISOString().slice(0,10);

  const monthTasks = tasksList.filter(t=>{
    const d = t.completedAt || t.assignedAt || "";
    return d >= monthStart && d <= monthEnd+"T23:59:59";
  });

  const included  = monthTasks.filter(t=>t.includeInMonthly!==false);
  const excluded  = monthTasks.filter(t=>t.includeInMonthly===false);
  const completed = included.filter(t=>t.status==="مكتملة");

  const toggleInclude = (taskId, current) => {
    setTrainings(tasksList.map(t=>t.id===taskId?{...t,includeInMonthly:current===false?true:false}:t));
    showToast(current===false?"✓ تم إدراج المهمة في التقرير":"تم استثناء المهمة من التقرير");
  };

  if (monthTasks.length===0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-violet-50 flex items-center justify-between">
        <h4 className="font-bold text-violet-800 text-sm flex items-center gap-2">
          <GraduationCap size={14} className="text-violet-600"/>
          المهام التدريبية — {months[selMonth]} {selYear}
        </h4>
        <div className="flex gap-2 text-[10px] font-bold">
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{completed.length} مكتملة</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{excluded.length} مستثنى</span>
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {monthTasks.map(t=>{
          const empInfo = allEmployees.find(e=>String(e.id)===String(t.empId));
          const isExcluded = t.includeInMonthly===false;
          return (
            <div key={t.id} className={`px-4 py-3 flex items-start gap-3 ${isExcluded?"opacity-50":""}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                t.status==="مكتملة"?"bg-emerald-500":
                t.status==="طلب إغلاق"?"bg-violet-500":"bg-amber-400"
              }`}/>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800">{t.title}</p>
                <p className="text-[10px] text-slate-500">{empInfo?.name?.split(" ").slice(0,2).join(" ")||""} · {t.type}</p>
                {t.empAction && (
                  <p className="text-[10px] text-emerald-700 mt-0.5 bg-emerald-50 rounded px-1.5 py-0.5 truncate">
                    ✍️ {t.empAction.slice(0,80)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TRAINING_STATUS_STYLE[t.status]||""}`}>{t.status}</span>
                <button onClick={()=>toggleInclude(t.id, t.includeInMonthly)}
                  title={isExcluded?"إدراج في التقرير الشهري":"استثناء من التقرير الشهري"}
                  className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                    isExcluded
                      ?"bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      :"bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}>
                  {isExcluded?"+ إدراج":"— استثناء"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MONTHLY EVALUATION PAGE
═══════════════════════════════════════════════════════════ */
function EvaluationPage({ emp, isAdmin, allEmployees }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selEmpId, setSelEmpId] = useState(isAdmin ? null : emp.id);
  const [activeTab, setActiveTab] = useState("tasks"); // tasks | daily | monthly | csv
  const [criteria, setCriteria] = useState(EVAL_CRITERIA.map(c=>({...c, weight:c.defaultWeight})));
  const [toast, setToast] = useState("");
  const csvFileRef = useRef();

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(""),3000); };

  // Firebase paths
  const monthKey    = `${selYear}_${String(selMonth+1).padStart(2,"0")}`;
  const empTarget   = selEmpId || emp.id;
  const tasksPath   = `evaluation/tasks/${empTarget}/${monthKey}`;
  const dailyPath   = `evaluation/daily/${empTarget}/${monthKey}`;
  const scoresPath  = `evaluation/scores/${empTarget}/${monthKey}`;

  const [tasks,      setTasks]      = useFirebase(tasksPath, []);
  const [dailyLogs,  setDailyLogs]  = useFirebase(dailyPath, {});
  const [scores,     setScores]     = useFirebase(scoresPath, {});
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm,  setTaskForm]    = useState({ title:"", desc:"", maxScore:10, dueDate: getMonthDueDate() });
  const [noteModal, setNoteModal]   = useState(null);
  const todayKey = now.toISOString().slice(0,10);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tasksList  = useMemo(()=> Array.isArray(tasks) ? tasks : [], [tasks]);
  const dueDate    = `${selYear}-${String(selMonth+1).padStart(2,"0")}-15`;

  // ── Score calculations
  const taskScore = useMemo(()=>{
    const approved = tasksList.filter(t=>t.status==="مقبولة");
    const total = approved.reduce((s,t)=>s+(t.maxScore||10),0);
    const earned = approved.reduce((s,t)=>s+(t.adminScore||0),0);
    return total>0 ? Math.round((earned/total)*100) : 0;
  },[tasksList]);

  const attendanceScore = scores.attendance ?? 20;
  const participationScore = scores.participation ?? 0;
  const initiativeScore = scores.initiative ?? 0;

  const totalScore = useMemo(()=>{
    const w = criteria.reduce((acc,c)=>({...acc,[c.key]:c.weight}),{});
    const total = w.attendance+w.tasks+w.participation+w.initiative;
    return Math.round(
      (attendanceScore/100*w.attendance +
       taskScore/100*w.tasks +
       participationScore/100*w.participation +
       initiativeScore/100*w.initiative) / total * 100
    );
  },[criteria, attendanceScore, taskScore, participationScore, initiativeScore]);

  // Add task (admin only)
  const addTask = () => {
    if (!taskForm.title) return showToast("عنوان المهمة مطلوب");
    const newTask = {
      id: Date.now(),
      ...taskForm,
      status:"قيد التنفيذ",
      assignedBy: emp.name,
      assignedAt: new Date().toISOString(),
      empId: empTarget,
    };
    setTasks([...tasksList, newTask]);
    // Notify employee
    fb.get(`notifications/${empTarget}`).then(existing=>{
      const prev = Array.isArray(existing)?existing:[];
      fb.set(`notifications/${empTarget}`,[{
        id:Date.now()+1, type:"مهمة_جديدة",
        title:`📋 مهمة جديدة: ${taskForm.title}`,
        body:`الموعد النهائي: ${taskForm.dueDate} | الدرجة القصوى: ${taskForm.maxScore}`,
        timestamp:new Date().toISOString(), read:false,
      },...prev]);
    });
    setTaskForm({title:"",desc:"",maxScore:10,dueDate:getMonthDueDate()});
    setShowAddTask(false);
    showToast("✓ تم إسناد المهمة وإشعار الموظف");
  };

  // Employee submits task with file
  const submitTaskFile = async (taskId, file) => {
    if (!file) return showToast("اختر ملفاً");
    if (file.size > MAX_FILE_SIZE) return showToast("❌ الملف يتجاوز 5 ميغا");
    if (!ALLOWED_TYPES.includes(file.type)) return showToast("❌ نوع الملف غير مسموح (PDF, Word, صورة فقط)");
    showToast("جاري الرفع...");
    try {
      const url = await uploadFileToStorage(file, `tasks/${empTarget}/${monthKey}/${taskId}_${file.name}`);
      setTasks(tasksList.map(t=>t.id===taskId
        ?{...t, status:"مُرسلة للمراجعة", fileUrl:url, fileName:file.name, submittedAt:new Date().toISOString()}:t
      ));
      // Notify admin
      fb.get("notifications/1").then(existing=>{
        const prev=Array.isArray(existing)?existing:[];
        fb.set("notifications/1",[{
          id:Date.now(), type:"مهمة_مرسلة",
          title:`📎 مهمة مُرسلة للمراجعة`,
          body:`${emp.name.split(" ").slice(0,2).join(" ")} — ${tasksList.find(t=>t.id===taskId)?.title||""}`,
          timestamp:new Date().toISOString(), read:false,
        },...prev]);
      });
      showToast("✓ تم رفع الملف وإرسال المهمة للمراجعة");
    } catch(e) { showToast("❌ "+ e.message); }
  };

  // Admin approves/rejects task
  const reviewTask = (taskId, approved, adminScore, note="") => {
    setTasks(tasksList.map(t=>t.id===taskId
      ?{...t, status:approved?"مقبولة":"مرفوضة", adminScore:approved?adminScore:0, adminNote:note, reviewedAt:new Date().toISOString()}:t
    ));
    const task = tasksList.find(t=>t.id===taskId);
    fb.get(`notifications/${empTarget}`).then(existing=>{
      const prev=Array.isArray(existing)?existing:[];
      fb.set(`notifications/${empTarget}`,[{
        id:Date.now(), type:approved?"موافقة":"رفض",
        title:approved?`✅ تم قبول مهمتك`:`❌ تم رفض مهمتك`,
        body:`${task?.title||""} — الدرجة: ${approved?adminScore:0}/${task?.maxScore||10}${note?" | "+note:""}`,
        timestamp:new Date().toISOString(), read:false,
      },...prev]);
    });
    setNoteModal(null);
    showToast(approved?"✓ تم قبول المهمة":"✓ تم رفض المهمة");
  };

  // Save daily log

  // Admin saves scores
  const saveScores = (key, val) => {
    setScores({...scores, [key]: Math.min(100, Math.max(0, Number(val)))});
    showToast("✓ تم حفظ الدرجة");
  };

  // CSV Export
  const exportCSV = () => {
    const rows = tasksList.map(t=>({
      "العنوان":t.title||"",
      "الوصف":t.desc||"",
      "الموعد النهائي":t.dueDate||"",
      "الدرجة القصوى":t.maxScore||"",
      "درجة المشرف":t.adminScore||"",
      "الحالة":t.status||"",
      "تاريخ الإسناد":t.assignedAt?new Date(t.assignedAt).toLocaleDateString("ar-IQ"):"",
      "تاريخ الإرسال":t.submittedAt?new Date(t.submittedAt).toLocaleDateString("ar-IQ"):"",
      "ملاحظة المشرف":t.adminNote||"",
    }));
    csv.download(csv.stringify(rows), `مهام_${monthKey}.csv`);
    showToast("✓ تم تحميل ملف CSV");
  };

  // CSV Import
  const importCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const rows = csv.parse(ev.target.result);
        const imported = rows.filter(r=>r["العنوان"]).map(r=>({
          id:Date.now()+Math.random(),
          title:r["العنوان"]||"",
          desc:r["الوصف"]||"",
          dueDate:r["الموعد النهائي"]||getMonthDueDate(),
          maxScore:Number(r["الدرجة القصوى"])||10,
          status:"قيد التنفيذ",
          assignedBy:emp.name,
          assignedAt:new Date().toISOString(),
          empId:empTarget,
        }));
        setTasks([...tasksList,...imported]);
        showToast(`✓ تم استيراد ${imported.length} مهمة`);
      } catch { showToast("❌ خطأ في قراءة الملف"); }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value="";
  };

  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const inpC="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const ScoreBar = ({label,score,color="bg-blue-500",max=100})=>(
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{width:`${(score/max)*100}%`}}/>
      </div>
      <span className="text-xs font-bold text-slate-700 w-12 text-left">{score}/{max}</span>
    </div>
  );

  return (
    <div className="space-y-4 fu" dir="rtl">

      {/* Header controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm">
            {months.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm">
            {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
          </select>
          {isAdmin && (
            <select value={selEmpId||""} onChange={e=>setSelEmpId(Number(e.target.value)||null)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm flex-1 min-w-[160px]">
              <option value="">-- اختر موظفاً --</option>
              {allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,3).join(" ")}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl shrink-0">
            <Clock size={12}/> الموعد النهائي: 15 {months[selMonth]}
          </div>
        </div>

        {/* Score summary */}
        <div className="bg-slate-900 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold">التقييم الإجمالي — {months[selMonth]} {selYear}</p>
            <div className="flex items-center gap-1">
              <span className="text-3xl font-bold text-amber-400">{totalScore}</span>
              <span className="text-slate-400 text-sm">/100</span>
            </div>
          </div>
          <div className="space-y-2">
            {criteria.map(c=>(
              <div key={c.key} className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px] w-28 shrink-0">{c.icon} {c.label} ({c.weight}%)</span>
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{width:`${
                    c.key==="tasks"?taskScore:
                    c.key==="attendance"?attendanceScore:
                    c.key==="participation"?participationScore:initiativeScore
                  }%`}}/>
                </div>
                <span className="text-[10px] text-slate-300 w-8 text-left">{
                  c.key==="tasks"?taskScore:
                  c.key==="attendance"?attendanceScore:
                  c.key==="participation"?participationScore:initiativeScore
                }</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin: edit criteria weights */}
        {isAdmin && (
          <details className="bg-slate-50 rounded-xl border border-slate-200">
            <summary className="px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer">⚙️ تعديل أوزان معايير التقييم</summary>
            <div className="p-3 grid grid-cols-2 gap-2">
              {criteria.map((c,i)=>(
                <div key={c.key} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 flex-1">{c.icon} {c.label}</span>
                  <input type="number" min="0" max="100" value={c.weight}
                    onChange={e=>setCriteria(prev=>prev.map((x,xi)=>xi===i?{...x,weight:Number(e.target.value)}:x))}
                    className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400"/>
                  <span className="text-xs text-slate-400">%</span>
                </div>
              ))}
              <p className="col-span-2 text-[10px] text-slate-400">المجموع: {criteria.reduce((s,c)=>s+c.weight,0)}% (يجب أن يساوي 100)</p>
            </div>
          </details>
        )}

        {/* Admin: attendance/participation/initiative scores */}
        {isAdmin && selEmpId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-blue-800 mb-2">درجات المشرف (من 100)</p>
            {[
              {key:"attendance",    label:"الحضور",         color:"text-amber-600"},
              {key:"participation", label:"المشاركة",        color:"text-violet-600"},
              {key:"initiative",    label:"المبادرة الذاتية",color:"text-emerald-600"},
            ].map(item=>(
              <div key={item.key} className="flex items-center gap-2">
                <span className={`text-xs font-semibold w-32 ${item.color}`}>{item.label}</span>
                <input type="number" min="0" max="100"
                  value={scores[item.key]??0}
                  onChange={e=>saveScores(item.key, e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                <span className="text-xs text-slate-400">/100</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar no-print">
        {[
          {id:"tasks",   label:"المهام",        icon:<Target size={13}/>},
          {id:"daily",   label:"التقرير اليومي",icon:<FileText size={13}/>},
          {id:"monthly", label:"التقرير الشهري",icon:<BarChart2 size={13}/>},
          {id:"csv",     label:"CSV",            icon:<Download size={13}/>},
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab===t.id?"bg-slate-900 text-white":"bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TASKS TAB ── */}
      {activeTab==="tasks" && (
        <div className="space-y-3">
          {isAdmin && (
            <div className="flex gap-2 no-print">
              <button onClick={()=>setShowAddTask(p=>!p)}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl shadow-sm">
                <Plus size={13}/> إسناد مهمة جديدة
              </button>
              <PrintButton targetId="print-tasks" title="تقرير المهام"/>
            </div>
          )}

          {showAddTask && (
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 shadow-sm no-print">
              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><Target size={14} className="text-blue-600"/> إسناد مهمة</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">عنوان المهمة *</label>
                  <input value={taskForm.title} onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))} className={inpC} placeholder="عنوان المهمة"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">تفاصيل المهمة</label>
                  <textarea value={taskForm.desc} onChange={e=>setTaskForm(p=>({...p,desc:e.target.value}))} rows={2} className={inpC+" resize-none"} placeholder="وصف تفصيلي للمهمة..."/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">الموعد النهائي (لا يتجاوز 15 من الشهر)</label>
                  <input type="date" value={taskForm.dueDate} max={dueDate} onChange={e=>setTaskForm(p=>({...p,dueDate:e.target.value}))} className={inpC}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">الدرجة القصوى للمهمة</label>
                  <input type="number" min="1" max="100" value={taskForm.maxScore} onChange={e=>setTaskForm(p=>({...p,maxScore:Number(e.target.value)}))} className={inpC}/>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={()=>setShowAddTask(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
                <button onClick={addTask} className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
                  <Save size={12}/> إسناد المهمة
                </button>
              </div>
            </div>
          )}

          <div id="print-tasks" className="space-y-3">
            {tasksList.length===0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <Target size={28} className="text-slate-300 mx-auto mb-2"/>
                <p className="text-sm text-slate-400">لا توجد مهام مسندة لهذا الشهر</p>
              </div>
            ) : tasksList.map(task=>(
              <div key={task.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                task.status==="قيد التنفيذ"?"border-amber-200 border-r-4 border-r-amber-400":
                task.status==="مُرسلة للمراجعة"?"border-blue-200 border-r-4 border-r-blue-400":
                task.status==="مقبولة"?"border-emerald-200 border-r-4 border-r-emerald-500":
                "border-red-200 border-r-4 border-r-red-400"
              }`}>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">{task.title}</p>
                      {task.desc && <p className="text-xs text-slate-500 mt-0.5">{task.desc}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TASK_STATUS_STYLE[task.status]||""}`}>
                        {task.status}
                      </span>
                      {task.status==="مقبولة" && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {task.adminScore}/{task.maxScore} ⭐
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mb-3">
                    <span>📅 الموعد: <strong className={new Date(task.dueDate)<now&&task.status==="قيد التنفيذ"?"text-red-500":"text-slate-600"}>{task.dueDate}</strong></span>
                    <span>🎯 الدرجة القصوى: <strong>{task.maxScore}</strong></span>
                    {task.assignedBy && <span>👤 أسندها: {task.assignedBy.split(" ")[0]}</span>}
                  </div>

                  {task.adminNote && (
                    <div className="bg-slate-50 rounded-xl p-2 text-xs text-slate-600 mb-2">
                      <span className="font-bold">ملاحظة المشرف:</span> {task.adminNote}
                    </div>
                  )}

                  {/* Employee: submit file */}
                  {!isAdmin && task.status==="قيد التنفيذ" && (
                    <div className="border-t border-slate-100 pt-3 no-print">
                      <label className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl cursor-pointer transition-colors w-fit">
                        <Upload size={13}/> رفع الملف وإرسال المهمة
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={e=>e.target.files?.[0] && submitTaskFile(task.id, e.target.files[0])}/>
                      </label>
                      <p className="text-[9px] text-slate-400 mt-1">PDF, Word, صورة — الحد الأقصى 5 ميغا</p>
                    </div>
                  )}

                  {/* Submitted file */}
                  {task.fileUrl && (
                    <a href={task.fileUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 mt-2">
                      <Download size={12}/> {task.fileName || "تحميل الملف"}
                    </a>
                  )}

                  {/* Admin: review submitted task */}
                  {isAdmin && task.status==="مُرسلة للمراجعة" && (
                    <div className="border-t border-slate-100 pt-3 no-print">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="number" min="0" max={task.maxScore}
                          placeholder={`الدرجة (0-${task.maxScore})`}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          id={`score_${task.id}`}/>
                        <button onClick={()=>{
                          const sc = Number(document.getElementById(`score_${task.id}`)?.value||0);
                          reviewTask(task.id, true, sc);
                        }} className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl">
                          <ThumbsUp size={12}/> قبول
                        </button>
                        <button onClick={()=>setNoteModal({taskId:task.id, approve:false})}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl">
                          <ThumbsDown size={12}/> رفض
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DAILY MAINTENANCE REPORT TAB ── */}
      {activeTab==="daily" && (
        <div className="space-y-4">

          {/* Only admin/authorized can enter maintenance reports */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={14} className="text-blue-600"/>
                تقرير الصيانة اليومي — {new Date(todayKey).toLocaleDateString("ar-IQ",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
              </h4>
              <DailyMaintenanceForm
                todayKey={todayKey}
                dailyLogs={dailyLogs}
                setDailyLogs={setDailyLogs}
                emp={emp}
                showToast={showToast}
              />
            </div>
          )}

          {/* View logs — both admin and employee can read */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <ClipboardList size={13} className="text-slate-500"/>
                سجل تقارير الصيانة — {months[selMonth]} {selYear}
              </h4>
              <PrintButton targetId="print-daily" title={`تقارير الصيانة — ${months[selMonth]} ${selYear}`}/>
            </div>
            <div id="print-daily" className="divide-y divide-slate-50">
              {Object.entries(dailyLogs)
                .filter(([d])=>d.slice(0,7)===`${selYear}-${String(selMonth+1).padStart(2,"0")}`)
                .sort(([a],[b])=>b.localeCompare(a))
                .map(([day, log])=>(
                  <DailyLogCard key={day} day={day} log={log}/>
                ))
              }
              {Object.keys(dailyLogs).filter(d=>d.slice(0,7)===`${selYear}-${String(selMonth+1).padStart(2,"0")}`).length===0 && (
                <div className="p-10 text-center text-slate-400 text-sm">
                  <ClipboardList size={28} className="text-slate-300 mx-auto mb-2"/>
                  لا توجد تقارير صيانة لهذا الشهر
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MONTHLY REPORT TAB ── */}
      {activeTab==="monthly" && (
        <div className="space-y-4">
          <div className="flex justify-end no-print">
            <PrintButton targetId="print-monthly" title={`التقرير الشهري — ${months[selMonth]} ${selYear}`}/>
          </div>

          {/* ── For EMPLOYEE: show cumulative score + objection ── */}
          {!isAdmin && (
            <EmployeeScoreCard
              emp={emp}
              monthKey={monthKey}
              months={months}
              selMonth={selMonth}
              selYear={selYear}
              totalScore={totalScore}
              taskScore={taskScore}
              attendanceScore={attendanceScore}
              participationScore={participationScore}
              initiativeScore={initiativeScore}
              criteria={criteria}
              tasksList={tasksList}
              showToast={showToast}
            />
          )}

          {/* ── For ADMIN: full monthly maintenance report ── */}
          {isAdmin && (
            <AdminMonthlyReport
              months={months}
              selMonth={selMonth}
              selYear={selYear}
              dailyLogs={dailyLogs}
              monthKey={monthKey}
              allEmployees={allEmployees}
              totalScore={totalScore}
              taskScore={taskScore}
              attendanceScore={attendanceScore}
              participationScore={participationScore}
              initiativeScore={initiativeScore}
              tasksList={tasksList}
              criteria={criteria}
              ScoreBar={ScoreBar}
              emp={emp}
              showToast={showToast}
            />
          )}
        </div>
      )}

      {/* ── CSV TAB ── */}
      {activeTab==="csv" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">استيراد وتصدير البيانات (CSV)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-2"><Download size={14}/> تصدير CSV</p>
                <p className="text-xs text-emerald-700 mb-3">تحميل بيانات المهام كملف Excel/CSV مع دعم العربية</p>
                <button onClick={exportCSV} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl">
                  تحميل CSV
                </button>
              </div>
              {isAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2"><Upload size={14}/> استيراد CSV</p>
                  <p className="text-xs text-blue-700 mb-3">استيراد مهام من ملف CSV — يجب أن يحتوي على عمود "العنوان"</p>
                  <label className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl cursor-pointer">
                    اختيار ملف CSV
                    <input ref={csvFileRef} type="file" accept=".csv" className="hidden" onChange={importCSV}/>
                  </label>
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-600 mb-1">تنسيق ملف CSV للاستيراد:</p>
              <code className="text-[10px] text-slate-500 font-mono block">
                العنوان,الوصف,الموعد النهائي,الدرجة القصوى<br/>
                مهمة الصيانة,فحص الأجهزة,2026-06-15,10<br/>
                تقرير شهري,إعداد التقرير,2026-06-15,15
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Reject note modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setNoteModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-slate-800 mb-3">سبب الرفض</h3>
            <textarea id="reject_note" rows={3} placeholder="اكتب سبب الرفض..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"/>
            <div className="flex gap-2">
              <button onClick={()=>setNoteModal(null)} className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
              <button onClick={()=>reviewTask(noteModal.taskId, false, 0, document.getElementById("reject_note")?.value||"")}
                className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-xl">رفض المهمة</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl no-print">
          <CheckCircle size={14} className="text-emerald-400"/>{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WHATSAPP NOTIFICATIONS via CallMeBot (مجاني)
   الإعداد: كل موظف يرسل "I allow callmebot to send me messages"
   لرقم +34 623 78 64 49 على واتساب مرة واحدة
═══════════════════════════════════════════════════════════ */
const CALLMEBOT_API = "https://api.callmebot.com/whatsapp.php";

// phone: رقم الهاتف بدون 0 في البداية مع رمز البلد مثل 9647801165298
// apikey: يحصل عليه الموظف بعد تفعيل الخدمة
async function sendWhatsApp(phone, apikey, message) {
  if (!phone || !apikey) return false;
  try {
    const url = `${CALLMEBOT_API}?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
    await fetch(url);
    return true;
  } catch { return false; }
}

/* ── WhatsApp Setup Guide Modal ── */
function WhatsAppSetupModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl"
           onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <MessageCircle size={18} className="text-green-600"/>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">تفعيل إشعارات واتساب</h3>
            <p className="text-xs text-slate-500">خدمة CallMeBot المجانية</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { n:"1", t:"افتح واتساب وأضف الرقم", d:"+34 623 78 64 49" },
            { n:"2", t:"أرسل هذه الرسالة بالضبط", d:"I allow callmebot to send me messages" },
            { n:"3", t:"ستصلك رسالة تحتوي على API Key", d:"مثال: apikey=123456" },
            { n:"4", t:"أدخل رقم هاتفك والـ API Key في الإعدادات", d:"رقمك مع رمز الدولة بدون + مثل: 9647801165298" },
          ].map(s=>(
            <div key={s.n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{s.n}</span>
              <div>
                <p className="font-semibold text-slate-700">{s.t}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5 bg-slate-50 px-2 py-1 rounded">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2.5 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700">فهمت</button>
      </div>
    </div>
  );
}

/* ── Widget: My Pending Tasks (shown on home page) ── */
function MyTasksWidget({ emp, onNavigate }) {
  const [evalTasks,     ] = useFirebase(`evaluation/tasks/${emp.id}/${new Date().getFullYear()}_${String(new Date().getMonth()+1).padStart(2,"0")}`, []);
  const [trainingTasks, ] = useFirebase("training/tasks", []);

  const evalPending     = (Array.isArray(evalTasks)     ? evalTasks     : []).filter(t=>t.status==="قيد التنفيذ"||t.status==="مُسندة");
  const trainingPending = (Array.isArray(trainingTasks) ? trainingTasks : []).filter(t=>String(t.empId)===String(emp.id)&&(t.status==="مُسندة"||t.status==="قيد التنفيذ"));
  const total = evalPending.length + trainingPending.length;

  if (total === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
          <Bell size={14} className="text-amber-600"/>
          مهاماتي المعلقة
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{total}</span>
        </h3>
        <button onClick={()=>onNavigate("evaluation")} className="text-[11px] font-bold text-amber-600 hover:underline">عرض الكل</button>
      </div>
      <div className="divide-y divide-slate-50">
        {evalPending.slice(0,3).map(t=>(
          <div key={t.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Target size={13} className="text-blue-600"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{t.title}</p>
              <p className="text-[10px] text-slate-400">مهمة تقييم · موعدها: {t.dueDate||"—"}</p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">{t.status}</span>
          </div>
        ))}
        {trainingPending.slice(0,3).map(t=>(
          <div key={t.id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <GraduationCap size={13} className="text-violet-600"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{t.title}</p>
              <p className="text-[10px] text-slate-400">{t.type} · {t.startDate||"—"}</p>
            </div>
            <button onClick={()=>onNavigate("training")} className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200 whitespace-nowrap hover:bg-violet-100">
              فتح →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRAINING PAGE — صفحة التدريب
═══════════════════════════════════════════════════════════ */
const TRAINING_TYPES = ["تدريب ذاتي","تدريب موقعي","دورة تدريبية خارجية","ورشة عمل","تدريب إلكتروني"];
const TRAINING_STATUS_STYLE = {
  "مُسندة":              "bg-amber-100 text-amber-800 border-amber-200",
  "قيد التنفيذ":         "bg-blue-100 text-blue-800 border-blue-200",
  "طلب إغلاق":           "bg-violet-100 text-violet-800 border-violet-200",
  "مكتملة":              "bg-emerald-100 text-emerald-800 border-emerald-200",
  "طلب مشاركة":          "bg-violet-100 text-violet-800 border-violet-200",
  "طلب مشاركة — مقبول": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "طلب مشاركة — مرفوض": "bg-red-100 text-red-800 border-red-200",
};

function TrainingPage({ emp, isAdmin, allEmployees }) {
  const [trainings,    setTrainings]    = useFirebase("training/tasks",    []);
  const [requests,     setRequests]     = useFirebase("training/requests",  []);
  const [waSettings,   setWaSettings]   = useLocalStorage(`wa_${emp.id}`,  { phone:"", apikey:"" });
  const [showWaSetup,  setShowWaSetup]  = useState(false);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [showReqForm,  setShowReqForm]  = useState(false);
  const [activeTab,    setActiveTab]    = useState("assigned"); // assigned | requests | settings
  const [selEmpId,     setSelEmpId]     = useState(null);
  const [toast,        setToast]        = useState("");

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(""),3000); };

  const tasksList    = Array.isArray(trainings) ? trainings : [];
  const requestsList = Array.isArray(requests)  ? requests  : [];

  // My tasks (for non-admin)
  const myTasks = tasksList.filter(t => t.empId === emp.id);
  // Admin sees all or filtered by emp
  const visibleTasks = isAdmin
    ? (selEmpId ? tasksList.filter(t=>t.empId===selEmpId) : tasksList)
    : myTasks;

  const pendingRequests = requestsList.filter(r=>r.status==="طلب مشاركة").length;

  // Assign training (admin)
  const [form, setForm] = useState({ empId:"", title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"", objectives:"" });

  const assignTraining = () => {
    if (!form.empId||!form.title) return showToast("الموظف والعنوان مطلوبان");
    const entry = { ...form, id:Date.now(), status:"مُسندة", assignedBy:emp.name, assignedAt:new Date().toISOString() };
    setTrainings([entry, ...tasksList]);

    // In-app notification
    fb.get(`notifications/${form.empId}`).then(ex=>{
      const prev = Array.isArray(ex)?ex:[];
      fb.set(`notifications/${form.empId}`,[{
        id:Date.now()+1, type:"تدريب_جديد",
        title:`📚 مهمة تدريبية جديدة: ${form.title}`,
        body:`النوع: ${form.type} | من: ${form.startDate||"—"} إلى: ${form.endDate||"—"}`,
        timestamp:new Date().toISOString(), read:false,
      },...prev]);
    });

    // WhatsApp notification to employee
    const empInfo = allEmployees.find(e=>String(e.id)===String(form.empId));
    fb.get(`wa_${form.empId}`).then(wa=>{
      if (wa?.phone && wa?.apikey) {
        sendWhatsApp(wa.phone, wa.apikey,
          `📚 مهمة تدريبية جديدة\nالعنوان: ${form.title}\nالنوع: ${form.type}\nمن المشرف: ${emp.name.split(" ").slice(0,2).join(" ")}`
        );
      }
    });

    setForm({ empId:"", title:"", type:"تدريب ذاتي", desc:"", startDate:"", endDate:"", provider:"", objectives:"" });
    setShowAddForm(false);
    showToast(`✓ تم إسناد التدريب وإشعار ${empInfo?.name?.split(" ")[0]||"الموظف"}`);
  };

  // Employee request to join training
  const [reqForm, setReqForm] = useState({ courseName:"", provider:"", reason:"", startDate:"" });

  const submitRequest = () => {
    if (!reqForm.courseName||!reqForm.reason) return showToast("اسم الدورة والسبب مطلوبان");
    const req = { ...reqForm, id:Date.now(), empId:emp.id, empName:emp.name, empDept:emp.dept,
      status:"طلب مشاركة", submittedAt:new Date().toISOString() };
    setRequests([req,...requestsList]);

    // Notify admin
    fb.get("notifications/1").then(ex=>{
      const prev=Array.isArray(ex)?ex:[];
      fb.set("notifications/1",[{
        id:Date.now()+1, type:"طلب_تدريب",
        title:`🎓 طلب مشاركة بدورة تدريبية`,
        body:`${emp.name.split(" ").slice(0,2).join(" ")} — ${reqForm.courseName}`,
        timestamp:new Date().toISOString(), read:false,
      },...prev]);
    });

    setReqForm({ courseName:"", provider:"", reason:"", startDate:"" });
    setShowReqForm(false);
    showToast("✓ تم إرسال طلب المشاركة للمشرف");
  };

  // Admin: update training status
  const updateStatus = (id, status) => {
    setTrainings(tasksList.map(t=>t.id===id?{...t,status,completedAt:status==="مكتملة"?new Date().toISOString():t.completedAt}:t));
    const task = tasksList.find(t=>t.id===id);
    if (task) {
      fb.get(`notifications/${task.empId}`).then(ex=>{
        const prev=Array.isArray(ex)?ex:[];
        fb.set(`notifications/${task.empId}`,[{
          id:Date.now(), type:status==="مكتملة"?"موافقة":"تدريب_جديد",
          title:status==="مكتملة"?"✅ تم تسجيل إكمال التدريب":`🔄 تحديث حالة تدريبك`,
          body:`${task.title} — ${status}`,
          timestamp:new Date().toISOString(), read:false,
        },...prev]);
      });
    }
    showToast("✓ تم تحديث الحالة");
  };

  // Admin: resolve training request
  const resolveRequest = (id, approved) => {
    const req = requestsList.find(r=>r.id===id);
    setRequests(requestsList.map(r=>r.id===id?{...r,status:approved?"طلب مشاركة — مقبول":"طلب مشاركة — مرفوض",resolvedAt:new Date().toISOString(),resolvedBy:emp.name}:r));
    if (req) {
      fb.get(`notifications/${req.empId}`).then(ex=>{
        const prev=Array.isArray(ex)?ex:[];
        fb.set(`notifications/${req.empId}`,[{
          id:Date.now(), type:approved?"موافقة":"رفض",
          title:approved?"✅ تمت الموافقة على طلب مشاركتك بالدورة":"❌ تم رفض طلب مشاركتك بالدورة",
          body:`الدورة: ${req.courseName}`,
          timestamp:new Date().toISOString(), read:false,
        },...prev]);
      });
    }
    showToast(approved?"✓ تمت الموافقة على الطلب":"✓ تم رفض الطلب");
  };

  const inp = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
  const sel = inp+" appearance-none cursor-pointer";

  const [actionModal, setActionModal] = useState(null); // { taskId, currentAction }

  // Write action to daily report automatically
  const writeToDailyReport = (taskTitle, actionText, taskId) => {
    const today = new Date().toISOString().slice(0,10);
    const now   = new Date();
    const month = `${now.getFullYear()}_${String(now.getMonth()+1).padStart(2,"0")}`;
    const path  = `evaluation/daily/${emp.id}/${month}`;
    fb.get(path).then(existing => {
      const logs = (typeof existing==="object"&&existing!==null) ? existing : {};
      const prev = logs[today];
      const prevText = prev?.text || "";
      const entry = `[مهمة: ${taskTitle}] ${actionText}`;
      const newText = prevText ? `${prevText}\n${entry}` : entry;
      fb.set(path, {
        ...logs,
        [today]: {
          text: newText,
          savedAt: now.toISOString(),
          author: emp.name,
          taskRefs: [...(prev?.taskRefs||[]), taskId],
        }
      });
    });
  };

  const submitAction = (taskId, actionText) => {
    if (!actionText.trim()) return showToast("اكتب الإجراء أولاً");
    const task = tasksList.find(t=>t.id===taskId);
    setTrainings(tasksList.map(t=>t.id===taskId
      ? {...t, status:"قيد التنفيذ", empAction:actionText, actionAt:new Date().toISOString()}
      : t
    ));

    // Write to daily report automatically
    writeToDailyReport(task?.title||"", actionText, taskId);

    // Notify admin — immediate
    const notif = {
      id:Date.now(), type:"انجاز_مهمة",
      title:`📋 تحديث على مهمة: ${task?.title||""}`,
      body:`${emp.name.split(" ").slice(0,2).join(" ")}: ${actionText.slice(0,80)}`,
      timestamp:new Date().toISOString(), read:false,
    };
    fb.get("notifications/1").then(ex=>{
      fb.set("notifications/1",[notif,...(Array.isArray(ex)?ex:[])]);
    });
    fb.get("wa_1").then(wa=>{
      if(wa?.phone&&wa?.apikey) sendWhatsApp(wa.phone,wa.apikey,
        `📋 تحديث مهمة: ${task?.title||""}\nالموظف: ${emp.name.split(" ").slice(0,2).join(" ")}\nالإجراء: ${actionText.slice(0,80)}`
      );
    });
    setActionModal(null);
    showToast("✓ تم إرسال الإجراء للمشرف وتسجيله في التقرير اليومي");
  };

  const requestClose = (taskId) => {
    const task = tasksList.find(t=>t.id===taskId);
    setTrainings(tasksList.map(t=>t.id===taskId
      ? {...t, status:"طلب إغلاق", closureRequestedAt:new Date().toISOString()}
      : t
    ));
    const notif = {
      id:Date.now(), type:"طلب_إغلاق",
      title:`🔔 طلب إغلاق مهمة — ${task?.title||""}`,
      body:`${emp.name.split(" ").slice(0,2).join(" ")} يطلب إغلاق المهمة. الإجراء: ${task?.empAction?.slice(0,60)||""}`,
      timestamp:new Date().toISOString(), read:false,
    };
    fb.get("notifications/1").then(ex=>{
      fb.set("notifications/1",[notif,...(Array.isArray(ex)?ex:[])]);
    });
    fb.get("wa_1").then(wa=>{
      if(wa?.phone&&wa?.apikey) sendWhatsApp(wa.phone,wa.apikey,
        `🔔 طلب إغلاق مهمة\n${task?.title||""}\nالموظف: ${emp.name.split(" ").slice(0,2).join(" ")}`
      );
    });
    showToast("✓ تم إشعار المشرف بطلب الإغلاق");
  };

  const TrainingCard = ({t})=>{
    const empInfo  = allEmployees.find(e=>String(e.id)===String(t.empId));
    const isMyTask = String(t.empId)===String(emp.id);
    const [editAction, setEditAction] = useState(false);
    const [editText,   setEditText]   = useState(t.empAction||"");

    const saveEdit = () => {
      setTrainings(tasksList.map(x=>x.id===t.id?{...x,empAction:editText,actionAt:new Date().toISOString()}:x));
      setEditAction(false);
      showToast("✓ تم تحديث الإجراء");
    };

    const toggleInclude = () => {
      setTrainings(tasksList.map(x=>x.id===t.id?{...x,includeInMonthly:!t.includeInMonthly}:x));
      showToast(t.includeInMonthly?"تم استثناء المهمة من التقرير الشهري":"✓ تم إدراج المهمة في التقرير الشهري");
    };

    return (
      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        t.status==="مُسندة"     ?"border-amber-200 border-r-4 border-r-amber-400":
        t.status==="قيد التنفيذ"?"border-blue-200 border-r-4 border-r-blue-500":
        t.status==="طلب إغلاق" ?"border-violet-300 border-r-4 border-r-violet-500":
        t.status==="مكتملة"    ?"border-emerald-200 border-r-4 border-r-emerald-500":"border-slate-200"
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <GraduationCap size={16} className="text-violet-600"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">{t.title}</p>
              {isAdmin && empInfo && (
                <p className="text-xs text-slate-500">{empInfo.name?.split(" ").slice(0,3).join(" ")} · {empInfo.dept}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-100">{t.type}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TRAINING_STATUS_STYLE[t.status]||""}`}>{t.status}</span>
                {t.includeInMonthly===false && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">مُستثنى من الشهري</span>
                )}
              </div>
            </div>
          </div>

          {t.desc      && <p className="text-xs text-slate-500 mb-2 pr-12">{t.desc}</p>}
          {t.objectives&& <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-2 py-1.5 mb-2">🎯 {t.objectives}</p>}
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mb-2">
            {t.startDate&&<span>📅 من: {t.startDate}</span>}
            {t.endDate  &&<span>← إلى: {t.endDate}</span>}
            {t.provider &&<span>🏛️ {t.provider}</span>}
          </div>

          {/* Employee action taken */}
          {t.empAction && !editAction && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 mb-2">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] font-bold text-emerald-700">✍️ الإجراء المتخذ:</p>
                {isAdmin && (
                  <button onClick={()=>{setEditAction(true);setEditText(t.empAction||"");}}
                    className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                    <Edit3 size={10}/> تعديل
                  </button>
                )}
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">{t.empAction}</p>
              <p className="text-[9px] text-emerald-500 mt-1 font-mono">
                {t.actionAt ? new Date(t.actionAt).toLocaleDateString("ar-IQ",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}) : ""}
              </p>
            </div>
          )}

          {/* Admin edit action */}
          {editAction && isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-2 space-y-2">
              <p className="text-[10px] font-bold text-blue-700">تعديل الإجراء المتخذ:</p>
              <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={3}
                className="w-full border border-blue-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none bg-white"/>
              <div className="flex gap-2">
                <button onClick={()=>setEditAction(false)} className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-white rounded-xl border hover:bg-slate-50">إلغاء</button>
                <button onClick={saveEdit} className="flex-1 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1">
                  <Save size={11}/> حفظ
                </button>
              </div>
            </div>
          )}

          {/* ── EMPLOYEE ACTIONS ── */}
          {!isAdmin && isMyTask && t.status!=="مكتملة" && (
            <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
              {/* Write/update action button */}
              {(t.status==="مُسندة"||t.status==="قيد التنفيذ") && (
                <button onClick={()=>setActionModal({taskId:t.id, currentAction:t.empAction||""})}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200 transition-colors">
                  <Edit3 size={12}/> {t.empAction ? "تحديث الإجراء المتخذ" : "كتابة الإجراء المتخذ"}
                </button>
              )}
              {/* Request closure */}
              {t.empAction && t.status!=="طلب إغلاق" && (
                <button onClick={()=>requestClose(t.id)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl transition-colors active:scale-95">
                  <CheckSquare size={12}/> تقديم للمشرف وطلب إغلاق المهمة
                </button>
              )}
              {t.status==="طلب إغلاق" && (
                <div className="text-center py-2">
                  <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-4 py-2 rounded-full border border-violet-200">
                    ⏳ بانتظار موافقة المشرف على الإغلاق
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── ADMIN ACTIONS ── */}
          {isAdmin && (
            <div className="border-t border-slate-100 pt-3 mt-2 space-y-2">
              <div className="flex gap-2 flex-wrap">
                {t.status==="مُسندة" && (
                  <button onClick={()=>updateStatus(t.id,"قيد التنفيذ")}
                    className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl">
                    ▶ بدء التنفيذ
                  </button>
                )}
                {(t.status==="قيد التنفيذ"||t.status==="طلب إغلاق") && (
                  <button onClick={()=>updateStatus(t.id,"مكتملة")}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      t.status==="طلب إغلاق"
                        ?"text-white bg-emerald-600 hover:bg-emerald-700 shadow-md animate-pulse"
                        :"text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    }`}>
                    <CheckCircle size={12}/>
                    {t.status==="طلب إغلاق"?"✅ إغلاق المهمة (الموظف طلب ذلك)":"إغلاق المهمة"}
                  </button>
                )}
                {/* Include/exclude in monthly report */}
                <button onClick={toggleInclude}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                    t.includeInMonthly===false
                      ?"text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100"
                      :"text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100"
                  }`}>
                  <BarChart2 size={11}/>
                  {t.includeInMonthly===false ? "إدراج في الشهري" : "استثناء من الشهري"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 fu" dir="rtl">

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar no-print flex-wrap">
        {[
          {id:"assigned", label:"المهام التدريبية", icon:<BookOpen size={13}/>, badge: isAdmin?0:myTasks.filter(t=>t.status==="مُسندة").length},
          {id:"requests", label:"طلبات المشاركة",  icon:<GraduationCap size={13}/>, badge: isAdmin?pendingRequests:0},
          {id:"settings", label:"إعدادات الواتساب", icon:<MessageCircle size={13}/>},
        ].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab===tab.id?"bg-slate-900 text-white":"bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}>
            {tab.icon}{tab.label}
            {tab.badge>0&&<span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── ASSIGNED TRAININGS ── */}
      {activeTab==="assigned" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 no-print">
            {isAdmin && (
              <>
                <button onClick={()=>setShowAddForm(p=>!p)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-xl shadow-sm">
                  <Plus size={13}/> إسناد مهمة تدريبية
                </button>
                <select value={selEmpId||""} onChange={e=>setSelEmpId(Number(e.target.value)||null)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm">
                  <option value="">كل الموظفين</option>
                  {allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,3).join(" ")}</option>)}
                </select>
              </>
            )}
            {!isAdmin && (
              <button onClick={()=>setShowReqForm(p=>!p)}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-xl shadow-sm">
                <Plus size={13}/> طلب مشاركة بدورة
              </button>
            )}
            <PrintButton targetId="print-training" title="تقرير التدريب"/>
          </div>

          {/* Assign form */}
          {showAddForm && isAdmin && (
            <div className="bg-white rounded-2xl border-2 border-violet-200 p-5 shadow-sm no-print">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><GraduationCap size={14} className="text-violet-600"/> إسناد مهمة تدريبية</h4>
                <button onClick={()=>setShowAddForm(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={14}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">الموظف *</label>
                  <select value={form.empId} onChange={e=>setForm(p=>({...p,empId:e.target.value}))} className={sel}>
                    <option value="">-- اختر موظفاً --</option>
                    {allEmployees.map(e=><option key={e.id} value={e.id}>{e.name.split(" ").slice(0,3).join(" ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">عنوان التدريب *</label>
                  <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={inp} placeholder="عنوان المهمة التدريبية"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">نوع التدريب</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className={sel}>
                    {TRAINING_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">الجهة / المزود</label>
                  <input value={form.provider} onChange={e=>setForm(p=>({...p,provider:e.target.value}))} className={inp} placeholder="اسم الجهة أو المزود"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">تاريخ البدء</label>
                  <input type="date" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} className={inp}/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">تاريخ الانتهاء</label>
                  <input type="date" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} className={inp}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">الأهداف التدريبية</label>
                  <input value={form.objectives} onChange={e=>setForm(p=>({...p,objectives:e.target.value}))} className={inp} placeholder="ما الذي يجب تعلمه؟"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">ملاحظات</label>
                  <textarea value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} rows={2} className={inp+" resize-none"} placeholder="تفاصيل إضافية..."/>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={()=>setShowAddForm(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                <button onClick={assignTraining} className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700">
                  <Save size={12}/> إسناد التدريب
                </button>
              </div>
            </div>
          )}

          {/* Request form */}
          {showReqForm && !isAdmin && (
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 shadow-sm no-print">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><GraduationCap size={14} className="text-blue-600"/> طلب مشاركة بدورة تدريبية</h4>
                <button onClick={()=>setShowReqForm(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={14}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">اسم الدورة *</label>
                  <input value={reqForm.courseName} onChange={e=>setReqForm(p=>({...p,courseName:e.target.value}))} className={inp} placeholder="اسم الدورة أو البرنامج التدريبي"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">الجهة المنظِّمة</label>
                  <input value={reqForm.provider} onChange={e=>setReqForm(p=>({...p,provider:e.target.value}))} className={inp} placeholder="اسم الجهة"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">التاريخ المقترح</label>
                  <input type="date" value={reqForm.startDate} onChange={e=>setReqForm(p=>({...p,startDate:e.target.value}))} className={inp}/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">سبب الطلب *</label>
                  <textarea value={reqForm.reason} onChange={e=>setReqForm(p=>({...p,reason:e.target.value}))} rows={2}
                    className={inp+" resize-none"} placeholder="لماذا تريد المشاركة بهذه الدورة؟ وما الفائدة المتوقعة؟"/>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button onClick={()=>setShowReqForm(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button>
                <button onClick={submitRequest} className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700">
                  <Save size={12}/> إرسال الطلب
                </button>
              </div>
            </div>
          )}

          {/* Training cards */}
          <div id="print-training" className="space-y-3">
            {visibleTasks.length===0?(
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                <GraduationCap size={28} className="text-slate-300 mx-auto mb-2"/>
                <p className="text-sm text-slate-400">لا توجد مهام تدريبية</p>
              </div>
            ):visibleTasks.map(t=><TrainingCard key={t.id} t={t}/>)}
          </div>
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {activeTab==="requests" && (
        <div className="space-y-3">
          {requestsList.length===0?(
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <BookOpen size={28} className="text-slate-300 mx-auto mb-2"/>
              <p className="text-sm text-slate-400">لا توجد طلبات مشاركة</p>
            </div>
          ):(isAdmin?requestsList:requestsList.filter(r=>r.empId===emp.id)).map(req=>(
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <GraduationCap size={16} className="text-violet-600"/>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">{req.courseName}</p>
                  {isAdmin&&<p className="text-xs text-slate-500">{req.empName?.split(" ").slice(0,3).join(" ")} — {req.empDept}</p>}
                  {req.provider&&<p className="text-xs text-slate-400">🏛️ {req.provider}</p>}
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded-lg px-2 py-1">{req.reason}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${TRAINING_STATUS_STYLE[req.status]||""}`}>{req.status}</span>
              </div>
              {isAdmin && req.status==="طلب مشاركة" && (
                <div className="flex gap-2 mt-2 no-print">
                  <button onClick={()=>resolveRequest(req.id,true)} className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl">
                    <ThumbsUp size={12}/> قبول
                  </button>
                  <button onClick={()=>resolveRequest(req.id,false)} className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-xl">
                    <ThumbsDown size={12}/> رفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── WHATSAPP SETTINGS TAB ── */}
      {activeTab==="settings" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <MessageCircle size={18} className="text-green-600"/>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">إشعارات واتساب</h4>
                <p className="text-xs text-slate-500">استقبل إشعارات المهام التدريبية والموافقات على واتساب</p>
              </div>
              <button onClick={()=>setShowWaSetup(true)} className="mr-auto text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl">
                دليل التفعيل
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">رقم الهاتف (مع رمز الدولة، بدون +)</label>
                <input value={waSettings.phone} onChange={e=>setWaSettings(p=>({...p,phone:e.target.value}))}
                  className={inp} placeholder="مثال: 9647801165298"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">API Key (من رسالة CallMeBot)</label>
                <input value={waSettings.apikey} onChange={e=>setWaSettings(p=>({...p,apikey:e.target.value}))}
                  className={inp} placeholder="مثال: 1234567"/>
              </div>
              <button onClick={async()=>{
                if (!waSettings.phone||!waSettings.apikey) return showToast("أدخل الرقم والـ API Key أولاً");
                fb.set(`wa_${emp.id}`, waSettings);
                const ok = await sendWhatsApp(waSettings.phone, waSettings.apikey, "✅ تم تفعيل إشعارات واتساب لنظام BOC الفاو بنجاح!");
                showToast(ok?"✓ تم الحفظ وإرسال رسالة تجريبية":"✓ تم الحفظ (تحقق من إعدادات CallMeBot)");
              }} className="flex items-center gap-1.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2.5 rounded-xl active:scale-95 transition-all">
                <MessageCircle size={14}/> حفظ وإرسال رسالة تجريبية
              </button>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
            <p className="font-bold">⚠️ ملاحظات مهمة:</p>
            <p>• كل موظف يفعّل الخدمة لحسابه الشخصي فقط</p>
            <p>• الخدمة مجانية ولكن لها حد يومي للرسائل</p>
            <p>• رقم الهاتف والـ API Key محفوظان على جهازك فقط</p>
          </div>
        </div>
      )}

      {showWaSetup && <WhatsAppSetupModal onClose={()=>setShowWaSetup(false)}/>}

      {/* Action modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={()=>setActionModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl"
               onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Edit3 size={16} className="text-blue-600"/>
              </div>
              <h3 className="font-bold text-slate-800">الإجراء المتخذ في المهمة</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3 mr-11">سيُسجَّل في التقرير اليومي تلقائياً ويصل للمشرف فوراً</p>
            <textarea
              id="action_text"
              defaultValue={actionModal.currentAction}
              rows={5}
              placeholder="اكتب ما قمت به بالتفصيل: الخطوات المنفّذة، النتائج المحققة، أي ملاحظات..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-4"/>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-[11px] text-amber-800">
              📋 سيُضاف هذا الإجراء تلقائياً لتقرير يوم {new Date().toLocaleDateString("ar-IQ",{weekday:"long",day:"numeric",month:"long"})}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setActionModal(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
              <button onClick={()=>submitAction(actionModal.taskId, document.getElementById("action_text")?.value||"")}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5">
                <Save size={14}/> إرسال للمشرف
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl no-print">
          <CheckCircle size={14} className="text-emerald-400"/>{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REPORTS PAGE — التقارير اليومية والأسبوعية في صفحة واحدة
═══════════════════════════════════════════════════════════ */
function ReportsPage({ emp, isAdmin }) {
  const now = new Date();
  const [activeTab, setActiveTab] = useState("daily");
  const [selDate,   setSelDate]   = useState(now.toISOString().slice(0,10));
  const [selWeek,   setSelWeek]   = useState(()=>{
    const d = new Date(); d.setDate(d.getDate()-d.getDay()+1);
    return d.toISOString().slice(0,10);
  });
  const [selMonth, setSelMonth]   = useState(now.getMonth());
  const [selYear,  setSelYear]    = useState(now.getFullYear());

  const monthKey  = `${selYear}_${String(selMonth+1).padStart(2,"0")}`;
  const dailyPath = `evaluation/daily/${isAdmin?"admin":emp.id}/${monthKey}`;
  const [dailyLogs, setDailyLogs] = useFirebase(dailyPath, {});
  const [reportText, setReportText] = useState("");
  const [toast, setToast] = useState("");
  const showToast = (m)=>{ setToast(m); setTimeout(()=>setToast(""),3000); };

  const logs = typeof dailyLogs==="object"&&dailyLogs!==null ? dailyLogs : {};

  // Get week days from Monday
  const getWeekDays = (weekStart) => {
    const days=[];
    const d=new Date(weekStart);
    for(let i=0;i<7;i++){
      const dd=new Date(d); dd.setDate(d.getDate()+i);
      days.push(dd.toISOString().slice(0,10));
    }
    return days;
  };
  const weekDays = getWeekDays(selWeek);

  // Save daily report
  const saveReport = () => {
    if (!reportText.trim()) return showToast("اكتب التقرير أولاً");
    setDailyLogs({...logs, [selDate]:{
      text: reportText.trim(),
      savedAt: new Date().toISOString(),
      author: emp.name,
    }});
    setReportText("");
    showToast("✓ تم حفظ التقرير");
  };

  // Monthly summary from all daily logs
  const monthLogs = Object.entries(logs)
    .filter(([d])=>d.slice(0,7)===`${selYear}-${String(selMonth+1).padStart(2,"0")}`)
    .sort(([a],[b])=>b.localeCompare(a));

  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  return (
    <div className="space-y-4 fu" dir="rtl">

      {/* Tab navigation */}
      <div className="flex gap-1.5 no-print">
        {[
          {id:"daily",   label:"اليومي",   icon:<FileText size={13}/>},
          {id:"weekly",  label:"الأسبوعي", icon:<BarChart size={13}/>},
          {id:"monthly", label:"الشهري",   icon:<BarChart2 size={13}/>},
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab===t.id?"bg-slate-900 text-white":"bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
        <PrintButton targetId="print-report" title={`تقرير ${activeTab==="daily"?"يومي":activeTab==="weekly"?"أسبوعي":"شهري"}`}/>
      </div>

      {/* ── DAILY ── */}
      {activeTab==="daily" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 no-print">
            <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"/>
            <span className="text-xs text-slate-500">
              {new Date(selDate).toLocaleDateString("ar-IQ",{weekday:"long",day:"numeric",month:"long"})}
            </span>
          </div>

          {/* Entry form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <FileText size={14} className="text-blue-600"/> تقرير يوم {new Date(selDate).toLocaleDateString("ar-IQ",{day:"numeric",month:"long"})}
            </h4>
            {logs[selDate] ? (
              <div className="space-y-2">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-sm text-slate-700 leading-relaxed">{logs[selDate]?.text||logs[selDate]}</p>
                </div>
                <p className="text-[10px] text-slate-400">
                  آخر تعديل: {new Date(logs[selDate]?.savedAt||"").toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})} — {logs[selDate]?.author||""}
                </p>
                <button onClick={()=>setReportText(logs[selDate]?.text||logs[selDate]||"")}
                  className="text-xs font-bold text-blue-600 hover:underline">تعديل التقرير</button>
              </div>
            ):(
              <div className="space-y-2">
                <textarea value={reportText} onChange={e=>setReportText(e.target.value)} rows={4}
                  placeholder="اكتب ملاحظات اليوم، الأعمال المنجزة، المشاكل المواجهة..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"/>
                <button onClick={saveReport}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl">
                  <Save size={13}/> حفظ التقرير
                </button>
              </div>
            )}
            {reportText && logs[selDate] && (
              <div className="mt-2 space-y-2">
                <textarea value={reportText} onChange={e=>setReportText(e.target.value)} rows={4}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"/>
                <button onClick={saveReport}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl">
                  <Save size={13}/> تحديث التقرير
                </button>
              </div>
            )}
          </div>

          {/* Recent logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-700">آخر التقارير</h4>
            </div>
            <div id="print-report" className="divide-y divide-slate-50">
              {Object.entries(logs).sort(([a],[b])=>b.localeCompare(a)).slice(0,10).map(([day,log])=>(
                <div key={day} className={`px-4 py-3 ${day===selDate?"bg-blue-50/30":""}`}>
                  <p className="text-[10px] font-bold text-slate-400 mb-1">
                    {new Date(day).toLocaleDateString("ar-IQ",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{log?.text||log}</p>
                </div>
              ))}
              {Object.keys(logs).length===0&&(
                <div className="p-8 text-center text-slate-400 text-sm">لا توجد تقارير</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── WEEKLY ── */}
      {activeTab==="weekly" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 no-print">
            <label className="text-xs font-semibold text-slate-600">بداية الأسبوع:</label>
            <input type="date" value={selWeek} onChange={e=>setSelWeek(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"/>
          </div>
          <div id="print-report" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-700">
                التقرير الأسبوعي — {new Date(selWeek).toLocaleDateString("ar-IQ",{day:"numeric",month:"long"})} إلى {new Date(weekDays[6]).toLocaleDateString("ar-IQ",{day:"numeric",month:"long",year:"numeric"})}
              </h4>
            </div>
            <div className="divide-y divide-slate-50">
              {weekDays.map(day=>{
                const log = logs[day];
                const isToday = day===now.toISOString().slice(0,10);
                return (
                  <div key={day} className={`px-4 py-3 ${isToday?"bg-blue-50/30":!log?"opacity-50":""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${log?"bg-emerald-400":"bg-slate-200"}`}/>
                      <p className="text-[11px] font-bold text-slate-600">
                        {new Date(day).toLocaleDateString("ar-IQ",{weekday:"long",day:"numeric",month:"long"})}
                        {isToday&&<span className="mr-2 text-[9px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">اليوم</span>}
                      </p>
                    </div>
                    {log
                      ? <p className="text-sm text-slate-700 pr-4 leading-relaxed">{log?.text||log}</p>
                      : <p className="text-xs text-slate-300 pr-4">لا يوجد تقرير</p>
                    }
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                أيام مسجّلة: <strong>{weekDays.filter(d=>logs[d]).length}/7</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MONTHLY SUMMARY ── */}
      {activeTab==="monthly" && (
        <div className="space-y-4">
          <div className="flex gap-2 no-print">
            <select value={selMonth} onChange={e=>setSelMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm">
              {months.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select>
            <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer appearance-none shadow-sm">
              {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
            </select>
          </div>

          <div id="print-report" className="space-y-3">
            <div className="hidden print:block text-center mb-4">
              <p className="text-lg font-bold">شركة نفط البصرة — شعبة الفاو</p>
              <p className="text-base">التقرير الشهري — {months[selMonth]} {selYear}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-blue-700">{monthLogs.length}</p>
                <p className="text-[10px] text-slate-500">تقرير مُدخل</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
                <p className="text-2xl font-bold text-slate-700">{new Date(selYear,selMonth+1,0).getDate()}</p>
                <p className="text-[10px] text-slate-500">أيام الشهر</p>
              </div>
              <div className={`rounded-2xl p-3 text-center shadow-sm border ${monthLogs.length/new Date(selYear,selMonth+1,0).getDate()>0.7?"bg-emerald-50 border-emerald-200":"bg-amber-50 border-amber-200"}`}>
                <p className={`text-2xl font-bold ${monthLogs.length/new Date(selYear,selMonth+1,0).getDate()>0.7?"text-emerald-700":"text-amber-700"}`}>
                  {Math.round(monthLogs.length/new Date(selYear,selMonth+1,0).getDate()*100)}%
                </p>
                <p className="text-[10px] text-slate-500">نسبة التوثيق</p>
              </div>
            </div>

            {/* All month logs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-700">تقارير {months[selMonth]} {selYear}</h4>
              </div>
              <div className="divide-y divide-slate-50">
                {monthLogs.length===0?(
                  <div className="p-8 text-center text-slate-400 text-sm">لا توجد تقارير لهذا الشهر</div>
                ):monthLogs.map(([day,log])=>(
                  <div key={day} className="px-4 py-3">
                    <p className="text-[10px] font-bold text-slate-400 mb-1">
                      {new Date(day).toLocaleDateString("ar-IQ",{weekday:"long",day:"numeric",month:"long"})}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{log?.text||log}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast&&(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl no-print">
          <CheckCircle size={14} className="text-emerald-400"/>{toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function LeaveSystem() {
  const [user, setUser] = useState(null);
  return user
    ? <Dashboard emp={user} onLogout={()=>setUser(null)}/>
    : <LoginScreen onLogin={setUser}/>;
}
