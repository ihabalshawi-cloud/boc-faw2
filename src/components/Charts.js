import React from "react";

export const SVGBarChart = React.memo(function SVGBarChart({ data, keys, colors, height = 180, labelKey = "name" }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center text-secondary text-sm" style={{height}}>لا توجد بيانات</div>;
  const W = 480; const H = height; const PAD = { t:10, r:10, b:32, l:28 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const maxVal = Math.max(1, ...data.flatMap(d => keys.map(k => Number(d[k]||0))));
  const groupW = chartW / data.length;
  const barW = Math.max(4, groupW / keys.length - 3);
  const yTicks = [0, Math.ceil(maxVal/4), Math.ceil(maxVal/2), Math.ceil(maxVal*3/4), maxVal];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{overflow:"visible"}}>
      {/* Grid */}
      {yTicks.map((t,i) => { const y = PAD.t + chartH - (t/maxVal)*chartH; return (
        <g key={i}><line x1={PAD.l} x2={W-PAD.r} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i===0?"0":"3,3"}/><text x={PAD.l-4} y={y+4} textAnchor="end" fontSize="9" fill="#94a3b8">{t}</text></g>
      );})}
      {/* Bars */}
      {data.map((d, di) => keys.map((k, ki) => {
        const val = Number(d[k]||0);
        const barH = (val/maxVal)*chartH;
        const x = PAD.l + di*groupW + ki*(barW+3) + 4;
        const y = PAD.t + chartH - barH;
        return <g key={`${di}-${ki}`}><rect x={x} y={y} width={barW} height={Math.max(0,barH)} fill={colors[ki]} rx="2"/>{val>0&&<text x={x+barW/2} y={y-3} textAnchor="middle" fontSize="8" fill={colors[ki]}>{val}</text>}</g>;
      }))}
      {/* X Labels */}
      {data.map((d,i) => <text key={i} x={PAD.l + i*groupW + groupW/2} y={H-8} textAnchor="middle" fontSize="9" fill="#64748b">{d[labelKey]}</text>)}
      {/* Legend */}
      {keys.map((k,i) => <g key={i} transform={`translate(${PAD.l + i*90}, ${H-2})`}><rect width="8" height="8" fill={colors[i]} rx="1" y="-8"/><text x="12" y="0" fontSize="9" fill="#64748b">{k}</text></g>)}
    </svg>
  );
});

export const SVGPieChart = React.memo(function SVGPieChart({ data, colors, height = 180, donut = false }) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center text-secondary text-sm" style={{height}}>لا توجد بيانات</div>;
  const total = data.reduce((s,d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center justify-center text-secondary text-sm" style={{height}}>لا توجد بيانات</div>;
  const cx = 90; const cy = height/2; const r = Math.min(cx, cy) - 16; const ir = donut ? r*0.5 : 0;
  let angle = -Math.PI/2;
  const slices = data.map((d,i) => {
    const sweep = (d.value/total) * 2 * Math.PI;
    const x1 = cx + r*Math.cos(angle); const y1 = cy + r*Math.sin(angle);
    angle += sweep;
    const x2 = cx + r*Math.cos(angle); const y2 = cy + r*Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const mx = cx + (r+ir)/2*Math.cos(angle-sweep/2); const my = cy + (r+ir)/2*Math.sin(angle-sweep/2);
    return { d: donut
      ? `M${cx+ir*Math.cos(angle-sweep)} ${cy+ir*Math.sin(angle-sweep)} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${cx+ir*Math.cos(angle)} ${cy+ir*Math.sin(angle)} A${ir} ${ir} 0 ${large} 0 ${cx+ir*Math.cos(angle-sweep)} ${cy+ir*Math.sin(angle-sweep)} Z`
      : `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      color: colors[i%colors.length], label: d.name, value: d.value, mx, my };
  });
  return (
    <svg viewBox={`0 0 280 ${height}`} width="100%">
      {slices.map((s,i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="1.5"/>)}
      {/* Legend */}
      {data.map((d,i) => <g key={i} transform={`translate(190, ${16 + i*22})`}><rect width="10" height="10" fill={colors[i%colors.length]} rx="2"/><text x="14" y="9" fontSize="10" fill="#475569">{d.name}</text><text x="14" y="20" fontSize="9" fill="#94a3b8">{d.value} ({Math.round(d.value/total*100)}%)</text></g>)}
    </svg>
  );
});
