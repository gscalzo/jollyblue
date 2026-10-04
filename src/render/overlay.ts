/**
 * The DOM layers over the scene: the prompt line, the black veil of the
 * dive, and the canvas a game is mounted on (ADR-0005).
 */
export interface Overlay {
  gameCanvas: HTMLCanvasElement;
  setPrompt(text: string | null): void;
  setVeil(opacity: number): void;
  showGame(on: boolean): void;
  setMuted(muted: boolean): void;
}

function layer(host: HTMLElement, tag: string, className: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  host.append(el);
  return el;
}

export function createOverlay(host: HTMLElement): Overlay {
  const veil = layer(host, 'div', 'veil');
  const gameCanvas = layer(host, 'canvas', 'game') as HTMLCanvasElement;
  const prompt = layer(host, 'div', 'prompt');
  const soundOff = layer(host, 'div', 'sound-off');
  soundOff.textContent = 'SOUND OFF — M';
  let shownPrompt: string | null = null;
  return {
    gameCanvas,
    setPrompt(text) {
      if (text === shownPrompt) return;
      shownPrompt = text;
      prompt.textContent = text ?? '';
      prompt.classList.toggle('on', text !== null);
    },
    setVeil(opacity) {
      veil.style.opacity = String(opacity);
    },
    showGame(on) {
      gameCanvas.classList.toggle('on', on);
    },
    setMuted(muted) {
      soundOff.classList.toggle('on', muted);
    },
  };
}
