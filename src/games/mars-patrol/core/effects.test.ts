import { describe, expect, it } from 'vitest';
import { effects } from './effects';

describe('effects', () => {
  it('bursts where each event happened', () => {
    expect(
      effects(
        [
          { kind: 'crash' },
          { kind: 'land' },
          { kind: 'hit', x: 3 },
          { kind: 'break', x: 4, size: 'big' },
          { kind: 'ufo-down', x: 5, y: 7 },
          { kind: 'bomb-down', x: 6, y: 2 },
          { kind: 'impact', x: 8 },
          { kind: 'jump' },
        ],
        10,
      ),
    ).toEqual([
      { burst: 'crash', x: 10, y: 0.5 },
      { burst: 'dust', x: 10, y: 0.1 },
      { burst: 'spark', x: 3, y: 0.6 },
      { burst: 'rubble', x: 4, y: 0.5 },
      { burst: 'crash', x: 5, y: 7 },
      { burst: 'spark', x: 6, y: 2 },
      { burst: 'rubble', x: 8, y: 0.2 },
    ]);
  });
});
