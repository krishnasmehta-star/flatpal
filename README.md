# FlatPal v2

Flatmate compatibility matcher for Bangalore. Built on Emergent, exported and finished by hand.
Frontend: React + Vite + Tailwind + GSAP. Backend: FastAPI + MongoDB. Deploys as one Vercel project (static frontend + Python serverless API).

## Run locally

```bash
cd backend && pip install -r requirements.txt && uvicorn server:app --port 8000   # JSON file store when MONGO_URL is unset
cd frontend && npm install && npm run dev                                          # proxies /api to :8000
```

## QA

```bash
python3 qa/e2e.py http://127.0.0.1:5173   # 48 end-to-end checks: desktop, 390px mobile, hidden tab, reduced motion
node qa/parity.mjs                         # JS engine vs Python engine parity (used by the backend-free preview build)
```

## Deploy on Vercel (free)

1. Push this repo to GitHub.
2. Vercel: Add New Project, import the repo, keep Root Directory as the repo root (vercel.json handles the build). Deploy.
3. Storage: Vercel dashboard > Storage > MongoDB Atlas (marketplace) > create a free cluster and connect it to the project. It sets `MONGODB_URI` automatically. Redeploy once.
4. Open `/sample` on the deployment URL. Five cards means the API and database are wired.

Without a database the API still runs but stores profiles in the function's temporary disk, so real profiles vanish between cold starts. Connect MongoDB before sharing the link.

## Backend-free preview build

`VITE_STATIC=1 npm run build` in `frontend/` produces `dist-static/`: the same UI with the matching engine running in the browser and profiles stored per device. Used for the claude.ai preview page.
