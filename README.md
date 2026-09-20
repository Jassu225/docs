# docs

A documentation site, built with Next.js and exported as static files. Published to GitHub
Pages at https://jassu225.github.io/docs/.

## Local development

```sh
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # static export into out/
```

Run `pnpm build:check` rather than `pnpm build` while `pnpm dev` is running: a production
build writes into the same `.next` directory the dev server serves from, and clobbers it.
`build:check` builds into `.next-build/` instead, and with a custom dist directory the static
export lands in `.next-build/` too rather than in `out/`.

`pnpm dev` and a plain `pnpm build` serve from `/`. The deploy workflow sets
`DOCS_BASE_PATH=/docs`, which is what makes the export work under the project-page URL.

## Adding a document

1. Add an entry to `lib/docs.ts`.
2. Create `app/docs/<slug>/page.tsx` and render its content inside `<DocLayout>`.

The home page, navigation and metadata all read from the registry, so nothing else changes.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the export and publishes
`out/` to GitHub Pages. This requires Pages to be enabled in the repository settings with
**Source: GitHub Actions** — a one-time manual step.
