import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // .worktrees/ fica dentro do repo (ver .gitignore) — sem isso, rodar
    // `npm run test` na raiz também executa os testes de qualquer worktree
    // ativo, com um node_modules próprio, duplicando o React e quebrando
    // a suíte.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**', '.worktrees/**'],
  },
})
