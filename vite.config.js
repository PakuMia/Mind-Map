import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works whether it's served from a
  // domain root or a nested path (e.g. a CDN mirror of a GitHub branch).
  base: './',
});
