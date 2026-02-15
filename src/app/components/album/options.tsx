import { Rabbit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRabbitHole } from '@/app/hooks/use-rabbit-hole'
import { OptionsButtons } from '@/app/components/options/buttons'
import { DownloadOptionHandler } from '@/app/components/options/download-handler'
import { AddToPlaylistSubMenu } from '@/app/components/song/add-to-playlist'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu'
import { useOptions } from '@/app/hooks/use-options'
import { SingleAlbum } from '@/types/responses/album'

interface AlbumOptionsProps {
  album: SingleAlbum
}

export function AlbumOptions({ album }: AlbumOptionsProps) {
  const { t } = useTranslation()
  const {
    playNext,
    playLast,
    startDownload,
    addToPlaylist,
    createNewPlaylist,
  } = useOptions()
  const { startRabbitHole, isLoading: rabbitHoleLoading } = useRabbitHole()

  function handlePlayNext() {
    playNext(album.song)
  }

  function handlePlayLast() {
    playLast(album.song)
  }

  function handleDownload() {
    startDownload(album.id)
  }

  function handleAddToPlaylist(id: string) {
    const songIdToAdd = album.song.map((song) => song.id)

    addToPlaylist(id, songIdToAdd)
  }

  function handleCreateNewPlaylist() {
    const songIdToAdd = album.song.map((song) => song.id)

    createNewPlaylist(album.name, songIdToAdd)
  }

  function handleRabbitHole() {
    startRabbitHole({
      type: 'album',
      artistName: album.artist,
      albumName: album.name,
      albumId: album.id,
    })
  }

  return (
    <>
      <DropdownMenuGroup>
        <OptionsButtons.PlayNext onClick={handlePlayNext} />
        <OptionsButtons.PlayLast onClick={handlePlayLast} />
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          onClick={handleRabbitHole}
          disabled={rabbitHoleLoading}
          className="gap-2"
        >
          <Rabbit className="h-4 w-4" />
          <span>{t('rabbitHole.button')}</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <OptionsButtons.AddToPlaylistOption variant="dropdown">
        <AddToPlaylistSubMenu
          type="dropdown"
          newPlaylistFn={handleCreateNewPlaylist}
          addToPlaylistFn={handleAddToPlaylist}
        />
      </OptionsButtons.AddToPlaylistOption>
      <DownloadOptionHandler>
        <OptionsButtons.Download onClick={handleDownload} />
      </DownloadOptionHandler>
    </>
  )
}
