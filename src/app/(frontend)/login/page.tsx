'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../auth/auth.module.css'
import { GlobalDialog } from '../components/GlobalDialog'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.message || 'Email atau password salah')
      }

      setIsDialogOpen(true)
      setIsLoading(false)
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>Login Guild Master</h1>
        <p className={styles.subtitle}>Masuk untuk mengelola guild dan roster</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px', color: '#9ca3af' }}>
          Belum punya akun?{' '}
          <Link href="/register" className={styles.link}>
            Daftar di sini
          </Link>
        </p>
      </div>

      <GlobalDialog isOpen={isDialogOpen} onClose={handleCloseDialog} title="Login Berhasil!">
        <div style={{ color: '#d1d5db', lineHeight: '1.6' }}>
          Selamat datang kembali! Autentikasi berhasil.
          <br />
          <br />
          <button
            onClick={handleCloseDialog}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Lanjut ke Dashboard
          </button>
        </div>
      </GlobalDialog>
    </>
  )
}
