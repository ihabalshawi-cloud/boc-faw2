import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, BarChart2, ClipboardList, Star, Send, Users,
  ChevronLeft, CheckCircle, Clock, X, AlertTriangle } from "lucide-react";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { storage } from "../utils";

const QTYPES = [
  { value: "text",   label: "إجابة نصية" },
  { value: "choice", label: "اختيار واحد" },
  { value: "multi",  label: "اختيار متعدد" },
  { value: "rating", label: "تقييم (1-5)" },
  { value: "yesno",  label: "نعم / لا" },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className={`text-2xl transition-colors ${(hover||value) >= n ? "text-amber-400" : "text-gray-300"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function QuestionEditor({ q, onChange, onRemove, idx }) {
  return (
    <div className="card rounded-xl border border-color p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-secondary mt-1">س{idx + 1}</span>
        <input value={q.text} onChange={e => onChange({ ...q, text: e.target.value })}
          placeholder="نص السؤال" className="input flex-1 rounded-lg px-3 py-2 text-sm"/>
        <select value={q.type} onChange={e => onChange({ ...q, type: e.target.value, options: [] })}
          className="input rounded-lg px-2 py-2 text-sm">
          {QTYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
      </div>
      {q.type === "choice" || q.type === "multi" ? (
        <div className="space-y-1.5 pr-5">
          {(q.options || []).map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input value={opt} onChange={e => { const o=[...q.options]; o[i]=e.target.value; onChange({...q,options:o}); }}
                className="input flex-1 rounded-lg px-3 py-1.5 text-sm" placeholder={`خيار ${i+1}`}/>
              <button onClick={() => { const o=q.options.filter((_,j)=>j!==i); onChange({...q,options:o}); }}
                className="text-red-400 hover:text-red-600"><X size={12}/></button>
            </div>
          ))}
          <button onClick={() => onChange({...q, options:[...(q.options||[]),""] })}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
            <Plus size={11}/> إضافة خيار
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CreateModal({ onClose, onCreated, emp }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [deadline, setDeadline] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [questions, setQuestions] = useState([{ id: 1, text: "", type: "choice", options: ["", ""] }]);
  const [saving, setSaving] = useState(false);

  const addQ = () => setQuestions(qs => [...qs, { id: Date.now(), text: "", type: "choice", options: ["", ""] }]);
  const updateQ = (id, upd) => setQuestions(qs => qs.map(q => q.id === id ? upd : q));
  const removeQ = (id) => setQuestions(qs => qs.filter(q => q.id !== id));

  const handleCreate = async () => {
    if (!title.trim()) return toast("عنوان الاستبيان مطلوب");
    if (questions.some(q => !q.text.trim())) return toast("يرجى ملء نص جميع الأسئلة");
    if (questions.some(q => (q.type==="choice"||q.type==="multi") && q.options.filter(Boolean).length < 2))
      return toast("أسئلة الاختيار تحتاج خيارين على الأقل");
    setSaving(true);
    const survey = {
      title: title.trim(), desc: desc.trim(), deadline, anonymous,
      createdBy: emp.name, createdAt: new Date().toISOString(),
      questions: questions.map(q => ({ ...q, options: q.options?.filter(Boolean) })),
    };
    const key = await FirebaseAPI.createSurvey(survey);
    setSaving(false);
    if (!key) return toast("فشل إنشاء الاستبيان");
    toast("✅ تم إنشاء الاستبيان");
    onCreated({ ...survey, _key: key });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between p-5 border-b border-color sticky top-0 card z-10">
          <h2 className="font-bold text-lg">إنشاء استبيان جديد</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary p-1"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          {step === 1 ? (
            <>
              <div><label className="text-xs font-bold text-secondary block mb-1">العنوان *</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} className="input w-full rounded-xl px-3 py-2 text-sm" placeholder="عنوان الاستبيان"/></div>
              <div><label className="text-xs font-bold text-secondary block mb-1">الوصف</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} className="input w-full rounded-xl px-3 py-2 text-sm resize-none" placeholder="وصف مختصر (اختياري)"/></div>
              <div><label className="text-xs font-bold text-secondary block mb-1">تاريخ الانتهاء</label>
                <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} className="input rounded-xl px-3 py-2 text-sm"/></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} className="w-4 h-4"/>
                <span className="text-sm">استبيان مجهول (لن تُحفظ أسماء المستجيبين)</span>
              </label>
              <button onClick={()=>setStep(2)} disabled={!title.trim()}
                className="w-full py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-40">
                التالي — إضافة الأسئلة
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionEditor key={q.id} q={q} idx={i}
                    onChange={upd => updateQ(q.id, upd)}
                    onRemove={() => removeQ(q.id)}/>
                ))}
              </div>
              <button onClick={addQ} className="w-full py-2 border-2 border-dashed border-color rounded-xl text-secondary text-sm flex items-center justify-center gap-1 hover:border-[#C87A2E] hover:text-[#C87A2E]">
                <Plus size={14}/> إضافة سؤال
              </button>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>setStep(1)} className="flex-1 py-2.5 btn-secondary border border-color rounded-xl text-sm font-bold">السابق</button>
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 py-2.5 bg-[#C87A2E] text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-1">
                  <Send size={14}/>{saving ? "جارٍ الحفظ..." : "إنشاء الاستبيان"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TakeSurvey({ survey, emp, onBack, onSubmitted }) {
  const toast = useToast();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setAnswer = (qId, val) => setAnswers(a => ({ ...a, [qId]: val }));
  const toggleMulti = (qId, opt) => {
    setAnswers(a => {
      const cur = a[qId] || [];
      return { ...a, [qId]: cur.includes(opt) ? cur.filter(x=>x!==opt) : [...cur, opt] };
    });
  };

  const handleSubmit = async () => {
    const unanswered = survey.questions.filter(q => {
      const a = answers[q.id];
      return !a || (Array.isArray(a) && a.length === 0) || a === "";
    });
    if (unanswered.length) return toast(`يرجى الإجابة على جميع الأسئلة (${unanswered.length} متبقية)`);
    setSubmitting(true);
    const response = {
      empId: survey.anonymous ? null : emp.id,
      empName: survey.anonymous ? "مجهول" : emp.name,
      submittedAt: new Date().toISOString(),
      answers,
    };
    const ok = await FirebaseAPI.submitSurveyResponse(survey._key, response);
    setSubmitting(false);
    if (!ok) return toast("فشل الإرسال، حاول مرة أخرى");
    const done = storage.get("surveys_done", []);
    storage.set("surveys_done", [...done, survey._key]);
    toast("✅ شكراً! تم إرسال إجاباتك");
    onSubmitted();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronLeft size={15}/> العودة</button>
      <div className="card rounded-2xl border border-color p-5">
        <h2 className="font-bold text-xl mb-1">{survey.title}</h2>
        {survey.desc && <p className="text-secondary text-sm mb-1">{survey.desc}</p>}
        {survey.deadline && <p className="text-xs text-secondary">ينتهي في: {survey.deadline}</p>}
      </div>
      {survey.questions.map((q, i) => (
        <div key={q.id} className="card rounded-xl border border-color p-4 space-y-3">
          <p className="font-semibold text-sm">{i+1}. {q.text}</p>
          {q.type === "text" && (
            <textarea rows={3} value={answers[q.id]||""} onChange={e=>setAnswer(q.id,e.target.value)}
              className="input w-full rounded-xl px-3 py-2 text-sm resize-none" placeholder="اكتب إجابتك هنا..."/>
          )}
          {q.type === "yesno" && (
            <div className="flex gap-3">
              {["نعم","لا"].map(opt => (
                <button key={opt} onClick={()=>setAnswer(q.id,opt)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold border transition-colors ${answers[q.id]===opt?"bg-[#C87A2E] text-white border-[#C87A2E]":"btn-secondary border-color"}`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
          {q.type === "rating" && (
            <StarRating value={answers[q.id]||0} onChange={v=>setAnswer(q.id,v)}/>
          )}
          {q.type === "choice" && (q.options||[]).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={`q_${q.id}`} checked={answers[q.id]===opt} onChange={()=>setAnswer(q.id,opt)} className="w-4 h-4 accent-[#C87A2E]"/>
              <span className="text-sm">{opt}</span>
            </label>
          ))}
          {q.type === "multi" && (q.options||[]).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(answers[q.id]||[]).includes(opt)} onChange={()=>toggleMulti(q.id,opt)} className="w-4 h-4 accent-[#C87A2E]"/>
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSubmit} disabled={submitting}
        className="w-full py-3 bg-[#C87A2E] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40">
        <Send size={16}/>{submitting ? "جارٍ الإرسال..." : "إرسال الإجابات"}
      </button>
    </div>
  );
}

