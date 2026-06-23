import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { Edit3, Trash2 } from "lucide-react";

export const TS_CODES_ALL = {
  "O": { label:"المقيم الصباحي",          color:"bg-orange-100 text-orange-700",  type:"work" },
  "2": { label:"مناوبة ثنائية",           color:"bg-blue-100 text-blue-700",      type:"work" },
  "3": { label:"مناوبة ثلاثية",           color:"bg-purple-100 text-purple-700",  type:"work" },
  "R": { label:"استراحة",                 color:"bg-gray-100 text-gray-600",      type:"rest" },
  "L": { label:"إجازة اعتيادية",         color:"bg-green-100 text-green-700",    type:"leave" },
  "S": { label:"إجازة مرضية",            color:"bg-red-100 text-red-600",        type:"sick" },
  "Y": { label:"عطلة رسمية",             color:"bg-yellow-100 text-yellow-700",  type:"holiday" },
  "X": { label:"غياب",                   color:"bg-red-200 text-red-800",        type:"absent" },
  "N": { label:"استراحة مناوبة",         color:"bg-slate-100 text-slate-600",    type:"rest" },
  "V": { label:"استراحة مقيم",           color:"bg-slate-200 text-slate-500",    type:"rest" },
  "I": { label:"إيفاد داخل العراق",      color:"bg-indigo-100 text-indigo-700",  type:"leave" },
  "B": { label:"أيام بقسم آخر",          color:"bg-sky-100 text-sky-700",        type:"work" },
  "G": { label:"دورة داخل البصرة",       color:"bg-teal-100 text-teal-700",      type:"leave" },
  "M": { label:"إجازة أمومة",            color:"bg-pink-100 text-pink-700",      type:"leave" },
  "T": { label:"بدون راتب داخلي",        color:"bg-amber-100 text-amber-700",    type:"leave" },
  "H": { label:"بدون راتب خارجي",        color:"bg-amber-200 text-amber-800",    type:"leave" },
  "D": { label:"أيام العدة",             color:"bg-violet-100 text-violet-700",  type:"leave" },
  "7": { label:"إجازة خارج العراق",      color:"bg-emerald-100 text-emerald-700",type:"leave" },
  "J": { label:"مجاز دراسي",            color:"bg-cyan-100 text-cyan-700",      type:"leave" },
  "P": { label:"إيفاد خارج العراق",      color:"bg-indigo-200 text-indigo-800",  type:"leave" },
  "4": { label:"مناطق ساخنة",           color:"bg-orange-200 text-orange-800",  type:"leave" },
  "5": { label:"أيام الحشد الشعبي",      color:"bg-red-50 text-red-600",         type:"leave" },
  "K": { label:"أمومة بأمر إداري",       color:"bg-pink-200 text-pink-800",      type:"leave" },
  "U": { label:"تفرغ",                   color:"bg-lime-100 text-lime-700",      type:"leave" },
  "8": { label:"مصاحبة زوجية",           color:"bg-rose-100 text-rose-700",      type:"leave" },
  "W": { label:"أيام الوفاة",            color:"bg-gray-200 text-gray-700",      type:"leave" },
  "A": { label:"إجازة إعالة",            color:"bg-fuchsia-100 text-fuchsia-700",type:"leave" },
  "Z": { label:"مواظبة (بدون متغيرات)", color:"bg-green-50 text-green-600",     type:"work" },
  "E": { label:"إصابة عمل",             color:"bg-red-300 text-red-900",        type:"sick" },
  "F": { label:"مواظبة (مع متغيرات)",   color:"bg-green-200 text-green-800",    type:"work" },
  "ف": { label:"فاو",                          color:"bg-amber-100 text-amber-700",    type:"work" },
  "ر": { label:"رميلة",                        color:"bg-teal-100 text-teal-700",      type:"work" },
  "ب": { label:"باب الزبير",                   color:"bg-cyan-100 text-cyan-700",      type:"work" },
  "غ": { label:"إجازة/غياب",                  color:"bg-red-100 text-red-700",        type:"absent" },
  "م": { label:"المكينة",                      color:"bg-stone-100 text-stone-800",    type:"work" },
  "ث": { label:"المركز الثقافي النفطي",        color:"bg-lime-200 text-lime-800",      type:"work" },
  "ق": { label:"قسم",                          color:"bg-orange-50 text-orange-600",   type:"work" },
};
export const TS_CODES_GENERAL = ["O","2","3","R","L","S","Y","X","N","V","I","B","G","M","T","H","D","7","J","P","4","5","K","U","8","W","A","Z","E","F"];
export const TS_CODES_DRIVER  = ["م","ث","ف","ر","ب","ق","غ","R","Y","L","S","X","I","M","W","U"];
export const MONTHS_AR_TS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
export const DAY_NAMES_AR = ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت'];
export const SHIFT_TEXT_COLORS = { 'أ':'#dc2626','ب':'#2563eb','ج':'#16a34a','د':'#7c3aed' };

