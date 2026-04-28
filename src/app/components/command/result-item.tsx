import { Play } from 'lucide-react'
import Image from '@/app/components/image'
import { ImageLoader } from '@/app/components/image-loader'
import { Button } from '@/app/components/ui/button'
import { CoverArt } from '@/types/coverArtType'

interface ResultItemProps {
  coverArt: string
  coverArtType: CoverArt
  title: string
  artist: string
  onClick: () => void
}

export function ResultItem({
  coverArt,
  coverArtType,
  title,
  artist,
  onClick,
}: ResultItemProps) {
  return (
    <div className="w-full">
      <div className="relative w-full">
        <ImageLoader id={coverArt} type={coverArtType} size={100}>
          {(src) => (
            <Image
              src={src}
              width={84}
              height={84}
              className="aspect-square w-full max-w-[84px] mx-auto object-cover rounded-[var(--radius-surface)] shadow"
              alt={`${artist} - ${title}`}
            />
          )}
        </ImageLoader>

        <Button
          variant="default"
          size="icon"
          className="absolute right-0.5 top-0.5 size-5 rounded-full border border-primary/70 bg-primary/90 text-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.45)] hover:bg-primary"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClick()
          }}
        >
          <Play className="w-3 h-3 fill-primary-foreground" />
        </Button>
      </div>
      <div className="mt-1.5 min-w-0">
        <p className="text-sm leading-4 line-clamp-2 min-h-7 font-semibold text-foreground">
          {title}
        </p>
        <p className="text-xs leading-4 truncate font-medium text-muted-foreground">
          {artist}
        </p>
      </div>
    </div>
  )
}
