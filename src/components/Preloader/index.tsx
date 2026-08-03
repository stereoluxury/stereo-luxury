'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import Logo from '@/components/Logo'

import styles from './index.module.scss'

const DEFAULT_BRAND_TEXT = 'STEREO'
const DEFAULT_MINIMUM_DURATION = 1800
const DEFAULT_EXIT_DURATION = 850

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
  const [progress, setProgress] = useState(0)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const logoMaskRef = useRef<HTMLDivElement | null>(null)
  const logoBaseRef = useRef<HTMLDivElement | null>(null)
  const glitchLayer1Ref = useRef<HTMLDivElement | null>(null)
  const glitchLayer2Ref = useRef<HTMLDivElement | null>(null)
  const progressBarRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const previousOverflow = document.body.style.overflow
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const displayDuration = (prefersReducedMotion ? 300 : minimumDuration) / 1000
    const leaveDuration = (prefersReducedMotion ? 150 : exitDuration) / 1000

    root.dataset.preloader = 'active'
    document.body.style.overflow = 'hidden'

    const startedAt = Date.now()
    let hasFinishedLoading = false
    let exitTimer: number | undefined
    const glitchTweens: gsap.core.Tween[] = []
    const progressState = { value: 0 }

    const ctx = gsap.context(() => {
      // Entrance: mask wipe + logo fade/scale in, running in parallel
      const entrance = gsap.timeline()

      if (logoMaskRef.current) {
        entrance.fromTo(
          logoMaskRef.current,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power3.out' },
          0.12,
        )
      }

      if (logoBaseRef.current) {
        entrance.fromTo(
          [logoBaseRef.current, glitchLayer1Ref.current, glitchLayer2Ref.current],
          { opacity: 0, y: 16, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'power3.out' },
          0,
        )
      }

      // Continuous RGB-split glitch flicker on the two duplicate layers
      if (!prefersReducedMotion) {
        ;[
          { el: glitchLayer1Ref.current, delay: 0 },
          { el: glitchLayer2Ref.current, delay: 0.15 },
        ].forEach(({ el, delay }) => {
          if (!el) return
          glitchTweens.push(
            gsap.to(el, {
              duration: 0.3,
              delay,
              repeat: -1,
              yoyo: true,
              ease: 'power1.inOut',
              x: () => gsap.utils.random(-5, 5),
              clipPath: () =>
                `inset(${gsap.utils.random(0, 50)}% -6px ${gsap.utils.random(10, 70)}% 0%)`,
            }),
          )
        })
      } else {
        gsap.set([glitchLayer1Ref.current, glitchLayer2Ref.current], { autoAlpha: 0 })
      }

      // Progress bar fill + percentage counter, tied to the same tween
      if (progressBarRef.current) {
        gsap.set(progressBarRef.current, { scaleX: 0, transformOrigin: 'left center' })
      }

      gsap.to(progressState, {
        value: 99,
        duration: displayDuration,
        ease: 'power1.inOut',
        onUpdate: () => {
          setProgress(Math.round(progressState.value))
          if (progressBarRef.current) {
            gsap.set(progressBarRef.current, { scaleX: progressState.value / 100 })
          }
        },
      })
    }, rootRef)

    const finish = () => {
      if (hasFinishedLoading) return
      hasFinishedLoading = true

      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, displayDuration * 1000 - elapsed)

      exitTimer = window.setTimeout(() => {
        root.dataset.preloader = 'leaving'

        // Stop the loop/fill tweens and snap progress to 100
        glitchTweens.forEach((tween) => tween.kill())
        gsap.killTweensOf(progressState)
        gsap.to(progressState, {
          value: 100,
          duration: 0.15,
          ease: 'power1.out',
          onUpdate: () => setProgress(Math.round(progressState.value)),
        })
        if (progressBarRef.current) {
          gsap.to(progressBarRef.current, { scaleX: 1, duration: 0.15, ease: 'power1.out' })
        }

        const exitTl = gsap.timeline({
          onComplete: () => {
            root.dataset.preloader = 'done'
            document.body.style.overflow = previousOverflow
            setIsVisible(false)
          },
        })

        if (rootRef.current) {
          exitTl.to(
            rootRef.current,
            {
              clipPath: 'inset(0% 0% 100% 0%)',
              y: '-5vh',
              duration: leaveDuration,
              ease: 'power4.inOut',
            },
            0,
          )
        }

        if (contentRef.current) {
          exitTl.to(
            contentRef.current,
            {
              opacity: 0,
              filter: 'blur(8px)',
              y: '-1.5rem',
              duration: leaveDuration,
              ease: 'power4.inOut',
            },
            0,
          )
        }
      }, remaining)
    }

    if (document.readyState === 'complete') {
      finish()
    } else {
      window.addEventListener('load', finish, { once: true })
    }

    return () => {
      window.removeEventListener('load', finish)
      document.body.style.overflow = previousOverflow

      if (exitTimer) window.clearTimeout(exitTimer)
      glitchTweens.forEach((tween) => tween.kill())
      gsap.killTweensOf(progressState)
      ctx.revert()
    }
  }, [exitDuration, minimumDuration])

  if (!isVisible) {
    return null
  }

  return (
    <div
      aria-label={`Loading ${brandText}`}
      aria-live="polite"
      className={styles.preloader}
      ref={rootRef}
      role="status"
    >
      <div aria-hidden className={styles.content} ref={contentRef}>
        <div className={styles.logoMask} ref={logoMaskRef}>
          <div className={styles.glitchContainer}>
            <div className={styles.logoBase} ref={logoBaseRef}>
              <Logo alt="" aria-hidden className={styles.logo} loading="eager" priority="high" />
            </div>
            <div className={styles.glitchLayer} ref={glitchLayer1Ref}>
              <Logo alt="" aria-hidden className={styles.logo} loading="eager" priority="high" />
            </div>
            <div className={styles.glitchLayer2} ref={glitchLayer2Ref}>
              <Logo alt="" aria-hidden className={styles.logo} loading="eager" priority="high" />
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden className={styles.progressPercent}>
        {progress}%
      </div>
      <div aria-hidden className={styles.progressTrack}>
        <span className={styles.progressBar} ref={progressBarRef} />
      </div>
    </div>
  )
}

export default Preloader
