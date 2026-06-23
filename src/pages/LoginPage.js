import React, { useState, useEffect, useCallback, useRef } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { FIREBASE_URL, ACCOUNTS, DEFAULT_PASSWORD } from "../constants";
import { storage, passStore, hashPassword, isHash } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useConnectionStatus } from "../components/Shared";
import { getEmpStatus } from "../permissions";

const LOCK_LIMIT    = 5;
const LOCK_DURATION = 15 * 60 * 1000;

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

export function recordLogoutFn(userId) {
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

    let isValid = false;
    const inputHash = await hashPassword(pass.trim());
    const localPass = passStore.get(`pass_${account.id}`);
    const defaultPass = DEFAULT_PASSWORD;

    if (localPass) {
      if (isHash(localPass)) {
        isValid = inputHash !== null && inputHash === localPass;
      } else {
        isValid = pass.trim() === localPass;
        if (isValid && inputHash) {
          passStore.set(`pass_${account.id}`, inputHash);
          if (isConnected) await FirebaseAPI.savePassword(account.id, inputHash);
        }
      }
    } else if (isConnected) {
      const fp = await FirebaseAPI.getPassword(account.id);
      if (fp) {
        isValid = isHash(fp) ? (inputHash !== null && inputHash === fp) : pass.trim() === fp;
        if (isValid) {
          const toStore = isHash(fp) ? fp : (inputHash || null);
          if (toStore) passStore.set(`pass_${account.id}`, toStore);
          if (!isHash(fp) && inputHash) await FirebaseAPI.savePassword(account.id, inputHash);
        }
      } else {
        const everChanged = await FirebaseAPI.hasPasswordChanged(account.id);
        if (!everChanged) {
          const def = DEFAULT_PASSWORD;
          isValid = pass.trim() === def;
          if (isValid && inputHash) passStore.set(`pass_${account.id}`, inputHash);
        }
      }
    } else {
      const def = DEFAULT_PASSWORD;
      isValid = pass.trim() === def;
      if (isValid && inputHash) passStore.set(`pass_${account.id}`, inputHash);
    }

    if (isValid) {
      clearLockData(user.trim());
      try { sessionStorage.setItem("boc_session", JSON.stringify({ acctId: account.id, expiry: Date.now() + 8 * 3600000 })); } catch {}
      if (pass.trim() === DEFAULT_PASSWORD && !localPass) { try { sessionStorage.setItem("force_password_change", "true"); } catch {} }
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
              REF: <span className="text-[#C87A2E]">728004</span> &nbsp;/&nbsp; DEFAULT: <span className="text-[#C87A2E]">{DEFAULT_PASSWORD}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
