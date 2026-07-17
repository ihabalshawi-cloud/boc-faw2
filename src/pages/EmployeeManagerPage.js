import React, { useState, useEffect } from "react";
import { Shield, Save, Plus, Edit3, X, Download, Search, Unlock } from "lucide-react";
import { storage, passStore, exportCSV } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { PERMISSIONS_DEF, BUILT_IN_ROLES, getEmpStatus, setEmpStatus } from "../permissions";
import { useConnectionStatus, useDebounce } from "../components/Shared";

const PERM_KEYS = Object.entries(PERMISSIONS_DEF).filter(([k]) => k !== "FULL_ACCESS");

function PermissionsPanel({ employees }) {
  const [, forceUpdate] = useState(0);
  const addToast = useToast();
  const { isConnected } = useConnectionStatus();

  const getInfo = (emp) => {
    const s = getEmpStatus(emp.id);
    const roleName = s.role || (emp.role === "admin" ? "SUPER_ADMIN" : "EMPLOYEE");
    const rolePerms = BUILT_IN_ROLES[roleName]?.permissions || [];
    return { s, roleName, rolePerms, isFullAccess: rolePerms.includes("FULL_ACCESS"), extraPerms: s.extraPerms||[], denyPerms: s.denyPerms||[] };
  };

  const hasPerm = (emp, key) => {
    const { isFullAccess, rolePerms, extraPerms, denyPerms } = getInfo(emp);
    if (denyPerms.includes(key)) return false;
    return isFullAccess || rolePerms.includes(key) || extraPerms.includes(key);
  };

  const syncAll = () => {
    if (!isConnected) return;
    const map = {}; employees.forEach(e => { map[e.id] = getEmpStatus(e.id); });
    FirebaseAPI.saveRoles(map);
  };

  const toggle = (emp, key) => {
    const { s, isFullAccess, rolePerms, extraPerms, denyPerms } = getInfo(emp);
    if (isFullAccess) return;
    const has = hasPerm(emp, key);
    let newExtra = [...extraPerms], newDeny = [...denyPerms];
    if (has) {
      if (rolePerms.includes(key)) { if (!newDeny.includes(key)) newDeny.push(key); }
      else newExtra = newExtra.filter(p => p !== key);
    } else {
      if (newDeny.includes(key)) newDeny = newDeny.filter(p => p !== key);
      else if (!newExtra.includes(key)) newExtra.push(key);
    }
    setEmpStatus(emp.id, { ...s, extraPerms: newExtra, denyPerms: newDeny });
    forceUpdate(n => n + 1);
    syncAll();
    addToast("تم تحديث الصلاحية", "success");
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-secondary">انقر على أي خانة لمنح أو إلغاء صلاحية فردية بغض النظر عن الدور المحدد.</p>
      <div className="card rounded-2xl border border-color overflow-x-auto">
        <table className="w-full text-xs" dir="rtl">
          <thead>
            <tr className="border-b border-color bg-gray-50/80">
              <th className="px-3 py-2 text-right font-semibold sticky right-0 bg-gray-50 min-w-[120px]">الموظف</th>
              <th className="px-2 py-2 text-center font-semibold min-w-[80px]">الدور</th>
              {PERM_KEYS.map(([k, p]) => (
                <th key={k} className="px-2 py-2 text-center font-semibold min-w-[60px]">
                  <span className="block text-base leading-none">{p.icon}</span>
                  <span className="block text-[9px] mt-0.5 leading-tight whitespace-nowrap">{p.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const { roleName, isFullAccess } = getInfo(emp);
              const r = BUILT_IN_ROLES[roleName] || BUILT_IN_ROLES.EMPLOYEE;
              const shortName = emp.name.split(" ").slice(0, 2).join(" ");
              return (
                <tr key={emp.id} className="border-b border-color hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-1.5 font-medium sticky right-0 bg-white text-[11px]">{shortName}</td>
                  <td className="px-2 py-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${r.color}`}>{r.label}</span>
                  </td>
                  {PERM_KEYS.map(([key]) => {
                    const has = hasPerm(emp, key);
                    const { rolePerms, denyPerms } = getInfo(emp);
                    const fromRole = rolePerms.includes(key);
                    const isDenied = denyPerms.includes(key);
                    return (
                      <td key={key} className="px-2 py-1.5 text-center">
                        {isFullAccess
                          ? <span className="text-red-500 text-sm">🛡</span>
                          : <button onClick={() => toggle(emp, key)} title={has ? "إلغاء الصلاحية" : "منح الصلاحية"}
                              className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                                has && fromRole  ? "bg-blue-100 text-blue-700 border border-blue-300" :
                                has && !fromRole ? "bg-emerald-100 text-emerald-700 border border-emerald-300" :
                                isDenied         ? "bg-red-100 text-red-500 border border-red-300" :
                                                   "bg-gray-100 text-gray-300 border border-gray-200"
                              }`}>
                              {has ? "✓" : isDenied ? "✕" : ""}
                            </button>
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 text-[10px] text-secondary">
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-blue-100 border border-blue-300 rounded-md inline-block"></span>من الدور</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded-md inline-block"></span>مُضافة يدوياً</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-100 border border-red-300 rounded-md inline-block"></span>محظورة صراحةً</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-100 border border-gray-200 rounded-md inline-block"></span>غير ممنوحة</span>
      </div>
    </div>
  );
}

const ICON_VIEWS = [
  {id:"training",label:"التدريب"},{id:"tasks",label:"المهام"},{id:"evaluation",label:"التقييم"},
  {id:"timesheet",label:"التايم شيت"},{id:"chat",label:"الدردشة"},{id:"maint_equipment",label:"المعدات"},
  {id:"maint_parts",label:"قطع الغيار"},{id:"maint_reports",label:"تقارير الصيانة"},
  {id:"maint_work_report",label:"تقرير العمل"},{id:"inventory",label:"الجرد"},
  {id:"furniture",label:"الأثاث"},{id:"projects",label:"المشاريع"},
];

function ViewsPanel({ employees, setEmployees }) {
  const addToast = useToast();
  const [vm, setVm] = useState({});
  const [fbReady, setFbReady] = useState(false);
  const loadFromFb = () => {
    setFbReady(false);
    FirebaseAPI.loadAllEmpViews().then(m=>{
      if(m){setVm(m);setFbReady(true);addToast("✅ تم تحميل البيانات من Firebase","success");}
      else addToast("❌ تعذر تحميل البيانات من Firebase — تحقق من قواعد قاعدة البيانات","warning");
    });
  };
  useEffect(()=>{ loadFromFb(); },[]);
  const toggle = async (emp, vid) => {
    const cur = Array.isArray(vm[emp.id]) ? vm[emp.id] : (emp.allowedViews||[]);
    const updated = cur.includes(vid) ? cur.filter(v=>v!==vid) : [...cur, vid];
    setVm(m=>({...m,[emp.id]:updated}));
    setEmployees(employees.map(e=>e.id===emp.id ? {...e,allowedViews:updated} : e));
    const ok = await FirebaseAPI.saveEmpViews(emp.id, updated);
    if (!ok) {
      setVm(m=>({...m,[emp.id]:cur}));
      setEmployees(employees.map(e=>e.id===emp.id ? {...e,allowedViews:cur} : e));
      addToast("❌ فشل الحفظ في Firebase — تحقق من قواعد قاعدة البيانات", "warning");
    } else {
      addToast("✅ تم حفظ صلاحية الأيقونة", "success");
    }
  };
  const nonAdmins = employees.filter(e=>e.role!=="admin"&&e.jobNum!=="728004"&&e.username!=="i.shawi");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-secondary">انقر على الخانة لمنح أو إلغاء وصول الموظف لأيقونة معيّنة في الصفحة الرئيسية.</p>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold ${fbReady?"text-emerald-600":"text-amber-600"}`}>{fbReady?"● Firebase":"○ محلي"}</span>
          <button onClick={loadFromFb} className="text-[10px] px-2 py-1 rounded-lg border border-color text-secondary hover:text-primary btn-secondary">تحديث من Firebase</button>
        </div>
      </div>
      <div className="card rounded-2xl border border-color overflow-x-auto">
        <table className="w-full text-xs" dir="rtl">
          <thead>
            <tr className="border-b border-color bg-gray-50/80">
              <th className="px-3 py-2 text-right font-semibold sticky right-0 bg-gray-50 min-w-[120px]">الموظف</th>
              {ICON_VIEWS.map(v=>(
                <th key={v.id} className="px-2 py-2 text-center font-semibold min-w-[56px]">
                  <span className="block text-[9px] leading-tight whitespace-nowrap">{v.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nonAdmins.map(e=>{
              const allowed = Array.isArray(vm[e.id]) ? vm[e.id] : (e.allowedViews||[]);
              return (
                <tr key={e.id} className="border-b border-color hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-1.5 font-medium sticky right-0 bg-white text-[11px]">{e.name.split(" ").slice(0,2).join(" ")}</td>
                  {ICON_VIEWS.map(v=>(
                    <td key={v.id} className="px-2 py-1.5 text-center">
                      <button onClick={()=>toggle(e,v.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                          allowed.includes(v.id)?"bg-emerald-100 text-emerald-700 border border-emerald-300":"bg-gray-100 text-gray-300 border border-gray-200"}`}>
                        {allowed.includes(v.id)?"✓":""}
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 text-[10px] text-secondary">
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded-md inline-block"/>مسموح</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-100 border border-gray-200 rounded-md inline-block"/>محظور (افتراضي)</span>
      </div>
    </div>
  );
}

function EmployeeManager({ employees, setEmployees }) {
  const [tab, setTab] = useState("emps");
  const [search, setSearch]   = useState("");
  const dSearch = useDebounce(search, 300);
  const [filterDept, setFilterDept] = useState("الكل");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterRole, setFilterRole] = useState("الكل");
  const [editId, setEditId]   = useState(null);
  const [adding, setAdding]   = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [syncingRoles, setSyncingRoles] = useState(false);
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [form, setForm]       = useState({name:"",jobNum:"",title:"",dept:"شعبة سيطرة مستودع الفاو والمرافئ",shift:"صباحي",phone:"",email:""});
  const [, forceUpdate] = useState(0);
  const addToast = useToast();
  const confirm  = useConfirm();
  const { isConnected } = useConnectionStatus();
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
    const q = dSearch.trim();
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

  const clearLoginLock = async (e) => {
    storage.set(`login_lock_${e.jobNum}`, { count: 0, lockedUntil: 0 });
    if (isConnected) FirebaseAPI.clearLockInfo(e.jobNum);
    addToast(`تم تصفير قفل الدخول لـ ${e.name}`, "success");
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
      {/* التبويبات */}
      <div className="flex gap-1 border-b border-color pb-0">
        <button onClick={()=>setTab("emps")} className={`px-5 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${tab==="emps"?"border-blue-600 text-blue-700":"border-transparent text-secondary hover:text-primary"}`}>👥 الموظفون</button>
        <button onClick={()=>setTab("perms")} className={`px-5 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${tab==="perms"?"border-blue-600 text-blue-700":"border-transparent text-secondary hover:text-primary"}`}>🔑 الصلاحيات</button>
        <button onClick={()=>setTab("views")} className={`px-5 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${tab==="views"?"border-blue-600 text-blue-700":"border-transparent text-secondary hover:text-primary"}`}>🎯 الأيقونات</button>
      </div>

      {tab==="perms" && <PermissionsPanel employees={employees}/>}
      {tab==="views" && <ViewsPanel employees={employees} setEmployees={setEmployees}/>}
      {tab==="emps" && <>
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
        <button onClick={()=>{setAdding(true);setForm({name:"",jobNum:"",title:"",dept:"شعبة سيطرة مستودع الفاو والمرافئ",shift:"صباحي",phone:"",email:""});}} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"><Plus size={14}/> إضافة</button>
        <button onClick={handleMigrate} disabled={migrating} className="px-3 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold disabled:opacity-60">{migrating?"جاري النقل...":"نقل Firebase"}</button>
        <button onClick={syncRolesToFirebase} disabled={syncingRoles||!isConnected} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-60" title="حفظ الصلاحيات للأبد في Firebase"><Shield size={13}/>{syncingRoles?"جاري الحفظ...":"حفظ الصلاحيات"}</button>
      </div>

      {/* نموذج الإضافة / التعديل */}
      {(adding||editId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget){setAdding(false);setEditId(null);}}}>
          <div className="card rounded-2xl w-full max-w-lg shadow-2xl p-5">
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
                  {["شعبة سيطرة مستودع الفاو والمرافئ","شعبة مستودع الفاو","شعبة المرافئ"].map(d=><option key={d}>{d}</option>)}
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
                <th className="px-3 py-2.5 text-right font-semibold hidden md:table-cell">العنوان الوظيفي</th>
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
                        <button onClick={()=>clearLoginLock(e)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="تصفير قفل الدخول"><Unlock size={13}/></button>
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
      </> }
    </div>
  );
}

export default EmployeeManager;
