# Architecture

```
 app (React PWA) ──HTTPS──▶ server (Express API) ──internal HTTP──▶ ai (FastAPI)
                               │        │                              │
                          PostgreSQL  Claude API              ai/artifacts/<task>/<version>
                          (Prisma)    (assistant)                  ▲
                                                                   │ export
                                                     ml (PyTorch) ─┘ ◀── verified scans
```

## Services

- **app** — mobile-first PWA. Caches weather, crops, farms and scan images for
  low-connectivity use (`vite.config.ts`). Talks only to the server.
- **server** — auth (JWT, roles FARMER/EXPERT/ADMIN), farms, weather intelligence,
  crop recommendations, scan orchestration, expert reviews, alerts, assistant.
- **ai** — stateless inference. Never stores data. Deployable on GPU/CPU
  independently of the API; loads versioned ONNX bundles at startup.
- **ml** — offline training; the only path into `ai/artifacts`.

## Scan flow

1. App uploads photo (+ optional crop, farm).
2. Server forwards to `ai` → `POST /v1/disease/analyze`.
3. `ai` checks quality (blur, light, size, leaf in frame). Unusable → no prediction.
4. `ai` runs the classifier (optionally restricted to the stated crop) and estimates
   severity from affected leaf area.
5. Server applies the **confidence policy** (`CONFIDENCE_CONFIDENT`, default 0.80):
   - below → `LOW_CONFIDENCE`: shown as *possible* conditions, retake tips, “Ask an expert”.
   - above → `CONFIDENT`: knowledge layer (`Disease` table) adds symptoms, treatment,
     prevention, monitoring; a disease alert is raised.
6. Every scan stores image, crop, label, confidence, severity, location, timestamp,
   **model version** and status.
7. Farmer feedback and expert reviews feed `GET /reviews/training-export` →
   `ml` retraining.

The model identifies; the knowledge layer explains. Disease text lives in data
(`server/prisma/data/diseases.json`), keyed by the ML label `<crop>__<condition>`.

## Localisation & expansion

Countries, regions, seasons, crops, planting calendars and diseases are seeded data,
not code. Adding Ghana means adding rows to `countries.json` and calendar entries in
`crops.json` — no code changes. Languages are stored per user and per country.

## API (all under `/api/v1`)

| Route | Purpose |
|---|---|
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | accounts |
| `GET/POST/PATCH/DELETE /farms`, `POST /farms/:id/crops` | farm management |
| `GET /weather?lat&lon` | forecast + agricultural advisories |
| `GET /crops`, `GET /crops/:key`, `GET /crops/recommendations` | crop knowledge & ranking |
| `GET /diseases`, `GET /diseases/:key` | disease database |
| `POST /scans`, `GET /scans`, `GET /scans/:id` | disease scanning |
| `POST /scans/:id/feedback`, `POST /scans/:id/review` | feedback loop, expert routing |
| `GET /reviews`, `POST /reviews/:id/resolve`, `GET /reviews/training-export` | experts & admin |
| `GET /alerts`, `POST /alerts/:id/read` | smart alerts |
| `POST /assistant/chat` | agricultural assistant |

## Not built yet (next steps)

Admin dashboard UI, expert review UI, pest model, soil-report upload parsing,
offline upload queue, push notifications, farming calendar view, knowledge hub
articles, community, market intelligence, translations of UI copy.
