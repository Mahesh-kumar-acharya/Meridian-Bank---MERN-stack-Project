import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form.email, form.password, form.name);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="brand brand-link">
        Meridian
      </Link>
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Open your account</h1>
        <p className="muted">Takes under a minute. No paperwork.</p>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <label>
          Full name
          <input
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
          />
          <span className="hint">At least 6 characters.</span>
        </label>

        <button className="btn btn-solid btn-block" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="muted center">
          Already banking with us? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
