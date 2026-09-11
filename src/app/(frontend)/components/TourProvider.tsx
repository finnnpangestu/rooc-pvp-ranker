'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useTheme } from './ThemeProvider'

interface TourContextType {
  startTour: () => void
}

const TourContext = createContext<TourContextType | null>(null)

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const startTour = () => {
    let steps: DriveStep[] = []

    if (pathname === '/') {
      steps = [
        {
          element: '#tour-dashboard-stats',
          popover: {
            title: 'Statistik Guild',
            description:
              'Di sini Anda dapat melihat total member, skor PVP keseluruhan, dan antrean verifikasi.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-dashboard-league',
          popover: {
            title: 'Performa Guild League',
            description: 'Pantau riwayat kemenangan dan kekalahan Guild League di sini.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-dashboard-performers',
          popover: {
            title: 'Top 5 Performers',
            description: 'Daftar 5 pemain dengan skor PVP tertinggi dalam guild.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#tour-dashboard-woe',
          popover: {
            title: 'Performa WoE',
            description:
              'Pantau grafik peringkat (rank) Guild dalam 5 pertandingan War of Emperium terakhir.',
            side: 'top',
            align: 'start',
          },
        },
      ]
    } else if (pathname === '/guild-league') {
      steps = [
        {
          element: '#tour-gl-header',
          popover: {
            title: 'Guild League Management',
            description:
              'Halaman ini digunakan untuk merancang formasi 8 Elite Party (Top 40) dan sisanya ke Sub Party.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-gl-generate-elite',
          popover: {
            title: 'Generate Elite Party',
            description:
              'Klik ini untuk otomatis memilih 40 pemain terkuat dan membaginya ke 8 party.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-gl-generate-sub',
          popover: {
            title: 'Generate Sub Party',
            description:
              'Setelah Elite terbentuk, sisa member bisa otomatis dimasukkan ke Sub Party.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-gl-bench',
          popover: {
            title: 'Bench Players',
            description:
              'Pemain yang tidak mendapatkan party akan muncul di sini. Anda bisa me-drag dan drop mereka ke slot kosong.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-gl-save',
          popover: {
            title: 'Simpan Setup',
            description: 'Jangan lupa menyimpan setup Anda setelah formasi terbentuk dengan baik!',
            side: 'top',
            align: 'end',
          },
        },
      ]
    } else if (pathname === '/woe-setup') {
      steps = [
        {
          element: '#tour-woe-header',
          popover: {
            title: 'WoE Setup',
            description:
              'Atur alokasi party dan pemain untuk War of Emperium di kastil-kastil Anda.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-woe-add-castle',
          popover: {
            title: 'Tambah Raid',
            description: 'Buat pengaturan untuk Raid baru.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#tour-woe-list',
          popover: {
            title: 'Daftar Formasi Raid',
            description:
              'Di sini Anda dapat melihat dan mengelola formasi raid untuk setiap kastil yang sudah Anda buat.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-woe-benched',
          popover: {
            title: 'Pemain Bench',
            description:
              'Pemain yang belum dialokasikan ke party mana pun akan muncul di sini. Anda bisa me-drag and drop mereka ke formasi yang ada.',
            side: 'left',
            align: 'start',
          },
        },
      ]
    } else if (pathname === '/report-gl') {
      steps = [
        {
          element: '#tour-report-gl',
          popover: {
            title: 'Report Guild League',
            description:
              'Laporan pertandingan dan performa individual anggota akan muncul di sini.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-report-list',
          popover: {
            title: 'Daftar Laporan',
            description:
              'Kumpulan laporan Guild League sebelumnya. Anda bisa mengklik tiap laporan untuk melihat detail performa anggota.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-report-ranking',
          popover: {
            title: 'Ranking Keseluruhan',
            description:
              'Melihat anggota dengan performa (poin) terbaik di Guild League secara keseluruhan.',
            side: 'left',
            align: 'start',
          },
        },
      ]
    } else if (pathname === '/resources') {
      steps = [
        {
          element: '#tour-resources',
          popover: {
            title: 'Resources',
            description: 'Kelola resource/material guild Anda dari halaman ini.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-resource-list',
          popover: {
            title: 'Daftar Resource',
            description:
              'Di sini Anda bisa melihat stok terkini dari masing-masing jenis resource (misalnya Mythic, S, A, dll).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-resource-history',
          popover: {
            title: 'Riwayat Distribusi',
            description:
              'Tabel riwayat distribusi ke member. Anda dapat mengecek status (Pending, Approved, Claimed) dan melakukan bulk approve.',
            side: 'top',
            align: 'start',
          },
        },
      ]
    } else if (pathname === '/member') {
      steps = [
        {
          element: '#tour-member-list',
          popover: {
            title: 'Daftar Member',
            description: 'Di sini Anda dapat melihat seluruh member yang ada di Guild Anda.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-member-pagination',
          popover: {
            title: 'Pengaturan Tampilan',
            description:
              'Anda bisa menyesuaikan jumlah member yang tampil per halaman melalui dropdown ini.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#tour-member-action',
          popover: {
            title: 'Aksi Karakter',
            description:
              'Gunakan tombol Edit untuk memperbarui stats dari karakter member secara langsung.',
            side: 'left',
            align: 'start',
          },
        },
      ]
    } else if (pathname === '/report-woe') {
      steps = [
        {
          element: '#tour-woe-report-header',
          popover: {
            title: 'Report WoE',
            description: 'Di sini Anda dapat membuat dan melihat riwayat laporan War of Emperium.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-woe-report-list',
          popover: {
            title: 'Riwayat Laporan WoE',
            description:
              'Daftar riwayat laporan WoE sebelumnya. Anda bisa mengklik tiap laporan untuk melihat detail kehadiran anggota dan perpindahan party.',
            side: 'right',
            align: 'start',
          },
        },
      ]
    }

    if (steps.length === 0) {
      alert('Panduan belum tersedia untuk halaman ini.')
      return
    }

    // Driver JS Config
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: steps,
      popoverClass: isDark ? 'driver-theme-dark' : 'driver-theme-light',
    })

    driverObj.drive()
  }

  // Adding custom styles for dark/light themes inside driver.js
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      /* Neumorphism Theme for Driver.js */
      .driver-popover {
        background-color: var(--bg-card) !important;
        color: var(--text-primary) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 16px !important;
        box-shadow: var(--shadow-neumorph-lg) !important;
        padding: 20px !important;
      }
      .driver-popover-title {
        color: var(--text-primary) !important;
        font-weight: 700 !important;
        font-size: 18px !important;
        margin-bottom: 12px !important; /* Adds space between title and description */
      }
      .driver-popover-description {
        color: var(--text-secondary) !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      .driver-popover-footer {
        margin-top: 16px !important;
      }
      .driver-popover-footer button {
        background-color: var(--bg-secondary) !important;
        color: var(--text-primary) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 8px !important;
        box-shadow: var(--shadow-neumorph) !important;
        text-shadow: none !important;
        padding: 6px 16px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
      }
      .driver-popover-footer button:hover {
        box-shadow: var(--shadow-neumorph-inset) !important;
      }
      .driver-popover-progress-text {
        color: var(--text-muted) !important;
      }
      /* Optional: handling the arrow's background */
      .driver-popover-arrow::before {
        border-color: var(--bg-card) !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return <TourContext.Provider value={{ startTour }}>{children}</TourContext.Provider>
}
