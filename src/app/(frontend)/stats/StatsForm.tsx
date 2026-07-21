'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { JOBS } from '@/const/JobLabels'
import { GENERAL_STATS, QUASI_STATS, SPECIAL_STATS } from '@/const/StatsLabels'
import { updateCharacterStats } from '@/actions/stats/updateCharacter'
import clsx from 'clsx'
import { useTheme } from '../components/ThemeProvider'

interface Guild {
  id: string
  name: string
}

interface StatsFormProps {
  guilds: Guild[]
  characters: any[]
}

const DEFAULT_FORM = {
  name: '',
  job: '',
  guild_id: '',
}

export function StatsForm({ guilds, characters }: StatsFormProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const [formData, setFormData] = useState<any>({ ...DEFAULT_FORM })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogResult, setDialogResult] = useState<{ isOpen: boolean; score: number | null }>({
    isOpen: false,
    score: null,
  })
  const [activeTab, setActiveTab] = useState('info')
  const [formMode, setFormMode] = useState<'add' | 'update'>('add')
  const [selectedUpdateId, setSelectedUpdateId] = useState('')

  const handleModeChange = (mode: 'add' | 'update') => {
    if (mode === 'update') {
      router.refresh()
    }
    setFormMode(mode)
    setFormData({ ...DEFAULT_FORM })
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
        guild_id: String(char.guild_id),
      })
    } else {
      setSelectedUpdateId('')
      setFormData({ ...DEFAULT_FORM, guild_id: formData.guild_id })
    }
  }

  useEffect(() => {
    if (formMode === 'update' && selectedUpdateId) {
      const char = characters.find((c) => String(c.id) === selectedUpdateId)
      if (char) {
        setFormData((prev: any) => ({
          ...prev,
          ...char,
          guild_id: String(char.guild_id),
        }))
      }
    }
  }, [characters, selectedUpdateId, formMode])

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
      if (payloadData.guild_id) {
        payloadData.guild_id = String(payloadData.guild_id)
      }

      let resDoc = null

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
              ? json.errors.map((err: any) => err.message).join(', ')
              : 'Gagal mengirim data baru',
          )
        resDoc = json.doc
      } else {
        if (!selectedUpdateId) throw new Error('Harap pilih karakter yang ingin diupdate!')
        const res = await updateCharacterStats(selectedUpdateId, payloadData)
        if (!res.success) throw new Error(res.message)
        resDoc = res.doc
      }

      setDialogResult({
        isOpen: true,
        score: resDoc.pvp_score,
      })
      setFormData({ ...DEFAULT_FORM })
      setSelectedUpdateId('')
      setActiveTab('info')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Terjadi kesalahan jaringan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCharactersForUpdate = characters.filter(
    (c) => String(c.guild_id) === String(formData.guild_id),
  )

  const TABS = [
    { id: 'info', label: 'Informasi' },
    { id: 'general', label: 'General' },
    { id: 'quasi', label: 'Quasi' },
    { id: 'special', label: 'Special' },
  ]

  const renderSection = (fields: { name: string; label: string; required?: boolean }[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-2.5">
          <label htmlFor={field.name} style={{ color: 'var(--text-secondary)' }}>
            {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
          </label>
          <input
            id={field.name}
            name={field.name}
            type="number"
            step="any"
            className="w-full rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
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
    <>
      <div
        className="max-w-[1200px] my-10 mx-auto p-10 rounded-3xl relative overflow-hidden transition-colors"
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-neumorph)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <div
            className="inline-block py-1.5 px-3 text-[13px] font-semibold uppercase tracking-[1px] rounded-full mb-4"
            style={{
              background: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-neumorph-inset)',
              color: 'var(--text-primary)',
            }}
          >
            ROOC Ranker
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Submit Stats
          </h1>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              margin: '20px 0 16px 0',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '4px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              <button
                type="button"
                onClick={() => handleModeChange('add')}
                className={clsx(
                  'flex-1 bg-transparent border-none py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap',
                  formMode === 'add' ? 'shadow-neumorph-inset' : 'hover:shadow-neumorph-sm',
                )}
                style={{
                  background: formMode === 'add' ? 'var(--bg-primary)' : 'transparent',
                  color: formMode === 'add' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: formMode === 'add' ? 'var(--shadow-neumorph-inset)' : 'none',
                }}
              >
                Tambah Char
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('update')}
                className={clsx(
                  'flex-1 bg-transparent border-none py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap',
                  formMode === 'update' ? 'shadow-neumorph-inset' : 'hover:shadow-neumorph-sm',
                )}
                style={{
                  background: formMode === 'update' ? 'var(--bg-primary)' : 'transparent',
                  color: formMode === 'update' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: formMode === 'update' ? 'var(--shadow-neumorph-inset)' : 'none',
                }}
              >
                Update Char
              </button>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)' }}>
            {formMode === 'add'
              ? 'Masukkan data stat karaktermu untuk berpartisipasi dalam rank PvP.'
              : 'Pilih karaktermu untuk memperbarui data stats terbaru (Mereset Verifikasi).'}
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
              Lihat Leaderboard →
            </Link>
          </p>
        </div>

        <div
          className="flex gap-2 p-2 rounded-2xl mb-8 relative z-10 border overflow-x-auto scrollbar-none"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph-inset)',
          }}
        >
          {TABS.map((tab) => {
            const isDisabled = formMode === 'update' && !selectedUpdateId && tab.id !== 'info'
            return (
              <button
                key={tab.id}
                type="button"
                className={clsx(
                  'flex-1 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap border',
                  activeTab === tab.id
                    ? 'shadow-neumorph-inset'
                    : 'shadow-neumorph-sm hover:shadow-neumorph',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                )}
                style={{
                  background: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderColor: 'var(--border-color)',
                  boxShadow:
                    activeTab === tab.id
                      ? 'var(--shadow-neumorph-inset)'
                      : 'var(--shadow-neumorph-sm)',
                }}
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
                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="name" style={{ color: 'var(--text-secondary)' }}>
                      IGN (In-Game Name) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="w-full rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                      style={{
                        background: 'var(--bg-primary)',
                        boxShadow: 'var(--shadow-neumorph-inset)',
                        color: 'var(--text-primary)',
                        border: 'none',
                      }}
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Nama Karakter"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="job" style={{ color: 'var(--text-secondary)' }}>
                      Job <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="job"
                        name="job"
                        className="w-full appearance-none rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                        style={{
                          background: 'var(--bg-primary)',
                          boxShadow: 'var(--shadow-neumorph-inset)',
                          color: 'var(--text-primary)',
                          border: 'none',
                        }}
                        value={formData.job}
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

                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="guild_id" style={{ color: 'var(--text-secondary)' }}>
                      Pilih Guild <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="guild_id"
                        name="guild_id"
                        className="w-full appearance-none rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                        style={{
                          background: 'var(--bg-primary)',
                          boxShadow: 'var(--shadow-neumorph-inset)',
                          color: 'var(--text-primary)',
                          border: 'none',
                        }}
                        value={formData.guild_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>
                          -- Pilih Guild --
                        </option>
                        {guilds.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="guild_id" style={{ color: 'var(--text-secondary)' }}>
                      Pilih Guild Asal <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="guild_id"
                        name="guild_id"
                        className="w-full appearance-none rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                        style={{
                          background: 'var(--bg-primary)',
                          boxShadow: 'var(--shadow-neumorph-inset)',
                          color: 'var(--text-primary)',
                          border: 'none',
                        }}
                        value={formData.guild_id}
                        onChange={(e) => {
                          handleChange(e)
                          setSelectedUpdateId('')
                        }}
                        required
                      >
                        <option value="" disabled>
                          -- Pilih Guild --
                        </option>
                        {guilds.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="update_ign" style={{ color: 'var(--text-secondary)' }}>
                      Pilih Karakter (IGN) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="update_ign"
                        className="w-full appearance-none rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                        style={{
                          background: 'var(--bg-primary)',
                          boxShadow: 'var(--shadow-neumorph-inset)',
                          color: 'var(--text-primary)',
                          border: 'none',
                        }}
                        value={selectedUpdateId}
                        onChange={(e) => handleSelectCharacter(e.target.value)}
                        required
                        disabled={!formData.guild_id}
                      >
                        <option value="" disabled>
                          -- Pilih Karakter --
                        </option>
                        {filteredCharactersForUpdate.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="job" style={{ color: 'var(--text-secondary)' }}>
                      Edit Job (Jika Pindah Job) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="job"
                        name="job"
                        className="w-full appearance-none rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                        style={{
                          background: 'var(--bg-primary)',
                          boxShadow: 'var(--shadow-neumorph-inset)',
                          color: 'var(--text-primary)',
                          border: 'none',
                        }}
                        value={formData.job}
                        onChange={handleChange}
                        required
                        disabled={!selectedUpdateId}
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
                </>
              )}
            </div>
          </div>

          {/* Tab: General */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'general' })}>
            <div
              className="mb-6 text-[15px] font-light p-4 rounded-xl border-l-[3px]"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--text-primary)',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              Statistik dasar karaktermu.
            </div>
            {renderSection(GENERAL_STATS)}
          </div>

          {/* Tab: Quasi */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'quasi' })}>
            <div
              className="mb-6 text-[15px] font-light p-4 rounded-xl border-l-[3px]"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--text-primary)',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              Statistik lanjutan (Quasi). Isi dalam bentuk angka murni tanpa persen (Contoh: 99.5
              untuk 99.5%).
            </div>
            {renderSection(QUASI_STATS)}
          </div>

          {/* Tab: Special */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'special' })}>
            <div
              className="mb-6 text-[15px] font-light p-4 rounded-xl border-l-[3px]"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--text-primary)',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              Statistik tambahan dari equipment atau modifier khusus.
            </div>
            {renderSection(SPECIAL_STATS)}
          </div>

          <div
            className="mt-10 pt-8 border-t flex justify-end"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <button
              type="submit"
              className="rounded-xl py-4 px-10 text-base font-semibold font-sans cursor-pointer transition-all duration-300 border-none relative group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-sm)',
                color: 'var(--text-primary)',
              }}
              disabled={isSubmitting}
            >
              <span className="relative z-10">
                {isSubmitting
                  ? 'Mengirim...'
                  : formMode === 'add'
                    ? 'Kirim Data Stats'
                    : 'Update Data Stats'}
              </span>
              <span
                className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-neumorph)',
                }}
              ></span>
            </button>
          </div>
        </form>
      </div>

      <GlobalDialog
        isOpen={dialogResult.isOpen}
        onClose={() => setDialogResult({ isOpen: false, score: null })}
        title={formMode === 'add' ? 'Submission Berhasil!' : 'Update Berhasil!'}
      >
        <div
          className="text-center text-base mb-4 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {formMode === 'add'
            ? 'Data karaktermu telah disimpan dan menunggu verifikasi dari Guild Master.'
            : 'Data karaktermu berhasil diubah dan dikembalikan ke status Pending untuk diverifikasi ulang.'}
        </div>
        <div className="text-[56px] font-extrabold text-center bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 text-transparent bg-clip-text my-6 drop-shadow-[0_10px_30px_rgba(245,158,11,0.2)]">
          Score:{' '}
          {dialogResult.score !== null ? Math.round(dialogResult.score).toLocaleString() : 'N/A'}
        </div>
      </GlobalDialog>
    </>
  )
}
