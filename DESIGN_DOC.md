# Ping Design Document

## 1. Purpose and Scope

Ping is a location-driven social discovery app for lightweight, nearby events (sports, art, social, study). Users can create events, browse/map nearby events, mark interest, join, like, and comment.

This document captures the current implementation design in this repository and serves as a baseline for iteration.

## 2. Product Goals

- Make nearby campus/community activities discoverable in real time.
- Minimize event creation friction with map-first interaction.
- Support basic social feedback loops (going, interested, like, comments).
- Keep architecture simple enough for hackathon-to-MVP velocity.

## 3. Non-Goals (Current Version)

- No advanced recommendation/personalization engine.
- No hard participant cap enforcement workflow.
- No moderation/admin tooling.
- No long-term analytics/warehouse pipeline.
- No production-grade background job system (uses in-process delayed task for comment emails).

## 4. High-Level Architecture

### 4.1 System Components

- **Frontend**: React + Vite SPA (`frontend/`)
  - Routing via `react-router-dom`
  - Session-aware API client (`credentials: include`)
  - Map UI with Google Maps (`@react-google-maps/api`)
- **Backend**: Node.js + Express API (`backend/`)
  - REST endpoints for auth, profile, events, discovery, map points
  - Session-based auth using `express-session` + Passport
- **Database**: MongoDB with Mongoose models
  - Geo queries through `2dsphere` index on event location
- **Optional Email**: SMTP via Nodemailer for delayed comment notifications

### 4.2 Runtime Topology

1. Browser loads frontend (Vercel/local Vite dev server).
2. Frontend calls backend API with cookies.
3. Backend validates session, executes business logic, queries MongoDB.
4. Backend returns JSON responses consumed by SPA.

## 5. Frontend Design

### 5.1 Route Structure

- Public:
  - `/map`
  - `/events/:eventId`
  - `/login`
- Protected:
  - `/profile`
  - `/events/new`
  - `/saved`

`ProtectedRoute` gates protected pages using auth state from `AuthContext`.

### 5.2 State and API Access

- `AuthContext` bootstraps session by calling `/auth/me` on app load.
- Centralized request helper in `frontend/src/api/client.js`:
  - Uses `VITE_API_BASE_URL`
  - Sends `Content-Type: application/json`
  - Always includes credentials
  - Normalizes backend errors into JS exceptions

### 5.3 UX Patterns

- Map/discovery views are read-friendly without mandatory login.
- Write actions (create event, profile updates, social actions needing verification) require authenticated, verified user context.
- Navigation is centralized in top nav for quick movement across map/profile/saved flows.

## 6. Backend Design

### 6.1 Server and Middleware

`backend/src/server.js` configures:

- CORS with explicit allowed origins
- JSON parsing (`2mb` limit)
- Request logging (`morgan`)
- Cookie session (`ping.sid`)
  - `SameSite=None` + `Secure=true` in production for cross-domain frontend/backend
- Passport initialization
- Route mounting:
  - `/auth`
  - `/users`
  - `/events`
  - `/discover`
  - `/map`

### 6.2 Authentication and Authorization Model

- **Session Source of Truth**: `req.session.userId`
- **Dev Auth**: `/auth/dev` creates/loads user for local/dev workflows
- **Google OAuth**: Supported when credentials are configured
- **Authorization Middleware**:
  - `requireAuth`: enforces authenticated session, hydrates `req.user`
  - `requireVerified`: enforces `is_verified === true` for privileged actions

### 6.3 API Surface (Current)

- **Auth**
  - `POST /auth/dev`
  - `GET /auth/me`
  - `POST /auth/logout`
  - `GET /auth/google`
  - `GET /auth/google/callback`
- **Users**
  - `GET /users/me`
  - `PUT /users/me`
  - `GET /users/me/interested`
  - `POST /users/me/interested/:event_id`
  - `DELETE /users/me/interested/:event_id`
