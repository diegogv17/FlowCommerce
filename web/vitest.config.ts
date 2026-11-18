import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Pruebas unitarias del frontend (lógica pura: formatos, etiquetas, planes).
// Se corren con: pnpm --filter @flowcommerce/web test
export default defineConfig({
  resolve: {
    alias: {
      '@flowcommerce/types': fileURLToPath(new URL('../packages/types/src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
  },
});
