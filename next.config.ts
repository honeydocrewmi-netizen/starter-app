import type { NextConfig } from "next";

// Where this site is served from is a BUILD-TIME fact: `basePath` is inlined
// into the client bundles (Next docs, config/basePath: "must be set at build
// time and cannot be changed without re-building"), so it can't be decided
// per-request.
//
// Two possible homes, selected by the `SITE_DOMAIN` build env var:
//
//   unset -> https://honeydocrewmi-netizen.github.io/starter-app/
//            A repo subpath, so every internal link/asset needs the
//            "/starter-app" prefix or it 404s.
//   set   -> https://<SITE_DOMAIN>/
//            A custom domain, served at the root, where that same prefix
//            would itself be the 404.
//
// Keeping both live means buying the domain and flipping DNS never leaves the
// current URL broken: set the SITE_DOMAIN repo variable when DNS is ready, and
// the next build moves the site to the root. See README "7. Move to a real
// domain". Verified by building both ways and inspecting `out/`.
const SITE_DOMAIN = process.env.SITE_DOMAIN?.trim();
const BASE_PATH = SITE_DOMAIN ? "" : "/starter-app";

const nextConfig: NextConfig = {
  output: "export",
  // Omitted entirely at the domain root — Next's own default is "".
  ...(BASE_PATH ? { basePath: BASE_PATH, assetPrefix: BASE_PATH } : {}),
  // next/image's default loader needs a running server; static export has none.
  images: { unoptimized: true },
};

export default nextConfig;
