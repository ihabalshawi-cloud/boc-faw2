// ── Config ────────────────────────────────────────────────────────────────────
export const FIREBASE_URL         = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";
export const GDRIVE_PROXY         = "/api/drive-proxy";
export const LOW_STOCK_THRESHOLD  = 3;
export const GDRIVE_WARN_PCT      = 80;
export const GDRIVE_CRIT_PCT      = 95;

// ── Accounts ──────────────────────────────────────────────────────────────────
export const ACCOUNTS = [
  // ══ موظفو الدوام الصباحي ══
  {id:1,  username:"i.shawi",    jobNum:"728004", name:"ايهاب عبد اللطيف عودة سلمان الشاوي",        title:"ر. مهندسين",    dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"admin"},
  {id:2,  username:"o.rubaie",   jobNum:"727466", name:"عدي فيصل عبد الهادي عبد السيد الربيعه",     title:"ر. مهندسين",    dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:3,  username:"om.miyahi",  jobNum:"737283", name:"عمر طاهر خزعل سبهان المياحي",               title:"م.ر. مهندسين",  dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:4,  username:"l.rubaie",   jobNum:"756571", name:"ليث شاكر حمود زعيتر الربيعه",               title:"معاون مهندس",   dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:5,  username:"as.nassari", jobNum:"790850", name:"اسعد عبد الامام يوسف حميد النصاري",         title:"م.مدير فني",    dept:"شعبة مستودع الفاو",   shift:"صباحي"},
  {id:6,  username:"sb.nassari", jobNum:"758795", name:"صباح عبد الامام يوسف حميد النصاري",         title:"م.مدير فني",    dept:"شعبة مستودع الفاو",   shift:"صباحي"},
  {id:7,  username:"a.amir",     jobNum:"719242", name:"احمد محمود عبد القادر عبد الكريم الامير",   title:"مدير فني",      dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:8,  username:"m.mansouri", jobNum:"790869", name:"محمود كاظم هاشم محمد المنصوري",             title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:9,  username:"m.tamimi",   jobNum:"790885", name:"محمد عبد الكاظم جاسم محمد التميمي",         title:"محاسب اقدم",    dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"inventory_manager"},
  {id:10, username:"m.ali",      jobNum:"813877", name:"محمد اسماعيل احمد رمضان العلي",             title:"مهندس",         dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:11, username:"al.miyahi",  jobNum:"439193", name:"علي طاهر خزعل سبهان المياحي",               title:"حرفي اقدم",     dept:"شعبة المرافئ",         shift:"صباحي"},
  // ══ موظفو المناوبة — المجموعة A ══
  {id:12, username:"ab.abbada",  jobNum:"701130", name:"عبدالله علي زباري",                         title:"م.مدير فني",    dept:"شعبة مستودع الفاو",   shift:"مناوبة", group:"A"},
  {id:13, username:"am.ali",     jobNum:"751480", name:"امين حميد فاضل حسين العلي",                 title:"م.مدير فني",    dept:"شعبة مستودع الفاو",   shift:"مناوبة", group:"A"},
  {id:14, username:"h.abadi",    jobNum:"719269", name:"حسين علي احمد قاسم عبادي",                  title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"A"},
  {id:15, username:"j.hussain",  jobNum:"719498", name:"جاسم مزعل حاتم ديوان الحسين",               title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"A"},
  {id:16, username:"b.faris",    jobNum:"719277", name:"باسم هاشم جاسم هاشم الفارس",                title:"م.مدير فني",    dept:"شعبة المرافئ",         shift:"مناوبة", group:"A"},
  // ══ موظفو المناوبة — المجموعة B ══
  {id:17, username:"h.shnawa",   jobNum:"719293", name:"هاشم جابر جعفر شناوة عباس",                 title:"م.مدير فني",    dept:"شعبة المرافئ",         shift:"مناوبة", group:"B"},
  {id:18, username:"ab.eissa",   jobNum:"719463", name:"عبد الحميد سامي موسى بدر العيسى",           title:"مدير فني",      dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"B"},
  {id:19, username:"ih.dawod",   jobNum:"736732", name:"احسان عبد الصمد داود",                      title:"مدير فني",      dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"B"},
  {id:20, username:"al.jafar",   jobNum:"719048", name:"علاء محسن عذبي جعفر الجعفر",                title:"مدير فني",      dept:"شعبة مستودع الفاو",   shift:"مناوبة", group:"B"},
  // ══ موظفو المناوبة — المجموعة C ══
  {id:21, username:"al.aidani",  jobNum:"735922", name:"علي طارق ياسين مهودر العيداني",             title:"م.ر. مهندسين",  dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"C"},
  {id:22, username:"al.ali",     jobNum:"732249", name:"علي باقر حنتوش مليس العلي",                 title:"م.ر. مبرمجين",  dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"C"},
  {id:23, username:"y.yaseen",   jobNum:"726508", name:"يوسف عباس ياسين احمد ياسين",                title:"مدير فني",      dept:"شعبة مستودع الفاو",   shift:"مناوبة", group:"C"},
  {id:24, username:"dh.ghanim",  jobNum:"719129", name:"ضياء بدر حمادي اسماعيل الغانم",             title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"C"},
  {id:25, username:"ad.atiya",   jobNum:"719099", name:"عدنان جواد كاظم جعفر العطية",               title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"C"},
  // ══ موظفو المناوبة — المجموعة D ══
  {id:26, username:"ih.saleem",  jobNum:"732834", name:"احسان جواد كاظم حسين السليم",               title:"مهندس",         dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"D"},
  {id:27, username:"h.jasim",    jobNum:"724939", name:"حيدر عبد الحسن خضير جاسم",                  title:"مدير فني",      dept:"شعبة المرافئ",         shift:"مناوبة", group:"D"},
  {id:28, username:"w.mahsen",   jobNum:"718939", name:"واثق حسين عبد الشيخ حسن المحسن",            title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"D"},
  {id:29, username:"sd.eissa",   jobNum:"719005", name:"صدام عبد الواحد سلمان عيسى العيسى",         title:"م.مدير فني",    dept:"قسم السيطرة والنظم",  shift:"مناوبة", group:"D"},
  // ══ موظفو العقد ══
  {id:30, username:"ab.mouni",   jobNum:"690414", name:"عبد الله عيسى موسى موني",                   title:"عقد",           dept:"قسم السيطرة والنظم",  shift:"صباحي"},
  {id:31, username:"ab.eissa2",  jobNum:"689766", name:"اباذر صالح عبد الحسين عيسى",               title:"عقد",           dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"attendance_admin"},
  {id:32, username:"h.omran",    jobNum:"690174", name:"حسن عادل عمران يوسف",                       title:"عقد",           dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"attendance_admin"},
  {id:33, username:"sj.ali",     jobNum:"689331", name:"سجاد علي راضي علي",                         title:"عقد",           dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"attendance_admin"},
];
export const DEFAULT_PASSWORD = "1000";

