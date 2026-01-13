import Link from "next/link";
import styles from "./Footer.module.css";
import { footerNavigation, siteMetadata } from "@/config/site";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.credit}>
          © {new Date().getFullYear()} {siteMetadata.siteName}. Made with{" "}
          <span className={styles.heart} aria-hidden="true">
            ♥
          </span>
          by me.
        </p>
        <nav aria-label="Footer" role="navigation">
          <ul className={styles.navigation}>
            {footerNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    <script
    dangerouslySetInnerHTML={{
      __html: `
        (() => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));

          function randBetween(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
          }

          class TypedLogo {
            constructor(root, {
              text = "andrew.dev",
              startDelay = 500,
              baseSpeed = 110,      // “not too fast”
              variance = 45,        // natural jitter
              blinkMs = 520,        // cursor blink speed
              endCursorAfterSuffix = true
            } = {}) {
              if (!root) throw new Error("TypedLogo: root element is required.");

              this.root = root;
              this.text = text;
              this.startDelay = startDelay;
              this.baseSpeed = baseSpeed;
              this.variance = variance;
              this.blinkMs = blinkMs;
              this.endCursorAfterSuffix = endCursorAfterSuffix;

              this.prefix = root.querySelector(".cv-logo__prefix");
              this.typed  = root.querySelector(".cv-logo__typed");
              this.suffix = root.querySelector(".cv-logo__suffix");
              this.cursor = root.querySelector(".cv-logo__cursor");

              if (!this.prefix || !this.typed || !this.suffix || !this.cursor) {
                throw new Error("TypedLogo: missing required child elements.");
              }

              this._blinkTimer = null;
              this._isTyping = false;
              this._reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

              this.reset();
            }

            reset() {
              this.stopBlink();
              this._isTyping = false;

              // Start state renders as "</>" because middle is empty.
              this.typed.textContent = "";
              this.cursor.style.opacity = "1";

              // Ensure cursor is right after typed area at start
              if (this.cursor.previousSibling !== this.suffix) {
                // Place cursor after suffix only if you already finished earlier; otherwise put it after suffix later.
              }
              // During typing we want cursor between typed and suffix:
              this.suffix.after(this.cursor);   // put cursor after suffix for a moment
              this.typed.after(this.suffix);    // ensure order: prefix, typed, suffix
              this.suffix.before(this.cursor);  // move cursor between typed and suffix (right before suffix)
            }

            startBlink() {
              if (this._blinkTimer) return;

              this._blinkTimer = setInterval(() => {
                // toggle opacity between 1 and 0
                this.cursor.style.opacity = (this.cursor.style.opacity === "0" ? "1" : "0");
              }, this.blinkMs);
            }

            stopBlink() {
              if (this._blinkTimer) {
                clearInterval(this._blinkTimer);
                this._blinkTimer = null;
              }
              this.cursor.style.opacity = "1";
            }

            async play() {
              if (this._isTyping) return;
              this._isTyping = true;

              // Accessibility: if user prefers reduced motion, just show final state.
              if (this._reducedMotion) {
                this.typed.textContent = this.text;
                // Move cursor to end (after suffix) and keep it visible (no blinking).
                this.suffix.after(this.cursor);
                this.stopBlink();
                this._isTyping = false;
                return;
              }

              // Start as "</>" (middle empty), cursor between typed and suffix.
              this.reset();
              this.startBlink();

              await sleep(this.startDelay);

              // Type each character into the middle.
              for (let i = 0; i < this.text.length; i++) {
                const ch = this.text[i];
                this.typed.textContent += ch;

                // Slow-ish, human feel.
                const delay = this.baseSpeed + randBetween(-this.variance, this.variance);

                // Optional: slightly longer pauses on punctuation for “not too fast”.
                const extraPause = (ch === "." ? 140 : 0);

                await sleep(Math.max(35, delay + extraPause));
              }

              // Done typing: cursor moves to the very end and stays there blinking.
              if (this.endCursorAfterSuffix) {
                this.suffix.after(this.cursor);
                this.cursor.style.opacity = "1"; // ensure visible right after move
              }

              this._isTyping = false;
            }
          }

          document.addEventListener("DOMContentLoaded", () => {
            const el = document.getElementById("cvLogo");
            if (!el) return;

            const logo = new TypedLogo(el, {
              text: "andrew.dev",
              startDelay: 450,
              baseSpeed: 120,
              variance: 35,
              blinkMs: 520,
              endCursorAfterSuffix: true
            });

            logo.play();
          });
        })();
        `,
      }}
    />
    </footer>
  );
}
