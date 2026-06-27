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

  markPasswordChanged: async (empId) => {
    try {
      await fetch(`${FIREBASE_URL}/pass_changed/${empId}.json`, {
        method: "PUT", body: JSON.stringify(true),
        headers: { "Content-Type": "application/json" },
      });
      return true;
    } catch { return false; }
  },

  hasPasswordChanged: async (empId) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/pass_changed/${empId}.json`);
      if (!res.ok) return false;
      const d = await res.json();
      return d === true;
    } catch { return false; }
  },

  clearPasswordChanged: async (empId) => {
    try {
      await fetch(`${FIREBASE_URL}/pass_changed/${empId}.json`, { method: "DELETE" });
      return true;
    } catch { return false; }
  },

  clearInitHash: async (jobNum) => {
    try {
      await fetch(`${FIREBASE_URL}/init_hashes/${jobNum}.json`, { method: "DELETE" });
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

  setTyping: async (empId, toId) => {
    try {
      await fetch(`${FIREBASE_URL}/typing/${empId}.json`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toId > 0 ? { toId, ts: Date.now() } : null),
      });
    } catch {}
  },

  getTyping: async (empId) => {
    try { const res = await fetch(`${FIREBASE_URL}/typing/${empId}.json`); return res.ok ? await res.json() : null; } catch { return null; }
  },

  getMessages: async (limit = 50) => {
    try {
      const res = await fetch(
        `${FIREBASE_URL}/chat.json?limitToLast=${limit}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data) return [];
      return Object.entries(data)
        .map(([k, v]) => ({ ...v, _key: k }))
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch { return []; }
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  saveInventory: async (list) => {
    if (!Array.isArray(list)) return false;
    try {
      const data = {};
      for (const item of list) data[`item_${item.id}`] = item;
      const res = await fetch(`${FIREBASE_URL}/inventory_items.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch { return false; }
  },

  loadInventory: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/inventory_items.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      return Object.values(data).filter(Boolean).sort((a, b) => a.id - b.id);
    } catch { return null; }
  },

  // ── Furniture ─────────────────────────────────────────────────────────────
  saveFurniture: async (list) => {
    if (!Array.isArray(list)) return false;
    try {
      const data = {};
      for (const item of list) data[`item_${item.id}`] = item;
      const res = await fetch(`${FIREBASE_URL}/furniture_items.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch { return false; }
  },

  loadFurniture: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/furniture_items.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      return Object.values(data).filter(Boolean).sort((a, b) => a.id - b.id);
    } catch { return null; }
  },

  // ── Equipment ─────────────────────────────────────────────────────────────
  saveEquipmentList: async (list) => {
    if (!Array.isArray(list)) return false;
    try {
      const data = {};
      for (const item of list) {
        const key = String(item.id).replace(/[.#$[\]]/g, "_");
        data[key] = item;
      }
      const res = await fetch(`${FIREBASE_URL}/equipment_list.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch { return false; }
  },

  loadEquipmentList: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/equipment_list.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      return Object.values(data).filter(Boolean);
    } catch { return null; }
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  saveProjects: async (list) => {
    if (!Array.isArray(list)) return false;
    try {
      const data = {};
      for (const item of list) {
        const key = String(item.id).replace(/[.#$[\]]/g, "_");
        data[key] = item;
      }
      const res = await fetch(`${FIREBASE_URL}/pm_projects.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch { return false; }
  },

  loadProjects: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/pm_projects.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      return Object.values(data).filter(Boolean);
    } catch { return null; }
  },

  // ── Leave Requests ────────────────────────────────────────────────────────
  saveRequests: async (list) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/all_requests.json`, {
        method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(list||[]),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn(`[Firebase] saveRequests failed (${res.status}):`, body);
      }
      return res.ok;
    } catch (e) { console.warn("[Firebase] saveRequests network error:", e.message); return false; }
  },
  loadRequests: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/all_requests.json`);
      if (!res.ok) { console.warn(`[Firebase] loadRequests failed (${res.status})`); return null; }
      const data = await res.json();
      return Array.isArray(data) ? data : (data && typeof data==="object" ? Object.values(data).filter(Boolean) : null);
    } catch (e) { console.warn("[Firebase] loadRequests network error:", e.message); return null; }
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  saveNotifications: async (empId, list) => {
    if (!empId) return false;
    try {
      const res = await fetch(`${FIREBASE_URL}/notifications/${empId}.json`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(list || []),
      });
      return res.ok;
    } catch { return false; }
  },
  loadNotifications: async (empId) => {
    if (!empId) return null;
    try {
      const res = await fetch(`${FIREBASE_URL}/notifications/${empId}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) ? data : (data && typeof data === "object" ? Object.values(data).filter(Boolean) : null);
    } catch { return null; }
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  saveTasks: async (list) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/tasks_system.json`, {
        method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(list||[]),
      });
      return res.ok;
    } catch { return false; }
  },
  loadTasks: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/tasks_system.json`);
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) ? data : null;
    } catch { return null; }
  },

  // ── Evaluations ───────────────────────────────────────────────────────────
  saveEvaluations: async (list) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/evaluations.json`, {
        method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(list||[]),
      });
      return res.ok;
    } catch { return false; }
  },
  loadEvaluations: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/evaluations.json`);
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) ? data : null;
    } catch { return null; }
  },

  saveBulkEval: async (year, month, data) => {
    try { await fetch(`${FIREBASE_URL}/bulk_evals/${year}_${month}.json`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}); return true; } catch { return false; }
  },
  loadBulkEval: async (year, month) => {
    try { const res=await fetch(`${FIREBASE_URL}/bulk_evals/${year}_${month}.json`); if(!res.ok)return null; return await res.json(); } catch { return null; }
  },

  // ── Surveys ───────────────────────────────────────────────────────────────
  loadSurveys: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/surveys.json`);
      if (!res.ok) return [];
      const d = await res.json();
      return d ? Object.entries(d).map(([k, v]) => ({ ...v, _key: k })) : [];
    } catch { return []; }
  },
  createSurvey: async (s) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/surveys.json`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s),
      });
      const d = await res.json();
      return d?.name || null;
    } catch { return null; }
  },
  deleteSurvey: async (key) => {
    try {
      await fetch(`${FIREBASE_URL}/surveys/${key}.json`, { method: "DELETE" });
      return true;
    } catch { return false; }
  },
  loadSurveyResponses: async (key) => {
    try {
      const res = await fetch(`${FIREBASE_URL}/survey_responses/${key}.json`);
      if (!res.ok) return [];
      const d = await res.json();
      return d ? Object.values(d).filter(Boolean) : [];
    } catch { return []; }
  },
  submitSurveyResponse: async (key, response) => {
    try {
      await fetch(`${FIREBASE_URL}/survey_responses/${key}.json`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response),
      });
      return true;
    } catch { return false; }
  },

  // ── Timesheet ─────────────────────────────────────────────────────────────
  saveTimesheet: async (tsData) => {
    if (!tsData || typeof tsData !== "object") return false;
    try {
      const res = await fetch(`${FIREBASE_URL}/timesheet_data.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tsData),
      });
      return res.ok;
    } catch { return false; }
  },

  loadTimesheet: async () => {
    try {
      const res = await fetch(`${FIREBASE_URL}/timesheet_data.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      // Firebase converts arrays to {0:…,1:…} and may leave null slots after deletions.
      const toArray = (val) => {
        let arr;
        if (Array.isArray(val)) arr = val;
        else if (val && typeof val === "object") {
          const keys = Object.keys(val);
          if (keys.length > 0 && keys.every(k => /^\d+$/.test(k)))
            arr = keys.sort((a,b) => Number(a)-Number(b)).map(k => val[k]);
          else return val;
        } else return val;
        return arr.filter(e => e && typeof e === "object").map(e => ({
          ...e, days: e.days || {}, hours: e.hours || {},
        }));
      };
      return { malak: toArray(data.malak), contracts: toArray(data.contracts), drivers: toArray(data.drivers) };
    } catch { return null; }
  },
};
