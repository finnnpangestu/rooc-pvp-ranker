'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../auth/auth.module.css'
import { registerUser } from '../auth/registerAction'
import { GlobalDialog } from '../components/GlobalDialog'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      const result = await registerUser(formData)

      if (result.success) {
        setIsDialogOpen(true)
      } else {
        setError(result.error || 'Terjadi kesalahan')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi saat dialog ditutup
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    router.push('/login')
  }

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>Register Guild Master</h1>
        <p className={styles.subtitle}>Daftarkan diri sebagai pemimpin guild</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nama Lengkap / IGN</label>
            <input type="text" name="name" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input type="email" name="email" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              className={styles.input}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px', color: '#9ca3af' }}>
          Sudah punya akun?{' '}
          <Link href="/login" className={styles.link}>
            Login di sini
          </Link>
        </p>
      </div>

      <GlobalDialog isOpen={isDialogOpen} onClose={handleCloseDialog} title="Registrasi Berhasil!">
        <div style={{ color: '#d1d5db', lineHeight: '1.6' }}>
          Akun Guild Master kamu berhasil dibuat!
          <br />
          <br />
          Sekarang kamu bisa login menggunakan email dan password yang telah didaftarkan.
          <br />
          <br />
          <button
            onClick={handleCloseDialog}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Warna hijau success
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
            }}
          >
            Lanjut ke Login
          </button>
        </div>
      </GlobalDialog>
    </>
  )
}
