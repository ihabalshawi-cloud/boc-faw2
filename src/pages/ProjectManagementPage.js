import React, { useState, useEffect, useRef, useMemo } from "react";
import { Save, FileText, Clock, Calendar, Plus, Trash2, Edit3, X, Users, Download,
  Briefcase, Layers, Activity, Flag, FolderOpen, FileCheck, DollarSign, Target } from "lucide-react";
import { GDRIVE_WARN_PCT, GDRIVE_CRIT_PCT } from "../constants";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { useGDrive } from "../gdrive";

const PROJ_STATUSES = ["قيد التنفيذ","مكتمل","متوقف","قيد التخطيط"];
const PROJ_PRIORITIES = ["عالي","متوسط","منخفض"];
const PHASE_STATUSES = ["مكتملة","قيد التنفيذ","لم تبدأ","متأخرة"];
const INSP_RESULTS = ["ناجح","فاشل","يحتاج متابعة"];
const DOC_TYPES = ["وثيقة هندسية","عقد","تقرير","خطة","رسم","أخرى"];
const PROJ_STATUS_COLORS = {"قيد التنفيذ":"bg-blue-100 text-blue-700","مكتمل":"bg-emerald-100 text-emerald-700","متوقف":"bg-red-100 text-red-700","قيد التخطيط":"bg-amber-100 text-amber-700"};
const PHASE_STATUS_COLORS = {"مكتملة":"bg-emerald-100 text-emerald-700","قيد التنفيذ":"bg-blue-100 text-blue-700","لم تبدأ":"bg-gray-100 text-gray-600","متأخرة":"bg-red-100 text-red-700"};
const INSP_RESULT_COLORS = {"ناجح":"bg-emerald-100 text-emerald-700","فاشل":"bg-red-100 text-red-700","يحتاج متابعة":"bg-amber-100 text-amber-700"};
const PRIORITY_COLORS = {"عالي":"bg-red-100 text-red-700","متوسط":"bg-amber-100 text-amber-700","منخفض":"bg-emerald-100 text-emerald-700"};

const INITIAL_PROJECTS = [
  {
    id:"P001", name:"توسعة خط الأنابيب الرئيسي",
    status:"قيد التنفيذ", priority:"عالي", progress:58,
    budget:850000, spent:493000,
    startDate:"2025-01-15", endDate:"2025-12-31",
    manager:"م. أحمد الربيعي",
    desc:"مشروع توسعة خط الأنابيب الرئيسي بطول 45 كيلومتر لزيادة طاقة النقل إلى 200,000 برميل يومياً",
    team:["م. أحمد الربيعي","م. سهاد المالكي","م. كريم جاسم","فني. علي حسن"],
    phases:[
      {id:"PH01",name:"المسح والتصميم",progress:100,status:"مكتملة",startDate:"2025-01-15",endDate:"2025-02-28",responsible:"م. سهاد المالكي"},
      {id:"PH02",name:"الحفر وتمهيد المسار",progress:100,status:"مكتملة",startDate:"2025-03-01",endDate:"2025-04-30",responsible:"م. كريم جاسم"},
      {id:"PH03",name:"تركيب الأنابيب",progress:75,status:"قيد التنفيذ",startDate:"2025-05-01",endDate:"2025-09-30",responsible:"م. أحمد الربيعي"},
      {id:"PH04",name:"الاختبار والتشغيل",progress:0,status:"لم تبدأ",startDate:"2025-10-01",endDate:"2025-11-30",responsible:"م. أحمد الربيعي"},
      {id:"PH05",name:"التسليم والتوثيق",progress:0,status:"لم تبدأ",startDate:"2025-12-01",endDate:"2025-12-31",responsible:"م. سهاد المالكي"},
    ],
    reports:[
      {id:"R001",date:"2025-06-10",author:"م. أحمد الربيعي",work:"تركيب 2.3 كم من الأنابيب قطر 18 بوصة في القسم C",issues:"لا توجد",progress:58},
      {id:"R002",date:"2025-06-11",author:"فني. علي حسن",work:"لحام الوصلات وإجراء اختبار الضغط للقسم C-12",issues:"تأخر تسليم المواد اللاصقة",progress:59},
    ],
    docs:[
      {id:"D001",name:"مخطط الأنابيب الهندسي P&ID",type:"وثيقة هندسية",date:"2025-01-20",size:"4.2 MB",uploadedBy:"م. سهاد المالكي"},
      {id:"D002",name:"عقد مقاولة الحفر",type:"عقد",date:"2025-02-10",size:"1.1 MB",uploadedBy:"إدارة العقود"},
    ],
    inspections:[
      {id:"I001",date:"2025-04-15",inspector:"م. كريم جاسم",section:"قسم A — المرحلة 2",result:"ناجح",notes:"اجتاز اختبار الضغط بنجاح"},
      {id:"I002",date:"2025-05-20",inspector:"م. أحمد الربيعي",section:"قسم B — الوصلات",result:"يحتاج متابعة",notes:"تسرب طفيف في الوصلة B-07، تم الإصلاح"},
    ],
  },
  {
    id:"P002", name:"تحديث نظام السيطرة SCADA",
    status:"قيد التنفيذ", priority:"عالي", progress:42,
    budget:320000, spent:134400,
    startDate:"2025-03-01", endDate:"2025-10-31",
    manager:"م. إيهاب الشاوي",
    desc:"تحديث شامل لنظام السيطرة والرقابة SCADA في محطة الضخ الرئيسية وإضافة نقاط رقابة جديدة",
    team:["م. إيهاب الشاوي","م. زينب العامري","تقني. حسين البصري","مبرمج. رامي الجبوري"],
    phases:[
      {id:"PH01",name:"تحليل النظام الحالي",progress:100,status:"مكتملة",startDate:"2025-03-01",endDate:"2025-03-31",responsible:"م. زينب العامري"},
      {id:"PH02",name:"تصميم البنية التحتية",progress:100,status:"مكتملة",startDate:"2025-04-01",endDate:"2025-04-30",responsible:"م. إيهاب الشاوي"},
      {id:"PH03",name:"تركيب الأجهزة",progress:60,status:"قيد التنفيذ",startDate:"2025-05-01",endDate:"2025-07-31",responsible:"تقني. حسين البصري"},
      {id:"PH04",name:"برمجة وإعداد النظام",progress:20,status:"قيد التنفيذ",startDate:"2025-06-01",endDate:"2025-08-31",responsible:"مبرمج. رامي الجبوري"},
      {id:"PH05",name:"الاختبار والتدريب",progress:0,status:"لم تبدأ",startDate:"2025-09-01",endDate:"2025-10-31",responsible:"م. إيهاب الشاوي"},
    ],
    reports:[
      {id:"R001",date:"2025-06-09",author:"تقني. حسين البصري",work:"تركيب وحدات RTU في مواقع 5 و6 و7",issues:"لا توجد",progress:42},
    ],
    docs:[
      {id:"D001",name:"مواصفات SCADA الجديدة",type:"وثيقة هندسية",date:"2025-03-15",size:"2.8 MB",uploadedBy:"م. إيهاب الشاوي"},
    ],
    inspections:[
      {id:"I001",date:"2025-05-10",inspector:"م. إيهاب الشاوي",section:"غرفة التحكم الرئيسية",result:"ناجح",notes:"جميع الأسلاك حسب المواصفات"},
    ],
  },
  {
    id:"P003", name:"صيانة وتأهيل الخزانات الكبرى",
    status:"مكتمل", priority:"متوسط", progress:100,
    budget:560000, spent:547000,
    startDate:"2024-09-01", endDate:"2025-03-31",
    manager:"م. سلوى الكريمي",
    desc:"صيانة شاملة وتأهيل لثمانية خزانات تخزين كبرى سعة 500,000 برميل لكل منها",
    team:["م. سلوى الكريمي","م. عمر العبيدي","فني. ياسر محمود","فني. هيثم رضا"],
    phases:[
      {id:"PH01",name:"التفريغ والتنظيف",progress:100,status:"مكتملة",startDate:"2024-09-01",endDate:"2024-10-15",responsible:"فني. ياسر محمود"},
      {id:"PH02",name:"الفحص والتقييم",progress:100,status:"مكتملة",startDate:"2024-10-16",endDate:"2024-11-30",responsible:"م. عمر العبيدي"},
      {id:"PH03",name:"أعمال الصيانة والإصلاح",progress:100,status:"مكتملة",startDate:"2024-12-01",endDate:"2025-02-28",responsible:"م. سلوى الكريمي"},
      {id:"PH04",name:"الطلاء والحماية من التآكل",progress:100,status:"مكتملة",startDate:"2025-01-15",endDate:"2025-03-15",responsible:"فني. هيثم رضا"},
      {id:"PH05",name:"الاختبار والإعادة للخدمة",progress:100,status:"مكتملة",startDate:"2025-03-16",endDate:"2025-03-31",responsible:"م. سلوى الكريمي"},
    ],
    reports:[
      {id:"R001",date:"2025-03-30",author:"م. سلوى الكريمي",work:"إعادة الخزانات 1-4 للخدمة بنجاح",issues:"لا توجد",progress:100},
      {id:"R002",date:"2025-03-31",author:"م. عمر العبيدي",work:"إعادة الخزانات 5-8 للخدمة وإغلاق المشروع",issues:"لا توجد",progress:100},
    ],
    docs:[
      {id:"D001",name:"تقرير الفحص الشامل النهائي",type:"تقرير",date:"2025-04-01",size:"6.5 MB",uploadedBy:"م. سلوى الكريمي"},
      {id:"D002",name:"شهادة إتمام المشروع",type:"وثيقة هندسية",date:"2025-04-05",size:"0.8 MB",uploadedBy:"إدارة المشاريع"},
    ],
    inspections:[
      {id:"I001",date:"2025-03-25",inspector:"م. سلوى الكريمي",section:"الخزانات 1-8",result:"ناجح",notes:"جميع الخزانات اجتازت اختبار الإحكام"},
      {id:"I002",date:"2025-03-31",inspector:"م. عمر العبيدي",section:"منظومة الصمامات",result:"ناجح",notes:"الصمامات تعمل ضمن المواصفات"},
    ],
  },
];

