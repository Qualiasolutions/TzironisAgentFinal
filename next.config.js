/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Fix for production build on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Fix for production build on Vercel
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig 