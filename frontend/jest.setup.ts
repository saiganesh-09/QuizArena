import '@testing-library/jest-dom';

// Polyfill matchMedia for jsdom (used by useTheme hook)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// Polyfill URLSearchParams (already in jsdom but ensure it's available)
if (typeof URLSearchParams === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { URLSearchParams } = require('url');
  (globalThis as unknown as { URLSearchParams: typeof URLSearchParams }).URLSearchParams = URLSearchParams;
}

// Polyfill scrollTo for jsdom
window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;

// Polyfill ResizeObserver for jsdom
class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = ResizeObserver;
