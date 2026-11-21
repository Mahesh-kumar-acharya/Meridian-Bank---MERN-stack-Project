# Bank Ledger — Backend API Integration Document

Base URL: `http://localhost:3000`
Auth: JWT returned in the response body (`token`) **and** set as an http cookie named `token`.
The frontend sends the token via the `Authorization: Bearer <token>` header (cookie also works since requests are same-origin-proxied).

## 1. Authentication

### POST /api/auth/register

- Body: `{ "email": "a@b.com", "password": "secret1", "name": "Alice" }`
- 201 → `{ user: { _id, email, name }, token }`
- 422 → `{ message: "User already exists ", status: "failed" }`
- Side effect: registration email sent.

### POST /api/auth/login

- Body: `{ "email", "password" }`
- 200 → `{ user: { _id, email, name }, token }`
- 404 → `{ message: "Email or password is INVALID !!" }`

### POST /api/auth/logout

- No required body. Clears cookie, blacklists the presented token.
- 200 → `{ message: "User logged out successfully " }`

## 2. Accounts (authMiddleware required)

### POST /api/accounts/create

- Body: none (owner derived from JWT)
- 201 → `{ account: { _id, user, status: "active", currency: "INR", createdAt, updatedAt } }`

### GET /api/accounts

- 200 → `{ accounts: [Account] }` — accounts belonging to the authenticated user only.

### GET /api/accounts/balance/:accountId

- 200 → `{ accountId, balance }` (balance = credits − debits from the ledger)
- 404 → `{ message: "Account not found" }`

## 3. Transactions

### POST /api/transactions (authMiddleware required)

- Body: `{ "fromAccount": "<id>", "toAccount": "<id>", "amount": 100, "idempotencyKey": "<uuid>" }`
- `amount` must be ≥ 1; both accounts must exist; sufficient balance enforced.
- 201 → `{ message: "Transaction completed successfully", transaction }`
- 200 → repeat requests with the same `idempotencyKey` return the existing transaction (idempotent).
- 400 → invalid accounts / insufficient balance / missing fields.
- Side effect: transaction email sent.

### POST /api/transactions/system/initial-funds (authSystemUserMiddleware)

> NOTE: this route requires the token to be BLACKLISTED (unusual inverted logic in the middleware).
> It is not usable by a normally-authenticated frontend user, so the frontend does NOT call it.

## 4. Data models (as exposed to the frontend)

**User** (only these fields are ever returned): `{ _id, email, name }`

**Account**: `{ _id, user, status: "active"|"frozen"|"closed", currency: "INR", createdAt, updatedAt }`

> Note: model enum is lowercase (`active`) but the transaction controller compares against `"ACTIVE"` — this comparison never matches, which effectively means the account-status gate is inert. Frontend treats any account as transactable.

**Transaction**: `{ _id, fromAccount, toAccount, status: "PENDING"|"COMPLETED"|"FAILED"|"REVERSED", amount, idempotencyKey, createdAt, updatedAt }`

**Ledger** (immutable): `{ account, amount, transaction, type: "CREDIT"|"DEBIT" }`

## 5. NOT available (frontend will not assume these)

- ❌ No endpoint to list transactions (no transaction history page possible)
- ❌ No user profile/me endpoint (frontend stores user from login/register response)
- ❌ No deposit/withdraw endpoints (only account-to-account transfer)
- ❌ No account close/freeze endpoints
