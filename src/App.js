import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  LogOut, Shield, Eye, EyeOff, AlertCircle, Home, User,
  CheckCircle, Wifi, WifiOff, FileText, Clock, Calendar,
  Bell, ThumbsUp, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star,
  Search, Moon, Sun, MessageSquare,
  CheckSquare, AlertTriangle, ChevronLeft,
  Wrench, Box, TrendingUp, Heart,
  Briefcase
} from "lucide-react";
import {
  FIREBASE_URL, ACCOUNTS, DEFAULT_PASSWORD, LOW_STOCK_THRESHOLD,
  INITIAL_EQUIPMENT, INITIAL_MAINT_SPARE_PARTS,
  VIEW_LABELS, GDRIVE_WARN_PCT, GDRIVE_CRIT_PCT,
} from "./constants";
import { storage, passStore, hashPassword, isHash } from "./utils";
import { FirebaseAPI } from "./firebase";
import { GDriveAPI, GDriveContext, GDriveProvider, useGDrive } from "./gdrive";
import { useToast, useConfirm, ToastProvider, ConfirmProvider } from "./contexts";
import { EmpPopover, PrintButton } from "./components/Shared";
import { PERMISSIONS_DEF, BUILT_IN_ROLES, getEmpStatus, setEmpStatus, hasPermission } from "./permissions";

const LazyTimeSheetPage = React.lazy(() => import('./pages/TimeSheetPage'));
const LazyEmployeeManager = React.lazy(() => import('./pages/EmployeeManagerPage'));
const LazyInventoryPage = React.lazy(() => import('./pages/InventoryPage'));
const LazyFurnitureInventory = React.lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.FurnitureInventory })));
const LazyAttendanceSystem = React.lazy(() => import('./pages/WorkplacePage'));
const LazyTrainingSystem = React.lazy(() => import('./pages/WorkplacePage').then(m => ({ default: m.TrainingSystem })));
const LazyTasksSystem = React.lazy(() => import('./pages/WorkplacePage').then(m => ({ default: m.TasksSystem })));
const LazyInternalChat = React.lazy(() => import('./pages/WorkplacePage').then(m => ({ default: m.InternalChat })));
const LazyEvaluationSystem = React.lazy(() => import('./pages/WorkplacePage').then(m => ({ default: m.EvaluationSystem })));
const LazyAnalyticsDashboard = React.lazy(() => import('./pages/AnalyticsPage'));
const LazyChangePasswordPage = React.lazy(() => import('./pages/UserPages'));
const LazyRequestsPage = React.lazy(() => import('./pages/UserPages').then(m => ({ default: m.RequestsPage })));
const LazyApprovalsPage = React.lazy(() => import('./pages/UserPages').then(m => ({ default: m.ApprovalsPage })));
const LazyNotificationsPage = React.lazy(() => import('./pages/UserPages').then(m => ({ default: m.NotificationsPage })));
const LazyAuditLogPage = React.lazy(() => import('./pages/UserPages').then(m => ({ default: m.AuditLogPage })));


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
          {view==="analytics" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyAnalyticsDashboard employees={employees} allRequests={allRequests}/>
            </React.Suspense>
          )}
          {view==="requests" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyRequestsPage emp={emp}/>
            </React.Suspense>
          )}
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
          {view==="notifications" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyNotificationsPage emp={emp}/>
            </React.Suspense>
          )}
          {view==="audit" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyAuditLogPage/>
            </React.Suspense>
          )}
          {view==="changepass" && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyChangePasswordPage emp={emp} onLogout={onLogout}/>
            </React.Suspense>
          )}
          {view==="employees" && isAdmin && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyEmployeeManager employees={employees} setEmployees={setEmployees}/>
            </React.Suspense>
          )}
          {view==="approvals" && isAdmin && (
            <React.Suspense fallback={<div className="p-8 text-center text-secondary text-sm">جارٍ التحميل...</div>}>
              <LazyApprovalsPage emp={emp}/>
            </React.Suspense>
          )}
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
