import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Postavite '/' za root domen ili '/app/' za subpath
  build: {
    outDir: 'dist', // Eksplicitno definišite output direktorijum
    rollupOptions: {
      output: {
        manualChunks: {
          // Optimizacija chunkova za bolju performansu
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          vendors: ['lodash', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1500, // Povećaj limit za upozorenja
  },
  resolve: {
    alias: {
      // Dodajte alias-e ako koristite custom putanje
      '@': '/src',
      '@components': '/src/components',
    },
  },
  server: {
    port: 3000, // Postavite željeni port za development
    open: true, // Automatski otvara browser
  },
  optimizeDeps: {
    include: ['lucide-react'], // Eksplicitno uključite potrebne zavisnosti
  },
});