# Deploying (Vercel + Neon)

Two Vercel projects deploy from the same GitHub repo. Every push to `main` deploys both to production; other branches get preview deployments.

| Project | Root directory | Framework | URL |
|---|---|---|---|
| `agrointel-web` | `app` | Vite | https://agrointel-web.vercel.app |
| `agrointel-api` | `server` | Express | https://agrointel-api.vercel.app |

Both use Node 22. The API runs in London (`lhr1`, set in `server/vercel.json`), next to the database.

## How the pieces connect

- **Web → API:** `app/vercel.json` proxies `/api/*` and `/uploads/*` to the API, so the browser only talks to one domain and needs no CORS.
- **Mobile → API:** set `EXPO_PUBLIC_API_URL=https://agrointel-api.vercel.app/api/v1` in `mobile/.env`.
- **API → database:** the Neon database `agrointel-db` (London) is connected to `agrointel-api` through the Vercel Neon integration. It injects `DATABASE_URL` (pooled, for queries) and `DATABASE_URL_UNPOOLED` (direct, for migrations).

## API environment variables

Set in the `agrointel-api` project (Production and Preview):

| Variable | Value |
|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | From the Neon integration; don't edit |
| `JWT_SECRET` | Random secret (sensitive). Changing it signs everyone out |
| `PUBLIC_BASE_URL` | `https://agrointel-api.vercel.app` |
| `CORS_ORIGIN` | `https://agrointel-web.vercel.app` |
| `ANTHROPIC_API_KEY` | Not set yet; needed for "Ask AI" |
| `AI_SERVICE_URL` | Not set yet; needed for plant scans |

Environment variable changes apply on the next deployment.

## Database changes

Each API build runs `prisma generate && prisma migrate deploy` (`vercel-build` in `server/package.json`). To change the schema, edit `schema.prisma`, run `npm run db:migrate -- --name <change>` against a local or branch database, commit the new folder in `prisma/migrations/`, and push.

To re-seed reference data (countries, crops, diseases), pull the production variables and run the seed with `NODE_ENV=production` so the demo account is not created:

```bash
vercel link --yes --project agrointel-api
vercel env pull .env.production.local --environment production
set -a; . ./.env.production.local; set +a
cd server && NODE_ENV=production npx prisma db seed
rm ../.env.production.local
```

## Not deployed yet

- **AI service (`ai/`):** Python and ONNX, not a fit for Vercel functions. It needs a container host (Render, Railway, Fly.io), then set `AI_SERVICE_URL`. Until then plant scans return an error.
- **Photo storage:** `server/src/lib/storage.ts` writes to local disk, which doesn't persist on Vercel. Move it to Vercel Blob before scans go live.
- **Upload size:** Vercel caps request bodies at about 4.5 MB, below the API's 10 MB upload limit. Resize photos on the phone before upload.
