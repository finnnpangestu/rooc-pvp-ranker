'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GlobalDialog } from '../components/GlobalDialog'
import { loginUser } from '@/actions/auth/loginUser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      const res = await loginUser(formData)

      if (!res.success) {
        throw new Error(res.message)
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
      <div className="max-w-[400px] my-20 mx-auto p-10 bg-[#0f0f14]/70 backdrop-blur-md border border-white/5 rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] text-white font-sans text-center">
        <h1 className="mb-2 text-[28px] font-bold bg-gradient-to-br from-white to-[#a0a0a0] text-transparent bg-clip-text">
          Login Guild Master
        </h1>
        <p className="text-gray-400 text-sm mb-6">Masuk untuk mengelola guild dan roster</p>

        {error && (
          <div className="text-red-300 bg-red-500/10 p-3 rounded-lg text-[13px] mb-4 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4 text-left">
            <label className="block text-[13px] text-gray-400 mb-2 font-medium">Email</label>
            <input
              type="email"
              name="email"
              className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white font-sans transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:bg-black/50 focus:ring-2 focus:ring-indigo-500/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4 text-left">
            <label className="block text-[13px] text-gray-400 mb-2 font-medium">Password</label>
            <input
              type="password"
              name="password"
              className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white font-sans transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:bg-black/50 focus:ring-2 focus:ring-indigo-500/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none p-[14px] rounded-lg font-semibold font-sans cursor-pointer mt-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_10px_20px_-5px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-400">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="text-indigo-400 no-underline font-medium hover:underline"
          >
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
              fontFamily: 'Outfit, sans-serif',
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
