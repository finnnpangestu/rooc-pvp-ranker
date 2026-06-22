'use client'

import React, { useState } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import styles from './stats.module.css'

interface Guild {
  id: string
  name: string
}

interface StatsFormProps {
  guilds: Guild[]
}

const JOBS = [
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
]

const GENERAL_STATS = [
  { name: 'max_hp', label: 'HP', required: true },
  { name: 'patk', label: 'PATK' },
  { name: 'matk', label: 'MATK' },
  { name: 'pdef', label: 'PDEF' },
  { name: 'mdef', label: 'MDEF' },
  { name: 'refine_patk', label: 'Refine PATK' },
  { name: 'refine_matk', label: 'Refine MATK' },
  { name: 'refine_pdef', label: 'Refine PDEF' },
  { name: 'refine_mdef', label: 'Refine MDEF' },
  { name: 'hit', label: 'HIT' },
  { name: 'flee', label: 'FLEE' },
]

const QUASI_STATS = [
  { name: 'aspd', label: 'ASPD (%)' },
  { name: 'mspd', label: 'Movement SPD (%)' },
  { name: 'variable_cast', label: 'Variable CT (%)' },
  { name: 'fixed_cast', label: 'Fixed CT (%)' },
  { name: 'healing_done', label: 'Healing Done (%)' },
  { name: 'healing_taken', label: 'Healing Taken (%)' },
  { name: 'critical', label: 'CRIT' },
  { name: 'critical_damage', label: 'CRIT DMG (%)' },
  { name: 'critical_reduction', label: 'CRIT RES' },
  { name: 'critical_damage_reduction', label: 'CRIT DMG RES (%)' },
  { name: 'pdmg', label: 'PDMG (%)' },
  { name: 'mdmg', label: 'MDMG (%)' },
  { name: 'pdmg_reduction', label: 'PDMG.R (%)' },
  { name: 'mdmg_reduction', label: 'MDMG.R (%)' },
  { name: 'ignore_pdef', label: 'Ignore PDEF' },
  { name: 'ignore_mdef', label: 'Ignore MDEF' },
  { name: 'pdmg_bonus', label: 'PDMG Bonus' },
  { name: 'mdmg_bonus', label: 'MDMG Bonus' },
  { name: 'pvp_dmg_bonus', label: 'PvP DMG Bonus' },
  { name: 'pvp_dmg_reduction', label: 'PvP DMG Reduction' },
]

const SPECIAL_STATS = [
  { name: 'max_hp_percentage', label: 'Max HP Multiplier (%)' },
  { name: 'equipment_patk_percentage', label: 'Equipment PATK (%)' },
  { name: 'equipment_matk_percentage', label: 'Equipment MATK (%)' },
  { name: 'equipment_pdef_percentage', label: 'Equipment PDEF (%)' },
  { name: 'equipment_mdef_percentage', label: 'Equipment MDEF (%)' },
  { name: 'dmg_vs_demi_human', label: 'DMG vs Demi-Human (%)' },
  { name: 'dmg_reduction_demi_human', label: 'DMG Reduction vs Demi-Human (%)' },
  { name: 'dmg_vs_medium', label: 'DMG vs Medium Enemies (%)' },
  { name: 'dmg_reduction_medium', label: 'DMG Reduction vs Medium Enemies (%)' },
  { name: 'neutral_dmg_bonus', label: 'Neutral DMG Bonus (%)' },
  { name: 'neutral_dmg_reduction', label: 'Neutral DMG Reduction (%)' },
]

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
          <p>Masukkan data stat karaktermu untuk berpartisipasi dalam rank PvP.</p>
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
