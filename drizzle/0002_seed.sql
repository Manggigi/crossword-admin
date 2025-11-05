-- Development seed data (replace in production)
INSERT INTO admin_users (email, password_hash, role, created_at, updated_at)
VALUES ('admin@example.com', 'admin123', 'admin', strftime('%s','now')*1000, strftime('%s','now')*1000);

INSERT INTO groups (name, slug) VALUES ('Daily', 'daily');

INSERT INTO collections (group_id, name, slug) VALUES (1, 'Daily Puzzles', 'daily-puzzles');

INSERT INTO puzzles (collection_id, title, date, status, icon_url, created_at, updated_at) VALUES
  (1, 'Daily Puzzle 1', '2025-01-01', 'published', NULL, strftime('%s','now')*1000, strftime('%s','now')*1000),
  (1, 'Daily Puzzle 2', '2025-01-02', 'published', NULL, strftime('%s','now')*1000, strftime('%s','now')*1000),
  (1, 'Daily Puzzle 3', '2025-01-03', 'draft', NULL, strftime('%s','now')*1000, strftime('%s','now')*1000);



