import * as XLSX from "xlsx";

export function exportWorkExcel(work, entries) {
  const d = new Date(work.createdAt);
  const date = `${d.getDate()}/ ${d.getMonth()+1} /${d.getFullYear()}`;
  const workLines = (work.workDesc||"").split("\n").filter(l=>l.trim()).map(l=>[l.trim()]);
  const digits = (work.workNum||"").replace(/\s/g,"").split("");
  const data = [
    [],
    ["هيأة الصيانة الهندسية"],
    ["القسم: السيطرة والنظم"],
    [],
    [`إلى / السيد مدير هيأة الصيانة الهندسية`, "", "", "", `الرقم التسلسلي: ${work.seqNum||"___"}`],
    [`التاريخ: ${date}`],
    [],
    ["أدناه أسماء المستحقين للمكافآت وحسب ما مبين أدناه:"],
    ["عنوان العمل وموقعه والمبررات الموجبة:"],
    ...workLines,
    [],
    ["رقم العمل", ...digits],
    [],
    [],
    ["ت", "الاسم الثلاثي", "", "", "", "الرقم الوظيفي", "", "", "", "", "الفئة", ""],
    [],
    ...entries.map((e, i) => [i+1, e.empName, "", "", "", e.jobNum, "", "", "", "", e.category, ""]),
    [],
    [],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{wch:6},{wch:30},{wch:4},{wch:4},{wch:4},{wch:16},{wch:4},{wch:4},{wch:4},{wch:4},{wch:8},{wch:4}];
  ws["!merges"] = [
    {s:{r:1,c:0},e:{r:1,c:11}},
    {s:{r:2,c:0},e:{r:2,c:11}},
    {s:{r:4,c:0},e:{r:4,c:3}},
    {s:{r:4,c:4},e:{r:4,c:11}},
    {s:{r:5,c:0},e:{r:5,c:11}},
    {s:{r:7,c:0},e:{r:7,c:11}},
    {s:{r:8,c:0},e:{r:8,c:11}},
    ...workLines.map((_,i)=>({s:{r:9+i,c:0},e:{r:9+i,c:11}})),
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "استمارة مكافآت");
  XLSX.writeFile(wb, `استمارة-مكافآت-${work.workNum||"untitled"}.xlsx`);
}
