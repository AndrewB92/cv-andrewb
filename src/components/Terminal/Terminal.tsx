"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import styles from "./Terminal.module.css";

type TerminalProps = {
  path?: string;
  children: ReactNode;
  className?: string;
};

export function Terminal({
  path = "~/macos/single-div/terminal",
  children,
  className,
}: TerminalProps) {
  return (
    <section
      className={[styles.terminal, className].filter(Boolean).join(" ")}
      data-content={path}
    >
      {children}
    </section>
  );
}

/**
 * Minimal TS/JS syntax highlighter (regex-based).
 * Not perfect, but fast and dependency-free.
 */
type CodeToken =
  | { type: "plain"; value: string }
  | { type: "keyword" | "string" | "comment" | "number" | "type" | "punct" | "fn"; value: string };

function highlightTs(code: string): CodeToken[] {
  // Order matters: comment/string first so we don't highlight inside them.
  const patterns: Array<{ type: CodeToken["type"]; re: RegExp }> = [
    { type: "comment", re: /\/\/.*?$|\/\*[\s\S]*?\*\//gm },
    { type: "string", re: /(["'`])(?:\\.|(?!\1)[^\\])*\1/gm },
    { type: "number", re: /\b\d+(?:\.\d+)?\b/gm },

    // Keywords + TS helpers
    {
      type: "keyword",
      re: /\b(import|from|export|default|return|type|interface|extends|implements|as|const|let|var|function|class|new|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|await|async|typeof|instanceof|in|of)\b/gm,
    },

    // Common TS/JS types + React helpers
    { type: "type", re: /\b(FC|ReactNode|Props|Record|Partial|Pick|Omit|Required|string|number|boolean|any|unknown|never|void|null|undefined)\b/gm },

    // Function-ish identifiers: foo(  or  React.useMemo(
    { type: "fn", re: /\b[A-Za-z_$][\w$]*\s*(?=\()/gm },

    // Punctuation
    { type: "punct", re: /[{}()[\];,.<>:=|!?+-/*]/gm },
  ];

  type Match = { start: number; end: number; type: CodeToken["type"] };

  const matches: Match[] = [];

  for (const p of patterns) {
    let m: RegExpExecArray | null;
    // Clone regex to avoid shared state if reused
    const re = new RegExp(p.re.source, p.re.flags);
    while ((m = re.exec(code))) {
      matches.push({ start: m.index, end: m.index + m[0].length, type: p.type });
    }
  }

  // Sort by start, then prefer earlier patterns (already in list) by using stable sort behavior:
  matches.sort((a, b) => (a.start - b.start) || (b.end - a.end));

  // Remove overlaps (keep first token when overlapping)
  const filtered: Match[] = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }

  // Build tokens
  const tokens: CodeToken[] = [];
  let i = 0;
  for (const m of filtered) {
    if (m.start > i) tokens.push({ type: "plain", value: code.slice(i, m.start) });
    tokens.push({ type: m.type, value: code.slice(m.start, m.end) });
    i = m.end;
  }
  if (i < code.length) tokens.push({ type: "plain", value: code.slice(i) });

  return tokens;
}

type TerminalCodeProps = {
  code: string;
  language?: "ts" | "tsx" | "js" | "jsx";
  copyLabel?: string;
};

export function TerminalCode({
  code,
  language = "tsx",
  copyLabel = "Copy",
}: TerminalCodeProps) {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => code.replace(/\r\n/g, "\n").split("\n"), [code]);

  // highlight line-by-line so line numbers + layout remain simple
  const highlighted = useMemo(() => {
    return lines.map((line) => highlightTs(line));
  }, [lines]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // Fallback: do nothing (clipboard may be blocked)
      setCopied(false);
    }
  }

  return (
    <div className={styles.codeWrap} data-lang={language}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.copyBtn}
          onClick={handleCopy}
          aria-label="Copy terminal content"
        >
          {copied ? "Copied" : copyLabel}
        </button>
      </div>

      <pre className={styles.pre} aria-label="Code block">
        <code className={styles.code}>
          {highlighted.map((tokens, idx) => (
            <div className={styles.line} key={idx}>
              <span className={styles.gutter} aria-hidden="true">
                {idx + 1}
              </span>
              <span className={styles.content}>
                {tokens.length === 0 ? (
                  <span>&nbsp;</span>
                ) : (
                  tokens.map((t, i) => {
                    if (t.type === "plain") return <span key={i}>{t.value}</span>;
                    return (
                      <span key={i} className={styles[`tok_${t.type}`]}>
                        {t.value}
                      </span>
                    );
                  })
                )}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}