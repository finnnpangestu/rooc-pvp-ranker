import type { CollectionConfig } from 'payload'
import { uploadToS3, deleteFromS3 } from '@/utils/s3Upload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  upload: {
    disableLocalStorage: true,
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.file && req.file.data) {
          const res = await uploadToS3(req.file.data, req.file.name, req.file.mimetype)
          if (res) {
            data.url = res.url
            data.thumbnailURL = res.url
            data.filename = res.key
            data.mimeType = req.file.mimetype || 'image/jpeg'
            data.filesize = req.file.data.length || req.file.size || 0
          }
        }
        return data
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        if (doc && doc.filename) {
          await deleteFromS3(doc.filename)
        }
      },
    ],
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      unique: true,
      defaultValue: () => crypto.randomUUID(),
      admin: { hidden: true },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
