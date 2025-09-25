import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  base: './',
  build: {
    target: 'esnext',
    outDir: 'dist'
  },
  server: {
    host: true,
    allowedHosts: [
      'scutiform-pushed-malorie.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
      'localhost',
      '127.0.0.1'
    ]
  }
});
