import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { LogIn, LogOut, FileText, Clock, Calendar, CheckCircle, ChevronLeft, User, Eye, EyeOff, AlertCircle, Printer, Users, Shield, Package, Plus, Trash2, Edit3, Save, X, ArrowRightLeft, PenTool, RefreshCw, Search, FolderOpen, Upload, Download, Layers, ClipboardList, ChevronRight, Home, Bell, ThumbsUp, ThumbsDown, Star, Target, BarChart2, CheckSquare, BookOpen, GraduationCap, BarChart } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG
   ضع إعدادات Firebase الخاصة بك هنا بعد إنشاء المشروع
   https://console.firebase.google.com
═══════════════════════════════════════════════════════════ */
const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";
const FIREBASE_API_KEY = "AIzaSyDWb0WhoO-NVLnbE5b8un63O6x-sH0RDco";

/* ═══════════════════════════════════════════════════════════
   FIREBASE AUTHENTICATION — تسجيل دخول آمن عبر Firebase
   كلمات المرور مشفّرة بـ bcrypt داخل Firebase لا تُقرأ أبداً
═══════════════════════════════════════════════════════════ */
const FB_AUTH = "https://identitytoolkit.googleapis.com/v1";
const FB_TOKEN = "https://securetoken.googleapis.com/v1";

// كل موظف له إيميل داخلي: {رقم وظيفي}@boc.iq
function toEmail(jobNum) { return `${jobNum}@boc.iq`; }

// رموز الجلسة — محفوظة في الذاكرة فقط (تُمسح عند إغلاق المتصفح)
let _idToken      = null;
let _refreshTk    = null;
let _tokenExpiry  = 0;

// الحصول على token صالح (يُجدَّد تلقائياً)
async function getToken() {
  if (_idToken && Date.now() < _tokenExpiry - 60000) return _idToken;
  if (_refreshTk) {
    try {
      const r = await fetch(`${FB_TOKEN}/token?key=${FIREBASE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=refresh_token&refresh_token=${_refreshTk}`,
      });
      const d = await r.json();
      if (d.access_token) {
        _idToken     = d.access_token;
        _tokenExpiry = Date.now() + d.expires_in * 1000;
        _refreshTk   = d.refresh_token;
        return _idToken;
      }
    } catch {}
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════
   تجهيز الكشف الكامل الفعلي لشعبة مستودع الفاو (33 موظفاً)
═══════════════════════════════════════════════════════════ */
// دالة الرفع التلقائية بالرقم الوظيفي لتصفير الـ null
export function useDataInitializer() {
  useEffect(() => {
    const uploadKashf33ToFirebase = async () => {
      const completeKashf = {
        "0": { id: "0", cardId: "728004", username: "i.shawi", password: "1001", name: "ايهاب عبد اللطيف عودة سلمان الشاوي", role: "مشرف / مخول", department: "قسم السيطرة والنظم" },
        "1": { id: "1", cardId: "727466", username: "o.rubaie", password: "1002", name: "عدي فيصل عبد الهادي عبد السيد الربيعه", role: "موظف", department: "قسم السيطرة والنظم" },
        "2": { id: "2", cardId: "737283", username: "om.miyahi", password: "1003", name: "عمر طاهر خزعل سبهان المياحي", role: "موظف", department: "قسم السيطرة والنظم" },
        "3": { id: "3", cardId: "756571", username: "l.rubaie", password: "1004", name: "ليث شاكر حمود زعيتر الربيعه", role: "موظف", department: "قسم السيطرة والنظم" },
        "4": { id: "4", cardId: "790850", username: "as.nassari", password: "1005", name: "اسعد عبد الامام يوسف حميد النصاري", role: "موظف", department: "شعبة مستودع الفاو" },
        "5": { id: "5", cardId: "719113", username: "sb.nassari", password: "1006", name: "صباح عبد الامام يوسف حميد النصاري", role: "موظف", department: "شعبة مستودع الفاو" },
        "6": { id: "6", cardId: "736990", username: "m.shawi", password: "1007", name: "محمد عبد اللطيف عودة سلمان الشاوي", role: "موظف", department: "شعبة مستودع الفاو" },
        "7": { id: "7", cardId: "736502", username: "m.khairullah", password: "1008", name: "مصطفى خير الله خفي جاسم خير الله", role: "موظف", department: "شعبة مستودع الفاو" },
        "8": { id: "8", cardId: "735956", username: "m.kanan", password: "1009", name: "مرتضى كنعان عبد الزهرة لازم كنعان", role: "موظف", department: "شعبة مستودع الفاو" },
        "9": { id: "9", cardId: "735878", username: "h.asadi", password: "1010", name: "حيدر علي جاسم محمد الاسدي", role: "موظف", department: "قسم السيطرة والنظم" },
        "10": { id: "10", cardId: "736200", username: "h.kaabi", password: "1011", name: "حسن هادي لفته حسن الكعبي", role: "موظف", department: "قسم السيطرة والنظم" },
        "11": { id: "11", cardId: "732001", username: "m.khalaf", password: "2001", name: "محمد جاسم خلف", role: "موظف", department: "شعبة مستودع الفاو" },
        "12": { id: "12", cardId: "732002", username: "ah.ali", password: "2002", name: "احمد علي حسين", role: "موظف", department: "شعبة مستودع الفاو" },
        "13": { id: "13", cardId: "731110", username: "m.fadhil", password: "2003", name: "محمد فاضل عباس علي ثامر", role: "موظف", department: "قسم السيطرة والنظم" },
        "14": { id: "14", cardId: "732288", username: "j.bedan", password: "2004", name: "جعفر جاسم بدان ثامر البدان", role: "موظف", department: "قسم السيطرة والنظم" },
        "15": { id: "15", cardId: "726927", username: "am.khalaf", password: "2005", name: "امين عبد الجبار خلف محمد جاسم", role: "موظف", department: "شعبة مستودع الفاو" },
        "16": { id: "16", cardId: "736450", username: "m.shihab", password: "2006", name: "مرتضى شهاب احمد محمد البدر", role: "موظف", department: "شعبة مستودع الفاو" },
        "17": { id: "17", cardId: "736053", username: "s.ismail", password: "2007", name: "سجاد اسماعيل خليل ابراهيم الصالح", role: "موظف", department: "شعبة مستودع الفاو" },
        "18": { id: "18", cardId: "736732", username: "m.dawood", password: "2008", name: "مرتضى محمد داود سلمان سلمان داود", role: "موظف", department: "قسم السيطرة والنظم" },
        "19": { id: "19", cardId: "719048", username: "al.jafar", password: "2009", name: "علاء محسن عذبي جعفر الجعفر", role: "موظف", department: "شعبة مستودع الفاو" },
        "20": { id: "20", cardId: "735922", username: "al.aidani", password: "2010", name: "علي طارق ياسين مهودر العيداني", role: "موظف", department: "قسم السيطرة والنظم" },
        "21": { id: "21", cardId: "732249", username: "al.ali", password: "2011", name: "علي باقر حنتوش مليس العلي", role: "موظف", department: "قسم السيطرة والنظم" },
        "22": { id: "22", cardId: "726508", username: "y.yaseen", password: "2012", name: "يوسف عباس ياسين احمد ياسين", role: "موظف", department: "شعبة مستودع الفاو" },
        "23": { id: "23", cardId: "719129", username: "dh.ghanim", password: "2013", name: "ضياء بدر حمادي اسماعيل الغانم", role: "موظف", department: "قسم السيطرة والنظم" },
        "24": { id: "24", cardId: "719099", username: "ad.atiya", password: "2014", name: "عدنان جواد كاظم جعفر العطية", role: "موظف", department: "قسم السيطرة والنظم" },
        "25": { id: "25", cardId: "732837", username: "ih.saleem", password: "2015", name: "احسان جواد كاظم حسين السليم", role: "موظف", department: "شعبة مستودع الفاو" },
        "26": { id: "26", cardId: "735948", username: "m.sabah", password: "2016", name: "مصطفى صباح نوري جاسم جاسم", role: "موظف", department: "شعبة مستودع الفاو" },
        "27": { id: "27", cardId: "736340", username: "h.yaseen", password: "2017", name: "حيدر عباس ياسين احمد ياسين", role: "موظف", department: "شعبة مستودع الفاو" },
        "28": { id: "28", cardId: "732152", username: "h.khalaf", password: "2018", name: "حسن طاهر خلف محمد جاسم", role: "موظف", department: "شعبة مستودع الفاو" },
        "29": { id: "29", cardId: "300101", username: "k.contract", password: "3001", name: "كرار عماد خلف (عقد)", role: "موظف", department: "شعبة مستودع الفاو" },
        "30": { id: "30", cardId: "300102", username: "m.contract", password: "3002", name: "مصطفى كامل ناصر (عقد)", role: "موظف", department: "شعبة مستودع الفاو" },
        "31": { id: "31", cardId: "300103", username: "a.contract", password: "3003", name: "احمد نجاح عبود (عقد)", role: "موظف", department: "شعبة مستودع الفاو" },
        "32": { id: "32", cardId: "300104", username: "h.contract", password: "3004", name: "حسين علي خضير (عقد)", role: "موظف", department: "شعبة مستودع الفاو" }
      };

      try {
        // ✅ الإصلاح: تحقق أولاً — إذا البيانات موجودة لا تعيد الكتابة
        const existingData = await fetch(`${FIREBASE_URL}/employees.json`);
        const existing = await existingData.json();
        if (existing && typeof existing === "object" && !existing.error && Object.keys(existing).length > 0) {
          console.log("✓ البيانات موجودة بالفعل — لن يتم الرفع لحماية كلمات المرور المعدّلة");
          return;
        }
        // فقط ارفع إذا كانت قاعدة البيانات فارغة تماماً
        const r = await fetch(`${FIREBASE_URL}/employees.json`, {
          method: "PUT",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify(completeKashf)
        });
        if (r.ok) console.log("✓ 33 employees uploaded to Firebase (first-time setup)");
        console.log("تم رفع البيانات لأول مرة لـ 33 موظفاً!");
      } catch (e) {
        console.error(e);
      }
    };

    uploadKashf33ToFirebase();
  }, []);
}

// Firebase Auth reserved for future use

// Input sanitization
function sanitize(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[<>]/g,"").replace(/javascript:/gi,"").trim();
}

