import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="landing">
      <header className="nav">
        <span className="brand">Meridian</span>
        <nav>
          {user ? (
            <Link className="btn btn-solid" to="/app">
              Go to banking
            </Link>
          ) : (
            <>
              <Link className="btn" to="/login">
                Sign in
              </Link>
              <Link className="btn btn-solid" to="/register">
                Open account
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="hero">
        <p className="eyebrow">Personal banking, precisely</p>
        <h1>
          Ledger-first banking.
          <br />
          Nothing hidden.
        </h1>
        <p className="lede">
          Meridian runs on a double-entry ledger — every credit and debit is
          recorded, immutable, and verifiable. Your balance isn't a number we
          store; it's a history you can trust.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link className="btn btn-solid btn-lg" to="/app">
              Open your dashboard
            </Link>
          ) : (
            <>
              <Link className="btn btn-solid btn-lg" to="/register">
                Get started
              </Link>
              <Link className="btn btn-lg" to="/login">
                I already bank here
              </Link>
            </>
          )}
        </div>

        <dl className="hero-facts">
          <div>
            <dt>₹0</dt>
            <dd>Account opening fee</dd>
          </div>
          <div>
            <dt>Immutable</dt>
            <dd>Ledger entries</dd>
          </div>
          <div>
            <dt>Idempotent</dt>
            <dd>Every transfer</dd>
          </div>
        </dl>
      </main>

      <footer className="footer">
        Meridian Bank — portfolio project. Backend: Express + MongoDB.
      </footer>
    </div>
  );
}
