// Vercel serverless function — Google Drive proxy using Service Account
// All users share one Drive without individual OAuth login.
// Required env vars: GDRIVE_SERVICE_ACCOUNT (JSON key), GDRIVE_FOLDER_ID (optional)

const { createSign } = require("crypto");

let _cachedToken   = null;
let _tokenExpiry   = 0;

function base64url(obj) {
  const str = typeof obj === "string" ? obj : JSON.stringify(obj);
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60000) return _cachedToken;

  const raw = process.env.GDRIVE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GDRIVE_SERVICE_ACCOUNT not configured");

  const sa  = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const hdr = base64url({ alg: "RS256", typ: "JWT" });
  const cla = base64url({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
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
      assertion: jwt,
    }),
  });

  const data = await r.json();
  if (!data.access_token)
    throw new Error(data.error_description || data.error || "Failed to get service account token");

  _cachedToken  = data.access_token;
  _tokenExpiry  = Date.now() + (data.expires_in || 3600) * 1000;
  return _cachedToken;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-filename, x-file-mime");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const url    = new URL(req.url, "https://placeholder.invalid");
  const action = url.searchParams.get("action");

  try {
    // ── ping — فحص الاتصال ──────────────────────────────────
    if (action === "ping") {
      await getToken();
      res.status(200).json({ ok: true });
      return;
    }

    const token = await getToken();

    // ── quota ────────────────────────────────────────────────
    if (action === "quota") {
      const r = await fetch(
        "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      res.status(r.status).json(await r.json());
      return;
    }

    // ── upload ───────────────────────────────────────────────
    if (action === "upload") {
      const filename  = decodeURIComponent(req.headers["x-filename"] || "upload");
      const mimetype  = req.headers["x-file-mime"] || "application/octet-stream";
      const folderId  = process.env.GDRIVE_FOLDER_ID;
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
      res.status(r.status).json(await r.json());
      return;
    }

    // ── delete ───────────────────────────────────────────────
    if (action === "delete") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) { res.status(400).json({ error: "Missing fileId" }); return; }
      const r = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      res.status(r.status).end();
      return;
    }

    res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
