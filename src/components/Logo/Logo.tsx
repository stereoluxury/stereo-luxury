import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

import styles from './Logo.module.scss'

const logo = {
  alt: 'StereoLuxury Logo',
  height: 34,
  src: '/images/stereo-logo-removebg.png',
  width: 193,
} as const

type LogoVariant = 'default' | 'admin' | 'icon'

export type LogoProps = Pick<
  ComponentPropsWithoutRef<'img'>,
  'alt' | 'aria-hidden' | 'className' | 'decoding' | 'loading' | 'title'
> & {
  priority?: 'auto' | 'high' | 'low'
  variant?: LogoVariant
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
  } = props

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
  />
)

export default Logo
