import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(import.meta.dirname, ".."),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
