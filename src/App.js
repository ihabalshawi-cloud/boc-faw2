import { useState, useEffect } from "react";
import {
  LogIn, LogOut, Shield, Eye, AlertCircle, Home, User,
  Plus, Trash2, Edit3, Users, BarChart, Search,
  TrendingUp, PieChart, AlertTriangle, Key,
  Settings, Lock, Unlock, Wrench, Box, DollarSign, Clock
} from "lucide-react";

const ROLES_DEFINITIONS = {
  SUPER_ADMIN:        { id: "SUPER_ADMIN",        name: "مشرف عام",    level: 5, color: "bg-red-100 text-red-800",    icon: <Shield size={16}/>,   description: "صلاحية كاملة",   permissions: { users: { view: true,  add: true,  edit: true,  delete: true,  resetPassword: true  }, maintenance: { view: true,  add: true,  edit: true  }, inventory: { view: true,  add: true,  edit: true  }, reports: { view: true } } },
  ADMIN:              { id: "ADMIN",              name: "مدير إداري",  level: 4, color: "bg-amber-100 text-amber-800", icon: <Settings size={16}/>, description: "إدارة الموظفين", permissions: { users: { view: true,  add: true,  edit: true,  delete: false, resetPassword: true  }, maintenance: { view: true               }, inventory: { view: false               }, reports: { view: true } } },
  MAINTENANCE_MANAGER:{ id: "MAINTENANCE_MANAGER",name: "مدير صيانة",  level: 4, color: "bg-blue-100 text-blue-800",  icon: <Wrench size={16}/>,   description: "إدارة الصيانة", permissions: { users: { view: false                                               }, maintenance: { view: true,  add: true,  edit: true  }, inventory: { view: true,  add: true,  edit: true  }, reports: { view: true } } },
  TECHNICIAN:         { id: "TECHNICIAN",         name: "فني صيانة",   level: 2, color: "bg-cyan-100 text-cyan-800",   icon: <Wrench size={16}/>,   description: "تنفيذ الصيانة", permissions: { users: { view: false                                               }, maintenance: { view: true,  add: true,  edit: true  }, inventory: { view: true                       }, reports: { view: true } } },
  EMPLOYEE:           { id: "EMPLOYEE",           name: "موظف",        level: 1, color: "bg-slate-100 text-slate-800", icon: <User size={16}/>,     description: "موظف عادي",     permissions: { users: { view: false                                               }, maintenance: { view: false               }, inventory: { view: false               }, reports: { view: true } } },
};

const INITIAL_USERS = [
  { id: 1, jobNum: "728004", password: "1001", name: "ايهاب عبد اللطيف",  email: "admin@boc.iq",      phone: "7801165298", role: "SUPER_ADMIN",         department: "قسم السيطرة والنظم",  status: "active", lastLogin: "2024-03-15" },
  { id: 2, jobNum: "689766", password: "1001", name: "اباذر صالح",        email: "abather@boc.iq",    phone: "7801446130", role: "ADMIN",               department: "قسم السيطرة والنظم",  status: "active", lastLogin: "2024-03-14" },
  { id: 3, jobNum: "790885", password: "1001", name: "محمد عبد الكاظم",   email: "mohammed@boc.iq",   phone: "7808779038", role: "MAINTENANCE_MANAGER", department: "شعبة مستودع الفاو",   status: "active", lastLogin: "2024-03-13" },
  { id: 4, jobNum: "719048", password: "1001", name: "علاء محسن",         email: "alaa@boc.iq",       phone: "7803572745", role: "TECHNICIAN",          department: "قسم السيطرة والنظم",  status: "active", lastLogin: "2024-03-12" },
  { id: 5, jobNum: "727466", password: "1001", name: "عدي فيصل",          email: "adi@boc.iq",        phone: "7705559125", role: "EMPLOYEE",            department: "قسم السيطرة والنظم",  status: "active", lastLogin: "2024-03-10" },
];

