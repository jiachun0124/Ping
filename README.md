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
