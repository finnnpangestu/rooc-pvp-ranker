'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from './GlobalDialog'
import { TabBar, TabButton } from './TabBar'
import { StatCard } from './StatCard'
import { JOB_LABELS } from '@/const/JobLabels'

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

interface CharacterDetailModalProps {
  member: any | null
  isOpen: boolean
  onClose: () => void
  footerActions?: React.ReactNode
}

export function CharacterDetailModal({
  member,
  isOpen,
  onClose,
  footerActions,
}: CharacterDetailModalProps) {
  const [activeDetailTab, setActiveDetailTab] = useState('general')

  useEffect(() => {
    if (member) {
      setActiveDetailTab('general')
    }
  }, [member])

  if (!member) return null

  return (
    <GlobalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail: ${member.name}`}
      maxWidth={800}
    >
      <div>
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-lg border"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph-inset)',
          }}
        >
          {/* Bagian Kiri: Info Utama */}
          <div className="flex items-center gap-4">
            <img
              src={getJobIcon(member.job)}
              alt=""
              className="w-12 h-12 object-cover rounded-lg shadow-sm border"
              style={{ borderColor: 'var(--border-color)' }}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div>
              <div className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>
                {JOB_LABELS[member.job] || member.job}
              </div>
              <div className="text-sm text-amber-400 font-medium mt-1 flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                PvP Score: {Math.round(member.pvp_score || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Bagian Kanan: Info GL & Resource */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Kehadiran GL
              </span>
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <span className="text-emerald-400">{member.gl_present_count || 0}</span>
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/</span>
                <span className="text-red-400">{member.gl_absent_count || 0}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Kehadiran WoE
              </span>
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <span className="text-emerald-400">{member.woe_present_count || 0}</span>
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/</span>
                <span className="text-red-400">{member.woe_absent_count || 0}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Resource
              </span>
              <span className="text-lg font-bold text-indigo-400">
                {member.total_resources || 0}
              </span>
            </div>
          </div>
        </div>

        <TabBar className="mb-6">
          <TabButton
            isActive={activeDetailTab === 'general'}
            onClick={() => setActiveDetailTab('general')}
          >
            General
          </TabButton>
          <TabButton
            isActive={activeDetailTab === 'quasi'}
            onClick={() => setActiveDetailTab('quasi')}
          >
            Quasi
          </TabButton>
          <TabButton
            isActive={activeDetailTab === 'special'}
            onClick={() => setActiveDetailTab('special')}
          >
            Special
          </TabButton>
        </TabBar>

        <div className={activeDetailTab === 'general' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
            <StatCard label="Max HP" value={member.max_hp} />
            <StatCard label="PATK" value={member.patk} />
            <StatCard label="MATK" value={member.matk} />
            <StatCard label="PDEF" value={member.pdef} />
            <StatCard label="MDEF" value={member.mdef} />
            <StatCard label="Refine PATK" value={member.refine_patk} />
            <StatCard label="Refine MATK" value={member.refine_matk} />
            <StatCard label="Refine PDEF" value={member.refine_pdef} />
            <StatCard label="Refine MDEF" value={member.refine_mdef} />
            <StatCard label="HIT" value={member.hit} />
            <StatCard label="FLEE" value={member.flee} />
          </div>
        </div>

        <div className={activeDetailTab === 'quasi' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
            <StatCard label="ASPD" value={member.aspd} isPercent />
            <StatCard label="Movement SPD" value={member.mspd} isPercent />
            <StatCard label="Variable CT" value={member.variable_cast} isPercent />
            <StatCard label="Fixed CT" value={member.fixed_cast} isPercent />
            <StatCard label="Healing Done" value={member.healing_done} isPercent />
            <StatCard label="Healing Taken" value={member.healing_taken} isPercent />
            <StatCard label="CRIT" value={member.critical} />
            <StatCard label="CRIT DMG" value={member.critical_damage} isPercent />
            <StatCard label="CRIT RES" value={member.critical_reduction} />
            <StatCard label="CRIT DMG RES" value={member.critical_damage_reduction} isPercent />
            <StatCard label="PDMG" value={member.pdmg} isPercent />
            <StatCard label="MDMG" value={member.mdmg} isPercent />
            <StatCard label="PDMG.R" value={member.pdmg_reduction} isPercent />
            <StatCard label="MDMG.R" value={member.mdmg_reduction} isPercent />
            <StatCard label="Ignore PDEF" value={member.ignore_pdef} />
            <StatCard label="Ignore MDEF" value={member.ignore_mdef} />
            <StatCard label="PDMG Bonus" value={member.pdmg_bonus} />
            <StatCard label="MDMG Bonus" value={member.mdmg_bonus} />
            <StatCard label="PvP DMG Bonus" value={member.pvp_dmg_bonus} />
            <StatCard label="PvP DMG Red" value={member.pvp_dmg_reduction} />
          </div>
        </div>

        <div className={activeDetailTab === 'special' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
            <StatCard label="Max HP %" value={member.max_hp_percentage} isPercent />
            <StatCard label="Equip PATK %" value={member.equipment_patk_percentage} isPercent />
            <StatCard label="Equip MATK %" value={member.equipment_matk_percentage} isPercent />
            <StatCard label="Equip PDEF %" value={member.equipment_pdef_percentage} isPercent />
            <StatCard label="Equip MDEF %" value={member.equipment_mdef_percentage} isPercent />
            <StatCard label="DMG vs Demi" value={member.dmg_vs_demi_human} isPercent />
            <StatCard label="DMG Red vs Demi" value={member.dmg_reduction_demi_human} isPercent />
            <StatCard label="DMG vs Medium" value={member.dmg_vs_medium} isPercent />
            <StatCard label="DMG Red vs Medium" value={member.dmg_reduction_medium} isPercent />
            <StatCard label="Neutral Bonus" value={member.neutral_dmg_bonus} isPercent />
            <StatCard label="Neutral Red" value={member.neutral_dmg_reduction} isPercent />
            <StatCard label="DMG vs Fire" value={member.fire_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Fire" value={member.fire_dmg_reduction} isPercent />
            <StatCard label="DMG vs Water" value={member.water_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Water" value={member.water_dmg_reduction} isPercent />
            <StatCard label="DMG vs Wind" value={member.wind_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Wind" value={member.wind_dmg_reduction} isPercent />
            <StatCard label="DMG vs Earth" value={member.earth_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Earth" value={member.earth_dmg_reduction} isPercent />
            <StatCard label="DMG vs Ghost" value={member.ghost_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Ghost" value={member.ghost_dmg_reduction} isPercent />
            <StatCard label="DMG vs Holy" value={member.holy_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Holy" value={member.holy_dmg_reduction} isPercent />
            <StatCard label="DMG vs Poison" value={member.poison_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Poison" value={member.poison_dmg_reduction} isPercent />
          </div>
        </div>

        {footerActions && (
          <div
            className="flex justify-end gap-3 mt-4 pt-5 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {footerActions}
          </div>
        )}
      </div>
    </GlobalDialog>
  )
}
