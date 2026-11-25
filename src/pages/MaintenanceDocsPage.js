import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, FileImage, File, Trash2, Download, Filter, X, FolderOpen } from "lucide-react";
import { uploadToFirebaseStorage } from "./ProjectDocs";
import { FIREBASE_STORAGE_BUCKET } from "../constants";
import { useToast, useConfirm } from "../contexts";

const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";
const CATEGORIES = ["الكل", "مخطط هندسي", "وثيقة فنية", "دليل صيانة", "تقرير فحص", "أخرى"];

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(2) + " MB";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-IQ", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fileIcon(mimeType) {
  if (!mimeType) return <File size={18} className="text-gray-400"/>;
  if (mimeType === "application/pdf") return <FileText size={18} className="text-red-500"/>;
  if (mimeType.startsWith("image/")) return <FileImage size={18} className="text-blue-500"/>;
  return <File size={18} className="text-gray-400"/>;
}

export default function MaintenanceDocsPage({ emp }) {
  const toast = useToast();
  const confirm = useConfirm();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("الكل");

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [form, setForm] = useState({ name: "", category: "مخطط هندسي" });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch(`${FIREBASE_URL}/maint_docs.json`);
      const data = await res.json();
      if (data && typeof data === "object") {
        const arr = Object.values(data).filter(Boolean).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setDocs(arr);
      } else {
        setDocs([]);
      }
    } catch {
      toast?.("فشل تحميل الوثائق", "error");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setSelectedFile(f);
    if (!form.name) setForm(p => ({ ...p, name: f.name.replace(/\.[^.]+$/, "") }));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) { toast?.("اختر ملفاً للرفع", "warning"); return; }
    if (!form.name.trim()) { toast?.("أدخل اسم الوثيقة", "warning"); return; }

    setUploading(true);
    setUploadPct(0);
    try {
      const ts = Date.now();
      const storagePath = `maint_docs/${ts}_${selectedFile.name}`;
      const result = await uploadToFirebaseStorage(selectedFile, storagePath, pct => setUploadPct(pct));

      const id = `maint_${ts}`;
      const doc = {
        id,
        name: form.name.trim(),
        category: form.category,
        fileUrl: result.url,
        firebasePath: result.path || storagePath,
        size: formatSize(selectedFile.size),
        uploadedBy: emp.name,
        uploadedAt: new Date().toISOString(),
        mimeType: selectedFile.type || "application/octet-stream",
      };

      await fetch(`${FIREBASE_URL}/maint_docs/${id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });

      setDocs(prev => [doc, ...prev]);
      setForm({ name: "", category: "مخطط هندسي" });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast?.("تم رفع الوثيقة بنجاح", "success");
    } catch (err) {
      toast?.("فشل رفع الملف: " + (err?.message || "خطأ غير معروف"), "error");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  }

  async function handleDelete(doc) {
    const ok = await confirm(`هل تريد حذف "${doc.name}"؟`, { title: "حذف وثيقة", ok: "حذف", okClass: "bg-red-600" });
    if (!ok) return;
    try {
      await fetch(`${FIREBASE_URL}/maint_docs/${doc.id}.json`, { method: "DELETE" });
      if (doc.firebasePath) {
        await fetch(
          `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o/${encodeURIComponent(doc.firebasePath)}`,
          { method: "DELETE" }
        ).catch(() => {});
      }
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      toast?.("تم الحذف", "success");
    } catch {
      toast?.("فشل الحذف", "error");
    }
  }

  const filtered = filterCat === "الكل" ? docs : docs.filter(d => d.category === filterCat);

  return (
    <div dir="rtl" className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <FolderOpen size={22} className="text-primary"/>
        <h2 className="text-xl font-bold">مخططات ووثائق الصيانة</h2>
      </div>

      <form onSubmit={handleUpload} className="card border border-color rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Upload size={16} className="text-primary"/> رفع وثيقة جديدة
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-secondary">اسم الوثيقة</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="اسم الوثيقة أو المخطط"
              className="w-full px-3 py-2 rounded-xl border border-color bg-main text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-secondary">التصنيف</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-color bg-main text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CATEGORIES.filter(c => c !== "الكل").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-secondary">اختر ملفاً (PDF، صورة، أو أي نوع)</label>
          <input
            ref={fileRef}
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-secondary file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {selectedFile && (
            <p className="text-xs text-secondary mt-1 flex items-center gap-1">
              {fileIcon(selectedFile.type)}
              {selectedFile.name} — {formatSize(selectedFile.size)}
            </p>
          )}
        </div>

        {uploading && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-secondary">
              <span>جاري الرفع...</span>
              <span>{uploadPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload size={15}/>
            {uploading ? "جاري الرفع..." : "رفع الوثيقة"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-secondary shrink-0"/>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterCat === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-color text-secondary hover:text-primary hover:bg-hover"
              }`}
            >
              {cat}
            </button>
          ))}
          {filterCat !== "الكل" && (
            <button onClick={() => setFilterCat("الكل")} className="text-xs text-secondary hover:text-primary flex items-center gap-1">
              <X size={12}/> مسح
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-secondary text-sm">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-secondary text-sm">
            <FolderOpen size={36} className="mx-auto mb-3 opacity-30"/>
            لا توجد وثائق
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(doc => (
              <div
                key={doc.id}
                className="card border border-color rounded-xl p-4 flex items-center gap-3 hover:bg-hover transition-colors"
              >
                <div className="shrink-0">{fileIcon(doc.mimeType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{doc.category}</span>
                    <span className="text-xs text-secondary">{doc.size}</span>
                    <span className="text-xs text-secondary">{doc.uploadedBy}</span>
                    <span className="text-xs text-secondary">{formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="تحميل"
                    className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors"
                  >
                    <Download size={16}/>
                  </a>
                  <button
                    onClick={() => handleDelete(doc)}
                    title="حذف"
                    className="p-2 rounded-lg text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
