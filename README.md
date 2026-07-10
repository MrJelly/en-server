# Cloudflare speaking-library backend

The online API runs on Cloudflare Workers Free. D1 stores curated lesson cards and user assignment history; R2 Standard stores audio and corpus archives. The Node-only import and curation utilities remain local and are not included in the Worker bundle.

## One-time Cloudflare setup

```powershell
pnpm.cmd install
pnpm.cmd exec wrangler login
pnpm.cmd exec wrangler d1 create speaking-library
pnpm.cmd exec wrangler r2 bucket create speaking-library-media
```

Copy the real `database_id` printed by `wrangler d1 create` into `wrangler.jsonc`. Do not commit API tokens or account credentials.

## Local development

```powershell
pnpm.cmd db:migrate:local
pnpm.cmd dev
```

The local API is available at `http://127.0.0.1:8787`. Verify `GET /health`, then point `VITE_SERVER_BASEURL` at that origin.

## Deploy

```powershell
pnpm.cmd db:migrate:remote
pnpm.cmd deploy
```

After deployment, set the mini-program environment variable to the assigned `workers.dev` URL and add that origin to the WeChat request-domain allowlist.

## Free-tier safeguards

- D1 contains only approved cards and user learning records. Raw corpus archives belong in R2.
- Candidate queries try at most five `sample_bucket` values with three rows each; no `ORDER BY RANDOM()` is allowed.
- `(user_id, local_date)` guarantees daily idempotency.
- `(user_id, sentence_id)` prevents repeat new sentences.
- D1 quota errors become `FREE_TIER_LIMIT`; the client keeps an already cached daily card available offline.
- Keep R2 on Standard storage and monitor D1/R2 usage in the Cloudflare dashboard.

## Verification

```powershell
pnpm.cmd test
pnpm.cmd type-check
pnpm.cmd exec wrangler deploy --dry-run
```