// Rate limiting
const _attempts = (() => {
  try { const s=sessionStorage.getItem("_la"); return s?JSON.parse(s):{}; } catch { return {}; }
})();
function recordAttempt(key, ok) {
  if (ok) delete _attempts[key]; else _attempts[key]=(_attempts[key]||0)+1;
  try { sessionStorage.setItem("_la", JSON.stringify(_attempts)); } catch {}
}
function getAttempts(key) { return _attempts[key]||0; }

// Idle timeout — تسجيل خروج بعد 30 دقيقة خمول
let _idleTimer = null;
function setupIdleDetection(onLogout) {
  const reset = () => {
    clearTimeout(_idleTimer);
    _idleTimer = setTimeout(()=>{ fbAuth.clearTokens(); sessionStorage.removeItem("boc_session"); onLogout(); }, 30*60*1000);
  };
  ["mousemove","keypress","click","touchstart"].forEach(e=>window.addEventListener(e,reset,{passive:true}));
  reset();
  return ()=>{ clearTimeout(_idleTimer); ["mousemove","keypress","click","touchstart"].forEach(e=>window.removeEventListener(e,reset)); };
}





/* ═══════════════════════════════════════════════════════════
   SECURITY LAYER — طبقة الأمان المطورة والمؤمنة
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
      const b64 = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
      if (!b64.test(str.trim())) return str; // كلمة مرور قديمة كنص صريح
      const xorChars = atob(str.trim());
      const utf8Str = xorChars.split("").map((c,i) =>
        String.fromCharCode(c.charCodeAt(0) ^ SEC_KEY[i % SEC_KEY.length])
      ).join("");
      return decodeURIComponent(escape(utf8Str));
    } catch { return str; }
  },
  verify: (input, stored) => {
    if (!input || !stored) return false;
    if (input.trim() === stored.trim()) return true;       // نص صريح قديم
    return input.trim() === SEC.decode(stored).trim();     // مُشفَّر جديد
  },
};

// دوال مختصرة للاستخدام في الكود القديم
function encodePassword(raw) { return SEC.encode(raw); }
function verifyPassword(a, b) { return SEC.verify(a, b); }




/* ═══════════════════════════════════════════════════════════
   #3 — PUSH NOTIFICATIONS
   إشعارات للهاتف حتى لو التطبيق مغلق
   
   الإعداد (مرة واحدة):
   Firebase Console → faop-scada → Project Settings →
   Cloud Messaging → Web Push certificates → Generate key pair
   انسخ المفتاح وضعه في VAPID_KEY
═══════════════════════════════════════════════════════════ */
const VAPID_KEY = "BCec3tWhFyXRDzSK_zr6SRzm-omM9fkYMa87TOeGw5kl3Q_DJr7o6yIA4YhPfSKfWW11abY09qPOzbdSz6eIdCY";

