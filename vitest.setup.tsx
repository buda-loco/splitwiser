import '@testing-library/jest-dom/vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy({}, {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          return ({ children, className, onClick, ...rest }: any) => {
            const Component = prop as keyof JSX.IntrinsicElements;
            return <Component className={className} onClick={onClick} {...rest}>{children}</Component>;
          };
        }
      },
    }),
  };
});

// Mock IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null as any,
  onerror: null as any,
};

Object.defineProperty(globalThis, 'indexedDB', {
  value: {
    open: vi.fn(() => mockIDBRequest),
    deleteDatabase: vi.fn(() => mockIDBRequest),
  },
});

// Mock crypto.randomUUID
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => '00000000-0000-0000-0000-000000000000',
    },
  });
}
