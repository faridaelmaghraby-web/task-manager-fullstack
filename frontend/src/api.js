const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const TOKEN_KEY = 'taskly_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors || [];
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized();
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors);
  }
  return data;
}

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v); });
  return p.toString();
};

export const api = {
  register: (b) => request('/api/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => request('/api/auth/login', { method: 'POST', body: b, auth: false }),
  me: () => request('/api/auth/me'),
  listTasks: (params) => request(`/api/tasks?${qs(params)}`),
  stats: () => request('/api/tasks/stats'),
  createTask: (b) => request('/api/tasks', { method: 'POST', body: b }),
  updateTask: (id, b) => request(`/api/tasks/${id}`, { method: 'PUT', body: b }),
  deleteTask: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
};
