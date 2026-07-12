import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB body limit, below the 2MB avatar
      // upload actually allows (see MAX_AVATAR_BYTES in app/profile/actions.ts).
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
