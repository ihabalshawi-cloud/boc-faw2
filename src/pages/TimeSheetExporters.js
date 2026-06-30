import { TS_CODES_ALL, DAY_NAMES_AR, SHIFT_TEXT_COLORS, getShiftForDay, calcTsStats } from "./TimeSheetHelpers";

export async function importFromBuffer(buffer, { data, persistTs, setData, setShowImport, addToast, setImporting }) {
  setImporting(true);
  try {
    const { read, utils } = await import("xlsx");
    const wb = read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = utils.sheet_to_json(ws, { header: 1, defval: "" });
    const buildUpdate = (tabKey, dayColStart) => {
      const tabEmps = data[tabKey] || [];
      return tabEmps.map(emp => {
        const codeRowIdx = rows.findIndex(r => String(r[0]).trim() === String(emp.id).trim());
        if (codeRowIdx === -1) return emp;
        const codeRow  = rows[codeRowIdx];
        const hoursRow = rows[codeRowIdx + 1] || [];
        const newDays  = {};
        const newHours = {};
        for (let d = 1; d <= 31; d++) {
          const col  = dayColStart + (d - 1);
          const code = String(codeRow[col] || "").trim();
          const h    = String(hoursRow[col] || "").trim();
          if (code) newDays[String(d)] = code;
          else delete newDays[String(d)];
          const hNum = parseInt(h);
          if (!isNaN(hNum) && hNum > 0) newHours[String(d)] = hNum;
          else delete newHours[String(d)];
        }
        return { ...emp, days: newDays, hours: newHours };
      });
    };
    const updated = {
      malak:     buildUpdate("malak",     4), // col E (0-indexed=4) = day1
      contracts: buildUpdate("contracts", 4),
      drivers:   buildUpdate("drivers",   3), // col D (0-indexed=3) = day1
    };
    persistTs(updated);
    setData(updated);
    setShowImport(false);
    addToast("تم استيراد بيانات التايم شيت من Excel ✅", "success");
  } catch (e) {
    addToast("فشل الاستيراد: " + e.message, "error");
  } finally {
    setImporting(false);
  }
}

export async function exportToTemplate(buffer, { emps, tabLabel, tsYear, tsMonth, addToast, setExporting, setShowExport, dayColStart = 5 }) {
  setExporting(true);
  try {
    const mod = await import("exceljs");
    const ExcelJS = mod.default || mod;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const ws = workbook.worksheets[0];
    const DAY_COL_START = dayColStart;
    const colAVals = ws.getColumn(1).values;
    emps.forEach(emp => {
      const codeRowIdx = colAVals.findIndex(
        (v, i) => i > 0 && String(v ?? "").trim() === String(emp.id).trim()
      );
      if (codeRowIdx === -1) return;
      const hoursRowIdx = codeRowIdx + 1;
      for (let d = 1; d <= 31; d++) {
        const col  = DAY_COL_START + (d - 1);
        const code = (emp.days  || {})[String(d)] || "";
        const h    = (emp.hours || {})[String(d)];
        ws.getCell(codeRowIdx,  col).value = code || null;
        ws.getCell(hoursRowIdx, col).value = (h != null && h > 0) ? h : null;
      }
    });
    const outBuf = await workbook.xlsx.writeBuffer();
    const blob   = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url;
    a.download = `تايم_شيت_${tabLabel}_${tsYear}_${String(tsMonth+1).padStart(2,"0")}.xlsx`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast("تم تصدير البيانات إلى قالب Excel ✅", "success");
    setShowExport(false);
  } catch (e) {
    addToast("فشل التصدير: " + e.message, "error");
  } finally {
    setExporting(false);
  }
}

