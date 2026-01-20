"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./RouteLoader.module.css";

export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const delayRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);

  useEffect(() => {
    // Delay showing loader (prevents flash on fast routes)
    delayRef.current = window.setTimeout(() => {
      setLoading(true);
    }, 120);

    // Hide loader after animation duration
    hideRef.current = window.setTimeout(() => {
      setLoading(false);
    }, 450);

    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [pathname]);

  return (
    <div
      className={`${styles.loader} ${loading ? styles.active : ""}`}
      aria-hidden={!loading}
    >
      <span className={styles.spinner} />
    </div>
  );
}