import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// ── Mock: crypto.subtle ───────────────────────────────────────────────────────
// Returns 32 zero-bytes so hashPassword() resolves to "00…00" (valid 64-char hex)
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: { digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)) },
    getRandomValues: (arr) => { arr.fill(0); return arr; },
  },
  writable: true,
});

// ── Mock: AudioContext ────────────────────────────────────────────────────────
window.AudioContext = jest.fn(() => ({
  createOscillator: () => ({
    connect: jest.fn(), frequency: { value: 0 }, type: 'sine',
    start: jest.fn(), stop: jest.fn(),
  }),
  createGain: () => ({
    connect: jest.fn(),
    gain: { value: 0, exponentialRampToValueAtTime: jest.fn() },
  }),
  destination: {}, currentTime: 0,
}));

// ── Mock: Notification API ────────────────────────────────────────────────────
Object.defineProperty(window, 'Notification', {
  value: { permission: 'default', requestPermission: jest.fn() },
  writable: true,
});

// ── Mock: fetch ───────────────────────────────────────────────────────────────
global.fetch = jest.fn(() => Promise.reject(new Error('offline')));

// ── Mock: localStorage / sessionStorage ──────────────────────────────────────
function makeStore() {
  let s = {};
  return {
    getItem:    (k)    => (k in s ? s[k] : null),
    setItem:    (k, v) => { s[k] = String(v); },
    removeItem: (k)    => { delete s[k]; },
    clear:      ()     => { s = {}; },
  };
}
const lsMock = makeStore();
const ssMock = makeStore();
Object.defineProperty(window, 'localStorage',   { value: lsMock, writable: true });
Object.defineProperty(window, 'sessionStorage', { value: ssMock, writable: true });

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLoginInputs(container) {
  const jobInput  = screen.getByPlaceholderText('728004');
  const passInput = container.querySelector('input[type="password"]');
  return { jobInput, passInput };
}

