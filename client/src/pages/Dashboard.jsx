import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatMoney, formatDate, shortId } from "../lib/format";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAccounts();
      setAccounts(data.accounts || []);
      const entries = await Promise.all(
        (data.accounts || []).map(async (a) => {
          try {
            const b = await api.getBalance(a._id);
            return [a._id, b.balance];
          } catch {
            return [a._id, null];
          }
        }),
      );
      setBalances(Object.fromEntries(entries));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  async function openAccount() {
    setOpening(true);
    setError("");
    setNotice("");
    try {
      await api.createAccount();
      setNotice("Your new account is ready.");
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setOpening(false);
    }
  }

  async function signOut() {
    await logout();
    window.location.href = "/";
  }

  const activeCount = accounts.filter((a) => a.status === "active").length;

  return (
    <div className="app-shell">
      <header className="appbar">
        <Link to="/app" className="brand">
          Meridian
        </Link>
        <nav>
          <Link to="/app" className="appbar-link active">
            Accounts
          </Link>
          <Link to="/app/transfer" className="appbar-link">
            Transfer
          </Link>
        </nav>
        <div className="appbar-user">
          <span className="avatar" aria-hidden>
            {(user?.name || "?")[0].toUpperCase()}
          </span>
          <span className="user-name">{user?.name}</span>
          <button className="btn btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <div>
            <h2>Your accounts</h2>
            <p className="muted">
              {accounts.length === 0
                ? "You have no accounts yet."
                : `${accounts.length} account${accounts.length > 1 ? "s" : ""} · ${activeCount} active`}
            </p>
          </div>
          <button
            className="btn btn-solid"
            onClick={openAccount}
            disabled={opening}
          >
            {opening ? "Opening…" : "Open new account"}
          </button>
        </div>

        {notice && <div className="notice">{notice}</div>}
        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="skeleton-card" />
        ) : accounts.length === 0 ? (
          <div className="empty">
            <h3>No accounts yet</h3>
            <p className="muted">Open your first account to start banking.</p>
            <button
              className="btn btn-solid"
              onClick={openAccount}
              disabled={opening}
            >
              {opening ? "Opening…" : "Open account"}
            </button>
          </div>
        ) : (
          <ul className="account-list">
            {accounts.map((a) => (
              <li key={a._id} className="account-card">
                <div className="account-top">
                  <span className="account-no">{shortId(a._id)}</span>
                  <span className={`pill pill-${a.status}`}>{a.status}</span>
                </div>
                <div className="account-balance">
                  {balances[a._id] === null || balances[a._id] === undefined
                    ? "—"
                    : formatMoney(balances[a._id], a.currency)}
                </div>
                <div className="account-meta muted">
                  {a.currency} · opened {formatDate(a.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}

        <section className="hint-panel">
          <h3>Moving money</h3>
          <p className="muted">
            Transfers are recorded as paired credit and debit ledger entries and
            are idempotent — a retried transfer is never charged twice.
          </p>
          <Link className="btn" to="/app/transfer">
            Make a transfer
          </Link>
        </section>
      </main>
    </div>
  );
}
