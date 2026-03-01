import { RefreshCw, Music, Play, Info } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/app/components/ui/button'
import { ImageLoader } from '@/app/components/image-loader'
import { useThisIsArtist } from '@/app/hooks/use-this-is-artist'
import { ROUTES } from '@/routes/routesList'
import { usePlayerActions } from '@/store/player.store'
import { navigateSafe } from '@/utils/navigateSafe'

export function ThisIsArtist() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    playlist,
    artist,
    isGenerating,
    error,
    generate,
    isConfigured,
  } = useThisIsArtist()
  const { setSongList } = usePlayerActions()

  if (!isConfigured) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-dashed border-border/70 bg-card/30">
        <div className="relative z-10 flex h-full items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <Info className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <h3 className="mb-1 text-sm font-semibold">{t('home.thisIsArtist')}</h3>
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
              Error: {error}
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
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('home.generating')}</span>
          </div>
        </div>
      </div>
    )
  }

  if (playlist.length === 0 || !artist) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-border/60 bg-card/25">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent" />
        <div className="relative z-10 flex h-full items-center justify-center p-8">
          <div className="text-center">
            <Music className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2 text-sm">{t('home.thisIsArtist')}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {t('home.generatePlaylist')}
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={generate}
              disabled={isGenerating}
              className="h-8 border border-primary/35 bg-primary/90 px-3 hover:bg-primary"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              {t('home.generate')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handlePlay = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setSongList(playlist, 0)
  }

  return (
    <div
      className="relative h-full w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card/20"
      onClick={() => navigateSafe(navigate, ROUTES.LIBRARY.THIS_IS_ARTIST)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigateSafe(navigate, ROUTES.LIBRARY.THIS_IS_ARTIST)
        }
      }}
      role="link"
      tabIndex={0}
    >
      {/* Background Image with Blur */}
      <ImageLoader id={artist.coverArt} type="artist" size="300">
        {(artistCoverUrl) => (
          <>
            {artistCoverUrl && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40"
                  style={{ backgroundImage: `url(${artistCoverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/84 via-background/66 to-background/84" />
              </>
            )}
          </>
        )}
      </ImageLoader>

      {/* Content */}
      <div className="relative z-10 grid h-full grid-cols-[minmax(0,1fr),auto] items-center gap-3 p-3.5 min-[1600px]:gap-2.5 min-[1600px]:p-3 min-[2300px]:gap-4 min-[2300px]:p-4">
        {/* Info - Left */}
        <div className="flex min-w-0 flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/85 min-[2300px]:text-xs">
              {t('home.thisIsPrefix')}
            </p>
            <h2 className="line-clamp-2 break-words text-[1.2rem] font-semibold leading-tight min-[1600px]:text-[1.02rem] min-[2300px]:text-[1.45rem]">
              {artist.name}
            </h2>
            <p className="text-[11px] text-muted-foreground/90 min-[2300px]:text-xs">
              {t('playlist.songCount', { count: playlist.length })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 min-[2300px]:gap-2">
            <Button
              onClick={handlePlay}
              className="h-7 gap-1.5 border border-primary/35 bg-primary/90 px-2.5 text-xs hover:bg-primary min-[2300px]:h-8 min-[2300px]:gap-2 min-[2300px]:px-3"
              size="sm"
            >
              <Play className="h-3.5 w-3.5 min-[2300px]:h-4 min-[2300px]:w-4" fill="currentColor" />
              {t('options.play')}
            </Button>
          </div>
        </div>

        {/* Artist Image - Right Side */}
        <div className="flex items-center justify-end">
          <div className="group relative h-[142px] w-[142px] shrink-0 min-[1600px]:h-[112px] min-[1600px]:w-[112px] min-[2300px]:h-[154px] min-[2300px]:w-[154px]">
            <div className="block h-full w-full overflow-hidden rounded-lg border border-border/60 shadow-xl transition-all duration-300 hover:scale-[1.015]">
              <ImageLoader id={artist.coverArt} type="artist" size="300">
                {(artistCoverUrl, isLoadingImage) => (
                  <>
                    {artistCoverUrl && (
                      <img
                        src={artistCoverUrl}
                        alt={artist.name}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    )}
                    {!artistCoverUrl && !isLoadingImage && (
                      <div className="flex aspect-square h-full w-full items-center justify-center bg-muted shadow-xl">
                        <Music className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </>
                )}
              </ImageLoader>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={(event) => {
                event.stopPropagation()
                generate()
              }}
              disabled={isGenerating}
              className="absolute bottom-2 right-2 z-20 h-7 w-7 rounded-full border border-border/70 bg-background/85 shadow-md backdrop-blur-sm transition hover:bg-background min-[2300px]:h-8 min-[2300px]:w-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
