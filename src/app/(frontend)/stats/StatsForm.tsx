'use client'

import React, { useState } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import styles from './stats.module.css'
import Link from 'next/link'
import { JOBS } from '@/const/JobLabels'
import { GENERAL_STATS, QUASI_STATS, SPECIAL_STATS } from '@/const/StatsLabels'

interface Guild {
  id: string
  name: string
}

interface StatsFormProps {
  guilds: Guild[]
}

const DEFAULT_FORM = {
  name: '',
  job: '',
  guild_id: '',
}

export function StatsForm({ guilds }: StatsFormProps) {
  const [formData, setFormData] = useState<any>({ ...DEFAULT_FORM })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogResult, setDialogResult] = useState<{ isOpen: boolean; score: number | null }>({
    isOpen: false,
    score: null,
  })

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
        payloadData.guild_id = Number(payloadData.guild_id)
      }

      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadData),
      })

      const json = await res.json()

      if (res.ok && json.doc) {
        setDialogResult({
          isOpen: true,
          score: json.doc.pvp_score,
        })
        setFormData({ ...DEFAULT_FORM })
        setActiveTab('info')
      } else {
        const errorMsg = json.errors
          ? json.errors.map((err: any) => err.message).join(', ')
          : 'Unknown error'
        alert(`Gagal mengirim data: ${errorMsg}`)
        console.error('Payload Validation Error:', json)
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan jaringan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const [activeTab, setActiveTab] = useState('info')

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
          <p>
            Masukkan data stat karaktermu untuk berpartisipasi dalam rank PvP. Direkomendasikan
            tanpa menggunakan Buffs, Consumables, dan Buff Skills.
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
                {isSubmitting ? 'Mengirim...' : 'Kirim Data Stats'}
              </span>
              <span className={styles.btnGlow}></span>
            </button>
          </div>
        </form>
      </div>

      <GlobalDialog
        isOpen={dialogResult.isOpen}
        onClose={() => setDialogResult({ isOpen: false, score: null })}
        title="Submission Berhasil!"
      >
        <div className={styles.scoreDesc}>
          Data karaktermu telah disimpan dan menunggu verifikasi dari Guild Master.
        </div>
        <div className={styles.scoreText}>
          Score:{' '}
          {dialogResult.score !== null ? Math.round(dialogResult.score).toLocaleString() : 'N/A'}
        </div>
      </GlobalDialog>
    </>
  )
}
