import Link from 'next/link';

import { docPath, docs, formatDate } from '@/lib/docs';

export default function HomePage() {
  const categories = docs.reduce<Record<string, typeof docs>>((acc, doc) => {
    (acc[doc.category] ??= []).push(doc);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Documentation
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        Explainers on how things are built and how they work — written so that someone outside the
        room can follow them.
      </p>

      <div className="mt-14 space-y-12">
        {Object.entries(categories).map(([category, entries]) => (
          <section key={category}>
            <h2 className="text-xs font-semibold tracking-[0.12em] text-[var(--ink-faint)] uppercase">
              {category}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {entries.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    href={docPath(doc.slug)}
                    className="group block h-full rounded-2xl border border-[var(--rule)] bg-[var(--page-soft)] p-6 transition hover:border-[var(--role-blue-line)]"
                  >
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--ink)] group-hover:text-[var(--role-blue-line)]">
                      {doc.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">{doc.summary}</p>
                    <p className="mt-4 text-xs text-[var(--ink-faint)]">
                      {doc.readingMinutes} min read · Updated {formatDate(doc.updated)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
