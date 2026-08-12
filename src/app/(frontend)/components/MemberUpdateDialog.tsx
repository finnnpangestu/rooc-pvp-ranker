'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from './GlobalDialog'
import { GENERAL_STATS, QUASI_STATS, SPECIAL_STATS } from '@/const/StatsLabels'
import { updateCharacterStats } from '@/actions/stats/updateCharacter'
import { JOBS } from '@/const/JobLabels'
import clsx from 'clsx'

interface MemberUpdateDialogProps {
  isOpen: boolean
  onClose: (isUpdated?: boolean) => void
  character: any | null
}

export function MemberUpdateDialog({ isOpen, onClose, character }: MemberUpdateDialogProps) {
  const [formData, setFormData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    if (character && isOpen) {
      setFormData({
        ...character,
        guild_id:
          typeof character.guild_id === 'object' && character.guild_id?.id
            ? String(character.guild_id.id)
            : String(character.guild_id || ''),
      })
      setActiveTab('general')
    }
  }, [character, isOpen])

  if (!character) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payloadData = { ...formData }

      // Remove read-only/system fields to prevent SQL update errors
      delete payloadData.id
      delete payloadData.createdAt
      delete payloadData.updatedAt
      delete payloadData.gl_present_count
      delete payloadData.gl_absent_count
      delete payloadData.woe_present_count
      delete payloadData.woe_absent_count
      delete payloadData.total_resources

      if (payloadData.guild_id) {
        payloadData.guild_id = String(payloadData.guild_id)
      }

      // GM updates auto-verify the character
      const res = await updateCharacterStats(character.id, payloadData, true)
      if (!res.success) throw new Error(res.message)

      alert('Berhasil memperbarui karakter!')
      onClose(true)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Terjadi kesalahan jaringan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const TABS = [
    { id: 'general', label: 'General' },
    { id: 'quasi', label: 'Quasi' },
    { id: 'special', label: 'Special' },
  ]

  const renderSection = (fields: { name: string; label: string; required?: boolean }[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <label
            htmlFor={field.name}
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
          </label>
          <input
            id={field.name}
            name={field.name}
            type="number"
            step="any"
            className="w-full rounded-lg py-2.5 px-3 text-sm font-sans transition-all duration-200 outline-none"
            style={{
              background: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-neumorph-inset)',
              color: 'var(--text-primary)',
              border: 'none',
            }}
            value={formData[field.name] ?? ''}
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
      onClose={onClose}
      title={`Update Stats: ${character.name}`}
      maxWidth={700}
    >
      <div
        className="flex gap-2 p-2 rounded-xl mb-6 border overflow-x-auto scrollbar-none"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-neumorph-inset)',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={clsx(
              'flex-1 py-2 px-4 text-sm font-semibold rounded-lg cursor-pointer transition-all duration-300 whitespace-nowrap border',
              activeTab === tab.id
                ? 'shadow-neumorph-inset'
                : 'shadow-neumorph-sm hover:shadow-neumorph',
            )}
            style={{
              background: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--bg-secondary)',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              borderColor: 'var(--border-color)',
              boxShadow:
                activeTab === tab.id ? 'var(--shadow-neumorph-inset)' : 'var(--shadow-neumorph-sm)',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-h-[50vh] overflow-y-auto pr-2 mb-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                IGN (In-Game Name) <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="w-full rounded-lg py-2.5 px-3 text-sm font-sans transition-all duration-200 outline-none"
                style={{
                  background: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                  color: 'var(--text-primary)',
                  border: 'none',
                }}
                value={formData.name || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="job"
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Job <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                id="job"
                name="job"
                className="w-full rounded-lg py-2.5 px-3 text-sm font-sans transition-all duration-200 outline-none"
                style={{
                  background: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                  color: 'var(--text-primary)',
                  border: 'none',
                }}
                value={formData.job || ''}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  -- Pilih Job --
                </option>
                {JOBS.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
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

        <div
          className="flex justify-end gap-3 pt-4 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            type="button"
            onClick={() => onClose()}
            className="px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-all duration-300"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-neumorph-sm)',
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-all duration-300 disabled:opacity-50"
            style={{
              background: 'var(--bg-primary)',
              color: '#f59e0b',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </GlobalDialog>
  )
}
