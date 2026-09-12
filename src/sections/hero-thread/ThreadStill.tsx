import { ArrowRight } from "lucide-react";
import poster from "./assets/poster-1600.webp";
import phonePoster from "./assets/poster-800.webp";

export function ThreadStill() {
  return (
    <div className="thread-still">
      <picture>
        <source media="(max-width: 600px)" srcSet={phonePoster} />
        <img
          src={poster}
          width="1600"
          height="900"
          alt=""
          fetchPriority="high"
        />
      </picture>
      <div className="thread-still-copy">
        <p className="thread-eyebrow">Snaxx Tech · Independent by design</p>
        <h1>Small ideas, made tangible.</h1>
        <p>
          We turn small ideas into apps, games, and satisfying little moments.
        </p>
        <div className="thread-actions">
          <a className="thread-primary" href="#portfolio">
            See the apps <ArrowRight size={16} />
          </a>
          <a className="thread-secondary" href="#contact">
            Get in touch
          </a>
        </div>
        <div className="thread-pills">
          {[
            "FJALË · live on the web",
            "Arrows · coming to Google Play",
            "Geo Guesser World 3D! · coming to Google Play",
          ].map((text) => (
            <span className="thread-pill" key={text}>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
