INSERT INTO users (username, email, is_verified, school, program, major, interest_tags)
VALUES ('Demo User', 'demo@upenn.edu', TRUE, 'UPenn', 'CIS', 'CS', ARRAY['study', 'social'])
ON CONFLICT (email) DO NOTHING;

WITH demo AS (
  SELECT uid FROM users WHERE email = 'demo@upenn.edu'
)
INSERT INTO events
  (creator_uid, title, description, mood, intention, place_name, lat, lng, max_participants, start_time, end_time, status)
VALUES
  ((SELECT uid FROM demo), 'Study at Van Pelt', 'Bring your laptop and join a study session.', 'focused', 'study', 'Van Pelt Library', 39.9522, -75.1932, 4, NOW(), NOW() + INTERVAL '2 hours', 'active'),
  ((SELECT uid FROM demo), 'Casual Run', 'Easy 3-mile loop around campus.', 'energized', 'exercise', 'Locust Walk', 39.9509, -75.1930, 6, NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '90 minutes', 'active')
ON CONFLICT DO NOTHING;
