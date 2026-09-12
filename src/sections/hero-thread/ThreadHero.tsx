import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ThreadStill } from "./ThreadStill";
import "./thread.css";

const ThreadCanvas = lazy(() => import("./ThreadCanvas"));
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const eased = (p: number, a: number, b: number) =>
  1 - (1 - clamp((p - a) / (b - a))) ** 4;

class CanvasBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ThreadHero({
  letters = "FJALË",
}: {
  letters?: string;
}) {
  const wrapper = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);
  const [eligible, setEligible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const fail = useCallback(() => {
    const element = wrapper.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.top < 0 && rect.bottom > 0)
        window.scrollTo({
          top: window.scrollY + rect.top,
          behavior: "instant",
        });
    }
    setFailed(true);
  }, []);
  const loaded = useCallback(() => setReady(true), []);
  const active = eligible && !failed;
  const showScene = active && ready;

  useEffect(() => {
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "font";
    preload.type = "font/woff2";
    preload.href = "/fonts/bricolage-grotesque-latin.woff2";
    preload.crossOrigin = "anonymous";
    document.head.append(preload);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let first = 0,
      second = 0;
    const check = () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      if (motion.matches) {
        setEligible(false);
        return;
      }
      // Two frames guarantee a painted, useful poster before requesting WebGL code.
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => {
          const probe = document.createElement("canvas");
          try {
            setEligible(Boolean(probe.getContext("webgl2")));
          } catch {
            setEligible(false);
          }
          // Let the detached feature probe be collected; never send a synthetic loss event.
        });
      });
    };
    check();
    motion.addEventListener("change", check);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      motion.removeEventListener("change", check);
      preload.remove();
    };
  }, []);

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const next = active
        ? clamp(-rect.top / Math.max(1, element.offsetHeight - innerHeight))
        : 0;
      setP(next);
      // Only the optional Portfolio stroke consumes this property.
      document.documentElement.style.setProperty(
        "--thread-landing",
        String(eased(next, 0.9, 1)),
      );
      document.documentElement.dataset.threadNav =
        next > 0.2 || rect.bottom <= 0 ? "scrolled" : "clear";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(element);
    document.documentElement.dataset.threadHero = "true";
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete document.documentElement.dataset.threadHero;
      delete document.documentElement.dataset.threadNav;
      document.documentElement.style.removeProperty("--thread-landing");
    };
  }, [active]);

  const wordOpacity = 1 - eased(p, 0.2, 0.25);
  const worldOpacity =
    eased(p, 0.2, 0.25) *
    (1 - 0.72 * eased(p, 0.45, 0.49)) *
    (1 - eased(p, 0.63, 0.68));
  const arrowOpacity = eased(p, 0.65, 0.7);
  const act = p < 0.23 ? "word" : p < 0.65 ? "world" : "arrow";

  return (
    <section
      id="hero"
      ref={wrapper}
      className={`thread-hero ${active ? "thread-pinned" : ""}`}
      data-progress={p.toFixed(4)}
      data-ready={showScene}
    >
      <div
        className="thread-stage"
        style={{
          transform: showScene
            ? `translateY(${-eased(p, 0.9, 1) * 100}vh)`
            : undefined,
        }}
      >
        {!showScene && <ThreadStill />}
        {active && (
          <div
            className="thread-canvas"
            aria-hidden="true"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <CanvasBoundary onFailure={fail}>
              <Suspense fallback={null}>
                <ThreadCanvas
                  p={p}
                  inView={inView}
                  letters={letters}
                  onReady={loaded}
                  onFailure={fail}
                />
              </Suspense>
            </CanvasBoundary>
          </div>
        )}
        {showScene && (
          <>
            <div
              className="thread-copy thread-word"
              style={{ opacity: wordOpacity }}
              aria-hidden={act !== "word"}
              inert={act !== "word"}
            >
              <p className="thread-eyebrow">
                The Snaxx story · Act I · The Word
              </p>
              <div className="thread-word-body">
                <h1>In the beginning was the Word.</h1>
                <p>
                  FJALË is the daily Albanian word game. Five letters, five
                  minutes, live on the web today.
                </p>
              </div>
              <p className="thread-studio">
                Snaxx Tech turns small ideas into apps, games, and satisfying
                little moments.
              </p>
            </div>
            <div
              className="thread-copy thread-world"
              style={{ opacity: worldOpacity }}
              aria-hidden={act !== "world"}
              inert={act !== "world"}
            >
              <p className="thread-eyebrow">Act II · The World</p>
              <h2>Then, a world to get lost in.</h2>
              <p>
                Geo Guesser World 3D! drops you anywhere on Earth. Guess where.
              </p>
            </div>
            <div
              className="thread-copy thread-descent"
              style={{
                opacity: eased(p, 0.45, 0.49) * (1 - eased(p, 0.63, 0.67)),
              }}
              aria-hidden={p < 0.45 || p >= 0.65}
            >
              <p className="thread-eyebrow">Act II · dropping in</p>
              <h2>Somewhere on Earth. The ground comes up fast.</h2>
              <p>
                The camera follows the thread down to the pin. Through the
                surface, the next act is already in flight.
              </p>
            </div>
            <div
              className="thread-copy thread-arrow"
              style={{ opacity: arrowOpacity }}
              aria-hidden={act !== "arrow"}
              inert={act !== "arrow"}
            >
              <p className="thread-eyebrow">Act III · The Arrow</p>
              <h2>And something to aim for.</h2>
              <p>
                Arrows is a precision arcade game. Every launch gets attention
                until it feels just right.
              </p>
            </div>
            <div
              className={`thread-actions thread-act-actions thread-actions-${act}`}
              inert={p > 0.92}
              aria-hidden={p > 0.92}
            >
              <a className="thread-primary" href="#portfolio">
                See the apps <ArrowRight size={16} />
              </a>
              {act === "word" ? (
                <a
                  className="thread-link"
                  href="https://xn--fjal-opa.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Play FJALË online <ArrowUpRight size={16} />
                </a>
              ) : (
                <span className="thread-pill">Coming to Google Play</span>
              )}
            </div>
            <div
              className="thread-whiteout"
              aria-hidden="true"
              style={{
                opacity: eased(p, 0.65, 0.667) * (1 - eased(p, 0.667, 0.69)),
              }}
            />
            <div className="thread-rail" aria-hidden="true">
              <div
                className="thread-rail-fill"
                style={{ transform: `scaleY(${p})` }}
              />
              {[0, 0.2, 0.45, 0.65, 0.9].map((t) => (
                <i
                  key={t}
                  style={{
                    top: `${t * 100}%`,
                    background: p >= t ? "#D73626" : "#DCD6CF",
                  }}
                />
              ))}
              <b style={{ top: `${p * 100}%` }} />
            </div>
          </>
        )}
      </div>

    </section>
  );
}
