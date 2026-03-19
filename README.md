# Ping

Full-stack demo based on the Ping design doc.

## Requirements

- Node.js 18+
- MongoDB (Atlas or local)
- Google Maps API key (Maps JavaScript API enabled)
- Google OAuth credentials (OAuth 2.0 Client ID)

## Setup

### Backend

1. Copy env:
  - `cp backend/.env.example backend/.env`
2. Update `MONGODB_URI` in `backend/.env`.
3. Seed demo data:
  - `cd backend`
  - `npm install`
  - `npm run db:seed`
4. Start the API:
  - `npm run dev`
5. Add Google OAuth credentials in `backend/.env`:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL` (default already set)

### Frontend

1. Copy env:
  - `cp frontend/.env.example frontend/.env`
2. Set `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env`.
3. Start the app:
  - `cd frontend`
  - `npm install`
  - `npm run dev`

Open `http://localhost:5173`.

## Notes

- The frontend login page uses Google OAuth via `GET /auth/google`.
- Dev login is still available at `POST /auth/dev` when `DEV_AUTH_ENABLED=true` (useful for local API testing).
- `REDIS_URL` is optional for local development (in-memory sessions are used when omitted), but required for AWS Lambda deployments.

## Deploy (Public Web App)

Recommended setup:

- Frontend: Vercel
- Backend API: AWS Lambda + API Gateway
- Database: MongoDB Atlas

### 1) Deploy backend API (AWS Lambda)

If deploying the backend to Lambda, use `backend/src/lambda.handler` as the
function entrypoint and keep Redis sessions enabled (`REDIS_URL` required).

Quick deploy with Serverless Framework:

1. Install backend dependencies:
  - `cd backend`
  - `npm install`
2. Export required environment variables in your shell (or set in CI):
  - `NODE_ENV=production`
  - `MONGODB_URI=<your mongodb atlas uri>`
  - `SESSION_SECRET=<strong random secret>`
  - `SESSION_TTL_SECONDS=604800`
  - `REDIS_URL=<your redis connection url>`
  - `REDIS_SESSION_PREFIX=ping:sess:`
  - `ALLOWED_ORIGINS=https://<your-frontend-domain>`
  - `FRONTEND_URL=https://<your-frontend-domain>`
  - (optional) Google OAuth values if used:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `GOOGLE_CALLBACK_URL=https://<your-backend-domain>/auth/google/callback`
3. Deploy:
  - `npm run deploy:lambda -- --stage prod --region us-east-1`
4. Use the printed API Gateway URL as your backend URL.
5. Verify `https://<your-backend-domain>/health` returns `{ "ok": true }`.
6. Update frontend `VITE_API_BASE_URL` to that URL and redeploy frontend.

### 2) Deploy frontend

Deploy `frontend/` with:

- Build command: `npm run build`
- Output directory: `dist`

Set environment variables:

- `VITE_API_BASE_URL=https://<your-backend-domain>`
- `VITE_GOOGLE_MAPS_API_KEY=<your maps browser key>`
- `VITE_GOOGLE_MAP_ID=<your map id>` (optional, defaults to `DEMO_MAP_ID`)

### 3) Make it public

- Use your frontend production URL as the public site.
- Ensure backend `ALLOWED_ORIGINS` includes that exact URL.
- If you update domains, redeploy both sides with matching env vars.

## Acknowledgements

The initial idea was developed during a hackathon collaboration with @jl205-maker, Suosi He, Zihan Zhu. This version has been fully redesigned and implemented independently.