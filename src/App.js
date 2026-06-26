import React, { useState, useEffect } from "react";
import { storage } from "./utils";
import { GDriveProvider } from "./gdrive";
import { ToastProvider, ConfirmProvider } from "./contexts";
import LoginScreen, { recordLogoutFn } from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { useStorageSync } from "./components/Shared";

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(err) { console.error("App crash:", err); }
  render() {
    if (this.state.err) return (
      <div dir="rtl" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px",fontFamily:"system-ui",background:"#F4F4F0",padding:"24px",textAlign:"center"}}>
        <p style={{fontSize:"3rem"}}>⚠️</p>
        <p style={{fontWeight:"bold",fontSize:"1.25rem",color:"#1C1C1C"}}>حدث خطأ غير متوقع</p>
        <p style={{color:"#787774",fontSize:"0.875rem",maxWidth:"380px"}}>{this.state.err?.message}</p>
        <button onClick={()=>window.location.reload()} style={{padding:"10px 24px",background:"#C87A2E",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:"bold"}}>إعادة تحميل الصفحة</button>
      </div>
    );
    return this.props.children;
  }
}

function useDarkMode() {
  const [dark, setDark] = useState(() => storage.get("dark_mode", false));
  useEffect(() => {
    storage.set("dark_mode", dark);
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return [dark, setDark];
}

function useFieldMode() {
  const [field, setField] = useState(() => storage.get("field_mode", false));
  useEffect(() => {
    storage.set("field_mode", field);
    document.documentElement.classList.toggle("field", field);
  }, [field]);
  return [field, setField];
}

function useLargeFont() {
  const [large, setLarge] = useState(() => storage.get("large_font", false));
  useEffect(() => {
    storage.set("large_font", large);
    document.documentElement.classList.toggle("large-font", large);
  }, [large]);
  return [large, setLarge];
}

export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useDarkMode();
  const [fieldMode, setFieldMode] = useFieldMode();
  const [largeFont, setLargeFont] = useLargeFont();
  useStorageSync("dark_mode", setDark);
  useStorageSync("field_mode", setFieldMode);
  useStorageSync("large_font", setLargeFont);

  const style = `
    :root { color-scheme: light; }
    .dark { color-scheme: dark; }
    .bg-main { background: ${dark?"#0D1117":"#F4F4F0"}; }
    .card {
      background: ${dark?"#161B22":"#ffffff"};
      color: ${dark?"#e2e8f0":"#1C1C1C"};
      box-shadow: ${dark?
        "0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)":
        "0 0 0 1px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)"};
    }
    .header-bar { background: ${dark?"#0D1117":"#ffffff"}; border-bottom: 1px solid ${dark?"#30363D":"#E4E2DC"}; }
    .sidebar { background: ${dark?"#0D1117":"#F4F4F0"}; }
    .input { background: ${dark?"#0D1117":"#ffffff"}; border: 1px solid ${dark?"#30363D":"#E4E2DC"}; color: ${dark?"#e2e8f0":"#1C1C1C"}; border-radius:6px; }
    .input:focus { border-color:#C87A2E; outline:none; }
    .input::placeholder { color: ${dark?"#6b7280":"#a8a29e"}; }
    .btn-secondary { background: ${dark?"#161B22":"#ffffff"}; color: ${dark?"#9ca3af":"#575553"}; }
    .bg-hover { background: ${dark?"#1a222e":"#EDEDE9"}; }
    .text-secondary { color: ${dark?"#6b7280":"#787774"}; }
    .text-primary { color: ${dark?"#e2e8f0":"#1C1C1C"}; }
    .border-color { border-color: ${dark?"#30363D":"#E4E2DC"} !important; }
    .bg-surface { background: ${dark?"#0D1117":"#ffffff"}; }
    select option { background: ${dark?"#161B22":"#ffffff"}; color: ${dark?"#e2e8f0":"#1C1C1C"}; }
    * { transition: background-color 0.15s, border-color 0.15s, color 0.1s; }
    @keyframes toastIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
    .toast-item { animation: toastIn 0.2s cubic-bezier(0.32,0.72,0,1); }
    @keyframes shimmer { from { background-position:-200% 0; } to { background-position:200% 0; } }
    .skeleton { background: linear-gradient(90deg,${dark?"#1e2a38 25%,#273444 50%,#1e2a38 75%":"#EDEDE9 25%,#F4F4F0 50%,#EDEDE9 75%"}); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    .ts-mono { font-family:'JetBrains Mono','IBM Plex Mono',monospace; }
    .ts-header { background:${dark?"#1a2232":"#F0EDE6"} !important; }
    .ts-we { background:${dark?"#2a1f0a":"#FFF3E6"} !important; }
    .ts-today { background:${dark?"#1a2d1a":"#E6F5E6"} !important; }
    button[class*="bg-blue-600"] { background-color: #C87A2E !important; }
    button[class*="bg-blue-700"] { background-color: #B06D27 !important; }
    button[class*="bg-indigo-600"] { background-color: #C87A2E !important; }
    button[class*="bg-indigo-700"] { background-color: #9A5F1F !important; }
    button[class*="hover:bg-blue-700"]:hover { background-color: #B06D27 !important; }
    button[class*="hover:bg-blue-600"]:hover { background-color: #C87A2E !important; }
    button[class*="hover:bg-indigo-800"]:hover { background-color: #875419 !important; }
    button[class*="rounded-xl"] { border-radius: 6px !important; }
    button[class*="rounded-2xl"] { border-radius: 8px !important; }
    button:active:not(:disabled) { transform: scale(0.98); transition: transform 0.1s; }
    /* ── Field mode: high contrast for outdoor / glove use ── */
    .field .bg-main { background: #0A0A0A !important; }
    .field .card { background: #181818 !important; color: #FFFFFF !important; box-shadow: 0 0 0 1px rgba(255,255,255,0.1) !important; }
    .field .header-bar { background: #000000 !important; border-color: #404040 !important; }
    .field .sidebar { background: #000000 !important; }
    .field .btn-secondary { background: #222222 !important; color: #E8E8E8 !important; border-color: #444 !important; }
    .field .bg-hover { background: #2A2A2A !important; }
    .field .text-secondary { color: #C8C8C8 !important; }
    .field .text-primary { color: #FFFFFF !important; }
    .field .border-color { border-color: #404040 !important; }
    .field .bg-surface { background: #181818 !important; }
    .field .input { background: #181818 !important; color: #FFFFFF !important; border-color: #505050 !important; }
    .field button { min-height: 44px; }
    .field nav button { min-height: 52px; }
    .field .text-xs { font-size: 0.82rem !important; line-height: 1.4 !important; }
    .field .text-sm { font-size: 0.95rem !important; }
    /* ── Quick Read: larger font for long reports / low-light reading ── */
    .large-font .text-xs  { font-size: 0.875rem !important; line-height: 1.6 !important; }
    .large-font .text-sm  { font-size: 1rem     !important; line-height: 1.6 !important; }
    .large-font .text-base{ font-size: 1.125rem !important; }
    .large-font .text-lg  { font-size: 1.3rem   !important; }
    .large-font p, .large-font td, .large-font li { line-height: 1.8 !important; }
  `;

  return (
    <ErrorBoundary>
    <ToastProvider>
      <ConfirmProvider>
        <GDriveProvider>
          <style>{style}</style>
          {user
            ? <Dashboard emp={user} onLogout={()=>{recordLogoutFn(user?.id);sessionStorage.clear();setUser(null);}} dark={dark} setDark={setDark} fieldMode={fieldMode} setFieldMode={setFieldMode} largeFont={largeFont} setLargeFont={setLargeFont}/>
            : <LoginScreen onLogin={setUser} dark={dark}/>
          }
        </GDriveProvider>
      </ConfirmProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}
