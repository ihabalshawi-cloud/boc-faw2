// Vercel serverless function — proxy for Google Drive API
// Allows the browser to use Drive even when googleapis.com is blocked on the corporate network.
// The browser calls this function (same Vercel domain), and it forwards to googleapis.com.

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-gdrive-token, x-filename, x-file-mime"
  );
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const token = req.headers["x-gdrive-token"];
  if (!token) { res.status(401).json({ error: "Missing token" }); return; }

  const url = new URL(req.url, "https://placeholder.invalid");
  const action = url.searchParams.get("action");

  try {
    // ── quota ──────────────────────────────────────────────────
    if (action === "quota") {
      const r = await fetch(
        "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await r.json();
      res.status(r.status).json(data);
      return;
    }

    // ── upload ─────────────────────────────────────────────────
    if (action === "upload") {
      const filename = decodeURIComponent(req.headers["x-filename"] || "upload");
      const mimetype = req.headers["x-file-mime"] || "application/octet-stream";
      const fileBuffer = await readBody(req);

      const meta = JSON.stringify({ name: filename, mimeType: mimetype });
      const boundary = "gdrive_bnd_" + Math.random().toString(36).slice(2, 14);

      const body = Buffer.concat([
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
      const data = await r.json();
      res.status(r.status).json(data);
      return;
    }

    // ── delete ─────────────────────────────────────────────────
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
