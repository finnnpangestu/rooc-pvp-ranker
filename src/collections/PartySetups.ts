import { JOBS_OPTIONS } from '@/const/JobLabels'
import { CollectionConfig } from 'payload'

export const PartySetups: CollectionConfig = {
  slug: 'party_setups',
  admin: {
    useAsTitle: 'id',
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
      admin: {
        hidden: true,
      },
    },
    {
      name: 'guild_id',
      type: 'relationship',
      relationTo: 'guilds',
      required: true,
      unique: true, // Memastikan 1 Guild hanya memiliki 1 Setup Aktif
      label: 'Guild',
    },
    {
      name: 'elite_parties',
      type: 'array',
      label: 'Elite Parties',
      minRows: 8,
      maxRows: 8, // Mengunci pasti 8 party untuk Elite
      fields: [
        {
          name: 'party_name',
          type: 'text',
          required: true,
          defaultValue: 'Elite Party',
        },
        {
          name: 'slots',
          type: 'array',
          label: 'Party Members',
          minRows: 5,
          maxRows: 5,
          fields: [
            {
              name: 'required_job',
              type: 'select',
              options: JOBS_OPTIONS,
              required: true,
              label: 'Required Job (Blueprint)',
              defaultValue: 'any',
            },
            {
              name: 'assigned_character',
              type: 'relationship',
              relationTo: 'characters',
              label: 'Assigned Character',
              admin: {
                description: 'Karakter yang terpilih otomatis atau di-assign manual',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'sub_parties',
      type: 'array',
      label: 'Sub Parties',
      fields: [
        {
          name: 'party_name',
          type: 'text',
          required: true,
          defaultValue: 'Sub Party',
        },
        {
          name: 'slots',
          type: 'array',
          label: 'Party Members',
          minRows: 5,
          maxRows: 5,
          fields: [
            {
              name: 'required_job',
              type: 'select',
              options: JOBS_OPTIONS,
              required: true,
              label: 'Required Job (Blueprint)',
              defaultValue: 'any',
            },
            {
              name: 'assigned_character',
              type: 'relationship',
              relationTo: 'characters',
              label: 'Assigned Character',
            },
          ],
        },
      ],
    },
  ],
}
