# Checks performed

## Double check the following:

### Implemented (code changes, build verified)

- Security headers — X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy in middleware.ts
- Email XSS fix — all user input escaped with escapeHtml() in mail.ts
- Rate limiting — 5 req/min on membership & contact, 10 req/min on shop-order (src/lib/rate-limit.ts)
- Photo-albums access control — create/update/delete restricted to admin
- Backup rotation — keeps last 30, prunes older in prebuild script
- Shop orders cleanup — auto-prunes shop-orders-confirmed.json to last 100 entries
- npm audit — 23 → 18 (5 fixed, rest locked behind Payload)

### Remaining (manual server-side checks)

- Verify db/ and .backups/ are not web-accessible on the server
- Check backup files exist on server
- Verify all admin users have 2FA enabled
- Verify .env values and file permissions (chmod 600)
- Confirm .env was never committed to git
- Add npm audit to CI pipeline
