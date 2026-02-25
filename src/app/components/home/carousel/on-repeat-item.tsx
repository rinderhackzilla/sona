import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Play, Repeat } from 'lucide-react'
import { ImageLoader } from '@/app/components/image-loader'
import { Button } from '@/app/components/ui/button'
import { ROUTES } from '@/routes/routesList'
import type { Song } from '@/types/responses/song'
import { usePlayerActions } from '@/store/player.store'
import { cn } from '@/lib/utils'

interface OnRepeatItemProps {
  song: Song
  playcount: number
}

export function OnRepeatItem({ song, playcount }: OnRepeatItemProps) {
  const { t } = useTranslation()
  const { setSongList } = usePlayerActions()
  const [imageLoaded, setImageLoaded] = useState(false)

  function handlePlaySong() {
    setSongList([song], 0)
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background Image with Blur */}
      <ImageLoader id={song.coverArt} type="album">
        {(src) => (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-45"
              style={{ backgroundImage: `url(${src})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/72 via-background/52 to-background/86" />
          </>
        )}
      </ImageLoader>

      {/* Content */}
      <div className="relative z-10 grid h-full grid-cols-[auto,minmax(0,1fr)] items-center gap-5 py-4 pl-7 pr-5 min-[1700px]:gap-6 min-[1700px]:py-5 min-[1700px]:pl-8 min-[1700px]:pr-6 min-[2600px]:gap-7 min-[2600px]:pl-9 min-[2600px]:pr-7">
        <Link to={ROUTES.ALBUM.PAGE(song.albumId)} className="group relative block">
          <ImageLoader id={song.coverArt} type="album">
            {(src) => (
              <img
                src={src}
                alt={song.title}
                className={cn(
                  'aspect-square h-[236px] w-[236px] rounded-xl border border-border/55 object-cover shadow-2xl transition-all duration-300 group-hover:scale-[1.02] min-[1700px]:h-[272px] min-[1700px]:w-[272px] min-[2600px]:h-[300px] min-[2600px]:w-[300px]',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                )}
                onLoad={() => setImageLoaded(true)}
              />
            )}
          </ImageLoader>
        </Link>

        <div className="min-w-0 space-y-3">
          <div className="space-y-1.5">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
              <Repeat className="w-3.5 h-3.5" />
              <span>On Repeat</span>
            </div>
            <Link
              to={ROUTES.ALBUM.PAGE(song.albumId)}
              className="hover:underline"
            >
              <h2 className="truncate text-[1.9rem] font-bold leading-tight min-[1700px]:text-[2.2rem] min-[2600px]:text-[2.45rem]">
                {song.title}
              </h2>
            </Link>
            <Link
              to={ROUTES.ARTIST.PAGE(song.artistId)}
              className="inline-block text-base text-muted-foreground hover:text-primary hover:underline min-[1700px]:text-[1.1rem]"
            >
              {song.artist}
            </Link>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-sm text-foreground/80 backdrop-blur-sm min-[2300px]:text-base">
              <span>{t('home.playsThisWeek', { count: playcount })}</span>
              {(song.genre || song.year) && (
                <span className="text-foreground/40">•</span>
              )}
              {song.genre && (
                <span>{song.genre}</span>
              )}
              {song.genre && song.year && (
                <span className="text-foreground/40">•</span>
              )}
              {song.year && (
                <span>{song.year}</span>
              )}
            </div>
          </div>

          <Button
            onClick={handlePlaySong}
            className="w-fit gap-2 border border-primary/30 bg-primary/90 hover:bg-primary"
            size="sm"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            {t('home.playNow')}
          </Button>
        </div>
      </div>
    </div>
  )
}
