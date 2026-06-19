import React, { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from "react";
import {
  LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User,
  CheckCircle, Wifi, WifiOff, FileText, Clock, Calendar,
  Bell, ThumbsUp, ThumbsDown, Plus, Trash2, Edit3, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star,
  Printer, Download, Search, Moon, Sun, MessageSquare,
  CheckSquare, AlertTriangle, ChevronLeft,
  Send, Wrench, Box, TrendingUp, TrendingDown, Heart, UserPlus,
  Briefcase, Layers, Activity, Flag, FolderOpen, FileCheck, DollarSign, Target,
  Upload, Globe
} from "lucide-react";
import {
  FIREBASE_URL, ACCOUNTS, DEFAULT_PASSWORD, LOW_STOCK_THRESHOLD,
  LEAVE_TYPES, TRAINING_TYPES, ITEM_CONDITIONS, FURNITURE_CATS, INVENTORY_CATS,
  TASK_PRIORITIES, TASK_STATUSES, EVAL_CRITERIA, MARITAL_STATUS_LIST, PROCEDURE_TYPES,
  EQ_TYPES, EQ_STATUS_COLORS, INITIAL_EQUIPMENT, INITIAL_MAINT_SPARE_PARTS,
  PIE_COLORS, MONTHS_AR, MONTHS_IRAQI, VIEW_LABELS,
  GDRIVE_WARN_PCT, GDRIVE_CRIT_PCT,
} from "./constants";
import { storage, passStore, hashPassword, isHash, printElement, exportCSV } from "./utils";
import { FirebaseAPI } from "./firebase";
import { GDriveAPI, GDriveContext, GDriveProvider, useGDrive } from "./gdrive";



// ========== نظام الإشعارات الفورية ==========
const ToastContext = createContext(null);
const useToast = () => useContext(ToastContext);

const TOAST_CFG = {
  success: { border: "border-r-[3px] border-emerald-500", icon: <CheckCircle size={15} className="text-emerald-500 shrink-0"/> },
  error:   { border: "border-r-[3px] border-red-500",     icon: <AlertCircle  size={15} className="text-red-500 shrink-0"/> },
  warning: { border: "border-r-[3px] border-[#C87A2E]",   icon: <AlertTriangle size={15} className="text-[#C87A2E] shrink-0"/> },
  info:    { border: "border-r-[3px] border-blue-500",    icon: <AlertCircle  size={15} className="text-blue-400 shrink-0"/> },
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
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col-reverse gap-2 pointer-events-none" dir="rtl">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item flex items-center gap-3 px-4 py-3 rounded-md pointer-events-auto min-w-[260px] max-w-xs border border-[#E4E2DC] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] ${TOAST_CFG[t.type].border}`}>
            {TOAST_CFG[t.type].icon}
            <span className="text-sm font-medium flex-1 text-[#1C1C1C]">{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-[#787774] hover:text-[#1C1C1C] shrink-0 transition-colors"><X size={13}/></button>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[300] flex items-center justify-center p-4" dir="rtl">
          <div className="card rounded-xl p-6 max-w-sm w-full border border-color shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-md mt-0.5 shrink-0 ${dlg.opts.danger ? "bg-red-50" : "bg-[#FDF3E7]"}`}>
                <AlertTriangle size={18} className={dlg.opts.danger ? "text-red-600" : "text-[#C87A2E]"}/>
              </div>
              <div>
                <h3 className="font-bold text-sm text-primary">{dlg.opts.title || "تأكيد الإجراء"}</h3>
                <p className="text-sm text-secondary mt-1.5 leading-relaxed">{dlg.msg}</p>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => close(false)} className="flex-1 py-2.5 border border-color rounded-md text-sm font-medium hover:bg-hover transition-colors text-secondary">إلغاء</button>
              <button onClick={() => close(true)} className={`flex-1 py-2.5 rounded-md text-white text-sm font-semibold transition-colors ${dlg.opts.danger ? "bg-red-600 hover:bg-red-700" : "bg-[#C87A2E] hover:bg-[#B06D27]"}`}>
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


function PrintButton({ targetId, label = "طباعة" }) {
  return (<button onClick={() => targetId ? printElement(targetId) : window.print()} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl shadow-sm border btn-secondary"><Printer size={13}/> {label}</button>);
}



// ── مكوّن إعدادات Google Drive ──
function GDriveSettingsModal({ onClose }) {
  const { isReady, quota, refreshQuota } = useGDrive();
  const [refreshing, setRefreshing] = useState(false);
  const addToast = useToast();

  const warnColor = quota?.pct >= GDRIVE_CRIT_PCT ? "text-red-600" : quota?.pct >= GDRIVE_WARN_PCT ? "text-amber-600" : "text-emerald-600";
  const barColor  = quota?.pct >= GDRIVE_CRIT_PCT ? "bg-red-500" : quota?.pct >= GDRIVE_WARN_PCT ? "bg-amber-500" : "bg-emerald-500";

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshQuota();
    setRefreshing(false);
    addToast("تم تحديث معلومات التخزين", "info");
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" dir="rtl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="text-2xl">☁️</span> Google Drive
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
        </div>

        {isReady ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
              <span className="text-emerald-600 text-lg">✅</span>
              <span className="font-medium text-emerald-800">متصل بـ Google Drive (مشترك للجميع)</span>
            </div>
            {quota && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>مساحة التخزين</span>
                  <span className={warnColor}>{quota.pct}% مستخدم</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className={`h-3 rounded-full transition-all ${barColor}`} style={{width:`${Math.min(quota.pct,100)}%`}}/>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>المستخدم: {quota.usageStr}</span>
                  <span>الحد: {quota.limitStr}</span>
                </div>
                <div className="text-xs text-center text-gray-500">المتاح: <strong>{quota.freeStr}</strong></div>
                {quota.pct >= GDRIVE_CRIT_PCT && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">⚠️ تحذير حرج: المساحة تكاد تكتمل!</div>}
                {quota.pct >= GDRIVE_WARN_PCT && quota.pct < GDRIVE_CRIT_PCT && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">📦 تحذير: اقتربت من الحد ({quota.pct}%).</div>}
                {quota.serviceAccountWarning && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800 space-y-1">
                    <p className="font-bold">⚠️ Service Account لا يملك مساحة تخزين شخصية</p>
                    <p className="text-xs">لرفع الملفات بشكل صحيح أضف متغيرات OAuth2 في Vercel:</p>
                    <p className="text-xs font-mono bg-orange-100 rounded p-1">GDRIVE_CLIENT_ID</p>
                    <p className="text-xs font-mono bg-orange-100 rounded p-1">GDRIVE_CLIENT_SECRET</p>
                    <p className="text-xs font-mono bg-orange-100 rounded p-1">GDRIVE_REFRESH_TOKEN</p>
                  </div>
                )}
              </div>
            )}
            <button onClick={handleRefresh} disabled={refreshing}
              className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50">
              {refreshing ? "⏳ جارٍ التحديث..." : "🔄 تحديث معلومات التخزين"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
              <span className="text-red-600 text-lg">❌</span>
              <span className="font-medium text-red-800">Google Drive غير متصل</span>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-xs space-y-1.5 border border-blue-100">
              <p className="font-bold text-blue-800 mb-2">خطوات الإعداد (للمسؤول — مرة واحدة فقط):</p>
              <p>1️⃣ <strong>console.cloud.google.com</strong> ← IAM & Admin ← Service Accounts</p>
              <p className="font-bold text-orange-700 mt-1">الطريقة المثلى (OAuth2 — مساحة 15 GB مجاناً):</p>
              <p>1️⃣ في <strong>console.cloud.google.com</strong> ← APIs & Services ← Credentials أنشئ OAuth 2.0 Client ID (Web)</p>
              <p>2️⃣ في <strong>developers.google.com/oauthplayground</strong> سجّل دخولك، اختر Drive API v3 ← كل النطاقات ← احصل على Refresh Token</p>
              <p>3️⃣ في <strong>Vercel ← Settings ← Environment Variables</strong> أضف:</p>
              <p className="pl-3">• <code className="bg-blue-100 px-1">GDRIVE_CLIENT_ID</code></p>
              <p className="pl-3">• <code className="bg-blue-100 px-1">GDRIVE_CLIENT_SECRET</code></p>
              <p className="pl-3">• <code className="bg-blue-100 px-1">GDRIVE_REFRESH_TOKEN</code></p>
              <p className="pl-3">• <code className="bg-blue-100 px-1">GDRIVE_FOLDER_ID</code> = ID مجلد Drive (اختياري)</p>
              <p>4️⃣ أعد نشر التطبيق من Vercel Dashboard</p>
              <p className="text-gray-400 mt-1">أو استخدم Service Account مع GDRIVE_SERVICE_ACCOUNT (لكن قد تواجه مشكلة حصة التخزين)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── شريط تحذير المساحة ──
function GDriveQuotaBar() {
  const { isReady, quota } = useGDrive();
  if (!isReady || !quota || quota.pct < GDRIVE_WARN_PCT) return null;
  const isCrit = quota.pct >= GDRIVE_CRIT_PCT;
  return (
    <div className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${isCrit ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>
      <AlertTriangle size={15} className="shrink-0"/>
      <span>
        {isCrit
          ? `🚨 Google Drive ممتلئ تقريباً (${quota.pct}%) — المتاح: ${quota.freeStr} فقط!`
          : `⚠️ تحذير: مساحة Google Drive وصلت ${quota.pct}% (متاح: ${quota.freeStr})`
        }
      </span>
    </div>
  );
}


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

// ========== كشف الجهاز والمتصفح ==========
function detectDevice() {
  const ua = navigator.userAgent;
  let device = "كمبيوتر";
  if (/iPad/.test(ua)) device = "iPad";
  else if (/iPhone/.test(ua)) device = "iPhone";
  else if (/Android.*Mobile/.test(ua)) device = "هاتف ذكي";
  else if (/Android/.test(ua)) device = "تابلت";
  let browser = "متصفح";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome/.test(ua)) browser = "Chrome";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Safari/.test(ua)) browser = "Safari";
  let os = "—";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return { device, browser, os };
}

// ========== RBAC ==========
const PERMISSIONS_DEF = {
  FULL_ACCESS:       { label:"صلاحية كاملة",        icon:"🛡" },
  MANAGE_USERS:      { label:"إدارة الموظفين",       icon:"👥" },
  VIEW_LOGIN_HIST:   { label:"سجل الدخول",          icon:"📋" },
  KILL_SESSIONS:     { label:"إنهاء جلسات",         icon:"🔌" },
  MANAGE_ROLES:      { label:"إدارة الصلاحيات",     icon:"🔑" },
  MANAGE_EQUIPMENT:  { label:"إدارة المعدات",        icon:"⚙" },
  MANAGE_SPAREPARTS: { label:"إدارة قطع الغيار",    icon:"🔧" },
  MANAGE_INVENTORY:  { label:"إدارة المخزن والأثاث", icon:"📦" },
  APPROVE_REQUESTS:  { label:"الموافقة على الطلبات",icon:"✅" },
  SYSTEM_SETTINGS:   { label:"إعدادات النظام",       icon:"🔩" },
  VIEW_AUDIT:        { label:"سجل التعديلات",        icon:"📊" },
};
const BUILT_IN_ROLES = {
  SUPER_ADMIN:       { label:"مشرف عام",      color:"bg-red-100 text-red-800",      permissions:["FULL_ACCESS"] },
  ADMIN:             { label:"مدير إداري",    color:"bg-blue-100 text-blue-800",    permissions:["MANAGE_USERS","VIEW_LOGIN_HIST","APPROVE_REQUESTS","VIEW_AUDIT","KILL_SESSIONS"] },
  MAINTENANCE:       { label:"مدير صيانة",   color:"bg-orange-100 text-orange-800", permissions:["MANAGE_EQUIPMENT","MANAGE_SPAREPARTS"] },
  WAREHOUSE_MANAGER: { label:"مسؤول المخزن", color:"bg-teal-100 text-teal-800",     permissions:["MANAGE_INVENTORY"] },
  EMPLOYEE:          { label:"موظف",          color:"bg-gray-100 text-gray-700",    permissions:[] },
};
function getEmpStatus(empId) { return storage.get(`emp_status_${empId}`, { active:true, role:"EMPLOYEE" }); }
function setEmpStatus(empId, val) { storage.set(`emp_status_${empId}`, val); }
function hasPermission(emp, perm) {
  if (!emp) return false;
  const s = getEmpStatus(emp.id);
  const roleName = s.role || (emp.role === "admin" ? "SUPER_ADMIN" : "EMPLOYEE");
  const customRoles = storage.get("custom_roles", {});
  const roleDef = customRoles[roleName] || BUILT_IN_ROLES[roleName] || BUILT_IN_ROLES.EMPLOYEE;
  return (roleDef.permissions || []).some(p => p === "FULL_ACCESS" || p === perm);
}

// ========== سجل الدخول ==========
function recordLoginAttempt(account, status, failReason = null) {
  const { device, browser, os } = detectDevice();
  const sessionId = status === "success" ? `sess_${Date.now()}_${Math.random().toString(36).slice(2,7)}` : null;
  const rec = {
    id: `${Date.now()}_${Math.random()}`,
    userId: account?.id ?? null,
    userName: account?.name ?? "—",
    userJobNum: account?.jobNum ?? "—",
    loginTime: new Date().toISOString(),
    device, browser, os,
    ip: "شبكة داخلية",
    status, failReason, sessionId,
    logoutTime: null, sessionDuration: null,
  };
  const histRaw = storage.get("login_history", []);
  const hist = Array.isArray(histRaw) ? histRaw : [];
  hist.unshift(rec);
  if (hist.length > 500) hist.length = 500;
  storage.set("login_history", hist);
  // إرسال السجل إلى Firebase لتجميع سجلات جميع الأجهزة مركزياً
  fetch(`${FIREBASE_URL}/login_history.json`, {
    method: "POST",
    body: JSON.stringify(rec),
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});
  if (status === "success" && sessionId) {
    try { sessionStorage.setItem("boc_session_id", sessionId); } catch {}
    const sessionsRaw = storage.get("active_sessions", []);
    const sessions = Array.isArray(sessionsRaw) ? sessionsRaw : [];
    const idx = sessions.findIndex(s => s.userId === account.id);
    const sess = { sessionId, userId:account.id, userName:account.name, userJobNum:account.jobNum, loginTime:rec.loginTime, device, browser, os };
    if (idx >= 0) sessions[idx] = sess; else sessions.push(sess);
    storage.set("active_sessions", sessions);
  }
}
function recordLogoutFn(userId) {
  let sessionId = null;
  try { sessionId = sessionStorage.getItem("boc_session_id"); } catch {}
  if (!sessionId) return;
  const histRaw = storage.get("login_history", []);
  const hist = Array.isArray(histRaw) ? histRaw : [];
  const i = hist.findIndex(h => h.sessionId === sessionId);
  if (i >= 0) {
    hist[i].logoutTime = new Date().toISOString();
    hist[i].sessionDuration = Math.floor((Date.now() - new Date(hist[i].loginTime).getTime()) / 1000);
    storage.set("login_history", hist);
  }
  const sessionsRaw = storage.get("active_sessions", []);
  const sessions = Array.isArray(sessionsRaw) ? sessionsRaw : [];
  storage.set("active_sessions", sessions.filter(s => s.sessionId !== sessionId));
  try { sessionStorage.removeItem("boc_session_id"); } catch {}
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
    try {

    // ── 1. جلب بيانات الحساب ───────────────────────────────────────────────
    let account = null;
    if (isConnected) {
      const fb = await FirebaseAPI.fetchAccount(user.trim());
      if (fb) {
        account = fb;
        storage.set(`cached_account_${fb.id}`, fb);
      }
    }
    if (!account) account = storage.get(`cached_account_${user.trim()}`)
                         || ACCOUNTS.find(a => a.jobNum === user.trim());
    if (!account) { setErr("الرقم الوظيفي غير موجود"); return; }

    // ── 2. التحقق من كلمة المرور ───────────────────────────────────────────
    let isValid = false;
    const inputHash = await hashPassword(pass.trim());
    const localPass = passStore.get(`pass_${account.id}`);
    const defaultPass = DEFAULT_PASSWORD;

    if (localPass) {
      if (isHash(localPass)) {
        isValid = inputHash !== null && inputHash === localPass;
      } else {
        // ترقية تلقائية من نص إلى hash
        isValid = pass.trim() === localPass;
        if (isValid && inputHash) {
          passStore.set(`pass_${account.id}`, inputHash);
          if (isConnected) await FirebaseAPI.savePassword(account.id, inputHash);
        }
      }
      // احتياطي: إذا فشل الهاش المخزّن وأدخل المستخدم كلمة المرور الافتراضية — أعد الضبط
      if (!isValid && defaultPass && pass.trim() === defaultPass) {
        isValid = true;
        if (inputHash) {
          passStore.set(`pass_${account.id}`, inputHash);
          if (isConnected) await FirebaseAPI.savePassword(account.id, inputHash);
        }
      }
    } else if (isConnected) {
      // حاول /passwords/{id} أولاً (كلمة مرور مغيّرة)
      const fp = await FirebaseAPI.getPassword(account.id);
      if (fp) {
        isValid = isHash(fp) ? (inputHash !== null && inputHash === fp) : pass.trim() === fp;
        if (isValid) {
          const toStore = isHash(fp) ? fp : (inputHash || null);
          if (toStore) passStore.set(`pass_${account.id}`, toStore);
          if (!isHash(fp) && inputHash) await FirebaseAPI.savePassword(account.id, inputHash);
        }
        // Fallback: Firebase hash doesn't match — try default password anyway
        if (!isValid && defaultPass && pass.trim() === defaultPass) {
          isValid = true;
          if (inputHash) {
            passStore.set(`pass_${account.id}`, inputHash);
            await FirebaseAPI.savePassword(account.id, inputHash);
          }
        }
      } else {
        // حاول /init_hashes/{jobNum} (كلمة المرور الافتراضية المشفّرة في Firebase)
        const initH = await FirebaseAPI.fetchInitHash(user.trim());
        if (initH) {
          isValid = inputHash !== null && inputHash === initH;
          if (isValid) passStore.set(`pass_${account.id}`, initH); // احفظ للجلسات القادمة
        }
        // احتياطي نهائي: كلمة المرور الافتراضية الموحّدة
        if (!isValid) {
          const def = DEFAULT_PASSWORD;
          isValid = pass.trim() === def;
          if (isValid && inputHash) passStore.set(`pass_${account.id}`, inputHash);
        }
      }
    } else {
      // غير متصل — الاحتياطي المحلي
      const def = DEFAULT_PASSWORD;
      isValid = pass.trim() === def;
      if (isValid && inputHash) passStore.set(`pass_${account.id}`, inputHash);
    }

    if (isValid) {
      clearLockData(user.trim());
      try { sessionStorage.setItem("boc_session", JSON.stringify({ acctId: account.id, expiry: Date.now() + 8 * 3600000 })); } catch {}
      if (pass.trim() === DEFAULT_PASSWORD && !localPass) { try { sessionStorage.setItem("force_password_change", "true"); } catch {} }
      // Check if account is disabled
      const empSt = getEmpStatus(account.id);
      if (!empSt.active) { setErr("هذا الحساب معطّل. تواصل مع المشرف."); recordLoginAttempt(account, "failed", "account_disabled"); return; }
      recordLoginAttempt(account, "success");
      onLogin(account);
    } else {
      const locked = recordFail(user.trim());
      const secs = lockSecsRemaining(user.trim());
      const { count } = getLockInfo(user.trim());
      recordLoginAttempt(account || {jobNum:user.trim()}, "failed", locked ? "too_many_attempts" : "wrong_password");
      if (locked) {
        startCountdown(secs);
        setErr(`تم قفل الحساب لمدة 15 دقيقة بعد ${LOCK_LIMIT} محاولات فاشلة`);
      } else {
        setErr(`كلمة المرور غير صحيحة — محاولة ${count} من ${LOCK_LIMIT}`);
      }
    }

    } catch (e) {
      console.error("login error:", e);
      setErr(`خطأ: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const resetPass = async () => {
    const acc = ACCOUNTS.find(a => a.jobNum === user.trim());
    if (!user.trim()) { setErr("أدخل الرقم الوظيفي أولاً"); return; }
    if (!acc) { setErr("الرقم الوظيفي غير موجود"); return; }
    sessionStorage.removeItem(`pass_${acc.id}`);
    localStorage.removeItem(`pass_${acc.id}`);
    localStorage.removeItem(`login_lock_${acc.jobNum}`);
    if (isConnected) await FirebaseAPI.deletePassword(acc.id);
    setErr(""); setPass("");
    alert(`تمت إعادة ضبط كلمة مرور ${acc.name}\nالرقم الوظيفي: ${acc.jobNum}\nكلمة المرور الافتراضية: ${acc.password}`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" dir="rtl">
      {/* Panel Right — Branding (dark industrial) */}
      <div className="md:w-5/12 bg-[#0D1117] flex flex-col justify-between p-10 min-h-[200px] md:min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.035]" style={{backgroundImage:"linear-gradient(to right,#C87A2E 1px,transparent 1px),linear-gradient(to bottom,#C87A2E 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
        <div className="relative z-10">
          <div className="w-14 h-14 border-2 border-[#C87A2E] flex items-center justify-center mb-10">
            <span className="text-[#C87A2E] font-bold tracking-widest text-sm" style={{fontFamily:"'JetBrains Mono',monospace"}}>BOC</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">شركة نفط<br/>البصرة</h1>
          <p className="text-[#C87A2E] text-xs tracking-[0.25em] uppercase mt-3" style={{fontFamily:"'JetBrains Mono',monospace"}}>FAW WAREHOUSE DIVISION</p>
          <div className="mt-8 space-y-1">
            <p className="text-[#4B5563] text-[11px]" style={{fontFamily:"'JetBrains Mono',monospace"}}>SYS.REF: FAW-CTRL-001</p>
            <p className="text-[#4B5563] text-[11px]" style={{fontFamily:"'JetBrains Mono',monospace"}}>DEPT: Control & Systems</p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected?"bg-emerald-400":"bg-amber-400"}`} style={isConnected?{animation:"pulse 2s infinite"}:{}}/>
          <span className={`text-[11px] ${isConnected?"text-emerald-400":"text-amber-400"}`} style={{fontFamily:"'JetBrains Mono',monospace"}}>
            {isConnected?"NETWORK: ONLINE":"NETWORK: OFFLINE"}
          </span>
        </div>
      </div>

      {/* Panel Left — Login form */}
      <div className={`md:w-7/12 flex items-center justify-center p-8 md:p-16 ${dark?"bg-[#161B22]":"bg-[#F4F4F0]"} min-h-screen`}>
        <div className="w-full max-w-sm">
          <h2 className={`text-2xl font-bold ${dark?"text-white":"text-[#1C1C1C]"} mb-1 tracking-tight`}>تسجيل الدخول</h2>
          <p className="text-sm text-[#787774] mb-8">أدخل بيانات الدخول للمتابعة</p>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold tracking-widest uppercase text-[#787774] block mb-2" style={{fontFamily:"'JetBrains Mono',monospace"}}>الرقم الوظيفي</label>
              <input type="text" value={user} onChange={e=>setUser(e.target.value)}
                className={`w-full border rounded-md px-4 py-3 text-sm transition-colors outline-none ${dark?"bg-[#0D1117] border-[#30363D] text-white focus:border-[#C87A2E]":"bg-white border-[#E4E2DC] text-[#1C1C1C] focus:border-[#C87A2E]"}`}
                placeholder="728004" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-widest uppercase text-[#787774] block mb-2" style={{fontFamily:"'JetBrains Mono',monospace"}}>كلمة المرور</label>
              <div className="relative">
                <input type={showP?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)}
                  className={`w-full border rounded-md px-4 py-3 pl-10 text-sm transition-colors outline-none ${dark?"bg-[#0D1117] border-[#30363D] text-white focus:border-[#C87A2E]":"bg-white border-[#E4E2DC] text-[#1C1C1C] focus:border-[#C87A2E]"}`}
                  placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
                <button onClick={()=>setShowP(!showP)} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787774] hover:text-[#C87A2E] transition-colors">{showP?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div>

            {lockSecs > 0 && (
              <div className={`border text-sm p-3 rounded-md flex items-center gap-2 ${dark?"bg-red-900/20 border-red-800 text-red-300":"bg-red-50 border-red-200 text-red-700"}`}>
                <AlertCircle size={15}/>
                <span>مقفل — يُفتح بعد <strong style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmtTime(lockSecs)}</strong></span>
              </div>
            )}
            {err && (
              <div className={`border text-sm p-3 rounded-md flex items-center gap-2 ${dark?"bg-red-900/20 border-red-800 text-red-300":"bg-red-50 border-red-200 text-red-700"}`}>
                <AlertCircle size={15}/> {err}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading || lockSecs > 0}
              className="w-full bg-[#C87A2E] hover:bg-[#B06D27] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md text-sm tracking-wide transition-all active:scale-[0.99]">
              {loading?"جاري التحقق...":"دخول"}
            </button>

            <button onClick={resetPass}
              className="w-full text-[#787774] hover:text-[#C87A2E] text-xs py-1 transition-colors text-center">
              نسيت كلمة المرور؟ — إعادة الضبط للافتراضية
            </button>
          </div>

          <div className={`mt-10 pt-4 border-t ${dark?"border-[#30363D]":"border-[#E4E2DC]"}`}>
            <p className="text-[10px] text-[#787774]" style={{fontFamily:"'JetBrains Mono',monospace"}}>
              REF: <span className="text-[#C87A2E]">728004</span> &nbsp;/&nbsp; DEFAULT: <span className="text-[#C87A2E]">1001</span>
            </p>
          </div>
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
      if (!hashed) { toast("المتصفح لا يدعم التشفير — حاول مجدداً أو استخدم متصفحاً حديثاً", "error"); return; }
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
function InventorySystem({ emp, isAdmin }) {
  const canEdit = isAdmin || hasPermission(emp, "MANAGE_INVENTORY");
  const [items, setItemsState] = useState(() => storage.get("inventory_items", [
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
  // أي تعديل يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const setItems = useCallback((updater) => {
    setItemsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      storage.set("inventory_items", next);
      FirebaseAPI.saveInventory(next);
      return next;
    });
  }, []);
  useEffect(() => {
    FirebaseAPI.loadInventory().then(list => {
      if (list) { setItemsState(list); storage.set("inventory_items", list); }
    });
  }, []);

  const categories = ["الكل", ...INVENTORY_CATS];
  const filtered = items.filter(i => (i.name.includes(search)||i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  const lowStock = items.filter(i => i.qty <= (i.minQty || LOW_STOCK_THRESHOLD));

  const deleteItem = async (id) => {
    if (!canEdit) return;
    if (await confirm("هل تريد حذف هذا الصنف؟", { danger: true, ok: "حذف", title: "حذف الصنف" }))
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const saveItem = () => {
    if (!canEdit) return;
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems(prev => [...prev, { ...form, id: Date.now() }]);
    else setItems(prev => prev.map(i => i.id===editId ? form : i));
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
          {canEdit && <button onClick={()=>{setAdding(true);setForm({code:"",name:"",category:"أجهزة قياس",qty:1,condition:"جيد",location:"شعبة الآلات الدقيقة",minQty:3,serialNo:""});}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>}
          <PrintButton targetId="print-inventory" label="طباعة"/></div>
      </div>
      {canEdit && (adding||editId) && (<div className="card rounded-2xl border-2 border-blue-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة صنف":"تعديل صنف"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
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
          <td className="px-3 py-2 no-print">{canEdit && <div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div>}</td></tr>))}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد الأثاث ==========
function FurnitureInventory({ emp, isAdmin }) {
  const canEdit = isAdmin || hasPermission(emp, "MANAGE_INVENTORY");
  const [items, setItemsState] = useState(() => storage.get("furniture_items", [
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
  // أي تعديل يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const setItems = useCallback((updater) => {
    setItemsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      storage.set("furniture_items", next);
      FirebaseAPI.saveFurniture(next);
      return next;
    });
  }, []);
  useEffect(() => {
    FirebaseAPI.loadFurniture().then(list => {
      if (list) { setItemsState(list); storage.set("furniture_items", list); }
    });
  }, []);

  const deleteItem = async (id) => {
    if (!canEdit) return;
    if (await confirm("هل تريد حذف هذا الصنف؟", { danger: true, ok: "حذف", title: "حذف الصنف" }))
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const categories = ["الكل", ...FURNITURE_CATS];
  const filtered = items.filter(i => (i.name.includes(search)||i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));

  const saveItem = () => {
    if (!canEdit) return;
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems(prev => [...prev, { ...form, id: Date.now() }]);
    else setItems(prev => prev.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false); showToast("✅ تم الحفظ");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1"><div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(items.map(i=>({الرمز:i.code,الاسم:i.name,الفئة:i.category,الكمية:i.qty,الحالة:i.condition,الموقع:i.location})),"الأثاث")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
          {canEdit && <button onClick={()=>{setAdding(true);setForm({code:"",name:"",category:"أثاث مكتبي",qty:1,condition:"جيد",location:""});}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>}
          <PrintButton targetId="print-furniture" label="طباعة"/></div>
      </div>
      {canEdit && (adding||editId) && (<div className="card rounded-2xl border-2 border-violet-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة قطعة":"تعديل قطعة"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["الرمز *","code"],["الاسم *","name"],["الكمية","qty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>))}
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div></div>
        <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
      <div id="print-furniture" className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-color"><th className="px-3 py-2">الرمز</th><th className="px-3 py-2">الاسم</th><th className="px-3 py-2">الفئة</th><th className="px-3 py-2">الكمية</th><th className="px-3 py-2">الحالة</th><th className="px-3 py-2">الموقع</th><th className="px-3 py-2 no-print">إجراءات</th></tr></thead>
        <tbody>{filtered.map(it=>(<tr key={it.id} className="border-b border-color"><td className="px-3 py-2 font-mono">{it.code}</td><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2">{it.category}</td><td className="px-3 py-2 font-bold">{it.qty}</td>
          <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
          <td className="px-3 py-2">{it.location}</td><td className="px-3 py-2 no-print">{canEdit && <div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div>}</td></tr>))}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== إدارة الموظفين (المحسّنة) ==========
function EmployeeManager({ employees, setEmployees }) {
  const [search, setSearch]   = useState("");
  const [filterDept, setFilterDept] = useState("الكل");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterRole, setFilterRole] = useState("الكل");
  const [editId, setEditId]   = useState(null);
  const [adding, setAdding]   = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [syncingRoles, setSyncingRoles] = useState(false);
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [form, setForm]       = useState({name:"",jobNum:"",title:"",dept:"قسم السيطرة والنظم",shift:"صباحي",phone:"",email:""});
  const [, forceUpdate] = useState(0);
  const addToast = useToast();
  const confirm  = useConfirm();
  const { isConnected } = useConnectionStatus();

  // Auto-load roles from Firebase on mount
  useEffect(() => {
    if (!isConnected) return;
    FirebaseAPI.loadRoles().then(rolesMap => {
      if (!rolesMap) return;
      Object.entries(rolesMap).forEach(([empId, st]) => {
        if (st && typeof st === "object") storage.set(`emp_status_${empId}`, st);
      });
      forceUpdate(n => n + 1);
    });
  }, [isConnected]);

  const depts = ["الكل", ...new Set(employees.map(e=>e.dept).filter(Boolean))];
  const roleNames = ["الكل", ...Object.keys(BUILT_IN_ROLES)];

  const getStatus = (e) => getEmpStatus(e.id);
  const getLastLogin = (e) => {
    const hist = storage.get("login_history", []);
    const rec = hist.find(h => h.userId === e.id && h.status === "success");
    return rec ? new Date(rec.loginTime).toLocaleString("ar-IQ") : "—";
  };

  const filtered = employees.filter(e => {
    const st = getStatus(e);
    const q = search.trim();
    if (q && !e.name.includes(q) && !e.jobNum.includes(q) && !(e.dept||"").includes(q)) return false;
    if (filterDept !== "الكل" && e.dept !== filterDept) return false;
    if (filterStatus === "نشط" && !st.active) return false;
    if (filterStatus === "معطّل" && st.active) return false;
    if (filterRole !== "الكل" && st.role !== filterRole) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page-1)*perPage, page*perPage);

  const saveEmp = async () => {
    if (!form.name || !form.jobNum) return;
    const existing = employees.find(e => e.id === editId);
    const empToSave = adding
      ? { ...form, id: Date.now() }
      : { ...existing, ...form };

    if (adding) setEmployees(prev => [...prev, empToSave]);
    else setEmployees(prev => prev.map(e => e.id === editId ? empToSave : e));
    setAdding(false); setEditId(null);

    if (isConnected) {
      const ok = await FirebaseAPI.saveEmployee(empToSave);
      addToast(
        adding
          ? (ok ? "تمت إضافة الموظف وحُفظ في Firebase ✅" : "تمت الإضافة محلياً — فشل Firebase ⚠️")
          : (ok ? "تم تحديث البيانات في Firebase ✅"       : "تم التحديث محلياً — فشل Firebase ⚠️"),
        ok ? "success" : "warning"
      );
    } else {
      addToast(adding ? "تمت إضافة الموظف (غير متصل)" : "تم تحديث البيانات (غير متصل)", "success");
    }
  };

  // مزامنة فورية لخريطة الأدوار/الحالات إلى Firebase حتى لا تختفي بعد التحديث
  const autoSyncRoles = () => {
    const rolesMap = {};
    employees.forEach(emp => { rolesMap[emp.id] = getEmpStatus(emp.id); });
    FirebaseAPI.saveRoles(rolesMap);
  };

  const toggleStatus = (e) => {
    const st = getStatus(e);
    setEmpStatus(e.id, {...st, active:!st.active});
    forceUpdate(n=>n+1);
    autoSyncRoles();
    addToast(st.active?"تم تعطيل الحساب":"تم تفعيل الحساب", st.active?"warning":"success");
  };

  const setRole = (e, role) => {
    const st = getStatus(e);
    setEmpStatus(e.id, {...st, role});
    forceUpdate(n=>n+1);
    autoSyncRoles();
    addToast("تم تغيير الدور","success");
  };

  const resetPass = async (e) => {
    const ok = await confirm(`إعادة تعيين كلمة مرور ${e.name} إلى "1000"؟`);
    if (!ok) return;
    passStore.set(`pass_${e.id}`, null);
    if (isConnected) await FirebaseAPI.deletePassword(e.id);
    addToast("تم إعادة تعيين كلمة المرور إلى 1000","success");
  };

  const handleMigrate = async () => {
    if (!await confirm("سيتم رفع بيانات جميع الموظفين (بدون كلمات المرور) + هاشات المرور الافتراضية إلى Firebase. المتابعة؟", {title:"ترحيل البيانات",ok:"ترحيل"})) return;
    setMigrating(true);
    const result = await FirebaseAPI.initializeAccounts(employees);
    setMigrating(false);

    if (result.ok) {
      addToast("تم نقل البيانات إلى Firebase بنجاح! ✅","success",5000);
      return;
    }

    // عرض تشخيص تفصيلي
    const statusMap = {
      permission_denied: `🔒 مرفوض (${result.status}) — قواعد Firebase تمنع الكتابة.\n\nالحل: افتح Firebase Console ← Realtime Database ← Rules واستبدل القواعد بـ:\n\n{\n  "rules": {\n    ".read": true,\n    ".write": true\n  }\n}\n\nثم انقر Publish وأعد المحاولة.`,
      write_failed:      `❌ فشل الكتابة (HTTP ${result.status})\n\nتفاصيل: ${result.body||"لا تفاصيل"}\n\nتحقق من قواعد Firebase Realtime Database.`,
      network_error:     `🌐 خطأ في الاتصال بالشبكة.\n\nالسبب: ${result.body||"timeout"}\n\nتأكد من الاتصال بالإنترنت وحاول مجدداً.`,
    };
    const msg = statusMap[result.reason] || `فشل غير متوقع: ${JSON.stringify(result)}`;
    alert(msg);
    addToast(`فشل الترحيل — ${result.reason} (${result.status})`, "error", 8000);
  };

  const syncRolesToFirebase = async () => {
    if (!isConnected) { addToast("غير متصل بالإنترنت", "error"); return; }
    setSyncingRoles(true);
    const rolesMap = {};
    employees.forEach(e => { rolesMap[e.id] = getEmpStatus(e.id); });
    const ok = await FirebaseAPI.saveRoles(rolesMap);
    setSyncingRoles(false);
    if (ok) addToast("تم حفظ الصلاحيات في Firebase بنجاح ✅", "success");
    else addToast("فشل الحفظ — تحقق من إعدادات Firebase", "error");
  };

  const roleBadge = (roleKey) => {
    const r = BUILT_IN_ROLES[roleKey] || BUILT_IN_ROLES.EMPLOYEE;
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.color}`}>{r.label}</span>;
  };

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1 min-w-[180px]">
          <Search size={14} className="text-secondary shrink-0"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="بحث بالاسم أو الرقم..." className="bg-transparent text-sm outline-none w-full"/>
        </div>
        <select value={filterDept} onChange={e=>{setFilterDept(e.target.value);setPage(1);}} className="input rounded-xl px-3 py-2 text-sm">
          {depts.map(d=><option key={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}} className="input rounded-xl px-3 py-2 text-sm">
          {["الكل","نشط","معطّل"].map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={filterRole} onChange={e=>{setFilterRole(e.target.value);setPage(1);}} className="input rounded-xl px-3 py-2 text-sm">
          {roleNames.map(r=><option key={r}>{r}</option>)}
        </select>
        <button onClick={()=>exportCSV(employees.map(e=>({الاسم:e.name,الرقم:e.jobNum,المسمى:e.title,القسم:e.dept,النوبة:e.shift})),"الموظفون")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/></button>
        <button onClick={()=>{setAdding(true);setForm({name:"",jobNum:"",title:"",dept:"قسم السيطرة والنظم",shift:"صباحي",phone:"",email:""});}} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><Plus size={14}/> إضافة</button>
        <button onClick={handleMigrate} disabled={migrating} className="px-3 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold disabled:opacity-60">{migrating?"جاري النقل...":"نقل Firebase"}</button>
        <button onClick={syncRolesToFirebase} disabled={syncingRoles||!isConnected} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-60" title="حفظ الصلاحيات للأبد في Firebase"><Shield size={13}/>{syncingRoles?"جاري الحفظ...":"حفظ الصلاحيات"}</button>
      </div>

      {/* نموذج الإضافة / التعديل */}
      {(adding||editId) && (
        <div className="card rounded-2xl border-2 border-blue-200 p-5">
          <div className="flex justify-between mb-4">
            <h4 className="font-bold text-primary">{adding?"إضافة موظف جديد":"تعديل بيانات الموظف"}</h4>
            <button onClick={()=>{setAdding(false);setEditId(null);}}><X size={16}/></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[["الاسم الكامل *","name"],["الرقم الوظيفي *","jobNum"],["المسمى الوظيفي","title"],["رقم الهاتف","phone"],["البريد الإلكتروني","email"]].map(([l,k])=>(
              <div key={k}>
                <label className="block text-xs font-bold text-secondary mb-1">{l}</label>
                <input value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-xl px-3 py-2 text-sm"/>
              </div>
            ))}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">القسم</label>
              <select value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})} className="input w-full rounded-xl px-3 py-2 text-sm">
                {["قسم السيطرة والنظم","شعبة مستودع الفاو","شعبة المرافئ"].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">نوع الدوام</label>
              <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} className="input w-full rounded-xl px-3 py-2 text-sm">
                {["صباحي","مناوبة"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={()=>{setAdding(false);setEditId(null);}} className="px-5 py-2 btn-secondary border border-color rounded-xl text-sm">إلغاء</button>
            <button onClick={saveEmp} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><Save size={13} className="inline ml-1"/>حفظ</button>
          </div>
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label:"إجمالي الموظفين", val:employees.length, color:"text-blue-600"},
          {label:"حسابات نشطة", val:employees.filter(e=>getStatus(e).active).length, color:"text-green-600"},
          {label:"حسابات معطّلة", val:employees.filter(e=>!getStatus(e).active).length, color:"text-red-600"},
          {label:"نتائج البحث", val:filtered.length, color:"text-purple-600"},
        ].map(s=>(
          <div key={s.label} className="card rounded-xl p-3 border border-color text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* جدول الموظفين */}
      <div className="card rounded-2xl border border-color overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="border-b border-color bg-gray-50">
                <th className="px-3 py-2.5 text-right font-semibold">الاسم</th>
                <th className="px-3 py-2.5 text-right font-semibold">الرقم</th>
                <th className="px-3 py-2.5 text-right font-semibold hidden md:table-cell">المسمى</th>
                <th className="px-3 py-2.5 text-right font-semibold hidden md:table-cell">القسم</th>
                <th className="px-3 py-2.5 text-center font-semibold">الدور</th>
                <th className="px-3 py-2.5 text-center font-semibold">الحالة</th>
                <th className="px-3 py-2.5 text-right font-semibold hidden lg:table-cell">آخر دخول</th>
                <th className="px-3 py-2.5 text-center font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-secondary">لا توجد نتائج</td></tr>
              )}
              {paged.map(e => {
                const st = getStatus(e);
                const roleName = st.role || (e.role==="admin"?"SUPER_ADMIN":"EMPLOYEE");
                return (
                  <tr key={e.id} className="border-b border-color hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{e.name?.[0]}</span>
                        </div>
                        <span className="font-medium">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-secondary">{e.jobNum}</td>
                    <td className="px-3 py-2 text-secondary hidden md:table-cell">{e.title||"—"}</td>
                    <td className="px-3 py-2 text-secondary text-xs hidden md:table-cell">{e.dept||"—"}</td>
                    <td className="px-3 py-2 text-center">
                      <select value={roleName} onChange={ev=>setRole(e,ev.target.value)}
                        className="text-[11px] border border-color rounded-lg px-1.5 py-0.5 bg-surface">
                        {Object.keys(BUILT_IN_ROLES).map(r=><option key={r} value={r}>{BUILT_IN_ROLES[r].label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={()=>toggleStatus(e)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${st.active?"bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800":"bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800"}`}>
                        {st.active?"نشط":"معطّل"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-secondary text-xs hidden lg:table-cell">{getLastLogin(e)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-center">
                        <button onClick={()=>{setEditId(e.id);setAdding(false);setForm({...e});}} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="تعديل"><Edit3 size={13}/></button>
                        <button onClick={()=>resetPass(e)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title="إعادة تعيين كلمة المرور"><Shield size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-color">
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary">عرض</span>
            <select value={perPage} onChange={e=>{setPerPage(+e.target.value);setPage(1);}} className="text-xs border border-color rounded px-1.5 py-1 bg-surface">
              {[10,25,50,100].map(n=><option key={n}>{n}</option>)}
            </select>
            <span className="text-xs text-secondary">لكل صفحة — {filtered.length} إجمالي</span>
          </div>
          <div className="flex items-center gap-1">
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 text-xs border border-color rounded-lg disabled:opacity-40">السابق</button>
            <span className="text-xs px-2">{page} / {totalPages||1}</span>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-xs border border-color rounded-lg disabled:opacity-40">التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
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
function EquipmentMaintenance({ emp, isAdmin }) {
  // إضافة/حذف/تعديل مواصفات المعدات من قبل المشرف العام فقط
  const canManage = isAdmin;
  const [equipment, setEquipmentState] = useState(() => storage.get("equipment", INITIAL_EQUIPMENT));
  const [records,   setRecords]   = useState(() => storage.get("maintenance_records", []));
  const [tab,       setTab]       = useState("dashboard");
  const [selId,     setSelId]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [typeFilter,setTypeFilter]= useState("الكل");
  const [stFilter,  setStFilter]  = useState("الكل");
  const [showAdd,   setShowAdd]   = useState(false);
  const [editEq,    setEditEq]    = useState(null);
  const [showReqForm, setShowReqForm] = useState(false);
  const addToast = useToast();
  const confirm  = useConfirm();

  // أي تعديل يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const saveEq = (updated) => {
    setEquipmentState(updated);
    storage.set("equipment", updated);
    FirebaseAPI.saveEquipmentList(updated);
  };
  const saveRec = (updated) => { setRecords(updated);   storage.set("maintenance_records", updated); };
  useEffect(() => {
    FirebaseAPI.loadEquipmentList().then(list => {
      if (list) { setEquipmentState(list); storage.set("equipment", list); }
    });
  }, []);

  const sel = equipment.find(e => e.id === selId);

  // ── derived stats ──
  const byStatus = (s) => equipment.filter(e => e.status === s).length;
  const byType   = (t) => equipment.filter(e => e.type === t).length;
  const openRecs  = records.filter(r => r.status !== "مكتملة");
  const today     = new Date();
  const upcoming  = equipment.filter(e => {
    if (!e.nextMaintenance) return false;
    const diff = (new Date(e.nextMaintenance) - today) / 86400000;
    return diff >= 0 && diff <= 45 && e.status === "جيد";
  }).sort((a,b) => new Date(a.nextMaintenance)-new Date(b.nextMaintenance));
  const overdue   = equipment.filter(e => e.nextMaintenance && new Date(e.nextMaintenance) < today && e.status !== "معطل" && e.status !== "تحت صيانة");

  // ── filtered list ──
  const filtered = equipment.filter(e =>
    (e.name.includes(search) || e.id.includes(search) || (e.location||"").includes(search)) &&
    (typeFilter === "الكل" || e.type === typeFilter) &&
    (stFilter   === "الكل" || e.status === stFilter)
  );

  // ── CRUD equipment (المشرف العام فقط) ──
  const addEquipment = (form) => {
    if (!canManage) return;
    const newId = form.id || `EQ-${Date.now()}`;
    saveEq([...equipment, { ...form, id:newId, totalFailures:0 }]);
    setShowAdd(false); addToast("تم إضافة المعدة", "success");
  };
  const updateEquipment = (id, changes) => {
    if (!canManage) return;
    saveEq(equipment.map(e => e.id === id ? { ...e, ...changes } : e));
    setEditEq(null); addToast("تم حفظ التعديل", "success");
  };
  const deleteEquipment = async (id) => {
    if (!canManage) return;
    if (await confirm("هل تريد حذف هذه المعدة نهائياً؟", { title:"حذف المعدة", ok:"حذف", danger:true })) {
      saveEq(equipment.filter(e => e.id !== id));
      if (selId === id) setSelId(null);
      addToast("تم الحذف", "info");
    }
  };

  // ── maintenance ──
  const requestMaintenance = (eqId, desc, type) => {
    const eq = equipment.find(e => e.id === eqId);
    if (!eq) return;
    const rec = { id:`REC-${Date.now()}`, equipmentId:eqId, equipmentName:eq.name, eqType:eq.type, type, description:desc, status:"قيد التنفيذ", requestedAt:new Date().toISOString() };
    saveRec([rec, ...records]);
    saveEq(equipment.map(e => e.id === eqId ? { ...e, status:"تحت صيانة", totalFailures:(e.totalFailures||0)+1 } : e));
    setShowReqForm(false); addToast("تم تسجيل طلب الصيانة", "success");
  };
  const completeMaintenance = (recId, intervalDays = 90) => {
    const rec = records.find(r => r.id === recId); if (!rec) return;
    const now = new Date();
    const next = new Date(now.getTime() + intervalDays*86400000);
    saveEq(equipment.map(e => e.id === rec.equipmentId ? { ...e, status:"جيد", lastMaintenance:now.toISOString().slice(0,10), nextMaintenance:next.toISOString().slice(0,10) } : e));
    saveRec(records.map(r => r.id === recId ? { ...r, status:"مكتملة", completedAt:now.toISOString() } : r));
    addToast("تم إكمال الصيانة بنجاح ✓", "success");
  };
  const changeStatus = (eqId, newStatus) => {
    saveEq(equipment.map(e => e.id === eqId ? { ...e, status:newStatus } : e));
    addToast("تم تحديث الحالة", "info");
  };

  const tabBtns = [
    { id:"dashboard", label:"لوحة التحكم" },
    { id:"list",      label:"المعدات" },
    { id:"maint",     label:`الصيانة${openRecs.length?` (${openRecs.length})`:""}` },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* tabs */}
      <div className="flex gap-1.5 border-b border-color pb-3">
        {tabBtns.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab===t.id?"bg-blue-600 text-white":"text-secondary hover:bg-hover"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ لوحة التحكم ════ */}
      {tab === "dashboard" && (
        <div className="space-y-5">
          {/* alerts */}
          {overdue.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5"/>
              <div>
                <p className="text-xs font-bold text-red-800">صيانة متأخرة ({overdue.length} معدة)</p>
                <p className="text-xs text-red-700 mt-0.5">{overdue.map(e=>e.name).join(" • ")}</p>
              </div>
            </div>
          )}
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:"إجمالي المعدات",  value:equipment.length,       color:"from-blue-500 to-blue-600" },
              { label:"تعمل بشكل جيد",  value:byStatus("جيد"),         color:"from-emerald-500 to-emerald-600" },
              { label:"تحتاج صيانة",    value:byStatus("تحتاج صيانة"), color:"from-amber-500 to-amber-600" },
              { label:"تحت صيانة",      value:byStatus("تحت صيانة"),   color:"from-sky-500 to-sky-600" },
              { label:"معطلة",           value:byStatus("معطل"),         color:"from-red-500 to-red-600" },
            ].map((k,i) => (
              <div key={i} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white`}>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-white/80 mt-1">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Equipment by type */}
          <div className="card rounded-2xl border border-color p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Wrench size={15}/> المعدات حسب الفئة</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(EQ_TYPES).map(([key, meta]) => {
                const total = byType(key);
                const good  = equipment.filter(e=>e.type===key&&e.status==="جيد").length;
                if (total === 0) return null;
                return (
                  <button key={key} onClick={()=>{ setTypeFilter(key); setTab("list"); }}
                    className="text-right p-3 rounded-xl border border-color hover:bg-hover transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${meta.badge}`}>{meta.label}</span>
                      <span className="text-lg font-bold">{total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round(good/total*100)}%`}}/>
                    </div>
                    <p className="text-[10px] text-secondary mt-1">{good} / {total} تعمل بشكل جيد</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-column: upcoming maintenance + critical equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card rounded-2xl border border-color p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Calendar size={15}/> صيانة دورية قادمة (45 يوم)</h3>
              {upcoming.length === 0 ? <p className="text-xs text-secondary text-center py-4">لا توجد مواعيد قريبة</p> :
              upcoming.map(e => {
                const days = Math.ceil((new Date(e.nextMaintenance)-today)/86400000);
                return (
                  <div key={e.id} className="flex justify-between items-center py-2 border-b border-color last:border-0">
                    <div>
                      <p className="text-xs font-bold">{e.name}</p>
                      <p className="text-[10px] text-secondary">{e.nextMaintenance}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${days<=7?"bg-red-100 text-red-700":days<=20?"bg-amber-100 text-amber-700":"bg-blue-100 text-blue-700"}`}>
                      {days} يوم
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="card rounded-2xl border border-color p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={15}/> المعدات الحرجة</h3>
              {equipment.filter(e=>e.critical).map(e => (
                <div key={e.id} className="flex justify-between items-center py-2 border-b border-color last:border-0 cursor-pointer hover:bg-hover rounded-lg px-1" onClick={()=>{ setSelId(e.id); setTab("list"); }}>
                  <div>
                    <p className="text-xs font-bold">{e.name}</p>
                    <p className="text-[10px] text-secondary">{EQ_TYPES[e.type]?.label}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${EQ_STATUS_COLORS[e.status]}`}>{e.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════ قائمة المعدات ════ */}
      {tab === "list" && (
        <div>
          {/* toolbar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex-1 min-w-[160px] flex items-center gap-2 input rounded-xl px-3 py-2">
              <Search size={14} className="text-secondary shrink-0"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث باسم / رمز / موقع…" className="bg-transparent text-sm outline-none w-full"/>
            </div>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">
              <option value="الكل">كل الفئات</option>
              {Object.entries(EQ_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={stFilter} onChange={e=>setStFilter(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">
              <option value="الكل">كل الحالات</option>
              {["جيد","تحتاج صيانة","تحت صيانة","معطل"].map(s=><option key={s}>{s}</option>)}
            </select>
            {canManage && (
              <button onClick={()=>setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">
                <Plus size={14}/> إضافة معدة
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* equipment list */}
            <div className="lg:col-span-2 space-y-2">
              {filtered.length === 0 && <p className="text-center py-10 text-secondary text-sm">لا توجد نتائج</p>}
              {filtered.map(eq => (
                <div key={eq.id} onClick={()=>setSelId(selId===eq.id?null:eq.id)}
                  className={`card rounded-xl border p-3.5 cursor-pointer transition-all flex items-center gap-3 ${selId===eq.id?"border-blue-400 bg-blue-50/30":"border-color hover:bg-hover"}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${eq.status==="جيد"?"bg-emerald-500":eq.status==="معطل"?"bg-red-500":eq.status==="تحت صيانة"?"bg-sky-500":"bg-amber-500"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{eq.name}</span>
                      {eq.critical && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">حرجة</span>}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${EQ_TYPES[eq.type]?.badge||"bg-gray-100 text-gray-700"}`}>{EQ_TYPES[eq.type]?.label||eq.type}</span>
                    </div>
                    <p className="text-[11px] text-secondary mt-0.5 truncate">{eq.location} · {eq.id}</p>
                    <p className="text-[11px] text-secondary">الصيانة القادمة: {eq.nextMaintenance||"—"}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold shrink-0 ${EQ_STATUS_COLORS[eq.status]||"bg-gray-100"}`}>{eq.status}</span>
                </div>
              ))}
            </div>

            {/* detail panel */}
            <div>
              {sel ? (
                <EqDetailPanel eq={sel} records={records.filter(r=>r.equipmentId===sel.id)}
                  canManage={canManage}
                  onEdit={()=>setEditEq({...sel})} onDelete={()=>deleteEquipment(sel.id)}
                  onRequestMaint={()=>setShowReqForm(true)} onChangeStatus={changeStatus}
                  onComplete={completeMaintenance}/>
              ) : (
                <div className="card rounded-2xl border border-color p-8 text-center">
                  <Wrench size={36} className="mx-auto text-secondary mb-3 opacity-50"/>
                  <p className="text-sm text-secondary font-medium">اختر معدة لعرض التفاصيل</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ الصيانة ════ */}
      {tab === "maint" && (
        <EqMaintenanceTab records={records} equipment={equipment} onComplete={completeMaintenance} onRequest={requestMaintenance}/>
      )}

      {/* modals */}
      {canManage && showAdd && <EqFormModal onClose={()=>setShowAdd(false)}  onSave={addEquipment}   existingIds={equipment.map(e=>e.id)}/>}
      {canManage && editEq  && <EqFormModal onClose={()=>setEditEq(null)}   onSave={d=>updateEquipment(d.id,d)} initial={editEq} isEdit/>}
      {showReqForm && sel && (
        <EqRequestModal eq={sel} onClose={()=>setShowReqForm(false)}
          onSubmit={(desc,type)=>requestMaintenance(sel.id,desc,type)}/>
      )}
    </div>
  );
}

// ── لوحة تفاصيل المعدة ──
function EqDetailPanel({ eq, records, canManage, onEdit, onDelete, onRequestMaint, onChangeStatus, onComplete }) {
  const [histTab, setHistTab] = useState("info");
  const openRecs = records.filter(r=>r.status!=="مكتملة");
  const doneRecs = records.filter(r=>r.status==="مكتملة");
  return (
    <div className="card rounded-2xl border border-color overflow-hidden">
      {/* header */}
      <div className={`p-4 ${eq.status==="جيد"?"bg-emerald-50":eq.status==="معطل"?"bg-red-50":eq.status==="تحت صيانة"?"bg-sky-50":"bg-amber-50"}`}>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-bold text-sm leading-snug">{eq.name}</h3>
          {canManage && (
            <div className="flex gap-1">
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/60 text-blue-600"><Edit3 size={13}/></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-white/60 text-red-500"><Trash2 size={13}/></button>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${EQ_STATUS_COLORS[eq.status]}`}>{eq.status}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${EQ_TYPES[eq.type]?.badge||"bg-gray-100"}`}>{EQ_TYPES[eq.type]?.label||eq.type}</span>
          {eq.critical && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">حرجة</span>}
        </div>
      </div>
      {/* sub-tabs */}
      <div className="flex border-b border-color text-xs">
        {[["info","المعلومات"],["hist","السجل"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setHistTab(id)}
            className={`flex-1 py-2 font-bold transition-colors ${histTab===id?"border-b-2 border-blue-600 text-blue-600":"text-secondary"}`}>{lbl}</button>
        ))}
      </div>
      {/* info */}
      {histTab === "info" && (
        <div className="p-4 space-y-2 text-sm">
          {[
            ["الرمز",        eq.id],
            ["الطاقة",       eq.capacity],
            ["الموقع",       eq.location],
            ["الشركة المصنعة",eq.manufacturer],
            ["الموديل",      eq.model],
            ["سنة التركيب",  eq.yearInstalled],
            ["آخر صيانة",    eq.lastMaintenance],
            ["الصيانة القادمة",eq.nextMaintenance],
            ["عدد العطلات",  eq.totalFailures],
          ].map(([lbl,val])=> val ? (
            <div key={lbl} className="flex gap-2">
              <span className="text-secondary text-xs font-bold w-28 shrink-0">{lbl}:</span>
              <span className={`text-xs ${lbl==="عدد العطلات"&&eq.totalFailures>2?"text-red-600 font-bold":""}`}>{val}</span>
            </div>
          ) : null)}
          {eq.notes && <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-100">📝 {eq.notes}</div>}
          {/* status change */}
          <div className="pt-2 border-t border-color">
            <p className="text-xs font-bold text-secondary mb-1.5">تغيير الحالة:</p>
            <div className="flex flex-wrap gap-1">
              {["جيد","تحتاج صيانة","تحت صيانة","معطل"].filter(s=>s!==eq.status).map(s=>(
                <button key={s} onClick={()=>onChangeStatus(eq.id,s)}
                  className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-colors ${EQ_STATUS_COLORS[s]}`}>{s}</button>
              ))}
            </div>
          </div>
          <button onClick={onRequestMaint} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold mt-2 flex items-center justify-center gap-2">
            <Wrench size={14}/> طلب صيانة
          </button>
        </div>
      )}
      {/* history */}
      {histTab === "hist" && (
        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {records.length === 0 && <p className="text-xs text-secondary text-center py-6">لا يوجد سجل صيانة</p>}
          {openRecs.map(r=>(
            <div key={r.id} className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-bold">{r.type}</span>
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">قيد التنفيذ</span>
              </div>
              <p className="text-secondary">{r.description}</p>
              <p className="text-secondary mt-1">{new Date(r.requestedAt).toLocaleDateString("ar-IQ")}</p>
            </div>
          ))}
          {doneRecs.map(r=>(
            <div key={r.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-bold">{r.type}</span>
                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">مكتملة</span>
              </div>
              <p className="text-secondary">{r.description}</p>
              <p className="text-secondary mt-1">{r.completedAt ? new Date(r.completedAt).toLocaleDateString("ar-IQ") : "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── تبويب الصيانة ──
function EqMaintenanceTab({ records, equipment, onComplete, onRequest }) {
  const [subTab, setSubTab] = useState("open");
  const [form, setForm]     = useState({ eqId:"", desc:"", type:"دورية" });
  const addToast = useToast();
  const open = records.filter(r=>r.status!=="مكتملة");
  const done = records.filter(r=>r.status==="مكتملة");

  const submit = () => {
    if (!form.eqId || !form.desc.trim()) { addToast("يرجى تحديد المعدة والوصف","warning"); return; }
    onRequest(form.eqId, form.desc, form.type);
    setForm({ eqId:"", desc:"", type:"دورية" });
    setSubTab("open");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {[["open",`طلبات مفتوحة (${open.length})`],["add","طلب جديد"],["done",`مكتملة (${done.length})`]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setSubTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${subTab===id?"bg-blue-600 text-white border-blue-600":"btn-secondary border-color"}`}>{lbl}</button>
        ))}
      </div>

      {subTab === "add" && (
        <div className="card rounded-2xl border border-color p-5">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Wrench size={15}/> طلب صيانة جديد</h4>
          <div className="space-y-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">المعدة *</label>
              <select value={form.eqId} onChange={e=>setForm({...form,eqId:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                <option value="">— اختر المعدة —</option>
                {equipment.map(eq=><option key={eq.id} value={eq.id}>{eq.name} ({eq.id})</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نوع الصيانة</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {["دورية","طارئة","وقائية","إصلاح عطل","تفتيش"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-bold text-secondary mb-1">وصف العمل / العطل *</label>
              <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={3} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="اشرح طبيعة العمل أو وصف العطل..."/></div>
          </div>
          <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-color">
            <button onClick={()=>setSubTab("open")} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> تسجيل الطلب</button>
          </div>
        </div>
      )}

      {subTab === "open" && (
        <div className="space-y-3">
          {open.length === 0 && <div className="text-center py-10 text-secondary"><CheckCircle size={32} className="mx-auto mb-2 text-emerald-400 opacity-60"/><p className="text-sm">لا توجد طلبات صيانة مفتوحة</p></div>}
          {open.map(r=>(
            <div key={r.id} className="card rounded-xl border border-color p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-sm">{r.equipmentName}</p>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{r.type}</span>
                    <span className="text-[10px] text-secondary">{new Date(r.requestedAt).toLocaleDateString("ar-IQ")}</span>
                  </div>
                </div>
                <button onClick={()=>onComplete(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shrink-0">
                  <CheckCircle size={12}/> إكمال
                </button>
              </div>
              <p className="text-xs text-secondary">{r.description}</p>
            </div>
          ))}
        </div>
      )}

      {subTab === "done" && (
        <div className="card rounded-2xl border border-color overflow-hidden">
          {done.length === 0 ? <p className="text-center py-8 text-secondary text-sm">لا توجد سجلات مكتملة</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-color bg-hover text-xs">
                  <th className="p-3 text-right">المعدة</th><th className="p-3 text-right">النوع</th>
                  <th className="p-3 text-right">الوصف</th><th className="p-3 text-right">تاريخ الإكمال</th>
                </tr></thead>
                <tbody>
                  {done.map(r=>(
                    <tr key={r.id} className="border-t border-color hover:bg-hover">
                      <td className="p-3 font-bold text-xs">{r.equipmentName}</td>
                      <td className="p-3"><span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">{r.type}</span></td>
                      <td className="p-3 text-xs text-secondary max-w-[200px] truncate">{r.description}</td>
                      <td className="p-3 text-xs text-secondary">{r.completedAt?new Date(r.completedAt).toLocaleDateString("ar-IQ"):"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── نموذج إضافة/تعديل معدة ──
function EqFormModal({ onClose, onSave, initial, isEdit, existingIds=[] }) {
  const blank = { id:"", name:"", type:"OIL_TANK", capacity:"", location:"", manufacturer:"", model:"", yearInstalled:"", status:"جيد", critical:false, nextMaintenance:"", lastMaintenance:"", notes:"" };
  const [form, setForm] = useState(initial || blank);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const submit = () => {
    if (!form.name.trim()) return;
    if (!isEdit && !form.id.trim()) { form.id = `EQ-${Date.now()}`; }
    onSave(form);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="card rounded-2xl border border-color p-6 w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2"><Wrench size={18}/> {isEdit?"تعديل المعدة":"إضافة معدة جديدة"}</h3>
          <button onClick={onClose} className="text-secondary hover:text-red-500"><X size={18}/></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">اسم المعدة *</label>
            <input value={form.name} onChange={e=>f("name",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم المعدة"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">رمز المعدة {!isEdit&&"*"}</label>
            <input value={form.id} onChange={e=>f("id",e.target.value)} disabled={isEdit} className="input w-full rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-60" placeholder="T-OIL-001" dir="ltr"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">فئة المعدة</label>
            <select value={form.type} onChange={e=>f("type",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm">
              {Object.entries(EQ_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الحالة</label>
            <select value={form.status} onChange={e=>f("status",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm">
              {["جيد","تحتاج صيانة","تحت صيانة","معطل"].map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الطاقة / السعة</label>
            <input value={form.capacity} onChange={e=>f("capacity",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: 500 م³/ساعة"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">سنة التركيب</label>
            <input type="number" value={form.yearInstalled} onChange={e=>f("yearInstalled",+e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="2020" dir="ltr"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الشركة المصنعة</label>
            <input value={form.manufacturer} onChange={e=>f("manufacturer",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الموديل</label>
            <input value={form.model} onChange={e=>f("model",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">آخر صيانة</label>
            <input type="date" value={form.lastMaintenance} onChange={e=>f("lastMaintenance",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">الصيانة القادمة</label>
            <input type="date" value={form.nextMaintenance} onChange={e=>f("nextMaintenance",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">الموقع</label>
            <input value={form.location} onChange={e=>f("location",e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: محطة الضخ الرئيسية"/></div>
          <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">ملاحظات</label>
            <textarea value={form.notes} onChange={e=>f("notes",e.target.value)} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none"/></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="crit" checked={form.critical} onChange={e=>f("critical",e.target.checked)} className="w-4 h-4"/>
            <label htmlFor="crit" className="text-sm font-bold cursor-pointer">معدة حرجة</label>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-color">
          <button onClick={onClose} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
          <button onClick={submit} disabled={!form.name.trim()} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            <Save size={14}/> {isEdit?"حفظ التعديل":"إضافة المعدة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── مودال طلب صيانة ──
function EqRequestModal({ eq, onClose, onSubmit }) {
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("دورية");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="card rounded-2xl border border-color p-6 w-full max-w-md shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><Wrench size={16}/> طلب صيانة</h3>
          <button onClick={onClose} className="text-secondary hover:text-red-500"><X size={16}/></button>
        </div>
        <p className="text-sm font-bold mb-4 text-blue-700">{eq.name} — {eq.id}</p>
        <div className="space-y-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">نوع الصيانة</label>
            <select value={type} onChange={e=>setType(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm">
              {["دورية","طارئة","وقائية","إصلاح عطل","تفتيش"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وصف العمل / العطل *</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="صف طبيعة العمل أو العطل..."/></div>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-color">
          <button onClick={onClose} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
          <button onClick={()=>desc.trim()&&onSubmit(desc,type)} disabled={!desc.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            <Send size={14}/> تسجيل الطلب
          </button>
        </div>
      </div>
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

// ========== لوحة الإدارة المتكاملة ==========
function AdminDashboard({ emp, employees, setEmployees }) {
  const addToast = useToast();
  const confirm  = useConfirm();
  const [tab, setTab] = useState("overview");
  const [histSearch, setHistSearch] = useState("");
  const [histFilter, setHistFilter] = useState("الكل");
  const [histDate, setHistDate] = useState("");
  const [histPage, setHistPage] = useState(1);
  const HIST_PER_PAGE = 20;

  // Live data refresh every 30s
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n+1), 30000);
    return () => clearInterval(t);
  }, []);

  // جلب سجل الدخول من Firebase (يجمع سجلات جميع الأجهزة)
  const [fbHistory, setFbHistory] = useState(null); // null = جاري التحميل
  useEffect(() => {
    let cancelled = false;
    fetch(`${FIREBASE_URL}/login_history.json`)
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data || typeof data !== "object") return;
        const records = Object.values(data)
          .filter(r => r && r.loginTime)
          .sort((a, b) => (b.loginTime > a.loginTime ? 1 : -1));
        if (!cancelled) setFbHistory(records);
      })
      .catch(() => { if (!cancelled) setFbHistory([]); });
    return () => { cancelled = true; };
  }, [tick]);

  const localHistoryRaw = storage.get("login_history", []);
  const localHistory = Array.isArray(localHistoryRaw) ? localHistoryRaw : [];
  // استخدام Firebase إذا متاح، localStorage كاحتياطي
  const loginHistory = fbHistory !== null ? fbHistory : localHistory;
  const historySource = fbHistory !== null ? "firebase" : "local";

  const activeSessionsRaw = storage.get("active_sessions", []);
  const activeSessions = Array.isArray(activeSessionsRaw) ? activeSessionsRaw : [];
  const today = new Date().toDateString();

  // Stats
  const todayHist = loginHistory.filter(h => new Date(h.loginTime).toDateString() === today);
  const todaySuccess = todayHist.filter(h => h.status === "success").length;
  const todayFailed  = todayHist.filter(h => h.status === "failed").length;
  const deviceCounts = loginHistory.reduce((acc, h) => { acc[h.device] = (acc[h.device]||0)+1; return acc; }, {});
  const topDevice = Object.entries(deviceCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";

  // Peak hour
  const hourCounts = todayHist.reduce((acc, h) => {
    const hr = new Date(h.loginTime).getHours();
    acc[hr] = (acc[hr]||0)+1; return acc;
  }, {});
  const peakHour = Object.entries(hourCounts).sort((a,b)=>b[1]-a[1])[0];
  const peakHourLabel = peakHour ? `${peakHour[0]}:00` : "—";

  // Filtered history
  const filteredHist = loginHistory.filter(h => {
    const q = histSearch.trim();
    if (q && !h.userName.includes(q) && !h.userJobNum.includes(q)) return false;
    if (histFilter === "نجاح" && h.status !== "success") return false;
    if (histFilter === "فشل"  && h.status !== "failed")  return false;
    if (histDate && !h.loginTime.startsWith(histDate)) return false;
    return true;
  });
  const histPages = Math.ceil(filteredHist.length / HIST_PER_PAGE);
  const pagedHist = filteredHist.slice((histPage-1)*HIST_PER_PAGE, histPage*HIST_PER_PAGE);

  const clearHistory = async () => {
    if (!await confirm("هل تريد مسح سجل الدخول بالكامل؟")) return;
    storage.set("login_history", []);
    setTick(n=>n+1);
    addToast("تم مسح سجل الدخول","success");
  };

  const killSession = async (sess) => {
    if (!await confirm(`إنهاء جلسة ${sess.userName}؟`)) return;
    const sessionsRaw = storage.get("active_sessions", []);
    const sessions = Array.isArray(sessionsRaw) ? sessionsRaw : [];
    storage.set("active_sessions", sessions.filter(s => s.sessionId !== sess.sessionId));
    setTick(n=>n+1);
    addToast("تم إنهاء الجلسة","success");
  };

  const fmtDuration = (secs) => {
    if (!secs) return "—";
    const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60);
    return h>0 ? `${h}س ${m}د` : `${m}د`;
  };

  const fmtDt = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("ar-IQ", {dateStyle:"short", timeStyle:"short"});
  };

  const deviceIcon = (d) => ({
    "iPad":"📱", "iPhone":"📱", "هاتف ذكي":"📱", "تابلت":"📱", "كمبيوتر":"💻"
  }[d] || "🖥");

  const ADMIN_TABS = [
    {id:"overview",   label:"الملخص",       icon:<BarChart size={15}/>},
    {id:"history",    label:"سجل الدخول",   icon:<Clock size={15}/>},
    {id:"sessions",   label:"الجلسات النشطة",icon:<Wifi size={15}/>},
    {id:"accounts",   label:"إدارة الحسابات",icon:<Users size={15}/>},
    {id:"roles",      label:"الأدوار والصلاحيات",icon:<Shield size={15}/>},
  ];

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-white"/>
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary">لوحة الإدارة المتكاملة</h1>
          <p className="text-xs text-secondary">نظام المراقبة والتحكم — مستودع الفاو</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-color overflow-x-auto pb-0">
        {ADMIN_TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl whitespace-nowrap border-b-2 transition-colors ${tab===t.id?"border-blue-500 text-blue-600 bg-blue-50":"border-transparent text-secondary hover:text-primary"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── ملخص ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {label:"موظفون اليوم (دخلوا)", val:todaySuccess, sub:`فاشلة: ${todayFailed}`, color:"text-green-600", bg:"bg-green-50"},
              {label:"جلسات نشطة الآن", val:activeSessions.length, sub:"مستخدم متصل", color:"text-blue-600", bg:"bg-blue-50"},
              {label:"أكثر جهاز استخداماً", val:topDevice, sub:"", color:"text-purple-600", bg:"bg-purple-50"},
              {label:"ذروة النشاط اليوم", val:peakHourLabel, sub:"", color:"text-amber-600", bg:"bg-amber-50"},
            ].map(s=>(
              <div key={s.label} className={`rounded-xl p-4 border border-color ${s.bg}`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-xs text-secondary mt-1">{s.label}</p>
                {s.sub && <p className="text-[10px] text-secondary">{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* آخر 10 محاولات دخول */}
          <div className="card rounded-xl border border-color overflow-hidden">
            <div className="px-4 py-3 border-b border-color font-semibold text-sm text-primary">آخر محاولات تسجيل الدخول</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-color bg-gray-50">
                  <th className="px-3 py-2 text-right">الموظف</th>
                  <th className="px-3 py-2 text-right">الوقت</th>
                  <th className="px-3 py-2 text-center">الجهاز</th>
                  <th className="px-3 py-2 text-center">النتيجة</th>
                </tr></thead>
                <tbody>
                  {loginHistory.slice(0,10).map(h=>(
                    <tr key={h.id} className="border-b border-color hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="font-medium">{h.userName}</div>
                        <div className="text-secondary">{h.userJobNum}</div>
                      </td>
                      <td className="px-3 py-2 text-secondary">{fmtDt(h.loginTime)}</td>
                      <td className="px-3 py-2 text-center">{deviceIcon(h.device)} {h.device}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${h.status==="success"?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`}>
                          {h.status==="success"?"نجاح":"فشل"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {loginHistory.length===0 && <tr><td colSpan={4} className="text-center py-6 text-secondary">لا توجد سجلات</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* توزيع المستخدمين بالأدوار */}
          <div className="card rounded-xl border border-color p-4">
            <p className="font-semibold text-sm mb-3">توزيع الأدوار</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BUILT_IN_ROLES).map(([key,r])=>{
                const cnt = employees.filter(e=>{const s=getEmpStatus(e.id);return (s.role||"EMPLOYEE")===key || (key==="SUPER_ADMIN" && e.role==="admin" && !s.role);}).length;
                return <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm ${r.color}`}>
                  <span className="font-black text-base">{cnt}</span>
                  <span>{r.label}</span>
                </div>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── سجل الدخول ── */}
      {tab === "history" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1 min-w-[180px]">
              <Search size={14} className="text-secondary shrink-0"/>
              <input value={histSearch} onChange={e=>{setHistSearch(e.target.value);setHistPage(1);}} placeholder="بحث بالاسم أو الرقم..." className="bg-transparent text-sm outline-none w-full"/>
            </div>
            <select value={histFilter} onChange={e=>{setHistFilter(e.target.value);setHistPage(1);}} className="input rounded-xl px-3 py-2 text-sm">
              {["الكل","نجاح","فشل"].map(v=><option key={v}>{v}</option>)}
            </select>
            <input type="date" value={histDate} onChange={e=>{setHistDate(e.target.value);setHistPage(1);}} className="input rounded-xl px-3 py-2 text-sm"/>
            <button onClick={clearHistory} className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50"><Trash2 size={13}/> مسح الكل</button>
          </div>
          <p className="text-xs text-secondary flex items-center gap-2">
            <span>{filteredHist.length} سجل — إجمالي اليوم: {todaySuccess} نجاح + {todayFailed} فشل</span>
            {fbHistory === null
              ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] ts-mono">جاري التحميل من Firebase...</span>
              : historySource === "firebase"
                ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] ts-mono">Firebase — جميع الأجهزة</span>
                : <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] ts-mono">وضع محلي — هذا الجهاز فقط</span>
            }
          </p>
          <div className="card rounded-xl border border-color overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-color bg-gray-50">
                  <th className="px-3 py-2.5 text-right">الموظف</th>
                  <th className="px-3 py-2.5 text-right">وقت الدخول</th>
                  <th className="px-3 py-2.5 text-right hidden md:table-cell">وقت الخروج</th>
                  <th className="px-3 py-2.5 text-center">الجهاز</th>
                  <th className="px-3 py-2.5 text-center hidden md:table-cell">المتصفح/النظام</th>
                  <th className="px-3 py-2.5 text-center">النتيجة</th>
                  <th className="px-3 py-2.5 text-center hidden md:table-cell">المدة</th>
                </tr></thead>
                <tbody>
                  {pagedHist.map(h=>(
                    <tr key={h.id} className="border-b border-color hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="font-medium">{h.userName}</div>
                        <div className="text-secondary">{h.userJobNum}</div>
                      </td>
                      <td className="px-3 py-2 text-secondary">{fmtDt(h.loginTime)}</td>
                      <td className="px-3 py-2 text-secondary hidden md:table-cell">{fmtDt(h.logoutTime)}</td>
                      <td className="px-3 py-2 text-center">{deviceIcon(h.device)} {h.device}</td>
                      <td className="px-3 py-2 text-center text-secondary hidden md:table-cell">{h.browser} / {h.os}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${h.status==="success"?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`}>
                          {h.status==="success"?"✓ نجاح":"✗ فشل"}
                        </span>
                        {h.failReason && <div className="text-[9px] text-red-500 mt-0.5">{{wrong_password:"كلمة خاطئة",account_disabled:"حساب معطّل",too_many_attempts:"محاولات كثيرة"}[h.failReason]||h.failReason}</div>}
                      </td>
                      <td className="px-3 py-2 text-center text-secondary hidden md:table-cell">{fmtDuration(h.sessionDuration)}</td>
                    </tr>
                  ))}
                  {pagedHist.length===0 && <tr><td colSpan={7} className="text-center py-8 text-secondary">لا توجد سجلات</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-color">
              <span className="text-xs text-secondary">{filteredHist.length} سجل</span>
              <div className="flex gap-1">
                <button disabled={histPage<=1} onClick={()=>setHistPage(p=>p-1)} className="px-3 py-1 text-xs border border-color rounded-lg disabled:opacity-40">السابق</button>
                <span className="px-2 text-xs">{histPage}/{histPages||1}</span>
                <button disabled={histPage>=histPages} onClick={()=>setHistPage(p=>p+1)} className="px-3 py-1 text-xs border border-color rounded-lg disabled:opacity-40">التالي</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── الجلسات النشطة ── */}
      {tab === "sessions" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">{activeSessions.length} جلسة نشطة حالياً</p>
            <button onClick={()=>setTick(n=>n+1)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><CheckCircle size={14}/> تحديث</button>
          </div>
          {activeSessions.length === 0 ? (
            <div className="card rounded-xl border border-color p-8 text-center text-secondary">لا توجد جلسات نشطة</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {activeSessions.map(sess=>{
                const dur = Math.floor((Date.now()-new Date(sess.loginTime).getTime())/1000);
                const isMe = sessionStorage.getItem("boc_session_id") === sess.sessionId;
                return (
                  <div key={sess.sessionId} className={`card rounded-xl border p-4 ${isMe?"border-blue-300 bg-blue-50":"border-color"}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{sess.userName?.[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{sess.userName}</p>
                          <p className="text-xs text-secondary">{sess.userJobNum}</p>
                        </div>
                      </div>
                      {!isMe && (
                        <button onClick={()=>killSession(sess)} className="flex items-center gap-1 text-xs text-red-600 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50">
                          <X size={11}/> إنهاء
                        </button>
                      )}
                      {isMe && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">جلستك</span>}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-secondary">
                      <div className="flex items-center gap-1">{deviceIcon(sess.device)} {sess.device} — {sess.browser}</div>
                      <div className="flex items-center gap-1"><Clock size={11}/> منذ {fmtDuration(dur)}</div>
                      <div className="col-span-2 text-[10px]">بدأ: {fmtDt(sess.loginTime)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── إدارة الحسابات ── */}
      {tab === "accounts" && (
        <EmployeeManager employees={employees} setEmployees={setEmployees}/>
      )}

      {/* ── الأدوار والصلاحيات ── */}
      {tab === "roles" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-primary">الأدوار المدمجة في النظام</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(BUILT_IN_ROLES).map(([key, role]) => (
              <div key={key} className="card rounded-xl border border-color p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-xl text-sm font-bold ${role.color}`}>{role.label}</span>
                  <span className="text-xs text-secondary">{key}</span>
                </div>
                <div className="space-y-1.5">
                  {role.permissions.length === 0
                    ? <p className="text-xs text-secondary">صلاحيات محدودة (موظف عادي)</p>
                    : role.permissions.map(p => (
                      <div key={p} className="flex items-center gap-2 text-xs">
                        <span className="text-green-500">✓</span>
                        <span className="font-medium">{PERMISSIONS_DEF[p]?.icon} {PERMISSIONS_DEF[p]?.label || p}</span>
                      </div>
                    ))
                  }
                </div>
                <div className="mt-3 pt-3 border-t border-color">
                  <p className="text-xs text-secondary">
                    الموظفون: <span className="font-bold text-primary">
                      {employees.filter(e=>{const s=getEmpStatus(e.id);return (s.role||"EMPLOYEE")===key||(key==="SUPER_ADMIN"&&e.role==="admin"&&!s.role);}).length}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="card rounded-xl border border-color overflow-hidden">
            <div className="px-4 py-3 border-b border-color font-semibold text-sm">جدول الصلاحيات التفصيلي</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-color bg-gray-50">
                  <th className="px-3 py-2 text-right">الصلاحية</th>
                  {Object.entries(BUILT_IN_ROLES).map(([k,r])=>(
                    <th key={k} className={`px-3 py-2 text-center`}><span className={`px-2 py-0.5 rounded-full font-bold ${r.color}`}>{r.label}</span></th>
                  ))}
                </tr></thead>
                <tbody>
                  {Object.entries(PERMISSIONS_DEF).map(([perm,def])=>(
                    <tr key={perm} className="border-b border-color">
                      <td className="px-3 py-2 font-medium">{def.icon} {def.label}</td>
                      {Object.entries(BUILT_IN_ROLES).map(([rk,r])=>{
                        const has = r.permissions.includes("FULL_ACCESS") || r.permissions.includes(perm);
                        return <td key={rk} className="px-3 py-2 text-center">{has?"✅":"—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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
  const STORAGE_KEY  = `health_ins_${emp.id}`;
  const HISTORY_KEY  = `health_ins_history_${emp.id}`;
  const addToast = useToast();
  const confirm  = useConfirm();

  const emptyRow = (i) => ({ id:i, beneficiary:"", date:"", procedure:"", amount:"", opType:"", notes:"" });

  // ── form state ──
  const [phone,        setPhone]        = useState("");
  const [marital,      setMarital]      = useState("متزوج");
  const [month,        setMonth]        = useState(now.getMonth());
  const [year,         setYear]         = useState(now.getFullYear());
  const [formEnvelope, setFormEnvelope] = useState("");
  const [formSequence, setFormSequence] = useState("");
  const [beneficiaries,setBeneficiaries]= useState([emp.name]);
  const [newBenef,     setNewBenef]     = useState("");
  const [rows,         setRows]         = useState(() => Array.from({length:10},(_,i)=>emptyRow(i+1)));
  const [activeView,   setActiveView]   = useState("form"); // "form" | "history" | "preview"
  const [savedForms,   setSavedForms]   = useState(() => storage.get(HISTORY_KEY, []));
  const [insExporting, setInsExporting] = useState(false);
  const [showInsExport,setShowInsExport]= useState(false);
  const insFileRef = useRef(null);

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

  const deadlineBase = new Date(now.getFullYear(), now.getMonth(), 17);
  const deadline  = now.getDate() > 17 ? new Date(now.getFullYear(), now.getMonth()+1, 17) : deadlineBase;
  const daysLeft  = Math.ceil((deadline - now) / 86400000);
  const filledRows   = rows.filter(r => r.beneficiary && r.procedure);
  const totalAmount  = rows.reduce((s,r) => s + (Number(r.amount)||0), 0);
  const updateRow = (idx, field, val) => setRows(rows.map((r,i) => i===idx ? {...r,[field]:val} : r));
  const addRow = () => setRows([...rows, emptyRow(rows.length+1)]);
  const removeRow = (idx) => setRows(rows.filter((_,i)=>i!==idx));

  const addBenef = () => {
    const n = newBenef.trim();
    if (!n) return;
    if (beneficiaries.includes(n)) { addToast("الاسم موجود مسبقاً","warning"); return; }
    setBeneficiaries([...beneficiaries, n]); setNewBenef("");
    addToast("تمت الإضافة","success");
  };

  const getFormData = () => ({ phone, marital, month, year, formEnvelope, formSequence, beneficiaries, rows });

  const save = () => {
    storage.set(STORAGE_KEY, getFormData());
    addToast("تم حفظ الاستمارة","success");
  };

  const saveToHistory = () => {
    const label = `${MONTHS_IRAQI[month]} ${year} — ${filledRows.length} مراجعة`;
    const entry = { id: Date.now(), label, savedAt: new Date().toISOString(), data: getFormData() };
    const updated = [entry, ...savedForms.slice(0, 49)];
    setSavedForms(updated);
    storage.set(HISTORY_KEY, updated);
    storage.set(STORAGE_KEY, getFormData());
    addToast("تم حفظ الاستمارة في السجل","success");
  };

  const loadFromHistory = (entry) => {
    const d = entry.data;
    setPhone(d.phone||""); setMarital(d.marital||"متزوج");
    setMonth(d.month??0); setYear(d.year??now.getFullYear());
    setFormEnvelope(d.formEnvelope||""); setFormSequence(d.formSequence||"");
    setBeneficiaries(d.beneficiaries||[emp.name]);
    setRows(d.rows||Array.from({length:10},(_,i)=>emptyRow(i+1)));
    setActiveView("form"); addToast("تم تحميل الاستمارة","info");
  };

  const deleteFromHistory = async (id) => {
    if (await confirm("حذف هذه الاستمارة من السجل؟", { title:"حذف", ok:"حذف", danger:true })) {
      const updated = savedForms.filter(f=>f.id!==id);
      setSavedForms(updated); storage.set(HISTORY_KEY, updated);
      addToast("تم الحذف","info");
    }
  };

  // ── Build print HTML (shared between print and Word export) ──
  const buildPrintHTML = (forWord = false) => {
    const PROC_COLS = [...PROCEDURE_TYPES].reverse();
    const printRows = rows.slice(0, 15).concat(
      Array.from({length: Math.max(0, 10-rows.length)}, (_,i)=>emptyRow(rows.length+i+1))
    );
    const procHeadCols = PROC_COLS.map(pt =>
      `<th style="width:13mm"><div class="th-vert">${pt}</div></th>`
    ).join("");
    const dataRows = printRows.map((r,i) => `
      <tr style="height:9mm">
        <td style="text-align:center">${i+1}</td>
        <td class="td-name">${r.beneficiary||""}</td>
        <td class="td-date">${r.date ? r.date.split("-").reverse().join("/") : ""}</td>
        ${PROC_COLS.map(pt=>`<td class="td-amt">${r.procedure===pt ? (r.amount ? Number(r.amount).toLocaleString() : "✓") : ""}</td>`).join("")}
        <td class="td-amt">${r.opType||""}</td>
        <td class="td-amt">${r.notes||""}</td>
      </tr>`).join("");

    const wordHeader = forWord ? `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="UTF-8"/><meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15"><meta name=Originator content="Microsoft Word 15">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->` : `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>`;

    return `${wordHeader}
<title>استمارة طلب التعويض للموظفين</title>
<style>
  @page{size:A4 landscape;margin:7mm 8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;font-size:8.5pt;direction:rtl;color:#000}
  /* ===== HEADER ===== */
  .hbox{border:2px solid #000;margin-bottom:3mm;width:100%}
  .htitle{text-align:center;font-size:14pt;font-weight:bold;padding:2.5mm;border-bottom:2px solid #000;background:#D9D9D9}
  .hgrid{display:grid;grid-template-columns:1fr 1fr 1fr;direction:rtl;width:100%}
  .hcol{padding:2mm 3mm;border-left:1px solid #000;vertical-align:top}
  .hcol:last-child{border-left:none}
  .frow{display:flex;align-items:baseline;gap:3px;padding:2px 0;min-height:18px;border-bottom:1px solid #ddd}
  .frow:last-child{border-bottom:none}
  .fl{font-weight:bold;white-space:nowrap;font-size:7.5pt;min-width:100px}
  .fv{flex:1;border-bottom:1.5px solid #000;font-size:8.5pt;padding-bottom:1px;padding-right:4px}
  .section-lbl{text-align:center;font-weight:bold;font-size:10pt;background:#D9D9D9;border-bottom:1px solid #000;padding:1.5mm 0}
  /* ===== TABLE ===== */
  table{border-collapse:collapse;width:100%;table-layout:fixed}
  th,td{border:1px solid #000;text-align:center;vertical-align:middle;font-size:6.5pt;padding:0 1px;word-break:break-all}
  th{background:#D9D9D9;font-weight:bold}
  .th-vert{writing-mode:vertical-rl;text-orientation:mixed;transform:rotate(180deg);height:26mm;font-size:5.5pt;line-height:1.3}
  .td-name{text-align:right;font-size:8pt;padding-right:1.5mm}
  .td-date{font-size:7pt}
  .td-amt{font-size:7.5pt;font-weight:bold}
  /* ===== FOOTER ===== */
  .footer-area{margin-top:3mm;font-size:8pt;direction:rtl}
  .sigrow{display:grid;grid-template-columns:repeat(4,1fr);gap:8mm;margin-top:3mm;text-align:center}
  .sigcell{font-weight:bold;font-size:9pt}
  .sigline{margin-top:10mm;border-top:1.5px solid #000;padding-top:1mm;font-size:7pt;font-weight:normal}
  .summary-box{border:1px solid #000;padding:2mm;margin-top:2mm;display:flex;gap:8mm;justify-content:center;background:#f8f8f8}
</style></head><body>
<div class="hbox">
  <div class="htitle">استمارة طلب التعويض للموظفين — لجنة الضمان الصحي المركزية</div>
  <div class="hgrid">
    <div class="hcol">
      <div class="section-lbl">بيانات الموظف</div>
      <div class="frow"><span class="fl">اسم الموظف:</span><span class="fv">${emp.name}</span></div>
      <div class="frow"><span class="fl">الرقم الوظيفي:</span><span class="fv">${emp.jobNum||""}</span></div>
      <div class="frow"><span class="fl">الحالة الزوجية:</span><span class="fv">${marital}</span></div>
      <div class="frow"><span class="fl">رقم الهاتف:</span><span class="fv">${phone}</span></div>
      <div class="frow"><span class="fl">توقيع الموظف:</span><span class="fv">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>
    <div class="hcol">
      <div class="section-lbl">الصيانة الهندسية / السيطرة والنظم</div>
      <div class="frow"><span class="fl">الشهـر:</span><span class="fv">${MONTHS_IRAQI[month]} ${year}</span></div>
      <div class="frow"><span class="fl">تاريخ تقديم الطلب:</span><span class="fv">${now.toLocaleDateString("ar-IQ")}</span></div>
      <div class="frow"><span class="fl">رقم الظرف:</span><span class="fv">${formEnvelope}</span></div>
      <div class="frow"><span class="fl">التسلسل:</span><span class="fv">${formSequence}</span></div>
    </div>
    <div class="hcol">
      <div class="section-lbl">ملخص الطلب</div>
      <div class="frow"><span class="fl">عدد المراجعات:</span><span class="fv">${filledRows.length}</span></div>
      <div class="frow"><span class="fl">المجموع الكلي:</span><span class="fv">${totalAmount.toLocaleString()} دينار</span></div>
      <div class="frow"><span class="fl">اسم الهيأة/القسم:</span><span class="fv">الصيانة الهندسية / السيطرة والنظم</span></div>
      <div class="frow"><span class="fl">&nbsp;</span><span class="fv">&nbsp;</span></div>
      <div class="frow"><span class="fl">&nbsp;</span><span class="fv">&nbsp;</span></div>
    </div>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:7mm">ت</th>
      <th rowspan="2" style="width:35mm">اسم المنتفع</th>
      <th rowspan="2" style="width:17mm">تاريخ المراجعة</th>
      <th colspan="${PROC_COLS.length}" style="font-size:8.5pt;background:#B8CCE4">نوع الإجراء الطبي</th>
      <th rowspan="2" style="width:18mm">نوع العملية</th>
      <th rowspan="2" style="width:20mm">ملاحظات</th>
    </tr>
    <tr>${procHeadCols}</tr>
  </thead>
  <tbody>${dataRows}</tbody>
  <tfoot>
    <tr style="background:#D9D9D9;font-weight:bold">
      <td colspan="3" style="text-align:right;padding:1.5mm;font-size:8pt">المجموع الكلي (${filledRows.length} مراجعة)</td>
      ${PROC_COLS.map(()=>`<td></td>`).join("")}
      <td style="font-size:9pt">${totalAmount.toLocaleString()}</td>
      <td></td>
    </tr>
  </tfoot>
</table>
<div class="footer-area">
  <div>اسم وتوقيع المخول: ___________________________________</div>
  <div class="sigrow">
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">رئيس اللجنة<div class="sigline">الاسم والتوقيع</div></div>
  </div>
</div>
</body></html>`;
  };

  const printForm = () => {
    const html = buildPrintHTML(false);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const exportWord = () => {
    const html = buildPrintHTML(true);
    const blob = new Blob(["﻿" + html], { type: "application/msword" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `استمارة_ضمان_${emp.name.replace(/\s+/g,"_")}_${MONTHS_IRAQI[month]}_${year}.doc`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast("تم تصدير الاستمارة كملف Word","success");
  };

  const exportToInsuranceTemplate = async (buffer) => {
    try {
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.worksheets[0];

      // ExcelJS: cell.value = x يغير القيمة فقط دون المساس بالتنسيق
      const set = (ref, v) => { ws.getCell(ref).value = v ?? null; };

      // ── الهيدر — خرائط الخلايا مبنية على الملف الفعلي ──
      set("B2",  "هيأة الصيانة الهندسية / قسم السيطرة والنظم");  // اسم الهيأة/القسم (B2:G3)
      set("AB2", emp.name);
      set("B4",  phone);                                            // رقم الهاتف (B4:G4)
      set("AB4", String(emp.jobNum || ""));
      set("B5",  filledRows.length);                               // عدد المراجعات (B5:C5)
      set("B6",  new Date().toLocaleDateString("ar-IQ"));          // تاريخ تقديم الطلب (B6:C6)
      set("M6",  MONTHS_IRAQI[month] + " " + year);               // الشهر (M6:R6)
      set("AB6", marital);
      set("B7",  rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)); // المجموع (B7:C7)
      set("M7",  String(formSequence));
      set("Y7",  formEnvelope);

      // ── خرائط أعمدة أنواع الإجراءات (Master cell لكل دمج) ──
      const PROC_COL = {
        "الامراض المستعصية":                              "B",
        "العمليات الصغرى":                               "C",
        "العمليات الوسطى":                               "E",
        "العمليات الكبرى":                               "H",
        "العمليات فوق الكبرى":                           "K",
        "معالجة اسنان":                                  "N",
        "اشعة وسونار":                                   "O",
        "نظارات طبية":                                   "Q",
        "تحاليل مختبرية":                                "S",
        "الرنين والمفراس/الايكو/تخطيط القلب":            "U",
        "العلاجات (الادوية)":                            "Y",
        "اجور الطبيب":                                   "Z",
      };

      // مسح بيانات الجدول (صفوف 14-23) مع الحفاظ على التنسيق
      const CLEAR_COLS = ["B","C","E","H","K","N","O","Q","S","U","Y","Z","AC","AD"];
      for (let r = 14; r <= 23; r++) {
        for (const col of CLEAR_COLS) ws.getCell(col + r).value = null;
      }

      // تعبئة صفوف المراجعات
      const dataRows = rows.filter(r => r.beneficiary && r.procedure);
      dataRows.forEach((row, idx) => {
        const r = 14 + idx;
        if (r > 23) return;
        set("AD" + r, row.beneficiary);
        if (row.date) set("AC" + r, row.date);
        const col = PROC_COL[row.procedure];
        if (col) ws.getCell(col + r).value = row.amount ? Number(row.amount) : "✓";
      });

      const outBuf = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a      = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `استمارة_ضمان_${emp.name.replace(/\s+/g,"_")}_${MONTHS_IRAQI[month]}_${year}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(a.href);
      addToast("تم تصدير الاستمارة بنجاح","success");
    } catch(e) {
      addToast("فشل تصدير الإكسل: " + e.message, "error");
    } finally {
      setInsExporting(false);
      setShowInsExport(false);
    }
  };

  const exportFromInsFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInsExporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => exportToInsuranceTemplate(ev.target.result);
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Deadline banner */}
      <div className={`rounded-2xl p-3 flex items-center gap-3 border ${daysLeft<=3?"bg-red-50 border-red-200":daysLeft<=7?"bg-amber-50 border-amber-200":"bg-blue-50 border-blue-200"}`}>
        <Clock size={18} className={daysLeft<=3?"text-red-500":daysLeft<=7?"text-amber-500":"text-blue-500"}/>
        <div className="flex-1">
          <p className={`font-bold text-sm ${daysLeft<=3?"text-red-700":daysLeft<=7?"text-amber-700":"text-blue-700"}`}>الموعد النهائي: يوم 17 من كل شهر</p>
          <p className={`text-xs ${daysLeft<=3?"text-red-600":daysLeft<=7?"text-amber-600":"text-blue-600"}`}>
            {daysLeft===0?"⚠️ اليوم هو آخر يوم!":daysLeft===1?"⚠️ باقي يوم واحد!":` باقي ${daysLeft} يوم`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setActiveView(activeView==="history"?"form":"history")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border transition-colors ${activeView==="history"?"bg-violet-600 text-white border-violet-600":"btn-secondary border-color"}`}>
            <Clock size={13}/> السجل ({savedForms.length})
          </button>
        </div>
      </div>

      {/* ════ سجل الاستمارات المحفوظة ════ */}
      {activeView === "history" && (
        <div className="card rounded-2xl border border-color p-5">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2"><Clock size={16}/> الاستمارات المحفوظة</h3>
          {savedForms.length === 0 ? (
            <div className="text-center py-10 text-secondary"><FileText size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد استمارات محفوظة بعد</p></div>
          ) : (
            <div className="space-y-2">
              {savedForms.map(f => (
                <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-color hover:bg-hover transition-colors">
                  <div>
                    <p className="font-bold text-sm">{f.label}</p>
                    <p className="text-xs text-secondary">{new Date(f.savedAt).toLocaleString("ar-IQ")}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={()=>loadFromHistory(f)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">
                      <Download size={12}/> تحميل
                    </button>
                    <button onClick={()=>deleteFromHistory(f.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════ نموذج الاستمارة ════ */}
      {activeView === "form" && (<>
        {/* Header info */}
        <div className="card rounded-2xl border-color border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Heart size={18} className="text-red-500"/> استمارة طلب التعويض الصحي</h3>
            <span className="text-xs text-secondary">الصيانة الهندسية / السيطرة والنظم</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-[10px] font-bold text-secondary mb-1">اسم الموظف</label>
              <input value={emp.name} readOnly className="input w-full rounded-xl px-3 py-2 text-sm opacity-60 cursor-not-allowed"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الرقم الوظيفي</label>
              <input value={emp.jobNum||""} readOnly className="input w-full rounded-xl px-3 py-2 text-sm opacity-60 cursor-not-allowed"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة الزوجية</label>
              <select value={marital} onChange={e=>setMarital(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm">
                {MARITAL_STATUS_LIST.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">رقم الهاتف</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07X XXXX XXXX" className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">الشهر</label>
              <select value={month} onChange={e=>setMonth(Number(e.target.value))} className="input w-full rounded-xl px-3 py-2 text-sm">
                {MONTHS_IRAQI.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">السنة</label>
              <select value={year} onChange={e=>setYear(Number(e.target.value))} className="input w-full rounded-xl px-3 py-2 text-sm">
                {[2024,2025,2026,2027].map(y=><option key={y}>{y}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">رقم الظرف</label>
              <input value={formEnvelope} onChange={e=>setFormEnvelope(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
            <div><label className="block text-[10px] font-bold text-secondary mb-1">التسلسل</label>
              <input value={formSequence} onChange={e=>setFormSequence(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <p className="text-2xl font-bold text-blue-700">{filledRows.length}</p>
              <p className="text-xs text-blue-600">عدد المراجعات</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-xl font-bold text-emerald-700">{totalAmount.toLocaleString()} د.ع</p>
              <p className="text-xs text-emerald-600">المجموع الكلي</p>
            </div>
          </div>
        </div>

        {/* Beneficiaries */}
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 flex items-center gap-2 text-sm"><UserPlus size={15} className="text-blue-500"/> المشمولون بالضمان الصحي</h4>
          <div className="flex gap-2 mb-3">
            <input value={newBenef} onChange={e=>setNewBenef(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBenef()}
              placeholder="اسم أحد أفراد العائلة..." className="input flex-1 rounded-xl px-3 py-2 text-sm"/>
            <button onClick={addBenef} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-1"><Plus size={13}/> إضافة</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {beneficiaries.map((b,i)=>(
              <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${i===0?"bg-blue-100 text-blue-800 border border-blue-200":"bg-slate-100 text-slate-700 border border-slate-200"}`}>
                {i===0&&<span className="opacity-60 text-[10px]">موظف</span>}
                {b}
                {i>0&&<button onClick={()=>setBeneficiaries(beneficiaries.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><X size={11}/></button>}
              </span>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card rounded-2xl border-color border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" dir="rtl" style={{minWidth:"900px"}}>
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
                  <th rowSpan={2} className="px-2 py-2 text-center w-8">ت</th>
                  <th rowSpan={2} className="px-2 py-2 text-right min-w-[130px]">اسم المنتفع</th>
                  <th rowSpan={2} className="px-2 py-2 text-right w-[120px]">تاريخ المراجعة</th>
                  <th rowSpan={2} className="px-2 py-2 text-right min-w-[180px]">نوع الإجراء الطبي</th>
                  <th rowSpan={2} className="px-2 py-2 text-right w-[90px]">المبلغ (دينار)</th>
                  <th rowSpan={2} className="px-2 py-2 text-right min-w-[130px]">نوع العملية</th>
                  <th rowSpan={2} className="px-2 py-2 text-right min-w-[120px]">ملاحظات</th>
                  <th rowSpan={2} className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row,idx)=>(
                  <tr key={idx} className={`border-t border-color ${row.beneficiary&&row.procedure?"bg-emerald-50/30":""} ${idx%2===1?"bg-hover/20":""}`}>
                    <td className="px-2 py-1 text-center font-bold text-secondary text-[10px]">{idx+1}</td>
                    <td className="px-1 py-1">
                      <select value={row.beneficiary} onChange={e=>updateRow(idx,"beneficiary",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs">
                        <option value="">— اختر —</option>
                        {beneficiaries.map((b,i)=><option key={i} value={b}>{b}</option>)}</select></td>
                    <td className="px-1 py-1"><input type="date" value={row.date} onChange={e=>updateRow(idx,"date",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs"/></td>
                    <td className="px-1 py-1">
                      <select value={row.procedure} onChange={e=>updateRow(idx,"procedure",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs">
                        <option value="">— اختر —</option>
                        {PROCEDURE_TYPES.map(p=><option key={p} value={p}>{p}</option>)}</select></td>
                    <td className="px-1 py-1"><input type="number" min="0" value={row.amount} onChange={e=>updateRow(idx,"amount",e.target.value)} placeholder="0" className="input w-full rounded-lg px-2 py-1.5 text-xs" dir="ltr"/></td>
                    <td className="px-1 py-1">
                      <select value={row.opType||""} onChange={e=>updateRow(idx,"opType",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs">
                        <option value="">—</option>
                        <option value="العمليات الصغرى">الصغرى</option>
                        <option value="العمليات الوسطى">الوسطى</option>
                        <option value="العمليات الكبرى">الكبرى</option>
                        <option value="العمليات فوق الكبرى">فوق الكبرى</option>
                      </select></td>
                    <td className="px-1 py-1"><input value={row.notes||""} onChange={e=>updateRow(idx,"notes",e.target.value)} className="input w-full rounded-lg px-2 py-1.5 text-xs"/></td>
                    <td className="px-1 py-1 text-center">
                      {rows.length > 1 && <button onClick={()=>removeRow(idx)} className="text-red-400 hover:text-red-600 p-0.5"><X size={13}/></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-blue-200 bg-blue-50">
                  <td colSpan={4} className="px-3 py-2 font-bold text-blue-800 text-xs">المجموع ({filledRows.length} مراجعة)</td>
                  <td className="px-3 py-2 font-bold text-blue-800 text-xs">{totalAmount.toLocaleString()}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-3 border-t border-color">
            <button onClick={addRow} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"><Plus size={14}/> إضافة سطر</button>
          </div>
        </div>

        {/* لوحة تصدير قالب الإكسل */}
        {showInsExport && (
          <div className="card rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-2">
                <Download size={15}/> تصدير إلى قالب إكسل
              </h4>
              <button onClick={()=>setShowInsExport(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <p className="text-xs text-emerald-700">اختر ملف قالب الإكسل الخاص باستمارة الضمان الصحي — سيتم ملء البيانات مع الحفاظ على التنسيق الأصلي.</p>
            <input ref={insFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={exportFromInsFile}/>
            <button
              onClick={()=>insFileRef.current?.click()}
              disabled={insExporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-60">
              {insExporting ? <span className="animate-spin">⏳</span> : <Download size={14}/>}
              {insExporting ? "جاري التصدير..." : "اختيار ملف القالب"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end pb-4">
          <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 btn-secondary border border-color rounded-xl font-bold text-sm"><Save size={14}/> حفظ مسودة</button>
          <button onClick={saveToHistory} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700"><Save size={14}/> حفظ في السجل</button>
          <button onClick={()=>setShowInsExport(v=>!v)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700"><Download size={14}/> تصدير إكسل</button>
          <button onClick={exportWord} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700"><Download size={14}/> تصدير Word</button>
          <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"><Printer size={14}/> طباعة الاستمارة</button>
        </div>
      </>)}
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
  const gDrive = useGDrive();
  const STORAGE_KEY = `annual_leave_${emp.id}`;
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);
  const [xlExporting, setXlExporting] = useState(false);

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

  const buildAnnualHtml = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:130px;max-height:55px;display:block;margin:auto;"/>`
      : `<div style="min-height:44px"></div>`;
    const rp = fmtDateParts(reqDate);
    const fp = fmtDateParts(fromDate);
    const sentenceDays = days || "______";
    const sentencePurpose = purpose || "_________________________________";
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>إجازة اعتيادية</title>
<style>
  @page{size:A5 landscape;margin:7mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;direction:rtl}
  .doc-header{width:100%;border-collapse:collapse;font-size:8pt}
  .doc-header td{border:1px solid #555;padding:3px 6px;text-align:center;vertical-align:middle}
  .dh-company{font-size:9.5pt;font-weight:bold;background:#f0f0f0;width:16%}
  .dh-label{font-size:7.5pt;color:#444;text-align:right;padding-right:5px;background:#fafafa;width:13%}
  .dh-main{font-size:10pt;font-weight:bold;width:40%}
  .dh-code{font-size:8pt;font-weight:bold;width:18%}
  .dh-info-cell{width:11%}
  .dh-logo{width:10%;padding:2px}
  .ref-num{text-align:left;direction:ltr;font-size:7.5pt;margin:1px 0 5px;padding-left:4px}
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
<table class="doc-header">
  <tr>
    <td rowspan="2" class="dh-company">شركة نفط البصرة<br/>(شركة عامة)</td>
    <td class="dh-label">عنوان النموذج</td>
    <td colspan="3" class="dh-main">نموذج إجازة اعتيادية</td>
    <td rowspan="2" class="dh-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="52" height="52">
        <rect width="120" height="120" fill="white"/>
        <path d="M 17.8,31.3 A 54,54 0 0,1 113.8,55.3 L 93.9,57 A 34,34 0 0,0 32.2,40.5 Z" fill="#cc1122" transform="translate(6,6)"/>
        <path d="M 113.8,55.3 A 54,54 0 0,1 113.8,64.7 L 93.9,63 A 34,34 0 0,0 93.9,57 Z" fill="white" transform="translate(6,6)"/>
        <path d="M 113.8,64.7 A 54,54 0 0,1 17.8,88.7 L 32.2,79.5 A 34,34 0 0,0 93.9,63 Z" fill="#111111" transform="translate(6,6)"/>
        <circle cx="60" cy="60" r="30" fill="white"/>
        <path d="M60,37 C72,51 80,63 80,71 Q80,90 60,90 Q40,90 40,71 C40,63 48,51 60,37Z" fill="#1e8b3a"/>
        <ellipse cx="53" cy="52" rx="4" ry="7" fill="rgba(255,255,255,0.55)" transform="rotate(-25,53,52)"/>
        <text x="60" y="22" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="8.5" font-weight="bold">شركة نفط البصرة</text>
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
<div class="main-box">
  <div class="top-date">التاريخ: &nbsp;${rp.day}&nbsp; / &nbsp;${rp.m}&nbsp; / &nbsp;${rp.y}</div>
  <div class="top-title">م/ إجازة اعتيادية</div>
  <div class="field-row"><span class="lbl">الاسم الثلاثي:</span><span class="val">${name}</span></div>
  <div class="field-row"><span class="lbl">الرقم الوظيفي:</span><span class="val">${jobNum}</span></div>
  <div class="field-row"><span class="lbl">العنوان الوظيفي:</span><span class="val">${jobTitle}</span></div>
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
  };

  const printForm = () => {
    const html = buildAnnualHtml();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const uploadToDrive = async () => {
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const html = buildAnnualHtml();
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File([new Blob([html], { type: "text/html" })], `اجازة-اعتيادية-${safeName}-${reqDate || "بدون-تاريخ"}.html`, { type: "text/html" });
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast.success("تم رفع نموذج الإجازة الاعتيادية إلى Drive");
    } catch (e) {
      toast.error("فشل رفع الملف: " + e.message);
    } finally {
      setUploadPct(-1);
    }
  };

  const exportToExcel = async () => {
    setXlExporting(true);
    try {
      const res = await fetch("/templates/leave-annual.xlsx");
      const buf0 = await res.arrayBuffer();
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf0);
      const ws = wb.worksheets[0];
      const set = (r, v) => { ws.getCell(r).value = v ?? null; };
      const fmtD = d => {
        if (!d) return "";
        const dt = new Date(d + "T00:00:00");
        return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
      };
      set("C5",  fmtD(reqDate));
      set("I8",  name);
      set("I9",  String(jobNum || ""));
      set("I10", jobTitle);
      set("I11", fmtD(reqDate));
      set("D13", days ? String(days) : "");
      set("G13", fmtD(fromDate));
      set("I14", purpose);
      const outBuf = await wb.xlsx.writeBuffer();
      const safeName = (name || "موظف").replace(/\s+/g, "_");
      const fname = `اجازة_اعتيادية_${safeName}_${reqDate || "بدون_تاريخ"}.xlsx`;
      const blob = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      toast.success("تم تصدير نموذج الإجازة الاعتيادية");
      if (gDrive.isReady) {
        setUploadPct(0);
        const file = new File([outBuf], fname, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
        setDriveLink(result.webViewLink);
        toast.success("تم رفع النموذج إلى Drive");
      }
    } catch(e) {
      toast.error("فشل التصدير: " + e.message);
    } finally {
      setXlExporting(false); setUploadPct(-1);
    }
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
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        {gDrive.isReady && (
          <button onClick={uploadToDrive} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "رفع إلى Drive"}
          </button>
        )}
        <button onClick={exportToExcel} disabled={xlExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"><Download size={14}/> {xlExporting ? "جاري التصدير..." : "تصدير إكسل"}</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== نموذج الإجازة المرضية ==========
function SickLeaveForm({ emp }) {
  const toast = useToast();
  const gDrive = useGDrive();
  const STORAGE_KEY = `sick_leave_${emp.id}`;
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);
  const [xlExporting, setXlExporting] = useState(false);

  const [name,        setName]        = useState(emp.name);
  const [jobNum,      setJobNum]      = useState(emp.jobNum || "");
  const [jobTitle,    setJobTitle]    = useState(emp.title || "");
  const [leaveDate,   setLeaveDate]   = useState("");
  const [leaveTime,   setLeaveTime]   = useState("");
  const [clinicDT,    setClinicDT]    = useState("");
  const [notes,       setNotes]       = useState("");
  const [returnDate,  setReturnDate]  = useState("");
  const [returnTime,  setReturnTime]  = useState("");
  const [sigDataUrl,  setSigDataUrl]  = useState(null);

  useEffect(() => {
    const s = storage.get(STORAGE_KEY, null);
    if (s) {
      setName(s.name || emp.name);
      setJobNum(s.jobNum || emp.jobNum || "");
      setJobTitle(s.jobTitle || emp.title || "");
      setLeaveDate(s.leaveDate || "");
      setLeaveTime(s.leaveTime || "");
      setClinicDT(s.clinicDT || "");
      setNotes(s.notes || "");
      setReturnDate(s.returnDate || "");
      setReturnTime(s.returnTime || "");
      setSigDataUrl(s.sigDataUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, leaveDate, leaveTime, clinicDT, notes, returnDate, returnTime, sigDataUrl });
    toast.success("تم حفظ بيانات الإجازة المرضية");
  };

  const fmtDate = (d) => {
    if (!d) return "_______________";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
  };
  const fmtTime = (t) => t || "____ : ____";
  const fmtDT   = (v) => {
    if (!v) return "_______________";
    const dt = new Date(v);
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}  ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
  };

  const buildSickHtml = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:130px;max-height:45px;display:block;"/>`
      : "";
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>
<title>نموذج إجازة مرضية</title>
<style>
  @page{size:A4 portrait;margin:12mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;font-size:12pt;direction:rtl;color:#111}
  table{border-collapse:collapse;width:100%}
  .hdr td{border:1px solid #000;padding:5px 8px;vertical-align:middle;text-align:center}
  .lbl-cell{background:#D0D0D0;font-weight:bold;font-size:10pt;width:90px}
  .main-cell{font-weight:bold;font-size:12pt}
  .co-cell{background:#A0A0A0;font-weight:bold;font-size:11pt;width:120px}
  .logo-cell{font-weight:bold;font-size:22pt;width:110px}
  .phone{font-weight:bold;font-size:11pt;direction:ltr;text-align:left;margin:10px 0 2px}
  .co-name{text-align:center;font-weight:bold;font-size:13pt;margin:4px 0 2px}
  .form-title{text-align:center;font-weight:bold;font-size:13pt;margin:2px 0 12px;border-bottom:1.5px dotted #999;padding-bottom:6px}
  .field{font-weight:bold;font-size:12pt;padding:8px 0 3px;border-bottom:1.5px dotted #999;margin-bottom:4px}
  .field span{font-weight:normal;margin-right:6px}
  .sec-label{font-weight:bold;font-size:12pt;margin-top:20px;margin-bottom:3px}
  .sig-space{border-bottom:2px solid #000;min-height:48px;margin-bottom:14px;padding:4px 0}
  .footer{text-align:center;font-size:9pt;font-style:italic;border-top:1px solid #000;border-bottom:1px solid #000;padding:5px;margin-top:24px}
</style></head>
<body>
<table class="hdr">
  <tr>
    <td class="logo-cell" rowspan="2">☯</td>
    <td class="lbl-cell">عنوان النموذج</td>
    <td class="main-cell">نـمـوذج اجـازة مرضيـة</td>
    <td class="co-cell">شركة نفط البصرة</td>
  </tr>
  <tr>
    <td class="lbl-cell">رمز النموذج</td>
    <td style="text-align:center;font-size:10pt">BOC-P-13//F02 &nbsp;&nbsp;&nbsp; رقم الإصدار: 1 &nbsp;&nbsp;&nbsp; تاريخ الإصدار: 2019/1/7</td>
    <td></td>
  </tr>
</table>
<div class="phone">372-3000-400</div>
<div class="co-name">شركة نفط البصرة (شركة عامة )</div>
<div class="form-title">إستمارة ترك العمل للعلاج الطبي</div>
<div class="field">الاسم : <span>${name}</span></div>
<div class="field">الرقم : <span>${jobNum}</span></div>
<div class="field">المهنة : <span>${jobTitle}</span></div>
<div class="field">تاريخ ترك العمل : <span>${fmtDate(leaveDate)}</span></div>
<div class="field">وقت ترك العمل : <span>${fmtTime(leaveTime)}</span></div>
<div class="sec-label">المسؤول</div>
<div class="sig-space">${sigHtml}</div>
<div class="field">تاريخ وقت مراجعة المستوصف : <span>${fmtDT(clinicDT)}</span></div>
<div class="field" style="min-height:28px">الملاحظات : <span>${notes}</span></div>
<div class="sec-label">الطبيب</div>
<div class="sig-space"></div>
<div class="field">تاريخ عودته الى العمل : <span>${fmtDate(returnDate)}</span></div>
<div class="field">وقت عودته الى العمل : <span>${fmtTime(returnTime)}</span></div>
<div class="footer">* يعتبر هذا النموذج ملك لشركة نفط البصرة . لا يجوزظ نسخه او الكشف عن محتواه بدون موافقة خطية مسبقة من قبل شركة نفط البصرة</div>
</body></html>`;
  };

  const printForm = () => {
    const html = buildSickHtml();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const uploadToDrive = async () => {
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const html = buildSickHtml();
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const dateStr = leaveDate || new Date().toISOString().split("T")[0];
      const file = new File(
        [new Blob([html], { type: "text/html" })],
        `اجازة-مرضية-${safeName}-${dateStr}.html`,
        { type: "text/html" }
      );
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast.success("تم رفع نموذج الإجازة المرضية إلى Drive");
    } catch (e) {
      toast.error("فشل رفع الملف: " + e.message);
    } finally {
      setUploadPct(-1);
    }
  };

  const exportToExcel = async () => {
    setXlExporting(true);
    try {
      const res = await fetch("/templates/leave-sick.xlsx");
      const buf0 = await res.arrayBuffer();
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf0);
      const ws = wb.worksheets[0];
      const set = (r, v) => { ws.getCell(r).value = v ?? null; };
      const fmtD = d => {
        if (!d) return "";
        const dt = new Date(d + "T00:00:00");
        return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
      };
      const fmtDT = v => {
        if (!v) return "";
        const dt = new Date(v);
        return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}  ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
      };
      set("C5",  fmtD(new Date().toISOString().split("T")[0]));
      set("I8",  name);
      set("I9",  String(jobNum || ""));
      set("I10", jobTitle);
      set("I11", fmtD(leaveDate));
      set("I12", leaveTime || "");
      set("I16", fmtDT(clinicDT));
      set("I18", notes);
      set("I24", fmtD(returnDate));
      set("I25", returnTime || "");
      const outBuf = await wb.xlsx.writeBuffer();
      const safeName = (name || "موظف").replace(/\s+/g, "_");
      const fname = `اجازة_مرضية_${safeName}_${leaveDate || "بدون_تاريخ"}.xlsx`;
      const blob = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      toast.success("تم تصدير نموذج الإجازة المرضية");
      if (gDrive.isReady) {
        setUploadPct(0);
        const file = new File([outBuf], fname, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
        setDriveLink(result.webViewLink);
        toast.success("تم رفع النموذج إلى Drive");
      }
    } catch(e) {
      toast.error("فشل التصدير: " + e.message);
    } finally {
      setXlExporting(false); setUploadPct(-1);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة مرضية — إستمارة ترك العمل للعلاج الطبي</h2><p className="text-xs text-secondary">BOC-P-13//F02 — طباعة A4 portrait</p></div>
      </div>

      {/* بيانات الموظف */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">الاسم</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">المهنة</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>

      {/* ترك العمل */}
      <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 space-y-3">
        <p className="text-xs font-bold text-rose-700">بيانات ترك العمل</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ ترك العمل</label><input type="date" value={leaveDate} onChange={e=>setLeaveDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وقت ترك العمل</label><input type="time" value={leaveTime} onChange={e=>setLeaveTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        </div>
      </div>

      {/* توقيع المسؤول */}
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع المسؤول (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم التوقيع ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
      </div>

      {/* مراجعة المستوصف */}
      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 space-y-3">
        <p className="text-xs font-bold text-blue-700">بيانات المستوصف</p>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ/وقت مراجعة المستوصف</label><input type="datetime-local" value={clinicDT} onChange={e=>setClinicDT(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الملاحظات</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none"/></div>
      </div>

      {/* العودة للعمل */}
      <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 space-y-3">
        <p className="text-xs font-bold text-emerald-700">بيانات العودة للعمل</p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ العودة للعمل</label><input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وقت العودة للعمل</label><input type="time" value={returnTime} onChange={e=>setReturnTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        {gDrive.isReady && (
          <button onClick={uploadToDrive} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "رفع إلى Drive"}
          </button>
        )}
        <button onClick={exportToExcel} disabled={xlExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"><Download size={14}/> {xlExporting ? "جاري التصدير..." : "تصدير إكسل"}</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== نموذج إجازة خارج القطر ==========
function OutOfCountryLeaveForm({ emp }) {
  const now = new Date();
  const toast = useToast();
  const gDrive = useGDrive();
  const STORAGE_KEY = `ooc_leave_${emp.id}`;

  const [name, setName] = useState(emp.name);
  const [jobNum, setJobNum] = useState(emp.jobNum || "");
  const [jobTitle, setJobTitle] = useState(emp.title || "");
  const [dept, setDept] = useState(emp.dept || "");
  const [country, setCountry] = useState("");
  const [days, setDays] = useState("");
  const [salaryType, setSalaryType] = useState("براتب");
  const [purpose, setPurpose] = useState("");
  const [reqDate, setReqDate] = useState(now.toISOString().split("T")[0]);
  const [refNum, setRefNum] = useState("");
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);
  const [templateId, setTemplateId] = useState(() => storage.get("template_id_ooc", ""));

  useEffect(() => {
    const saved = storage.get(STORAGE_KEY, null);
    if (saved) {
      setName(saved.name || emp.name);
      setJobNum(saved.jobNum || emp.jobNum || "");
      setJobTitle(saved.jobTitle || emp.title || "");
      setDept(saved.dept || emp.dept || "");
      setCountry(saved.country || "");
      setDays(saved.days || "");
      setSalaryType(saved.salaryType || "براتب");
      setPurpose(saved.purpose || "");
      setReqDate(saved.reqDate || now.toISOString().split("T")[0]);
      setRefNum(saved.refNum || "");
      setSigDataUrl(saved.sigDataUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, country, days, salaryType, purpose, reqDate, refNum, sigDataUrl });
    toast.success("تم حفظ بيانات إجازة خارج القطر");
  };

  const fmtDate = (d) => {
    if (!d) return "____/____/____";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
  };

  const BOC_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="60" height="60">
    <rect width="120" height="120" fill="white"/>
    <path d="M 17.8,31.3 A 54,54 0 0,1 113.8,55.3 L 93.9,57 A 34,34 0 0,0 32.2,40.5 Z" fill="#cc1122" transform="translate(6,6)"/>
    <path d="M 113.8,55.3 A 54,54 0 0,1 113.8,64.7 L 93.9,63 A 34,34 0 0,0 93.9,57 Z" fill="white" transform="translate(6,6)"/>
    <path d="M 113.8,64.7 A 54,54 0 0,1 17.8,88.7 L 32.2,79.5 A 34,34 0 0,0 93.9,63 Z" fill="#111111" transform="translate(6,6)"/>
    <circle cx="60" cy="60" r="30" fill="white"/>
    <path d="M60,37 C72,51 80,63 80,71 Q80,90 60,90 Q40,90 40,71 C40,63 48,51 60,37Z" fill="#1e8b3a"/>
    <ellipse cx="53" cy="52" rx="4" ry="7" fill="rgba(255,255,255,0.55)" transform="rotate(-25,53,52)"/>
    <text x="60" y="22" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="8.5" font-weight="bold">شركة نفط البصرة</text>
    <text x="60" y="106" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="9.5" font-weight="bold" letter-spacing="1">B.O.C</text>
  </svg>`;

  const buildOocHtml = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:120px;max-height:50px;display:block;margin:8px auto 0;"/>`
      : "";
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>
<title>نموذج طلب اجازة خارج جمهورية العراق</title>
<style>
  @page{size:A4 portrait;margin:15mm 12mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:11pt;direction:rtl;color:#111}
  table{border-collapse:collapse}
  .hdr{width:100%;margin-bottom:10px}
  .hdr td{border:1px solid #444;padding:5px 8px;vertical-align:middle;text-align:center}
  .hdr-company{font-size:12pt;font-weight:bold;background:#f0f0f0;width:20%;text-align:center}
  .hdr-lbl{font-size:9pt;color:#555;text-align:right;padding-right:6px;background:#fafafa;width:14%}
  .hdr-val{font-size:11.5pt;font-weight:bold;width:44%}
  .hdr-info{font-size:9pt;width:22%}
  .hdr-logo{width:10%;padding:3px}
  .subject{font-size:13pt;font-weight:bold;margin:14px 0 10px;text-decoration:underline}
  .flds{width:100%;margin-bottom:14px}
  .flds td{padding:6px 10px;border-bottom:1px dotted #bbb;font-size:11pt}
  .fld-lbl{font-weight:bold;width:32%;white-space:nowrap}
  .fld-val{border-bottom:1.5px solid #333}
  .req{font-size:11.5pt;line-height:2.6;border:1.5px solid #333;padding:10px 14px;margin-bottom:12px;background:#fefefe}
  .blank{display:inline-block;border-bottom:1.5px solid #333;min-width:70px;text-align:center;padding:0 4px;font-weight:bold}
  .blank-lg{min-width:130px}
  .salut{font-size:11pt;text-align:right;margin-bottom:16px}
  .sig4{display:flex;gap:8px;margin:14px 0 8px}
  .sbox{flex:1;border:1.5px solid #333;text-align:center;padding:5px 3px;min-height:80px}
  .stitle{font-weight:bold;font-size:10pt;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:6px}
  .note{font-size:9.5pt;border:1px dotted #888;padding:7px 12px;margin-top:8px;line-height:1.8;color:#333}
  .sep{border-top:2px dashed #444;margin:22px 0 16px}
  .fwd-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
  .fwd-meta{font-size:11pt;line-height:2.2}
  .fwd-meta span{font-weight:bold;border-bottom:1.5px solid #333;min-width:60px;display:inline-block;padding:0 4px}
  .fwd-refs{font-size:11pt;line-height:2.2;text-align:left;direction:ltr}
  .fwd-refs span{border-bottom:1.5px solid #333;min-width:80px;display:inline-block;text-align:center}
  .fwd-subj{font-size:12pt;font-weight:bold;text-decoration:underline;margin:10px 0 12px}
  .fwd-body{font-size:11pt;line-height:2.4;margin-bottom:10px}
  .fwd-sigrow{display:flex;justify-content:flex-start;margin-top:20px}
  .fwd-sigbox{border:1.5px solid #333;text-align:center;padding:6px 24px;min-height:70px;min-width:220px}
</style></head>
<body>
<table class="hdr">
  <tr>
    <td rowspan="2" class="hdr-company">شركة نفط البصرة<br/>(شركة عامة)</td>
    <td class="hdr-lbl">عنوان النموذج</td>
    <td colspan="2" class="hdr-val">نموذج طلب اجازة خارج جمهورية العراق</td>
    <td rowspan="2" class="hdr-logo">${BOC_LOGO}</td>
  </tr>
  <tr>
    <td class="hdr-lbl">رمز النموذج</td>
    <td class="hdr-info" style="font-weight:bold">BOC-P-HR/F05</td>
    <td class="hdr-info">رقم الإصدار: 1 &nbsp;|&nbsp; تاريخ الإصدار: 2023/4/10</td>
  </tr>
</table>

<div class="subject">م/ إجازة اعتيادية خارج جمهورية العراق</div>

<table class="flds">
  <tr><td class="fld-lbl">الاسم الثلاثي :</td><td class="fld-val">${name}</td></tr>
  <tr><td class="fld-lbl">الرقم الوظيفي :</td><td class="fld-val">${jobNum}</td></tr>
  <tr><td class="fld-lbl">العنوان الوظيفي :</td><td class="fld-val">${jobTitle}</td></tr>
  <tr><td class="fld-lbl">تاريخ تقديم الطلب :</td><td class="fld-val">${fmtDate(reqDate)}</td></tr>
</table>

<div class="req">
  ارجو التفضل بالموافقة على منحي اجازة اعتيادية خارج جمهورية العراق
  ( <span class="blank blank-lg">&nbsp;${country || "_______________"}&nbsp;</span> )
  ولمدة
  ( <span class="blank">&nbsp;${days || "____"}&nbsp;</span> يوما )
  ( <span class="blank">&nbsp;${salaryType}&nbsp;</span> لغرض )
  ( <span class="blank blank-lg">&nbsp;${purpose || "___________________________"}&nbsp;</span> )
  وابتدآ من تاريخ الانفكاك .
</div>

<div class="salut">مع التقدير ...</div>

<div class="sig4">
  <div class="sbox"><div class="stitle">مسؤول الشعبة</div>${sigHtml}</div>
  <div class="sbox"><div class="stitle">مدير القسم</div></div>
  <div class="sbox"><div class="stitle">مدير هيأة الصيانة الهندسية</div></div>
  <div class="sbox"><div class="stitle">المعاون المختص</div></div>
</div>

<div class="note">
  <strong>ملاحظة :</strong>
  يرسل الطلب الى الهيئة الادارية في حال طلب الاجازة ( براتب تام) لاكثر من 3 اشهر ولغاية 4 اشهر وفي حال طلب الاجازة ( بدون راتب )
</div>

<div class="sep"></div>

<div class="fwd-top">
  <div class="fwd-meta">
    <div>من / <span>${dept || "قسم السيطرة والنظم"}</span></div>
    <div>الى / السيد مدير هيأة الصيانة الهندسية</div>
  </div>
  <div class="fwd-refs" dir="rtl">
    <div>العـــدد : <span>${refNum || "________"}</span></div>
    <div>التاريخ : <span>${fmtDate(reqDate)}</span></div>
  </div>
</div>

<div class="fwd-subj">م/ طلب اجازة اعتيادية خارج جمهورية العراق</div>

<div class="fwd-body">
  نرفق لكم اعلاه طلب السيد
  <span style="border-bottom:1.5px solid #333;padding:0 6px;font-weight:bold">&nbsp;${name}&nbsp;</span>
  للتفضل بالموافقة على منحه الاجازة المطلوبة وحسب صلاحيتكم
</div>

<div class="salut">مع التقدير...</div>

<div class="fwd-sigrow">
  <div class="fwd-sigbox">
    <div class="stitle">توقيع مدير الهيئة الادارية</div>
    <div style="margin-top:8px;font-size:10pt">التوقيع : ________________</div>
  </div>
</div>

</body></html>`;
  };

  const printForm = () => {
    const html = buildOocHtml();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const uploadAsWord = async () => {
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        WidthType, AlignmentType, VerticalAlign, BorderStyle, ShadingType,
        UnderlineType,
      } = await import("docx");

      // ── border helpers ──
      const SB  = { style: BorderStyle.SINGLE,  size: 8,  color: "444444" };
      const DB  = { style: BorderStyle.DOTTED,  size: 4,  color: "AAAAAA" };
      const DSH = { style: BorderStyle.DASHED,  size: 8,  color: "555555" };
      const NB  = { style: BorderStyle.NONE,    size: 0,  color: "FFFFFF" };

      // ── text helpers ──
      const ar = (text, opts = {}) => new TextRun({
        text,
        rightToLeft: true,
        font: "Times New Roman",
        size: opts.sz || 22,
        bold: opts.b || false,
        underline: opts.u ? { type: UnderlineType.SINGLE } : undefined,
      });

      const p = (runs, opts = {}) => new Paragraph({
        bidirectional: true,
        alignment: opts.al !== undefined ? opts.al : AlignmentType.RIGHT,
        spacing: { before: opts.sb !== undefined ? opts.sb : 80, after: opts.sa !== undefined ? opts.sa : 80 },
        border: opts.bdr,
        children: Array.isArray(runs) ? runs : [runs],
      });

      // ── cell helper ──
      const tc = (content, opts = {}) => new TableCell({
        width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
        rowSpan: opts.rs,
        columnSpan: opts.cs,
        verticalAlign: VerticalAlign.CENTER,
        shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
        borders: {
          top:    opts.bt !== undefined ? opts.bt : SB,
          bottom: opts.bb !== undefined ? opts.bb : SB,
          left:   opts.bl !== undefined ? opts.bl : SB,
          right:  opts.br !== undefined ? opts.br : SB,
        },
        children: Array.isArray(content) ? content : [content],
      });

      // ── HEADER TABLE ──
      const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            tc([p(ar("شركة نفط البصرة", { b: true, sz: 22 }), { al: AlignmentType.CENTER, sb: 40, sa: 20 }),
                p(ar("(شركة عامة)", { sz: 20 }),              { al: AlignmentType.CENTER, sb: 20, sa: 40 })],
               { rs: 2, fill: "F0F0F0" }),
            tc(p(ar("عنوان النموذج", { sz: 18 }), { al: AlignmentType.CENTER }), { fill: "FAFAFA" }),
            tc(p(ar("نموذج طلب اجازة خارج جمهورية العراق", { b: true, sz: 24 }), { al: AlignmentType.CENTER, sb: 40, sa: 40 }), { cs: 2 }),
            tc([p(ar("B.O.C",              { b: true, sz: 28 }), { al: AlignmentType.CENTER, sb: 30, sa: 10 }),
                p(ar("شركة نفط البصرة",   { sz: 14 }),           { al: AlignmentType.CENTER, sb: 0,  sa: 30 })],
               { rs: 2 }),
          ]}),
          new TableRow({ children: [
            tc(p(ar("رمز النموذج", { sz: 18 }), { al: AlignmentType.CENTER }), { fill: "FAFAFA" }),
            tc(p(ar("BOC-P-HR/F05", { b: true, sz: 20 }), { al: AlignmentType.CENTER })),
            tc([p(ar("رقم الإصدار: 1",        { sz: 18 }), { al: AlignmentType.CENTER, sb: 30, sa: 20 }),
                p(ar("تاريخ الإصدار: 2023/4/10", { sz: 18 }), { al: AlignmentType.CENTER, sb: 20, sa: 30 })]),
          ]}),
        ],
      });

      // ── FIELDS TABLE ──
      const fieldsTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          ["الاسم الثلاثي :", name || ""],
          ["الرقم الوظيفي :", jobNum || ""],
          ["العنوان الوظيفي :", jobTitle || ""],
          ["تاريخ تقديم الطلب :", fmtDate(reqDate)],
        ].map(([lbl, val]) => new TableRow({ children: [
          tc(p(ar(lbl, { b: true }),  { sb: 80, sa: 80 }), { w: 30, bt: NB, bb: DB, bl: NB, br: NB }),
          tc(p(ar(val),               { sb: 80, sa: 80 }), { w: 70, bt: NB, bb: SB, bl: NB, br: NB }),
        ]})),
      });

      // ── REQUEST PARAGRAPH (bordered box) ──
      const PB = { value: "single", size: 8, color: "333333" };
      const reqPara = p([
        ar("ارجو التفضل بالموافقة على منحي اجازة اعتيادية خارج جمهورية العراق ( "),
        ar(country || "_______________", { b: true }),
        ar(" ) ولمدة ( "),
        ar(days || "____", { b: true }),
        ar(" يوما ) ( "),
        ar(salaryType || "براتب", { b: true }),
        ar(" لغرض ) ( "),
        ar(purpose || "___________________________", { b: true }),
        ar(" ) وابتدآ من تاريخ الانفكاك ."),
      ], { sb: 160, sa: 160, bdr: { top: PB, bottom: PB, left: PB, right: PB } });

      // ── 4-COLUMN SIGNATURE TABLE ──
      const sigCell = (title) => tc([
        p(ar(title, { b: true, sz: 20 }), { al: AlignmentType.CENTER, sb: 60, sa: 300 }),
        p(ar(""), { sb: 0, sa: 60 }),
      ]);
      const sig4Table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          sigCell("مسؤول الشعبة"),
          sigCell("مدير القسم"),
          sigCell("مدير هيأة الصيانة الهندسية"),
          sigCell("المعاون المختص"),
        ]})],
      });

      // ── NOTE ──
      const PBD = { value: "dotted", size: 4, color: "999999" };
      const notePara = p([
        ar("ملاحظة : ", { b: true, sz: 20 }),
        ar("يرسل الطلب الى الهيئة الادارية في حال طلب الاجازة ( براتب تام) لاكثر من 3 اشهر ولغاية 4 اشهر وفي حال طلب الاجازة ( بدون راتب )", { sz: 20 }),
      ], { sb: 100, sa: 100, bdr: { top: PBD, bottom: PBD, left: PBD, right: PBD } });

      // ── DASHED SEPARATOR ──
      const sep = p(ar(""), { sb: 240, sa: 240,
        bdr: { bottom: { value: "dashed", size: 8, color: "555555" } }
      });

      // ── FORWARDING LETTER HEADER (2-col, no-border table) ──
      const fwdHeaderTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          tc([
            p([ar("من / "), ar(dept || "قسم السيطرة والنظم", { b: true })], { sb: 60, sa: 60 }),
            p(ar("الى / السيد مدير هيأة الصيانة الهندسية"),                  { sb: 60, sa: 60 }),
          ], { bt: NB, bb: NB, bl: NB, br: NB }),
          tc([
            p([ar("العـــدد : "), ar(refNum || "________", { b: true })], { al: AlignmentType.RIGHT, sb: 60, sa: 60 }),
            p([ar("التاريخ : "), ar(fmtDate(reqDate), { b: true })],       { al: AlignmentType.RIGHT, sb: 60, sa: 60 }),
          ], { bt: NB, bb: NB, bl: NB, br: NB }),
        ]})],
      });

      // ── FWD SIGNATURE BOX ──
      const fwdSigTable = new Table({
        width: { size: 45, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: [
          tc([
            p(ar("توقيع مدير الهيئة الادارية", { b: true, sz: 20 }), { al: AlignmentType.CENTER, sb: 60, sa: 260 }),
            p(ar("التوقيع : ________________", { sz: 20 }),            { al: AlignmentType.CENTER, sb: 40, sa: 60 }),
          ]),
        ]})],
      });

      // ── BUILD DOCUMENT ──
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size:   { width: 11906, height: 16838 },
              margin: { top: 1700, right: 1360, bottom: 1700, left: 1360 },
            },
          },
          children: [
            headerTable,
            p(ar(""), { sb: 120, sa: 0 }),
            p(ar("م/ إجازة اعتيادية خارج جمهورية العراق", { b: true, sz: 26, u: true }), { sb: 80, sa: 140 }),
            fieldsTable,
            p(ar(""), { sb: 80, sa: 0 }),
            reqPara,
            p(ar("مع التقدير ...", { sz: 22 }), { sb: 120, sa: 120 }),
            sig4Table,
            p(ar(""), { sb: 60, sa: 0 }),
            notePara,
            sep,
            fwdHeaderTable,
            p(ar("م/ طلب اجازة اعتيادية خارج جمهورية العراق", { b: true, sz: 24, u: true }), { sb: 120, sa: 80 }),
            p([
              ar("نرفق لكم اعلاه طلب السيد "),
              ar(name || "___________", { b: true, u: true }),
              ar(" للتفضل بالموافقة على منحه الاجازة المطلوبة وحسب صلاحيتكم"),
            ], { sb: 80, sa: 120 }),
            p(ar("مع التقدير...", { sz: 22 }), { sb: 120, sa: 180 }),
            fwdSigTable,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File(
        [blob],
        `اجازة-خارج-العراق-${safeName}-${reqDate || "بدون-تاريخ"}.docx`,
        { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
      );
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast.success("تم حفظ الاستمارة كملف Word في Drive");
    } catch (e) {
      console.error("docx build error:", e);
      toast.error("فشل إنشاء ملف Word: " + e.message);
    } finally {
      setUploadPct(-1);
    }
  };

  const fillFromTemplate = async () => {
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    if (!templateId.trim()) { toast.warning("يرجى إدخال معرف ملف القالب"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const { default: JSZip } = await import("jszip");

      // تنزيل القالب
      let arrayBuffer;
      try {
        arrayBuffer = await gDrive.downloadFile(templateId.trim());
      } catch (dlErr) {
        throw new Error("فشل تنزيل القالب من Drive: " + dlErr.message);
      }
      if (!arrayBuffer || arrayBuffer.byteLength === 0) throw new Error("الملف المُنزَّل فارغ — تحقق من File ID");

      const zip = await JSZip.loadAsync(arrayBuffer);

      const esc = (s) => String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const replacements = {
        "{{الاسم}}":           esc(name),
        "{{الرقم_الوظيفي}}":  esc(jobNum),
        "{{العنوان_الوظيفي}}": esc(jobTitle),
        "{{القسم}}":           esc(dept),
        "{{البلد}}":           esc(country),
        "{{الأيام}}":          esc(days),
        "{{الراتب}}":          esc(salaryType),
        "{{الغرض}}":           esc(purpose),
        "{{التاريخ}}":         esc(fmtDate(reqDate)),
        "{{العدد}}":           esc(refNum),
      };

      // دمج النصوص المقسّمة بين عناصر XML المتجاورة
      // Word يقسّم {{النص}} أحياناً على عدة <w:r> مما يمنع الاستبدال
      const mergeRuns = (xmlContent) =>
        xmlContent.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (para) =>
          para.replace(
            /<\/w:t><\/w:r>(\s*<w:r[^>]*>)(\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>/g,
            ""
          )
        );

      let replacedCount = 0;
      for (const path of Object.keys(zip.files).filter(f => f.startsWith("word/") && f.endsWith(".xml"))) {
        let content = await zip.file(path).async("string");
        content = mergeRuns(content);
        for (const [ph, val] of Object.entries(replacements)) {
          const before = content;
          content = content.split(ph).join(val);
          if (content !== before) replacedCount++;
        }
        zip.file(path, content);
      }

      if (replacedCount === 0) {
        const phList = Object.keys(replacements).join("  ");
        throw new Error(`لم يُعثر على أي حقل قابل للاستبدال في القالب.\n\nتأكد أن ملف القالب يحتوي على أحد هذه النصوص:\n${phList}`);
      }

      const blob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File(
        [blob],
        `اجازة-خارج-العراق-${safeName}-${reqDate || "بدون-تاريخ"}.docx`,
        { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
      );
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result?.webViewLink || null);
      toast.success(`تم تعبئة ${replacedCount} حقل ورفع النسخة المعبأة إلى Drive ✅`);
    } catch (e) {
      console.error("fillFromTemplate error:", e);
      alert("خطأ في تعبئة القالب:\n\n" + e.message);
      toast.error("فشل تعبئة القالب");
    } finally {
      setUploadPct(-1);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center"><Globe size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة خارج جمهورية العراق</h2><p className="text-xs text-secondary">BOC-P-HR/F05 — ملف Word في Drive + طباعة A4</p></div>
      </div>

      <div><label className="block text-xs font-bold text-secondary mb-1">الاسم الثلاثي</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">العنوان الوظيفي</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">القسم (للكتاب المرفق)</label><input value={dept} onChange={e=>setDept(e.target.value)} placeholder="مثال: قسم السيطرة والنظم" className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ تقديم الطلب</label><input type="date" value={reqDate} onChange={e=>setReqDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">البلد / الجمهورية المقصودة</label><input value={country} onChange={e=>setCountry(e.target.value)} placeholder="مثال: جمهورية الهند" className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">مدة الإجازة (يوم)</label><input type="number" min="1" value={days} onChange={e=>setDays(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">نوع الراتب</label>
          <select value={salaryType} onChange={e=>setSalaryType(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm">
            <option value="براتب">براتب</option>
            <option value="بدون راتب">بدون راتب</option>
          </select>
        </div>
        <div><label className="block text-xs font-bold text-secondary mb-1">رقم العدد (للكتاب المرفق)</label><input value={refNum} onChange={e=>setRefNum(e.target.value)} placeholder="مثال: 1234" className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">الغرض من الإجازة</label><input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="مثال: مرافقة علاج مريض" className="input w-full rounded-lg px-3 py-2 text-sm"/></div>

      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع مسؤول الشعبة (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم التوقيع ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
      </div>

      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800 leading-relaxed">
        <strong>ملاحظة:</strong> يرسل الطلب الى الهيئة الادارية في حال طلب الاجازة (براتب تام) لأكثر من 3 اشهر ولغاية 4 اشهر وفي حال طلب الاجازة (بدون راتب)
      </div>

      {gDrive.isReady && (
        <div className="p-4 rounded-xl border border-violet-200 bg-violet-50 space-y-3">
          <p className="text-xs font-bold text-violet-800">تعبئة قالب Word موجود في Drive</p>
          <div className="flex gap-2">
            <input
              value={templateId}
              onChange={e => { setTemplateId(e.target.value); storage.set("template_id_ooc", e.target.value); }}
              placeholder="معرّف ملف القالب في Drive (File ID)"
              className="input flex-1 rounded-lg px-3 py-2 text-sm font-mono"
              dir="ltr"
            />
            <button
              onClick={fillFromTemplate}
              disabled={uploadPct >= 0 || !templateId.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 whitespace-nowrap"
            >
              <FileText size={14}/> {uploadPct >= 0 ? `${uploadPct}%` : "تعبئة القالب"}
            </button>
          </div>
          <p className="text-[11px] text-violet-600">
            ستجد معرّف الملف في رابط Drive: .../file/d/<strong>FILE_ID</strong>/view
            — ضع في القالب العناصر النصية: {"{{الاسم}}"} {"{{البلد}}"} {"{{الأيام}}"} {"{{الراتب}}"} {"{{الغرض}}"} {"{{التاريخ}}"} {"{{العدد}}"} إلخ.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        {gDrive.isReady && (
          <button onClick={uploadAsWord} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "Word في Drive"}
          </button>
        )}
        <a href="/templates/leave-ooc.xlsx" download className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-200"><Download size={14}/> تنزيل النموذج</a>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== نموذج الإجازة الزمنية ==========
function TimeLeaveForm({ emp }) {
  const now = new Date();
  const toast = useToast();
  const gDrive = useGDrive();
  const STORAGE_KEY = `time_leave_${emp.id}`;

  const [name, setName] = useState(emp.name);
  const [jobNum, setJobNum] = useState(emp.jobNum || "");
  const [jobTitle, setJobTitle] = useState(emp.title || "");
  const [dept, setDept] = useState(emp.dept || "");
  const [leaveDate, setLeaveDate] = useState(now.toISOString().split("T")[0]);
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [sigDataUrl, setSigDataUrl] = useState(null);
  const [uploadPct, setUploadPct] = useState(-1);
  const [driveLink, setDriveLink] = useState(null);
  const [xlExporting, setXlExporting] = useState(false);

  useEffect(() => {
    const saved = storage.get(STORAGE_KEY, null);
    if (saved) {
      setName(saved.name || emp.name);
      setJobNum(saved.jobNum || emp.jobNum || "");
      setJobTitle(saved.jobTitle || emp.title || "");
      setDept(saved.dept || emp.dept || "");
      setLeaveDate(saved.leaveDate || now.toISOString().split("T")[0]);
      setDepartureTime(saved.departureTime || "");
      setReturnTime(saved.returnTime || "");
      setHours(saved.hours || "");
      setReason(saved.reason || "");
      setSigDataUrl(saved.sigDataUrl || null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (departureTime && returnTime) {
      const [dh, dm] = departureTime.split(":").map(Number);
      const [rh, rm] = returnTime.split(":").map(Number);
      const diff = (rh * 60 + rm) - (dh * 60 + dm);
      if (diff > 0) setHours((diff / 60).toFixed(1).replace(/\.0$/, ""));
    }
  }, [departureTime, returnTime]);

  const save = () => {
    storage.set(STORAGE_KEY, { name, jobNum, jobTitle, dept, leaveDate, departureTime, returnTime, hours, reason, sigDataUrl });
    toast.success("تم حفظ بيانات الإجازة الزمنية");
  };

  const fmtDate = (d) => {
    if (!d) return "____/____/____";
    const dt = new Date(d);
    return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
  };

  const fmtTime = (t) => t || "____ : ____";

  const buildTimeHtml = () => {
    const sigHtml = sigDataUrl
      ? `<img src="${sigDataUrl}" style="max-width:120px;max-height:50px;display:block;margin:auto;"/>`
      : `<div style="min-height:40px"></div>`;
    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>إجازة زمنية</title>
<style>
  @page{size:A5 portrait;margin:8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Arial,sans-serif;font-size:9pt;direction:rtl}
  .header{display:flex;border:1.5px solid #333;margin-bottom:5px}
  .h-logo{width:42px;border-left:1px solid #333;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10.5pt}
  .h-mid{flex:1;text-align:center;padding:4px 6px}
  .h-ref{width:85px;border-right:1px solid #333;padding:3px 5px;font-size:7.5pt;text-align:center;line-height:1.6}
  .company{font-size:10.5pt;font-weight:bold}
  .csub{font-size:8pt;color:#444}
  .form-title{font-size:11pt;font-weight:bold;text-align:center;margin-bottom:6px;border:1.5px solid #333;padding:4px}
  .fr{display:flex;align-items:baseline;gap:6px;margin-bottom:5px;border-bottom:1px dotted #bbb;padding-bottom:3px}
  .lbl{font-weight:bold;font-size:8.5pt;min-width:70px;white-space:nowrap}
  .val{flex:1;font-size:9pt}
  .time-row{display:flex;gap:10px;margin:8px 0}
  .time-box{flex:1;border:1.5px solid #333;text-align:center;padding:6px 4px}
  .time-label{font-weight:bold;font-size:8pt;margin-bottom:4px;border-bottom:1px solid #ccc;padding-bottom:2px}
  .time-val{font-size:11pt;font-weight:bold;direction:ltr}
  .sentence{font-size:9pt;margin:6px 0;line-height:2.0;border:1px solid #ccc;padding:5px 8px;background:#fafafa}
  .blank{display:inline-block;min-width:40px;text-align:center;font-weight:bold;border-bottom:1px solid #555;padding:0 2px}
  .sig-row{display:flex;gap:8px;margin-top:8px}
  .sig-box{border:1.5px solid #333;text-align:center;padding:5px 4px;min-height:58px;flex:1}
  .sig-title{font-weight:bold;font-size:8pt;margin-bottom:3px}
  .fn{font-size:7pt;margin-top:5px;text-align:center;border-top:1px dotted #aaa;padding-top:3px;color:#555}
</style></head>
<body>
<div class="header">
  <div class="h-logo">BOC</div>
  <div class="h-mid">
    <div class="company">شركة نفط البصرة (شركة عامة)</div>
    <div class="csub">إدارة الموارد البشرية — شعبة مستودع الفاو</div>
  </div>
  <div class="h-ref"><div>BOC-P-13/F04</div><div>2022/6/1</div><div>372-3000-400</div></div>
</div>
<div class="form-title">نموذج إجازة زمنية</div>
<div class="fr"><span class="lbl">الاسم الثلاثي:</span><span class="val">${name}</span></div>
<div class="fr"><span class="lbl">الرقم الوظيفي:</span><span class="val">${jobNum}</span></div>
<div class="fr"><span class="lbl">العنوان الوظيفي:</span><span class="val">${jobTitle}</span></div>
<div class="fr"><span class="lbl">القسم / الشعبة:</span><span class="val">${dept || "—"}</span></div>
<div class="fr"><span class="lbl">تاريخ الإجازة:</span><span class="val">${fmtDate(leaveDate)}</span></div>
<div class="time-row">
  <div class="time-box">
    <div class="time-label">وقت المغادرة</div>
    <div class="time-val">${fmtTime(departureTime)}</div>
  </div>
  <div class="time-box">
    <div class="time-label">وقت العودة</div>
    <div class="time-val">${fmtTime(returnTime)}</div>
  </div>
  <div class="time-box">
    <div class="time-label">عدد الساعات</div>
    <div class="time-val">${hours || "—"}</div>
  </div>
</div>
<div class="sentence">
  السبب / الغرض: &nbsp;<span class="blank">&nbsp;${reason || "___________________________________"}&nbsp;</span>
</div>
<div class="sig-row">
  <div class="sig-box"><div class="sig-title">توقيع الموظف</div>${sigHtml}</div>
  <div class="sig-box"><div class="sig-title">توقيع المسؤول المباشر</div></div>
</div>
<div class="fn">تحتفظ الجهة بنسخة وتسلم نسخة للموظف</div>
</body></html>`;
  };

  const printForm = () => {
    const html = buildTimeHtml();
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 2000); }, 400);
  };

  const uploadToDrive = async () => {
    if (!gDrive.isReady) { toast.warning("يرجى ربط Google Drive أولاً"); return; }
    setUploadPct(0); setDriveLink(null);
    try {
      const html = buildTimeHtml();
      const safeName = (name || "موظف").replace(/\s+/g, "-");
      const file = new File([new Blob([html], { type: "text/html" })], `اجازة-زمنية-${safeName}-${leaveDate || "بدون-تاريخ"}.html`, { type: "text/html" });
      const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
      setDriveLink(result.webViewLink);
      toast.success("تم رفع نموذج الإجازة الزمنية إلى Drive");
    } catch (e) {
      toast.error("فشل رفع الملف: " + e.message);
    } finally {
      setUploadPct(-1);
    }
  };

  const exportToExcel = async () => {
    setXlExporting(true);
    try {
      const res = await fetch("/templates/leave-time.xlsx");
      const buf0 = await res.arrayBuffer();
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf0);
      const ws = wb.worksheets[0];
      const set = (r, v) => { ws.getCell(r).value = v ?? null; };
      const fmtD = d => {
        if (!d) return "";
        const dt = new Date(d + "T00:00:00");
        return `${dt.getFullYear()}/${String(dt.getMonth()+1).padStart(2,"0")}/${String(dt.getDate()).padStart(2,"0")}`;
      };
      set("F2", fmtD(leaveDate));
      set("C7", name);
      set("E7", String(jobNum || ""));
      set("G7", jobTitle);
      set("D8", dept);
      set("G8", departureTime || "");
      set("C9", returnTime || "");
      const outBuf = await wb.xlsx.writeBuffer();
      const safeName = (name || "موظف").replace(/\s+/g, "_");
      const fname = `اجازة_زمنية_${safeName}_${leaveDate || "بدون_تاريخ"}.xlsx`;
      const blob = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
      toast.success("تم تصدير نموذج الإجازة الزمنية");
      if (gDrive.isReady) {
        setUploadPct(0);
        const file = new File([outBuf], fname, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const result = await gDrive.uploadFile(file, pct => setUploadPct(pct));
        setDriveLink(result.webViewLink);
        toast.success("تم رفع النموذج إلى Drive");
      }
    } catch(e) {
      toast.error("فشل التصدير: " + e.message);
    } finally {
      setXlExporting(false); setUploadPct(-1);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5" dir="rtl">
      <div className="flex items-center gap-3 pb-3 border-b border-color">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center"><Clock size={20} className="text-white"/></div>
        <div><h2 className="text-xl font-bold text-primary">إجازة زمنية</h2><p className="text-xs text-secondary">BOC-P-13/F04 — طباعة A5 portrait</p></div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">الاسم الثلاثي</label><input value={name} onChange={e=>setName(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">الرقم الوظيفي</label><input value={jobNum} onChange={e=>setJobNum(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">العنوان الوظيفي</label><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">القسم / الشعبة</label><input value={dept} onChange={e=>setDept(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الإجازة</label><input type="date" value={leaveDate} onChange={e=>setLeaveDate(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">وقت المغادرة</label>
          <input type="time" value={departureTime} onChange={e=>setDepartureTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">وقت العودة</label>
          <input type="time" value={returnTime} onChange={e=>setReturnTime(e.target.value)} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary mb-1">عدد الساعات</label>
          <input value={hours} onChange={e=>setHours(e.target.value)} placeholder="محسوب تلقائياً" className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/>
        </div>
      </div>
      <div><label className="block text-xs font-bold text-secondary mb-1">السبب / الغرض</label><textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="مثال: مراجعة طبية، أمور شخصية..."/></div>
      <div>
        <label className="block text-xs font-bold text-secondary mb-2">توقيع الموظف (إلكتروني)</label>
        <SignaturePad onSave={setSigDataUrl} label="ارسم توقيعك ثم اضغط حفظ التوقيع"/>
        {sigDataUrl && <div className="mt-2 p-2 border border-color rounded-lg inline-block"><img src={sigDataUrl} alt="توقيع" className="max-h-14"/></div>}
      </div>
      <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-color">
        {driveLink && (
          <a href={driveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline self-center">
            <CheckCircle size={14}/> عرض في Drive
          </a>
        )}
        <button onClick={save} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
        {gDrive.isReady && (
          <button onClick={uploadToDrive} disabled={uploadPct >= 0} className="flex items-center gap-2 px-4 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-60">
            <Upload size={14}/> {uploadPct >= 0 ? `جاري الرفع ${uploadPct}%` : "رفع إلى Drive"}
          </button>
        )}
        <button onClick={exportToExcel} disabled={xlExporting} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"><Download size={14}/> {xlExporting ? "جاري التصدير..." : "تصدير إكسل"}</button>
        <button onClick={printForm} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm"><Printer size={14}/> طباعة الاستمارة</button>
      </div>
    </div>
  );
}

// ========== صفحة نماذج الإجازات ==========
function LeaveFormsPrintPage({ emp }) {
  const [tab, setTab] = useState("time");
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={()=>setTab("time")}   className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="time"  ?"bg-teal-600 text-white border-teal-600"  :"btn-secondary border-color"}`}>إجازة زمنية</button>
        <button onClick={()=>setTab("sick")}   className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="sick"  ?"bg-rose-500 text-white border-rose-500"  :"btn-secondary border-color"}`}>إجازة مرضية</button>
        <button onClick={()=>setTab("annual")} className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="annual"?"bg-blue-600 text-white border-blue-600":"btn-secondary border-color"}`}>إجازة اعتيادية</button>
        <button onClick={()=>setTab("ooc")}    className={`px-4 py-2 rounded-xl font-bold text-sm border transition-colors ${tab==="ooc"   ?"bg-violet-600 text-white border-violet-600":"btn-secondary border-color"}`}>إجازة خارج القطر</button>
      </div>
      {tab==="time"   && <TimeLeaveForm emp={emp}/>}
      {tab==="sick"   && <SickLeaveForm emp={emp}/>}
      {tab==="annual" && <AnnualLeaveForm emp={emp}/>}
      {tab==="ooc"    && <OutOfCountryLeaveForm emp={emp}/>}
    </div>
  );
}

// ========== ثوابت إدارة المشاريع ==========
const PROJ_STATUSES = ["قيد التنفيذ","مكتمل","متوقف","قيد التخطيط"];
const PROJ_PRIORITIES = ["عالي","متوسط","منخفض"];
const PHASE_STATUSES = ["مكتملة","قيد التنفيذ","لم تبدأ","متأخرة"];
const INSP_RESULTS = ["ناجح","فاشل","يحتاج متابعة"];
const DOC_TYPES = ["وثيقة هندسية","عقد","تقرير","خطة","رسم","أخرى"];
const PROJ_STATUS_COLORS = {"قيد التنفيذ":"bg-blue-100 text-blue-700","مكتمل":"bg-emerald-100 text-emerald-700","متوقف":"bg-red-100 text-red-700","قيد التخطيط":"bg-amber-100 text-amber-700"};
const PHASE_STATUS_COLORS = {"مكتملة":"bg-emerald-100 text-emerald-700","قيد التنفيذ":"bg-blue-100 text-blue-700","لم تبدأ":"bg-gray-100 text-gray-600","متأخرة":"bg-red-100 text-red-700"};
const INSP_RESULT_COLORS = {"ناجح":"bg-emerald-100 text-emerald-700","فاشل":"bg-red-100 text-red-700","يحتاج متابعة":"bg-amber-100 text-amber-700"};
const PRIORITY_COLORS = {"عالي":"bg-red-100 text-red-700","متوسط":"bg-amber-100 text-amber-700","منخفض":"bg-emerald-100 text-emerald-700"};

const INITIAL_PROJECTS = [
  {
    id:"P001", name:"توسعة خط الأنابيب الرئيسي",
    status:"قيد التنفيذ", priority:"عالي", progress:58,
    budget:850000, spent:493000,
    startDate:"2025-01-15", endDate:"2025-12-31",
    manager:"م. أحمد الربيعي",
    desc:"مشروع توسعة خط الأنابيب الرئيسي بطول 45 كيلومتر لزيادة طاقة النقل إلى 200,000 برميل يومياً",
    team:["م. أحمد الربيعي","م. سهاد المالكي","م. كريم جاسم","فني. علي حسن"],
    phases:[
      {id:"PH01",name:"المسح والتصميم",progress:100,status:"مكتملة",startDate:"2025-01-15",endDate:"2025-02-28",responsible:"م. سهاد المالكي"},
      {id:"PH02",name:"الحفر وتمهيد المسار",progress:100,status:"مكتملة",startDate:"2025-03-01",endDate:"2025-04-30",responsible:"م. كريم جاسم"},
      {id:"PH03",name:"تركيب الأنابيب",progress:75,status:"قيد التنفيذ",startDate:"2025-05-01",endDate:"2025-09-30",responsible:"م. أحمد الربيعي"},
      {id:"PH04",name:"الاختبار والتشغيل",progress:0,status:"لم تبدأ",startDate:"2025-10-01",endDate:"2025-11-30",responsible:"م. أحمد الربيعي"},
      {id:"PH05",name:"التسليم والتوثيق",progress:0,status:"لم تبدأ",startDate:"2025-12-01",endDate:"2025-12-31",responsible:"م. سهاد المالكي"},
    ],
    reports:[
      {id:"R001",date:"2025-06-10",author:"م. أحمد الربيعي",work:"تركيب 2.3 كم من الأنابيب قطر 18 بوصة في القسم C",issues:"لا توجد",progress:58},
      {id:"R002",date:"2025-06-11",author:"فني. علي حسن",work:"لحام الوصلات وإجراء اختبار الضغط للقسم C-12",issues:"تأخر تسليم المواد اللاصقة",progress:59},
    ],
    docs:[
      {id:"D001",name:"مخطط الأنابيب الهندسي P&ID",type:"وثيقة هندسية",date:"2025-01-20",size:"4.2 MB",uploadedBy:"م. سهاد المالكي"},
      {id:"D002",name:"عقد مقاولة الحفر",type:"عقد",date:"2025-02-10",size:"1.1 MB",uploadedBy:"إدارة العقود"},
    ],
    inspections:[
      {id:"I001",date:"2025-04-15",inspector:"م. كريم جاسم",section:"قسم A — المرحلة 2",result:"ناجح",notes:"اجتاز اختبار الضغط بنجاح"},
      {id:"I002",date:"2025-05-20",inspector:"م. أحمد الربيعي",section:"قسم B — الوصلات",result:"يحتاج متابعة",notes:"تسرب طفيف في الوصلة B-07، تم الإصلاح"},
    ],
  },
  {
    id:"P002", name:"تحديث نظام السيطرة SCADA",
    status:"قيد التنفيذ", priority:"عالي", progress:42,
    budget:320000, spent:134400,
    startDate:"2025-03-01", endDate:"2025-10-31",
    manager:"م. إيهاب الشاوي",
    desc:"تحديث شامل لنظام السيطرة والرقابة SCADA في محطة الضخ الرئيسية وإضافة نقاط رقابة جديدة",
    team:["م. إيهاب الشاوي","م. زينب العامري","تقني. حسين البصري","مبرمج. رامي الجبوري"],
    phases:[
      {id:"PH01",name:"تحليل النظام الحالي",progress:100,status:"مكتملة",startDate:"2025-03-01",endDate:"2025-03-31",responsible:"م. زينب العامري"},
      {id:"PH02",name:"تصميم البنية التحتية",progress:100,status:"مكتملة",startDate:"2025-04-01",endDate:"2025-04-30",responsible:"م. إيهاب الشاوي"},
      {id:"PH03",name:"تركيب الأجهزة",progress:60,status:"قيد التنفيذ",startDate:"2025-05-01",endDate:"2025-07-31",responsible:"تقني. حسين البصري"},
      {id:"PH04",name:"برمجة وإعداد النظام",progress:20,status:"قيد التنفيذ",startDate:"2025-06-01",endDate:"2025-08-31",responsible:"مبرمج. رامي الجبوري"},
      {id:"PH05",name:"الاختبار والتدريب",progress:0,status:"لم تبدأ",startDate:"2025-09-01",endDate:"2025-10-31",responsible:"م. إيهاب الشاوي"},
    ],
    reports:[
      {id:"R001",date:"2025-06-09",author:"تقني. حسين البصري",work:"تركيب وحدات RTU في مواقع 5 و6 و7",issues:"لا توجد",progress:42},
    ],
    docs:[
      {id:"D001",name:"مواصفات SCADA الجديدة",type:"وثيقة هندسية",date:"2025-03-15",size:"2.8 MB",uploadedBy:"م. إيهاب الشاوي"},
    ],
    inspections:[
      {id:"I001",date:"2025-05-10",inspector:"م. إيهاب الشاوي",section:"غرفة التحكم الرئيسية",result:"ناجح",notes:"جميع الأسلاك حسب المواصفات"},
    ],
  },
  {
    id:"P003", name:"صيانة وتأهيل الخزانات الكبرى",
    status:"مكتمل", priority:"متوسط", progress:100,
    budget:560000, spent:547000,
    startDate:"2024-09-01", endDate:"2025-03-31",
    manager:"م. سلوى الكريمي",
    desc:"صيانة شاملة وتأهيل لثمانية خزانات تخزين كبرى سعة 500,000 برميل لكل منها",
    team:["م. سلوى الكريمي","م. عمر العبيدي","فني. ياسر محمود","فني. هيثم رضا"],
    phases:[
      {id:"PH01",name:"التفريغ والتنظيف",progress:100,status:"مكتملة",startDate:"2024-09-01",endDate:"2024-10-15",responsible:"فني. ياسر محمود"},
      {id:"PH02",name:"الفحص والتقييم",progress:100,status:"مكتملة",startDate:"2024-10-16",endDate:"2024-11-30",responsible:"م. عمر العبيدي"},
      {id:"PH03",name:"أعمال الصيانة والإصلاح",progress:100,status:"مكتملة",startDate:"2024-12-01",endDate:"2025-02-28",responsible:"م. سلوى الكريمي"},
      {id:"PH04",name:"الطلاء والحماية من التآكل",progress:100,status:"مكتملة",startDate:"2025-01-15",endDate:"2025-03-15",responsible:"فني. هيثم رضا"},
      {id:"PH05",name:"الاختبار والإعادة للخدمة",progress:100,status:"مكتملة",startDate:"2025-03-16",endDate:"2025-03-31",responsible:"م. سلوى الكريمي"},
    ],
    reports:[
      {id:"R001",date:"2025-03-30",author:"م. سلوى الكريمي",work:"إعادة الخزانات 1-4 للخدمة بنجاح",issues:"لا توجد",progress:100},
      {id:"R002",date:"2025-03-31",author:"م. عمر العبيدي",work:"إعادة الخزانات 5-8 للخدمة وإغلاق المشروع",issues:"لا توجد",progress:100},
    ],
    docs:[
      {id:"D001",name:"تقرير الفحص الشامل النهائي",type:"تقرير",date:"2025-04-01",size:"6.5 MB",uploadedBy:"م. سلوى الكريمي"},
      {id:"D002",name:"شهادة إتمام المشروع",type:"وثيقة هندسية",date:"2025-04-05",size:"0.8 MB",uploadedBy:"إدارة المشاريع"},
    ],
    inspections:[
      {id:"I001",date:"2025-03-25",inspector:"م. سلوى الكريمي",section:"الخزانات 1-8",result:"ناجح",notes:"جميع الخزانات اجتازت اختبار الإحكام"},
      {id:"I002",date:"2025-03-31",inspector:"م. عمر العبيدي",section:"منظومة الصمامات",result:"ناجح",notes:"الصمامات تعمل ضمن المواصفات"},
    ],
  },
];

// ========== مكوّن حلقة التقدم ==========
function ProgressRing({ pct, size=90, stroke=9, color="#3b82f6" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 0.5s ease"}}/>
    </svg>
  );
}

// ========== صفحة إدارة المشاريع ==========
function ProjectManagementPage({ emp }) {
  const [projects, setProjects] = useState(() => storage.get("pm_projects", INITIAL_PROJECTS));
  const [selId, setSelId] = useState(() => storage.get("pm_projects", INITIAL_PROJECTS)[0]?.id || null);
  const [tab, setTab] = useState("dashboard");
  const [showAddProj, setShowAddProj] = useState(false);
  const addToast = useToast();
  const confirm = useConfirm();

  // أي تعديل على المشاريع يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const saveAll = (updated) => {
    setProjects(updated);
    storage.set("pm_projects", updated);
    FirebaseAPI.saveProjects(updated);
  };
  useEffect(() => {
    FirebaseAPI.loadProjects().then(list => {
      if (list) {
        setProjects(list);
        storage.set("pm_projects", list);
        setSelId(prev => list.some(p => p.id === prev) ? prev : (list[0]?.id || null));
      }
    });
  }, []);

  const proj = projects.find(p => p.id === selId);

  const updateProj = (id, changes) => saveAll(projects.map(p => p.id === id ? { ...p, ...changes } : p));

  const deleteProj = async (id) => {
    if (await confirm("هل تريد حذف هذا المشروع نهائياً؟", { title: "حذف المشروع", ok: "حذف" })) {
      const updated = projects.filter(p => p.id !== id);
      saveAll(updated);
      setSelId(updated[0]?.id || null);
      addToast("تم حذف المشروع", "info");
    }
  };

  // ── CRUD Phases ──
  const addPhase = (pid, ph) => updateProj(pid, { phases: [...(proj.phases||[]), { ...ph, id: `PH${Date.now()}` }] });
  const editPhase = (pid, phId, changes) => updateProj(pid, { phases: proj.phases.map(ph => ph.id === phId ? { ...ph, ...changes } : ph) });
  const delPhase = (pid, phId) => updateProj(pid, { phases: proj.phases.filter(ph => ph.id !== phId) });

  // ── CRUD Reports ──
  const addReport = (pid, r) => updateProj(pid, { reports: [...(proj.reports||[]), { ...r, id: `R${Date.now()}` }] });
  const delReport = (pid, rId) => updateProj(pid, { reports: proj.reports.filter(r => r.id !== rId) });

  // ── CRUD Docs ──
  const addDoc = (pid, d) => updateProj(pid, { docs: [...(proj.docs||[]), { ...d, id: `D${Date.now()}` }] });
  const delDoc = (pid, dId) => updateProj(pid, { docs: proj.docs.filter(d => d.id !== dId) });

  // ── CRUD Inspections ──
  const addInsp = (pid, insp) => updateProj(pid, { inspections: [...(proj.inspections||[]), { ...insp, id: `I${Date.now()}` }] });
  const delInsp = (pid, inspId) => updateProj(pid, { inspections: proj.inspections.filter(i => i.id !== inspId) });

  const tabs = [
    { id:"dashboard", label:"لوحة التحكم", icon:<Activity size={15}/> },
    { id:"phases",    label:"تقدم العمل",   icon:<Layers size={15}/> },
    { id:"reports",   label:"التقارير اليومية", icon:<FileText size={15}/> },
    { id:"docs",      label:"الوثائق",       icon:<FolderOpen size={15}/> },
    { id:"inspections",label:"الفحوصات",    icon:<FileCheck size={15}/> },
  ];

  const daysLeft = proj ? Math.ceil((new Date(proj.endDate) - new Date()) / 86400000) : 0;
  const budgetPct = proj ? Math.round((proj.spent / proj.budget) * 100) : 0;

  return (
    <div className="flex gap-0" dir="rtl" style={{minHeight:"calc(100vh - 140px)"}}>
      {/* ── Sidebar: project list ── */}
      <aside className="w-64 flex-shrink-0 border-l border-color overflow-y-auto pb-6" style={{background:"var(--sidebar-bg,inherit)"}}>
        <div className="p-3 border-b border-color flex items-center justify-between">
          <span className="font-bold text-sm flex items-center gap-1.5"><Briefcase size={15}/> المشاريع</span>
          <button onClick={()=>setShowAddProj(true)} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors" title="مشروع جديد"><Plus size={14}/></button>
        </div>
        <div className="divide-y divide-color">
          {projects.map(p => (
            <button key={p.id} onClick={()=>{ setSelId(p.id); setTab("dashboard"); }}
              className={`w-full text-right px-3 py-3 transition-colors ${selId===p.id?"bg-blue-600 text-white":"hover:bg-hover text-primary"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold truncate max-w-[130px]">{p.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${selId===p.id?"bg-white/20 text-white":PROJ_STATUS_COLORS[p.status]}`}>{p.status}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${selId===p.id?"bg-white/30":"bg-gray-200"}`}>
                  <div className={`h-full rounded-full transition-all ${selId===p.id?"bg-white":"bg-blue-500"}`} style={{width:`${p.progress}%`}}/>
                </div>
                <span className="text-[10px] font-bold shrink-0">{p.progress}%</span>
              </div>
              <p className={`text-[10px] mt-0.5 ${selId===p.id?"text-white/70":"text-secondary"}`}>{p.id} · {p.manager?.split(" ").slice(-1)[0]}</p>
            </button>
          ))}
        </div>
        {projects.length === 0 && <p className="text-xs text-secondary text-center py-8">لا توجد مشاريع</p>}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-auto p-5">
        {!proj ? (
          <div className="text-center py-20 text-secondary">
            <Briefcase size={48} className="mx-auto mb-3 opacity-30"/>
            <p className="font-bold">اختر مشروعاً أو أضف مشروعاً جديداً</p>
          </div>
        ) : (
          <>
            {/* Project header */}
            <div className="card rounded-2xl border border-color p-4 mb-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-lg font-bold">{proj.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${PROJ_STATUS_COLORS[proj.status]}`}>{proj.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${PRIORITY_COLORS[proj.priority]}`}>{proj.priority} الأولوية</span>
                  </div>
                  <p className="text-sm text-secondary mb-2">{proj.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-secondary flex-wrap">
                    <span className="flex items-center gap-1"><Briefcase size={12}/> {proj.manager}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {proj.startDate} — {proj.endDate}</span>
                    <span className="flex items-center gap-1"><Users size={12}/> {proj.team?.length || 0} أعضاء</span>
                    <span className="flex items-center gap-1"><Flag size={12}/> {proj.id}</span>
                  </div>
                </div>
                <button onClick={()=>deleteProj(proj.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="حذف المشروع"><Trash2 size={16}/></button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {tabs.map(t => (
                <button key={t.id} onClick={()=>setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${tab===t.id?"bg-blue-600 text-white":"btn-secondary border border-color"}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* ═══ لوحة التحكم ═══ */}
            {tab === "dashboard" && (
              <div className="space-y-4">
                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label:"نسبة الإنجاز", value:`${proj.progress}%`, icon:<Target size={20}/>, color:"from-blue-500 to-blue-600",
                      extra: <ProgressRing pct={proj.progress} size={48} stroke={6} color="#fff"/> },
                    { label:"الميزانية المنصرفة", value:`${budgetPct}%`, sub:`${proj.spent?.toLocaleString()} / ${proj.budget?.toLocaleString()} $`,
                      icon:<DollarSign size={20}/>, color:"from-emerald-500 to-emerald-600" },
                    { label:"الأيام المتبقية", value:daysLeft > 0 ? daysLeft : "منتهي", sub:daysLeft > 0 ? `ينتهي ${proj.endDate}` : "انتهى المشروع",
                      icon:<Clock size={20}/>, color:daysLeft<30?"from-red-500 to-red-600":daysLeft<90?"from-amber-500 to-amber-600":"from-teal-500 to-teal-600" },
                    { label:"أعضاء الفريق", value:proj.team?.length || 0, sub:"عضو في الفريق",
                      icon:<Users size={20}/>, color:"from-violet-500 to-violet-600" },
                  ].map((k,i) => (
                    <div key={i} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white`}>
                      <div className="flex items-center justify-between mb-2">
                        {k.extra || k.icon}
                        <p className="text-2xl font-bold">{k.value}</p>
                      </div>
                      <p className="text-sm font-bold">{k.label}</p>
                      {k.sub && <p className="text-[11px] text-white/75 mt-0.5">{k.sub}</p>}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Overall progress ring */}
                  <div className="card rounded-2xl border border-color p-5">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><Activity size={15}/> نظرة عامة على الإنجاز</h3>
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <ProgressRing pct={proj.progress} size={100} stroke={10} color={proj.progress===100?"#10b981":"#3b82f6"}/>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{proj.progress}%</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {(proj.phases || []).map(ph => (
                          <div key={ph.id}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="truncate max-w-[140px]">{ph.name}</span>
                              <span className="font-bold">{ph.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${ph.status==="مكتملة"?"bg-emerald-500":ph.status==="قيد التنفيذ"?"bg-blue-500":ph.status==="متأخرة"?"bg-red-500":"bg-gray-300"}`}
                                style={{width:`${ph.progress}%`}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Team members */}
                  <div className="card rounded-2xl border border-color p-5">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><Users size={15}/> فريق العمل</h3>
                    <div className="space-y-2">
                      {(proj.team || []).map((member, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5 border-b border-color last:border-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500"][i%5]}`}>
                            {member.split(" ").slice(-1)[0][0]}
                          </div>
                          <span className="text-sm flex-1">{member}</span>
                          {i === 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">مدير</span>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <ProjTeamAdd proj={proj} updateProj={updateProj}/>
                    </div>
                  </div>
                </div>

                {/* Budget breakdown */}
                <div className="card rounded-2xl border border-color p-5">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><DollarSign size={15}/> الميزانية والإنفاق</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label:"الميزانية الإجمالية", value:`${proj.budget?.toLocaleString()} $`, color:"text-primary" },
                      { label:"المصروف حتى الآن", value:`${proj.spent?.toLocaleString()} $`, color:"text-rose-600" },
                      { label:"المتبقي", value:`${(proj.budget-proj.spent)?.toLocaleString()} $`, color:"text-emerald-600" },
                    ].map((b,i) => (
                      <div key={i} className="text-center p-3 bg-hover rounded-xl">
                        <p className={`text-lg font-bold ${b.color}`}>{b.value}</p>
                        <p className="text-xs text-secondary mt-0.5">{b.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${budgetPct>90?"bg-red-500":budgetPct>70?"bg-amber-500":"bg-emerald-500"}`}
                      style={{width:`${Math.min(100,budgetPct)}%`}}/>
                  </div>
                  <div className="flex justify-between text-xs text-secondary mt-1">
                    <span>0%</span><span className="font-bold">{budgetPct}% مصروف</span><span>100%</span>
                  </div>
                </div>

                {/* Edit project info */}
                <ProjInfoEditor proj={proj} updateProj={updateProj}/>
              </div>
            )}

            {/* ═══ تقدم العمل ═══ */}
            {tab === "phases" && (
              <PhasesTab proj={proj} addPhase={addPhase} editPhase={editPhase} delPhase={delPhase}/>
            )}

            {/* ═══ التقارير اليومية ═══ */}
            {tab === "reports" && (
              <ReportsTab proj={proj} addReport={addReport} delReport={delReport} emp={emp}/>
            )}

            {/* ═══ الوثائق ═══ */}
            {tab === "docs" && (
              <DocsTab proj={proj} addDoc={addDoc} delDoc={delDoc} emp={emp}/>
            )}

            {/* ═══ الفحوصات ═══ */}
            {tab === "inspections" && (
              <InspectionsTab proj={proj} addInsp={addInsp} delInsp={delInsp} emp={emp}/>
            )}
          </>
        )}
      </div>

      {/* ── Add Project Modal ── */}
      {showAddProj && (
        <AddProjectModal
          onClose={()=>setShowAddProj(false)}
          onAdd={(p)=>{ const updated=[...projects,p]; saveAll(updated); setSelId(p.id); setTab("dashboard"); setShowAddProj(false); addToast("تم إضافة المشروع","success"); }}
          existingIds={projects.map(p=>p.id)}
        />
      )}
    </div>
  );
}

// ── مكوّن تعديل معلومات المشروع ──
function ProjInfoEditor({ proj, updateProj }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name:proj.name, status:proj.status, priority:proj.priority, manager:proj.manager, budget:proj.budget, spent:proj.spent, progress:proj.progress, startDate:proj.startDate, endDate:proj.endDate, desc:proj.desc });
  const addToast = useToast();
  if (!open) return (
    <button onClick={()=>setOpen(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
      <Edit3 size={14}/> تعديل معلومات المشروع
    </button>
  );
  const save = () => { updateProj(proj.id, form); setOpen(false); addToast("تم حفظ التعديلات","success"); };
  return (
    <div className="card rounded-2xl border border-color p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-1.5"><Edit3 size={15}/> تعديل معلومات المشروع</h3>
        <button onClick={()=>setOpen(false)} className="text-secondary hover:text-red-500"><X size={16}/></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">اسم المشروع</label>
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">مدير المشروع</label>
          <input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الحالة</label>
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
            {PROJ_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الأولوية</label>
          <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
            {PROJ_PRIORITIES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">نسبة الإنجاز %</label>
          <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الميزانية ($)</label>
          <input type="number" value={form.budget} onChange={e=>setForm({...form,budget:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">المصروف ($)</label>
          <input type="number" value={form.spent} onChange={e=>setForm({...form,spent:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ البداية</label>
          <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الانتهاء</label>
          <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">وصف المشروع</label>
          <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none"/></div>
      </div>
      <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
        <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
      </div>
    </div>
  );
}

// ── مكوّن إضافة عضو للفريق ──
function ProjTeamAdd({ proj, updateProj }) {
  const [val, setVal] = useState("");
  const addToast = useToast();
  const add = () => {
    if (!val.trim()) return;
    updateProj(proj.id, { team: [...(proj.team||[]), val.trim()] });
    setVal(""); addToast("تمت إضافة العضو","success");
  };
  return (
    <div className="flex gap-2">
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
        placeholder="اسم العضو الجديد" className="input flex-1 rounded-lg px-3 py-1.5 text-sm"/>
      <button onClick={add} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus size={14}/></button>
    </div>
  );
}

// ── تبويب تقدم العمل (المراحل) ──
function PhasesTab({ proj, addPhase, editPhase, delPhase }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", status:"لم تبدأ", progress:0, startDate:"", endDate:"", responsible:"" });
  const addToast = useToast();
  const confirm = useConfirm();

  const resetForm = () => setForm({ name:"", status:"لم تبدأ", progress:0, startDate:"", endDate:"", responsible:"" });

  const submitAdd = () => {
    if (!form.name.trim()) return;
    addPhase(proj.id, form); resetForm(); setShowAdd(false); addToast("تمت إضافة المرحلة","success");
  };
  const submitEdit = () => {
    if (!form.name.trim()) return;
    editPhase(proj.id, editId, form); setEditId(null); addToast("تم حفظ التعديل","success");
  };
  const startEdit = (ph) => { setEditId(ph.id); setForm({ name:ph.name, status:ph.status, progress:ph.progress, startDate:ph.startDate, endDate:ph.endDate, responsible:ph.responsible }); setShowAdd(false); };
  const doDelete = async (phId) => {
    if (await confirm("حذف هذه المرحلة؟", { title:"حذف المرحلة", ok:"حذف" })) { delPhase(proj.id, phId); addToast("تم الحذف","info"); }
  };

  const FormRow = ({ label, children }) => (
    <div><label className="block text-xs font-bold text-secondary mb-1">{label}</label>{children}</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><Layers size={16}/> مراحل المشروع</h3>
        <button onClick={()=>{ setShowAdd(!showAdd); setEditId(null); resetForm(); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> مرحلة جديدة
        </button>
      </div>

      {(showAdd || editId) && (
        <div className="card rounded-2xl border border-color p-4">
          <h4 className="font-bold text-sm mb-3">{editId ? "تعديل المرحلة" : "مرحلة جديدة"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow label="اسم المرحلة">
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: تركيب الأنابيب"/>
            </FormRow>
            <FormRow label="المسؤول">
              <input value={form.responsible} onChange={e=>setForm({...form,responsible:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم المسؤول"/>
            </FormRow>
            <FormRow label="الحالة">
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {PHASE_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </FormRow>
            <FormRow label="نسبة الإنجاز %">
              <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
            </FormRow>
            <FormRow label="تاريخ البدء">
              <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
            </FormRow>
            <FormRow label="تاريخ الانتهاء">
              <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
            </FormRow>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={()=>{ setShowAdd(false); setEditId(null); }} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={editId ? submitEdit : submitAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> {editId?"حفظ":"إضافة"}</button>
          </div>
        </div>
      )}

      {(proj.phases||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><Layers size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد مراحل بعد</p></div>
      )}

      <div className="space-y-3">
        {(proj.phases||[]).map(ph => (
          <div key={ph.id} className={`card rounded-xl border p-4 transition-all ${editId===ph.id?"border-blue-400":"border-color"}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{ph.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PHASE_STATUS_COLORS[ph.status]}`}>{ph.status}</span>
                </div>
                <div className="text-xs text-secondary mt-0.5">{ph.responsible} · {ph.startDate} — {ph.endDate}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>startEdit(ph)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit3 size={14}/></button>
                <button onClick={()=>doDelete(ph.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${ph.status==="مكتملة"?"bg-emerald-500":ph.status==="قيد التنفيذ"?"bg-blue-500":ph.status==="متأخرة"?"bg-red-500":"bg-gray-300"}`}
                  style={{width:`${ph.progress}%`}}/>
              </div>
              <span className="text-sm font-bold w-10 text-left">{ph.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── تبويب التقارير اليومية ──
function ReportsTab({ proj, addReport, delReport, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], author: emp.name, work:"", issues:"لا توجد", progress: proj.progress });
  const addToast = useToast();
  const confirm = useConfirm();

  const submit = () => {
    if (!form.work.trim()) return;
    addReport(proj.id, form); setShowAdd(false); setForm({ date:new Date().toISOString().split("T")[0], author:emp.name, work:"", issues:"لا توجد", progress:proj.progress });
    addToast("تم إضافة التقرير","success");
  };
  const doDelete = async (rId) => {
    if (await confirm("حذف هذا التقرير؟", { title:"حذف التقرير", ok:"حذف" })) { delReport(proj.id, rId); addToast("تم الحذف","info"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FileText size={16}/> التقارير اليومية</h3>
        <button onClick={()=>setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> تقرير جديد
        </button>
      </div>

      {showAdd && (
        <div className="card rounded-2xl border border-color p-4">
          <h4 className="font-bold text-sm mb-3">تقرير يومي جديد</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">التاريخ</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">اسم المُعِد</label>
              <input value={form.author} onChange={e=>setForm({...form,author:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">الأعمال المنجزة اليوم</label>
              <textarea value={form.work} onChange={e=>setForm({...form,work:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="صف الأعمال المنجزة اليوم..."/></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">الملاحظات والعقبات</label>
              <textarea value={form.issues} onChange={e=>setForm({...form,issues:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="اكتب لا توجد إذا لم تكن هناك عقبات"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نسبة الإنجاز الكلية % (تحديث)</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ التقرير</button>
          </div>
        </div>
      )}

      {(proj.reports||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FileText size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد تقارير يومية بعد</p></div>
      )}

      <div className="space-y-3">
        {[...(proj.reports||[])].reverse().map(r => (
          <div key={r.id} className="card rounded-xl border border-color p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{r.date}</span>
                  <span className="text-xs text-secondary">· {r.author}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">إنجاز: {r.progress}%</span>
                </div>
              </div>
              <button onClick={()=>doDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
            </div>
            <div className="space-y-1.5 text-sm">
              <div><span className="font-bold text-secondary text-xs">الأعمال المنجزة: </span><span>{r.work}</span></div>
              <div><span className="font-bold text-secondary text-xs">الملاحظات والعقبات: </span><span className={r.issues==="لا توجد"?"text-emerald-600 text-xs":"text-amber-600 text-xs"}>{r.issues}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== نظام تخزين الملفات المحلي المتقدم ==========
// استخدام IndexedDB للملفات الكبيرة (أكثر من 5MB)
const FileStorage = {
  dbName: "BOC_ProjectFiles",
  dbVersion: 1,
  db: null,

  initDB: () => {
    return new Promise((resolve, reject) => {
      if (FileStorage.db) { resolve(FileStorage.db); return; }
      const request = indexedDB.open(FileStorage.dbName, FileStorage.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { FileStorage.db = request.result; resolve(FileStorage.db); };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("files")) {
          const store = db.createObjectStore("files", { keyPath: "id" });
          store.createIndex("projectId", "projectId", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  },

  saveFile: async (projectId, docId, file, metadata) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const transaction = FileStorage.db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");
        const fileRecord = {
          id: docId, projectId, name: metadata.name, type: metadata.type,
          size: file.size, timestamp: Date.now(), uploadedBy: metadata.uploadedBy,
          date: metadata.date, data: e.target.result,
        };
        const request = store.put(fileRecord);
        request.onsuccess = () => resolve(fileRecord);
        request.onerror = () => reject(request.error);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  getFile: async (fileId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readonly");
      const store = transaction.objectStore("files");
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  deleteFile: async (fileId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readwrite");
      const store = transaction.objectStore("files");
      const request = store.delete(fileId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  getProjectFiles: async (projectId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readonly");
      const store = transaction.objectStore("files");
      const index = store.index("projectId");
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  getStorageUsage: async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
      };
    }
    return null;
  }
};

// رفع ملف إلى Firebase Storage عبر REST API (بدون SDK)
const uploadToFirebaseStorage = (file, path, onProgress) => new Promise((resolve, reject) => {
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o?uploadType=media&name=${encodeURIComponent(path)}`;
  const xhr = new XMLHttpRequest();
  xhr.upload.addEventListener("progress", e => {
    if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
  });
  xhr.onload = () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      const token = data.downloadTokens;
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o/${encodeURIComponent(data.name)}?alt=media&token=${token}`;
      resolve({ url: downloadUrl, path: data.name, size: data.size });
    } else {
      reject(new Error(`فشل الرفع (${xhr.status}): ${xhr.responseText}`));
    }
  };
  xhr.onerror = () => reject(new Error("خطأ في الشبكة أثناء الرفع"));
  xhr.open("POST", url);
  xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
  xhr.send(file);
});

// حد افتراضي لخطة Firebase المجانية (Spark) — 5GB تخزين. عدّله إذا كانت الخطة Blaze (غير محدود عملياً).
const FIREBASE_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
const fmtStorageSize = (b) => b >= 1e9 ? (b/1e9).toFixed(2)+" GB" : b >= 1e6 ? (b/1e6).toFixed(1)+" MB" : b >= 1e3 ? (b/1e3).toFixed(0)+" KB" : b+" B";

// يحسب الاستخدام الفعلي لمخزن Firebase Storage عبر سرد كل الملفات وجمع أحجامها (REST بدون حاجة لصلاحيات إدارية)
const getFirebaseStorageUsage = async () => {
  try {
    let usage = 0, pageToken;
    do {
      const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o?maxResults=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      (data.items || []).forEach(it => { usage += Number(it.size || 0); });
      pageToken = data.nextPageToken;
    } while (pageToken);
    const limit = FIREBASE_STORAGE_LIMIT_BYTES;
    const pct = Math.round((usage / limit) * 100);
    return { usage, limit, pct, usageStr: fmtStorageSize(usage), limitStr: fmtStorageSize(limit), freeStr: fmtStorageSize(Math.max(limit - usage, 0)) };
  } catch { return null; }
};

// ── تبويب الوثائق ──
function DocsTab({ proj, addDoc, delDoc, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "وثيقة هندسية", date: new Date().toISOString().split("T")[0], size: "", uploadedBy: emp.name });
  const [fileData, setFileData] = useState(null);
  const [fileMime, setFileMime] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [localFiles, setLocalFiles] = useState([]);
  const [storageUsage, setStorageUsage] = useState(null);
  const [fbUsage, setFbUsage] = useState(null);
  const fileRef = useRef(null);
  const addToast = useToast();
  const confirm = useConfirm();
  const gDrive = useGDrive();

  useEffect(() => { loadLocalFiles(); checkStorage(); }, [proj.id]);
  useEffect(() => { getFirebaseStorageUsage().then(setFbUsage); }, []);

  const loadLocalFiles = async () => {
    try { const files = await FileStorage.getProjectFiles(proj.id); setLocalFiles(files); }
    catch (err) { console.error("Error loading local files:", err); }
  };

  const checkStorage = async () => { setStorageUsage(await FileStorage.getStorageUsage()); };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileMime(file.type);
    setForm(prev => ({ ...prev, name: prev.name || file.name, size: (file.size / 1024).toFixed(0) + " KB" }));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFileData(ev.target.result);
      reader.readAsDataURL(file);
    } else { setFileData(null); }
  };

  const resetForm = () => {
    setShowAdd(false);
    setForm({ name: "", type: "وثيقة هندسية", date: new Date().toISOString().split("T")[0], size: "", uploadedBy: emp.name });
    setFileData(null); setFileMime(""); setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadViaFirebase = async () => {
    const path = `projects/${proj.id}/${Date.now()}_${selectedFile.name}`;
    const result = await uploadToFirebaseStorage(selectedFile, path, pct => setUploadPct(pct));
    addDoc(proj.id, {
      ...form, fileData: null, fileMime: fileMime || null,
      fileUrl: result.url, firebasePath: result.path,
      size: form.size || (Number(result.size) / 1024).toFixed(0) + " KB",
      storageType: "firebase"
    });
    addToast("تم رفع الملف إلى Firebase Storage ✅", "success");
    getFirebaseStorageUsage().then(setFbUsage);
  };

  const uploadViaDrive = async () => {
    const result = await gDrive.uploadFile(selectedFile, pct => setUploadPct(pct));
    addDoc(proj.id, {
      ...form, fileData: null, fileMime: fileMime || null,
      driveFileId: result.id, driveViewLink: result.webViewLink, driveDownloadLink: result.webContentLink,
      size: form.size || (Number(result.size) / 1024).toFixed(0) + " KB",
      storageType: "google_drive"
    });
    addToast("تم رفع الملف إلى Google Drive ✅", "success");
  };

  const submit = async () => {
    if (!form.name.trim()) { addToast("يرجى إدخال اسم الوثيقة", "warning"); return; }
    setUploading(true); setUploadPct(0);
    try {
      if (selectedFile) {
        // احتياطي تلقائي: إذا اقترب Firebase من الامتلاء وكان Google Drive متاحاً، يُستخدم Drive مباشرة
        const nearFull = fbUsage && fbUsage.pct >= GDRIVE_WARN_PCT;
        if (nearFull && gDrive.isReady) {
          addToast(`⚠️ مساحة Firebase اقتربت من الامتلاء (${fbUsage.pct}%) — يتم الرفع إلى Google Drive`, "warning");
          await uploadViaDrive();
        } else {
          try {
            await uploadViaFirebase();
          } catch (fbErr) {
            if (gDrive.isReady) {
              addToast("تعذّر الرفع إلى Firebase، تتم المحاولة عبر Google Drive كاحتياطي...", "warning");
              await uploadViaDrive();
            } else {
              throw fbErr;
            }
          }
        }
      } else {
        addDoc(proj.id, { ...form, fileData: null, storageType: "metadata" });
        addToast("تمت إضافة الوثيقة", "success");
      }
      resetForm();
    } catch (e) { addToast(`فشل الرفع: ${e.message}`, "error"); }
    finally { setUploading(false); setUploadPct(0); }
  };

  const doDelete = async (doc) => {
    if (!await confirm("حذف هذه الوثيقة؟", { title: "حذف الوثيقة", ok: "حذف" })) return;
    if (doc.localFileId) { await FileStorage.deleteFile(doc.localFileId); await loadLocalFiles(); await checkStorage(); }
    if (doc.driveFileId && gDrive.isReady) await gDrive.deleteFile(doc.driveFileId);
    if (doc.firebasePath) {
      try {
        await fetch(`https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o/${encodeURIComponent(doc.firebasePath)}`, { method: "DELETE" });
      } catch {}
    }
    delDoc(proj.id, doc.id);
    addToast("تم الحذف", "info");
  };

  const downloadFile = (doc) => {
    if (doc.fileUrl) { window.open(doc.fileUrl, "_blank"); return; }
    if (doc.driveDownloadLink) { window.open(doc.driveDownloadLink, "_blank"); return; }
    if (doc.fileData) {
      const a = document.createElement("a");
      a.href = doc.fileData; a.download = doc.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    addToast("لا يوجد ملف للتحميل", "warning");
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const docIcons = { "وثيقة هندسية": "🗂️", "عقد": "📋", "تقرير": "📊", "خطة": "📅", "رسم": "📐", "أخرى": "📄" };
  const isImage = (mime) => mime && mime.startsWith("image/");

  const allDocs = useMemo(() => {
    const projectDocs = proj.docs || [];
    const localDocs = localFiles.map(f => ({
      id: f.id, name: f.name, type: f.type || "وثيقة",
      date: new Date(f.timestamp).toISOString().split("T")[0],
      size: formatBytes(f.size), uploadedBy: f.uploadedBy,
      fileData: f.data, fileMime: f.type, localFileId: f.id, storageType: "local"
    }));
    const localIds = new Set(localDocs.map(d => d.localFileId));
    return [...projectDocs.filter(d => !d.localFileId || !localIds.has(d.localFileId)), ...localDocs];
  }, [proj.docs, localFiles]);

  return (
    <div className="space-y-4">
      {storageUsage && (
        <div className={`rounded-xl p-3 flex items-center justify-between text-xs border ${storageUsage.percent > 80 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-2">
            <span>💾</span>
            <span className="font-medium">التخزين المحلي:</span>
            <span>{formatBytes(storageUsage.usage)} / {formatBytes(storageUsage.quota)}</span>
          </div>
          <div className="flex-1 max-w-[200px] mx-3">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${storageUsage.percent > 80 ? "bg-red-500" : storageUsage.percent > 60 ? "bg-amber-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(100, storageUsage.percent)}%` }} />
            </div>
          </div>
          <span className={storageUsage.percent > 80 ? "text-red-600 font-bold" : "text-gray-600"}>{storageUsage.percent}% مستخدم</span>
        </div>
      )}

      {fbUsage && fbUsage.pct >= GDRIVE_WARN_PCT && (
        <div className={`rounded-xl p-3 flex items-center justify-between text-xs border ${fbUsage.pct >= GDRIVE_CRIT_PCT ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span className="font-medium">Firebase Storage:</span>
            <span>{fbUsage.usageStr} / {fbUsage.limitStr}</span>
          </div>
          <span className={fbUsage.pct >= GDRIVE_CRIT_PCT ? "text-red-600 font-bold" : "text-amber-600 font-medium"}>
            {fbUsage.pct}% — {gDrive.isReady ? "الرفع التالي سيتم عبر Google Drive احتياطياً" : "متاح: " + fbUsage.freeStr}
          </span>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold">{previewDoc.name}</span>
              <button onClick={() => setPreviewDoc(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            {isImage(previewDoc.fileMime) && (previewDoc.fileData || previewDoc.fileUrl)
              ? <img src={previewDoc.fileData || previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full rounded-xl" />
              : <div className="text-center py-8 text-secondary">
                  <p className="text-5xl mb-3">{previewDoc.storageType === "firebase" ? "🔥" : previewDoc.driveFileId ? "☁️" : "📄"}</p>
                  <p>{previewDoc.name}</p>
                </div>
            }
            <button onClick={() => downloadFile(previewDoc)} className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Download size={14} /> {previewDoc.driveFileId ? "فتح في Google Drive" : previewDoc.fileUrl ? "فتح الملف" : "تحميل الملف"}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FolderOpen size={16} /> وثائق المشروع ({allDocs.length})</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            🔥 Firebase Storage
          </span>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            <Plus size={14} /> إضافة وثيقة / صورة
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card rounded-2xl border border-color p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">إضافة وثيقة أو صورة</h4>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🔥 Firebase Storage</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">اسم الوثيقة</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم الملف أو الوثيقة" /></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نوع الوثيقة</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm">
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الرفع</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">رُفع بواسطة</label>
              <input value={form.uploadedBy} onChange={e => setForm({ ...form, uploadedBy: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-1">اختر ملف أو صورة</label>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                  onChange={handleFileSelect}
                  className="block text-sm text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                {selectedFile && <button onClick={() => { setFileData(null); setFileMime(""); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-red-400 hover:text-red-600"><X size={16} /></button>}
              </div>
              {fileData && isImage(fileMime) && <img src={fileData} alt="معاينة" className="mt-2 max-h-32 rounded-lg border border-color object-contain" />}
              {selectedFile && !isImage(fileMime) && <p className="mt-1 text-xs text-emerald-600 font-medium">✓ تم اختيار: {selectedFile.name} ({form.size})</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={resetForm} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} disabled={uploading} className="relative overflow-hidden flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 min-w-[100px]">
              {uploading && uploadPct > 0 && <span className="absolute inset-0 bg-blue-400/50 transition-all" style={{ width: `${uploadPct}%` }} />}
              <span className="relative">
                {uploading ? <><span className="animate-spin">⏳</span> {uploadPct > 0 ? `${uploadPct}%` : "جارٍ الرفع..."}</> : <><Save size={14} /> إضافة</>}
              </span>
            </button>
          </div>
        </div>
      )}

      {allDocs.length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FolderOpen size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد وثائق بعد</p></div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allDocs.map(d => (
          <div key={d.id} className="card rounded-xl border border-color p-3">
            {isImage(d.fileMime) && (d.fileData || d.fileUrl) && (
              <div className="mb-2 cursor-pointer" onClick={() => setPreviewDoc(d)}>
                <img src={d.fileData || d.fileUrl} alt={d.name} className="w-full h-32 object-cover rounded-lg border border-color hover:opacity-90 transition-opacity" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="text-2xl cursor-pointer" onClick={() => (d.fileData || d.fileUrl) && setPreviewDoc(d)}>
                {isImage(d.fileMime) ? "🖼️" : (d.fileData || d.fileUrl) ? "📎" : (docIcons[d.type] || "📄")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{d.name}</p>
                <p className="text-xs text-secondary mt-0.5">{d.type} · {d.date}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {d.size && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono">{d.size}</span>}
                  <span className="text-[10px] text-secondary">{d.uploadedBy}</span>
                  {d.storageType === "local" && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">📁 محلي</span>}
                  {d.storageType === "gdrive" && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">☁️ Drive</span>}
                  {d.storageType === "firebase" && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">🔥 Firebase</span>}
                  <button onClick={() => downloadFile(d)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                    <Download size={10} /> تحميل
                  </button>
                  {isImage(d.fileMime) && (d.fileData || d.fileUrl) && (
                    <button onClick={() => setPreviewDoc(d)} className="text-[10px] text-purple-600 hover:underline">عرض</button>
                  )}
                </div>
              </div>
              <button onClick={() => doDelete(d)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg flex-shrink-0"><Trash2 size={14} /></button>
            </div>
            {d.firebasePath && (
              <div className="mt-1 pt-1 border-t border-color flex items-center gap-1">
                <span className="text-[10px] text-orange-600 font-medium">🔥 Firebase Storage</span>
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">فتح</a>
              </div>
            )}
            {d.driveFileId && (
              <div className="mt-1 pt-1 border-t border-color flex items-center gap-1">
                <span className="text-[10px] text-emerald-600 font-medium">☁️ Google Drive</span>
                <a href={d.driveViewLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">فتح</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── تبويب الفحوصات ──
function InspectionsTab({ proj, addInsp, delInsp, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date:new Date().toISOString().split("T")[0], inspector:emp.name, section:"", result:"ناجح", notes:"" });
  const addToast = useToast();
  const confirm = useConfirm();

  const submit = () => {
    if (!form.section.trim()) return;
    addInsp(proj.id, form); setShowAdd(false); setForm({ date:new Date().toISOString().split("T")[0], inspector:emp.name, section:"", result:"ناجح", notes:"" });
    addToast("تم تسجيل الفحص","success");
  };
  const doDelete = async (iId) => {
    if (await confirm("حذف هذا الفحص؟", { title:"حذف الفحص", ok:"حذف" })) { delInsp(proj.id, iId); addToast("تم الحذف","info"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FileCheck size={16}/> سجل الفحوصات</h3>
        <button onClick={()=>setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> فحص جديد
        </button>
      </div>

      {showAdd && (
        <div className="card rounded-2xl border border-color p-4">
          <h4 className="font-bold text-sm mb-3">تسجيل فحص جديد</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الفحص</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">المفتش</label>
              <input value={form.inspector} onChange={e=>setForm({...form,inspector:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">القسم / الموقع المفحوص</label>
              <input value={form.section} onChange={e=>setForm({...form,section:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: قسم A — الوصلات"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نتيجة الفحص</label>
              <select value={form.result} onChange={e=>setForm({...form,result:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {INSP_RESULTS.map(r=><option key={r}>{r}</option>)}</select></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">ملاحظات الفحص</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="ملاحظات ونتائج الفحص..."/></div>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ الفحص</button>
          </div>
        </div>
      )}

      {(proj.inspections||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FileCheck size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد فحوصات مسجلة بعد</p></div>
      )}

      <div className="space-y-3">
        {[...(proj.inspections||[])].reverse().map(insp => (
          <div key={insp.id} className="card rounded-xl border border-color p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{insp.section}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${INSP_RESULT_COLORS[insp.result]}`}>{insp.result}</span>
              </div>
              <button onClick={()=>doDelete(insp.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
            </div>
            <div className="text-xs text-secondary mb-1">{insp.date} · {insp.inspector}</div>
            {insp.notes && <p className="text-sm text-primary">{insp.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── مودال إضافة مشروع جديد ──
function AddProjectModal({ onClose, onAdd, existingIds }) {
  const [form, setForm] = useState({ name:"", status:"قيد التخطيط", priority:"متوسط", manager:"", budget:"", spent:"0", progress:"0", startDate:new Date().toISOString().split("T")[0], endDate:"", desc:"" });
  const submit = () => {
    if (!form.name.trim()) return;
    const newId = `P${String(existingIds.length+1).padStart(3,"0")}`;
    const usedId = existingIds.includes(newId) ? `P${Date.now()}` : newId;
    onAdd({ ...form, id:usedId, budget:+form.budget||0, spent:+form.spent||0, progress:+form.progress||0, team:form.manager?[form.manager]:[], phases:[], reports:[], docs:[], inspections:[] });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="card rounded-2xl border border-color p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Briefcase size={18}/> مشروع جديد</h3>
          <button onClick={onClose} className="text-secondary hover:text-red-500"><X size={18}/></button>
        </div>
        <div className="space-y-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">اسم المشروع *</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم المشروع"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">مدير المشروع</label>
            <input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم مدير المشروع"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">الحالة</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {PROJ_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">الأولوية</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {PROJ_PRIORITIES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ البدء</label>
              <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الانتهاء</label>
              <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">الميزانية ($)</label>
              <input type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr" placeholder="0"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نسبة الإنجاز %</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="0"/></div>
          </div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وصف المشروع</label>
            <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="وصف مختصر للمشروع..."/></div>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-color">
          <button onClick={onClose} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
          <button onClick={submit} disabled={!form.name.trim()} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50"><Plus size={14}/> إنشاء المشروع</button>
        </div>
      </div>
    </div>
  );
}

// ========== التايم شيت ==========
const TS_CODES_ALL = {
  "O": { label:"المقيم الصباحي",  color:"bg-orange-100 text-orange-700",  type:"work" },
  "2": { label:"مناوبة ثنائية",   color:"bg-blue-100 text-blue-700",      type:"work" },
  "3": { label:"مناوبة ثلاثية",   color:"bg-purple-100 text-purple-700",  type:"work" },
  "R": { label:"استراحة",         color:"bg-gray-100 text-gray-600",      type:"rest" },
  "L": { label:"إجازة اعتيادية", color:"bg-green-100 text-green-700",    type:"leave" },
  "S": { label:"إجازة مرضية",    color:"bg-red-100 text-red-600",        type:"sick" },
  "Y": { label:"عطلة رسمية",     color:"bg-yellow-100 text-yellow-700",  type:"holiday" },
  "X": { label:"غياب",           color:"bg-red-200 text-red-800",        type:"absent" },
  "N": { label:"استراحة مناوبة", color:"bg-slate-100 text-slate-600",    type:"rest" },
  "V": { label:"استراحة مقيم",   color:"bg-slate-200 text-slate-500",    type:"rest" },
  "ف": { label:"فاو",            color:"bg-amber-100 text-amber-700",    type:"work" },
  "ر": { label:"رميلة",          color:"bg-teal-100 text-teal-700",      type:"work" },
  "ب": { label:"باب الزبير",     color:"bg-cyan-100 text-cyan-700",      type:"work" },
  "غ": { label:"إجازة/غياب",    color:"bg-red-100 text-red-700",        type:"absent" },
};
const TS_CODES_GENERAL = ["O","2","3","R","L","S","Y","X","N","V"];
const TS_CODES_DRIVER  = ["ف","ر","ب","غ","R","Y","L","S","X"];
const MONTHS_AR_TS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAY_NAMES_AR = ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت'];
const getShiftForDay = (year, month, day) => {
  const anchor = new Date(2026, 5, 14);
  const current = new Date(year, month, day);
  const diff = Math.floor((current - anchor) / (1000 * 60 * 60 * 24));
  return ['أ','ب','ج','د'][((diff % 4) + 4) % 4];
};
const SHIFT_TEXT_COLORS = { 'أ':'#dc2626','ب':'#2563eb','ج':'#16a34a','د':'#7c3aed' };

const INITIAL_TS = {
  malak:[
    {id:"728004",name:"ايهاب عبد اللطيف عودة",movement:"",isMorning:true,days:{"1":"R","2":"Y","7":"L","8":"R","14":"L","15":"R","20":"L","21":"L","22":"R","27":"Y","28":"Y"},hours:{"2":3,"3":2,"4":2,"5":2,"6":2,"9":3,"10":2,"11":2,"12":3,"13":3,"16":3,"17":3,"18":2,"19":3,"23":3,"24":3,"25":2,"26":3,"29":3,"30":3,"31":2},notes:""},
    {id:"727466",name:"عدي فيصل عبد الهادي عبد السيد",movement:"",isMorning:true,days:{"1":"R","2":"Y","4":"L","5":"L","6":"L","7":"L","8":"R","9":"Y","12":"L","14":"L","15":"R","16":"Y","17":"L","18":"L","21":"L","22":"R","23":"Y","25":"L","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{"3":2,"10":2,"11":2,"13":2,"19":2,"20":2,"24":2,"31":2},notes:""},
    {id:"737283",name:"عمر طاهر خزعل",movement:"",isMorning:true,days:{"1":"R","2":"Y","5":"L","8":"R","9":"Y","15":"R","16":"Y","17":"L","22":"R","23":"Y","24":"L","25":"L","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"756571",name:"ليث شاكر حمود",movement:"",isMorning:true,days:{"1":"R","2":"Y","5":"L","8":"R","9":"Y","10":"L","15":"R","16":"Y","18":"L","22":"R","23":"Y","26":"Y","27":"Y","30":"Y"},hours:{"3":2,"4":2,"6":3,"7":2,"11":2,"12":2,"13":1,"14":2,"17":2,"19":1,"20":2,"21":2,"24":1,"25":1,"28":3,"29":3,"31":2},notes:""},
    {id:"813877",name:"محمد اسماعيل احمد",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","10":"L","13":"L","15":"R","16":"Y","20":"L","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"790885",name:"محمد عبدالكاظم جاسم محمد التميمي",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","25":"L","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"719242",name:"احمد محمود عبد القادر",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","17":"L","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{"3":1,"4":1,"5":1,"6":1,"7":1,"10":1,"11":1,"12":1,"13":1,"14":1,"18":1,"19":1,"20":1,"21":1,"24":1,"25":1,"31":1},notes:""},
    {id:"758795",name:"صباح عبد الامام يوسف",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"790850",name:"اسعد عبد الامام يوسف",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"790869",name:"محمود كاظم هاشم محمد المنصوري",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"439193",name:"علي طاهر خزعل",movement:"",isMorning:true,days:{"1":"R","2":"Y","3":"L","8":"R","9":"Y","13":"L","14":"L","15":"R","16":"Y","22":"R","23":"Y","24":"L","26":"Y","28":"Y","30":"Y"},hours:{"4":1,"5":1,"6":1,"7":1,"10":1,"11":1,"12":1,"17":1,"18":1,"19":1,"20":1,"21":1,"25":1,"27":3,"29":3,"31":1},notes:""},
    {id:"701130",name:"عبدالله علي ازباري يسر عبادة",movement:"أ",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"L","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"719277",name:"باسم هاشم جاسم",movement:"",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"3","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"719269",name:"حسين علي احمد",movement:"",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"3","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"719498",name:"جاسم مزعل حاتم ديوان",movement:"",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"3","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"751480",name:"امين حميد فاضل حسين",movement:"",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"3","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"719293",name:"هاشم جابرجعفر",movement:"ب",isMorning:true,days:{"1":"N","2":"3","3":"N","4":"N","5":"N","6":"3","7":"N","8":"N","9":"N","10":"3","11":"N","12":"N","13":"N","14":"3","15":"N","16":"N","17":"N","18":"3","19":"N","20":"N","21":"N","22":"3","23":"N","24":"N","25":"N","26":"3","27":"N","28":"N","29":"N","30":"3","31":"N"},hours:{},notes:""},
    {id:"736732",name:"احسان عبد الصمد داود",movement:"",isMorning:true,days:{"1":"N","2":"3","3":"N","4":"N","5":"N","6":"3","7":"N","8":"N","9":"N","10":"3","11":"N","12":"N","13":"N","14":"3","15":"N","16":"N","17":"N","18":"3","19":"N","20":"N","21":"N","22":"3","23":"N","24":"N","25":"N","26":"3","27":"N","28":"N","29":"N","30":"3","31":"N"},hours:{},notes:""},
    {id:"719048",name:"علاء محسن عذبي جعفر",movement:"",isMorning:true,days:{"1":"N","2":"3","3":"N","4":"N","5":"N","6":"3","7":"N","8":"N","9":"N","10":"3","11":"N","12":"N","13":"N","14":"3","15":"N","16":"N","17":"N","18":"3","19":"N","20":"N","21":"N","22":"3","23":"N","24":"N","25":"N","26":"3","27":"N","28":"N","29":"N","30":"3","31":"N"},hours:{},notes:""},
    {id:"719463",name:"عبد الحميد سامي موسى",movement:"",isMorning:true,days:{"1":"N","2":"3","3":"N","4":"N","5":"N","6":"3","7":"N","8":"N","9":"N","10":"3","11":"N","12":"N","13":"N","14":"3","15":"N","16":"N","17":"N","18":"3","19":"N","20":"N","21":"N","22":"3","23":"N","24":"N","25":"N","26":"3","27":"N","28":"N","29":"N","30":"3","31":"N"},hours:{},notes:""},
    {id:"732249",name:"علي باقر حنتوش",movement:"ج",isMorning:true,days:{"1":"N","2":"N","3":"3","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"726508",name:"يوسف عباس ياسين",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"3","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"735922",name:"علي طارق ياسين",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"L","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"719129",name:"ضياء بدر حمادي اسماعيل",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"3","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"719099",name:"عدنان جواد كاظم",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"3","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"732834",name:"احسان جواد كاظم حسين",movement:"د",isMorning:true,days:{"1":"N","2":"N","3":"N","4":"3","5":"N","6":"N","7":"N","8":"3","9":"N","10":"N","11":"N","12":"3","13":"N","14":"N","15":"N","16":"3","17":"N","18":"N","19":"N","20":"3","21":"N","22":"N","23":"N","24":"3","25":"N","26":"N","27":"N","28":"3","29":"N","30":"N","31":"N"},hours:{},notes:""},
    {id:"718939",name:"واثق حسين عبد الشيخ حسن",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"N","4":"3","5":"N","6":"N","7":"N","8":"3","9":"N","10":"N","11":"N","12":"3","13":"N","14":"N","15":"N","16":"3","17":"N","18":"N","19":"N","20":"3","21":"N","22":"N","23":"N","24":"3","25":"N","26":"N","27":"N","28":"3","29":"N","30":"N","31":"N"},hours:{},notes:""},
    {id:"719005",name:"صدام عبد الواحد سلمان عيسى",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"N","4":"3","5":"N","6":"N","7":"N","8":"3","9":"N","10":"N","11":"N","12":"3","13":"N","14":"N","15":"N","16":"3","17":"N","18":"N","19":"N","20":"3","21":"N","22":"N","23":"N","24":"3","25":"N","26":"N","27":"N","28":"3","29":"N","30":"N","31":"N"},hours:{},notes:""},
    {id:"724939",name:"حيدر عبد الحسن خضير",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"N","4":"3","5":"N","6":"N","7":"N","8":"3","9":"N","10":"N","11":"N","12":"3","13":"N","14":"N","15":"N","16":"3","17":"N","18":"N","19":"N","20":"3","21":"N","22":"N","23":"N","24":"3","25":"N","26":"N","27":"N","28":"3","29":"N","30":"N","31":"N"},hours:{},notes:""},
  ],
  contracts:[
    {id:"690414",name:"عبد الله عيسى موسى موني الربيعي",movement:"",isMorning:true,days:{"1":"R","2":"Y","7":"L","8":"R","9":"Y","10":"L","12":"L","15":"R","16":"Y","19":"L","21":"L","22":"R","23":"Y","25":"L","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"689766",name:"اباذر صالح عبد الحسين عيسى",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"690174",name:"حسن عادل عمران",movement:"",isMorning:true,days:{"1":"R","8":"R","15":"R","22":"R","29":"R"},hours:{"2":3,"3":2,"4":2,"5":2,"6":2,"7":2,"9":3,"10":2,"11":2,"12":2,"13":2,"14":2,"16":3,"17":2,"18":2,"19":2,"20":2,"21":2,"23":3,"24":1,"25":1,"26":3,"27":3,"28":3,"30":3,"31":1},notes:""},
    {id:"689331",name:"سجاد علي راضي علي",movement:"",isMorning:true,days:{"1":"R","8":"R","15":"R","22":"R","29":"R"},hours:{"2":3,"3":2,"4":2,"5":2,"6":2,"7":2,"9":3,"10":2,"11":2,"12":2,"13":2,"14":2,"16":3,"17":2,"18":2,"19":2,"20":2,"21":2,"23":3,"24":1,"25":1,"26":3,"27":3,"28":3,"30":3,"31":1},notes:""},
  ],
  drivers:[
    {id:"محمد نعيم فاضل",name:"محمد نعيم فاضل",movement:"",days:{},hours:{},notes:""},
    {id:"علي جاسم محمد",name:"علي جاسم محمد",movement:"",days:{},hours:{},notes:""},
  ],
};

function calcTsStats(emp) {
  const vals = Object.values(emp.days || {});
  return {
    totalHours: Object.values(emp.hours || {}).reduce((a,b) => a+b, 0),
    leaveDays:  vals.filter(v => v === "L").length,
    sickDays:   vals.filter(v => v === "S").length,
    absenceDays:vals.filter(v => ["X","غ"].includes(v)).length,
    restDays:   vals.filter(v => ["R","Y"].includes(v)).length,
    workDays:   vals.filter(v => ["O","2","3","N","V","ف","ر","ب"].includes(v)).length,
  };
}

function TsCodePicker({ codesArr, current, onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} dir="rtl"
      className="absolute z-[200] bg-white border border-gray-300 rounded-xl shadow-2xl p-2"
      style={{top:"100%", right:"-10px", minWidth:"160px"}}>
      <button onClick={() => onSelect("")}
        className="w-full text-right text-xs text-red-500 hover:text-red-700 mb-1.5 px-1">× مسح الخلية</button>
      <div className="grid grid-cols-3 gap-1">
        {codesArr.map(code => (
          <button key={code} onClick={() => onSelect(code)}
            className={`px-1.5 py-1 rounded-lg text-xs font-bold border-2 transition-all ${TS_CODES_ALL[code]?.color||""} ${current===code?"border-blue-500 scale-105":"border-transparent"}`}>
            <div>{code}</div>
            <div className="text-[8px] font-normal leading-tight">{(TS_CODES_ALL[code]?.label||"").split(" ")[0]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

class TsErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div dir="rtl" className="p-6 text-center">
        <p className="text-red-600 font-bold mb-2">خطأ في تحميل صفحة التايم شيت</p>
        <p className="text-sm text-gray-500 mb-4">{this.state.err?.message}</p>
        <button onClick={()=>{localStorage.removeItem("boc_timesheet_v5");this.setState({err:null});}}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          مسح البيانات المحلية وإعادة المحاولة
        </button>
      </div>
    );
    return this.props.children;
  }
}

function TimeSheetPage({ emp }) {
  const addToast = useToast();
  const confirm  = useConfirm();
  const gDrive   = useGDrive();
  const STORAGE_KEY = "boc_timesheet_v5";

  const [tsMonth, setTsMonth] = useState(() => new Date().getMonth());
  const [tsYear,  setTsYear]  = useState(() => new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("malak");
  const [data, setData] = useState(() => {
    // Firebase converts arrays to {0:…,1:…} — restore before using as state.
    // Also filter out null/sparse entries Firebase may leave behind after deletions.
    const toArr = (v) => {
      let arr;
      if (Array.isArray(v)) arr = v;
      else if (v && typeof v === "object") {
        const ks = Object.keys(v);
        if (ks.length > 0 && ks.every(k => /^\d+$/.test(k)))
          arr = ks.sort((a,b)=>Number(a)-Number(b)).map(k=>v[k]);
        else arr = [];
      } else arr = [];
      return arr.filter(e => e && typeof e === "object").map(e => ({
        ...e, days: e.days || {}, hours: e.hours || {},
      }));
    };
    const raw = storage.get(STORAGE_KEY, null);
    if (!raw || typeof raw !== "object") return INITIAL_TS;
    const malak     = toArr(raw.malak);
    const contracts = toArr(raw.contracts);
    const drivers   = toArr(raw.drivers);
    return {
      malak:     malak.length     ? malak     : INITIAL_TS.malak,
      contracts: contracts.length ? contracts : INITIAL_TS.contracts,
      drivers:   drivers.length   ? drivers   : INITIAL_TS.drivers,
    };
  });
  const [editCell, setEditCell] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [searchEmp, setSearchEmp] = useState("");
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importDriveId, setImportDriveId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportDriveId, setExportDriveId] = useState("");
  const exportFileRef = useRef(null);
  const fileInputRef = useRef(null);

  // أي تعديل على التايم شيت يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const persistTs = (updated) => {
    storage.set(STORAGE_KEY, updated);
    FirebaseAPI.saveTimesheet(updated);
  };
  useEffect(() => {
    FirebaseAPI.loadTimesheet().then(d => {
      if (d && Array.isArray(d.malak) && d.malak.length) {
        setData(d); storage.set(STORAGE_KEY, d);
      }
    });
  }, []);

  // ── Import from Excel (local file or Google Drive) ──────────────────────────
  const importFromBuffer = async (buffer) => {
    setImporting(true);
    try {
      const { read, utils } = await import("xlsx");
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws, { header: 1, defval: "" });
      // Build lookup: empId → rowIndex (code row) and rowIndex+1 (hours row)
      // Columns: A=0(id), B=1(name), C=2..., D=3, E..AI = days 1-31 (cols 4-34)
      const DAY_COL_START = 4; // column E = index 4
      const buildUpdate = (tabKey) => {
        const tabEmps = data[tabKey] || [];
        return tabEmps.map(emp => {
          // Find matching row by employee ID
          const codeRowIdx = rows.findIndex(r => String(r[0]).trim() === String(emp.id).trim());
          if (codeRowIdx === -1) return emp;
          const codeRow  = rows[codeRowIdx];
          const hoursRow = rows[codeRowIdx + 1] || [];
          const newDays  = { ...emp.days };
          const newHours = { ...emp.hours };
          for (let d = 1; d <= 31; d++) {
            const col  = DAY_COL_START + (d - 1);
            const code = String(codeRow[col] || "").trim();
            const h    = String(hoursRow[col] || "").trim();
            if (code) newDays[String(d)] = code;
            else delete newDays[String(d)];
            const hNum = parseInt(h);
            if (!isNaN(hNum) && hNum > 0) newHours[String(d)] = hNum;
            else delete newHours[String(d)];
          }
          return { ...emp, days: newDays, hours: newHours };
        });
      };
      const updated = {
        malak:     buildUpdate("malak"),
        contracts: buildUpdate("contracts"),
        drivers:   buildUpdate("drivers"),
      };
      persistTs(updated);
      setData(updated);
      setShowImport(false);
      addToast("تم استيراد بيانات التايم شيت من Excel ✅", "success");
    } catch (e) {
      addToast("فشل الاستيراد: " + e.message, "error");
    } finally {
      setImporting(false);
    }
  };

  const importFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importFromBuffer(ev.target.result);
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const importFromDrive = async () => {
    if (!importDriveId.trim()) { addToast("أدخل File ID من Drive", "warning"); return; }
    if (!gDrive?.isReady) { addToast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setImporting(true);
    try {
      const buf = await gDrive.downloadFile(importDriveId.trim());
      await importFromBuffer(buf);
    } catch (e) {
      addToast("فشل تنزيل الملف من Drive: " + e.message, "error");
      setImporting(false);
    }
  };

  // ── Export data INTO an existing Excel template ──────────────────────────────
  const exportToTemplate = async (buffer) => {
    setExporting(true);
    try {
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.worksheets[0];

      // ExcelJS: إسناد القيمة فقط لا يمس التنسيق إطلاقاً
      const DAY_COL_START = 5; // العمود E = 5 (تعداد ExcelJS من 1)
      const emps = data[activeTab] || [];

      // نبني فهرس: id الموظف → رقم الصف
      const colAVals = ws.getColumn(1).values; // فهرسة تبدأ من 1
      emps.forEach(emp => {
        const codeRowIdx = colAVals.findIndex(
          (v, i) => i > 0 && String(v ?? "").trim() === String(emp.id).trim()
        );
        if (codeRowIdx === -1) return;
        const hoursRowIdx = codeRowIdx + 1;
        for (let d = 1; d <= 31; d++) {
          const col  = DAY_COL_START + (d - 1);
          const code = (emp.days  || {})[String(d)] || "";
          const h    = (emp.hours || {})[String(d)];
          ws.getCell(codeRowIdx,  col).value = code || null;
          ws.getCell(hoursRowIdx, col).value = (h != null && h > 0) ? h : null;
        }
      });

      const outBuf = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement("a");
      a.href = url;
      a.download = `تايم_شيت_${TAB_INFO[activeTab].label}_${tsYear}_${String(tsMonth+1).padStart(2,"0")}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      addToast("تم تصدير البيانات إلى قالب Excel ✅", "success");
      setShowExport(false);
    } catch (e) {
      addToast("فشل التصدير: " + e.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const exportFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => exportToTemplate(ev.target.result);
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const exportFromDrive = async () => {
    if (!exportDriveId.trim()) { addToast("أدخل File ID من Drive", "warning"); return; }
    if (!gDrive?.isReady) { addToast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setExporting(true);
    try {
      const buf = await gDrive.downloadFile(exportDriveId.trim());
      await exportToTemplate(buf);
    } catch (e) {
      addToast("فشل تنزيل القالب من Drive: " + e.message, "error");
      setExporting(false);
    }
  };

  const TAB_INFO = {
    malak:     { label:"الملاك",     title:"استمارة ضبط وقت العمال المؤقتين (بعقد)", codes:TS_CODES_GENERAL },
    contracts: { label:"العقود",    title:"استمارة تفاصيل الدوام",                   codes:TS_CODES_GENERAL },
    drivers:   { label:"السواقين",  title:"استمارة ضبط الوقت للسيارات المؤجرة",       codes:TS_CODES_DRIVER  },
  };

  useEffect(() => {
    const today = new Date();
    if (today.getDate() === 25) {
      addToast("تذكير: اليوم الخامس والعشرون — يُرجى تصدير تقرير التايم شيت", "warning");
    }
  }, []);

  const daysInMonth = new Date(tsYear, tsMonth + 1, 0).getDate();
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const employees = useMemo(() => {
    const list = data[activeTab] || [];
    if (!searchEmp.trim()) return list;
    return list.filter(e => e.name.includes(searchEmp.trim()) || e.id.includes(searchEmp.trim()));
  }, [data, activeTab, searchEmp]);

  const updateCell = (tabKey, empId, day, field, value) => {
    setData(prev => {
      const updated = {
        ...prev,
        [tabKey]: prev[tabKey].map(e => {
          if (e.id !== empId) return e;
          if (field === "code") {
            const newDays = {...e.days};
            if (value === "") delete newDays[String(day)];
            else newDays[String(day)] = value;
            return {...e, days: newDays};
          } else {
            const newHours = {...e.hours};
            const n = parseInt(value);
            if (!value || isNaN(n)) delete newHours[String(day)];
            else newHours[String(day)] = n;
            return {...e, hours: newHours};
          }
        })
      };
      persistTs(updated);
      return updated;
    });
  };

  const updateNotes = (tabKey, empId, notes) => {
    setData(prev => {
      const updated = {...prev, [tabKey]: prev[tabKey].map(e => e.id===empId ? {...e, notes} : e)};
      persistTs(updated);
      return updated;
    });
  };

  const addEmployee = (tabKey) => {
    const id = prompt("أدخل الرقم الوظيفي (أو الاسم للسائقين):");
    if (!id?.trim()) return;
    const name = prompt("أدخل الاسم الكامل:");
    if (!name?.trim()) return;
    const newEmp = {id:id.trim(), name:name.trim(), movement:"", days:{}, hours:{}, notes:""};
    setData(prev => {
      const updated = {...prev, [tabKey]: [...prev[tabKey], newEmp]};
      persistTs(updated);
      return updated;
    });
    addToast("تمت إضافة الموظف", "success");
  };

  const deleteEmployee = async (tabKey, empId, empName) => {
    const ok = await confirm(`هل تريد حذف ${empName}؟`);
    if (!ok) return;
    setData(prev => {
      const updated = {...prev, [tabKey]: prev[tabKey].filter(e => e.id !== empId)};
      persistTs(updated);
      return updated;
    });
    addToast("تم حذف الموظف", "success");
  };

  const editDriverName = (tabKey, empId, currentName) => {
    const newName = prompt("تعديل اسم السائق:", currentName);
    if (!newName?.trim() || newName.trim() === currentName) return;
    setData(prev => {
      const updated = {
        ...prev,
        [tabKey]: prev[tabKey].map(e => e.id === empId ? {...e, name:newName.trim(), id:newName.trim()} : e)
      };
      persistTs(updated);
      return updated;
    });
    addToast("تم تعديل اسم السائق", "success");
  };

  const resetData = async () => {
    const ok = await confirm("هل تريد إعادة تعيين جميع البيانات للبيانات الأصلية؟");
    if (!ok) return;
    persistTs(INITIAL_TS);
    setData(INITIAL_TS);
    addToast("تمت إعادة التعيين للبيانات الأصلية", "success");
  };

  const resetTab = async () => {
    const ok = await confirm(`هل تريد تصفير جميع رموز الحضور لتبويب ${TAB_INFO[activeTab].label}؟`);
    if (!ok) return;
    setData(prev => {
      const updated = {
        ...prev,
        [activeTab]: prev[activeTab].map(e => ({...e, days:{}, hours:{}}))
      };
      persistTs(updated);
      return updated;
    });
    addToast(`تم تصفير بيانات ${TAB_INFO[activeTab].label}`, "success");
  };

  const fillWeekend = async () => {
    const morningCount = (data[activeTab]||[]).filter(e=>e.isMorning).length;
    if (morningCount === 0) { addToast("لا يوجد كادر صباحي في هذا التبويب", "warning"); return; }
    const ok = await confirm(`ملء أيام الجمعة (R) والسبت (Y) للكادر الصباحي في ${TAB_INFO[activeTab].label}؟`);
    if (!ok) return;
    setData(prev => {
      const updated = {
        ...prev,
        [activeTab]: prev[activeTab].map(e => {
          if (!e.isMorning) return e;
          const newDays = {...e.days};
          days.forEach(d => {
            const dow = new Date(tsYear, tsMonth, d).getDay();
            if (dow === 5) newDays[String(d)] = "R";
            if (dow === 6) newDays[String(d)] = "Y";
          });
          return {...e, days: newDays};
        })
      };
      persistTs(updated);
      return updated;
    });
    addToast("تم ملء رموز عطلة نهاية الأسبوع للكادر الصباحي", "success");
  };

  const buildHTMLTable = (tab) => {
    const emps = data[tab] || [];
    const title = TAB_INFO[tab].title;
    const monthLabel = MONTHS_AR_TS[tsMonth];
    const daysList = days;

    const codeStyle = (code) => {
      if (!code) return "";
      const c = TS_CODES_ALL[code];
      if (!c) return "";
      const map = {
        "bg-orange-100 text-orange-700": "background:#ffedd5;color:#c2410c",
        "bg-blue-100 text-blue-700": "background:#dbeafe;color:#1d4ed8",
        "bg-purple-100 text-purple-700": "background:#f3e8ff;color:#7e22ce",
        "bg-gray-100 text-gray-600": "background:#f3f4f6;color:#4b5563",
        "bg-green-100 text-green-700": "background:#dcfce7;color:#15803d",
        "bg-red-100 text-red-600": "background:#fee2e2;color:#dc2626",
        "bg-yellow-100 text-yellow-700": "background:#fef9c3;color:#a16207",
        "bg-red-200 text-red-800": "background:#fecaca;color:#991b1b",
        "bg-slate-100 text-slate-600": "background:#f1f5f9;color:#475569",
        "bg-slate-200 text-slate-500": "background:#e2e8f0;color:#64748b",
        "bg-amber-100 text-amber-700": "background:#fef3c7;color:#b45309",
        "bg-teal-100 text-teal-700": "background:#ccfbf1;color:#0f766e",
        "bg-cyan-100 text-cyan-700": "background:#cffafe;color:#0e7490",
        "bg-red-100 text-red-700": "background:#fee2e2;color:#b91c1c",
      };
      return map[c.color] || "";
    };

    const cellStyle = "border:1px solid #d1d5db;padding:2px;text-align:center;font-size:11px;min-width:26px;";

    let rows = "";
    emps.forEach((e, idx) => {
      const stats = calcTsStats(e);
      const bg = idx%2===0 ? "#fff" : "#f9fafb";
      rows += `<tr style="background:${bg}">`;
      rows += `<td rowspan="2" style="${cellStyle}font-size:10px;color:#6b7280;">${e.id}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}text-align:right;font-weight:600;min-width:130px;font-size:12px;">${e.name}</td>`;
      rows += `<td style="${cellStyle}color:#2563eb;font-weight:bold;">أ</td>`;
      daysList.forEach(d => {
        const dow = new Date(tsYear, tsMonth, d).getDay();
        const isWe = dow===5||dow===6;
        const code = e.days[String(d)] || "";
        const cs = codeStyle(code);
        const weBg = isWe && !code ? "background:#fff7ed;" : "";
        rows += `<td style="${cellStyle}${cs||weBg}font-weight:bold;">${code}</td>`;
      });
      rows += `<td rowspan="2" style="${cellStyle}color:#1d4ed8;font-weight:bold;">${stats.totalHours||""}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}color:#15803d;">${stats.leaveDays||""}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}color:#dc2626;">${stats.absenceDays||""}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}color:#6b7280;">${stats.restDays||""}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}text-align:right;font-size:10px;color:#6b7280;">${e.notes||""}</td>`;
      rows += `</tr>`;
      rows += `<tr style="background:${bg}">`;
      rows += `<td style="${cellStyle}color:#7c3aed;font-weight:bold;">ق</td>`;
      daysList.forEach(d => {
        const dow = new Date(tsYear, tsMonth, d).getDay();
        const isWe = dow===5||dow===6;
        const h = e.hours[String(d)];
        const weBg = isWe && h==null ? "background:#fff7ed;" : "";
        rows += `<td style="${cellStyle}${h!=null?"background:#f5f3ff;color:#7c3aed;font-weight:600":weBg}">${h!=null?h:""}</td>`;
      });
      rows += `</tr>`;
    });

    const dayHeaders = daysList.map(d => {
      const dow = new Date(tsYear, tsMonth, d).getDay();
      const shift = getShiftForDay(tsYear, tsMonth, d);
      const isWe = dow===5||dow===6;
      const weBg = isWe ? "background:#fff7ed;" : "background:#eff6ff;";
      const dayColor = isWe ? "color:#ea580c;" : "";
      const shiftColor = `color:${SHIFT_TEXT_COLORS[shift]||"#374151"};`;
      return `<th style="border:1px solid #d1d5db;padding:1px;text-align:center;font-size:9px;min-width:28px;${weBg}"><div style="font-weight:bold;font-size:10px;${dayColor}">${d}</div><div style="font-size:8px;${dayColor}">${DAY_NAMES_AR[dow]}</div><div style="font-size:8px;font-weight:bold;${shiftColor}">${shift}</div></th>`;
    }).join("");

    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<style>body{font-family:Arial,sans-serif;direction:rtl;} table{border-collapse:collapse;width:100%;} th{padding:4px;border:1px solid #9ca3af;font-size:12px;}</style>
</head><body>
<h3 style="text-align:center;margin-bottom:4px;">${title}</h3>
<p style="text-align:center;margin-bottom:8px;font-size:13px;">شهر ${monthLabel} ${tsYear}</p>
<table>
<thead><tr style="background:#dbeafe;">
  <th style="border:1px solid #9ca3af;padding:4px;min-width:68px;">الرقم الوظيفي</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:130px;">الاسم</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:30px;">ح/ق</th>
  ${dayHeaders}
  <th style="border:1px solid #9ca3af;padding:4px;min-width:50px;">الساعات</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">إجازة</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">غياب</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">عطل</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:80px;">ملاحظات</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;
  };

  const exportExcel = () => {
    const html = buildHTMLTable(activeTab);
    const blob = new Blob(["﻿" + html], {type:"application/vnd.ms-excel;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تايم_شيت_${TAB_INFO[activeTab].label}_${tsYear}_${String(tsMonth+1).padStart(2,"0")}.xls`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast("تم تصدير الملف بتنسيق Excel", "success");
  };

  const exportExcelFormatted = () => {
    const emps = data[activeTab] || [];
    const monthLabel = MONTHS_AR_TS[tsMonth];
    const yearNum = tsYear;
    const daysInMonthEx = new Date(tsYear, tsMonth + 1, 0).getDate();
    const daysEx = Array.from({ length: daysInMonthEx }, (_, i) => i + 1);

    const getShiftForDayExport = (year, month, day) => {
      const anchor = new Date(2026, 5, 14);
      const current = new Date(year, month, day);
      const diff = Math.floor((current - anchor) / (1000 * 60 * 60 * 24));
      return ['أ', 'ب', 'ج', 'د'][((diff % 4) + 4) % 4];
    };

    const getDayName = (day) => {
      const dow = new Date(tsYear, tsMonth, day).getDay();
      return ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dow];
    };

    const isWeekend = (day) => {
      const dow = new Date(tsYear, tsMonth, day).getDay();
      return dow === 5 || dow === 6;
    };

    let employeeRows = '';
    emps.forEach((e, idx) => {
      const stats = calcTsStats(e);
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb';

      employeeRows += `
        <tr style="background:${bgColor};">
          <td rowspan="2" style="border:1px solid #000;text-align:center;vertical-align:middle;font-size:10px;">${e.id}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:right;vertical-align:middle;font-size:11px;font-weight:bold;">${e.name} ${e.movement ? `(${e.movement})` : ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:center;vertical-align:middle;font-size:9px;">${e.movement || ''}</td>
          <td style="border:1px solid #000;text-align:center;font-weight:bold;background:#dbeafe;">أ</td>
      `;
      daysEx.forEach(day => {
        const code = e.days[String(day)] || '';
        const isWe = isWeekend(day);
        const weBg = isWe && !code ? 'background:#fff7ed;' : '';
        const codeColor = TS_CODES_ALL[code]?.color || '';
        const colorStyle = codeColor ? `background:${codeColor.split(' ')[0]};` : '';
        employeeRows += `<td style="border:1px solid #000;text-align:center;font-size:11px;font-weight:bold;${colorStyle}${weBg}">${code}</td>`;
      });
      employeeRows += `
          <td rowspan="2" style="border:1px solid #000;text-align:center;font-weight:bold;color:#1d4ed8;">${stats.totalHours || ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:center;color:#15803d;">${stats.leaveDays || ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:center;color:#dc2626;">${stats.absenceDays || ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:center;color:#6b7280;">${stats.restDays || ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:right;font-size:9px;color:#6b7280;">${e.notes || ''}</td>
        </tr>
      `;
      employeeRows += `<tr style="background:${bgColor};">
          <td style="border:1px solid #000;text-align:center;font-weight:bold;background:#f3e8ff;">ق</td>
      `;
      daysEx.forEach(day => {
        const hours = e.hours[String(day)];
        const isWe = isWeekend(day);
        const weBg = hours == null && isWe ? 'background:#fff7ed;' : '';
        const hoursStyle = hours != null ? 'background:#f5f3ff;color:#7c3aed;font-weight:bold;' : '';
        employeeRows += `<td style="border:1px solid #000;text-align:center;font-size:11px;${hoursStyle}${weBg}">${hours != null ? hours : ''}</td>`;
      });
      employeeRows += `</tr>`;
    });

    let dayHeaders = '';
    daysEx.forEach(day => {
      const dow = getDayName(day);
      const shift = getShiftForDayExport(tsYear, tsMonth, day);
      const isWe = isWeekend(day);
      const weBg = isWe ? 'background:#fff7ed;' : 'background:#eff6ff;';
      dayHeaders += `
        <th style="border:1px solid #000;text-align:center;font-size:8px;min-width:28px;${weBg}">
          <div style="font-weight:bold;font-size:10px;">${day}</div>
          <div style="font-size:7px;">${dow}</div>
          <div style="font-size:7px;font-weight:bold;color:${SHIFT_TEXT_COLORS[shift] || '#374151'};">${shift}</div>
        </th>
      `;
    });

    const symbolsTable = `
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:8px;direction:rtl;">
        <tr><td colspan="4" style="border:1px solid #000;padding:3px;background:#f0f0f0;font-weight:bold;">دليل الرموز</td></tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>Z:</strong> مواظبة ولا تحتوي على متغيرات</td>
          <td style="border:1px solid #000;padding:3px;"><strong>5:</strong> أيام الحشد الشعبي</td>
          <td style="border:1px solid #000;padding:3px;"><strong>E:</strong> إصابة عمل صادرة من لجنة طبية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>B:</strong> أيام بقسم آخر</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>F:</strong> مواظبة تحتوي على متغيرات إجازة غياب أو ساعات</td>
          <td style="border:1px solid #000;padding:3px;"><strong>W:</strong> الوفاة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>K:</strong> إجازة أمومة بأمر إداري</td>
          <td style="border:1px solid #000;padding:3px;"><strong>M:</strong> إجازة أمومة</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>4:</strong> العالقين في المناطق الساخنة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>A:</strong> إعالة (إجازة) لذوي الاحتياجات الخاصة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>D:</strong> أيام العدة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>H:</strong> إجازة بدون راتب خارج العراق</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>8:</strong> مصاحبة زوجية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>Y:</strong> عطلة رسمية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>X:</strong> غياب</td>
          <td style="border:1px solid #000;padding:3px;"><strong>7:</strong> إجازة اعتيادية خارج العراق براتب تام</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>U:</strong> تفرغ</td>
          <td style="border:1px solid #000;padding:3px;"><strong>Q:</strong> خارج الخدمة (أيام قبل المباشرة في الشركة)</td>
          <td style="border:1px solid #000;padding:3px;"><strong>P:</strong> إيفاد شامل كافة أنواع الإيفادات خارج العراق</td>
          <td style="border:1px solid #000;padding:3px;"><strong>O:</strong> المقيم الصباحي</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>2:</strong> مناوبة ثنائية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>3:</strong> مناوبة ثلاثية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>N:</strong> استراحة مناوبة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>V:</strong> استراحة مقيم</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>L:</strong> إجازة اعتيادية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>S:</strong> إجازة مرضية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>R:</strong> استراحة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>J:</strong> مجاز دراسياً</td>
        </tr>
      </table>
    `;

    const fullHtml = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>استمارة تفاصيل الدوام - ${monthLabel} ${yearNum}</title>
      <style>
        @page { size: A3 landscape; margin: 8mm; }
        body { font-family: 'Arial', sans-serif; direction: rtl; margin: 0; padding: 0; }
        .header { text-align: center; border: 2px solid #1d3557; padding: 6px; border-radius: 4px; margin-bottom: 10px; }
        .header .company { font-size: 12px; font-weight: bold; }
        .header .dept { font-size: 11px; }
        .header .title { font-size: 14px; font-weight: bold; margin: 4px 0; }
        .header .sub { font-size: 11px; }
        .notice { background: #fef9c3; padding: 4px; font-size: 9px; text-align: center; margin: 6px 0; border: 1px solid #fde047; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 2px 1px; vertical-align: middle; }
        th { background: #dbeafe; font-size: 9px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 20px; font-size: 10px; text-align: center; }
        .sign-item { width: 30%; border-top: 1px solid #000; padding-top: 5px; margin-top: 30px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">الجمهورية العراقية — وزارة النفط</div>
        <div class="company">شركة نفط البصرة (شركة عامة)</div>
        <div class="dept">شعبة مستودع الفاو — قسم السيطرة والنظم</div>
        <div class="title">استمارة تفاصيل الدوام لشهر ${monthLabel} ${yearNum}</div>
        <div class="sub">الموقع: الفاو</div>
      </div>
      <div class="notice">ملاحظة: يرجى الانتباه إلى رموز المواظبة والتقيد بها وتثبيت مجموع الساعات للمشمولين بها</div>
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width:60px;">الرقم الوظيفي</th>
            <th rowspan="2" style="width:160px;">اسم الموظف</th>
            <th rowspan="2" style="width:40px;">الحركة</th>
            <th rowspan="2" style="width:25px;">نوع</th>
            ${dayHeaders}
            <th rowspan="2" style="width:55px;">مجموع الساعات</th>
            <th rowspan="2" style="width:40px;">إجازة</th>
            <th rowspan="2" style="width:40px;">غياب</th>
            <th rowspan="2" style="width:40px;">عطل</th>
            <th rowspan="2" style="width:80px;">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${employeeRows}
        </tbody>
      </table>
      ${symbolsTable}
      <div class="signatures">
        <div class="sign-item">مدير القسم<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
        <div class="sign-item">مسؤول الشعبة<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
        <div class="sign-item">مسؤول ضبط الوقت<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
      </div>
    </body>
    </html>`;

    const blob = new Blob(["﻿" + fullHtml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تايم_شيت_${TAB_INFO[activeTab].label}_${yearNum}_${String(tsMonth + 1).padStart(2, "0")}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("تم تصدير الملف بنجاح بالتنسيق الرسمي ✅", "success");
  };

  const exportPDF = () => {
    const html = buildHTMLTable(activeTab);
    const printHTML = html.replace("<body>", `<body><style>@page{size:A3 landscape;margin:10mm;} @media print{body{zoom:0.7;}}</style>`);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-999px;left:-999px;width:1400px;height:900px;border:none;";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(printHTML);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 3000);
    }, 800);
    addToast("جارٍ فتح نافذة الطباعة / تصدير PDF", "info");
  };

  const exportOfficialForm = () => {
    const emps = data[activeTab] || [];
    const monthLabel = MONTHS_AR_TS[tsMonth];
    const tabTitle = TAB_INFO[activeTab].title;
    const cellS = "border:1px solid #374151;padding:2px 1px;text-align:center;font-size:9px;";
    const weStyle = "background:#fff7ed;";
    let bodyRows = "";
    emps.forEach((e, idx) => {
      const stats = calcTsStats(e);
      const bg = idx % 2 === 0 ? "" : "background:#f9fafb;";
      bodyRows += `<tr style="${bg}">`;
      bodyRows += `<td rowspan="2" style="${cellS}font-weight:bold;font-size:10px;">${idx+1}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}text-align:right;min-width:100px;font-weight:bold;">${e.name}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}font-size:9px;color:#555;">${e.id}</td>`;
      bodyRows += `<td style="${cellS}font-size:8px;color:#1d4ed8;font-weight:bold;">رمز</td>`;
      days.forEach(d => {
        const dow = new Date(tsYear, tsMonth, d).getDay();
        const isWe = dow===5||dow===6;
        const code = e.days[String(d)] || "";
        const cSt = code ? (TS_CODES_ALL[code] ? {
          "bg-orange-100 text-orange-700":"background:#ffedd5;color:#c2410c",
          "bg-blue-100 text-blue-700":"background:#dbeafe;color:#1d4ed8",
          "bg-green-100 text-green-700":"background:#dcfce7;color:#15803d",
          "bg-red-100 text-red-600":"background:#fee2e2;color:#dc2626",
          "bg-yellow-100 text-yellow-700":"background:#fef9c3;color:#a16207",
          "bg-gray-100 text-gray-600":"background:#f3f4f6;color:#4b5563",
          "bg-purple-100 text-purple-700":"background:#f3e8ff;color:#7e22ce",
          "bg-red-200 text-red-800":"background:#fecaca;color:#991b1b",
          "bg-amber-100 text-amber-700":"background:#fef3c7;color:#b45309",
          "bg-teal-100 text-teal-700":"background:#ccfbf1;color:#0f766e",
          "bg-cyan-100 text-cyan-700":"background:#cffafe;color:#0e7490",
          "bg-red-100 text-red-700":"background:#fee2e2;color:#b91c1c",
          "bg-slate-100 text-slate-600":"background:#f1f5f9;color:#475569",
          "bg-slate-200 text-slate-500":"background:#e2e8f0;color:#64748b",
        }[TS_CODES_ALL[code].color] || "" : "") : (isWe ? weStyle : "");
        bodyRows += `<td style="${cellS}${cSt}font-weight:bold;">${code}</td>`;
      });
      bodyRows += `<td rowspan="2" style="${cellS}font-weight:bold;color:#1d4ed8;">${stats.totalHours||""}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}color:#15803d;">${stats.leaveDays||""}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}color:#dc2626;">${stats.absenceDays||""}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}color:#6b7280;">${stats.restDays||""}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}font-size:8px;text-align:right;">${e.notes||""}</td>`;
      bodyRows += `</tr><tr style="${bg}">`;
      bodyRows += `<td style="${cellS}font-size:8px;color:#7c3aed;font-weight:bold;">ساعة</td>`;
      days.forEach(d => {
        const dow = new Date(tsYear, tsMonth, d).getDay();
        const isWe = dow===5||dow===6;
        const h = e.hours[String(d)];
        bodyRows += `<td style="${cellS}${h!=null?"background:#f5f3ff;color:#7c3aed;font-weight:600":isWe?"background:#fff7ed;":""}">${h!=null?h:""}</td>`;
      });
      bodyRows += `</tr>`;
    });
    const dayHdrs = days.map(d => {
      const dow = new Date(tsYear, tsMonth, d).getDay();
      const isWe = dow===5||dow===6;
      const shift = getShiftForDay(tsYear, tsMonth, d);
      const sc = SHIFT_TEXT_COLORS[shift]||"#374151";
      return `<th style="border:1px solid #374151;padding:1px;text-align:center;font-size:8px;min-width:22px;${isWe?weStyle:"background:#eff6ff;"}">`+
        `<div style="font-weight:bold;font-size:9px;${isWe?"color:#ea580c;":""}">${d}</div>`+
        `<div style="font-size:7px;${isWe?"color:#ea580c;":""}">${DAY_NAMES_AR[dow]}</div>`+
        `<div style="font-size:7px;font-weight:bold;color:${sc};">${shift}</div></th>`;
    }).join("");
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<style>
  @page{size:A3 landscape;margin:8mm;}
  body{font-family:'Arial',sans-serif;direction:rtl;margin:0;padding:0;}
  table{border-collapse:collapse;width:100%;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div style="text-align:center;margin-bottom:4px;border:2px solid #1d3557;padding:6px;border-radius:4px;">
  <div style="font-size:13px;font-weight:bold;">الجمهورية العراقية — وزارة النفط</div>
  <div style="font-size:12px;font-weight:bold;">شركة نفط البصرة</div>
  <div style="font-size:11px;">شعبة مستودع الفاو — قسم السيطرة والنظم</div>
  <div style="font-size:14px;font-weight:bold;margin-top:3px;">سجل الحضور والانصراف — ${tabTitle}</div>
  <div style="font-size:11px;">شهر: <strong>${monthLabel} ${tsYear}</strong> &nbsp;|&nbsp; رقم العمل: 3432960600</div>
</div>
<table>
<thead>
<tr style="background:#1d3557;color:#fff;">
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:20px;">ت</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:90px;">الاسم</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">الرقم</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:8px;width:28px;">نوع</th>
  ${dayHdrs}
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">الساعات</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">إجازة</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">غياب</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">عطل</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:50px;">ملاحظات</th>
</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
<div style="display:flex;justify-content:space-between;margin-top:20px;font-size:11px;">
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع المسؤول المباشر</div></div>
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع رئيس القسم</div></div>
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع مدير الشعبة</div></div>
</div>
</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-999px;left:-999px;width:1500px;height:1000px;border:none;";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 3000);
    }, 900);
    addToast("جارٍ طباعة الفورمة الرسمية", "info");
  };

  const getCellColor = (code) => TS_CODES_ALL[code]?.color || "";
  const isWeekendDay = (d) => { const dow = new Date(tsYear, tsMonth, d).getDay(); return dow===5||dow===6; };
  const dayIsToday = (d) => d===new Date().getDate()&&tsMonth===new Date().getMonth()&&tsYear===new Date().getFullYear();

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">سجل الحضور والانصراف (تايم شيت)</h1>
          <p className="text-sm text-secondary mt-0.5">رقم العمل: 3432960600 — مستودع الفاو — قسم السيطرة والنظم</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={tsMonth} onChange={e=>setTsMonth(+e.target.value)}
            className="text-sm border border-color rounded-lg px-2 py-1.5 bg-surface text-primary">
            {MONTHS_AR_TS.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <select value={tsYear} onChange={e=>setTsYear(+e.target.value)}
            className="text-sm border border-color rounded-lg px-2 py-1.5 bg-surface text-primary">
            {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fillWeekend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-orange-500 text-white hover:bg-orange-600">
            <Calendar size={14}/> ج/س صباحي
          </button>
          <button onClick={resetTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600">
            <X size={14}/> تصفير
          </button>
          <button onClick={()=>setShowLegend(v=>!v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-secondary">
            <AlertTriangle size={14}/> دليل الرموز
          </button>
          <button onClick={()=>{setShowExport(v=>!v);setShowImport(false);}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-700 text-white hover:bg-green-800">
            <FileCheck size={14}/> تصدير بيانات اكسل
          </button>
          <button onClick={exportOfficialForm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">
            <Printer size={14}/> طباعة / PDF
          </button>
          <button onClick={()=>{setShowImport(v=>!v);setShowExport(false);}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
            <Upload size={14}/> استيراد Excel
          </button>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="card rounded-xl p-4 border border-blue-200 bg-blue-50 space-y-3" dir="rtl">
          <h3 className="font-bold text-sm text-blue-800">استيراد بيانات الحضور من Excel</h3>
          <p className="text-xs text-blue-700">يقرأ الأعمدة E→AI (أيام 1-31) والصف السفلي (الساعات) حسب الرقم الوظيفي في العمود A</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-semibold text-blue-700 mb-1">من جهازك:</p>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importFromFile}/>
              <button onClick={()=>fileInputRef.current?.click()} disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                <Upload size={14}/> {importing ? "جارٍ الاستيراد..." : "اختر ملف Excel"}
              </button>
            </div>
            {gDrive?.isReady && (
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs font-semibold text-blue-700 mb-1">من Google Drive:</p>
                <div className="flex gap-2">
                  <input value={importDriveId} onChange={e=>setImportDriveId(e.target.value)}
                    placeholder="File ID من Drive"
                    className="flex-1 text-sm border border-blue-300 rounded-lg px-3 py-2 bg-white text-primary" dir="ltr"/>
                  <button onClick={importFromDrive} disabled={importing}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                    {importing ? "..." : "تنزيل"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export to template panel */}
      {showExport && (
        <div className="card rounded-xl p-4 border border-green-200 bg-green-50 space-y-3" dir="rtl">
          <h3 className="font-bold text-sm text-green-800">تصدير بيانات التايم شيت إلى قالب Excel</h3>
          <p className="text-xs text-green-700">اختر ملف Excel القالب الموجود على جهازك أو Drive — سيتم ملء بيانات الحضور فيه مع الحفاظ على تنسيقه الأصلي</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-semibold text-green-700 mb-1">من جهازك:</p>
              <input ref={exportFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={exportFromFile}/>
              <button onClick={()=>exportFileRef.current?.click()} disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">
                <FileCheck size={14}/> {exporting ? "جارٍ التصدير..." : "اختر قالب Excel"}
              </button>
            </div>
            {gDrive?.isReady && (
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs font-semibold text-green-700 mb-1">من Google Drive (File ID):</p>
                <div className="flex gap-2">
                  <input value={exportDriveId} onChange={e=>setExportDriveId(e.target.value)}
                    placeholder="File ID للقالب في Drive"
                    className="flex-1 text-sm border border-green-300 rounded-lg px-3 py-2 bg-white text-primary" dir="ltr"/>
                  <button onClick={exportFromDrive} disabled={exporting}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">
                    {exporting ? "..." : "تصدير"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="card rounded-xl p-4 border border-color">
          <h3 className="font-bold text-sm mb-3 text-primary">دليل رموز الحضور والانصراف</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(TS_CODES_ALL).map(([code,info])=>(
              <div key={code} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${info.color}`}>
                <span className="font-black text-sm w-5 text-center">{code}</span>
                <span>{info.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day 25 reminder banner */}
      {new Date().getDate() === 25 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <Bell size={18} className="text-amber-600 shrink-0"/>
          <p className="text-sm text-amber-800 font-medium">تذكير: اليوم الخامس والعشرون — يُرجى مراجعة وتصدير تقرير التايم شيت</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-color pb-0">
        {Object.entries(TAB_INFO).map(([key,info])=>(
          <button key={key} onClick={()=>{setActiveTab(key);setSearchEmp("");setEditCell(null);}}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-md transition-colors border-b-2 ${activeTab===key?"border-[#C87A2E] text-[#C87A2E] bg-[#FDF3E7]":"border-transparent text-secondary hover:text-primary"}`}>
            {info.label}
            <span className="mr-1.5 text-xs text-gray-400 ts-mono">({data[key]?.length||0})</span>
          </button>
        ))}
      </div>

      {/* Tab title + search + add */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{TAB_INFO[activeTab].title}</p>
          <p className="text-xs text-secondary">شهر {MONTHS_AR_TS[tsMonth]} {tsYear} — {daysInMonth} يوم</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400"/>
            <input value={searchEmp} onChange={e=>setSearchEmp(e.target.value)} placeholder="بحث عن موظف..."
              className="text-sm border border-color rounded-lg pr-8 pl-3 py-1.5 bg-surface text-primary w-48"/>
          </div>
          <button onClick={()=>addEmployee(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-[#C87A2E] text-white hover:bg-[#B06D27] transition-colors">
            <Plus size={14}/> إضافة
          </button>
          <button onClick={resetData} title="إعادة تعيين للبيانات الأصلية"
            className="p-1.5 rounded-lg text-sm btn-secondary text-red-500 hover:text-red-700">
            <Trash2 size={14}/>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="card rounded-xl border border-color overflow-hidden">
        <div className="overflow-x-auto" dir="rtl">
          <table className="text-xs border-collapse" style={{minWidth:`${200+daysInMonth*30+240}px`}} dir="rtl">
            <thead>
              <tr>
                <th className="border border-gray-200 px-2 py-2 text-center ts-header" style={{position:"sticky",right:0,zIndex:10,minWidth:"70px",fontSize:"11px"}}>الرقم</th>
                <th className="border border-gray-200 px-2 py-2 text-right ts-header" style={{position:"sticky",right:"70px",zIndex:10,minWidth:"150px"}}>الاسم</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header ts-mono" style={{minWidth:"34px",fontSize:"10px"}}>ح/ق</th>
                {days.map(d=>{
                  const dow = new Date(tsYear, tsMonth, d).getDay();
                  const isWe = dow===5||dow===6;
                  const shift = getShiftForDay(tsYear, tsMonth, d);
                  const todayFlag = dayIsToday(d);
                  return (
                    <th key={d} className={`border border-gray-200 py-1 text-center ts-mono ${todayFlag?"ts-today":isWe?"ts-we":"ts-header"}`} style={{minWidth:"30px"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:todayFlag?"#166534":isWe?"#C87A2E":undefined}}>{d}</div>
                      <div style={{fontSize:"8px",color:isWe?"#C87A2E":"#9ca3af",lineHeight:"1"}}>{DAY_NAMES_AR[dow]}</div>
                      <div style={{fontSize:"8px",fontWeight:"bold",color:SHIFT_TEXT_COLORS[shift]||"#374151",lineHeight:"1.2"}}>{shift}</div>
                    </th>
                  );
                })}
                <th className="border border-gray-200 px-1 py-2 text-center ts-header ts-mono" style={{minWidth:"52px",color:"#C87A2E"}}>ساعات</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#15803d"}}>إجازة</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#dc2626"}}>غياب</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#6b7280"}}>عطل</th>
                <th className="border border-gray-200 px-2 py-2 text-right ts-header" style={{minWidth:"100px"}}>ملاحظات</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"32px"}}></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, idx) => {
                const stats = calcTsStats(e);
                const bgBase = idx%2===0 ? "#ffffff" : "#FAFAF8";
                const codes = TAB_INFO[activeTab].codes;
                return (
                  <React.Fragment key={e.id}>
                    {/* A row - attendance codes */}
                    <tr>
                      <td rowSpan={2} className="border border-gray-200 text-center text-gray-500 align-middle ts-mono" style={{position:"sticky",right:0,zIndex:5,backgroundColor:bgBase,fontSize:"10px"}}>
                        {e.id}
                      </td>
                      <td rowSpan={2} className="border border-gray-200 px-1 text-right font-semibold align-middle" style={{position:"sticky",right:"70px",zIndex:5,backgroundColor:bgBase,maxWidth:"150px",fontSize:"11px"}}>
                        {e.name}
                        {e.movement && <span className="mr-1 text-[10px] text-blue-500 font-normal">({e.movement})</span>}
                      </td>
                      <td className="border border-gray-200 text-center font-black ts-mono" style={{backgroundColor:bgBase,fontSize:"10px",color:"#C87A2E"}}>أ</td>
                      {days.map(d=>{
                        const isWe = isWeekendDay(d);
                        const code = (e.days||{})[String(d)] || "";
                        const isEd = editCell?.empId===e.id && editCell?.day===d && editCell?.type==="code";
                        const cellBg = code ? "" : isWe ? "#fff7ed" : bgBase;
                        return (
                          <td key={d} className={`border border-gray-200 text-center cursor-pointer relative select-none ts-mono ${code?getCellColor(code):""}`}
                            style={{height:"22px",minWidth:"30px",backgroundColor:cellBg}}
                            onClick={()=>setEditCell({empId:e.id,day:d,type:"code",tabKey:activeTab})}>
                            <span className="font-bold" style={{fontSize:"11px"}}>{code}</span>
                            {isEd && <TsCodePicker codesArr={codes} current={code} onSelect={v=>{updateCell(activeTab,e.id,d,"code",v);setEditCell(null);}} onClose={()=>setEditCell(null)}/>}
                          </td>
                        );
                      })}
                      <td rowSpan={2} className="border border-gray-200 text-center font-bold ts-mono align-middle" style={{backgroundColor:bgBase,color:"#C87A2E"}}>{stats.totalHours||""}</td>
                      <td rowSpan={2} className="border border-gray-200 text-center ts-mono font-medium align-middle" style={{backgroundColor:bgBase,color:"#15803d"}}>{stats.leaveDays||""}</td>
                      <td rowSpan={2} className="border border-gray-200 text-center ts-mono font-medium align-middle" style={{backgroundColor:bgBase,color:"#dc2626"}}>{stats.absenceDays||""}</td>
                      <td rowSpan={2} className="border border-gray-200 text-center ts-mono font-medium align-middle" style={{backgroundColor:bgBase,color:"#6b7280"}}>{stats.restDays||""}</td>
                      <td rowSpan={2} className="border border-gray-200 px-1 align-middle" style={{backgroundColor:bgBase}}>
                        <input value={e.notes||""} onChange={ev=>updateNotes(activeTab,e.id,ev.target.value)}
                          className="w-full text-xs bg-transparent outline-none text-gray-500"
                          placeholder="ملاحظة..." style={{minWidth:"90px"}}/>
                      </td>
                      <td rowSpan={2} className="border border-gray-200 text-center align-middle" style={{backgroundColor:bgBase}}>
                        {activeTab==="drivers" && (
                          <button onClick={()=>editDriverName(activeTab,e.id,e.name)} className="text-blue-400 hover:text-blue-600 p-0.5 block mx-auto mb-0.5" title="تعديل الاسم"><Edit3 size={12}/></button>
                        )}
                        <button onClick={()=>deleteEmployee(activeTab,e.id,e.name)} className="text-red-400 hover:text-red-600 p-0.5 block mx-auto" title="حذف"><Trash2 size={12}/></button>
                      </td>
                    </tr>
                    {/* Q row - hours */}
                    <tr>
                      <td className="border border-gray-200 text-center font-black ts-mono" style={{backgroundColor:bgBase,fontSize:"10px",color:"#7c3aed"}}>ق</td>
                      {days.map(d=>{
                        const isWe = isWeekendDay(d);
                        const h = (e.hours||{})[String(d)];
                        const isEd = editCell?.empId===e.id && editCell?.day===d && editCell?.type==="hours";
                        const cellBg = h!=null ? "#f5f3ff" : isWe ? "#FFF3E6" : bgBase;
                        return (
                          <td key={d} className={`border border-gray-200 text-center cursor-pointer relative ts-mono ${h!=null?"text-purple-700":""}`}
                            style={{height:"20px",minWidth:"30px",backgroundColor:cellBg}}
                            onClick={()=>setEditCell({empId:e.id,day:d,type:"hours",tabKey:activeTab})}>
                            {isEd ? (
                              <input type="number" min="0" max="24" defaultValue={h??""} autoFocus
                                className="w-full h-full text-center bg-yellow-100 border-0 outline-none text-purple-700 font-bold"
                                style={{fontSize:"11px",width:"30px"}}
                                onBlur={ev=>{updateCell(activeTab,e.id,d,"hours",ev.target.value);setEditCell(null);}}
                                onKeyDown={ev=>{if(ev.key==="Enter"){updateCell(activeTab,e.id,d,"hours",ev.target.value);setEditCell(null);}else if(ev.key==="Escape")setEditCell(null);}}/>
                            ) : (
                              <span className="font-semibold" style={{fontSize:"11px"}}>{h!=null?h:""}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
              {employees.length === 0 && (
                <tr><td colSpan={9+daysInMonth} className="text-center py-8 text-secondary text-sm">لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:"إجمالي الموظفين", val:data[activeTab]?.length||0, color:"text-[#C87A2E]"},
          {label:"إجمالي ساعات العمل", val:(data[activeTab]||[]).reduce((s,e)=>s+calcTsStats(e).totalHours,0), color:"text-[#C87A2E]"},
          {label:"إجمالي أيام الإجازة", val:(data[activeTab]||[]).reduce((s,e)=>s+calcTsStats(e).leaveDays,0), color:"text-green-600"},
          {label:"إجمالي أيام الغياب", val:(data[activeTab]||[]).reduce((s,e)=>s+calcTsStats(e).absenceDays,0), color:"text-red-600"},
          {label:"إجمالي أيام العطل", val:(data[activeTab]||[]).reduce((s,e)=>s+calcTsStats(e).restDays,0), color:"text-gray-600"},
        ].map(s=>(
          <div key={s.label} className="card rounded-xl p-3 border border-color text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-secondary mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-secondary text-center">انقر على أي خلية في صف (أ) لتغيير رمز الحضور • انقر على أي خلية في صف (ق) لإدخال عدد الساعات • يتم الحفظ تلقائياً</p>
    </div>
  );
}

// ========== اللوحة الرئيسية ==========
function Dashboard({ emp, onLogout, dark, setDark }) {
  const [view, setView] = useState("home");
  const [allRequests, setAllRequests] = useState(() => storage.get("all_requests", []));
  const [employees, setEmployeesRaw] = useState(ACCOUNTS);

  // حمّل قائمة الموظفين من Firebase عند البداية (ACCOUNTS كاحتياطي)
  useEffect(() => {
    FirebaseAPI.loadAccounts().then(list => {
      if (list && list.length > 0) setEmployeesRaw(list);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // كل تغيير على employees يُحفظ تلقائياً في Firebase/accounts
  const setEmployees = useCallback((newList) => {
    setEmployeesRaw(newList);
    FirebaseAPI.saveAccounts(newList);
  }, []);
  const { isConnected } = useConnectionStatus();
  const smartAlerts = useSmartAlerts(employees);
  const confirm = useConfirm();
  const [showSearch, setShowSearch] = useState(false);
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004" || emp.username === "i.shawi";
  const isTimeSheetAdmin = isAdmin || emp.role === "attendance_admin";
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
    { id:"projects", label:"إدارة المشاريع", icon:<Briefcase size={17}/> },
    ...(isTimeSheetAdmin ? [{ id:"timesheet", label:"التايم شيت", icon:<Calendar size={17}/> }] : []),
  ];
  if (isAdmin) {
    menuItems.unshift({ id:"approvals", label:"الموافقات", icon:<ThumbsUp size={17}/>, badge:pendingCount });
    menuItems.unshift({ id:"employees", label:"الموظفين", icon:<Users size={17}/> });
    menuItems.unshift({ id:"admin_dashboard", label:"لوحة الإدارة", icon:<Shield size={17}/> });
  }

  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const gDrive = useGDrive();

  return (
    <div className="min-h-screen bg-main" dir="rtl">
      {showDriveSettings && <GDriveSettingsModal onClose={()=>setShowDriveSettings(false)}/>}
      {/* Google Drive quota warning bar */}
      <GDriveQuotaBar/>
      {/* Header */}
      <div className="header-bar px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C87A2E] flex items-center justify-center" style={{clipPath:"none"}}><span className="text-white font-bold text-xs tracking-widest" style={{fontFamily:"'JetBrains Mono',monospace"}}>BOC</span></div>
          <div><h1 className="font-bold">شركة نفط البصرة</h1><p className="text-xs text-secondary">شعبة مستودع الفاو</p></div>
        </div>
        <div className="flex items-center gap-3">
          {/* Google Drive Button */}
          <button onClick={()=>setShowDriveSettings(true)}
            title={gDrive.isReady ? `Google Drive متصل — ${gDrive.quota?.pct||0}% مستخدم` : "ربط Google Drive"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${gDrive.isReady ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "btn-secondary border-color text-secondary hover:text-primary"}`}>
            <span>☁️</span>
            <span className="hidden md:inline">{gDrive.isReady ? `Drive ${gDrive.quota?.pct||""}%` : "Drive"}</span>
            {gDrive.isReady && gDrive.quota?.pct >= GDRIVE_WARN_PCT && <span className="text-amber-500">⚠️</span>}
          </button>
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
        {/* Sidebar — rail محكم يتمدد عند hover */}
        <aside className="group/sb md:w-14 md:hover:w-60 sidebar border-l border-color min-h-screen py-3 px-1.5 md:overflow-hidden transition-[width] duration-200 ease-out">
          <nav className="space-y-0.5">
            {menuItems.map(item => (
              <div key={item.id} className="relative">
                <button onClick={()=>setView(item.id)} title={item.label}
                  className={`w-full flex items-center py-2.5 rounded-md text-sm font-medium transition-all ${view===item.id?"bg-[#C87A2E] text-white":"text-secondary hover:bg-hover"}`}>
                  <span className="shrink-0 w-11 flex items-center justify-center">{item.icon}</span>
                  <span className="whitespace-nowrap overflow-hidden max-w-full md:max-w-0 md:group-hover/sb:max-w-[180px] transition-[max-width] duration-150 pr-1">{item.label}</span>
                  {item.badge>0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full mr-auto ml-1.5 shrink-0 whitespace-nowrap overflow-hidden max-w-full md:max-w-0 md:group-hover/sb:max-w-[40px] transition-[max-width] duration-150">{item.badge}</span>}
                </button>
                {item.badge>0 && <span className="hidden md:block md:group-hover/sb:hidden absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full pointer-events-none"/>}
              </div>
            ))}
          </nav>
          {smartAlerts.length > 0 && (
            <div className="mt-4 mx-0.5 p-3 bg-amber-50 rounded-md border border-amber-200 overflow-hidden max-h-[120px] md:max-h-0 md:group-hover/sb:max-h-[120px] transition-[max-height] duration-200">
              <p className="text-[10px] font-bold text-amber-800 mb-1 whitespace-nowrap">تنبيهات ذكية</p>
              {smartAlerts.slice(0,3).map(a=><p key={a.id} className="text-[10px] text-amber-700 mt-1 truncate">{a.msg}</p>)}
            </div>
          )}
          <div className="mt-3 mx-0.5 p-3 bg-hover rounded-md text-[10px] overflow-hidden max-h-16 md:max-h-0 md:group-hover/sb:max-h-16 transition-[max-height] duration-200">
            <p className="font-bold whitespace-nowrap">{isConnected?"متصل بالخادم":"وضع محلي"}</p>
          </div>
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
          {view==="inventory" && <InventorySystem emp={emp} isAdmin={isAdmin}/>}
          {view==="furniture" && <FurnitureInventory emp={emp} isAdmin={isAdmin}/>}
          {view==="maint_equipment" && <EquipmentMaintenance emp={emp} isAdmin={isAdmin}/>}
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
          {view==="projects" && <ProjectManagementPage emp={emp}/>}
          {view==="timesheet" && isTimeSheetAdmin && <TsErrorBoundary><TimeSheetPage emp={emp}/></TsErrorBoundary>}
          {view==="admin_dashboard" && isAdmin && <AdminDashboard emp={emp} employees={employees} setEmployees={setEmployees}/>}
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
    .bg-main { background: ${dark?"#0D1117":"#F4F4F0"}; }
    .card {
      background: ${dark?"#161B22":"#ffffff"};
      color: ${dark?"#e2e8f0":"#1C1C1C"};
      box-shadow: ${dark?
        "0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)":
        "0 0 0 1px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)"};
    }
    .header-bar { background: ${dark?"#0D1117":"#ffffff"}; border-bottom: 1px solid ${dark?"#30363D":"#E4E2DC"}; }
    .sidebar { background: ${dark?"#0D1117":"#F4F4F0"}; }
    .input { background: ${dark?"#0D1117":"#ffffff"}; border: 1px solid ${dark?"#30363D":"#E4E2DC"}; color: ${dark?"#e2e8f0":"#1C1C1C"}; border-radius:6px; }
    .input:focus { border-color:#C87A2E; outline:none; }
    .input::placeholder { color: ${dark?"#6b7280":"#a8a29e"}; }
    .btn-secondary { background: ${dark?"#161B22":"#ffffff"}; color: ${dark?"#9ca3af":"#575553"}; }
    .bg-hover { background: ${dark?"#1a222e":"#EDEDE9"}; }
    .text-secondary { color: ${dark?"#6b7280":"#787774"}; }
    .text-primary { color: ${dark?"#e2e8f0":"#1C1C1C"}; }
    .border-color { border-color: ${dark?"#30363D":"#E4E2DC"} !important; }
    .bg-surface { background: ${dark?"#0D1117":"#ffffff"}; }
    select option { background: ${dark?"#161B22":"#ffffff"}; color: ${dark?"#e2e8f0":"#1C1C1C"}; }
    * { transition: background-color 0.15s, border-color 0.15s, color 0.1s; }
    @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    .toast-item { animation: toastIn 0.2s cubic-bezier(0.32,0.72,0,1); }
    @keyframes shimmer { from { background-position:-200% 0; } to { background-position:200% 0; } }
    .skeleton { background: linear-gradient(90deg,${dark?"#1e2a38 25%,#273444 50%,#1e2a38 75%":"#EDEDE9 25%,#F4F4F0 50%,#EDEDE9 75%"}); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    .ts-mono { font-family:'JetBrains Mono','IBM Plex Mono',monospace; }
    .ts-header { background:${dark?"#1a2232":"#F0EDE6"} !important; }
    .ts-we { background:${dark?"#2a1f0a":"#FFF3E6"} !important; }
    .ts-today { background:${dark?"#1a2d1a":"#E6F5E6"} !important; }
    /* ── الأزرار — تحويل الأزرق إلى عنبري عالمياً ── */
    button[class*="bg-blue-600"] { background-color: #C87A2E !important; }
    button[class*="bg-blue-700"] { background-color: #B06D27 !important; }
    button[class*="bg-indigo-600"] { background-color: #C87A2E !important; }
    button[class*="bg-indigo-700"] { background-color: #9A5F1F !important; }
    button[class*="hover:bg-blue-700"]:hover { background-color: #B06D27 !important; }
    button[class*="hover:bg-blue-600"]:hover { background-color: #C87A2E !important; }
    button[class*="hover:bg-indigo-800"]:hover { background-color: #875419 !important; }
    button[class*="rounded-xl"] { border-radius: 6px !important; }
    button[class*="rounded-2xl"] { border-radius: 8px !important; }
    button:active:not(:disabled) { transform: scale(0.98); transition: transform 0.1s; }
  `;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <GDriveProvider>
          <style>{style}</style>
          {user
            ? <Dashboard emp={user} onLogout={()=>{recordLogoutFn(user?.id);sessionStorage.clear();setUser(null);}} dark={dark} setDark={setDark}/>
            : <LoginScreen onLogin={setUser} dark={dark}/>
          }
        </GDriveProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
