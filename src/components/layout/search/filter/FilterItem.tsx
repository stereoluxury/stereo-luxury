'use client'

import type { SortFilterItem as SortFilterItemType } from '@/lib/sorting'

import { createUrl } from '@/utilities/createUrl'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import type { ListItem, PathFilterItem as PathFilterItemType } from '.'

function FilterCheckbox({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        'flex h-4 w-4 flex-none items-center justify-center border transition-colors',
        active
          ? 'border-primary-foreground bg-primary-foreground'
          : 'bg-transparent group-hover:border-primary-foreground/70',
      )}
    >
      <Check
        className={clsx(
          'h-3 w-3 text-white transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
        strokeWidth={3}
      />
    </span>
  )
}

function PathFilterItem({ item }: { item: PathFilterItemType }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = pathname === item.path
  const newParams = new URLSearchParams(searchParams.toString())
  const DynamicTag = active ? 'p' : Link

  newParams.delete('q')

  return (
    <li className="mt-2 flex text-black dark:text-white" key={item.title}>
      <DynamicTag
        aria-checked={active}
        role="checkbox"
        className="group flex w-full items-center gap-2 text-sm dark:hover:text-neutral-100"
        href={createUrl(item.path, newParams)}
      >
        <FilterCheckbox active={active} />
        <span
          className={clsx('transition-colors', {
            'text-primary-foreground': active,
            'group-hover:text-primary-foreground': !active,
          })}
        >
          {item.title}
        </span>
      </DynamicTag>
    </li>
  )
}

function SortFilterItem({ item }: { item: SortFilterItemType }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('sort') === item.slug
  const q = searchParams.get('q')
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug }),
    }),
  )
  const DynamicTag = active ? 'p' : Link

  return (
    <li className="mt-2 flex text-sm text-black dark:text-white" key={item.title}>
      <DynamicTag
        aria-checked={active}
        role="checkbox"
        className="group flex w-full items-center gap-2"
        href={href}
        prefetch={!active ? false : undefined}
      >
        <FilterCheckbox active={active} />
        <span
          className={clsx('transition-colors uppercase tracking-widest font-bold', {
            'text-primary-foreground': active,
            'group-hover:text-primary-foreground': !active,
          })}
        >
          {item.title}
        </span>
      </DynamicTag>
    </li>
  )
}

export function FilterItem({ item }: { item: ListItem }) {
  return 'path' in item ? <PathFilterItem item={item} /> : <SortFilterItem item={item} />
}
