# Website Factory Framework Patterns

Reference for all reusable patterns extracted from the Website Factory framework. Every pattern here was battle-tested on Vercel production.

---

## 1. Database (SQLite on Vercel)

**File:** `src/lib/db.ts`

### Vercel-aware path

```ts
const isVercel = !!process.env.VERCEL;
const dbDir = isVercel
  ? path.join("/tmp", "database")
  : path.join(process.cwd(), "database");
```

On Vercel serverless, `/tmp` is ephemeral (resets on cold start). The DB is re-created and re-seeded on each cold start. Locally, it persists in `./database/`.

### WAL mode

```ts
db.pragma("journal_mode = WAL");
```

Required for concurrent reads during server rendering.

### Seed data — ALWAYS call `.run()`

**CRITICAL:** `db.prepare(sql)` creates a prepared statement. It does NOT execute it. You MUST chain `.run()`, `.get()`, or `.all()`.

```ts
// WRONG — data never inserted
db.prepare(`INSERT INTO categories (...) VALUES (...)`);

// CORRECT
db.prepare(`INSERT INTO categories (...) VALUES (...)`).run();
```

This was the root cause of blog/category/product pages returning 404 in production — three multi-row INSERTs were missing `.run()`.

### Admin UPSERT on every cold start

```ts
const existingAdmin = db.prepare("SELECT id FROM users WHERE username = ?").get(adminUsername);
if (existingAdmin) {
  db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(hash, adminUsername);
} else {
  db.prepare("INSERT INTO users (...) VALUES (?, ?, ?, ?)").run(...);
}
```

This ensures password changes via `ADMIN_PASSWORD` env var are reflected on the next cold start without manual DB updates.

### Error handling

```ts
try {
  initializeDatabase();
} catch (err) {
  console.error("[db] Database initialization failed:", err);
}
```

NEVER silently swallow init errors. Log them so Vercel function logs show the issue.

---

## 2. Authentication

**Files:** `src/lib/auth.ts`, `src/middleware.ts`, `src/app/dashboard/layout.tsx`

### HMAC-signed session tokens

Sessions use HMAC-SHA256 signatures, not just base64-encoded JSON:

```ts
function encodeSession(data: SessionData): string {
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET).update(base64).digest("base64url");
  return `${base64}.${signature}`;
}
```

This prevents token forgery. The `SESSION_SECRET` env var must be set in production.

### Token format: `base64url.base64url`

Middleware validates the format before the token reaches the DB:

```ts
const parts = token.split(".");
if (parts.length !== 2 || !parts[0] || !parts[1]) {
  // Redirect to login
}
```

### Cookie security

```ts
cookieStore.set(SESSION_COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_DURATION_MS / 1000,
});
```

### Dashboard auth (server-side)

```ts
// src/app/dashboard/layout.tsx
export default async function DashboardLayout({ children }) {
  const user = await requireAuth(); // redirects to /login if invalid
  return <div>...</div>;
}
```

`requireAuth()` redirects. `getCurrentUser()` returns null (for conditional rendering).

---

## 3. Dynamic Routes

**Pattern:** Any page querying the SQLite DB at request time.

### Force-dynamic (REQUIRED for DB-dependent routes)

```ts
export const dynamic = "force-dynamic";
```

**Why:** On Vercel, the SQLite DB is ephemeral (`/tmp`). `generateStaticParams()` returns empty at build time, causing 404s. `force-dynamic` ensures server-side rendering on every request, after DB init.

### Static routes (hardcoded data)

```ts
// Use generateStaticParams() only for known, hardcoded slugs
export async function generateStaticParams() {
  return Object.keys(KNOWN_INDUSTRIES).map((slug) => ({ slug }));
}
```

Industries uses this pattern because the data is hardcoded in the file, not from the DB.

### Rule of thumb

| Data source | Pattern |
|---|---|
| Hardcoded in file | `generateStaticParams()` (SSG) |
| SQLite DB | `export const dynamic = "force-dynamic"` |
| External API | `export const dynamic = "force-dynamic"` |

---

## 4. SEO

**Files:** `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/layout.tsx`

### metadataBase (layout.tsx)

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.com"),
  // ...
};
```

Required for OG images, canonical URLs, and sitemap/robots URLs.

### Dynamic sitemap

```ts
// Static pages listed manually
// Dynamic pages pulled from DB
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [...];
  const dbPages = getProducts().map(p => ({ url: `${BASE_URL}/products/${p.slug}`, ... }));
  return [...staticPages, ...dbPages];
}
```

`BASE_URL` must match `metadataBase`.

### robots.txt

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/login", "/api"] }],
    sitemap: "https://your-domain.com/sitemap.xml",
  };
}
```

Always disallow `/dashboard`, `/login`, and `/api`.

---

## 5. Environment Variables

Required for production:

| Variable | Purpose |
|---|---|
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password (synced on cold start) |
| `SESSION_SECRET` | HMAC signing key for session tokens |
| `BOOTSTRAP_SECRET` | Secret for admin bootstrap API endpoint |
| `SITE_NAME` | Site name for settings seed |

---

## 6. Deployment

**Command:** `npx vercel deploy --prod --yes --token=<token>`

- Never deploy manually — use the Vercel CLI or GitHub integration
- The deployment pipeline in `deployment/deploy.ts` runs 20 verification checks before marking DELIVERY COMPLETE
- Git push may be blocked by network — use Vercel CLI as fallback

---

## 7. Common Pitfalls

1. **Missing `.run()` on INSERT** — `prepare()` alone does nothing. Always chain `.run()`.
2. **Static generation of DB-dependent routes** — Use `force-dynamic`, not `generateStaticParams()`.
3. **Silent error swallowing** — Never use empty `catch {}` on DB init. Log errors.
4. **Hardcoded `SESSION_SECRET`** — Use env var. Default `"change-me"` is insecure.
5. **Missing `metadataBase`** — OG images and canonical URLs break without it.
6. **Ephemeral `/tmp` on Vercel** — DB re-created on every cold start. Seed data must be idempotent.
