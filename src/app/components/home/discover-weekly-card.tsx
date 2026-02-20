import { Calendar, Play, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import { ImageLoader } from '@/app/components/image-loader'
import { useDiscoverWeekly } from '@/app/hooks/use-discover-weekly'
import { usePlayerActions } from '@/store/player.store'
import { ROUTES } from '@/routes/routesList'

export function DiscoverWeeklyCard() {
  const { t } = useTranslation()
  const { playlist, isGenerating, error, isConfigured } = useDiscoverWeekly()
  const { setSongList } = usePlayerActions()

  if (!isConfigured) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg bg-muted/20 border-dashed">
        <div className="relative h-full flex items-center justify-center p-8 z-10">
          <div className="text-center max-w-sm">
            <Info className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-semibold mb-1 text-sm">{t('home.discoverWeekly')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('home.configureLastfm')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg bg-destructive/5 border-destructive">
        <div className="relative h-full flex items-center justify-center p-8 z-10">
          <div className="text-center max-w-sm">
            <p className="text-xs text-destructive">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative h-full flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-6 w-6 animate-pulse text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('generic.loading')}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!playlist || playlist.length === 0) {
    return (
      <div className="relative w-full h-full overflow-hidden border rounded-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
        <div className="relative h-full flex items-center justify-center p-8 z-10">
          <div className="text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2 text-sm">{t('home.discoverWeekly')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('home.weeklyMixSoon')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handlePlay = () => {
    setSongList(playlist, 0)
  }

  // Get cover art from first song
  const coverArt = playlist[0]?.coverArt

  return (
    <div className="relative w-full h-full overflow-hidden border rounded-lg">
      {/* Background Image with Blur */}
      {coverArt && (
        <ImageLoader id={coverArt} type="album" size="300">
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
      )}
      {!coverArt && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
      )}

      {/* Content */}
      <div className="relative h-full flex items-stretch gap-4 sm:gap-6 px-4 sm:px-8 z-10">
        {/* Cover Image - Left Side - Linked to Discover Weekly page */}
        <div className="flex-shrink-0 flex items-center">
          <Link
            to={ROUTES.LIBRARY.DISCOVER_WEEKLY}
            className="relative"
          >
            {coverArt ? (
              <ImageLoader id={coverArt} type="album" size="300">
                {(src, isLoadingImage) => (
                  <>
                    {src && (
                      <img
                        src={src}
                        alt={t('home.discoverWeekly')}
                        className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl object-cover cursor-pointer transition-transform hover:scale-105"
                      />
                    )}
                    {!src && !isLoadingImage && (
                      <div className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </>
                )}
              </ImageLoader>
            ) : (
              <div className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] 2xl:w-[220px] 2xl:h-[220px] rounded-lg shadow-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </Link>
        </div>

        {/* Info - Right Side */}
        <div className="flex-1 flex flex-col justify-between min-w-0 py-6 sm:py-8" style={{ containerType: 'inline-size' }}>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
              {t('home.weeklyMix')}
            </p>
            <h2 className="font-bold leading-none" style={{ fontSize: 'clamp(1.5rem, 10cqi, 4.5rem)' }}>
              {t('home.discoverWeekly').split(' ').map((word, i) => (
                <span key={i} className="block">{word}</span>
              ))}
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">
              {t('playlist.songCount', { count: playlist.length })}
            </span>
            <Button
              onClick={handlePlay}
              className="w-fit gap-2"
              size="sm"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              {t('options.play')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
