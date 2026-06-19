# BOC FAW2 — نظام إدارة شعبة مستودع الفاو

نظام إدارة الموارد البشرية والعمليات الميدانية لشركة نفط البصرة — شعبة مستودع الفاو.
مبني بـ React 18 ومنشور على Vercel مع Firebase Realtime Database.

---

## Quick Start

```bash
npm install
npm start        # dev server on http://localhost:3000
npm test         # run test suite (29 tests)
npm run build    # production build
```

---

## Environment Variables

### Vercel (Production)

Set these in your Vercel project → Settings → Environment Variables:

| Variable | Required | Description |
|---|---|---|
| `GDRIVE_CLIENT_ID` | OAuth2 | Google OAuth2 client ID |
| `GDRIVE_CLIENT_SECRET` | OAuth2 | Google OAuth2 client secret |
| `GDRIVE_REFRESH_TOKEN` | OAuth2 | Long-lived refresh token |
| `GDRIVE_SERVICE_ACCOUNT` | Alt auth | Service account JSON key (alternative to OAuth2) |
| `GDRIVE_FOLDER_ID` | Optional | Google Drive folder ID for uploads |
| `ALLOWED_ORIGIN` | Recommended | Restrict CORS to your domain (e.g. `https://boc-faw2.vercel.app`) |

**Auth priority:** OAuth2 (refresh token) is preferred — service accounts have no personal Drive quota and require a Shared Drive when `GDRIVE_FOLDER_ID` is set.

---

## Firebase Setup

Database URL: `https://faop-scada-default-rtdb.asia-southeast1.firebasedatabase.app`

### Database Schema

```
/
├── accounts/
│   └── {jobNum}/          # Employee record (read-only via rules)
│       ├── id             # Sequential integer (1-33)
│       ├── username       # Login username
│       ├── name           # Full Arabic name
│       ├── title          # Job title
│       ├── dept           # Department
│       ├── shift          # صباحي | مناوبة
│       ├── group?         # A | B | C | D (shift groups)
│       └── role?          # admin | inventory_manager | attendance_admin
│
├── init_hashes/
│   └── {jobNum}           # SHA-256(salt + DEFAULT_PASSWORD), read-only
│
├── passwords/
│   └── {accountId}        # SHA-256 hash of user-changed password (64 hex chars)
│
├── chat/
│   └── {messageId}/       # Public read/write
│       ├── text           # String, 1-1000 chars
│       ├── sender         # Display name
│       ├── senderId       # Account ID (number)
│       └── timestamp      # Unix ms
│
└── emp_statuses/          # Employee active/inactive flags
```

### Deploy Rules

Copy `firebase-rules.json` into the Firebase Console → Realtime Database → Rules and publish.

---

## Drive Proxy API

Serverless function at `/api/drive-proxy`. All requests use `?action=<action>`.

### `GET ?action=ping`
Verifies Drive auth is working. Returns `{ ok, auth, hasFolder }`.

### `GET ?action=quota`
Returns Google Drive storage quota for the authenticated account.

### `POST ?action=upload`
Uploads a file ≤ 3 MB via multipart upload.

| Header | Description |
|---|---|
| `x-filename` | URL-encoded filename |
| `x-file-mime` | MIME type |
| Body | Raw file bytes |

Returns Drive file metadata: `{ id, name, webViewLink, webContentLink, size }`.

### `POST ?action=resumable-init`
Starts a resumable upload session for large files.

| Header | Description |
|---|---|
| `x-filename` | URL-encoded filename |
| `x-file-mime` | MIME type |
| `x-file-size` | Total file size in bytes |

Returns `{ sessionUri }`.

### `PUT ?action=resumable-chunk`
Uploads one chunk of a resumable upload.

| Header | Description |
|---|---|
| `x-session-uri` | Session URI from `resumable-init` |
| `x-content-range` | `bytes start-end/total` |
| `Content-Type` | File MIME type |
| Body | Chunk bytes |

Returns `{ range }` (HTTP 308 = more chunks needed) or file metadata (HTTP 200/201 = complete).

### `DELETE ?action=delete&fileId={id}`
Deletes a file from Drive.

### `GET ?action=download&fileId={id}`
Downloads file content and streams it back.

---

## Authentication

The app uses a custom auth system (no Firebase Auth).

1. **Login** — user enters 6-digit job number + password
2. **Hash check** — password is hashed as `SHA-256("BOC_FAW_SCADA_2025#" + password)`
3. **Verification order:**
   - Local cache (`localStorage/sessionStorage`)
   - Firebase `/passwords/{id}` (user-changed password)
   - Firebase `/init_hashes/{jobNum}` (initial password hash)
   - `DEFAULT_PASSWORD` fallback (offline / first login)
4. **Lock** — 5 consecutive failures lock the account for 15 minutes

**Default password:** `1000` (all accounts). Users are prompted to change it on first login.

---

## Scripts

```bash
npm start          # Start dev server
npm test           # Run tests (watch mode)
npm run build      # Production build
npm run deploy     # Build + deploy to GitHub Pages
```

---

## Project Structure

```
boc-faw2/
├── api/
│   └── drive-proxy.js     # Vercel serverless — Google Drive proxy
├── src/
│   ├── App.js             # Main application (React components + logic)
│   ├── App.test.js        # Test suite (29 tests)
│   └── setupTests.js      # Jest/RTL setup
├── firebase-rules.json    # Firebase Realtime Database security rules
├── vercel.json            # Vercel routing config
└── package.json
```
