import React from 'react'
import styles from './loading.module.css'

export default function Loading() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinnerGlow}></div>
        <div className={styles.spinnerTrack}></div>
        <div className={styles.spinner}></div>
      </div>
      <p className={styles.loadingText}>Loading...</p>
    </div>
  )
}
