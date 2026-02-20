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
    <div className="relative w-full h-[250px] 2xl:h-[300px] overflow-hidden">
      {/* Background Image with Blur */}
      <ImageLoader id={song.coverArt} type="album">
        {(src) => (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40"
              style={{ backgroundImage: `url(${src})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/80" />
          </>
        )}
      </ImageLoader>

      {/* Content */}
      <div className="relative h-full flex items-center gap-6 px-8 z-10">
        {/* Album Cover */}
        <Link
          to={ROUTES.ALBUM.PAGE(song.albumId)}
          className="flex-shrink-0 group relative"
        >
          <ImageLoader id={song.coverArt} type="album">
            {(src) => (
              <div className="relative">
                <img
                  src={src}
                  alt={song.title}
                  className={cn(
                    'w-[180px] h-[180px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl object-cover transition-all duration-300 group-hover:scale-105',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => setImageLoaded(true)}
                />
                {/* On Repeat Badge */}
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <Repeat className="w-3 h-3" />
                  On Repeat
                </div>
              </div>
            )}
          </ImageLoader>
        </Link>

        {/* Song Info */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Repeat className="w-4 h-4 text-primary" />
              <p className="text-sm text-primary font-medium">
                {t('home.mostPlayedTrack')}
              </p>
            </div>
            <Link
              to={ROUTES.ALBUM.PAGE(song.albumId)}
              className="hover:underline"
            >
              <h2 className="text-4xl 2xl:text-5xl font-bold truncate">
                {song.title}
              </h2>
            </Link>
            <Link
              to={ROUTES.ARTIST.PAGE(song.artistId)}
              className="text-xl text-muted-foreground hover:text-primary hover:underline inline-block mt-1"
            >
              {song.artist}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
              {t('home.playsThisWeek', { count: playcount })}
            </span>
            {song.genre && (
              <span className="px-3 py-1 text-xs rounded-full bg-muted">
                {song.genre}
              </span>
            )}
            {song.year && (
              <span className="px-3 py-1 text-xs rounded-full bg-muted">
                {song.year}
              </span>
            )}
          </div>

          <Button
            onClick={handlePlaySong}
            className="w-fit gap-2"
            size="lg"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            {t('home.playNow')}
          </Button>
        </div>
      </div>
    </div>
  )
}