- **Events**
  - CRUD and status transitions:
    - `POST /events`
    - `GET /events/:event_id`
    - `PUT /events/:event_id`
    - `DELETE /events/:event_id`
    - `POST /events/:event_id/deactivate`
    - `POST /events/:event_id/activate`
  - Social interactions:
    - `POST|DELETE /events/:event_id/going`
    - `POST|DELETE /events/:event_id/interested`
    - `POST|DELETE /events/:event_id/like`
  - Comments:
    - `GET /events/:event_id/comments`
    - `POST /events/:event_id/comments`
    - `DELETE /events/:event_id/comments/:comment_id`
    - `GET /events/:event_id/comments/:comment_id/replies`
- **Discovery and Map**
  - `GET /discover` (geo-near ranked list)
  - `GET /map/points` (viewport points with clustering fallback)

## 7. Data Model

### 7.1 Core Collections

- `users`
  - identity: `username`, `email`
  - profile: `age`, `school`, `program`, `major`
  - status/preferences: `is_verified`, `interest_tags`, `receive_comment_emails`
- `events`
  - owner: `creator_uid`
  - metadata: `title`, `description`, `category`, `place_name`
  - coordinates: `lat`, `lng`, `location` (GeoJSON Point)
  - lifecycle: `start_time`, `end_time`, `status`
  - optional: `max_participants`
- relationship/activity collections:
  - `event_joins` (going)
  - `event_saves` (interested)
  - `event_likes` (likes)
  - `event_comments` (comments/replies)

### 7.2 Indexing Strategy

- `events.location` has `2dsphere` index for geo queries.
- `events` has compound index on `status` + `start_time`.
- `users.email` is unique and indexed.

## 8. Key Workflows

### 8.1 Authentication Bootstrap

1. Frontend loads and calls `/auth/me`.
2. If cookie session exists, user state is hydrated.
3. Protected routes become available.

### 8.2 Event Discovery

1. Client sends location and radius to `/discover`.
2. Backend performs `$geoNear` over active, non-expired events.
3. Response includes event summary and dynamic counts.

### 8.3 Map Rendering at Scale

1. Client sends viewport bounds to `/map/points`.
2. Backend returns direct points when under threshold.
3. If overloaded, backend groups into grid-based clusters (`grid_size = 0.01`) and returns cluster points.

### 8.4 Comment Notification

1. User posts comment on event.
2. Backend schedules delayed email attempt after 3 minutes.
3. Before sending, backend verifies comment still exists and creator email preference is enabled.

## 9. Deployment Design

### 9.1 Recommended Split

- Frontend: Vercel (`frontend/`)
- Backend: Render or Railway (`backend/`)
- DB: MongoDB Atlas

### 9.2 Important Environment Variables

- Shared/runtime:
  - `MONGODB_URI`
  - `SESSION_SECRET`
  - `ALLOWED_ORIGINS`
  - `FRONTEND_URL`
  - `NODE_ENV`
- Frontend:
  - `VITE_API_BASE_URL`
  - `VITE_GOOGLE_MAPS_API_KEY`
- Optional auth/email:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`

## 10. Security and Reliability Notes

- Session cookie settings are production-aware for cross-site deployments.
- Protected mutation endpoints rely on `requireAuth` + selective `requireVerified`.
- Input validation exists for core required fields and enum categories, but is not yet centralized.
- Error handling uses a generic 500 fallback; no structured error codes or tracing yet.

## 11. Known Tradeoffs and Gaps

- Event expiration model uses long default duration (effectively non-expiring for now).
- No background worker queue; delayed email is process-memory timer based.
- Limited pagination (many list endpoints return bounded lists without cursor flow).
- No automated tests included in current repo.
- No rate limiting or abuse controls on public endpoints.

## 12. Evolution Roadmap (Suggested)

- Add request schema validation layer (e.g., Zod/Joi) for consistent API contracts.
- Move delayed notification logic to durable job queue (BullMQ/SQS/Cloud Tasks).
- Add Redis-backed session store for horizontal scale.
- Add endpoint-level rate limiting and audit logging.
- Introduce integration tests for auth, event CRUD, and geo endpoints.
- Build moderation/reporting workflows and admin tooling.

## 13. Success Metrics (Suggested)

- Activation: % users who create or interact with an event in first session.
- Discovery quality: map click-through rate and event detail open rate.
- Social engagement: going/interested/comment actions per active event.
- Retention: returning users over 7/30 days.
- Reliability: API error rate, p95 latency, auth failure rate.

