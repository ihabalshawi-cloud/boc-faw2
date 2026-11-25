import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, AlertCircle, Trash2, Info } from "lucide-react";

const SUGGESTIONS = [
  "كيف أشخّص عطل في محرك كهربائي؟",
  "ما هي إجراءات صيانة بطارية UPS؟",
  "كيف أعيد ضبط PLC بعد انقطاع الكهرباء؟",
  "ما أسباب ارتفاع درجة حرارة المحولات؟",
  "كيف أعاير حساس الضغط؟",
  "ما بروتوكول الاتصال بين RTU والـ SCADA؟",
];

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? "bg-blue-600" : "bg-emerald-600"
      }`}>
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? "bg-blue-600 text-white rounded-tr-sm"
          : "bg-secondary text-primary rounded-tl-sm border border-primary/10"
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 flex-row mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-600">
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-secondary border border-primary/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <span className="flex gap-1 items-center">
          <span className="w-2 h-2 rounded-full bg-secondary-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-secondary-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-secondary-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </div>
    </div>
  );
}

export default function TechnicalAdvisorPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    setError(null);

    const updated = [...messages, { role: "user", content: userText }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "حدث خطأ غير متوقع");
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] bg-primary rounded-xl border border-primary/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-primary/10 bg-secondary/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-primary text-sm">المستشار الفني</h2>
            <p className="text-xs text-secondary-foreground/60">مساعد ذكي لقسم السيطرة والنظم</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-secondary-foreground/60 hover:text-red-500 transition-colors px-2 py-1 rounded"
          >
            <Trash2 size={13} />
            مسح المحادثة
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4" dir="rtl">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Bot size={32} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary text-lg mb-1">مرحباً بك في المستشار الفني</h3>
              <p className="text-secondary-foreground/60 text-sm max-w-sm">
                أنا هنا لمساعدتك في مسائل الصيانة، أنظمة التحكم، والتشغيل الفني.
                يمكنك سؤالي عن أي موضوع تقني.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-right text-xs bg-secondary hover:bg-secondary/80 border border-primary/10 rounded-lg px-3 py-2.5 text-secondary-foreground/80 hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4 text-sm text-red-700 dark:text-red-400" dir="rtl">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-1.5 border-t border-primary/5 bg-secondary/30">
        <p className="text-[10px] text-secondary-foreground/40 flex items-center gap-1 justify-center" dir="rtl">
          <Info size={10} />
          المستشار الفني يقدم إرشادات عامة. راجع دائماً الوثائق الرسمية وخبراء الأمان قبل التنفيذ.
        </p>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-primary/10 bg-secondary/50">
        <div className="flex gap-2 items-end" dir="rtl">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-primary/20 bg-primary px-4 py-2.5 text-sm text-primary placeholder:text-secondary-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 leading-relaxed"
            style={{ maxHeight: "120px", overflowY: "auto" }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-secondary disabled:text-secondary-foreground/30 text-white flex items-center justify-center transition-colors"
          >
            <Send size={16} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
