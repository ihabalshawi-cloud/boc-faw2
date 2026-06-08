import { useState, useEffect, useCallback, useRef } from "react";
import { 
  LogIn, LogOut, Shield, Eye, EyeOff, AlertCircle, Save, Home, User, 
  CheckCircle, Wifi, WifiOff, RefreshCw, FileText, Clock, Calendar,
  Bell, ThumbsUp, ThumbsDown, Plus, Trash2, Edit3, X, Users, Package,
  ClipboardList, GraduationCap, BarChart, Star, Target, ArrowRightLeft,
  Printer, Download, Upload, Search, Settings, Award, Truck, Box
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   FIREBASE CONFIG
═══════════════════════════════════════════════════════════ */
const FIREBASE_URL = "https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app";

/* ═══════════════════════════════════════════════════════════
   ACCOUNTS - الكادر الكامل
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
  {id:9,  jobNum:"790885", password:"1009", name:"محمد عبد الكاظم جاسم محمد التميمي",        title:"محاسب اقدم",  dept:"قسم السيطرة والنظم", shift:"صباحي", role:"inventory_manager"},
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

// أنواع الإجازات
const LEAVE_TYPES = {
  اعتيادية: { label: "إجازة اعتيادية", max: 30, color: "bg-blue-100 text-blue-700", icon: "🏖️" },
  مرضية: { label: "إجازة مرضية", max: 15, color: "bg-rose-100 text-rose-700", icon: "🏥" },
  زمنية: { label: "إجازة زمنية", max: 7, color: "bg-amber-100 text-amber-700", icon: "⏱️" },
};

// التشفير
const SEC = {
  encode: (str) => {
    if (!str) return "";
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch { return str; }
  },
  verify: (input, stored) => {
    if (!input || !stored) return false;
    if (input.trim() === stored.trim()) return true;
    try {
      return input.trim() === atob(stored);
    } catch { return false; }
  }
};

// التخزين المحلي
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
  }
};

/* ═══════════════════════════════════════════════════════════
   FIREBASE API - المزامنة الكاملة
═══════════════════════════════════════════════════════════ */
const FirebaseAPI = {
  checkConnection: async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${FIREBASE_URL}/.json`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch { return false; }
  },

  // كلمات المرور
  savePassword: async (empId, encrypted) => {
    try {
      await fetch(`${FIREBASE_URL}/passwords/${empId}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encrypted)
      });
      return true;
    } catch { return false; }
  },

  getPassword: async (empId) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/passwords/${empId}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data === "string" ? data : null;
    } catch { return null; }
  },

  // الطلبات
  saveRequest: async (request) => {
    try {
      await fetch(`${FIREBASE_URL}/requests/${request.id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });
      return true;
    } catch { return false; }
  },

  getAllRequests: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/requests.json`);
      if (!res.ok) return [];
      const data = await res.json();
      return data ? Object.values(data) : [];
    } catch { return []; }
  },

  deleteRequest: async (id) => {
    try {
      await fetch(`${FIREBASE_URL}/requests/${id}.json`, { method: "DELETE" });
      return true;
    } catch { return false; }
  },

  // الإشعارات
  saveNotification: async (empId, notification) => {
    try {
      await fetch(`${FIREBASE_URL}/notifications/${empId}/${notification.id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification)
      });
      return true;
    } catch { return false; }
  },

  getNotifications: async (empId) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/notifications/${empId}.json`);
      if (!res.ok) return [];
      const data = await res.json();
      return data ? Object.values(data).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];
    } catch { return []; }
  },

  // سجل الدخول
  saveLoginHistory: async (entry) => {
    try {
      await fetch(`${FIREBASE_URL}/login_history/${entry.id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      });
      return true;
    } catch { return false; }
  },

  getLoginHistory: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/login_history.json?orderBy="$key"&limitToLast=50`);
      if (!res.ok) return [];
      const data = await res.json();
      return data ? Object.values(data).reverse() : [];
    } catch { return []; }
  }
};

// Hook لحالة الاتصال
function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    const connected = await FirebaseAPI.checkConnection();
    setIsConnected(connected);
    setChecking(false);
  }, []);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { isConnected, checking, checkConnection };
}