// ── Leave & HR ────────────────────────────────────────────────────────────────
export const LEAVE_TYPES = {
  اعتيادية: { label:"إجازة اعتيادية", max:30, color:"bg-blue-100 text-blue-700" },
  مرضية:    { label:"إجازة مرضية",    max:15, color:"bg-rose-100 text-rose-700" },
  زمنية:    { label:"إجازة زمنية",    max:7,  color:"bg-amber-100 text-amber-700" },
};
export const TRAINING_TYPES     = ["تدريب ذاتي","دورة تدريبية","ورشة عمل","تدريب إلكتروني"];
export const ITEM_CONDITIONS    = ["جيد","مستعمل","يحتاج صيانة","تالف","تم الشطب"];
export const FURNITURE_CATS     = ["أثاث مكتبي","أجهزة تكييف","أجهزة حاسوب","معدات مكتبية","أجهزة منزلية"];
export const INVENTORY_CATS     = ["أجهزة قياس","أجهزة معايرة","عدد يدوية","عدد كهربائية","معدات ميكانيكية","معدات كهربائية","صمامات","توصيلات","مقاييس ضغط","قطع غيار","قطع إلكترونية","مواد استهلاكية"];
export const TASK_PRIORITIES    = ["عالية","متوسطة","منخفضة"];
export const TASK_STATUSES      = ["معلقة","قيد التنفيذ","مكتملة"];
export const EVAL_CRITERIA      = ["الانضباط والالتزام","جودة العمل","التعاون والعمل الجماعي","المبادرة والإبداع","الالتزام بالمواعيد"];
export const MARITAL_STATUS_LIST = ["متزوج","أعزب","مطلق","أرمل"];
export const PROCEDURE_TYPES    = ["الامراض المستعصية","العمليات الصغرى","العمليات الوسطى","العمليات الكبرى","العمليات فوق الكبرى","معالجة اسنان","اشعة وسونار","نظارات طبية","تحاليل مختبرية","الرنين والمفراس/الايكو/تخطيط القلب","العلاجات (الادوية)","اجور الطبيب"];

