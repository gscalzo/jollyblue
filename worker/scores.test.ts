import { describe, expect, it } from 'vitest';
import { TABLE_SIZE } from '../shared/scores';
import type { ScoreTable } from '../shared/types';
import { createTestApp } from './test/harness';
import type { TestApp } from './test/harness';

const GAME = '/api/scores/moon-patrol-3d';

async function table(t: TestApp): Promise<ScoreTable> {
  return (await t.call('GET', GAME)).json<ScoreTable>();
}

describe('scores', () => {
  it('starts empty', async () => {
    const res = await createTestApp().call('GET', GAME);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ game: 'moon-patrol-3d', scores: [] });
  });

  it('records a run on the clock and answers 201 with it', async () => {
    const t = createTestApp(1000);
    const res = await t.call('POST', GAME, { initials: 'GIO', score: 4200 });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ initials: 'GIO', score: 4200, playedAt: 1000 });
    expect(await (await t.call('GET', GAME)).json()).toEqual({
      game: 'moon-patrol-3d',
      scores: [{ initials: 'GIO', score: 4200, playedAt: 1000 }],
    });
  });

  it('ranks highest first, older first on a tie, and keeps each game apart', async () => {
    const t = createTestApp(1);
    await t.call('POST', GAME, { initials: 'LOW', score: 10 });
    t.clock.now = 3;
    await t.call('POST', GAME, { initials: 'NEW', score: 50 });
    t.clock.now = 2;
    await t.call('POST', GAME, { initials: 'OLD', score: 50 });
    await t.call('POST', '/api/scores/other', { initials: 'OTH', score: 99 });
    const { scores } = await table(t);
    expect(scores.map((s) => s.initials)).toEqual(['OLD', 'NEW', 'LOW']);
  });

  it('keeps insertion order for runs in the same millisecond', async () => {
    const t = createTestApp(5);
    await t.call('POST', GAME, { initials: 'ONE', score: 7 });
    await t.call('POST', GAME, { initials: 'TWO', score: 7 });
    const { scores } = await table(t);
    expect(scores.map((s) => s.initials)).toEqual(['ONE', 'TWO']);
  });

  it(`shows the top ${TABLE_SIZE}`, async () => {
    const t = createTestApp();
    for (let i = 0; i <= TABLE_SIZE; i++) {
      await t.call('POST', GAME, { initials: 'AAA', score: i });
    }
    const { scores } = await table(t);
    expect(scores).toHaveLength(TABLE_SIZE);
  });

  it('rejects a bad body without writing', async () => {
    const t = createTestApp();
    const res = await t.call('POST', GAME, { initials: 'gio', score: 1 });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'initials must be three capital letters' });
    const notJson = await t.app.request(GAME, { method: 'POST', body: '{' }, t.env);
    expect(await notJson.json()).toEqual({ error: 'body must be an object' });
    expect(t.raw.prepare('SELECT COUNT(*) AS n FROM scores').get()).toEqual({ n: 0 });
  });

  it('rejects an unknown game id on both routes', async () => {
    const t = createTestApp();
    const runs = [{ initials: 'GIO', score: 1 }, undefined];
    for (const [method, body] of [
      ['POST', runs[0]],
      ['GET', runs[1]],
    ] as const) {
      const res = await t.call(method, '/api/scores/Moon', body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'unknown game id' });
    }
    expect(t.raw.prepare('SELECT COUNT(*) AS n FROM scores').get()).toEqual({ n: 0 });
  });
});