// ========== شاشة تسجيل الدخول ==========
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();

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

  const handleLogin = async () => {
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

    setLoading(true);
    
    let isValid = false;
    
    // محاولة التحقق من Firebase
    if (isConnected) {
      const fbPass = await FirebaseAPI.getPassword(account.id);
      if (fbPass) {
        isValid = SEC.verify(pass.trim(), fbPass);
        if (isValid) {
          storage.set(`pass_${account.id}`, fbPass);
        }
      }
    }
    
    // التحقق محلياً
    if (!isValid) {
      const storedPass = storage.get(`pass_${account.id}`);
      if (storedPass) {
        isValid = SEC.verify(pass.trim(), storedPass);
      } else {
        isValid = (pass.trim() === account.password);
        if (isValid && isConnected) {
          const encrypted = btoa(pass.trim());
          await FirebaseAPI.savePassword(account.id, encrypted);
          storage.set(`pass_${account.id}`, encrypted);
        }
      }
    }

    if (isValid) {
      // تسجيل الدخول
      const loginEntry = {
        id: Date.now(),
        empId: account.id,
        empName: account.name,
        loginAt: new Date().toISOString(),
      };
      
      if (isConnected) {
        await FirebaseAPI.saveLoginHistory(loginEntry);
      }
      
      sessionStorage.setItem("boc_session", JSON.stringify({
        acctId: account.id,
        expiry: Date.now() + 8 * 60 * 60 * 1000
      }));
      
      const defaultPasswords = ["1001","1002","1003","1004","1005","2001","2002","2003","3001","3002","3003","3004"];
      if (defaultPasswords.includes(pass.trim())) {
        sessionStorage.setItem("force_password_change", "true");
      }
      
      onLogin(account);
    } else {
      setErr("كلمة المرور غير صحيحة");
    }
    setLoading(false);
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
        
        {/* حالة الاتصال */}
        <div className="mb-4 flex items-center justify-center gap-2 text-xs">
          {isConnected ? (
            <>
              <Wifi size={12} className="text-emerald-400"/>
              <span className="text-emerald-400">✓ متصل بالسحابة</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-amber-400"/>
              <span className="text-amber-400">⚠ وضع غير متصل (محلي)</span>
            </>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">الرقم الوظيفي</label>
            <input 
              type="text" 
              value={user} 
              onChange={(e) => setUser(e.target.value)} 
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
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="••••••••" 
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button 
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
          <p>للتجربة: <strong className="text-blue-300">728004</strong> | <strong className="text-blue-300">1001</strong></p>
        </div>
      </div>
    </div>
  );
}

// ========== صفحة تغيير كلمة المرور ==========
function ChangePasswordPage({ emp, onLogout }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useConnectionStatus();

  const handleChangePassword = async () => {
    if (!newPass || newPass.trim().length < 4) {
      setMsg({ text: "⚠️ كلمة المرور يجب أن تكون 4 خانات أو أكثر", type: "error" });
      return;
    }
    if (newPass.trim() !== confirm.trim()) {
      setMsg({ text: "⚠️ كلمات المرور غير متطابقة", type: "error" });
      return;
    }

    setLoading(true);
    
    try {
      const encrypted = btoa(newPass.trim());
      storage.set(`pass_${emp.id}`, encrypted);
      
      if (isConnected) {
        await FirebaseAPI.savePassword(emp.id, encrypted);
      }
      
      sessionStorage.removeItem("force_password_change");
      setMsg({ text: isConnected ? "✅ تم تغيير كلمة المرور ومزامنتها مع السحابة!" : "✅ تم تغيير كلمة المرور محلياً", type: "success" });
      setNewPass("");
      setConfirm("");
      
      setTimeout(() => {
        if (window.confirm("تم تغيير كلمة المرور. هل تريد تسجيل الخروج؟")) {
          onLogout();
        }
      }, 1500);
    } catch (error) {
      setMsg({ text: "❌ حدث خطأ", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
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
            <div className={`p-3 rounded-xl text-sm text-center ${
              msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
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
        </div>
      </div>
    </div>
  );
}

// ========== صفحة الطلبات ==========
function RequestsPage({ emp }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: "اعتيادية",
    dateFrom: new Date().toISOString().slice(0,10),
    dateTo: new Date().toISOString().slice(0,10),
    purpose: ""
  });
  const [errors, setErrors] = useState({});
  const { isConnected } = useConnectionStatus();

  // تحميل الطلبات
  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      if (isConnected) {
        const allRequests = await FirebaseAPI.getAllRequests();
        const myRequests = allRequests.filter(r => r.empId === emp.id);
        setRequests(myRequests);
      } else {
        const local = storage.get(`requests_${emp.id}`, []);
        setRequests(local);
      }
      setLoading(false);
    };
    loadRequests();
  }, [emp.id, isConnected]);

  const saveRequest = async (request) => {
    if (isConnected) {
      await FirebaseAPI.saveRequest(request);
    }
    storage.set(`requests_${emp.id}`, [request, ...requests]);
    setRequests([request, ...requests]);
  };

  const deleteRequest = async (id) => {
    if (window.confirm("هل تريد حذف هذا الطلب؟")) {
      if (isConnected) {
        await FirebaseAPI.deleteRequest(id);
      }
      const updated = requests.filter(r => r.id !== id);
      storage.set(`requests_${emp.id}`, updated);
      setRequests(updated);
    }
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.purpose.trim()) newErrors.purpose = "الغرض مطلوب";
    if (new Date(formData.dateFrom) > new Date(formData.dateTo)) newErrors.date = "تاريخ البداية يجب أن يكون قبل تاريخ النهاية";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const days = Math.ceil((new Date(formData.dateTo) - new Date(formData.dateFrom)) / 86400000) + 1;
    const maxDays = LEAVE_TYPES[formData.type].max;
    
    if (days > maxDays) {
      setErrors({ days: `الحد الأقصى ${maxDays} يوم` });
      return;
    }
    
    const newRequest = {
      id: Date.now(),
      ...formData,
      days,
      status: "بانتظار المراجعة",
      submittedAt: new Date().toISOString(),
      empId: emp.id,
      empName: emp.name,
    };
    
    saveRequest(newRequest);
    setShowForm(false);
    setFormData({ type: "اعتيادية", dateFrom: new Date().toISOString().slice(0,10), dateTo: new Date().toISOString().slice(0,10), purpose: "" });
    setErrors({});
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "بانتظار المراجعة": return "bg-amber-100 text-amber-700";
      case "موافق عليها": return "bg-emerald-100 text-emerald-700";
      case "مرفوضة": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-lg">طلبات الإجازة</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
        >
          <Plus size={16}/> طلب جديد
        </button>
      </div>
      
      {/* نموذج إضافة طلب */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-4">طلب إجازة جديد</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">نوع الإجازة</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                {Object.entries(LEAVE_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={formData.dateFrom}
                  onChange={(e) => setFormData({...formData, dateFrom: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={formData.dateTo}
                  onChange={(e) => setFormData({...formData, dateTo: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">الغرض</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                placeholder="اكتب سبب الإجازة..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            {errors.purpose && <p className="text-red-500 text-xs">{errors.purpose}</p>}
            {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
            {errors.days && <p className="text-red-500 text-xs">{errors.days}</p>}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                إرسال الطلب
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* قائمة الطلبات */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
          <FileText size={40} className="mx-auto mb-3 text-slate-300"/>
          <p>لا توجد طلبات إجازة</p>
          <p className="text-sm mt-1">اضغط على "طلب جديد" لإضافة طلب</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${LEAVE_TYPES[req.type]?.color || "bg-slate-100"}`}>
                      {LEAVE_TYPES[req.type]?.label || req.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    من {req.dateFrom} إلى {req.dateTo} — {req.days} يوم
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{req.purpose}</p>
                  <p className="text-[10px] text-slate-300 mt-2">
                    تاريخ التقديم: {new Date(req.submittedAt).toLocaleDateString("ar-IQ")}
                  </p>
                </div>
                {req.status === "بانتظار المراجعة" && (
                  <button
                    onClick={() => deleteRequest(req.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={16}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== صفحة الموافقات (للمشرف) ==========
function ApprovalsPage({ emp }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useConnectionStatus();

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      if (isConnected) {
        const allRequests = await FirebaseAPI.getAllRequests();
        const pending = allRequests.filter(r => r.status === "بانتظار المراجعة");
        setRequests(pending);
      }
      setLoading(false);
    };
    loadRequests();
  }, [isConnected]);

  const updateStatus = async (id, status) => {
    const request = requests.find(r => r.id === id);
    if (!request) return;
    
    const updated = { ...request, status };
    
    if (isConnected) {
      await FirebaseAPI.saveRequest(updated);
    }
    
    // إرسال إشعار للموظف
    if (isConnected) {
      await FirebaseAPI.saveNotification(request.empId, {
        id: Date.now(),
        type: status === "موافق عليها" ? "موافقة" : "رفض",
        title: status === "موافق عليها" ? "✅ تمت الموافقة على طلبك" : "❌ تم رفض طلبك",
        body: `${request.type} — ${request.days} يوم`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    
    setRequests(requests.filter(r => r.id !== id));
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 text-lg">الطلبات المعلقة ({requests.length})</h3>
      
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
          <CheckCircle size={40} className="mx-auto mb-3 text-slate-300"/>
          <p>لا توجد طلبات معلقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-slate-800">{req.empName}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${LEAVE_TYPES[req.type]?.color || "bg-slate-100"}`}>
                      {LEAVE_TYPES[req.type]?.label || req.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    من {req.dateFrom} إلى {req.dateTo} — {req.days} يوم
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{req.purpose}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(req.id, "موافق عليها")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                  >
                    <ThumbsUp size={12}/> قبول
                  </button>
                  <button
                    onClick={() => updateStatus(req.id, "مرفوضة")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                  >
                    <ThumbsDown size={12}/> رفض
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== صفحة الإشعارات ==========
function NotificationsPage({ emp }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useConnectionStatus();

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      if (isConnected) {
        const notifs = await FirebaseAPI.getNotifications(emp.id);
        setNotifications(notifs);
      }
      setLoading(false);
    };
    loadNotifications();
  }, [emp.id, isConnected]);

  const markAsRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      const updated = { ...notif, read: true };
      if (isConnected) {
        await FirebaseAPI.saveNotification(emp.id, updated);
      }
      setNotifications(notifications.map(n => n.id === id ? updated : n));
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-slate-800 text-lg">الإشعارات</h3>
      
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
          <Bell size={40} className="mx-auto mb-3 text-slate-300"/>
          <p>لا توجد إشعارات</p>
        </div>
      ) : (
        notifications.map(notif => (
          <div 
            key={notif.id} 
            onClick={() => markAsRead(notif.id)}
            className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition ${
              notif.read ? "border-slate-100 opacity-70" : "border-blue-200 bg-blue-50/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${notif.type === "موافقة" ? "bg-emerald-100" : notif.type === "رفض" ? "bg-red-100" : "bg-blue-100"}`}>
                {notif.type === "موافقة" ? <ThumbsUp size={16} className="text-emerald-600"/> :
                 notif.type === "رفض" ? <ThumbsDown size={16} className="text-red-600"/> :
                 <Bell size={16} className="text-blue-600"/>}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{notif.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{notif.body}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(notif.timestamp).toLocaleString("ar-IQ")}
                </p>
              </div>
              {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full"/>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ========== إحصائيات المشرف ==========
function AdminStatsPage() {
  const [stats, setStats] = useState({ employees: ACCOUNTS.length, pending: 0, total: 0 });
  const { isConnected } = useConnectionStatus();

  useEffect(() => {
    const loadStats = async () => {
      if (isConnected) {
        const requests = await FirebaseAPI.getAllRequests();
        setStats(prev => ({ ...prev, pending: requests.filter(r => r.status === "بانتظار المراجعة").length, total: requests.length }));
      }
    };
    loadStats();
  }, [isConnected]);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 text-lg">إحصائيات النظام</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <Users size={28} className="mb-2 opacity-80"/>
          <p className="text-3xl font-bold">{stats.employees}</p>
          <p className="text-sm opacity-80">إجمالي الموظفين</p>
        </div>
        
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <Clock size={28} className="mb-2 opacity-80"/>
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm opacity-80">طلبات معلقة</p>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
          <FileText size={28} className="mb-2 opacity-80"/>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm opacity-80">إجمالي الطلبات</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl p-5 border border-slate-200">
        <h4 className="font-bold text-slate-800 mb-3">حالة المزامنة</h4>
        <div className="flex items-center gap-3">
          <Wifi size={20} className={isConnected ? "text-emerald-500" : "text-amber-500"}/>
          <span>{isConnected ? "✓ متصل بالسحابة - البيانات متزامنة" : "⚠ غير متصل - البيانات محلية"}</span>
        </div>
      </div>
    </div>
  );
}

// ========== لوحة التحكم الرئيسية ==========
function Dashboard({ emp, onLogout }) {
  const [view, setView] = useState("home");
  const { isConnected } = useConnectionStatus();
  const isAdmin = emp.role === "admin" || emp.jobNum === "728004";
  
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

  const menuItems = [
    { id: "home", label: "الرئيسية", icon: <Home size={18}/> },
    { id: "requests", label: "طلبات الإجازة", icon: <FileText size={18}/> },
    { id: "notifications", label: "الإشعارات", icon: <Bell size={18}/> },
    { id: "changepass", label: "تغيير كلمة المرور", icon: <Shield size={18}/> },
  ];

  if (isAdmin) {
    menuItems.push(
      { id: "approvals", label: "الموافقات", icon: <ThumbsUp size={18}/> },
      { id: "stats", label: "الإحصائيات", icon: <BarChart size={18}/> }
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* الشريط العلوي */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">BOC</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800">شركة نفط البصرة</h1>
            <p className="text-xs text-slate-500">شعبة مستودع الفاو — نظام الإجازات</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* حالة الاتصال */}
          <div className="flex items-center gap-2 text-xs">
            {isConnected ? (
              <>
                <Wifi size={12} className="text-emerald-500"/>
                <span className="text-emerald-700">متصل بالسحابة</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-amber-500"/>
                <span className="text-amber-700">غير متصل (محلي)</span>
              </>
            )}
          </div>
          
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">{emp.name.split(" ").slice(0,2).join(" ")}</p>
            <p className="text-xs text-slate-500">{emp.title}</p>
          </div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={18}/>
          </button>
        </div>
      </div>
      
      {/* القائمة الجانبية والمحتوى */}
      <div className="flex flex-col md:flex-row">
        {/* القائمة الجانبية */}
        <aside className="md:w-64 bg-white border-l border-slate-200 md:min-h-screen p-4">
          <nav className="space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  view === item.id 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          
          {/* معلومات المزامنة */}
          <div className="mt-6 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
            <p className="font-bold mb-2 flex items-center gap-2">
              <RefreshCw size={12}/> حالة المزامنة
            </p>
            <p className="text-[11px]">• كلمات المرور: {isConnected ? "متزامنة" : "محلية"}</p>
            <p className="text-[11px]">• الطلبات: {isConnected ? "سحابية" : "محلية"}</p>
            {isConnected && <p className="text-[10px] text-emerald-600 mt-1">✓ المزامنة التلقائية مفعلة</p>}
          </div>
        </aside>
        
        {/* المحتوى الرئيسي */}
        <main className="flex-1 p-6">
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
                        {isConnected && <p className="text-xs text-emerald-600 mt-1">✓ متصل بالسحابة</p>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Shield size={20} className="text-blue-600"/>
                      <div>
                        <p className="font-bold text-blue-800">معلومات الحساب</p>
                        <p className="text-sm text-blue-700">الرقم الوظيفي: {emp.jobNum}</p>
                        <p className="text-xs text-blue-600 mt-1">الدور: {isAdmin ? "مشرف" : "موظف"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-slate-600 text-sm">
                    يمكنك من خلال القائمة الجانبية:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-500">
                    <li>• 📋 تقديم طلب إجازة جديد</li>
                    <li>• 🔔 متابعة الإشعارات</li>
                    <li>• 🔐 تغيير كلمة المرور</li>
                    {isAdmin && <li>• ✅ الموافقة على طلبات الموظفين</li>}
                    {isAdmin && <li>• 📊 عرض إحصائيات النظام</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {view === "requests" && <RequestsPage emp={emp} />}
          {view === "notifications" && <NotificationsPage emp={emp} />}
          {view === "changepass" && <ChangePasswordPage emp={emp} onLogout={onLogout} />}
          {view === "approvals" && isAdmin && <ApprovalsPage emp={emp} />}
          {view === "stats" && isAdmin && <AdminStatsPage />}
        </main>
      </div>
    </div>
  );
}

// ========== التطبيق الرئيسي ==========
export default function App() {
  const [user, setUser] = useState(null);

  return user ? (
    <Dashboard emp={user} onLogout={() => {
      sessionStorage.clear();
      setUser(null);
    }} />
  ) : (
    <LoginScreen onLogin={setUser} />
  );
}