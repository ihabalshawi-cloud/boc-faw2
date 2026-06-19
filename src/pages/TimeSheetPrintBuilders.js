import { TS_CODES_ALL, MONTHS_AR_TS, DAY_NAMES_AR, SHIFT_TEXT_COLORS, getShiftForDay, calcTsStats } from "./TimeSheetHelpers";

const COLOR_MAP = {
  "bg-orange-100 text-orange-700": "background:#ffedd5;color:#c2410c",
  "bg-blue-100 text-blue-700":     "background:#dbeafe;color:#1d4ed8",
  "bg-purple-100 text-purple-700": "background:#f3e8ff;color:#7e22ce",
  "bg-gray-100 text-gray-600":     "background:#f3f4f6;color:#4b5563",
  "bg-green-100 text-green-700":   "background:#dcfce7;color:#15803d",
  "bg-red-100 text-red-600":       "background:#fee2e2;color:#dc2626",
  "bg-yellow-100 text-yellow-700": "background:#fef9c3;color:#a16207",
  "bg-red-200 text-red-800":       "background:#fecaca;color:#991b1b",
  "bg-amber-100 text-amber-700":   "background:#fef3c7;color:#b45309",
  "bg-teal-100 text-teal-700":     "background:#ccfbf1;color:#0f766e",
  "bg-cyan-100 text-cyan-700":     "background:#cffafe;color:#0e7490",
  "bg-red-100 text-red-700":       "background:#fee2e2;color:#b91c1c",
  "bg-slate-100 text-slate-600":   "background:#f1f5f9;color:#475569",
  "bg-slate-200 text-slate-500":   "background:#e2e8f0;color:#64748b",
};

