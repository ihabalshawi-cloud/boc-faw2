// ── Config ────────────────────────────────────────────────────────────────────
export const FIREBASE_URL         = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";
export const FIREBASE_STORAGE_BUCKET = "faop-scada.firebasestorage.app";
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
  {id:11, username:"al.miyahi",  jobNum:"439193", name:"علي طاهر خزعل سبهان المياحي",               title:"حرفي اقدم",     dept:"شعبة المرافئ",         shift:"صباحي", allowedViews:["home","requests","health_insurance","notifications","changepass"]},
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
  // ══ حسابات اختبار ══
  {id:34, username:"test1",      jobNum:"728001", name:"اختبار ١",                                   title:"مدير اداري",    dept:"قسم السيطرة والنظم",  shift:"صباحي", role:"attendance_admin"},
  {id:35, username:"test2",      jobNum:"728002", name:"اختبار ٢",                                   title:"موظف",          dept:"قسم السيطرة والنظم",  shift:"صباحي"},
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
export const INITIAL_INVENTORY_ITEMS = [
  {id:1,   code:"2301280010",  name:"مقاومة متغيرة",                          category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2489"},
  {id:2,   code:"2301243008",  name:"مولد ذبذبات",                            category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"JB21280"},
  {id:3,   code:"2309443025",  name:"جهاز معايرة مقياس الضغط",               category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2605079"},
  {id:4,   code:"2309443011",  name:"جهاز معايرة مقياس الضغط",               category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"12064"},
  {id:5,   code:"2301373023",  name:"جهاز مقياس متعدد الاغراض",              category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"22460049"},
  {id:6,   code:"2301390031",  name:"جهازقياس الضغط بالاوزان",               category:"أجهزة قياس",    qty:1,  condition:"تالف",          location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"1B77"},
  {id:7,   code:"2308513026",  name:"جهاز معايرة الضغوط",                    category:"أجهزة معايرة",  qty:1,  condition:"يحتاج صيانة",  location:"ورشة الصيانة",         minQty:1, serialNo:"2414"},
  {id:8,   code:"2301493004",  name:"جهاز معايرة المزدوجات درجة الحرارة",    category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"B3-C511"},
  {id:9,   code:"2301293019",  name:"جهاز تمييز الحساسات الحرارية",          category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2645"},
  {id:10,  code:"2335613000",  name:"جهاز فحص الفولتيه",                      category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"SS22344089"},
  {id:11,  code:"2336263013",  name:"جهاز كشف مسار القابولات",                category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"SS257676213"},
  {id:12,  code:"2335070006",  name:"جهاز راسم الذبذبات",                    category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"RS-248-898"},
  {id:13,  code:"2311183002",  name:"كامرة تصوير حرارية",                    category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"TL-12513120"},
  {id:14,  code:"2503163065",  name:"ايفو ميتر",                              category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"263458"},
  {id:15,  code:"",            name:"ايفو ميتر",                              category:"أجهزة قياس",    qty:1,  condition:"يحتاج صيانة",  location:"ورشة الصيانة",         minQty:1, serialNo:"90410374"},
  {id:16,  code:"2501035893",  name:"كوسرة طيارية",                           category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:17,  code:"2505133097",  name:"منكنة",                                  category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:18,  code:"2505503033",  name:"جهاز ضغط يدوي هوائي",                  category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"13104"},
  {id:19,  code:"2505503013",  name:"جهاز ضغط يدوي هوائي",                  category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"220828"},
  {id:20,  code:"2507973015",  name:"جهاز ضغط هايدروليك",                    category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"17093"},
  {id:21,  code:"2507973016",  name:"جهاز ضغط هايدروليك",                    category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"17077"},
  {id:22,  code:"2509133009",  name:"جهاز معايرة الحرارة",                   category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"204822"},
  {id:23,  code:"2503303018",  name:"جهاز معايرة الحرارة",                   category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2594143"},
  {id:24,  code:"2503513013",  name:"جهاز معايرة التيار الكهربائي الواطئ",   category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2029006"},
  {id:25,  code:"2511233055",  name:"كلاب ميتر",                              category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"1400004"},
  {id:26,  code:"2511090188",  name:"ميتر",                                   category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"MEQ-2"},
  {id:27,  code:"2504786015",  name:"ضاغطة هواء",                             category:"معدات ميكانيكية",qty:1,  condition:"يحتاج صيانة",  location:"ورشة الصيانة",         minQty:1},
  {id:28,  code:"2505073613",  name:"مقياس ضغط هايدروليك",                   category:"مقاييس ضغط",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2605162"},
  {id:29,  code:"2510593033",  name:"جهاز قياس الحرارة",                     category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"12157"},
  {id:30,  code:"2503303032",  name:"جهاز قياس الحرارة الدقيق",              category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"227-005"},
  {id:31,  code:"",            name:"دريل كهربائي",                           category:"عدد كهربائية",   qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:32,  code:"",            name:"منفاخ هواء",                             category:"عدد كهربائية",   qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:33,  code:"2313973022",  name:"ماكنة لحام",                             category:"عدد كهربائية",   qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:34,  code:"",            name:"جهاز معايرة هايدروليك",                  category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N117079,17092"},
  {id:35,  code:"",            name:"جهاز معايرة هوائي",                      category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N2041104"},
  {id:36,  code:"",            name:"جهاز معايير الحرارة",                    category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N2034224"},
  {id:37,  code:"",            name:"جهاز معايرة الحراري BL-7",              category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N2642"},
  {id:38,  code:"",            name:"جهاز معايرة ضغط بالاوزان",              category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N3164"},
  {id:39,  code:"2624033",     name:"جهاز متعدد الاغراض مع قياس الضغط",     category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"FLUKE726"},
  {id:40,  code:"26242703",    name:"جهاز متعدد الاغراض مع قياس الضغط",     category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"FLUKE700P27"},
  {id:41,  code:"",            name:"جهاز معايرة الضغط بالهواء",             category:"أجهزة معايرة",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N13081"},
  {id:42,  code:"5869856100",  name:"VALVE SOLINOIED EXPROOF 3WA",           category:"صمامات",         qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:43,  code:"5899710065",  name:"VALVE NEDEL",                            category:"صمامات",         qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:44,  code:"5869892300",  name:"VALVE SWITSHING",                        category:"صمامات",         qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:45,  code:"5869996510",  name:"VALVE CHAAK INODC250",                   category:"صمامات",         qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:46,  code:"5869856050",  name:"NEEDLE SOLINIED 1/2 TUPE",              category:"صمامات",         qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:47,  code:"5883202040",  name:"NEEDLE VALVUE P-N215129",                category:"صمامات",         qty:4,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:48,  code:"5889835125",  name:"NEEDLE VALVUE P-N915370",                category:"صمامات",         qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:49,  code:"5863208250",  name:"NEEDLE VALVUE 4F-V6LN-SS",              category:"صمامات",         qty:21, condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:50,  code:"00-036-3401", name:"FNPTV BOLL 1/2 NEEDEL",                 category:"صمامات",         qty:7,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:51,  code:"",            name:"ايفيو ميتر",                             category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"57440394"},
  {id:52,  code:"",            name:"FLUKE",                                  category:"أجهزة قياس",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"9110016"},
  {id:53,  code:"",            name:"صمام ذاتي التفريق",                      category:"صمامات",         qty:1,  condition:"تالف",          location:"شعبة الآلات الدقيقة", minQty:1},
  {id:54,  code:"",            name:"قلم حديد",                               category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:55,  code:"",            name:"عدة قلم حديد مختلفة",                   category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:56,  code:"",            name:"كاغد جام",                               category:"مواد استهلاكية", qty:8,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:57,  code:"",            name:"فرشاة سيم",                              category:"مواد استهلاكية", qty:6,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:58,  code:"",            name:"شريط صمغ",                               category:"مواد استهلاكية", qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:59,  code:"",            name:"عدة غلقوز",                              category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:60,  code:"",            name:"منكنة بوري",                             category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:61,  code:"",            name:"منظم ضغط نيتروجين",                      category:"معدات ميكانيكية",qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:62,  code:"",            name:"برغي مختلف الاحجام",                     category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:63,  code:"",            name:"تيب حراري",                              category:"مواد استهلاكية", qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:64,  code:"",            name:"درنفيس فحص",                             category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:65,  code:"",            name:"لاوي مع مقص",                            category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:66,  code:"",            name:"بكرة كيبل سيار",                         category:"معدات كهربائية", qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:67,  code:"",            name:"منشار كهربائي",                          category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:68,  code:"",            name:"عدة اخراج بوري حديد",                   category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:69,  code:"",            name:"واشر ربل داي فرام",                      category:"قطع غيار",       qty:10, condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:70,  code:"",            name:"ركريتر كبير",                            category:"عدد يدوية",      qty:3,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:71,  code:"",            name:"بوري انبوب 6 متر",                      category:"معدات ميكانيكية",qty:20, condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:72,  code:"",            name:"افيوميتر لون ازرق",                      category:"أجهزة قياس",    qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:73,  code:"",            name:"ريكوليتر لون اسود صغير",                category:"قطع غيار",       qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:74,  code:"",            name:"كرنات",                                  category:"عدد يدوية",      qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:75,  code:"",            name:"برشر سويج",                              category:"معدات ميكانيكية",qty:3,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:76,  code:"",            name:"سبانه حجم 55",                           category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:77,  code:"",            name:"رافعة هايدروليك",                        category:"معدات ميكانيكية",qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:78,  code:"",            name:"حجر كوسرة",                              category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:79,  code:"",            name:"ربت",                                    category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:80,  code:"",            name:"عدة النكي",                              category:"عدد يدوية",      qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:81,  code:"",            name:"عدة لغم",                                category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:82,  code:"",            name:"عدة سباين مختلفة",                       category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:83,  code:"",            name:"مبرد",                                   category:"مواد استهلاكية", qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:84,  code:"",            name:"برينه مختلفة الحجم",                     category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:85,  code:"",            name:"عدة درنفيس مختلفة الحجم",               category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:86,  code:"",            name:"تفلون",                                  category:"مواد استهلاكية", qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:87,  code:"",            name:"كلوب صغير",                              category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:88,  code:"",            name:"صولدر",                                  category:"مواد استهلاكية", qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:89,  code:"",            name:"شريط ربط",                               category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:90,  code:"",            name:"توصالة ترامل",                           category:"توصيلات",        qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:91,  code:"",            name:"تيغه",                                   category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:92,  code:"",            name:"واير لحيم",                              category:"مواد استهلاكية", qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:93,  code:"",            name:"فرش صبغ",                                category:"مواد استهلاكية", qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:94,  code:"",            name:"كابسة ربت",                              category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:95,  code:"",            name:"مسدس صمغ",                               category:"عدد يدوية",      qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:96,  code:"",            name:"برينه صغيرة",                            category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:97,  code:"",            name:"قلقوز",                                  category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:98,  code:"",            name:"كماشة",                                  category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:99,  code:"",            name:"عدة استخراج ربل",                        category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:100, code:"",            name:"منشار تيغه",                             category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:101, code:"",            name:"كماشة حجم كبير",                         category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:102, code:"",            name:"جاكوج",                                  category:"عدد يدوية",      qty:3,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:103, code:"",            name:"كبان كبير",                              category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:104, code:"",            name:"كاوية لحيم",                             category:"عدد كهربائية",   qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:105, code:"",            name:"سكور سبانه كبير",                        category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:106, code:"",            name:"كندك كبير",                              category:"عدد يدوية",      qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:107, code:"",            name:"كيج 30 par",                             category:"مقاييس ضغط",    qty:6,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"صغير"},
  {id:108, code:"",            name:"كيج 60 psi",                             category:"مقاييس ضغط",    qty:25, condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"صغير"},
  {id:109, code:"",            name:"كيج 30 psi",                             category:"مقاييس ضغط",    qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"صغير"},
  {id:110, code:"",            name:"كيج kgf/cm 250",                         category:"مقاييس ضغط",    qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
  {id:111, code:"",            name:"كيج 25kg/cm",                            category:"مقاييس ضغط",    qty:8,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
  {id:112, code:"",            name:"صمام 1/2 HGVS12NC",                      category:"صمامات",         qty:14, condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:113, code:"",            name:"صمام مختلف الاستخدام",                   category:"صمامات",         qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير ذو 5 اتجاهات"},
  {id:114, code:"",            name:"مقياس ضغط /برشر سويج",                  category:"مقاييس ضغط",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:115, code:"",            name:"عكس مختلف الانواع والاستخدام حرفT",      category:"توصيلات",        qty:150,condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:116, code:"",            name:"عكس مختلف الانواع والاستخدام حرف  L",   category:"توصيلات",        qty:110,condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:117, code:"",            name:"نبله مختلف الاستخدام والاحجام",          category:"عدد يدوية",      qty:100,condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:118, code:"",            name:"50KG كيج",                               category:"مقاييس ضغط",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:119, code:"",            name:"25 par كيج",                             category:"مقاييس ضغط",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"وسط"},
  {id:120, code:"",            name:"مرسله ضغط",                              category:"عدد يدوية",      qty:7,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:121, code:"",            name:"مرسلة جريان",                            category:"مقاييس ضغط",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:122, code:"584-5002-529",name:"كيج 10 Kg",                              category:"مقاييس ضغط",    qty:9,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
  {id:123, code:"",            name:"16 kg كيج",                              category:"مقاييس ضغط",    qty:10, condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
  {id:124, code:"",            name:"100 C كيج",                              category:"مقاييس ضغط",    qty:2,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
  {id:125, code:"",            name:"PIC كارت",                               category:"قطع إلكترونية",  qty:8,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:126, code:"",            name:"لوحة اشارة",                             category:"قطع إلكترونية",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:127, code:"",            name:"مفتاح تشغيل",                            category:"قطع إلكترونية",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:128, code:"",            name:"ثرموستات متحسس حرارة  RTD",             category:"قطع إلكترونية",  qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:129, code:"",            name:"بريس ضغط",                               category:"مقاييس ضغط",    qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:130, code:"",            name:"رولة صبغ حجم صغير",                     category:"مواد استهلاكية", qty:1,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:131, code:"",            name:"متحكم ضغط",                              category:"قطع إلكترونية",  qty:3,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:132, code:"",            name:"بايب سبانه قياس 8 انج",                 category:"عدد يدوية",      qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:133, code:"",            name:"بايب سبانه قياس 10 انج",                category:"عدد يدوية",      qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:134, code:"",            name:"كندك قياس مختلف الاحجام",               category:"عدد يدوية",      qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:135, code:"",            name:"قاشطة متعددة",                           category:"عدد يدوية",      qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:136, code:"",            name:"كابسة ترامل",                            category:"معدات كهربائية", qty:5,  condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
  {id:137, code:"0020261519",  name:"عكس سبيل",                               category:"توصيلات",        qty:12, condition:"جيد",           location:"شعبة الآلات الدقيقة", minQty:1},
];
export const TASK_PRIORITIES    = ["عالية","متوسطة","منخفضة"];
export const TASK_STATUSES      = ["معلقة","قيد التنفيذ","مكتملة"];
export const EVAL_CRITERIA      = ["الانضباط والالتزام","جودة العمل","التعاون والعمل الجماعي","المبادرة والإبداع","الالتزام بالمواعيد"];
export const MARITAL_STATUS_LIST = ["متزوج","أعزب","مطلق","أرمل"];
export const PROCEDURE_TYPES    = ["اجور الطبيب","العلاجات (الادوية)","الرنين والمفراس/الايكو/تخطيط القلب","تحاليل مختبرية","نظارات طبية","اشعة وسونار","معالجة اسنان","العمليات فوق الكبرى","العمليات الكبرى","العمليات الوسطى","العمليات الصغرى","الامراض المستعصية"];

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
  incentive:"نظام المكافآت",
};
