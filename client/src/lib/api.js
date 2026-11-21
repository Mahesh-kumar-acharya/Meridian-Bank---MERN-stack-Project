const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let authToken = localStorage.getItem("token");

export function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export function getToken() {
  return authToken;
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw err;
  }
  return data;
}

export const api = {
  register: (email, password, name) =>
    request("/api/auth/register", {
      method: "POST",
      body: { email, password, name },
    }),
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  createAccount: () => request("/api/accounts/create", { method: "POST" }),
  getAccounts: () => request("/api/accounts"),
  getBalance: (accountId) => request(`/api/accounts/balance/${accountId}`),
  transfer: (fromAccount, toAccount, amount, idempotencyKey) =>
    request("/api/transactions", {
      method: "POST",
      body: { fromAccount, toAccount, amount, idempotencyKey },
    }),
};

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
