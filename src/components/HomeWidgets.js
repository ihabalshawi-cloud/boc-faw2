import React, { useMemo } from "react";
import { Users, Clock, CheckCircle, Package, AlertTriangle, CheckSquare,
  Wrench, Box, FileText, User } from "lucide-react";
import { INITIAL_EQUIPMENT, INITIAL_MAINT_SPARE_PARTS } from "../constants";
import { storage } from "../utils";

export default function HomeWidgets({ emp, employees, allRequests, isAdmin, switchView }) {
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "مساء النور" : hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";
  const isPrivileged = isAdmin || emp.role === "inventory_manager";

  const eq   = storage.get("equipment", INITIAL_EQUIPMENT);
  const prts = storage.get("maint_spare_parts", INITIAL_MAINT_SPARE_PARTS);
  const recs = storage.get("maintenance_records", []);

  const activityFeed = useMemo(() => {
    const items = [];
    storage.get("all_requests",[]).filter(Boolean).slice(0,4).forEach(r => r.submittedAt && items.push({
      time:new Date(r.submittedAt), icon:"📋", text:`${(r.empName||"").split(" ")[0]} — طلب ${r.type}`, view:"requests"
    }));
    storage.get("tasks_system",[]).filter(t=>t&&t.createdAt).slice(0,4).forEach(t => items.push({
      time:new Date(t.createdAt), icon:"✅", text:`مهمة: ${t.title}`, view:"tasks"
    }));
    recs.filter(r=>r&&r.requestedAt).slice(0,3).forEach(r => items.push({
      time:new Date(r.requestedAt), icon:"🔧", text:`صيانة: ${r.equipmentName}`, view:"maint_equipment"
    }));
    return items.sort((a,b)=>b.time-a.time).slice(0,6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hrCards = [
    { label:"إجمالي الموظفين",  value:employees.length, icon:<Users size={22}/>, color:"from-blue-500 to-blue-600", action:()=>switchView("employees") },
    { label:"طلبات معلقة", value:allRequests.filter(r=>r&&r.status==="بانتظار المراجعة").length, icon:<Clock size={22}/>, color:"from-amber-500 to-amber-600", action:()=>switchView(isAdmin?"approvals":"requests") },
    { label:"طلبات مقبولة", value:allRequests.filter(r=>r&&r.status==="موافق عليها").length, icon:<CheckCircle size={22}/>, color:"from-emerald-500 to-emerald-600", action:()=>switchView("requests") },
    { label:"مخزون الآلات", value:storage.get("inventory_items",[]).length, icon:<Package size={22}/>, color:"from-violet-500 to-violet-600", action:()=>switchView("inventory") },
    { label:"مخزون منخفض", value:storage.get("inventory_items",[]).filter(i=>i&&i.qty<=(i.minQty||3)).length, icon:<AlertTriangle size={22}/>, color:"from-red-500 to-red-600", action:()=>switchView("inventory") },
    { label:"مهام نشطة", value:storage.get("tasks_system",[]).filter(t=>t&&t.status!=="مكتملة").length, icon:<CheckSquare size={22}/>, color:"from-indigo-500 to-indigo-600", action:()=>switchView("tasks") },
  ];

  const maintCards = [
    { label:"إجمالي المعدات",    value:eq.length,                                                     icon:<Wrench size={22}/>,       color:"from-blue-600 to-blue-700",     action:()=>switchView("maint_equipment") },
    { label:"معدات حرجة",         value:eq.filter(e=>e&&e.critical).length,                              icon:<AlertTriangle size={22}/>, color:"from-red-600 to-red-700",        action:()=>switchView("maint_equipment") },
    { label:"صيانة مستحقة",       value:eq.filter(e=>e&&new Date(e.nextMaintenance)<=new Date()).length,  icon:<Clock size={22}/>,         color:"from-amber-600 to-amber-700",    action:()=>switchView("maint_equipment") },
    { label:"طلبات قيد التنفيذ",  value:recs.filter(r=>r&&r.status!=="مكتملة").length,                   icon:<CheckCircle size={22}/>,   color:"from-orange-500 to-orange-600",  action:()=>switchView("maint_equipment") },
    { label:"قطع الغيار",         value:prts.length,                                                      icon:<Box size={22}/>,           color:"from-emerald-600 to-emerald-700",action:()=>switchView("maint_parts") },
    { label:"مخزون قطع منخفض",   value:prts.filter(p=>p&&p.qty<=p.minAlert).length,                     icon:<AlertTriangle size={22}/>, color:"from-rose-500 to-rose-600",      action:()=>switchView("maint_parts") },
    { label:"صيانة مكتملة",       value:recs.filter(r=>r&&r.status==="مكتملة").length,                   icon:<CheckCircle size={22}/>,   color:"from-teal-500 to-teal-600",      action:()=>switchView("maint_reports") },
    { label:"معدات جيدة",         value:eq.filter(e=>e&&e.status==="جيد").length,                        icon:<Wrench size={22}/>,        color:"from-cyan-500 to-cyan-600",      action:()=>switchView("maint_equipment") },
  ];

  const fmtTime = (d) => { try { return d.toLocaleDateString("ar-IQ",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); } catch { return ""; } };

  return (
    <div className="space-y-6">
      <div className="card rounded-2xl p-6 border-color border">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center"><User size={28} className="text-white"/></div>
          <div>
            <h2 className="text-xl font-bold">{greeting}، {emp.name.split(" ")[0]}</h2>
            <p className="text-secondary text-sm">{emp.title} — {emp.dept}</p>
            <p className="text-secondary text-xs">{new Date().toLocaleDateString("ar-IQ",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3"><div className="h-5 w-1 bg-blue-600 rounded-full"/><h3 className="font-bold text-base">إدارة الموارد البشرية والمستودع</h3></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {hrCards.map((k,i)=>(
            <button key={i} onClick={k.action} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white text-right hover:opacity-90 transition-opacity`}>
              <div className="flex items-center justify-between">{k.icon}<p className="text-3xl font-bold">{k.value}</p></div>
              <p className="text-sm mt-2 text-white/80">{k.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3"><div className="h-5 w-1 bg-orange-500 rounded-full"/><h3 className="font-bold text-base">إدارة الصيانة والمعدات</h3></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {maintCards.map((k,i)=>(
            <button key={i} onClick={k.action} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white text-right hover:opacity-90 transition-opacity`}>
              <div className="flex items-center justify-between">{k.icon}<p className="text-3xl font-bold">{k.value}</p></div>
              <p className="text-sm mt-2 text-white/80">{k.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${isPrivileged ? "md:grid-cols-3" : "md:grid-cols-1 max-w-lg"}`}>
        {isPrivileged && (
          <div className="card rounded-2xl border-color border p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm flex items-center gap-1.5"><FileText size={15}/> آخر طلبات الإجازة</h4>
              <button onClick={()=>switchView(isAdmin?"approvals":"requests")} className="text-xs text-blue-600 hover:underline">عرض الكل</button>
            </div>
            {allRequests.length===0 ? <p className="text-secondary text-xs text-center py-4">لا توجد طلبات</p> :
            allRequests.filter(Boolean).slice(0,4).map(r=>(
              <div key={r.id} className="flex justify-between items-center py-2 border-b border-color last:border-0 text-xs">
                <span className="font-medium">{r.empName?.split(" ").slice(0,2).join(" ")}</span>
                <span className="text-secondary">{r.type} — {r.days} يوم</span>
                <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${r.status==="موافق عليها"?"bg-emerald-100 text-emerald-700":r.status==="مرفوضة"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card rounded-2xl border-color border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm flex items-center gap-1.5"><Wrench size={15}/> آخر طلبات الصيانة</h4>
            <button onClick={()=>switchView("maint_equipment")} className="text-xs text-blue-600 hover:underline">عرض الكل</button>
          </div>
          {recs.length===0 ? <p className="text-secondary text-xs text-center py-4">لا توجد طلبات صيانة</p> :
          recs.filter(Boolean).slice(0,4).map(r=>(
            <div key={r.id} className="flex justify-between items-center py-2 border-b border-color last:border-0 text-xs">
              <span className="font-medium truncate max-w-[120px]">{r.equipmentName}</span>
              <span className="text-secondary">{new Date(r.requestedAt).toLocaleDateString("ar-IQ")}</span>
              <span className={`px-1.5 py-0.5 rounded-full font-bold text-[10px] ${r.status==="مكتملة"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{r.status}</span>
            </div>
          ))}
        </div>

        {isPrivileged && (
          <div className="card rounded-2xl border-color border p-4">
            <h4 className="font-bold text-sm mb-3">⚡ آخر النشاطات</h4>
            {activityFeed.length === 0
              ? <p className="text-secondary text-xs text-center py-4">لا توجد نشاطات حديثة</p>
              : activityFeed.map((a,i) => (
                <button key={i} onClick={()=>switchView(a.view)}
                  className="w-full flex items-start gap-2 py-2 border-b border-color last:border-0 text-right hover:bg-hover rounded px-1 transition-colors">
                  <span className="text-base shrink-0 mt-0.5">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{a.text}</p>
                    <p className="text-[10px] text-secondary">{fmtTime(a.time)}</p>
                  </div>
                </button>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
