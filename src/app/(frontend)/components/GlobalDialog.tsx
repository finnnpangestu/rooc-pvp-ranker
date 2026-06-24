'use client'

import React, { useEffect, useState } from 'react'
import styles from './GlobalDialog.module.css'

interface GlobalDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string | number // Tambahan prop baru
}

export function GlobalDialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 500,
}: GlobalDialogProps) {
  const [shouldRender, setRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) setRender(true)
  }, [isOpen])

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false)
  }

  if (!shouldRender) return null

  const formattedMaxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.fadeIn : styles.fadeOut}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className={`${styles.dialog} ${isOpen ? styles.slideIn : styles.slideOut}`}
        style={{ maxWidth: formattedMaxWidth }}
      >
        <div className={styles.header}>
          <h2>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
