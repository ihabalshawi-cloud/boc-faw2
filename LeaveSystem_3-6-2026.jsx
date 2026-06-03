import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { LogIn, LogOut, FileText, Clock, Heart, Calendar, CheckCircle, ChevronLeft, User, Eye, EyeOff, AlertCircle, Printer, Users, Shield, Package, Plus, Trash2, Edit3, Save, X, ArrowRightLeft, PenTool, RefreshCw, Search, FolderOpen, Upload, Download, Layers, ClipboardList, ChevronRight, Home, Bell, ThumbsUp, ThumbsDown } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   localStorage HOOK — persistent state across sessions
═══════════════════════════════════════════════════════════ */
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
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
  }, []);

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

  const doApprove = (id) => { onApprove(id, "approve"); };
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

  // ── Persisted state via localStorage (per user)
  const [history,      setHistory]      = useLocalStorage(`boc_history_${emp.id}`,    []);
  const [employees,    setEmployees]    = useLocalStorage("boc_employees",             ACCOUNTS);
  const [empSignatures,setEmpSignatures]= useLocalStorage("boc_signatures",            {});
  const [transferLog,  setTransferLog]  = useLocalStorage("boc_transfers",             []);

  // ── Global requests (all employees, admin can see all)
  const [allRequests,  setAllRequests]  = useLocalStorage("boc_all_requests",          []);
  const [notifications,setNotifications]= useLocalStorage(`boc_notif_${emp.id}`,       []);

  const isAdmin = emp.username === "i.shawi";

  // Pending count for admin badge
  const pendingCount = useMemo(() =>
    allRequests.filter(r => r.status === "بانتظار المراجعة").length
  , [allRequests]);

  // Unread notifications count
  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.read).length
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
    setHistory(h => [rec, ...h]);
    setAllRequests(r => [rec, ...r]);
    setReceipt(rec);
    setView("receipt");

    // Notify admin (Ihab)
    const adminNotif = {
      id: Date.now() + 1,
      type: "طلب_جديد",
      title: `طلب ${LEAVE_TYPES[leave.type].label} جديد`,
      body: `${emp.name.split(" ").slice(0,2).join(" ")} — ${leave.days} يوم`,
      requestId: rec.id,
      timestamp: new Date().toISOString(),
      read: false,
    };
    // Push to admin's notification feed
    try {
      const adminNotifs = JSON.parse(localStorage.getItem("boc_notif_1") || "[]");
      localStorage.setItem("boc_notif_1", JSON.stringify([adminNotif, ...adminNotifs]));
    } catch {}
  };

  // ── Admin: approve or reject a request
  const handleApproval = useCallback((reqId, decision, adminNote = "") => {
    const newStatus = decision === "approve" ? "موافق عليها" : "مرفوضة";
    const timestamp = new Date().toISOString();

    // Update allRequests
    setAllRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, status: newStatus, decidedAt: timestamp, decidedBy: emp.name, adminNote } : r
    ));

    // Update the employee's own history
    const req = allRequests.find(r => r.id === reqId);
    if (req) {
      const empHistKey = `boc_history_${req.empId}`;
      try {
        const empHist = JSON.parse(localStorage.getItem(empHistKey) || "[]");
        const updated = empHist.map(h =>
          h.id === reqId ? { ...h, status: newStatus, decidedAt: timestamp, decidedBy: emp.name, adminNote } : h
        );
        localStorage.setItem(empHistKey, JSON.stringify(updated));
      } catch {}

      // Notify the employee
      const empNotif = {
        id: Date.now(),
        type: decision === "approve" ? "موافقة" : "رفض",
        title: decision === "approve" ? "✅ تمت الموافقة على إجازتك" : "❌ تم رفض طلب إجازتك",
        body: `${LEAVE_TYPES[req.type]?.label || req.type} — ${req.days} يوم${adminNote ? " | ملاحظة: " + adminNote : ""}`,
        requestId: reqId,
        timestamp,
        read: false,
      };
      try {
        const empNotifs = JSON.parse(localStorage.getItem(`boc_notif_${req.empId}`) || "[]");
        localStorage.setItem(`boc_notif_${req.empId}`, JSON.stringify([empNotif, ...empNotifs]));
      } catch {}

      // If this is the admin viewing their own, update local notifications too
      if (req.empId === emp.id) {
        setNotifications(prev => [empNotif, ...prev]);
      }
    }
  }, [allRequests, emp, setAllRequests]);

  const ICONS = { اعتيادية:<Calendar size={16}/>, مرضية:<Heart size={16}/>, زمنية:<Clock size={16}/> };
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
    <div className="min-h-screen bg-[#f0f4fa]" dir="rtl">
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
          header,footer,nav{display:none!important}
          #print-area,table{border-color:#000!important}
          .fu{animation:none!important}
          tr{break-inside:avoid}
        }
        @media print{
          .no-print{display:none!important}
          body{background:white!important}
          #print-area{border:1px solid #000!important;box-shadow:none!important}
        }
      `}</style>

      {/* Topbar */}
      <header className="no-print" style={{background:"linear-gradient(135deg,#0d2348,#1a3a6e)"}}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">BOC</span>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-bold leading-none">شركة نفط البصرة — شعبة الفاو</p>
            <p className="text-blue-300 text-[10px]">نظام الإجازات والطلبات الإدارية</p>
          </div>
          {isAdmin && (
            <span className="hidden md:flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2 py-1 rounded-lg">
              <Shield size={11}/> مشرف ومخول
            </span>
          )}
          {/* Notification bell */}
          <button
            onClick={()=>setView(isAdmin?"approvals":"notifications")}
            className="relative text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Bell size={18}/>
            {(isAdmin ? pendingCount : unreadCount) > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {isAdmin ? pendingCount : unreadCount}
              </span>
            )}
          </button>
          <div className="text-left hidden md:block">
            <p className="text-white text-xs font-semibold">{emp.name.split(" ").slice(0,2).join(" ")}</p>
            <p className="text-blue-300 text-[10px]">{emp.username}</p>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors">
            <LogOut size={13}/> خروج
          </button>
        </div>

        {/* Nav tabs inside header */}
        <div className="max-w-5xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto no-scrollbar">
          {[
            { id:"home",      label:"الرئيسية",  icon:<Home size={13}/> },
            { id:"materials", label:"طلب مواد",     icon:<Package size={13}/> },
            { id:"inventory", label:"جرد المخزن", icon:<Layers size={13}/> },
            { id:"furniture", label:"جرد الأثاث",  icon:<ClipboardList size={13}/> },
            { id:"projects",  label:"المشاريع",    icon:<FolderOpen size={13}/> },
            ...(isAdmin ? [
              { id:"approvals",label:"الموافقات",    icon:<ThumbsUp size={13}/>, badge: pendingCount },
              { id:"employees", label:"الموظفون",    icon:<Shield size={13}/> },
            ] : []),
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setView(tab.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap ${
                view===tab.id
                  ? "bg-[#f0f4fa] text-slate-800"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}>
              {tab.icon}{tab.label}
              {tab.badge > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-5 pb-24 md:pb-6">

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

            {/* History — shows live status from allRequests */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">طلباتي السابقة</h3>
              {history.length === 0
                ? <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                    <FileText size={24} className="text-slate-300 mx-auto mb-2"/>
                    <p className="text-sm text-slate-400">لا توجد طلبات سابقة</p>
                  </div>
                : <div className="space-y-2">
                    {history.map(h => {
                      // get live status from allRequests
                      const live = allRequests.find(r => r.id === h.id);
                      const status = live?.status || h.status;
                      const adminNote = live?.adminNote || "";
                      return (
                        <div key={h.id} className={`bg-white rounded-2xl border p-4 flex items-start gap-3 shadow-sm ${
                          status==="موافق عليها" ? "border-emerald-200" :
                          status==="مرفوضة" ? "border-red-200" : "border-slate-200"
                        }`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${LEAVE_TYPES[h.type].light} border mt-0.5`}>
                            {ICONS[h.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-bold text-slate-800">{LEAVE_TYPES[h.type].label}</p>
                              {h.isAbroad && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🛂 خارج العراق</span>}
                              {h.warnings?.length > 0 && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⚠️ تحتاج موافقة</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{arabicDate(h.dateFrom)} — {arabicDate(h.dateTo)} · {toArabicNum(h.days)} يوم</p>
                            <p className="text-[11px] text-slate-400 truncate">{h.purpose}</p>
                            {adminNote && <p className="text-[11px] text-slate-600 mt-1 border-t border-slate-100 pt-1"><span className="font-bold">ملاحظة المشرف:</span> {adminNote}</p>}
                          </div>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 ${STATUS_STYLE[status]}`}>
                            {status}
                          </span>
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

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="no-print fixed bottom-0 right-0 left-0 z-40 md:hidden"
           style={{background:"rgba(255,255,255,0.95)",backdropFilter:"blur(20px)",borderTop:"1px solid #e2e8f0",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div className="flex">
          {[
            { id:"home",      label:"الرئيسية",  icon:<Home size={18}/> },
            { id:"materials", label:"طلب مواد",  icon:<Package size={18}/> },
            { id:"inventory", label:"المخزن",    icon:<Layers size={18}/> },
            { id:"furniture", label:"الأثاث",    icon:<ClipboardList size={18}/> },
            { id:"projects",  label:"المشاريع",  icon:<FolderOpen size={18}/> },
            ...(isAdmin ? [
              { id:"approvals", label:"الموافقات", icon:<ThumbsUp size={18}/>, badge: pendingCount },
              { id:"employees", label:"الموظفون",  icon:<Shield size={18}/> },
            ] : [
              { id:"notifications", label:"إشعاراتي", icon:<Bell size={18}/>, badge: unreadCount },
            ]),
          ].map(tab=>(
            <button key={tab.id} onClick={()=>{
              setView(tab.id);
              // Mark notifications read when opening
              if (tab.id === "notifications" && unreadCount > 0) {
                setNotifications(prev => prev.map(n => ({...n, read: true})));
              }
            }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors relative ${
                view===tab.id ? "text-blue-600" : "text-slate-400"
              }`}>
              <span className={`p-1.5 rounded-xl transition-all relative ${view===tab.id?"bg-blue-100":""}`}>
                {tab.icon}
                {tab.badge > 0 && (
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
  {id:1, code:"EL-001", name:"كابل كهربائي 16mm",         category:"كهربائي",  unit:"متر",  qty:120,  condition:"جيد",         location:"رف A1", lastUpdate:"2026-05-01"},
  {id:2, code:"EL-002", name:"قاطع كهربائي 100A",          category:"كهربائي",  unit:"قطعة", qty:8,    condition:"جيد",         location:"رف A2", lastUpdate:"2026-05-01"},
  {id:3, code:"EL-003", name:"علبة توصيل IP65",            category:"كهربائي",  unit:"قطعة", qty:15,   condition:"مستعمل",      location:"رف A3", lastUpdate:"2026-04-20"},
  {id:4, code:"ME-001", name:"مضخة طرد مركزي 4\"",         category:"ميكانيكي", unit:"قطعة", qty:2,    condition:"يحتاج صيانة", location:"مستودع B", lastUpdate:"2026-03-15"},
  {id:5, code:"ME-002", name:"صمام بوابة 6\"",             category:"ميكانيكي", unit:"قطعة", qty:5,    condition:"جيد",         location:"رف B1", lastUpdate:"2026-05-10"},
  {id:6, code:"ME-003", name:"زيت هيدروليك VG-46",        category:"ميكانيكي", unit:"لتر",  qty:200,  condition:"جيد",         location:"رف B2", lastUpdate:"2026-05-01"},
  {id:7, code:"IN-001", name:"جهاز استشعار ضغط",           category:"أجهزة قياس",unit:"قطعة",qty:4,   condition:"تالف",        location:"رف C1", lastUpdate:"2026-02-10"},
  {id:8, code:"IN-002", name:"ترموستات صناعي",             category:"أجهزة قياس",unit:"قطعة",qty:6,   condition:"جيد",         location:"رف C2", lastUpdate:"2026-05-01"},
  {id:9, code:"SA-001", name:"خوذة سلامة",                 category:"سلامة",    unit:"قطعة", qty:30,   condition:"جيد",         location:"رف D1", lastUpdate:"2026-05-01"},
  {id:10,code:"SA-002", name:"حذاء سلامة مقاس 42",         category:"سلامة",    unit:"قطعة", qty:10,   condition:"مستعمل",      location:"رف D2", lastUpdate:"2026-04-01"},
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
  {id:1, code:"F-001", name:"مكتب خشبي كبير",       category:"أثاث مكتبي",    qty:8,  condition:"جيد",         location:"مكتب المدير",    serialNo:"DSK-2019-001", lastUpdate:"2026-01-10"},
  {id:2, code:"F-002", name:"كرسي دوار",              category:"أثاث مكتبي",    qty:20, condition:"مستعمل",      location:"المكاتب العامة", serialNo:"CHR-2019-001", lastUpdate:"2026-01-10"},
  {id:3, code:"F-003", name:"خزانة ملفات معدنية",    category:"أثاث مكتبي",    qty:6,  condition:"جيد",         location:"الأرشيف",        serialNo:"CAB-2020-001", lastUpdate:"2026-02-01"},
  {id:4, code:"C-001", name:"حاسوب Dell OptiPlex",   category:"أجهزة حاسوب",   qty:12, condition:"جيد",         location:"قاعة العمليات",  serialNo:"PC-2022-001",  lastUpdate:"2026-03-01"},
  {id:5, code:"C-002", name:"طابعة HP LaserJet",     category:"أجهزة حاسوب",   qty:3,  condition:"يحتاج صيانة", location:"الاستقبال",      serialNo:"PR-2021-001",  lastUpdate:"2026-04-05"},
  {id:6, code:"C-003", name:"شاشة 24 بوصة",          category:"أجهزة حاسوب",   qty:15, condition:"جيد",         location:"المكاتب",        serialNo:"MON-2022-001", lastUpdate:"2026-03-01"},
  {id:7, code:"O-001", name:"جهاز تصوير Xerox",      category:"معدات مكتبية",  qty:2,  condition:"تالف",        location:"الإدارة",        serialNo:"XRX-2018-001", lastUpdate:"2025-12-01"},
  {id:8, code:"O-002", name:"جهاز بروجيكتور",         category:"معدات مكتبية",  qty:1,  condition:"جيد",         location:"قاعة الاجتماعات",serialNo:"PRJ-2021-001", lastUpdate:"2026-01-01"},
  {id:9, code:"T-001", name:"هاتف مكتبي IP",         category:"أجهزة اتصال",   qty:10, condition:"جيد",         location:"المكاتب",        serialNo:"TEL-2020-001", lastUpdate:"2026-01-01"},
  {id:10,code:"T-002", name:"راديو لاسلكي Motorola", category:"أجهزة اتصال",   qty:6,  condition:"مستعمل",      location:"المستودع",       serialNo:"RAD-2019-001", lastUpdate:"2026-02-15"},
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
   ROOT
═══════════════════════════════════════════════════════════ */
export default function LeaveSystem() {
  const [user, setUser] = useState(null);
  return user
    ? <Dashboard emp={user} onLogout={()=>setUser(null)}/>
    : <LoginScreen onLogin={setUser}/>;
}
