import { CollectionConfig } from 'payload'

export const ReportsGL: CollectionConfig = {
  slug: 'reports_gl',
  admin: {
    useAsTitle: 'report_name',
    group: 'League Management',
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
      name: 'report_name',
      type: 'text',
      required: true,
      label: 'Nama Report',
    },
    {
      name: 'match_status',
      type: 'select',
      required: true,
      options: [
        { label: 'Menang', value: 'win' },
        { label: 'Kalah', value: 'loss' },
      ],
    },
    {
      name: 'match_score',
      type: 'number',
      label: 'Skor Match Guild',
    },
    {
      name: 'match_date',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'member_reports',
      type: 'array',
      label: 'Performa Member',
      fields: [
        {
          name: 'character_id',
          type: 'relationship',
          relationTo: 'characters',
          required: true,
        },
        {
          name: 'is_present',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'actual_score',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'party_assigned',
          type: 'text',
        },
      ],
    },
  ],
}
