import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
import { ACCOUNTS } from "../constants";
import { storage } from "../utils";

const fuzzy = (t, q) => { if (!t) return false; let i = 0; for (const c of String(t)) { if (c === q[i]) i++; if (i === q.length) return true; } return false; };

export default function GlobalSearch({ setView, onClose, employees = [] }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(-1);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSel(-1); }, [q]);

  const results = useMemo(() => {
    const ql = q.trim();
    if (ql.length < 2) return [];
    const out = [];
    const empList = employees.length > 0 ? employees : ACCOUNTS;
    empList.filter(e => fuzzy(e.name,ql) || fuzzy(e.jobNum,ql)).slice(0,4)
      .forEach(e => out.push({ type:"موظف", label:e.name, sub:e.dept, view:"employees", icon:"👤" }));
    storage.get("all_requests",[]).filter(r => fuzzy(r.empName,ql)||fuzzy(r.purpose,ql)).slice(0,3)
      .forEach(r => out.push({ type:"إجازة", label:r.empName, sub:`${r.type} — ${r.status}`, view:"requests", icon:"📋" }));
    storage.get("tasks_system",[]).filter(t => fuzzy(t.title,ql)||fuzzy(t.desc,ql)).slice(0,3)
      .forEach(t => out.push({ type:"مهمة", label:t.title, sub:t.status, view:"tasks", icon:"✅" }));
    storage.get("inventory_items",[]).filter(i => fuzzy(i.name,ql)||fuzzy(i.code,ql)).slice(0,3)
      .forEach(i => out.push({ type:"مخزون", label:i.name, sub:i.code, view:"inventory", icon:"📦" }));
    storage.get("maint_spare_parts",[]).filter(p => fuzzy(p.name,ql)||fuzzy(p.code,ql)).slice(0,3)
      .forEach(p => out.push({ type:"قطعة غيار", label:p.name, sub:p.category, view:"maint_parts", icon:"🔧" }));
    storage.get("pm_projects",[]).filter(p => fuzzy(p.name,ql)||fuzzy(p.manager,ql)).slice(0,3)
      .forEach(p => out.push({ type:"مشروع", label:p.name, sub:`${p.status} — ${p.manager||""}`, view:"projects", icon:"🏗" }));
    storage.get("equipment",[]).filter(e => fuzzy(e.name,ql)||fuzzy(e.id?.toString(),ql)).slice(0,3)
      .forEach(e => out.push({ type:"معدة", label:e.name, sub:e.status, view:"maint_equipment", icon:"⚙" }));
    return out.slice(0,12);
  }, [q, employees]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s+1, results.length-1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s-1, -1)); return; }
      if (e.key === "Enter" && sel >= 0 && results[sel]) { setView(results[sel].view); onClose(); }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, setView, sel, results]);

  const SHORTCUTS = [["Ctrl K","فتح البحث"],["↑↓","التنقل"],["Enter","الانتقال"],["Esc","إغلاق"],["?","الاختصارات"]];

  return (
    <div className="fixed inset-0 bg-black/60 z-[400] flex items-start justify-center pt-16 px-4" dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card rounded-2xl shadow-2xl border border-color w-full max-w-lg">
        <div className="flex items-center gap-3 p-4 border-b border-color">
          <Search size={18} className="text-secondary shrink-0"/>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="ابحث عن موظف، طلب، مهمة، صنف..." className="flex-1 bg-transparent outline-none text-sm"/>
          <button onClick={onClose} className="text-secondary hover:text-primary"><X size={16}/></button>
        </div>
        {q.trim().length >= 2 ? (
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0
              ? <p className="text-center text-secondary text-sm py-8">لا توجد نتائج لـ «{q}»</p>
              : results.map((r,i) => (
                <button key={i} ref={el => el && i===sel && el.scrollIntoView({block:"nearest"})}
                  onClick={() => { setView(r.view); onClose(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right border-b border-color last:border-0 transition-colors ${i===sel?"bg-hover":"hover:bg-hover"}`}>
                  <span className="text-lg shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    <p className="text-xs text-secondary truncate">{r.sub}</p>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">{r.type}</span>
                </button>
              ))
            }
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <p className="text-xs text-secondary text-center">اكتب حرفين للبدء — البحث التقريبي مدعوم</p>
            <div className="border-t border-color pt-3 grid grid-cols-2 gap-x-6 gap-y-2">
              {SHORTCUTS.map(([k,v]) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <kbd className="px-1.5 py-0.5 bg-hover rounded text-[10px] font-mono shrink-0">{k}</kbd>
                  <span className="text-secondary">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
