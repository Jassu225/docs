/**
 * Static export for GitHub Pages.
 *
 * The site is served from https://<user>.github.io/docs/, so it needs a base
 * path in production. `next dev` keeps serving from `/`, so the base path is
 * gated behind DOCS_BASE_PATH, which only the deploy workflow sets.
 */
const basePath = process.env.DOCS_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
