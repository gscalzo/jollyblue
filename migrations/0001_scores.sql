-- High scores, the only thing JollyBlue remembers (ADR-0006). One owner:
-- no users table, the initials are what the cabinet shows.
CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  initials TEXT NOT NULL,
  score INTEGER NOT NULL,
  played_at INTEGER NOT NULL
);

CREATE INDEX scores_by_game ON scores (game, score DESC, played_at);
