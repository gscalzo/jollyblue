/** The hall's side of the scores API (ADR-0006). */
import type { NewScore, ScoreEntry, ScoreTable } from '../../shared/types';

/** The one owner's initials on every run the hall records (ADR-0013). */
export const OWNER_INITIALS = 'GIO';

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

async function ok<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`scores API answered ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchScores(fetchFn: Fetch, game: string): Promise<ScoreTable> {
  return ok<ScoreTable>(await fetchFn(`/api/scores/${game}`));
}

export async function postScore(fetchFn: Fetch, game: string, score: number): Promise<ScoreEntry> {
  const body: NewScore = { initials: OWNER_INITIALS, score };
  const res = await fetchFn(`/api/scores/${game}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return ok<ScoreEntry>(res);
}
