import '@testing-library/jest-dom/vitest';

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Desmonta a árvore React após cada teste para evitar vazamento entre casos.
afterEach(() => {
  cleanup();
});
