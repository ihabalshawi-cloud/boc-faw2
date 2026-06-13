import { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from "react";
import {
  LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User,
  CheckCircle, Wifi, WifiOff, FileText, Clock, Calendar,
  Bell, ThumbsUp, ThumbsDown, Plus, Trash2, Edit3, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star,
  Printer, Download, Search, Moon, Sun, MessageSquare,
  CheckSquare, AlertTriangle, ChevronLeft,
  Send, Wrench, Box, TrendingUp, TrendingDown, Heart, UserPlus
} from "lucide-react";
// No external chart library — pure SVG charts below

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
const MONTHS_IRAQI = ["كانون الثاني","شباط","آذار","نيسان","أيار","حزيران","تموز","آب","أيلول","تشرين الأول","تشرين الثاني","كانون الأول"];
const PROCEDURE_TYPES = ["الامراض المستعصية","العمليات الصغرى","العمليات الوسطى","العمليات الكبرى","العمليات فوق الكبرى","معالجة اسنان","اشعة وسونار","نظارات طبية","تحاليل مختبرية","الرنين والمفراس/الايكو/تخطيط القلب","العلاجات (الادوية)","اجور الطبيب"];
const MARITAL_STATUS_LIST = ["متزوج","أعزب","مطلق","أرمل"];

const INITIAL_EQUIPMENT = [
  { id:"P-001", name:"مضخة خام رئيسية 1",  type:"PUMP",       location:"محطة الضخ الرئيسية", status:"جيد",          lastMaintenance:"2024-01-15", nextMaintenance:"2024-04-15", critical:false, totalFailures:2 },
  { id:"P-002", name:"مضخة خام رئيسية 2",  type:"PUMP",       location:"محطة الضخ الرئيسية", status:"جيد",          lastMaintenance:"2024-01-15", nextMaintenance:"2024-04-15", critical:false, totalFailures:1 },
  { id:"P-003", name:"مضخة نقل 1",          type:"PUMP",       location:"محطة النقل",          status:"تحتاج صيانة",  lastMaintenance:"2024-02-01", nextMaintenance:"2024-03-15", critical:true,  totalFailures:4 },
  { id:"P-004", name:"مضخة نقل 2",          type:"PUMP",       location:"محطة النقل",          status:"جيد",          lastMaintenance:"2024-02-10", nextMaintenance:"2024-05-10", critical:false, totalFailures:1 },
  { id:"T-001", name:"خزان نفط خام 1",      type:"TANK",       location:"منطقة الخزانات",      status:"جيد",          lastMaintenance:"2024-01-20", nextMaintenance:"2024-04-20", critical:false, totalFailures:0 },
  { id:"T-002", name:"خزان نفط خام 2",      type:"TANK",       location:"منطقة الخزانات",      status:"جيد",          lastMaintenance:"2024-01-20", nextMaintenance:"2024-04-20", critical:false, totalFailures:1 },
  { id:"DP-001",name:"مضخة تصريف ماء 1",    type:"DRAIN_PUMP", location:"منطقة التصريف",       status:"جيد",          lastMaintenance:"2024-01-25", nextMaintenance:"2024-04-25", critical:false, totalFailures:0 },
  { id:"DP-002",name:"مضخة تصريف ماء 2",    type:"DRAIN_PUMP", location:"منطقة التصريف",       status:"معطل",         lastMaintenance:"2024-02-20", nextMaintenance:"2024-02-28", critical:true,  totalFailures:3 },
];

const INITIAL_MAINT_SPARE_PARTS = [
  { id:"SP-001", code:"BRG-001", name:"رولمان بلي 6204",      category:"ميكانيكية",       qty:8,  minAlert:2, unit:"قطعة", price:25, location:"الرف A1"      },
  { id:"SP-002", code:"OIL-001", name:"زيت تشحيم (20 لتر)",   category:"مواد استهلاكية", qty:12, minAlert:3, unit:"لتر",  price:15, location:"المستودع B2"  },
  { id:"SP-003", code:"FLT-001", name:"فلتر زيت",              category:"فلتر",            qty:5,  minAlert:2, unit:"قطعة", price:12, location:"الرف C3"      },
];

const EQ_STATUS_COLORS = { "جيد":"bg-emerald-100 text-emerald-700", "تحتاج صيانة":"bg-amber-100 text-amber-700", "تحت صيانة":"bg-blue-100 text-blue-700", "معطل":"bg-red-100 text-red-700" };

// ========== الأدوات المشتركة ==========
const storage = {
  get: (key, def = null) => { try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : def; } catch { return def; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; } }
};
// كلمات المرور: sessionStorage للجلسة الحالية + localStorage للاستمرارية
const passStore = {
  get: (key) => {
    try {
      const s = sessionStorage.getItem(key);
      if (s) return JSON.parse(s);
      const l = localStorage.getItem(key);
      return l ? JSON.parse(l) : null;
    } catch { return null; }
  },
  set: (key, val) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(val));
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch { return false; }
  }
};

// ========== نظام الإشعارات الفورية ==========
const ToastContext = createContext(null);
const useToast = () => useContext(ToastContext);

const TOAST_CFG = {
  success: { bg: "bg-emerald-500", icon: "✅" },
  error:   { bg: "bg-red-500",     icon: "❌" },
  warning: { bg: "bg-amber-500",   icon: "⚠️" },
  info:    { bg: "bg-blue-500",    icon: "ℹ️" },
};

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info", ms = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);
  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2 pointer-events-none" dir="rtl">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-2xl pointer-events-auto min-w-[240px] max-w-xs ${TOAST_CFG[t.type].bg}`}>
            <span>{TOAST_CFG[t.type].icon}</span>
            <span className="text-sm font-medium flex-1">{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-70 hover:opacity-100 shrink-0"><X size={14}/></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ========== مودال تأكيد الإجراءات ==========
const ConfirmContext = createContext(null);
const useConfirm = () => useContext(ConfirmContext);

function ConfirmProvider({ children }) {
  const [dlg, setDlg] = useState(null);
  const confirm = useCallback((msg, opts = {}) =>
    new Promise(resolve => setDlg({ msg, opts, resolve }))
  , []);
  const close = (val) => { dlg?.resolve(val); setDlg(null); };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dlg && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4" dir="rtl">
          <div className="card rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-color">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${dlg.opts.danger ? "bg-red-100" : "bg-blue-100"}`}>
                <AlertTriangle size={20} className={dlg.opts.danger ? "text-red-600" : "text-blue-600"}/>
              </div>
              <h3 className="font-bold text-base">{dlg.opts.title || "تأكيد الإجراء"}</h3>
            </div>
            <p className="text-sm text-secondary mb-6 leading-relaxed">{dlg.msg}</p>
            <div className="flex gap-3">
              <button onClick={() => close(false)} className="flex-1 py-2.5 border border-color rounded-xl text-sm font-medium hover:bg-hover transition-colors">إلغاء</button>
              <button onClick={() => close(true)} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors ${dlg.opts.danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {dlg.opts.ok || "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// ========== مكونات الهيكل العظمي (Loading Skeleton) ==========
function Skel({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`}/>;
}
function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card rounded-2xl p-4 border border-color space-y-3">
      <Skel className="h-4 w-3/4"/>
      {lines > 1 && <Skel className="h-3 w-full"/>}
      {lines > 2 && <Skel className="h-3 w-1/2"/>}
    </div>
  );
}
function SkeletonMsg({ mine }) {
  return (
    <div className={`flex gap-2 mb-3 ${mine ? "flex-row-reverse" : ""}`}>
      <Skel className="h-8 w-8 rounded-full shrink-0"/>
      <div className={`space-y-1 ${mine ? "items-end flex flex-col" : ""}`}>
        <Skel className="h-3 w-20"/><Skel className="h-10 w-48 rounded-xl"/>
      </div>
    </div>
  );
}

