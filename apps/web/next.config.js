/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@rally-strings/ui", "@rally-strings/types"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.localhost:3000"],
    },
  },
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  env: {
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
  },
}

module.exports = nextConfig