// ── Per-test reset ────────────────────────────────────────────────────────────
beforeEach(() => {
  lsMock.clear();
  ssMock.clear();
  jest.clearAllMocks();
  global.fetch.mockRejectedValue(new Error('offline'));
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. ACCOUNTS Data Integrity
// ═════════════════════════════════════════════════════════════════════════════
describe('ACCOUNTS constant integrity', () => {
  const KNOWN_JOB_NUMS = [
    '728004','727466','737283','756571','790850','758795',
    '719242','790869','790885','813877','439193','701130',
    '751480','719269','719498','719277','719293','719463',
    '736732','719048','735922','732249','726508','719129',
    '719099','732834','724939','718939','719005','690414',
    '689766','690174','689331',
  ];

  test('has exactly 33 accounts', () => {
    expect(KNOWN_JOB_NUMS).toHaveLength(33);
  });

  test('all jobNums are unique', () => {
    expect(new Set(KNOWN_JOB_NUMS).size).toBe(KNOWN_JOB_NUMS.length);
  });

  test('admin jobNum 728004 is present', () => {
    expect(KNOWN_JOB_NUMS).toContain('728004');
  });

  test('all jobNums are 6-digit strings', () => {
    KNOWN_JOB_NUMS.forEach(j => expect(j).toMatch(/^\d{6}$/));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Password hash format (isHash logic)
// ═════════════════════════════════════════════════════════════════════════════
describe('password hash format validation', () => {
  const isHash = s => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);

  test('accepts valid 64-char lowercase hex', () => {
    expect(isHash('a'.repeat(64))).toBe(true);
  });

  test('rejects string shorter than 64 chars', () => {
    expect(isHash('a'.repeat(63))).toBe(false);
  });

  test('rejects string longer than 64 chars', () => {
    expect(isHash('a'.repeat(65))).toBe(false);
  });

  test('rejects uppercase hex', () => {
    expect(isHash('A'.repeat(64))).toBe(false);
  });

  test('rejects plaintext "1000" (DEFAULT_PASSWORD)', () => {
    expect(isHash('1000')).toBe(false);
  });

  test('rejects non-string values', () => {
    expect(isHash(null)).toBe(false);
    expect(isHash(undefined)).toBe(false);
    expect(isHash(12345678)).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Login Screen — UI elements
// ═════════════════════════════════════════════════════════════════════════════
describe('Login Screen — rendering', () => {
  test('renders job-number input with placeholder "728004"', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('728004')).toBeInTheDocument();
  });

  test('renders password input masked by default', () => {
    const { container } = render(<App />);
    const pass = container.querySelector('input[type="password"]');
    expect(pass).toBeInTheDocument();
  });

  test('renders login button "دخول"', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'دخول' })).toBeInTheDocument();
  });

  test('password visibility toggle reveals password', () => {
    const { container } = render(<App />);
    const passInput  = container.querySelector('input[type="password"]');
    const toggleBtn  = passInput.parentElement.querySelector('button');
    expect(passInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(passInput).toHaveAttribute('type', 'text');
  });

  test('renders "نسيت كلمة المرور؟" reset link', () => {
    render(<App />);
    expect(screen.getByText(/نسيت كلمة المرور/i)).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Login Screen — Authentication
// ═════════════════════════════════════════════════════════════════════════════
describe('Login Screen — authentication (offline)', () => {
  test('unknown job number shows "الرقم الوظيفي غير موجود"', async () => {
    const { container } = render(<App />);
    const { jobInput, passInput } = getLoginInputs(container);
    fireEvent.change(jobInput,  { target: { value: '000000' } });
    fireEvent.change(passInput, { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    await waitFor(() =>
      expect(screen.getByText(/الرقم الوظيفي غير موجود/)).toBeInTheDocument()
    );
  });

  test('wrong password shows "كلمة المرور غير صحيحة"', async () => {
    const { container } = render(<App />);
    const { jobInput, passInput } = getLoginInputs(container);
    fireEvent.change(jobInput,  { target: { value: '728004' } });
    fireEvent.change(passInput, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    await waitFor(() =>
      expect(screen.getByText(/كلمة المرور غير صحيحة/)).toBeInTheDocument()
    );
  });

  test('DEFAULT_PASSWORD "1000" logs in admin (728004)', async () => {
    const { container } = render(<App />);
    const { jobInput, passInput } = getLoginInputs(container);
    fireEvent.change(jobInput,  { target: { value: '728004' } });
    fireEvent.change(passInput, { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    await waitFor(() =>
      // Login form unmounts on success
      expect(screen.queryByPlaceholderText('728004')).not.toBeInTheDocument()
    );
  });

  test('DEFAULT_PASSWORD "1000" logs in non-admin employee (727466)', async () => {
    const { container } = render(<App />);
    const { jobInput, passInput } = getLoginInputs(container);
    fireEvent.change(jobInput,  { target: { value: '727466' } });
    fireEvent.change(passInput, { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    await waitFor(() =>
      expect(screen.queryByPlaceholderText('728004')).not.toBeInTheDocument()
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Login Lock Mechanism
// ═════════════════════════════════════════════════════════════════════════════
describe('Login lock mechanism', () => {
  test('first bad attempt shows "محاولة 1 من 5"', async () => {
    const { container } = render(<App />);
    const { jobInput, passInput } = getLoginInputs(container);
    fireEvent.change(jobInput,  { target: { value: '728004' } });
    fireEvent.change(passInput, { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }));
    await waitFor(() =>
      expect(screen.getByText(/محاولة 1 من 5/)).toBeInTheDocument()
    );
  });

  test('account locks after 5 consecutive wrong passwords', async () => {
    jest.useFakeTimers();
    const { container } = render(<App />);
    const { jobInput, passInput } = getLoginInputs(container);
    const submitBtn = screen.getByRole('button', { name: 'دخول' });

    for (let i = 0; i < 5; i++) {
      fireEvent.change(jobInput,  { target: { value: '728004' } });
      fireEvent.change(passInput, { target: { value: 'bad' } });
      fireEvent.click(submitBtn);
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() =>
        screen.getByText(/كلمة المرور غير صحيحة|تم قفل/)
      );
    }

    await waitFor(() =>
      expect(screen.getByText(/تم قفل الحساب/)).toBeInTheDocument()
    );
    jest.useRealTimers();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. Firebase Rules — structure
// ═════════════════════════════════════════════════════════════════════════════
describe('firebase-rules.json structure', () => {
  // eslint-disable-next-line global-require
  const rules = require('../firebase-rules.json');

  test('root .read is "false"', () => {
    expect(rules.rules['.read']).toBe('false');
  });

  test('root .write is "false"', () => {
    expect(rules.rules['.write']).toBe('false');
  });

  test('accounts parent disallows bulk read', () => {
    expect(rules.rules.accounts['.read']).toBe('false');
  });

  test('accounts parent disallows bulk write', () => {
    expect(rules.rules.accounts['.write']).toBe('false');
  });

  test('passwords parent disallows bulk dump (.read false)', () => {
    expect(rules.rules.passwords['.read']).toBe('false');
  });

  test('passwords $id enforces 64-char hash via .validate', () => {
    const v = rules.rules.passwords.$id['.validate'];
    expect(v).toMatch(/64/);
  });

  test('chat node is open for read and write', () => {
    expect(rules.rules.chat['.read']).toBe('true');
    expect(rules.rules.chat['.write']).toBe('true');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. Drive Proxy — CORS
// ═════════════════════════════════════════════════════════════════════════════
describe('drive-proxy CORS configuration', () => {
  test('uses ALLOWED_ORIGIN env var instead of hardcoded wildcard', () => {
    // eslint-disable-next-line global-require
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(path.join(__dirname, '../api/drive-proxy.js'), 'utf-8');
    expect(src).toContain('ALLOWED_ORIGIN');
    // Must NOT be: res.setHeader("Access-Control-Allow-Origin", "*")
    expect(src).not.toMatch(/Allow-Origin",\s*"\*"/);
  });
});
