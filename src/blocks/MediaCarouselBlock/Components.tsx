'use client'

import Autoplay from 'embla-carousel-autoplay'
import { useEffect, useRef, useState } from 'react'

import { Media } from '@/components/Media'
import { Card } from '@/components/ui/card'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi
} from '@/components/ui/carousel'
import type { MediaCarouselBlock as MediaCarouselBlockProps } from '@/payload-types'
import { cn } from '@/utilities/cn'

export const MediaCarouselBlockComponent: React.FC<MediaCarouselBlockProps> = ({
  autoplay,
  delay,
  slides,
}) => {
  const plugin = useRef(Autoplay({ delay: delay ?? 2000, stopOnInteraction: true }))
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap())

    const onSelect = () => setCurrent(api.selectedScrollSnap())

    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  const count = slides?.length ?? 0

  return (
    <Carousel
      setApi={setApi}
      plugins={autoplay ? [plugin.current] : []}
      className="relative w-full"
      onMouseEnter={autoplay ? plugin.current.stop : undefined}
      onMouseLeave={autoplay ? plugin.current.reset : undefined}
    >
      <CarouselContent>
        {slides?.map((slide, index) => (
          <CarouselItem key={slide.id ?? index}>
            <div className="p-1">
              <Card className="relative aspect-square overflow-hidden border-0 p-0 rounded-none h-screen w-full">
                <Media
                  resource={slide.image}
                  fill
                  imgClassName="h-screen w-full object-cover"
                  htmlElement={null}
                />
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 py-3">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            className={cn(
              'h-2 cursor-pointer rounded-full transition-all duration-500 ease-in-out',
              index === current
                ? 'bg-primary w-4 opacity-100'
                : 'bg-muted-foreground w-2 opacity-30 hover:opacity-50',
            )}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </Carousel>
  )
}
