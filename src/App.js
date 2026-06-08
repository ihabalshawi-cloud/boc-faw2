// أضف هذا الكود في بداية ملف App.js، واستبدل دوال InventorySystem و FurnitureInventory بالكود التالي:

// ========== جرد المخزن (باستخدام بيانات Excel) ==========
function InventorySystem() {
  const [items, setItems] = useState(() => storage.get("inventory_items", [
    // أجهزة قياس ومعايرة
    { id:1, code:"2301280010", name:"مقاومة متغيرة", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"2489" },
    { id:2, code:"2301243008", name:"مولد ذبذبات", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"JB21280" },
    { id:3, code:"2309443025", name:"جهاز معايرة مقياس الضغط", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"2605079" },
    { id:4, code:"2309443011", name:"جهاز معايرة مقياس الضغط", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"12064" },
    { id:5, code:"2301373023", name:"جهاز مقياس متعدد الاغراض", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"22460049" },
    { id:6, code:"2301390031", name:"جهاز قياس الضغط بالأوزان", category:"أجهزة معايرة", qty:1, condition:"عاطل", location:"مخزن الآلات الدقيقة", serialNo:"1B77" },
    { id:7, code:"2308513026", name:"جهاز معايرة الضغوط", category:"أجهزة معايرة", qty:1, condition:"مستعمل", location:"ورشة", serialNo:"2414" },
    { id:8, code:"2301493004", name:"جهاز معايرة المزدوجات (درجة حرارة)", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"B3-C511" },
    { id:9, code:"2301293019", name:"جهاز تمييز الحساسات الحرارية", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"2645" },
    { id:10, code:"2335613000", name:"جهاز فحص الفولتية", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"SS22344089" },
    { id:11, code:"2336263013", name:"جهاز كشف مسار الكابلات", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"SS257676213" },
    { id:12, code:"2335070006", name:"جهاز راسم الذبذبات", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"RS-248-898" },
    { id:13, code:"2311183002", name:"كاميرا تصوير حرارية", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"TL-12513120" },
    { id:14, code:"2503163065", name:"ايفو ميتر", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"263458" },
    { id:15, code:"2501035893", name:"كوسرة طيارية", category:"عدد يدوية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:16, code:"2505133097", name:"منكنة", category:"عدد يدوية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:17, code:"2505503033", name:"جهاز ضغط يدوي هوائي", category:"أجهزة ضغط", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"13104" },
    { id:18, code:"2505503013", name:"جهاز ضغط يدوي هوائي", category:"أجهزة ضغط", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"220828" },
    { id:19, code:"2507973015", name:"جهاز ضغط هيدروليك", category:"أجهزة ضغط", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"17093" },
    { id:20, code:"2507973016", name:"جهاز ضغط هيدروليك", category:"أجهزة ضغط", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"17077" },
    { id:21, code:"2509133009", name:"جهاز معايرة الحرارة", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"204822" },
    { id:22, code:"2503303018", name:"جهاز معايرة الحرارة", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"2594143" },
    { id:23, code:"2503513013", name:"جهاز معايرة التيار الكهربائي الواطئ", category:"أجهزة معايرة", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"2029006" },
    { id:24, code:"2511233055", name:"كلاب ميتر", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"1400004" },
    { id:25, code:"2511090188", name:"ميتر MEQ-2", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"MEQ-2" },
    { id:26, code:"2504786015", name:"ضاغطة هواء", category:"أجهزة ضغط", qty:1, condition:"مستعمل", location:"ورشة" },
    { id:27, code:"2505073613", name:"مقياس ضغط هيدروليك", category:"أجهزة ضغط", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"2605162" },
    { id:28, code:"2510593033", name:"جهاز قياس الحرارة", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"12157" },
    { id:29, code:"2503303032", name:"جهاز قياس الحرارة الدقيق", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"227-005" },
    { id:30, code:"2313973022", name:"ماكنة لحام", category:"عدد كهربائية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:31, code:"2624033", name:"FLUKE 726 (متعدد الاغراض مع قياس الضغط)", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"FLUKE726" },
    { id:32, code:"26242703", name:"FLUKE 700P27 (متعدد الاغراض مع قياس الضغط)", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"FLUKE700P27" },
    
    // صمامات
    { id:33, code:"5869856100", name:"VALVE SOLENOID EXPROOF 3WAY", category:"صمامات", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:34, code:"5899710065", name:"VALVE NEEDLE", category:"صمامات", qty:2, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:35, code:"5869892300", name:"VALVE SWITCHING", category:"صمامات", qty:2, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:36, code:"5869996510", name:"VALVE CHECK INODC250", category:"صمامات", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:37, code:"5869856050", name:"NEEDLE SOLENOID 1/2 TUBE", category:"صمامات", qty:2, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:38, code:"5883202040", name:"NEEDLE VALVE P-N215129", category:"صمامات", qty:4, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:39, code:"5889835125", name:"NEEDLE VALVE P-N915370", category:"صمامات", qty:5, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:40, code:"5863208250", name:"NEEDLE VALVE 4F-V6LN-SS", category:"صمامات", qty:21, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:41, code:"00-036-3401", name:"FNPTV BALL 1/2 NEEDLE", category:"صمامات", qty:7, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    
    // مقاييس ضغط (كيجات)
    { id:42, code:"", name:"كيج 30 par صغير", category:"مقاييس ضغط", qty:6, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:43, code:"", name:"كيج 60 psi صغير", category:"مقاييس ضغط", qty:25, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:44, code:"", name:"كيج 30 psi صغير", category:"مقاييس ضغط", qty:2, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:45, code:"", name:"كيج 250 kgf/cm2 كبير", category:"مقاييس ضغط", qty:5, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:46, code:"", name:"كيج 25 kg/cm2 كبير", category:"مقاييس ضغط", qty:8, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:47, code:"584-5002-529", name:"كيج 10 Kg كبير", category:"مقاييس ضغط", qty:9, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:48, code:"", name:"كيج 16 kg كبير", category:"مقاييس ضغط", qty:10, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:49, code:"", name:"كيج 100C كبير", category:"مقاييس ضغط", qty:2, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:50, code:"", name:"كيج 50 KG", category:"مقاييس ضغط", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:51, code:"", name:"كيج 25 par وسط", category:"مقاييس ضغط", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    
    // أجهزة تحكم ومرسلات
    { id:52, code:"", name:"مرسلة ضغط", category:"أجهزة تحكم", qty:7, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:53, code:"", name:"مرسلة جريان", category:"أجهزة تحكم", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:54, code:"", name:"PIC كارت", category:"أجهزة تحكم", qty:8, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:55, code:"", name:"متحكم ضغط", category:"أجهزة تحكم", qty:3, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:56, code:"", name:"لوحة اشارة", category:"أجهزة تحكم", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:57, code:"", name:"مفتاح تشغيل", category:"أجهزة تحكم", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:58, code:"", name:"ثرموستات متحسس حرارة RTD", category:"أجهزة تحكم", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    
    // قطع توصيل وعدد يدوية
    { id:59, code:"", name:"عكس مختلف الانواع حرف T", category:"قطع توصيل", qty:150, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:60, code:"", name:"عكس مختلف الانواع حرف L", category:"قطع توصيل", qty:110, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:61, code:"", name:"نبلة مختلف الاستخدام والاحجام", category:"قطع توصيل", qty:100, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:62, code:"", name:"صمام 1/2 HGVS12NC", category:"صمامات", qty:14, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:63, code:"", name:"صمام مختلف الاستخدام (5 اتجاهات كبير)", category:"صمامات", qty:5, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    
    // عدد كهربائية ويدوية
    { id:64, code:"", name:"دريل كهربائي", category:"عدد كهربائية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:65, code:"", name:"منفاخ هواء", category:"عدد يدوية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:66, code:"", name:"منشار كهربائي", category:"عدد كهربائية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:67, code:"", name:"كماشة", category:"عدد يدوية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:68, code:"", name:"كماشة حجم كبير", category:"عدد يدوية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:69, code:"", name:"جاكوز", category:"عدد يدوية", qty:3, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:70, code:"", name:"كاوية لحيم", category:"عدد يدوية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:71, code:"", name:"مسدس صمغ", category:"عدد يدوية", qty:2, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:72, code:"", name:"بايب سبانة 8 انش", category:"عدد يدوية", qty:5, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:73, code:"", name:"بايب سبانة 10 انش", category:"عدد يدوية", qty:5, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:74, code:"", name:"رافعة هيدروليك", category:"عدد يدوية", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
    { id:75, code:"", name:"برشر سويج", category:"عدد يدوية", qty:3, condition:"تالف", location:"مخزن الآلات الدقيقة" },
    { id:76, code:"", name:"افيوميتر (أزرق)", category:"أجهزة قياس", qty:2, condition:"تالف", location:"مخزن الآلات الدقيقة" },
    { id:77, code:"", name:"منظم ضغط نيتروجين", category:"أجهزة ضغط", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة" },
  ]));
  
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"", serialNo:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("inventory_items", items); }, [items]);
  
  const categories = ["الكل", ...new Set(items.map(i=>i.category))];
  const filtered = items.filter(i => (i.name.includes(search) || i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  
  const saveItem = () => {
    if (!form.name) return showToast("الاسم مطلوب");
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false);
    showToast("✅ تم الحفظ");
  };
  
  const deleteItem = (id) => { if(window.confirm("حذف؟")) { setItems(items.filter(i=>i.id!==id)); showToast("✅ تم الحذف"); } };
  const openEdit = (it) => { setEditId(it.id); setForm({...it}); setAdding(false); };
  const openAdd = () => { setAdding(true); setEditId(null); setForm({ code:"", name:"", category:"أجهزة قياس", qty:1, condition:"جيد", location:"مخزن الآلات الدقيقة", serialNo:"" }); };
  
  const totalItems = items.reduce((s,i)=>s+i.qty,0);
  const damagedItems = items.filter(i=>i.condition==="تالف" || i.condition==="عاطل").length;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select>
        </div>
        <div className="flex gap-2">
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة صنف</button>
          <PrintButton targetId="print-inventory" label="طباعة"/>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-blue-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.length}</p><p className="text-[10px]">إجمالي الأصناف</p></div>
        <div className="bg-slate-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{totalItems}</p><p className="text-[10px]">إجمالي القطع</p></div>
        <div className="bg-emerald-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.filter(i=>i.condition==="جيد").length}</p><p className="text-[10px]">حالة جيدة</p></div>
        <div className="bg-amber-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.filter(i=>i.condition==="مستعمل" || i.condition==="ورشة").length}</p><p className="text-[10px]">مستعمل/ورشة</p></div>
        <div className="bg-red-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{damagedItems}</p><p className="text-[10px]">تالف/عاطل</p></div>
      </div>
      
      {(adding || editId) && (<div className="bg-white rounded-2xl border-2 border-blue-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة صنف":"تعديل صنف"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["الاسم *","name"],["الرمز","code"],["الفئة","category"],["الكمية","qty"],["الموقع","location"],["الرقم التسلسلي","serialNo"]].map(([l,k])=>(
          <div key={k}><label className="block text-[10px] font-bold text-slate-500 mb-1">{l}</label>
          <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
        ))}
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة</label>
        <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
          {["جيد","مستعمل","يحتاج صيانة","تالف","عاطل"].map(c=><option key={c}>{c}</option>)}
        </select></div>
      </div>
      <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
      
      <div id="print-inventory" className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead><tr className="bg-slate-50 border-b"><th>الاسم</th><th>الرمز</th><th>الفئة</th><th>الكمية</th><th>الحالة</th><th>الموقع</th><th>الرقم التسلسلي</th><th>إجراءات</th></tr></thead>
            <tbody>{filtered.map(it=>(
              <tr key={it.id} className="border-b hover:bg-slate-50">
                <td className="px-3 py-2 font-semibold">{it.name}</td>
                <td className="px-3 py-2 font-mono">{it.code||"—"}</td>
                <td className="px-3 py-2">{it.category}</td>
                <td className="px-3 py-2 font-bold">{it.qty}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":it.condition==="تالف"||it.condition==="عاطل"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
                <td className="px-3 py-2">{it.location}</td>
                <td className="px-3 py-2 text-slate-400">{it.serialNo||"—"}</td>
                <td className="px-3 py-2"><div className="flex gap-1"><button onClick={()=>openEdit(it)} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}

// ========== جرد الأثاث والمعدات المكتبية (باستخدام بيانات Excel) ==========
function FurnitureInventory() {
  const [items, setItems] = useState(() => storage.get("furniture_items", [
    // مكيفات
    { id:1, code:"", name:"سبلت 2 طن LG (1)", category:"أجهزة تكييف", qty:1, condition:"تم الشطب", location:"السيطرة والنظم - شعبة الفاو" },
    { id:2, code:"", name:"سبلت 2 طن LG (2)", category:"أجهزة تكييف", qty:1, condition:"تم الشطب", location:"السيطرة والنظم - شعبة الفاو" },
    { id:3, code:"", name:"سبلت 2 طن LG (3)", category:"أجهزة تكييف", qty:1, condition:"تم الشطب", location:"السيطرة والنظم - شعبة الفاو" },
    { id:4, code:"", name:"سبلت 2 طن LG (4)", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:5, code:"", name:"سبلت 2 طن LG (5)", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:6, code:"", name:"سبلت 2 طن LG (6)", category:"أجهزة تكييف", qty:1, condition:"عاطل", location:"السيطرة والنظم - شعبة الفاو" },
    { id:7, code:"", name:"سبلت 2 طن LG (7)", category:"أجهزة تكييف", qty:1, condition:"تالف", location:"المخزن" },
    { id:8, code:"", name:"سبلت 2 طن LG (8)", category:"أجهزة تكييف", qty:1, condition:"عاطل", location:"المخزن" },
    { id:9, code:"1504688400", name:"سبلت 2 طن LG (9)", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:10, code:"1504688401", name:"سبلت 2 طن LG (10)", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:11, code:"1504443042", name:"سبلت 4 طن LG", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:12, code:"", name:"مكيف هواء كرافت 1.5 طن", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    
    // مراوح
    { id:13, code:"1523114957", name:"مروحة عمودية", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:14, code:"1523114958", name:"مروحة عمودية", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:15, code:"05K130042835", name:"مروحة عمودية", category:"أجهزة تكييف", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    
    // أثاث مكتبي - مناضد
    { id:16, code:"1402228079", name:"منضدة كتابة 160 سم", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:17, code:"1402228080", name:"منضدة كتابة 160 سم", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:18, code:"1402139368", name:"منضدة كتابة", category:"أثاث مكتبي", qty:1, condition:"تم الشطب", location:"السيطرة والنظم - شعبة الفاو" },
    { id:19, code:"1402139370", name:"منضدة كتابة", category:"أثاث مكتبي", qty:1, condition:"تالف", location:"السيطرة والنظم - شعبة الفاو" },
    { id:20, code:"1402139371", name:"منضدة كتابة", category:"أثاث مكتبي", qty:1, condition:"تم الشطب", location:"السيطرة والنظم - شعبة الفاو" },
    { id:21, code:"1402139372", name:"منضدة كتابة", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:22, code:"1402139369", name:"منضدة كتابة", category:"أثاث مكتبي", qty:1, condition:"تم الشطب", location:"السيطرة والنظم - شعبة الفاو" },
    { id:23, code:"1402123785", name:"منضدة كتابة خشب", category:"أثاث مكتبي", qty:1, condition:"تالف", location:"السيطرة والنظم - شعبة الفاو" },
    { id:24, code:"1402123786", name:"منضدة كتابة خشب", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:25, code:"1402225456", name:"منضدة كتابة مع ملحق", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:26, code:"1402225457", name:"منضدة كتابة مع ملحق", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:27, code:"1402134055", name:"منضدة كتابة", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:28, code:"1402133738", name:"منضدة كتابة خشب", category:"أثاث مكتبي", qty:1, condition:"تالف", location:"المخزن" },
    { id:29, code:"1402113052", name:"منضدة عمل", category:"أثاث مكتبي", qty:2, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    
    // كراسي
    { id:30, code:"1402035187", name:"كرسي مداولة", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:31, code:"1402035188", name:"كرسي مداولة", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:32, code:"1402035189", name:"كرسي مداولة", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:33, code:"1402035190", name:"كرسي مداولة", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:34, code:"", name:"كرسي مداولة (3 قطع)", category:"أثاث مكتبي", qty:3, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:35, code:"1402024339", name:"كرسي دوار جلد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:36, code:"1402024340", name:"كرسي دوار جلد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:37, code:"", name:"كرسي دوار جلد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:38, code:"1401644198", name:"كرسي بلاستك", category:"أثاث مكتبي", qty:13, condition:"تالف", location:"السيطرة والنظم - شعبة الفاو" },
    { id:39, code:"1402033212", name:"كرسي ذو مسند (6) - تالف", category:"أثاث مكتبي", qty:6, condition:"تالف", location:"السيطرة والنظم - شعبة الفاو" },
    { id:40, code:"1402033212", name:"كرسي ذو مسند (6)", category:"أثاث مكتبي", qty:6, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    
    // مكتبات ودواليب
    { id:41, code:"1402214928", name:"مكتبة خشب (تالف)", category:"أثاث مكتبي", qty:1, condition:"تالف", location:"السيطرة والنظم - شعبة الفاو" },
    { id:42, code:"1402214929", name:"مكتبة خشب (تالف)", category:"أثاث مكتبي", qty:1, condition:"تالف", location:"السيطرة والنظم - شعبة الفاو" },
    { id:43, code:"1402208897", name:"مكتبة بابين", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:44, code:"1402208898", name:"مكتبة بابين", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:45, code:"14022149284929", name:"مكتبة بابين (2 قطعة)", category:"أثاث مكتبي", qty:2, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:46, code:"1402203092", name:"مكتبة بابين", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:47, code:"1402208899", name:"مكتبة بابين", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:48, code:"1402284803", name:"دولاب حديد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:49, code:"1402198907", name:"دولاب حديد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:50, code:"1402198908", name:"دولاب حديد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:51, code:"1402198909", name:"دولاب حديد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:52, code:"1402194054", name:"دولاب حديد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:53, code:"1402193333", name:"دولاب حديد", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    
    // أجهزة كهربائية
    { id:54, code:"1515674402", name:"ثلاجة عمودية فستل 16 قدم", category:"أجهزة كهربائية", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:55, code:"1513674126", name:"ثلاجة فستل 9 قدم", category:"أجهزة كهربائية", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:56, code:"1522042001", name:"براد ماء", category:"أجهزة كهربائية", qty:1, condition:"عاطل", location:"المخزن" },
    { id:57, code:"", name:"مدفأة زيتية", category:"أجهزة كهربائية", qty:2, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:58, code:"1403014212", name:"طباخ كهربائي", category:"أجهزة كهربائية", qty:1, condition:"تالف", location:"المخزن" },
    { id:59, code:"1403024031", name:"فرن كهربائي", category:"أجهزة كهربائية", qty:1, condition:"تالف", location:"المخزن" },
    { id:60, code:"1403114492", name:"مكنسة كهربائية", category:"أجهزة كهربائية", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:61, code:"", name:"سخان ماء", category:"أجهزة كهربائية", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    
    // معدات مكتبية
    { id:62, code:"1901114388", name:"طابعة كانون", category:"معدات مكتبية", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:63, code:"", name:"حاسبة HP", category:"معدات مكتبية", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    
    // متنوعات
    { id:64, code:"", name:"سرير منام (2 قطعة)", category:"أثاث متنوع", qty:2, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
    { id:65, code:"1401263016", name:"شماعة ملابس (4 قطع)", category:"أثاث متنوع", qty:4, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو" },
  ]));
  
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("الكل");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"", serialNo:"" });
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };
  useEffect(() => { storage.set("furniture_items", items); }, [items]);
  
  const categories = ["الكل", ...new Set(items.map(i=>i.category))];
  const filtered = items.filter(i => (i.name.includes(search) || i.code.includes(search)) && (filterCat==="الكل"||i.category===filterCat));
  const totalItems = items.reduce((s,i)=>s+i.qty,0);
  
  const saveItem = () => {
    if (!form.name) return showToast("الاسم مطلوب");
    if (adding) setItems([...items, { ...form, id: Date.now() }]);
    else setItems(items.map(i => i.id===editId ? form : i));
    setEditId(null); setAdding(false);
    showToast("✅ تم الحفظ");
  };
  
  const deleteItem = (id) => { if(window.confirm("حذف؟")) { setItems(items.filter(i=>i.id!==id)); showToast("✅ تم الحذف"); } };
  const openEdit = (it) => { setEditId(it.id); setForm({...it}); };
  const openAdd = () => { setAdding(true); setForm({ code:"", name:"", category:"أثاث مكتبي", qty:1, condition:"جيد", location:"السيطرة والنظم - شعبة الفاو", serialNo:"" }); };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1"><Search size={14} className="text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="bg-transparent text-sm outline-none w-full"/></div>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm">{categories.map(c=><option key={c}>{c}</option>)}</select>
        </div>
        <div className="flex gap-2">
          <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 px-3 py-2 rounded-xl"><Plus size={13}/> إضافة</button>
          <PrintButton targetId="print-furniture" label="طباعة"/>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-violet-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.length}</p><p className="text-[10px]">إجمالي الأصناف</p></div>
        <div className="bg-slate-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{totalItems}</p><p className="text-[10px]">إجمالي القطع</p></div>
        <div className="bg-emerald-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.filter(i=>i.condition==="جيد").length}</p><p className="text-[10px]">حالة جيدة</p></div>
        <div className="bg-red-50 rounded-2xl p-3 text-center border"><p className="text-2xl font-bold">{items.filter(i=>i.condition==="تالف"||i.condition==="عاطل"||i.condition==="تم الشطب").length}</p><p className="text-[10px]">تالف/مشطوب</p></div>
      </div>
      
      {(adding || editId) && (<div className="bg-white rounded-2xl border-2 border-violet-200 p-5"><div className="flex justify-between mb-3"><h4 className="font-bold">{adding?"إضافة قطعة":"تعديل قطعة"}</h4><button onClick={()=>{setEditId(null);setAdding(false);}}><X size={15}/></button></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[["الاسم *","name"],["الرمز","code"],["الفئة","category"],["الكمية","qty"],["الموقع","location"],["الرقم التسلسلي","serialNo"]].map(([l,k])=>(
          <div key={k}><label className="block text-[10px] font-bold text-slate-500 mb-1">{l}</label>
          <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
        ))}
        <div><label className="block text-[10px] font-bold text-slate-500 mb-1">الحالة</label>
        <select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
          {["جيد","مستعمل","يحتاج صيانة","تالف","عاطل","تم الشطب"].map(c=><option key={c}>{c}</option>)}
        </select></div>
      </div>
      <div className="flex gap-2 justify-end mt-4"><button onClick={()=>{setEditId(null);setAdding(false);}} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">إلغاء</button><button onClick={saveItem} className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl"><Save size={13}/> حفظ</button></div></div>)}
      
      <div id="print-furniture" className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead><tr className="bg-slate-50 border-b"><th>الاسم</th><th>الرمز</th><th>الفئة</th><th>الكمية</th><th>الحالة</th><th>الموقع</th><th>الرقم التسلسلي</th><th>إجراءات</th></tr></thead>
            <tbody>{filtered.map(it=>(
              <tr key={it.id} className="border-b hover:bg-slate-50">
                <td className="px-3 py-2 font-semibold">{it.name}</td>
                <td className="px-3 py-2 font-mono">{it.code||"—"}</td>
                <td className="px-3 py-2">{it.category}</td>
                <td className="px-3 py-2 font-bold">{it.qty}</td>
                <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${it.condition==="جيد"?"bg-emerald-100 text-emerald-800":it.condition==="تالف"||it.condition==="عاطل"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{it.condition}</span></td>
                <td className="px-3 py-2">{it.location}</td>
                <td className="px-3 py-2 text-slate-400">{it.serialNo||"—"}</td>
                <td className="px-3 py-2"><div className="flex gap-1"><button onClick={()=>openEdit(it)} className="p-1 text-blue-500"><Edit3 size={12}/></button><button onClick={()=>deleteItem(it.id)} className="p-1 text-red-400"><Trash2 size={12}/></button></div></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-xl"><CheckCircle size={14} className="text-emerald-400 inline ml-2"/>{toast}</div>}
    </div>
  );
}