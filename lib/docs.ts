/**
 * The registry of published documents.
 *
 * Adding a document means adding an entry here and a matching page under
 * `app/docs/<slug>/page.tsx`. The home page, the header and the document
 * footers all read from this list, so nothing else needs touching.
 */
export type Doc = {
  slug: string;
  title: string;
  /** One line, used on cards and as the page description. */
  summary: string;
  /** ISO date, shown as "Updated ...". */
  updated: string;
  /** Grouping on the home page. */
  category: string;
  /** Rough reading time, in minutes. */
  readingMinutes: number;
};

export const docs: Doc[] = [
  {
    slug: 'how-a-ticket-becomes-shipped-software',
    title: 'How a ticket becomes shipped software',
    summary:
      'The four-phase workflow a ticket runs through, from Linear issue to merged pull request.',
    updated: '2026-09-20',
    category: 'Engineering process',
    readingMinutes: 8,
  },
];

export const docBySlug = Object.fromEntries(docs.map((doc) => [doc.slug, doc]));

export function docPath(slug: string) {
  return `/docs/${slug}/`;
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
