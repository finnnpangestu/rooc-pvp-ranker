import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const s3EndpointMatch = (process.env.S3_ENDPOINT || '').match(/https?:\/\/([^.]+)/)
const supabaseProjectRef = s3EndpointMatch ? s3EndpointMatch[1] : null
const s3Bucket = process.env.S3_BUCKET || 'media'

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    if (!supabaseProjectRef) return []

    return [
      {
        source: '/api/media/file/:filename',
        destination: `https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/${s3Bucket}/:filename`,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/icons/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default nextConfig
