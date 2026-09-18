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

    if (pathname === '/' || pathname === '/dashboard') {
      steps = [
        {
          element: '#tour-dashboard-stats',
          popover: {
            title: 'Guild Statistics',
            description:
              'View total members, overall PvP score, and the verification queue here.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-dashboard-league',
          popover: {
            title: 'Guild League Performance',
            description: 'Monitor Guild League win and loss match history here.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-dashboard-performers',
          popover: {
            title: 'Top 5 Performers',
            description: 'List of the top 5 players with the highest PvP scores in the guild.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#tour-dashboard-woe',
          popover: {
            title: 'WoE Performance',
            description:
              'Track guild ranking trends across the last 5 War of Emperium matches.',
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
              'Use this page to organize 8 Elite Party formations (Top 40) and assign remaining members to Sub Parties.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-gl-generate-elite',
          popover: {
            title: 'Generate Elite Party',
            description:
              'Click here to automatically select the top 40 strongest players and distribute them across 8 parties.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-gl-generate-sub',
          popover: {
            title: 'Generate Sub Party',
            description:
              'Once Elite parties are set, remaining members can be automatically assigned to Sub Parties.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-gl-bench',
          popover: {
            title: 'Bench Players',
            description:
              'Unassigned players appear here. You can drag and drop them into available party slots.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-gl-save',
          popover: {
            title: 'Save Setup',
            description: 'Remember to save your setup once formations are properly organized!',
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
              'Manage party and player allocations for War of Emperium across your castles.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-woe-add-castle',
          popover: {
            title: 'Add Raid',
            description: 'Create a setup for a new Raid.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#tour-woe-list',
          popover: {
            title: 'Raid Formation List',
            description:
              'View and manage raid formations for each castle you have created here.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-woe-benched',
          popover: {
            title: 'Bench Players',
            description:
              'Players not yet assigned to any party will appear here. You can drag and drop them into active formations.',
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
            title: 'Guild League Report',
            description:
              'Match summaries and individual member performances appear here.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-report-list',
          popover: {
            title: 'Report List',
            description:
              'Collection of past Guild League reports. Click on any report to view detailed member performance.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-report-ranking',
          popover: {
            title: 'Overall Ranking',
            description:
              'View members with the best overall performance and points in Guild League.',
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
            description: 'Manage your guild resources and materials from this page.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-resource-list',
          popover: {
            title: 'Resource List',
            description:
              'Check current stock levels for each resource tier (e.g. Mythic, S, A, etc.).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-resource-history',
          popover: {
            title: 'Distribution History',
            description:
              'Member distribution history table. Track status (Pending, Approved, Claimed) and perform bulk approvals.',
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
            title: 'Member List',
            description: 'View and manage all members in your guild here.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-member-pagination',
          popover: {
            title: 'Display Settings',
            description:
              'Adjust the number of members displayed per page using this dropdown.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#tour-member-action',
          popover: {
            title: 'Character Actions',
            description:
              'Use the Edit button to update character stats or view member details directly.',
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
            title: 'WoE Report',
            description: 'Create and view War of Emperium battle reports and history here.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-woe-report-list',
          popover: {
            title: 'WoE Report History',
            description:
              'List of previous WoE reports. Click each report to inspect member attendance and party movements.',
            side: 'right',
            align: 'start',
          },
        },
      ]
    }

    if (steps.length === 0) {
      alert('Tour guide is not available for this page.')
      return
    }

    // Driver JS Config
    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: steps,
      popoverClass: isDark ? 'driver-theme-dark' : 'driver-theme-light',
      nextBtnText: 'Next',
      prevBtnText: 'Previous',
      doneBtnText: 'Done',
      progressText: '{{current}} of {{total}}',
    })

    driverObj.drive()
  }

  // Adding custom styles for dark/light themes inside driver.js
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      /* Apple Glass Theme for Driver.js */
      .driver-popover {
        background-color: var(--bg-card) !important;
        backdrop-filter: blur(24px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
        color: var(--text-primary) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 24px !important;
        box-shadow: var(--shadow-modal) !important;
        padding: 22px !important;
      }
      .driver-popover-title {
        color: var(--text-primary) !important;
        font-weight: 700 !important;
        font-size: 17px !important;
        letter-spacing: -0.02em !important;
        margin-bottom: 8px !important;
      }
      .driver-popover-description {
        color: var(--text-secondary) !important;
        font-size: 13.5px !important;
        line-height: 1.5 !important;
      }
      .driver-popover-footer {
        margin-top: 18px !important;
      }
      .driver-popover-footer button {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
        border: 1px solid var(--border-color) !important;
        border-radius: 12px !important;
        box-shadow: var(--shadow-subtle) !important;
        text-shadow: none !important;
        padding: 6px 16px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        transition: all 0.15s ease !important;
      }
      .driver-popover-footer button:active {
        transform: scale(0.97) !important;
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
