/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // reactCompiler was introduced in React 19/Next 15; 
  // removed here for compatibility with Next 14
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
};

export default nextConfig;
