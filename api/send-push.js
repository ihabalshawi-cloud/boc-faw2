// Vercel serverless function — Web Push sender
const webpush = require("web-push");

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || "mailto:admin@boc.iq";
  if (!pub || !priv) return;
  webpush.setVapidDetails(subj, pub, priv);
  vapidConfigured = true;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  ensureVapid();
  if (!vapidConfigured) return res.status(500).json({ error: "VAPID not configured" });

  const { subscriptions, notification } = req.body || {};
  if (!Array.isArray(subscriptions) || !notification) {
    return res.status(400).json({ error: "missing subscriptions or notification" });
  }

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(sub, JSON.stringify(notification)).catch(e => {
        if (e.statusCode === 410 || e.statusCode === 404) throw e; // expired subscription
        throw e;
      })
    )
  );

  const sent = results.filter(r => r.status === "fulfilled").length;
  res.status(200).json({ sent, total: subscriptions.length });
};
