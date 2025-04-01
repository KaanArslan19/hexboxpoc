// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock document.cookie
if (typeof document !== 'undefined') {
  Object.defineProperty(document, 'cookie', {
    get: jest.fn(),
    set: jest.fn(),
  });
}

// Set up environment variables for testing
process.env.JWT_SECRET_KEY = 'test-secret-key';

// Mock window.crypto for JWT operations
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
      },
    },
  });
} 