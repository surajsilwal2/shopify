import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Replace with the exact name from packages/api-contract/package.json
  transpilePackages: ["@shopify/api-contract"],
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};

export default nextConfig;
