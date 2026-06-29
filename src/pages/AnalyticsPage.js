import React, { useMemo } from "react";
import { Shield, CheckCircle, Clock, Users, Package, AlertTriangle, Wrench, CheckSquare } from "lucide-react";
import { LEAVE_TYPES, ITEM_CONDITIONS, MONTHS_AR, PIE_COLORS, LOW_STOCK_THRESHOLD } from "../constants";
import { storage } from "../utils";
import { SVGBarChart, SVGPieChart } from "../components/Charts";

function AnalyticsDashboard({ employees, allRequests }) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const { monthlyData, typeData, condData, deptData, eqStatusData, kpis } = useMemo(() => {
    const invItems  = storage.get("inventory_items", []);
    const equipment = storage.get("equipment", []);
    const tasks     = storage.get("tasks_system", []);

    const monthlyData = MONTHS_AR.slice(0, currentMonth+1).map((month, i) => {
      const monthReqs = allRequests.filter(r => {
        if (!r) return false;
        const d = new Date(r.submittedAt);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });
      return { name: month.slice(0,3), "موافق": monthReqs.filter(r=>r.status==="موافق عليها").length, "مرفوض": monthReqs.filter(r=>r.status==="مرفوضة").length, "معلق": monthReqs.filter(r=>r.status==="بانتظار المراجعة").length };
    });

    const typeData = Object.entries(LEAVE_TYPES).map(([k, v]) => ({
      name: v.label.replace("إجازة ",""), value: allRequests.filter(r => r.type === k).length
    })).filter(d => d.value > 0);

    const condData = ITEM_CONDITIONS.map(c => ({ name: c, value: invItems.filter(i => i.condition === c).length })).filter(d => d.value > 0);

    const deptData = [...new Set(employees.map(e=>e.dept))].map(d => ({
      name: d.replace("قسم ","").replace("شعبة ",""), value: employees.filter(e=>e.dept===d).length
    }));

    const eqStatusData = ["جيد","تحتاج صيانة","تحت صيانة","معطل"].map(s => ({
      name: s, value: equipment.filter(e => e.status === s).length
    })).filter(d => d.value > 0);

    const pendingReqs  = allRequests.filter(r => r && r.status === "بانتظار المراجعة").length;
    const approvedReqs = allRequests.filter(r => r && r.status === "موافق عليها").length;
    const totalInv     = invItems.reduce((s, i) => s + Number(i.qty), 0);
    const lowStockCount = invItems.filter(i => i.qty <= (i.minQty || LOW_STOCK_THRESHOLD)).length;
    const overdueEq    = equipment.filter(e => e.nextMaintenance && new Date(e.nextMaintenance) < now).length;
    const openTasks    = tasks.filter(t => t.status !== "مكتملة" && t.status !== "ملغاة").length;

    const kpis = [
      { label:"إجمالي الموظفين",        value:employees.length,                              icon:<Users size={24}/>,        color:"from-blue-500 to-blue-600" },
      { label:"طلبات معلقة",             value:pendingReqs,                                   icon:<Clock size={24}/>,        color:"from-amber-500 to-amber-600" },
      { label:"طلبات مقبولة",            value:approvedReqs,                                  icon:<CheckCircle size={24}/>,  color:"from-emerald-500 to-emerald-600" },
      { label:"مخزون منخفض",             value:lowStockCount,                                 icon:<AlertTriangle size={24}/>,color:"from-red-500 to-red-600" },
      { label:"إجمالي المخزون",          value:totalInv,                                      icon:<Package size={24}/>,      color:"from-violet-500 to-violet-600" },
      { label:"مشرفي النظام",            value:employees.filter(e=>e.role==="admin").length,  icon:<Shield size={24}/>,       color:"from-indigo-500 to-indigo-600" },
      { label:"معدات متأخرة الصيانة",   value:overdueEq,                                     icon:<Wrench size={24}/>,       color:"from-rose-500 to-rose-600" },
      { label:"مهام مفتوحة",             value:openTasks,                                     icon:<CheckSquare size={24}/>,  color:"from-cyan-500 to-cyan-600" },
    ];

    return { monthlyData, typeData, condData, deptData, eqStatusData, kpis };
  }, [employees, allRequests, currentMonth, currentYear]);

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-lg">لوحة التحكم التحليلية</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k,i) => (
          <div key={i} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white`}>
            <div className="flex items-center justify-between"><div>{k.icon}</div><p className="text-3xl font-bold">{k.value}</p></div>
            <p className="text-sm mt-2 text-white/80">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">الطلبات الشهرية ({currentYear})</h4>
          <SVGBarChart data={monthlyData} keys={["موافق","مرفوض","معلق"]} colors={["#10b981","#ef4444","#f59e0b"]} height={200}/>
        </div>
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">توزيع أنواع الإجازات</h4>
          <SVGPieChart data={typeData} colors={PIE_COLORS} height={200}/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">حالة المخزون</h4>
          <SVGPieChart data={condData} colors={["#10b981","#64748b","#f59e0b","#ef4444","#8b5cf6"]} height={180} donut={true}/>
        </div>
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">توزيع الموظفين حسب القسم</h4>
          <SVGBarChart data={deptData} keys={["value"]} colors={["#6366f1"]} height={180} labelKey="name"/>
        </div>
        <div className="card rounded-2xl border-color border p-4">
          <h4 className="font-bold mb-3 text-sm">حالة المعدات</h4>
          <SVGPieChart data={eqStatusData} colors={["#10b981","#f59e0b","#3b82f6","#ef4444"]} height={180} donut={true}/>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
