'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import { Button } from '../components/Button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { JOBS } from '@/const/JobLabels'
import { GENERAL_STATS, QUASI_STATS, SPECIAL_STATS } from '@/const/StatsLabels'
import { updateCharacterStats } from '@/actions/stats/updateCharacter'
import { Icon } from '@iconify/react'
import { CustomDropdown } from '../components/CustomDropdown'
import clsx from 'clsx'
import { useTheme } from '../components/ThemeProvider'
import type { Character, CharacterStatsInput } from '@/types'
import { formatErrorMessage } from '@/types'

interface Guild {
  id: string
  name: string
}

interface StatsFormProps {
  guild: Guild
  characters: Character[]
}

const DEFAULT_FORM: CharacterStatsInput = {
  name: '',
  job: '',
  guild_id: '',
}

export function StatsForm({ guild, characters }: StatsFormProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const [formData, setFormData] = useState<CharacterStatsInput>({
    ...DEFAULT_FORM,
    guild_id: guild.id,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [dialogResult, setDialogResult] = useState<{ isOpen: boolean; score: number | null }>({
    isOpen: false,
    score: null,
  })
  const [activeTab, setActiveTab] = useState('info')
  const [formMode, setFormMode] = useState<'add' | 'update'>('add')
  const [selectedUpdateId, setSelectedUpdateId] = useState('')

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleModeChange = (mode: 'add' | 'update') => {
    if (mode === 'update') {
      router.refresh()
    }
    setFormMode(mode)
    setFormData({ ...DEFAULT_FORM, guild_id: guild.id })
    setSelectedUpdateId('')
    setActiveTab('info')
  }

  const handleSelectCharacter = (charId: string) => {
    router.refresh()
    const char = characters.find((c) => String(c.id) === charId)
    if (char) {
      setSelectedUpdateId(charId)
      setFormData({
        ...char,
        guild_id: guild.id,
      })
    } else {
      setSelectedUpdateId('')
      setFormData({ ...DEFAULT_FORM, guild_id: guild.id })
    }
  }

  useEffect(() => {
    if (formMode === 'update' && selectedUpdateId) {
      const char = characters.find((c) => String(c.id) === selectedUpdateId)
      if (char) {
        setFormData((prev: CharacterStatsInput) => ({
          ...prev,
          ...char,
          guild_id: guild.id,
        }))
      }
    }
  }, [characters, selectedUpdateId, formMode, guild.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev: CharacterStatsInput) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payloadData: CharacterStatsInput = { ...formData }
      if (payloadData.guild_id) {
        payloadData.guild_id = String(payloadData.guild_id)
      }

      let resDoc: Character | null = null

      if (formMode === 'add') {
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadData),
        })
        const json = await res.json()
        if (!res.ok)
          throw new Error(
            json.errors
              ? json.errors.map((err: { message: string }) => err.message).join(', ')
              : 'Failed to submit new data',
          )
        resDoc = json.doc
      } else {
        if (!selectedUpdateId) throw new Error('Please select a character to update!')
        const res = await updateCharacterStats(selectedUpdateId, payloadData)
        if (!res.success) throw new Error(res.message)
        resDoc = res.data?.doc || null
      }

      setDialogResult({
        isOpen: true,
        score: resDoc ? Number(resDoc.pvp_score) : null,
      })
      setFormData({ ...DEFAULT_FORM, guild_id: guild.id })
      setSelectedUpdateId('')
      setActiveTab('info')
    } catch (err: unknown) {
      console.error(err)
      alert(formatErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCharactersForUpdate = characters.filter(
    (c) => String(c.guild_id) === String(guild.id),
  )

  const TABS = [
    { id: 'info', label: 'Information' },
    { id: 'general', label: 'General' },
    { id: 'quasi', label: 'Quasi' },
    { id: 'special', label: 'Special' },
  ]

  const renderSection = (fields: { name: string; label: string; required?: boolean }[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-2">
          <label
            htmlFor={field.name}
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
          </label>
          <input
            id={field.name}
            name={field.name}
            type="number"
            step="any"
            className="w-full rounded-xl py-3 px-4 text-sm font-sans transition-all outline-none border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 tabular-nums"
            style={{
              color: 'var(--text-primary)',
            }}
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
    <>
      <div
        className="max-w-[1200px] my-6 sm:my-10 mx-auto p-6 sm:p-10 rounded-3xl relative overflow-hidden transition-colors apple-glass border border-black/5 dark:border-white/10 shadow-xl"
        style={{
          color: 'var(--text-primary)',
        }}
      >
        <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,113,227,0.12)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <div
            className="inline-block py-1.5 px-4 text-xs font-semibold uppercase tracking-wider rounded-full mb-4 border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05]"
            style={{
              color: 'var(--text-primary)',
            }}
          >
            ROOC Ranker
          </div>
          <h1
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Submit Stats
          </h1>

          <div className="flex items-center justify-center gap-2.5 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-semibold border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Icon icon="fluent:shield-checkmark-20-filled" className="w-4 h-4" />
              Guild: {guild.name}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-medium cursor-pointer transition-all border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] apple-press"
              style={{
                color: copiedLink ? '#10b981' : 'var(--text-secondary)',
              }}
              title="Copy this form link to share"
            >
              <Icon
                icon={copiedLink ? 'fluent:checkmark-16-filled' : 'fluent:copy-16-regular'}
                className="w-3.5 h-3.5"
              />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Guild Link'}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-medium cursor-pointer transition-all border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] apple-press"
              style={{
                color: 'var(--text-secondary)',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Icon
                  icon="fluent:weather-sunny-16-regular"
                  className="w-3.5 h-3.5 text-amber-500"
                />
              ) : (
                <Icon
                  icon="fluent:weather-moon-16-regular"
                  className="w-3.5 h-3.5 text-indigo-500"
                />
              )}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          <div className="flex justify-center my-5">
            <div className="inline-flex p-1 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.05] backdrop-blur-md">
              <button
                type="button"
                onClick={() => handleModeChange('add')}
                className={clsx(
                  'py-2 px-5 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 apple-press',
                  formMode === 'add'
                    ? 'bg-white dark:bg-zinc-800 text-[var(--text-primary)] shadow-sm border border-black/5 dark:border-white/10'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                )}
              >
                Add Character
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('update')}
                className={clsx(
                  'py-2 px-5 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 apple-press',
                  formMode === 'update'
                    ? 'bg-white dark:bg-zinc-800 text-[var(--text-primary)] shadow-sm border border-black/5 dark:border-white/10'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                )}
              >
                Update Character
              </button>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)' }}>
            {formMode === 'add' ? (
              <>
                Enter your character stats to participate in PvP rankings. <br />
                <span className="text-[13px] italic">
                  Note: Use stats without any buffs applied.
                </span>
              </>
            ) : (
              <>
                Select your character to update with recent stats (Resets Verification). <br />
                <span className="text-[13px] italic">
                  Note: Use stats without any buffs applied.
                </span>
              </>
            )}
          </p>

          <p style={{ marginTop: '8px' }}>
            <Link
              href="/leaderboards"
              style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '1px solid var(--border-color)',
                padding: '4px 0',
              }}
            >
              View Leaderboard →
            </Link>
          </p>
        </div>

        <div className="flex gap-2 p-1.5 rounded-2xl mb-8 relative z-10 border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const isDisabled = formMode === 'update' && !selectedUpdateId && tab.id !== 'info'
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                className={clsx(
                  'flex-1 py-2.5 px-5 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 whitespace-nowrap apple-press',
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-[var(--text-primary)] shadow-sm border border-black/5 dark:border-white/10'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                )}
                onClick={() => setActiveTab(tab.id)}
                disabled={isDisabled}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 min-h-[300px]">
          {/* Tab: Informasi */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'info' })}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {formMode === 'add' ? (
                <>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="name"
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      IGN (In-Game Name) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="w-full rounded-xl py-3 px-4 text-sm font-sans transition-all outline-none border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      style={{
                        color: 'var(--text-primary)',
                      }}
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Character Name"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Job <span className="text-red-500 font-bold">*</span>
                    </label>
                    <CustomDropdown
                      value={formData.job}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, job: val as Character['job'] }))
                      }
                      placeholder="-- Select Job --"
                      options={JOBS.map((j) => ({
                        value: j.value,
                        label: j.label,
                        icon: `/icons/jobs/${j.value}.png`,
                      }))}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Registered Guild
                    </label>
                    <div
                      className="w-full rounded-xl py-3 px-4 text-sm font-sans flex items-center justify-between border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04]"
                      style={{
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="fluent:shield-checkmark-24-filled"
                          className="w-5 h-5 text-blue-500"
                        />
                        <span className="font-semibold">{guild.name}</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                        Verified
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Registered Guild
                    </label>
                    <div
                      className="w-full rounded-xl py-3 px-4 text-sm font-sans flex items-center justify-between border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04]"
                      style={{
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="fluent:shield-checkmark-24-filled"
                          className="w-5 h-5 text-blue-500"
                        />
                        <span className="font-semibold">{guild.name}</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Select Character (IGN) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <CustomDropdown
                      value={selectedUpdateId}
                      onChange={(val) => handleSelectCharacter(val)}
                      placeholder={
                        filteredCharactersForUpdate.length === 0
                          ? '-- No characters in this guild yet --'
                          : '-- Select Character --'
                      }
                      disabled={filteredCharactersForUpdate.length === 0}
                      options={filteredCharactersForUpdate.map((c) => ({
                        value: String(c.id),
                        label: c.name,
                        sublabel: JOBS.find((j) => j.value === c.job)?.label || c.job,
                        icon: `/icons/jobs/${c.job}.png`,
                      }))}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Edit Job (If Changed Job) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <CustomDropdown
                      value={formData.job}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, job: val as Character['job'] }))
                      }
                      placeholder="-- Select Job --"
                      disabled={!selectedUpdateId}
                      options={JOBS.map((j) => ({
                        value: j.value,
                        label: j.label,
                        icon: `/icons/jobs/${j.value}.png`,
                      }))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tab: General */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'general' })}>
            <div className="mb-6 text-xs leading-relaxed p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-[var(--text-secondary)] backdrop-blur-sm">
              Your character&apos;s basic stats.
            </div>
            {renderSection(GENERAL_STATS)}
          </div>

          {/* Tab: Quasi */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'quasi' })}>
            <div className="mb-6 text-xs leading-relaxed p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-[var(--text-secondary)] backdrop-blur-sm">
              Advanced stats (Quasi). Enter pure numbers without percentage signs (e.g. 99.5 for
              99.5%). For minus stats (-), do not use a negative sign (e.g. 5 for -5).
            </div>
            {renderSection(QUASI_STATS)}
          </div>

          {/* Tab: Special */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'special' })}>
            <div className="mb-6 text-xs leading-relaxed p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 text-[var(--text-secondary)] backdrop-blur-sm">
              Additional stats from equipment or special modifiers.
            </div>
            {renderSection(SPECIAL_STATS)}
          </div>

          <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/10 flex justify-end">
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              {formMode === 'add' ? 'Submit Stats Data' : 'Update Stats Data'}
            </Button>
          </div>
        </form>
      </div>

      <GlobalDialog
        isOpen={dialogResult.isOpen}
        onClose={() => setDialogResult({ isOpen: false, score: null })}
        title={formMode === 'add' ? 'Submission Successful!' : 'Update Successful!'}
      >
        <div
          className="text-center text-sm mb-4 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {formMode === 'add'
            ? 'Your character data has been submitted and is awaiting verification from the Guild Master.'
            : 'Your character data has been updated and reset to Pending status for re-verification.'}
        </div>
        <div className="text-5xl font-extrabold text-center bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-transparent bg-clip-text my-6 drop-shadow-sm tabular-nums">
          Score:{' '}
          {dialogResult.score !== null
            ? Math.round(dialogResult.score).toLocaleString('en-US')
            : 'N/A'}
        </div>
      </GlobalDialog>
    </>
  )
}
