import React, { useState, useRef, useEffect } from "react";
import { Printer } from "lucide-react";
import { printElement } from "../utils";

function EmpPopover({ emp, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  if (!emp) return <span>{children}</span>;
  return (
    <span ref={ref} className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="font-medium hover:text-blue-600 hover:underline transition-colors">
        {children}
      </button>
      {open && (
        <div className="absolute z-[150] card rounded-2xl shadow-2xl border border-color p-4 min-w-[220px] top-full mt-1 right-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">{emp.name?.[0]}</span>
            </div>
            <div><p className="font-bold text-sm">{emp.name}</p><p className="text-xs text-secondary">{emp.jobNum}</p></div>
          </div>
          <div className="space-y-1.5 text-xs border-t border-color pt-2">
            <div className="flex justify-between gap-2"><span className="text-secondary">المنصب</span><span className="font-medium text-left">{emp.title}</span></div>
            <div className="flex justify-between gap-2"><span className="text-secondary shrink-0">القسم</span><span className="font-medium text-left text-[11px]">{emp.dept}</span></div>
            <div className="flex justify-between gap-2"><span className="text-secondary">الدوام</span><span className="font-medium">{emp.shift || "—"}</span></div>
          </div>
        </div>
      )}
    </span>
  );
}

function PrintButton({ targetId, label = "طباعة" }) {
  return (<button onClick={() => targetId ? printElement(targetId) : window.print()} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl shadow-sm border btn-secondary"><Printer size={13}/> {label}</button>);
}

export { EmpPopover, PrintButton };
