import { Calendar, Info, Play, Sparkles } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ImageLoader } from '@/app/components/image-loader'
import { Button } from '@/app/components/ui/button'
import { useDiscoverWeekly } from '@/app/hooks/use-discover-weekly'
import { ROUTES } from '@/routes/routesList'
import { usePlayerActions } from '@/store/player.store'
import { navigateSafe } from '@/utils/navigateSafe'

export function DiscoverWeeklyCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { playlist, isGenerating, error, isConfigured } = useDiscoverWeekly()
  const { setSongList } = usePlayerActions()

  if (!isConfigured) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-dashed border-border/70 bg-card/30">
        <div className="relative z-10 flex h-full items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <Info className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <h3 className="mb-1 text-sm font-semibold">
              {t('home.discoverWeekly')}
            </h3>
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
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-destructive/60 bg-destructive/5">
        <div className="relative z-10 flex h-full items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <p className="text-xs text-destructive">
              {t('states.error.title')}
            </p>
            <p className="mt-1 text-[11px] text-destructive/85 line-clamp-2">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border/60 bg-card/25">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-6 w-6 animate-pulse text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t('home.generating')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!playlist || playlist.length === 0) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border/60 bg-card/25">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent" />
        <div className="relative z-10 flex h-full items-center justify-center p-8">
          <div className="text-center">
            <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2 text-sm">
              {t('home.discoverWeekly')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('home.weeklyMixSoon')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handlePlay = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setSongList(playlist, 0)
  }

  // Get cover art from first song
  const coverArt = playlist[0]?.coverArt

  return (
    <div
      className="group relative h-full w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/12 via-accent/8 to-background/10 p-4 transition-colors hover:border-primary/35"
      onClick={() => navigateSafe(navigate, ROUTES.LIBRARY.DISCOVER_WEEKLY)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigateSafe(navigate, ROUTES.LIBRARY.DISCOVER_WEEKLY)
        }
      }}
      role="link"
      tabIndex={0}
    >
      {coverArt && (
        <ImageLoader id={coverArt} type="album" size="300">
          {(src) => (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center blur-md scale-105 opacity-30"
                style={{ backgroundImage: `url(${src})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/35 via-background/22 to-background/35" />
              <div
                className="absolute right-0 top-0 h-full w-[58%] bg-cover bg-center opacity-70"
                style={{
                  backgroundImage: `url(${src})`,
                  WebkitMaskImage:
                    'linear-gradient(to left, rgba(0, 0, 0, 1) 58%, rgba(0, 0, 0, 0) 100%)',
                  maskImage:
                    'linear-gradient(to left, rgba(0, 0, 0, 1) 58%, rgba(0, 0, 0, 0) 100%)',
                }}
              />
              <div className="absolute right-0 top-0 h-full w-[62%] bg-gradient-to-l from-background/58 via-background/34 to-transparent" />
            </>
          )}
        </ImageLoader>
      )}
      {!coverArt && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent" />
      )}

      <div className="relative z-10 grid h-full grid-cols-[minmax(0,1fr),auto] items-stretch gap-3">
        <div className="flex min-w-0 flex-col justify-between">
          <div className="mb-2 inline-flex w-fit max-w-max self-start items-center gap-1.5 rounded-md border border-foreground/15 bg-foreground/5 px-2 py-1 text-xs text-foreground/75 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{t('home.weeklyMix')}</span>
          </div>
          <div className="min-w-0">
            <h2 className="line-clamp-2 break-words text-[1.05rem] font-semibold leading-snug sm:text-[1.12rem]">
              {t('home.discoverWeekly')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground/90">
              {t('playlist.songCount', { count: playlist.length })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePlay}
              className="h-7 gap-1.5 border border-primary/35 bg-primary/90 px-2.5 text-xs hover:bg-primary"
              size="sm"
            >
              <Play className="h-3.5 w-3.5" fill="currentColor" />
              {t('options.play')}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="h-[104px] w-[104px] overflow-hidden rounded-lg border border-border/50 bg-muted shadow-lg min-[1700px]:h-[116px] min-[1700px]:w-[116px]">
            {coverArt ? (
              <ImageLoader id={coverArt} type="album" size="420">
                {(src, isLoadingImage) => (
                  <>
                    {src && (
                      <img
                        src={src}
                        alt={t('home.discoverWeekly')}
                        className="h-full w-full object-cover text-transparent"
                      />
                    )}
                    {!src && !isLoadingImage && (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Calendar className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </>
                )}
              </ImageLoader>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
