import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing/fake-browser';

afterEach(() => {
  cleanup();
  fakeBrowser.reset();
});
