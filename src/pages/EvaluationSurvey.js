import React, { useState } from "react";
import { CheckCircle } from "lucide-react";

const QUESTIONS = [
  { id: 1, cat: "الحضور والانضباط",       text: "هل تلتزم بمواعيد الدوام الرسمي؟" },
  { id: 2, cat: "الحضور والانضباط",       text: "هل تُنهي مهامك في الوقت المحدد؟" },
  { id: 3, cat: "إنجاز العمل",            text: "هل تُكمل المهام المطلوبة منك بالشكل الصحيح؟" },
  { id: 4, cat: "إنجاز العمل",            text: "هل تُشارك في المهام الإضافية حين يستدعي العمل؟" },
  { id: 5, cat: "المبادرة والإبداع",      text: "هل تقدّم مقترحات لتحسين طريقة العمل؟" },
  { id: 6, cat: "المبادرة والإبداع",      text: "هل تبحث عن حلول المشكلات بنفسك قبل طلب المساعدة؟" },
  { id: 7, cat: "العمل الجماعي",          text: "هل تتعاون مع زملائك في إنجاز الأعمال المشتركة؟" },
  { id: 8, cat: "العمل الجماعي",          text: "هل تُساعد زملاءك عند الحاجة؟" },
  { id: 9, cat: "جودة العمل والالتزام",   text: "هل تُراجع عملك قبل تسليمه للتأكد من دقته؟" },
  { id:10, cat: "جودة العمل والالتزام",   text: "هل تلتزم بسياسات وأنظمة العمل المعتمدة؟" },
];
const CHOICES = [
  { value: 2, label: "نعم",      cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { value: 1, label: "أحياناً",  cls: "bg-amber-100  text-amber-800  border-amber-300"  },
  { value: 0, label: "لا",       cls: "bg-red-100    text-red-800    border-red-300"    },
];

export function calcSurveyScore(answers) {
  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  return Math.round((total / (QUESTIONS.length * 2)) * 100);
}

const CATS = [...new Set(QUESTIONS.map(q => q.cat))];

export function EvaluationSurvey({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const answered = Object.keys(answers).length;
  const allDone = answered === QUESTIONS.length;

  const submit = () => {
    if (!allDone) return;
    const score = calcSurveyScore(answers);
    onComplete({ answers, score });
  };

  return (
    <div className="card rounded-2xl border-2 border-indigo-200 p-5 space-y-5">
      <div>
        <p className="font-bold text-indigo-700 mb-1">📋 استبيان الأداء الشهري</p>
        <p className="text-xs text-secondary">أجب بصدق — يؤثر بنسبة 30% في تقييمك النهائي</p>
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all rounded-full"
               style={{ width: `${(answered / QUESTIONS.length) * 100}%` }}/>
        </div>
        <p className="text-[10px] text-secondary mt-1">{answered} / {QUESTIONS.length} سؤال</p>
      </div>
      {CATS.map(cat => (
        <div key={cat} className="space-y-3">
          <p className="text-xs font-bold text-indigo-600 border-b border-color pb-1">{cat}</p>
          {QUESTIONS.filter(q => q.cat === cat).map(q => (
            <div key={q.id} className="space-y-2">
              <p className="text-sm">{q.id}. {q.text}</p>
              <div className="flex gap-2">
                {CHOICES.map(c => (
                  <button key={c.value}
                    onClick={() => setAnswers(p => ({ ...p, [q.id]: c.value }))}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all
                      ${answers[q.id] === c.value ? c.cls + " font-extrabold shadow-sm" : "border-color text-secondary hover:bg-indigo-50"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
      <button onClick={submit} disabled={!allDone}
        className="w-full py-3 font-bold text-white bg-indigo-600 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
        <CheckCircle size={15}/> إرسال الاستبيان والمتابعة
      </button>
    </div>
  );
}
