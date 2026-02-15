import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ComponentPropsWithoutRef, useEffect, useRef, useState } from 'react'
import { isSafari } from 'react-device-detect'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Lrc } from 'react-lrc'
import { ImageLoader } from '@/app/components/image-loader'
import { SongMenuOptions } from '@/app/components/song/menu-options'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/app/components/ui/context-menu'
import {
  ScrollArea,
  scrollAreaViewportSelector,
} from '@/app/components/ui/scroll-area'
import { ROUTES } from '@/routes/routesList'
import { subsonic } from '@/service/subsonic'
import { usePlayerRef, usePlayerSonglist } from '@/store/player.store'
import { ILyric } from '@/types/responses/song'

interface LyricProps {
  lyrics: ILyric
}

export function LyricsTab() {
  const { currentSong, currentIndex } = usePlayerSonglist()
  const { t } = useTranslation()

  const { id, artist, artistId, title, album, albumId, duration, coverArt } = currentSong

  const { data: lyrics, isLoading } = useQuery({
    queryKey: ['get-lyrics', artist, title, duration],
    queryFn: () =>
      subsonic.lyrics.getLyrics({
        id,
        artist,
        title,
        duration,
      }),
  })

  const noLyricsFound = t('fullscreen.noLyrics')
  const loadingLyrics = t('fullscreen.loadingLyrics')

  return (
    <div className="flex w-full h-full gap-6">
      {/* Left side - Song Info */}
      <div className="flex-shrink-0 w-64 flex flex-col gap-4">
        {/* Cover Art */}
        <div className="w-full aspect-square rounded-lg overflow-hidden shadow-2xl">
          <ImageLoader id={coverArt} type="song" size="300">
            {(src) => (
              <img
                src={src}
                alt={title}
                className="w-full h-full object-cover"
              />
            )}
          </ImageLoader>
        </div>

        {/* Song Details */}
        <div className="flex flex-col gap-1">
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <h2 className="text-xl font-bold truncate cursor-pointer hover:underline">
                {title}
              </h2>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <SongMenuOptions
                variant="context"
                song={currentSong}
                index={currentIndex}
              />
            </ContextMenuContent>
          </ContextMenu>

          {artistId && (
            <Link
              to={ROUTES.ARTIST.PAGE(artistId)}
              className="text-lg text-muted-foreground truncate hover:text-foreground hover:underline transition-colors"
            >
              {artist}
            </Link>
          )}
          {!artistId && (
            <p className="text-lg text-muted-foreground truncate">{artist}</p>
          )}

          {album && albumId && (
            <Link
              to={ROUTES.ALBUM.PAGE(albumId)}
              className="text-sm text-muted-foreground truncate hover:text-foreground hover:underline transition-colors"
            >
              {album}
            </Link>
          )}
          {album && !albumId && (
            <p className="text-sm text-muted-foreground truncate">{album}</p>
          )}
        </div>
      </div>

      {/* Right side - Lyrics */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <CenteredMessage>{loadingLyrics}</CenteredMessage>
        ) : lyrics && lyrics.value ? (
          areLyricsSynced(lyrics) ? (
            <SyncedLyrics lyrics={lyrics} />
          ) : (
            <UnsyncedLyrics lyrics={lyrics} />
          )
        ) : (
          <CenteredMessage>{noLyricsFound}</CenteredMessage>
        )}
      </div>
    </div>
  )
}

function SyncedLyrics({ lyrics }: LyricProps) {
  const playerRef = usePlayerRef()
  const [progress, setProgress] = useState(0)

  setTimeout(() => {
    let newProgress = (playerRef?.currentTime || 0) * 1000

    if (newProgress === progress) {
      newProgress += 1 // Prevents the lyrics from getting stuck when the audio is still loading
    }

    setProgress(newProgress)
  }, 50)

  const skipToTime = (timeMs: number) => {
    if (playerRef) {
      playerRef!.currentTime = timeMs / 1000
    }
  }

  return (
    <div className="w-full h-full text-center font-semibold text-2xl 2xl:text-3xl px-2 lrc-box maskImage-big-player-lyrics">
      <Lrc
        lrc={lyrics.value!}
        recoverAutoScrollInterval={1500}
        currentMillisecond={progress}
        id="sync-lyrics-box"
        className={clsx('h-full overflow-y-auto', !isSafari && 'scroll-smooth')}
        verticalSpace={true}
        lineRenderer={({ active, line }) => (
          <p
            onClick={() => skipToTime(line.startMillisecond)}
            className={clsx(
              'my-5 cursor-pointer hover:opacity-100 duration-500',
              'transition-[opacity,transform,text-shadow] motion-reduce:transition-none',
              active 
                ? 'opacity-100 scale-125 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]' 
                : 'opacity-50',
            )}
          >
            {line.content}
          </p>
        )}
      />
    </div>
  )
}

function UnsyncedLyrics({ lyrics }: LyricProps) {
  const { currentSong } = usePlayerSonglist()
  const lyricsBoxRef = useRef<HTMLDivElement>(null)

  const lines = lyrics.value!.split('\n')

  // biome-ignore lint/correctness/useExhaustiveDependencies: recomputed when song changes
  useEffect(() => {
    if (lyricsBoxRef.current) {
      const scrollArea = lyricsBoxRef.current.querySelector(
        scrollAreaViewportSelector,
      ) as HTMLDivElement

      scrollArea.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }, [currentSong])

  return (
    <ScrollArea
      type="always"
      className="w-full h-full overflow-y-auto text-center font-semibold text-xl 2xl:text-2xl px-2 scroll-smooth maskImage-unsynced-lyrics"
      thumbClassName="secondary-thumb-bar"
      ref={lyricsBoxRef}
    >
      {lines.map((line, index) => (
        <p
          key={index}
          className={clsx(
            'leading-10 text-shadow-lg text-balance',
            index === 0 && 'mt-4',
            index === lines.length - 1 && 'mb-16',
          )}
        >
          {line}
        </p>
      ))}
    </ScrollArea>
  )
}

type CenteredMessageProps = ComponentPropsWithoutRef<'p'>

function CenteredMessage({ children }: CenteredMessageProps) {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <p className="leading-10 text-shadow-lg text-center font-semibold text-xl 2xl:text-2xl">
        {children}
      </p>
    </div>
  )
}

function areLyricsSynced(lyrics: ILyric) {
  // Most LRC files start with the string "[00:" or "[01:" indicating synced lyrics
  const lyric = lyrics.value?.trim() ?? ''
  return (
    lyric.startsWith('[00:') ||
    lyric.startsWith('[01:') ||
    lyric.startsWith('[02:')
  )
}
