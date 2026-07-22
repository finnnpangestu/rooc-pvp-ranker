import { CollectionConfig } from 'payload'

export const ResourceDistributions: CollectionConfig = {
  slug: 'resource_distributions',
  admin: {
    useAsTitle: 'id',
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
    },
    {
      name: 'resource_id',
      type: 'relationship',
      relationTo: 'resources',
      required: true,
    },
    {
      name: 'member_id',
      type: 'relationship',
      relationTo: 'characters',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'bid_date',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      label: 'Tanggal Distribusi',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Claimed', value: 'claimed' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'notes',
      type: 'text',
      label: 'Catatan',
    },
  ],
}
