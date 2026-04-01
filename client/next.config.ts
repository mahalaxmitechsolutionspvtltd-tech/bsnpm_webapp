import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@hugeicons/react',
      'date-fns',
      'recharts',
      '@tanstack/react-table',
      '@tanstack/react-form',
    ],
  },
};

export default nextConfig;