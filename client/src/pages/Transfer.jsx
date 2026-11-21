import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, uuid } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatMoney, shortId } from "../lib/format";

export default function Transfer() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    fromAccount: "",
    toAccount: "",
    amount: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api
      .getAccounts()
      .then((d) => setAccounts(d.accounts || []))
      .catch((err) => setLoadError(err.message));
  }, []);

  const valid = useMemo(() => {
    const amount = Number(form.amount);
    return (
      form.fromAccount &&
      form.toAccount &&
      form.fromAccount !== form.toAccount &&
      amount >= 1 &&
      Number.isFinite(amount)
    );
  }, [form]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const data = await api.transfer(
        form.fromAccount,
        form.toAccount,
        Number(form.amount),
        uuid(),
      );
      setResult(data);
      setForm({ fromAccount: "", toAccount: "", amount: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const selected = accounts.find((a) => a._id === form.fromAccount);

  return (
    <div className="app-shell">
      <header className="appbar">
        <Link to="/app" className="brand">
          Meridian
        </Link>
        <nav>
          <Link to="/app" className="appbar-link">
            Accounts
          </Link>
          <Link to="/app/transfer" className="appbar-link active">
            Transfer
          </Link>
        </nav>
        <div className="appbar-user">
          <span className="avatar" aria-hidden>
            {(user?.name || "?")[0].toUpperCase()}
          </span>
          <span className="user-name">{user?.name}</span>
        </div>
      </header>

      <main className="page page-narrow">
        <div className="page-head">
          <div>
            <h2>Make a transfer</h2>
            <p className="muted">Funds move between accounts on the ledger.</p>
          </div>
        </div>

        {loadError && <div className="form-error">{loadError}</div>}
        {accounts.length < 2 && !loadError && (
          <div className="empty">
            <h3>Two accounts needed</h3>
            <p className="muted">
              You need at least two accounts to transfer. Open another account
              from the Accounts page.
            </p>
            <Link className="btn btn-solid" to="/app">
              Back to accounts
            </Link>
          </div>
        )}

        {accounts.length >= 2 && (
          <form className="transfer-form" onSubmit={onSubmit}>
            <label>
              From account
              <select
                required
                value={form.fromAccount}
                onChange={(e) =>
                  setForm({ ...form, fromAccount: e.target.value })
                }
              >
                <option value="" disabled>
                  Select account
                </option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {shortId(a._id)} · {a.currency}
                  </option>
                ))}
              </select>
            </label>

            <label>
              To account
              <select
                required
                value={form.toAccount}
                onChange={(e) =>
                  setForm({ ...form, toAccount: e.target.value })
                }
              >
                <option value="" disabled>
                  Select account
                </option>
                {accounts
                  .filter((a) => a._id !== form.fromAccount)
                  .map((a) => (
                    <option key={a._id} value={a._id}>
                      {shortId(a._id)} · {a.currency}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Amount
              <input
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              {selected && (
                <span className="hint">
                  Available balance is fetched at submission; you cannot
                  overdraw.
                </span>
              )}
            </label>

            {error && <div className="form-error">{error}</div>}

            <button
              className="btn btn-solid btn-block"
              disabled={busy || !valid}
            >
              {busy ? "Processing…" : "Transfer now"}
            </button>
          </form>
        )}

        {result && (
          <div className="receipt" role="status">
            <div className="receipt-icon">✓</div>
            <h3>{result.message}</h3>
            {result.transaction && (
              <dl className="receipt-rows">
                <div>
                  <dt>Amount</dt>
                  <dd>{formatMoney(result.transaction.amount)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{result.transaction.status}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>{result.transaction._id}</dd>
                </div>
              </dl>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
