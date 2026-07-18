import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    base: '/',
    plugins: [mode === 'development' && inspectAttr(), react()].filter(Boolean),
    server: {
      port: 3000,
    },
    // Avast falsely flags the pre-bundled drei chunk (JS:Prontexi-Z) and
    // quarantines it on every regeneration; serving drei unbundled avoids it.
    optimizeDeps: {
      include: [
        'three',
        '@react-three/fiber',
        'stats.js',
        'use-sync-external-store/shim/with-selector.js',
      ],
      exclude: ['@react-three/drei'],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }));
