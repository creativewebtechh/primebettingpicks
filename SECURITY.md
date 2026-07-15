# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within PrimeBettingPicks, please send an email to security@primebettingpicks.com. All security vulnerabilities will be promptly addressed.

Please do not report security vulnerabilities through public GitHub issues.

## Security Architecture

### Authentication
- **JWT-based** authentication with httpOnly, secure, SameSite=Strict cookies
- Token expiry: 7 days with secure cookie storage
- Password hashing: **bcrypt** with 12 salt rounds
- Cookie name: `session` — not accessible via JavaScript

### Authorization (RBAC)
| Role | Permissions |
|------|------------|
| `user` | View free predictions, manage profile |
| `editor` | Create/edit news articles |
| `moderator` | Moderate content, manage comments |
| `admin` | Full admin dashboard access |
| `superadmin` | Admin access + user role management |

All admin endpoints (`/api/admin/*`) enforce `requireAdmin()` which verifies both JWT validity and role.

### API Security
- **Rate Limiting**: In-memory rate limiter applied to:
  - Login: 20 requests/minute per IP
  - Contact form: 5 requests/minute per IP
  - Analytics: 30 requests/minute per IP
- **Input Validation**: Server-side validation on all API inputs (registration, login, profile updates)
- **SQL Injection Prevention**: Prisma ORM parameterizes all queries
- **XSS Prevention**: React escapes output by default; Content Security Policy headers enforced
- **CSRF Protection**: SameSite=Strict cookies prevent cross-site request forgery

### Security Headers (via Next.js Middleware)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-XSS-Protection: 1; mode=block
```

### Payment Security (Paystack)
- Webhook signature verification using HMAC SHA-512
- Webhook handler requires valid `x-paystack-signature` header
- Signature verification throws if `PAYSTACK_SECRET_KEY` is missing
- Payment verification checks transaction status with Paystack API
- Idempotent webhook processing (duplicate events safely ignored)
- Server-side amount validation (never trust client-sent amounts)

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes (production) | Secret key for JWT signing. **Throws in production if missing** |
| `PAYSTACK_SECRET_KEY` | Yes | Paystack API secret key |
| `PAYSTACK_PUBLIC_KEY` | Yes | Paystack public key (client-side) |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot token for admin notifications |
| `TELEGRAM_CHAT_ID` | Optional | Telegram chat ID for admin notifications |
| `API_FOOTBALL_KEY` | Optional | API-Football/RapidAPI key |
| `API_FOOTBALL_HOST` | Optional | API-Football host (default: api-football-v1.p.rapidapi.com) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL for callbacks |
| `NEXT_PUBLIC_API_URL` | Yes | API base URL |

### Database Security
- Prisma ORM prevents SQL injection via parameterized queries
- Database user should have minimal required privileges
- All foreign key constraints enforced at database level
- `@@unique` constraints prevent duplicate data

### Deployment Security Checklist
- [ ] Set strong `JWT_SECRET` (minimum 32 characters)
- [ ] Set `PAYSTACK_SECRET_KEY` with production key
- [ ] Enable HTTPS (TLS 1.2+)
- [ ] Set `NODE_ENV=production`
- [ ] Restrict database access to application server only
- [ ] Configure firewall rules
- [ ] Enable logging and monitoring
- [ ] Set up automated backups
- [ ] Review and rotate API keys regularly
- [ ] Disable debug mode
- [ ] Verify all `.env` variables are set

### Monitoring & Logging
- Structured logging via `src/lib/logger.ts`
- Audit trail for admin actions via `auditlog` model
- Payment transactions logged with reference IDs
- Authentication events logged (login, register, logout)

### Dependencies
- Run `npm audit` regularly
- Keep dependencies updated
- Monitor for known vulnerabilities in Next.js, Prisma, bcryptjs, jsonwebtoken

## Changelog

### v1.0.0 (2026-07-11)
- Initial production release
- JWT authentication with httpOnly cookies
- Paystack payment integration with webhook verification
- Rate limiting on sensitive endpoints
- Security headers via Next.js middleware
- RBAC with 5 user roles
- Input validation and sanitization
- Structured error logging
- Audit trail for admin actions
