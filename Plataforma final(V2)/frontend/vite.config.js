import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Detecta automáticamente el nombre del repositorio en GitHub Actions (ej. /TID-2026-01/)
// o utiliza por defecto la ruta base del repositorio
const repoBase = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/TID-2026-01/';

export default defineConfig({
  base: repoBase,
  plugins: [react()],
  server: {
    host: true, // Expone automáticamente el servidor en tu red local (0.0.0.0)
    port: 5173,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
