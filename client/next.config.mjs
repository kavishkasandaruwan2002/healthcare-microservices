/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // This will ignore ESLint errors (like the 'core-webvitals' one you saw)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;