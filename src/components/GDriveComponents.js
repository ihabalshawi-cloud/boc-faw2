import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { GDRIVE_WARN_PCT, GDRIVE_CRIT_PCT } from "../constants";
import { useGDrive } from "../gdrive";
import { useToast } from "../contexts";

export function GDriveSettingsModal({ onClose }) {
  const { isReady, quota, refreshQuota } = useGDrive();
  const [refreshing, setRefreshing] = useState(false);
  const addToast = useToast();

  const warnColor = quota?.pct >= GDRIVE_CRIT_PCT ? "text-red-600" : quota?.pct >= GDRIVE_WARN_PCT ? "text-amber-600" : "text-emerald-600";
  const barColor  = quota?.pct >= GDRIVE_CRIT_PCT ? "bg-red-500" : quota?.pct >= GDRIVE_WARN_PCT ? "bg-amber-500" : "bg-emerald-500";

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshQuota();
    setRefreshing(false);
    addToast("تم تحديث معلومات التخزين", "info");
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]" dir="rtl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="text-2xl">☁️</span> Google Drive
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
        </div>

        {isReady ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
              <span className="text-emerald-600 text-lg">✅</span>
              <span className="font-medium text-emerald-800">متصل بـ Google Drive (مشترك للجميع)</span>
            </div>
            {quota && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>مساحة التخزين</span>
                  <span className={warnColor}>{quota.pct}% مستخدم</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className={`h-3 rounded-full transition-all ${barColor}`} style={{width:`${Math.min(quota.pct,100)}%`}}/>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>المستخدم: {quota.usageStr}</span>
                  <span>الحد: {quota.limitStr}</span>
                </div>
                <div className="text-xs text-center text-gray-500">المتاح: <strong>{quota.freeStr}</strong></div>
                {quota.pct >= GDRIVE_CRIT_PCT && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">⚠️ تحذير حرج: المساحة تكاد تكتمل!</div>}
                {quota.pct >= GDRIVE_WARN_PCT && quota.pct < GDRIVE_CRIT_PCT && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">📦 تحذير: اقتربت من الحد ({quota.pct}%).</div>}
                {quota.serviceAccountWarning && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800 space-y-1">
                    <p className="font-bold">⚠️ Service Account لا يملك مساحة تخزين شخصية</p>
                    <p className="text-xs">لرفع الملفات بشكل صحيح أضف متغيرات OAuth2 في Vercel:</p>
                    <p className="text-xs font-mono bg-orange-100 rounded p-1">GDRIVE_CLIENT_ID</p>
                    <p className="text-xs font-mono bg-orange-100 rounded p-1">GDRIVE_CLIENT_SECRET</p>
                    <p className="text-xs font-mono bg-orange-100 rounded p-1">GDRIVE_REFRESH_TOKEN</p>
                  </div>
                )}
              </div>
            )}
            <button onClick={handleRefresh} disabled={refreshing}
              className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50">
              {refreshing ? "⏳ جارٍ التحديث..." : "🔄 تحديث معلومات التخزين"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
              <span className="text-red-600 text-lg">❌</span>
              <span className="font-medium text-red-800">Google Drive غير متصل</span>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-xs space-y-1.5 border border-blue-100">
              <p className="font-bold text-blue-800 mb-2">خطوات الإعداد (للمسؤول — مرة واحدة فقط):</p>
              <p>1️⃣ <strong>console.cloud.google.com</strong> ← IAM & Admin ← Service Accounts</p>
              <p className="font-bold text-orange-700 mt-1">الطريقة المثلى (OAuth2 — مساحة 15 GB مجاناً):</p>
              <p>1️⃣ في <strong>console.cloud.google.com</strong> ← APIs & Services ← Credentials أنشئ OAuth 2.0 Client ID (Web)</p>
              <p>2️⃣ في <strong>developers.google.com/oauthplayground</strong> سجّل دخولك، اختر Drive API v3 ← كل النطاقات ← احصل على Refresh Token</p>
              <p>3️⃣ في <strong>Vercel ← Settings ← Environment Variables</strong> أضف:</p>
              <p className="pl-3">• <code className="bg-blue-100 px-1">GDRIVE_CLIENT_ID</code></p>
              <p className="pl-3">• <code className="bg-blue-100 px-1">GDRIVE_CLIENT_SECRET</code></p>
              <p className="pl-3">• <code className="bg-blue-100 px-1">GDRIVE_REFRESH_TOKEN</code></p>
              <p className="pl-3">• <code className="bg-blue-100 px-1">GDRIVE_FOLDER_ID</code> = ID مجلد Drive (اختياري)</p>
              <p>4️⃣ أعد نشر التطبيق من Vercel Dashboard</p>
              <p className="text-gray-400 mt-1">أو استخدم Service Account مع GDRIVE_SERVICE_ACCOUNT (لكن قد تواجه مشكلة حصة التخزين)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function GDriveQuotaBar() {
  const { isReady, quota } = useGDrive();
  if (!isReady || !quota || quota.pct < GDRIVE_WARN_PCT) return null;
  const isCrit = quota.pct >= GDRIVE_CRIT_PCT;
  return (
    <div className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${isCrit ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>
      <AlertTriangle size={15} className="shrink-0"/>
      <span>
        {isCrit
          ? `🚨 Google Drive ممتلئ تقريباً (${quota.pct}%) — المتاح: ${quota.freeStr} فقط!`
          : `⚠️ تحذير: مساحة Google Drive وصلت ${quota.pct}% (متاح: ${quota.freeStr})`
        }
      </span>
    </div>
  );
}