const INITIAL_EQUIPMENT = [
  { id: "P-001",  name: "مضخة خام رئيسية 1",  type: "PUMP",       location: "محطة الضخ الرئيسية", status: "جيد",         lastMaintenance: "2024-01-15", nextMaintenance: "2024-04-15", critical: false, totalFailures: 2 },
  { id: "P-002",  name: "مضخة خام رئيسية 2",  type: "PUMP",       location: "محطة الضخ الرئيسية", status: "جيد",         lastMaintenance: "2024-01-15", nextMaintenance: "2024-04-15", critical: false, totalFailures: 1 },
  { id: "P-003",  name: "مضخة نقل 1",          type: "PUMP",       location: "محطة النقل",          status: "تحتاج صيانة", lastMaintenance: "2024-02-01", nextMaintenance: "2024-03-15", critical: true,  totalFailures: 4 },
  { id: "P-004",  name: "مضخة نقل 2",          type: "PUMP",       location: "محطة النقل",          status: "جيد",         lastMaintenance: "2024-02-10", nextMaintenance: "2024-05-10", critical: false, totalFailures: 1 },
  { id: "T-001",  name: "خزان نفط خام 1",      type: "TANK",       location: "منطقة الخزانات",      status: "جيد",         lastMaintenance: "2024-01-20", nextMaintenance: "2024-04-20", critical: false, totalFailures: 0 },
  { id: "T-002",  name: "خزان نفط خام 2",      type: "TANK",       location: "منطقة الخزانات",      status: "جيد",         lastMaintenance: "2024-01-20", nextMaintenance: "2024-04-20", critical: false, totalFailures: 1 },
  { id: "DP-001", name: "مضخة تصريف ماء 1",    type: "DRAIN_PUMP", location: "منطقة التصريف",       status: "جيد",         lastMaintenance: "2024-01-25", nextMaintenance: "2024-04-25", critical: false, totalFailures: 0 },
  { id: "DP-002", name: "مضخة تصريف ماء 2",    type: "DRAIN_PUMP", location: "منطقة التصريف",       status: "معطل",        lastMaintenance: "2024-02-20", nextMaintenance: "2024-02-28", critical: true,  totalFailures: 3 },
];

const INITIAL_SPARE_PARTS = [
  { id: "SP-001", code: "BRG-001", name: "رولمان بلي 6204",      category: "ميكانيكية",       qty: 8,  minAlert: 2, unit: "قطعة", price: 25, location: "الرف A1"     },
  { id: "SP-002", code: "OIL-001", name: "زيت تشحيم (20 لتر)",   category: "مواد استهلاكية", qty: 12, minAlert: 3, unit: "لتر",  price: 15, location: "المستودع B2" },
  { id: "SP-003", code: "FLT-001", name: "فلتر زيت",              category: "فلتر",            qty: 5,  minAlert: 2, unit: "قطعة", price: 12, location: "الرف C3"     },
];

const STATUS_COLORS = {
  "جيد":         "bg-emerald-100 text-emerald-700",
  "تحتاج صيانة": "bg-amber-100 text-amber-700",
  "تحت صيانة":   "bg-blue-100 text-blue-700",
  "معطل":        "bg-red-100 text-red-700",
};

