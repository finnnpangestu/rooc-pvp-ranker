'use client'

import React, { useState, useTransition, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { GlobalDialog } from '../../components/GlobalDialog'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { Button, ButtonSize, ButtonVariant } from '../../components/Button'
import { Badge } from '../../components/Badge'
import { createResource } from '@/actions/resources/createResource'
import { deleteResource } from '@/actions/resources/deleteResource'
import { distributeResource } from '@/actions/resources/distributeResource'
import { updateDistributionStatus } from '@/actions/resources/updateDistributionStatus'
import { bulkUpdateDistributionStatus } from '@/actions/resources/bulkUpdateDistributionStatus'
import { updateDistributionDetails } from '@/actions/resources/updateDistributionDetails'
import { useRouter } from 'next/navigation'
import { Pagination } from '../../components/Pagination'
import { handleAuthError } from '../../components/SessionExpiredDialog'
import { updateResource } from '@/actions/resources/updateResource'
import type {
  Guild,
  PopulatedResource,
  ResourceDistributionWithRelations,
  Character,
  PopulatedMember,
} from '@/types'

interface ResourceClientProps {
  guild: Guild
  resources: PopulatedResource[]
  distributions: ResourceDistributionWithRelations[]
  members: Character[]
}

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

const DISTRIBUTION_LIMIT = 10

export function ResourceClient({ guild, resources, distributions, members }: ResourceClientProps) {
  const router = useRouter()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false)

  const [resourceName, setResourceName] = useState('')
  const [resourceQuantity, setResourceQuantity] = useState(0)

  const [viewedMember, setViewedMember] = useState<Character | PopulatedMember | null>(null)
  const [distributeMemberId, setDistributeMemberId] = useState('')
  const [distributeItems, setDistributeItems] = useState<
    { resource_id: string; quantity: number }[]
  >([{ resource_id: '', quantity: 1 }])
  const [distributeNotes, setDistributeNotes] = useState('')

  const [isCreating, startCreateTransition] = useTransition()
  const [isEditing, startEditTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isDistributing, startDistributeTransition] = useTransition()
  const [isUpdatingStatus, startUpdateStatusTransition] = useTransition()
  const [isEditingDist, startEditDistTransition] = useTransition()

  // Track specific item ID being loaded/acted upon
  const [actionResourceId, setActionResourceId] = useState<string | null>(null)
  const [actionDistId, setActionDistId] = useState<string | null>(null)

  const [selectedResourceFilters, setSelectedResourceFilters] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFilterOpen])

  // Get available resources for filtering
  const availableFilterResources = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    resources.forEach((r) => {
      if (r.id) map.set(r.id, { id: r.id, name: r.name })
    })
    distributions.forEach((d) => {
      if (d.resource_id && typeof d.resource_id === 'object' && d.resource_id.id) {
        map.set(d.resource_id.id, { id: d.resource_id.id, name: d.resource_id.name })
      } else if (d.resource && d.resource.id) {
        map.set(d.resource.id, { id: d.resource.id, name: d.resource.name })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [resources, distributions])

  const [characterSearch, setCharacterSearch] = useState('')

  // Filter distributions based on selected resource IDs and character name search
  const filteredDistributions = useMemo(() => {
    return distributions.filter((dist) => {
      // 1. Filter resource
      if (selectedResourceFilters.length > 0) {
        const resId =
          typeof dist.resource_id === 'object' && dist.resource_id
            ? dist.resource_id.id
            : typeof dist.resource_id === 'string'
              ? dist.resource_id
              : dist.resource?.id
        if (!resId || !selectedResourceFilters.includes(resId)) {
          return false
        }
      }

      // 2. Search nama character
      if (characterSearch.trim()) {
        const query = characterSearch.trim().toLowerCase()
        const charName =
          dist.member_id && typeof dist.member_id === 'object' && dist.member_id.name
            ? dist.member_id.name
            : dist.member && dist.member.name
              ? dist.member.name
              : ''
        if (!charName.toLowerCase().includes(query)) {
          return false
        }
      }

      return true
    })
  }, [distributions, selectedResourceFilters, characterSearch])

  const [distPage, setDistPage] = useState(1)
  const totalDistPages = Math.ceil(filteredDistributions.length / DISTRIBUTION_LIMIT)
  const paginatedDistributions = filteredDistributions.slice(
    (distPage - 1) * DISTRIBUTION_LIMIT,
    distPage * DISTRIBUTION_LIMIT,
  )

  const handleToggleResourceFilter = (resId: string) => {
    setSelectedResourceFilters((prev) => {
      const exists = prev.includes(resId)
      return exists ? prev.filter((id) => id !== resId) : [...prev, resId]
    })
    setDistPage(1)
    setSelectedIds([])
    setSelectionMode(null)
  }

  const handleSelectAllFilters = () => {
    if (selectedResourceFilters.length === availableFilterResources.length) {
      setSelectedResourceFilters([])
    } else {
      setSelectedResourceFilters(availableFilterResources.map((r) => r.id))
    }
    setDistPage(1)
    setSelectedIds([])
    setSelectionMode(null)
  }

  const handleClearFilters = () => {
    setSelectedResourceFilters([])
    setDistPage(1)
    setSelectedIds([])
    setSelectionMode(null)
  }

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState<'pending' | 'approved' | null>(null)
  const [isBulkUpdating, startBulkUpdateTransition] = useTransition()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editResourceId, setEditResourceId] = useState<string | null>(null)
  const [editResourceName, setEditResourceName] = useState('')
  const [editAddQuantity, setEditAddQuantity] = useState(0)

  const [isEditDistModalOpen, setIsEditDistModalOpen] = useState(false)
  const [editDistId, setEditDistId] = useState<string | null>(null)
  const [editDistType, setEditDistType] = useState<'member' | 'quantity'>('member')
  const [editDistMemberId, setEditDistMemberId] = useState('')
  const [editDistQuantity, setEditDistQuantity] = useState(1)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<PopulatedResource | null>(null)

  const affectedDistributionsCount = useMemo(() => {
    if (!resourceToDelete) return 0
    return distributions.filter((dist) => {
      const resId =
        typeof dist.resource_id === 'object' && dist.resource_id
          ? dist.resource_id.id
          : typeof dist.resource_id === 'string'
            ? dist.resource_id
            : dist.resource?.id
      return resId === resourceToDelete.id
    }).length
  }, [distributions, resourceToDelete])

  const selectableCount = selectionMode
    ? paginatedDistributions.filter((d) => d.status === selectionMode).length
    : 0
  const isAllSelected = selectedIds.length > 0 && selectedIds.length === selectableCount
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < selectableCount

  const handleToggleRow = (id: string, status: string) => {
    if (status === 'claimed') return

    setSelectedIds((prev) => {
      const isSelected = prev.includes(id)
      const newSelected = isSelected ? prev.filter((i) => i !== id) : [...prev, id]

      if (newSelected.length === 0) {
        setSelectionMode(null)
      } else if (!isSelected && prev.length === 0) {
        setSelectionMode(status as 'pending' | 'approved')
      }
      return newSelected
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.length > 0) {
      setSelectedIds([])
      setSelectionMode(null)
      return
    }

    const hasPending = paginatedDistributions.some((d) => d.status === 'pending')
    const hasApproved = paginatedDistributions.some((d) => d.status === 'approved')
    const mode = hasPending ? 'pending' : hasApproved ? 'approved' : null

    if (mode) {
      const toSelect = paginatedDistributions.filter((d) => d.status === mode).map((d) => d.id)
      setSelectedIds(toSelect)
      setSelectionMode(mode)
    }
  }

  const handleBulkAction = () => {
    if (selectedIds.length === 0 || !selectionMode) return
    const nextStatus = selectionMode === 'pending' ? 'approved' : 'claimed'
    const actionName = selectionMode === 'pending' ? 'Approve' : 'Claim'
    if (!confirm(`Yakin ingin ${actionName} ${selectedIds.length} item?`)) return

    startBulkUpdateTransition(async () => {
      const res = await bulkUpdateDistributionStatus(selectedIds, nextStatus)
      if (res.success) {
        setSelectedIds([])
        setSelectionMode(null)
        router.refresh()
      } else {
        if (handleAuthError(res)) return
        alert('Gagal: ' + res.message)
      }
    })
  }

  const handleEditResource = () => {
    if (!editResourceId || editAddQuantity <= 0) return alert('Jumlah tambahan harus diisi')

    setActionResourceId(editResourceId)
    startEditTransition(async () => {
      const res = await updateResource(editResourceId, { add_quantity: editAddQuantity })
      if (res.success) {
        setIsEditModalOpen(false)
        setEditResourceId(null)
        setEditAddQuantity(0)
        router.refresh()
      } else {
        if (handleAuthError(res)) return
        alert('Gagal: ' + res.message)
      }
      setActionResourceId(null)
    })
  }

  const handleCreateResource = () => {
    if (!resourceName.trim() || resourceQuantity <= 0) return alert('Nama dan jumlah harus diisi')

    startCreateTransition(async () => {
      const res = await createResource(guild.id, {
        name: resourceName,
        total_quantity: resourceQuantity,
      })
      if (res.success) {
        setResourceName('')
        setResourceQuantity(0)
        setIsCreateModalOpen(false)
        router.refresh()
      } else {
        if (handleAuthError(res)) return
        alert('Gagal: ' + res.message)
      }
    })
  }

  const handleDeleteResource = (resource: PopulatedResource) => {
    setResourceToDelete(resource)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!resourceToDelete) return

    setActionResourceId(resourceToDelete.id)
    startDeleteTransition(async () => {
      const res = await deleteResource(resourceToDelete.id)
      if (res.success) {
        setIsDeleteModalOpen(false)
        setResourceToDelete(null)
        router.refresh()
      } else {
        if (handleAuthError(res)) return
        alert('Gagal: ' + res.message)
      }
      setActionResourceId(null)
    })
  }

  const handleDistribute = () => {
    if (!distributeMemberId) return alert('Pilih member terlebih dahulu')
    if (distributeItems.length === 0) return alert('Minimal pilih 1 resource')

    const hasInvalidItem = distributeItems.some((item) => !item.resource_id || item.quantity <= 0)
    if (hasInvalidItem)
      return alert('Semua pilihan resource dan jumlah minimal 1 harus diisi dengan benar')

    startDistributeTransition(async () => {
      const res = await distributeResource(guild.id, {
        member_id: distributeMemberId,
        items: distributeItems,
        notes: distributeNotes,
      })

      if (res.success) {
        setDistributeMemberId('')
        setDistributeItems([{ resource_id: '', quantity: 1 }])
        setDistributeNotes('')
        setIsDistributeModalOpen(false)
        router.refresh()
      } else {
        if (handleAuthError(res)) return
        alert('Gagal: ' + res.message)
      }
    })
  }

  const handleUpdateStatus = (distId: string, status: 'approved' | 'claimed') => {
    setActionDistId(distId)
    startUpdateStatusTransition(async () => {
      const res = await updateDistributionStatus(distId, status)
      if (res.success) router.refresh()
      else {
        if (handleAuthError(res)) return
        alert('Gagal: ' + res.message)
      }
      setActionDistId(null)
    })
  }

  const handleEditDistributionDetails = () => {
    if (editDistType === 'quantity' && editDistQuantity <= 0) return alert('Jumlah tidak valid')
    if (editDistType === 'member' && !editDistMemberId) return alert('Member harus dipilih')

    setActionDistId(editDistId)
    startEditDistTransition(async () => {
      const payload: { member_id?: string; quantity?: number } = {}
      if (editDistType === 'member') payload.member_id = editDistMemberId
      if (editDistType === 'quantity') payload.quantity = editDistQuantity

      const res = await updateDistributionDetails(editDistId!, payload)
      if (res.success) {
        setIsEditDistModalOpen(false)
        router.refresh()
      } else {
        if (handleAuthError(res)) return
        alert(res.message)
      }
      setActionDistId(null)
    })
  }

  const renderLoadingButton = (
    onClick: () => void,
    isLoading: boolean,
    label: React.ReactNode,
    variant: ButtonVariant = 'primary',
    size: ButtonSize = 'md',
    className: string = '',
    disabled: boolean = false,
  ) => (
    <Button
      variant={variant}
      size={size}
      className={className}
      loading={isLoading}
      onClick={onClick}
      disabled={isLoading || disabled}
    >
      {label}
    </Button>
  )

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div id="tour-resources">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Resource Management
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Kelola resource guild dan distribusikan ke member
          </p>
        </div>
        <div className="flex gap-3">
          {renderLoadingButton(
            () => setIsCreateModalOpen(true),
            isCreating,
            '+ Buat Resource',
            'primary',
            'md',
            '',
            isCreating,
          )}
          {renderLoadingButton(
            () => setIsDistributeModalOpen(true),
            false,
            'Distribusi Resource',
            'amber',
            'md',
            '',
            resources.length === 0 || isDistributing,
          )}
        </div>
      </div>

      <div
        id="tour-resource-list"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {resources.length === 0 ? (
          <div
            className="col-span-4 apple-glass rounded-2xl p-8 text-center border border-black/5 dark:border-white/10 shadow-sm"
          >
            <p style={{ color: 'var(--text-muted)' }}>
              Belum ada resource. Klik &quot;Buat Resource&quot; untuk menambahkan.
            </p>
          </div>
        ) : (
          resources.map((resource) => (
            <div
              key={resource.id}
              className="apple-glass rounded-2xl p-5 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                {resource.name}
              </h3>

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {resource.total_quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-secondary)' }}>Sisa</span>
                  <span
                    className={`font-bold text-lg ${resource.remaining_quantity === 0 ? 'text-red-400' : 'text-emerald-400'}`}
                  >
                    {resource.remaining_quantity}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(resource.remaining_quantity / resource.total_quantity) * 100}%`,
                      background:
                        resource.remaining_quantity === 0
                          ? '#ef4444'
                          : resource.remaining_quantity < resource.total_quantity / 2
                            ? '#f59e0b'
                            : '#10b981',
                    }}
                  />
                </div>
              </div>

              <div
                className="flex gap-2 mt-4 pt-3 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {renderLoadingButton(
                  () => {
                    setEditResourceId(resource.id)
                    setEditResourceName(resource.name)
                    setEditAddQuantity(0)
                    setIsEditModalOpen(true)
                  },
                  isEditing && actionResourceId === resource.id,
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Tambah Stok
                  </>,
                  'primary',
                  'sm',
                  'flex-1 !justify-center',
                  (isEditing || isDeleting) && actionResourceId !== resource.id,
                )}

                {renderLoadingButton(
                  () => handleDeleteResource(resource),
                  isDeleting && actionResourceId === resource.id,
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Hapus
                  </>,
                  'danger',
                  'sm',
                  'flex-1 !justify-center',
                  (isEditing || isDeleting) && actionResourceId !== resource.id,
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        id="tour-resource-history"
        className="apple-glass rounded-3xl p-8 border border-black/5 dark:border-white/10 shadow-sm transition-colors"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h3
              className="text-[20px] m-0 font-semibold flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#818cf8' }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Jadwal Bid / Riwayat Distribusi
            </h3>
            <span
              className="text-[14px] font-normal flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {selectedResourceFilters.length > 0 || characterSearch.trim() ? (
                <>
                  <span className="font-semibold text-indigo-400">
                    {filteredDistributions.length}
                  </span>{' '}
                  dari {distributions.length} total
                </>
              ) : (
                `(${distributions.length} total)`
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Search Input for Character Name */}
            <div className="relative flex items-center">
              <Icon
                icon="fluent:search-24-regular"
                className="absolute left-3 w-4 h-4 pointer-events-none transition-colors"
                style={{ color: characterSearch ? '#818cf8' : 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={characterSearch}
                onChange={(e) => {
                  setCharacterSearch(e.target.value)
                  setDistPage(1)
                  setSelectedIds([])
                  setSelectionMode(null)
                }}
                placeholder="Cari nama character..."
                className="pl-9 pr-8 py-2 text-sm rounded-xl outline-none border transition-all w-44 sm:w-56 focus:w-64 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)]"
              />
              {characterSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setCharacterSearch('')
                    setDistPage(1)
                    setSelectedIds([])
                    setSelectionMode(null)
                  }}
                  className="absolute right-2.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Hapus pencarian"
                >
                  <Icon icon="fluent:dismiss-16-filled" className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border border-black/5 dark:border-white/10 shadow-sm apple-press"
                style={{
                  background:
                    selectedResourceFilters.length > 0
                      ? 'rgba(129, 140, 248, 0.12)'
                      : 'var(--bg-secondary)',
                  color: selectedResourceFilters.length > 0 ? '#818cf8' : 'var(--text-primary)',
                  borderColor:
                    selectedResourceFilters.length > 0
                      ? 'rgba(129, 140, 248, 0.4)'
                      : undefined,
                }}
              >
                <Icon
                  icon={
                    selectedResourceFilters.length > 0
                      ? 'fluent:filter-24-filled'
                      : 'fluent:filter-24-regular'
                  }
                  className="w-4 h-4"
                  style={{
                    color: selectedResourceFilters.length > 0 ? '#818cf8' : 'var(--text-secondary)',
                  }}
                />
                <span>Filter</span>
                {selectedResourceFilters.length > 0 && (
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white"
                    style={{ background: '#6366f1' }}
                  >
                    {selectedResourceFilters.length}
                  </span>
                )}
                <Icon
                  icon={
                    isFilterOpen ? 'fluent:chevron-up-16-regular' : 'fluent:chevron-down-16-regular'
                  }
                  className="w-3.5 h-3.5 opacity-60 ml-0.5"
                />
              </button>

              {/* Dropdown Menu */}
              {isFilterOpen && (
                <div
                  className="apple-glass-heavy absolute right-0 top-full mt-2 w-72 rounded-2xl p-3 border border-black/10 dark:border-white/15 shadow-2xl z-50 animate-fadeIn"
                >
                  <div
                    className="flex items-center justify-between pb-2.5 mb-2 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon
                        icon="fluent:filter-16-filled"
                        className="w-3.5 h-3.5 text-indigo-400"
                      />
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Filter Resource
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedResourceFilters.length > 0 ? (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="text-xs font-medium text-amber-400 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSelectAllFilters}
                          className="text-xs font-medium text-indigo-400 hover:underline cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                    {availableFilterResources.length === 0 ? (
                      <p
                        className="text-xs text-center py-4"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Tidak ada resource tersedia
                      </p>
                    ) : (
                      availableFilterResources.map((res) => {
                        const isChecked = selectedResourceFilters.includes(res.id)
                        const count = distributions.filter((d) => {
                          const rId =
                            typeof d.resource_id === 'object' && d.resource_id
                              ? d.resource_id.id
                              : typeof d.resource_id === 'string'
                                ? d.resource_id
                                : d.resource?.id
                          return rId === res.id
                        }).length

                        return (
                          <div
                            key={res.id}
                            onClick={() => handleToggleResourceFilter(res.id)}
                            className="flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                            style={{
                              background: isChecked ? 'rgba(129, 140, 248, 0.08)' : 'transparent',
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className="w-4 h-4 rounded-md flex items-center justify-center transition-all flex-shrink-0"
                                style={{
                                  background: isChecked ? '#6366f1' : 'var(--bg-secondary)',
                                  boxShadow: isChecked
                                    ? '0 1px 3px rgba(99, 102, 241, 0.4)'
                                    : 'none',
                                  border: isChecked
                                    ? '1px solid #6366f1'
                                    : '1px solid var(--border-color)',
                                }}
                              >
                                {isChecked && (
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#ffffff"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className="text-xs font-medium truncate"
                                style={{
                                  color: isChecked
                                    ? 'var(--text-primary)'
                                    : 'var(--text-secondary)',
                                }}
                              >
                                {res.name}
                              </span>
                            </div>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-mono ml-2 flex-shrink-0"
                              style={{
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              {count}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {selectedResourceFilters.length > 0 && (
                    <div
                      className="pt-2 mt-2 border-t flex justify-between items-center text-xs"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>
                        {selectedResourceFilters.length} dipilih
                      </span>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        Hapus Filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedIds.length > 0 && (
              <Button
                variant={selectionMode === 'pending' ? 'amber' : 'success'}
                size="md"
                loading={isBulkUpdating}
                onClick={handleBulkAction}
              >
                {selectionMode === 'pending' ? 'Approve Selected' : 'Claim Selected'} (
                {selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {filteredDistributions.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              icon="fluent:filter-dismiss-24-regular"
              className="w-10 h-10 mx-auto mb-2 opacity-40"
              style={{ color: 'var(--text-muted)' }}
            />
            <p className="text-sm m-0" style={{ color: 'var(--text-muted)' }}>
              {selectedResourceFilters.length > 0 || characterSearch.trim()
                ? 'Tidak ada riwayat distribusi yang cocok dengan filter atau pencarian.'
                : 'Belum ada riwayat distribusi.'}
            </p>
            {(selectedResourceFilters.length > 0 || characterSearch.trim()) && (
              <button
                type="button"
                onClick={() => {
                  handleClearFilters()
                  setCharacterSearch('')
                }}
                className="mt-3 text-xs font-semibold text-indigo-400 hover:underline cursor-pointer"
              >
                Reset Filter & Pencarian
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      borderColor: 'var(--border-color)',
                      background: 'var(--bg-primary)',
                    }}
                  >
                    <th className="p-3 w-12 text-center">
                      <div className="flex justify-center items-center">
                        <div
                          onClick={handleSelectAll}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                            selectedIds.length > 0
                              ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-sm'
                              : 'bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15'
                          }`}
                        >
                          {isAllSelected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {isIndeterminate && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#818cf8"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </th>
                    <th className="p-3 text-left" style={{ color: 'var(--text-muted)' }}>
                      Tanggal
                    </th>
                    <th className="p-3 text-left" style={{ color: 'var(--text-muted)' }}>
                      Resource
                    </th>
                    <th className="p-3 text-left" style={{ color: 'var(--text-muted)' }}>
                      Member
                    </th>
                    <th className="p-3 text-right" style={{ color: 'var(--text-muted)' }}>
                      Jumlah
                    </th>
                    <th className="p-3 text-center" style={{ color: 'var(--text-muted)' }}>
                      Status
                    </th>
                    <th className="p-3 text-center" style={{ color: 'var(--text-muted)' }}>
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDistributions.map((dist) => {
                    const isDisabled =
                      dist.status === 'claimed' ||
                      (selectionMode !== null && selectionMode !== dist.status)
                    const isChecked = selectedIds.includes(dist.id)

                    return (
                      <tr
                        key={dist.id}
                        className={`border-b transition-all ${isDisabled ? 'opacity-50' : 'hover:bg-black/[0.03] dark:hover:bg-white/5'} ${isChecked ? 'bg-indigo-500/5' : ''}`}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <td className="p-3">
                          <div className="flex justify-center items-center">
                            <div
                              onClick={() => {
                                if (!isDisabled) handleToggleRow(dist.id, dist.status)
                              }}
                              className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all border ${
                                isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                              } ${
                                isChecked
                                  ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-sm'
                                  : 'bg-black/5 dark:bg-white/5 border-black/15 dark:border-white/15'
                              }`}
                            >
                              {isChecked && (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                          {dist.bid_date
                            ? new Date(dist.bid_date).toLocaleDateString('id-ID')
                            : '-'}
                        </td>
                        <td className="p-3" style={{ color: 'var(--text-primary)' }}>
                          {dist.resource_id?.name || 'Unknown'}
                        </td>
                        <td
                          className="p-4 flex items-center gap-2 cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
                          onClick={() => setViewedMember(dist.member_id || null)}
                        >
                          <Image
                            src={getJobIcon(dist.member_id?.job || '')}
                            alt=""
                            width={20}
                            height={20}
                            className="object-cover rounded"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          <span style={{ color: 'var(--text-primary)' }}>
                            {dist.member_id?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold" style={{ color: '#f59e0b' }}>
                          {dist.quantity}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              dist.status === 'claimed'
                                ? 'success'
                                : dist.status === 'approved'
                                  ? 'info'
                                  : 'warning'
                            }
                          >
                            {dist.status === 'claimed'
                              ? 'Claimed'
                              : dist.status === 'approved'
                                ? 'Approved'
                                : 'Pending'}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {dist.status === 'pending' && (
                              <>
                                {renderLoadingButton(
                                  () => {
                                    setEditDistId(dist.id)
                                    setEditDistType('member')
                                    setEditDistMemberId(
                                      typeof dist.member_id === 'object' && dist.member_id
                                        ? dist.member_id.id
                                        : String(dist.member_id || ''),
                                    )
                                    setIsEditDistModalOpen(true)
                                  },
                                  isEditingDist && actionDistId === dist.id,
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>,
                                  'ghost',
                                  'sm',
                                  '',
                                  (isUpdatingStatus || isEditingDist) && actionDistId !== dist.id,
                                )}
                                {renderLoadingButton(
                                  () => handleUpdateStatus(dist.id, 'approved'),
                                  isUpdatingStatus && actionDistId === dist.id,
                                  'Approve',
                                  'success',
                                  'sm',
                                  '',
                                  (isUpdatingStatus || isEditingDist) && actionDistId !== dist.id,
                                )}
                              </>
                            )}
                            {dist.status === 'approved' && (
                              <>
                                {renderLoadingButton(
                                  () => {
                                    setEditDistId(dist.id)
                                    setEditDistType('quantity')
                                    setEditDistQuantity(Number(dist.quantity) || 0)
                                    setIsEditDistModalOpen(true)
                                  },
                                  isEditingDist && actionDistId === dist.id,
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>,
                                  'ghost',
                                  'sm',
                                  '',
                                  (isUpdatingStatus || isEditingDist) && actionDistId !== dist.id,
                                )}
                                {renderLoadingButton(
                                  () => handleUpdateStatus(dist.id, 'claimed'),
                                  isUpdatingStatus && actionDistId === dist.id,
                                  'Claim',
                                  'primary',
                                  'sm',
                                  '',
                                  (isUpdatingStatus || isEditingDist) && actionDistId !== dist.id,
                                )}
                              </>
                            )}
                            {dist.status === 'claimed' && (
                              <span className="text-xs text-emerald-400 font-semibold mt-1 block">
                                ✓ Selesai
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Pagination
                currentPage={distPage}
                totalPages={totalDistPages}
                onPageChange={setDistPage}
              />
            </div>
          </>
        )}
      </div>

      {/* MODAL: Buat Resource */}
      <GlobalDialog
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isCreating) setIsCreateModalOpen(false)
        }}
        title="Buat Resource Baru"
        maxWidth={400}
      >
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Nama Resource
            </label>
            <input
              type="text"
              placeholder="Contoh: S, A, B, Mythic"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all"
              disabled={isCreating}
            />
          </div>

          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Jumlah Total
            </label>
            <input
              type="number"
              min={1}
              value={resourceQuantity || ''}
              onChange={(e) => setResourceQuantity(Number(e.target.value))}
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all tabular-nums"
              disabled={isCreating}
            />
          </div>

          {renderLoadingButton(
            handleCreateResource,
            isCreating,
            'Buat Resource',
            'primary',
            'lg',
            'w-full mt-2',
            isCreating,
          )}
        </div>
      </GlobalDialog>

      {/* MODAL: Distribusi Resource */}
      <GlobalDialog
        isOpen={isDistributeModalOpen}
        onClose={() => {
          if (!isDistributing) setIsDistributeModalOpen(false)
        }}
        title="Distribusi Resource"
        maxWidth={500}
      >
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Pilih Member
            </label>
            <select
              value={distributeMemberId}
              onChange={(e) => setDistributeMemberId(e.target.value)}
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all"
              disabled={isDistributing}
            >
              <option value="">-- Pilih Member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.job})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <label
              className="text-[13px] font-semibold block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Resource yang Diberikan
            </label>

            {distributeItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <select
                  value={item.resource_id}
                  onChange={(e) => {
                    const newItems = [...distributeItems]
                    newItems[index].resource_id = e.target.value
                    setDistributeItems(newItems)
                  }}
                  className="flex-1 rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all"
                  disabled={isDistributing}
                >
                  <option value="">-- Pilih Resource --</option>
                  {resources
                    .filter((r) => Number(r.remaining_quantity) > 0)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Sisa: {r.remaining_quantity})
                      </option>
                    ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={item.quantity || ''}
                  onChange={(e) => {
                    const newItems = [...distributeItems]
                    newItems[index].quantity = Number(e.target.value)
                    setDistributeItems(newItems)
                  }}
                  className="w-24 rounded-xl py-3 px-4 outline-none text-[14px] text-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all tabular-nums"
                  disabled={isDistributing}
                />

                {distributeItems.length > 1 && (
                  <Button
                    variant="danger"
                    size="md"
                    className="!px-3"
                    disabled={isDistributing}
                    onClick={() =>
                      setDistributeItems(distributeItems.filter((_, i) => i !== index))
                    }
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="w-fit mt-1"
              disabled={isDistributing}
              onClick={() =>
                setDistributeItems([...distributeItems, { resource_id: '', quantity: 1 }])
              }
            >
              + Tambah Resource Lain
            </Button>
          </div>

          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Catatan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Bonus Week 1"
              value={distributeNotes}
              onChange={(e) => setDistributeNotes(e.target.value)}
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all"
              disabled={isDistributing}
            />
          </div>

          {renderLoadingButton(
            handleDistribute,
            isDistributing,
            'Distribusikan',
            'amber',
            'lg',
            'w-full mt-2',
            isDistributing,
          )}
        </div>
      </GlobalDialog>

      {/* MODAL: Edit Stok */}
      <GlobalDialog
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isEditing) setIsEditModalOpen(false)
        }}
        title="Tambah Stok Resource"
        maxWidth={400}
      >
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Resource: {editResourceName}
            </label>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Tambahkan jumlah stok baru. Stok saat ini akan bertambah.
            </p>
          </div>

          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Jumlah Tambahan
            </label>
            <input
              type="number"
              min={1}
              value={editAddQuantity || ''}
              onChange={(e) => setEditAddQuantity(Number(e.target.value))}
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all tabular-nums"
              disabled={isEditing}
            />
          </div>

          {renderLoadingButton(
            handleEditResource,
            isEditing,
            'Tambah Stok',
            'primary',
            'lg',
            'w-full mt-2',
            isEditing,
          )}
        </div>
      </GlobalDialog>

      {/* MODAL: Edit Distribusi (Member/Qty) */}
      <GlobalDialog
        isOpen={isEditDistModalOpen}
        onClose={() => {
          if (!isEditingDist) setIsEditDistModalOpen(false)
        }}
        title={editDistType === 'member' ? 'Ubah Member Penerima' : 'Ubah Jumlah Distribusi'}
        maxWidth={400}
      >
        <div className="flex flex-col gap-4 mt-2">
          {editDistType === 'member' ? (
            <div>
              <label
                className="text-[13px] font-semibold mb-2 block"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pilih Member Baru
              </label>
              <select
                value={editDistMemberId}
                onChange={(e) => setEditDistMemberId(e.target.value)}
                className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all"
                disabled={isEditingDist}
              >
                <option value="">-- Pilih Member --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.job})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label
                className="text-[13px] font-semibold mb-2 block"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ubah Jumlah (Approved)
              </label>
              <input
                type="number"
                min={1}
                value={editDistQuantity || ''}
                onChange={(e) => setEditDistQuantity(Number(e.target.value))}
                className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all tabular-nums"
                disabled={isEditingDist}
              />
            </div>
          )}

          {renderLoadingButton(
            handleEditDistributionDetails,
            isEditingDist,
            'Simpan Perubahan',
            'amber',
            'lg',
            'w-full mt-2',
            isEditingDist,
          )}
        </div>
      </GlobalDialog>

      {/* MODAL: Konfirmasi Hapus Resource */}
      <GlobalDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false)
            setResourceToDelete(null)
          }
        }}
        title="Hapus Resource"
        maxWidth={460}
      >
        <div className="flex flex-col gap-4 mt-2">
          {/* Warning Banner */}
          <div
            className="flex items-start gap-3 p-3.5 rounded-xl border"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
            }}
          >
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0">
              <Icon icon="fluent:warning-24-filled" className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-red-400">
                Peringatan: Riwayat Distribusi Akan Hilang
              </span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Jika resource ini dihapus, seluruh riwayat distribusi dan log terkait resource ini
                akan ikut terhapus secara permanen dari database.
              </p>
            </div>
          </div>

          {/* Info Resource */}
          {resourceToDelete && (
            <div
              className="p-3.5 rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Resource
                </span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {resourceToDelete.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Total / Sisa Stok
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {resourceToDelete.total_quantity} / {resourceToDelete.remaining_quantity}
                </span>
              </div>
              <div
                className="flex items-center justify-between pt-2 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Dampak Riwayat
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    affectedDistributionsCount > 0
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {affectedDistributionsCount > 0
                    ? `${affectedDistributionsCount} riwayat akan terhapus`
                    : 'Tidak ada riwayat terkait'}
                </span>
              </div>
            </div>
          )}

          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            Apakah Anda yakin ingin menghapus resource{' '}
            <strong className="font-bold text-red-400">{resourceToDelete?.name}</strong>?
          </p>

          <div
            className="flex items-center justify-end gap-3 mt-2 pt-3 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Button
              variant="ghost"
              size="md"
              disabled={isDeleting}
              onClick={() => {
                setIsDeleteModalOpen(false)
                setResourceToDelete(null)
              }}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={isDeleting}
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="!bg-red-500/15 hover:!bg-red-500/25 !text-red-400 !border-red-500/40"
            >
              <Icon icon="fluent:delete-24-regular" className="w-4 h-4" />
              Ya, Hapus Resource
            </Button>
          </div>
        </div>
      </GlobalDialog>

      <CharacterDetailModal
        member={
          typeof viewedMember === 'object'
            ? viewedMember
            : members.find((m) => m.id === viewedMember) || viewedMember
        }
        isOpen={!!viewedMember}
        onClose={(isUpdated) => {
          setViewedMember(null)
          if (isUpdated) {
            router.refresh()
          }
        }}
      />
    </div>
  )
}