function ResultsView({ survey, onBack }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    FirebaseAPI.loadSurveyResponses(survey._key).then(r => { setResponses(r); setLoading(false); });
  }, [survey._key]);

  if (loading) return <div className="text-center py-10 text-secondary text-sm">جارٍ تحميل النتائج...</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-secondary hover:text-primary"><ChevronLeft size={15}/> العودة</button>
      <div className="card rounded-2xl border border-color p-5">
        <h2 className="font-bold text-xl mb-1">{survey.title}</h2>
        <div className="flex items-center gap-4 text-sm text-secondary mt-2">
          <span className="flex items-center gap-1"><Users size={13}/> {responses.length} مستجيب</span>
          {survey.deadline && <span className="flex items-center gap-1"><Clock size={13}/> {survey.deadline}</span>}
        </div>
      </div>
      {responses.length === 0 ? (
        <div className="card rounded-2xl border border-color p-8 text-center text-secondary">لا توجد إجابات بعد</div>
      ) : survey.questions.map((q, i) => {
        const ans = responses.map(r => r.answers?.[q.id]).filter(Boolean);
        return (
          <div key={q.id} className="card rounded-xl border border-color p-4 space-y-3">
            <p className="font-semibold text-sm">{i+1}. {q.text}</p>
            {q.type === "text" && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {ans.map((a, j) => <p key={j} className="text-sm bg-hover rounded-lg px-3 py-1.5">{a}</p>)}
              </div>
            )}
            {q.type === "rating" && (() => {
              const avg = ans.reduce((s, v) => s + Number(v), 0) / (ans.length || 1);
              return <div className="flex items-center gap-3"><span className="text-2xl font-bold text-amber-500">{avg.toFixed(1)}</span><span className="text-yellow-400 text-xl">{"★".repeat(Math.round(avg))}</span><span className="text-xs text-secondary">/ 5</span></div>;
            })()}
            {(q.type === "choice" || q.type === "multi" || q.type === "yesno") && (() => {
              const opts = q.type === "yesno" ? ["نعم","لا"] : (q.options||[]);
              const counts = {};
              ans.flat().forEach(v => { counts[v] = (counts[v]||0)+1; });
              const total = Object.values(counts).reduce((s,n)=>s+n,0) || 1;
              return (
                <div className="space-y-2">
                  {opts.map(opt => {
                    const c = counts[opt]||0;
                    const pct = Math.round(c/total*100);
                    return (
                      <div key={opt}>
                        <div className="flex justify-between text-xs mb-0.5"><span>{opt}</span><span className="text-secondary">{c} ({pct}%)</span></div>
                        <div className="h-2 bg-hover rounded-full overflow-hidden"><div className="h-full bg-[#C87A2E] rounded-full transition-all" style={{width:`${pct}%`}}/></div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

export default function SurveysPage({ emp, isAdmin }) {
  const [surveys, setSurveys] = useState(() => storage.get("surveys_cache", []));
  const [tab, setTab] = useState("active");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirm = useConfirm();
  const doneSurveys = storage.get("surveys_done", []);

  const loadSurveys = useCallback(async () => {
    const list = await FirebaseAPI.loadSurveys();
    setSurveys(list);
    storage.set("surveys_cache", list);
    setLoading(false);
  }, []);

  useEffect(() => { loadSurveys(); }, [loadSurveys]);

  const handleDelete = async (s) => {
    if (!await confirm(`هل تريد حذف استبيان "${s.title}"؟`, { title: "حذف الاستبيان", ok: "حذف" })) return;
    await FirebaseAPI.deleteSurvey(s._key);
    setSurveys(prev => prev.filter(x => x._key !== s._key));
    toast("تم حذف الاستبيان");
  };

  const now = new Date().toISOString().slice(0,10);
  const activeSurveys  = surveys.filter(s => !s.deadline || s.deadline >= now);
  const expiredSurveys = surveys.filter(s => s.deadline && s.deadline < now);
  const displayed = tab === "active" ? activeSurveys : expiredSurveys;

  if (view === "take" && selected) {
    return <TakeSurvey survey={selected} emp={emp} onBack={()=>setView("list")} onSubmitted={()=>{setView("list");loadSurveys();}}/>;
  }
  if (view === "results" && selected) {
    return <ResultsView survey={selected} onBack={()=>setView("list")}/>;
  }

  return (
    <div className="space-y-4">
      {showCreate && <CreateModal emp={emp} onClose={()=>setShowCreate(false)} onCreated={s=>{setSurveys(p=>[s,...p]);}}/>}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2"><ClipboardList size={20}/> الاستبيانات</h2>
          <p className="text-xs text-secondary mt-0.5">{surveys.length} استبيان إجمالاً</p>
        </div>
        {isAdmin && (
          <button onClick={()=>setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#C87A2E] text-white rounded-xl text-sm font-bold">
            <Plus size={15}/> استبيان جديد
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-color">
        {[{k:"active",lbl:`نشط (${activeSurveys.length})`},{k:"expired",lbl:`منتهي (${expiredSurveys.length})`}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab===t.k?"border-[#C87A2E] text-[#C87A2E]":"border-transparent text-secondary hover:text-primary"}`}>
            {t.lbl}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-secondary text-sm">جارٍ التحميل...</div>
      ) : displayed.length === 0 ? (
        <div className="card rounded-2xl border border-color p-10 text-center">
          <ClipboardList size={36} className="mx-auto text-secondary mb-3"/>
          <p className="text-secondary text-sm">{tab === "active" ? "لا توجد استبيانات نشطة" : "لا توجد استبيانات منتهية"}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {displayed.map(s => {
            const isDone = doneSurveys.includes(s._key);
            const isExpired = s.deadline && s.deadline < now;
            return (
              <div key={s._key} className="card rounded-2xl border border-color p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base leading-snug">{s.title}</h3>
                    {s.desc && <p className="text-xs text-secondary mt-1 line-clamp-2">{s.desc}</p>}
                  </div>
                  {isDone && <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5"/>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
                  <span>{s.questions?.length || 0} سؤال</span>
                  {s.deadline && <span className="flex items-center gap-1"><Clock size={11}/> {s.deadline}</span>}
                  {s.anonymous && <span className="text-violet-600">مجهول الهوية</span>}
                  {isExpired && <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle size={11}/> منتهي</span>}
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <>
                      <button onClick={()=>{setSelected(s);setView("results");}}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg btn-secondary border border-color">
                        <BarChart2 size={13}/> النتائج
                      </button>
                      <button onClick={()=>handleDelete(s)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-red-200">
                        <Trash2 size={13}/>
                      </button>
                    </>
                  )}
                  {!isExpired && !isDone && (
                    <button onClick={()=>{setSelected(s);setView("take");}}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#C87A2E] text-white mr-auto">
                      <Star size={13}/> أجب الآن
                    </button>
                  )}
                  {isDone && <span className="text-xs text-emerald-600 font-bold mr-auto flex items-center gap-1"><CheckCircle size={12}/> تم الإجابة</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
