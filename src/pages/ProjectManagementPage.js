import React, { useState, useEffect } from "react";
import { Save, FileText, Clock, Calendar, Plus, Trash2, Edit3, X, Users,
  Briefcase, Layers, Activity, Flag, FolderOpen, FileCheck, DollarSign, Target } from "lucide-react";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { DocsTab, InspectionsTab } from "./ProjectDocs";
import { PhasesTab, ReportsTab, AddProjectModal } from "./ProjectTabs";

const PROJ_STATUS_COLORS = {"قيد التنفيذ":"bg-blue-100 text-blue-700","مكتمل":"bg-emerald-100 text-emerald-700","متوقف":"bg-red-100 text-red-700","قيد التخطيط":"bg-amber-100 text-amber-700"};
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

export default ProjectManagementPage;
