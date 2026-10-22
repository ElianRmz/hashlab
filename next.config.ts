import type { NextConfig } from "next";
import { LIMITS } from "./src/app/validation.ts";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Multipart metadata needs room beyond the file limit.
      bodySizeLimit: LIMITS.fileBytes.max + 20 * 1024,
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
