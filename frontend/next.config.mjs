import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // Without this, Next walks up looking for a lockfile and can settle on a
  // directory far above the app (a stray ~/package-lock.json is enough), which
  // traces the wrong files into the build.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};
export default nextConfig;