export function buildHTMLTable(emps, title, monthLabel, tsYear, tsMonth, days) {
  const codeStyle = (code) => {
    if (!code) return "";
    const c = TS_CODES_ALL[code];
    if (!c) return "";
    const map = {
      "bg-orange-100 text-orange-700": "background:#ffedd5;color:#c2410c",
      "bg-blue-100 text-blue-700":     "background:#dbeafe;color:#1d4ed8",
      "bg-purple-100 text-purple-700": "background:#f3e8ff;color:#7e22ce",
      "bg-gray-100 text-gray-600":     "background:#f3f4f6;color:#4b5563",
      "bg-green-100 text-green-700":   "background:#dcfce7;color:#15803d",
      "bg-red-100 text-red-600":       "background:#fee2e2;color:#dc2626",
      "bg-yellow-100 text-yellow-700": "background:#fef9c3;color:#a16207",
      "bg-red-200 text-red-800":       "background:#fecaca;color:#991b1b",
      "bg-slate-100 text-slate-600":   "background:#f1f5f9;color:#475569",
      "bg-slate-200 text-slate-500":   "background:#e2e8f0;color:#64748b",
      "bg-amber-100 text-amber-700":   "background:#fef3c7;color:#b45309",
      "bg-teal-100 text-teal-700":     "background:#ccfbf1;color:#0f766e",
      "bg-cyan-100 text-cyan-700":     "background:#cffafe;color:#0e7490",
      "bg-red-100 text-red-700":       "background:#fee2e2;color:#b91c1c",
    };
    return map[c.color] || "";
  };
  const cs = "border:1px solid #d1d5db;padding:2px;text-align:center;font-size:11px;min-width:26px;";
  let rows = "";
  emps.forEach((e, idx) => {
    const stats = calcTsStats(e);
    const bg = idx%2===0 ? "#fff" : "#f9fafb";
    rows += `<tr style="background:${bg}">`;
    rows += `<td rowspan="2" style="${cs}font-size:10px;color:#6b7280;">${e.id}</td>`;
    rows += `<td rowspan="2" style="${cs}text-align:right;font-weight:600;min-width:130px;font-size:12px;">${e.name}</td>`;
    rows += `<td style="${cs}color:#2563eb;font-weight:bold;">أ</td>`;
    days.forEach(d => {
      const dow = new Date(tsYear, tsMonth, d).getDay();
      const isWe = dow===5||dow===6;
      const code = e.days[String(d)] || "";
      const cellCss = codeStyle(code) || (isWe && !code ? "background:#fff7ed;" : "");
      rows += `<td style="${cs}${cellCss}font-weight:bold;">${code}</td>`;
    });
    rows += `<td rowspan="2" style="${cs}color:#1d4ed8;font-weight:bold;">${stats.totalHours||""}</td>`;
    rows += `<td rowspan="2" style="${cs}color:#15803d;">${stats.leaveDays||""}</td>`;
    rows += `<td rowspan="2" style="${cs}color:#dc2626;">${stats.absenceDays||""}</td>`;
    rows += `<td rowspan="2" style="${cs}color:#6b7280;">${stats.restDays||""}</td>`;
    rows += `<td rowspan="2" style="${cs}text-align:right;font-size:10px;color:#6b7280;">${e.notes||""}</td>`;
    rows += `</tr><tr style="background:${bg}">`;
    rows += `<td style="${cs}color:#7c3aed;font-weight:bold;">ق</td>`;
    days.forEach(d => {
      const dow = new Date(tsYear, tsMonth, d).getDay();
      const isWe = dow===5||dow===6;
      const h = e.hours[String(d)];
      const hCss = h!=null ? "background:#f5f3ff;color:#7c3aed;font-weight:600" : (isWe ? "background:#fff7ed;" : "");
      rows += `<td style="${cs}${hCss}">${h!=null?h:""}</td>`;
    });
    rows += `</tr>`;
  });
  const dayHeaders = days.map(d => {
    const dow = new Date(tsYear, tsMonth, d).getDay();
    const shift = getShiftForDay(tsYear, tsMonth, d);
    const isWe = dow===5||dow===6;
    const weBg = isWe ? "background:#fff7ed;" : "background:#eff6ff;";
    const dayColor = isWe ? "color:#ea580c;" : "";
    return `<th style="border:1px solid #d1d5db;padding:1px;text-align:center;font-size:9px;min-width:28px;${weBg}">` +
      `<div style="font-weight:bold;font-size:10px;${dayColor}">${d}</div>` +
      `<div style="font-size:8px;${dayColor}">${DAY_NAMES_AR[dow]}</div>` +
      `<div style="font-size:8px;font-weight:bold;color:${SHIFT_TEXT_COLORS[shift]||"#374151"};">${shift}</div></th>`;
  }).join("");
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<style>body{font-family:Arial,sans-serif;direction:rtl;} table{border-collapse:collapse;width:100%;} th{padding:4px;border:1px solid #9ca3af;font-size:12px;}</style>
</head><body>
<h3 style="text-align:center;margin-bottom:4px;">${title}</h3>
<p style="text-align:center;margin-bottom:8px;font-size:13px;">شهر ${monthLabel} ${tsYear}</p>
<table><thead><tr style="background:#dbeafe;">
  <th style="border:1px solid #9ca3af;padding:4px;min-width:68px;">الرقم الوظيفي</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:130px;">الاسم</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:30px;">ح/ق</th>
  ${dayHeaders}
  <th style="border:1px solid #9ca3af;padding:4px;min-width:50px;">الساعات</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">إجازة</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">غياب</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">عطل</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:80px;">ملاحظات</th>
</tr></thead>
<tbody>${rows}</tbody>
</table></body></html>`;
}