export const getShiftForDay = (year, month, day) => {
  const anchor = new Date(2026, 5, 14);
  const current = new Date(year, month, day);
  const diff = Math.floor((current - anchor) / (1000 * 60 * 60 * 24));
  return ['أ','ب','ج','د'][((diff % 4) + 4) % 4];
};

export const TAB_INFO = {
  malak:     { label:"الملاك",    title:"استمارة ضبط وقت العمال المؤقتين (بعقد)", codes:TS_CODES_GENERAL },
  contracts: { label:"العقود",   title:"استمارة تفاصيل الدوام",                   codes:TS_CODES_GENERAL },
  drivers:   { label:"السائقين", title:"استمارة ضبط الوقت للسيارات المؤجرة",       codes:TS_CODES_DRIVER  },
};

export const INITIAL_TS = {
  malak:[
    {id:"728004",name:"ايهاب عبد اللطيف عودة",movement:"",isMorning:true,days:{"1":"R","2":"Y","7":"L","8":"R","14":"L","15":"R","20":"L","21":"L","22":"R","27":"Y","28":"Y"},hours:{"2":3,"3":2,"4":2,"5":2,"6":2,"9":3,"10":2,"11":2,"12":3,"13":3,"16":3,"17":3,"18":2,"19":3,"23":3,"24":3,"25":2,"26":3,"29":3,"30":3,"31":2},notes:""},
    {id:"727466",name:"عدي فيصل عبد الهادي عبد السيد",movement:"",isMorning:true,days:{"1":"R","2":"Y","4":"L","5":"L","6":"L","7":"L","8":"R","9":"Y","12":"L","14":"L","15":"R","16":"Y","17":"L","18":"L","21":"L","22":"R","23":"Y","25":"L","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{"3":2,"10":2,"11":2,"13":2,"19":2,"20":2,"24":2,"31":2},notes:""},
    {id:"737283",name:"عمر طاهر خزعل",movement:"",isMorning:true,days:{"1":"R","2":"Y","5":"L","8":"R","9":"Y","15":"R","16":"Y","17":"L","22":"R","23":"Y","24":"L","25":"L","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"756571",name:"ليث شاكر حمود",movement:"",isMorning:true,days:{"1":"R","2":"Y","5":"L","8":"R","9":"Y","10":"L","15":"R","16":"Y","18":"L","22":"R","23":"Y","26":"Y","27":"Y","30":"Y"},hours:{"3":2,"4":2,"6":3,"7":2,"11":2,"12":2,"13":1,"14":2,"17":2,"19":1,"20":2,"21":2,"24":1,"25":1,"28":3,"29":3,"31":2},notes:""},
    {id:"813877",name:"محمد اسماعيل احمد",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","10":"L","13":"L","15":"R","16":"Y","20":"L","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"790885",name:"محمد عبدالكاظم جاسم محمد التميمي",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","25":"L","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"719242",name:"احمد محمود عبد القادر",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","17":"L","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{"3":1,"4":1,"5":1,"6":1,"7":1,"10":1,"11":1,"12":1,"13":1,"14":1,"18":1,"19":1,"20":1,"21":1,"24":1,"25":1,"31":1},notes:""},
    {id:"758795",name:"صباح عبد الامام يوسف",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"790850",name:"اسعد عبد الامام يوسف",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"790869",name:"محمود كاظم هاشم محمد المنصوري",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"439193",name:"علي طاهر خزعل",movement:"",isMorning:true,days:{"1":"R","2":"Y","3":"L","8":"R","9":"Y","13":"L","14":"L","15":"R","16":"Y","22":"R","23":"Y","24":"L","26":"Y","28":"Y","30":"Y"},hours:{"4":1,"5":1,"6":1,"7":1,"10":1,"11":1,"12":1,"17":1,"18":1,"19":1,"20":1,"21":1,"25":1,"27":3,"29":3,"31":1},notes:""},
    {id:"701130",name:"عبدالله علي ازباري يسر عبادة",movement:"أ",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"L","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"719277",name:"باسم هاشم جاسم",movement:"",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"3","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"719269",name:"حسين علي احمد",movement:"",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"3","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"719498",name:"جاسم مزعل حاتم ديوان",movement:"",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"3","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"751480",name:"امين حميد فاضل حسين",movement:"",isMorning:true,days:{"1":"3","2":"N","3":"N","4":"N","5":"3","6":"N","7":"N","8":"N","9":"3","10":"N","11":"N","12":"N","13":"3","14":"N","15":"N","16":"N","17":"3","18":"N","19":"N","20":"N","21":"3","22":"N","23":"N","24":"N","25":"3","26":"N","27":"N","28":"N","29":"3","30":"N","31":"N"},hours:{},notes:""},
    {id:"719293",name:"هاشم جابرجعفر",movement:"ب",isMorning:true,days:{"1":"N","2":"3","3":"N","4":"N","5":"N","6":"3","7":"N","8":"N","9":"N","10":"3","11":"N","12":"N","13":"N","14":"3","15":"N","16":"N","17":"N","18":"3","19":"N","20":"N","21":"N","22":"3","23":"N","24":"N","25":"N","26":"3","27":"N","28":"N","29":"N","30":"3","31":"N"},hours:{},notes:""},
    {id:"736732",name:"احسان عبد الصمد داود",movement:"",isMorning:true,days:{"1":"N","2":"3","3":"N","4":"N","5":"N","6":"3","7":"N","8":"N","9":"N","10":"3","11":"N","12":"N","13":"N","14":"3","15":"N","16":"N","17":"N","18":"3","19":"N","20":"N","21":"N","22":"3","23":"N","24":"N","25":"N","26":"3","27":"N","28":"N","29":"N","30":"3","31":"N"},hours:{},notes:""},
    {id:"719048",name:"علاء محسن عذبي جعفر",movement:"",isMorning:true,days:{"1":"N","2":"3","3":"N","4":"N","5":"N","6":"3","7":"N","8":"N","9":"N","10":"3","11":"N","12":"N","13":"N","14":"3","15":"N","16":"N","17":"N","18":"3","19":"N","20":"N","21":"N","22":"3","23":"N","24":"N","25":"N","26":"3","27":"N","28":"N","29":"N","30":"3","31":"N"},hours:{},notes:""},
    {id:"719463",name:"عبد الحميد سامي موسى",movement:"",isMorning:true,days:{"1":"N","2":"3","3":"N","4":"N","5":"N","6":"3","7":"N","8":"N","9":"N","10":"3","11":"N","12":"N","13":"N","14":"3","15":"N","16":"N","17":"N","18":"3","19":"N","20":"N","21":"N","22":"3","23":"N","24":"N","25":"N","26":"3","27":"N","28":"N","29":"N","30":"3","31":"N"},hours:{},notes:""},
    {id:"732249",name:"علي باقر حنتوش",movement:"ج",isMorning:true,days:{"1":"N","2":"N","3":"3","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"726508",name:"يوسف عباس ياسين",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"3","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"735922",name:"علي طارق ياسين",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"L","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"719129",name:"ضياء بدر حمادي اسماعيل",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"3","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"719099",name:"عدنان جواد كاظم",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"3","4":"N","5":"N","6":"N","7":"3","8":"N","9":"N","10":"N","11":"3","12":"N","13":"N","14":"N","15":"3","16":"N","17":"N","18":"N","19":"3","20":"N","21":"N","22":"N","23":"3","24":"N","25":"N","26":"N","27":"3","28":"N","29":"N","30":"N","31":"3"},hours:{},notes:""},
    {id:"732834",name:"احسان جواد كاظم حسين",movement:"د",isMorning:true,days:{"1":"N","2":"N","3":"N","4":"3","5":"N","6":"N","7":"N","8":"3","9":"N","10":"N","11":"N","12":"3","13":"N","14":"N","15":"N","16":"3","17":"N","18":"N","19":"N","20":"3","21":"N","22":"N","23":"N","24":"3","25":"N","26":"N","27":"N","28":"3","29":"N","30":"N","31":"N"},hours:{},notes:""},
    {id:"718939",name:"واثق حسين عبد الشيخ حسن",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"N","4":"3","5":"N","6":"N","7":"N","8":"3","9":"N","10":"N","11":"N","12":"3","13":"N","14":"N","15":"N","16":"3","17":"N","18":"N","19":"N","20":"3","21":"N","22":"N","23":"N","24":"3","25":"N","26":"N","27":"N","28":"3","29":"N","30":"N","31":"N"},hours:{},notes:""},
    {id:"719005",name:"صدام عبد الواحد سلمان عيسى",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"N","4":"3","5":"N","6":"N","7":"N","8":"3","9":"N","10":"N","11":"N","12":"3","13":"N","14":"N","15":"N","16":"3","17":"N","18":"N","19":"N","20":"3","21":"N","22":"N","23":"N","24":"3","25":"N","26":"N","27":"N","28":"3","29":"N","30":"N","31":"N"},hours:{},notes:""},
    {id:"724939",name:"حيدر عبد الحسن خضير",movement:"",isMorning:true,days:{"1":"N","2":"N","3":"N","4":"3","5":"N","6":"N","7":"N","8":"3","9":"N","10":"N","11":"N","12":"3","13":"N","14":"N","15":"N","16":"3","17":"N","18":"N","19":"N","20":"3","21":"N","22":"N","23":"N","24":"3","25":"N","26":"N","27":"N","28":"3","29":"N","30":"N","31":"N"},hours:{},notes:""},
  ],
  contracts:[
    {id:"690414",name:"عبد الله عيسى موسى موني الربيعي",movement:"",isMorning:true,days:{"1":"R","2":"Y","7":"L","8":"R","9":"Y","10":"L","12":"L","15":"R","16":"Y","19":"L","21":"L","22":"R","23":"Y","25":"L","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"689766",name:"اباذر صالح عبد الحسين عيسى",movement:"",isMorning:true,days:{"1":"R","2":"Y","8":"R","9":"Y","15":"R","16":"Y","22":"R","23":"Y","26":"Y","27":"Y","28":"Y","29":"R","30":"Y"},hours:{},notes:""},
    {id:"690174",name:"حسن عادل عمران",movement:"",isMorning:true,days:{"1":"R","8":"R","15":"R","22":"R","29":"R"},hours:{"2":3,"3":2,"4":2,"5":2,"6":2,"7":2,"9":3,"10":2,"11":2,"12":2,"13":2,"14":2,"16":3,"17":2,"18":2,"19":2,"20":2,"21":2,"23":3,"24":1,"25":1,"26":3,"27":3,"28":3,"30":3,"31":1},notes:""},
    {id:"689331",name:"سجاد علي راضي علي",movement:"",isMorning:true,days:{"1":"R","8":"R","15":"R","22":"R","29":"R"},hours:{},notes:""},
  ],
  drivers:[
    {id:"محمد نعيم فاضل",name:"محمد نعيم فاضل",movement:"",days:{},hours:{},notes:""},
    {id:"علي جاسم محمد",name:"علي جاسم محمد",movement:"",days:{},hours:{},notes:""},
  ],
};

export function calcTsStats(emp) {
  const vals = Object.values(emp.days || {});
  return {
    totalHours: Object.values(emp.hours || {}).reduce((a,b) => a+b, 0),
    leaveDays:  vals.filter(v => v === "L").length,
    sickDays:   vals.filter(v => v === "S").length,
    absenceDays:vals.filter(v => ["X","غ"].includes(v)).length,
    restDays:   vals.filter(v => ["R","Y"].includes(v)).length,
    workDays:   vals.filter(v => ["O","2","3","N","V","ف","ر","ب"].includes(v)).length,
  };
}

export function TsCodePicker({ codesArr, current, onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} dir="rtl"
      className="absolute z-[200] bg-white border border-gray-300 rounded-xl shadow-2xl p-2"
      style={{top:"100%", right:"-10px", minWidth:"160px"}}>
      <button onClick={() => onSelect("")}
        className="w-full text-right text-xs text-red-500 hover:text-red-700 mb-1.5 px-1">× مسح الخلية</button>
      <div className="grid grid-cols-3 gap-1">
        {codesArr.map(code => (
          <button key={code} onClick={() => onSelect(code)}
            className={`px-1.5 py-1 rounded-lg text-xs font-bold border-2 transition-all ${TS_CODES_ALL[code]?.color||""} ${current===code?"border-blue-500 scale-105":"border-transparent"}`}>
            <div>{code}</div>
            <div className="text-[8px] font-normal leading-tight">{(TS_CODES_ALL[code]?.label||"").split(" ")[0]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export class TsErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div dir="rtl" className="p-6 text-center">
        <p className="text-red-600 font-bold mb-2">خطأ في تحميل صفحة التايم شيت</p>
        <p className="text-sm text-gray-500 mb-4">{this.state.err?.message}</p>
        <button onClick={()=>{localStorage.removeItem("boc_timesheet_v5");this.setState({err:null});}}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
          مسح البيانات المحلية وإعادة المحاولة
        </button>
      </div>
    );
    return this.props.children;
  }
}

export const TsEmployeeRow = React.memo(function TsEmployeeRow({
  e, idx, days, tsYear, tsMonth, activeTab, editCell, setEditCell,
  updateCell, updateNotes, deleteEmployee, editDriverName, codes
}) {
  const stats = useMemo(() => calcTsStats(e), [e]);
  const bgBase = idx % 2 === 0 ? "#ffffff" : "#FAFAF8";
  const isWeekendDay = useCallback((d) => { const dow = new Date(tsYear, tsMonth, d).getDay(); return dow === 5 || dow === 6; }, [tsYear, tsMonth]);
  const dayIsToday = useCallback((d) => d === new Date().getDate() && tsMonth === new Date().getMonth() && tsYear === new Date().getFullYear(), [tsMonth, tsYear]);

  return (
    <React.Fragment>
      <tr>
        <td rowSpan={2} className="border border-gray-200 text-center text-gray-500 align-middle ts-mono" style={{position:"sticky",right:0,zIndex:5,backgroundColor:bgBase,fontSize:"10px"}}>{e.id}</td>
        <td rowSpan={2} className="border border-gray-200 px-1 text-right font-semibold align-middle" style={{position:"sticky",right:"70px",zIndex:5,backgroundColor:bgBase,maxWidth:"150px",fontSize:"11px"}}>
          {e.name}{e.movement && <span className="mr-1 text-[10px] text-blue-500 font-normal">({e.movement})</span>}
        </td>
        <td className="border border-gray-200 text-center font-black ts-mono" style={{backgroundColor:bgBase,fontSize:"10px",color:"#C87A2E"}}>أ</td>
        {days.map(d => {
          const isWe = isWeekendDay(d);
          const code = (e.days || {})[String(d)] || "";
          const isEd = editCell?.empId === e.id && editCell?.day === d && editCell?.type === "code";
          const cellBg = code ? "" : isWe ? "#fff7ed" : bgBase;
          return (
            <td key={d} className={`border border-gray-200 text-center cursor-pointer relative select-none ts-mono ${code ? TS_CODES_ALL[code]?.color || "" : ""}`}
                style={{height:"22px",minWidth:"30px",backgroundColor:cellBg}}
                onClick={() => setEditCell({empId:e.id,day:d,type:"code",tabKey:activeTab})}>
              <span className="font-bold" style={{fontSize:"11px"}}>{code}</span>
              {isEd && <TsCodePicker codesArr={codes} current={code} onSelect={v=>{updateCell(activeTab,e.id,d,"code",v);setEditCell(null);}} onClose={()=>setEditCell(null)}/>}
            </td>
          );
        })}
        <td rowSpan={2} className="border border-gray-200 text-center font-bold ts-mono align-middle" style={{backgroundColor:bgBase,color:"#C87A2E"}}>{stats.totalHours||""}</td>
        <td rowSpan={2} className="border border-gray-200 text-center ts-mono font-medium align-middle" style={{backgroundColor:bgBase,color:"#15803d"}}>{stats.leaveDays||""}</td>
        <td rowSpan={2} className="border border-gray-200 text-center ts-mono font-medium align-middle" style={{backgroundColor:bgBase,color:"#dc2626"}}>{stats.absenceDays||""}</td>
        <td rowSpan={2} className="border border-gray-200 text-center ts-mono font-medium align-middle" style={{backgroundColor:bgBase,color:"#6b7280"}}>{stats.restDays||""}</td>
        <td rowSpan={2} className="border border-gray-200 px-1 align-middle" style={{backgroundColor:bgBase}}>
          <input value={e.notes||""} onChange={ev=>updateNotes(activeTab,e.id,ev.target.value)} className="w-full text-xs bg-transparent outline-none text-gray-500" placeholder="ملاحظة..." style={{minWidth:"90px"}}/>
        </td>
        <td rowSpan={2} className="border border-gray-200 text-center align-middle" style={{backgroundColor:bgBase}}>
          {activeTab==="drivers" && <button onClick={()=>editDriverName(activeTab,e.id,e.name)} className="text-blue-400 hover:text-blue-600 p-0.5 block mx-auto mb-0.5" title="تعديل الاسم"><Edit3 size={12}/></button>}
          <button onClick={()=>deleteEmployee(activeTab,e.id,e.name)} className="text-red-400 hover:text-red-600 p-0.5 block mx-auto" title="حذف"><Trash2 size={12}/></button>
        </td>
      </tr>
      <tr>
        <td className="border border-gray-200 text-center font-black ts-mono" style={{backgroundColor:bgBase,fontSize:"10px",color:"#7c3aed"}}>ق</td>
        {days.map(d => {
          const isWe = isWeekendDay(d);
          const h = (e.hours || {})[String(d)];
          const isEd = editCell?.empId === e.id && editCell?.day === d && editCell?.type === "hours";
          const cellBg = h != null ? "#f5f3ff" : isWe ? "#FFF3E6" : bgBase;
          return (
            <td key={d} className={`border border-gray-200 text-center cursor-pointer relative ts-mono ${h != null ? "text-purple-700" : ""}`}
                style={{height:"20px",minWidth:"30px",backgroundColor:cellBg}}
                onClick={() => setEditCell({empId:e.id,day:d,type:"hours",tabKey:activeTab})}>
              {isEd ? (
                <input type="number" min="0" max="24" defaultValue={h??""} autoFocus
                  className="w-full h-full text-center bg-yellow-100 border-0 outline-none text-purple-700 font-bold"
                  style={{fontSize:"11px",width:"30px"}}
                  onBlur={ev=>{updateCell(activeTab,e.id,d,"hours",ev.target.value);setEditCell(null);}}
                  onKeyDown={ev=>{if(ev.key==="Enter"){updateCell(activeTab,e.id,d,"hours",ev.target.value);setEditCell(null);}else if(ev.key==="Escape")setEditCell(null);}}/>
              ) : (
                <span className="font-semibold" style={{fontSize:"11px"}}>{h!=null?h:""}</span>
              )}
            </td>
          );
        })}
      </tr>
    </React.Fragment>
  );
}, (prev, next) => {
  if (prev.e !== next.e) return false;
  if (prev.idx !== next.idx) return false;
  if (prev.tsYear !== next.tsYear || prev.tsMonth !== next.tsMonth) return false;
  if (prev.days !== next.days) return false;
  if (prev.codes !== next.codes) return false;
  if (prev.activeTab !== next.activeTab) return false;
  const prevHasEdit = prev.editCell?.empId === prev.e.id;
  const nextHasEdit = next.editCell?.empId === next.e.id;
  if (prevHasEdit !== nextHasEdit) return false;
  if (prevHasEdit && nextHasEdit && (prev.editCell.day !== next.editCell.day || prev.editCell.type !== next.editCell.type)) return false;
  return true;
});
