'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { JOBS } from '@/const/JobLabels'
import { GENERAL_STATS, QUASI_STATS, SPECIAL_STATS } from '@/const/StatsLabels'
import { updateCharacterStats } from '@/actions/stats/updateCharacter'
import clsx from 'clsx'

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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-2.5">
          <label htmlFor={field.name}>
            {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
          </label>
          <input
            id={field.name}
            name={field.name}
            type="number"
            step="any"
            className="bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] focus:bg-black/70 focus:-translate-y-[1px] placeholder-gray-600"
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
      <div className="max-w-[800px] my-10 mx-auto p-10 bg-[#0f0f14]/70 backdrop-blur-md border border-white/5 rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] text-white font-sans relative overflow-hidden">
        <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="inline-block py-1.5 px-3 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[13px] font-semibold uppercase tracking-[1px] rounded-full mb-4">
            ROOC Ranker
          </div>
          <h1>Submit Stats</h1>

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
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '10px',
                padding: '4px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <button
                type="button"
                onClick={() => handleModeChange('add')}
                className={clsx(
                  'flex-1 bg-transparent border-none text-gray-400 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap hover:text-gray-200 hover:bg-white/5',
                  {
                    'bg-indigo-500/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/30 hover:bg-indigo-500/25':
                      formMode === 'add',
                  },
                )}
              >
                Tambah Char
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('update')}
                className={clsx(
                  'flex-1 bg-transparent border-none text-gray-400 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap hover:text-gray-200 hover:bg-white/5',
                  {
                    'bg-indigo-500/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/30 hover:bg-indigo-500/25':
                      formMode === 'update',
                  },
                )}
              >
                Update Char
              </button>
            </div>
          </div>

          <p>
            {formMode === 'add'
              ? 'Masukkan data stat karaktermu untuk berpartisipasi dalam rank PvP.'
              : 'Pilih karaktermu untuk memperbarui data stats terbaru (Mereset Verifikasi).'}
          </p>

          <p style={{ marginTop: '8px' }}>
            <Link
              href="/leaderboards"
              style={{
                color: '#818cf8',
                textDecoration: 'none',
                fontWeight: 600,
                borderBottom: '1px solid rgba(99,102,241,0.3)',
                padding: '4px 0',
              }}
            >
              Lihat Leaderboard →
            </Link>
          </p>
        </div>

        <div className="flex gap-2 bg-black/30 p-2 rounded-2xl mb-8 relative z-10 border border-white/5 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const isDisabled = formMode === 'update' && !selectedUpdateId && tab.id !== 'info'
            return (
              <button
                key={tab.id}
                type="button"
                className={clsx(
                  'flex-1 bg-transparent border-none text-gray-400 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap hover:text-gray-200 hover:bg-white/5',
                  {
                    'bg-indigo-500/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/30 hover:bg-indigo-500/25':
                      activeTab === tab.id,
                    'opacity-50 cursor-not-allowed': isDisabled,
                  },
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
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
              {formMode === 'add' ? (
                <>
                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="name">
                      IGN (In-Game Name) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] focus:bg-black/70 focus:-translate-y-[1px] placeholder-gray-600"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Nama Karakter"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="job">
                      Job <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="job"
                        name="job"
                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] focus:bg-black/70 focus:-translate-y-[1px]"
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
                    <label htmlFor="guild_id">
                      Pilih Guild <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="guild_id"
                        name="guild_id"
                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] focus:bg-black/70 focus:-translate-y-[1px]"
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
                    <label htmlFor="guild_id">
                      Pilih Guild Asal <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="guild_id"
                        name="guild_id"
                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] focus:bg-black/70 focus:-translate-y-[1px]"
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
                    <label htmlFor="update_ign">
                      Pilih Karakter (IGN) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="update_ign"
                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] focus:bg-black/70 focus:-translate-y-[1px]"
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
                    <label htmlFor="job">
                      Edit Job (Jika Pindah Job) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                      <select
                        id="job"
                        name="job"
                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] focus:bg-black/70 focus:-translate-y-[1px]"
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
            <div className="text-gray-400 mb-6 text-[15px] font-light p-4 bg-white/5 rounded-xl border-l-[3px] border-indigo-500">
              Statistik dasar karaktermu.
            </div>
            {renderSection(GENERAL_STATS)}
          </div>

          {/* Tab: Quasi */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'quasi' })}>
            <div className="text-gray-400 mb-6 text-[15px] font-light p-4 bg-white/5 rounded-xl border-l-[3px] border-indigo-500">
              Statistik lanjutan (Quasi). Isi dalam bentuk angka murni tanpa persen (Contoh: 99.5
              untuk 99.5%).
            </div>
            {renderSection(QUASI_STATS)}
          </div>

          {/* Tab: Special */}
          <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'special' })}>
            <div className="text-gray-400 mb-6 text-[15px] font-light p-4 bg-white/5 rounded-xl border-l-[3px] border-indigo-500">
              Statistik tambahan dari equipment atau modifier khusus.
            </div>
            {renderSection(SPECIAL_STATS)}
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              className="relative bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border border-white/10 rounded-xl py-4 px-10 text-base font-semibold font-sans cursor-pointer transition-all duration-300 overflow-hidden shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] hover:-translate-y-[2px] hover:shadow-[0_15px_35px_-5px_rgba(79,70,229,0.6)] hover:border-white/20 active:translate-y-[1px] disabled:bg-gray-700 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none disabled:border-transparent group"
              disabled={isSubmitting}
            >
              <span className="relative z-10">
                {isSubmitting
                  ? 'Mengirim...'
                  : formMode === 'add'
                    ? 'Kirim Data Stats'
                    : 'Update Data Stats'}
              </span>
              <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
            </button>
          </div>
        </form>
      </div>

      <GlobalDialog
        isOpen={dialogResult.isOpen}
        onClose={() => setDialogResult({ isOpen: false, score: null })}
        title={formMode === 'add' ? 'Submission Berhasil!' : 'Update Berhasil!'}
      >
        <div className="text-center text-gray-300 text-base mb-4 leading-relaxed">
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
