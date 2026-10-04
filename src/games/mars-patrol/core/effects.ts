/** Which bursts of particles a frame's events call for, and where (ADR-0018). */
import type { GameEvent } from './flow';

export type Burst = 'crash' | 'dust' | 'spark' | 'rubble';

export interface Effect {
  burst: Burst;
  x: number;
  y: number;
}

function effect(event: GameEvent, buggyX: number): Effect | null {
  switch (event.kind) {
    case 'crash':
      return { burst: 'crash', x: buggyX, y: 0.5 };
    case 'land':
      return { burst: 'dust', x: buggyX, y: 0.1 };
    case 'hit':
      return { burst: 'spark', x: event.x, y: 0.6 };
    case 'break':
      return { burst: 'rubble', x: event.x, y: 0.5 };
    case 'ufo-down':
      return { burst: 'crash', x: event.x, y: event.y };
    case 'bomb-down':
      return { burst: 'spark', x: event.x, y: event.y };
    case 'impact':
      return { burst: 'rubble', x: event.x, y: 0.2 };
    default:
      return null;
  }
}

export function effects(events: readonly GameEvent[], buggyX: number): Effect[] {
  return events.map((e) => effect(e, buggyX)).filter((e) => e !== null);
}
