// Vercel serverless function — Google Drive proxy
//
// Auth priority (first configured wins):
//   1. OAuth2 Refresh Token  — GDRIVE_CLIENT_ID + GDRIVE_CLIENT_SECRET + GDRIVE_REFRESH_TOKEN
//      → files are owned by a real Google user → full 15 GB quota
//   2. Service Account JWT   — GDRIVE_SERVICE_ACCOUNT (JSON key)
//      ⚠️  Service accounts have NO personal Drive storage; uploads fail with
//          storageQuotaExceeded unless GDRIVE_FOLDER_ID points to a Shared Drive.
//
// Optional: GDRIVE_FOLDER_ID — parent folder ID for uploaded files

const { createSign } = require("crypto");

let _cachedToken  = null;
let _tokenExpiry  = 0;
let _authMethod   = null; // "oauth2" | "service_account"

// ── OAuth2 Refresh Token ──────────────────────────────────────────────────────
async function getTokenViaRefresh() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GDRIVE_CLIENT_ID,
      client_secret: process.env.GDRIVE_CLIENT_SECRET,
      refresh_token: process.env.GDRIVE_REFRESH_TOKEN,
      grant_type:    "refresh_token",
    }),
  });
  const data = await r.json();
  if (!data.access_token)
    throw new Error(data.error_description || data.error || "Failed to refresh OAuth2 token");
  return { token: data.access_token, expiresIn: data.expires_in || 3600 };
}

