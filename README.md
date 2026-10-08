# Blog API

An Express.js server for managing blog posts with JWT authentication with rotating refresh tokens., built using Express 5, Prisma 7, PostgreSQL, and passport.js.

Live: https://blog-api-production-3481.up.railway.app

## Related projects

| Project | Purpose | Repo | Live |
| --- | --- | --- | --- |
| blog-dashboard | Reader app: browse posts, comment | [GitHub](https://github.com/arnplsrz/blog-dashboard) | [blog.dashboard.arnplsrz.com](https://blog.dashboard.arnplsrz.com) |
| blog-admin | Author app: manage posts and comments | [GitHub](https://github.com/arnplsrz/blog-admin) | [blog.admin.arnplsrz.com](https://blog.admin.arnplsrz.com) |

## Requirements

- Node.js
- pnpm
- PostgreSQL

## Setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:migrate
pnpm dev
```

Set `DATABASE_URL`, `JWT_SECRET` and `REFRESH_SECRET` in `.env` before migrating.

## Endpoints

All routes are under `/api`.

| Method | Path | Access |
| --- | --- | --- |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Refresh cookie |
| POST | `/auth/logout` | Refresh cookie |
| GET | `/posts` | Public |
| GET | `/posts/:id` | Public |
| POST | `/posts` | Author |
| PATCH | `/posts/:id` | Author |
| DELETE | `/posts/:id` | Author |
| POST | `/posts/:id/comments` | Signed in |
| GET | `/comments` | Author |
| PATCH | `/comments/:id` | Owner or author |
| DELETE | `/comments/:id` | Owner or author |
| GET | `/users` | Public |
| GET | `/users/:id` | Public |
| GET | `/users/me` | Signed in |
| PATCH | `/users/me` | Signed in |
| DELETE | `/users/me` | Signed in |

## Deployment

Hosted on Railway. Run `pnpm prisma:deploy` as the pre-deploy command to apply migrations.

## References

### Authentication

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [MDN: SameSite attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies#controlling_third-party_cookies_with_samesite)
- [RFC 6265bis](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis)
- [Express Production Best Practices: Security](https://expressjs.com/en/advanced/best-practice-security/#use-cookies-securely)
- [OWASP JSON Web Tokens](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html#jwt-revocation)
- [Web Dev Simplified: Auth Does NOT To Be That Hard](https://www.youtube.com/watch?v=mL8EuL7jSbg)
- [Cosden Solutions: Authentication in React with JWTs, Access & Refresh Tokens (Complete Tutorial)](https://www.youtube.com/watch?v=AcYF18oGn6Y)