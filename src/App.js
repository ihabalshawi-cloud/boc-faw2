import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { useToast, useConfirm, ToastProvider, ConfirmProvider } from "./contexts";
import { EmpPopover, PrintButton } from "./components/Shared";
import { PERMISSIONS_DEF, BUILT_IN_ROLES, getEmpStatus, setEmpStatus, hasPermission } from "./permissions";
import { SVGBarChart, SVGPieChart } from "./components/Charts";

const LazyTimeSheetPage = React.lazy(() => import('./pages/TimeSheetPage'));
const LazyEmployeeManager = React.lazy(() => import('./pages/EmployeeManagerPage'));
const LazyInventoryPage = React.lazy(() => import('./pages/InventoryPage'));
const LazyFurnitureInventory = React.lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.FurnitureInventory })));
const LazyAttendanceSystem = React.lazy(() => import('./pages/WorkplacePage'));
const LazyTrainingSystem = React.lazy(() => import('./pages/WorkplacePage').then(m => ({ default: m.TrainingSystem })));
const LazyTasksSystem = React.lazy(() => import('./pages/WorkplacePage').then(m => ({ default: m.TasksSystem })));
const LazyInternalChat = React.lazy(() => import('./pages/WorkplacePage').then(m => ({ default: m.InternalChat })));
const LazyEvaluationSystem = React.lazy(() => import('./pages/WorkplacePage').then(m => ({ default: m.EvaluationSystem })));

const LazyAdminDashboard = React.lazy(() => import('./pages/AdminDashboardPage'));

const LazyEquipmentPage = React.lazy(() => import('./pages/EquipmentPage'));
const LazyMaintenanceParts = React.lazy(() => import('./pages/EquipmentPage').then(m => ({ default: m.MaintenanceParts })));
const LazyMaintenanceAnalytics = React.lazy(() => import('./pages/EquipmentPage').then(m => ({ default: m.MaintenanceAnalytics })));
const LazyHealthInsurancePage = React.lazy(() => import('./pages/HealthInsurancePage'));
const LazyLeaveFormsPage = React.lazy(() => import('./pages/LeaveFormsPage'));
const LazyProjectManagementPage = React.lazy(() => import('./pages/ProjectManagementPage'));


// ========== نظام الإشعارات الفورية ==========
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
function AnalyticsDashboard({ employees, allRequests }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const { monthlyData, typeData, condData, deptData, kpis } = useMemo(() => {
    const invItems = storage.get("inventory_items", []);

    const monthlyData = MONTHS_AR.slice(0, currentMonth+1).map((month, i) => {
      const monthReqs = allRequests.filter(r => {
        const d = new Date(r.submittedAt);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });
      return { name: month.slice(0,3), "موافق": monthReqs.filter(r=>r.status==="موافق عليها").length, "مرفوض": monthReqs.filter(r=>r.status==="مرفوضة").length, "معلق": monthReqs.filter(r=>r.status==="بانتظار المراجعة").length };
    });

    const typeData = Object.entries(LEAVE_TYPES).map(([k, v]) => ({
      name: v.label.replace("إجازة ",""), value: allRequests.filter(r => r.type === k).length
    })).filter(d => d.value > 0);

    const condData = ITEM_CONDITIONS.map(c => ({ name: c, value: invItems.filter(i => i.condition === c).length })).filter(d => d.value > 0);

    const deptData = [...new Set(employees.map(e=>e.dept))].map(d => ({
      name: d.replace("قسم ","").replace("شعبة ",""), value: employees.filter(e=>e.dept===d).length
    }));

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

    return { monthlyData, typeData, condData, deptData, kpis };
  }, [employees, allRequests, currentMonth, currentYear]);

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
// ========== ثوابت إدارة المشاريع ==========

// ========== التايم شيت ==========
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
          {view==="attendance" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyAttendanceSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
            </React.Suspense>
          )}
          {view==="training" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyTrainingSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
            </React.Suspense>
          )}
          {view==="tasks" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyTasksSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
            </React.Suspense>
          )}
          {view==="inventory" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyInventoryPage emp={emp} isAdmin={isAdmin}/>
            </React.Suspense>
          )}
          {view==="furniture" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyFurnitureInventory emp={emp} isAdmin={isAdmin}/>
            </React.Suspense>
          )}
          {view==="maint_equipment" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyEquipmentPage emp={emp} isAdmin={isAdmin}/>
            </React.Suspense>
          )}
          {view==="maint_parts" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyMaintenanceParts/>
            </React.Suspense>
          )}
          {view==="maint_reports" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyMaintenanceAnalytics/>
            </React.Suspense>
          )}
          {view==="chat" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyInternalChat emp={emp} isConnected={isConnected}/>
            </React.Suspense>
          )}
          {view==="evaluation" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyEvaluationSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
            </React.Suspense>
          )}
          {view==="notifications" && <NotificationsPage emp={emp}/>}
          {view==="audit" && <AuditLogPage/>}
          {view==="changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout}/>}
          {view==="employees" && isAdmin && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyEmployeeManager employees={employees} setEmployees={setEmployees}/>
            </React.Suspense>
          )}
          {view==="approvals" && isAdmin && <ApprovalsPage emp={emp}/>}
          {view==="health_insurance" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyHealthInsurancePage emp={emp}/>
            </React.Suspense>
          )}
          {view==="leave_forms" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyLeaveFormsPage emp={emp}/>
            </React.Suspense>
          )}
          {view==="projects" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyProjectManagementPage emp={emp}/>
            </React.Suspense>
          )}
          {view==="timesheet" && isTimeSheetAdmin && (
            <TsErrorBoundary>
              <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ تحميل التايم شيت...</div>}>
                <LazyTimeSheetPage emp={emp}/>
              </React.Suspense>
            </TsErrorBoundary>
          )}
          {view==="admin_dashboard" && isAdmin && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyAdminDashboard emp={emp} employees={employees} setEmployees={setEmployees}/>
            </React.Suspense>
          )}
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
