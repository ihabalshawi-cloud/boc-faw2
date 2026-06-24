import React, { useState, useEffect } from "react";
import { storage } from "./utils";
import { GDriveProvider } from "./gdrive";
import { ToastProvider, ConfirmProvider } from "./contexts";
import LoginScreen, { recordLogoutFn } from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

function useDarkMode() {
  const [dark, setDark] = useState(() => storage.get("dark_mode", false));
  useEffect(() => {
    storage.set("dark_mode", dark);
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return [dark, setDark];
}

export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useDarkMode();

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
  `;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <GDriveProvider>
          <style>{style}</style>
          {user
            ? <Dashboard emp={user} onLogout={()=>{recordLogoutFn(user?.id);sessionStorage.clear();setUser(null);}} dark={dark} setDark={setDark}/>
            : <LoginScreen onLogin={setUser} dark={dark}/>
          }
        </GDriveProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
