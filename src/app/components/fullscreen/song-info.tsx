import { memo, startTransition, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dot } from '@/app/components/dot'
import { MarqueeTitle } from '@/app/components/fullscreen/marquee-title'
import { SongMenuOptions } from '@/app/components/song/menu-options'
import { SongQualityBadge } from '@/app/components/song/quality-badge'
import { ContextMenuProvider } from '@/app/components/table/context-menu'
import { DrawerClose } from '@/app/components/ui/drawer'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes/routesList'
import { usePlayerStore } from '@/store/player.store'
import { ISong } from '@/types/responses/song'
import { ALBUM_ARTISTS_MAX_NUMBER } from '@/utils/multipleArtists'
import { FullscreenSongImage } from './song-image'

const MemoFullscreenSongImage = memo(FullscreenSongImage)

interface SongInfoProps {
  isChromeVisible: boolean
}

export function SongInfo({ isChromeVisible }: SongInfoProps) {
  const currentSong = usePlayerStore((state) => state.songlist.currentSong)
  const navigate = useNavigate()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  function handleTitleClick() {
    closeButtonRef.current?.click()
    setTimeout(() => {
      startTransition(() => {
        navigate(ROUTES.ALBUM.PAGE(currentSong.albumId))
      })
    }, 100)
  }

  function handleAlbumClick() {
    closeButtonRef.current?.click()
    setTimeout(() => {
      startTransition(() => {
        navigate(ROUTES.ALBUM.PAGE(currentSong.albumId))
      })
    }, 100)
  }

  function handleArtistClick(id?: string) {
    if (!id) return
    closeButtonRef.current?.click()
    setTimeout(() => {
      startTransition(() => {
        navigate(ROUTES.ARTIST.PAGE(id))
      })
    }, 100)
  }

  return (
    <ContextMenuProvider
      options={
        <SongMenuOptions
          variant="context"
          song={currentSong}
          index={0}
        />
      }
    >
      <div
        className={cn(
          'flex items-center justify-start h-full min-h-full max-h-full gap-4 2xl:gap-6 flex-1 overflow-visible transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
          isChromeVisible ? 'pt-2 translate-y-0' : 'pt-1 translate-y-0',
        )}
      >
        {/* Hidden close button for programmatic closing */}
        <DrawerClose ref={closeButtonRef} className="hidden" />
        
        <MemoFullscreenSongImage isChromeVisible={isChromeVisible} />

        <div
          className={cn(
            'flex flex-col flex-1 min-w-0 h-full min-h-0 text-left overflow-hidden transition-all duration-500 ease-in-out',
            isChromeVisible
              ? 'max-h-[520px] 2xl:max-h-[640px] justify-end pb-1'
              : 'max-h-[595px] 2xl:max-h-[720px] justify-end pb-2',
          )}
        >
          <MarqueeTitle gap="mr-6">
            <h2 
              className="scroll-m-20 text-4xl 2xl:text-5xl font-bold tracking-tight py-2 2xl:py-3 text-shadow-md hover:underline cursor-pointer"
              onClick={handleTitleClick}
            >
              {currentSong.title}
            </h2>
          </MarqueeTitle>
          <div className="text-base 2xl:text-lg flex gap-1 text-foreground/70 truncate maskImage-marquee-fade-finished">
            <p 
              className="truncate text-shadow-lg text-foreground hover:underline cursor-pointer"
              onClick={handleAlbumClick}
            >
              {currentSong.album}
            </p>
            <Dot className="text-foreground/70" />
            <ArtistNames song={currentSong} onArtistClick={handleArtistClick} />
          </div>
          <div className="mt-2 2xl:mt-3 mb-[1px]">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/15 bg-primary/10 px-3 py-1.5 text-sm text-foreground/82 backdrop-blur-sm">
              {currentSong.genre && <span className="truncate max-w-[220px]">{currentSong.genre}</span>}
              {currentSong.genre && currentSong.year && <span className="text-foreground/40">•</span>}
              {currentSong.year && <span>{currentSong.year}</span>}
              {(currentSong.genre || currentSong.year) && <span className="text-foreground/40">•</span>}
              <SongQualityBadge
                song={currentSong}
                display="text"
                className="leading-none"
              />
            </div>
          </div>
        </div>
      </div>
    </ContextMenuProvider>
  )
}

function ArtistNames({ 
  song, 
  onArtistClick 
}: { 
  song: ISong
  onArtistClick: (id?: string) => void
}) {
  const { artist, artistId, artists } = song

  if (artists && artists.length > 1) {
    const data = artists.slice(0, ALBUM_ARTISTS_MAX_NUMBER)

    return (
      <div className="flex items-center gap-1">
        {data.map(({ id, name }, index) => (
          <div key={id} className="flex">
            <p 
              className={cn(
                'truncate text-shadow-lg',
                id && 'hover:underline cursor-pointer hover:text-foreground'
              )}
              onClick={() => onArtistClick(id)}
            >
              {name}
            </p>
            {index < data.length - 1 && ','}
          </div>
        ))}
      </div>
    )
  }

  return (
    <p 
      className={cn(
        'truncate text-shadow-lg',
        artistId && 'hover:underline cursor-pointer hover:text-foreground'
      )}
      onClick={() => onArtistClick(artistId)}
    >
      {artist}
    </p>
  )
}

