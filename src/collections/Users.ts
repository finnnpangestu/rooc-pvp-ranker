import { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'super_admin',
    delete: ({ req: { user } }) => user?.role === 'super_admin',
    admin: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'guild_master',
      options: [
        { label: 'Super Admin (Developer)', value: 'super_admin' },
        { label: 'Guild Master', value: 'guild_master' },
      ],
    },
    {
      name: 'name',
      type: 'text',
      label: 'Nama Lengkap / Panggilan',
    },
  ],
}
