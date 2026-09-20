import Link from 'next/link';

import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[var(--page)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[var(--ink)]"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--role-blue-line)]"
          />
          Documentation
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--ink-soft)] transition hover:bg-[var(--page-soft)] hover:text-[var(--ink)]"
          >
            All documents
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
