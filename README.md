# AgroIntel

AI-powered smart farming platform: a farmer's digital agricultural co-pilot.
**Snap → Analyse → Identify → Explain → Treat.**

## Repository layout

```
app/      React PWA (Vite, TypeScript, Tailwind) — mobile-first farmer app
server/   Node.js/Express API (TypeScript, Prisma, PostgreSQL)
ai/       Python/FastAPI inference service — image quality, disease model, severity
ml/       Training pipeline — dataset prep, training, evaluation, ONNX export, feedback loop
shared/   API types shared by app and server
docs/     Architecture and ML pipeline notes
```

Each folder owns one concern. Inside `app/` and `server/`, code is grouped by feature
(`features/scan`, `modules/scans`, …) so a feature's files live together.

## Quick start

Prerequisites: Node 20+, Python 3.11+, Docker (for Postgres).

```bash
# 1. Database
docker compose up -d db

# 2. API
cp server/.env.example server/.env        # add ANTHROPIC_API_KEY for the assistant
npm install
npm run db:migrate -- --name init
npm run db:seed
npm run dev:server                         # http://localhost:4000

# 3. AI service
cd ai && python -m venv .venv && .venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. App
npm run dev:app                            # http://localhost:5173
```

The disease scanner needs a trained model in `ai/artifacts/disease/<version>/`.
Until one is exported, quality checks still run and scans return
"model not deployed yet" — the app never shows a made-up diagnosis.
See [docs/ml-pipeline.md](docs/ml-pipeline.md) to train one.

## MVP scope (spec §35)

| Priority | Feature | Where |
|---|---|---|
| 1 | AI plant disease detection | `app/src/features/scan`, `server/src/modules/scans`, `ai/`, `ml/` |
| 2 | Location-based weather → farm advice | `server/src/modules/weather` |
| 3 | Crop recommendations | `server/src/modules/crops/recommender.ts` |
| 4 | Agricultural AI assistant | `server/src/modules/assistant` |
| 5 | Farm management + smart alerts | `server/src/modules/{farms,alerts}` |

Brand colour: Nigerian green `#008751` (`app/src/styles.css`).
