/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['xlsx']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true,
  },
  env: {
    APOLLO_API_KEY: process.env.APOLLO_API_KEY,
    APOLLO_API_URL: process.env.APOLLO_API_URL,
    APOLLO_API_RATE_LIMIT: process.env.APOLLO_API_RATE_LIMIT,
  }
}

export default nextConfig
