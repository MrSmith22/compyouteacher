/** @type {import('next').NextConfig} */
const nextConfig = {
  // Local tooling may not ship eslint; production typecheck still runs.
  eslint: { ignoreDuringBuilds: true },
  // Allow isolated production acceptance without colliding with `next dev` (.next).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
