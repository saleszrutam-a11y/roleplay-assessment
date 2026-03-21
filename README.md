# AI Roleplay Assessment Prototype

An AI-powered roleplay training tool for telecom store executives. Claude plays a customer (Rahul Mehta) who walks into a store needing a SIM replacement after phone theft. The system scores the executive's performance against a 13-step protocol.

## Prerequisites

- **Node.js 18+** and npm
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com/)
- **Deepgram API key** (free tier, 12K min/year) — [console.deepgram.com](https://console.deepgram.com/)
- **Google Cloud account** (free tier) — for Text-to-Speech
- **Supabase account** (free tier) — [supabase.com](https://supabase.com/)

## Quick Start (Local)

```bash
# 1. Clone and set up environment
cp .env.example backend/.env
# Edit backend/.env with your API keys

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Start backend (Terminal 1)
cd backend && npm run dev

# 4. Start frontend (Terminal 2)
cd frontend && npm run dev

# 5. Open http://localhost:5173
```

The app works without API keys using mock responses. Add keys to enable real AI features.

## Google Cloud TTS Setup (Step-by-Step)

This is the most involved free tier to configure:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Cloud Text-to-Speech API**: search "Text-to-Speech" in the API Library
4. Go to **IAM & Admin > Service Accounts**
5. Click **Create Service Account** > name it (e.g., "tts-service") > Create
6. Skip granting roles (not needed for TTS)
7. Click the service account > **Keys** tab > **Add Key** > **Create new key** > JSON > Download
8. For **local development**: save the file as `google-credentials.json` in the `backend/` folder and set in `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   ```
9. For **Render deployment**: copy the entire JSON file contents into the env var:
   ```
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
   ```

Free tier: 1,000,000 characters/month for Standard voices (more than enough for prototype).

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com/)
2. Go to **SQL Editor** and run:

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  scenario_id text default 'telecom_sim_change_instore',
  total_score integer,
  max_score integer default 100,
  transcript jsonb,
  scores jsonb,
  duration_seconds integer,
  status text default 'in_progress',
  performance_label text
);
```

3. Go to **Settings > API** and copy:
   - Project URL → `SUPABASE_URL`
   - anon public key → `SUPABASE_ANON_KEY`

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For AI | Claude API key |
| `DEEPGRAM_API_KEY` | For STT | Deepgram API key |
| `GOOGLE_APPLICATION_CREDENTIALS` | For TTS (local) | Path to Google credentials JSON file |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | For TTS (Render) | Google credentials as JSON string |
| `SUPABASE_URL` | For persistence | Supabase project URL |
| `SUPABASE_ANON_KEY` | For persistence | Supabase anon key |
| `FRONTEND_URL` | For CORS | Frontend URL (default: http://localhost:5173) |
| `PORT` | No | Server port (default: 3001) |

### Frontend (Netlify env vars)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g., https://your-app.onrender.com) |

## Deployment

### Frontend → Netlify

1. Push repo to GitHub
2. Connect to Netlify > set **Base directory** to `roleplay-app/frontend`
3. Build command: `npm run build`, Publish directory: `dist`
4. Add env var: `VITE_API_URL` = your Render backend URL

### Backend → Render

1. Create **Web Service** on [render.com](https://render.com/)
2. Connect repo > set **Root Directory** to `roleplay-app/backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all backend env vars
6. Set `FRONTEND_URL` to your Netlify URL

## How It Works

1. **Home Screen** — Start the assessment scenario
2. **Roleplay Screen** — Hold mic to speak, AI customer responds with voice
3. **Score Screen** — AI scores your performance on 10 criteria (100 points)

The AI customer (Rahul Mehta) responds naturally based on what you say. He only reveals information when asked and reacts to your communication style. The scoring evaluates greeting, empathy, process explanation, identity verification, and more.

## Known Limitations

- **Render free tier**: server sleeps after 15 min inactivity (first request takes ~30s to wake)
- **No authentication**: single-user prototype
- **Deepgram free tier**: 12,000 min/year (~2,400 sessions)
- **Google TTS free tier**: 1M chars/month (unlimited for prototype usage)
- **Browser mic permission required**: Chrome or Edge recommended
- **No real SIM processing**: fully simulated interaction
- **Voice quality**: en-IN-Standard-B is good but not neural. Upgrade to en-IN-Wavenet-C for better quality (still free tier)
