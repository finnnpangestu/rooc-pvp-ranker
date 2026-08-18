import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const getS3Client = () => {
  if (
    !process.env.S3_ENDPOINT ||
    !process.env.S3_ACCESS_KEY_ID ||
    !process.env.S3_SECRET_ACCESS_KEY
  ) {
    return null
  }

  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  })
}

export function getPublicUrl(key: string): string {
  const bucket = process.env.S3_BUCKET || 'media'
  const endpoint = process.env.S3_ENDPOINT || ''
  const match = endpoint.match(/https?:\/\/([^\.]+)/)
  const projectRef = match ? match[1] : null

  if (projectRef && endpoint.includes('supabase.co')) {
    return `https://${projectRef}.supabase.co/storage/v1/object/public/${bucket}/${key}`
  }
  return `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`
}

export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ key: string; url: string } | null> {
  const s3 = getS3Client()
  if (!s3) {
    console.warn('S3 credentials not configured, skipping cloud upload.')
    return null
  }

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `${Date.now()}-${sanitizedName}`
  const bucket = process.env.S3_BUCKET || 'media'

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    }),
  )

  const publicUrl = getPublicUrl(key)

  return { key, url: publicUrl }
}

export async function deleteFromS3(key: string): Promise<boolean> {
  const s3 = getS3Client()
  if (!s3) return false

  const bucket = process.env.S3_BUCKET || 'media'

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )
    return true
  } catch (error) {
    console.error('Error deleting from S3:', error)
    return false
  }
}
