"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import TypedLogo from "@/components/TypedLogo";
import styles from "./Header.module.css";
import { primaryNavigation } from "@/config/site";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

type Indicator = { x: number; w: number; visible: boolean };

export function Header() {
  const pathname = usePathname();

  const listRef = useRef<HTMLUListElement | null>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  const [indicator, setIndicator] = useState<Indicator>({
    x: 0,
    w: 0,
    visible: false,
  });

  const activeHref = useMemo(() => {
    const found = primaryNavigation.find((i) => isActivePath(pathname, i.href));
    return found?.href ?? null;
  }, [pathname]);

  useLayoutEffect(() => {
    const listEl = listRef.current;
    if (!listEl || !activeHref) return;

    const update = () => {
      const linkEl = linkRefs.current.get(activeHref);
      if (!linkEl) return;

      const listRect = listEl.getBoundingClientRect();
      const linkRect = linkEl.getBoundingClientRect();

      // position relative to the <ul>
      const MAX_WIDTH = 55;

      const linkX = linkRect.left - listRect.left;
      const linkW = linkRect.width;

      const indicatorW = Math.min(linkW, MAX_WIDTH);

      // center the capped indicator under the link
      const indicatorX = linkX + (linkW - indicatorW) / 2;

      setIndicator({
        x: indicatorX,
        w: indicatorW,
        visible: true,
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(listEl);
    // Also observe the active link (font loading / label wrap / etc.)
    const activeEl = linkRefs.current.get(activeHref);
    if (activeEl) ro.observe(activeEl);

    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [activeHref]);

  return (
    <header className={`${styles.header} glow-border`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <TypedLogo />
        </Link>

        <nav aria-label="Primary">
          <ul
            ref={listRef}
            className={styles.navList}
            style={
              {
                "--indicator-x": `${indicator.x}px`,
                "--indicator-w": `${indicator.w}px`,
              } as React.CSSProperties
            }
          >
            {/* shared, sliding indicator */}
            <span
              className={styles.navIndicator}
              aria-hidden="true"
              data-visible={indicator.visible ? "true" : "false"}
            />

            {primaryNavigation.map((item) => {
              const active = activeHref === item.href;

              return (
                <li key={item.href} className={styles.navItem}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    ref={(el) => {
                      if (!el) {
                        linkRefs.current.delete(item.href);
                        return;
                      }
                      linkRefs.current.set(item.href, el);
                    }}
                    className={styles.navLink}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* <Link href="/contact" className={styles.cta}>
          Let&apos;s talk →
        </Link> */}

        <Link href="/contact" className={styles.btn}>
          <div className={styles.outer} style={{ height: "var(--header-height)" }}>
            <span className={styles.inner}>
              <span className={styles.particles} aria-hidden="true" />
              <span className={styles.text}>Let&apos;s talk
                <span
                  className={styles.btnIcon}
                  aria-hidden="true"
                  style={{ transform: `rotate(${isOpen ? 180 : 0}deg)` }}
                  >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M7 10l5 5 5-5" />
                  </svg>
                </span>
              </span>
              <span className={styles.halo} aria-hidden="true" />
            </span>
          </div>
        </Link>

      </div>
    </header>
  );
}