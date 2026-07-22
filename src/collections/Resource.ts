import { CollectionConfig } from 'payload'

export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'name',
    group: 'Guild Management',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'super_admin',
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
      name: 'guild_id',
      type: 'relationship',
      relationTo: 'guilds',
      required: true,
      label: 'Guild',
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Resource',
      admin: {
        description: 'Contoh: S, A, B, Mythic, Legendary, dll',
      },
    },
    {
      name: 'total_quantity',
      type: 'number',
      required: true,
      label: 'Total Jumlah',
      min: 0,
    },
    {
      name: 'remaining_quantity',
      type: 'number',
      label: 'Sisa Jumlah',
      admin: {
        readOnly: true,
        description: 'Otomatis terupdate saat distribusi',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.remaining_quantity = data.total_quantity || 0
        }
        return data
      },
    ],
  },
}
