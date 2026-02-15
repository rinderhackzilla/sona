import { Rabbit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OptionsButtons } from '@/app/components/options/buttons'
import { DownloadOptionHandler } from '@/app/components/options/download-handler'
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/app/components/ui/context-menu'
import { DropdownMenuItem } from '@/app/components/ui/dropdown-menu'
import { useOptions } from '@/app/hooks/use-options'
import { useRabbitHole } from '@/app/hooks/use-rabbit-hole'
import { ISong } from '@/types/responses/song'
import { AddToPlaylistSubMenu } from './add-to-playlist'

interface SongMenuOptionsProps {
  variant: 'context' | 'dropdown'
  song: ISong
  index: number
}

export function SongMenuOptions({
  variant,
  song,
  index,
}: SongMenuOptionsProps) {
  const { t } = useTranslation()
  const {
    playNext,
    playLast,
    createNewPlaylist,
    addToPlaylist,
    removeSongFromPlaylist,
    startDownload,
    openSongInfo,
    isOnPlaylistPage,
  } = useOptions()
  const { startRabbitHole, isLoading } = useRabbitHole()
  const songIndexes = [index.toString()]

  const handleRabbitHole = (e: React.MouseEvent) => {
    e.stopPropagation()
    startRabbitHole({
      type: 'artist',
      artistName: song.artist,
      artistId: song.artistId,
      trackName: song.title,
    })
  }

  const RabbitHoleMenuItem = variant === 'context' ? ContextMenuItem : DropdownMenuItem

  return (
    <>
      <OptionsButtons.PlayNext
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          playNext([song])
        }}
      />
      <OptionsButtons.PlayLast
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          playLast([song])
        }}
      />
      <ContextMenuSeparator />
      <RabbitHoleMenuItem
        onClick={handleRabbitHole}
        disabled={isLoading}
        className="cursor-pointer"
      >
        <Rabbit className="mr-2 h-4 w-4" />
        <span>{t('rabbitHole.button')}</span>
      </RabbitHoleMenuItem>
      <ContextMenuSeparator />
      <OptionsButtons.AddToPlaylistOption variant={variant}>
        <AddToPlaylistSubMenu
          type={variant}
          newPlaylistFn={() => createNewPlaylist(song.title, song.id)}
          addToPlaylistFn={(id) => addToPlaylist(id, song.id)}
        />
      </OptionsButtons.AddToPlaylistOption>
      {isOnPlaylistPage && (
        <OptionsButtons.RemoveFromPlaylist
          variant={variant}
          onClick={(e) => {
            e.stopPropagation()
            removeSongFromPlaylist(songIndexes)
          }}
        />
      )}
      <DownloadOptionHandler context={true}>
        <OptionsButtons.Download
          variant={variant}
          onClick={(e) => {
            e.stopPropagation()
            startDownload(song.id)
          }}
        />
      </DownloadOptionHandler>
      <ContextMenuSeparator />
      <OptionsButtons.SongInfo
        variant={variant}
        onClick={(e) => {
          e.stopPropagation()
          openSongInfo(song.id)
        }}
      />
    </>
  )
}
