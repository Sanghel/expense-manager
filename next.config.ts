import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'
import withPWAInit from '@ducanh2912/next-pwa'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
})

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    // Keep visited dynamic pages in the client router cache for 30s, so going
    // back to a section is instant instead of re-rendering on the server.
    staleTimes: { dynamic: 30 },
  },
}

export default withBundleAnalyzer(withPWA(nextConfig))
