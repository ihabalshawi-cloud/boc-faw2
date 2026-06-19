import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, Calendar, X, AlertTriangle, FileCheck, Printer, Upload, Plus, Trash2, Edit3, Bell } from "lucide-react";
import { useToast, useConfirm } from "../contexts";
import { storage } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useGDrive } from "../gdrive";

const TS_CODES_ALL = {
  "O": { label:"المقيم الصباحي",  color:"bg-orange-100 text-orange-700",  type:"work" },
  "2": { label:"مناوبة ثنائية",   color:"bg-blue-100 text-blue-700",      type:"work" },
  "3": { label:"مناوبة ثلاثية",   color:"bg-purple-100 text-purple-700",  type:"work" },
  "R": { label:"استراحة",         color:"bg-gray-100 text-gray-600",      type:"rest" },
  "L": { label:"إجازة اعتيادية", color:"bg-green-100 text-green-700",    type:"leave" },
  "S": { label:"إجازة مرضية",    color:"bg-red-100 text-red-600",        type:"sick" },
  "Y": { label:"عطلة رسمية",     color:"bg-yellow-100 text-yellow-700",  type:"holiday" },
  "X": { label:"غياب",           color:"bg-red-200 text-red-800",        type:"absent" },
  "N": { label:"استراحة مناوبة", color:"bg-slate-100 text-slate-600",    type:"rest" },
  "V": { label:"استراحة مقيم",   color:"bg-slate-200 text-slate-500",    type:"rest" },
  "ف": { label:"فاو",            color:"bg-amber-100 text-amber-700",    type:"work" },
  "ر": { label:"رميلة",          color:"bg-teal-100 text-teal-700",      type:"work" },
  "ب": { label:"باب الزبير",     color:"bg-cyan-100 text-cyan-700",      type:"work" },
  "غ": { label:"إجازة/غياب",    color:"bg-red-100 text-red-700",        type:"absent" },
};
const TS_CODES_GENERAL = ["O","2","3","R","L","S","Y","X","N","V"];
const TS_CODES_DRIVER  = ["ف","ر","ب","غ","R","Y","L","S","X"];
const MONTHS_AR_TS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAY_NAMES_AR = ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت'];
const getShiftForDay = (year, month, day) => {
  const anchor = new Date(2026, 5, 14);
  const current = new Date(year, month, day);
  const diff = Math.floor((current - anchor) / (1000 * 60 * 60 * 24));
  return ['أ','ب','ج','د'][((diff % 4) + 4) % 4];
};
const SHIFT_TEXT_COLORS = { 'أ':'#dc2626','ب':'#2563eb','ج':'#16a34a','د':'#7c3aed' };

const INITIAL_TS = {
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
    {id:"689331",name:"سجاد علي راضي علي",movement:"",isMorning:true,days:{"1":"R","8":"R","15":"R","22":"R","29":"R"},hours:{"2":3,"3":2,"4":2,"5":2,"6":2,"7":2,"9":3,"10":2,"11":2,"12":2,"13":2,"14":2,"16":3,"17":2,"18":2,"19":2,"20":2,"21":2,"23":3,"24":1,"25":1,"26":3,"27":3,"28":3,"30":3,"31":1},notes:""},
  ],
  drivers:[
    {id:"محمد نعيم فاضل",name:"محمد نعيم فاضل",movement:"",days:{},hours:{},notes:""},
    {id:"علي جاسم محمد",name:"علي جاسم محمد",movement:"",days:{},hours:{},notes:""},
  ],
};

