import type { ComponentPropsWithoutRef, CSSProperties } from 'react'
import clsx from 'clsx'

import styles from './Logo.module.scss'

const logo = {
  alt: 'StereoLuxury Logo',
  height: 34,
  src: '/images/stereo-logo-removebg.png',
  width: 193,
} as const

type LogoVariant = 'default' | 'admin' | 'icon'

type Size = number | string

export type LogoProps = Pick<
  ComponentPropsWithoutRef<'img'>,
  'alt' | 'aria-hidden' | 'className' | 'decoding' | 'loading' | 'title'
> & {
  priority?: 'auto' | 'high' | 'low'
  variant?: LogoVariant
  /** Overrides the variant's default width. Number = px, or pass any CSS length ('4rem', '50%', etc). */
  width?: Size
  /** Overrides the variant's default height. Number = px, or pass any CSS length. */
  height?: Size
}

const toCSSLength = (value: Size | undefined): string | undefined => {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

export const Logo = (props: LogoProps) => {
  const {
    alt = logo.alt,
    className,
    decoding = 'async',
    loading = 'lazy',
    priority = 'low',
    title,
    variant = 'default',
    width,
    height,
  } = props

  const style: CSSProperties | undefined =
    width !== undefined || height !== undefined
      ? {
          width: toCSSLength(width),
          height: toCSSLength(height),
          maxWidth: width !== undefined ? 'none' : undefined, // let explicit width win over the .logo max-width cap
        }
      : undefined

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      aria-hidden={props['aria-hidden']}
      alt={alt}
      className={clsx(styles.logo, styles[variant], className)}
      decoding={decoding}
      fetchPriority={priority}
      height={logo.height}
      loading={loading}
      src={logo.src}
      style={style}
      title={title}
      width={logo.width}
    />
  )
}

export const AdminLogo = (props: LogoProps) => (
  <Logo
    alt={props.alt}
    aria-hidden={props['aria-hidden']}
    className={props.className}
    decoding={props.decoding}
    loading={props.loading || 'eager'}
    priority={props.priority || 'high'}
    title={props.title}
    variant="admin"
    width={props.width}
    height={props.height}
  />
)

export const AdminLogoIcon = (props: LogoProps) => (
  <Logo
    alt={props.alt}
    aria-hidden={props['aria-hidden']}
    className={props.className}
    decoding={props.decoding}
    loading={props.loading || 'eager'}
    priority={props.priority || 'high'}
    title={props.title}
    variant="icon"
    width={props.width}
    height={props.height}
  />
)

export default Logo