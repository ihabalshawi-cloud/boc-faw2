import React, { useState, useEffect, useCallback } from "react";
import { Save, CheckCircle, Plus, Trash2, Edit3, X, Download, Search, AlertTriangle } from "lucide-react";
import { ITEM_CONDITIONS, INVENTORY_CATS, FURNITURE_CATS, LOW_STOCK_THRESHOLD } from "../constants";
import { storage, exportCSV } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { hasPermission } from "../permissions";
import { PrintButton } from "../components/Shared";

function InventorySystem({ emp, isAdmin }) {
  const canEdit = isAdmin || hasPermission(emp, "MANAGE_INVENTORY");
  const [items, setItemsState] = useState(() => storage.get("inventory_items", [
    {id:1, code:"2301280010", name:"مقاومة متغيرة", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2489"},
    {id:2, code:"2301243008", name:"مولد ذبذبات", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"JB21280"},
    {id:3, code:"2309443025", name:"جهاز معايرة مقياس الضغط", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2605079"},
    {id:4, code:"2309443011", name:"جهاز معايرة مقياس الضغط", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"12064"},
    {id:5, code:"2301373023", name:"جهاز مقياس متعدد الاغراض", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"22460049"},
    {id:6, code:"2301390031", name:"جهازقياس الضغط بالاوزان", category:"أجهزة قياس", qty:1, condition:"تالف", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"1B77"},
    {id:7, code:"2308513026", name:"جهاز معايرة الضغوط", category:"أجهزة معايرة", qty:1, condition:"يحتاج صيانة", location:"ورشة الصيانة", minQty:1, serialNo:"2414"},
    {id:8, code:"2301493004", name:"جهاز معايرة المزدوجات درجة الحرارة", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"B3-C511"},
    {id:9, code:"2301293019", name:"جهاز تمييز الحساسات الحرارية", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2645"},
    {id:10, code:"2335613000", name:"جهاز فحص الفولتيه", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"SS22344089"},
    {id:11, code:"2336263013", name:"جهاز كشف مسار القابولات", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"SS257676213"},
    {id:12, code:"2335070006", name:"جهاز راسم الذبذبات", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"RS-248-898"},
    {id:13, code:"2311183002", name:"كامرة تصوير حرارية", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"TL-12513120"},
    {id:14, code:"2503163065", name:"ايفو ميتر", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"263458"},
    {id:15, code:"", name:"ايفو ميتر", category:"أجهزة قياس", qty:1, condition:"يحتاج صيانة", location:"ورشة الصيانة", minQty:1, serialNo:"90410374"},
    {id:16, code:"2501035893", name:"كوسرة طيارية", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:17, code:"2505133097", name:"منكنة", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:18, code:"2505503033", name:"جهاز ضغط يدوي هوائي", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"13104"},
    {id:19, code:"2505503013", name:"جهاز ضغط يدوي هوائي", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"220828"},
    {id:20, code:"2507973015", name:"جهاز ضغط هايدروليك", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"17093"},
    {id:21, code:"2507973016", name:"جهاز ضغط هايدروليك", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"17077"},
    {id:22, code:"2509133009", name:"جهاز معايرة الحرارة", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"204822"},
    {id:23, code:"2503303018", name:"جهاز معايرة الحرارة", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2594143"},
    {id:24, code:"2503513013", name:"جهاز معايرة التيار الكهربائي الواطئ", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2029006"},
    {id:25, code:"2511233055", name:"كلاب ميتر", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"1400004"},
    {id:26, code:"2511090188", name:"ميتر", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"MEQ-2"},
    {id:27, code:"2504786015", name:"ضاغطة هواء", category:"معدات ميكانيكية", qty:1, condition:"يحتاج صيانة", location:"ورشة الصيانة", minQty:1},
    {id:28, code:"2505073613", name:"مقياس ضغط هايدروليك", category:"مقاييس ضغط", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"2605162"},
    {id:29, code:"2510593033", name:"جهاز قياس الحرارة", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"12157"},
    {id:30, code:"2503303032", name:"جهاز قياس الحرارة الدقيق", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"227-005"},
    {id:31, code:"", name:"دريل كهربائي", category:"عدد كهربائية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:32, code:"", name:"منفاخ هواء", category:"عدد كهربائية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:33, code:"2313973022", name:"ماكنة لحام", category:"عدد كهربائية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:34, code:"", name:"جهاز معايرة هايدروليك", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N117079,17092"},
    {id:35, code:"", name:"جهاز معايرة هوائي", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N2041104"},
    {id:36, code:"", name:"جهاز معايير الحرارة", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N2034224"},
    {id:37, code:"", name:"جهاز معايرة الحراري BL-7", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N2642"},
    {id:38, code:"", name:"جهاز معايرة ضغط بالاوزان", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N3164"},
    {id:39, code:"2624033", name:"جهاز متعدد الاغراض مع قياس الضغط", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"FLUKE726"},
    {id:40, code:"26242703", name:"جهاز متعدد الاغراض مع قياس الضغط", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"FLUKE700P27"},
    {id:41, code:"", name:"جهاز معايرة الضغط بالهواء", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"S.N13081"},
    {id:42, code:"5869856100", name:"VALVE SOLINOIED EXPROOF 3WA", category:"صمامات", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:43, code:"5899710065", name:"VALVE NEDEL", category:"صمامات", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:44, code:"5869892300", name:"VALVE SWITSHING", category:"صمامات", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:45, code:"5869996510", name:"VALVE CHAAK INODC250", category:"صمامات", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:46, code:"5869856050", name:"NEEDLE SOLINIED 1/2 TUPE", category:"صمامات", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:47, code:"5883202040", name:"NEEDLE VALVUE P-N215129", category:"صمامات", qty:4, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:48, code:"5889835125", name:"NEEDLE VALVUE P-N915370", category:"صمامات", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:49, code:"5863208250", name:"NEEDLE VALVUE 4F-V6LN-SS", category:"صمامات", qty:21, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:50, code:"00-036-3401", name:"FNPTV BOLL 1/2 NEEDEL", category:"صمامات", qty:7, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:51, code:"", name:"ايفيو ميتر", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"57440394"},
    {id:52, code:"", name:"FLUKE", category:"أجهزة قياس", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"9110016"},
    {id:53, code:"", name:"صمام ذاتي التفريق", category:"صمامات", qty:1, condition:"تالف", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:54, code:"", name:"قلم حديد", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:55, code:"", name:"عدة قلم حديد مختلفة", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:56, code:"", name:"كاغد جام", category:"مواد استهلاكية", qty:8, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:57, code:"", name:"فرشاة سيم", category:"مواد استهلاكية", qty:6, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:58, code:"", name:"شريط صمغ", category:"مواد استهلاكية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:59, code:"", name:"عدة غلقوز", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:60, code:"", name:"منكنة بوري", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:61, code:"", name:"منظم ضغط نيتروجين", category:"معدات ميكانيكية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:62, code:"", name:"برغي مختلف الاحجام", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:63, code:"", name:"تيب حراري", category:"مواد استهلاكية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:64, code:"", name:"درنفيس فحص", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:65, code:"", name:"لاوي مع مقص", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:66, code:"", name:"بكرة كيبل سيار", category:"معدات كهربائية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:67, code:"", name:"منشار كهربائي", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:68, code:"", name:"عدة اخراج بوري حديد", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:69, code:"", name:"واشر ربل داي فرام", category:"قطع غيار", qty:10, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:70, code:"", name:"ركريتر كبير", category:"عدد يدوية", qty:3, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:71, code:"", name:"بوري انبوب 6 متر", category:"معدات ميكانيكية", qty:20, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:72, code:"", name:"افيوميتر لون ازرق", category:"أجهزة قياس", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:73, code:"", name:"ريكوليتر لون اسود صغير", category:"قطع غيار", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:74, code:"", name:"كرنات", category:"عدد يدوية", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:75, code:"", name:"برشر سويج", category:"معدات ميكانيكية", qty:3, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:76, code:"", name:"سبانه حجم 55", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:77, code:"", name:"رافعة هايدروليك", category:"معدات ميكانيكية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:78, code:"", name:"حجر كوسرة", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:79, code:"", name:"ربت", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:80, code:"", name:"عدة النكي", category:"عدد يدوية", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:81, code:"", name:"عدة لغم", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:82, code:"", name:"عدة سباين مختلفة", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:83, code:"", name:"مبرد", category:"مواد استهلاكية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:84, code:"", name:"برينه مختلفة الحجم", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:85, code:"", name:"عدة درنفيس مختلفة الحجم", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:86, code:"", name:"تفلون", category:"مواد استهلاكية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:87, code:"", name:"كلوب صغير", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:88, code:"", name:"صولدر", category:"مواد استهلاكية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:89, code:"", name:"شريط ربط", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:90, code:"", name:"توصالة ترامل", category:"توصيلات", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:91, code:"", name:"تيغه", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:92, code:"", name:"واير لحيم", category:"مواد استهلاكية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:93, code:"", name:"فرش صبغ", category:"مواد استهلاكية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:94, code:"", name:"كابسة ربت", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:95, code:"", name:"مسدس صمغ", category:"عدد يدوية", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:96, code:"", name:"برينه صغيرة", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:97, code:"", name:"قلقوز", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:98, code:"", name:"كماشة", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:99, code:"", name:"عدة استخراج ربل", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:100, code:"", name:"منشار تيغه", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:101, code:"", name:"كماشة حجم كبير", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:102, code:"", name:"جاكوج", category:"عدد يدوية", qty:3, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:103, code:"", name:"كبان كبير", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:104, code:"", name:"كاوية لحيم", category:"عدد كهربائية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:105, code:"", name:"سكور سبانه كبير", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:106, code:"", name:"كندك كبير", category:"عدد يدوية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:107, code:"", name:"كيج 30 par", category:"مقاييس ضغط", qty:6, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"صغير"},
    {id:108, code:"", name:"كيج 60 psi", category:"مقاييس ضغط", qty:25, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"صغير"},
    {id:109, code:"", name:"كيج 30 psi", category:"مقاييس ضغط", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"صغير"},
    {id:110, code:"", name:"كيج kgf/cm 250", category:"مقاييس ضغط", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
    {id:111, code:"", name:"كيج 25kg/cm", category:"مقاييس ضغط", qty:8, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
    {id:112, code:"", name:"صمام 1/2 HGVS12NC", category:"صمامات", qty:14, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:113, code:"", name:"صمام مختلف الاستخدام", category:"صمامات", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير ذو 5 اتجاهات"},
    {id:114, code:"", name:"مقياس ضغط /برشر سويج", category:"مقاييس ضغط", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:115, code:"", name:"عكس مختلف الانواع والاستخدام حرفT", category:"توصيلات", qty:150, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:116, code:"", name:"عكس مختلف الانواع والاستخدام حرف  L", category:"توصيلات", qty:110, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:117, code:"", name:"نبله مختلف الاستخدام والاحجام", category:"عدد يدوية", qty:100, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:118, code:"", name:"50KG كيج", category:"مقاييس ضغط", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:119, code:"", name:"25 par كيج", category:"مقاييس ضغط", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"وسط"},
    {id:120, code:"", name:"مرسله ضغط", category:"عدد يدوية", qty:7, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:121, code:"", name:"مرسلة جريان", category:"مقاييس ضغط", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:122, code:"584-5002-529", name:"كيج 10 Kg", category:"مقاييس ضغط", qty:9, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
    {id:123, code:"", name:"16 kg كيج", category:"مقاييس ضغط", qty:10, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
    {id:124, code:"", name:"100 C كيج", category:"مقاييس ضغط", qty:2, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1, serialNo:"كبير"},
    {id:125, code:"", name:"PIC كارت", category:"قطع إلكترونية", qty:8, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:126, code:"", name:"لوحة اشارة", category:"قطع إلكترونية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:127, code:"", name:"مفتاح تشغيل", category:"قطع إلكترونية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:128, code:"", name:"ثرموستات متحسس حرارة  RTD", category:"قطع إلكترونية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:129, code:"", name:"بريس ضغط", category:"مقاييس ضغط", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:130, code:"", name:"رولة صبغ حجم صغير", category:"مواد استهلاكية", qty:1, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:131, code:"", name:"متحكم ضغط", category:"قطع إلكترونية", qty:3, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:132, code:"", name:"بايب سبانه قياس 8 انج", category:"عدد يدوية", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:133, code:"", name:"بايب سبانه قياس 10 انج", category:"عدد يدوية", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:134, code:"", name:"كندك قياس مختلف الاحجام", category:"عدد يدوية", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:135, code:"", name:"قاشطة متعددة", category:"عدد يدوية", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:136, code:"", name:"كابسة ترامل", category:"معدات كهربائية", qty:5, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1},
    {id:137, code:"0020261519", name:"عكس سبيل", category:"توصيلات", qty:12, condition:"جيد", location:"شعبة الآلات الدقيقة", minQty:1}
  ]));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"", minQty:3, serialNo:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const confirm = useConfirm();
  // أي تعديل يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const setItems = useCallback((updater) => {
    setItemsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      storage.set("inventory_items", next);
      FirebaseAPI.saveInventory(next);
      return next;
    });
  }, []);
  useEffect(() => {
    FirebaseAPI.loadInventory().then(list => {
      if (list) { setItemsState(list); storage.set("inventory_items", list); }
    });
  }, []);

  const categories = ["الكل", ...INVENTORY_CATS];
  const filtered = items.filter(i => (i.name.includes(search)||i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  const lowStock = items.filter(i => i.qty <= (i.minQty || LOW_STOCK_THRESHOLD));

  const deleteItem = async (id) => {
    if (!canEdit) return;
    if (await confirm("هل تريد حذف هذا الصنف؟", { danger: true, ok: "حذف", title: "حذف الصنف" }))
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const saveItem = () => {
    if (!canEdit) return;
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems(prev => [...prev, { ...form, id: Date.now() }]);
    else setItems(prev => prev.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false); showToast("✅ تم الحفظ");
  };

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-600 shrink-0"/><div><p className="text-xs font-bold text-amber-800">تنبيه مخزون منخفض ({lowStock.length} صنف)</p><p className="text-xs text-amber-700">{lowStock.map(i=>i.name).join(" • ")}</p></div></div>}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1"><div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(items.map(i=>({الرمز:i.code,الاسم:i.name,رقم_الصنع:i.serialNo||"",الفئة:i.category,الكمية:i.qty,الحالة:i.condition,الموقع:i.location})),"المخزون_شعبة_الآلات_الدقيقة")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
          {canEdit && <button onClick={()=>{setAdding(true);setForm({code:"",name:"",category:"أجهزة قياس",qty:1,condition:"جيد",location:"شعبة الآلات الدقيقة",minQty:3,serialNo:""});}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>}
          <PrintButton targetId="print-inventory" label="طباعة"/></div>
      </div>
      {canEdit && (adding||editId) && (<div className="card rounded-2xl border-2 border-blue-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة صنف":"تعديل صنف"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["الرمز الرمزي","code"],["الاسم *","name"],["رقم الصنع","serialNo"],["الكمية","qty"],["الحد الأدنى","minQty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>))}
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الفئة</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{INVENTORY_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
      <div id="print-inventory" className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-color"><th className="px-3 py-2">الرمز</th><th className="px-3 py-2">الاسم</th><th className="px-3 py-2">رقم الصنع</th><th className="px-3 py-2">الفئة</th><th className="px-3 py-2">الكمية</th><th className="px-3 py-2">الحالة</th><th className="px-3 py-2">الموقع</th><th className="px-3 py-2 no-print">إجراءات</th></tr></thead>
        <tbody>{filtered.map(it=>(<tr key={it.id} className={`border-b border-color ${it.qty<=(it.minQty||3)?"bg-amber-50/50":""}`}>
          <td className="px-3 py-2 font-mono text-[10px]">{it.code||"—"}</td><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2 font-mono text-[10px] text-secondary">{it.serialNo||"—"}</td><td className="px-3 py-2">{it.category}</td>
          <td className="px-3 py-2 font-bold">{it.qty} {it.qty<=(it.minQty||3)&&<span className="text-amber-500">⚠️</span>}</td>
          <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":it.condition==="تالف"||it.condition==="تم الشطب"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
          <td className="px-3 py-2 text-[10px]">{it.location}</td>
          <td className="px-3 py-2 no-print">{canEdit && <div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div>}</td></tr>))}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد الأثاث ==========
function FurnitureInventory({ emp, isAdmin }) {
  const canEdit = isAdmin || hasPermission(emp, "MANAGE_INVENTORY");
  const [items, setItemsState] = useState(() => storage.get("furniture_items", [
    // ═══ أجهزة تكييف وتبريد ═══
    {id:1,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:2,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:3,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:4,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:5,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:6,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:7,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تالف",        location:"المخزن"},
    {id:8,  code:"لا يوجد",      name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"تالف",        location:"المخزن"},
    {id:9,  code:"1504688400",   name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:10, code:"1504688401",   name:"سبلت 2 طن LG",                 category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:11, code:"1523114957",   name:"مروحة عمودية",                  category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:12, code:"1523114958",   name:"مروحة عمودية",                  category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:13, code:"1515674402",   name:"ثلاجة عمودية فستل 16 قدم",     category:"أجهزة منزلية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    // ═══ أثاث مكتبي - منضدات ═══
    {id:14, code:"1402228079",   name:"منضدة كتابة 160 م",             category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:15, code:"1402228080",   name:"منضدة كتابة 160 م",             category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:16, code:"1402035187",   name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:17, code:"1402035188",   name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:18, code:"1402035189",   name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:19, code:"1402035190",   name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:20, code:"1402024339",   name:"كرسي دوار جلد",                 category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:21, code:"1402024340",   name:"كرسي دوار جلد",                 category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:22, code:"1402214928",   name:"مكتبة خشب",                    category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:23, code:"1402214929",   name:"مكتبة خشب",                    category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:24, code:"1402284803",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:25, code:"لا يوجد",      name:"سرير منام",                     category:"أثاث مكتبي",     qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:26, code:"لا يوجد",      name:"كرسي مداولة",                   category:"أثاث مكتبي",     qty:3, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:27, code:"لا يوجد",      name:"كرسي دوار جلد",                 category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    // ═══ أجهزة حاسوب ومعدات مكتبية ═══
    {id:28, code:"",             name:"حاسبة HP",                      category:"أجهزة حاسوب",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:29, code:"1901114388",   name:"طابعة كانون",                   category:"معدات مكتبية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    // ═══ أجهزة تكييف إضافية ═══
    {id:30, code:"لا يوجد",      name:"مكيف هواء كرافت 1.5 طن",        category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:31, code:"1513674126",   name:"ثلاجة فستل 9 قدم",              category:"أجهزة منزلية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:32, code:"1403114492",   name:"مكنسة كهربائية",                category:"معدات مكتبية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:33, code:"لا يوجد",      name:"مدفأة زيتية",                   category:"أجهزة منزلية",   qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:34, code:"لا يوجد",      name:"سخان ماء",                      category:"أجهزة منزلية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:35, code:"1403014212",   name:"طباخ كهربائي",                  category:"أجهزة منزلية",   qty:1, condition:"تالف",        location:"المخزن"},
    {id:36, code:"1403024031",   name:"فرن كهربائي",                   category:"أجهزة منزلية",   qty:1, condition:"تالف",        location:"المخزن"},
    // ═══ منضدات ومزيد من الأثاث ═══
    {id:37, code:"1402139368",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:38, code:"1402139370",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:39, code:"1402139371",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:40, code:"1402139372",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:41, code:"1402139369",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"تم الشطب",    location:"السيطرة والنظم شعبة الفاو"},
    {id:42, code:"1402123785",   name:"منضدة كتابة خشب",               category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:43, code:"1402123786",   name:"منضدة كتابة خشب",               category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:44, code:"1402208897",   name:"مكتبة بابين",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:45, code:"1402208898",   name:"مكتبة بابين",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:46, code:"14022149284929",name:"مكتبة بابين",                  category:"أثاث مكتبي",     qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:47, code:"1402203092",   name:"مكتبة بابين",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:48, code:"1402208899",   name:"مكتبة بابين",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:49, code:"1402225456",   name:"منضدة كتابة مع ملحق",            category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:50, code:"1402225457",   name:"منضدة كتابة مع ملحق",            category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:51, code:"1401644198",   name:"كرسي بلاستك",                   category:"أثاث مكتبي",     qty:13,condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:52, code:"1504443042",   name:"سبلت 4 طن LG",                  category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:53, code:"1402198907",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:54, code:"1402198908",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:55, code:"1402198909",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:56, code:"1402194054",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:57, code:"1522042001",   name:"براد ماء",                      category:"أجهزة منزلية",   qty:1, condition:"تالف",        location:"المخزن"},
    {id:58, code:"1402113052",   name:"منضدة عمل",                     category:"أثاث مكتبي",     qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:59, code:"05K130042835", name:"مروحة عمودية",                  category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:60, code:"1401263016",   name:"شمعة ملابس",                    category:"أثاث مكتبي",     qty:4, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:61, code:"1402193333",   name:"دولاب حديد",                    category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:62, code:"1402033212",   name:"كرسي ذو مسند",                  category:"أثاث مكتبي",     qty:6, condition:"تالف",        location:"السيطرة والنظم شعبة الفاو"},
    {id:63, code:"1402033212",   name:"كرسي ذو مسند",                  category:"أثاث مكتبي",     qty:6, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:64, code:"1402133738",   name:"منضدة كتابة خشب",               category:"أثاث مكتبي",     qty:1, condition:"تالف",        location:"المخزن"},
    {id:65, code:"1402134055",   name:"منضدة كتابة",                   category:"أثاث مكتبي",     qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
  ]));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const confirm = useConfirm();
  // أي تعديل يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const setItems = useCallback((updater) => {
    setItemsState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      storage.set("furniture_items", next);
      FirebaseAPI.saveFurniture(next);
      return next;
    });
  }, []);
  useEffect(() => {
    FirebaseAPI.loadFurniture().then(list => {
      if (list) { setItemsState(list); storage.set("furniture_items", list); }
    });
  }, []);

  const deleteItem = async (id) => {
    if (!canEdit) return;
    if (await confirm("هل تريد حذف هذا الصنف؟", { danger: true, ok: "حذف", title: "حذف الصنف" }))
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const categories = ["الكل", ...FURNITURE_CATS];
  const filtered = items.filter(i => (i.name.includes(search)||i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));

  const saveItem = () => {
    if (!canEdit) return;
    if (!form.code || !form.name) return showToast("الرمز والاسم مطلوبان");
    if (adding) setItems(prev => [...prev, { ...form, id: Date.now() }]);
    else setItems(prev => prev.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false); showToast("✅ تم الحفظ");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1"><div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="flex gap-2">
          <button onClick={()=>exportCSV(items.map(i=>({الرمز:i.code,الاسم:i.name,الفئة:i.category,الكمية:i.qty,الحالة:i.condition,الموقع:i.location})),"الأثاث")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
          {canEdit && <button onClick={()=>{setAdding(true);setForm({code:"",name:"",category:"أثاث مكتبي",qty:1,condition:"جيد",location:""});}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>}
          <PrintButton targetId="print-furniture" label="طباعة"/></div>
      </div>
      {canEdit && (adding||editId) && (<div className="card rounded-2xl border-2 border-violet-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة قطعة":"تعديل قطعة"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["الرمز *","code"],["الاسم *","name"],["الكمية","qty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>))}
          <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div></div>
        <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
      <div id="print-furniture" className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-color"><th className="px-3 py-2">الرمز</th><th className="px-3 py-2">الاسم</th><th className="px-3 py-2">الفئة</th><th className="px-3 py-2">الكمية</th><th className="px-3 py-2">الحالة</th><th className="px-3 py-2">الموقع</th><th className="px-3 py-2 no-print">إجراءات</th></tr></thead>
        <tbody>{filtered.map(it=>(<tr key={it.id} className="border-b border-color"><td className="px-3 py-2 font-mono">{it.code}</td><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2">{it.category}</td><td className="px-3 py-2 font-bold">{it.qty}</td>
          <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
          <td className="px-3 py-2">{it.location}</td><td className="px-3 py-2 no-print">{canEdit && <div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div>}</td></tr>))}</tbody></table></div></div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== إدارة الموظفين (المحسّنة) ==========


export default InventorySystem;
export { FurnitureInventory };
