# Animation plans

Written by the `improve-animations` skill.
Round 1 audit commit: `d1037de`. Round 2 audit commit: `ebc0b94`.

| # | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | Scope every `transition-all` | MEDIUM | DONE |
| 002 | Press feedback on pressables | MEDIUM | DONE |
| 003 | Nav hover + menu choreography | MEDIUM | DONE |
| 004 | Route-mount fade for lazy pages | LOW | DONE |
| 005 | Restore invalid `duration-350/400/800` classes | HIGH | DONE |
| 006 | Reduced motion: keep comprehension feedback | HIGH | DONE |
| 007 | Purge dead motion code + wordmark CSS conflict | MEDIUM | DONE |
| 008 | Gate hover motion for touch | MEDIUM | DONE |
| 009 | Testimonials: lock removal, pause, press feedback | MEDIUM | DONE |
| 010 | Micro feel fixes: hamburger scale, service-row wipe | MEDIUM | DONE |

**Round 2 executed 2026-07-22** (Opus 4.8 executor, reviewed & runtime-verified by orchestrator; visual eyeball items listed below).

**Execution order (round 2)**: 005 → 007 → 006 → 009 → 010 → 008.
Dependencies: 007 before 006 (both edit the reduced-motion block; 007 deletes rules 006 must not resurrect). 010 before 008 is not required, but 008 must NOT touch `.service-row` (010 owns it, including its hover gate). 005 and 008 both edit `tailwind.config.js` (different keys; order-independent).

**Deliberately NOT findings** (settled decisions — do not "fix"):
- Marquee uses `linear` — correct for constant motion.
- Long (700–1200ms) section-reveal durations — deliberate cinematic marketing pacing.
- The 3D hero scene (HeroScene/HeroCanvas) — separately tuned playground; keep out of DOM motion passes.
- PageOverlay load fade — fine as is.
- AnimatedButton dual-label hover roll — deliberate playful signature, keep.

**Backlog / needs a human eyeball (not planned)**:
- Progress affordance on the auto-advancing testimonial dot (e.g. `scaleX` fill over 6s) — additive, taste call.
- Tokenize the 700/800/1200ms reveal scale into one shared duration token — cohesion, medium refactor.
- Easing curves are declared in 3 places (index.css vars, tailwind config `transitionTimingFunction`, inline in config `animation` strings) — consolidate to one source.
- Hero side role labels enter as pure fades; a small `translate-x` would give them origin — LOW, judge on screenshot.