export function buildExcelFormattedHTML(emps, tabLabel, tsYear, tsMonth, days) {
  const monthLabel = MONTHS_AR_TS[tsMonth];
  const getDayName = (day) => ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][new Date(tsYear,tsMonth,day).getDay()];
  const isWeekend = (day) => { const d = new Date(tsYear,tsMonth,day).getDay(); return d===5||d===6; };

  let employeeRows = '';
  emps.forEach((e, idx) => {
    const stats = calcTsStats(e);
    const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
    employeeRows += `<tr style="background:${bg};">`;
    employeeRows += `<td rowspan="2" style="border:1px solid #000;text-align:center;vertical-align:middle;font-size:10px;">${e.id}</td>`;
    employeeRows += `<td rowspan="2" style="border:1px solid #000;text-align:right;vertical-align:middle;font-size:11px;font-weight:bold;">${e.name}${e.movement?` (${e.movement})`:''}</td>`;
    employeeRows += `<td rowspan="2" style="border:1px solid #000;text-align:center;vertical-align:middle;font-size:9px;">${e.movement||''}</td>`;
    employeeRows += `<td style="border:1px solid #000;text-align:center;font-weight:bold;background:#dbeafe;">أ</td>`;
    days.forEach(day => {
      const code = e.days[String(day)] || '';
      const isWe = isWeekend(day);
      const weBg = isWe && !code ? 'background:#fff7ed;' : '';
      const codeColor = TS_CODES_ALL[code]?.color || '';
      const colorStyle = codeColor ? `background:${codeColor.split(' ')[0]};` : '';
      employeeRows += `<td style="border:1px solid #000;text-align:center;font-size:11px;font-weight:bold;${colorStyle}${weBg}">${code}</td>`;
    });
    employeeRows += `<td rowspan="2" style="border:1px solid #000;text-align:center;font-weight:bold;color:#1d4ed8;">${stats.totalHours||''}</td>`;
    employeeRows += `<td rowspan="2" style="border:1px solid #000;text-align:center;color:#15803d;">${stats.leaveDays||''}</td>`;
    employeeRows += `<td rowspan="2" style="border:1px solid #000;text-align:center;color:#dc2626;">${stats.absenceDays||''}</td>`;
    employeeRows += `<td rowspan="2" style="border:1px solid #000;text-align:center;color:#6b7280;">${stats.restDays||''}</td>`;
    employeeRows += `<td rowspan="2" style="border:1px solid #000;text-align:right;font-size:9px;color:#6b7280;">${e.notes||''}</td></tr>`;
    employeeRows += `<tr style="background:${bg};"><td style="border:1px solid #000;text-align:center;font-weight:bold;background:#f3e8ff;">ق</td>`;
    days.forEach(day => {
      const hours = e.hours[String(day)];
      const isWe = isWeekend(day);
      const weBg = hours==null && isWe ? 'background:#fff7ed;' : '';
      const hStyle = hours!=null ? 'background:#f5f3ff;color:#7c3aed;font-weight:bold;' : '';
      employeeRows += `<td style="border:1px solid #000;text-align:center;font-size:11px;${hStyle}${weBg}">${hours!=null?hours:''}</td>`;
    });
    employeeRows += `</tr>`;
  });

  let dayHeaders = '';
  days.forEach(day => {
    const shift = getShiftForDay(tsYear, tsMonth, day);
    const isWe = isWeekend(day);
    const weBg = isWe ? 'background:#fff7ed;' : 'background:#eff6ff;';
    dayHeaders += `<th style="border:1px solid #000;text-align:center;font-size:8px;min-width:28px;${weBg}">` +
      `<div style="font-weight:bold;font-size:10px;">${day}</div>` +
      `<div style="font-size:7px;">${getDayName(day)}</div>` +
      `<div style="font-size:7px;font-weight:bold;color:${SHIFT_TEXT_COLORS[shift]||'#374151'};">${shift}</div></th>`;
  });

  const symbolsTable = `<table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:8px;direction:rtl;">
    <tr><td colspan="4" style="border:1px solid #000;padding:3px;background:#f0f0f0;font-weight:bold;">دليل الرموز</td></tr>
    <tr>
      <td style="border:1px solid #000;padding:3px;"><strong>Z:</strong> مواظبة ولا تحتوي على متغيرات</td>
      <td style="border:1px solid #000;padding:3px;"><strong>5:</strong> أيام الحشد الشعبي</td>
      <td style="border:1px solid #000;padding:3px;"><strong>E:</strong> إصابة عمل صادرة من لجنة طبية</td>
      <td style="border:1px solid #000;padding:3px;"><strong>B:</strong> أيام بقسم آخر</td>
    </tr>
    <tr>
      <td style="border:1px solid #000;padding:3px;"><strong>F:</strong> مواظبة تحتوي على متغيرات إجازة غياب أو ساعات</td>
      <td style="border:1px solid #000;padding:3px;"><strong>W:</strong> الوفاة</td>
      <td style="border:1px solid #000;padding:3px;"><strong>K:</strong> إجازة أمومة بأمر إداري</td>
      <td style="border:1px solid #000;padding:3px;"><strong>M:</strong> إجازة أمومة</td>
    </tr>
    <tr>
      <td style="border:1px solid #000;padding:3px;"><strong>4:</strong> العالقين في المناطق الساخنة</td>
      <td style="border:1px solid #000;padding:3px;"><strong>A:</strong> إعالة (إجازة) لذوي الاحتياجات الخاصة</td>
      <td style="border:1px solid #000;padding:3px;"><strong>D:</strong> أيام العدة</td>
      <td style="border:1px solid #000;padding:3px;"><strong>H:</strong> إجازة بدون راتب خارج العراق</td>
    </tr>
    <tr>
      <td style="border:1px solid #000;padding:3px;"><strong>8:</strong> مصاحبة زوجية</td>
      <td style="border:1px solid #000;padding:3px;"><strong>Y:</strong> عطلة رسمية</td>
      <td style="border:1px solid #000;padding:3px;"><strong>X:</strong> غياب</td>
      <td style="border:1px solid #000;padding:3px;"><strong>7:</strong> إجازة اعتيادية خارج العراق براتب تام</td>
    </tr>
    <tr>
      <td style="border:1px solid #000;padding:3px;"><strong>U:</strong> تفرغ</td>
      <td style="border:1px solid #000;padding:3px;"><strong>Q:</strong> خارج الخدمة (أيام قبل المباشرة في الشركة)</td>
      <td style="border:1px solid #000;padding:3px;"><strong>P:</strong> إيفاد شامل كافة أنواع الإيفادات خارج العراق</td>
      <td style="border:1px solid #000;padding:3px;"><strong>O:</strong> المقيم الصباحي</td>
    </tr>
    <tr>
      <td style="border:1px solid #000;padding:3px;"><strong>2:</strong> مناوبة ثنائية</td>
      <td style="border:1px solid #000;padding:3px;"><strong>3:</strong> مناوبة ثلاثية</td>
      <td style="border:1px solid #000;padding:3px;"><strong>N:</strong> استراحة مناوبة</td>
      <td style="border:1px solid #000;padding:3px;"><strong>V:</strong> استراحة مقيم</td>
    </tr>
    <tr>
      <td style="border:1px solid #000;padding:3px;"><strong>L:</strong> إجازة اعتيادية</td>
      <td style="border:1px solid #000;padding:3px;"><strong>S:</strong> إجازة مرضية</td>
      <td style="border:1px solid #000;padding:3px;"><strong>R:</strong> استراحة</td>
      <td style="border:1px solid #000;padding:3px;"><strong>J:</strong> مجاز دراسياً</td>
    </tr>
  </table>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>استمارة تفاصيل الدوام - ${monthLabel} ${tsYear}</title>
<style>
  @page{size:A3 landscape;margin:8mm;}
  body{font-family:'Arial',sans-serif;direction:rtl;margin:0;padding:0;}
  .header{text-align:center;border:2px solid #1d3557;padding:6px;border-radius:4px;margin-bottom:10px;}
  .notice{background:#fef9c3;padding:4px;font-size:9px;text-align:center;margin:6px 0;border:1px solid #fde047;}
  table{border-collapse:collapse;width:100%;}
  th,td{border:1px solid #000;padding:2px 1px;vertical-align:middle;}
  th{background:#dbeafe;font-size:9px;}
  .signatures{display:flex;justify-content:space-between;margin-top:20px;font-size:10px;text-align:center;}
  .sign-item{width:30%;border-top:1px solid #000;padding-top:5px;margin-top:30px;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div class="header">
  <div style="font-size:12px;font-weight:bold;">الجمهورية العراقية — وزارة النفط</div>
  <div style="font-size:12px;font-weight:bold;">شركة نفط البصرة (شركة عامة)</div>
  <div style="font-size:11px;">شعبة مستودع الفاو — قسم السيطرة والنظم</div>
  <div style="font-size:14px;font-weight:bold;margin:4px 0;">استمارة تفاصيل الدوام لشهر ${monthLabel} ${tsYear}</div>
  <div style="font-size:11px;">الموقع: الفاو</div>
</div>
<div class="notice">ملاحظة: يرجى الانتباه إلى رموز المواظبة والتقيد بها وتثبيت مجموع الساعات للمشمولين بها</div>
<table><thead><tr>
  <th rowspan="2" style="width:60px;">الرقم الوظيفي</th>
  <th rowspan="2" style="width:160px;">اسم الموظف</th>
  <th rowspan="2" style="width:40px;">الحركة</th>
  <th rowspan="2" style="width:25px;">نوع</th>
  ${dayHeaders}
  <th rowspan="2" style="width:55px;">مجموع الساعات</th>
  <th rowspan="2" style="width:40px;">إجازة</th>
  <th rowspan="2" style="width:40px;">غياب</th>
  <th rowspan="2" style="width:40px;">عطل</th>
  <th rowspan="2" style="width:80px;">ملاحظات</th>
</tr></thead><tbody>${employeeRows}</tbody></table>
${symbolsTable}
<div class="signatures">
  <div class="sign-item">مدير القسم<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
  <div class="sign-item">مسؤول الشعبة<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
  <div class="sign-item">مسؤول ضبط الوقت<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
</div>
</body></html>`;
}

