import React, { useState, useMemo } from "react";
import { Brain, Search, AlertTriangle, CheckCircle, Info, TrendingUp, Wrench, Zap, BarChart2, Clock } from "lucide-react";

// ── Fault Knowledge Base ───────────────────────────────────────────────────────
const KB = [
  { id:"overheat", tags:["حرارة","سخونة","يسخن","ساخن","حرارة مرتفعة","حريق","يسخّن","حار"],
    title:"ارتفاع درجة الحرارة", priority:"عاجل", icon:"🌡️",
    causes:["نقص زيت التشحيم أو تلوثه","انسداد نظام التبريد","فشل مروحة التبريد","حمل زائد على المعدة"],
    actions:["فحص مستوى الزيت وتغييره","تنظيف المبرد والفلاتر","فحص مروحة التبريد وإصلاحها","تخفيف الحمل على المعدة"] },
  { id:"vibration", tags:["اهتزاز","ارتعاش","يهتز","رجّة","رجة","اهتزازات","رعشة"],
    title:"اهتزاز غير طبيعي", priority:"متوسط", icon:"〰️",
    causes:["خلل في الاتزان الديناميكي","تلف في المحامل","انحراف محور التشغيل","تلف في الوصلات المرنة"],
    actions:["معايرة التوازن الديناميكي","فحص المحامل واستبدالها","محاذاة الأعمدة","فحص الوصلات المرنة"] },
  { id:"noise", tags:["ضوضاء","صوت","صوت غريب","طرقعة","صرير","طنين","صوت عالٍ","دويّ"],
    title:"أصوات غير طبيعية", priority:"متوسط", icon:"🔊",
    causes:["تلف في المحامل","تلف في التروس أو الإسفين","وجود أجسام غريبة","ارتخاء أجزاء ميكانيكية"],
    actions:["فحص المحامل وتزليقها أو استبدالها","فحص التروس","فحص الأجزاء المحيطة","شد البراغي والربطات"] },
  { id:"leak", tags:["تسريب","يسرّب","تسرب","رشح","رشّح","نقطة زيت","نقطة ماء","سرب","يرشح"],
    title:"تسريب", priority:"عاجل", icon:"💧",
    causes:["تلف في الحشوات والمسكّرات","تآكل في المواسير أو الوصلات","ارتخاء في الوصلات","تجاوز ضغط التشغيل"],
    actions:["استبدال الحشوات التالفة","فحص وإصلاح المواسير","شد الوصلات","ضبط ضغط التشغيل"] },
  { id:"no_start", tags:["لا يعمل","لا يشتغل","لا يبدأ","لا يدور","توقف فجأة","ما يشتغل","عاطل","متوقف","لا يستجيب","عطل"],
    title:"عدم الاشتغال أو التوقف المفاجئ", priority:"عاجل", icon:"⚡",
    causes:["انقطاع التيار الكهربائي أو ضعفه","عطل في نظام التحكم","تلف في محرك الاشتغال","تشغيل دوائر الحماية"],
    actions:["فحص المصدر الكهربائي والتأسيس","فحص نظام التحكم والبرمجة","فحص محرك الاشتغال","فحص وإعادة ضبط الحمايات"] },
  { id:"low_pressure", tags:["ضغط منخفض","انخفاض ضغط","ضغط ضعيف","ضغط قليل","ضغط ناقص","ضغط متدني"],
    title:"انخفاض الضغط", priority:"متوسط", icon:"📉",
    causes:["تآكل أو تلف الحشوات الداخلية","تسريب في المنظومة","تآكل ريش المضخة أو البسطون","انسداد فلاتر المدخل"],
    actions:["فحص واستبدال الحشوات الداخلية","فحص التسريبات في المنظومة","قياس الفجوات وإصلاحها","تنظيف فلاتر المدخل"] },
  { id:"electrical", tags:["كهرباء","كهربائي","قصر","شرارة","قاطع","بريكر","لوحة كهربائية","أمبير","جهد","فيوز"],
    title:"عطل كهربائي", priority:"عاجل", icon:"⚡",
    causes:["قصر كهربائي في الأسلاك","تلف في اللوحة أو المحولات","حمل زائد على الدوائر","رطوبة في الدوائر الكهربائية"],
    actions:["فحص الأسلاك والعوازل","فحص اللوحة الكهربائية وعناصرها","ضبط الحمل وتوزيعه","عزل مصادر الرطوبة وتجفيفها"] },
  { id:"sensor", tags:["حساس","سنسور","قراءة خاطئة","مستشعر","إشارة","إشارة خاطئة","تأشير","ترموكبل"],
    title:"عطل في الحساسات أو أجهزة القياس", priority:"متوسط", icon:"📡",
    causes:["تلف في الحساس نفسه","تلوث أو تآكل في التوصيلات","عطل في كرت الإشارة","خطأ في ضبط معاملات الحساس"],
    actions:["معايرة الحساس أو استبداله","تنظيف التوصيلات وفحصها","استبدال كرت الإشارة","إعادة ضبط معاملات الحساس"] },
  { id:"communication", tags:["اتصالات","شبكة","بروتوكول","خطأ اتصال","انقطاع اتصال","modbus","profibus","rs485"],
    title:"خطأ في الاتصالات أو شبكة البيانات", priority:"متوسط", icon:"🔌",
    causes:["تلف في كابل الاتصالات","عطل في كرت الاتصالات","خطأ في إعدادات البروتوكول","تداخل كهرومغناطيسي"],
    actions:["فحص كابلات الاتصالات وإعادة توصيلها","استبدال كرت الاتصالات","مراجعة إعدادات البروتوكول","تأريض مناسب للتقليل من التداخل"] },
  { id:"corrosion", tags:["صدأ","تآكل","متآكل","أكسدة","تلف","بالٍ","تآكل كيميائي"],
    title:"تآكل وصدأ", priority:"منخفض", icon:"🔩",
    causes:["التعرض للرطوبة أو المواد الكيميائية","غياب أو تلف الطلاء الواقي","تآكل كلفاني بين معادن مختلفة","ارتفاع درجة الحرارة"],
    actions:["إزالة الصدأ ومعالجة السطح","تطبيق طلاء واقٍ مقاوم للتآكل","استبدال الأجزاء المتآكلة","تحسين نظام التهوية"] },
  { id:"filter", tags:["فلتر","فلاتر","مرشح","انسداد","مسدود","فرق ضغط","فلتر متسخ"],
    title:"انسداد أو تلف الفلاتر", priority:"متوسط", icon:"🔽",
    causes:["تراكم الشوائب والرواسب","انتهاء عمر تشغيل الفلتر","جودة رديئة للمواد المصفاة","غياب برنامج تغيير دوري"],
    actions:["تنظيف أو استبدال الفلتر","فحص جودة المواد المصفاة","وضع جدول دوري لتغيير الفلاتر","تثبيت مقياس فارق الضغط"] },
  { id:"bearing", tags:["محمل","محامل","bearing","تلف محمل","محمل تالف","احتكاك","خشونة"],
    title:"تلف المحامل", priority:"متوسط", icon:"⚙️",
    causes:["نقص التزليق أو استخدام الزيت الخاطئ","تحميل زائد","دخول ملوثات","انتهاء العمر الافتراضي"],
    actions:["تغيير المحامل وتزليقها الصحيح","مراجعة الحمل وتوزيعه","تنظيف البيئة المحيطة","التحقق من المواءمة"] },
];

