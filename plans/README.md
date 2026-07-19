# Animation plans

Written by the `improve-animations` skill (root: `.agents/skills/improve-animations`).
Audit commit: `d1037de`.

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | Scope every `transition-all` | MEDIUM | DONE |
| 002 | Press feedback on pressables | MEDIUM | DONE |
| 003 | Nav hover + menu choreography | MEDIUM | DONE |
| 004 | Route-mount fade for lazy pages | LOW | DONE |

**Execution order**: 001 → 003 → 002 → 004 (001 first because 003 scopes two of
the same lines; 002/004 are independent).

**Deliberately NOT findings** (settled decisions — do not "fix"):
- Marquee uses `linear` — correct for constant motion.
- Long (700–1200ms) section-reveal durations — deliberate cinematic marketing pacing.
- The 3D hero scene (HeroScene/HeroCanvas) — separately tuned playground; keep out of DOM motion passes.
- PageOverlay load fade and the 3-iteration scroll-cue bob — fine as is.
