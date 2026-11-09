# Setup & configuration

Everything needed to run AgroIntel locally on Windows: the web app, the mobile app, the API and the AI service.

## 1. Install

| Tool | Why | Where |
|---|---|---|
| **Node.js 20+** | Web app, mobile app, API | nodejs.org |
| **Git** | Version control | git-scm.com |
| **PostgreSQL 16** | Database | One of the three options below |
| **Python 3.12** | Plant-scan AI service | python.org/downloads. Tick **"Add python.exe to PATH"** |
| **Expo Go** (phone) | Runs the mobile app | Play Store / App Store. The project uses **Expo SDK 57** |

The `python` command that Windows ships with only opens the Microsoft Store. Install the real Python from python.org.

### Database: pick one

- **Hosted (easiest, nothing to install):** create a free project on **neon.tech** or **supabase.com** and copy the connection string (`postgresql://…`).
- **Local install:** PostgreSQL from postgresql.org/download/windows. Remember the password you set.
- **Docker:** install Docker Desktop, then run `docker compose up -d db` from the project root. That database is already set up for this project:
  `postgresql://agrointel:agrointel@localhost:5432/agrointel`

## 2. Keys

| Key | Used for | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Ask AI assistant | console.anthropic.com → API Keys (paid per use) |

Weather uses Open-Meteo, which is free and needs no key. Without the Anthropic key everything else still works; only Ask AI reports that it isn't set up.

## 3. Find your computer's network address

The phone can't reach `localhost` on your computer, so it uses your computer's network address instead. Run `ipconfig` and look for the **IPv4 Address** of your Wi-Fi adapter, e.g. `192.168.18.6`. The examples below use `<PC-IP>`.

If your router assigns a new address later, update both `.env` files.

## 4. Environment files

Never commit real `.env` files; `.gitignore` already excludes them.

### `server/.env`

Copy `server/.env.example`, then set:

```
DATABASE_URL=<your Postgres connection string>
JWT_SECRET=<long random text, 32+ characters>
ANTHROPIC_API_KEY=<your key>
PUBLIC_BASE_URL=http://<PC-IP>:4000
CORS_ORIGIN=http://localhost:5173
```

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `4000` | API port |
| `DATABASE_URL` | none (required) | Postgres connection string |
| `JWT_SECRET` | none (required) | Signs login tokens; at least 8 characters, use 32+ |
| `CORS_ORIGIN` | `http://localhost:5173` | Web app address(es), comma-separated |
| `AI_SERVICE_URL` | `http://localhost:8000` | Python AI service |
| `AI_SERVICE_TIMEOUT_MS` | `20000` | Give up on a scan after this long |
| `CONFIDENCE_CONFIDENT` | `0.80` | At or above this, show a likely diagnosis |
| `CONFIDENCE_POSSIBLE` | `0.45` | Below `CONFIDENT`, results show as "possible conditions" |
| `UPLOAD_DIR` | `uploads` | Where scan photos are saved |
| `PUBLIC_BASE_URL` | `http://localhost:4000` | Used in photo links. Must be `<PC-IP>`, or photos won't load on the phone |
| `ANTHROPIC_API_KEY` | none | Ask AI assistant |

### `mobile/.env`

Copy `mobile/.env.example`, then set:

```
EXPO_PUBLIC_API_URL=http://<PC-IP>:4000/api/v1
```

| Variable | Notes |
|---|---|
| `EXPO_PUBLIC_API_URL` | API address the phone calls |
| `EXPO_PUBLIC_DEFAULT_LAT` / `_LON` / `_PLACE` | Map position used when GPS is off and no farm exists yet |

### `app/.env` (optional)

The web app works without one: in development it forwards `/api` requests to `localhost:4000`. Copy `app/.env.example` only to change the default location.

### `ai/.env` (optional)

| Variable | Default | Notes |
|---|---|---|
| `MODEL_DIR` | `./artifacts` | Folder holding exported models |
| `DISEASE_MODEL_VERSION` | empty (newest) | Pin a specific model version |
| `TOP_K` | `3` | How many possible conditions to return |

## 5. First-time setup (run once)

From the project root:

```bash
npm install
npm run db:migrate -- --name init     # create database tables
npm run db:seed                       # load Nigeria, 13 crops, disease guides
```

AI service:

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Mobile app:

```bash
cd mobile
npm install
```

The mobile app has its own install because Expo requires a specific React version.

### Demo mode (mobile, no server)

To look around the mobile app without any setup, run `cd mobile` → `npx expo start -c`, open it in Expo Go, and tap **Explore the demo** on the login screen. It runs on sample data stored on the phone. Scan results there are samples (your photo is not analysed): each scan shows the next result type in turn (likely diagnosis → possible conditions → retake needed). Changes are lost when you exit the demo.

### Demo account

`npm run db:seed` also creates a demo login, with a farm and crops already set up:

| Email | Password |
|---|---|
| `demo@agrointel.app` | `AgroDemo2026!` |

Farmer "Amina Bello" has a 2.5 ha sandy loam farm in Zaria, Kaduna, with soil test results, plus maize and soybean near harvest and young tomatoes. Re-running the seed resets the demo farm. The demo account is never created when `NODE_ENV=production`.

## 6. Running it (each session)

Open one terminal per service:

| # | Command | What it is |
|---|---|---|
| 1 | `npm run dev:server` | API at http://localhost:4000 |
| 2 | `cd ai` → `.venv\Scripts\activate` → `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` | Plant-scan AI |
| 3 | `npm run dev:app` | Web app at http://localhost:5173 |
| 4 | `cd mobile` → `npx expo start -c` | Mobile app: scan the QR code with Expo Go |

- **Same Wi-Fi:** the phone and computer must be on the same network.
- **Firewall:** the first time the server starts, Windows asks about the firewall. Click **Allow** for private networks, or the phone can't connect.

**Setup order:** database → `server/.env` → migrate and seed → start the server → `mobile/.env` → Expo. Python can come later.

## 7. What works when

| Works once steps 1–6 are done | Needs more |
|---|---|
| Sign-up / login | **Disease diagnosis:** needs a trained model (below) |
| Farms, crops, planting dates | **Ask AI:** needs `ANTHROPIC_API_KEY` |
| Weather + farming advice | |
| Crop recommendations | |
| Alerts | |
| Photo quality check | |

Until a model exists, scans return "model not deployed yet" instead of guessing.

### Training the disease model

You need:

- **Training images:** PlantVillage and the cassava leaf disease dataset are free on Kaggle. Field photos from Nigerian farms matter most.
- **A GPU:** a free Google Colab or Kaggle notebook is enough to start. Training on an ordinary CPU is very slow.
- **The steps:** in [ml-pipeline.md](ml-pipeline.md) (prepare → train → evaluate → export).

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| Expo Go: "needs a newer version" | Your Expo Go and the project's SDK differ. Check with `npx expo --version` and your Expo Go's supported SDK |
| Phone can't connect to the API | Check `EXPO_PUBLIC_API_URL` uses `<PC-IP>`, same Wi-Fi, firewall allowed |
| Scan photos don't load on phone | `PUBLIC_BASE_URL` in `server/.env` still says `localhost` |
| "Disease detection model is not deployed yet" | Expected until you train and export a model |
| "Plant analysis service is not reachable" | Start the AI service (terminal 2) |
| "The assistant is not configured yet" | Add `ANTHROPIC_API_KEY` to `server/.env` and restart the server |
| Old code still showing in Expo | Restart with `npx expo start -c` to clear the cache |
