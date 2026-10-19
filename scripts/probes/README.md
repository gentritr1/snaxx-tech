# Performance probes

Headless Chrome on the real GPU (`--use-angle=metal`). Playwright is not a
dependency of this repo: point `PLAYWRIGHT` at any installed copy.

| Script | Measures |
| --- | --- |
| `motionprobe.cjs <url> <outdir>` | Near-black pixels on every frame during the intro and a fast scroll; saves frames that hold a black block. Catches NaN/Inf pixels that Bloom spreads into squares. |
| `perfprobe.cjs <url>` | Frame pacing during scroll: frames vs expected at 60 fps, p50/p95/p99, canvas size (to spot DPR drops). |
| `vitals.cjs <desktop\|mobile> a=<url> b=<url>` | A/B, interleaved, 3 reps: FCP, LCP, CLS, long-task ms, React commits, requests, KB. `mobile` = 4x CPU, 1.6 Mbps, 150 ms RTT. |
| `leakprobe.cjs <url> [visits]` | WebGL2 contexts, canvases and JS heap after each client-side Home -> /legal -> Home trip (forced GC, CDP queryObjects). Exits 1 if contexts or canvases grow. |
| `netprobe.cjs <url>` | Requests and bytes per first and repeat visit with each response's Cache-Control and x-vercel-cache. |

Run against `npm run build && npx vite preview`, never the dev server.