function calcTsStats(emp) {
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

function TsCodePicker({ codesArr, current, onSelect, onClose }) {
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

class TsErrorBoundary extends React.Component {
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

const TsEmployeeRow = React.memo(function TsEmployeeRow({
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

function TimeSheetPage({ emp }) {
  const addToast = useToast();
  const confirm  = useConfirm();
  const gDrive   = useGDrive();
  const STORAGE_KEY = "boc_timesheet_v5";

  const [tsMonth, setTsMonth] = useState(() => new Date().getMonth());
  const [tsYear,  setTsYear]  = useState(() => new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("malak");
  const [data, setData] = useState(() => {
    // Firebase converts arrays to {0:…,1:…} — restore before using as state.
    // Also filter out null/sparse entries Firebase may leave behind after deletions.
    const toArr = (v) => {
      let arr;
      if (Array.isArray(v)) arr = v;
      else if (v && typeof v === "object") {
        const ks = Object.keys(v);
        if (ks.length > 0 && ks.every(k => /^\d+$/.test(k)))
          arr = ks.sort((a,b)=>Number(a)-Number(b)).map(k=>v[k]);
        else arr = [];
      } else arr = [];
      return arr.filter(e => e && typeof e === "object").map(e => ({
        ...e, days: e.days || {}, hours: e.hours || {},
      }));
    };
    const raw = storage.get(STORAGE_KEY, null);
    if (!raw || typeof raw !== "object") return INITIAL_TS;
    const malak     = toArr(raw.malak);
    const contracts = toArr(raw.contracts);
    const drivers   = toArr(raw.drivers);
    return {
      malak:     malak.length     ? malak     : INITIAL_TS.malak,
      contracts: contracts.length ? contracts : INITIAL_TS.contracts,
      drivers:   drivers.length   ? drivers   : INITIAL_TS.drivers,
    };
  });
  const [editCell, setEditCell] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [searchEmp, setSearchEmp] = useState("");
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importDriveId, setImportDriveId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportDriveId, setExportDriveId] = useState("");
  const exportFileRef = useRef(null);
  const fileInputRef = useRef(null);

  // أي تعديل على التايم شيت يُحفظ محلياً فوراً + يُرفع إلى قاعدة البيانات ليبقى ثابتاً ولا يختفي بعد التحديث
  const persistTs = useCallback((updated) => {
    storage.set(STORAGE_KEY, updated);
    FirebaseAPI.saveTimesheet(updated);
  }, []);
  useEffect(() => {
    FirebaseAPI.loadTimesheet().then(d => {
      if (d && Array.isArray(d.malak) && d.malak.length) {
        setData(d); storage.set(STORAGE_KEY, d);
      }
    });
  }, []);

  // ── Import from Excel (local file or Google Drive) ──────────────────────────
  const importFromBuffer = async (buffer) => {
    setImporting(true);
    try {
      const { read, utils } = await import("xlsx");
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws, { header: 1, defval: "" });
      // Build lookup: empId → rowIndex (code row) and rowIndex+1 (hours row)
      // Columns: A=0(id), B=1(name), C=2..., D=3, E..AI = days 1-31 (cols 4-34)
      const DAY_COL_START = 4; // column E = index 4
      const buildUpdate = (tabKey) => {
        const tabEmps = data[tabKey] || [];
        return tabEmps.map(emp => {
          // Find matching row by employee ID
          const codeRowIdx = rows.findIndex(r => String(r[0]).trim() === String(emp.id).trim());
          if (codeRowIdx === -1) return emp;
          const codeRow  = rows[codeRowIdx];
          const hoursRow = rows[codeRowIdx + 1] || [];
          const newDays  = { ...emp.days };
          const newHours = { ...emp.hours };
          for (let d = 1; d <= 31; d++) {
            const col  = DAY_COL_START + (d - 1);
            const code = String(codeRow[col] || "").trim();
            const h    = String(hoursRow[col] || "").trim();
            if (code) newDays[String(d)] = code;
            else delete newDays[String(d)];
            const hNum = parseInt(h);
            if (!isNaN(hNum) && hNum > 0) newHours[String(d)] = hNum;
            else delete newHours[String(d)];
          }
          return { ...emp, days: newDays, hours: newHours };
        });
      };
      const updated = {
        malak:     buildUpdate("malak"),
        contracts: buildUpdate("contracts"),
        drivers:   buildUpdate("drivers"),
      };
      persistTs(updated);
      setData(updated);
      setShowImport(false);
      addToast("تم استيراد بيانات التايم شيت من Excel ✅", "success");
    } catch (e) {
      addToast("فشل الاستيراد: " + e.message, "error");
    } finally {
      setImporting(false);
    }
  };

  const importFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importFromBuffer(ev.target.result);
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const importFromDrive = async () => {
    if (!importDriveId.trim()) { addToast("أدخل File ID من Drive", "warning"); return; }
    if (!gDrive?.isReady) { addToast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setImporting(true);
    try {
      const buf = await gDrive.downloadFile(importDriveId.trim());
      await importFromBuffer(buf);
    } catch (e) {
      addToast("فشل تنزيل الملف من Drive: " + e.message, "error");
      setImporting(false);
    }
  };

  // ── Export data INTO an existing Excel template ──────────────────────────────
  const exportToTemplate = async (buffer) => {
    setExporting(true);
    try {
      const mod = await import("exceljs");
      const ExcelJS = mod.default || mod;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.worksheets[0];

      // ExcelJS: إسناد القيمة فقط لا يمس التنسيق إطلاقاً
      const DAY_COL_START = 5; // العمود E = 5 (تعداد ExcelJS من 1)
      const emps = data[activeTab] || [];

      // نبني فهرس: id الموظف → رقم الصف
      const colAVals = ws.getColumn(1).values; // فهرسة تبدأ من 1
      emps.forEach(emp => {
        const codeRowIdx = colAVals.findIndex(
          (v, i) => i > 0 && String(v ?? "").trim() === String(emp.id).trim()
        );
        if (codeRowIdx === -1) return;
        const hoursRowIdx = codeRowIdx + 1;
        for (let d = 1; d <= 31; d++) {
          const col  = DAY_COL_START + (d - 1);
          const code = (emp.days  || {})[String(d)] || "";
          const h    = (emp.hours || {})[String(d)];
          ws.getCell(codeRowIdx,  col).value = code || null;
          ws.getCell(hoursRowIdx, col).value = (h != null && h > 0) ? h : null;
        }
      });

      const outBuf = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([outBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement("a");
      a.href = url;
      a.download = `تايم_شيت_${TAB_INFO[activeTab].label}_${tsYear}_${String(tsMonth+1).padStart(2,"0")}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      addToast("تم تصدير البيانات إلى قالب Excel ✅", "success");
      setShowExport(false);
    } catch (e) {
      addToast("فشل التصدير: " + e.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const exportFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => exportToTemplate(ev.target.result);
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const exportFromDrive = async () => {
    if (!exportDriveId.trim()) { addToast("أدخل File ID من Drive", "warning"); return; }
    if (!gDrive?.isReady) { addToast("يرجى ربط Google Drive أولاً", "warning"); return; }
    setExporting(true);
    try {
      const buf = await gDrive.downloadFile(exportDriveId.trim());
      await exportToTemplate(buf);
    } catch (e) {
      addToast("فشل تنزيل القالب من Drive: " + e.message, "error");
      setExporting(false);
    }
  };

  const TAB_INFO = {
    malak:     { label:"الملاك",     title:"استمارة ضبط وقت العمال المؤقتين (بعقد)", codes:TS_CODES_GENERAL },
    contracts: { label:"العقود",    title:"استمارة تفاصيل الدوام",                   codes:TS_CODES_GENERAL },
    drivers:   { label:"السواقين",  title:"استمارة ضبط الوقت للسيارات المؤجرة",       codes:TS_CODES_DRIVER  },
  };

  useEffect(() => {
    const today = new Date();
    if (today.getDate() === 25) {
      addToast("تذكير: اليوم الخامس والعشرون — يُرجى تصدير تقرير التايم شيت", "warning");
    }
  }, []);

  const daysInMonth = useMemo(() => new Date(tsYear, tsMonth + 1, 0).getDate(), [tsYear, tsMonth]);
  const days = useMemo(() => Array.from({length: daysInMonth}, (_, i) => i + 1), [daysInMonth]);

  const employees = useMemo(() => {
    const list = data[activeTab] || [];
    if (!searchEmp.trim()) return list;
    return list.filter(e => e.name.includes(searchEmp.trim()) || e.id.includes(searchEmp.trim()));
  }, [data, activeTab, searchEmp]);

  const updateCell = useCallback((tabKey, empId, day, field, value) => {
    setData(prev => {
      const updated = {
        ...prev,
        [tabKey]: prev[tabKey].map(e => {
          if (e.id !== empId) return e;
          if (field === "code") {
            const newDays = {...e.days};
            if (value === "") delete newDays[String(day)];
            else newDays[String(day)] = value;
            return {...e, days: newDays};
          } else {
            const newHours = {...e.hours};
            const n = parseInt(value);
            if (!value || isNaN(n)) delete newHours[String(day)];
            else newHours[String(day)] = n;
            return {...e, hours: newHours};
          }
        })
      };
      persistTs(updated);
      return updated;
    });
  }, [persistTs]);

  const updateNotes = useCallback((tabKey, empId, notes) => {
    setData(prev => {
      const updated = {...prev, [tabKey]: prev[tabKey].map(e => e.id===empId ? {...e, notes} : e)};
      persistTs(updated);
      return updated;
    });
  }, [persistTs]);

  const addEmployee = (tabKey) => {
    const id = prompt("أدخل الرقم الوظيفي (أو الاسم للسائقين):");
    if (!id?.trim()) return;
    const name = prompt("أدخل الاسم الكامل:");
    if (!name?.trim()) return;
    const newEmp = {id:id.trim(), name:name.trim(), movement:"", days:{}, hours:{}, notes:""};
    setData(prev => {
      const updated = {...prev, [tabKey]: [...prev[tabKey], newEmp]};
      persistTs(updated);
      return updated;
    });
    addToast("تمت إضافة الموظف", "success");
  };

  const deleteEmployee = useCallback(async (tabKey, empId, empName) => {
    const ok = await confirm(`هل تريد حذف ${empName}؟`);
    if (!ok) return;
    setData(prev => {
      const updated = {...prev, [tabKey]: prev[tabKey].filter(e => e.id !== empId)};
      persistTs(updated);
      return updated;
    });
    addToast("تم حذف الموظف", "success");
  }, [confirm, addToast, persistTs]);

  const editDriverName = useCallback((tabKey, empId, currentName) => {
    const newName = prompt("تعديل اسم السائق:", currentName);
    if (!newName?.trim() || newName.trim() === currentName) return;
    setData(prev => {
      const updated = {
        ...prev,
        [tabKey]: prev[tabKey].map(e => e.id === empId ? {...e, name:newName.trim(), id:newName.trim()} : e)
      };
      persistTs(updated);
      return updated;
    });
    addToast("تم تعديل اسم السائق", "success");
  }, [persistTs, addToast]);

  const summaryStats = useMemo(() => {
    const list = data[activeTab] || [];
    const allStats = list.map(e => calcTsStats(e));
    return {
      total:  list.length,
      hours:  allStats.reduce((s, st) => s + st.totalHours, 0),
      leave:  allStats.reduce((s, st) => s + st.leaveDays,  0),
      absent: allStats.reduce((s, st) => s + st.absenceDays,0),
      rest:   allStats.reduce((s, st) => s + st.restDays,   0),
    };
  }, [data, activeTab]);

  const resetData = async () => {
    const ok = await confirm("هل تريد إعادة تعيين جميع البيانات للبيانات الأصلية؟");
    if (!ok) return;
    persistTs(INITIAL_TS);
    setData(INITIAL_TS);
    addToast("تمت إعادة التعيين للبيانات الأصلية", "success");
  };

  const resetTab = async () => {
    const ok = await confirm(`هل تريد تصفير جميع رموز الحضور لتبويب ${TAB_INFO[activeTab].label}؟`);
    if (!ok) return;
    setData(prev => {
      const updated = {
        ...prev,
        [activeTab]: prev[activeTab].map(e => ({...e, days:{}, hours:{}}))
      };
      persistTs(updated);
      return updated;
    });
    addToast(`تم تصفير بيانات ${TAB_INFO[activeTab].label}`, "success");
  };

  const fillWeekend = async () => {
    const morningCount = (data[activeTab]||[]).filter(e=>e.isMorning).length;
    if (morningCount === 0) { addToast("لا يوجد كادر صباحي في هذا التبويب", "warning"); return; }
    const ok = await confirm(`ملء أيام الجمعة (R) والسبت (Y) للكادر الصباحي في ${TAB_INFO[activeTab].label}؟`);
    if (!ok) return;
    setData(prev => {
      const updated = {
        ...prev,
        [activeTab]: prev[activeTab].map(e => {
          if (!e.isMorning) return e;
          const newDays = {...e.days};
          days.forEach(d => {
            const dow = new Date(tsYear, tsMonth, d).getDay();
            if (dow === 5) newDays[String(d)] = "R";
            if (dow === 6) newDays[String(d)] = "Y";
          });
          return {...e, days: newDays};
        })
      };
      persistTs(updated);
      return updated;
    });
    addToast("تم ملء رموز عطلة نهاية الأسبوع للكادر الصباحي", "success");
  };

  const buildHTMLTable = (tab) => {
    const emps = data[tab] || [];
    const title = TAB_INFO[tab].title;
    const monthLabel = MONTHS_AR_TS[tsMonth];
    const daysList = days;

    const codeStyle = (code) => {
      if (!code) return "";
      const c = TS_CODES_ALL[code];
      if (!c) return "";
      const map = {
        "bg-orange-100 text-orange-700": "background:#ffedd5;color:#c2410c",
        "bg-blue-100 text-blue-700": "background:#dbeafe;color:#1d4ed8",
        "bg-purple-100 text-purple-700": "background:#f3e8ff;color:#7e22ce",
        "bg-gray-100 text-gray-600": "background:#f3f4f6;color:#4b5563",
        "bg-green-100 text-green-700": "background:#dcfce7;color:#15803d",
        "bg-red-100 text-red-600": "background:#fee2e2;color:#dc2626",
        "bg-yellow-100 text-yellow-700": "background:#fef9c3;color:#a16207",
        "bg-red-200 text-red-800": "background:#fecaca;color:#991b1b",
        "bg-slate-100 text-slate-600": "background:#f1f5f9;color:#475569",
        "bg-slate-200 text-slate-500": "background:#e2e8f0;color:#64748b",
        "bg-amber-100 text-amber-700": "background:#fef3c7;color:#b45309",
        "bg-teal-100 text-teal-700": "background:#ccfbf1;color:#0f766e",
        "bg-cyan-100 text-cyan-700": "background:#cffafe;color:#0e7490",
        "bg-red-100 text-red-700": "background:#fee2e2;color:#b91c1c",
      };
      return map[c.color] || "";
    };

    const cellStyle = "border:1px solid #d1d5db;padding:2px;text-align:center;font-size:11px;min-width:26px;";

    let rows = "";
    emps.forEach((e, idx) => {
      const stats = calcTsStats(e);
      const bg = idx%2===0 ? "#fff" : "#f9fafb";
      rows += `<tr style="background:${bg}">`;
      rows += `<td rowspan="2" style="${cellStyle}font-size:10px;color:#6b7280;">${e.id}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}text-align:right;font-weight:600;min-width:130px;font-size:12px;">${e.name}</td>`;
      rows += `<td style="${cellStyle}color:#2563eb;font-weight:bold;">أ</td>`;
      daysList.forEach(d => {
        const dow = new Date(tsYear, tsMonth, d).getDay();
        const isWe = dow===5||dow===6;
        const code = e.days[String(d)] || "";
        const cs = codeStyle(code);
        const weBg = isWe && !code ? "background:#fff7ed;" : "";
        rows += `<td style="${cellStyle}${cs||weBg}font-weight:bold;">${code}</td>`;
      });
      rows += `<td rowspan="2" style="${cellStyle}color:#1d4ed8;font-weight:bold;">${stats.totalHours||""}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}color:#15803d;">${stats.leaveDays||""}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}color:#dc2626;">${stats.absenceDays||""}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}color:#6b7280;">${stats.restDays||""}</td>`;
      rows += `<td rowspan="2" style="${cellStyle}text-align:right;font-size:10px;color:#6b7280;">${e.notes||""}</td>`;
      rows += `</tr>`;
      rows += `<tr style="background:${bg}">`;
      rows += `<td style="${cellStyle}color:#7c3aed;font-weight:bold;">ق</td>`;
      daysList.forEach(d => {
        const dow = new Date(tsYear, tsMonth, d).getDay();
        const isWe = dow===5||dow===6;
        const h = e.hours[String(d)];
        const weBg = isWe && h==null ? "background:#fff7ed;" : "";
        rows += `<td style="${cellStyle}${h!=null?"background:#f5f3ff;color:#7c3aed;font-weight:600":weBg}">${h!=null?h:""}</td>`;
      });
      rows += `</tr>`;
    });

    const dayHeaders = daysList.map(d => {
      const dow = new Date(tsYear, tsMonth, d).getDay();
      const shift = getShiftForDay(tsYear, tsMonth, d);
      const isWe = dow===5||dow===6;
      const weBg = isWe ? "background:#fff7ed;" : "background:#eff6ff;";
      const dayColor = isWe ? "color:#ea580c;" : "";
      const shiftColor = `color:${SHIFT_TEXT_COLORS[shift]||"#374151"};`;
      return `<th style="border:1px solid #d1d5db;padding:1px;text-align:center;font-size:9px;min-width:28px;${weBg}"><div style="font-weight:bold;font-size:10px;${dayColor}">${d}</div><div style="font-size:8px;${dayColor}">${DAY_NAMES_AR[dow]}</div><div style="font-size:8px;font-weight:bold;${shiftColor}">${shift}</div></th>`;
    }).join("");

    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<style>body{font-family:Arial,sans-serif;direction:rtl;} table{border-collapse:collapse;width:100%;} th{padding:4px;border:1px solid #9ca3af;font-size:12px;}</style>
</head><body>
<h3 style="text-align:center;margin-bottom:4px;">${title}</h3>
<p style="text-align:center;margin-bottom:8px;font-size:13px;">شهر ${monthLabel} ${tsYear}</p>
<table>
<thead><tr style="background:#dbeafe;">
  <th style="border:1px solid #9ca3af;padding:4px;min-width:68px;">الرقم الوظيفي</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:130px;">الاسم</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:30px;">ح/ق</th>
  ${dayHeaders}
  <th style="border:1px solid #9ca3af;padding:4px;min-width:50px;">الساعات</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">إجازة</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">غياب</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:40px;">عطل</th>
  <th style="border:1px solid #9ca3af;padding:4px;min-width:80px;">ملاحظات</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;
  };

  const exportExcel = () => {
    const html = buildHTMLTable(activeTab);
    const blob = new Blob(["﻿" + html], {type:"application/vnd.ms-excel;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تايم_شيت_${TAB_INFO[activeTab].label}_${tsYear}_${String(tsMonth+1).padStart(2,"0")}.xls`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast("تم تصدير الملف بتنسيق Excel", "success");
  };

  const exportExcelFormatted = () => {
    const emps = data[activeTab] || [];
    const monthLabel = MONTHS_AR_TS[tsMonth];
    const yearNum = tsYear;
    const daysInMonthEx = new Date(tsYear, tsMonth + 1, 0).getDate();
    const daysEx = Array.from({ length: daysInMonthEx }, (_, i) => i + 1);

    const getShiftForDayExport = (year, month, day) => {
      const anchor = new Date(2026, 5, 14);
      const current = new Date(year, month, day);
      const diff = Math.floor((current - anchor) / (1000 * 60 * 60 * 24));
      return ['أ', 'ب', 'ج', 'د'][((diff % 4) + 4) % 4];
    };

    const getDayName = (day) => {
      const dow = new Date(tsYear, tsMonth, day).getDay();
      return ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dow];
    };

    const isWeekend = (day) => {
      const dow = new Date(tsYear, tsMonth, day).getDay();
      return dow === 5 || dow === 6;
    };

    let employeeRows = '';
    emps.forEach((e, idx) => {
      const stats = calcTsStats(e);
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb';

      employeeRows += `
        <tr style="background:${bgColor};">
          <td rowspan="2" style="border:1px solid #000;text-align:center;vertical-align:middle;font-size:10px;">${e.id}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:right;vertical-align:middle;font-size:11px;font-weight:bold;">${e.name} ${e.movement ? `(${e.movement})` : ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:center;vertical-align:middle;font-size:9px;">${e.movement || ''}</td>
          <td style="border:1px solid #000;text-align:center;font-weight:bold;background:#dbeafe;">أ</td>
      `;
      daysEx.forEach(day => {
        const code = e.days[String(day)] || '';
        const isWe = isWeekend(day);
        const weBg = isWe && !code ? 'background:#fff7ed;' : '';
        const codeColor = TS_CODES_ALL[code]?.color || '';
        const colorStyle = codeColor ? `background:${codeColor.split(' ')[0]};` : '';
        employeeRows += `<td style="border:1px solid #000;text-align:center;font-size:11px;font-weight:bold;${colorStyle}${weBg}">${code}</td>`;
      });
      employeeRows += `
          <td rowspan="2" style="border:1px solid #000;text-align:center;font-weight:bold;color:#1d4ed8;">${stats.totalHours || ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:center;color:#15803d;">${stats.leaveDays || ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:center;color:#dc2626;">${stats.absenceDays || ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:center;color:#6b7280;">${stats.restDays || ''}</td>
          <td rowspan="2" style="border:1px solid #000;text-align:right;font-size:9px;color:#6b7280;">${e.notes || ''}</td>
        </tr>
      `;
      employeeRows += `<tr style="background:${bgColor};">
          <td style="border:1px solid #000;text-align:center;font-weight:bold;background:#f3e8ff;">ق</td>
      `;
      daysEx.forEach(day => {
        const hours = e.hours[String(day)];
        const isWe = isWeekend(day);
        const weBg = hours == null && isWe ? 'background:#fff7ed;' : '';
        const hoursStyle = hours != null ? 'background:#f5f3ff;color:#7c3aed;font-weight:bold;' : '';
        employeeRows += `<td style="border:1px solid #000;text-align:center;font-size:11px;${hoursStyle}${weBg}">${hours != null ? hours : ''}</td>`;
      });
      employeeRows += `</tr>`;
    });

    let dayHeaders = '';
    daysEx.forEach(day => {
      const dow = getDayName(day);
      const shift = getShiftForDayExport(tsYear, tsMonth, day);
      const isWe = isWeekend(day);
      const weBg = isWe ? 'background:#fff7ed;' : 'background:#eff6ff;';
      dayHeaders += `
        <th style="border:1px solid #000;text-align:center;font-size:8px;min-width:28px;${weBg}">
          <div style="font-weight:bold;font-size:10px;">${day}</div>
          <div style="font-size:7px;">${dow}</div>
          <div style="font-size:7px;font-weight:bold;color:${SHIFT_TEXT_COLORS[shift] || '#374151'};">${shift}</div>
        </th>
      `;
    });

    const symbolsTable = `
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:8px;direction:rtl;">
        <tr><td colspan="4" style="border:1px solid #000;padding:3px;background:#f0f0f0;font-weight:bold;">دليل الرموز</td></tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>Z:</strong> مواظبة ولا تحتوي على متغيرات</td>
          <td style="border:1px solid #000;padding:3px;"><strong>5:</strong> أيام الحشد الشعبي</td>
          <td style="border:1px solid #000;padding:3px;"><strong>E:</strong> إصابة عمل صادرة من لجنة طبية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>B:</strong> أيام بقسم آخر</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>F:</strong> مواظبة تحتوي على متغيرات إجازة غياب أو ساعات</td>
          <td style="border:1px solid #000;padding:3px;"><strong>W:</strong> الوفاة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>K:</strong> إجازة أمومة بأمر إداري</td>
          <td style="border:1px solid #000;padding:3px;"><strong>M:</strong> إجازة أمومة</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>4:</strong> العالقين في المناطق الساخنة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>A:</strong> إعالة (إجازة) لذوي الاحتياجات الخاصة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>D:</strong> أيام العدة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>H:</strong> إجازة بدون راتب خارج العراق</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>8:</strong> مصاحبة زوجية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>Y:</strong> عطلة رسمية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>X:</strong> غياب</td>
          <td style="border:1px solid #000;padding:3px;"><strong>7:</strong> إجازة اعتيادية خارج العراق براتب تام</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>U:</strong> تفرغ</td>
          <td style="border:1px solid #000;padding:3px;"><strong>Q:</strong> خارج الخدمة (أيام قبل المباشرة في الشركة)</td>
          <td style="border:1px solid #000;padding:3px;"><strong>P:</strong> إيفاد شامل كافة أنواع الإيفادات خارج العراق</td>
          <td style="border:1px solid #000;padding:3px;"><strong>O:</strong> المقيم الصباحي</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>2:</strong> مناوبة ثنائية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>3:</strong> مناوبة ثلاثية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>N:</strong> استراحة مناوبة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>V:</strong> استراحة مقيم</td>
        </tr>
        <tr>
          <td style="border:1px solid #000;padding:3px;"><strong>L:</strong> إجازة اعتيادية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>S:</strong> إجازة مرضية</td>
          <td style="border:1px solid #000;padding:3px;"><strong>R:</strong> استراحة</td>
          <td style="border:1px solid #000;padding:3px;"><strong>J:</strong> مجاز دراسياً</td>
        </tr>
      </table>
    `;

    const fullHtml = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>استمارة تفاصيل الدوام - ${monthLabel} ${yearNum}</title>
      <style>
        @page { size: A3 landscape; margin: 8mm; }
        body { font-family: 'Arial', sans-serif; direction: rtl; margin: 0; padding: 0; }
        .header { text-align: center; border: 2px solid #1d3557; padding: 6px; border-radius: 4px; margin-bottom: 10px; }
        .header .company { font-size: 12px; font-weight: bold; }
        .header .dept { font-size: 11px; }
        .header .title { font-size: 14px; font-weight: bold; margin: 4px 0; }
        .header .sub { font-size: 11px; }
        .notice { background: #fef9c3; padding: 4px; font-size: 9px; text-align: center; margin: 6px 0; border: 1px solid #fde047; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 2px 1px; vertical-align: middle; }
        th { background: #dbeafe; font-size: 9px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 20px; font-size: 10px; text-align: center; }
        .sign-item { width: 30%; border-top: 1px solid #000; padding-top: 5px; margin-top: 30px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">الجمهورية العراقية — وزارة النفط</div>
        <div class="company">شركة نفط البصرة (شركة عامة)</div>
        <div class="dept">شعبة مستودع الفاو — قسم السيطرة والنظم</div>
        <div class="title">استمارة تفاصيل الدوام لشهر ${monthLabel} ${yearNum}</div>
        <div class="sub">الموقع: الفاو</div>
      </div>
      <div class="notice">ملاحظة: يرجى الانتباه إلى رموز المواظبة والتقيد بها وتثبيت مجموع الساعات للمشمولين بها</div>
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width:60px;">الرقم الوظيفي</th>
            <th rowspan="2" style="width:160px;">اسم الموظف</th>
            <th rowspan="2" style="width:40px;">الحركة</th>
            <th rowspan="2" style="width:25px;">نوع</th>
            ${dayHeaders}
            <th rowspan="2" style="width:55px;">مجموع الساعات</th>
            <th rowspan="2" style="width:40px;">إجازة</th>
            <th rowspan="2" style="width:40px;">غياب</th>
            <th rowspan="2" style="width:40px;">عطل</th>
            <th rowspan="2" style="width:80px;">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${employeeRows}
        </tbody>
      </table>
      ${symbolsTable}
      <div class="signatures">
        <div class="sign-item">مدير القسم<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
        <div class="sign-item">مسؤول الشعبة<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
        <div class="sign-item">مسؤول ضبط الوقت<br>التوقيع: _________________<br>التاريخ: _____ / _____ / _____</div>
      </div>
    </body>
    </html>`;

    const blob = new Blob(["﻿" + fullHtml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تايم_شيت_${TAB_INFO[activeTab].label}_${yearNum}_${String(tsMonth + 1).padStart(2, "0")}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("تم تصدير الملف بنجاح بالتنسيق الرسمي ✅", "success");
  };

  const exportPDF = () => {
    const html = buildHTMLTable(activeTab);
    const printHTML = html.replace("<body>", `<body><style>@page{size:A3 landscape;margin:10mm;} @media print{body{zoom:0.7;}}</style>`);
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-999px;left:-999px;width:1400px;height:900px;border:none;";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(printHTML);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 3000);
    }, 800);
    addToast("جارٍ فتح نافذة الطباعة / تصدير PDF", "info");
  };

  const exportOfficialForm = () => {
    const emps = data[activeTab] || [];
    const monthLabel = MONTHS_AR_TS[tsMonth];
    const tabTitle = TAB_INFO[activeTab].title;
    const cellS = "border:1px solid #374151;padding:2px 1px;text-align:center;font-size:9px;";
    const weStyle = "background:#fff7ed;";
    let bodyRows = "";
    emps.forEach((e, idx) => {
      const stats = calcTsStats(e);
      const bg = idx % 2 === 0 ? "" : "background:#f9fafb;";
      bodyRows += `<tr style="${bg}">`;
      bodyRows += `<td rowspan="2" style="${cellS}font-weight:bold;font-size:10px;">${idx+1}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}text-align:right;min-width:100px;font-weight:bold;">${e.name}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}font-size:9px;color:#555;">${e.id}</td>`;
      bodyRows += `<td style="${cellS}font-size:8px;color:#1d4ed8;font-weight:bold;">رمز</td>`;
      days.forEach(d => {
        const dow = new Date(tsYear, tsMonth, d).getDay();
        const isWe = dow===5||dow===6;
        const code = e.days[String(d)] || "";
        const cSt = code ? (TS_CODES_ALL[code] ? {
          "bg-orange-100 text-orange-700":"background:#ffedd5;color:#c2410c",
          "bg-blue-100 text-blue-700":"background:#dbeafe;color:#1d4ed8",
          "bg-green-100 text-green-700":"background:#dcfce7;color:#15803d",
          "bg-red-100 text-red-600":"background:#fee2e2;color:#dc2626",
          "bg-yellow-100 text-yellow-700":"background:#fef9c3;color:#a16207",
          "bg-gray-100 text-gray-600":"background:#f3f4f6;color:#4b5563",
          "bg-purple-100 text-purple-700":"background:#f3e8ff;color:#7e22ce",
          "bg-red-200 text-red-800":"background:#fecaca;color:#991b1b",
          "bg-amber-100 text-amber-700":"background:#fef3c7;color:#b45309",
          "bg-teal-100 text-teal-700":"background:#ccfbf1;color:#0f766e",
          "bg-cyan-100 text-cyan-700":"background:#cffafe;color:#0e7490",
          "bg-red-100 text-red-700":"background:#fee2e2;color:#b91c1c",
          "bg-slate-100 text-slate-600":"background:#f1f5f9;color:#475569",
          "bg-slate-200 text-slate-500":"background:#e2e8f0;color:#64748b",
        }[TS_CODES_ALL[code].color] || "" : "") : (isWe ? weStyle : "");
        bodyRows += `<td style="${cellS}${cSt}font-weight:bold;">${code}</td>`;
      });
      bodyRows += `<td rowspan="2" style="${cellS}font-weight:bold;color:#1d4ed8;">${stats.totalHours||""}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}color:#15803d;">${stats.leaveDays||""}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}color:#dc2626;">${stats.absenceDays||""}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}color:#6b7280;">${stats.restDays||""}</td>`;
      bodyRows += `<td rowspan="2" style="${cellS}font-size:8px;text-align:right;">${e.notes||""}</td>`;
      bodyRows += `</tr><tr style="${bg}">`;
      bodyRows += `<td style="${cellS}font-size:8px;color:#7c3aed;font-weight:bold;">ساعة</td>`;
      days.forEach(d => {
        const dow = new Date(tsYear, tsMonth, d).getDay();
        const isWe = dow===5||dow===6;
        const h = e.hours[String(d)];
        bodyRows += `<td style="${cellS}${h!=null?"background:#f5f3ff;color:#7c3aed;font-weight:600":isWe?"background:#fff7ed;":""}">${h!=null?h:""}</td>`;
      });
      bodyRows += `</tr>`;
    });
    const dayHdrs = days.map(d => {
      const dow = new Date(tsYear, tsMonth, d).getDay();
      const isWe = dow===5||dow===6;
      const shift = getShiftForDay(tsYear, tsMonth, d);
      const sc = SHIFT_TEXT_COLORS[shift]||"#374151";
      return `<th style="border:1px solid #374151;padding:1px;text-align:center;font-size:8px;min-width:22px;${isWe?weStyle:"background:#eff6ff;"}">`+
        `<div style="font-weight:bold;font-size:9px;${isWe?"color:#ea580c;":""}">${d}</div>`+
        `<div style="font-size:7px;${isWe?"color:#ea580c;":""}">${DAY_NAMES_AR[dow]}</div>`+
        `<div style="font-size:7px;font-weight:bold;color:${sc};">${shift}</div></th>`;
    }).join("");
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<style>
  @page{size:A3 landscape;margin:8mm;}
  body{font-family:'Arial',sans-serif;direction:rtl;margin:0;padding:0;}
  table{border-collapse:collapse;width:100%;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style></head><body>
<div style="text-align:center;margin-bottom:4px;border:2px solid #1d3557;padding:6px;border-radius:4px;">
  <div style="font-size:13px;font-weight:bold;">الجمهورية العراقية — وزارة النفط</div>
  <div style="font-size:12px;font-weight:bold;">شركة نفط البصرة</div>
  <div style="font-size:11px;">شعبة مستودع الفاو — قسم السيطرة والنظم</div>
  <div style="font-size:14px;font-weight:bold;margin-top:3px;">سجل الحضور والانصراف — ${tabTitle}</div>
  <div style="font-size:11px;">شهر: <strong>${monthLabel} ${tsYear}</strong> &nbsp;|&nbsp; رقم العمل: 3432960600</div>
</div>
<table>
<thead>
<tr style="background:#1d3557;color:#fff;">
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:20px;">ت</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:90px;">الاسم</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">الرقم</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:8px;width:28px;">نوع</th>
  ${dayHdrs}
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">الساعات</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">إجازة</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">غياب</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;">عطل</th>
  <th rowspan="2" style="border:1px solid #374151;padding:3px;font-size:9px;min-width:50px;">ملاحظات</th>
</tr></thead>
<tbody>${bodyRows}</tbody>
</table>
<div style="display:flex;justify-content:space-between;margin-top:20px;font-size:11px;">
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع المسؤول المباشر</div></div>
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع رئيس القسم</div></div>
  <div style="text-align:center;"><div style="border-top:1px solid #000;width:150px;margin-top:40px;padding-top:3px;">توقيع مدير الشعبة</div></div>
</div>
</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-999px;left:-999px;width:1500px;height:1000px;border:none;";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 3000);
    }, 900);
    addToast("جارٍ طباعة الفورمة الرسمية", "info");
  };

  const dayIsToday = (d) => d===new Date().getDate()&&tsMonth===new Date().getMonth()&&tsYear===new Date().getFullYear();

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">سجل الحضور والانصراف (تايم شيت)</h1>
          <p className="text-sm text-secondary mt-0.5">رقم العمل: 3432960600 — مستودع الفاو — قسم السيطرة والنظم</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={tsMonth} onChange={e=>setTsMonth(+e.target.value)}
            className="text-sm border border-color rounded-lg px-2 py-1.5 bg-surface text-primary">
            {MONTHS_AR_TS.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <select value={tsYear} onChange={e=>setTsYear(+e.target.value)}
            className="text-sm border border-color rounded-lg px-2 py-1.5 bg-surface text-primary">
            {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fillWeekend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-orange-500 text-white hover:bg-orange-600">
            <Calendar size={14}/> ج/س صباحي
          </button>
          <button onClick={resetTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600">
            <X size={14}/> تصفير
          </button>
          <button onClick={()=>setShowLegend(v=>!v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm btn-secondary">
            <AlertTriangle size={14}/> دليل الرموز
          </button>
          <button onClick={()=>{setShowExport(v=>!v);setShowImport(false);}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-700 text-white hover:bg-green-800">
            <FileCheck size={14}/> تصدير بيانات اكسل
          </button>
          <button onClick={exportOfficialForm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">
            <Printer size={14}/> طباعة / PDF
          </button>
          <button onClick={()=>{setShowImport(v=>!v);setShowExport(false);}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700">
            <Upload size={14}/> استيراد Excel
          </button>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="card rounded-xl p-4 border border-blue-200 bg-blue-50 space-y-3" dir="rtl">
          <h3 className="font-bold text-sm text-blue-800">استيراد بيانات الحضور من Excel</h3>
          <p className="text-xs text-blue-700">يقرأ الأعمدة E→AI (أيام 1-31) والصف السفلي (الساعات) حسب الرقم الوظيفي في العمود A</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-semibold text-blue-700 mb-1">من جهازك:</p>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importFromFile}/>
              <button onClick={()=>fileInputRef.current?.click()} disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                <Upload size={14}/> {importing ? "جارٍ الاستيراد..." : "اختر ملف Excel"}
              </button>
            </div>
            {gDrive?.isReady && (
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs font-semibold text-blue-700 mb-1">من Google Drive:</p>
                <div className="flex gap-2">
                  <input value={importDriveId} onChange={e=>setImportDriveId(e.target.value)}
                    placeholder="File ID من Drive"
                    className="flex-1 text-sm border border-blue-300 rounded-lg px-3 py-2 bg-white text-primary" dir="ltr"/>
                  <button onClick={importFromDrive} disabled={importing}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                    {importing ? "..." : "تنزيل"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export to template panel */}
      {showExport && (
        <div className="card rounded-xl p-4 border border-green-200 bg-green-50 space-y-3" dir="rtl">
          <h3 className="font-bold text-sm text-green-800">تصدير بيانات التايم شيت إلى قالب Excel</h3>
          <p className="text-xs text-green-700">اختر ملف Excel القالب الموجود على جهازك أو Drive — سيتم ملء بيانات الحضور فيه مع الحفاظ على تنسيقه الأصلي</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-semibold text-green-700 mb-1">من جهازك:</p>
              <input ref={exportFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={exportFromFile}/>
              <button onClick={()=>exportFileRef.current?.click()} disabled={exporting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">
                <FileCheck size={14}/> {exporting ? "جارٍ التصدير..." : "اختر قالب Excel"}
              </button>
            </div>
            {gDrive?.isReady && (
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs font-semibold text-green-700 mb-1">من Google Drive (File ID):</p>
                <div className="flex gap-2">
                  <input value={exportDriveId} onChange={e=>setExportDriveId(e.target.value)}
                    placeholder="File ID للقالب في Drive"
                    className="flex-1 text-sm border border-green-300 rounded-lg px-3 py-2 bg-white text-primary" dir="ltr"/>
                  <button onClick={exportFromDrive} disabled={exporting}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">
                    {exporting ? "..." : "تصدير"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="card rounded-xl p-4 border border-color">
          <h3 className="font-bold text-sm mb-3 text-primary">دليل رموز الحضور والانصراف</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(TS_CODES_ALL).map(([code,info])=>(
              <div key={code} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${info.color}`}>
                <span className="font-black text-sm w-5 text-center">{code}</span>
                <span>{info.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day 25 reminder banner */}
      {new Date().getDate() === 25 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3">
          <Bell size={18} className="text-amber-600 shrink-0"/>
          <p className="text-sm text-amber-800 font-medium">تذكير: اليوم الخامس والعشرون — يُرجى مراجعة وتصدير تقرير التايم شيت</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-color pb-0">
        {Object.entries(TAB_INFO).map(([key,info])=>(
          <button key={key} onClick={()=>{setActiveTab(key);setSearchEmp("");setEditCell(null);}}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-md transition-colors border-b-2 ${activeTab===key?"border-[#C87A2E] text-[#C87A2E] bg-[#FDF3E7]":"border-transparent text-secondary hover:text-primary"}`}>
            {info.label}
            <span className="mr-1.5 text-xs text-gray-400 ts-mono">({data[key]?.length||0})</span>
          </button>
        ))}
      </div>

      {/* Tab title + search + add */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{TAB_INFO[activeTab].title}</p>
          <p className="text-xs text-secondary">شهر {MONTHS_AR_TS[tsMonth]} {tsYear} — {daysInMonth} يوم</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400"/>
            <input value={searchEmp} onChange={e=>setSearchEmp(e.target.value)} placeholder="بحث عن موظف..."
              className="text-sm border border-color rounded-lg pr-8 pl-3 py-1.5 bg-surface text-primary w-48"/>
          </div>
          <button onClick={()=>addEmployee(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-[#C87A2E] text-white hover:bg-[#B06D27] transition-colors">
            <Plus size={14}/> إضافة
          </button>
          <button onClick={resetData} title="إعادة تعيين للبيانات الأصلية"
            className="p-1.5 rounded-lg text-sm btn-secondary text-red-500 hover:text-red-700">
            <Trash2 size={14}/>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="card rounded-xl border border-color overflow-hidden">
        <div className="overflow-x-auto" dir="rtl">
          <table className="text-xs border-collapse" style={{minWidth:`${200+daysInMonth*30+240}px`}} dir="rtl">
            <thead>
              <tr>
                <th className="border border-gray-200 px-2 py-2 text-center ts-header" style={{position:"sticky",right:0,zIndex:10,minWidth:"70px",fontSize:"11px"}}>الرقم</th>
                <th className="border border-gray-200 px-2 py-2 text-right ts-header" style={{position:"sticky",right:"70px",zIndex:10,minWidth:"150px"}}>الاسم</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header ts-mono" style={{minWidth:"34px",fontSize:"10px"}}>ح/ق</th>
                {days.map(d=>{
                  const dow = new Date(tsYear, tsMonth, d).getDay();
                  const isWe = dow===5||dow===6;
                  const shift = getShiftForDay(tsYear, tsMonth, d);
                  const todayFlag = dayIsToday(d);
                  return (
                    <th key={d} className={`border border-gray-200 py-1 text-center ts-mono ${todayFlag?"ts-today":isWe?"ts-we":"ts-header"}`} style={{minWidth:"30px"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:todayFlag?"#166534":isWe?"#C87A2E":undefined}}>{d}</div>
                      <div style={{fontSize:"8px",color:isWe?"#C87A2E":"#9ca3af",lineHeight:"1"}}>{DAY_NAMES_AR[dow]}</div>
                      <div style={{fontSize:"8px",fontWeight:"bold",color:SHIFT_TEXT_COLORS[shift]||"#374151",lineHeight:"1.2"}}>{shift}</div>
                    </th>
                  );
                })}
                <th className="border border-gray-200 px-1 py-2 text-center ts-header ts-mono" style={{minWidth:"52px",color:"#C87A2E"}}>ساعات</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#15803d"}}>إجازة</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#dc2626"}}>غياب</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"40px",color:"#6b7280"}}>عطل</th>
                <th className="border border-gray-200 px-2 py-2 text-right ts-header" style={{minWidth:"100px"}}>ملاحظات</th>
                <th className="border border-gray-200 px-1 py-2 text-center ts-header" style={{minWidth:"32px"}}></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, idx) => (
                <TsEmployeeRow
                  key={e.id}
                  e={e}
                  idx={idx}
                  days={days}
                  tsYear={tsYear}
                  tsMonth={tsMonth}
                  activeTab={activeTab}
                  editCell={editCell}
                  setEditCell={setEditCell}
                  updateCell={updateCell}
                  updateNotes={updateNotes}
                  deleteEmployee={deleteEmployee}
                  editDriverName={editDriverName}
                  codes={TAB_INFO[activeTab].codes}
                />
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={9+daysInMonth} className="text-center py-8 text-secondary text-sm">لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:"إجمالي الموظفين",    val:summaryStats.total,  color:"text-[#C87A2E]"},
          {label:"إجمالي ساعات العمل", val:summaryStats.hours,  color:"text-[#C87A2E]"},
          {label:"إجمالي أيام الإجازة",val:summaryStats.leave,  color:"text-green-600"},
          {label:"إجمالي أيام الغياب", val:summaryStats.absent, color:"text-red-600"},
          {label:"إجمالي أيام العطل",  val:summaryStats.rest,   color:"text-gray-600"},
        ].map(s=>(
          <div key={s.label} className="card rounded-xl p-3 border border-color text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-secondary mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-secondary text-center">انقر على أي خلية في صف (أ) لتغيير رمز الحضور • انقر على أي خلية في صف (ق) لإدخال عدد الساعات • يتم الحفظ تلقائياً</p>
    </div>
  );
}

export default TimeSheetPage;
