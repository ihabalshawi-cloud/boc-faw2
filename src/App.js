// ========== لوحة التحكم الرئيسية مع الصلاحيات (نسخة مصححة) ==========
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const [employees, setEmployees] = useState(ACCOUNTS);
  const [allRequests, setAllRequests] = useState([]);
  const [inventory, setInventory] = useState(() => storage.get("inventory_items", INITIAL_INVENTORY));
  const { isConnected } = useConnectionStatus();
  
  // جلب صلاحيات المستخدم الحالي
  const rolePermissions = ROLES[emp.role] || ROLES.EMPLOYEE;
  const userRole = rolePermissions;
  
  // تحديد القائمة بناءً على الصلاحيات
  const menuItems = [
    { id: "home", label: "الرئيسية", icon: <Home size={18}/>, permission: true },
    { id: "requests", label: "طلباتي", icon: <FileText size={18}/>, permission: true },
    { id: "notifications", label: "الإشعارات", icon: <Bell size={18}/>, permission: true },
    { id: "changepass", label: "تغيير كلمة المرور", icon: <Shield size={18}/>, permission: true },
  ];
  
  // إضافة الموافقات (للمشرف العام والمدير الإداري)
  if (rolePermissions.requests?.approve) {
    menuItems.unshift({ id: "approvals", label: "الموافقات", icon: <ThumbsUp size={18}/>, permission: true });
  }
  
  // إضافة المخزن (للمشرف العام ومدير المخزن)
  if (rolePermissions.inventory?.view) {
    menuItems.push({ id: "inventory", label: "المخزن", icon: <Package size={18}/>, permission: true });
  }
  
  // إدارة الموظفين (للمشرف العام فقط)
  if (rolePermissions.employees?.view) {
    menuItems.push({ id: "employees", label: "الموظفين", icon: <Users size={18}/>, permission: true });
  }

  useEffect(() => {
    const load = async () => {
      if (isConnected) setAllRequests(await FirebaseAPI.getAllRequests());
      else setAllRequests(storage.get("all_requests", []));
    };
    load();
  }, [isConnected]);

  const requestsByStatus = {
    pending: allRequests.filter(r => r.status === "بانتظار المراجعة").length,
    approved: allRequests.filter(r => r.status === "موافق عليها").length,
    rejected: allRequests.filter(r => r.status === "مرفوضة").length
  };
  const totalRequests = allRequests.length;
  const completionRate = totalRequests > 0 ? Math.round((requestsByStatus.approved / totalRequests) * 100) : 0;
  
  const lowStockCount = inventory.filter(i => i.qty <= i.minAlert).length;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold">BOC</span></div>
          <div><h1 className="font-bold">شركة نفط البصرة</h1><p className="text-xs text-slate-500">شعبة مستودع الفاو - نظام الإدارة المتكامل</p></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            {isConnected ? <><Wifi size={12} className="text-emerald-500"/><span>متصل</span></> : <><WifiOff size={12} className="text-amber-500"/><span>غير متصل</span></>}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold">{emp.name}</p>
            <div className="flex items-center gap-1">
              <Shield size={10} className="text-slate-400"/>
              <p className="text-xs text-slate-500">{rolePermissions.name}</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut size={18}/></button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row">
        <aside className="md:w-64 bg-white border-l min-h-screen p-4">
          <nav className="space-y-1">
            {menuItems.filter(item => item.permission).map(item => (
              <button key={item.id} onClick={()=>setView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${view===item.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs">
            <p className="font-bold mb-2 flex items-center gap-2"><Key size={12}/> صلاحياتك</p>
            <ul className="space-y-1 text-[11px] text-slate-600">
              {rolePermissions.requests?.approve && <li>✓ الموافقة على الطلبات</li>}
              {rolePermissions.inventory?.edit && <li>✓ إدارة المخزن</li>}
              {rolePermissions.employees?.edit && <li>✓ إدارة الموظفين</li>}
              {rolePermissions.attendance?.edit && <li>✓ إدارة الحضور</li>}
              {rolePermissions.training?.assign && <li>✓ إسناد التدريب</li>}
              {rolePermissions.reports?.export && <li>✓ تصدير التقارير</li>}
            </ul>
          </div>
        </aside>
        <main className="flex-1 p-6">
          {view === "home" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"><User size={32} className="text-white"/></div>
                  <div><h2 className="text-2xl font-bold">مرحباً، {emp.name.split(" ")[0]}</h2><p className="opacity-80">تم تسجيل الدخول بنجاح - {rolePermissions.name}</p></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center justify-between"><Users size={20} className="text-blue-500"/><span className="text-2xl font-bold text-blue-600">{employees.length}</span></div><p className="text-sm text-slate-600 mt-1">إجمالي الموظفين</p></div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center justify-between"><FileText size={20} className="text-amber-500"/><span className="text-2xl font-bold text-amber-600">{requestsByStatus.pending}</span></div><p className="text-sm text-slate-600 mt-1">طلبات معلقة</p></div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center justify-between"><CheckCircle size={20} className="text-emerald-500"/><span className="text-2xl font-bold text-emerald-600">{completionRate}%</span></div><p className="text-sm text-slate-600 mt-1">نسبة الإنجاز</p></div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center justify-between"><Package size={20} className="text-violet-500"/><span className="text-2xl font-bold text-violet-600">{lowStockCount}</span></div><p className="text-sm text-slate-600 mt-1">مخزون منخفض</p></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart size={18}/> حالة الطلبات</h3>
                  <div className="space-y-3">
                    {[
                      { label: "بانتظار المراجعة", value: requestsByStatus.pending, color: "bg-amber-500" },
                      { label: "موافق عليها", value: requestsByStatus.approved, color: "bg-emerald-500" },
                      { label: "مرفوضة", value: requestsByStatus.rejected, color: "bg-red-500" }
                    ].map(s => { 
                      const percent = totalRequests > 0 ? Math.round(s.value / totalRequests * 100) : 0;
                      return (
                        <div key={s.label}>
                          <div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span>{percent}% ({s.value})</span></div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${s.color} rounded-full`} style={{width:`${percent}%`}}/></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18}/> توزيع الموظفين حسب الصلاحيات</h3>
                  <div className="space-y-3">
                    {Object.entries({
                      "مشرف عام": employees.filter(e=>e.role==="SUPER_ADMIN").length,
                      "مدير إداري": employees.filter(e=>e.role==="ADMIN").length,
                      "مدير مخزن": employees.filter(e=>e.role==="INVENTORY_MANAGER").length,
                      "منسق تدريب": employees.filter(e=>e.role==="TRAINING_COORDINATOR").length,
                      "مشرف حضور": employees.filter(e=>e.role==="ATTENDANCE_ADMIN").length,
                      "موظف": employees.filter(e=>e.role==="EMPLOYEE").length
                    }).filter(([_,v]) => v > 0).map(([label, count]) => {
                      const percent = employees.length > 0 ? Math.round(count / employees.length * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1"><span>{label}</span><span>{percent}% ({count})</span></div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${percent}%`}}/></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {view === "requests" && <RequestsPage emp={emp} />}
          {view === "approvals" && <ApprovalsPage emp={emp} rolePermissions={rolePermissions} />}
          {view === "notifications" && <NotificationsPage emp={emp} />}
          {view === "inventory" && <InventorySystem showAlert={true} rolePermissions={rolePermissions} />}
          {view === "employees" && <EmployeeManager employees={employees} setEmployees={setEmployees} rolePermissions={rolePermissions} />}
          {view === "changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout} />}
        </main>
      </div>
    </div>
  );
}