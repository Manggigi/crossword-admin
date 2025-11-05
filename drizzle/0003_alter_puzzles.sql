-- Add columns for admin editing and publishing
ALTER TABLE puzzles ADD COLUMN description TEXT;
ALTER TABLE puzzles ADD COLUMN difficulty TEXT;
ALTER TABLE puzzles ADD COLUMN published_at INTEGER;


