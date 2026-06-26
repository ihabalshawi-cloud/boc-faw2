import React, { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Send, Wifi, WifiOff } from "lucide-react";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { playAlert } from "./Shared";

const CHAT_ADMINS = [{ id:1, name:"ايهاب الشاوي", title:"مسؤول الشعبة" }];

function ChatWindow({ emp, partnerId, partnerName, messages, isConnected, onBack, loadMessages }) {
  const [text, setText] = useState("");
  const [sentMsgs, setSentMsgs] = useState([]);
  const [pt, setPt] = useState(false);
  const bottomRef = useRef(null);
  const n = (v) => Number(v);
  const filtered = messages.filter(m =>
    (n(m.senderId) === n(emp.id) && n(m.toId) === n(partnerId)) ||
    (n(m.senderId) === n(partnerId) && n(m.toId) === n(emp.id))
  );
  const allMsgs = [...filtered, ...sentMsgs.filter(s => !filtered.some(f => f._key === s._key))];
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [allMsgs.length]);
  useEffect(() => { if(!isConnected)return; const t=setInterval(async()=>{const d=await FirebaseAPI.getTyping(partnerId);setPt(!!(d&&n(d.toId)===n(emp.id)&&Date.now()-d.ts<5000));},2500); return()=>clearInterval(t); }, [partnerId,emp.id,isConnected]);

  const send = async () => {
    if (!text.trim()) return;
    const key = `opt_${Date.now()}`;
    const msg = { text:text.trim(), sender:emp.name, senderId:emp.id, toId:partnerId, timestamp:Date.now(), dept:emp.dept, _key:key };
    setSentMsgs(prev => [...prev, msg]);
    storage.set(`chat_active_${partnerId}`, { empId:emp.id, timestamp:Date.now() });
    setText(""); FirebaseAPI.setTyping(emp.id, -1);
    if (isConnected) { await FirebaseAPI.sendMessage(msg); await loadMessages(); setSentMsgs([]); }
    else { const q=storage.get("chat_pending",[]); storage.set("chat_pending",[...q,msg]); }
    playAlert("message");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={onBack} className="text-blue-600 hover:underline text-sm">← رجوع</button>
        <h3 className="font-bold flex-1">{partnerName}</h3>
        <div className="flex items-center gap-1 text-xs">{isConnected?<><Wifi size={12} className="text-emerald-500"/><span className="text-emerald-600">متصل</span></>:<><WifiOff size={12} className="text-amber-500"/><span className="text-amber-600">غير متصل</span></>}</div>
      </div>
      <div className="flex-1 card rounded-2xl border-color border p-4 overflow-y-auto space-y-3">
        {allMsgs.length === 0 && <div className="text-center text-secondary py-8"><MessageSquare size={40} className="mx-auto mb-2"/><p>ابدأ المحادثة</p></div>}
        {allMsgs.map((m,i) => {
          const isMine = n(m.senderId) === n(emp.id);
          const prev = allMsgs[i-1], next = allMsgs[i+1];
          const grouped = prev && n(prev.senderId)===n(m.senderId) && m.timestamp-prev.timestamp<60000;
          const lastInGroup = !next || n(next.senderId)!==n(m.senderId) || next.timestamp-m.timestamp>=60000;
          return (<div key={m._key||i} className={`flex ${isMine?"justify-start":"justify-end"} ${grouped?"mt-0.5":"mt-2"}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${m.system?"bg-amber-100 text-amber-800":isMine?"bg-blue-600 text-white":"card border border-color"}`}>
              {!isMine && !m.system && !grouped && <p className="text-[10px] font-bold text-secondary mb-1">{m.sender}</p>}
              <p className="text-sm">{m.text}</p>
              {lastInGroup && <p className={`text-[10px] mt-1 ${isMine?"text-blue-200":"text-secondary"}`}>{new Date(m.timestamp).toLocaleTimeString("ar-IQ",{hour:"2-digit",minute:"2-digit"})}</p>}
            </div>
          </div>);
        })}
        {pt && <p className="text-xs text-secondary px-2 pb-1 animate-pulse">يكتب...</p>}
        <div ref={bottomRef}/>
      </div>
      <div className="flex gap-2 mt-3">
        <input value={text} onChange={e=>{setText(e.target.value);if(isConnected)FirebaseAPI.setTyping(emp.id,partnerId);}} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="اكتب رسالة..." className="input flex-1 rounded-xl px-4 py-3"/>
        <button onClick={send} disabled={!text.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"><Send size={18}/></button>
      </div>
    </div>
  );
}

