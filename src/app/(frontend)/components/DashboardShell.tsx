'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from './Button'
import { Badge } from './Badge'
import { logoutUser } from '@/actions/auth/logoutUser'
import { ThemeProvider, useTheme } from './ThemeProvider'

function DashboardShellContent({ children, guild }: { children: React.ReactNode; guild: any }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser()
      router.refresh()
    })
  }

  const isActive = (path: string) => pathname === path
  const hasGuild = !!guild
  const isDark = theme === 'dark'

  // Menu items dengan icon sebagai array of paths (lebih aman)
  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      paths: ['M4 4h16v16H4z', 'M9 9h6v6H9z'],
    },
    {
      path: '/guild-league',
      label: 'Guild League Setup',
      paths: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M12 8v8', 'M8 12h8'],
    },
    {
      path: '/report-gl',
      label: 'Report GL',
      paths: [
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
        'M14 2v6h6',
        'M16 13H8',
        'M16 17H8',
      ],
    },
  ]

  return (
    <div
      className="flex h-screen overflow-hidden font-sans transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* --- SIDEBAR --- */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } hidden md:flex flex-col z-20 transition-all duration-300 ease-in-out relative`}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-neumorph)',
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-30"
          style={{
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-neumorph-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Logo */}
        <div
          className="h-16 flex items-center justify-center border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3 font-bold text-lg tracking-wide w-full px-4 overflow-hidden">
            <div
              className="w-8 h-8 shrink-0 rounded flex items-center justify-center"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-sm)',
                color: 'var(--text-primary)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              </svg>
            </div>
            <span
              className={`transition-opacity duration-300 whitespace-nowrap ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100 block'}`}
              style={{ color: 'var(--text-primary)' }}
            >
              Guild Management
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-2 overflow-x-hidden">
          <div
            className={`text-xs font-semibold mb-3 px-2 uppercase tracking-wider transition-opacity duration-300 ${!isSidebarOpen ? 'opacity-0 text-center' : 'opacity-100'}`}
            style={{ color: 'var(--text-muted)' }}
          >
            {isSidebarOpen ? 'Main Menu' : '•••'}
          </div>

          {menuItems.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                title={item.label}
                className={`w-full flex items-center ${isSidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center'} py-3 rounded-lg text-sm font-medium transition-all cursor-pointer`}
                style={{
                  background: active ? 'var(--bg-primary)' : 'transparent',
                  boxShadow: active ? 'var(--shadow-neumorph-inset)' : 'none',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <svg
                  className="shrink-0"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.paths.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </svg>
                <span
                  className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100 block'}`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Logout & Theme Toggle */}
        <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
          {/* Logout button - style seperti menu item */}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className={`w-full flex items-center ${isSidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center'} py-3 rounded-lg text-sm font-medium transition-all cursor-pointer`}
            style={{
              background: 'transparent',
              color: '#ef4444', // warna merah
              boxShadow: 'none',
            }}
          >
            {isPending ? (
              <svg
                className="animate-spin shrink-0"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                className="shrink-0"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            )}
            <span
              className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100 block'}`}
            >
              {isPending ? 'Logging out...' : 'Logout'}
            </span>
          </button>

          {/* Theme Toggle - style seperti menu item */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center ${isSidebarOpen ? 'px-3 justify-start' : 'px-0 justify-center'} py-3 rounded-lg text-sm font-medium transition-all cursor-pointer`}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              boxShadow: 'none',
            }}
          >
            {isDark ? (
              <>
                <svg
                  className="shrink-0"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span className={`ml-3 whitespace-nowrap ${!isSidebarOpen ? 'hidden' : ''}`}>
                  Light Mode
                </span>
              </>
            ) : (
              <>
                <svg
                  className="shrink-0"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span className={`ml-3 whitespace-nowrap ${!isSidebarOpen ? 'hidden' : ''}`}>
                  Dark Mode
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0 z-10 transition-all duration-300">
        {/* HEADER */}
        <header
          className="h-16 flex items-center justify-between px-8 border-b"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph-sm)',
          }}
        >
          <div className="flex items-center gap-4">
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {hasGuild ? guild.name : 'Belum ada guild'}
            </h1>
            {hasGuild && <Badge variant="info">Guild Master Panel</Badge>}
          </div>
          <div className="flex items-center gap-3">
            {hasGuild && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/stats')}
                className="!py-2 !px-4"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Stats Member
              </Button>
            )}
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main
          className="flex-1 overflow-y-auto p-8 relative"
          style={{
            background: 'var(--bg-primary)',
            margin: '0 8px 8px 8px',
            borderRadius: '0 0 16px 16px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

// Wrapper dengan ThemeProvider
export function DashboardShell({ children, guild }: { children: React.ReactNode; guild: any }) {
  return (
    <ThemeProvider>
      <DashboardShellContent children={children} guild={guild} />
    </ThemeProvider>
  )
}