// ── Charts & Display ──────────────────────────────────────────────────────────
export const PIE_COLORS  = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6"];
export const MONTHS_AR   = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
export const MONTHS_IRAQI = ["كانون الثاني","شباط","آذار","نيسان","أيار","حزيران","تموز","آب","أيلول","تشرين الأول","تشرين الثاني","كانون الأول"];

// ── Equipment & Maintenance ───────────────────────────────────────────────────
export const EQ_TYPES = {
  "OIL_TANK":        { label:"خزان نفط",           badge:"bg-amber-100 text-amber-800",   dot:"bg-amber-500" },
  "WATER_TANK":      { label:"خزان ماء",            badge:"bg-sky-100 text-sky-800",       dot:"bg-sky-500" },
  "ELEC_OIL_PUMP":   { label:"مضخة كهربائية نفط",  badge:"bg-orange-100 text-orange-800", dot:"bg-orange-500" },
  "ELEC_WATER_PUMP": { label:"مضخة كهربائية ماء",  badge:"bg-cyan-100 text-cyan-800",     dot:"bg-cyan-500" },
  "FIRE_PUMP":       { label:"مضخة إطفاء",          badge:"bg-red-100 text-red-800",       dot:"bg-red-500" },
  "TURB_OIL_PUMP":   { label:"مضخة توربينية نفط",  badge:"bg-violet-100 text-violet-800", dot:"bg-violet-500" },
};

export const EQ_STATUS_COLORS = {
  "جيد":         "bg-emerald-100 text-emerald-700",
  "تحتاج صيانة": "bg-amber-100 text-amber-700",
  "تحت صيانة":   "bg-blue-100 text-blue-700",
  "معطل":        "bg-red-100 text-red-700",
};

