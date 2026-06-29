import React, { useState, useRef, useEffect, useCallback } from "react";
import { Printer } from "lucide-react";
import { printElement } from "../utils";
import { FirebaseAPI } from "../firebase";

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

function Skel({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`}/>;
}

function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card rounded-2xl p-4 border border-color space-y-3">
      <Skel className="h-4 w-3/4"/>
      {lines > 1 && <Skel className="h-3 w-full"/>}
      {lines > 2 && <Skel className="h-3 w-1/2"/>}
    </div>
  );
}

function SkeletonMsg({ mine }) {
  return (
    <div className={`flex gap-2 mb-3 ${mine ? "flex-row-reverse" : ""}`}>
      <Skel className="h-8 w-8 rounded-full shrink-0"/>
      <div className={`space-y-1 ${mine ? "items-end flex flex-col" : ""}`}>
        <Skel className="h-3 w-20"/><Skel className="h-10 w-48 rounded-xl"/>
      </div>
    </div>
  );
}

function playAlert(type = "notification") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "message") { osc.frequency.value = 880; gain.gain.value = 0.1; }
    else if (type === "warning") { osc.frequency.value = 440; osc.type = "square"; gain.gain.value = 0.05; }
    else { osc.frequency.value = 660; gain.gain.value = 0.08; }
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

function sendDesktopNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(p => { if (p === "granted") new Notification(title, { body }); });
  }
}

function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(null);
  const failCount = useRef(0);
  const check = useCallback(async () => {
    const ok = await FirebaseAPI.checkConnection();
    if (ok) {
      failCount.current = 0;
      setIsConnected(true);
    } else {
      failCount.current += 1;
      // only declare offline after 2 consecutive failures to avoid transient blips
      if (failCount.current >= 2) setIsConnected(false);
    }
  }, []);
  useEffect(() => { check(); const t = setInterval(check, 30000); return () => clearInterval(t); }, [check]);
  return { isConnected };
}

function PageSkeleton({ rows = 4 }) {
  return (
    <div className="p-4 space-y-3">
      <Skel className="h-6 w-48 mb-5"/>
      {Array.from({length:rows},(_,i)=>(
        <div key={i} className="card rounded-2xl p-4 border border-color space-y-3">
          <div className="flex gap-3"><Skel className="h-10 w-10 rounded-xl shrink-0"/><div className="flex-1 space-y-2"><Skel className="h-4 w-2/3"/><Skel className="h-3 w-1/2"/></div></div>
          <Skel className="h-3 w-full"/><Skel className="h-3 w-3/4"/>
        </div>
      ))}
    </div>
  );
}

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(()=>setDebounced(value), delay); return ()=>clearTimeout(t); }, [value, delay]);
  return debounced;
}

function useStorageSync(key, setState) {
  useEffect(() => {
    const h = e => { if(e.key===key && e.newValue!==null) try{setState(JSON.parse(e.newValue));}catch{} };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, [key, setState]);
}

export { EmpPopover, PrintButton, SkeletonCard, SkeletonMsg, PageSkeleton, useDebounce, useStorageSync, playAlert, sendDesktopNotification, useConnectionStatus };
