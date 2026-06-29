import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, Wifi, Clock, Trash2, X, Users, BarChart, Search } from "lucide-react";
import { FIREBASE_URL } from "../constants";
import { storage } from "../utils";
import { useToast, useConfirm } from "../contexts";
import { PERMISSIONS_DEF, BUILT_IN_ROLES, getEmpStatus } from "../permissions";
import EmployeeManager from "./EmployeeManagerPage";
import { useDebounce } from "../components/Shared";

function AdminDashboard({ emp, employees, setEmployees }) {
  const addToast = useToast();
  const confirm  = useConfirm();
  const [tab, setTab] = useState("overview");
  const [histSearch, setHistSearch] = useState("");
  const dHistSearch = useDebounce(histSearch, 300);
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
          .sort((a, b) => ((b?.loginTime||"") > (a?.loginTime||"") ? 1 : -1));
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
  const topDevice = Object.entries(deviceCounts).sort((a,b)=>(b?.[1]||0)-(a?.[1]||0))[0]?.[0] || "—";

  // Peak hour
  const hourCounts = todayHist.reduce((acc, h) => {
    const hr = new Date(h.loginTime).getHours();
    acc[hr] = (acc[hr]||0)+1; return acc;
  }, {});
  const peakHour = Object.entries(hourCounts).sort((a,b)=>(b?.[1]||0)-(a?.[1]||0))[0];
  const peakHourLabel = peakHour ? `${peakHour[0]}:00` : "—";

  // Filtered history
  const filteredHist = loginHistory.filter(h => {
    const q = dHistSearch.trim();
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
    try { await fetch(`${FIREBASE_URL}/login_history.json`, { method: "DELETE" }); } catch {}
    setFbHistory([]);
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

          {/* نشاط الدخول آخر 7 أيام */}
          {(() => {
            const last7 = Array.from({length:7}, (_,i) => {
              const d = new Date(); d.setDate(d.getDate() - (6-i));
              return d.toISOString().slice(0,10);
            });
            const barData = last7.map(day => ({
              day,
              label: new Date(day).toLocaleDateString("ar-IQ",{weekday:"short",day:"numeric"}),
              success: loginHistory.filter(h => h.loginTime?.startsWith(day) && h.status==="success").length,
              failed:  loginHistory.filter(h => h.loginTime?.startsWith(day) && h.status==="failed").length,
            }));
            const bMax = Math.max(1, ...barData.map(d => d.success + d.failed));
            return (
              <div className="card rounded-xl border border-color p-4">
                <p className="font-semibold text-sm mb-3">نشاط الدخول — آخر 7 أيام</p>
                <div className="flex items-end gap-1 h-28">
                  {barData.map(d => {
                    const tot = d.success + d.failed;
                    const totalH = Math.round((tot/bMax)*96);
                    const greenH = tot > 0 ? Math.round((d.success/tot)*totalH) : 0;
                    const redH = totalH - greenH;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div title={`نجاح: ${d.success} | فشل: ${d.failed}`}
                          className="w-full flex flex-col justify-end rounded-t overflow-hidden"
                          style={{height:"96px"}}>
                          {redH > 0 && <div className="w-full bg-red-400" style={{height:`${redH}px`}}/>}
                          {greenH > 0 && <div className="w-full bg-emerald-500" style={{height:`${greenH}px`}}/>}
                        </div>
                        <p className="text-[8px] text-secondary text-center leading-tight">{d.label}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-2 text-[10px] text-secondary">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"/> نجاح</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block"/> فشل</span>
                </div>
              </div>
            );
          })()}

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
                const cnt = employees.filter(e=>{if(!e)return false;const s=getEmpStatus(e.id);return (s.role||"EMPLOYEE")===key || (key==="SUPER_ADMIN" && e.role==="admin" && !s.role);}).length;
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
                      {employees.filter(e=>{if(!e)return false;const s=getEmpStatus(e.id);return (s.role||"EMPLOYEE")===key||(key==="SUPER_ADMIN"&&e.role==="admin"&&!s.role);}).length}
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

export default AdminDashboard;
