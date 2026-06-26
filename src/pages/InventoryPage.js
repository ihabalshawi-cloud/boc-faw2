import React, { useState, useEffect, useCallback } from "react";
import { FixedSizeList } from "react-window";
import { Save, CheckCircle, Plus, Trash2, Edit3, X, Download, Search, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { ITEM_CONDITIONS, INVENTORY_CATS, FURNITURE_CATS, LOW_STOCK_THRESHOLD, INITIAL_INVENTORY_ITEMS } from "../constants";
import { storage, exportCSV } from "../utils";
import { FirebaseAPI } from "../firebase";
import { useToast, useConfirm } from "../contexts";
import { hasPermission } from "../permissions";
import { PrintButton, useDebounce } from "../components/Shared";

function InventorySystem({ emp, isAdmin }) {
  const canEdit = isAdmin || hasPermission(emp, "MANAGE_INVENTORY");
  const [items, setItemsState] = useState(() => storage.get("inventory_items", INITIAL_INVENTORY_ITEMS));
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 300);
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"", minQty:3, serialNo:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(new Set());
  const PER_PAGE = 20;

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
      if (list && list.length > 0) {
        setItemsState(prev => {
          if (list.length < Math.min(prev.length * 0.5, 10)) return prev;
          const minQtyMap = Object.fromEntries(INITIAL_INVENTORY_ITEMS.map(i => [i.id, i.minQty]));
          const enriched = list.map(i => ({ ...i, minQty: i.minQty || minQtyMap[i.id] || LOW_STOCK_THRESHOLD }));
          storage.set("inventory_items", enriched);
          FirebaseAPI.saveInventory(enriched);
          return enriched;
        });
      }
    });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [dSearch, filterCat]);

  const categories = ["الكل", ...INVENTORY_CATS];
  const filtered = items.filter(i => (i.name.includes(dSearch)||i.code.includes(dSearch)) && (filterCat==="الكل"||i.category===filterCat));
  const sorted = sortBy ? [...filtered].sort((a,b) => { const va=a[sortBy],vb=b[sortBy]; const c=typeof va==="number"?va-vb:String(va||"").localeCompare(String(vb||""),"ar"); return sortDir==="asc"?c:-c; }) : filtered;
  const paged = sorted.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const lowStock = items.filter(i => i.qty <= (i.minQty || LOW_STOCK_THRESHOLD));
  const toggleSelect = (id) => setSelected(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll = () => setSelected(prev => prev.size===paged.length ? new Set() : new Set(paged.map(i=>i.id)));
  const bulkDelete = async () => { if(!canEdit)return; if(await confirm(`حذف ${selected.size} أصناف؟`,{danger:true,ok:"حذف",title:"حذف متعدد"})){setItems(prev=>prev.filter(i=>!selected.has(i.id)));setSelected(new Set());} };
  const SortTh = ({col,label}) => { const active=sortBy===col; return <th className="px-3 py-2 cursor-pointer select-none hover:bg-hover whitespace-nowrap" onClick={()=>{if(active)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(col);setSortDir("asc");}}}>{label}{active?(sortDir==="asc"?<ChevronUp size={10} className="inline ml-0.5"/>:<ChevronDown size={10} className="inline ml-0.5"/>):null}</th>; };

  const deleteItem = async (id) => {
    if (!canEdit) return;
    if (await confirm("هل تريد حذف هذا الصنف؟", { danger: true, ok: "حذف", title: "حذف الصنف" }))
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const saveItem = () => {
    if (!canEdit) return;
    if (!form.name) return showToast("الاسم مطلوب");
    if (adding) setItems(prev => [...prev, { ...form, id: Date.now() }]);
    else setItems(prev => prev.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false); showToast("✅ تم الحفظ");
  };

  const resetToDefaults = async () => {
    if (!canEdit) return;
    if (await confirm("سيتم استعادة جميع البيانات الافتراضية (137 صنف). هل تريد المتابعة؟", { ok: "استعادة", title: "استعادة البيانات الافتراضية" })) {
      setItems(INITIAL_INVENTORY_ITEMS);
      showToast("✅ تم استعادة البيانات الافتراضية (137 صنف)");
    }
  };

  return (
    <div className="space-y-4">
      {lowStock.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-600 shrink-0"/><div><p className="text-xs font-bold text-amber-800">تنبيه مخزون منخفض ({lowStock.length} صنف)</p><p className="text-xs text-amber-700">{lowStock.map(i=>i.name).join(" • ")}</p></div></div>}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1"><div className="flex items-center gap-2 input rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-secondary"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>exportCSV(items.map(i=>({الرمز:i.code,الاسم:i.name,رقم_الصنع:i.serialNo||"",الفئة:i.category,الكمية:i.qty,الحالة:i.condition,الموقع:i.location})),"المخزون_شعبة_الآلات_الدقيقة")} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border"><Download size={13}/> تصدير</button>
          {canEdit && <button onClick={resetToDefaults} className="btn-secondary flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border border-amber-300 text-amber-700">↺ استعادة الافتراضي</button>}
          {canEdit && <button onClick={()=>{setAdding(true);setForm({code:"",name:"",category:"أجهزة قياس",qty:1,condition:"جيد",location:"شعبة الآلات الدقيقة",minQty:3,serialNo:""});}} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>}
          <PrintButton targetId="print-inventory" label="طباعة"/></div>
      </div>
      {canEdit && (adding||editId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget){setEditId(null);setAdding(false);}}}>
          <div className="card rounded-2xl w-full max-w-lg shadow-2xl p-5">
            <div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة صنف":"تعديل صنف"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["الرمز الرمزي","code"],["الاسم *","name"],["رقم الصنع","serialNo"],["الكمية","qty"],["الحد الأدنى","minQty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>))}
              <div><label className="block text-[10px] font-bold text-secondary mb-1">الفئة</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{INVENTORY_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
            </div>
            <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl"><Save size={13}/> حفظ</button></div>
          </div>
        </div>
      )}
      {selected.size > 0 && canEdit && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm">
          <span className="font-bold text-blue-700">تم تحديد {selected.size} صنف</span>
          <button onClick={()=>exportCSV(items.filter(i=>selected.has(i.id)).map(i=>({الرمز:i.code,الاسم:i.name,الفئة:i.category,الكمية:i.qty,الحالة:i.condition,الموقع:i.location})),"المحدد")} className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1"><Download size={11}/> تصدير</button>
          <button onClick={bulkDelete} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Trash2 size={11}/> حذف</button>
          <button onClick={()=>setSelected(new Set())} className="mr-auto text-xs text-secondary hover:text-primary">إلغاء</button>
        </div>
      )}
      <div id="print-inventory" className="card rounded-2xl border-color border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-color">
        <th className="px-3 py-2 no-print w-8"><input type="checkbox" checked={selected.size===paged.length&&paged.length>0} onChange={toggleAll} className="cursor-pointer"/></th>
        <SortTh col="code" label="الرمز"/><SortTh col="name" label="الاسم"/><th className="px-3 py-2">رقم الصنع</th><SortTh col="category" label="الفئة"/><SortTh col="qty" label="الكمية"/><SortTh col="condition" label="الحالة"/><th className="px-3 py-2">الموقع</th><th className="px-3 py-2 no-print">إجراءات</th></tr></thead>
        <tbody>{paged.map(it=>(<tr key={it.id} className={`border-b border-color ${selected.has(it.id)?"bg-blue-50/60":it.qty<=(it.minQty||3)?"bg-amber-50/50":""}`}>
          <td className="px-3 py-2 no-print"><input type="checkbox" checked={selected.has(it.id)} onChange={()=>toggleSelect(it.id)} className="cursor-pointer"/></td>
          <td className="px-3 py-2 font-mono text-[10px]">{it.code||"—"}</td><td className="px-3 py-2">{it.name}</td><td className="px-3 py-2 font-mono text-[10px] text-secondary">{it.serialNo||"—"}</td><td className="px-3 py-2">{it.category}</td>
          <td className="px-3 py-2 font-bold">{it.qty} {it.qty<=(it.minQty||3)&&<span className="text-amber-500">⚠️</span>}</td>
          <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":it.condition==="تالف"||it.condition==="تم الشطب"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
          <td className="px-3 py-2 text-[10px]">{it.location}</td>
          <td className="px-3 py-2 no-print">{canEdit && <div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div>}</td></tr>))}</tbody></table></div>
        {totalPages > 1 && (<div className="flex items-center justify-between px-4 py-3 border-t border-color"><span className="text-xs text-secondary">{filtered.length} صنف — صفحة {page}/{totalPages}</span><div className="flex gap-1"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 text-xs border border-color rounded-lg disabled:opacity-40">السابق</button><button disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-xs border border-color rounded-lg disabled:opacity-40">التالي</button></div></div>)}
        </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد الأثاث ==========
