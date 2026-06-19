import React, { useState, useCallback, useContext, createContext } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, X } from "lucide-react";

export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const TOAST_CFG = {
  success: { border: "border-r-[3px] border-emerald-500", icon: <CheckCircle size={15} className="text-emerald-500 shrink-0"/> },
  error:   { border: "border-r-[3px] border-red-500",     icon: <AlertCircle  size={15} className="text-red-500 shrink-0"/> },
  warning: { border: "border-r-[3px] border-[#C87A2E]",   icon: <AlertTriangle size={15} className="text-[#C87A2E] shrink-0"/> },
  info:    { border: "border-r-[3px] border-blue-500",    icon: <AlertCircle  size={15} className="text-blue-400 shrink-0"/> },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "info", ms = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);
  return (
    <ToastContext.Provider value={add}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col-reverse gap-2 pointer-events-none" dir="rtl">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item flex items-center gap-3 px-4 py-3 rounded-md pointer-events-auto min-w-[260px] max-w-xs border border-[#E4E2DC] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] ${TOAST_CFG[t.type].border}`}>
            {TOAST_CFG[t.type].icon}
            <span className="text-sm font-medium flex-1 text-[#1C1C1C]">{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-[#787774] hover:text-[#1C1C1C] shrink-0 transition-colors"><X size={13}/></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }) {
  const [dlg, setDlg] = useState(null);
  const confirm = useCallback((msg, opts = {}) =>
    new Promise(resolve => setDlg({ msg, opts, resolve }))
  , []);
  const close = (val) => { dlg?.resolve(val); setDlg(null); };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dlg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[300] flex items-center justify-center p-4" dir="rtl">
          <div className="card rounded-xl p-6 max-w-sm w-full border border-color shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-md mt-0.5 shrink-0 ${dlg.opts.danger ? "bg-red-50" : "bg-[#FDF3E7]"}`}>
                <AlertTriangle size={18} className={dlg.opts.danger ? "text-red-600" : "text-[#C87A2E]"}/>
              </div>
              <div>
                <h3 className="font-bold text-sm text-primary">{dlg.opts.title || "تأكيد الإجراء"}</h3>
                <p className="text-sm text-secondary mt-1.5 leading-relaxed">{dlg.msg}</p>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => close(false)} className="flex-1 py-2.5 border border-color rounded-md text-sm font-medium hover:bg-hover transition-colors text-secondary">إلغاء</button>
              <button onClick={() => close(true)} className={`flex-1 py-2.5 rounded-md text-white text-sm font-semibold transition-colors ${dlg.opts.danger ? "bg-red-600 hover:bg-red-700" : "bg-[#C87A2E] hover:bg-[#B06D27]"}`}>
                {dlg.opts.ok || "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
