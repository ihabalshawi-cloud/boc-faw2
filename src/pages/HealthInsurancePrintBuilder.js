import { PROCEDURE_TYPES, MONTHS_IRAQI } from "../constants";

export function buildHealthInsurancePrintHTML({ emp, rows, marital, phone, formEnvelope, formSequence, month, year, filledRows, totalAmount, forWord = false }) {
  const now = new Date();
  const PROC_COLS = [...PROCEDURE_TYPES].reverse();
  const printRows = rows.slice(0, 15).concat(
    Array.from({length: Math.max(0, 10-rows.length)}, (_, i) => ({
      id: rows.length+i+1, beneficiary:"", date:"", procedure:"", amount:"", opType:"", notes:""
    }))
  );
  const procHeadCols = PROC_COLS.map(pt =>
    `<th style="width:13mm"><div class="th-vert">${pt}</div></th>`
  ).join("");
  const dataRows = printRows.map((r, i) => `
      <tr style="height:9mm">
        <td style="text-align:center">${i+1}</td>
        <td class="td-name">${r.beneficiary||""}</td>
        <td class="td-date">${r.date ? r.date.split("-").reverse().join("/") : ""}</td>
        ${PROC_COLS.map(pt=>`<td class="td-amt">${r.procedure===pt ? (r.amount ? Number(r.amount).toLocaleString() : "✓") : ""}</td>`).join("")}
        <td class="td-amt">${r.opType||""}</td>
        <td class="td-amt">${r.notes||""}</td>
      </tr>`).join("");

  const wordHeader = forWord ? `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="UTF-8"/><meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word 15"><meta name=Originator content="Microsoft Word 15">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->` : `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"/>`;

  return `${wordHeader}
<title>استمارة طلب التعويض للموظفين</title>
<style>
  @page{size:A4 landscape;margin:7mm 8mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;font-size:8.5pt;direction:rtl;color:#000}
  .hbox{border:2px solid #000;margin-bottom:3mm;width:100%}
  .htitle{text-align:center;font-size:14pt;font-weight:bold;padding:2.5mm;border-bottom:2px solid #000;background:#D9D9D9}
  .hgrid{display:grid;grid-template-columns:1fr 1fr 1fr;direction:rtl;width:100%}
  .hcol{padding:2mm 3mm;border-left:1px solid #000;vertical-align:top}
  .hcol:last-child{border-left:none}
  .frow{display:flex;align-items:baseline;gap:3px;padding:2px 0;min-height:18px;border-bottom:1px solid #ddd}
  .frow:last-child{border-bottom:none}
  .fl{font-weight:bold;white-space:nowrap;font-size:7.5pt;min-width:100px}
  .fv{flex:1;border-bottom:1.5px solid #000;font-size:8.5pt;padding-bottom:1px;padding-right:4px}
  .section-lbl{text-align:center;font-weight:bold;font-size:10pt;background:#D9D9D9;border-bottom:1px solid #000;padding:1.5mm 0}
  table{border-collapse:collapse;width:100%;table-layout:fixed}
  th,td{border:1px solid #000;text-align:center;vertical-align:middle;font-size:6.5pt;padding:0 1px;word-break:break-all}
  th{background:#D9D9D9;font-weight:bold}
  .th-vert{writing-mode:vertical-rl;text-orientation:mixed;transform:rotate(180deg);height:26mm;font-size:5.5pt;line-height:1.3}
  .td-name{text-align:right;font-size:8pt;padding-right:1.5mm}
  .td-date{font-size:7pt}
  .td-amt{font-size:7.5pt;font-weight:bold}
  .footer-area{margin-top:3mm;font-size:8pt;direction:rtl}
  .sigrow{display:grid;grid-template-columns:repeat(4,1fr);gap:8mm;margin-top:3mm;text-align:center}
  .sigcell{font-weight:bold;font-size:9pt}
  .sigline{margin-top:10mm;border-top:1.5px solid #000;padding-top:1mm;font-size:7pt;font-weight:normal}
  .summary-box{border:1px solid #000;padding:2mm;margin-top:2mm;display:flex;gap:8mm;justify-content:center;background:#f8f8f8}
</style></head><body>
<div class="hbox">
  <div class="htitle">استمارة طلب التعويض للموظفين — لجنة الضمان الصحي المركزية</div>
  <div class="hgrid">
    <div class="hcol">
      <div class="section-lbl">بيانات الموظف</div>
      <div class="frow"><span class="fl">اسم الموظف:</span><span class="fv">${emp.name}</span></div>
      <div class="frow"><span class="fl">الرقم الوظيفي:</span><span class="fv">${emp.jobNum||""}</span></div>
      <div class="frow"><span class="fl">الحالة الزوجية:</span><span class="fv">${marital}</span></div>
      <div class="frow"><span class="fl">رقم الهاتف:</span><span class="fv">${phone}</span></div>
      <div class="frow"><span class="fl">توقيع الموظف:</span><span class="fv">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>
    <div class="hcol">
      <div class="section-lbl">الصيانة الهندسية / السيطرة والنظم</div>
      <div class="frow"><span class="fl">الشهـر:</span><span class="fv">${MONTHS_IRAQI[month]} ${year}</span></div>
      <div class="frow"><span class="fl">تاريخ تقديم الطلب:</span><span class="fv">${now.toLocaleDateString("ar-IQ")}</span></div>
      <div class="frow"><span class="fl">رقم الظرف:</span><span class="fv">${formEnvelope}</span></div>
      <div class="frow"><span class="fl">التسلسل:</span><span class="fv">${formSequence}</span></div>
    </div>
    <div class="hcol">
      <div class="section-lbl">ملخص الطلب</div>
      <div class="frow"><span class="fl">عدد المراجعات:</span><span class="fv">${filledRows.length}</span></div>
      <div class="frow"><span class="fl">المجموع الكلي:</span><span class="fv">${totalAmount.toLocaleString()} دينار</span></div>
      <div class="frow"><span class="fl">اسم الهيأة/القسم:</span><span class="fv">الصيانة الهندسية / السيطرة والنظم</span></div>
      <div class="frow"><span class="fl">&nbsp;</span><span class="fv">&nbsp;</span></div>
      <div class="frow"><span class="fl">&nbsp;</span><span class="fv">&nbsp;</span></div>
    </div>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:7mm">ت</th>
      <th rowspan="2" style="width:35mm">اسم المنتفع</th>
      <th rowspan="2" style="width:17mm">تاريخ المراجعة</th>
      <th colspan="${PROC_COLS.length}" style="font-size:8.5pt;background:#B8CCE4">نوع الإجراء الطبي</th>
      <th rowspan="2" style="width:18mm">نوع العملية</th>
      <th rowspan="2" style="width:20mm">ملاحظات</th>
    </tr>
    <tr>${procHeadCols}</tr>
  </thead>
  <tbody>${dataRows}</tbody>
  <tfoot>
    <tr style="background:#D9D9D9;font-weight:bold">
      <td colspan="3" style="text-align:right;padding:1.5mm;font-size:8pt">المجموع الكلي (${filledRows.length} مراجعة)</td>
      ${PROC_COLS.map(()=>`<td></td>`).join("")}
      <td style="font-size:9pt">${totalAmount.toLocaleString()}</td>
      <td></td>
    </tr>
  </tfoot>
</table>
<div class="footer-area">
  <div>اسم وتوقيع المخول: ___________________________________</div>
  <div class="sigrow">
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">العضو<div class="sigline">الاسم والتوقيع</div></div>
    <div class="sigcell">رئيس اللجنة<div class="sigline">الاسم والتوقيع</div></div>
  </div>
</div>
</body></html>`;
}