function InternalChat({ emp, isConnected }) {
  const isAdmin = emp.role === "admin" || emp.username === "i.shawi";
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [partnerId, setPartnerId] = useState(null); const [partnerName, setPartnerName] = useState("");

  const loadMessages = useCallback(async () => {
    if (!isConnected) { setMessages(storage.get("chat_offline",[])); setChatLoading(false); return; }
    const msgs = await FirebaseAPI.getMessages(100);
    setMessages(msgs); storage.set("chat_offline", msgs); setChatLoading(false);
  }, [isConnected]);

  useEffect(() => { loadMessages(); const t = setInterval(loadMessages, 5000); return () => clearInterval(t); }, [loadMessages]);
  const prevConn = useRef(null);
  useEffect(() => { if(isConnected&&prevConn.current===false){const q=storage.get("chat_pending",[]);if(q.length){storage.set("chat_pending",[]);Promise.all(q.map(m=>FirebaseAPI.sendMessage(m))).then(()=>loadMessages());}} prevConn.current=isConnected; }, [isConnected,loadMessages]);

  const isBusy = (adminId) => {
    const act = storage.get(`chat_active_${adminId}`, null);
    return act && act.empId !== emp.id && (Date.now() - act.timestamp) < 5 * 60 * 1000;
  };

  const openChat = (id, name, busy) => {
    if (busy) {
      const wait = { text:"سيتم الرد عليك قريباً، مسؤول الشعبة مشغول حالياً بمحادثة أخرى.", sender:"النظام", senderId:-1, toId:emp.id, fromId:id, timestamp:Date.now(), system:true, _key:`sys_${Date.now()}` };
      setMessages(prev => [...prev, wait]);
    }
    setPartnerId(id); setPartnerName(name);
  };

  if (partnerId) return <ChatWindow emp={emp} partnerId={partnerId} partnerName={partnerName} messages={messages} isConnected={isConnected} onBack={()=>setPartnerId(null)} loadMessages={loadMessages}/>;

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg">الدردشة الداخلية</h3>
        <p className="text-sm text-secondary">اختر من تريد التحدث معه:</p>
        {chatLoading ? <>{[...Array(2)].map((_,i)=><div key={i} className="skeleton h-16 rounded-xl"/>)}</> :
        CHAT_ADMINS.map(admin => {
          const busy = isBusy(admin.id);
          const lastMsg = messages.filter(m=>(Number(m.senderId)===Number(emp.id)&&Number(m.toId)===Number(admin.id))||(Number(m.senderId)===Number(admin.id)&&Number(m.toId)===Number(emp.id))).slice(-1)[0];
          return (
            <div key={admin.id} className="card rounded-xl border border-color p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{admin.name}</p>
                <p className="text-xs text-secondary">{admin.title}</p>
                <span className={`text-xs font-bold ${busy?"text-amber-500":"text-emerald-500"}`}>● {busy?"مشغول":"متاح"}</span>
                {lastMsg && <p className="text-[10px] text-secondary mt-0.5 truncate max-w-[160px]">{lastMsg.text}</p>}
              </div>
              <button onClick={()=>openChat(admin.id,admin.name,busy)} className={`px-4 py-2 rounded-xl text-sm font-bold text-white ${busy?"bg-amber-500 hover:bg-amber-600":"bg-blue-600 hover:bg-blue-700"}`}>
                {busy?"إرسال (سيتم الرد قريباً)":"ابدأ محادثة"}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  const convMap = new Map();
  messages.filter(m => Number(m.toId) === Number(emp.id) || Number(m.senderId) === Number(emp.id)).forEach(m => {
    const otherId = Number(m.senderId) === Number(emp.id) ? m.toId : m.senderId;
    if (otherId && Number(otherId) !== Number(emp.id) && !convMap.has(otherId)) convMap.set(otherId, { id:otherId, name:Number(m.senderId)===Number(emp.id)?"":(m.sender||`موظف ${otherId}`), last:m });
  });
  const convList = [...convMap.values()];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">صندوق الرسائل</h3>
      {chatLoading ? <>{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-16 rounded-xl"/>)}</> :
      convList.length===0
        ? <div className="card rounded-xl border border-color p-8 text-center text-secondary"><MessageSquare size={40} className="mx-auto mb-2"/><p>لا توجد محادثات</p></div>
        : convList.map(c => {
          const unread = messages.filter(m=>Number(m.senderId)===Number(c.id)&&Number(m.toId)===Number(emp.id)&&!m.read).length;
          return (
            <button key={c.id} onClick={()=>openChat(c.id, c.name||`موظف ${c.id}`, false)} className="w-full card rounded-xl border border-color p-4 text-right flex items-center justify-between hover:bg-hover">
              <div>
                <p className="font-bold">{c.name||`موظف ${c.id}`}</p>
                <p className="text-xs text-secondary truncate max-w-[220px]">{c.last.text}</p>
              </div>
              {unread>0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>}
            </button>
          );
        })
      }
    </div>
  );
}

export default InternalChat;