const storage = {
  get: (key, def) => { try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : def; } catch { return def; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

function addAuditLog(user, action, details) {
  const logs = storage.get("audit_logs", []);
  storage.set("audit_logs", [{ id: Date.now(), userId: user.id, userName: user.name, action, details, timestamp: new Date().toISOString() }, ...logs].slice(0, 500));
}

function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let p = "";
  for (let i = 0; i < length; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  return p;
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [jobNum, setJobNum] = useState("");
  const [pass, setPass]     = useState("");
  const [showP, setShowP]   = useState(false);
  const [err, setErr]       = useState("");

  const handleLogin = () => {
    setErr("");
    if (!jobNum || !pass) { setErr("أدخل الرقم الوظيفي وكلمة المرور"); return; }
    const users   = storage.get("system_users", INITIAL_USERS);
    const account = users.find(u => u.jobNum === jobNum.trim() && u.status === "active");
    if (!account)              { setErr("الرقم الوظيفي غير موجود");   return; }
    if (pass.trim() !== account.password) { setErr("كلمة المرور غير صحيحة"); return; }
    sessionStorage.setItem("boc_session", JSON.stringify({ userId: account.id, expiry: Date.now() + 8 * 3600000 }));
    addAuditLog(account, "تسجيل دخول", "تم تسجيل الدخول");
    onLogin(account);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <LogIn size={32} className="text-white"/>
          </div>
          <h2 className="text-2xl font-bold text-white">شركة نفط البصرة</h2>
          <p className="text-sm text-slate-300 mt-2">نظام إدارة الصيانة المتكامل</p>
        </div>
        <div className="space-y-4">
          <input
            type="text" value={jobNum} onChange={e => setJobNum(e.target.value)}
            placeholder="الرقم الوظيفي"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          <div className="relative">
            <input
              type={showP ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <button onClick={() => setShowP(!showP)} className="absolute left-4 top-3.5 text-slate-400">
              {showP ? <Eye size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          {err && <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-xl flex items-center gap-2"><AlertCircle size={15}/>{err}</div>}
          <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
            تسجيل الدخول
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          🔑 <strong className="text-blue-300">728004</strong> / <strong className="text-blue-300">1001</strong> (مشرف عام)
        </p>
      </div>
    </div>
  );
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────
function StatsCards({ equipment, spareParts }) {
  const overdue = equipment.filter(e => new Date(e.nextMaintenance) <= new Date()).length;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-center"><Wrench size={24}/><span className="text-3xl font-bold">{equipment.length}</span></div>
        <p className="text-sm mt-2 opacity-90">إجمالي المعدات</p>
      </div>
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-center"><AlertTriangle size={24}/><span className="text-3xl font-bold">{equipment.filter(e => e.critical).length}</span></div>
        <p className="text-sm mt-2 opacity-90">معدات حرجة</p>
      </div>
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-center"><Clock size={24}/><span className="text-3xl font-bold">{overdue}</span></div>
        <p className="text-sm mt-2 opacity-90">صيانة مستحقة</p>
      </div>
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-center"><Box size={24}/><span className="text-3xl font-bold">{spareParts.length}</span></div>
        <p className="text-sm mt-2 opacity-90">قطع غيار</p>
      </div>
    </div>
  );
}

// ─── Admin Users ──────────────────────────────────────────────────────────────
function AdminUsers({ currentUser }) {
  const [users, setUsers]           = useState(() => storage.get("system_users", INITIAL_USERS));
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("الكل");
  const [showForm, setShowForm]     = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ jobNum: "", name: "", email: "", phone: "", role: "EMPLOYEE", department: "قسم السيطرة والنظم", status: "active" });
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { storage.set("system_users", users); }, [users]);

  const filtered = users.filter(u =>
    (u.name.includes(search) || u.jobNum.includes(search)) &&
    (filterRole === "الكل" || u.role === filterRole)
  );

  const openAdd = () => {
    setEditingUser(null);
    setForm({ jobNum: "", name: "", email: "", phone: "", role: "EMPLOYEE", department: "قسم السيطرة والنظم", status: "active" });
    setShowForm(true);
  };
  const openEdit = u => { setEditingUser(u); setForm({ ...u }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingUser(null); };

  const saveUser = () => {
    if (!form.jobNum || !form.name) return showToast("الرقم والاسم مطلوبان");
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...form } : u));
      addAuditLog(currentUser, "تعديل مستخدم", form.name);
      showToast("✅ تم التحديث");
    } else {
      if (users.find(u => u.jobNum === form.jobNum)) return showToast("الرقم الوظيفي موجود مسبقاً");
      setUsers([...users, { ...form, id: Date.now(), password: "1001", lastLogin: null }]);
      addAuditLog(currentUser, "إضافة مستخدم", form.name);
      showToast("✅ تم الإضافة");
    }
    closeForm();
  };

  const toggleStatus = u => {
    const next = u.status === "active" ? "inactive" : "active";
    setUsers(users.map(x => x.id === u.id ? { ...x, status: next } : x));
    addAuditLog(currentUser, next === "active" ? "تفعيل مستخدم" : "تعطيل مستخدم", u.name);
    showToast(`✅ تم ${next === "active" ? "التفعيل" : "التعطيل"}`);
  };

  const resetPassword = u => {
    const np = generateRandomPassword();
    setUsers(users.map(x => x.id === u.id ? { ...x, password: np } : x));
    addAuditLog(currentUser, "إعادة تعيين كلمة مرور", u.name);
    alert(`كلمة المرور الجديدة لـ ${u.name}:\n${np}`);
    showToast("✅ تم إعادة التعيين");
  };

  const deleteUser = u => {
    if (u.id === currentUser.id) return showToast("لا يمكن حذف حسابك الشخصي");
    if (!window.confirm(`هل تريد حذف ${u.name}؟`)) return;
    setUsers(users.filter(x => x.id !== u.id));
    addAuditLog(currentUser, "حذف مستخدم", u.name);
    showToast("✅ تم الحذف");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1 min-w-[160px]">
          <Search size={14} className="text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الرقم..." className="bg-transparent outline-none w-full text-sm"/>
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">
          {["الكل", ...Object.keys(ROLES_DEFINITIONS)].map(r => (
            <option key={r} value={r}>{r === "الكل" ? "كل الأدوار" : ROLES_DEFINITIONS[r]?.name}</option>
          ))}
        </select>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 text-sm font-bold">
          <Plus size={15}/> إضافة مستخدم
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-5">
          <h4 className="font-bold mb-4">{editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.jobNum} onChange={e => setForm({...form, jobNum: e.target.value})} placeholder="الرقم الوظيفي *" className="border rounded-xl px-3 py-2 text-sm" disabled={!!editingUser}/>
            <input value={form.name}   onChange={e => setForm({...form, name:   e.target.value})} placeholder="الاسم الكامل *"  className="border rounded-xl px-3 py-2 text-sm"/>
            <input value={form.email}  onChange={e => setForm({...form, email:  e.target.value})} placeholder="البريد الإلكتروني" className="border rounded-xl px-3 py-2 text-sm" type="email"/>
            <input value={form.phone}  onChange={e => setForm({...form, phone:  e.target.value})} placeholder="رقم الهاتف"       className="border rounded-xl px-3 py-2 text-sm"/>
            <select value={form.role}       onChange={e => setForm({...form, role:       e.target.value})} className="border rounded-xl px-3 py-2 text-sm">
              {Object.entries(ROLES_DEFINITIONS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
            <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="border rounded-xl px-3 py-2 text-sm">
              <option>قسم السيطرة والنظم</option>
              <option>شعبة مستودع الفاو</option>
              <option>شعبة المرافئ</option>
              <option>قسم الصيانة</option>
            </select>
            {!editingUser && (
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="border rounded-xl px-3 py-2 text-sm">
                <option value="active">نشط</option>
                <option value="inactive">معطل</option>
              </select>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={closeForm} className="flex-1 py-2 border rounded-xl text-sm">إلغاء</button>
            <button onClick={saveUser}  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">حفظ</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-right">
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">الرقم الوظيفي</th>
                <th className="px-4 py-3">القسم</th>
                <th className="px-4 py-3">الدور</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    {u.email && <p className="text-xs text-slate-400">{u.email}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{u.jobNum}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.department}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${ROLES_DEFINITIONS[u.role]?.color || "bg-slate-100 text-slate-700"}`}>
                      {ROLES_DEFINITIONS[u.role]?.name || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {u.status === "active" ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)}      title="تعديل"            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3  size={14}/></button>
                      <button onClick={() => resetPassword(u)} title="إعادة تعيين كلمة المرور" className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Key size={14}/></button>
                      <button onClick={() => toggleStatus(u)}  title={u.status === "active" ? "تعطيل" : "تفعيل"} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg">
                        {u.status === "active" ? <Lock size={14}/> : <Unlock size={14}/>}
                      </button>
                      <button onClick={() => deleteUser(u)}    title="حذف"              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl">{toast}</div>}
    </div>
  );
}

// ─── Equipment & Maintenance ──────────────────────────────────────────────────
function EquipmentMaintenance() {
  const [equipment, setEquipment]   = useState(() => storage.get("equipment", INITIAL_EQUIPMENT));
  const [records, setRecords]       = useState(() => storage.get("maintenance_records", []));
  const [selected, setSelected]     = useState(null);
  const [activeTab, setActiveTab]   = useState("list");
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [toast, setToast]           = useState("");
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { storage.set("equipment",            equipment); }, [equipment]);
  useEffect(() => { storage.set("maintenance_records",  records);   }, [records]);

  const filtered = equipment.filter(e =>
    e.name.includes(search) && (filterStatus === "الكل" || e.status === filterStatus)
  );

  const requestMaintenance = () => {
    if (!selected) return;
    const desc = window.prompt("وصف العطل أو سبب الصيانة:");
    if (!desc) return;
    setRecords([{ id: Date.now(), equipmentId: selected.id, equipmentName: selected.name, type: "طارئة", description: desc, status: "قيد التنفيذ", requestedAt: new Date().toISOString() }, ...records]);
    setEquipment(equipment.map(e => e.id === selected.id ? { ...e, status: "تحت صيانة" } : e));
    showToast("✅ تم تسجيل طلب الصيانة");
  };

  const completeMaintenance = id => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    setEquipment(equipment.map(e => e.id === rec.equipmentId
      ? { ...e, status: "جيد", lastMaintenance: new Date().toISOString().slice(0, 10), nextMaintenance: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) }
      : e));
    setRecords(records.map(r => r.id === id ? { ...r, status: "مكتملة", completedAt: new Date().toISOString() } : r));
    showToast("✅ تم إكمال الصيانة");
  };

  const pendingCount = records.filter(r => r.status !== "مكتملة").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b pb-2">
        <button onClick={() => setActiveTab("list")}     className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === "list"     ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>قائمة المعدات</button>
        <button onClick={() => setActiveTab("requests")} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === "requests" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
          طلبات الصيانة {pendingCount > 0 && <span className="mr-1.5 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
        </button>
      </div>

      {activeTab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex gap-3 mb-4">
              <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1">
                <Search size={14} className="text-slate-400"/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في المعدات..." className="bg-transparent outline-none w-full text-sm"/>
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">
                <option value="الكل">الكل</option>
                <option value="جيد">جيد</option>
                <option value="تحتاج صيانة">تحتاج صيانة</option>
                <option value="تحت صيانة">تحت صيانة</option>
                <option value="معطل">معطل</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl border divide-y">
              {filtered.map(eq => (
                <div key={eq.id} onClick={() => setSelected(eq)} className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${selected?.id === eq.id ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                  <div>
                    <p className="font-semibold text-sm">{eq.name} {eq.critical && <span className="text-red-500 text-xs">🔴</span>}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{eq.location} — آخر صيانة: {eq.lastMaintenance}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${STATUS_COLORS[eq.status] || "bg-slate-100 text-slate-700"}`}>{eq.status}</span>
                </div>
              ))}
              {filtered.length === 0 && <p className="p-6 text-center text-slate-400 text-sm">لا توجد معدات مطابقة</p>}
            </div>
          </div>

          <div>
            {selected ? (
              <div className="bg-white rounded-2xl border p-5 space-y-3 sticky top-24">
                <h3 className="font-bold text-base">{selected.name}</h3>
                <div className="text-sm space-y-2 text-slate-600">
                  <p><span className="font-semibold text-slate-800">الرمز:</span> {selected.id}</p>
                  <p><span className="font-semibold text-slate-800">النوع:</span> {selected.type}</p>
                  <p><span className="font-semibold text-slate-800">الموقع:</span> {selected.location}</p>
                  <p><span className="font-semibold text-slate-800">آخر صيانة:</span> {selected.lastMaintenance}</p>
                  <p><span className="font-semibold text-slate-800">الصيانة القادمة:</span> {selected.nextMaintenance}</p>
                  <p><span className="font-semibold text-slate-800">عدد العطلات:</span> <span className={selected.totalFailures > 2 ? "text-red-600 font-bold" : ""}>{selected.totalFailures}</span></p>
                  {selected.critical && <p className="text-red-600 font-bold text-xs">⚠️ معدة حرجة تتطلب اهتماماً خاصاً</p>}
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[selected.status] || "bg-slate-100 text-slate-700"}`}>{selected.status}</span>
                <button onClick={requestMaintenance} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
                  طلب صيانة
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border p-10 text-center">
                <Wrench size={36} className="mx-auto text-slate-300 mb-3"/>
                <p className="text-slate-400 text-sm">اختر معدة لعرض تفاصيلها</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-right">
                  <th className="px-4 py-3">المعدة</th>
                  <th className="px-4 py-3">الوصف</th>
                  <th className="px-4 py-3">تاريخ الطلب</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-400">لا توجد طلبات صيانة بعد</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{r.equipmentName}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px]">{r.description}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.requestedAt).toLocaleDateString("ar-IQ")}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === "مكتملة" ? "bg-emerald-100 text-emerald-700" : r.status === "قيد التنفيذ" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status !== "مكتملة" && (
                        <button onClick={() => completeMaintenance(r.id)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                          إكمال
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl">{toast}</div>}
    </div>
  );
}

// ─── Spare Parts Inventory ────────────────────────────────────────────────────
function SparePartsInventory() {
  const [parts, setParts]         = useState(() => storage.get("spare_parts", INITIAL_SPARE_PARTS));
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm] = useState({ code: "", name: "", category: "ميكانيكية", qty: 0, minAlert: 1, unit: "قطعة", price: 0, location: "" });
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { storage.set("spare_parts", parts); }, [parts]);

  const categories = ["الكل", ...new Set(parts.map(p => p.category))];
  const filtered   = parts.filter(p =>
    (p.name.includes(search) || p.code.includes(search)) &&
    (filterCat === "الكل" || p.category === filterCat)
  );
  const lowStock = parts.filter(p => p.qty <= p.minAlert);

  const addPart = () => {
    if (!form.name || !form.code) return showToast("الاسم والرمز مطلوبان");
    setParts([...parts, { ...form, id: "SP-" + Date.now() }]);
    setForm({ code: "", name: "", category: "ميكانيكية", qty: 0, minAlert: 1, unit: "قطعة", price: 0, location: "" });
    setShowForm(false);
    showToast("✅ تم إضافة القطعة");
  };

  const updateQty = (id, delta) => setParts(parts.map(p => p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p));

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-bold text-amber-800">تنبيه: مخزون منخفض ({lowStock.length} صنف)</p>
            <p className="text-xs text-amber-700 mt-0.5">{lowStock.map(p => p.name).join(" • ")}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1 min-w-[160px]">
          <Search size={14} className="text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent outline-none w-full text-sm"/>
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 text-sm font-bold">
          <Plus size={15}/> إضافة قطعة
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-5">
          <h4 className="font-bold mb-4">إضافة قطعة غيار جديدة</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <input value={form.code}     onChange={e => setForm({...form, code:     e.target.value})}              placeholder="الرمز *"     className="border rounded-xl px-3 py-2 text-sm"/>
            <input value={form.name}     onChange={e => setForm({...form, name:     e.target.value})}              placeholder="الاسم *"     className="border rounded-xl px-3 py-2 text-sm"/>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}             className="border rounded-xl px-3 py-2 text-sm">
              <option>ميكانيكية</option><option>كهربائية</option><option>مواد استهلاكية</option><option>فلتر</option>
            </select>
            <input value={form.unit}     onChange={e => setForm({...form, unit:     e.target.value})}              placeholder="الوحدة"      className="border rounded-xl px-3 py-2 text-sm"/>
            <input type="number" value={form.qty}      onChange={e => setForm({...form, qty:      +e.target.value})} placeholder="الكمية"      className="border rounded-xl px-3 py-2 text-sm"/>
            <input type="number" value={form.minAlert} onChange={e => setForm({...form, minAlert: +e.target.value})} placeholder="حد التنبيه" className="border rounded-xl px-3 py-2 text-sm"/>
            <input type="number" value={form.price}    onChange={e => setForm({...form, price:    +e.target.value})} placeholder="السعر ($)"  className="border rounded-xl px-3 py-2 text-sm"/>
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}              placeholder="الموقع"      className="border rounded-xl px-3 py-2 text-sm"/>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border rounded-xl text-sm">إلغاء</button>
            <button onClick={addPart}                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">حفظ</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-right">
                <th className="px-4 py-3">الرمز</th>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">الفئة</th>
                <th className="px-4 py-3">الكمية</th>
                <th className="px-4 py-3">الحد</th>
                <th className="px-4 py-3">السعر</th>
                <th className="px-4 py-3">الموقع</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={`border-t hover:bg-slate-50 ${p.qty <= p.minAlert ? "bg-amber-50/40" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3">{p.name} {p.qty <= p.minAlert && <span className="text-amber-500 text-xs">⚠️</span>}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(p.id, -1)} className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-700 rounded font-bold text-xs">-</button>
                      <span className="w-8 text-center font-bold">{p.qty}</span>
                      <button onClick={() => updateQty(p.id,  1)} className="w-6 h-6 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded font-bold text-xs">+</button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.minAlert} {p.unit}</td>
                  <td className="px-4 py-3 text-xs">${p.price}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{p.location}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { if (window.confirm(`حذف "${p.name}"؟`)) setParts(parts.filter(x => x.id !== p.id)); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={13}/>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400">لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl">{toast}</div>}
    </div>
  );
}

