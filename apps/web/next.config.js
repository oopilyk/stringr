/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@rally-strings/ui", "@rally-strings/types"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  env: {
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
  },
}

module.exports = nextConfig
