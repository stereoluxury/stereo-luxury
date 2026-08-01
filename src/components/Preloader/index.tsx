'use client'

import type { CSSProperties } from 'react'

import { useEffect, useMemo, useState } from 'react'

import Logo from '@/components/Logo'
import { cn } from '@/utilities/cn'

import styles from './index.module.scss'

const DEFAULT_BRAND_TEXT = 'STEREO'
const DEFAULT_MINIMUM_DURATION = 1800
const DEFAULT_EXIT_DURATION = 850

type CSSVars = CSSProperties & Record<`--${string}`, string | number>

type PreloaderProps = {
  brandText?: string
  exitDuration?: number
  minimumDuration?: number
}

export const Preloader = ({
  brandText = DEFAULT_BRAND_TEXT,
  exitDuration = DEFAULT_EXIT_DURATION,
  minimumDuration = DEFAULT_MINIMUM_DURATION,
}: PreloaderProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(0)
  const letters = useMemo(() => Array.from(brandText), [brandText])

  useEffect(() => {
    const root = document.documentElement
    const previousOverflow = document.body.style.overflow
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const displayDuration = prefersReducedMotion ? 300 : minimumDuration
    const leaveDuration = prefersReducedMotion ? 150 : exitDuration
    const startedAt = Date.now()

    let hasFinishedLoading = false
    let hasStartedExit = false
    let exitTimer: number | undefined
    let hideTimer: number | undefined
    let progressFrame: number | undefined

    root.dataset.preloader = 'active'
    document.body.style.overflow = 'hidden'

    const updateProgress = () => {
      const elapsed = Date.now() - startedAt
      const maxProgress = hasStartedExit ? 100 : 99

      setProgress(Math.min(maxProgress, Math.round((elapsed / displayDuration) * 100)))

      if (!hasStartedExit) {
        progressFrame = window.requestAnimationFrame(updateProgress)
      }
    }

    const finish = () => {
      if (hasFinishedLoading) {
        return
      }

      hasFinishedLoading = true
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, displayDuration - elapsed)

      exitTimer = window.setTimeout(() => {
        hasStartedExit = true
        root.dataset.preloader = 'leaving'
        setProgress(100)
        setIsExiting(true)

        hideTimer = window.setTimeout(() => {
          root.dataset.preloader = 'done'
          document.body.style.overflow = previousOverflow
          setIsVisible(false)
        }, leaveDuration)
      }, remaining)
    }

    progressFrame = window.requestAnimationFrame(updateProgress)

    if (document.readyState === 'complete') {
      finish()
    } else {
      window.addEventListener('load', finish, { once: true })
    }

    return () => {
      window.removeEventListener('load', finish)
      document.body.style.overflow = previousOverflow

      if (exitTimer) {
        window.clearTimeout(exitTimer)
      }

      if (hideTimer) {
        window.clearTimeout(hideTimer)
      }

      if (progressFrame) {
        window.cancelAnimationFrame(progressFrame)
      }
    }
  }, [exitDuration, minimumDuration])

  if (!isVisible) {
    return null
  }

  return (
    <div
      aria-label={`Loading ${brandText}`}
      aria-live="polite"
      className={cn(styles.preloader, isExiting && styles.exiting)}
      role="status"
      style={
        {
          '--preloader-duration': `${minimumDuration}ms`,
          '--preloader-exit-duration': `${exitDuration}ms`,
          '--preloader-letter-count': letters.length,
        } as CSSVars
      }
    >
      <div aria-hidden className={styles.content}>
        <div className={styles.logoMask}>
          <div className={styles.glitchContainer}>
            <Logo alt="" aria-hidden className={`${styles.logo}`} loading="eager" priority="high" />
            <Logo
              alt=""
              aria-hidden
              className={`${styles.logo} ${styles.glitchLayer}`}
              loading="eager"
              priority="high"
            />
            <Logo
              alt=""
              aria-hidden
              className={`${styles.logo} ${styles.glitchLayer2}`}
              loading="eager"
              priority="high"
            />
          </div>
        </div>
      </div>

      <div aria-hidden className={styles.progressPercent}>
        {progress}%
      </div>
      <div aria-hidden className={styles.progressTrack}>
        <span className={styles.progressBar} />
      </div>
    </div>
  )
}

export default Preloader
