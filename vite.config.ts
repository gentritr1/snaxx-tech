import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { seoPages } from './scripts/seo-pages'

// The dev-only inspector stamps a hyphenated `code-path` attribute on JSX
// elements. React Three Fiber reads hyphenated props as nested property
// paths on the underlying Three object, so only plain HTML tags get stamped.
const HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'b', 'blockquote', 'body', 'br', 'button',
  'canvas', 'cite', 'code', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'em', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
  'hr', 'i', 'iframe', 'img', 'input', 'kbd', 'label', 'legend', 'li', 'main', 'mark',
  'nav', 'ol', 'optgroup', 'option', 'p', 'picture', 'pre', 'q', 'section', 'select',
  'small', 'source', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td',
  'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'video',
])

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    base: '/',
    plugins: [
      mode === 'development' &&
        inspectAttr({
          predicate: (node) =>
            node.type === 'JSXElement' &&
            node.openingElement.name.type === 'JSXIdentifier' &&
            HTML_TAGS.has(node.openingElement.name.name),
        }),
      react(),
      seoPages(),
    ].filter(Boolean),
    server: {
      port: 3000,
    },
    build: {
      // The 3D stack is one lazy chunk (see Home.tsx). Do not use manualChunks
      // to split it: Rollup then hoists shared modules such as React into the
      // vendor chunk, and the entry bundle ends up preloading three.js on
      // every route, legal pages included.
      chunkSizeWarningLimit: 1500,
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
