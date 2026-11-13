import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/predictions/run": [
      "./src/lib/ml/models/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/**/*",
    ],
  },
};

export default nextConfig;
