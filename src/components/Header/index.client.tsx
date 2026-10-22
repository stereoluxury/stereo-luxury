'use client'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { Suspense } from 'react'

import { useScroll } from '@/hooks/use-scroll'
import { cn } from '@/utilities/cn'
import { usePathname } from 'next/navigation'
import type { Header } from 'src/payload-types'
import Logo from '../Logo'
import { MobileMenu } from './MobileMenu'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu'
import { NavItem } from './types'
import { ChevronDown } from 'lucide-react'
import { audienceUrl, categoryUrl } from '@/utilities/categoryUrl'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const menu = (header.navItems ?? []) as NavItem[]
  const pathname = usePathname()
  const scrolled = useScroll(10)

  return (
    <div
      className={cn('sticky top-0 z-50 w-full border-transparent border-b pb-1', {
        'border-border bg-background backdrop-blur-sm supports-backdrop-filter:bg-background':
          scrolled,
      })}
    >
      <nav className="flex items-center md:items-end justify-between container pt-2">
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="hidden md:flex w-full items-end gap-6 md:w-1/3">
            {menu.length ? (
              <NavigationMenu>
                <NavigationMenuList className="gap-4 border-none">
                  {menu.map((item) =>
                    item.type === 'megaMenu' ? (
                      <NavigationMenuItem className="" key={item.id}>
                        <NavigationMenuTrigger asChild>
                          <Link
                            href={audienceUrl(item.megaMenu.audience)}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              'relative h-auto navLink group inline-flex items-center text-xs! md:text-base! bg-transparent text-primary/50 hover:text-primary-foreground [&.active]:text-primary-foreground p-0! pt-2! pb-6! focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-transparent focus:bg-transparent focus:text-primary-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-primary-foreground data-[state=open]:bg-transparent/50 data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent transition-all duration-300 tracking-widest font-medium',
                              {
                                active: pathname.startsWith(audienceUrl(item.megaMenu.audience)),
                              },
                            )}
                          >
                            {item.megaMenu.label}
                            <ChevronDown
                              className="relative top-px ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
                              aria-hidden="true"
                            />
                          </Link>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="rounded-none bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50">
                          <MegaMenuPanel megaMenu={item.megaMenu} />
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    ) : (
                      <NavigationMenuItem key={item.id}>
                        <NavigationMenuLink asChild>
                          <CMSLink
                            {...item.link}
                            size="clear"
                            className={cn('relative navLink text-xs md:text-base', {
                              active:
                                item.link.url && item.link.url !== '/'
                                  ? pathname.includes(item.link.url)
                                  : false,
                            })}
                            appearance="nav"
                          />
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ),
                  )}
                </NavigationMenuList>
              </NavigationMenu>
            ) : null}
          </div>

          <div className="mx-auto">
            <Link className="flex w-full items-center justify-center md:w-auto" href="/">
              <Logo className="w-6" />
            </Link>
          </div>

          <div className="flex justify-end md:w-1/3 gap-4">
            <Suspense fallback={<OpenCartButton />}>
              <Cart />
            </Suspense>
          </div>
        </div>
      </nav>
    </div>
  )
}

function MegaMenuPanel({
  megaMenu,
}: {
  megaMenu: Extract<NavItem, { type: 'megaMenu' }>['megaMenu']
}) {
  const { audience } = megaMenu

  return (
    <div className="w-screen mx-auto max-w-6xl px-4 py-10 uppercase tracking-widest sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-x-8 gap-y-10">
        {/* Featured tiles */}
        {megaMenu.featured?.length ? (
          <div className="col-start-2 grid grid-cols-2 gap-x-8">
            {megaMenu.featured.map((f) => (
              <NavigationMenuLink asChild key={f.title}>
                <Link
                  href={categoryUrl(audience, f.link)}
                  className="group relative text-base sm:text-sm"
                >
                  <img
                    alt={f.image.alt ?? f.title}
                    src={f.image.url ?? ''}
                    className="aspect-square w-full bg-muted object-cover group-hover:opacity-75"
                  />
                  <span className="mt-6 block font-medium text-foreground">{f.title}</span>
                  <span aria-hidden className="mt-1 block text-muted-foreground">
                    Shop now
                  </span>
                </Link>
              </NavigationMenuLink>
            ))}
          </div>
        ) : null}

        {/* Section columns */}
        <div className="row-start-1 grid grid-cols-3 gap-x-8 gap-y-10 text-sm">
          {megaMenu.sections.map((section) => (
            <div key={section.label}>
              <p className="font-medium text-foreground">{section.label}</p>
              <ul className="mt-6 space-y-4">
                {section.categories.map((cat) => (
                  <li key={typeof cat === 'object' ? cat.id : cat}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={categoryUrl(audience, cat)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {typeof cat === 'object' ? cat.title : ''}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
