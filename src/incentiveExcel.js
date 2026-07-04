import * as XLSX from "xlsx";

function sc(ws, ref, value) {
  if (ws[ref]) { ws[ref].v = value; ws[ref].w = String(value); }
  else ws[ref] = { v: value, t: typeof value === "number" ? "n" : "s" };
}

export async function exportWorkExcel(work, entries) {
  const isContract = entries.some(e => e.isContract);
  const tpl = isContract ? "incentive-contracts" : "incentive-malak";
  try {
    const resp = await fetch(`/templates/${tpl}.xlsx`);
    const buf = await resp.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellStyles: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const d = new Date(work.createdAt);
    const date = `${d.getDate()}/ ${d.getMonth()+1} /${d.getFullYear()}`;
    const lines = (work.workDesc||"").split("\n").filter(l=>l.trim());
    const digs = (work.workNum||"").replace(/\s/g,"").split("");
    if (!isContract) {
      sc(ws,"B13",`التاريخ: ${date}`);
      ["B16","B17","B18","B19"].forEach((r,i)=>sc(ws,r,lines[i]?`${i+1}-     ${lines[i].replace(/^\d+[-–]\s*/,"")}`:`${i+1}-`));
      ["E","F","G","H","I","J","K","L","M","N"].forEach((c,i)=>{if(digs[i]!==undefined)sc(ws,`${c}21`,Number(digs[i]));});
      entries.forEach((e,i)=>{sc(ws,`C${27+i}`,e.empName);sc(ws,`H${27+i}`,e.jobNum);sc(ws,`M${27+i}`,e.category);});
    } else {
      sc(ws,"P10",date);
      ["B15","B17","B19"].forEach((r,i)=>sc(ws,r,lines[i]?`${i+1}-     ${lines[i].replace(/^\d+[-–]\s*/,"")}`:`${i+1}-`));
      ["H","I","J","K","L","M","N","O","P","Q"].forEach((c,i)=>{if(digs[i]!==undefined)sc(ws,`${c}21`,Number(digs[i]));});
      entries.forEach((e,i)=>{sc(ws,`C${27+i}`,e.empName);sc(ws,`H${27+i}`,e.jobNum);sc(ws,`M${27+i}`,e.category);});
    }
    const out = XLSX.write(wb, {bookType:"xlsx",type:"array"});
    const blob = new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `استمارة-مكافآت-${work.workNum||"untitled"}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch(err) { console.error("Excel export failed:", err); }
}
