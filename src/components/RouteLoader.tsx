"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./RouteLoader.module.css";

export default function RouteLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 450); // duration matches animation

    return () => clearTimeout(timeout);
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