// ─── Analytics & Reports ──────────────────────────────────────────────────────
function AnalyticsReports() {
  const equipment  = storage.get("equipment",   INITIAL_EQUIPMENT);
  const spareParts = storage.get("spare_parts", INITIAL_SPARE_PARTS);
  const records    = storage.get("maintenance_records", []);

  const totalCost  = equipment.reduce((s, e) => s + (e.maintenanceCost || 300), 0);
  const partsValue = spareParts.reduce((s, p) => s + p.price * p.qty, 0);
  const mostFailing = [...equipment].sort((a, b) => b.totalFailures - a.totalFailures).slice(0, 3);
  const completedCount = records.filter(r => r.status === "مكتملة").length;
  const pendingCount   = records.filter(r => r.status !== "مكتملة").length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{equipment.length}</p>
          <p className="text-xs text-slate-500 mt-1">إجمالي المعدات</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{completedCount}</p>
          <p className="text-xs text-slate-500 mt-1">صيانة مكتملة</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1">طلبات قيد التنفيذ</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{equipment.filter(e => e.critical).length}</p>
          <p className="text-xs text-slate-500 mt-1">معدات حرجة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost */}
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700"><DollarSign size={18}/> تحليل التكاليف</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
              <span className="text-sm text-slate-600">إجمالي تكاليف الصيانة (تقديري)</span>
              <span className="text-xl font-bold text-blue-600">${totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
              <span className="text-sm text-slate-600">قيمة قطع الغيار المخزنة</span>
              <span className="text-xl font-bold text-amber-600">${partsValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Most failing */}
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700"><TrendingUp size={18}/> أكثر المعدات عطلاً</h3>
          <div className="space-y-2">
            {mostFailing.map((e, idx) => (
              <div key={e.id} className="flex justify-between items-center p-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <span>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                  <span className="text-sm">{e.name}</span>
                </div>
                <span className={`font-bold text-sm ${e.totalFailures > 2 ? "text-red-600" : "text-amber-600"}`}>{e.totalFailures} عطل</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status pie */}
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700"><PieChart size={18}/> حالة المعدات</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "جيد",          value: equipment.filter(e => e.status === "جيد").length,          bg: "bg-emerald-50", text: "text-emerald-600" },
              { label: "يحتاج صيانة",  value: equipment.filter(e => e.status === "تحتاج صيانة").length,  bg: "bg-amber-50",   text: "text-amber-600"   },
              { label: "تحت صيانة",    value: equipment.filter(e => e.status === "تحت صيانة").length,    bg: "bg-blue-50",    text: "text-blue-600"    },
              { label: "معطل",         value: equipment.filter(e => e.status === "معطل").length,          bg: "bg-red-50",     text: "text-red-600"     },
            ].map(s => (
              <div key={s.label} className={`${s.bg} p-3 rounded-xl text-center`}>
                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl p-5 border">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700"><AlertCircle size={18}/> توصيات</h3>
          <div className="space-y-3">
            {equipment.filter(e => e.critical && e.status !== "جيد").length > 0 && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="font-bold text-red-700 text-sm">⚠️ أولوية عالية</p>
                <p className="text-xs text-red-600 mt-1">معدات حرجة خارج الخدمة — تحتاج إجراءً فورياً</p>
              </div>
            )}
            {spareParts.filter(p => p.qty <= p.minAlert).length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="font-bold text-amber-700 text-sm">📦 مخزون منخفض</p>
                <p className="text-xs text-amber-600 mt-1">يوجد {spareParts.filter(p => p.qty <= p.minAlert).length} صنف بمخزون دون الحد الأدنى</p>
              </div>
            )}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="font-bold text-slate-700 text-sm">📊 تحليل الأداء</p>
              <p className="text-xs text-slate-500 mt-1">المعدات الأكثر عطلاً تحتاج إلى خطة صيانة وقائية محسنة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function MainDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const role    = ROLES_DEFINITIONS[user.role];
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  const tabs = [
    { id: "dashboard",  label: "لوحة التحكم", icon: <Home    size={18}/> },
    { id: "equipment",  label: "المعدات",      icon: <Wrench  size={18}/> },
    { id: "spareparts", label: "قطع الغيار",   icon: <Box     size={18}/> },
    { id: "reports",    label: "التقارير",      icon: <BarChart size={18}/> },
    ...(isAdmin ? [{ id: "users", label: "المستخدمين", icon: <Users size={18}/> }] : []),
  ];

  const equipment  = storage.get("equipment",    INITIAL_EQUIPMENT);
  const spareParts = storage.get("spare_parts",  INITIAL_SPARE_PARTS);
  const users      = storage.get("system_users", INITIAL_USERS);

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-800 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Shield size={20}/></div>
          <div>
            <h1 className="font-bold text-lg leading-tight">نظام الصيانة المتكامل</h1>
            <p className="text-xs opacity-75">{user.name} — {role?.name || user.role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors" title="تسجيل الخروج">
          <LogOut size={18}/>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white px-4 gap-1 overflow-x-auto shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm font-medium ${
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === "dashboard"  && <StatsCards equipment={equipment} spareParts={spareParts} users={users}/>}
        {activeTab === "equipment"  && <EquipmentMaintenance/>}
        {activeTab === "spareparts" && <SparePartsInventory/>}
        {activeTab === "reports"    && <AnalyticsReports/>}
        {activeTab === "users" && isAdmin && <AdminUsers currentUser={user}/>}
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = sessionStorage.getItem("boc_session");
      if (!s) return null;
      const { userId, expiry } = JSON.parse(s);
      if (expiry < Date.now()) { sessionStorage.removeItem("boc_session"); return null; }
      return storage.get("system_users", INITIAL_USERS).find(u => u.id === userId) || null;
    } catch { return null; }
  });

  const handleLogout = () => { sessionStorage.clear(); setUser(null); };

  return user
    ? <MainDashboard user={user} onLogout={handleLogout}/>
    : <LoginScreen onLogin={setUser}/>;
}
