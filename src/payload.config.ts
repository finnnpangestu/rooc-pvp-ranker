import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Characters } from './collections/Characters'
import { Guilds } from './collections/Guilds'
import { PartySetups } from './collections/PartySetups'
import { ReportsGL } from './collections/ReportsGL'
import { Resources } from './collections/Resource'
import { ResourceDistributions } from './collections/ResourceDistributions'
import { WoeSetups } from './collections/WoeSetups'
import { ReportsWoe } from './collections/ReportsWoe'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Characters,
    Guilds,
    PartySetups,
    ReportsGL,
    Resources,
    ResourceDistributions,
    WoeSetups,
    ReportsWoe,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || 'media',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'ap-southeast-1',
        endpoint: process.env.S3_ENDPOINT || '',
        forcePathStyle: true,
      },
      enabled: Boolean(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID),
    }),
  ],
})