const PRIORITY_STYLE = {
  "عاجل":   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "متوسط":  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "منخفض":  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

function diagnose(text) {
  if (!text.trim()) return [];
  const lower = text;
  return KB.map(rule => ({ ...rule, score: rule.tags.filter(t => lower.includes(t)).length }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ── Analysis Engine ────────────────────────────────────────────────────────────
function analyzeEntries(entries) {
  if (!entries.length) return null;
  const now = new Date();
  const ago30 = new Date(now - 30 * 864e5);
  const ago7  = new Date(now - 7  * 864e5);
  const recent30 = entries.filter(e => e.date && new Date(e.date+"T00:00:00") >= ago30);
  const recent7  = entries.filter(e => e.date && new Date(e.date+"T00:00:00") >= ago7);

  const eqCount = {};
  entries.forEach(e => { if (e.equipmentName) eqCount[e.equipmentName] = (eqCount[e.equipmentName]||0)+1; });
  const topEq = Object.entries(eqCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));

  const byType = {};
  entries.forEach(e => { if (e.workType) byType[e.workType] = (byType[e.workType]||0)+1; });
  const total = Object.values(byType).reduce((a,b)=>a+b,0);
  const emergency  = byType["صيانة طارئة"] || 0;
  const preventive = byType["صيانة دورية"] || 0;

  const stoppedEq = [...new Set(recent30.filter(e=>e.status==="متوقف").map(e=>e.equipmentName).filter(Boolean))];

  const emgEq30 = {};
  recent30.filter(e=>e.workType==="صيانة طارئة").forEach(e=>{
    if (e.equipmentName) emgEq30[e.equipmentName] = (emgEq30[e.equipmentName]||0)+1;
  });
  const criticalEq = Object.entries(emgEq30).filter(([,c])=>c>=2).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));

  const totalHours = entries.reduce((s,e)=>s+(Number(e.hours)||0),0);
  const recs = [];

  if (total > 0 && emergency/total > 0.4)
    recs.push({ type:"warning", text:`نسبة الصيانة الطارئة مرتفعة (${Math.round(emergency/total*100)}%) — يُنصح بتعزيز برنامج الصيانة الدورية الوقائية` });
  criticalEq.forEach(eq =>
    recs.push({ type:"danger", text:`معدة "${eq.name}" سُجّلت لها ${eq.count} أعطال طارئة خلال 30 يوماً — تحتاج فحصاً شاملاً فورياً` })
  );
  if (stoppedEq.length)
    recs.push({ type:"warning", text:`${stoppedEq.length} معدة لا تزال بحالة "متوقف": ${stoppedEq.slice(0,3).join("، ")}${stoppedEq.length>3?" وأخرى":""}` });
  if (preventive > 0 && emergency === 0)
    recs.push({ type:"success", text:"ممتاز! لا توجد أعطال طارئة — برنامج الصيانة الوقائية يعمل بكفاءة عالية" });
  if (recent7.length === 0)
    recs.push({ type:"info", text:"لم يُسجَّل أي عمل صيانة خلال الأسبوع الماضي — تأكد من تحديث السجلات" });

  return {
    totalEntries: entries.length, totalHours, topEq, byType,
    stoppedEq, criticalEq, recs,
    r30: recent30.length, r7: recent7.length,
    emgPct: total ? Math.round(emergency/total*100) : 0,
    prvPct: total ? Math.round(preventive/total*100) : 0,
  };
}

// ── Diagnosis Panel ────────────────────────────────────────────────────────────
function DiagnosisPanel() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const results = useMemo(() => diagnose(submitted), [submitted]);

  const run = () => { if (text.trim()) setSubmitted(text); };

  return (
    <div className="space-y-4">
      <div className="card rounded-2xl border border-color p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Search size={16} className="text-blue-500"/>
          <h3 className="font-bold text-sm">صف العطل أو المشكلة</h3>
        </div>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="مثال: المضخة تهتز بشدة وفيها صوت غريب..."
          rows={3}
          className="w-full input-base rounded-xl px-3 py-2 text-sm border border-color resize-none"
        />
        <button onClick={run} disabled={!text.trim()}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2">
          <Brain size={15}/> تشخيص العطل
        </button>
      </div>

      {submitted && results.length === 0 && (
        <div className="text-center py-10 text-secondary">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-sm">لم يُطابق الوصف أي عطل معروف — حاول بكلمات أكثر تفصيلاً</p>
        </div>
      )}

      {results.map((r, i) => (
        <div key={r.id} className="card rounded-2xl border border-color overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-hover border-b border-color">
            <span className="text-2xl">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{r.title}</p>
              {i === 0 && <p className="text-xs text-blue-600">الاحتمال الأعلى</p>}
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[r.priority]}`}>{r.priority}</span>
          </div>
          <div className="px-4 py-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-secondary mb-1.5 flex items-center gap-1"><AlertTriangle size={11}/> الأسباب المحتملة</p>
              <ul className="space-y-1">
                {r.causes.map((c,j) => <li key={j} className="text-xs flex gap-1.5"><span className="text-secondary shrink-0 mt-0.5">•</span>{c}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-secondary mb-1.5 flex items-center gap-1"><CheckCircle size={11}/> الإجراءات المقترحة</p>
              <ul className="space-y-1">
                {r.actions.map((a,j) => <li key={j} className="text-xs flex gap-1.5"><span className="text-blue-500 shrink-0 mt-0.5">✓</span>{a}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Analysis Panel ─────────────────────────────────────────────────────────────
const REC_ICON  = { warning:<AlertTriangle size={14}/>, danger:<Zap size={14}/>, success:<CheckCircle size={14}/>, info:<Info size={14}/> };
const REC_STYLE = {
  warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300",
  danger:  "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300",
  info:    "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300",
};

function AnalysisPanel({ entries }) {
  const data = useMemo(() => analyzeEntries(entries), [entries]);

  if (!data) return (
    <div className="text-center py-16 text-secondary">
      <BarChart2 size={40} className="mx-auto mb-3 opacity-30"/>
      <p className="text-sm">لا توجد بيانات كافية للتحليل — أضف سجلات عمل أولاً</p>
    </div>
  );

  const typeMax = Math.max(...Object.values(data.byType), 1);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card rounded-2xl border border-color p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{data.totalEntries}</p>
          <p className="text-[11px] text-secondary">إجمالي السجلات</p>
        </div>
        <div className="card rounded-2xl border border-color p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{data.totalHours}</p>
          <p className="text-[11px] text-secondary">إجمالي الساعات</p>
        </div>
        <div className="card rounded-2xl border border-color p-3 text-center">
          <p className="text-xl font-bold text-amber-600">{data.r30}</p>
          <p className="text-[11px] text-secondary">آخر 30 يوم</p>
        </div>
      </div>

      {/* Maintenance type ratio */}
      <div className="card rounded-2xl border border-color p-4 space-y-1.5">
        <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5"><TrendingUp size={14}/> توزيع نوع الأعمال</h4>
        {Object.entries(data.byType).sort((a,b)=>b[1]-a[1]).map(([type,count]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="text-xs text-secondary w-28 shrink-0">{type}</span>
            <div className="flex-1 bg-hover rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-blue-500 rounded-full" style={{width:`${Math.round(count/typeMax*100)}%`}}/>
            </div>
            <span className="text-xs font-bold w-5 text-left">{count}</span>
          </div>
        ))}
      </div>

      {/* Top equipment */}
      {data.topEq.length > 0 && (
        <div className="card rounded-2xl border border-color p-4">
          <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Wrench size={14}/> المعدات الأكثر صيانةً</h4>
          <div className="space-y-2">
            {data.topEq.map((eq, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[11px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                <span className="flex-1 text-sm truncate">{eq.name}</span>
                <span className="text-xs font-bold text-secondary">{eq.count} سجل</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency ratio indicator */}
      <div className="card rounded-2xl border border-color p-4">
        <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Clock size={14}/> مؤشر كفاءة الصيانة</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-secondary">صيانة دورية (وقائية)</span>
            <span className="font-bold text-emerald-600">{data.prvPct}%</span>
          </div>
          <div className="w-full h-3 bg-hover rounded-full overflow-hidden flex">
            <div className="h-3 bg-emerald-500 rounded-r-full transition-all" style={{width:`${data.prvPct}%`}}/>
            <div className="h-3 bg-red-400 transition-all" style={{width:`${data.emgPct}%`}}/>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary">صيانة طارئة</span>
            <span className="font-bold text-red-500">{data.emgPct}%</span>
          </div>
          <p className="text-[11px] text-secondary mt-1">
            {data.emgPct > 40 ? "⚠️ نسبة الطوارئ مرتفعة — يُنصح بتعزيز الصيانة الوقائية"
             : data.emgPct > 20 ? "مستوى مقبول — يمكن تحسينه بزيادة الجولات الدورية"
             : "✅ نسبة ممتازة — الصيانة الوقائية تسيطر على معظم الأعمال"}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {data.recs.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold text-sm flex items-center gap-1.5"><Brain size={14}/> توصيات المستشار الذكي</h4>
          {data.recs.map((rec, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${REC_STYLE[rec.type]}`}>
              <span className="shrink-0 mt-0.5">{REC_ICON[rec.type]}</span>
              <span>{rec.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────
export default function AIAdvisorView({ entries }) {
  const [tab, setTab] = useState("diagnosis");
  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Brain size={18} className="text-blue-600"/>
        <h3 className="font-bold">المستشار الذكي للصيانة</h3>
      </div>
      <div className="flex gap-1 border-b border-color">
        {[["diagnosis","تشخيص الأعطال"],["analysis","التحليل الذكي"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k?"border-blue-600 text-blue-600":"border-transparent text-secondary hover:text-primary"}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === "diagnosis" && <DiagnosisPanel/>}
      {tab === "analysis"  && <AnalysisPanel entries={entries}/>}
    </div>
  );
}
