import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { inspectAttr } from "kimi-plugin-inspect-react";

function threadPosterPlugin(): Plugin {
  const enabled = process.env.VITE_HERO_VARIANT === "thread";
  const css = readFileSync("src/sections/hero-thread/first-paint.css", "utf8");
  const boot = readFileSync("src/sections/hero-thread/first-paint.js", "utf8");
  const name = (kind: string, text: string) =>
    `assets/thread-first-paint.${createHash("sha256").update(text).digest("hex").slice(0, 8)}.${kind}`;
  const cssName = name("css", css),
    bootName = name("js", boot);
  return {
    name: "thread-poster-first-paint",
    buildStart() {
      if (!enabled) return;
      this.emitFile({ type: "asset", fileName: cssName, source: css });
      this.emitFile({ type: "asset", fileName: bootName, source: boot });
    },
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        if (!enabled || !context.bundle) return html;
        const poster = Object.keys(context.bundle).find((name) =>
          name.includes("poster-800-"),
        );
        if (!poster)
          throw new Error(
            "Thread poster is missing from the production bundle",
          );
        return html
          .replace(/<link[^>]+rel="preload"[^>]+as="font"[^>]*>/g, "")
          .replace(
            /<link rel="stylesheet"/g,
            '<link media="print" data-thread-deferred-style rel="stylesheet"',
          )
          .replace(
            "<head>",
            `<head><link rel="preload" as="image" href="/${poster}" fetchpriority="high"><link rel="stylesheet" href="/${cssName}">`,
          )
          .replace(
            '<div id="root"></div>',
            `<div id="root"></div><template id="thread-first-paint"><section class="thread-hero"><div class="thread-stage"><div class="thread-still"><picture><img src="/${poster}" width="800" height="450" alt="" fetchpriority="high"></picture><div class="thread-still-copy"><p class="thread-eyebrow">Snaxx Tech · Independent by design</p><h1>Small ideas, made tangible.</h1><p>We turn small ideas into apps, games, and satisfying little moments.</p></div></div></div></section></template><script src="/${bootName}"></script>`,
          );
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  build: { manifest: true },
  preview: { port: 4300 },
  plugins: [
    threadPosterPlugin(),
    mode === "development" && inspectAttr({
      // R3F treats hyphenated inspector attributes as Three property paths.
      predicate: (node) => node.type !== "JSXElement" ||
        node.openingElement.name.type !== "JSXIdentifier" ||
        !new Set(["Canvas", "ThreadCanvas", "Scene", "JourneyContactShadows", "primitive", "color", "hemisphereLight"]).has(node.openingElement.name.name),
    }),
    react(),
  ].filter(Boolean),
  server: {
    port: 3000,
  },
  // Avast falsely flags the pre-bundled drei chunk (JS:Prontexi-Z) and
  // quarantines it on every regeneration; serving drei unbundled avoids it.
  optimizeDeps: {
    include: [
      "three",
      "@react-three/fiber",
      "stats.js",
      "use-sync-external-store/shim/with-selector.js",
    ],
    exclude: ["@react-three/drei"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
