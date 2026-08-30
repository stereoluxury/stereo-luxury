'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { RichText } from '@/components/RichText'

export const HighImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  })

  return (
    <div
      className="relative mt-[-10.4rem] flex min-h-screen items-center justify-center overflow-hidden text-white"
      data-theme="dark"
    >
      <div className="container relative z-10 mb-8 flex items-center justify-center">
        <div className="max-w-146 md:text-center">
          {/* {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex md:justify-center gap-4">
              {links.map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...link} />
                  </li>
                )
              })}
            </ul>
          )} */}
        </div>
      </div>

      {media && typeof media === 'object' && (
        <Media
          className="pointer-events-none absolute inset-0 z-0 select-none"
          fill
          imgClassName="object-cover"
          priority
          resource={media}
          videoClassName="h-full w-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-0 z-0 bg-black/45" />
    </div>
  )
}
