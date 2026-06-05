import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { 
  LogIn, LogOut, FileText, Clock, Heart, Calendar, CheckCircle,
  ChevronLeft, User, Eye, EyeOff, AlertCircle, Printer, Users, Shield,
  Package, Plus, Trash2, Edit3, Save, X, ArrowRightLeft, PenTool,
  RefreshCw, Search, FolderOpen, Upload, Download, Layers, ClipboardList,
  ChevronRight, Home, Bell, ThumbsUp, ThumbsDown, Star, Target, BarChart2,
  CheckSquare, BookOpen, GraduationCap, BarChart, MessageCircle 
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG
   ═══════════════════════════════════════════════════════════ */
const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";

/* ── Firebase REST helpers ── */
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
      return j?.name;
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

/* ── localStorage fallback ── */
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

/* ── Firebase hook ── */
function useFirebase(path, initial) {
  const [val, setVal] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fb.get(path).then(data => {
      if (data !== null) setVal(data);
      setReady(true);
    });
  }, [path]);
  useEffect(() => {
    const unsub = fb.listen(path, (data) => {
      if (data !== null) setVal(data);
    });
    return unsub;
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
      className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-3 py-2 rounded-xl shadow-sm transition-all active:scale-95 no-print"
    >
      <Printer size={13}/> {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACCOUNTS
   ═══════════════════════════════════════════════════════════ */
const ACCOUNTS = [
  {id:1, username:"i.shawi", password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي", jobNum:"728004", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7801165298"},
  {id:2, username:"o.rubaie", password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه", jobNum:"727466", title:"ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7705559125"},
  {id:3, username:"om.miyahi", password:"1003", name:"عمر طاهر خزعل سبهان المياحي", jobNum:"737283", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7710872949"},
  {id:4, username:"l.rubaie", password:"1004", name:"ليث شاكر حمود زعيتر الربيعه", jobNum:"756571", title:"معاون مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7714991063"},
  {id:5, username:"as.nassari", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري", jobNum:"790850", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي", edu:"دبلوم", phone:"7709043148"},
  {id:6, username:"sb.nassari", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري", jobNum:"758795", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"صباحي", edu:"دبلوم", phone:"7707315475"},
  {id:7, username:"a.amir", password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير", jobNum:"719242", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم", phone:"7831644210"},
  {id:8, username:"m.mansouri", password:"1008", name:"محمود كاظم هاشم محمد المنصوري", jobNum:"790869", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم", phone:"7703145733"},
  {id:9, username:"m.tamimi", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي", jobNum:"790885", title:"محاسب اقدم", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم", phone:"7808779038"},
  {id:10, username:"m.ali", password:"1010", name:"محمد اسماعيل احمد رمضان العلي", jobNum:"813877", title:"مهندس", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7725549815"},
  {id:11, username:"al.miyahi", password:"1011", name:"علي طاهر خزعل سبهان المياحي", jobNum:"439193", title:"حرفي اقدم", dept:"شعبة المرافئ", shift:"صباحي", edu:"ابتدائية", phone:"7705770208"},
  {id:12, username:"ab.abbada", password:"2001", name:"عبد الله علي زباري يسر عباده", jobNum:"701130", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"بكالوريوس", phone:"7705706145"},
  {id:13, username:"am.ali", password:"2002", name:"امين حميد فاضل حسين العلي", jobNum:"751480", title:"م.مدير فني", dept:"شعبة مستودع الفاو", shift:"مناوبة", group:"A", edu:"دبلوم معهد نفط", phone:"7715949652"},
  {id:14, username:"h.abadi", password:"2003", name:"حسين علي احمد قاسم عبادي", jobNum:"719269", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم", phone:"7712679994"},
  {id:15, username:"j.hussain", password:"2004", name:"جاسم مزعل حاتم ديوان الحسين", jobNum:"719498", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم", phone:"7821188777"},
  {id:16, username:"b.faris", password:"2005", name:"باسم هاشم جاسم هاشم الفارس", jobNum:"719277", title:"م.مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7702792993"},
  {id:17, username:"h.shnawa", password:"2006", name:"هاشم جابر جعفر شناوة عباس", jobNum:"719293", title:"م.مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7732166112"},
  {id:18, username:"ab.eissa", password:"2007", name:"عبد الحميد سامي موسى بدر العيسى", jobNum:"719463", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7705559870"},
  {id:19, username:"ih.dawod", password:"2008", name:"احسان عبد الصمد داود", jobNum:"736732", title:"مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7714658958"},
  {id:20, username:"al.jafar", password:"2009", name:"علاء محسن عذبي جعفر الجعفر", jobNum:"719048", title:"مدير فني", dept:"شعبة مستودع الفاو", shift:"مناوبة", group:"C", edu:"دبلوم", phone:"7803572745"},
  {id:21, username:"al.aidani", password:"2010", name:"علي طارق ياسين مهودر العيداني", jobNum:"735922", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"بكالوريوس", phone:"7703137777"},
  {id:22, username:"al.ali", password:"2011", name:"علي باقر حنتوش مليس العلي", jobNum:"732249", title:"م.ر. مبرمجين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"بكالوريوس", phone:"7706072225"},
  {id:23, username:"y.yaseen", password:"2012", name:"يوسف عباس ياسين احمد ياسين", jobNum:"726508", title:"مدير فني", dept:"شعبة مستودع الفاو", shift:"مناوبة", group:"C", edu:"دبلوم", phone:"7715498830"},
  {id:24, username:"dh.ghanim", password:"2013", name:"ضياء بدر حمادي اسماعيل الغانم", jobNum:"719129", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم", phone:"7718695345"},
  {id:25, username:"ad.atiya", password:"2014", name:"عدنان جواد كاظم جعفر العطية", jobNum:"719099", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم", phone:"7709048893"},
  {id:26, username:"ih.saleem", password:"2015", name:"احسان جواد كاظم حسين السليم", jobNum:"732834", title:"مهندس", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"بكالوريوس", phone:"7705666922"},
  {id:27, username:"h.jasim", password:"2016", name:"حيدر عبد الحسن خضير جاسم", jobNum:"724939", title:"مدير فني", dept:"شعبة المرافئ", shift:"مناوبة", group:"D", edu:"معادل للاعدادية", phone:"7712766100"},
  {id:28, username:"w.mahsen", password:"2017", name:"واثق حسين عبد الشيخ حسن المحسن", jobNum:"718939", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم", phone:"7707040209"},
  {id:29, username:"sd.eissa", password:"2018", name:"صدام عبد الواحد سلمان عيسى العيسى", jobNum:"719005", title:"م.مدير فني", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم", phone:"7712443251"},
  {id:30, username:"ab.mouni", password:"3001", name:"عبد الله عيسى موسى موني", jobNum:"690414", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7735632535"},
  {id:31, username:"ab.eissa2", password:"3002", name:"اباذر صالح عبد الحسين عيسى", jobNum:"689766", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7801446130"},
  {id:32, username:"h.omran", password:"3003", name:"حسن عادل عمران يوسف", jobNum:"690174", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7729488795"},
  {id:33, username:"sj.ali", password:"3004", name:"سجاد علي راضي علي", jobNum:"689331", title:"عقد", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7703283076"},
];

const LEAVE_TYPES = {
  "اعتيادية": { label: "إجازة اعتيادية", color: "bg-blue-600", light: "bg-blue-50 text-blue-700 border-blue-200", max: 30 },
  "مرضية": { label: "إجازة مرضية", color: "bg-rose-600", light: "bg-rose-50 text-rose-700 border-rose-200", max: 15 },
  "زمنية": { label: "إجازة زمنية", color: "bg-amber-600", light: "bg-amber-50 text-amber-700 border-amber-200", max: 7 },
};

function arabicDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
}

function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000) + 1);
}

function toArabicNum(n) {
  return String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
}

/* ═══════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState("");
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
      style={{ background: "linear-gradient(135deg,#0a1628 0%,#0d2348 50%,#0a1628 100%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
        *{font-family:'IBM Plex Sans Arabic','Noto Naskh Arabic',sans-serif;box-sizing:border-box;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadeIn .5s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .8s linear infinite}
      `}</style>
      <div className="w-full max-w-sm fadein">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center"
            style={{ background: "radial-gradient(circle,#1e4080,#0a1e45)" }}>
            <span className="text-white font-bold text-xl tracking-wider">BOC</span>
          </div>
          <h1 className="text-white text-xl font-bold leading-tight">شركة نفط البصرة</h1>
          <p className="text-blue-300 text-xs mt-1 tracking-wide">نظام الإجازات والطلبات الإدارية</p>
        </div>
        <div className="rounded-2xl p-6 border border-white/10"
          style={{ background: "rgba(15,33,71,0.85)", backdropFilter: "blur(20px)" }}>
          <h2 className="text-white text-base font-bold mb-5 text-center">تسجيل الدخول</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-blue-300 mb-1.5">اسم المستخدم</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <User size={15} className="text-blue-400 shrink-0" />
                <input value={user} onChange={e => setUser(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()}
                  placeholder="مثال: i.shawi" className="bg-transparent outline-none text-sm text-slate-200 w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-300 mb-1.5">كلمة المرور</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <input value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()}
                  type={showP ? "text" : "password"} placeholder="••••"
                  className="bg-transparent outline-none text-sm text-slate-200 w-full" />
                <button onClick={() => setShowP(p => !p)} className="text-blue-400 hover:text-blue-200 shrink-0">
                  {showP ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {err && (
              <div className="flex items-center gap-2 bg-red-950/60 border border-red-700/50 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-300 text-xs">{err}</p>
              </div>
            )}
            <button onClick={handle} disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#1e40af)" }}>
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin" /> : <><LogIn size={15} /> دخول</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEAVE REQUEST FORM
   ═══════════════════════════════════════════════════════════ */
function LeaveForm({ emp, onSubmit, onCancel, history }) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState("اعتيادية");
  const [dateFrom, setFrom] = useState(today);
  const [dateTo, setTo] = useState(today);
  const [purpose, setPurpose] = useState("");
  const [isAbroad, setAbroad] = useState(false);
  const [err, setErr] = useState("");
  const [warnings, setWarnings] = useState([]);
  
  const days = daysBetween(dateFrom, dateTo);
  const cfg = LEAVE_TYPES[type];
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthlyStats = useMemo(() => {
    const stats = { "اعتيادية": 0, "مرضية": 0, "زمنية": 0, total: 0 };
    (Array.isArray(history) ? history : []).forEach(h => {
      const d = new Date(h.submittedAt);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        stats[h.type] = (stats[h.type] || 0) + h.days;
        stats.total += h.days;
      }
    });
    return stats;
  }, [history, thisMonth, thisYear]);

  useEffect(() => {
    const w = [];
    if (type === "اعتيادية" && days > 3) {
      w.push({ level: "orange", icon: "⚠️", title: "يلزم موافقة مدير القسم", body: `مدة الإجازة المطلوبة (${days} أيام) تتجاوز الحد المحدد (٣ أيام متواصلة).` });
    }
    if (isAbroad) {
      w.push({ level: "red", icon: "🛂", title: "يلزم موافقة مدير الهيأة والأمر الإداري", body: "الإجازة خارج العراق تتطلب موافقة رسمية قبل السفر." });
    }
    setWarnings(w);
  }, [type, days, isAbroad]);

  const handleSubmit = () => {
    if (!purpose.trim()) { setErr("يرجى تحديد غرض الإجازة"); return; }
    if (days > cfg.max) { setErr(`الحد الأقصى للإجازة هو ${cfg.max} يوم`); return; }
    onSubmit({ type, dateFrom, dateTo, days, purpose, isAbroad, warnings: warnings.map(w => w.title) });
  };

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"><ChevronLeft size={18} /></button>
        <div>
          <h2 className="text-base font-bold text-slate-800">نموذج طلب إجازة</h2>
          <p className="text-xs text-slate-500">BOC-P-13/F13</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-4">
        <div className="grid grid-cols-3 gap-2">
          {["اعتيادية", "مرضية", "زمنية"].map(k => (
            <div key={k} className="border rounded-xl p-3 bg-slate-50">
              <p className="text-[10px] font-bold text-slate-500">{k}</p>
              <p className="text-lg font-bold text-slate-800">{toArabicNum(monthlyStats[k] || 0)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">التاريخ: {arabicDate(today)}</span>
          <div className="flex gap-1">
            {Object.keys(LEAVE_TYPES).map(k => (
              <button key={k} onClick={() => setType(k)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${type === k ? "bg-blue-600 text-white border-transparent" : "bg-white text-slate-600 border-slate-200"}`}>{k}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">من تاريخ</label>
            <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={e => setTo(e.target.value)} min={dateFrom} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">السبب / الغرض</label>
          <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="اكتب الغرض..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <div onClick={() => setAbroad(p => !p)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${isAbroad ? "border-red-400 bg-red-50" : "border-slate-200"}`}>
          <input type="checkbox" checked={isAbroad} readOnly className="pointer-events-none" />
          <p className="text-xs font-bold text-slate-700">🛂 الإجازة خارج العراق / تتضمن موافقة سفر</p>
        </div>
        {err && <p className="text-xs text-red-500 font-bold">{err}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 text-xs font-bold bg-slate-100 rounded-xl text-slate-600">إلغاء</button>
          <button onClick={handleSubmit} className="flex-1 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl">تقديم الطلب</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEAVE RECEIPT
   ═══════════════════════════════════════════════════════════ */
function LeaveReceipt({ emp, leave, onClose }) {
  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-2">
        <CheckCircle className="text-emerald-600" size={18} />
        <p className="text-xs font-bold text-emerald-800">تم إرسال طلبك بنجاح وجاري مراجعته من الإدارة.</p>
      </div>
      <div id="print-leave" className="bg-white rounded-2xl border p-6 space-y-4">
        <h3 className="font-bold text-center border-b pb-2 text-slate-800">وصل استلام طلب إجازة</h3>
        <p className="text-xs text-slate-600">اسم الموظف: <strong>{emp.name}</strong></p>
        <p className="text-xs text-slate-600">نوع الإجازة: <strong>{leave.type}</strong></p>
        <p className="text-xs text-slate-600">المدة: <strong>{leave.days} يوم</strong></p>
        <p className="text-xs text-slate-600">من: <strong>{arabicDate(leave.dateFrom)}</strong> إلى: <strong>{arabicDate(leave.dateTo)}</strong></p>
      </div>
      <button onClick={onClose} className="mt-4 w-full py-2 bg-slate-800 text-white text-xs font-bold rounded-xl">العودة للرئيسية</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADMIN --- EMPLOYEE MANAGER
   ═══════════════════════════════════════════════════════════ */
function EmployeeManager({ employees, setEmployees }) {
  const [search, setSearch] = useState("");
  return (
    <div className="bg-white rounded-2xl border p-4 shadow-sm" dir="rtl">
      <div className="mb-4 flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث عن موظف..." className="w-full border rounded-xl px-3 py-2 text-xs outline-none" />
      </div>
      <div className="overflow-x-auto text-xs">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="p-2">الاسم</th><th className="p-2">الرقم الوظيفي</th><th className="p-2">القسم</th>
            </tr>
          </thead>
          <tbody>
            {employees.filter(e => e.name.includes(search)).map(e => (
              <tr key={e.id} className="border-b">
                <td className="p-2 font-bold">{e.name}</td><td className="p-2 font-mono">{e.jobNum}</td><td className="p-2">{e.dept}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MATERIAL REQUEST
   ═══════════════════════════════════════════════════════════ */
function MaterialRequest({ emp }) {
  return (
    <div className="bg-white rounded-2xl border p-6 max-w-2xl mx-auto text-center" dir="rtl">
      <Package className="mx-auto text-blue-600 mb-2" size={32} />
      <h3 className="font-bold text-slate-800">طلب مواد من المخزن (BOC-P-07/F09)</h3>
      <p className="text-xs text-slate-400 mt-1">هذه الخدمة قيد التطوير والربط مع التوقيع الإلكتروني الخاص بشركة نفط البصرة.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOGIN HISTORY
   ═══════════════════════════════════════════════════════════ */
function LoginHistoryPage() {
  return (
    <div className="bg-white rounded-2xl border p-6 text-center" dir="rtl">
      <Clock className="mx-auto text-slate-500 mb-2" size={32} />
      <p className="text-xs text-slate-500">سجل الدخول متاح للمشرف العام فقط من خلال قاعدة البيانات المباشرة.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APPROVAL PAGE
   ═══════════════════════════════════════════════════════════ */
function ApprovalPage({ allRequests, onApprove }) {
  const [noteModal, setNoteModal] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const pending = allRequests.filter(r => r.status === "بانتظار المراجعة");
  
  const doApprove = (id) => { 
    // نفتح مودال لكتابة تقرير/ملاحظات حتى عند الموافقة (اختياري) أو نمررها مباشرة
    onApprove(id, "approve", "تمت الموافقة وتدقيق متطلبات العمل الأساسية."); 
  };
  
  const doReject = (id) => { setNoteModal(id); setAdminNote(""); };
  
  const confirmReject = () => {
    if (noteModal) { 
      onApprove(noteModal, "reject", adminNote || "تم الرفض لمتطلبات مصلحة العمل"); 
      setNoteModal(null); 
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-sm font-bold text-slate-800">الطلبات الواردة المتوقفة على موافقتك</h3>
      {pending.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center text-slate-400 text-xs">لا توجد طلبات معلقة حالياً.</div>
      ) : (
        pending.map(req => (
          <div key={req.id} className="bg-white rounded-2xl border p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <p className="font-bold text-slate-900 text-xs">{req.empName} ({req.type})</p>
              <p className="text-[11px] text-slate-500 mt-1">المدة: {req.days} أيام | من: {req.dateFrom} إلى: {req.dateTo}</p>
              <p className="text-[11px] text-slate-400">الغرض: {req.purpose}</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => doApprove(req.id)} className="flex-1 md:flex-none bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"><ThumbsUp size={12} /> موافقة</button>
              <button onClick={() => doReject(req.id)} className="flex-1 md:flex-none bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"><ThumbsDown size={12} /> رفض</button>
            </div>
          </div>
        ))
      )}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-right">
            <h4 className="font-bold text-slate-800 text-xs mb-2">إضافة تقرير / سبب الرفض</h4>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3} placeholder="اكتب الملاحظة أو التقرير هنا ليتم إعلام الموظف وحفظه في تاريخ طلباته..." className="w-full border rounded-xl p-2 text-xs resize-none mb-3 outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setNoteModal(null)} className="flex-1 bg-slate-100 py-2 rounded-xl text-xs text-slate-600">إلغاء</button>
              <button onClick={confirmReject} className="flex-1 bg-red-600 py-2 rounded-xl text-xs text-white font-bold">تأكيد القرار</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════ */
export default function App() {
  const [emp, setEmp] = useState(null);
  if (!emp) return <LoginScreen onLogin={setEmp} />;
  return <Dashboard emp={emp} onLogout={() => setEmp(null)} />;
}

function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const [receipt, setReceipt] = useState(null);
  
  const [allRequests, setAllRequests] = useFirebase("requests", []);
  const [employees, setEmployees] = useFirebase("employees", ACCOUNTS);
  const [notifications, setNotifications] = useFirebase(`notifications/${emp.id}`, []);
  const [history, setHistory] = useFirebase(`history/${emp.id}`, []);
  
  const isAdmin = emp.username === "i.shawi";

  const unreadCount = useMemo(() =>
    (Array.isArray(notifications) ? notifications : []).filter(n => !n.read).length
  , [notifications]);

  const pendingCount = useMemo(() =>
    (Array.isArray(allRequests) ? allRequests : []).filter(r => r.status === "بانتظار المراجعة").length
  , [allRequests]);

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
      adminNote: "" // افتراضياً لا يوجد تقرير حتى يقرره المسؤول
    };
    
    setHistory([rec, ...(Array.isArray(history) ? history : [])]);
    setAllRequests([rec, ...(Array.isArray(allRequests) ? allRequests : [])]);
    
    // إشعار للمسؤول بوجود طلب
    const adminNotif = {
      id: Date.now() + 1,
      type: "طلب_جديد",
      title: "🔔 طلب إجازة جديد وارد",
      body: `الموظف: ${emp.name} طلب ${leave.type} لمدة ${leave.days} أيام.`,
      timestamp: new Date().toISOString(),
      read: false
    };
    fb.get("notifications/1").then(ex => {
      fb.set("notifications/1", [adminNotif, ...(Array.isArray(ex) ? ex : [])]);
    });
    setReceipt(rec);
    setView("receipt");
  };

  // الميزة المطلوبة: معالجة القرار + حفظ النتيجة والتقرير في تاريخ الموظف + إرسال إشعار فوري له
  const handleApproval = useCallback((reqId, decision, adminNote = "") => {
    const newStatus = decision === "approve" ? "موافق عليها" : "مرفوضة";
    const timestamp = new Date().toISOString();
    const req = (Array.isArray(allRequests) ? allRequests : []).find(r => r.id === reqId);
    if (!req) return;

    // 1. تحديث الطلب في السجل العام لطلبات الشركة
    setAllRequests((Array.isArray(allRequests) ? allRequests : []).map(r =>
      r.id === reqId ? { ...r, status: newStatus, decidedAt: timestamp, decidedBy: emp.name, adminNote } : r
    ));

    // 2. تحديث وحفظ النتيجة والتقرير فورياً في تاريخ طلبات الموظف (على صفحته)
    fb.get(`history/${req.empId}`).then(empHist => {
      const prev = Array.isArray(empHist) ? empHist : [];
      const updated = prev.map(h =>
        h.id === reqId ? { ...h, status: newStatus, decidedAt: timestamp, decidedBy: emp.name, adminNote } : h
      );
      fb.set(`history/${req.empId}`, updated);
    });

    // 3. إرسال إشعار فوري لإعلام الموظف بنتيجة طلبه وتقريره
    const empNotif = {
      id: Date.now(),
      type: decision === "approve" ? "موافقة" : "رفض",
      title: decision === "approve" ? "✅ تمت الموافقة على طلبك" : "❌ تم رفض طلبك الإداري",
      body: `نوع الإجازة: ${req.type} | النتيجة: ${newStatus} ${adminNote ? `| تقرير الإدارة: ${adminNote}` : ""}`,
      timestamp,
      read: false
    };
    fb.get(`notifications/${req.empId}`).then(existing => {
      fb.set(`notifications/${req.empId}`, [empNotif, ...(Array.isArray(existing) ? existing : [])]);
    });
  }, [allRequests, emp]);

  const markNotificationsRead = () => {
    setNotifications((Array.isArray(notifications) ? notifications : []).map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" dir="rtl">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-4 text-center">
            <p className="text-xs font-bold text-blue-400">شركة نفط البصرة</p>
            <p className="text-sm font-bold text-white truncate mt-1">{emp.name.split(" ").slice(0, 3).join(" ")}</p>
            <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full mt-2 inline-block border border-blue-800">{emp.title} · {emp.shift}</span>
          </div>
          <nav className="space-y-1">
            <button onClick={() => { setView("home"); }} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${view === "home" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><Home size={14} /> لوحة التحكم والرئيسية</button>
            <button onClick={() => { setView("form"); }} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${view === "form" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><FileText size={14} /> تقديم طلب إجازة جديد</button>
            <button onClick={() => { setView("material"); }} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${view === "material" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><Package size={14} /> طلب مواد من المخزن</button>
            
            {/* تبويب الإشعارات المطور لاستلام التنبيهات والقرارات فوراً */}
            <button onClick={() => { setView("notifications"); markNotificationsRead(); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${view === "notifications" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
              <span className="flex items-center gap-2"><Bell size={14} /> الإشعارات ونتائج الطلبات</span>
              {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-sans">{unreadCount}</span>}
            </button>

            {isAdmin && (
              <div className="border-t border-slate-800 pt-3 mt-3 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 px-3 mb-1">صلاحيات المسؤول</p>
                <button onClick={() => { setView("approvals"); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${view === "approvals" ? "bg-amber-600 text-white" : "text-amber-400 hover:bg-slate-800"}`}>
                  <span className="flex items-center gap-2"><Shield size={14} /> إدارة الموافقات والتقارير</span>
                  {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-sans">{pendingCount}</span>}
                </button>
                <button onClick={() => { setView("employees"); }} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${view === "employees" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><Users size={14} /> كادر الشعبة</button>
                <button onClick={() => { setView("history_log"); }} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${view === "history_log" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><Clock size={14} /> سجلات الدخول</button>
              </div>
            )}
          </nav>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/30 transition-colors mt-6"><LogOut size={14} /> تسجيل الخروج</button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {view === "home" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border p-4 shadow-sm">
              <h2 className="text-base font-bold text-slate-800">أهلاً بك، {emp.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">قسم السيطرة والنظم — نظام الحوكمة والإجازات الرقمي المباشر.</p>
            </div>
            
            {/* تاريخ الطلبات مع الميزة الجديدة: إظهار النتيجة المحفوظة والتقرير مباشرة في صفحة الموظف */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-xs">تاريخ طلباتي ونتائجها المحفوظة</h3>
                <span className="text-[11px] text-slate-400">إجمالي الطلبات: {toArabicNum((Array.isArray(history) ? history : []).length)}</span>
              </div>
              <div className="p-2 space-y-2">
                {(Array.isArray(history) ? history : []).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">لا يوجد طلبات سابقة في أرشيفك الشخصي.</p>
                ) : (
                  (Array.isArray(history) ? history : []).map(h => (
                    <div key={h.id} className="border rounded-xl p-3 bg-slate-50/50 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{h.type} — {h.days} أيام</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          h.status === "موافق عليها" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                          h.status === "مرفوضة" ? "bg-red-100 text-red-800 border-red-200" :
                          "bg-amber-100 text-amber-800 border-amber-200"
                        }`}>{h.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">الفترة: من {h.dateFrom} إلى {h.dateTo} | لغرض: {h.purpose}</p>
                      
                      {/* عرض التقرير الإداري المحفوظ والمقترن بالطلب في صفحة الموظف بشكل دائم */}
                      {h.adminNote && (
                        <div className="text-[11px] bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 mt-1 shadow-sm">
                          <span className="font-bold text-blue-700">📋 تقرير وملاحظات الإدارة:</span> {h.adminNote}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* عرض صندوق الإشعارات والنتائج للموظف */}
        {view === "notifications" && (
          <div className="space-y-3 max-w-2xl mx-auto" dir="rtl">
            <h3 className="text-xs font-bold text-slate-800 mb-2">صندوق إشعارات الطلبات والنتائج</h3>
            {(Array.isArray(notifications) ? notifications : []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8 bg-white border rounded-2xl">لا توجد إشعارات أو قرارات صادرة حديثاً.</p>
            ) : (
              (Array.isArray(notifications) ? notifications : []).map(n => (
                <div key={n.id} className="p-4 rounded-xl border bg-white shadow-sm flex items-start gap-3">
                  <div className="text-lg">{n.type === "موافقة" ? "✅" : "❌"}</div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.body}</p>
                    <span className="text-[9px] text-slate-400 block mt-2">{new Date(n.timestamp).toLocaleString("ar-IQ")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "form" && <LeaveForm emp={emp} history={history} onSubmit={handleSubmit} onCancel={() => setView("home")} />}
        {view === "receipt" && receipt && <LeaveReceipt emp={emp} leave={receipt} onClose={() => setView("home")} />}
        {view === "material" && <MaterialRequest emp={emp} />}
        {view === "approvals" && isAdmin && <ApprovalPage allRequests={allRequests} onApprove={handleApproval} />}
        {view === "employees" && isAdmin && <EmployeeManager employees={employees} setEmployees={setEmployees} />}
        {view === "history_log" && isAdmin && <LoginHistoryPage />}
      </div>
    </div>
  );
}