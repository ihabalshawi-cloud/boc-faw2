import React, { useState } from "react";
import { ClipboardList, CheckCircle2 } from "lucide-react";

const QUESTIONS = [
  { id: "q1",  cat: "الحضور والانضباط",       text: "هل حافظت على مواعيد الدوام والحضور المنتظم طوال الشهر؟" },
  { id: "q2",  cat: "الحضور والانضباط",       text: "هل أنجزت جميع مهامك في أوقاتها المحددة دون تأخير؟" },
  { id: "q3",  cat: "المشاركة وإنجاز العمل",  text: "هل شاركت بفاعلية في الأعمال الموكلة إليك خلال هذا الشهر؟" },
  { id: "q4",  cat: "المشاركة وإنجاز العمل",  text: "هل ساهمت بشكل ملموس في تحقيق أهداف قسمك الشهرية؟" },
  { id: "q5",  cat: "المبادرة والإبداع",       text: "هل بادرت بتقديم مقترحات أو حلول لتحسين العمل؟" },
  { id: "q6",  cat: "المبادرة والإبداع",       text: "هل تصرفت باستقلالية لحل المشكلات دون انتظار التوجيه؟" },
  { id: "q7",  cat: "العمل الجماعي والتعاون", text: "هل تعاونت مع زملائك وأسهمت في إنجاز الأعمال المشتركة؟" },
  { id: "q8",  cat: "العمل الجماعي والتعاون", text: "هل بادرت بمساعدة زملائك عند الحاجة؟" },
  { id: "q9",  cat: "جودة العمل والالتزام",   text: "هل حرصت على الدقة وجودة عملك وتجنبت الأخطاء؟" },
  { id: "q10", cat: "جودة العمل والالتزام",   text: "هل التزمت بالتعليمات والسياسات الإدارية خلال الشهر؟" },
];

const CHOICES = [
  { value: 2, label: "نعم",     cls: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700" },
  { value: 1, label: "أحياناً", cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700" },
  { value: 0, label: "لا",      cls: "bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700" },
];

export function calcSurveyScore(answers) {
  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  return Math.round((total / (QUESTIONS.length * 2)) * 100);
}

export function EvaluationSurvey({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const answered = Object.keys(answers).length;
  const allDone  = answered === QUESTIONS.length;
  const cats     = [...new Set(QUESTIONS.map(q => q.cat))];

  const submit = () => onComplete(answers, calcSurveyScore(answers));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="card rounded-xl border border-color p-4">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={18} className="text-[#C87A2E]"/>
          <h2 className="font-bold text-primary text-sm">استبيان الأداء الشهري — الخطوة 1 من 2</h2>
        </div>
        <p className="text-xs text-secondary mb-3">أجب بصدق على الأسئلة — نتيجة الاستبيان تُحسب كـ 30% من تقييمك النهائي</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#C87A2E] transition-all duration-300"
              style={{width:`${(answered / QUESTIONS.length) * 100}%`}}/>
          </div>
          <span className="text-xs text-secondary shrink-0">{answered}/{QUESTIONS.length}</span>
        </div>
      </div>

      {cats.map(cat => {
        const qs = QUESTIONS.filter(q => q.cat === cat);
        return (
          <div key={cat} className="card rounded-xl border border-color p-4 space-y-4">
            <h3 className="text-xs font-bold text-[#C87A2E] border-b border-color pb-2">{cat}</h3>
            {qs.map(q => {
              const num    = QUESTIONS.indexOf(q) + 1;
              const chosen = answers[q.id];
              return (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm text-primary">{num}. {q.text}</p>
                  <div className="flex gap-2">
                    {CHOICES.map(c => (
                      <button key={c.value}
                        onClick={() => setAnswers(p => ({...p, [q.id]: c.value}))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          chosen === c.value
                            ? c.cls + " ring-2 ring-offset-1 ring-current"
                            : "border-color text-secondary hover:bg-hover"
                        }`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <button onClick={submit} disabled={!allDone}
        className="w-full py-3 rounded-xl font-bold text-sm bg-[#C87A2E] text-white hover:bg-[#B06D27] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
        {allDone
          ? <><CheckCircle2 size={15}/> المضي إلى التقييم الذاتي</>
          : `أكمل الإجابة (${QUESTIONS.length - answered} سؤال متبقٍ)`}
      </button>
    </div>
  );
}
