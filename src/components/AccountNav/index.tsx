'use client'

import { Button } from '@/components/ui/button'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  className?: string
}

export const AccountNav: React.FC<Props> = ({ className }) => {
  const pathname = usePathname()

  return (
    <div className={clsx(className)}>
      <ul className="flex flex-col gap-2 uppercase tracking-widest">
        <li>
          <Button
            className={clsx('text-primary/50 hover:text-primary-foreground', {
              'text-primary-foreground underline': pathname === '/account',
            })}
            asChild
            variant="link"
          >
            <Link href="/account">Account settings</Link>
          </Button>
        </li>

        <li>
          <Button
            className={clsx('text-primary/50 hover:text-primary-foreground', {
              'text-primary-foreground underline': pathname === '/account/addresses',
            })}
            asChild
            variant="link"
          >
            <Link href="/account/addresses">Addresses</Link>
          </Button>
        </li>

        <li>
          <Button
            asChild
            variant="link"
            className={clsx('text-primary/50 hover:text-primary-foreground', {
              'text-primary-foreground underline': pathname === '/orders' || pathname.includes('/orders'),
            })}
          >
            <Link href="/orders">Orders</Link>
          </Button>
        </li>
      </ul>

      <hr className="w-full border-white/5" />

      <Button
        asChild
        variant="link"
        className={clsx('text-primary/50 hover:text-primary-foreground', {
          'text-primary-foreground': pathname === '/logout',
        })}
      >
        <Link href="/logout">Log out</Link>
      </Button>
    </div>
  )
}
