# Meridian-Bank---MERN-stack-Project
<div align="center">

# 🏦 Bank Ledger

**A full-stack digital banking ledger with double-entry accounting, JWT auth, and idempotent money transfers.**

Built with **Node.js · Express 5 · MongoDB · React 19 · Vite**

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Project Structure](#-project-structure) · [Roadmap](#-roadmap)

</div>

---

## ✨ Features

|                              |                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔐 **Secure Authentication** | JWT-based auth with hashed passwords (bcrypt), HTTP-only cookie tokens, and a **token blacklist** for real logouts — no "dead" tokens floating around.                          |
| 📒 **Double-Entry Ledger**   | Every money movement is recorded as an immutable **CREDIT + DEBIT** pair. Account balances are _never stored_ — they're computed from the ledger, making the books audit-proof. |
| ⚛️ **Idempotent Transfers**  | Every transfer carries a unique `idempotencyKey`. Retried requests return the original outcome instead of double-spending.                                                      |
| 🔄 **ACID Transactions**     | Transfers run inside MongoDB sessions: transaction record + both ledger entries commit **all-or-nothing**. Money is never created or lost mid-flight.                           |
| 🧊 **Account Lifecycle**     | Accounts have `active / frozen / closed` states, enforced on every transfer.                                                                                                    |
| 📧 **Email Notifications**   | Welcome emails on signup and transaction notifications via Nodemailer (Gmail OAuth2).                                                                                           |
| 🖥️ **React Frontend**        | A clean SPA with Landing, Register, Login, Dashboard, and Transfer pages — powered by Vite with instant HMR.                                                                    |
| 💸 **Initial Funding Flow**  | A dedicated _system-user_ endpoint seeds new accounts with starting balance through the same ledger mechanics.                                                                  |

---

## 🧠 Core Concept — "The Ledger Is The Truth"

Most hobby banking apps store a `balance` field and update it. That's fragile: one crash between two updates and the money vanishes.

**Bank Ledger does it the way real banks do:**

```text
Transfer ₹500 from A → B
├── Ledger entry 1:  account A | DEBIT  | ₹500 | txn #42   ┐
├── Ledger entry 2:  account B | CREDIT | ₹500 | txn #42   ├── one atomic DB session
└── Transaction:     status PENDING → COMPLETED            ┘

Balance(A) = SUM(all credits for A) − SUM(all debits for A)
```

Ledger entries are **immutable at the schema level** — Mongoose `pre` hooks throw on _any_ update or delete attempt. The history cannot be rewritten.

---

## 🏗 Architecture

```text
┌─────────────────────┐
│   React SPA (Vite)  │  client/  → port 5173
└─────────┬───────────┘
          │ HTTP + cookies
┌─────────▼───────────┐
│  Express API        │  server.js → src/app.js → port 3000
│  ┌────────────────┐ │
│  │ Routes         │ │  /api/auth · /api/accounts · /api/transactions
│  ├────────────────┤ │
│  │ Auth Middleware│ │  JWT verify + blacklist check → req.user
│  ├────────────────┤ │
│  │ Controllers    │ │  business logic
│  ├────────────────┤ │
│  │ Models (Mongo) │ │  user · account · transaction · ledger · blacklist
│  └────────────────┘ │
└─────────┬───────────┘
          │ Mongoose
┌─────────▼───────────┐
│      MongoDB        │
└─────────────────────┘
        │
        ▼
   Nodemailer → Gmail OAuth2 (emails)
```

**Request flow:** `Route → Middleware → Controller → Model → MongoDB` — a clean, one-directional layered design that's easy to test and extend.

### The Data Model

```
user          account           transaction            ledger (immutable)
──────        ───────           ────────────           ──────────────────
_id    ◄──┐   _id       ◄──┐    _id             ┌──►  _id
email      └── user          fromAccount ────────┤     account    ──► account._id
name           status        toAccount  ─────────┤     transaction──► transaction._id
password*      currency      amount              │     amount
               balance() ◄─── computed via       └──►  type: CREDIT | DEBIT
                             ledger aggregation
tokenBlackList: { token } + TTL index → auto-purged after 3 days
```

\* password is `select: false` — it never leaves the DB unless explicitly requested.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or an [Atlas](https://www.mongodb.com/atlas) URI
- A Gmail account with OAuth2 credentials (optional — for email features)

### 1 · Clone & install

```bash
git clone (https://github.com/Mahesh-kumar-acharya/Meridian-Bank---MERN-stack-Project)
cd bank-ledger

# backend
npm install

# frontend
cd client
npm install
cd ..
```

### 2 · Configure environment

Create a `.env` file in the project root:

```env
# Database
MONGO_URL=mongodb://127.0.0.1:27017/bank-ledger

# Auth
JWT_SECRET=your-super-secret-key-change-me

# Email (Gmail OAuth2)
EMAIL_USER=you@gmail.com
CLIENT_ID=your-oauth-client-id
CLIENT_SECRET=your-oauth-client-secret
REFRESH_TOKEN=your-oauth-refresh-token
```

And `client/.env` for the frontend:

```env
VITE_API_URL=http://localhost:3000
```

### 3 · Run it

```bash
# Terminal 1 — API (nodemon hot-reload)
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

| Service     | URL                     |
| ----------- | ----------------------- |
| 🔌 REST API | `http://localhost:3000` |
| 🖥️ Web app  | `http://localhost:5173` |

### 4 · Try the full flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret123"}' -c cookies.txt

# 2. Open an account
curl -X POST http://localhost:3000/api/accounts/create -b cookies.txt

# 3. Check your balance
curl http://localhost:3000/api/accounts/balance/<accountId> -b cookies.txt

# 4. Send money
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"fromAccount":"<id1>","toAccount":"<id2>","amount":500,"idempotencyKey":"txn-001"}'
```

---

## 📬 API Reference

Base URL: `http://localhost:3000`

### Auth — `/api/auth`

| Method | Endpoint    | Auth | Description                                               |
| ------ | ----------- | ---- | --------------------------------------------------------- |
| `POST` | `/register` | —    | Create user → returns JWT (cookie + body) + welcome email |
| `POST` | `/login`    | —    | Authenticate → returns JWT                                |
| `POST` | `/logout`   | —    | Blacklists the current token, clears cookie               |

### Accounts — `/api/accounts` 🔒

| Method | Endpoint              | Description                                      |
| ------ | --------------------- | ------------------------------------------------ |
| `POST` | `/create`             | Open a new account for the logged-in user        |
| `GET`  | `/`                   | List all accounts of the logged-in user          |
| `GET`  | `/balance/:accountId` | Ledger-computed balance for one of your accounts |

### Transactions — `/api/transactions` 🔒

| Method | Endpoint                | Description                                                 |
| ------ | ----------------------- | ----------------------------------------------------------- |
| `POST` | `/`                     | Transfer money between accounts (requires `idempotencyKey`) |
| `POST` | `/system/initial-funds` | System-user funding flow for seeding accounts               |

🔒 = requires a valid JWT (cookie or `Authorization: Bearer <token>` header)

**Transfer request/response example:**

```jsonc
// POST /api/transactions
{
  "fromAccount": "665f1a...",
  "toAccount": "665f2b...",
  "amount": 500,
  "idempotencyKey": "unique-key-001"
}

// 201 Created
{ "message": "Transaction completed successfully", "transaction": { "status": "COMPLETED", ... } }

// Replay the same request → 200 (no double-spend)
{ "message": "Transaction already completed", "transaction": { ... } }
```

---

## 📂 Project Structure

```text
bank-ledger/
├── server.js                          # Entry point — DB connect + listen :3000
├── package.json
├── .env                               # Secrets (never commit!)
├── docs/
│   ├── ARCHITECTURE.md                # Deep-dive design doc
│   └── API_INTEGRATION.md             # Frontend ↔ backend integration guide
├── src/
│   ├── app.js                         # Express app: CORS, JSON, cookies, routers
│   ├── database/
│   │   └── db.js                      # Mongoose connection
│   ├── models/
│   │   ├── user.model.js              # + bcrypt pre-save hook, comparePassword()
│   │   ├── account.model.js           # + getBalance() aggregation
│   │   ├── transaction.model.js       # + unique idempotencyKey
│   │   ├── ledger.model.js            # immutable — update/delete blocked by hooks
│   │   └── blackList.model.js         # TTL-indexed logged-out tokens
│   ├── middleware/
│   │   └── auth.middleware.js         # JWT verification → req.user
│   ├── controllers/
│   │   ├── auth.controller.js         # register / login / logout
│   │   ├── account.controller.js      # create / list / balance
│   │   └── transactions.controller.js # transfers inside Mongo sessions
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── account.routes.js
│   │   └── transactions.routes.js
│   └── services/
│       └── email.services.js          # Nodemailer (welcome + transaction emails)
└── client/
    ├── src/
    │   ├── main.jsx                   # Router bootstrap
    │   ├── pages/                     # Landing · Register · Login · Dashboard · Transfer
    │   ├── lib/                       # api.js · auth.jsx · format.js
    │   └── styles.css
    └── vite.config.js
```

---

## 🛠 Tech Stack

| Layer    | Tech                                                |
| -------- | --------------------------------------------------- |
| Runtime  | Node.js (CommonJS)                                  |
| API      | Express 5                                           |
| Database | MongoDB + Mongoose 9                                |
| Auth     | JWT (`jsonwebtoken`) + `bcryptjs` + `cookie-parser` |
| Email    | `nodemailer` (Gmail OAuth2)                         |
| Frontend | React 19, React Router 7, Vite 8                    |
| Linting  | Oxlint                                              |

---

## 🗺 Roadmap

- [ ] Error-handling middleware + centralized async error wrapper
- [ ] Rate limiting & request validation (Zod / Joi)
- [ ] Refresh tokens & token rotation
- [ ] Transaction history endpoint with pagination
- [ ] Multi-currency support with conversion rates
- [ ] Reversal / refund workflow (`REVERSED` status)
- [ ] Jest / Supertest integration tests
- [ ] Docker Compose (API + Mongo + client)
- [ ] CI pipeline

---

## 🤝 Contributing

1. Fork the repo & create a branch: `git checkout -b feat/awesome-thing`
2. Commit with clear messages: `feat: add transaction history endpoint`
3. Open a Pull Request describing what & why.

---

<div align="center">

Made with 💚 and a healthy respect for double-entry bookkeeping.

**"In ledger we trust — everything else gets audited."**

</div>
