import { usePlayerSonglist } from '@/store/player.store'
import { AppTitle } from './header/app-title'

export function HeaderSongInfo() {
  const { currentList, currentSong } = usePlayerSonglist()

  const isPlaylistEmpty = currentList.length === 0

  const title = currentSong?.title ?? ''
  const artist = currentSong?.artist ?? ''

  return (
    <div className="col-span-2 flex justify-center items-center">
      {isPlaylistEmpty && <AppTitle />}
      {!isPlaylistEmpty && (
        <div className="flex w-full justify-center items-center gap-2 truncate subpixel-antialiased">
          <p className="max-w-[52%] truncate leading-7 text-[13px] font-semibold tracking-[0.01em] text-foreground/92">
            {title}
          </p>
          <span className="text-foreground/28">-</span>
          <p className="max-w-[42%] truncate leading-7 text-[12px] font-medium tracking-[0.01em] text-muted-foreground">
            {artist}
          </p>
        </div>
      )}
    </div>
  )
}
