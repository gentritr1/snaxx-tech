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
import { actAt, clamp, copyPose, type CopyAct, type MotionDriver } from "./motion";
import "./thread.css";

const ThreadCanvas = lazy(() => import("./ThreadCanvas"));

class CanvasBoundary extends Component<
  { children: ReactNode; onFailure: (reason?: string) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("Hero scene failed:", error);
    this.props.onFailure(error.message);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ActActions({ act, visibleIn }: { act: string; visibleIn: string }) {
  return (
    <div
      className={`thread-actions thread-act-actions thread-actions-${act}`}
      data-action-act={visibleIn}
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
  );
}

// This DOM is mounted once after loading. Scrubbing never renders React.
function CopyLayer() {
  return (
    <>
      <div className="thread-copy thread-word" data-visible-in="word">
        <p className="thread-eyebrow">The Snaxx story · Act I · The Word</p>
        <div className="thread-word-body">
          <h1>In the beginning was the Word.</h1>
          <p>
            FJALË is the daily Albanian word game. Five letters, five minutes,
            live on the web today.
          </p>
        </div>
        <ActActions act="word" visibleIn="word" />
      </div>
      <div className="thread-copy thread-world" data-visible-in="world">
        <p className="thread-eyebrow">Act II · The World</p>
        <h2>Then, a world to get lost in.</h2>
        <p>Geo Guesser World 3D! drops you anywhere on Earth. Guess where.</p>
        <ActActions act="world" visibleIn="world" />
      </div>
      <div className="thread-copy thread-descent" data-visible-in="descent">
        <p className="thread-eyebrow">Act II · dropping in</p>
        <h2>Somewhere on Earth. The ground comes up fast.</h2>
        <p>
          The camera follows the thread down to the pin. Through the surface,
          the next act is already in flight.
        </p>
      </div>
      <div className="thread-copy thread-arrow" data-visible-in="arrow">
        <p className="thread-eyebrow">Act III · The Arrow</p>
        <h2>And something to aim for.</h2>
        <p>
          Arrows is a precision arcade game. Every launch gets attention until
          it feels just right.
        </p>
        <ActActions act="arrow" visibleIn="arrow" />
      </div>

      <div className="thread-whiteout" aria-hidden="true" />
      <div className="thread-rail" aria-hidden="true">
        <div className="thread-rail-fill" />
        {[0, 0.2, 0.45, 0.65, 0.9].map((t) => (
          <i key={t} data-seat={t} style={{ top: `${t * 100}%` }} />
        ))}
        <b />
      </div>
    </>
  );
}

export default function ThreadHero() {
  const wrapper = useRef<HTMLElement>(null);
  const targetP = useRef(0);
  const driver = useRef<MotionDriver>({
    targetP,
    p: 0,
    inView: true,
    wake: () => {},
    present: () => {},
    reviewStill: false,
  });
  const [phone, setPhone] = useState(() => matchMedia("(max-width: 767px)").matches);
  const [eligible, setEligible] = useState(false);
  useEffect(() => {
    const query = matchMedia("(max-width: 767px)");
    const resize = () => setPhone(query.matches);
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = eligible && !failed;
  const showScene = active && ready;
  const loaded = useCallback(() => setReady(true), []);
  const fail = useCallback((reason?: string) => {
    const element = wrapper.current;
    if (element) {
      element.dataset.failureReason = reason || "unknown";
      const rect = element.getBoundingClientRect();
      if (rect.top < 0 && rect.bottom > 0)
        window.scrollTo({ top: scrollY + rect.top, behavior: "instant" });
    }
    setFailed(true);
  }, []);

  useEffect(() => {
    const preload = document.createElement("link");
    Object.assign(preload, {
      rel: "preload",
      as: "font",
      type: "font/woff2",
      href: "/fonts/bricolage-grotesque-latin.woff2",
      crossOrigin: "anonymous",
    });
    document.head.append(preload);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let first = 0,
      second = 0;
    const check = () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      if (wrapper.current) wrapper.current.dataset.reducedMotion = String(motion.matches);
      if (motion.matches) {
        setEligible(false);
        return;
      }
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => {
          try {
            setEligible(
              Boolean(document.createElement("canvas").getContext("webgl2")),
            );
          } catch {
            setEligible(false);
          }
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
    const state = driver.current;
    let top = 0,
      distance = 1;
    let previousAct = "";
    let previousP = -1;
    const copy = [
      ...element.querySelectorAll<HTMLElement>("[data-visible-in]"),
    ];
    const dots = [...element.querySelectorAll<HTMLElement>("[data-seat]")];
    state.present = (p, dt) => {
      state.reviewStill = element.dataset.reviewStill === "true";
      const unpinned = showScene && targetP.current >= 1;
      element.dataset.unpinned = String(unpinned);
      element.dataset.copyEnded = String(p >= 0.91 || unpinned);
      if (element.dataset.trace === "record")
        performance.mark("hero:frame", {
          detail: { p, targetP: targetP.current, dt },
        });
      if (p === previousP) return;
      previousP = p;
      element.style.setProperty("--p", String(p));
      element.dataset.progress = p.toFixed(5);
      document.documentElement.style.setProperty(
        "--thread-landing",
        String(clamp((p - 0.9) * 10)),
      );
      document.documentElement.dataset.threadNav =
        p > 0.2 ? "scrolled" : "clear";
      for (const block of copy) {
        const pose = copyPose(block.dataset.visibleIn as CopyAct, p);
        const visible = !unpinned && pose.opacity > 0;
        block.style.opacity = visible ? String(pose.opacity) : "0";
        block.style.transform = `translateY(${pose.y}px)`;
        block.inert = !visible;
        block.setAttribute("aria-hidden", String(!visible));
      }
      const act = unpinned ? "landed" : actAt(p);
      if (act !== previousAct) {
        previousAct = act;
        element.dataset.act = act;

      }
      for (const dot of dots)
        dot.dataset.passed = String(p >= Number(dot.dataset.seat));
    };
    const readScroll = () => {
      targetP.current = active ? clamp((scrollY - top) / distance) : 0;
      element.dataset.targetProgress = targetP.current.toFixed(5);
      // Clean up even when a single scroll jumps beyond the entire hero,
      // where the render loop correctly stays asleep.
      const unpinned = showScene && targetP.current >= 1;
      element.dataset.unpinned = String(unpinned);
      const stage = element.querySelector<HTMLElement>(".thread-stage");
      if (stage) stage.inert = unpinned;
      // Use the same measured scroll range as p. IntersectionObserver can
      // report this oversized sticky section outside the viewport mid-journey.
      state.inView = scrollY + innerHeight > top && scrollY < top + distance + innerHeight;
      element.dataset.inView = String(state.inView);
      if (element.dataset.trace === "record")
        performance.mark("hero:scroll", {
          detail: { targetP: targetP.current },
        });
      state.wake();
    };
    const measure = () => {
      top = scrollY + element.getBoundingClientRect().top;
      distance = Math.max(1, element.offsetHeight - innerHeight);
      readScroll();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    document.documentElement.dataset.threadHero = "true";
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    state.present(state.p, 0);
    state.wake();
    return () => {
      resize.disconnect();
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", measure);
      state.present = () => {};
      delete document.documentElement.dataset.threadHero;
      delete document.documentElement.dataset.threadNav;
      document.documentElement.style.removeProperty("--thread-landing");
    };
  }, [active, showScene]);

  return (
    <section
      id="hero"
      ref={wrapper}
      className={`thread-hero ${active ? "thread-pinned" : ""}`}
      data-ready={showScene}
      data-eligible={eligible}
      data-failed={failed}
    >
      <div className="thread-stage">
        {!showScene && <ThreadStill />}
        {active && (
          <div
            className="thread-canvas"
            aria-hidden="true"
            style={{
              opacity: ready ? "clamp(0, (1 - var(--p)) * 25, 1)" : 0,
            }}
          >
            <CanvasBoundary onFailure={fail}>
              <Suspense fallback={null}>
                <ThreadCanvas
                  key={phone ? "390" : "1440"}
                  driver={driver}
                  phone={phone}
                  onReady={loaded}
                  onFailure={fail}
                />
              </Suspense>
            </CanvasBoundary>
          </div>
        )}
        {showScene && <CopyLayer />}
      </div>
    </section>
  );
}
