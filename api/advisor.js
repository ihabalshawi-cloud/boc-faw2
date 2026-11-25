// Vercel serverless function — Technical Advisor (AI chat proxy)
// Uses Groq API (free tier). Keeps GROQ_API_KEY server-side.

const SYSTEM_PROMPT = `أنت المستشار الفني لشركة نفط البصرة، قسم السيطرة والنظم.
مهمتك مساعدة موظفي القسم في مجالات:
- أنظمة SCADA والتحكم الصناعي (DCS, PLC, RTU)
- صيانة المعدات الميكانيكية والكهربائية في حقول النفط
- أعطال الأجهزة والحساسات وأجهزة القياس
- بروتوكولات الاتصالات الصناعية (Modbus, Profibus, HART, OPC)
- إجراءات السلامة والتشغيل الآمن
- مواصفات المواد وقطع الغيار

أسلوب التواصل:
- استخدم اللغة العربية دائماً
- كن محدداً وعملياً في إجاباتك
- اذكر الإجراءات خطوة بخطوة عند الحاجة
- نبّه إلى متطلبات السلامة عند الضرورة
- إذا لم تكن متأكداً، قل ذلك بوضوح وأحل إلى خبير متخصص`;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "الخدمة غير مهيأة. يرجى إضافة GROQ_API_KEY في إعدادات Vercel." });

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "الرسائل مطلوبة" });
  }

  // Validate messages (Groq uses OpenAI-compatible format)
  const validRoles = new Set(["user", "assistant"]);
  const clean = messages
    .filter(m => m && validRoles.has(m.role) && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.trim() }));

  if (clean.length === 0 || clean[clean.length - 1].role !== "user") {
    return res.status(400).json({ error: "يجب أن تكون آخر رسالة من المستخدم" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        max_tokens: 2048,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `HTTP ${response.status}`;
      return res.status(502).json({ error: `خطأ من خدمة Groq: ${msg}` });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("advisor error:", err);
    return res.status(502).json({ error: "تعذر الاتصال بخدمة Groq" });
  }
};