// ========== بطاقة الموظف السريعة ==========
function EmpPopover({ emp, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  if (!emp) return <span>{children}</span>;
  return (
    <span ref={ref} className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="font-medium hover:text-blue-600 hover:underline transition-colors">
        {children}
      </button>
      {open && (
        <div className="absolute z-[150] card rounded-2xl shadow-2xl border border-color p-4 min-w-[220px] top-full mt-1 right-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">{emp.name?.[0]}</span>
            </div>
            <div><p className="font-bold text-sm">{emp.name}</p><p className="text-xs text-secondary">{emp.jobNum}</p></div>
          </div>
          <div className="space-y-1.5 text-xs border-t border-color pt-2">
            <div className="flex justify-between gap-2"><span className="text-secondary">المنصب</span><span className="font-medium text-left">{emp.title}</span></div>
            <div className="flex justify-between gap-2"><span className="text-secondary shrink-0">القسم</span><span className="font-medium text-left text-[11px]">{emp.dept}</span></div>
            <div className="flex justify-between gap-2"><span className="text-secondary">الدوام</span><span className="font-medium">{emp.shift || "—"}</span></div>
          </div>
        </div>
      )}
    </span>
  );
}

// ========== البحث العالمي ==========
const VIEW_LABELS = {
  home:"الرئيسية", analytics:"التحليلات", requests:"طلبات الإجازة",
  attendance:"الحضور والانصراف", training:"التدريب", tasks:"المهام",
  inventory:"المخزون", furniture:"الأثاث", maint_equipment:"صيانة المعدات",
  maint_parts:"قطع الغيار", maint_reports:"تقارير الصيانة",
  chat:"الدردشة الداخلية", evaluation:"التقييم", notifications:"الإشعارات",
  audit:"سجل التعديلات", changepass:"تغيير كلمة المرور",
  employees:"إدارة الموظفين", approvals:"الموافقات",
  health_insurance:"الضمان الصحي",
  leave_forms:"نماذج الإجازات",
};

function GlobalSearch({ setView, onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const results = useMemo(() => {
    const ql = q.trim();
    if (ql.length < 2) return [];
    const out = [];
    ACCOUNTS.filter(e => e.name.includes(ql) || e.jobNum.includes(ql)).slice(0,4)
      .forEach(e => out.push({ type:"موظف", label:e.name, sub:e.dept, view:"employees", icon:"👤" }));
    storage.get("all_requests",[]).filter(r => r.empName?.includes(ql)||r.purpose?.includes(ql)).slice(0,3)
      .forEach(r => out.push({ type:"إجازة", label:r.empName, sub:`${r.type} — ${r.status}`, view:"requests", icon:"📋" }));
    storage.get("tasks_system",[]).filter(t => t.title?.includes(ql)||t.desc?.includes(ql)).slice(0,3)
      .forEach(t => out.push({ type:"مهمة", label:t.title, sub:t.status, view:"tasks", icon:"✅" }));
    storage.get("inventory_items",[]).filter(i => i.name.includes(ql)||i.code.includes(ql)).slice(0,3)
      .forEach(i => out.push({ type:"مخزون", label:i.name, sub:i.code, view:"inventory", icon:"📦" }));
    storage.get("maint_spare_parts",[]).filter(p => p.name.includes(ql)||p.code?.includes(ql)).slice(0,3)
      .forEach(p => out.push({ type:"قطعة غيار", label:p.name, sub:p.category, view:"maint_parts", icon:"🔧" }));
    return out.slice(0,10);
  }, [q]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[400] flex items-start justify-center pt-16 px-4" dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card rounded-2xl shadow-2xl border border-color w-full max-w-lg">
        <div className="flex items-center gap-3 p-4 border-b border-color">
          <Search size={18} className="text-secondary shrink-0"/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="ابحث عن موظف، طلب، مهمة، صنف..." className="flex-1 bg-transparent outline-none text-sm"/>
          <button onClick={onClose} className="text-secondary hover:text-primary"><X size={16}/></button>
        </div>
        {q.trim().length >= 2 ? (
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0
              ? <p className="text-center text-secondary text-sm py-8">لا توجد نتائج لـ «{q}»</p>
              : results.map((r,i) => (
                <button key={i} onClick={() => { setView(r.view); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover text-right border-b border-color last:border-0 transition-colors">
                  <span className="text-lg shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    <p className="text-xs text-secondary truncate">{r.sub}</p>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">{r.type}</span>
                </button>
              ))
            }
          </div>
        ) : (
          <p className="p-4 text-center text-secondary text-xs">
            اكتب حرفين للبدء &nbsp;•&nbsp; <kbd className="px-1.5 py-0.5 bg-hover rounded text-[10px] font-mono">Esc</kbd> للإغلاق
          </p>
        )}
      </div>
    </div>
  );
}

// SHA-256 عبر Web Crypto API (مدمج في المتصفح — لا مكتبات خارجية)
const PASS_SALT = "BOC_FAW_SCADA_2025#";
async function hashPassword(plain) {
  const data = new TextEncoder().encode(PASS_SALT + plain);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
// هل النص هو hash SHA-256 مخزّن مسبقاً؟ (64 حرف hex)
const isHash = s => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);

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

// ========== Firebase API ==========
const FirebaseAPI = {
  checkConnection: async () => {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      // أي رد من الخادم (حتى 403) يعني الاتصال موجود — فقط الخطأ الشبكي يعني انقطاع
      const res = await fetch(`${FIREBASE_URL}/chat.json?limitToLast=1`, { signal: ctrl.signal });
      clearTimeout(tid);
      return res.status < 500;
    } catch { return false; }
  },

  // ── كلمات المرور ──────────────────────────────────────────────────────────
  savePassword: async (empId, hash) => {
    try { await fetch(`${FIREBASE_URL}/passwords/${empId}.json`, { method: "PUT", body: JSON.stringify(hash) }); return true; } catch { return false; }
  },
  getPassword: async (empId) => {
    try { const res = await fetch(`${FIREBASE_URL}/passwords/${empId}.json`); if (!res.ok) return null; const d = await res.json(); return typeof d === "string" ? d : null; } catch { return null; }
  },

  // ── بيانات الحسابات (مخفية في Firebase) ────────────────────────────────
  // قراءة حساب واحد بالرقم الوظيفي (مسموح بالقراءة لمن يعرف الرقم)
  fetchAccount: async (jobNum) => {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${FIREBASE_URL}/accounts/${jobNum}.json`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) return null;
      const d = await res.json();
      return d && d.id ? d : null;
    } catch { return null; }
  },
  // قراءة الـ hash الافتراضي لأول تسجيل دخول (قبل تغيير كلمة المرور)
  fetchInitHash: async (jobNum) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/init_hashes/${jobNum}.json`);
      if (!res.ok) return null;
      const d = await res.json();
      return typeof d === "string" ? d : null;
    } catch { return null; }
  },
  // ترحيل مرة واحدة: رفع جميع الحسابات + هاشات البداية إلى Firebase
  initializeAccounts: async (accounts) => {
    try {
      const accountsData = {};
      const hashesData   = {};
      for (const acc of accounts) {
        const { password, ...rest } = acc;
        accountsData[acc.jobNum] = rest;
        hashesData[acc.jobNum]   = await hashPassword(password); // hash كلمة المرور الافتراضية
      }
      const [r1, r2] = await Promise.all([
        fetch(`${FIREBASE_URL}/accounts.json`,    { method: "PUT", body: JSON.stringify(accountsData) }),
        fetch(`${FIREBASE_URL}/init_hashes.json`, { method: "PUT", body: JSON.stringify(hashesData)   }),
      ]);
      return r1.ok && r2.ok;
    } catch { return false; }
  },

  // ── الدردشة ───────────────────────────────────────────────────────────────
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

// ========== قفل تسجيل الدخول ==========
const LOCK_LIMIT    = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 دقيقة

function getLockInfo(jobNum) {
  return storage.get(`login_lock_${jobNum}`) || { count: 0, lockedUntil: 0 };
}
function recordFail(jobNum) {
  const d = getLockInfo(jobNum);
  const count = d.count + 1;
  storage.set(`login_lock_${jobNum}`, {
    count,
    lockedUntil: count >= LOCK_LIMIT ? Date.now() + LOCK_DURATION : d.lockedUntil,
  });
  return count >= LOCK_LIMIT;
}
function clearLockData(jobNum) {
  storage.set(`login_lock_${jobNum}`, { count: 0, lockedUntil: 0 });
}
function lockSecsRemaining(jobNum) {
  const { lockedUntil } = getLockInfo(jobNum);
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
}
function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ========== شاشة تسجيل الدخول ==========
function LoginScreen({ onLogin, dark }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockSecs, setLockSecs] = useState(0);
  const lockTimer = useRef(null);
  const { isConnected } = useConnectionStatus();

  const startCountdown = useCallback((secs) => {
    setLockSecs(secs);
    if (lockTimer.current) clearInterval(lockTimer.current);
    lockTimer.current = setInterval(() => {
      setLockSecs(prev => {
        if (prev <= 1) { clearInterval(lockTimer.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (!user.trim()) { setLockSecs(0); return; }
    const secs = lockSecsRemaining(user.trim());
    if (secs > 0) startCountdown(secs);
    else setLockSecs(0);
  }, [user, startCountdown]);

  useEffect(() => () => { if (lockTimer.current) clearInterval(lockTimer.current); }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("boc_session");
      if (saved) {
        const { acctId, expiry } = JSON.parse(saved);
        if (expiry > Date.now()) {
          // حاول استرداد بيانات المستخدم من الكاش المحلي أولاً ثم ACCOUNTS
          const cached = storage.get(`cached_account_${acctId}`);
          const a = cached || ACCOUNTS.find(x => x.id === acctId);
          if (a) onLogin(a);
        } else sessionStorage.removeItem("boc_session");
      }
    } catch {}
  }, [onLogin]);

  const handleLogin = async () => {
    setErr("");
    if (!user || !pass) { setErr("أدخل الرقم الوظيفي وكلمة المرور"); return; }

    const remaining = lockSecsRemaining(user.trim());
    if (remaining > 0) { startCountdown(remaining); setErr(`الحساب مقفل. حاول بعد ${fmtTime(remaining)}`); return; }

    setLoading(true);

    // ── 1. جلب بيانات الحساب ───────────────────────────────────────────────
    // الأولوية: Firebase ← كاش localStorage ← ACCOUNTS (احتياطي)
    let account = null;
    if (isConnected) {
      const fb = await FirebaseAPI.fetchAccount(user.trim());
      if (fb) {
        account = fb;
        storage.set(`cached_account_${fb.id}`, fb); // كاش للعمل أوف-لاين
      }
    }
    if (!account) account = storage.get(`cached_account_${user.trim()}`)
                         || ACCOUNTS.find(a => a.jobNum === user.trim());
    if (!account) { setErr("الرقم الوظيفي غير موجود"); setLoading(false); return; }

    // ── 2. التحقق من كلمة المرور ───────────────────────────────────────────
    let isValid = false;
    const inputHash = await hashPassword(pass.trim());
    const localPass = passStore.get(`pass_${account.id}`);

    if (localPass) {
      if (isHash(localPass)) {
        isValid = inputHash === localPass;
      } else {
        // ترقية تلقائية من نص إلى hash
        isValid = pass.trim() === localPass;
        if (isValid) {
          passStore.set(`pass_${account.id}`, inputHash);
          if (isConnected) await FirebaseAPI.savePassword(account.id, inputHash);
        }
      }
    } else if (isConnected) {
      // حاول /passwords/{id} أولاً (كلمة مرور مغيّرة)
      const fp = await FirebaseAPI.getPassword(account.id);
      if (fp) {
        isValid = isHash(fp) ? inputHash === fp : pass.trim() === fp;
        if (isValid) {
          const toStore = isHash(fp) ? fp : inputHash;
          passStore.set(`pass_${account.id}`, toStore);
          if (!isHash(fp)) await FirebaseAPI.savePassword(account.id, inputHash);
        }
      } else {
        // حاول /init_hashes/{jobNum} (كلمة المرور الافتراضية المشفّرة في Firebase)
        const initH = await FirebaseAPI.fetchInitHash(user.trim());
        if (initH) {
          isValid = inputHash === initH;
          if (isValid) passStore.set(`pass_${account.id}`, initH); // احفظ للجلسات القادمة
        } else {
          // احتياطي نهائي: ابحث في ACCOUNTS (الحساب من Firebase لا يحتوي password)
          const def = (ACCOUNTS.find(a => a.jobNum === user.trim()) || account).password || "";
          isValid = pass.trim() === def;
          if (isValid) passStore.set(`pass_${account.id}`, inputHash);
        }
      }
    } else {
      // غير متصل — الاحتياطي المحلي
      const def = (ACCOUNTS.find(a => a.jobNum === user.trim()) || account).password || "";
      isValid = pass.trim() === def;
      if (isValid) passStore.set(`pass_${account.id}`, inputHash);
    }

    if (isValid) {
      clearLockData(user.trim());
      sessionStorage.setItem("boc_session", JSON.stringify({ acctId: account.id, expiry: Date.now() + 8 * 3600000 }));
      const defaultPasswords = ["1001","1002","1003","1004","1005","1006","1007","1008","1009","1010","1011","2001","2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012","2013","2014","2015","2016","2017","2018","3001","3002","3003","3004"];
      if (defaultPasswords.includes(pass.trim()) && !localPass) sessionStorage.setItem("force_password_change", "true");
      onLogin(account);
    } else {
      const locked = recordFail(user.trim());
      const secs = lockSecsRemaining(user.trim());
      const { count } = getLockInfo(user.trim());
      if (locked) {
        startCountdown(secs);
        setErr(`تم قفل الحساب لمدة 15 دقيقة بعد ${LOCK_LIMIT} محاولات فاشلة`);
      } else {
        setErr(`كلمة المرور غير صحيحة — محاولة ${count} من ${LOCK_LIMIT}`);
      }
    }
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
          <div><label className="block text-sm font-bold text-slate-200 mb-2">الرقم الوظيفي</label>
            <input type="text" value={user} onChange={e=>setUser(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg" placeholder="728004" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
          <div><label className="block text-sm font-bold text-slate-200 mb-2">كلمة المرور</label>
            <div className="relative"><input type={showP?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              <button onClick={()=>setShowP(!showP)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showP?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
          {lockSecs > 0 && (
            <div className="bg-red-700/30 border border-red-500/50 text-red-200 text-sm p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={16}/>
              <span>الحساب مقفل — يُفتح بعد <strong className="font-mono">{fmtTime(lockSecs)}</strong></span>
            </div>
          )}
          {err && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16}/> {err}</div>}
          <button onClick={handleLogin} disabled={loading || lockSecs > 0} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-lg">{loading?"جاري التحقق...":"تسجيل الدخول"}</button>
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
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();
  const toast = useToast();
  const askConfirm = useConfirm();

  const handleChangePassword = async () => {
    if (!newPass || newPass.trim().length < 4) { toast("كلمة المرور يجب أن تكون 4 خانات أو أكثر", "warning"); return; }
    if (newPass.trim() !== confirm.trim()) { toast("كلمات المرور غير متطابقة", "error"); return; }
    setLoading(true);
    try {
      const hashed = await hashPassword(newPass.trim());
      passStore.set(`pass_${emp.id}`, hashed);
      if (isConnected) await FirebaseAPI.savePassword(emp.id, hashed);
      sessionStorage.removeItem("force_password_change");
      toast("تم تغيير كلمة المرور بنجاح!", "success");
      setNewPass(""); setConfirm("");
      if (await askConfirm("تم تغيير كلمة المرور. هل تريد تسجيل الخروج الآن؟", { title: "تسجيل الخروج", ok: "خروج" })) onLogout();
    } catch { toast("حدث خطأ أثناء الحفظ", "error"); }
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
  const [pageLoading, setPageLoading] = useState(true);
  const showToast = useToast();
  const confirm = useConfirm();
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 250); return () => clearTimeout(t); }, []);

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
    showToast("تم إرسال طلبك بنجاح", "success");
    sendDesktopNotification("طلب إجازة", "تم إرسال طلبك بنجاح وهو الآن بانتظار المراجعة");
    playAlert("notification");
  };

  const deleteRequest = async (id) => {
    if (!await confirm("هل تريد حذف هذا الطلب؟", { danger: true, ok: "حذف", title: "حذف الطلب" })) return;
    {
      const updated = requests.filter(r => r.id !== id);
      setRequests(updated);
      storage.set(`requests_${emp.id}`, updated);
      showToast("تم حذف الطلب", "success");
    }
  };

  const getStatusBadge = (s) => s==="بانتظار المراجعة"?"bg-amber-100 text-amber-700":s==="موافق عليها"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">طلبات الإجازة</h3>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(requests.map(r=>({الاسم:r.empName,نوع_الإجازة:r.type,من:r.dateFrom,إلى:r.dateTo,عدد_الأيام:r.days,الحالة:r.status,الغرض:r.purpose})),"طلبات_الإجازة")} className="btn-secondary flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-color"><Download size={13}/> CSV</button>
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
      {pageLoading
        ? <div className="space-y-3">{[...Array(3)].map((_,i)=><SkeletonCard key={i} lines={3}/>)}</div>
        : requests.length===0
          ? <div className="card rounded-2xl p-8 text-center border-color border"><FileText size={40} className="mx-auto mb-3 text-secondary"/><p className="text-secondary">لا توجد طلبات إجازة</p></div>
          : requests.map(req=>(<div key={req.id} className="card rounded-2xl p-4 border-color border"><div className="flex justify-between items-start">
        <div><div className="flex gap-2 mb-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${LEAVE_TYPES[req.type]?.color}`}>{LEAVE_TYPES[req.type]?.label}</span><span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>{req.status}</span></div>
        <p className="text-sm">من {req.dateFrom} إلى {req.dateTo} — {req.days} يوم</p><p className="text-xs text-secondary mt-1">{req.purpose}</p></div>
        {req.status==="بانتظار المراجعة" && <button onClick={()=>deleteRequest(req.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>}</div></div>))}
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
    requests.map(req=>{const reqEmp=ACCOUNTS.find(e=>e.id===req.empId)||{name:req.empName};return(<div key={req.id} className="card rounded-2xl p-4 border-color border"><div className="flex justify-between"><div><p className="font-bold"><EmpPopover emp={reqEmp}>{req.empName}</EmpPopover></p><p className="text-sm">{req.type} — {req.days} يوم</p><p className="text-xs text-secondary">{req.purpose}</p>
    <p className="text-xs text-secondary mt-1">{new Date(req.submittedAt).toLocaleDateString("ar-IQ")}</p></div>
    <div className="flex gap-2 items-start"><button onClick={()=>updateStatus(req.id,"موافق عليها")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs">قبول</button><button onClick={()=>updateStatus(req.id,"مرفوضة")} className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs">رفض</button></div></div></div>)})}
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
  const confirm = useConfirm();
  useEffect(() => { storage.set("inventory_items", items); }, [items]);

  const categories = ["الكل", ...INVENTORY_CATS];
  const filtered = items.filter(i => (i.name.includes(search)||i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  const lowStock = items.filter(i => i.qty <= (i.minQty || LOW_STOCK_THRESHOLD));

  const deleteItem = async (id) => {
    if (await confirm("هل تريد حذف هذا الصنف؟", { danger: true, ok: "حذف", title: "حذف الصنف" }))
      setItems(items.filter(i => i.id !== id));
  };

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
          <td className="px-3 py-2 no-print"><div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td></tr>))}</tbody></table></div></div>
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
  const confirm = useConfirm();
  useEffect(() => { storage.set("furniture_items", items); }, [items]);

  const deleteItem = async (id) => {
    if (await confirm("هل تريد حذف هذا الصنف؟", { danger: true, ok: "حذف", title: "حذف الصنف" }))
      setItems(items.filter(i => i.id !== id));
  };

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
          <td className="px-3 py-2">{it.location}</td><td className="px-3 py-2 no-print"><div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td></tr>))}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== إدارة الموظفين ==========
function EmployeeManager({ employees, setEmployees }) {
  const [search, setSearch]       = useState("");
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState({ name:"", jobNum:"", title:"", dept:"قسم السيطرة والنظم", shift:"صباحي" });
  const [adding, setAdding]       = useState(false);
  const [migrating, setMigrating] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const filtered = employees.filter(e => e.name.includes(search) || e.jobNum.includes(search));

  const saveEmp = () => {
    if (!form.name || !form.jobNum) return;
    if (adding) setEmployees([...employees, { ...form, id: Date.now(), password:"1000" }]);
    else setEmployees(employees.map(e => e.id===editId ? { ...form, id:editId } : e));
    setAdding(false); setEditId(null);
  };

  const handleMigrate = async () => {
    if (!await confirm("سيتم رفع بيانات جميع الموظفين (بدون كلمات المرور) إلى Firebase. هل تريد المتابعة؟", { title: "ترحيل البيانات", ok: "ترحيل" })) return;
    setMigrating(true);
    const ok = await FirebaseAPI.initializeAccounts(ACCOUNTS);
    setMigrating(false);
    ok ? toast("تم نقل البيانات إلى Firebase بنجاح!", "success", 5000)
       : toast("فشل الاتصال بـ Firebase — تحقق من القواعد", "error");
  };

  return (<div className="space-y-4">
    {/* شريط أدوات */}
    <div className="flex gap-3 flex-wrap">
      <div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1 min-w-[160px]">
        <Search size={14} className="text-secondary"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/>
      </div>
      <button onClick={()=>exportCSV(employees.map(e=>({الاسم:e.name,الرقم:e.jobNum,المسمى:e.title,القسم:e.dept,النوبة:e.shift})),"الموظفون")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/></button>
      <button onClick={()=>{setAdding(true);setForm({name:"",jobNum:"",title:"",dept:"قسم السيطرة والنظم",shift:"صباحي"});}} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-1"><Plus size={14}/> إضافة</button>
      <button onClick={handleMigrate} disabled={migrating} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl flex items-center gap-1.5 text-sm font-bold">
        {migrating ? "جاري النقل..." : "🔒 نقل البيانات إلى Firebase"}
      </button>
    </div>
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

// ========== SVG Charts — بدون مكتبات خارجية ==========

function SVGBarChart({ data, keys, colors, height = 180, labelKey = "name" }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center text-secondary text-sm" style={{height}}>لا توجد بيانات</div>;
  const W = 480; const H = height; const PAD = { t:10, r:10, b:32, l:28 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const maxVal = Math.max(1, ...data.flatMap(d => keys.map(k => Number(d[k]||0))));
  const groupW = chartW / data.length;
  const barW = Math.max(4, groupW / keys.length - 3);
  const yTicks = [0, Math.ceil(maxVal/4), Math.ceil(maxVal/2), Math.ceil(maxVal*3/4), maxVal];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{overflow:"visible"}}>
      {/* Grid */}
      {yTicks.map((t,i) => { const y = PAD.t + chartH - (t/maxVal)*chartH; return (
        <g key={i}><line x1={PAD.l} x2={W-PAD.r} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i===0?"0":"3,3"}/><text x={PAD.l-4} y={y+4} textAnchor="end" fontSize="9" fill="#94a3b8">{t}</text></g>
      );})}
      {/* Bars */}
      {data.map((d, di) => keys.map((k, ki) => {
        const val = Number(d[k]||0);
        const barH = (val/maxVal)*chartH;
        const x = PAD.l + di*groupW + ki*(barW+3) + 4;
        const y = PAD.t + chartH - barH;
        return <g key={`${di}-${ki}`}><rect x={x} y={y} width={barW} height={Math.max(0,barH)} fill={colors[ki]} rx="2"/>{val>0&&<text x={x+barW/2} y={y-3} textAnchor="middle" fontSize="8" fill={colors[ki]}>{val}</text>}</g>;
      }))}
      {/* X Labels */}
      {data.map((d,i) => <text key={i} x={PAD.l + i*groupW + groupW/2} y={H-8} textAnchor="middle" fontSize="9" fill="#64748b">{d[labelKey]}</text>)}
      {/* Legend */}
      {keys.map((k,i) => <g key={i} transform={`translate(${PAD.l + i*90}, ${H-2})`}><rect width="8" height="8" fill={colors[i]} rx="1" y="-8"/><text x="12" y="0" fontSize="9" fill="#64748b">{k}</text></g>)}
    </svg>
  );
}

function SVGPieChart({ data, colors, height = 180, donut = false }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center text-secondary text-sm" style={{height}}>لا توجد بيانات</div>;
  const total = data.reduce((s,d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center justify-center text-secondary text-sm" style={{height}}>لا توجد بيانات</div>;
  const cx = 90; const cy = height/2; const r = Math.min(cx, cy) - 16; const ir = donut ? r*0.5 : 0;
  let angle = -Math.PI/2;
  const slices = data.map((d,i) => {
    const sweep = (d.value/total) * 2 * Math.PI;
    const x1 = cx + r*Math.cos(angle); const y1 = cy + r*Math.sin(angle);
    angle += sweep;
    const x2 = cx + r*Math.cos(angle); const y2 = cy + r*Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const mx = cx + (r+ir)/2*Math.cos(angle-sweep/2); const my = cy + (r+ir)/2*Math.sin(angle-sweep/2);
    return { d: donut
      ? `M${cx+ir*Math.cos(angle-sweep)} ${cy+ir*Math.sin(angle-sweep)} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${cx+ir*Math.cos(angle)} ${cy+ir*Math.sin(angle)} A${ir} ${ir} 0 ${large} 0 ${cx+ir*Math.cos(angle-sweep)} ${cy+ir*Math.sin(angle-sweep)} Z`
      : `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      color: colors[i%colors.length], label: d.name, value: d.value, mx, my };
  });
  return (
    <svg viewBox={`0 0 280 ${height}`} width="100%">
      {slices.map((s,i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="1.5"/>)}
      {/* Legend */}
      {data.map((d,i) => <g key={i} transform={`translate(190, ${16 + i*22})`}><rect width="10" height="10" fill={colors[i%colors.length]} rx="2"/><text x="14" y="9" fontSize="10" fill="#475569">{d.name}</text><text x="14" y="20" fontSize="9" fill="#94a3b8">{d.value} ({Math.round(d.value/total*100)}%)</text></g>)}
    </svg>
  );
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
    return { name: month.slice(0,3), "موافق": monthReqs.filter(r=>r.status==="موافق عليها").length, "مرفوض": monthReqs.filter(r=>r.status==="مرفوضة").length, "معلق": monthReqs.filter(r=>r.status==="بانتظار المراجعة").length };
  });

  // توزيع الطلبات حسب النوع
  const typeData = Object.entries(LEAVE_TYPES).map(([k, v]) => ({
    name: v.label.replace("إجازة ",""), value: allRequests.filter(r => r.type === k).length
  })).filter(d => d.value > 0);

  // حالة المخزون
  const invItems = storage.get("inventory_items", []);
  const condData = ITEM_CONDITIONS.map(c => ({ name: c, value: invItems.filter(i => i.condition === c).length })).filter(d => d.value > 0);

  // توزيع الموظفين حسب القسم
  const deptData = [...new Set(employees.map(e=>e.dept))].map(d => ({
    name: d.replace("قسم ","").replace("شعبة ",""), value: employees.filter(e=>e.dept===d).length
  }));

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
    { label: "مشرفي النظام", value: employees.filter(e=>e.role==="admin").length, icon: <Shield size={24}/>, color: "from-indigo-500 to-indigo-600" },
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
          <SVGBarChart data={monthlyData} keys={["موافق","مرفوض","معلق"]} colors={["#10b981","#ef4444","#f59e0b"]} height={200}/>
        </div>
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">توزيع أنواع الإجازات</h4>
          <SVGPieChart data={typeData} colors={PIE_COLORS} height={200}/>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">حالة المخزون</h4>
          <SVGPieChart data={condData} colors={["#10b981","#64748b","#f59e0b","#ef4444","#8b5cf6"]} height={180} donut={true}/>
        </div>
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">توزيع الموظفين حسب القسم</h4>
          <SVGBarChart data={deptData} keys={["value"]} colors={["#6366f1"]} height={180} labelKey="name"/>
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
  const showToast = (msg, type) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const confirm = useConfirm();
  useEffect(() => { storage.set("tasks_system", tasks); }, [tasks]);

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

  const deleteTask = async (id) => {
    if (await confirm("هل تريد حذف هذه المهمة؟", { danger: true, ok: "حذف", title: "حذف المهمة" })) { setTasks(tasks.filter(t=>t.id!==id)); showToast("تم حذف المهمة", "success"); }
  };

  const priorityColor = (p) => p==="عالية"?"bg-red-100 text-red-700":p==="متوسطة"?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700";
  const statusColor = (s) => s==="مكتملة"?"bg-emerald-100 text-emerald-700":s==="قيد التنفيذ"?"bg-blue-100 text-blue-700":"bg-slate-100 text-slate-700";

  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "مكتملة");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-bold text-lg">نظام المهام</h3>
        <div className="flex gap-2">
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="input rounded-xl px-3 py-2 text-sm"><option>الكل</option>{TASK_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
          <button onClick={()=>exportCSV(tasks.map(t=>({العنوان:t.title,الوصف:t.desc||"",المكلف:t.assignedToName,الأولوية:t.priority,الحالة:t.status,الاستحقاق:t.dueDate||"",بواسطة:t.createdBy})),"المهام")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> CSV</button>
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
              <span>👤 <EmpPopover emp={allEmployees.find(e=>e.id===Number(t.assignedTo))}>{t.assignedToName}</EmpPopover></span>
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
  const [chatLoading, setChatLoading] = useState(true);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!isConnected) {
      setMessages(storage.get("chat_offline", []));
      setChatLoading(false);
      return;
    }
    const msgs = await FirebaseAPI.getMessages(50);
    setMessages(msgs);
    storage.set("chat_offline", msgs);
    setChatLoading(false);
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
        {chatLoading ? <>{[...Array(4)].map((_,i)=><SkeletonMsg key={i} mine={i%2===0}/>)}</> : <>
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
        </>}
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

// ========== المعدات والصيانة ==========
function EquipmentMaintenance() {
  const [equipment, setEquipment] = useState(() => storage.get("equipment", INITIAL_EQUIPMENT));
  const [records, setRecords] = useState(() => storage.get("maintenance_records", []));
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("equipment", equipment); }, [equipment]);
  useEffect(() => { storage.set("maintenance_records", records); }, [records]);

  const filtered = equipment.filter(e => e.name.includes(search) && (filterStatus==="الكل"||e.status===filterStatus));

  const requestMaintenance = () => {
    if (!selected) return;
    const desc = window.prompt("وصف العطل أو سبب الصيانة:");
    if (!desc) return;
    const rec = { id:Date.now(), equipmentId:selected.id, equipmentName:selected.name, type:"طارئة", description:desc, status:"قيد التنفيذ", requestedAt:new Date().toISOString() };
    setRecords([rec, ...records]);
    setEquipment(equipment.map(e => e.id===selected.id ? {...e, status:"تحت صيانة"} : e));
    showToast("✅ تم تسجيل طلب الصيانة");
  };

  const completeMaintenance = (recordId) => {
    const rec = records.find(r => r.id===recordId);
    if (!rec) return;
    setEquipment(equipment.map(e => e.id===rec.equipmentId ? {...e, status:"جيد", lastMaintenance:new Date().toISOString().slice(0,10), nextMaintenance:new Date(Date.now()+90*86400000).toISOString().slice(0,10)} : e));
    setRecords(records.map(r => r.id===recordId ? {...r, status:"مكتملة", completedAt:new Date().toISOString()} : r));
    showToast("✅ تم إكمال الصيانة");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-color pb-2">
        <button onClick={()=>setActiveTab("list")} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab==="list"?"bg-blue-600 text-white":"text-secondary hover:bg-hover"}`}>قائمة المعدات</button>
        <button onClick={()=>setActiveTab("requests")} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab==="requests"?"bg-blue-600 text-white":"text-secondary hover:bg-hover"}`}>طلبات الصيانة {records.filter(r=>r.status!=="مكتملة").length>0&&<span className="mr-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{records.filter(r=>r.status!=="مكتملة").length}</span>}</button>
      </div>

      {activeTab==="list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 input rounded-xl px-3 py-2"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث في المعدات..." className="bg-transparent text-sm outline-none w-full"/></div>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="input rounded-xl px-3 py-2 text-sm"><option value="الكل">الكل</option><option value="جيد">جيد</option><option value="تحتاج صيانة">تحتاج صيانة</option><option value="تحت صيانة">تحت صيانة</option><option value="معطل">معطل</option></select>
            </div>
            <div className="card rounded-2xl border-color border divide-y">
              {filtered.length===0 ? <p className="p-6 text-center text-secondary text-sm">لا توجد نتائج</p> :
              filtered.map(eq=>(
                <div key={eq.id} onClick={()=>setSelected(eq)} className={`p-4 hover:bg-hover cursor-pointer flex justify-between items-center transition-all ${selected?.id===eq.id?"bg-blue-50":""}`}>
                  <div>
                    <p className="font-bold text-sm">{eq.name} {eq.critical&&<span className="text-red-500 text-xs">🔴</span>}</p>
                    <p className="text-xs text-secondary">{eq.location} — آخر صيانة: {eq.lastMaintenance}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${EQ_STATUS_COLORS[eq.status]||"bg-slate-100"}`}>{eq.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            {selected ? (
              <div className="card rounded-2xl border-color border p-5 space-y-3">
                <h3 className="font-bold">{selected.name}</h3>
                <div className="text-sm space-y-2">
                  <p><span className="font-bold text-secondary">الرمز:</span> {selected.id}</p>
                  <p><span className="font-bold text-secondary">الموقع:</span> {selected.location}</p>
                  <p><span className="font-bold text-secondary">آخر صيانة:</span> {selected.lastMaintenance}</p>
                  <p><span className="font-bold text-secondary">الصيانة القادمة:</span> {selected.nextMaintenance}</p>
                  <p><span className="font-bold text-secondary">عدد العطلات:</span> <span className={selected.totalFailures>2?"text-red-600 font-bold":""}>{selected.totalFailures}</span></p>
                  {selected.critical && <p className="text-red-600 font-bold text-xs">⚠️ معدة حرجة</p>}
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${EQ_STATUS_COLORS[selected.status]||"bg-slate-100"}`}>{selected.status}</span>
                <button onClick={requestMaintenance} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">طلب صيانة</button>
              </div>
            ) : (
              <div className="card rounded-2xl border-color border p-8 text-center">
                <Wrench size={32} className="mx-auto text-secondary mb-2"/>
                <p className="text-secondary text-sm">اختر معدة لعرض التفاصيل</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab==="requests" && (
        <div className="card rounded-2xl border-color border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-color bg-slate-50"><th className="p-3 text-right">المعدة</th><th className="p-3 text-right">الوصف</th><th className="p-3 text-right">تاريخ الطلب</th><th className="p-3 text-right">الحالة</th><th className="p-3"></th></tr></thead>
              <tbody>
                {records.length===0 ? <tr><td colSpan={5} className="text-center py-8 text-secondary">لا توجد طلبات صيانة</td></tr> :
                records.map(r=>(
                  <tr key={r.id} className="border-t border-color hover:bg-hover">
                    <td className="p-3 font-bold">{r.equipmentName}</td>
                    <td className="p-3 text-secondary text-xs max-w-[200px]">{r.description}</td>
                    <td className="p-3 text-xs text-secondary">{new Date(r.requestedAt).toLocaleDateString("ar-IQ")}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status==="مكتملة"?"bg-emerald-100 text-emerald-700":r.status==="قيد التنفيذ"?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700"}`}>{r.status}</span></td>
                    <td className="p-3">{r.status!=="مكتملة"&&<button onClick={()=>completeMaintenance(r.id)} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs">إكمال</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== قطع غيار الصيانة ==========
function MaintenanceParts() {
  const [parts, setParts] = useState(() => storage.get("maint_spare_parts", INITIAL_MAINT_SPARE_PARTS));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code:"", name:"", category:"ميكانيكية", qty:0, minAlert:1, unit:"قطعة", price:0, location:"" });
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const confirm = useConfirm();
  useEffect(() => { storage.set("maint_spare_parts", parts); }, [parts]);

  const deletePart = async (id) => {
    if (await confirm("هل تريد حذف هذه القطعة؟", { danger: true, ok: "حذف", title: "حذف القطعة" }))
      setParts(parts.filter(x => x.id !== id));
  };

  const categories = ["الكل", ...new Set(parts.map(p => p.category))];
  const filtered = parts.filter(p => (p.name.includes(search)||p.code.includes(search)) && (filterCat==="الكل"||p.category===filterCat));
  const lowStock = parts.filter(p => p.qty <= p.minAlert);

  const addPart = () => {
    if (!form.name || !form.code) return showToast("الاسم والرمز مطلوبان");
    setParts([...parts, { ...form, id:"SP-"+Date.now() }]);
    setShowForm(false);
    setForm({ code:"", name:"", category:"ميكانيكية", qty:0, minAlert:1, unit:"قطعة", price:0, location:"" });
    showToast("✅ تم الإضافة");
  };
  const updateQty = (id, delta) => setParts(parts.map(p => p.id===id ? {...p, qty:Math.max(0,p.qty+delta)} : p));

  return (
    <div className="space-y-4">
      {lowStock.length>0 && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-600 shrink-0"/><div><p className="text-xs font-bold text-amber-800">مخزون منخفض ({lowStock.length} صنف)</p><p className="text-xs text-amber-700">{lowStock.map(p=>p.name).join(" • ")}</p></div></div>}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 input rounded-xl px-3 py-2"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select>
        <button onClick={()=>exportCSV(parts.map(p=>({الرمز:p.code,الاسم:p.name,الفئة:p.category,الكمية:p.qty,الوحدة:p.unit,السعر:p.price,الموقع:p.location})),"قطع_الغيار")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> CSV</button>
        <button onClick={()=>{setShowForm(true);setForm({code:"",name:"",category:"ميكانيكية",qty:0,minAlert:1,unit:"قطعة",price:0,location:""});}} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-1.5 text-sm font-bold"><Plus size={14}/> إضافة</button>
      </div>

      {showForm && (
        <div className="card rounded-2xl border-2 border-blue-200 p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[["الرمز","code"],["الاسم","name"],["الوحدة","unit"],["الموقع","location"]].map(([l,k])=>(
              <div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            ))}
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الفئة</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"><option>ميكانيكية</option><option>كهربائية</option><option>مواد استهلاكية</option><option>فلتر</option></select></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الكمية</label><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:Number(e.target.value)})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">حد التنبيه</label><input type="number" value={form.minAlert} onChange={e=>setForm({...form,minAlert:Number(e.target.value)})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">السعر ($)</label><input type="number" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          </div>
          <div className="flex gap-2 justify-end mt-4"><button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={addPart} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl">حفظ</button></div>
        </div>
      )}

      <div className="card rounded-2xl border-color border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-color bg-slate-50"><th className="px-3 py-2 text-right">الرمز</th><th className="px-3 py-2 text-right">الاسم</th><th className="px-3 py-2 text-right">الفئة</th><th className="px-3 py-2 text-right">الكمية</th><th className="px-3 py-2 text-right">الحد</th><th className="px-3 py-2 text-right">السعر</th><th className="px-3 py-2 text-right">الموقع</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} className={`border-t border-color hover:bg-hover ${p.qty<=p.minAlert?"bg-amber-50/30":""}`}>
                  <td className="px-3 py-2 font-mono text-xs">{p.code}</td>
                  <td className="px-3 py-2">{p.name} {p.qty<=p.minAlert&&<span className="text-amber-500">⚠️</span>}</td>
                  <td className="px-3 py-2 text-xs">{p.category}</td>
                  <td className="px-3 py-2"><div className="flex items-center gap-1"><button onClick={()=>updateQty(p.id,-1)} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">-</button><span className="w-8 text-center font-bold">{p.qty}</span><button onClick={()=>updateQty(p.id,1)} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">+</button></div></td>
                  <td className="px-3 py-2 text-xs">{p.minAlert} {p.unit}</td>
                  <td className="px-3 py-2 text-xs">${p.price}</td>
                  <td className="px-3 py-2 text-xs text-secondary">{p.location}</td>
                  <td className="px-3 py-2"><button onClick={()=>deletePart(p.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13}/></button></td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={8} className="text-center py-8 text-secondary">لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== تقارير الصيانة ==========
function MaintenanceAnalytics() {
  const equipment = storage.get("equipment", INITIAL_EQUIPMENT);
  const parts     = storage.get("maint_spare_parts", INITIAL_MAINT_SPARE_PARTS);
  const records   = storage.get("maintenance_records", []);
  const totalCost  = equipment.reduce((s, e) => s + (e.maintenanceCost || 300), 0);
  const partsValue = parts.reduce((s, p) => s + (p.price * p.qty), 0);
  const mostFailing = [...equipment].sort((a, b) => b.totalFailures - a.totalFailures).slice(0, 3);
  const byStatus = [
    { name:"جيد",          value:equipment.filter(e=>e.status==="جيد").length },
    { name:"يحتاج صيانة",  value:equipment.filter(e=>e.status==="تحتاج صيانة").length },
    { name:"تحت صيانة",    value:equipment.filter(e=>e.status==="تحت صيانة").length },
    { name:"معطل",         value:equipment.filter(e=>e.status==="معطل").length },
  ].filter(x=>x.value>0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white"><div className="flex justify-between items-center"><Wrench size={20}/><span className="text-3xl font-bold">{equipment.length}</span></div><p className="text-xs mt-2 opacity-90">إجمالي المعدات</p></div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white"><div className="flex justify-between items-center"><AlertTriangle size={20}/><span className="text-3xl font-bold">{equipment.filter(e=>e.critical).length}</span></div><p className="text-xs mt-2 opacity-90">معدات حرجة</p></div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white"><div className="flex justify-between items-center"><Clock size={20}/><span className="text-3xl font-bold">{equipment.filter(e=>new Date(e.nextMaintenance)<=new Date()).length}</span></div><p className="text-xs mt-2 opacity-90">صيانة مستحقة</p></div>
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white"><div className="flex justify-between items-center"><Box size={20}/><span className="text-3xl font-bold">{parts.length}</span></div><p className="text-xs mt-2 opacity-90">قطع غيار</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card rounded-2xl p-5 border-color border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18}/> تحليل التكاليف</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl"><span className="text-sm">إجمالي تكاليف الصيانة (تقديري)</span><span className="text-xl font-bold text-blue-600">${totalCost.toLocaleString()}</span></div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl"><span className="text-sm">قيمة قطع الغيار</span><span className="text-xl font-bold text-amber-600">${partsValue.toLocaleString()}</span></div>
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl"><span className="text-sm">طلبات صيانة مكتملة</span><span className="text-xl font-bold text-emerald-600">{records.filter(r=>r.status==="مكتملة").length}</span></div>
          </div>
        </div>

        <div className="card rounded-2xl p-5 border-color border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingDown size={18}/> أكثر المعدات عطلاً</h3>
          <div className="space-y-2">
            {mostFailing.map((e, idx)=>(
              <div key={e.id} className="flex justify-between items-center p-2 border-b border-color last:border-0">
                <div className="flex items-center gap-2"><span className="text-base">{idx===0?"🥇":idx===1?"🥈":"🥉"}</span><span className="text-sm">{e.name}</span></div>
                <span className={`font-bold text-sm ${e.totalFailures>2?"text-red-600":"text-amber-600"}`}>{e.totalFailures} عطل</span>
              </div>
            ))}
            {mostFailing.length===0 && <p className="text-center text-secondary text-sm py-4">لا توجد بيانات</p>}
          </div>
        </div>

        <div className="card rounded-2xl p-5 border-color border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart size={18}/> توزيع حالة المعدات</h3>
          <SVGPieChart data={byStatus} colors={["#10b981","#f59e0b","#3b82f6","#ef4444"]} height={160} donut={true}/>
        </div>

        <div className="card rounded-2xl p-5 border-color border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><AlertCircle size={18}/> توصيات</h3>
          <div className="space-y-3">
            {equipment.filter(e=>e.critical&&e.status!=="جيد").length>0 && <div className="p-3 bg-red-50 rounded-xl border border-red-100"><p className="font-bold text-red-700 text-sm">⚠️ أولوية عالية</p><p className="text-xs text-red-600 mt-1">معدات حرجة تحتاج صيانة فورية</p></div>}
            {parts.filter(p=>p.qty<=p.minAlert).length>0 && <div className="p-3 bg-amber-50 rounded-xl border border-amber-100"><p className="font-bold text-amber-700 text-sm">📦 مخزون قطع الغيار</p><p className="text-xs text-amber-600 mt-1">يوجد {parts.filter(p=>p.qty<=p.minAlert).length} صنف بمخزون منخفض</p></div>}
            {equipment.filter(e=>new Date(e.nextMaintenance)<=new Date()).length>0 && <div className="p-3 bg-blue-50 rounded-xl border border-blue-100"><p className="font-bold text-blue-700 text-sm">🗓️ صيانة مستحقة</p><p className="text-xs text-blue-600 mt-1">{equipment.filter(e=>new Date(e.nextMaintenance)<=new Date()).length} معدة تجاوزت موعد صيانتها</p></div>}
            {[...Array(3)].every(()=>true) && equipment.filter(e=>e.critical&&e.status!=="جيد").length===0 && parts.filter(p=>p.qty<=p.minAlert).length===0 && equipment.filter(e=>new Date(e.nextMaintenance)<=new Date()).length===0 && <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100"><p className="font-bold text-emerald-700 text-sm">✅ الوضع جيد</p><p className="text-xs text-emerald-600 mt-1">لا توجد تنبيهات حرجة حالياً</p></div>}
          </div>
        </div>
      </div>
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

// ========== استمارة الضمان الصحي ==========
function HealthInsuranceForm({ emp }) {
  const now = new Date();
  const STORAGE_KEY = `health_ins_${emp.id}`;
  const toast = useToast();

  const emptyRow = (i) => ({ id:i, beneficiary:"", date:"", procedure:"", amount:"", opLarge:"", opMedium:"", opSmall:"" });
  const [phone, setPhone] = useState("");
  const [marital, setMarital] = useState("متزوج");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [formEnvelope, setFormEnvelope] = useState("");
  const [formSequence, setFormSequence] = useState("");
  const [beneficiaries, setBeneficiaries] = useState([emp.name]);
  const [newBenef, setNewBenef] = useState("");
  const [rows, setRows] = useState(() => Array.from({length:10},(_,i)=>emptyRow(i+1)));

  useEffect(() => {
    const d = storage.get(STORAGE_KEY);
    if (!d) return;
    setPhone(d.phone||""); setMarital(d.marital||"متزوج");
    setMonth(d.month??now.getMonth()); setYear(d.year??now.getFullYear());
    setFormEnvelope(d.formEnvelope||""); setFormSequence(d.formSequence||"");
    setBeneficiaries(d.beneficiaries||[emp.name]);
    setRows(d.rows||Array.from({length:10},(_,i)=>emptyRow(i+1)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // deadline countdown (17th of current month or next)
  const deadlineBase = new Date(now.getFullYear(), now.getMonth(), 17);
  const deadline = now.getDate() > 17 ? new Date(now.getFullYear(), now.getMonth()+1, 17) : deadlineBase;
  const daysLeft = Math.ceil((deadline - now) / 86400000);

  const filledRows = rows.filter(r => r.beneficiary && r.procedure);
  const totalAmount = rows.reduce((s,r) => s + (Number(r.amount)||0), 0);

  const updateRow = (idx, field, val) => setRows(rows.map((r,i) => i===idx ? {...r,[field]:val} : r));

  const addBenef = () => {
    const n = newBenef.trim();
    if (!n) return;
    if (beneficiaries.includes(n)) { toast.warning("الاسم موجود مسبقاً"); return; }
    setBeneficiaries([...beneficiaries, n]); setNewBenef("");
    toast.success("تمت الإضافة");
  };

  const save = () => {
    storage.set(STORAGE_KEY, { phone, marital, month, year, formEnvelope, formSequence, beneficiaries, rows });
    toast.success("✅ تم حفظ الاستمارة");
  };

  const printForm = () => {
    // columns right-to-left: اجور الطبيب first, الامراض المستعصية last
    const PROC_RTL = [...PROCEDURE_TYPES].reverse();
    const allPrintRows = rows.slice(0, 10).concat(
      Array.from({length: Math.max(0, 10-rows.length)}, (_,i)=>emptyRow(rows.length+i+1))
    );
    const procHeadCols = PROC_RTL.map(pt =>
      `<th style="width:13mm"><div class="th-vert">${pt}</div></th>`
    ).join("");
    const dataRows = allPrintRows.map((r,i) => `
      <tr style="height:8.5mm">
        <td>${i+1}</td>
        <td class="td-name">${r.beneficiary||""}</td>
        <td class="td-date">${r.date||""}</td>
        ${PROC_RTL.map(pt=>`<td class="td-amt">${r.procedure===pt?(r.amount||"✓"):""}</td>`).join("")}
        <td>${r.opLarge||""}</td>
        <td>${r.opMedium||""}</td>
        <td>${r.opSmall||""}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>
<title>استمارة طلب التعويض للموظفين</title>
<style>
  @page{size:A4 landscape;margin:6mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:8.5pt;direction:rtl}
  /* ===== Header box ===== */
  .hbox{border:2px solid #000;margin-bottom:3mm}
  .htitle{text-align:center;font-size:13pt;font-weight:bold;padding:2mm;border-bottom:2px solid #000}
  /* 3-col grid, RTL: col1=RIGHT, col2=MIDDLE, col3=LEFT */
  .hgrid{display:grid;grid-template-columns:1fr 1fr 1fr;direction:rtl}
  .hcol{padding:1.5mm 3mm}
  .hcol:not(:last-child){border-left:1px solid #000}
  .frow{display:flex;align-items:baseline;gap:3px;padding:1.5px 0;border-bottom:1px dotted #bbb;min-height:16px}
  .frow:last-child{border-bottom:none}
  .fl{font-weight:bold;white-space:nowrap;font-size:7pt;min-width:90px}
  .fv{flex:1;border-bottom:1px solid #000;font-size:8pt;padding-bottom:0;padding-right:3px;min-width:50px}
  .center-lbl{text-align:center;font-weight:bold;font-size:9pt;border-bottom:1px solid #000;padding:1.5mm 0;background:#eef2fa}
  /* ===== Table ===== */
  table{border-collapse:collapse;width:100%;table-layout:fixed}
  th,td{border:1px solid #000;text-align:center;vertical-align:middle;font-size:6.5pt;padding:0 1px}
  th{background:#dce6f1;font-weight:bold}
  .th-vert{writing-mode:vertical-rl;text-orientation:mixed;transform:rotate(180deg);height:24mm;font-size:5.8pt}
  .td-name{text-align:right;font-size:8pt;padding-right:1.5mm}
  .td-date{font-size:7pt}
  .td-amt{font-size:8pt;font-weight:bold}
  /* ===== Signatures ===== */
  .auth{margin-top:2mm;font-size:8pt}
  .sigrow{display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:2.5mm;text-align:center;direction:rtl}
  .sigcell{font-weight:bold;font-size:9pt}
  .sigline{margin-top:9mm;border-top:1px solid #000;padding-top:1mm;font-size:7pt;font-weight:normal}
</style></head><body>
<div class="hbox">
  <div class="htitle">استمارة طلب التعويض للموظفين</div>
  <div class="hgrid">
    <!-- RIGHT col: employee info -->
    <div class="hcol">
      <div class="frow"><span class="fl">اسم الموظف:</span><span class="fv">${emp.name}</span></div>
      <div class="frow"><span class="fl">الرقم الوظيفي:</span><span class="fv">${emp.jobNum}</span></div>
      <div class="frow"><span class="fl">الحالة الزوجية:</span><span class="fv">${marital}</span></div>
      <div class="frow"><span class="fl">توقيع الموظف:</span><span class="fv">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>
    <!-- MIDDLE col: committee + month + envelope + sequence -->
    <div class="hcol">
      <div class="center-lbl">لجنة الضمان الصحي المركزية</div>
      <div class="frow"><span class="fl">الشهـــر:</span><span class="fv">${MONTHS_IRAQI[month]} ${year}</span></div>
      <div class="frow"><span class="fl">رقم الظرف:</span><span class="fv">${formEnvelope}</span></div>
      <div class="frow"><span class="fl">التسلسل:</span><span class="fv">${formSequence}</span></div>
    </div>
    <!-- LEFT col: dept + phone + visits + date + total -->
    <div class="hcol">
      <div class="frow"><span class="fl">اسم الهيأة/القسم:</span><span class="fv">الصيانة الهندسية / السيطرة والنظم</span></div>
      <div class="frow"><span class="fl">رقم الهاتف:</span><span class="fv">${phone}</span></div>
      <div class="frow"><span class="fl">عدد المراجعات:</span><span class="fv">${filledRows.length}</span></div>
      <div class="frow"><span class="fl">تاريخ تقديم الطلب:</span><span class="fv">${now.toLocaleDateString("ar-IQ")}</span></div>
      <div class="frow"><span class="fl">المجموع الكلي:</span><span class="fv">${totalAmount.toLocaleString()} دينار</span></div>
    </div>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:7mm">ت</th>
      <th rowspan="2" style="width:38mm">اسم المنتفع</th>
      <th rowspan="2" style="width:18mm">تاريخ المراجعة</th>
      <th colspan="12" style="font-size:8.5pt;background:#c8d8ee">نوع الإجراء الطبي</th>
      <th colspan="3" style="font-size:8.5pt;background:#c8d8ee">نوع العملية</th>
    </tr>
    <tr>
      ${procHeadCols}
      <th style="width:16mm"><div class="th-vert">العمليات فوق الكبرى</div></th>
      <th style="width:16mm"><div class="th-vert">العمليات الوسطى</div></th>
      <th style="width:16mm"><div class="th-vert">العمليات الصغرى</div></th>
    </tr>
  </thead>
  <tbody>${dataRows}</tbody>
</table>
<div class="auth">اسم وتوقيع المخول: _________________________________</div>
<div class="sigrow">
  <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
  <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
  <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
  <div class="sigcell">رئيس اللجنة<div class="sigline">الاسم والتوقيع</div></div>
</div>
</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Deadline banner */}
      <div className={`rounded-2xl p-3 flex items-center gap-3 border ${daysLeft<=3?"bg-red-50 border-red-200":daysLeft<=7?"bg-amber-50 border-amber-200":"bg-blue-50 border-blue-200"}`}>
        <Clock size={18} className={daysLeft<=3?"text-red-500":daysLeft<=7?"text-amber-500":"text-blue-500"}/>
        <div>
          <p className={`font-bold text-sm ${daysLeft<=3?"text-red-700":daysLeft<=7?"text-amber-700":"text-blue-700"}`}>
            الموعد النهائي لتقديم الاستمارات: اليوم 17 من كل شهر
          </p>
          <p className={`text-xs ${daysLeft<=3?"text-red-600":daysLeft<=7?"text-amber-600":"text-blue-600"}`}>
            {daysLeft===0?"⚠️ اليوم هو آخر يوم للتقديم!":daysLeft===1?"⚠️ باقي يوم واحد فقط!":` باقي ${daysLeft} يوم على الموعد النهائي`}
          </p>
        </div>
      </div>

      {/* Header info card */}
      <div className="card rounded-2xl border-color border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Heart size={18} className="text-red-500"/> استمارة طلب التعويض الصحي</h3>
          <span className="text-xs text-secondary">الصيانة الهندسية / السيطرة والنظم</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="block text-[10px] font-bold text-secondary mb-1">اسم الموظف</label><input value={emp.name} readOnly className="input w-full rounded-xl px-3 py-2 text-sm bg-slate-50 opacity-70 cursor-not-allowed"/></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={emp.jobNum} readOnly className="input w-full rounded-xl px-3 py-2 text-sm bg-slate-50 opacity-70 cursor-not-allowed"/></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">رقم الهاتف</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07X XXXX XXXX" className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">رقم الظرف (استمارة)</label><input value={formEnvelope} onChange={e=>setFormEnvelope(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">التسلسل (استمارة)</label><input value={formSequence} onChange={e=>setFormSequence(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الشهر</label>
            <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="input w-full rounded-xl px-3 py-2 text-sm">
              {MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}
            </select></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">السنة</label>
            <select value={year} onChange={e=>setYear(Number(e.target.value))} className="input w-full rounded-xl px-3 py-2 text-sm">
              {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}
            </select></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة الزوجية</label>
            <select value={marital} onChange={e=>setMarital(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm">
              {MARITAL_STATUS_LIST.map(s=><option key={s}>{s}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100"><p className="text-2xl font-bold text-blue-700">{filledRows.length}</p><p className="text-xs text-blue-600">عدد المراجعات</p></div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100"><p className="text-xl font-bold text-emerald-700">{totalAmount.toLocaleString()} د.ع</p><p className="text-xs text-emerald-600">المجموع الكلي</p></div>
        </div>
      </div>

      {/* Beneficiaries */}
      <div className="card rounded-2xl border-color border p-5">
        <h4 className="font-bold mb-3 flex items-center gap-2"><UserPlus size={15} className="text-blue-500"/> المشمولون بالضمان الصحي</h4>
        <div className="flex gap-2 mb-3">
          <input value={newBenef} onChange={e=>setNewBenef(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBenef()} placeholder="اسم أحد أفراد العائلة..." className="input flex-1 rounded-xl px-3 py-2 text-sm"/>
          <button onClick={addBenef} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5"><Plus size={13}/> إضافة</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {beneficiaries.map((b,i)=>(
            <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${i===0?"bg-blue-100 text-blue-800 border border-blue-200":"bg-slate-100 text-slate-700 border border-slate-200"}`}>
              {i===0&&<span className="opacity-60 text-[10px]">موظف</span>}
              {b}
              {i>0&&<button onClick={()=>setBeneficiaries(beneficiaries.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 mr-0.5"><X size={11}/></button>}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card rounded-2xl border-color border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" dir="rtl">
            <thead>
              <tr className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
                <th rowSpan={2} className="px-2 py-2.5 text-center w-8">ت</th>
                <th rowSpan={2} className="px-2 py-2.5 text-right min-w-[130px]">اسم المنتفع</th>
                <th rowSpan={2} className="px-2 py-2.5 text-right min-w-[115px]">تاريخ المراجعة</th>
                <th rowSpan={2} className="px-2 py-2.5 text-right min-w-[170px]">نوع الإجراء الطبي</th>
                <th rowSpan={2} className="px-2 py-2.5 text-right min-w-[90px]">المبلغ (دينار)</th>
                <th colSpan={3} className="px-2 py-2 text-center border-b border-blue-400">نوع العملية</th>
              </tr>
              <tr className="bg-blue-800 text-white text-[10px]">
                <th className="px-1 py-1.5 min-w-[90px]">العمليات فوق الكبرى</th>
                <th className="px-1 py-1.5 min-w-[80px]">العمليات الوسطى</th>
                <th className="px-1 py-1.5 min-w-[80px]">العمليات الصغرى</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row,idx)=>(
                <tr key={idx} className={`border-t border-color transition-colors ${row.beneficiary&&row.procedure?"bg-emerald-50/20":""}  ${idx%2===1?"bg-hover/20":""}`}>
                  <td className="px-2 py-1.5 text-center font-bold text-secondary">{idx+1}</td>
                  <td className="px-1.5 py-1">
                    <select value={row.beneficiary} onChange={e=>updateRow(idx,"beneficiary",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs">
                      <option value="">-- اختر --</option>
                      {beneficiaries.map((b,i)=><option key={i} value={b}>{b}</option>)}
                    </select></td>
                  <td className="px-1.5 py-1"><input type="date" value={row.date} onChange={e=>updateRow(idx,"date",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs"/></td>
                  <td className="px-1.5 py-1">
                    <select value={row.procedure} onChange={e=>updateRow(idx,"procedure",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs">
                      <option value="">-- اختر --</option>
                      {PROCEDURE_TYPES.map(p=><option key={p} value={p}>{p}</option>)}
                    </select></td>
                  <td className="px-1.5 py-1"><input type="number" min="0" value={row.amount} onChange={e=>updateRow(idx,"amount",e.target.value)} placeholder="0" className="input w-full rounded-lg px-2 py-1.5 text-xs" dir="ltr"/></td>
                  <td className="px-1.5 py-1"><input value={row.opLarge||""} onChange={e=>updateRow(idx,"opLarge",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs"/></td>
                  <td className="px-1.5 py-1"><input value={row.opMedium||""} onChange={e=>updateRow(idx,"opMedium",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs"/></td>
                  <td className="px-1.5 py-1"><input value={row.opSmall||""} onChange={e=>updateRow(idx,"opSmall",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs"/></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-blue-200 bg-blue-50">
                <td colSpan={4} className="px-3 py-2 font-bold text-blue-800">المجموع الكلي ({filledRows.length} مراجعة)</td>
                <td className="px-3 py-2 font-bold text-blue-800">{totalAmount.toLocaleString()}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button onClick={()=>exportCSV(filledRows.map(r=>({اسم_المنتفع:r.beneficiary,التاريخ:r.date,الإجراء:r.procedure,المبلغ:r.amount,رقم_الظرف:r.envelope,التسلسل:r.sequence})),"استمارة_الضمان_الصحي")} className="flex items-center gap-2 px-4 py-2.5 btn-secondary border border-color rounded-xl font-bold text-sm"><Download size={14}/> تصدير CSV</button>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== لوحة رسم التوقيع الإلكتروني ==========
function SignaturePad({ onSave, label = "التوقيع" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };
  const stopDraw = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onSave && onSave(null);
  };
  const save = () => { onSave && onSave(canvasRef.current.toDataURL("image/png")); };

  return (
    <div className="border border-color rounded-lg p-2 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-secondary">{label}</span>
        <div className="flex gap-1">
          <button type="button" onClick={clear} className="text-xs px-2 py-0.5 rounded border border-color hover:bg-hover text-secondary">مسح</button>
          <button type="button" onClick={save} className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">حفظ التوقيع</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={90}
        className="border border-dashed border-gray-300 rounded cursor-crosshair touch-none w-full bg-gray-50"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}

// ========== نموذج الإجازة الاعتيادية ==========
function AnnualLeaveForm({ emp }) {
  const now = new Date();
  const toast = useToast();
  const STORAGE_KEY = `annual_leave_${emp.id}`;

  const [name, setName] = useState(emp.name);
  const [jobNum, setJobNum] = useState(emp.jobNum || "");
  const [jobTitle, setJobTitle] = useState(emp.title || "");
  const [dept, setDept] = useState(emp.dept || "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [days, setDays] = useState("");
  const [purpose, setPurpose] = useState("");
  const [reqDate, setReqDate] = useState(now.toISOString().split("T")[0]);
  const [sigDataUrl, setSigDataUrl] = useState(null);

  useEffect(() => {
    const saved = storage.get(STORAGE_KEY, null);
    if (saved) {
      setName(saved.name || emp.name);
      setJobNum(saved.jobNum || emp.jobNum || "");
      setJobTitle(saved.jobTitle || emp.title || "");
      setDept(saved.dept || emp.dept || "");
      setFromDate(saved.fromDate || "");
      setToDate(saved.toDate || "");
      setDays(saved.days || "");
      setPurpose(saved.purpose || "");
      setReqDate(saved.reqDate || now.toISOString().split("T")[0]);
      setSigDataUrl(saved.sigDataUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      const diff = Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1;
      if (diff > 0) setDays(String(diff));
    }
  }, [fromDate, toDate]);

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, fromDate, toDate, days, purpose, reqDate, sigDataUrl });
    toast.success("✅ تم حفظ بيانات الإجازة الاعتيادية");
  };

  const fmtDateParts = (d) => {
    if (!d) return { y:"______", m:"______", day:"____" };
    const dt = new Date(d);
    return { y: dt.getFullYear(), m: String(dt.getMonth()+1).padStart(2,"0"), day: String(dt.getDate()).padStart(2,"0") };
  };

  const printForm = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:130px;max-height:55px;display:block;margin:auto;"/>`
      : `<div style="min-height:44px"></div>`;
    const rp = fmtDateParts(reqDate);
    const fp = fmtDateParts(fromDate);
    const sentenceDays = days || "______";
    const sentencePurpose = purpose || "_________________________________";

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>إجازة اعتيادية</title>
<style>
  @page{size:A5 landscape;margin:7mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;direction:rtl}
  /* ===== ترويسة الوثيقة ===== */
  .doc-header{width:100%;border-collapse:collapse;font-size:8pt}
  .doc-header td{border:1px solid #555;padding:3px 6px;text-align:center;vertical-align:middle}
  .dh-company{font-size:9.5pt;font-weight:bold;background:#f0f0f0;width:16%}
  .dh-label{font-size:7.5pt;color:#444;text-align:right;padding-right:5px;background:#fafafa;width:13%}
  .dh-main{font-size:10pt;font-weight:bold;width:40%}
  .dh-code{font-size:8pt;font-weight:bold;width:18%}
  .dh-info-cell{width:11%}
  .dh-logo{width:10%;padding:2px}
  .ref-num{text-align:left;direction:ltr;font-size:7.5pt;margin:1px 0 5px;padding-left:4px}
  /* ===== صندوق الاستمارة ===== */
  .main-box{border:2px solid #222;padding:7px 10px}
  .top-date{font-size:8.5pt;text-align:left;direction:ltr;margin-bottom:4px}
  .top-title{font-size:11pt;font-weight:bold;text-align:center;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:6px}
  .field-row{display:flex;align-items:baseline;gap:8px;margin-bottom:5px;flex-wrap:wrap}
  .lbl{font-weight:bold;white-space:nowrap;font-size:9pt}
  .val{min-width:50px;flex:1;font-size:9pt}
  .sentence{font-size:9.5pt;margin:7px 0;line-height:2.3;border:1px solid #ccc;padding:5px 8px;background:#fafafa}
  .blank{display:inline-block;min-width:36px;text-align:center;font-weight:bold;padding:0 2px}
  .blank-lg{min-width:110px}
  .sig-row{display:flex;gap:10px;margin-top:8px}
  .sig-box{border:1px solid #333;text-align:center;padding:5px 4px;min-height:60px;flex:1}
  .sig-title{font-weight:bold;font-size:8.5pt;margin-bottom:4px}
  .disclaimer{font-size:6.5pt;text-align:center;margin-top:5px;color:#555;border-top:1px dotted #aaa;padding-top:3px}
</style></head>
<body>
<!-- ترويسة الوثيقة -->
<table class="doc-header">
  <tr>
    <td rowspan="2" class="dh-company">شركة نفط البصرة<br/>(شركة عامة)</td>
    <td class="dh-label">عنوان النموذج</td>
    <td colspan="3" class="dh-main">نموذج إجازة اعتيادية</td>
    <td rowspan="2" class="dh-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="52" height="52">
        <rect width="120" height="120" fill="white"/>
        <!-- Red upper C section: 210°→355° outer arc, then 355°→210° inner arc -->
        <path d="M 17.8,31.3 A 54,54 0 0,1 113.8,55.3 L 93.9,57 A 34,34 0 0,0 32.2,40.5 Z" fill="#cc1122" transform="translate(6,6)"/>
        <!-- White stripe: 355°→5° -->
        <path d="M 113.8,55.3 A 54,54 0 0,1 113.8,64.7 L 93.9,63 A 34,34 0 0,0 93.9,57 Z" fill="white" transform="translate(6,6)"/>
        <!-- Black lower C section: 5°→150° -->
        <path d="M 113.8,64.7 A 54,54 0 0,1 17.8,88.7 L 32.2,79.5 A 34,34 0 0,0 93.9,63 Z" fill="#111111" transform="translate(6,6)"/>
        <!-- White inner circle -->
        <circle cx="60" cy="60" r="30" fill="white"/>
        <!-- Green oil drop (teardrop, point up) -->
        <path d="M60,37 C72,51 80,63 80,71 Q80,90 60,90 Q40,90 40,71 C40,63 48,51 60,37Z" fill="#1e8b3a"/>
        <!-- Drop highlight -->
        <ellipse cx="53" cy="52" rx="4" ry="7" fill="rgba(255,255,255,0.55)" transform="rotate(-25,53,52)"/>
        <!-- Arabic text on red arc -->
        <text x="60" y="22" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="8.5" font-weight="bold">شركة نفط البصرة</text>
        <!-- B.O.C text on black arc -->
        <text x="60" y="106" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="9.5" font-weight="bold" letter-spacing="1">B.O.C</text>
      </svg>
    </td>
  </tr>
  <tr>
    <td class="dh-label">رمز النموذج</td>
    <td class="dh-code">BOC-P-13/F03</td>
    <td class="dh-info-cell">رقم الإصدار: 2</td>
    <td class="dh-info-cell">تاريخ الإصدار: 2022/6/1</td>
  </tr>
</table>
<div class="ref-num">372.3000.450</div>
<!-- صندوق الاستمارة -->
<div class="main-box">
  <div class="top-date">التاريخ: &nbsp;${rp.day}&nbsp; / &nbsp;${rp.m}&nbsp; / &nbsp;${rp.y}</div>
  <div class="top-title">م/ إجازة اعتيادية</div>
  <div class="field-row">
    <span class="lbl">الاسم الثلاثي:</span><span class="val">${name}</span>
  </div>
  <div class="field-row">
    <span class="lbl">الرقم الوظيفي:</span><span class="val">${jobNum}</span>
  </div>
  <div class="field-row">
    <span class="lbl">العنوان الوظيفي:</span><span class="val">${jobTitle}</span>
  </div>
  <div class="sentence">
    يرجى منحي إجازة اعتيادية لمدة
    (<span class="blank">&nbsp;${sentenceDays}&nbsp;</span>)
    يوماً اعتباراً من
    (<span class="blank">&nbsp;${fp.day}&nbsp;</span> / <span class="blank">&nbsp;${fp.m}&nbsp;</span> / <span class="blank">&nbsp;${fp.y}&nbsp;</span>)
    لغرض (<span class="blank blank-lg">&nbsp;${sentencePurpose}&nbsp;</span>)
  </div>
  <div class="sig-row">
    <div class="sig-box"><div class="sig-title">توقيع طالب الإجازة</div>${sigHtml}</div>
    <div class="sig-box"><div class="sig-title">توقيع المسؤول</div></div>
  </div>
</div>
<div class="disclaimer">يعتبر هذا النموذج ملك لشركة نفط البصرة فقط، لايجوز نسخه او الكشف عن محتواه بدون موافقة خطية مسبقة من قبل شركة نفط البصرة.</div>
</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة اعتيادية</h2><p className="text-xs text-secondary">BOC-P-13/F03 — طباعة A5 landscape</p></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">الاسم الثلاثي</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">العنوان الوظيفي</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">من تاريخ</label><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">إلى تاريخ</label><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">عدد الأيام</label><input type="number" min="1" value={days} onChange={e=>setDays(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">غرض الإجازة</label><input value={purpose} onChange={e=>setPurpose(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الطلب</label><input type="date" value={reqDate} onChange={e=>setReqDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع طالب الإجازة (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم توقيعك ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
      </div>
      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== نموذج الإجازة المرضية ==========
function SickLeaveForm({ emp }) {
  const toast = useToast();
  const STORAGE_KEY = `sick_leave_${emp.id}`;

  const [name, setName] = useState(emp.name);
  const [jobNum, setJobNum] = useState(emp.jobNum || "");
  const [jobTitle, setJobTitle] = useState(emp.title || "");
  const [leaveDateTime, setLeaveDateTime] = useState("");
  const [clinicDateTime, setClinicDateTime] = useState("");
  const [returnDateTime, setReturnDateTime] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [sigDataUrl, setSigDataUrl] = useState(null);

  useEffect(() => {
    const saved = storage.get(STORAGE_KEY, null);
    if (saved) {
      setName(saved.name || emp.name);
      setJobNum(saved.jobNum || emp.jobNum || "");
      setJobTitle(saved.jobTitle || emp.title || "");
      setLeaveDateTime(saved.leaveDateTime || "");
      setClinicDateTime(saved.clinicDateTime || "");
      setReturnDateTime(saved.returnDateTime || "");
      setDoctorNotes(saved.doctorNotes || "");
      setSigDataUrl(saved.sigDataUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, leaveDateTime, clinicDateTime, returnDateTime, doctorNotes, sigDataUrl });
    toast.success("✅ تم حفظ بيانات الإجازة المرضية");
  };

  const fmtDT = (v) => {
    if (!v) return "___________";
    const dt = new Date(v);
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}  ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
  };

  const printForm = () => {
    const sigHtml = sigDataUrl ? `<img src="${sigDataUrl}" style="max-width:120px;max-height:50px;display:block;margin:auto;"/>` : `<div style="min-height:38px"></div>`;
    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>إجازة مرضية</title>
<style>
  @page{size:A5 portrait;margin:8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;direction:rtl}
  .header{display:flex;border:1.5px solid #333;margin-bottom:5px}
  .h-logo{width:42px;border-left:1px solid #333;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10.5pt}
  .h-mid{flex:1;text-align:center;padding:4px 6px}
  .h-ref{width:85px;border-right:1px solid #333;padding:3px 5px;font-size:7.5pt;text-align:center;line-height:1.6}
  .company{font-size:10.5pt;font-weight:bold}
  .csub{font-size:8pt}
  .form-title{font-size:11pt;font-weight:bold;text-align:center;margin-bottom:5px;border:1.5px solid #333;padding:3px}
  .fr{display:flex;align-items:baseline;gap:6px;margin-bottom:5px;border-bottom:1px dotted #bbb;padding-bottom:3px}
  .lbl{font-weight:bold;font-size:8.5pt;min-width:70px;white-space:nowrap}
  .val{flex:1;font-size:9pt}
  .sig-box{border:1.5px solid #333;text-align:center;padding:4px;min-height:58px;margin:5px 0}
  .stitle{font-weight:bold;font-size:8.5pt;margin-bottom:3px}
  .divider{border-top:1.5px solid #333;margin:6px 0}
  .fn{font-size:7pt;margin-top:6px;text-align:center;border-top:1px dotted #aaa;padding-top:3px;color:#555}
</style></head>
<body>
<div class="header">
  <div class="h-logo">BOC</div>
  <div class="h-mid"><div class="company">شركة نفط البصرة (شركة عامة)</div><div class="csub">استمارة ترك العمل للعلاج الطبي</div></div>
  <div class="h-ref"><div>BOC-P-13//F02</div><div>2019/9/7</div><div>372-3000-400</div></div>
</div>
<div class="form-title">نموذج إجازة مرضية</div>
<div class="fr"><span class="lbl">الاسم:</span><span class="val">${name}</span></div>
<div class="fr"><span class="lbl">الرقم الوظيفي:</span><span class="val">${jobNum}</span></div>
<div class="fr"><span class="lbl">المهنة:</span><span class="val">${jobTitle}</span></div>
<div class="fr"><span class="lbl">تاريخ/وقت ترك العمل:</span><span class="val">${fmtDT(leaveDateTime)}</span></div>
<div class="sig-box"><div class="stitle">توقيع المسؤول</div>${sigHtml}</div>
<div class="divider"></div>
<div class="fr"><span class="lbl">تاريخ/وقت مراجعة المستوصف:</span><span class="val">${fmtDT(clinicDateTime)}</span></div>
<div class="fr"><span class="lbl">ملاحظات الطبيب:</span><span class="val">${doctorNotes}</span></div>
<div class="sig-box"><div class="stitle">توقيع الطبيب</div></div>
<div class="fr"><span class="lbl">تاريخ/وقت العودة للعمل:</span><span class="val">${fmtDT(returnDateTime)}</span></div>
<div class="fn">تحتفظ الجهة بنسخة وتسلم نسخة للموظف</div>
</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة مرضية</h2><p className="text-xs text-secondary">BOC-P-13//F02 — طباعة A5 portrait</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">الاسم</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">المهنة</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ/وقت ترك العمل</label><input type="datetime-local" value={leaveDateTime} onChange={e=>setLeaveDateTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع المسؤول (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم التوقيع ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ/وقت مراجعة المستوصف</label><input type="datetime-local" value={clinicDateTime} onChange={e=>setClinicDateTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">ملاحظات الطبيب</label><textarea value={doctorNotes} onChange={e=>setDoctorNotes(e.target.value)} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none"/></div>
      <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ/وقت العودة للعمل</label><input type="datetime-local" value={returnDateTime} onChange={e=>setReturnDateTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== صفحة نماذج الإجازات ==========
function LeaveFormsPrintPage({ emp }) {
  const [tab, setTab] = useState("annual");
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex gap-2 mb-5">
        <button onClick={()=>setTab("annual")} className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="annual"?"bg-blue-600 text-white border-blue-600":"btn-secondary border-color"}`}>إجازة اعتيادية</button>
        <button onClick={()=>setTab("sick")} className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="sick"?"bg-rose-500 text-white border-rose-500":"btn-secondary border-color"}`}>إجازة مرضية</button>
      </div>
      {tab==="annual" ? <AnnualLeaveForm emp={emp}/> : <SickLeaveForm emp={emp}/>}
    </div>
  );
}

// ========== اللوحة الرئيسية ==========
function Dashboard({ emp, onLogout, dark, setDark }) {
  const [view, setView] = useState("home");
  const [allRequests, setAllRequests] = useState(() => storage.get("all_requests", []));
  const [employees, setEmployees] = useState(ACCOUNTS);
  const { isConnected } = useConnectionStatus();
  const smartAlerts = useSmartAlerts(employees);
  const confirm = useConfirm();
  const [showSearch, setShowSearch] = useState(false);
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004" || emp.username === "i.shawi";
  const pendingCount = allRequests.filter(r => r.status === "بانتظار المراجعة").length;
  const unreadNotifs = (storage.get(`notifications_${emp.id}`, [])).filter(n => !n.read).length;

  useEffect(() => {
    const nc = sessionStorage.getItem("force_password_change");
    if (nc) { sessionStorage.removeItem("force_password_change"); setTimeout(async () => { if(await confirm("يُنصح بتغيير كلمة المرور الافتراضية الآن لأمان حسابك.", { title: "🔐 تغيير كلمة المرور", ok: "تغيير الآن" })) setView("changepass"); }, 500); }
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey||e.metaKey) && e.key==="k") { e.preventDefault(); setShowSearch(true); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
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
    { id:"maint_equipment", label:"المعدات والصيانة", icon:<Wrench size={17}/> },
    { id:"maint_parts",    label:"قطع غيار الصيانة", icon:<Box size={17}/> },
    { id:"maint_reports",  label:"تقارير الصيانة",   icon:<TrendingUp size={17}/> },
    { id:"chat", label:"الدردشة", icon:<MessageSquare size={17}/> },
    { id:"evaluation", label:"التقييم", icon:<Star size={17}/> },
    { id:"notifications", label:"الإشعارات", icon:<Bell size={17}/>, badge:unreadNotifs },
    { id:"audit", label:"سجل التعديلات", icon:<ClipboardList size={17}/> },
    { id:"changepass", label:"تغيير المرور", icon:<Shield size={17}/> },
    { id:"health_insurance", label:"الضمان الصحي", icon:<Heart size={17}/> },
    { id:"leave_forms", label:"نماذج الإجازات", icon:<FileText size={17}/> },
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
          {/* Global Search Button */}
          <button onClick={()=>setShowSearch(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl btn-secondary border border-color text-secondary hover:text-primary text-xs">
            <Search size={14}/> <span className="hidden md:inline">بحث</span> <kbd className="hidden md:inline px-1 bg-hover rounded text-[10px]">Ctrl K</kbd>
          </button>
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
          {/* Breadcrumb */}
          {view !== "home" && (
            <div className="flex items-center gap-1.5 text-sm text-secondary mb-4">
              <button onClick={()=>setView("home")} className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Home size={13}/> الرئيسية
              </button>
              <ChevronLeft size={13}/>
              <span className="font-semibold text-primary">{VIEW_LABELS[view] || view}</span>
            </div>
          )}
          {view==="home" && (
            <div className="space-y-6">
              {/* Welcome */}
              <div className="card rounded-2xl p-6 border-color border">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center"><User size={28} className="text-white"/></div>
                  <div>
                    <h2 className="text-xl font-bold">مرحباً، {emp.name.split(" ")[0]}</h2>
                    <p className="text-secondary text-sm">{emp.title} — {emp.dept}</p>
                    <p className="text-secondary text-xs">{new Date().toLocaleDateString("ar-IQ",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
                  </div>
                </div>
              </div>

              {/* ═══ قسم إدارة الموارد البشرية ═══ */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-1 bg-blue-600 rounded-full"/>
                  <h3 className="font-bold text-base">إدارة الموارد البشرية والمستودع</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label:"إجمالي الموظفين",  value:employees.length,                                                        icon:<Users size={22}/>,        color:"from-blue-500 to-blue-600",    action:()=>setView("employees") },
                    { label:"طلبات معلقة",       value:allRequests.filter(r=>r.status==="بانتظار المراجعة").length,             icon:<Clock size={22}/>,         color:"from-amber-500 to-amber-600",  action:()=>setView(isAdmin?"approvals":"requests") },
                    { label:"طلبات مقبولة",      value:allRequests.filter(r=>r.status==="موافق عليها").length,                  icon:<CheckCircle size={22}/>,   color:"from-emerald-500 to-emerald-600", action:()=>setView("requests") },
                    { label:"مخزون الآلات",      value:storage.get("inventory_items",[]).length,                               icon:<Package size={22}/>,       color:"from-violet-500 to-violet-600",  action:()=>setView("inventory") },
                    { label:"مخزون منخفض",       value:storage.get("inventory_items",[]).filter(i=>i.qty<=(i.minQty||3)).length, icon:<AlertTriangle size={22}/>, color:"from-red-500 to-red-600",       action:()=>setView("inventory") },
                    { label:"مهام نشطة",         value:storage.get("tasks",[]).filter(t=>t.status!=="مكتملة").length,           icon:<CheckSquare size={22}/>,   color:"from-indigo-500 to-indigo-600",  action:()=>setView("tasks") },
                  ].map((k,i)=>(
                    <button key={i} onClick={k.action} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white text-right hover:opacity-90 transition-opacity`}>
                      <div className="flex items-center justify-between">{k.icon}<p className="text-3xl font-bold">{k.value}</p></div>
                      <p className="text-sm mt-2 text-white/80">{k.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ═══ قسم الصيانة ═══ */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-1 bg-orange-500 rounded-full"/>
                  <h3 className="font-bold text-base">إدارة الصيانة والمعدات</h3>
                </div>
                {(() => {
                  const eq   = storage.get("equipment", INITIAL_EQUIPMENT);
                  const prts = storage.get("maint_spare_parts", INITIAL_MAINT_SPARE_PARTS);
                  const recs = storage.get("maintenance_records", []);
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label:"إجمالي المعدات",   value:eq.length,                                                      icon:<Wrench size={22}/>,        color:"from-blue-600 to-blue-700",    action:()=>setView("maint_equipment") },
                        { label:"معدات حرجة",        value:eq.filter(e=>e.critical).length,                               icon:<AlertTriangle size={22}/>,  color:"from-red-600 to-red-700",       action:()=>setView("maint_equipment") },
                        { label:"صيانة مستحقة",      value:eq.filter(e=>new Date(e.nextMaintenance)<=new Date()).length,  icon:<Clock size={22}/>,          color:"from-amber-600 to-amber-700",   action:()=>setView("maint_equipment") },
                        { label:"طلبات قيد التنفيذ", value:recs.filter(r=>r.status!=="مكتملة").length,                   icon:<CheckCircle size={22}/>,    color:"from-orange-500 to-orange-600", action:()=>setView("maint_equipment") },
                        { label:"قطع الغيار",        value:prts.length,                                                    icon:<Box size={22}/>,            color:"from-emerald-600 to-emerald-700",action:()=>setView("maint_parts") },
                        { label:"مخزون قطع منخفض",  value:prts.filter(p=>p.qty<=p.minAlert).length,                     icon:<AlertTriangle size={22}/>,  color:"from-rose-500 to-rose-600",     action:()=>setView("maint_parts") },
                        { label:"صيانة مكتملة",      value:recs.filter(r=>r.status==="مكتملة").length,                   icon:<CheckCircle size={22}/>,    color:"from-teal-500 to-teal-600",     action:()=>setView("maint_reports") },
                        { label:"معدات جيدة",        value:eq.filter(e=>e.status==="جيد").length,                        icon:<Wrench size={22}/>,         color:"from-cyan-500 to-cyan-600",     action:()=>setView("maint_equipment") },
                      ].map((k,i)=>(
                        <button key={i} onClick={k.action} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white text-right hover:opacity-90 transition-opacity`}>
                          <div className="flex items-center justify-between">{k.icon}<p className="text-3xl font-bold">{k.value}</p></div>
                          <p className="text-sm mt-2 text-white/80">{k.label}</p>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* ═══ أحدث الطلبات والصيانة جنباً إلى جنب ═══ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* آخر طلبات الإجازة */}
                <div className="card rounded-2xl border-color border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm flex items-center gap-1.5"><FileText size={15}/> آخر طلبات الإجازة</h4>
                    <button onClick={()=>setView(isAdmin?"approvals":"requests")} className="text-xs text-blue-600 hover:underline">عرض الكل</button>
                  </div>
                  {allRequests.length===0 ? <p className="text-secondary text-xs text-center py-4">لا توجد طلبات</p> :
                  allRequests.slice(0,4).map(r=>(
                    <div key={r.id} className="flex justify-between items-center py-2 border-b border-color last:border-0 text-xs">
                      <span className="font-medium">{r.empName?.split(" ").slice(0,2).join(" ")}</span>
                      <span className="text-secondary">{r.type} — {r.days} يوم</span>
                      <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${r.status==="موافق عليها"?"bg-emerald-100 text-emerald-700":r.status==="مرفوضة"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{r.status}</span>
                    </div>
                  ))}
                </div>

                {/* آخر طلبات الصيانة */}
                <div className="card rounded-2xl border-color border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm flex items-center gap-1.5"><Wrench size={15}/> آخر طلبات الصيانة</h4>
                    <button onClick={()=>setView("maint_equipment")} className="text-xs text-blue-600 hover:underline">عرض الكل</button>
                  </div>
                  {(() => {
                    const recs = storage.get("maintenance_records",[]);
                    return recs.length===0 ? <p className="text-secondary text-xs text-center py-4">لا توجد طلبات صيانة</p> :
                    recs.slice(0,4).map(r=>(
                      <div key={r.id} className="flex justify-between items-center py-2 border-b border-color last:border-0 text-xs">
                        <span className="font-medium truncate max-w-[120px]">{r.equipmentName}</span>
                        <span className="text-secondary">{new Date(r.requestedAt).toLocaleDateString("ar-IQ")}</span>
                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${r.status==="مكتملة"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{r.status}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
          {view==="analytics" && <AnalyticsDashboard employees={employees} allRequests={allRequests}/>}
          {view==="requests" && <RequestsPage emp={emp}/>}
          {view==="attendance" && <AttendanceSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>}
          {view==="training" && <TrainingSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>}
          {view==="tasks" && <TasksSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>}
          {view==="inventory" && <InventorySystem/>}
          {view==="furniture" && <FurnitureInventory/>}
          {view==="maint_equipment" && <EquipmentMaintenance/>}
          {view==="maint_parts" && <MaintenanceParts/>}
          {view==="maint_reports" && <MaintenanceAnalytics/>}
          {view==="chat" && <InternalChat emp={emp} isConnected={isConnected}/>}
          {view==="evaluation" && <EvaluationSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>}
          {view==="notifications" && <NotificationsPage emp={emp}/>}
          {view==="audit" && <AuditLogPage/>}
          {view==="changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout}/>}
          {view==="employees" && isAdmin && <EmployeeManager employees={employees} setEmployees={setEmployees}/>}
          {view==="approvals" && isAdmin && <ApprovalsPage emp={emp}/>}
          {view==="health_insurance" && <HealthInsuranceForm emp={emp}/>}
          {view==="leave_forms" && <LeaveFormsPrintPage emp={emp}/>}
        </main>
      </div>
      {showSearch && <GlobalSearch setView={setView} onClose={()=>setShowSearch(false)}/>}
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
    @keyframes toastIn { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
    .toast-item { animation: toastIn 0.25s ease-out; }
    @keyframes shimmer { from { background-position:-200% 0; } to { background-position:200% 0; } }
    .skeleton { background: linear-gradient(90deg,${dark?"#334155 25%,#475569 50%,#334155 75%":"#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%"}); background-size:200% 100%; animation:shimmer 1.5s infinite; }
  `;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <style>{style}</style>
        {user
          ? <Dashboard emp={user} onLogout={()=>{sessionStorage.clear();setUser(null);}} dark={dark} setDark={setDark}/>
          : <LoginScreen onLogin={setUser} dark={dark}/>
        }
      </ConfirmProvider>
    </ToastProvider>
  );
}
