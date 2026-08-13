import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.128.184:3000"],
};

export default nextConfig;