// ========== مكوّن حلقة التقدم ==========
function ProgressRing({ pct, size=90, stroke=9, color="#3b82f6" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 0.5s ease"}}/>
    </svg>
  );
}

// ========== صفحة إدارة المشاريع ==========
function ProjectManagementPage({ emp }) {
  const [projects, setProjects] = useState(() => storage.get("pm_projects", INITIAL_PROJECTS));
  const [selId, setSelId] = useState(() => storage.get("pm_projects", INITIAL_PROJECTS)[0]?.id || null);
  const [tab, setTab] = useState("dashboard");
  const [showAddProj, setShowAddProj] = useState(false);
  const addToast = useToast();
  const confirm = useConfirm();

  // أي تعديل على المشاريع يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const saveAll = (updated) => {
    setProjects(updated);
    storage.set("pm_projects", updated);
    FirebaseAPI.saveProjects(updated);
  };
  useEffect(() => {
    FirebaseAPI.loadProjects().then(list => {
      if (list) {
        setProjects(list);
        storage.set("pm_projects", list);
        setSelId(prev => list.some(p => p.id === prev) ? prev : (list[0]?.id || null));
      }
    });
  }, []);

  const proj = projects.find(p => p.id === selId);

  const updateProj = (id, changes) => saveAll(projects.map(p => p.id === id ? { ...p, ...changes } : p));

  const deleteProj = async (id) => {
    if (await confirm("هل تريد حذف هذا المشروع نهائياً؟", { title: "حذف المشروع", ok: "حذف" })) {
      const updated = projects.filter(p => p.id !== id);
      saveAll(updated);
      setSelId(updated[0]?.id || null);
      addToast("تم حذف المشروع", "info");
    }
  };

  // ── CRUD Phases ──
  const addPhase = (pid, ph) => updateProj(pid, { phases: [...(proj.phases||[]), { ...ph, id: `PH${Date.now()}` }] });
  const editPhase = (pid, phId, changes) => updateProj(pid, { phases: proj.phases.map(ph => ph.id === phId ? { ...ph, ...changes } : ph) });
  const delPhase = (pid, phId) => updateProj(pid, { phases: proj.phases.filter(ph => ph.id !== phId) });

  // ── CRUD Reports ──
  const addReport = (pid, r) => updateProj(pid, { reports: [...(proj.reports||[]), { ...r, id: `R${Date.now()}` }] });
  const delReport = (pid, rId) => updateProj(pid, { reports: proj.reports.filter(r => r.id !== rId) });

  // ── CRUD Docs ──
  const addDoc = (pid, d) => updateProj(pid, { docs: [...(proj.docs||[]), { ...d, id: `D${Date.now()}` }] });
  const delDoc = (pid, dId) => updateProj(pid, { docs: proj.docs.filter(d => d.id !== dId) });

  // ── CRUD Inspections ──
  const addInsp = (pid, insp) => updateProj(pid, { inspections: [...(proj.inspections||[]), { ...insp, id: `I${Date.now()}` }] });
  const delInsp = (pid, inspId) => updateProj(pid, { inspections: proj.inspections.filter(i => i.id !== inspId) });

  const tabs = [
    { id:"dashboard", label:"لوحة التحكم", icon:<Activity size={15}/> },
    { id:"phases",    label:"تقدم العمل",   icon:<Layers size={15}/> },
    { id:"reports",   label:"التقارير اليومية", icon:<FileText size={15}/> },
    { id:"docs",      label:"الوثائق",       icon:<FolderOpen size={15}/> },
    { id:"inspections",label:"الفحوصات",    icon:<FileCheck size={15}/> },
  ];

  const daysLeft = proj ? Math.ceil((new Date(proj.endDate) - new Date()) / 86400000) : 0;
  const budgetPct = proj ? Math.round((proj.spent / proj.budget) * 100) : 0;

  return (
    <div className="flex gap-0" dir="rtl" style={{minHeight:"calc(100vh - 140px)"}}>
      {/* ── Sidebar: project list ── */}
      <aside className="w-64 flex-shrink-0 border-l border-color overflow-y-auto pb-6" style={{background:"var(--sidebar-bg,inherit)"}}>
        <div className="p-3 border-b border-color flex items-center justify-between">
          <span className="font-bold text-sm flex items-center gap-1.5"><Briefcase size={15}/> المشاريع</span>
          <button onClick={()=>setShowAddProj(true)} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors" title="مشروع جديد"><Plus size={14}/></button>
        </div>
        <div className="divide-y divide-color">
          {projects.map(p => (
            <button key={p.id} onClick={()=>{ setSelId(p.id); setTab("dashboard"); }}
              className={`w-full text-right px-3 py-3 transition-colors ${selId===p.id?"bg-blue-600 text-white":"hover:bg-hover text-primary"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold truncate max-w-[130px]">{p.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${selId===p.id?"bg-white/20 text-white":PROJ_STATUS_COLORS[p.status]}`}>{p.status}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${selId===p.id?"bg-white/30":"bg-gray-200"}`}>
                  <div className={`h-full rounded-full transition-all ${selId===p.id?"bg-white":"bg-blue-500"}`} style={{width:`${p.progress}%`}}/>
                </div>
                <span className="text-[10px] font-bold shrink-0">{p.progress}%</span>
              </div>
              <p className={`text-[10px] mt-0.5 ${selId===p.id?"text-white/70":"text-secondary"}`}>{p.id} · {p.manager?.split(" ").slice(-1)[0]}</p>
            </button>
          ))}
        </div>
        {projects.length === 0 && <p className="text-xs text-secondary text-center py-8">لا توجد مشاريع</p>}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-auto p-5">
        {!proj ? (
          <div className="text-center py-20 text-secondary">
            <Briefcase size={48} className="mx-auto mb-3 opacity-30"/>
            <p className="font-bold">اختر مشروعاً أو أضف مشروعاً جديداً</p>
          </div>
        ) : (
          <>
            {/* Project header */}
            <div className="card rounded-2xl border border-color p-4 mb-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-lg font-bold">{proj.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${PROJ_STATUS_COLORS[proj.status]}`}>{proj.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${PRIORITY_COLORS[proj.priority]}`}>{proj.priority} الأولوية</span>
                  </div>
                  <p className="text-sm text-secondary mb-2">{proj.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-secondary flex-wrap">
                    <span className="flex items-center gap-1"><Briefcase size={12}/> {proj.manager}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {proj.startDate} — {proj.endDate}</span>
                    <span className="flex items-center gap-1"><Users size={12}/> {proj.team?.length || 0} أعضاء</span>
                    <span className="flex items-center gap-1"><Flag size={12}/> {proj.id}</span>
                  </div>
                </div>
                <button onClick={()=>deleteProj(proj.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="حذف المشروع"><Trash2 size={16}/></button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {tabs.map(t => (
                <button key={t.id} onClick={()=>setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${tab===t.id?"bg-blue-600 text-white":"btn-secondary border border-color"}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* ═══ لوحة التحكم ═══ */}
            {tab === "dashboard" && (
              <div className="space-y-4">
                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label:"نسبة الإنجاز", value:`${proj.progress}%`, icon:<Target size={20}/>, color:"from-blue-500 to-blue-600",
                      extra: <ProgressRing pct={proj.progress} size={48} stroke={6} color="#fff"/> },
                    { label:"الميزانية المنصرفة", value:`${budgetPct}%`, sub:`${proj.spent?.toLocaleString()} / ${proj.budget?.toLocaleString()} $`,
                      icon:<DollarSign size={20}/>, color:"from-emerald-500 to-emerald-600" },
                    { label:"الأيام المتبقية", value:daysLeft > 0 ? daysLeft : "منتهي", sub:daysLeft > 0 ? `ينتهي ${proj.endDate}` : "انتهى المشروع",
                      icon:<Clock size={20}/>, color:daysLeft<30?"from-red-500 to-red-600":daysLeft<90?"from-amber-500 to-amber-600":"from-teal-500 to-teal-600" },
                    { label:"أعضاء الفريق", value:proj.team?.length || 0, sub:"عضو في الفريق",
                      icon:<Users size={20}/>, color:"from-violet-500 to-violet-600" },
                  ].map((k,i) => (
                    <div key={i} className={`bg-gradient-to-r ${k.color} rounded-2xl p-4 text-white`}>
                      <div className="flex items-center justify-between mb-2">
                        {k.extra || k.icon}
                        <p className="text-2xl font-bold">{k.value}</p>
                      </div>
                      <p className="text-sm font-bold">{k.label}</p>
                      {k.sub && <p className="text-[11px] text-white/75 mt-0.5">{k.sub}</p>}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Overall progress ring */}
                  <div className="card rounded-2xl border border-color p-5">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><Activity size={15}/> نظرة عامة على الإنجاز</h3>
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <ProgressRing pct={proj.progress} size={100} stroke={10} color={proj.progress===100?"#10b981":"#3b82f6"}/>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{proj.progress}%</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {(proj.phases || []).map(ph => (
                          <div key={ph.id}>
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="truncate max-w-[140px]">{ph.name}</span>
                              <span className="font-bold">{ph.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${ph.status==="مكتملة"?"bg-emerald-500":ph.status==="قيد التنفيذ"?"bg-blue-500":ph.status==="متأخرة"?"bg-red-500":"bg-gray-300"}`}
                                style={{width:`${ph.progress}%`}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Team members */}
                  <div className="card rounded-2xl border border-color p-5">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><Users size={15}/> فريق العمل</h3>
                    <div className="space-y-2">
                      {(proj.team || []).map((member, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5 border-b border-color last:border-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500"][i%5]}`}>
                            {member.split(" ").slice(-1)[0][0]}
                          </div>
                          <span className="text-sm flex-1">{member}</span>
                          {i === 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">مدير</span>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <ProjTeamAdd proj={proj} updateProj={updateProj}/>
                    </div>
                  </div>
                </div>

                {/* Budget breakdown */}
                <div className="card rounded-2xl border border-color p-5">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5"><DollarSign size={15}/> الميزانية والإنفاق</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label:"الميزانية الإجمالية", value:`${proj.budget?.toLocaleString()} $`, color:"text-primary" },
                      { label:"المصروف حتى الآن", value:`${proj.spent?.toLocaleString()} $`, color:"text-rose-600" },
                      { label:"المتبقي", value:`${(proj.budget-proj.spent)?.toLocaleString()} $`, color:"text-emerald-600" },
                    ].map((b,i) => (
                      <div key={i} className="text-center p-3 bg-hover rounded-xl">
                        <p className={`text-lg font-bold ${b.color}`}>{b.value}</p>
                        <p className="text-xs text-secondary mt-0.5">{b.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${budgetPct>90?"bg-red-500":budgetPct>70?"bg-amber-500":"bg-emerald-500"}`}
                      style={{width:`${Math.min(100,budgetPct)}%`}}/>
                  </div>
                  <div className="flex justify-between text-xs text-secondary mt-1">
                    <span>0%</span><span className="font-bold">{budgetPct}% مصروف</span><span>100%</span>
                  </div>
                </div>

                {/* Edit project info */}
                <ProjInfoEditor proj={proj} updateProj={updateProj}/>
              </div>
            )}

            {/* ═══ تقدم العمل ═══ */}
            {tab === "phases" && (
              <PhasesTab proj={proj} addPhase={addPhase} editPhase={editPhase} delPhase={delPhase}/>
            )}

            {/* ═══ التقارير اليومية ═══ */}
            {tab === "reports" && (
              <ReportsTab proj={proj} addReport={addReport} delReport={delReport} emp={emp}/>
            )}

            {/* ═══ الوثائق ═══ */}
            {tab === "docs" && (
              <DocsTab proj={proj} addDoc={addDoc} delDoc={delDoc} emp={emp}/>
            )}

            {/* ═══ الفحوصات ═══ */}
            {tab === "inspections" && (
              <InspectionsTab proj={proj} addInsp={addInsp} delInsp={delInsp} emp={emp}/>
            )}
          </>
        )}
      </div>

      {/* ── Add Project Modal ── */}
      {showAddProj && (
        <AddProjectModal
          onClose={()=>setShowAddProj(false)}
          onAdd={(p)=>{ const updated=[...projects,p]; saveAll(updated); setSelId(p.id); setTab("dashboard"); setShowAddProj(false); addToast("تم إضافة المشروع","success"); }}
          existingIds={projects.map(p=>p.id)}
        />
      )}
    </div>
  );
}

// ── مكوّن تعديل معلومات المشروع ──
function ProjInfoEditor({ proj, updateProj }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name:proj.name, status:proj.status, priority:proj.priority, manager:proj.manager, budget:proj.budget, spent:proj.spent, progress:proj.progress, startDate:proj.startDate, endDate:proj.endDate, desc:proj.desc });
  const addToast = useToast();
  if (!open) return (
    <button onClick={()=>setOpen(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
      <Edit3 size={14}/> تعديل معلومات المشروع
    </button>
  );
  const save = () => { updateProj(proj.id, form); setOpen(false); addToast("تم حفظ التعديلات","success"); };
  return (
    <div className="card rounded-2xl border border-color p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-1.5"><Edit3 size={15}/> تعديل معلومات المشروع</h3>
        <button onClick={()=>setOpen(false)} className="text-secondary hover:text-red-500"><X size={16}/></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label className="block text-xs font-bold text-secondary mb-1">اسم المشروع</label>
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">مدير المشروع</label>
          <input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الحالة</label>
          <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
            {PROJ_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الأولوية</label>
          <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
            {PROJ_PRIORITIES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">نسبة الإنجاز %</label>
          <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">الميزانية ($)</label>
          <input type="number" value={form.budget} onChange={e=>setForm({...form,budget:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">المصروف ($)</label>
          <input type="number" value={form.spent} onChange={e=>setForm({...form,spent:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ البداية</label>
          <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الانتهاء</label>
          <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
        <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">وصف المشروع</label>
          <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none"/></div>
      </div>
      <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
        <button onClick={()=>setOpen(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ</button>
      </div>
    </div>
  );
}

// ── مكوّن إضافة عضو للفريق ──
function ProjTeamAdd({ proj, updateProj }) {
  const [val, setVal] = useState("");
  const addToast = useToast();
  const add = () => {
    if (!val.trim()) return;
    updateProj(proj.id, { team: [...(proj.team||[]), val.trim()] });
    setVal(""); addToast("تمت إضافة العضو","success");
  };
  return (
    <div className="flex gap-2">
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
        placeholder="اسم العضو الجديد" className="input flex-1 rounded-lg px-3 py-1.5 text-sm"/>
      <button onClick={add} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><Plus size={14}/></button>
    </div>
  );
}

// ── تبويب تقدم العمل (المراحل) ──
function PhasesTab({ proj, addPhase, editPhase, delPhase }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:"", status:"لم تبدأ", progress:0, startDate:"", endDate:"", responsible:"" });
  const addToast = useToast();
  const confirm = useConfirm();

  const resetForm = () => setForm({ name:"", status:"لم تبدأ", progress:0, startDate:"", endDate:"", responsible:"" });

  const submitAdd = () => {
    if (!form.name.trim()) return;
    addPhase(proj.id, form); resetForm(); setShowAdd(false); addToast("تمت إضافة المرحلة","success");
  };
  const submitEdit = () => {
    if (!form.name.trim()) return;
    editPhase(proj.id, editId, form); setEditId(null); addToast("تم حفظ التعديل","success");
  };
  const startEdit = (ph) => { setEditId(ph.id); setForm({ name:ph.name, status:ph.status, progress:ph.progress, startDate:ph.startDate, endDate:ph.endDate, responsible:ph.responsible }); setShowAdd(false); };
  const doDelete = async (phId) => {
    if (await confirm("حذف هذه المرحلة؟", { title:"حذف المرحلة", ok:"حذف" })) { delPhase(proj.id, phId); addToast("تم الحذف","info"); }
  };

  const FormRow = ({ label, children }) => (
    <div><label className="block text-xs font-bold text-secondary mb-1">{label}</label>{children}</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><Layers size={16}/> مراحل المشروع</h3>
        <button onClick={()=>{ setShowAdd(!showAdd); setEditId(null); resetForm(); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> مرحلة جديدة
        </button>
      </div>

      {(showAdd || editId) && (
        <div className="card rounded-2xl border border-color p-4">
          <h4 className="font-bold text-sm mb-3">{editId ? "تعديل المرحلة" : "مرحلة جديدة"}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow label="اسم المرحلة">
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: تركيب الأنابيب"/>
            </FormRow>
            <FormRow label="المسؤول">
              <input value={form.responsible} onChange={e=>setForm({...form,responsible:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم المسؤول"/>
            </FormRow>
            <FormRow label="الحالة">
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {PHASE_STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </FormRow>
            <FormRow label="نسبة الإنجاز %">
              <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
            </FormRow>
            <FormRow label="تاريخ البدء">
              <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
            </FormRow>
            <FormRow label="تاريخ الانتهاء">
              <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/>
            </FormRow>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={()=>{ setShowAdd(false); setEditId(null); }} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={editId ? submitEdit : submitAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> {editId?"حفظ":"إضافة"}</button>
          </div>
        </div>
      )}

      {(proj.phases||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><Layers size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد مراحل بعد</p></div>
      )}

      <div className="space-y-3">
        {(proj.phases||[]).map(ph => (
          <div key={ph.id} className={`card rounded-xl border p-4 transition-all ${editId===ph.id?"border-blue-400":"border-color"}`}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{ph.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${PHASE_STATUS_COLORS[ph.status]}`}>{ph.status}</span>
                </div>
                <div className="text-xs text-secondary mt-0.5">{ph.responsible} · {ph.startDate} — {ph.endDate}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>startEdit(ph)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit3 size={14}/></button>
                <button onClick={()=>doDelete(ph.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${ph.status==="مكتملة"?"bg-emerald-500":ph.status==="قيد التنفيذ"?"bg-blue-500":ph.status==="متأخرة"?"bg-red-500":"bg-gray-300"}`}
                  style={{width:`${ph.progress}%`}}/>
              </div>
              <span className="text-sm font-bold w-10 text-left">{ph.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── تبويب التقارير اليومية ──
function ReportsTab({ proj, addReport, delReport, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], author: emp.name, work:"", issues:"لا توجد", progress: proj.progress });
  const addToast = useToast();
  const confirm = useConfirm();

  const submit = () => {
    if (!form.work.trim()) return;
    addReport(proj.id, form); setShowAdd(false); setForm({ date:new Date().toISOString().split("T")[0], author:emp.name, work:"", issues:"لا توجد", progress:proj.progress });
    addToast("تم إضافة التقرير","success");
  };
  const doDelete = async (rId) => {
    if (await confirm("حذف هذا التقرير؟", { title:"حذف التقرير", ok:"حذف" })) { delReport(proj.id, rId); addToast("تم الحذف","info"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FileText size={16}/> التقارير اليومية</h3>
        <button onClick={()=>setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> تقرير جديد
        </button>
      </div>

      {showAdd && (
        <div className="card rounded-2xl border border-color p-4">
          <h4 className="font-bold text-sm mb-3">تقرير يومي جديد</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">التاريخ</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">اسم المُعِد</label>
              <input value={form.author} onChange={e=>setForm({...form,author:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">الأعمال المنجزة اليوم</label>
              <textarea value={form.work} onChange={e=>setForm({...form,work:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="صف الأعمال المنجزة اليوم..."/></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">الملاحظات والعقبات</label>
              <textarea value={form.issues} onChange={e=>setForm({...form,issues:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="اكتب لا توجد إذا لم تكن هناك عقبات"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نسبة الإنجاز الكلية % (تحديث)</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ التقرير</button>
          </div>
        </div>
      )}

      {(proj.reports||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FileText size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد تقارير يومية بعد</p></div>
      )}

      <div className="space-y-3">
        {[...(proj.reports||[])].reverse().map(r => (
          <div key={r.id} className="card rounded-xl border border-color p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{r.date}</span>
                  <span className="text-xs text-secondary">· {r.author}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">إنجاز: {r.progress}%</span>
                </div>
              </div>
              <button onClick={()=>doDelete(r.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
            </div>
            <div className="space-y-1.5 text-sm">
              <div><span className="font-bold text-secondary text-xs">الأعمال المنجزة: </span><span>{r.work}</span></div>
              <div><span className="font-bold text-secondary text-xs">الملاحظات والعقبات: </span><span className={r.issues==="لا توجد"?"text-emerald-600 text-xs":"text-amber-600 text-xs"}>{r.issues}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== نظام تخزين الملفات المحلي المتقدم ==========
// استخدام IndexedDB للملفات الكبيرة (أكثر من 5MB)
const FileStorage = {
  dbName: "BOC_ProjectFiles",
  dbVersion: 1,
  db: null,

  initDB: () => {
    return new Promise((resolve, reject) => {
      if (FileStorage.db) { resolve(FileStorage.db); return; }
      const request = indexedDB.open(FileStorage.dbName, FileStorage.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { FileStorage.db = request.result; resolve(FileStorage.db); };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("files")) {
          const store = db.createObjectStore("files", { keyPath: "id" });
          store.createIndex("projectId", "projectId", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  },

  saveFile: async (projectId, docId, file, metadata) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const transaction = FileStorage.db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");
        const fileRecord = {
          id: docId, projectId, name: metadata.name, type: metadata.type,
          size: file.size, timestamp: Date.now(), uploadedBy: metadata.uploadedBy,
          date: metadata.date, data: e.target.result,
        };
        const request = store.put(fileRecord);
        request.onsuccess = () => resolve(fileRecord);
        request.onerror = () => reject(request.error);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  getFile: async (fileId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readonly");
      const store = transaction.objectStore("files");
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  deleteFile: async (fileId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readwrite");
      const store = transaction.objectStore("files");
      const request = store.delete(fileId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  getProjectFiles: async (projectId) => {
    await FileStorage.initDB();
    return new Promise((resolve, reject) => {
      const transaction = FileStorage.db.transaction(["files"], "readonly");
      const store = transaction.objectStore("files");
      const index = store.index("projectId");
      const request = index.getAll(projectId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  getStorageUsage: async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
      };
    }
    return null;
  }
};

// رفع ملف إلى Firebase Storage عبر REST API (بدون SDK)
const uploadToFirebaseStorage = (file, path, onProgress) => new Promise((resolve, reject) => {
  const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o?uploadType=media&name=${encodeURIComponent(path)}`;
  const xhr = new XMLHttpRequest();
  xhr.upload.addEventListener("progress", e => {
    if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
  });
  xhr.onload = () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      const token = data.downloadTokens;
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o/${encodeURIComponent(data.name)}?alt=media&token=${token}`;
      resolve({ url: downloadUrl, path: data.name, size: data.size });
    } else {
      reject(new Error(`فشل الرفع (${xhr.status}): ${xhr.responseText}`));
    }
  };
  xhr.onerror = () => reject(new Error("خطأ في الشبكة أثناء الرفع"));
  xhr.open("POST", url);
  xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
  xhr.send(file);
});

// حد افتراضي لخطة Firebase المجانية (Spark) — 5GB تخزين. عدّله إذا كانت الخطة Blaze (غير محدود عملياً).
const FIREBASE_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
const fmtStorageSize = (b) => b >= 1e9 ? (b/1e9).toFixed(2)+" GB" : b >= 1e6 ? (b/1e6).toFixed(1)+" MB" : b >= 1e3 ? (b/1e3).toFixed(0)+" KB" : b+" B";

// يحسب الاستخدام الفعلي لمخزن Firebase Storage عبر سرد كل الملفات وجمع أحجامها (REST بدون حاجة لصلاحيات إدارية)
const getFirebaseStorageUsage = async () => {
  try {
    let usage = 0, pageToken;
    do {
      const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o?maxResults=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      (data.items || []).forEach(it => { usage += Number(it.size || 0); });
      pageToken = data.nextPageToken;
    } while (pageToken);
    const limit = FIREBASE_STORAGE_LIMIT_BYTES;
    const pct = Math.round((usage / limit) * 100);
    return { usage, limit, pct, usageStr: fmtStorageSize(usage), limitStr: fmtStorageSize(limit), freeStr: fmtStorageSize(Math.max(limit - usage, 0)) };
  } catch { return null; }
};

// ── تبويب الوثائق ──
function DocsTab({ proj, addDoc, delDoc, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", type: "وثيقة هندسية", date: new Date().toISOString().split("T")[0], size: "", uploadedBy: emp.name });
  const [fileData, setFileData] = useState(null);
  const [fileMime, setFileMime] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [localFiles, setLocalFiles] = useState([]);
  const [storageUsage, setStorageUsage] = useState(null);
  const [fbUsage, setFbUsage] = useState(null);
  const fileRef = useRef(null);
  const addToast = useToast();
  const confirm = useConfirm();
  const gDrive = useGDrive();

  useEffect(() => { loadLocalFiles(); checkStorage(); }, [proj.id]);
  useEffect(() => { getFirebaseStorageUsage().then(setFbUsage); }, []);

  const loadLocalFiles = async () => {
    try { const files = await FileStorage.getProjectFiles(proj.id); setLocalFiles(files); }
    catch (err) { console.error("Error loading local files:", err); }
  };

  const checkStorage = async () => { setStorageUsage(await FileStorage.getStorageUsage()); };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileMime(file.type);
    setForm(prev => ({ ...prev, name: prev.name || file.name, size: (file.size / 1024).toFixed(0) + " KB" }));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFileData(ev.target.result);
      reader.readAsDataURL(file);
    } else { setFileData(null); }
  };

  const resetForm = () => {
    setShowAdd(false);
    setForm({ name: "", type: "وثيقة هندسية", date: new Date().toISOString().split("T")[0], size: "", uploadedBy: emp.name });
    setFileData(null); setFileMime(""); setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadViaFirebase = async () => {
    const path = `projects/${proj.id}/${Date.now()}_${selectedFile.name}`;
    const result = await uploadToFirebaseStorage(selectedFile, path, pct => setUploadPct(pct));
    addDoc(proj.id, {
      ...form, fileData: null, fileMime: fileMime || null,
      fileUrl: result.url, firebasePath: result.path,
      size: form.size || (Number(result.size) / 1024).toFixed(0) + " KB",
      storageType: "firebase"
    });
    addToast("تم رفع الملف إلى Firebase Storage ✅", "success");
    getFirebaseStorageUsage().then(setFbUsage);
  };

  const uploadViaDrive = async () => {
    const result = await gDrive.uploadFile(selectedFile, pct => setUploadPct(pct));
    addDoc(proj.id, {
      ...form, fileData: null, fileMime: fileMime || null,
      driveFileId: result.id, driveViewLink: result.webViewLink, driveDownloadLink: result.webContentLink,
      size: form.size || (Number(result.size) / 1024).toFixed(0) + " KB",
      storageType: "google_drive"
    });
    addToast("تم رفع الملف إلى Google Drive ✅", "success");
  };

  const submit = async () => {
    if (!form.name.trim()) { addToast("يرجى إدخال اسم الوثيقة", "warning"); return; }
    setUploading(true); setUploadPct(0);
    try {
      if (selectedFile) {
        // احتياطي تلقائي: إذا اقترب Firebase من الامتلاء وكان Google Drive متاحاً، يُستخدم Drive مباشرة
        const nearFull = fbUsage && fbUsage.pct >= GDRIVE_WARN_PCT;
        if (nearFull && gDrive.isReady) {
          addToast(`⚠️ مساحة Firebase اقتربت من الامتلاء (${fbUsage.pct}%) — يتم الرفع إلى Google Drive`, "warning");
          await uploadViaDrive();
        } else {
          try {
            await uploadViaFirebase();
          } catch (fbErr) {
            if (gDrive.isReady) {
              addToast("تعذّر الرفع إلى Firebase، تتم المحاولة عبر Google Drive كاحتياطي...", "warning");
              await uploadViaDrive();
            } else {
              throw fbErr;
            }
          }
        }
      } else {
        addDoc(proj.id, { ...form, fileData: null, storageType: "metadata" });
        addToast("تمت إضافة الوثيقة", "success");
      }
      resetForm();
    } catch (e) { addToast(`فشل الرفع: ${e.message}`, "error"); }
    finally { setUploading(false); setUploadPct(0); }
  };

  const doDelete = async (doc) => {
    if (!await confirm("حذف هذه الوثيقة؟", { title: "حذف الوثيقة", ok: "حذف" })) return;
    if (doc.localFileId) { await FileStorage.deleteFile(doc.localFileId); await loadLocalFiles(); await checkStorage(); }
    if (doc.driveFileId && gDrive.isReady) await gDrive.deleteFile(doc.driveFileId);
    if (doc.firebasePath) {
      try {
        await fetch(`https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(FIREBASE_STORAGE_BUCKET)}/o/${encodeURIComponent(doc.firebasePath)}`, { method: "DELETE" });
      } catch {}
    }
    delDoc(proj.id, doc.id);
    addToast("تم الحذف", "info");
  };

  const downloadFile = (doc) => {
    if (doc.fileUrl) { window.open(doc.fileUrl, "_blank"); return; }
    if (doc.driveDownloadLink) { window.open(doc.driveDownloadLink, "_blank"); return; }
    if (doc.fileData) {
      const a = document.createElement("a");
      a.href = doc.fileData; a.download = doc.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      return;
    }
    addToast("لا يوجد ملف للتحميل", "warning");
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024, sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const docIcons = { "وثيقة هندسية": "🗂️", "عقد": "📋", "تقرير": "📊", "خطة": "📅", "رسم": "📐", "أخرى": "📄" };
  const isImage = (mime) => mime && mime.startsWith("image/");

  const allDocs = useMemo(() => {
    const projectDocs = proj.docs || [];
    const localDocs = localFiles.map(f => ({
      id: f.id, name: f.name, type: f.type || "وثيقة",
      date: new Date(f.timestamp).toISOString().split("T")[0],
      size: formatBytes(f.size), uploadedBy: f.uploadedBy,
      fileData: f.data, fileMime: f.type, localFileId: f.id, storageType: "local"
    }));
    const localIds = new Set(localDocs.map(d => d.localFileId));
    return [...projectDocs.filter(d => !d.localFileId || !localIds.has(d.localFileId)), ...localDocs];
  }, [proj.docs, localFiles]);

  return (
    <div className="space-y-4">
      {storageUsage && (
        <div className={`rounded-xl p-3 flex items-center justify-between text-xs border ${storageUsage.percent > 80 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-2">
            <span>💾</span>
            <span className="font-medium">التخزين المحلي:</span>
            <span>{formatBytes(storageUsage.usage)} / {formatBytes(storageUsage.quota)}</span>
          </div>
          <div className="flex-1 max-w-[200px] mx-3">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${storageUsage.percent > 80 ? "bg-red-500" : storageUsage.percent > 60 ? "bg-amber-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(100, storageUsage.percent)}%` }} />
            </div>
          </div>
          <span className={storageUsage.percent > 80 ? "text-red-600 font-bold" : "text-gray-600"}>{storageUsage.percent}% مستخدم</span>
        </div>
      )}

      {fbUsage && fbUsage.pct >= GDRIVE_WARN_PCT && (
        <div className={`rounded-xl p-3 flex items-center justify-between text-xs border ${fbUsage.pct >= GDRIVE_CRIT_PCT ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span className="font-medium">Firebase Storage:</span>
            <span>{fbUsage.usageStr} / {fbUsage.limitStr}</span>
          </div>
          <span className={fbUsage.pct >= GDRIVE_CRIT_PCT ? "text-red-600 font-bold" : "text-amber-600 font-medium"}>
            {fbUsage.pct}% — {gDrive.isReady ? "الرفع التالي سيتم عبر Google Drive احتياطياً" : "متاح: " + fbUsage.freeStr}
          </span>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold">{previewDoc.name}</span>
              <button onClick={() => setPreviewDoc(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            {isImage(previewDoc.fileMime) && (previewDoc.fileData || previewDoc.fileUrl)
              ? <img src={previewDoc.fileData || previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full rounded-xl" />
              : <div className="text-center py-8 text-secondary">
                  <p className="text-5xl mb-3">{previewDoc.storageType === "firebase" ? "🔥" : previewDoc.driveFileId ? "☁️" : "📄"}</p>
                  <p>{previewDoc.name}</p>
                </div>
            }
            <button onClick={() => downloadFile(previewDoc)} className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Download size={14} /> {previewDoc.driveFileId ? "فتح في Google Drive" : previewDoc.fileUrl ? "فتح الملف" : "تحميل الملف"}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FolderOpen size={16} /> وثائق المشروع ({allDocs.length})</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            🔥 Firebase Storage
          </span>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            <Plus size={14} /> إضافة وثيقة / صورة
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card rounded-2xl border border-color p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">إضافة وثيقة أو صورة</h4>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🔥 Firebase Storage</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">اسم الوثيقة</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم الملف أو الوثيقة" /></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نوع الوثيقة</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm">
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الرفع</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">رُفع بواسطة</label>
              <input value={form.uploadedBy} onChange={e => setForm({ ...form, uploadedBy: e.target.value })} className="input w-full rounded-lg px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-1">اختر ملف أو صورة</label>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                  onChange={handleFileSelect}
                  className="block text-sm text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                {selectedFile && <button onClick={() => { setFileData(null); setFileMime(""); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-red-400 hover:text-red-600"><X size={16} /></button>}
              </div>
              {fileData && isImage(fileMime) && <img src={fileData} alt="معاينة" className="mt-2 max-h-32 rounded-lg border border-color object-contain" />}
              {selectedFile && !isImage(fileMime) && <p className="mt-1 text-xs text-emerald-600 font-medium">✓ تم اختيار: {selectedFile.name} ({form.size})</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={resetForm} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} disabled={uploading} className="relative overflow-hidden flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 min-w-[100px]">
              {uploading && uploadPct > 0 && <span className="absolute inset-0 bg-blue-400/50 transition-all" style={{ width: `${uploadPct}%` }} />}
              <span className="relative">
                {uploading ? <><span className="animate-spin">⏳</span> {uploadPct > 0 ? `${uploadPct}%` : "جارٍ الرفع..."}</> : <><Save size={14} /> إضافة</>}
              </span>
            </button>
          </div>
        </div>
      )}

      {allDocs.length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FolderOpen size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد وثائق بعد</p></div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allDocs.map(d => (
          <div key={d.id} className="card rounded-xl border border-color p-3">
            {isImage(d.fileMime) && (d.fileData || d.fileUrl) && (
              <div className="mb-2 cursor-pointer" onClick={() => setPreviewDoc(d)}>
                <img src={d.fileData || d.fileUrl} alt={d.name} className="w-full h-32 object-cover rounded-lg border border-color hover:opacity-90 transition-opacity" />
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="text-2xl cursor-pointer" onClick={() => (d.fileData || d.fileUrl) && setPreviewDoc(d)}>
                {isImage(d.fileMime) ? "🖼️" : (d.fileData || d.fileUrl) ? "📎" : (docIcons[d.type] || "📄")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{d.name}</p>
                <p className="text-xs text-secondary mt-0.5">{d.type} · {d.date}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {d.size && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono">{d.size}</span>}
                  <span className="text-[10px] text-secondary">{d.uploadedBy}</span>
                  {d.storageType === "local" && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">📁 محلي</span>}
                  {d.storageType === "gdrive" && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">☁️ Drive</span>}
                  {d.storageType === "firebase" && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">🔥 Firebase</span>}
                  <button onClick={() => downloadFile(d)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                    <Download size={10} /> تحميل
                  </button>
                  {isImage(d.fileMime) && (d.fileData || d.fileUrl) && (
                    <button onClick={() => setPreviewDoc(d)} className="text-[10px] text-purple-600 hover:underline">عرض</button>
                  )}
                </div>
              </div>
              <button onClick={() => doDelete(d)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg flex-shrink-0"><Trash2 size={14} /></button>
            </div>
            {d.firebasePath && (
              <div className="mt-1 pt-1 border-t border-color flex items-center gap-1">
                <span className="text-[10px] text-orange-600 font-medium">🔥 Firebase Storage</span>
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">فتح</a>
              </div>
            )}
            {d.driveFileId && (
              <div className="mt-1 pt-1 border-t border-color flex items-center gap-1">
                <span className="text-[10px] text-emerald-600 font-medium">☁️ Google Drive</span>
                <a href={d.driveViewLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">فتح</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── تبويب الفحوصات ──
function InspectionsTab({ proj, addInsp, delInsp, emp }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date:new Date().toISOString().split("T")[0], inspector:emp.name, section:"", result:"ناجح", notes:"" });
  const addToast = useToast();
  const confirm = useConfirm();

  const submit = () => {
    if (!form.section.trim()) return;
    addInsp(proj.id, form); setShowAdd(false); setForm({ date:new Date().toISOString().split("T")[0], inspector:emp.name, section:"", result:"ناجح", notes:"" });
    addToast("تم تسجيل الفحص","success");
  };
  const doDelete = async (iId) => {
    if (await confirm("حذف هذا الفحص؟", { title:"حذف الفحص", ok:"حذف" })) { delInsp(proj.id, iId); addToast("تم الحذف","info"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><FileCheck size={16}/> سجل الفحوصات</h3>
        <button onClick={()=>setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
          <Plus size={14}/> فحص جديد
        </button>
      </div>

      {showAdd && (
        <div className="card rounded-2xl border border-color p-4">
          <h4 className="font-bold text-sm mb-3">تسجيل فحص جديد</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الفحص</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">المفتش</label>
              <input value={form.inspector} onChange={e=>setForm({...form,inspector:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">القسم / الموقع المفحوص</label>
              <input value={form.section} onChange={e=>setForm({...form,section:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="مثال: قسم A — الوصلات"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نتيجة الفحص</label>
              <select value={form.result} onChange={e=>setForm({...form,result:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {INSP_RESULTS.map(r=><option key={r}>{r}</option>)}</select></div>
            <div className="md:col-span-2"><label className="block text-xs font-bold text-secondary mb-1">ملاحظات الفحص</label>
              <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="ملاحظات ونتائج الفحص..."/></div>
          </div>
          <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-color">
            <button onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
            <button onClick={submit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"><Save size={14}/> حفظ الفحص</button>
          </div>
        </div>
      )}

      {(proj.inspections||[]).length === 0 && !showAdd && (
        <div className="text-center py-12 text-secondary"><FileCheck size={32} className="mx-auto mb-2 opacity-30"/><p>لا توجد فحوصات مسجلة بعد</p></div>
      )}

      <div className="space-y-3">
        {[...(proj.inspections||[])].reverse().map(insp => (
          <div key={insp.id} className="card rounded-xl border border-color p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{insp.section}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${INSP_RESULT_COLORS[insp.result]}`}>{insp.result}</span>
              </div>
              <button onClick={()=>doDelete(insp.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={14}/></button>
            </div>
            <div className="text-xs text-secondary mb-1">{insp.date} · {insp.inspector}</div>
            {insp.notes && <p className="text-sm text-primary">{insp.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── مودال إضافة مشروع جديد ──
function AddProjectModal({ onClose, onAdd, existingIds }) {
  const [form, setForm] = useState({ name:"", status:"قيد التخطيط", priority:"متوسط", manager:"", budget:"", spent:"0", progress:"0", startDate:new Date().toISOString().split("T")[0], endDate:"", desc:"" });
  const submit = () => {
    if (!form.name.trim()) return;
    const newId = `P${String(existingIds.length+1).padStart(3,"0")}`;
    const usedId = existingIds.includes(newId) ? `P${Date.now()}` : newId;
    onAdd({ ...form, id:usedId, budget:+form.budget||0, spent:+form.spent||0, progress:+form.progress||0, team:form.manager?[form.manager]:[], phases:[], reports:[], docs:[], inspections:[] });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="card rounded-2xl border border-color p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Briefcase size={18}/> مشروع جديد</h3>
          <button onClick={onClose} className="text-secondary hover:text-red-500"><X size={18}/></button>
        </div>
        <div className="space-y-3">
          <div><label className="block text-xs font-bold text-secondary mb-1">اسم المشروع *</label>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم المشروع"/></div>
          <div><label className="block text-xs font-bold text-secondary mb-1">مدير المشروع</label>
            <input value={form.manager} onChange={e=>setForm({...form,manager:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="اسم مدير المشروع"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">الحالة</label>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {PROJ_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">الأولوية</label>
              <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">
                {PROJ_PRIORITIES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ البدء</label>
              <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">تاريخ الانتهاء</label>
              <input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-secondary mb-1">الميزانية ($)</label>
              <input type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" dir="ltr" placeholder="0"/></div>
            <div><label className="block text-xs font-bold text-secondary mb-1">نسبة الإنجاز %</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm" placeholder="0"/></div>
          </div>
          <div><label className="block text-xs font-bold text-secondary mb-1">وصف المشروع</label>
            <textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows={2} className="input w-full rounded-lg px-3 py-2 text-sm resize-none" placeholder="وصف مختصر للمشروع..."/></div>
        </div>
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-color">
          <button onClick={onClose} className="px-4 py-2 rounded-xl btn-secondary text-sm">إلغاء</button>
          <button onClick={submit} disabled={!form.name.trim()} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50"><Plus size={14}/> إنشاء المشروع</button>
        </div>
      </div>
    </div>
  );
}

export default ProjectManagementPage;
