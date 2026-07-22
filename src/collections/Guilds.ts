import { CollectionConfig } from 'payload'

export const Guilds: CollectionConfig = {
  slug: 'guilds',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'super_admin') return true
      return {
        guild_master: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  hooks: {
    afterRead: [
      async ({ doc, req: { payload } }) => {
        try {
          const result = await payload.find({
            collection: 'characters',
            where: {
              guild_id: { equals: doc.id },
              isVerified: { equals: true },
            },
            limit: 0,
            pagination: false,
            depth: 0,
          })

          const totalScore = result.docs.reduce(
            (sum: number, char: any) => sum + (char.pvp_score ?? 0),
            0,
          )

          doc.total_characters = result.totalDocs
          doc.total_pvp_score = totalScore
        } catch (_) {
          doc.total_characters = 0
          doc.total_pvp_score = 0
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      unique: true,
      defaultValue: () => crypto.randomUUID(),
      admin: {
        hidden: true,
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: 'Nama Guild',
    },
    {
      name: 'guild_master',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'total_characters',
      type: 'number',
      label: 'Total Karakter (Verified)',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Jumlah karakter terverifikasi dalam guild',
      },
    },
    {
      name: 'total_pvp_score',
      type: 'number',
      label: 'Total PvP Score Guild',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Akumulasi PvP score semua karakter terverifikasi',
      },
    },
    {
      name: 'gl_wins',
      type: 'number',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'gl_losses',
      type: 'number',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'gl_trends',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'characters',
      type: 'join',
      label: 'Karakter dalam Guild',
      collection: 'characters',
      on: 'guild_id',
    },
  ],
}
