// Helper: builds and uploads the Out-of-Country Leave form as a .docx Word file
export async function buildOocDocx({ name, jobNum, jobTitle, dept, country, days, salaryType, purpose, reqDate, refNum, fmtDate }) {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, VerticalAlign, BorderStyle, ShadingType,
    UnderlineType,
  } = await import("docx");

  // ── border helpers ──
  const SB  = { style: BorderStyle.SINGLE,  size: 8,  color: "444444" };
  const DB  = { style: BorderStyle.DOTTED,  size: 4,  color: "AAAAAA" };
  const NB  = { style: BorderStyle.NONE,    size: 0,  color: "FFFFFF" };

  // ── text helpers ──
  const ar = (text, opts = {}) => new TextRun({
    text,
    rightToLeft: true,
    font: "Times New Roman",
    size: opts.sz || 22,
    bold: opts.b || false,
    underline: opts.u ? { type: UnderlineType.SINGLE } : undefined,
  });

  const p = (runs, opts = {}) => new Paragraph({
    bidirectional: true,
    alignment: opts.al !== undefined ? opts.al : AlignmentType.RIGHT,
    spacing: { before: opts.sb !== undefined ? opts.sb : 80, after: opts.sa !== undefined ? opts.sa : 80 },
    border: opts.bdr,
    children: Array.isArray(runs) ? runs : [runs],
  });

  // ── cell helper ──
  const tc = (content, opts = {}) => new TableCell({
    width: opts.w ? { size: opts.w, type: WidthType.PERCENTAGE } : undefined,
    rowSpan: opts.rs,
    columnSpan: opts.cs,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined,
    borders: {
      top:    opts.bt !== undefined ? opts.bt : SB,
      bottom: opts.bb !== undefined ? opts.bb : SB,
      left:   opts.bl !== undefined ? opts.bl : SB,
      right:  opts.br !== undefined ? opts.br : SB,
    },
    children: Array.isArray(content) ? content : [content],
  });

  // ── HEADER TABLE ──
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        tc([p(ar("شركة نفط البصرة", { b: true, sz: 22 }), { al: AlignmentType.CENTER, sb: 40, sa: 20 }),
            p(ar("(شركة عامة)", { sz: 20 }),              { al: AlignmentType.CENTER, sb: 20, sa: 40 })],
           { rs: 2, fill: "F0F0F0" }),
        tc(p(ar("عنوان النموذج", { sz: 18 }), { al: AlignmentType.CENTER }), { fill: "FAFAFA" }),
        tc(p(ar("نموذج طلب اجازة خارج جمهورية العراق", { b: true, sz: 24 }), { al: AlignmentType.CENTER, sb: 40, sa: 40 }), { cs: 2 }),
        tc([p(ar("B.O.C",              { b: true, sz: 28 }), { al: AlignmentType.CENTER, sb: 30, sa: 10 }),
            p(ar("شركة نفط البصرة",   { sz: 14 }),           { al: AlignmentType.CENTER, sb: 0,  sa: 30 })],
           { rs: 2 }),
      ]}),
      new TableRow({ children: [
        tc(p(ar("رمز النموذج", { sz: 18 }), { al: AlignmentType.CENTER }), { fill: "FAFAFA" }),
        tc(p(ar("BOC-P-HR/F05", { b: true, sz: 20 }), { al: AlignmentType.CENTER })),
        tc([p(ar("رقم الإصدار: 1",        { sz: 18 }), { al: AlignmentType.CENTER, sb: 30, sa: 20 }),
            p(ar("تاريخ الإصدار: 2023/4/10", { sz: 18 }), { al: AlignmentType.CENTER, sb: 20, sa: 30 })]),
      ]}),
    ],
  });

  // ── FIELDS TABLE ──
  const fieldsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      ["الاسم الثلاثي :", name || ""],
      ["الرقم الوظيفي :", jobNum || ""],
      ["العنوان الوظيفي :", jobTitle || ""],
      ["تاريخ تقديم الطلب :", fmtDate(reqDate)],
    ].map(([lbl, val]) => new TableRow({ children: [
      tc(p(ar(lbl, { b: true }),  { sb: 80, sa: 80 }), { w: 30, bt: NB, bb: DB, bl: NB, br: NB }),
      tc(p(ar(val),               { sb: 80, sa: 80 }), { w: 70, bt: NB, bb: SB, bl: NB, br: NB }),
    ]})),
  });

  // ── REQUEST PARAGRAPH ──
  const PB = { value: "single", size: 8, color: "333333" };
  const reqPara = p([
    ar("ارجو التفضل بالموافقة على منحي اجازة اعتيادية خارج جمهورية العراق ( "),
    ar(country || "_______________", { b: true }),
    ar(" ) ولمدة ( "),
    ar(days || "____", { b: true }),
    ar(" يوما ) ( "),
    ar(salaryType || "براتب", { b: true }),
    ar(" لغرض ) ( "),
    ar(purpose || "___________________________", { b: true }),
    ar(" ) وابتدآ من تاريخ الانفكاك ."),
  ], { sb: 160, sa: 160, bdr: { top: PB, bottom: PB, left: PB, right: PB } });

  // ── 4-COLUMN SIGNATURE TABLE ──
  const sigCell = (title) => tc([
    p(ar(title, { b: true, sz: 20 }), { al: AlignmentType.CENTER, sb: 60, sa: 300 }),
    p(ar(""), { sb: 0, sa: 60 }),
  ]);
  const sig4Table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      sigCell("مسؤول الشعبة"),
      sigCell("مدير القسم"),
      sigCell("مدير هيأة الصيانة الهندسية"),
      sigCell("المعاون المختص"),
    ]})],
  });

  // ── NOTE ──
  const PBD = { value: "dotted", size: 4, color: "999999" };
  const notePara = p([
    ar("ملاحظة : ", { b: true, sz: 20 }),
    ar("يرسل الطلب الى الهيئة الادارية في حال طلب الاجازة ( براتب تام) لاكثر من 3 اشهر ولغاية 4 اشهر وفي حال طلب الاجازة ( بدون راتب )", { sz: 20 }),
  ], { sb: 100, sa: 100, bdr: { top: PBD, bottom: PBD, left: PBD, right: PBD } });

  // ── DASHED SEPARATOR ──
  const sep = p(ar(""), { sb: 240, sa: 240,
    bdr: { bottom: { value: "dashed", size: 8, color: "555555" } }
  });

  // ── FORWARDING LETTER HEADER ──
  const fwdHeaderTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      tc([
        p([ar("من / "), ar(dept || "قسم السيطرة والنظم", { b: true })], { sb: 60, sa: 60 }),
        p(ar("الى / السيد مدير هيأة الصيانة الهندسية"),                  { sb: 60, sa: 60 }),
      ], { bt: NB, bb: NB, bl: NB, br: NB }),
      tc([
        p([ar("العـــدد : "), ar(refNum || "________", { b: true })], { al: AlignmentType.RIGHT, sb: 60, sa: 60 }),
        p([ar("التاريخ : "), ar(fmtDate(reqDate), { b: true })],       { al: AlignmentType.RIGHT, sb: 60, sa: 60 }),
      ], { bt: NB, bb: NB, bl: NB, br: NB }),
    ]})],
  });

  // ── FWD SIGNATURE BOX ──
  const fwdSigTable = new Table({
    width: { size: 45, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [
      tc([
        p(ar("توقيع مدير الهيئة الادارية", { b: true, sz: 20 }), { al: AlignmentType.CENTER, sb: 60, sa: 260 }),
        p(ar("التوقيع : ________________", { sz: 20 }),            { al: AlignmentType.CENTER, sb: 40, sa: 60 }),
      ]),
    ]})],
  });

  // ── BUILD DOCUMENT ──
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size:   { width: 11906, height: 16838 },
          margin: { top: 1700, right: 1360, bottom: 1700, left: 1360 },
        },
      },
      children: [
        headerTable,
        p(ar(""), { sb: 120, sa: 0 }),
        p(ar("م/ إجازة اعتيادية خارج جمهورية العراق", { b: true, sz: 26, u: true }), { sb: 80, sa: 140 }),
        fieldsTable,
        p(ar(""), { sb: 80, sa: 0 }),
        reqPara,
        p(ar("مع التقدير ...", { sz: 22 }), { sb: 120, sa: 120 }),
        sig4Table,
        p(ar(""), { sb: 60, sa: 0 }),
        notePara,
        sep,
        fwdHeaderTable,
        p(ar("م/ طلب اجازة اعتيادية خارج جمهورية العراق", { b: true, sz: 24, u: true }), { sb: 120, sa: 80 }),
        p([
          ar("نرفق لكم اعلاه طلب السيد "),
          ar(name || "___________", { b: true, u: true }),
          ar(" للتفضل بالموافقة على منحه الاجازة المطلوبة وحسب صلاحيتكم"),
        ], { sb: 80, sa: 120 }),
        p(ar("مع التقدير...", { sz: 22 }), { sb: 120, sa: 180 }),
        fwdSigTable,
      ],
    }],
  });

  return Packer.toBlob(doc);
}
