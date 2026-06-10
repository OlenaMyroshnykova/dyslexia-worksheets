import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base is set for GitHub Pages project sites: https://<user>.github.io/dyslexia-worksheets/
// Change or remove if you deploy elsewhere.
export default defineConfig({
  plugins: [react()],
  base: '/dyslexia-worksheets/',
});