export const INITIAL_EQUIPMENT = [
  { id:"T-OIL-001", name:"خزان نفط خام 1",              type:"OIL_TANK",        capacity:"50,000 برميل",   location:"منطقة الخزانات — الحظيرة الشمالية", status:"جيد",         lastMaintenance:"2025-01-20", nextMaintenance:"2025-07-20", critical:true,  totalFailures:0, manufacturer:"كبلر الألمانية",    model:"API 650",     yearInstalled:2018, notes:"خزان ثابت سقف عائم" },
  { id:"T-OIL-002", name:"خزان نفط خام 2",              type:"OIL_TANK",        capacity:"50,000 برميل",   location:"منطقة الخزانات — الحظيرة الشمالية", status:"جيد",         lastMaintenance:"2025-01-20", nextMaintenance:"2025-07-20", critical:true,  totalFailures:1, manufacturer:"كبلر الألمانية",    model:"API 650",     yearInstalled:2018, notes:"" },
  { id:"T-OIL-003", name:"خزان نفط خام 3",              type:"OIL_TANK",        capacity:"50,000 برميل",   location:"منطقة الخزانات — الحظيرة الجنوبية", status:"تحتاج صيانة", lastMaintenance:"2024-08-15", nextMaintenance:"2025-02-15", critical:true,  totalFailures:2, manufacturer:"كبلر الألمانية",    model:"API 650",     yearInstalled:2019, notes:"يحتاج فحص الطلاء الداخلي" },
  { id:"T-OIL-004", name:"خزان نفط خام 4 (احتياطي)",   type:"OIL_TANK",        capacity:"100,000 برميل",  location:"منطقة الخزانات — الحظيرة الجنوبية", status:"جيد",         lastMaintenance:"2025-02-10", nextMaintenance:"2025-08-10", critical:true,  totalFailures:0, manufacturer:"CB&I الأمريكية",   model:"API 650 LT",  yearInstalled:2020, notes:"الخزان الاحتياطي الرئيسي" },
  { id:"T-WAT-001", name:"خزان ماء الحريق الرئيسي",     type:"WATER_TANK",      capacity:"5,000 م³",       location:"محطة الإطفاء المركزية",             status:"جيد",         lastMaintenance:"2025-03-01", nextMaintenance:"2025-09-01", critical:true,  totalFailures:0, manufacturer:"محلي",              model:"خرساني مسلح", yearInstalled:2015, notes:"يُملأ تلقائياً من خط المياه" },
  { id:"T-WAT-002", name:"خزان مياه العمليات",           type:"WATER_TANK",      capacity:"2,000 م³",       location:"منطقة العمليات الغربية",            status:"جيد",         lastMaintenance:"2025-01-15", nextMaintenance:"2025-07-15", critical:false, totalFailures:1, manufacturer:"محلي",              model:"فولاذي",      yearInstalled:2017, notes:"" },
  { id:"PEO-001",   name:"مضخة خام كهربائية 1",          type:"ELEC_OIL_PUMP",   capacity:"500 م³/ساعة",    location:"محطة الضخ الرئيسية",                status:"جيد",         lastMaintenance:"2025-02-01", nextMaintenance:"2025-05-01", critical:true,  totalFailures:2, manufacturer:"سولفلو إيطالية",   model:"SF-500E",     yearInstalled:2019, notes:"مضخة طرد مركزي 500 كيلوواط" },
  { id:"PEO-002",   name:"مضخة خام كهربائية 2",          type:"ELEC_OIL_PUMP",   capacity:"500 م³/ساعة",    location:"محطة الضخ الرئيسية",                status:"جيد",         lastMaintenance:"2025-02-01", nextMaintenance:"2025-05-01", critical:true,  totalFailures:1, manufacturer:"سولفلو إيطالية",   model:"SF-500E",     yearInstalled:2019, notes:"" },
  { id:"PEO-003",   name:"مضخة خام كهربائية 3",          type:"ELEC_OIL_PUMP",   capacity:"300 م³/ساعة",    location:"محطة النقل الفرعية",                status:"تحت صيانة",  lastMaintenance:"2025-04-10", nextMaintenance:"2025-06-10", critical:false, totalFailures:4, manufacturer:"إيتون الأمريكية",  model:"ET-300",      yearInstalled:2017, notes:"قيد الصيانة الدورية" },
  { id:"PEO-004",   name:"مضخة خام احتياطية",            type:"ELEC_OIL_PUMP",   capacity:"500 م³/ساعة",    location:"محطة الضخ الرئيسية",                status:"جيد",         lastMaintenance:"2025-01-15", nextMaintenance:"2025-07-15", critical:true,  totalFailures:0, manufacturer:"سولفلو إيطالية",   model:"SF-500E",     yearInstalled:2021, notes:"تعمل عند توقف إحدى المضختين" },
  { id:"PEW-001",   name:"مضخة ماء كهربائية 1",          type:"ELEC_WATER_PUMP", capacity:"200 م³/ساعة",    location:"محطة المياه",                       status:"جيد",         lastMaintenance:"2025-03-01", nextMaintenance:"2025-09-01", critical:false, totalFailures:1, manufacturer:"غرونفوس الدنماركية", model:"NK-200",    yearInstalled:2018, notes:"" },
  { id:"PEW-002",   name:"مضخة ماء كهربائية 2",          type:"ELEC_WATER_PUMP", capacity:"200 م³/ساعة",    location:"محطة المياه",                       status:"معطل",        lastMaintenance:"2025-01-10", nextMaintenance:"2025-02-10", critical:false, totalFailures:3, manufacturer:"غرونفوس الدنماركية", model:"NK-200",    yearInstalled:2018, notes:"تلف في المحرك — قيد الإصلاح" },
  { id:"PFF-001",   name:"مضخة إطفاء رئيسية",            type:"FIRE_PUMP",       capacity:"600 م³/ساعة",    location:"محطة الإطفاء المركزية",             status:"جيد",         lastMaintenance:"2025-04-01", nextMaintenance:"2025-07-01", critical:true,  totalFailures:0, manufacturer:"داركو الأمريكية",  model:"DK-600FP",   yearInstalled:2016, notes:"اختبار أسبوعي وفق NFPA20" },
  { id:"PFF-002",   name:"مضخة إطفاء احتياطية (ديزل)",   type:"FIRE_PUMP",       capacity:"600 م³/ساعة",    location:"محطة الإطفاء المركزية",             status:"جيد",         lastMaintenance:"2025-04-01", nextMaintenance:"2025-07-01", critical:true,  totalFailures:0, manufacturer:"كلارك الأمريكية",  model:"CL-DX600",   yearInstalled:2016, notes:"تعمل بمحرك ديزل عند انقطاع الكهرباء" },
  { id:"PFF-003",   name:"مضخة جوكي الضغط",              type:"FIRE_PUMP",       capacity:"20 م³/ساعة",     location:"محطة الإطفاء المركزية",             status:"جيد",         lastMaintenance:"2025-03-15", nextMaintenance:"2025-06-15", critical:false, totalFailures:1, manufacturer:"غرونفوس",          model:"NK-20J",     yearInstalled:2016, notes:"للحفاظ على ضغط خط الإطفاء" },
  { id:"PTO-001",   name:"مضخة توربينية نفط 1",          type:"TURB_OIL_PUMP",   capacity:"1,000 م³/ساعة", location:"محطة التوربينات الرئيسية",           status:"جيد",         lastMaintenance:"2025-02-20", nextMaintenance:"2025-08-20", critical:true,  totalFailures:1, manufacturer:"سولزر السويسرية",  model:"BB2-1000T",  yearInstalled:2018, notes:"توربين بخاري عالي الضغط" },
  { id:"PTO-002",   name:"مضخة توربينية نفط 2",          type:"TURB_OIL_PUMP",   capacity:"1,000 م³/ساعة", location:"محطة التوربينات الرئيسية",           status:"تحتاج صيانة", lastMaintenance:"2024-10-05", nextMaintenance:"2025-04-05", critical:true,  totalFailures:3, manufacturer:"سولزر السويسرية",  model:"BB2-1000T",  yearInstalled:2018, notes:"مستحقة الصيانة الدورية — نصف سنوية" },
  { id:"PTO-003",   name:"مضخة توربينية احتياطية",        type:"TURB_OIL_PUMP",   capacity:"800 م³/ساعة",   location:"محطة التوربينات الرئيسية",           status:"جيد",         lastMaintenance:"2025-01-30", nextMaintenance:"2025-07-30", critical:true,  totalFailures:0, manufacturer:"فلور الأمريكية",   model:"FLW-800T",   yearInstalled:2021, notes:"" },
];

