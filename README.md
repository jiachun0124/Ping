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
- Dev login is enabled via `/auth/dev`. Use a `.edu` email to be verified.
- Google OAuth routes are stubbed for now.

## Deploy (Public Web App)
Recommended setup:
- Frontend: Vercel
- Backend API: Render (or Railway)
- Database: MongoDB Atlas

### 1) Deploy backend API
Create a Web Service from `backend/` with:
- Build command: `npm install`
- Start command: `npm start`

Set environment variables:
- `NODE_ENV=production`
- `PORT=4000`
- `MONGODB_URI=<your mongodb atlas uri>`
- `SESSION_SECRET=<strong random secret>`
- `ALLOWED_ORIGINS=https://<your-frontend-domain>`
- `FRONTEND_URL=https://<your-frontend-domain>`
- `HOST=0.0.0.0`
- (optional) Google OAuth values if used:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL=https://<your-backend-domain>/auth/google/callback`

After deploy, verify `https://<your-backend-domain>/health` returns `{ "ok": true }`.

### 2) Deploy frontend
Deploy `frontend/` with:
- Build command: `npm run build`
- Output directory: `dist`

Set environment variables:
- `VITE_API_BASE_URL=https://<your-backend-domain>`
- `VITE_GOOGLE_MAPS_API_KEY=<your maps browser key>`

### 3) Make it public
- Use your frontend production URL as the public site.
- Ensure backend `ALLOWED_ORIGINS` includes that exact URL.
- If you update domains, redeploy both sides with matching env vars.
