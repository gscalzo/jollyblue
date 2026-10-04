/** High scores per game (ADR-0006): read a cabinet's table, record a run. */
import type { Hono } from 'hono';
import { isGameId, parseNewScore, TABLE_SIZE } from '../shared/scores';
import type { ScoreEntry, ScoreTable } from '../shared/types';
import type { AppContext, Clock } from './app';

interface ScoreRow {
  initials: string;
  score: number;
  played_at: number;
}

function toEntry(row: ScoreRow): ScoreEntry {
  return { initials: row.initials, score: row.score, playedAt: row.played_at };
}

export function registerScores(app: Hono<AppContext>, now: Clock): void {
  app.use('/scores/:game', async (c, next) => {
    if (!isGameId(c.req.param('game'))) return c.json({ error: 'unknown game id' }, 400);
    await next();
  });

  // Highest first; an equal score keeps the older run above the newer.
  app.get('/scores/:game', async (c) => {
    const game = c.req.param('game');
    const { results } = await c.env.DB.prepare(
      'SELECT initials, score, played_at FROM scores WHERE game = ? ' +
        'ORDER BY score DESC, played_at ASC, id ASC LIMIT ?',
    )
      .bind(game, TABLE_SIZE)
      .all<ScoreRow>();
    const table: ScoreTable = { game, scores: results.map(toEntry) };
    return c.json(table);
  });

  app.post('/scores/:game', async (c) => {
    // Stryker disable next-line ArrowFunction: an undefined body is refused exactly like null
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = parseNewScore(body);
    if (typeof parsed === 'string') return c.json({ error: parsed }, 400);
    const entry: ScoreEntry = { ...parsed, playedAt: now() };
    await c.env.DB.prepare(
      'INSERT INTO scores (game, initials, score, played_at) VALUES (?, ?, ?, ?)',
    )
      .bind(c.req.param('game'), entry.initials, entry.score, entry.playedAt)
      .run();
    return c.json(entry, 201);
  });
}
