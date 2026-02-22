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
    <div className="relative h-[222px] w-full overflow-hidden sm:h-[252px] 2xl:h-[278px]">
      {/* Background Image with Blur */}
      <ImageLoader id={song.coverArt} type="album">
        {(src) => (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-45"
              style={{ backgroundImage: `url(${src})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/88 via-background/56 to-background/82" />
          </>
        )}
      </ImageLoader>

      {/* Content */}
      <div className="relative z-10 grid h-full grid-cols-[minmax(0,1fr),auto] items-center gap-5 px-5 sm:gap-8 sm:px-7">
        {/* Song Info */}
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
              <Repeat className="w-3.5 h-3.5" />
              <span>On Repeat</span>
            </div>
            <Link
              to={ROUTES.ALBUM.PAGE(song.albumId)}
              className="hover:underline"
            >
              <h2 className="truncate text-[1.65rem] font-bold leading-tight sm:text-[2rem] xl:text-[2.5rem] 2xl:text-[2.95rem]">
                {song.title}
              </h2>
            </Link>
            <Link
              to={ROUTES.ARTIST.PAGE(song.artistId)}
              className="inline-block text-base text-muted-foreground hover:text-primary hover:underline sm:text-lg"
            >
              {song.artist}
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="inline-flex items-center gap-2 rounded-md border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-sm text-foreground/80 backdrop-blur-sm">
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

        {/* Cover */}
        <Link
          to={ROUTES.ALBUM.PAGE(song.albumId)}
          className="group relative flex-shrink-0"
        >
          <ImageLoader id={song.coverArt} type="album">
            {(src) => (
              <img
                src={src}
                alt={song.title}
                className={cn(
                  'h-[176px] w-[176px] rounded-xl border border-border/50 object-cover shadow-2xl transition-all duration-300 group-hover:scale-[1.025] sm:h-[202px] sm:w-[202px] 2xl:h-[228px] 2xl:w-[228px]',
                  imageLoaded ? 'opacity-100' : 'opacity-0',
                )}
                onLoad={() => setImageLoaded(true)}
              />
            )}
          </ImageLoader>
        </Link>
      </div>
    </div>
  )
}
