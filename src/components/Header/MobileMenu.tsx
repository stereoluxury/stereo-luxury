'use client'

import type { NavItem } from './types'

import { CMSLink } from '@/components/Link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/Auth'
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { audienceUrl, categoryUrl } from '@/utilities/categoryUrl'

interface Props {
  menu: NavItem[]
}

export function MobileMenu({ menu }: Props) {
  const { user } = useAuth()

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger className="relative hover:text-primary-foreground flex h-11 w-11 items-center justify-center rounded-none transition-colors">
        <MenuIcon className="h-4" />
      </SheetTrigger>

      <SheetContent side="left" className="px-4 gap-0 overflow-y-auto">
        <SheetHeader className="px-0 pt-4 pb-0">
          <SheetTitle className="sr-only">Site navigation</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <div className="py-4 tracking-widest">
          {menu?.length ? (
            <Accordion type="multiple" className="w-full">
              {menu.map((item) =>
                item.type === 'megaMenu' ? (
                  <AccordionItem key={item.id} value={item.id} className="border-none">
                    <AccordionTrigger className="py-2 text-base font-normal hover:no-underline uppercase">
                      {item.megaMenu.label}
                    </AccordionTrigger>
                    <AccordionContent>
                      <MobileMegaMenu megaMenu={item.megaMenu} />
                    </AccordionContent>
                  </AccordionItem>
                ) : (
                  <div className="py-2" key={item.id}>
                    <CMSLink {...item.link} appearance="link" />
                  </div>
                ),
              )}
            </Accordion>
          ) : null}
        </div>

        {user ? (
          <div className="mt-4 uppercase tracking-widest">
            <h2 className="text-xl mb-4">My account</h2>
            <hr className="my-2" />
            <ul className="flex flex-col">
              <li className="py-2">
                <Button asChild className="p-0 h-auto" variant="link">
                  <Link href="/orders">Orders</Link>
                </Button>
              </li>
              <li className="py-2">
                <Button asChild className="p-0 h-auto" variant="link">
                  <Link href="/account/addresses">Addresses</Link>
                </Button>
              </li>
              <li className="py-2">
                <Button asChild className="p-0 h-auto" variant="link">
                  <Link href="/account">Manage account</Link>
                </Button>
              </li>
              <li className="mt-6">
                <Button asChild variant="outline" className="w-full rounded-none">
                  <Link href="/logout">Log out</Link>
                </Button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="uppercase tracking-widest">
            <div className="mt-4 flex flex-col gap-2 md:flex-row sm:items-center">
              <Button asChild className="w-full sm:flex-1 rounded-none" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <span className="text-center text-sm text-muted-foreground sm:text-base">or</span>
              <Button asChild className="w-full sm:flex-1 rounded-none">
                <Link href="/create-account">Create an account</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MobileMegaMenu({
  megaMenu,
}: {
  megaMenu: Extract<NavItem, { type: 'megaMenu' }>['megaMenu']
}) {
  const { audience } = megaMenu

  return (
    <div className="space-y-8 pb-4">
      <Link
        href={audienceUrl(audience)}
        className="block text-sm font-medium uppercase tracking-widest"
      >
        Shop all {megaMenu.label}
      </Link>

      {megaMenu.featured?.length ? (
        <div className="grid grid-cols-2 gap-x-4">
          {megaMenu.featured.map((f) => (
            <Link
              key={f.title}
              href={categoryUrl(audience, f.link)}
              className="group relative text-sm"
            >
              <img
                alt={f.image.alt ?? f.title}
                src={f.image.url ?? ''}
                className="aspect-square w-full bg-muted object-cover"
              />
              <span className="mt-2 block font-medium text-xs">{f.title}</span>
            </Link>
          ))}
        </div>
      ) : null}

      {megaMenu.sections.map((section) => (
        <div key={section.label}>
          <p className="font-medium text-foreground uppercase tracking-widest">{section.label}</p>
          <ul className="mt-4 flex flex-col space-y-4">
            {section.categories.map((cat) => (
              <li key={typeof cat === 'object' ? cat.id : cat}>
                <Link href={categoryUrl(audience, cat)} className="text-muted-foreground">
                  {typeof cat === 'object' ? cat.title : ''}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
