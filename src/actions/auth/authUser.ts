'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export async function getAuthUser() {
  const reqHeaders = await headers()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: reqHeaders })
  return { user, payload }
}
