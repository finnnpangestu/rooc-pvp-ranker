/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from './GlobalDialog'
import { Button } from './Button'
import { TabBar, TabButton } from './TabBar'
import { CustomDropdown } from './CustomDropdown'
import { JOBS } from '@/const/JobLabels'
import { updateCharacterStats } from '@/actions/stats/updateCharacter'
import { GENERAL_STATS, QUASI_STATS, SPECIAL_STATS } from '@/const/StatsLabels'
import type { Character, CharacterStatsInput, PopulatedMember } from '@/types'
import clsx from 'clsx'

interface StatField {
  name: string
  label: string
  required?: boolean
}

interface MemberUpdateDialogProps {
  character: Character | PopulatedMember | null
  isOpen: boolean
  onClose: (isUpdated?: boolean) => void
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'quasi', label: 'Quasi' },
  { id: 'special', label: 'Special' },
]

export function MemberUpdateDialog({ character, isOpen, onClose }: MemberUpdateDialogProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState<Partial<CharacterStatsInput>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (character) {
      const { pvp_score, ...rest } = character
      setFormData({
        ...rest,
        name: character.name,
        job: character.job,
      })
    }
  }, [character])

  if (!character) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await updateCharacterStats(character.id, formData as CharacterStatsInput)
      if (res.success) {
        onClose(true)
      } else {
        setError(res.error || 'Gagal mengupdate stats')
      }
    } catch {
      setError('Terjadi kesalahan sistem.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderSection = (fields: StatField[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <label
            htmlFor={field.name}
            className="text-[11px] font-semibold uppercase tracking-[0.03em] text-zinc-500 dark:text-zinc-400"
          >
            {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
          </label>
          <input
            id={field.name}
            name={field.name}
            type="number"
            step="any"
            className="w-full rounded-xl py-2 px-3 text-sm font-medium transition-all duration-150 outline-none bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-zinc-900 dark:text-zinc-100 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 tabular-nums"
            value={String(formData[field.name as keyof CharacterStatsInput] ?? '')}
            onChange={handleChange}
            required={field.required}
            placeholder="0"
          />
        </div>
      ))}
    </div>
  )

  return (
    <GlobalDialog
      isOpen={isOpen}
      onClose={() => onClose()}
      title={`Update Stats: ${character.name}`}
      maxWidth={700}
    >
      <TabBar className="mb-5">
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabBar>

      {error && (
        <div className="text-xs p-3 rounded-xl mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="max-h-[50vh] overflow-y-auto pr-1 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-[11px] font-semibold uppercase tracking-[0.03em] text-zinc-500 dark:text-zinc-400"
              >
                IGN (In-Game Name) <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full rounded-xl py-2 px-3 text-sm font-medium transition-all duration-150 outline-none bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-zinc-900 dark:text-zinc-100 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
                value={formData.name || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[11px] font-semibold uppercase tracking-[0.03em] text-zinc-500 dark:text-zinc-400"
              >
                Job <span className="text-red-500 font-bold">*</span>
              </label>
              <CustomDropdown
                value={formData.job || ''}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, job: val as Character['job'] }))
                }
                placeholder="-- Pilih Job --"
                size="sm"
                options={JOBS.map((j) => ({
                  value: j.value,
                  label: j.label,
                  icon: `/icons/jobs/${j.value}.png`,
                }))}
              />
            </div>
          </div>

          <div className={clsx('hidden', { '!block': activeTab === 'general' })}>
            {renderSection(GENERAL_STATS)}
          </div>
          <div className={clsx('hidden', { '!block': activeTab === 'quasi' })}>
            {renderSection(QUASI_STATS)}
          </div>
          <div className={clsx('hidden', { '!block': activeTab === 'special' })}>
            {renderSection(SPECIAL_STATS)}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10">
          <Button type="button" variant="ghost" size="md" onClick={() => onClose()}>
            Batal
          </Button>
          <Button type="submit" variant="primary" size="md" loading={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </GlobalDialog>
  )
}