function FurnitureInventory({ emp, isAdmin }) {
  const canEdit = isAdmin || hasPermission(emp, "MANAGE_INVENTORY");
  const [items, setItemsState] = useState(() => storage.get("furniture_items", [
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
    {id:28, code:"",             name:"حاسبة HP",                      category:"أجهزة حاسوب",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:29, code:"1901114388",   name:"طابعة كانون",                   category:"معدات مكتبية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:30, code:"لا يوجد",      name:"مكيف هواء كرافت 1.5 طن",        category:"أجهزة تكييف",    qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:31, code:"1513674126",   name:"ثلاجة فستل 9 قدم",              category:"أجهزة منزلية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:32, code:"1403114492",   name:"مكنسة كهربائية",                category:"معدات مكتبية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:33, code:"لا يوجد",      name:"مدفأة زيتية",                   category:"أجهزة منزلية",   qty:2, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:34, code:"لا يوجد",      name:"سخان ماء",                      category:"أجهزة منزلية",   qty:1, condition:"جيد",         location:"السيطرة والنظم شعبة الفاو"},
    {id:35, code:"1403014212",   name:"طباخ كهربائي",                  category:"أجهزة منزلية",   qty:1, condition:"تالف",        location:"المخزن"},
    {id:36, code:"1403024031",   name:"فرن كهربائي",                   category:"أجهزة منزلية",   qty:1, condition:"تالف",        location:"المخزن"},
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
  const dSearch = useDebounce(search, 300);
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  const confirm = useConfirm();

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
      if (list && list.length > 0) { setItemsState(list); storage.set("furniture_items", list); }
      else {
        const localData = storage.get("furniture_items", null);
        if (localData && localData.length > 0) FirebaseAPI.saveFurniture(localData);
      }
    });
  }, []);

  const deleteItem = async (id) => {
    if (!canEdit) return;
    if (await confirm("هل تريد حذف هذا الصنف؟", { danger: true, ok: "حذف", title: "حذف الصنف" }))
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const categories = ["الكل", ...FURNITURE_CATS];
  const filtered = items.filter(i => (i.name.includes(dSearch)||i.code.includes(dSearch)) && (filterCat==="الكل"||i.category===filterCat));

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
      {canEdit && (adding||editId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e=>{if(e.target===e.currentTarget){setEditId(null);setAdding(false);}}}>
          <div className="card rounded-2xl w-full max-w-lg shadow-2xl p-5">
            <div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة قطعة":"تعديل قطعة"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["الرمز *","code"],["الاسم *","name"],["الكمية","qty"],["الموقع","location"]].map(([l,k])=>(<div key={k}><label className="block text-[10px] font-bold text-secondary mb-1">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm"/></div>))}
              <div><label className="block text-[10px] font-bold text-secondary mb-1">الحالة</label><select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="input w-full rounded-lg px-3 py-2 text-sm">{ITEM_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
            </div>
            <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm btn-secondary rounded-xl border">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> حفظ</button></div>
          </div>
        </div>
      )}
      <div id="print-furniture" className="card rounded-2xl border-color border overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_90px_50px_90px_1fr_56px] text-[10px] font-bold text-secondary px-3 py-2 border-b border-color"><span>الرمز</span><span>الاسم</span><span>الفئة</span><span>الكمية</span><span>الحالة</span><span>الموقع</span><span className="no-print">إجراءات</span></div>
        {filtered.length===0?<p className="text-center text-secondary py-8 text-sm">لا توجد نتائج</p>:
        <FixedSizeList height={Math.min(filtered.length*36,400)} itemCount={filtered.length} itemSize={36} width="100%">
          {({index,style})=>{const it=filtered[index];return(<div style={style} className="grid grid-cols-[80px_1fr_90px_50px_90px_1fr_56px] items-center text-xs border-b border-color px-3">
            <span className="font-mono text-[10px] truncate">{it.code}</span><span className="truncate">{it.name}</span><span className="truncate">{it.category}</span><span className="font-bold">{it.qty}</span>
            <span className={`text-[10px] font-bold ${it.condition==="جيد"?"text-emerald-700":"text-amber-700"}`}>{it.condition}</span>
            <span className="truncate text-[10px]">{it.location}</span>
            <span className="no-print">{canEdit&&<div className="flex gap-1"><button onClick={()=>{setEditId(it.id);setForm({...it});}} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div>}</span>
          </div>);}}
        </FixedSizeList>}
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

export default InventorySystem;
export { FurnitureInventory };
