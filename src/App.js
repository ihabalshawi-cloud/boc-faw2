import { useState, useEffect } from "react";
import { LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User, CheckCircle } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   ACCOUNTS - الكادر الكامل (بيانات ثابتة)
═══════════════════════════════════════════════════════════ */
const ACCOUNTS = [
  {id:1,  jobNum:"728004", password:"1001", name:"ايهاب عبد اللطيف عودة سلمان الشاوي",       title:"ر. مهندسين",   dept:"قسم السيطرة والنظم", shift:"صباحي", role:"admin"},
  {id:2,  jobNum:"727466", password:"1002", name:"عدي فيصل عبد الهادي عبد السيد الربيعه",    title:"ر. مهندسين",   dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:3,  jobNum:"737283", password:"1003", name:"عمر طاهر خزعل سبهان المياحي",              title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:4,  jobNum:"756571", password:"1004", name:"ليث شاكر حمود زعيتر الربيعه",              title:"معاون مهندس",  dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:5,  jobNum:"790850", password:"1005", name:"اسعد عبد الامام يوسف حميد النصاري",        title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"صباحي"},
  {id:6,  jobNum:"758795", password:"1006", name:"صباح عبد الامام يوسف حميد النصاري",        title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"صباحي"},
  {id:7,  jobNum:"719242", password:"1007", name:"احمد محمود عبد القادر عبد الكريم الامير",  title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:8,  jobNum:"790869", password:"1008", name:"محمود كاظم هاشم محمد المنصوري",            title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:9,  jobNum:"790885", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي",        title:"محاسب اقدم",  dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:10, jobNum:"813877", password:"1010", name:"محمد اسماعيل احمد رمضان العلي",            title:"مهندس",        dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:11, jobNum:"439193", password:"1011", name:"علي طاهر خزعل سبهان المياحي",              title:"حرفي اقدم",    dept:"شعبة المرافئ",       shift:"صباحي"},
  {id:12, jobNum:"701130", password:"2001", name:"عبد الله علي زباري يسر عباده",             title:"م.ر. مهندسين", dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A"},
  {id:13, jobNum:"751480", password:"2002", name:"امين حميد فاضل حسين العلي",                title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"A"},
  {id:14, jobNum:"719269", password:"2003", name:"حسين علي احمد قاسم عبادي",                 title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A"},
  {id:15, jobNum:"719498", password:"2004", name:"جاسم مزعل حاتم ديوان الحسين",              title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"A"},
  {id:16, jobNum:"719277", password:"2005", name:"باسم هاشم جاسم هاشم الفارس",               title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"B"},
  {id:17, jobNum:"719293", password:"2006", name:"هاشم جابر جعفر شناوة عباس",                title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"B"},
  {id:18, jobNum:"719463", password:"2007", name:"عبد الحميد سامي موسى بدر العيسى",          title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B"},
  {id:19, jobNum:"736732", password:"2008", name:"احسان عبد الصمد داود",                     title:"مدير فني",     dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"B"},
  {id:20, jobNum:"719048", password:"2009", name:"علاء محسن عذبي جعفر الجعفر",              title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C"},
  {id:21, jobNum:"732249", password:"2010", name:"علي باقر حنتوش",                           title:"م.مدير فني",   dept:"شعبة المرافئ",       shift:"مناوبة", group:"C"},
  {id:22, jobNum:"719051", password:"2011", name:"علي صلاح مهدي العيداني",                   title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"C"},
  {id:23, jobNum:"733501", password:"2012", name:"يوسف ياسين علي ياسين",                     title:"م.مدير فني",   dept:"شعبة مستودع الفاو",  shift:"مناوبة", group:"C"},
  {id:24, jobNum:"719381", password:"2013", name:"ضياء عبد الامير محمد الغانم",              title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D"},
  {id:25, jobNum:"719502", password:"2014", name:"عدنان عبد الجليل عطية",                    title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D"},
  {id:26, jobNum:"736721", password:"2015", name:"احسان محمد سليم السليم",                   title:"م.مدير فني",   dept:"قسم السيطرة والنظم", shift:"مناوبة", group:"D"},
  {id:27, jobNum:"724939", password:"2016", name:"حيدر عبد الحسن خضير جاسم",                 title:"مدير فني",     dept:"شعبة المرافئ",       shift:"مناوبة", group:"D"},
  {id:30, jobNum:"690414", password:"3001", name:"عبد الله عيسى موسى موني",                  title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي"},
  {id:31, jobNum:"689766", password:"3002", name:"اباذر صالح عبد الحسين عيسى",               title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحی", role:"attendance_admin"},
  {id:32, jobNum:"690174", password:"3003", name:"حسن عادل عمران يوسف",                       title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", role:"attendance_admin"},
  {id:33, jobNum:"689331", password:"3004", name:"سجاد علي راضي علي",                        title:"عقد",          dept:"قسم السيطرة والنظم", shift:"صباحي", role:"attendance_admin"},
];

// تشفير بسيط للتخزين المحلي
const SEC = {
  encode: (str) => {
    if (!str) return "";
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch { return str; }
  },
  decode: (str) => {
    if (!str) return "";
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch { return str; }
  },
  verify: (input, stored) => {
    if (!input || !stored) return false;
    if (input.trim() === stored.trim()) return true;
    try {
      return input.trim() === SEC.decode(stored).trim();
    } catch { return false; }
  }
};

// دوال التخزين المحلي
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch { return defaultValue; }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch { return false; }
  }
};

// تسجيل الدخول
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // محاولة استعادة الجلسة
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("boc_session");
      if (saved) {
        const { acctId, expiry } = JSON.parse(saved);
        if (expiry > Date.now()) {
          const acct = ACCOUNTS.find(a => a.id === acctId);
          if (acct) onLogin(acct);
        } else {
          sessionStorage.removeItem("boc_session");
        }
      }
    } catch {}
  }, [onLogin]);

  const handleLogin = () => {
    setErr("");
    if (!user || !pass) {
      setErr("أدخل الرقم الوظيفي وكلمة المرور");
      return;
    }

    const account = ACCOUNTS.find(a => a.jobNum === user.trim());
    if (!account) {
      setErr("الرقم الوظيفي غير موجود");
      return;
    }

    // التحقق من كلمة المرور
    let isValid = false;
    
    // أولاً: التحقق من كلمة المرور المخزنة محلياً (إذا تم تغييرها)
    const storedPass = storage.get(`pass_${account.id}`);
    if (storedPass) {
      isValid = SEC.verify(pass.trim(), storedPass);
    } else {
      isValid = (pass.trim() === account.password);
      // إذا كانت صحيحة وكلمة المرور افتراضية، نطلب تغييرها لاحقاً
      if (isValid) {
        const encrypted = SEC.encode(pass.trim());
        storage.set(`pass_${account.id}`, encrypted);
      }
    }

    if (isValid) {
      // حفظ الجلسة
      sessionStorage.setItem("boc_session", JSON.stringify({
        acctId: account.id,
        expiry: Date.now() + 8 * 60 * 60 * 1000
      }));
      
      // التحقق إذا كانت كلمة المرور افتراضية
      const defaultPasswords = ["1001","1002","1003","1004","1005","1006","1007","1008","1009","1010","1011",
                                 "2001","2002","2003","2004","2005","2006","2007","2008","2009","2010",
                                 "2011","2012","2013","2014","2015","2016","3001","3002","3003","3004"];
      if (defaultPasswords.includes(pass.trim())) {
        sessionStorage.setItem("force_password_change", "true");
      }
      
      onLogin(account);
    } else {
      setErr("كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <LogIn size={32} className="text-white"/>
          </div>
          <h2 className="text-2xl font-bold text-white">شركة نفط البصرة</h2>
          <p className="text-sm text-slate-300 mt-2">شعبة مستودع الفاو — نظام الإجازات</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">الرقم الوظيفي</label>
            <input 
              type="text" 
              value={user} 
              onChange={(e) => setUser(e.target.value)} 
              disabled={loading}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              placeholder="مثال: 728004" 
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">كلمة المرور</label>
            <div className="relative">
              <input 
                type={showP ? "text" : "password"} 
                value={pass} 
                onChange={(e) => setPass(e.target.value)} 
                disabled={loading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="••••••••" 
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button 
                type="button" 
                onClick={() => setShowP(!showP)} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showP ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>
          
          {err && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={16}/> {err}
            </div>
          )}
          
          <button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </div>
        
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>للتجربة: الرقم الوظيفي <strong className="text-blue-300">728004</strong> | كلمة المرور <strong className="text-blue-300">1001</strong></p>
        </div>
      </div>
    </div>
  );
}

// صفحة تغيير كلمة المرور
function ChangePasswordPage({ emp, onLogout }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = () => {
    if (!newPass || newPass.trim().length < 4) {
      setMsg({ text: "كلمة المرور يجب أن تكون 4 خانات أو أكثر", type: "error" });
      return;
    }
    if (newPass.trim() !== confirm.trim()) {
      setMsg({ text: "كلمات المرور غير متطابقة", type: "error" });
      return;
    }

    setLoading(true);
    
    try {
      const encrypted = SEC.encode(newPass.trim());
      storage.set(`pass_${emp.id}`, encrypted);
      
      // تحديث الجلسة
      const sessionData = sessionStorage.getItem("boc_session");
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        sessionStorage.setItem("boc_session", JSON.stringify({
          ...parsed,
          expiry: Date.now() + 8 * 60 * 60 * 1000
        }));
      }
      
      sessionStorage.removeItem("force_password_change");
      setMsg({ text: "✅ تم تغيير كلمة المرور بنجاح!", type: "success" });
      setNewPass("");
      setConfirm("");
      
      setTimeout(() => {
        if (window.confirm("تم تغيير كلمة المرور. هل تريد تسجيل الخروج واستخدام الكلمة الجديدة؟")) {
          onLogout();
        }
      }, 1500);
    } catch (error) {
      setMsg({ text: "حدث خطأ أثناء حفظ كلمة المرور", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 border-b pb-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Shield size={20} className="text-blue-600"/>
          </div>
          <div>
            <h2 className="font-bold text-slate-800">تغيير كلمة المرور</h2>
            <p className="text-xs text-slate-500">{emp.name}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-600 block mb-1">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showN ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-blue-500"
              />
              <button onClick={() => setShowN(!showN)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showN ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-bold text-slate-600 block mb-1">تأكيد كلمة المرور</label>
            <input
              type={showN ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="أعد إدخال كلمة المرور"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {msg && (
            <div className={`p-3 rounded-xl text-sm text-center ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {msg.text}
            </div>
          )}
          
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={16}/> {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
          </button>
          
          <button
            onClick={onLogout}
            className="w-full border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

// الصفحة الرئيسية
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  
  useEffect(() => {
    const needsChange = sessionStorage.getItem("force_password_change");
    if (needsChange === "true") {
      sessionStorage.removeItem("force_password_change");
      setTimeout(() => {
        if (window.confirm("🔐 لأسباب أمنية، يرجى تغيير كلمة المرور الافتراضية الآن.")) {
          setView("changepass");
        }
      }, 500);
    }
  }, []);

  const isAdmin = emp.role === "admin" || emp.jobNum === "728004";

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* شريط علوي */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">BOC</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800">شركة نفط البصرة</h1>
            <p className="text-xs text-slate-500">شعبة مستودع الفاو</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">{emp.name.split(" ").slice(0,2).join(" ")}</p>
            <p className="text-xs text-slate-500">{emp.title}</p>
          </div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={18}/>
          </button>
        </div>
      </div>
      
      {/* المحتوى */}
      <div className="p-6">
        {view === "home" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <User size={28} className="text-white"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">مرحباً، {emp.name.split(" ")[0]}</h2>
                  <p className="text-slate-500">تم تسجيل الدخول بنجاح إلى نظام شعبة مستودع الفاو</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-600"/>
                    <div>
                      <p className="font-bold text-emerald-800">حالة النظام</p>
                      <p className="text-sm text-emerald-700">✓ يعمل بشكل طبيعي</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-blue-600"/>
                    <div>
                      <p className="font-bold text-blue-800">معلومات الحساب</p>
                      <p className="text-sm text-blue-700">الرقم الوظيفي: {emp.jobNum}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={() => setView("changepass")}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold"
                >
                  <Shield size={16}/> تغيير كلمة المرور
                </button>
              </div>
            </div>
          </div>
        )}
        
        {view === "changepass" && (
          <ChangePasswordPage emp={emp} onLogout={onLogout}/>
        )}
      </div>
    </div>
  );
}

// التطبيق الرئيسي
export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (account) => {
    setUser(account);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("boc_session");
    sessionStorage.removeItem("force_password_change");
    setUser(null);
  };

  return user ? (
    <Dashboard emp={user} onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}