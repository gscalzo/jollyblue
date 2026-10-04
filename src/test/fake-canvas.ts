/**
 * Just enough DOM for the render layer to build its scene in node (ADR-0008):
 * `document.createElement('canvas')` hands out a canvas whose 2D context
 * swallows every call, and images (the generated art) that never finish
 * loading, so the code-drawn stand-ins stay. WebGL itself is checked by
 * screenshots (ADR-0012).
 */
import { vi } from 'vitest';

function fakeContext(): CanvasRenderingContext2D {
  return new Proxy({} as CanvasRenderingContext2D, {
    get: (_target, key) => (key === 'measureText' ? () => ({ width: 1 }) : () => undefined),
    set: () => true,
  });
}

export function installFakeCanvas(): void {
  vi.stubGlobal('document', {
    createElement: () => ({ width: 0, height: 0, getContext: fakeContext }),
    createElementNS: () => ({
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}
