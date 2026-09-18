'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from './Button'
import { Badge } from './Badge'
import { logoutUser } from '@/actions/auth/logoutUser'
import { useTheme } from './ThemeProvider'
import { TourProvider, useTour } from './TourProvider'
import type { Guild } from '@/types'

function DashboardShellContent({
  children,
  guild,
}: {
  children: React.ReactNode
  guild: Guild | null | undefined
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Party Setup': true,
  })
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

  const { startTour } = useTour()

  const isActive = (path: string) => pathname === path
  const hasGuild = !!guild
  const isDark = theme === 'dark'

  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      paths: ['M4 4h16v16H4z', 'M9 9h6v6H9z'],
    },
    {
      label: 'Party Setup',
      paths: [
        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
        'M 5 7 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0',
        'M23 21v-2a4 4 0 0 0-3-3.87',
        'M16 3.13a4 4 0 0 1 0 7.75',
      ],
      subItems: [
        { path: '/guild-league', label: 'Guild League' },
        { path: '/woe-setup', label: 'WoE Setup' },
      ],
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
    {
      path: '/report-woe',
      label: 'Report WoE',
      paths: [
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
        'M14 2v6h6',
        'M16 13H8',
        'M16 17H8',
      ],
    },
    {
      path: '/resources',
      label: 'Resources',
      paths: [
        'M20 7h-4.5A2.5 2.5 0 0 0 13 9.5v9a2.5 2.5 0 0 0 2.5 2.5H20a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z',
        'M4 7h4.5A2.5 2.5 0 0 1 11 9.5v9A2.5 2.5 0 0 1 8.5 21H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z',
        'M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3',
      ],
    },
    {
      path: '/member',
      label: 'Member List',
      paths: [
        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
        'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
        'M23 21v-2a4 4 0 0 0-3-3.87',
        'M16 3.13a4 4 0 0 1 0 7.75',
      ],
    },
  ]

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 overflow-x-hidden">
      <div
        className={`text-[11px] font-semibold mb-2.5 px-3 uppercase tracking-wider transition-opacity duration-200 text-zinc-400 dark:text-zinc-500 ${
          !isSidebarOpen && !isMobile ? 'opacity-0 text-center' : 'opacity-100'
        }`}
      >
        {isSidebarOpen || isMobile ? 'Main Menu' : '•••'}
      </div>

      {menuItems.map((item, idx) => {
        if (item.subItems) {
          const isGroupExpanded = expandedGroups[item.label]
          const hasActiveSub = item.subItems.some((sub) => isActive(sub.path))

          return (
            <div key={idx} className="flex flex-col">
              <button
                onClick={() => {
                  if (!isSidebarOpen && !isMobile) setIsSidebarOpen(true)
                  setExpandedGroups((prev) => ({ ...prev, [item.label]: !isGroupExpanded }))
                }}
                title={item.label}
                className={`w-full flex items-center justify-between ${
                  isSidebarOpen || isMobile ? 'px-3.5' : 'px-0 justify-center'
                } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                  hasActiveSub && !isGroupExpanded
                    ? 'bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-white font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/4 dark:hover:bg-white/6'
                }`}
              >
                <div className="flex items-center">
                  <svg
                    className="shrink-0"
                    width="18"
                    height="18"
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
                    className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${
                      !isSidebarOpen && !isMobile ? 'opacity-0 hidden' : 'opacity-100 block'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {(isSidebarOpen || isMobile) && (
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isGroupExpanded ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                )}
              </button>

              {/* Sub Items */}
              {(isSidebarOpen || isMobile) && isGroupExpanded && (
                <div className="mt-1 flex flex-col gap-1 pl-9 pr-2">
                  {item.subItems.map((sub) => {
                    const subActive = isActive(sub.path)
                    return (
                      <button
                        key={sub.path}
                        onClick={() => {
                          router.push(sub.path)
                          if (isMobile) setIsMobileMenuOpen(false)
                        }}
                        className={`w-full text-left py-2 px-3 rounded-lg text-[13px] transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                          subActive
                            ? 'bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-white font-semibold'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/3 dark:hover:bg-white/5'
                        }`}
                      >
                        {sub.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        // Normal Item
        const active = isActive(item.path!)
        return (
          <button
            key={item.path}
            onClick={() => {
              router.push(item.path!)
              if (isMobile) setIsMobileMenuOpen(false)
            }}
            title={item.label}
            className={`w-full flex items-center ${
              isSidebarOpen || isMobile ? 'px-3.5 justify-start' : 'px-0 justify-center'
            } py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
              active
                ? 'bg-white dark:bg-white/10 text-zinc-900 dark:text-white font-semibold shadow-sm border border-black/5 dark:border-white/10'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/4 dark:hover:bg-white/6'
            }`}
          >
            <svg
              className="shrink-0"
              width="18"
              height="18"
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
              className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${
                !isSidebarOpen && !isMobile ? 'opacity-0 hidden' : 'opacity-100 block'
              }`}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )

  const renderBottomControls = (isMobile = false) => (
    <div className="p-3 border-t border-black/5 dark:border-white/10 space-y-1.5">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`w-full flex items-center ${
          isSidebarOpen || isMobile ? 'px-3.5 justify-start' : 'px-0 justify-center'
        } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/4 dark:hover:bg-white/6 active:scale-[0.98]`}
      >
        {isDark ? (
          <>
            <svg
              className="shrink-0"
              width="18"
              height="18"
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
            <span
              className={`ml-3 whitespace-nowrap ${
                !isSidebarOpen && !isMobile ? 'hidden' : 'block'
              }`}
            >
              Light Mode
            </span>
          </>
        ) : (
          <>
            <svg
              className="shrink-0"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span
              className={`ml-3 whitespace-nowrap ${
                !isSidebarOpen && !isMobile ? 'hidden' : 'block'
              }`}
            >
              Dark Mode
            </span>
          </>
        )}
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={isPending}
        className={`w-full flex items-center ${
          isSidebarOpen || isMobile ? 'px-3.5 justify-start' : 'px-0 justify-center'
        } py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer select-none text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active:scale-[0.98] disabled:opacity-50`}
      >
        {isPending ? (
          <svg
            className="animate-spin shrink-0"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg
            className="shrink-0"
            width="18"
            height="18"
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
          className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${
            !isSidebarOpen && !isMobile ? 'opacity-0 hidden' : 'opacity-100 block'
          }`}
        >
          {isPending ? 'Logging out...' : 'Log Out'}
        </span>
      </button>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-200 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* --- DESKTOP SIDEBAR (macOS Style Frosted Sidebar) --- */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } hidden md:flex flex-col z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] relative apple-glass bg-white/70 dark:bg-zinc-900/60 border-r border-black/5 dark:border-white/10`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 z-30 bg-white dark:bg-zinc-800 shadow-sm border border-black/8 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer active:scale-90"
          aria-label="Toggle Sidebar"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Logo Header */}
        <div className="h-16 flex items-center justify-center border-b border-black/5 dark:border-white/10 px-4">
          <div className="flex items-center gap-3 font-semibold text-base tracking-tight w-full overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
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
              className={`transition-opacity duration-200 whitespace-nowrap font-bold tracking-tight text-zinc-900 dark:text-white ${
                !isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100 block'
              }`}
            >
              Guild Ranker
            </span>
          </div>
        </div>

        {/* Navigation */}
        {renderNavLinks(false)}

        {/* Bottom Controls */}
        {renderBottomControls(false)}
      </aside>

      {/* --- MOBILE DRAWER (iOS Style Sheet) --- */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[80vw] h-full apple-glass-heavy bg-white/90 dark:bg-zinc-900/90 shadow-2xl flex flex-col animate-slideIn border-r border-black/5 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 flex items-center justify-between px-5 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                  </svg>
                </div>
                <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">
                  Guild Ranker
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-500"
              >
                &times;
              </button>
            </div>
            {renderNavLinks(true)}
            {renderBottomControls(true)}
          </div>
        </div>
      )}

      {/* --- MAIN VIEWPORT --- */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* FLOATING TRANSLUCENT HEADER */}
        <header className="h-16 px-5 sm:px-8 sticky top-0 z-30 flex items-center justify-between apple-glass bg-white/75 dark:bg-zinc-950/75 border-b border-black/5 dark:border-white/10 transition-colors">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              {hasGuild ? guild.name : 'No Guild Yet'}
            </h1>
            {hasGuild && <Badge variant="info">Guild Master Panel</Badge>}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="amber"
              size="sm"
              onClick={startTour}
              className="!py-2 !px-3.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              <span className="hidden sm:inline">Page Tour</span>
            </Button>

            {hasGuild && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/stats?guildId=${guild.id}`)}
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
                <span>Add Stats Member</span>
              </Button>
            )}
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-8 relative">
          {children}

          {/* FOOTER */}
          <footer className="mt-16 pt-6 border-t border-black/5 dark:border-white/10 text-center w-full">
            <p className="text-xs font-medium flex items-center justify-center gap-1.5 text-zinc-400 dark:text-zinc-500">
              <span>Crafted with care by</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Finnn
              </span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}

export function DashboardShell({
  children,
  guild,
}: {
  children: React.ReactNode
  guild: Guild | null | undefined
}) {
  return (
    <TourProvider>
      <DashboardShellContent children={children} guild={guild} />
    </TourProvider>
  )
}
