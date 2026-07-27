"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import TypedLogo from "@/components/TypedLogo";
import { primaryNavigation } from "@/config/site";
import styles from "./Header.module.css";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

type Indicator = {
  x: number;
  w: number;
  visible: boolean;
};

export function Header() {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement | null>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [indicator, setIndicator] = useState<Indicator>({
    x: 0,
    w: 0,
    visible: false,
  });

  const activeHref = useMemo(() => {
    const found = primaryNavigation.find((item) =>
      isActivePath(pathname, item.href),
    );

    return found?.href ?? null;
  }, [pathname]);

  useLayoutEffect(() => {
    const listElement = listRef.current;

    if (!listElement || !activeHref) {
      setIndicator((current) => ({ ...current, visible: false }));
      return;
    }

    const updateIndicator = () => {
      const activeLink = linkRefs.current.get(activeHref);
      if (!activeLink) return;

      const listRect = listElement.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      const maxWidth = 55;
      const linkX = linkRect.left - listRect.left;
      const indicatorWidth = Math.min(linkRect.width, maxWidth);

      setIndicator({
        x: linkX + (linkRect.width - indicatorWidth) / 2,
        w: indicatorWidth,
        visible: true,
      });
    };

    updateIndicator();

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(listElement);

    const activeLink = linkRefs.current.get(activeHref);
    if (activeLink) resizeObserver.observe(activeLink);

    window.addEventListener("resize", updateIndicator);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeHref]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`${styles.header} glow-border`}
      data-menu-open={isMenuOpen ? "true" : "false"}
    >
      <div className={styles.headerInner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="Andrew Bielous — home"
          onClick={() => setIsMenuOpen(false)}
        >
          <TypedLogo />
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
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
                    ref={(element) => {
                      if (!element) {
                        linkRefs.current.delete(item.href);
                        return;
                      }

                      linkRefs.current.set(item.href, element);
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

        <MeetingLink className={styles.desktopMeetingLink} />

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className={styles.menuToggleIcon} aria-hidden="true">
            <span />
            <span />
          </span>
          <span className={styles.menuToggleLabel}>
            {isMenuOpen ? "Close" : "Menu"}
          </span>
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={styles.mobilePanel}
        aria-hidden={!isMenuOpen}
      >
        <div className={styles.mobilePanelInner}>
          <nav aria-label="Mobile navigation">
            <ul className={styles.mobileNavList}>
              {primaryNavigation.map((item, index) => {
                const active = activeHref === item.href;

                return (
                  <li
                    key={item.href}
                    className={styles.mobileNavItem}
                    style={
                      { "--item-index": index } as React.CSSProperties
                    }
                  >
                    <Link
                      href={item.href}
                      className={styles.mobileNavLink}
                      aria-current={active ? "page" : undefined}
                      tabIndex={isMenuOpen ? 0 : -1}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className={styles.mobileNavNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{item.label}</span>
                      <svg
                        className={styles.mobileNavArrow}
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <MeetingLink
            className={styles.mobileMeetingLink}
            tabIndex={isMenuOpen ? 0 : -1}
            onClick={() => setIsMenuOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}

type MeetingLinkProps = {
  className?: string;
  tabIndex?: number;
  onClick?: () => void;
};

function MeetingLink({ className, tabIndex, onClick }: MeetingLinkProps) {
  return (
    <Link
      href="/?meet=hour-meeting"
      className={`${styles.meetingLink} ${className ?? ""}`}
      tabIndex={tabIndex}
      onClick={onClick}
    >
      <span className={styles.meetingOuter}>
        <span className={styles.meetingInner}>
          <span className={styles.particles} aria-hidden="true" />
          <span className={styles.meetingText}>
            Schedule a meeting
            <span className={styles.meetingIcon}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M7 10l5 5 5-5" />
              </svg>
            </span>
          </span>
          <span className={styles.halo} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}