import React, { useState, useEffect, useCallback } from "react";
import {
  LogOut, Shield, Home, User,
  CheckCircle, Wifi, WifiOff, FileText, Clock, Calendar,
  Bell, ThumbsUp, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star,
  Search, Moon, Sun, MessageSquare,
  CheckSquare, AlertTriangle, ChevronLeft,
  Wrench, Box, TrendingUp, Heart,
  Briefcase
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
import { playAlert, useConnectionStatus } from "../components/Shared";
import { GDriveSettingsModal, GDriveQuotaBar } from "../components/GDriveComponents";
import GlobalSearch from "../components/GlobalSearch";

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
const LazyAuditLogPage = React.lazy(() => import('./UserPages').then(m => ({ default: m.AuditLogPage })));
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
    inv.filter(i => i.qty <= LOW_STOCK_THRESHOLD).forEach(i => {
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

export default function Dashboard({ emp, onLogout, dark, setDark }) {
  const [view, setView] = useState("home");
  const [allRequests, setAllRequests] = useState(() => storage.get("all_requests", []));
  const [employees, setEmployeesRaw] = useState(ACCOUNTS);

  useEffect(() => {
    FirebaseAPI.loadAccounts().then(list => {
      if (list && list.length > 0) setEmployeesRaw(list);
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
          {smartAlerts.length > 0 && <div className="relative"><AlertTriangle size={20} className="text-amber-500"/><span className="absolute -top-1 -left-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{smartAlerts.length}</span></div>}
          <div className="flex items-center gap-1">{isConnected?<Wifi size={14} className="text-emerald-500"/>:<WifiOff size={14} className="text-amber-500"/>}</div>
          <button onClick={()=>setDark(!dark)} className="p-2 rounded-xl btn-secondary border border-color">{dark?<Sun size={16}/>:<Moon size={16}/>}</button>
          <div className="text-left"><p className="text-sm font-bold">{emp.name.split(" ").slice(0,2).join(" ")}</p><p className="text-xs text-secondary">{emp.title}</p></div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
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

        <main className="flex-1 p-5">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
