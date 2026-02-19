CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INT,
  school TEXT,
  program TEXT,
  major TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  interest_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  mood TEXT,
  intention TEXT,
  place_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  max_participants INT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS event_joins (
  event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, uid)
);

CREATE TABLE IF NOT EXISTS event_likes (
  event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  liked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, uid)
);

CREATE TABLE IF NOT EXISTS event_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
  uid UUID REFERENCES users(uid) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES event_comments(comment_id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_status_time ON events(status, start_time);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(lat, lng);
CREATE INDEX IF NOT EXISTS idx_event_comments_event ON event_comments(event_id);