export function buildOfficialFormHTML(emps, tabTitle, monthLabel, tsYear, tsMonth, days) {
  const cs = "border:1px solid #374151;padding:2px 1px;text-align:center;font-size:9px;";
  const weStyle = "background:#fff7ed;";

  let bodyRows = "";
  emps.forEach((e, idx) => {
    const stats = calcTsStats(e);
    const bg = idx % 2 === 0 ? "" : "background:#f9fafb;";
    bodyRows += `<tr style="${bg}">`;
    bodyRows += `<td rowspan="2" style="${cs}font-weight:bold;font-size:10px;">${idx+1}</td>`;
    bodyRows += `<td rowspan="2" style="${cs}text-align:right;min-width:100px;font-weight:bold;">${e.name}</td>`;
    bodyRows += `<td rowspan="2" style="${cs}font-size:9px;color:#555;">${e.id}</td>`;
    bodyRows += `<td style="${cs}font-size:8px;color:#1d4ed8;font-weight:bold;">رمز</td>`;
    days.forEach(d => {
      const dow = new Date(tsYear, tsMonth, d).getDay();
      const isWe = dow===5||dow===6;
      const code = e.days[String(d)] || "";
      const cSt = code && TS_CODES_ALL[code] ? (COLOR_MAP[TS_CODES_ALL[code].color] || "") : (isWe ? weStyle : "");
      bodyRows += `<td style="${cs}${cSt}font-weight:bold;">${code}</td>`;
    });
    bodyRows += `<td rowspan="2" style="${cs}font-weight:bold;color:#1d4ed8;">${stats.totalHours||""}</td>`;
    bodyRows += `<td rowspan="2" style="${cs}color:#15803d;">${stats.leaveDays||""}</td>`;
    bodyRows += `<td rowspan="2" style="${cs}color:#dc2626;">${stats.absenceDays||""}</td>`;
    bodyRows += `<td rowspan="2" style="${cs}color:#6b7280;">${stats.restDays||""}</td>`;
    bodyRows += `<td rowspan="2" style="${cs}font-size:8px;text-align:right;">${e.notes||""}</td>`;
    bodyRows += `</tr><tr style="${bg}"><td style="${cs}font-size:8px;color:#7c3aed;font-weight:bold;">ساعة</td>`;
    days.forEach(d => {
      const dow = new Date(tsYear, tsMonth, d).getDay();
      const isWe = dow===5||dow===6;
      const h = e.hours[String(d)];
      bodyRows += `<td style="${cs}${h!=null?"background:#f5f3ff;color:#7c3aed;font-weight:600":isWe?weStyle:""}">${h!=null?h:""}</td>`;
    });
    bodyRows += `</tr>`;
  });

  const dayHdrs = days.map(d => {
    const dow = new Date(tsYear, tsMonth, d).getDay();
    const isWe = dow===5||dow===6;
    const shift = getShiftForDay(tsYear, tsMonth, d);
    return `<th style="border:1px solid #374151;padding:1px;text-align:center;font-size:8px;min-width:22px;${isWe?weStyle:"background:#eff6ff;"}">` +
      `<div style="font-weight:bold;font-size:9px;${isWe?"color:#ea580c;":""}">${d}</div>` +
      `<div style="font-size:7px;${isWe?"color:#ea580c;":""}">${DAY_NAMES_AR[dow]}</div>` +
      `<div style="font-size:7px;font-weight:bold;color:${SHIFT_TEXT_COLORS[shift]||"#374151"};">${shift}</div></th>`;
  }).join("");

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<style>
  @page{size:A3 landscape;margin:8mm;}
  body{font-family:'Arial',sans-serif;direction:rtl;margin:0;padding:0;}
  table{border-collapse:collapse;width:100%;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div style="text-align:center;margin-bottom:4px;border:2px solid #1d3557;padding:6px;border-radius:4px;">
  <div style="font-size:13px;font-weight:bold;">الجمهورية العراقية — وزارة النفط</div>
  <div style="font-size:12px;font-weight:bold;">شركة نفط البصرة</div>
  <div style="font-size:11px;">شعبة مستودع الفاو — قسم السيطرة والنظم</div>
  <div style="font-size:14px;font-weight:bold;margin-top:3px;">سجل الحضور والانصراف — ${tabTitle}</div>
  <div style="font-size:11px;">شهر: <strong>${monthLabel} ${tsYear}</strong> &nbsp;|&nbsp; رقم العمل: 3432960600</div>
</div>
<table><thead>
<tr style="background:#1d3557;color:#fff;">
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:20px;">ت</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:90px;">الاسم</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">الرقم</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:8px;width:28px;">نوع</th>
  ${dayHdrs}
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">الساعات</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">إجازة</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">غياب</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">عطل</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:50px;">ملاحظات</th>
</tr></thead>
<tbody>${bodyRows}</tbody></table>
<div style="display:flex;justify-content:space-between;margin-top:20px;font-size:11px;">
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع المسؤول المباشر</div></div>
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع رئيس القسم</div></div>
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع مدير الشعبة</div></div>
</div>
</body></html>`;
}
