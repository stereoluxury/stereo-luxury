import type { Footer } from '@/payload-types'

import { FooterMenu } from '@/components/Footer/menu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import { Suspense } from 'react'
import Logo from '../Logo'

const { COMPANY_NAME, SITE_NAME } = process.env

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()
  const menu = footer.navItems || []
  const currentYear = new Date().getFullYear()
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : '')
  const skeleton = 'w-full h-6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700'

  const copyrightName = COMPANY_NAME || SITE_NAME || ''

  return (
    <footer className="text-sm text-neutral-500 dark:text-neutral-400 mt-auto uppercase tracking-widest">
      <div className="container">
        <div className="flex w-full flex-col gap-6 border-neutral-200 py-12 text-sm dark:border-neutral-700">
          <div>
            <Link className="flex items-center gap-2 text-black md:pt-1 dark:text-white" href="/">
              <Logo className="w-6" />
              <span className="sr-only">{SITE_NAME}</span>
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="flex h-47 w-50 flex-col gap-2">
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
              </div>
            }
          >
            <FooterMenu menu={menu} />
          </Suspense>
          {/* <div className="md:ml-auto flex flex-col gap-4 items-end">
            <ThemeSelector />
          </div> */}
        </div>
      </div>
      <div className="border-t border-neutral-200 py-6 text-sm dark:border-neutral-700">
        <div className="container mx-auto flex w-full flex-col gap-4 justify-between items-center md:flex-row md:gap-0">
          <p className="text-center">
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
          </p>

          <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
            {/* Instagram */}
            <Link
              href="https://www.instagram.com/stereo_luxury?stkn=Y3kxOGY2NWQ5c3lx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-muted-foreground hover:text-primary block"
            >
              <svg className="size-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4zm4.4 3a5 5 0 1 1 0 10a5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6m5.2-3.5a1.25 1.25 0 1 1 0 2.5a1.25 1.25 0 0 1 0-2.5"
                />
              </svg>
            </Link>

            {/* Snapchat */}
            <Link
              href="https://www.snapchat.com/@stereoluxury"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Snapchat"
              className="text-muted-foreground hover:text-primary block"
            >
              <svg className="size-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2a7 7 0 0 0-7 7v3.2c0 .7-.3 1.3-.8 1.8l-.8.7c-.5.4-.3 1.2.3 1.4l2.3.7c.3 1.2 1.2 2 2.4 2.3c.7.2 1.2.5 1.7.9c.6.5 1.2 1 1.9 1s1.3-.5 1.9-1c.5-.4 1-.7 1.7-.9c1.2-.3 2.1-1.1 2.4-2.3l2.3-.7c.6-.2.8-1 .3-1.4l-.8-.7c-.5-.5-.8-1.1-.8-1.8V9a7 7 0 0 0-7-7m0 2a5 5 0 0 1 5 5v3.2c0 1.2.5 2.3 1.3 3.1l-1.5.5c-.4.1-.7.5-.7.9c0 .6-.4 1.1-1 1.2c-1 .2-1.7.7-2.3 1.2c-.3.3-.6.5-.8.5s-.5-.2-.8-.5c-.6-.5-1.3-1-2.3-1.2c-.6-.1-1-.6-1-1.2c0-.4-.3-.8-.7-.9l-1.5-.5A5 5 0 0 0 7 12.2V9a5 5 0 0 1 5-5"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
