'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function FiltersSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setOpen(false)
  }, [pathname, searchParams])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-none uppercase tracking-widest">
          <SlidersHorizontal className="h-4 w-4" />
          Filter & Sort
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="uppercase font-anton tracking-wide">Filter & Sort</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-8 px-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
