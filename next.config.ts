import type { NextConfig } from "next";

// This site is served at the root of https://honeydocrewservices.com/ — the
// custom domain is attached to the repo's GitHub Pages and its CNAME lives at
// `public/CNAME`, which static export copies to `out/CNAME`.
//
// So there is deliberately no `basePath` here. The site used to live at the
// github.io/starter-app subpath, which required prefixing every internal
// link and asset; on the domain root that same prefix is what 404s. GitHub
// now redirects the old subpath URL to the domain, so only the root build
// exists. (`basePath` is inlined into the client bundles at build time and
// can't be decided per-request, which is why this is a code-level fact.)
const nextConfig: NextConfig = {
  output: "export",
  // next/image's default loader needs a running server; static export has none.
  images: { unoptimized: true },
};

export default nextConfig;
