import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1", "192.168.128.184", "192.168.0.22"],
};

export default nextConfig;
