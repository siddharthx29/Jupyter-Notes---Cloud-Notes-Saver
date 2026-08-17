# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Architecture & Defenses

JupyterNotebook / TempNote implements multi-layer defense against common web vulnerabilities and attacks:

### 1. Secret Protection & Environment Isolation
- All secrets, API keys, database credentials, and session tokens are strictly stored in `.env` files and excluded from git via `.gitignore`.
- Production uses strong, randomized secrets.

### 2. SQL Injection Prevention
- All database operations are executed via **Prisma ORM** with parameterized queries and prepared statements.
- Direct string interpolation in SQL queries is completely forbidden.

### 3. Brute-Force & Denial-of-Service (DoS) Protection
- **Rate Limiting (`express-rate-limit`)**: Note creation and password verification endpoints are rate-limited to protect against brute-force password guessing and spam floods.
- **Payload Size Clamping**: Strict 5MB payload limit on incoming request bodies preventing memory exhaustion.

### 4. Password Security
- Passwords and short PINs are hashed using **`bcrypt`** with high work factor (salt rounds: 10).
- Plaintext passwords are never stored, logged, or exposed in error responses.

### 5. HTTP Header Hardening (`helmet`)
- **Content-Security-Policy (CSP)**: Mitigates Cross-Site Scripting (XSS) and data injection attacks.
- **X-Frame-Options (DENY)**: Prevents Clickjacking attacks.
- **X-Content-Type-Options (nosniff)**: Prevents MIME-type sniffing vulnerabilities.
- **Strict-Transport-Security (HSTS)**: Enforces encrypted HTTPS connections in production.

### 6. CORS (Cross-Origin Resource Sharing)
- Requests are strictly validated against explicitly whitelisted origin domains.

---

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please report it privately:

1. **Do not** create a public GitHub issue.
2. Email security reports with reproduction steps to `security@tempnotes.com` or create a private GitHub Security Advisory.
3. Vulnerabilities will be triaged and addressed promptly.
