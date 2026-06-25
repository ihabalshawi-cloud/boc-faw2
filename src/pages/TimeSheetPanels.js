import React from "react";
import { Upload, FileCheck } from "lucide-react";

export function TsImportPanel({ gDrive, importing, importDriveId, setImportDriveId, importFromFile, importFromDrive, fileInputRef }) {
  return (
    <div className="card rounded-xl p-4 border border-blue-200 bg-blue-50 space-y-3" dir="rtl">
      <h3 className="font-bold text-sm text-blue-800">استيراد بيانات الحضور من Excel</h3>
      <p className="text-xs text-blue-700">يقرأ الأعمدة E→AI (أيام 1-31) والصف السفلي (الساعات) حسب الرقم الوظيفي في العمود A</p>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs font-semibold text-blue-700 mb-1">من جهازك:</p>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importFromFile}/>
          <button onClick={()=>fileInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            <Upload size={14}/> {importing ? "جارٍ الاستيراد..." : "اختر ملف Excel"}
          </button>
        </div>
        {gDrive?.isReady && (
          <div className="flex-1 min-w-[240px]">
            <p className="text-xs font-semibold text-blue-700 mb-1">من Google Drive:</p>
            <div className="flex gap-2">
              <input value={importDriveId} onChange={e=>setImportDriveId(e.target.value)}
                placeholder="File ID من Drive"
                className="flex-1 text-sm border border-blue-300 rounded-lg px-3 py-2 bg-white text-primary" dir="ltr"/>
              <button onClick={importFromDrive} disabled={importing}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {importing ? "..." : "تنزيل"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const BUILTIN_LABELS = { malak: "نموذج الملاك", contracts: "نموذج العقود", drivers: "نموذج السائقين" };

export function TsExportPanel({ gDrive, exporting, activeTab, exportDriveId, setExportDriveId, exportFromFile, exportFromDrive, exportFromBuiltin, exportFileRef }) {
  const builtinLabel = BUILTIN_LABELS[activeTab] || "النموذج المدمج";
  return (
    <div className="card rounded-xl p-4 border border-green-200 bg-green-50 space-y-3" dir="rtl">
      <h3 className="font-bold text-sm text-green-800">تصدير بيانات التايم شيت إلى قالب Excel</h3>
      <p className="text-xs text-green-700">سيتم ملء بيانات الحضور في النموذج المدمج مع الحفاظ على تنسيقه الأصلي</p>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs font-semibold text-green-700 mb-1">تصدير إلى النموذج:</p>
          <input ref={exportFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={exportFromFile}/>
          <button onClick={exportFromBuiltin} disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50">
            <FileCheck size={14}/> {exporting ? "جارٍ التصدير..." : `تصدير ${builtinLabel}`}
          </button>
        </div>
        {gDrive?.isReady && (
          <div className="flex-1 min-w-[240px]">
            <p className="text-xs font-semibold text-green-700 mb-1">من Google Drive (File ID):</p>
            <div className="flex gap-2">
              <input value={exportDriveId} onChange={e=>setExportDriveId(e.target.value)}
                placeholder="File ID للقالب في Drive"
                className="flex-1 text-sm border border-green-300 rounded-lg px-3 py-2 bg-white text-primary" dir="ltr"/>
              <button onClick={exportFromDrive} disabled={exporting}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">
                {exporting ? "..." : "تصدير"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
