'use client'

import React, { useState } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import styles from './stats.module.css'
import Link from 'next/link'
import { JOBS } from '@/const/JobLabels'
import { GENERAL_STATS, QUASI_STATS, SPECIAL_STATS } from '@/const/StatsLabels'
import { updateCharacterStats } from '@/actions/stats/updateCharacter'

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
    setFormMode(mode)
    setFormData({ ...DEFAULT_FORM })
    setSelectedUpdateId('')
    setActiveTab('info')
  }

  const handleSelectCharacter = (charId: string) => {
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
    <div className={styles.grid}>
      {fields.map((field) => (
        <div key={field.name} className={styles.field}>
          <label htmlFor={field.name}>
            {field.label} {field.required && <span className={styles.asterisk}>*</span>}
          </label>
          <input
            id={field.name}
            name={field.name}
            type="number"
            step="any"
            className={styles.input}
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
      <div className={styles.container}>
        <div className={styles.glowBg}></div>

        <div className={styles.header}>
          <div className={styles.badge}>ROOC Ranker</div>
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
                className={`${styles.tabBtn} ${formMode === 'add' ? styles.activeTab : ''}`}
              >
                Tambah Char
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('update')}
                className={`${styles.tabBtn} ${formMode === 'update' ? styles.activeTab : ''}`}
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

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div
            className={`${styles.tabContent} ${activeTab === 'info' ? styles.activeContent : ''}`}
          >
            <div className={styles.grid}>
              {/* === MODE: TAMBAH CHAR === */}
              {formMode === 'add' ? (
                <>
                  <div className={styles.field}>
                    <label htmlFor="name">
                      IGN (In-Game Name) <span className={styles.asterisk}>*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className={styles.input}
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Nama Karakter"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="job">
                      Job <span className={styles.asterisk}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="job"
                        name="job"
                        className={styles.select}
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

                  <div className={styles.field}>
                    <label htmlFor="guild_id">
                      Pilih Guild <span className={styles.asterisk}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="guild_id"
                        name="guild_id"
                        className={styles.select}
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
                /* === MODE: UPDATE CHAR === */
                <>
                  <div className={styles.field}>
                    <label htmlFor="guild_id">
                      Pilih Guild Asal <span className={styles.asterisk}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="guild_id"
                        name="guild_id"
                        className={styles.select}
                        value={formData.guild_id}
                        onChange={(e) => {
                          handleChange(e)
                          setSelectedUpdateId('') // Reset pilihan karakter ketika ganti guild
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

                  <div className={styles.field}>
                    <label htmlFor="update_ign">
                      Pilih Karakter (IGN) <span className={styles.asterisk}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="update_ign"
                        className={styles.select}
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

                  <div className={styles.field}>
                    <label htmlFor="job">
                      Edit Job (Jika Pindah Job) <span className={styles.asterisk}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="job"
                        name="job"
                        className={styles.select}
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

          <div
            className={`${styles.tabContent} ${activeTab === 'general' ? styles.activeContent : ''}`}
          >
            <div className={styles.sectionDesc}>Statistik dasar karaktermu.</div>
            {renderSection(GENERAL_STATS)}
          </div>

          <div
            className={`${styles.tabContent} ${activeTab === 'quasi' ? styles.activeContent : ''}`}
          >
            <div className={styles.sectionDesc}>
              Statistik lanjutan (Quasi). Isi dalam bentuk angka murni tanpa persen (Contoh: 99.5
              untuk 99.5%).
            </div>
            {renderSection(QUASI_STATS)}
          </div>

          <div
            className={`${styles.tabContent} ${activeTab === 'special' ? styles.activeContent : ''}`}
          >
            <div className={styles.sectionDesc}>
              Statistik tambahan dari equipment atau modifier khusus.
            </div>
            {renderSection(SPECIAL_STATS)}
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              <span className={styles.btnText}>
                {isSubmitting
                  ? 'Mengirim...'
                  : formMode === 'add'
                    ? 'Kirim Data Stats'
                    : 'Update Data Stats'}
              </span>
              <span className={styles.btnGlow}></span>
            </button>
          </div>
        </form>
      </div>

      <GlobalDialog
        isOpen={dialogResult.isOpen}
        onClose={() => setDialogResult({ isOpen: false, score: null })}
        title={formMode === 'add' ? 'Submission Berhasil!' : 'Update Berhasil!'}
      >
        <div className={styles.scoreDesc}>
          {formMode === 'add'
            ? 'Data karaktermu telah disimpan dan menunggu verifikasi dari Guild Master.'
            : 'Data karaktermu berhasil diubah dan dikembalikan ke status Pending untuk diverifikasi ulang.'}
        </div>
        <div className={styles.scoreText}>
          Score:{' '}
          {dialogResult.score !== null ? Math.round(dialogResult.score).toLocaleString() : 'N/A'}
        </div>
      </GlobalDialog>
    </>
  )
}