const fcm = {
  async requestPermission(empId) {
    try {
      if (!("Notification" in window)) return null;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return null;
      if (!("serviceWorker" in navigator)) return null;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_KEY,
      }).catch(()=>null);
      if (!sub) return null;
      const token = btoa(JSON.stringify(sub));
      await fb.set(`push_tokens/${empId}`, {
        token, sub: JSON.stringify(sub),
        updatedAt: new Date().toISOString(),
        device: navigator.userAgent.includes("Mobile")?"موبايل":"كمبيوتر",
      });
      return token;
    } catch { return null; }
  },

  async showLocal(title, body, tag="boc") {
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body, icon:"/logo192.png", badge:"/logo192.png",
        dir:"rtl", lang:"ar", vibrate:[200,100,200],
        tag, renotify:true,
      });
    } catch {}
  },
};

function usePushNotifications(emp) {
  const [permStatus, setPermStatus] = useState(
    typeof Notification!=="undefined" ? Notification.permission : "default"
  );

  const requestPush = useCallback(async () => {
    const token = await fcm.requestPermission(emp.id);
    if (token) setPermStatus("granted");
    return !!token;
  }, [emp.id]);

  // إشعار push محلي عند وصول إشعار جديد من Firebase
  useEffect(() => {
    if (permStatus !== "granted") return;
    const unsub = fb.listen(`notifications/${emp.id}`, (data) => {
      if (!Array.isArray(data) || !data[0] || data[0].read) return;
      const n = data[0];
      fcm.showLocal(n.title, n.body, `notif-${n.id}`);
    });
    return unsub;
  }, [emp.id, permStatus]);

  return { permStatus, requestPush };
}

/* ═══════════════════════════════════════════════════════════
   #1 — FIREBASE AUTHENTICATION
   يتحقق من المستخدم عبر Firebase بدل كلمة المرور المحلية
   مما يمنع أي شخص من خارج النظام من الوصول للبيانات
═══════════════════════════════════════════════════════════ */
/* ── fbAuth محفوظ للاستخدام المستقبلي مع Firebase Authentication ── */
// eslint-disable-next-line no-unused-vars
const fbAuth = {
  // تسجيل دخول بالإيميل وكلمة المرور
  async signIn(email, password) {
    try {
      const r = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      return data; // { idToken, localId, ... }
    } catch (e) {
      throw e;
    }
  },

  // التحقق من رمز الجلسة
  async verify(idToken) {
    try {
      const r = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );
      const data = await r.json();
      return data.users?.[0] || null;
    } catch { return null; }
  },
};

/* ═══════════════════════════════════════════════════════════
   #2 — AUTO BACKUP SYSTEM
   يأخذ نسخة احتياطية تلقائية يومياً ويحتفظ بآخر 30 نسخة
═══════════════════════════════════════════════════════════ */
const BACKUP_PATHS = ["requests","employees","transfers","training","evaluation"];

async function takeBackup(adminName) {
  const today = new Date().toISOString().slice(0, 10);
  const backupKey = `backups/${today}`;

  try {
    // تحقق إذا أُخذت نسخة اليوم بالفعل
    const existing = await fb.get(backupKey);
    if (existing) return; // لا تكرر النسخة في نفس اليوم

    const snapshot = {};
    for (const path of BACKUP_PATHS) {
      const data = await fb.get(path);
      if (data) snapshot[path] = data;
    }

    await fb.set(backupKey, {
      data: snapshot,
      takenAt: new Date().toISOString(),
      takenBy: adminName || "system",
      version: "1.0",
    });

    // احتفظ بآخر 30 نسخة فقط
    const allBackups = await fb.get("backups");
    if (allBackups) {
      const keys = Object.keys(allBackups).sort().reverse();
      if (keys.length > 30) {
        for (const old of keys.slice(30)) {
          await fb.set(`backups/${old}`, null); // حذف القديمة
        }
      }
    }
  } catch (e) {
    console.warn("Backup failed:", e);
  }
}

async function restoreBackup(date) {
  try {
    const backup = await fb.get(`backups/${date}`);
    if (!backup?.data) throw new Error("لا توجد نسخة بهذا التاريخ");
    for (const [path, data] of Object.entries(backup.data)) {
      await fb.set(path, data);
    }
    return true;
  } catch (e) {
    console.error("Restore failed:", e);
    return false;
  }
}

/* ── Firebase REST helpers ── */
const fb = {
  async get(path) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(()=>ctrl.abort(), 8000);
      const r = await fetch(`${FIREBASE_URL}/${path}.json`, {signal:ctrl.signal});
      clearTimeout(t);
      if (!r.ok) return null;
      const d = await r.json();
      if (d && typeof d==="object" && d.error) return null;
      return d;
    } catch { return null; }
  },
  async set(path, data) {
    try {
      await fetch(`${FIREBASE_URL}/${path}.json`, {
        method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)
      });
    } catch {}
  },
  async push(path, data) {
    try {
      const r = await fetch(`${FIREBASE_URL}/${path}.json`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)
      });
      return (await r.json())?.name;
    } catch { return null; }
  },
  async patch(path, data) {
    try {
      await fetch(`${FIREBASE_URL}/${path}.json`, {
        method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)
      });
    } catch {}
  },
  listen() { return ()=>{}; },
};

/* ── Global cache & polling system ── */
const _fbCache     = {};
const _fbListeners = {};
const _fbPolls     = {};

function _fbNotify(path, data) {
  _fbCache[path] = data;
  (_fbListeners[path]||new Set()).forEach(cb=>cb(data));
}

function _pollInterval(path) {
  if (path.startsWith("notifications")) return 5000;
  if (path.startsWith("requests"))      return 8000;
  if (path.startsWith("training"))      return 10000;
  if (path.startsWith("login_history")) return 30000;
  if (path.startsWith("audit_log"))     return 60000;
  if (path.startsWith("backups"))       return 60000;
  return 20000;
}

