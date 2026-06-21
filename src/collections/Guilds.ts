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
  fields: [
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
  ],
}
