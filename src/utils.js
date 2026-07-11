// ── Iraqi date formatting ─────────────────────────────────────────────────────
const _IM = ["كانون الثاني","شباط","آذار","نيسان","أيار","حزيران","تموز","آب","أيلول","تشرين الأول","تشرين الثاني","كانون الأول"];
export function fmtIraqi(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${Number(d)} ${_IM[Number(m) - 1]} ${y}`;
}
export const todayISO = () => new Date().toISOString().slice(0, 10);

// ── Password hashing ──────────────────────────────────────────────────────────
const PASS_SALT = "BOC_FAW_SCADA_2025#";

export async function hashPassword(plain) {
  try {
    const data = new TextEncoder().encode(PASS_SALT + plain);
    const buf  = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

export const isHash = s => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);

// ── Local storage helpers ─────────────────────────────────────────────────────
export const storage = {
  get: (key, def = null) => {
    try { const i = localStorage.getItem(key); return i ? JSON.parse(i) : def; } catch { return def; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  },
};

export const passStore = {
  get: (key) => {
    try { const s = sessionStorage.getItem(key); if (s) return JSON.parse(s); } catch {}
    try { const l = localStorage.getItem(key); return l ? JSON.parse(l) : null; } catch { return null; }
  },
  set: (key, val) => {
    try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {}
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
  },
};

// ── Print helper ──────────────────────────────────────────────────────────────
export function printElement(elementId, title = "تقرير") {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/><title>${title}</title>
  <style>*{font-family:Arial,sans-serif;} body{padding:20mm;} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px;text-align:right} .no-print{display:none}</style></head>
  <body>${el.innerHTML}</body></html>`;
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
}

// ── CSV export ────────────────────────────────────────────────────────────────
export function exportCSV(data, filename) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(","),
    ...data.map(r =>
      headers.map(h => `"${(r[h] || "").toString().replace(/"/g, '""')}"`).join(",")
    ),
  ];
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".csv";
  a.click();
}
