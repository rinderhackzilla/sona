import { clsx } from 'clsx'
import {
  HeartIcon,
  Maximize2Icon,
  Music2Icon,
  PauseIcon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from 'lucide-react'
import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type WheelEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { MarqueeTitle } from '@/app/components/fullscreen/marquee-title'
import { ImageLoader } from '@/app/components/image-loader'
import { MiniPlayerProgress } from '@/app/components/mini-player/progress'
import { Button } from '@/app/components/ui/button'
import { SimpleTooltip } from '@/app/components/ui/simple-tooltip'
import { useTimeoutController } from '@/app/hooks/use-timeout-controller'
import {
  usePlayerActions,
  usePlayerCurrentList,
  usePlayerCurrentSong,
  usePlayerIsPlaying,
  usePlayerLoop,
  usePlayerPrevAndNext,
  usePlayerSongStarred,
  usePlayerVolume,
} from '@/store/player.store'
import { useMiniPlayerState } from '@/store/ui.store'
import { LoopState } from '@/types/playerContext'

export function MiniPlayerModePage() {
  const { t } = useTranslation()
  const { setOpen, pinned, togglePinned } = useMiniPlayerState()
  const { hasPrev, hasNext } = usePlayerPrevAndNext()
  const { volume, handleVolumeWheel } = usePlayerVolume()
  const isSongStarred = usePlayerSongStarred()
  const isPlaying = usePlayerIsPlaying()
  const loopState = usePlayerLoop()
  const song = usePlayerCurrentSong()
  const { togglePlayPause, playPrevSong, playNextSong, starCurrentSong } =
    usePlayerActions()
  const currentList = usePlayerCurrentList()
  const hasMiniPlayerApi =
    typeof window !== 'undefined' &&
    typeof window.api?.setMiniPlayerMode === 'function'
  const coverSize = useMemo(() => {
    if (typeof window === 'undefined') return 106
    const raw = getComputedStyle(document.documentElement).getPropertyValue(
      '--header-height',
    )
    const headerHeight = Number.parseFloat(raw) || 44
    return Math.round(headerHeight * 2.4)
  }, [])

  useEffect(() => {
    if (!hasMiniPlayerApi) return
    window.api.setMiniPlayerMode(true)
    return () => {
      window.api.setMiniPlayerMode(false)
    }
  }, [hasMiniPlayerApi])

  useEffect(() => {
    if (!hasMiniPlayerApi) return
    window.api.setMiniPlayerPinned(pinned)
  }, [hasMiniPlayerApi, pinned])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [setOpen])

  const title = song?.title ?? t('player.noPlayback', 'No playback active.')
  const artist = song?.artist ?? ''
  const hasSong = currentList.length > 0 && Boolean(song?.id)
  const [isIdle, setIsIdle] = useState(false)
  const [showVolumeOverlay, setShowVolumeOverlay] = useState(false)
  const [backgroundDimOpacity, setBackgroundDimOpacity] = useState(0.42)
  const idleTimer = useTimeoutController()
  const volumeOverlayTimer = useTimeoutController()
  const coverDisplaySize = isIdle ? Math.round(coverSize * 1.34) : coverSize
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 198
  const coverTop = isIdle
    ? Math.max(3, Math.round((viewportHeight - coverDisplaySize) / 2))
    : 18

  const clearIdleTimer = useCallback(() => {
    idleTimer.clear()
  }, [idleTimer])

  const startIdleTimer = useCallback(() => {
    idleTimer.schedule(() => {
      setIsIdle(true)
    }, 3000)
  }, [idleTimer])

  const handleMiniPlayerWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    handleVolumeWheel(event.deltaY > 0)

    setShowVolumeOverlay(true)
    volumeOverlayTimer.schedule(() => {
      setShowVolumeOverlay(false)
    }, 850)
  }

  const handleBackgroundImageLoad = (
    event: SyntheticEvent<HTMLImageElement>,
  ) => {
    try {
      const image = event.currentTarget
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return

      const size = 22
      canvas.width = size
      canvas.height = size
      context.drawImage(image, 0, 0, size, size)
      const data = context.getImageData(0, 0, size, size).data

      let sum = 0
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255
        if (alpha < 0.1) continue
        const red = data[i] / 255
        const green = data[i + 1] / 255
        const blue = data[i + 2] / 255
        sum += (0.2126 * red + 0.7152 * green + 0.0722 * blue) * alpha
        count += alpha
      }

      if (count <= 0) return
      const luminance = sum / count
      if (luminance >= 0.78) {
        setBackgroundDimOpacity(0.56)
        return
      }
      if (luminance >= 0.62) {
        setBackgroundDimOpacity(0.5)
        return
      }
      if (luminance >= 0.48) {
        setBackgroundDimOpacity(0.45)
        return
      }
      setBackgroundDimOpacity(0.4)
    } catch {
      setBackgroundDimOpacity(0.42)
    }
  }

  useEffect(() => {
    return () => {
      clearIdleTimer()
      volumeOverlayTimer.clear()
    }
  }, [volumeOverlayTimer, clearIdleTimer])

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black"
      onMouseEnter={() => {
        clearIdleTimer()
        setIsIdle(false)
      }}
      onMouseLeave={startIdleTimer}
      onWheelCapture={handleMiniPlayerWheel}
    >
      {hasSong && song?.coverArt ? (
        <ImageLoader id={song.coverArt} type="song" size={500}>
          {(src) => (
            <LazyLoadImage
              src={src}
              width="100%"
              height="100%"
              loading="eager"
              effect="opacity"
              className="absolute inset-0 z-0 h-full w-full object-cover object-center blur-3xl scale-[1.2] opacity-55 fullscreen-bg-kenburns"
              alt=""
              onLoad={handleBackgroundImageLoad}
            />
          )}
        </ImageLoader>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/35 via-background/80 to-background/95" />
      )}

      <div
        className="absolute inset-0 z-10 transition-colors duration-500"
        style={{ backgroundColor: `rgba(0,0,0,${backgroundDimOpacity})` }}
      />
      <div className="hypnotic-layer-a z-10" />
      <div className="hypnotic-layer-b z-10" />
      <div className="hypnotic-layer-c z-10" />

      <header className="absolute top-0 left-0 right-0 z-50 h-header bg-transparent electron-drag">
        <div className="h-full px-2 flex items-center justify-between">
          <div className="flex items-center gap-1" />
        </div>
      </header>

      <div
        className={clsx(
          'absolute left-[12px] top-[26px] z-[45] shrink-0 overflow-hidden rounded-lg border border-white/22 bg-black/30 shadow-lg shadow-black/35',
          'transition-[width,height,transform] duration-500 ease-out',
        )}
        style={{
          width: `${coverDisplaySize}px`,
          height: `${coverDisplaySize}px`,
          top: `${coverTop}px`,
        }}
      >
        {hasSong && song?.coverArt ? (
          <ImageLoader id={song.coverArt} type="song" size={500}>
            {(src) => (
              <LazyLoadImage
                src={src}
                width="100%"
                height="100%"
                loading="eager"
                effect="opacity"
                className="h-full w-full object-cover object-center"
                alt={`${song.artist} - ${song.title}`}
              />
            )}
          </ImageLoader>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-white/80">
            <Music2Icon className="h-10 w-10" />
          </div>
        )}
        <div
          className={clsx(
            'pointer-events-none absolute inset-0 z-[1] bg-black/60 transition-opacity duration-200',
            showVolumeOverlay ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          className={clsx(
            'pointer-events-none absolute inset-0 z-[2] flex items-center justify-center transition-opacity duration-200',
            showVolumeOverlay ? 'opacity-100' : 'opacity-0',
          )}
        >
          <div className="rounded-lg border border-white/25 bg-black/55 px-3 py-1.5 text-[16px] font-semibold text-white shadow-lg shadow-black/40">
            {volume}%
          </div>
        </div>
      </div>

      <div
        className={clsx(
          'absolute left-[12px] z-[46] flex items-center gap-0 overflow-hidden rounded-lg border border-white/14 bg-black/44 p-0 shadow-lg shadow-black/35',
          'transition-all duration-400 ease-out',
          isIdle && 'opacity-0 translate-y-1 pointer-events-none',
        )}
        style={{
          top: `${coverTop + coverDisplaySize + 6}px`,
          width: `${isIdle ? coverDisplaySize : coverSize}px`,
        }}
      >
        <SimpleTooltip
          text={
            pinned
              ? t('player.tooltips.miniPlayer.unpin', 'Unpin Miniplayer')
              : t('player.tooltips.miniPlayer.pin', 'Pin Miniplayer')
          }
        >
          <Button
            variant="ghost"
            className={clsx(
              'h-8 flex-1 rounded-none rounded-l-lg border-r border-white/14 transition-colors',
              pinned
                ? 'bg-primary text-primary-foreground hover:bg-primary/88'
                : 'bg-primary/14 text-primary-foreground hover:bg-primary/24',
            )}
            onClick={togglePinned}
          >
            {pinned ? (
              <PinIcon className="h-4 w-4" />
            ) : (
              <PinOffIcon className="h-4 w-4" />
            )}
          </Button>
        </SimpleTooltip>

        <SimpleTooltip
          text={t('player.tooltips.miniPlayer.expand', 'Expand Player')}
        >
          <Button
            variant="ghost"
            className="h-8 flex-1 rounded-none rounded-r-lg bg-primary/14 text-primary-foreground transition-colors hover:bg-primary/24"
            onClick={() => setOpen(false)}
          >
            <Maximize2Icon className="h-4 w-4" />
          </Button>
        </SimpleTooltip>
      </div>

      <main
        className={clsx(
          'absolute inset-0 z-40 pr-2 pb-0 pt-0 transition-[padding] duration-500 ease-out',
          isIdle
            ? 'pl-[calc(var(--header-height)*2.9+24px)]'
            : 'pl-[calc(var(--header-height)*2.4+26px)]',
        )}
      >
        <div className="h-full flex">
          <div className="min-w-0 flex-1 h-full flex flex-col justify-end">
            <div
              className={clsx(
                'min-w-0 pt-[25px] transition-all duration-500 ease-out',
                isIdle && 'translate-x-[10px]',
              )}
            >
              {hasSong ? (
                <>
                  <div
                    className={clsx(
                      'font-semibold text-white tracking-[0.01em] drop-shadow-[0_1px_5px_rgba(0,0,0,0.68)] transition-all duration-500 ease-out',
                      isIdle ? 'text-[15px]' : 'text-[13px] truncate',
                    )}
                  >
                    {isIdle ? (
                      <MarqueeTitle gap="mr-10">{title}</MarqueeTitle>
                    ) : (
                      title
                    )}
                  </div>
                  <div
                    className={clsx(
                      'text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.52)] transition-all duration-500 ease-out',
                      isIdle ? 'text-[13px]' : 'text-[11px] truncate',
                    )}
                  >
                    {isIdle ? (
                      <MarqueeTitle gap="mr-8">{artist || ' '}</MarqueeTitle>
                    ) : (
                      artist || ' '
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-white/14 bg-black/28 px-2.5 py-2">
                  <div className="text-[13px] font-semibold text-white">
                    {t('player.noPlayback', 'No playback active.')}
                  </div>
                  <div className="text-[11px] text-white/72">
                    {t(
                      'player.noPlaybackMiniHint',
                      'Play a song to show controls and progress.',
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              className={clsx(
                'mt-auto mb-2.5 flex items-center gap-1.5 transition-all duration-400 ease-out',
                (isIdle || !hasSong) &&
                  'opacity-0 translate-y-2 pointer-events-none',
              )}
            >
              <SimpleTooltip text={t('player.tooltips.previous')}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={clsx(
                    'w-[54px] h-10 rounded-lg relative border border-white/45',
                    'text-primary-foreground hover:text-primary-foreground bg-primary/24 hover:bg-primary/34',
                    'hover:scale-105 transition-transform will-change-transform',
                  )}
                  onClick={playPrevSong}
                  disabled={!hasPrev}
                >
                  <SkipBackIcon className="w-5 h-5 text-primary fill-primary drop-shadow-lg" />
                </Button>
              </SimpleTooltip>

              <SimpleTooltip
                text={
                  isPlaying
                    ? t('player.tooltips.pause')
                    : t('player.tooltips.play')
                }
              >
                <Button
                  variant="link"
                  size="icon"
                  className="w-[50px] h-11 rounded-lg border border-primary/50 shadow-lg bg-primary/50 text-primary-foreground hover:bg-primary/62 hover:scale-105 transition-transform will-change-transform"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                  ) : (
                    <PlayIcon className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                  )}
                </Button>
              </SimpleTooltip>

              <SimpleTooltip text={t('player.tooltips.next')}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={clsx(
                    'w-[54px] h-10 rounded-lg relative border border-white/45',
                    'text-primary-foreground hover:text-primary-foreground',
                    'bg-primary/24 hover:bg-primary/34 hover:scale-105 transition-transform will-change-transform',
                  )}
                  onClick={playNextSong}
                  disabled={!hasNext && loopState !== LoopState.All}
                >
                  <SkipForwardIcon className="w-5 h-5 text-primary fill-primary drop-shadow-lg" />
                </Button>
              </SimpleTooltip>

              <SimpleTooltip
                text={
                  isSongStarred
                    ? t('player.tooltips.dislike', {
                        defaultValue: 'Remove like',
                        song: title,
                        artist,
                      })
                    : t('player.tooltips.like', {
                        defaultValue: 'Like',
                        song: title,
                        artist,
                      })
                }
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={clsx(
                    'w-[44px] h-10 rounded-lg relative border border-primary/34',
                    'text-primary-foreground hover:text-primary-foreground',
                    'bg-primary/20 hover:bg-primary/30 hover:scale-105 transition-transform will-change-transform',
                  )}
                  onClick={starCurrentSong}
                >
                  <HeartIcon
                    className={clsx(
                      'w-5 h-5',
                      isSongStarred
                        ? 'text-red-500 fill-red-500'
                        : 'text-secondary-foreground',
                    )}
                  />
                </Button>
              </SimpleTooltip>
            </div>

            <div
              className={clsx(
                'mt-auto transition-[padding,width] duration-500 ease-out',
                isIdle ? 'pr-6 pb-6 pl-[12px]' : 'pr-1 pb-6 pl-[6px]',
              )}
            >
              {hasSong ? (
                <MiniPlayerProgress />
              ) : (
                <div className="h-[10px] w-full rounded-full bg-white/12" />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
