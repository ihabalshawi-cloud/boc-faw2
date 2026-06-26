import React, { useState, useEffect, useCallback } from "react";
import {
  LogOut, Shield, Home, User,
  CheckCircle, Wifi, WifiOff, FileText, Clock, Calendar,
  Bell, ThumbsUp, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star,
  Search, Moon, Sun, MessageSquare, X,
  CheckSquare, AlertTriangle, ChevronLeft,
  Wrench, Box, TrendingUp, Heart,
  Briefcase, Menu, Glasses, Type
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

const LazyTimeSheetPage = React.lazy(() => import('./TimeSheetPage'));
const LazyEmployeeManager = React.lazy(() => import('./EmployeeManagerPage'));
const LazyInventoryPage = React.lazy(() => import('./InventoryPage'));
const LazyFurnitureInventory = React.lazy(() => import('./InventoryPage').then(m => ({ default: m.FurnitureInventory })));
const LazyAttendanceSystem = React.lazy(() => import('./WorkplacePage'));
const LazyTrainingSystem = React.lazy(() => import('./WorkplacePage').then(m => ({ default: m.TrainingSystem })));
const LazyTasksSystem = React.lazy(() => import('./WorkplacePage').then(m => ({ default: m.TasksSystem })));
const LazyInternalChat = React.lazy(() => import('./WorkplacePage').then(m => ({ default: m.InternalChat })));
const LazyEvaluationSystem = React.lazy(() => import('./WorkplacePage').then(m => ({ default: m.EvaluationSystem })));
const LazyAnalyticsDashboard = React.lazy(() => import('./AnalyticsPage'));
const LazyChangePasswordPage = React.lazy(() => import('./UserPages'));
const LazyRequestsPage = React.lazy(() => import('./UserPages').then(m => ({ default: m.RequestsPage })));
const LazyApprovalsPage = React.lazy(() => import('./UserPages').then(m => ({ default: m.ApprovalsPage })));
const LazyNotificationsPage = React.lazy(() => import('./UserPages').then(m => ({ default: m.NotificationsPage })));
const LazyAdminDashboard = React.lazy(() => import('./AdminDashboardPage'));
const LazyEquipmentPage = React.lazy(() => import('./EquipmentPage'));
const LazyMaintenanceParts = React.lazy(() => import('./EquipmentPage').then(m => ({ default: m.MaintenanceParts })));
const LazyMaintenanceAnalytics = React.lazy(() => import('./EquipmentPage').then(m => ({ default: m.MaintenanceAnalytics })));
const LazyHealthInsurancePage = React.lazy(() => import('./HealthInsurancePage'));
const LazyLeaveFormsPage = React.lazy(() => import('./LeaveFormsPage'));
const LazyProjectManagementPage = React.lazy(() => import('./ProjectManagementPage'));

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
    allReq.filter(r => r.status === "بانتظار المراجعة" && new Date(r.submittedAt).getTime() < threeDaysAgo).forEach(r => {
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

const ADMIN_VIEWS = new Set(["home","analytics","requests","training","tasks","evaluation","chat","notifications","changepass","health_insurance","approvals","employees","admin_dashboard","timesheet"]);
const TECH_VIEWS  = new Set(["maint_equipment","maint_parts","maint_reports","inventory","furniture","projects"]);

export default function Dashboard({ emp, onLogout, dark, setDark, fieldMode, setFieldMode, largeFont, setLargeFont }) {
  const [view, setView] = useState(() => storage.get("last_view", "home"));
  const [reqSubTab, setReqSubTab] = useState("requests");
  const [section, setSection] = useState(() => storage.get("dash_section","admin"));
  const [allRequests, setAllRequests] = useState(() => storage.get("all_requests", []));
  const [employees, setEmployeesRaw] = useState(ACCOUNTS);

  useEffect(() => {
    FirebaseAPI.loadAccounts().then(list => {
      if (list && list.length > 0) setEmployeesRaw(list);
    });
    FirebaseAPI.loadRequests().then(list => {
      if (list && list.length > 0) {
        storage.set("all_requests", list);
        setAllRequests(list);
        const pc = list.filter(r => r.status === "بانتظار المراجعة").length;
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
  const confirm = useConfirm();
  const [showSearch, setShowSearch] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004" || emp.username === "i.shawi";
  const isAttendanceAdmin = emp.role === "attendance_admin";
  const canSeeApprovals = isAdmin || isAttendanceAdmin;
  const isTimeSheetAdmin = isAdmin || isAttendanceAdmin;
  const pendingCount = allRequests.filter(r => r.status === "بانتظار المراجعة").length;
  const unreadNotifs = (storage.get(`notifications_${emp.id}`, [])).filter(n => !n.read).length;
  useStorageSync("all_requests", setAllRequests);

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

  useEffect(() => {
    const total = unreadNotifs + (canSeeApprovals ? pendingCount : 0);
    document.title = total > 0 ? `(${total}) شركة نفط البصرة` : "شركة نفط البصرة";
  }, [unreadNotifs, pendingCount, canSeeApprovals]);

  useEffect(() => { setAllRequests(storage.get("all_requests", [])); }, [view]);

  const switchSection = (s) => { setSection(s); storage.set("dash_section", s); };
  const switchView = (id) => {
    if (id === "leave_forms") {
      setView("requests"); setReqSubTab("leave_forms");
      if (section !== "admin") switchSection("admin");
      return;
    }
    if (id === "chat") { setChatOpen(true); return; }
    if (id === "requests") setReqSubTab("requests");
    setView(id);
    storage.set("last_view", id);
    if (ADMIN_VIEWS.has(id) && section !== "admin") switchSection("admin");
    if (TECH_VIEWS.has(id)  && section !== "tech")  switchSection("tech");
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
    { id:"analytics", label:"لوحة التحليلات", icon:<BarChart size={17}/> },
    { id:"requests", label:"طلبات ونماذج الإجازات", icon:<FileText size={17}/> },
    { id:"training", label:"التدريب", icon:<GraduationCap size={17}/> },
    { id:"tasks", label:"المهام", icon:<CheckSquare size={17}/> },
    { id:"evaluation", label:"التقييم", icon:<Star size={17}/> },
    { id:"chat", label:"الدردشة", icon:<MessageSquare size={17}/> },
    { id:"health_insurance", label:"الضمان الصحي", icon:<Heart size={17}/> },
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
  const menuItems = section === "admin" ? adminMenuItems : techMenuItems;

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
            <MessageSquare size={16}/>
          </button>
          {smartAlerts.length > 0 && <div className="relative"><AlertTriangle size={20} className="text-amber-500"/><span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{smartAlerts.length}</span></div>}
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

      <div className="flex flex-col md:flex-row">
        <aside className="group/sb hidden md:flex md:flex-col md:w-14 md:hover:w-60 sidebar border-l border-color min-h-screen py-3 px-1.5 md:overflow-hidden transition-[width] duration-200 ease-out">
          <div className="flex gap-1 mb-2 overflow-hidden max-w-full md:max-w-0 md:group-hover/sb:max-w-full transition-[max-width] duration-150">
            {[{k:"admin",lbl:"الإداري"},{k:"tech",lbl:"الفني"}].map(s=>(
              <button key={s.k} onClick={()=>switchSection(s.k)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${section===s.k?"bg-[#C87A2E] text-white":"btn-secondary text-secondary border border-color"}`}>
                {s.lbl}
              </button>
            ))}
          </div>
          <nav className="space-y-0.5">
            {menuItems.map(item => (
              <div key={item.id} className="relative">
                <button onClick={()=>switchView(item.id)} title={item.label}
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

        <main className="flex-1 p-5 pb-20 md:pb-5">
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
            <HomeWidgets emp={emp} employees={employees} allRequests={allRequests} isAdmin={isAdmin} switchView={switchView}/>
          )}
          {view==="analytics" && (
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

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-color z-20 flex" dir="ltr" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
        {[
          {id:"home",          icon:<Home size={20}/>,         label:"الرئيسية"},
          {id:"requests",      icon:<FileText size={20}/>,     label:"الطلبات"},
          {id:"notifications", icon:<Bell size={20}/>,         label:"الإشعارات", badge:unreadNotifs},
          {id:"chat",          icon:<MessageSquare size={20}/>,label:"الدردشة"},
        ].map(item => (
          <button key={item.id}
            onClick={()=>item.id==="chat"?setChatOpen(o=>!o):switchView(item.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 relative text-xs ${
              (item.id==="chat"&&chatOpen)||(item.id!=="chat"&&view===item.id)?"text-[#C87A2E]":"text-secondary"
            }`}>
            {item.icon}
            <span className="text-[9px]">{item.label}</span>
            {item.badge>0 && <span className="absolute top-1 right-2 bg-red-500 text-white text-[8px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">{item.badge}</span>}
          </button>
        ))}
        <button onClick={()=>setShowMobileMenu(true)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs relative ${showMobileMenu?"text-[#C87A2E]":"text-secondary"}`}>
          <Menu size={20}/><span className="text-[9px]">المزيد</span>
          {canSeeApprovals && pendingCount > 0 && <span className="absolute top-1 right-2 bg-red-500 text-white text-[8px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">{pendingCount}</span>}
        </button>
      </nav>

      {/* ── Mobile Full Menu Drawer ── */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={()=>setShowMobileMenu(false)}>
          <div className="absolute bottom-0 inset-x-0 bg-main rounded-t-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto" dir="rtl" onClick={e=>e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"/>
            <div className="flex gap-2 mb-3">
              {[{k:"admin",lbl:"الإداري"},{k:"tech",lbl:"الفني"}].map(s=>(
                <button key={s.k} onClick={()=>setSection(s.k)}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl ${section===s.k?"bg-[#C87A2E] text-white":"btn-secondary border border-color"}`}>
                  {s.lbl}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {menuItems.map(item=>(
                <button key={item.id} onClick={()=>{switchView(item.id);setShowMobileMenu(false);}}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors relative ${view===item.id?"bg-[#C87A2E] text-white border-[#C87A2E]":"border-color hover:bg-hover"}`}>
                  {item.icon}
                  <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                  {item.badge>0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">{item.badge}</span>}
                </button>
              ))}
            </div>
            <button onClick={onLogout} className="mt-4 w-full py-3 text-red-500 font-bold text-sm border border-red-200 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2">
              <LogOut size={16}/> تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
