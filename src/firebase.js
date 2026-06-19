import { FIREBASE_URL, DEFAULT_PASSWORD } from "./constants";
import { hashPassword } from "./utils";

export const FirebaseAPI = {
  checkConnection: async () => {
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 5000);
      const res  = await fetch(`${FIREBASE_URL}/chat.json?limitToLast=1`, { signal: ctrl.signal });
      clearTimeout(tid);
      return res.status < 500;
    } catch { return false; }
  },

  // ── Passwords ─────────────────────────────────────────────────────────────
  savePassword: async (empId, hash) => {
    try {
      await fetch(`${FIREBASE_URL}/passwords/${empId}.json`, {
        method: "PUT", body: JSON.stringify(hash),
      });
      return true;
    } catch { return false; }
  },

  getPassword: async (empId) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/passwords/${empId}.json`);
      if (!res.ok) return null;
      const d = await res.json();
      return typeof d === "string" ? d : null;
    } catch { return null; }
  },

  deletePassword: async (empId) => {
    try {
      await fetch(`${FIREBASE_URL}/passwords/${empId}.json`, { method: "DELETE" });
      return true;
    } catch { return false; }
  },

  // ── Accounts ──────────────────────────────────────────────────────────────
  fetchAccount: async (jobNum) => {
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 4000);
      const res  = await fetch(`${FIREBASE_URL}/accounts/${jobNum}.json`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) return null;
      const d = await res.json();
      return d && d.id ? d : null;
    } catch { return null; }
  },

  fetchInitHash: async (jobNum) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/init_hashes/${jobNum}.json`);
      if (!res.ok) return null;
      const d = await res.json();
      return typeof d === "string" ? d : null;
    } catch { return null; }
  },

  saveRoles: async (rolesMap) => {
    try {
      await fetch(`${FIREBASE_URL}/emp_statuses.json`, {
        method: "PUT", body: JSON.stringify(rolesMap),
      });
      return true;
    } catch { return false; }
  },

  loadRoles: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/emp_statuses.json`);
      if (!res.ok) return null;
      const d = await res.json();
      return d && typeof d === "object" ? d : null;
    } catch { return null; }
  },

  initializeAccounts: async (accounts) => {
    try {
      const testRes = await fetch(`${FIREBASE_URL}/accounts.json`, { method: "GET" });
      if (testRes.status === 401 || testRes.status === 403) {
        const body = await testRes.text().catch(() => "");
        return { ok: false, status: testRes.status, reason: "permission_denied", body };
      }
      const accountsData = {};
      const hashesData   = {};
      for (const acc of accounts) {
        const { password: _pw, ...rest } = acc;
        accountsData[acc.jobNum] = rest;
        hashesData[acc.jobNum]   = await hashPassword(DEFAULT_PASSWORD);
      }
      const [r1, r2] = await Promise.all([
        fetch(`${FIREBASE_URL}/accounts.json`,    { method: "PUT", body: JSON.stringify(accountsData),  headers: { "Content-Type": "application/json" } }),
        fetch(`${FIREBASE_URL}/init_hashes.json`, { method: "PUT", body: JSON.stringify(hashesData),    headers: { "Content-Type": "application/json" } }),
      ]);
      if (!r1.ok || !r2.ok) {
        const b = await (r1.ok ? r2 : r1).text().catch(() => "");
        return { ok: false, status: r1.ok ? r2.status : r1.status, reason: "write_failed", body: b };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, status: 0, reason: "network_error", body: e.message };
    }
  },

  loadAccounts: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/accounts.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      return Object.values(data).filter(Boolean);
    } catch { return null; }
  },

  saveAccounts: async (list) => {
    if (!Array.isArray(list) || list.length === 0) return false;
    try {
      const data = {};
      for (const emp of list) {
        const { password, ...rest } = emp;
        data[emp.jobNum] = rest;
      }
      const res = await fetch(`${FIREBASE_URL}/accounts.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch { return false; }
  },

  saveEmployee: async (emp) => {
    if (!emp?.jobNum) return false;
    try {
      const { password: _pw, ...rest } = emp;
      const res = await fetch(`${FIREBASE_URL}/accounts/${emp.jobNum}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      return res.ok;
    } catch { return false; }
  },

  deleteEmployee: async (jobNum) => {
    if (!jobNum) return false;
    try {
      const res = await fetch(`${FIREBASE_URL}/accounts/${jobNum}.json`, { method: "DELETE" });
      return res.ok;
    } catch { return false; }
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  sendMessage: async (msg) => {
    try {
      await fetch(`${FIREBASE_URL}/chat.json`, { method: "POST", body: JSON.stringify(msg) });
      return true;
    } catch { return false; }
  },

  getMessages: async (limit = 50) => {
    try {
      const res = await fetch(
        `${FIREBASE_URL}/chat.json?orderBy="timestamp"&limitToLast=${limit}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data) return [];
      return Object.entries(data)
        .map(([k, v]) => ({ ...v, _key: k }))
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch { return []; }
  },
};
