import React from "react";
import { Home, FileText, Bell, MessageSquare, Menu, LogOut } from "lucide-react";

export default function MobileNav({
  view, chatOpen, setChatOpen, switchView,
  unreadNotifs, chatUnread, canSeeApprovals, pendingCount,
  showMobileMenu, setShowMobileMenu, section, setSection,
  menuItems, onLogout,
}) {
  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-color z-20 flex" dir="ltr" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
        {[
          {id:"home",          icon:<Home size={20}/>,          label:"الرئيسية"},
          {id:"requests",      icon:<FileText size={20}/>,      label:"الطلبات"},
          {id:"notifications", icon:<Bell size={20}/>,          label:"الإشعارات", badge:unreadNotifs},
          {id:"chat",          icon:<MessageSquare size={20}/>, label:"الدردشة",   badge:chatUnread},
        ].map(item => (
          <button key={item.id}
            onClick={()=>item.id==="chat"?setChatOpen(o=>!o):switchView(item.id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 relative text-xs ${
              (item.id==="chat"&&chatOpen)||(item.id!=="chat"&&view===item.id)?"text-[#C87A2E]":"text-secondary"
            }`}>
            {item.icon}
            <span className="text-[9px]">{item.label}</span>
            {item.badge>0 && <span className="absolute top-1 right-2 bg-red-500 text-white text-[8px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">{item.badge}</span>}
          </button>
        ))}
        <button onClick={()=>setShowMobileMenu(true)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs relative ${showMobileMenu?"text-[#C87A2E]":"text-secondary"}`}>
          <Menu size={20}/><span className="text-[9px]">المزيد</span>
          {canSeeApprovals && pendingCount > 0 && <span className="absolute top-1 right-2 bg-red-500 text-white text-[8px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">{pendingCount}</span>}
        </button>
      </nav>

      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={()=>setShowMobileMenu(false)}>
          <div className="absolute bottom-0 inset-x-0 bg-main rounded-t-2xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto" dir="rtl" onClick={e=>e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"/>
            <div className="flex gap-2 mb-3">
              {[{k:"admin",lbl:"الإداري"},{k:"tech",lbl:"الفني"}].map(s=>(
                <button key={s.k} onClick={()=>setSection(s.k)}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl ${section===s.k?"bg-[#C87A2E] text-white":"btn-secondary border border-color"}`}>
                  {s.lbl}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {menuItems.map(item=>(
                <button key={item.id} onClick={()=>{switchView(item.id);setShowMobileMenu(false);}}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors relative ${view===item.id?"bg-[#C87A2E] text-white border-[#C87A2E]":"border-color hover:bg-hover"}`}>
                  {item.icon}
                  <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                  {item.badge>0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">{item.badge}</span>}
                </button>
              ))}
            </div>
            <button onClick={onLogout} className="mt-4 w-full py-3 text-red-500 font-bold text-sm border border-red-200 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2">
              <LogOut size={16}/> تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </>
  );
}
