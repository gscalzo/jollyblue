import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestApp } from './test/harness';

describe('app', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers ping with the caller', async () => {
    const res = await createTestApp().call('GET', '/api/ping');
    expect(await res.json()).toEqual({ ok: true, caller: 'local' });
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await createTestApp().call('GET', '/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not found' });
  });

  it('logs a thrown error and hides it behind a JSON 500', async () => {
    const t = createTestApp();
    const boom = new Error('boom');
    vi.spyOn(t.env.DB, 'prepare').mockImplementation(() => {
      throw boom;
    });
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await t.call('GET', '/api/scores/moon-patrol-3d');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'internal error' });
    expect(log).toHaveBeenCalledWith(boom);
  });
});
