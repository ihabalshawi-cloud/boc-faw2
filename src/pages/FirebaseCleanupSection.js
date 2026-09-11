import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { FIREBASE_URL } from "../constants";
import { useToast, useConfirm } from "../contexts";

export default function FirebaseCleanupSection() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const confirm = useConfirm();
  const toast = useToast();

  const add = (msg) => setLog(p => [...p, msg]);

  const run = async () => {
    if (!await confirm("سيُحذف التوقيع من الطلبات القديمة وتُقلَّم الإشعارات وسجل الدخول. متأكد؟", { danger: true, ok: "نعم، نظّف", title: "تنظيف مساحة Firebase" })) return;
    setRunning(true); setLog([]);

    // ── 1. strip signatures from decided requests older than 30 days ─────────
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const raw = await (await fetch(`${FIREBASE_URL}/all_requests.json`)).json();
      const list = Array.isArray(raw) ? raw : Object.values(raw || {}).filter(Boolean);
      let stripped = 0;
      const cleaned = list.map(r => {
        if (!r) return r;
        if (r.status === "بانتظار المراجعة") return r;
        if ((r.decidedAt || r.submittedAt || "") >= cutoff) return r;
        if (!r.sigDataUrl && !r.empSigDataUrl) return r;
        const { sigDataUrl: _s, empSigDataUrl: _e, ...rest } = r;
        stripped++; return rest;
      });
      if (stripped > 0)
        await fetch(`${FIREBASE_URL}/all_requests.json`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(cleaned) });
      add(`✅ طلبات: أُزيل التوقيع من ${stripped} طلب`);
    } catch (e) { add(`❌ طلبات: ${e.message}`); }

    // ── 2. prune notifications — keep last 50 per employee ───────────────────
    try {
      const empKeys = await (await fetch(`${FIREBASE_URL}/notifications.json?shallow=true`)).json();
      let total = 0;
      if (empKeys && typeof empKeys === "object") {
        for (const id of Object.keys(empKeys)) {
          const raw2 = await (await fetch(`${FIREBASE_URL}/notifications/${id}.json`)).json();
          const arr = Array.isArray(raw2) ? raw2 : Object.values(raw2 || {}).filter(Boolean);
          if (arr.length > 50) {
            const kept = arr.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0)).slice(0,50);
            await fetch(`${FIREBASE_URL}/notifications/${id}.json`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(kept) });
            total += arr.length - 50;
          }
        }
      }
      add(`✅ إشعارات: حُذف ${total} إشعار زائد`);
    } catch (e) { add(`❌ إشعارات: ${e.message}`); }

    // ── 3. prune login history — keep last 300 ───────────────────────────────
    try {
      const keysObj = await (await fetch(`${FIREBASE_URL}/login_history.json?shallow=true`)).json();
      if (keysObj && typeof keysObj === "object") {
        const all = Object.keys(keysObj).sort();
        const excess = all.length - 300;
        if (excess > 0) {
          await Promise.all(all.slice(0, excess).map(k =>
            fetch(`${FIREBASE_URL}/login_history/${k}.json`, { method:"DELETE" }).catch(()=>{})
          ));
          add(`✅ سجل الدخول: حُذف ${excess} سجل قديم`);
        } else { add(`ℹ️ سجل الدخول: ${all.length} سجل — لا حاجة للتنظيف`); }
      }
    } catch (e) { add(`❌ سجل الدخول: ${e.message}`); }

    setRunning(false);
    toast("اكتمل تنظيف Firebase", "success");
  };

  return (
    <div className="card rounded-2xl border border-red-200 p-4 mt-4 space-y-3" dir="rtl">
      <h3 className="font-bold text-primary flex items-center gap-2">
        <Trash2 size={16} className="text-red-500"/> تنظيف مساحة Firebase
      </h3>
      <ul className="text-xs text-secondary space-y-1 list-disc list-inside">
        <li>يُزيل التوقيعات من الطلبات المقررة الأقدم من 30 يوماً</li>
        <li>يُبقي آخر 50 إشعار فقط لكل موظف</li>
        <li>يحذف سجلات الدخول الزائدة عن 300 سجل</li>
      </ul>
      <button onClick={run} disabled={running}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50">
        <Trash2 size={14}/> {running ? "⏳ جاري التنظيف..." : "تشغيل التنظيف"}
      </button>
      {log.length > 0 && (
        <div className="rounded-xl border border-color p-3 text-xs font-mono space-y-1 bg-gray-950 text-green-400">
          {log.map((l,i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
