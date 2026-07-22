'use client'

import React, { useState, useTransition } from 'react'
import { GlobalDialog } from '../../components/GlobalDialog'
import { Button, ButtonSize, ButtonVariant } from '../../components/Button'
import { Badge } from '../../components/Badge'
import { createResource } from '@/actions/resources/createResource'
import { deleteResource } from '@/actions/resources/deleteResource'
import { distributeResource } from '@/actions/resources/distributeResource'
import { updateDistributionStatus } from '@/actions/resources/updateDistributionStatus'
import { updateDistributionDetails } from '@/actions/resources/updateDistributionDetails'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../components/ThemeProvider'
import { Pagination } from '../../components/Pagination'
import { updateResource } from '@/actions/resources/updateResource'

interface ResourceClientProps {
  guild: any
  resources: any[]
  distributions: any[]
  members: any[]
}

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

const DISTRIBUTION_LIMIT = 10

export function ResourceClient({ guild, resources, distributions, members }: ResourceClientProps) {
  const { theme } = useTheme()
  const router = useRouter()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false)

  const [resourceName, setResourceName] = useState('')
  const [resourceQuantity, setResourceQuantity] = useState(0)

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

  const [distPage, setDistPage] = useState(1)
  const totalDistPages = Math.ceil(distributions.length / DISTRIBUTION_LIMIT)
  const paginatedDistributions = distributions.slice(
    (distPage - 1) * DISTRIBUTION_LIMIT,
    distPage * DISTRIBUTION_LIMIT,
  )

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editResourceId, setEditResourceId] = useState<string | null>(null)
  const [editResourceName, setEditResourceName] = useState('')
  const [editAddQuantity, setEditAddQuantity] = useState(0)

  const [isEditDistModalOpen, setIsEditDistModalOpen] = useState(false)
  const [editDistId, setEditDistId] = useState<string | null>(null)
  const [editDistType, setEditDistType] = useState<'member' | 'quantity'>('member')
  const [editDistMemberId, setEditDistMemberId] = useState('')
  const [editDistQuantity, setEditDistQuantity] = useState(1)

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
        alert('Gagal: ' + res.message)
      }
    })
  }

  const handleDeleteResource = (resourceId: string) => {
    if (!confirm('Yakin ingin menghapus resource ini?')) return

    setActionResourceId(resourceId)
    startDeleteTransition(async () => {
      const res = await deleteResource(resourceId)
      if (res.success) router.refresh()
      else alert('Gagal: ' + res.message)
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
        alert('Gagal: ' + res.message)
      }
    })
  }

  const handleUpdateStatus = (distId: string, status: 'approved' | 'claimed') => {
    setActionDistId(distId)
    startUpdateStatusTransition(async () => {
      const res = await updateDistributionStatus(distId, status)
      if (res.success) router.refresh()
      else alert('Gagal: ' + res.message)
      setActionDistId(null)
    })
  }

  const handleEditDistributionDetails = () => {
    if (editDistType === 'quantity' && editDistQuantity <= 0) return alert('Jumlah tidak valid')
    if (editDistType === 'member' && !editDistMemberId) return alert('Member harus dipilih')

    setActionDistId(editDistId)
    startEditDistTransition(async () => {
      const payload: any = {}
      if (editDistType === 'member') payload.member_id = editDistMemberId
      if (editDistType === 'quantity') payload.quantity = editDistQuantity

      const res = await updateDistributionDetails(editDistId!, payload)
      if (res.success) {
        setIsEditDistModalOpen(false)
        router.refresh()
      } else {
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
        <div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {resources.length === 0 ? (
          <div
            className="col-span-4 rounded-lg p-8 text-center border"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-neumorph)',
            }}
          >
            <p style={{ color: 'var(--text-muted)' }}>
              Belum ada resource. Klik "Buat Resource" untuk menambahkan.
            </p>
          </div>
        ) : (
          resources.map((resource) => (
            <div
              key={resource.id}
              className="rounded-lg p-4 border transition-all hover:shadow-lg flex flex-col"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-neumorph)',
              }}
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
                      width: `${((resource.total_quantity - resource.remaining_quantity) / resource.total_quantity) * 100}%`,
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
                  () => handleDeleteResource(resource.id),
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
        className="rounded-lg p-6 border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-neumorph)',
        }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Jadwal Bid / Riwayat Distribusi
        </h2>

        {distributions.length === 0 ? (
          <p className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
            Belum ada riwayat distribusi.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
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
                  {paginatedDistributions.map((dist) => (
                    <tr
                      key={dist.id}
                      className="border-b transition-colors hover:bg-white/5"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(dist.bid_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-3" style={{ color: 'var(--text-primary)' }}>
                        {dist.resource_id?.name || 'Unknown'}
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        <img
                          src={getJobIcon(dist.member_id?.job || '')}
                          alt=""
                          className="w-5 h-5 object-cover rounded"
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
                                    typeof dist.member_id === 'object'
                                      ? dist.member_id.id
                                      : dist.member_id,
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
                                  setEditDistQuantity(dist.quantity)
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
                  ))}
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
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                border: 'none',
              }}
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
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                border: 'none',
              }}
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
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                border: 'none',
              }}
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
                  className="flex-1 rounded-xl py-3 px-4 outline-none text-[14px]"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-neumorph-inset)',
                    border: 'none',
                  }}
                  disabled={isDistributing}
                >
                  <option value="">-- Pilih Resource --</option>
                  {resources
                    .filter((r) => r.remaining_quantity > 0)
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
                  className="w-24 rounded-xl py-3 px-4 outline-none text-[14px] text-center"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-neumorph-inset)',
                    border: 'none',
                  }}
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
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                border: 'none',
              }}
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
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                border: 'none',
              }}
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
                className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                  border: 'none',
                }}
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
                className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                  border: 'none',
                }}
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
    </div>
  )
}
