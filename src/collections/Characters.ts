import { calculatePvPScore } from '@/utils/calculatePvPScore'
import { CollectionConfig } from 'payload'

export const Characters: CollectionConfig = {
  slug: 'characters',
  admin: {
    useAsTitle: 'name',
    description: 'Data karakter ROOC dari berbagai Guild',
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => {
      if (user) return true

      return {
        isVerified: {
          equals: true,
        },
      }
    },
    update: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'super_admin') return true

      const guilds = await payload.find({
        collection: 'guilds',
        where: {
          guild_master: {
            equals: user.id,
          },
        },
      })

      const guildIds = guilds.docs.map((g) => g.id)
      if (guildIds.length === 0) return false

      return {
        guild_id: {
          in: guildIds,
        },
      }
    },
    delete: async ({ req: { user, payload } }) => {
      if (!user) return false
      if (user.role === 'super_admin') return true

      const guilds = await payload.find({
        collection: 'guilds',
        where: {
          guild_master: {
            equals: user.id,
          },
        },
      })

      const guildIds = guilds.docs.map((g) => g.id)
      if (guildIds.length === 0) return false

      return {
        guild_id: {
          in: guildIds,
        },
      }
    },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        data.pvp_score = calculatePvPScore(data)

        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'IGN (In-Game Name)',
    },
    {
      name: 'job',
      type: 'select',
      required: true,
      options: [
        { label: 'Lord Knight', value: 'lord_knight' },
        { label: 'Paladin', value: 'paladin' },
        { label: 'High Priest', value: 'high_priest' },
        { label: 'Champion', value: 'champion' },
        { label: 'Assassin Cross', value: 'assassin_cross' },
        { label: 'Stalker', value: 'stalker' },
        { label: 'High Wizard', value: 'high_wizard' },
        { label: 'Professor', value: 'professor' },
        { label: 'Sniper', value: 'sniper' },
        { label: 'Minstrell', value: 'minstrell' },
        { label: 'Gypsy', value: 'gypsy' },
        { label: 'Mastersmith', value: 'mastersmith' },
        { label: 'Biochemist', value: 'biochemist' },
        { label: 'Summoner', value: 'summoner' },
      ],
    },
    {
      name: 'guild_id',
      type: 'relationship',
      relationTo: 'guilds',
      required: true,
      label: 'Pilih Guild Anda',
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      label: 'Verified by Guild Master',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'stats_screenshot',
      type: 'upload',
      relationTo: 'media',
      label: 'Screenshot Stats (Untuk Keperluan OCR)',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General Stats',
          fields: [
            { name: 'max_hp', type: 'number', required: true, label: 'HP' },
            { name: 'patk', type: 'number', label: 'PATK' },
            { name: 'matk', type: 'number', label: 'MATK' },
            { name: 'pdef', type: 'number', label: 'PDEF' },
            { name: 'mdef', type: 'number', label: 'MDEF' },
            { name: 'refine_patk', type: 'number', label: 'Refine PATK' },
            { name: 'refine_matk', type: 'number', label: 'Refine MATK' },
            { name: 'refine_pdef', type: 'number', label: 'Refine PDEF' },
            { name: 'refine_mdef', type: 'number', label: 'Refine MDEF' },
            { name: 'hit', type: 'number', label: 'HIT' },
            { name: 'flee', type: 'number', label: 'FLEE' },
          ],
        },
        {
          label: 'Quasi Stats',
          fields: [
            { name: 'aspd', type: 'number', label: 'ASPD' },
            { name: 'variable_cast', type: 'number', label: 'Variable CT' },
            { name: 'fixed_cast', type: 'number', label: 'Fixed CT' },
            { name: 'healing_done', type: 'number', label: 'Healing Done' },
            { name: 'critical', type: 'number', label: 'CRIT' },
            { name: 'critical_damage', type: 'number', label: 'CRIT DMG' },
            { name: 'critical_reduction', type: 'number', label: 'CRIT RES' },
            { name: 'critical_damage_reduction', type: 'number', label: 'CRIT DMG RES' },
            { name: 'pdmg', type: 'number', label: 'PDMG' },
            { name: 'mdmg', type: 'number', label: 'MDMG' },
            { name: 'pdmg_reduction', type: 'number', label: 'PDMG.R' },
            { name: 'mdmg_reduction', type: 'number', label: 'MDMG.R' },
            { name: 'ignore_pdef', type: 'number', label: 'Ignore PDEF' },
            { name: 'ignore_mdef', type: 'number', label: 'Ignore MDEF' },
            { name: 'pdmg_bonus', type: 'number', label: 'PDMG Bonus' },
            { name: 'mdmg_bonus', type: 'number', label: 'MDMG Bonus' },
            { name: 'pvp_dmg_bonus', type: 'number', label: 'PvP DMG Bonus' },
            { name: 'pvp_dmg_reduction', type: 'number', label: 'PvP DMG Reduction' },
          ],
        },
        {
          label: 'Special Stats (Manual Input)',
          description: 'Input persentase, gunakan format desimal (contoh: 24% = 0.24)',
          fields: [
            { name: 'max_hp_percentage', type: 'number', label: 'Max HP %' },
            { name: 'equipment_patk_percentage', type: 'number', label: 'Equipment PATK %' },
            { name: 'equipment_matk_percentage', type: 'number', label: 'Equipment MATK %' },
            { name: 'equipment_pdef_percentage', type: 'number', label: 'Equipment PDEF %' },
            { name: 'equipment_mdef_percentage', type: 'number', label: 'Equipment MDEF %' },
            { name: 'dmg_vs_demi_human', type: 'number', label: 'DMG vs Demi-Human' },
            {
              name: 'dmg_reduction_demi_human',
              type: 'number',
              label: 'DMG Reduction vs Demi-Human',
            },
            { name: 'dmg_vs_medium', type: 'number', label: 'DMG vs Medium Enemies' },
            {
              name: 'dmg_reduction_medium',
              type: 'number',
              label: 'DMG Reduction vs Medium Enemies',
            },
            { name: 'neutral_dmg_bonus', type: 'number', label: 'Neutral DMG Bonus' },
            { name: 'neutral_dmg_reduction', type: 'number', label: 'Neutral DMG Reduction' },
          ],
        },
      ],
    },
    {
      name: 'pvp_score',
      type: 'number',
      label: 'Total PvP Score',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
}
