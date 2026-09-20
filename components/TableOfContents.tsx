'use client';

import { useEffect, useState } from 'react';

export type TocEntry = { id: string; label: string; tone?: 'warn' };

export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState(entries[0]?.id ?? '');

  useEffect(() => {
    let frame = 0;

    // The current section is the last heading the reader has scrolled past —
    // not the one on screen, since a long section leaves its heading behind.
    function update() {
      frame = 0;
      let current = entries[0]?.id ?? '';
      for (const entry of entries) {
        const heading = document.getElementById(entry.id);
        if (heading && heading.getBoundingClientRect().top <= 96) current = entry.id;
      }
      // At the very bottom the last section wins, however short it is.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = entries[entries.length - 1]?.id ?? current;
      }
      setActive(current);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [entries]);

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 text-xs font-semibold tracking-[0.12em] text-[var(--ink-faint)] uppercase">
        On this page
      </p>
      <ul className="space-y-1 border-l border-[var(--rule)]">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={active === entry.id ? 'true' : undefined}
              className={`-ml-px block border-l py-1 pl-4 transition ${
                entry.tone === 'warn'
                  ? active === entry.id
                    ? 'border-[var(--role-amber-line)] font-medium text-[var(--role-amber-line)]'
                    : 'border-transparent text-[var(--role-amber-line)] opacity-80 hover:opacity-100'
                  : active === entry.id
                    ? 'border-[var(--role-blue-line)] font-medium text-[var(--ink)]'
                    : 'border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]'
              }`}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
