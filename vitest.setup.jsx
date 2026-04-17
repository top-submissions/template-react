import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

expect.extend(matchers);

/**
 * Global after-each teardown.
 *
 * Runs automatically after every test to prevent state leaking between cases:
 * - `cleanup()` unmounts any React trees rendered with `@testing-library/react`
 * - `vi.clearAllMocks()` resets call counts and return values on all mocks
 * - `vi.unstubAllGlobals()` restores any globals stubbed with `vi.stubGlobal()`
 */
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

/**
 * Lucide React icon mock.
 *
 * Replaces every named icon export with a lightweight `<div>` stub that carries
 * a `data-testid="icon-<IconName>"` attribute. This keeps snapshots readable
 * and avoids rendering full SVG markup in tests.
 *
 * @example
 * expect(screen.getByTestId('icon-ChevronDown')).toBeInTheDocument();
 */
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return Object.keys(actual).reduce((acc, curr) => {
    acc[curr] = () => <div data-testid={`icon-${curr}`} />;
    return acc;
  }, {});
});

/**
 * Browser API mocks for the jsdom environment.
 *
 * jsdom does not fully implement browser APIs. This block shims the ones most
 * commonly used in the app so tests can interact with them without errors.
 *
 * Mocked APIs:
 * - `window.localStorage` — in-memory key/value store; resets between tests
 *   via `vi.clearAllMocks()` in the afterEach above
 * - `window.location` — stubs `reload`, `assign`, and `replace` so navigation
 *   calls in components can be asserted with `expect(...).toHaveBeenCalled()`
 */
if (typeof window !== 'undefined') {
  let store = {};

  Object.defineProperty(window, 'localStorage', {
    value: {
      /** @param {string} key */
      getItem: (key) => store[key] || null,
      /**
       * @param {string} key
       * @param {string} value
       */
      setItem: (key, value) => {
        store[key] = String(value);
      },
      /** @param {string} key */
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    },
    writable: true,
  });

  Object.defineProperty(window, 'location', {
    value: { reload: vi.fn(), assign: vi.fn(), replace: vi.fn() },
    writable: true,
  });
}

/**
 * React Router mock.
 *
 * Spreads the real `react-router` module and overrides only the hooks and
 * components that trigger navigation side-effects during tests:
 *
 * - `useNavigate` — returns a fresh `vi.fn()` so push/replace calls can be
 *   asserted without an actual router context
 * - `useRouteError` — returns `undefined` by default; override per-test with
 *   `vi.mocked(useRouteError).mockReturnValue(new Error('...'))`
 * - `Navigate` — renders nothing, preventing redirects from crashing tests
 *   that render components outside a full router tree
 *
 * @example
 * const navigate = vi.fn();
 * vi.mocked(useNavigate).mockReturnValue(navigate);
 * expect(navigate).toHaveBeenCalledWith('/dashboard');
 */
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useRouteError: vi.fn(),
    Navigate: vi.fn(() => null),
  };
});