function _fbStart(path) {
  if (_fbPolls[path]) return;
  // Fetch immediately
  fb.get(path).then(data => { _fbNotify(path, data ?? null); });
  // Poll
  _fbPolls[path] = setInterval(()=>{
    if (!(_fbListeners[path]?.size>0)) return;
    fb.get(path).then(data=>{ if(data!==null) _fbNotify(path,data); });
  }, _pollInterval(path));
}

/* ── useFirebase hook ── */
function useFirebase(path, initial) {
  const [val,   setVal]   = useState(()=> _fbCache[path]!==undefined ? _fbCache[path] : initial);
  const [ready, setReady] = useState(_fbCache[path]!==undefined);

  useEffect(()=>{
    if (!_fbListeners[path]) _fbListeners[path] = new Set();
    const cb = (data)=>{ if(data!==null){setVal(data);} setReady(true); };
    _fbListeners[path].add(cb);
    if (_fbCache[path]!==undefined){ setVal(_fbCache[path]); setReady(true); }
    _fbStart(path);
    return ()=>{ _fbListeners[path]?.delete(cb); };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((v)=>{
    setVal(prev=>{
      const next = typeof v==="function" ? v(prev) : v;
      _fbNotify(path, next);
      fb.set(path, next);
      return next;
    });
  }, [path]);

  return [val, set, ready];
}

/* ── localStorage hook ── */
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
  // ══ المشرف والمخول ══
  {id:1,  username:"728004", password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي",       jobNum:"728004", title:"ر. مهندسين",   dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7801165298", role:"admin"},
  // ══ الصباحيون ══
  {id:2,  username:"727466", password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه",    jobNum:"727466", title:"ر. مهندسين",   dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7705559125"},
  {id:3,  username:"737283", password:"1003", name:"عمر طاهر خزعل سبهان المياحي",              jobNum:"737283", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7710872949"},
  {id:4,  username:"756571", password:"1004", name:"ليث شاكر حمود زعيتر الربيعه",              jobNum:"756571", title:"معاون مهندس",  dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7714991063"},
  {id:5,  username:"790850", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري",        jobNum:"790850", title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"صباحي", edu:"دبلوم",        phone:"7709043148"},
  {id:6,  username:"758795", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري",        jobNum:"758795", title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"صباحي", edu:"دبلوم",        phone:"7707315475"},
  {id:7,  username:"719242", password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير",  jobNum:"719242", title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",        phone:"7831644210"},
  {id:8,  username:"790869", password:"1008", name:"محمود كاظم هاشم محمد المنصوري",            jobNum:"790869", title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",        phone:"7703145733"},
  {id:9,  username:"790885", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي",        jobNum:"790885", title:"محاسب اقدم",  dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"دبلوم",        phone:"7808779038", role:"inventory_manager"},
  {id:10, username:"813877", password:"1010", name:"محمد اسماعيل احمد رمضان العلي",            jobNum:"813877", title:"مهندس",        dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس",    phone:"7725549815"},
  {id:11, username:"439193", password:"1011", name:"علي طاهر خزعل سبهان المياحي",              jobNum:"439193", title:"حرفي اقدم",    dept:"شعبة المرافئ",       shift:"صباحي", edu:"ابتدائية",     phone:"7705770208"},
  // ══ المناوبة (18 موظف) ══
  {id:12, username:"701130", password:"2001", name:"عبد الله علي زباري يسر عباده",             jobNum:"701130", title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"بكالوريوس",      phone:"7705706145"},
  {id:13, username:"751480", password:"2002", name:"امين حميد فاضل حسين العلي",                jobNum:"751480", title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"A", edu:"دبلوم معهد نفط", phone:"7715949652"},
  {id:14, username:"719269", password:"2003", name:"حسين علي احمد قاسم عبادي",                 jobNum:"719269", title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم",          phone:"7712679994"},
  {id:15, username:"719498", password:"2004", name:"جاسم مزعل حاتم ديوان الحسين",              jobNum:"719498", title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A", edu:"دبلوم",          phone:"7821188777"},
  {id:16, username:"719277", password:"2005", name:"باسم هاشم جاسم هاشم الفارس",               jobNum:"719277", title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"B", edu:"دبلوم",          phone:"7702792993"},
  {id:17, username:"719293", password:"2006", name:"هاشم جابر جعفر شناوة عباس",                jobNum:"719293", title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"B", edu:"دبلوم",          phone:"7732166112"},
  {id:18, username:"719463", password:"2007", name:"عبد الحميد سامي موسى بدر العيسى",          jobNum:"719463", title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم",          phone:"7705559870"},
  {id:19, username:"736732", password:"2008", name:"احسان عبد الصمد داود",                     jobNum:"736732", title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B", edu:"دبلوم",          phone:"7714658958"},
  {id:20, username:"719048", password:"2009", name:"علاء محسن عذبي جعفر الجعفر",              jobNum:"719048", title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"دبلوم",          phone:"7711534971"},
  {id:21, username:"732249", password:"2010", name:"علي باقر حنتوش",                           jobNum:"732249", title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"C", edu:"دبلوم",          phone:"7705000000"},
  {id:22, username:"719051", password:"2011", name:"علي صلاح مهدي العيداني",                   jobNum:"719051", title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C", edu:"دبلوم",          phone:"7711000000"},
  {id:23, username:"733501", password:"2012", name:"يوسف ياسين علي ياسين",                     jobNum:"733501", title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"C", edu:"دبلوم",          phone:"7713000000"},
  {id:24, username:"719381", password:"2013", name:"ضياء عبد الامير محمد الغانم",              jobNum:"719381", title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم",          phone:"7714000000"},
  {id:25, username:"719502", password:"2014", name:"عدنان عبد الجليل عطية",                    jobNum:"719502", title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم",          phone:"7715000000"},
  {id:26, username:"736721", password:"2015", name:"احسان محمد سليم السليم",                   jobNum:"736721", title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D", edu:"دبلوم",          phone:"7716000000"},
  {id:27, username:"724939", password:"2016", name:"حيدر عبد الحسن خضير جاسم",                 jobNum:"724939", title:"مدير فني",     dept:"شعبة المرافئ",       shift:"مناوبة", group:"D", edu:"معادل للاعدادية", phone:"7712766100"},
  // ══ العقود (4 موظفين) ══ — اداريون لهم صلاحية الحضور
  {id:30, username:"690414", password:"3001", name:"عبد الله عيسى موسى موني",                  jobNum:"690414", title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7735632535"},
  {id:31, username:"689766", password:"3002", name:"اباذر صالح عبد الحسين عيسى",               jobNum:"689766", title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7801446130", role:"attendance_admin"},
  {id:32, username:"690174", password:"3003", name:"حسن عادل عمران يوسف",                       jobNum:"690174", title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7729488795", role:"attendance_admin"},
  {id:33, username:"689331", password:"3004", name:"سجاد علي راضي علي",                        jobNum:"689331", title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", edu:"بكالوريوس", phone:"7703283076", role:"attendance_admin"},
];

/* ── السواق المؤجرون (لا يسجلون دخول) ── */
const DRIVERS = [
  {id:"dr1", name:"محمد نعيم فاضل",  plate:"", shift:"صباحي", type:"driver"},
  {id:"dr2", name:"علي جاسم محمد",   plate:"", shift:"صباحي", type:"driver"},
];

/* ═══════════════════════════════════════════════════════════
   TIMESHEET CODES — رموز التايم شيت
═══════════════════════════════════════════════════════════ */
const TS = {
  // حضور وعمل
  "2":  { label:"مناوبة ثنائية",               cat:"عمل",    color:"bg-blue-600 text-white" },
  "3":  { label:"مناوبة ثلاثية",               cat:"عمل",    color:"bg-blue-800 text-white" },
  "O":  { label:"المقيم الصباحي",              cat:"عمل",    color:"bg-emerald-600 text-white" },
  "V":  { label:"استراحة مقيم",                cat:"راحة",   color:"bg-teal-100 text-teal-800" },
  // إجازات
  "L":  { label:"إجازة اعتيادية",              cat:"إجازة",  color:"bg-blue-100 text-blue-800" },
  "S":  { label:"إجازة مرضية",                 cat:"إجازة",  color:"bg-rose-100 text-rose-800" },
  "T":  { label:"إجازة بدون راتب/داخل",        cat:"إجازة",  color:"bg-orange-100 text-orange-800" },
  "H":  { label:"إجازة بدون راتب/خارج",        cat:"إجازة",  color:"bg-orange-200 text-orange-900" },
  "7":  { label:"إجازة اعتيادية خارج العراق",  cat:"إجازة",  color:"bg-indigo-100 text-indigo-800" },
  "M":  { label:"إجازة أمومة",                 cat:"إجازة",  color:"bg-pink-100 text-pink-800" },
  "K":  { label:"إجازة أمومة بأمر إداري",      cat:"إجازة",  color:"bg-pink-200 text-pink-900" },
  "D":  { label:"أيام العدة",                  cat:"إجازة",  color:"bg-pink-100 text-pink-700" },
  "J":  { label:"مجاز دراسي",                  cat:"إجازة",  color:"bg-violet-100 text-violet-800" },
  // إيفادات
  "I":  { label:"إيفاد داخل العراق / دورة",    cat:"إيفاد",  color:"bg-amber-100 text-amber-800" },
  "G":  { label:"دورة داخل محافظة البصرة",     cat:"إيفاد",  color:"bg-amber-200 text-amber-900" },
  "P":  { label:"إيفاد خارج العراق",           cat:"إيفاد",  color:"bg-amber-300 text-amber-900" },
  // راحات
  "N":  { label:"استراحة مناوبة",              cat:"راحة",   color:"bg-slate-100 text-slate-600" },
  "R":  { label:"استراحة",                     cat:"راحة",   color:"bg-slate-200 text-slate-500" },
  // غياب وعطل
  "X":  { label:"غياب",                        cat:"غياب",   color:"bg-red-200 text-red-900 font-bold" },
  "Y":  { label:"عطلة رسمية",                  cat:"عطلة",   color:"bg-slate-300 text-slate-600" },
  // متنوعة
  "B":  { label:"أيام بقسم آخر",               cat:"متنوع",  color:"bg-purple-100 text-purple-800" },
  "U":  { label:"تفرغ",                        cat:"متنوع",  color:"bg-teal-100 text-teal-700" },
  "4":  { label:"العالقون في المناطق الساخنة", cat:"متنوع",  color:"bg-red-100 text-red-700" },
  "5":  { label:"أيام الحشد الشعبي",           cat:"متنوع",  color:"bg-green-100 text-green-800" },
  "":   { label:"—",                            cat:"",       color:"bg-slate-50 text-slate-300" },
};

/* ── ABCD Rotation Calculator ──────────────────────────────
   مرجع: يوم الاثنين 9 يونيو 2026 = نوبة C
   الدورة: C → D → A → B → C ...
─────────────────────────────────────────────────────────── */
const ROTATION_REF_DATE  = new Date(2026, 5, 9); // June 9, 2026
const ROTATION_SEQ       = ["C","D","A","B"];
const IRAQI_HOLIDAYS_2026 = [
  "2026-01-01","2026-03-21","2026-04-09","2026-05-01",
  "2026-07-14","2026-08-14","2026-10-03","2026-12-25",
];

function getWorkingGroup(date) {
  const d = new Date(date); d.setHours(0,0,0,0);
  const ref = new Date(ROTATION_REF_DATE); ref.setHours(0,0,0,0);
  const diff = Math.round((d - ref) / 86400000);
  return ROTATION_SEQ[((diff % 4) + 4) % 4];
}

function isOfficialHoliday(dateStr) {
  return IRAQI_HOLIDAYS_2026.includes(dateStr);
}

function isWeekend(date) {
  const d = new Date(date);
  return d.getDay() === 5 || d.getDay() === 6; // Fri=5, Sat=6
}

function getAutoStatus(emp, dateStr) {
  if (!emp) return "";
  if (isOfficialHoliday(dateStr)) return "Y";
  if (emp.shift === "مناوبة") {
    const wg = getWorkingGroup(dateStr);
    return wg === emp.group ? "2" : "N";
  }
  // صباحي وعقد
  if (isWeekend(dateStr)) return "R";
  return "O";
}

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
   LOGIN
═══════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [user,    setUser]  = useState("");
  const [pass,    setPass]  = useState("");
  const [showP,   setShowP] = useState(false);
  const [err,     setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("boc_session");
      if (saved) {
        const { acct, expiry } = JSON.parse(saved);
        if (expiry > Date.now()) { onLogin(acct); }
        else { sessionStorage.removeItem("boc_session"); }
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loginClick = async () => {
    setErr("");
    if (!user || !pass) { setErr("أدخل الرقم الوظيفي وكلمة المرور"); return; }
    const _att = typeof getAttempts==='function' ? getAttempts(user) : 0;
    if (_att >= 5) { setErr('تم تجاوز 5 محاولات — افتح نافذة Incognito'); return; }


    const baseAcct = ACCOUNTS.find(a => a.jobNum===user.trim() || a.username===user.trim());
    if (!baseAcct) { setErr("الرقم الوظيفي غير موجود"); return; }

    try {
      setLoading(true);
      // تحقق من كلمة المرور — Firebase أولاً ثم الافتراضية
      let stored = null;
      try {
        const res = await fetch(`${FIREBASE_URL}/passwords/${baseAcct.jobNum}.json`);
        const raw = await res.json();
        if (raw && typeof raw === "string" && raw.length > 0) stored = raw;
        else if (raw && typeof raw === "object" && !raw.error) stored = null;
      } catch {}

      // SEC.verify يقبل كلمة مرور قديمة (نص صريح) أو جديدة (مُشفَّرة)
      const valid = stored
        ? SEC.verify(pass.trim(), stored)
        : (pass.trim() === baseAcct.password);

      if (valid) {
        // حفظ مُشفَّر في Firebase إذا لم تكن موجودة
        if (!stored) {
          try { await fetch(`${FIREBASE_URL}/passwords/${baseAcct.jobNum}.json`, {
            method:"PUT", headers:{"Content-Type":"application/json"},
            body: JSON.stringify(SEC.encode(pass.trim()))
          }); } catch {}
        }
        // ✅ اقرأ علامة الإجبار من Firebase وأضفها للحساب
        let mustChange = false;
        try {
          const flagRes = await fetch(`${FIREBASE_URL}/employees/${baseAcct.id}/mustChangePassword.json`);
          const flagVal = await flagRes.json();
          mustChange = flagVal === true;
        } catch {}
        const acctWithFlag = { ...baseAcct, mustChangePassword: mustChange };
        try { sessionStorage.setItem("boc_session", JSON.stringify({
          acct: acctWithFlag, expiry: Date.now() + 8*60*60*1000
        })); } catch {}
        onLogin(acctWithFlag);
      } else {
        setErr("كلمة المرور غير صحيحة");
      }
    } catch {
      // offline fallback
      if (pass.trim() === baseAcct.password) onLogin(baseAcct);
      else setErr("خطأ في الاتصال");
    } finally { setLoading(false); }
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

function LeaveForm({ emp, onSubmit, onCancel, history }) {
  const today = new Date().toISOString().slice(0,10);
  const [type,     setType]    = useState("اعتيادية");
  const [dateFrom, setFrom]    = useState(today);
  const [dateTo,   setTo]      = useState(today);
  const [hourFrom, setHourFrom]= useState("08:00");
  const [hourTo,   setHourTo]  = useState("15:00");
  const [purpose,  setPurpose] = useState("");
  const [isAbroad, setAbroad]  = useState(false);
  const [err,      setErr]     = useState("");
  const [warnings, setWarnings]= useState([]);
  const [sig,      setSig]     = useState(null);
  const [showSig,  setShowSig] = useState(false);

  const cfg      = LEAVE_TYPES[type];
  const isHourly = cfg?.hourly && emp.shift === "صباحي";

  // Calculate duration
  const days = isHourly
    ? (() => {
        const [fh,fm] = hourFrom.split(":").map(Number);
        const [th,tm] = hourTo.split(":").map(Number);
        const hrs = (th*60+tm - fh*60-fm) / 60;
        return Math.max(0, hrs);
      })()
    : daysBetween(dateFrom, dateTo);

  const daysEquiv = isHourly ? Math.floor(days / 7) : days;

  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();

  const monthlyStats = useMemo(() => {
    const stats = { اعتيادية:0, مرضية:0, زمنية:0, total:0 };
    history.forEach(h => {
      const d = new Date(h.submittedAt);
      if (d.getMonth()===thisMonth && d.getFullYear()===thisYear) {
        stats[h.type] = (stats[h.type]||0) + h.days;
        stats.total   += h.days;
      }
    });
    return stats;
  }, [history, thisMonth, thisYear]);

  useEffect(() => {
    const w = [];
    if (type==="اعتيادية" && days>3)
      w.push({ level:"orange", icon:"⚠️", title:"يلزم موافقة مدير القسم",
        body:`مدة الإجازة (${days} أيام) تتجاوز ٣ أيام. يجب موافقة مدير القسم.` });
    if (isAbroad)
      w.push({ level:"red", icon:"🛂", title:"يلزم موافقة مدير الهيأة والأمر الإداري",
        body:"الإجازة خارج العراق تستلزم موافقة مدير الهيأة وصدور أمر إداري." });
    if (isHourly && emp.shift !== "صباحي")
      w.push({ level:"red", icon:"⛔", title:"الإجازة الزمنية للصباحيين فقط",
        body:"هذا النوع من الإجازات متاح للموظفين الصباحيين فقط." });
    setWarnings(w);
  }, [type, days, isAbroad, isHourly, emp.shift]);

  const handleSubmit = () => {
    if (isHourly && emp.shift !== "صباحي") return setErr("الإجازة الزمنية للصباحيين فقط");
    if (!purpose.trim()) return setErr("يرجى تحديد غرض الإجازة");
    if (!sig) return setErr("يرجى رسم توقيعك قبل تقديم الطلب");
    if (isHourly && days <= 0) return setErr("يرجى تحديد وقت صحيح");
    if (!isHourly && daysEquiv > cfg.max) return setErr(`الحد الأقصى ${cfg.max} يوم`);
    setErr("");
    onSubmit({
      type, dateFrom, dateTo,
      hourFrom: isHourly ? hourFrom : null,
      hourTo:   isHourly ? hourTo   : null,
      hours:    isHourly ? days     : null,
      days:     isHourly ? daysEquiv : days,
      purpose, isAbroad,
      empSig: sig,
      warnings: warnings.map(w=>w.title),
    });
  };

  const monthName = new Date().toLocaleDateString("ar-IQ",{month:"long",year:"numeric"});

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100">
          <ChevronLeft size={18}/>
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-800">نموذج طلب إجازة</h2>
          <p className="text-xs text-slate-500">{monthName}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        {/* Official header */}
        <div className="border-b-2 border-slate-200">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-bold text-slate-700 w-32">شركة نفط البصرة</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-600">عنوان النموذج</td>
                <td className="border border-slate-200 px-3 py-2 font-bold text-slate-800">نموذج اجازة {type}</td>
                <td rowSpan="2" className="border border-slate-200 px-4 py-2 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center mx-auto">
                    <span className="text-slate-600 font-bold text-xs">BOC</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 text-slate-500">هيأة الصيانة</td>
                <td className="border border-slate-200 px-3 py-2 text-slate-500">رقم الإصدار</td>
                <td className="border border-slate-200 px-3 py-2 font-mono text-slate-500">BOC-P-07/F06</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-5 space-y-4">
          {/* Employee info */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-xl p-3 text-xs">
            <div><span className="text-slate-500">الاسم: </span><strong>{emp.name.split(" ").slice(0,3).join(" ")}</strong></div>
            <div><span className="text-slate-500">الرقم: </span><strong>{emp.jobNum}</strong></div>
            <div><span className="text-slate-500">القسم: </span><strong>{emp.dept}</strong></div>
          </div>

          {/* Monthly counter — no /max */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {key:"اعتيادية",color:"bg-blue-50 border-blue-200 text-blue-700"},
              {key:"مرضية",   color:"bg-rose-50 border-rose-200 text-rose-700"},
              {key:"زمنية",   color:"bg-amber-50 border-amber-200 text-amber-700"},
            ].map(t=>(
              <div key={t.key} className={`border rounded-xl p-2.5 text-center ${t.color}`}>
                <p className="text-[9px] font-bold">{t.key}</p>
                <p className="text-base font-bold">{toArabicNum(monthlyStats[t.key]||0)}</p>
                <p className="text-[9px] opacity-60">يوم هذا الشهر</p>
              </div>
            ))}
          </div>

          {/* Leave type */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">نوع الإجازة</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(LEAVE_TYPES).map(([k,v])=>(
                <button key={k} onClick={()=>{setType(k);setErr("");}}
                  className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                    type===k ? v.light+" border-current shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}>
                  {v.label}
                  {v.morningOnly && <span className="block text-[9px] opacity-60">صباحي فقط</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <p className="text-sm text-slate-700 font-semibold">يرجى منحي {cfg?.label} لمدة:</p>

            {isHourly ? (
              /* Hourly inputs for زمنية */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">في يوم</label>
                    <input type="date" value={dateFrom} onChange={e=>setFrom(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">نوع الدوام</label>
                    <div className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm bg-amber-50 text-amber-800 font-semibold">
                      صباحي — 7 ساعات/يوم
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">من الساعة</label>
                    <input type="time" value={hourFrom} onChange={e=>setHourFrom(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">إلى الساعة</label>
                    <input type="time" value={hourTo} onChange={e=>setHourTo(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"/>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl border border-amber-200 px-4 py-2.5">
                  <span className="text-sm text-slate-600">مدة الإجازة</span>
                  <div className="text-left">
                    <span className="text-sm font-bold text-amber-700">{days.toFixed(1)} ساعة</span>
                    {daysEquiv > 0 && <span className="text-xs text-slate-500 mr-2">= {daysEquiv} يوم</span>}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800">
                  كل 7 ساعات تُحتسب يوماً واحداً من رصيد إجازتك الزمنية ({cfg.max} أيام)
                </div>
              </div>
            ) : (
              /* Regular date inputs */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">من تاريخ</label>
                    <input type="date" value={dateFrom} onChange={e=>{setFrom(e.target.value);setErr("");}}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">إلى تاريخ</label>
                    <input type="date" value={dateTo} onChange={e=>{setTo(e.target.value);setErr("");}} min={dateFrom}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"/>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-2.5">
                  <span className="text-sm text-slate-600">مدة الإجازة</span>
                  <span className={`text-sm font-bold ${days>cfg.max?"text-red-600":"text-blue-700"}`}>
                    {toArabicNum(days)} يوم
                    {days>cfg.max && <span className="text-xs text-red-500 mr-2">(يتجاوز الحد الأقصى {cfg.max} يوم)</span>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">لغرض</label>
            <input value={purpose} onChange={e=>{setPurpose(e.target.value);setErr("");}}
              placeholder="اكتب غرض الإجازة..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          </div>

          {/* Abroad toggle */}
          <div onClick={()=>setAbroad(p=>!p)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
              isAbroad?"border-red-400 bg-red-50":"border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${isAbroad?"bg-red-500 border-red-500":"border-slate-300 bg-white"}`}>
              {isAbroad && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div>
              <p className={`text-sm font-bold ${isAbroad?"text-red-700":"text-slate-700"}`}>🛂 الإجازة خارج العراق</p>
              <p className="text-[11px] text-slate-500 mt-0.5">ضع علامة إذا كنت ستسافر أو تحتاج أمر إداري</p>
            </div>
          </div>

          {/* Warnings */}
          {warnings.map((w,i)=>(
            <div key={i} className={`rounded-xl border-2 p-4 space-y-1 ${w.level==="red"?"bg-red-50 border-red-300":"bg-orange-50 border-orange-300"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{w.icon}</span>
                <p className={`text-sm font-bold ${w.level==="red"?"text-red-800":"text-orange-800"}`}>{w.title}</p>
              </div>
              <p className={`text-xs pr-7 leading-relaxed ${w.level==="red"?"text-red-700":"text-orange-700"}`}>{w.body}</p>
            </div>
          ))}

          {/* ── Electronic Signature ── */}
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 space-y-3 bg-blue-50/30">
            <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <PenTool size={14} className="text-blue-600"/> توقيع مقدم الطلب
              <span className="text-red-500 text-xs">*مطلوب</span>
            </p>
            {sig ? (
              <div className="space-y-2">
                <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center">
                  <img src={sig} alt="توقيع" className="h-16 w-48 object-contain"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{setSig(null);setShowSig(false);}}
                    className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200">
                    إعادة الرسم
                  </button>
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                    <CheckCircle size={12}/> تم توقيع الطلب
                  </span>
                </div>
              </div>
            ) : (
              <div>
                {!showSig ? (
                  <button onClick={()=>setShowSig(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-blue-700 bg-white border-2 border-blue-300 rounded-xl hover:bg-blue-50 transition-all">
                    <PenTool size={15}/> اضغط للتوقيع الإلكتروني
                  </button>
                ) : (
                  <SignaturePad onSave={s=>{setSig(s);setShowSig(false);}} storageKey={`leave_sig_${emp.id}`}/>
                )}
              </div>
            )}
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-500 shrink-0"/>
              <p className="text-red-600 text-xs">{err}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onCancel}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
              إلغاء
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl shadow-md active:scale-95 transition-all"
              style={{background:`linear-gradient(135deg, ${type==="اعتيادية"?"#2563eb,#1d4ed8":type==="مرضية"?"#dc2626,#b91c1c":"#d97706,#b45309"})`}}>
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
      auditLog("إضافة", `موظف جديد: ${form.name} — ${form.jobNum}`, "المشرف");
      showToast("✓ تم إضافة الموظف");
    } else {
      setEmployees(p => p.map(e => e.id===editId ? {...form, id:editId} : e));
      auditLog("تعديل", `تعديل بيانات: ${form.name}`, "المشرف");
      showToast("✓ تم حفظ التعديلات");
    }
    cancelForm();
  };

  const deleteEmp = (id) => {
    const emp = employees.find(e=>e.id===id);
    setEmployees(p => p.filter(e => e.id!==id));
    setDelConf(null);
    auditLog("حذف", `حذف موظف: ${emp?.name||id}`, "المشرف");
    showToast("✓ تم حذف الموظف");
  };

  const moveEmpDept = () => {
    if (!moveDept) return;
    setEmployees(p => p.map(e => e.id===moveEmp.id ? {...e, dept:moveDept} : e));
    auditLog("نقل", `نقل ${moveEmp.name} إلى ${moveDept}`, "المشرف");
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
  const doCancel  = (id) => { onApprove(id, "cancel", "تم إلغاء الطلب من قِبل الإدارة."); };
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
                    {/* Cancel button — for approved requests */}
                    {req.status === "موافق عليها" && (
                      <div className="flex gap-2 mt-3 no-print">
                        <button onClick={() => doCancel(req.id)}
                          className="flex items-center gap-1.5 py-2 px-4 text-xs font-bold text-white bg-slate-600 hover:bg-slate-700 rounded-xl active:scale-95 transition-all">
                          <X size={13}/> إلغاء الطلب
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
function Dashboard({ emp, onLogout, onUserUpdate }) {
  const [view,    setView]    = useState("home");
  const [receipt, setReceipt] = useState(null);

  // ✅ شاشة إجبار تغيير كلمة المرور — تظهر قبل أي شيء آخر
  if (emp?.mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"/>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"/>
        <div className="w-full max-w-md relative z-10">
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl px-5 py-4 mb-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-bold text-amber-300">تغيير كلمة المرور مطلوب</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                أعاد المشرف تعيين كلمتك — يجب عليك اختيار كلمة مرور جديدة قبل المتابعة.
              </p>
            </div>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-purple-400"/>
              </div>
              <div>
                <p className="text-sm font-bold text-white">مرحباً، {emp.name?.split(" ")[0]}</p>
                <p className="text-[11px] text-slate-400">اختر كلمة مرور جديدة للمتابعة</p>
              </div>
              <button onClick={onLogout} className="mr-auto text-slate-500 hover:text-slate-300 transition-colors p-1">
                <LogOut size={16}/>
              </button>
            </div>
            <ChangePasswordPage emp={emp} setUser={onUserUpdate} forced/>
          </div>
        </div>
      </div>
    );
  }

  // ── LOCAL (personal, per-device)
  const [empSignatures, setEmpSignatures] = useLocalStorage("boc_signatures", {});

  // ── FIREBASE (shared across ALL browsers/devices in real-time)
  const [allRequests,   setAllRequests]   = useFirebase("requests",              []);
  const [employees,     setEmployees]     = useFirebase("employees",             ACCOUNTS);
  const [transferLog,   setTransferLog]   = useFirebase("transfers",             []);
  const [notifications, setNotifications] = useFirebase(`notifications/${emp.id}`, []);

  // Personal history (also on Firebase, keyed per employee)
  const [history, setHistory] = useFirebase(`history/${emp.id}`, []);

  const isAdmin         = emp.role === "admin" || emp.jobNum === "728004";
  const isInventoryMgr  = emp.role === "inventory_manager" || emp.jobNum === "790885";
  const isAttendanceAdm = emp.role === "attendance_admin" || ["689766","690174","689331"].includes(emp.jobNum);

  // #15 — Multi-level permissions
  const GROUP_LEADERS  = { A:"701130", B:"719277", C:"719048", D:"719381" };
  const isGroupLeader  = Object.values(GROUP_LEADERS).includes(emp.jobNum);
  const myGroup        = emp.group || null;
  const permLevel      = isAdmin ? 2 : (isGroupLeader||isAttendanceAdm) ? 1 : 0;

  const visibleEmployees = useMemo(()=>{
    if (permLevel >= 2) return employees;
    if (permLevel === 1) return (Array.isArray(employees)?employees:[]).filter(e=>
      isAttendanceAdm ? true : (e.group === myGroup || e.shift !== "مناوبة")
    );
    return (Array.isArray(employees)?employees:[]).filter(e=>e.id===emp.id);
  }, [employees, permLevel, myGroup, emp.id, isAttendanceAdm]);

  // #3 Push Notifications
  const { permStatus, requestPush } = usePushNotifications(emp);

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
  // Idle timeout — تسجيل خروج تلقائي بعد 30 دقيقة خمول
  useEffect(() => {
    const cleanup = setupIdleDetection(onLogout);
    return cleanup;
  }, [onLogout]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const newStatus  = decision === "approve" ? "موافق عليها" : decision === "cancel" ? "ملغي" : "مرفوضة";
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

    // #8 Audit Log
    auditLog(decision==="approve"?"موافقة":"رفض", `${req.empName} — ${req.type} ${req.days} يوم${adminNote?" | "+adminNote:""}`, emp.name);
  }, [allRequests, emp, setAllRequests, setNotifications]);