// ── Service Account JWT ───────────────────────────────────────────────────────
function base64url(obj) {
  const str = typeof obj === "string" ? obj : JSON.stringify(obj);
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getTokenViaServiceAccount() {
  const sa  = JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const hdr = base64url({ alg: "RS256", typ: "JWT" });
  const cla = base64url({
    iss:   sa.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud:   sa.token_uri || "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  });
  const sigInput = `${hdr}.${cla}`;
  const signer   = createSign("RSA-SHA256");
  signer.update(sigInput);
  const sig = signer.sign(sa.private_key, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const jwt = `${sigInput}.${sig}`;

  const tokenUrl = sa.token_uri || "https://oauth2.googleapis.com/token";
  const r = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });
  const data = await r.json();
  if (!data.access_token)
    throw new Error(data.error_description || data.error || "Failed to get service account token");
  return { token: data.access_token, expiresIn: data.expires_in || 3600 };
}

// ── Unified token getter (with 1-min buffer cache) ────────────────────────────
async function getToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60000) return _cachedToken;

  const hasOAuth2 =
    process.env.GDRIVE_CLIENT_ID &&
    process.env.GDRIVE_CLIENT_SECRET &&
    process.env.GDRIVE_REFRESH_TOKEN;

  const hasSA = !!process.env.GDRIVE_SERVICE_ACCOUNT;

  if (!hasOAuth2 && !hasSA)
    throw new Error("Drive not configured: set GDRIVE_REFRESH_TOKEN+GDRIVE_CLIENT_ID+GDRIVE_CLIENT_SECRET, or GDRIVE_SERVICE_ACCOUNT");

  const { token, expiresIn } = hasOAuth2
    ? ((_authMethod = "oauth2"),    await getTokenViaRefresh())
    : ((_authMethod = "service_account"), await getTokenViaServiceAccount());

  _cachedToken = token;
  _tokenExpiry = Date.now() + expiresIn * 1000;
  return _cachedToken;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ── Request handler ───────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin",  allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-filename, x-file-mime, x-file-size, x-session-uri, x-content-range");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const url    = new URL(req.url, "https://placeholder.invalid");
  const action = url.searchParams.get("action");

  try {
    // ── ping ─────────────────────────────────────────────────
    if (action === "ping") {
      await getToken();
      let saEmail = null;
      if (process.env.GDRIVE_SERVICE_ACCOUNT) {
        try { saEmail = JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT).client_email; } catch {}
      }
      res.status(200).json({
        ok:       true,
        auth:     _authMethod,
        hasFolder: !!process.env.GDRIVE_FOLDER_ID,
        saEmail,
      });
      return;
    }

    const token    = await getToken();
    const folderId = process.env.GDRIVE_FOLDER_ID;

    // ── test-file (diagnostic) ────────────────────────────────
    if (action === "test-file") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) { res.status(400).json({ error: "Missing fileId" }); return; }
      const results = {};

      // اختبار OAuth2
      try {
        const r1 = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        results.oauth2 = { status: r1.status, body: await r1.json().catch(() => ({})) };
      } catch (e) { results.oauth2 = { error: e.message }; }

      // اختبار SA
      if (process.env.GDRIVE_SERVICE_ACCOUNT) {
        try {
          const saToken = await getTokenViaServiceAccount();
          const r2 = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size`,
            { headers: { Authorization: `Bearer ${saToken}` } }
          );
          results.sa = { status: r2.status, body: await r2.json().catch(() => ({})) };
        } catch (e) { results.sa = { error: e.message }; }
      } else {
        results.sa = { error: "GDRIVE_SERVICE_ACCOUNT not configured" };
      }

      res.status(200).json({ fileId, authMethod: _authMethod, results });
      return;
    }

    // ── quota ─────────────────────────────────────────────────
    if (action === "quota") {
      const r = await fetch(
        "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const body = await r.json();
      // Service accounts may return storageQuota with limit=0 — flag it
      if (_authMethod === "service_account" && body.storageQuota) {
        body._authWarning = "service_account_no_quota";
      }
      res.status(r.status).json(body);
      return;
    }

    // ── upload (≤ 3 MB) ───────────────────────────────────────
    if (action === "upload") {
      const filename   = decodeURIComponent(req.headers["x-filename"] || "upload");
      const mimetype   = req.headers["x-file-mime"] || "application/octet-stream";
      const fileBuffer = await readBody(req);

      const metaObj = { name: filename, mimeType: mimetype };
      if (folderId) metaObj.parents = [folderId];

      const meta     = JSON.stringify(metaObj);
      const boundary = "gdrive_bnd_" + Math.random().toString(36).slice(2, 14);
      const body     = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
          `--${boundary}\r\nContent-Type: ${mimetype}\r\n\r\n`
        ),
        fileBuffer,
        Buffer.from(`\r\n--${boundary}--`),
      ]);

      const r = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body,
        }
      );
      const result = await r.json();
      if (!r.ok) {
        const reason = result.error?.errors?.[0]?.reason || "";
        if (reason === "storageQuotaExceeded") {
          result.error._quotaFix = _authMethod === "service_account"
            ? "service_account_quota"
            : "user_quota_full";
        }
      }
      res.status(r.status).json(result);
      return;
    }

    // ── resumable-init ────────────────────────────────────────
    if (action === "resumable-init") {
      const filename = decodeURIComponent(req.headers["x-filename"] || "upload");
      const mimetype = req.headers["x-file-mime"] || "application/octet-stream";
      const fileSize = req.headers["x-file-size"] || "0";

      const metaObj = { name: filename, mimeType: mimetype };
      if (folderId) metaObj.parents = [folderId];

      const r = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink,webContentLink,size",
        {
          method: "POST",
          headers: {
            Authorization:           `Bearer ${token}`,
            "Content-Type":          "application/json",
            "X-Upload-Content-Type": mimetype,
            "X-Upload-Content-Length": fileSize,
          },
          body: JSON.stringify(metaObj),
        }
      );
      const sessionUri = r.headers.get("Location");
      if (!sessionUri) {
        const body = await r.json().catch(() => ({}));
        const reason = body.error?.errors?.[0]?.reason || "";
        const fix    = reason === "storageQuotaExceeded" && _authMethod === "service_account"
          ? "service_account_quota" : null;
        res.status(r.status).json({ error: body.error?.message || "No session URI", _quotaFix: fix });
        return;
      }
      res.status(200).json({ sessionUri });
      return;
    }

    // ── resumable-chunk ───────────────────────────────────────
    if (action === "resumable-chunk") {
      const sessionUri   = req.headers["x-session-uri"];
      const contentRange = req.headers["x-content-range"];
      const mimetype     = req.headers["content-type"] || "application/octet-stream";
      if (!sessionUri) { res.status(400).json({ error: "Missing x-session-uri" }); return; }

      const chunkBuffer = await readBody(req);
      const r = await fetch(sessionUri, {
        method: "PUT",
        headers: {
          "Content-Length": String(chunkBuffer.length),
          "Content-Range":  contentRange,
          "Content-Type":   mimetype,
        },
        body: chunkBuffer,
      });

      if (r.status === 200 || r.status === 201) {
        res.status(r.status).json(await r.json());
      } else if (r.status === 308) {
        const range = r.headers.get("Range") || "";
        res.status(308).json({ range });
      } else {
        const body   = await r.json().catch(() => ({}));
        const reason = body.error?.errors?.[0]?.reason || "";
        if (reason === "storageQuotaExceeded" && _authMethod === "service_account") {
          body.error._quotaFix = "service_account_quota";
        }
        res.status(r.status).json(body);
      }
      return;
    }

    // ── delete ────────────────────────────────────────────────
    if (action === "delete") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) { res.status(400).json({ error: "Missing fileId" }); return; }
      const r = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      res.status(r.status).end();
      return;
    }

    // ── download ──────────────────────────────────────────────
    if (action === "download") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) { res.status(400).json({ error: "Missing fileId" }); return; }

      const driveDownload = async (tok) =>
        fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
          { headers: { Authorization: `Bearer ${tok}` } }
        );

      // أولاً: جرّب OAuth2
      let r = await driveDownload(token);
      let lastErrMsg = null;

      // إذا فشل OAuth2 بـ 403/404 وتوفّر Service Account، جرّبه كبديل
      if (!r.ok && (r.status === 403 || r.status === 404) && process.env.GDRIVE_SERVICE_ACCOUNT) {
        try {
          const saToken = await getTokenViaServiceAccount();
          const r2 = await driveDownload(saToken);
          if (r2.ok) {
            r = r2;
          } else {
            // SA أيضاً فشل — احفظ سبب الخطأ للتشخيص
            const errBody = await r2.json().catch(() => ({}));
            lastErrMsg = `OAuth2:${r.status} / SA:${r2.status} — ${errBody.error?.message || errBody.error || "unknown"}`;
          }
        } catch (saErr) {
          lastErrMsg = `OAuth2:${r.status} / SA:exception — ${saErr.message}`;
        }
      }

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        const baseMsg = err.error?.message || err.error || `HTTP ${r.status}`;
        res.status(r.status).json({
          error: lastErrMsg ? `${baseMsg} [${lastErrMsg}]` : baseMsg,
        });
        return;
      }
      const buf = await r.arrayBuffer();
      res.setHeader("Content-Type", r.headers.get("content-type") || "application/octet-stream");
      res.status(200).send(Buffer.from(buf));
      return;
    }

    res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
