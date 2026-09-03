import type { NextConfig } from "next";

// GitHub Pages serves this repo at https://honeydocrewmi-netizen.github.io/starter-app/,
// a subpath, not the domain root. Every internal link/asset must carry that
// prefix or it 404s once deployed (verified by building and inspecting `out/`).
const BASE_PATH = "/starter-app";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  // next/image's default loader needs a running server; static export has none.
  images: { unoptimized: true },
};

export default nextConfig;
