import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LogOut, Shield, Home, User,
  CheckCircle, Wifi, WifiOff, FileText, Clock, Calendar,
  Bell, ThumbsUp, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star,
  Search, Moon, Sun, MessageSquare, X,
  CheckSquare, AlertTriangle, ChevronLeft, ChevronRight,
  Wrench, Box, TrendingUp, Heart,
  Briefcase, Glasses, Type
} from "lucide-react";
import {
  ACCOUNTS, LOW_STOCK_THRESHOLD,
  INITIAL_EQUIPMENT, INITIAL_MAINT_SPARE_PARTS,
  VIEW_LABELS, GDRIVE_WARN_PCT,
} from "../constants";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useGDrive } from "../gdrive";
import { useConfirm } from "../contexts";
import { playAlert, useConnectionStatus, PageSkeleton, sendDesktopNotification, useStorageSync } from "../components/Shared";
import { GDriveSettingsModal, GDriveQuotaBar } from "../components/GDriveComponents";
import GlobalSearch from "../components/GlobalSearch";
import HomeWidgets from "../components/HomeWidgets";
import MobileNav from "../components/MobileNav";

const LazyTimeSheetPage = React.lazy(() => import('./TimeSheetPage'));
const LazyEmployeeManager = React.lazy(() => import('./EmployeeManagerPage'));
const LazyInventoryPage = React.lazy(() => import('./InventoryPage'));
const LazyFurnitureInventory = React.lazy(() => import('./InventoryPage').then(m => ({ default: m.FurnitureInventory })));
const LazyAttendanceSystem = React.lazy(() => import('./WorkplacePage'));
const LazyTrainingSystem = React.lazy(() => import('./WorkplacePage').then(m => ({ default: m.TrainingSystem })));
const LazyTasksSystem = React.lazy(() => import('./WorkplacePage').then(m => ({ default: m.TasksSystem })));
const LazyInternalChat = React.lazy(() => import('../components/InternalChat'));
const LazyEvaluationSystem = React.lazy(() => import('./WorkplacePage').then(m => ({ default: m.EvaluationSystem })));
const LazyAnalyticsDashboard = React.lazy(() => import('./AnalyticsPage'));
const LazyChangePasswordPage = React.lazy(() => import('./UserPages'));
const LazyRequestsPage = React.lazy(() => import('./UserPages').then(m => ({ default: m.RequestsPage })));
const LazyApprovalsPage = React.lazy(() => import('./ApprovalsPage'));
const LazyNotificationsPage = React.lazy(() => import('./UserPages').then(m => ({ default: m.NotificationsPage })));
const LazyAdminDashboard = React.lazy(() => import('./AdminDashboardPage'));
const LazyEquipmentPage = React.lazy(() => import('./EquipmentPage'));
const LazyMaintenanceParts = React.lazy(() => import('./EquipmentPage').then(m => ({ default: m.MaintenanceParts })));
const LazyMaintenanceAnalytics = React.lazy(() => import('./EquipmentPage').then(m => ({ default: m.MaintenanceAnalytics })));
const LazyHealthInsurancePage = React.lazy(() => import('./HealthInsurancePage'));
const LazyLeaveFormsPage = React.lazy(() => import('./LeaveFormsPage'));
const LazyProjectManagementPage = React.lazy(() => import('./ProjectManagementPage'));
const LazyIncentivePage = React.lazy(() => import('./IncentivePage'));

function useSmartAlerts(employees) {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const found = [];
    const inv = storage.get("inventory_items", []);
    inv.filter(i => i.qty <= (i.minQty || LOW_STOCK_THRESHOLD)).forEach(i => {
      found.push({ id: `inv_${i.id}`, type: "warning", msg: `مخزون منخفض: ${i.name} (${i.qty} متبقي)` });
    });
    const allReq = storage.get("all_requests", []);
    const threeDaysAgo = Date.now() - 3 * 86400000;
    allReq.filter(r => r && r.status === "بانتظار المراجعة" && new Date(r.submittedAt).getTime() < threeDaysAgo).forEach(r => {
      found.push({ id: `req_${r.id}`, type: "info", msg: `طلب ${r.empName} معلق منذ أكثر من 3 أيام` });
    });
    setAlerts(found);
    if (found.length > 0) playAlert("warning");
  }, []);
  return alerts;
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

class ReqErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch() { this.setState({ err: this.state.err }); }
  render() {
    if (this.state.err) return (
      <div dir="rtl" className="p-6 text-center">
        <p className="text-red-600 font-bold mb-2">حدث خطأ في صفحة الطلبات</p>
        <button onClick={()=>this.setState({err:null})}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          إعادة المحاولة
        </button>
      </div>
    );
    return this.props.children;
  }
}

const ADMIN_VIEWS = new Set(["home","analytics","requests","training","tasks","evaluation","chat","notifications","changepass","health_insurance","approvals","employees","admin_dashboard","timesheet","incentive"]);
const TECH_VIEWS  = new Set(["maint_equipment","maint_parts","maint_reports","inventory","furniture","projects"]);

export default function Dashboard({ emp, onLogout, dark, setDark, fieldMode, setFieldMode, largeFont, setLargeFont }) {
  const allowedViews = ACCOUNTS.find(a => a.id === emp.id)?.allowedViews || null;
  const [view, setView] = useState(() => {
    const saved = storage.get("last_view", "home");
    return (allowedViews && !allowedViews.includes(saved)) ? "home" : saved;
  });
  const [viewHistory, setViewHistory] = useState([]);
  const [reqSubTab, setReqSubTab] = useState("requests");
  const [section, setSection] = useState(() => storage.get("dash_section","admin"));
  const [allRequests, setAllRequests] = useState(() => storage.get("all_requests", []).filter(Boolean));
  const [employees, setEmployeesRaw] = useState(ACCOUNTS);

  useEffect(() => {
    FirebaseAPI.loadAccounts().then(list => {
      if (list && list.length > 0) setEmployeesRaw(list.filter(Boolean));
    });
    FirebaseAPI.loadRequests().then(list => {
      if (list && list.length > 0) {
        const clean = list.filter(Boolean);
        storage.set("all_requests", clean);
        setAllRequests(clean);
        const pc = list.filter(r => r && r.status === "بانتظار المراجعة").length;
        if (canSeeApprovals && pc > 0) sendDesktopNotification("BOC — طلبات معلّقة", `لديك ${pc} طلب بانتظار الموافقة`);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEmployees = useCallback((newList) => {
    setEmployeesRaw(newList);
    FirebaseAPI.saveAccounts(newList);
  }, []);
  const { isConnected } = useConnectionStatus();
  const smartAlerts = useSmartAlerts(employees);
  const [dismissed, setDismissed] = useState(() => new Set());
  const visibleAlerts = smartAlerts.filter(a => !dismissed.has(a.id));
  const dismissAlert = id => setDismissed(s => new Set([...s, id]));
  const confirm = useConfirm();
  const [showSearch, setShowSearch] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004" || emp.username === "i.shawi";
  const isAttendanceAdmin = emp.role === "attendance_admin";
  const canSeeApprovals = isAdmin || isAttendanceAdmin;
  const isTimeSheetAdmin = isAdmin || isAttendanceAdmin;
  const canSeeAnalytics = isAdmin || isAttendanceAdmin || emp.role === "inventory_manager";
  const pendingCount = allRequests.filter(r => r && r.status === "بانتظار المراجعة").length;
  const unreadNotifs = (storage.get(`notifications_${emp.id}`, [])).filter(n => !n.read).length;
  useStorageSync("all_requests", setAllRequests);
  const chatUnread = storage.get("chat_offline",[]).filter(m=>!m.read&&Number(m.toId)===Number(emp.id)).length;
  useEffect(() => {
    const nc = sessionStorage.getItem("force_password_change");
    if (nc) { sessionStorage.removeItem("force_password_change"); setTimeout(async () => { if(await confirm("يُنصح بتغيير كلمة المرور الافتراضية الآن لأمان حسابك.", { title: "🔐 تغيير كلمة المرور", ok: "تغيير الآن" })) setView("changepass"); }, 500); }
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = (e) => { if((e.ctrlKey||e.metaKey)&&e.key==="k"){e.preventDefault();setShowSearch(true);}else if(e.key==="?"&&!["INPUT","TEXTAREA"].includes(e.target.tagName))setShowSearch(true); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const total = unreadNotifs + (canSeeApprovals ? pendingCount : 0);
    document.title = total > 0 ? `(${total}) شركة نفط البصرة` : "شركة نفط البصرة";
  }, [unreadNotifs, pendingCount, canSeeApprovals]);

  useEffect(() => { setAllRequests(storage.get("all_requests", []).filter(Boolean)); }, [view]);

  const prevReqRef = useRef(null);
  useEffect(() => {
    if (prevReqRef.current) allRequests.filter(Boolean).forEach(r => { const p = prevReqRef.current.filter(Boolean).find(x=>x&&x.id===r.id); if(p&&p.status!==r.status&&r.empId===emp.id) sendDesktopNotification(`طلبك: ${r.type}`,`الحالة الجديدة: ${r.status}`); });
    prevReqRef.current = allRequests;
  }, [allRequests, emp.id]);
  useEffect(() => {
    const t = setInterval(() => { FirebaseAPI.loadRequests().then(list => { if(list?.length){const clean=list.filter(Boolean);storage.set("all_requests",clean);setAllRequests(clean);} }); }, 60000);
    return () => clearInterval(t);
  }, []);

  const switchSection = (s) => { setSection(s); storage.set("dash_section", s); };
  const switchView = (id) => {
    if (id === "chat") { setChatOpen(true); return; }
    if (allowedViews && !allowedViews.includes(id)) return;
    setViewHistory(h => [...h, view]);
    if (id === "leave_forms") {
      setView("requests"); setReqSubTab("leave_forms");
      if (section !== "admin") switchSection("admin");
      return;
    }
    if (id === "requests") setReqSubTab("requests");
    setView(id);
    storage.set("last_view", id);
    if (ADMIN_VIEWS.has(id) && section !== "admin") switchSection("admin");
    if (TECH_VIEWS.has(id)  && section !== "tech")  switchSection("tech");
  };

  const goBack = () => {
    if (viewHistory.length === 0) return;
    const prev = viewHistory[viewHistory.length - 1];
    setViewHistory(h => h.slice(0, -1));
    setView(prev);
    storage.set("last_view", prev);
  };

  const adminMenuItems = [
    ...(isAdmin ? [
      { id:"admin_dashboard", label:"لوحة الإدارة", icon:<Shield size={17}/> },
      { id:"employees", label:"الموظفين والصلاحيات", icon:<Users size={17}/> },
    ] : []),
    ...(canSeeApprovals ? [
      { id:"approvals", label:"الموافقات", icon:<ThumbsUp size={17}/>, badge:pendingCount },
    ] : []),
    { id:"home", label:"الرئيسية", icon:<Home size={17}/> },
    ...(canSeeAnalytics ? [{ id:"analytics", label:"لوحة التحليلات", icon:<BarChart size={17}/> }] : []),
    { id:"requests", label:"طلبات ونماذج الإجازات", icon:<FileText size={17}/> },
    { id:"training", label:"التدريب", icon:<GraduationCap size={17}/> },
    { id:"tasks", label:"المهام", icon:<CheckSquare size={17}/> },
    { id:"evaluation", label:"التقييم", icon:<Star size={17}/> },
    { id:"chat", label:"الدردشة", icon:<MessageSquare size={17}/> },
    { id:"health_insurance", label:"الضمان الصحي", icon:<Heart size={17}/> },
    { id:"incentive", label:"نظام المكافآت", icon:<Star size={17}/>, badge: (() => { const c=storage.get("boc_incentive_v1",[]).filter(f=>f.status==="بانتظار المراجعة").length; return (isAdmin&&c>0)?c:0; })() },
    ...(isTimeSheetAdmin ? [{ id:"timesheet", label:"التايم شيت", icon:<Calendar size={17}/> }] : []),
    { id:"notifications", label:"الإشعارات", icon:<Bell size={17}/>, badge:unreadNotifs },
    { id:"changepass", label:"تغيير المرور", icon:<Shield size={17}/> },
  ];
  const techMenuItems = [
    { id:"maint_equipment", label:"المعدات والصيانة", icon:<Wrench size={17}/> },
    { id:"maint_parts",    label:"قطع غيار الصيانة", icon:<Box size={17}/> },
    { id:"maint_reports",  label:"تقارير الصيانة",   icon:<TrendingUp size={17}/> },
    { id:"inventory", label:"جرد الآلات الدقيقة", icon:<Package size={17}/> },
    { id:"furniture", label:"جرد الأثاث 2025", icon:<ClipboardList size={17}/> },
    { id:"projects", label:"إدارة المشاريع", icon:<Briefcase size={17}/> },
  ];
  const visibleAdminItems = allowedViews ? adminMenuItems.filter(i => allowedViews.includes(i.id)) : adminMenuItems;
  const visibleTechItems  = allowedViews ? [] : techMenuItems;
  const menuItems = section === "admin" ? visibleAdminItems : visibleTechItems;

  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const gDrive = useGDrive();

  return (
    <div className="min-h-screen bg-main" dir="rtl">
      {showDriveSettings && <GDriveSettingsModal onClose={()=>setShowDriveSettings(false)}/>}
      <GDriveQuotaBar/>
      <div className="header-bar px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C87A2E] flex items-center justify-center" style={{clipPath:"none"}}><span className="text-white font-bold text-xs tracking-widest" style={{fontFamily:"'JetBrains Mono',monospace"}}>BOC</span></div>
          <div><h1 className="font-bold">شركة نفط البصرة</h1><p className="text-xs text-secondary">شعبة مستودع الفاو</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>setShowDriveSettings(true)}
            title={gDrive.isReady ? `Google Drive متصل — ${gDrive.quota?.pct||0}% مستخدم` : "ربط Google Drive"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${gDrive.isReady ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "btn-secondary border-color text-secondary hover:text-primary"}`}>
            <span>☁️</span>
            <span className="hidden md:inline">{gDrive.isReady ? `Drive ${gDrive.quota?.pct||""}%` : "Drive"}</span>
            {gDrive.isReady && gDrive.quota?.pct >= GDRIVE_WARN_PCT && <span className="text-amber-500">⚠️</span>}
          </button>
          <button onClick={()=>setShowSearch(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl btn-secondary border border-color text-secondary hover:text-primary text-xs">
            <Search size={14}/> <span className="hidden md:inline">بحث</span> <kbd className="hidden md:inline px-1 bg-hover rounded text-[10px]">Ctrl K</kbd>
          </button>
          <button onClick={()=>setChatOpen(o=>!o)} className={`relative p-2 rounded-xl border transition-colors ${chatOpen?"bg-blue-50 border-blue-200 text-blue-600":"btn-secondary border-color text-secondary hover:text-primary"}`}>
            <MessageSquare size={16}/>{chatUnread>0&&<span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{chatUnread}</span>}
          </button>
          {visibleAlerts.length > 0 && <div className="relative"><AlertTriangle size={20} className="text-amber-500"/><span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{visibleAlerts.length}</span></div>}
          <div className="flex items-center gap-1">{isConnected?<Wifi size={14} className="text-emerald-500"/>:<WifiOff size={14} className="text-amber-500"/>}</div>
          <button onClick={()=>setLargeFont(v=>!v)} title="وضع القراءة السريعة (خط أكبر)" className={`p-2 rounded-xl border transition-colors ${largeFont?"bg-blue-500 text-white border-blue-400":"btn-secondary border-color"}`}><Type size={16}/></button>
          <button onClick={()=>setFieldMode(v=>!v)} title="وضع البيئة الميدانية (تباين عالٍ)" className={`p-2 rounded-xl border transition-colors ${fieldMode?"bg-amber-500 text-white border-amber-400":"btn-secondary border-color"}`}><Glasses size={16}/></button>
          <button onClick={()=>setDark(!dark)} className="p-2 rounded-xl btn-secondary border border-color">{dark?<Sun size={16}/>:<Moon size={16}/>}</button>
          <div className="text-left"><p className="text-sm font-bold">{emp.name.split(" ").slice(0,2).join(" ")}</p><p className="text-xs text-secondary">{emp.title}</p></div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
        </div>
      </div>

      {isConnected === false && (
        <div className="bg-amber-500 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 sticky top-14 z-10">
          <WifiOff size={13}/> وضع غير متصل — التغييرات محفوظة محلياً وستُرسل تلقائياً عند عودة الاتصال
        </div>
      )}

      <div>
        <main className="p-5 pb-20">
          {view !== "home" && (
            <div className="flex items-center gap-1.5 text-sm text-secondary mb-4">
              {viewHistory.length > 0 && (
                <button onClick={goBack} className="hover:text-blue-600 transition-colors flex items-center gap-1 ml-2 border border-current rounded px-1.5 py-0.5">
                  <ChevronRight size={13}/> رجوع
                </button>
              )}
              <button onClick={()=>switchView("home")} className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Home size={13}/> الرئيسية
              </button>
              <ChevronLeft size={13}/>
              <span className="font-semibold text-primary">{VIEW_LABELS[view] || view}</span>
            </div>
          )}
          {view==="home" && (
            <div className="space-y-6">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3"><div className="h-5 w-1 bg-blue-600 rounded-full"/><h3 className="font-bold text-base">الإدارة والموارد البشرية</h3></div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {visibleAdminItems.filter(i=>i.id!=="home").map(item=>(
                      <button key={item.id} onClick={()=>switchView(item.id)}
                        className="relative card rounded-2xl border-color border p-3 flex flex-col items-center gap-2 hover:bg-hover transition-colors text-center group">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {React.cloneElement(item.icon,{size:24})}
                        </div>
                        <span className="text-xs font-medium leading-tight">{item.label}</span>
                        {(item.badge||0)>0 && <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                {visibleTechItems.length > 0 && <div>
                  <div className="flex items-center gap-2 mb-3"><div className="h-5 w-1 bg-orange-500 rounded-full"/><h3 className="font-bold text-base">الفني والمعدات</h3></div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {visibleTechItems.map(item=>(
                      <button key={item.id} onClick={()=>switchView(item.id)}
                        className="relative card rounded-2xl border-color border p-3 flex flex-col items-center gap-2 hover:bg-hover transition-colors text-center group">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                          {React.cloneElement(item.icon,{size:24})}
                        </div>
                        <span className="text-xs font-medium leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>}
              </div>
              <HomeWidgets emp={emp} employees={employees} allRequests={allRequests} isAdmin={isAdmin} switchView={switchView}/>
            </div>
          )}
          {view==="analytics" && canSeeAnalytics && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyAnalyticsDashboard employees={employees} allRequests={allRequests}/>
            </React.Suspense>
          )}
          {view==="requests" && (
            <ReqErrorBoundary>
              <React.Suspense fallback={<PageSkeleton/>}>
                <div>
                  <div className="flex gap-1 mb-4 border-b border-color">
                    {[{k:"requests",lbl:"طلبات الإجازة"},{k:"leave_forms",lbl:"نماذج الإجازات"}].map(t=>(
                      <button key={t.k} onClick={()=>setReqSubTab(t.k)}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${reqSubTab===t.k?"border-blue-500 text-blue-600":"border-transparent text-secondary hover:text-primary"}`}>
                        {t.lbl}
                      </button>
                    ))}
                  </div>
                  {reqSubTab==="requests" ? <LazyRequestsPage emp={emp}/> : <LazyLeaveFormsPage emp={emp}/>}
                </div>
              </React.Suspense>
            </ReqErrorBoundary>
          )}
          {view==="attendance" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyAttendanceSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
            </React.Suspense>
          )}
          {view==="training" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyTrainingSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
            </React.Suspense>
          )}
          {view==="tasks" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyTasksSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
            </React.Suspense>
          )}
          {view==="inventory" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyInventoryPage emp={emp} isAdmin={isAdmin}/>
            </React.Suspense>
          )}
          {view==="furniture" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyFurnitureInventory emp={emp} isAdmin={isAdmin}/>
            </React.Suspense>
          )}
          {view==="maint_equipment" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyEquipmentPage emp={emp} isAdmin={isAdmin}/>
            </React.Suspense>
          )}
          {view==="maint_parts" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyMaintenanceParts/>
            </React.Suspense>
          )}
          {view==="maint_reports" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyMaintenanceAnalytics/>
            </React.Suspense>
          )}
          {view==="evaluation" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyEvaluationSystem emp={emp} isAdmin={isAdmin} allEmployees={employees}/>
            </React.Suspense>
          )}
          {view==="notifications" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyNotificationsPage emp={emp}/>
            </React.Suspense>
          )}
          {view==="changepass" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyChangePasswordPage emp={emp} onLogout={onLogout}/>
            </React.Suspense>
          )}
          {view==="employees" && isAdmin && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyEmployeeManager employees={employees} setEmployees={setEmployees}/>
            </React.Suspense>
          )}
          {view==="approvals" && canSeeApprovals && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyApprovalsPage emp={emp}/>
            </React.Suspense>
          )}
          {view==="health_insurance" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyHealthInsurancePage emp={emp}/>
            </React.Suspense>
          )}

          {view==="incentive" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyIncentivePage emp={emp} employees={employees}/>
            </React.Suspense>
          )}

          {view==="projects" && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyProjectManagementPage emp={emp}/>
            </React.Suspense>
          )}
          {view==="timesheet" && isTimeSheetAdmin && (
            <TsErrorBoundary>
              <React.Suspense fallback={<PageSkeleton rows={3}/>}>
                <LazyTimeSheetPage emp={emp}/>
              </React.Suspense>
            </TsErrorBoundary>
          )}
          {view==="admin_dashboard" && isAdmin && (
            <React.Suspense fallback={<PageSkeleton/>}>
              <LazyAdminDashboard emp={emp} employees={employees} setEmployees={setEmployees}/>
            </React.Suspense>
          )}
        </main>
      </div>
      {showSearch && <GlobalSearch setView={switchView} onClose={()=>setShowSearch(false)} employees={employees}/>}

      {chatOpen && (
        <div className="fixed inset-0 z-[300] bg-black/30" onClick={e=>e.target===e.currentTarget&&setChatOpen(false)}>
          <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-main border-l border-color shadow-2xl flex flex-col" dir="rtl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-color shrink-0">
              <h3 className="font-bold text-sm">الدردشة الداخلية</h3>
              <button onClick={()=>setChatOpen(false)} className="text-secondary hover:text-primary p-1 rounded-lg hover:bg-hover"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <React.Suspense fallback={<PageSkeleton rows={2}/>}>
                <LazyInternalChat emp={emp} isConnected={isConnected}/>
              </React.Suspense>
            </div>
          </div>
        </div>
      )}

      <MobileNav
        view={view} chatOpen={chatOpen} setChatOpen={setChatOpen} switchView={switchView}
        unreadNotifs={unreadNotifs} chatUnread={chatUnread} canSeeApprovals={canSeeApprovals}
        pendingCount={pendingCount} showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu}
        section={section} setSection={setSection} menuItems={menuItems} onLogout={onLogout}
      />
    </div>
  );
}