export const INITIAL_MAINT_SPARE_PARTS = [
  { id:"SP-001", code:"BRG-001", name:"رولمان بلي 6204",      category:"ميكانيكية",       qty:8,  minAlert:2, unit:"قطعة", price:25, location:"الرف A1"     },
  { id:"SP-002", code:"OIL-001", name:"زيت تشحيم (20 لتر)",   category:"مواد استهلاكية", qty:12, minAlert:3, unit:"لتر",  price:15, location:"المستودع B2" },
  { id:"SP-003", code:"FLT-001", name:"فلتر زيت",              category:"فلتر",            qty:5,  minAlert:2, unit:"قطعة", price:12, location:"الرف C3"     },
];

// ── Navigation ────────────────────────────────────────────────────────────────
export const VIEW_LABELS = {
  home:"الرئيسية", analytics:"التحليلات", requests:"طلبات الإجازة",
  attendance:"الحضور والانصراف", training:"التدريب", tasks:"المهام",
  inventory:"المخزون", furniture:"الأثاث", maint_equipment:"صيانة المعدات",
  maint_parts:"قطع الغيار", maint_reports:"تقارير الصيانة",
  chat:"الدردشة الداخلية", evaluation:"التقييم", notifications:"الإشعارات",
  audit:"سجل التعديلات", changepass:"تغيير كلمة المرور",
  employees:"إدارة الموظفين", approvals:"الموافقات",
  health_insurance:"الضمان الصحي", leave_forms:"نماذج الإجازات",
  projects:"إدارة المشاريع", timesheet:"التايم شيت",
  admin_dashboard:"لوحة الإدارة",
};
