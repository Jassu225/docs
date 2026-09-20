import type { Doc } from '@/lib/docs';
import { formatDate } from '@/lib/docs';

import { TableOfContents, type TocEntry } from './TableOfContents';

/**
 * The shell every document renders inside: title block, an outline that tracks
 * the reader's position, and a column of prose that diagrams can break out of.
 */
export function DocLayout({
  doc,
  standfirst,
  toc,
  children,
}: {
  doc: Doc;
  standfirst: string;
  toc: TocEntry[];
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[88rem] px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-faint)] uppercase">
          {doc.category}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--ink-soft)]">{standfirst}</p>
        <p className="mt-6 text-sm text-[var(--ink-faint)]">
          {doc.readingMinutes} min read · Updated {formatDate(doc.updated)}
        </p>
      </header>

      <div className="mt-12 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <div className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
            <TableOfContents entries={toc} />
          </div>
        </div>

        <details className="mb-10 rounded-xl border border-[var(--rule)] bg-[var(--page-soft)] p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-medium">On this page</summary>
          <div className="mt-4">
            <TableOfContents entries={toc} />
          </div>
        </details>

        <div className="min-w-0">{children}</div>
      </div>
    </article>
  );
}

/** A section with a deep-linkable heading. `warn` marks it as a caveat. */
export function Section({
  id,
  title,
  tone,
  children,
}: {
  id: string;
  title: string;
  tone?: 'warn';
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 first:mt-0">
      <h2
        id={id}
        className={`group text-2xl font-semibold tracking-tight ${
          tone === 'warn' ? 'text-[var(--role-amber-line)]' : ''
        }`}
      >
        <a href={`#${id}`} className="no-underline">
          {title}
          <span
            aria-hidden="true"
            className="ml-2 text-[var(--ink-faint)] opacity-0 transition group-hover:opacity-100"
          >
            #
          </span>
        </a>
      </h2>
      {children}
    </section>
  );
}

/** Body copy. Kept narrow even where a diagram beside it runs full width. */
export function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 max-w-[80ch] text-[1.0625rem] leading-8 text-[var(--ink-soft)]">
      {children}
    </p>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 max-w-[80ch] text-lg leading-8 text-[var(--ink)]">{children}</p>;
}

/** External link. */
export function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[var(--role-blue-line)] underline decoration-[var(--rule-strong)] underline-offset-2 transition hover:decoration-[var(--role-blue-line)] [&_code]:text-[var(--role-blue-line)]"
    >
      {children}
    </a>
  );
}

/** Lead-in emphasis inside a bullet. */
export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-[var(--ink)]">{children}</strong>;
}

/** Inline code: file names, commands, identifiers. */
export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-[var(--rule)] bg-[var(--page-soft)] px-1.5 py-0.5 font-mono text-[0.86em] text-[var(--ink)]">
      {children}
    </code>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-5 max-w-[80ch] space-y-3 text-[1.0625rem] leading-8 text-[var(--ink-soft)]">
      {children}
    </ul>
  );
}

export function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-6 before:absolute before:top-[0.85em] before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--role-blue-line)]">
      {children}
    </li>
  );
}
