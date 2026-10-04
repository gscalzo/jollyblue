import { describe, expect, it, vi } from 'vitest';
import { fetchScores, OWNER_INITIALS, postScore } from './api';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('fetchScores', () => {
  it("reads a game's table", async () => {
    const table = { game: 'g', scores: [] };
    const fetchFn = vi.fn(() => json(table));
    expect(await fetchScores(fetchFn, 'g')).toEqual(table);
    expect(fetchFn).toHaveBeenCalledWith('/api/scores/g');
  });
  it('throws on an error status', async () => {
    await expect(fetchScores(() => json({ error: 'x' }, 401), 'g')).rejects.toThrow(
      'scores API answered 401',
    );
  });
});

describe('postScore', () => {
  it("records a run under the owner's initials", async () => {
    const entry = { initials: OWNER_INITIALS, score: 50, playedAt: 1 };
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) => json(entry, 201));
    expect(await postScore(fetchFn, 'g', 50)).toEqual(entry);
    expect(fetchFn).toHaveBeenCalledWith('/api/scores/g', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initials: 'GIO', score: 50 }),
    });
  });
  it('throws on an error status', async () => {
    await expect(postScore(() => json({}, 400), 'g', 1)).rejects.toThrow('scores API answered 400');
  });
});
