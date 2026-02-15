import { Rabbit } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRabbitHole } from '@/app/hooks/use-rabbit-hole'
import { OptionsButtons } from '@/app/components/options/buttons'
import { DownloadOptionHandler } from '@/app/components/options/download-handler'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu'
import { useOptions } from '@/app/hooks/use-options'
import { useSongList } from '@/app/hooks/use-song-list'
import { IArtist } from '@/types/responses/artist'
import { ISong } from '@/types/responses/song'

interface ArtistOptionsProps {
  artist: IArtist
}

export function ArtistOptions({ artist }: ArtistOptionsProps) {
  const { t } = useTranslation()
  const { getArtistAllSongs } = useSongList()
  const { playLast, playNext, startDownload } = useOptions()
  const { startRabbitHole, isLoading: rabbitHoleLoading } = useRabbitHole()

  async function getSongsToQueue(callback: (songs: ISong[]) => void) {
    const songs = await getArtistAllSongs(artist.name)
    if (!songs) return

    callback(songs)
  }

  async function handlePlayNext() {
    await getSongsToQueue(playNext)
  }

  async function handlePlayLast() {
    await getSongsToQueue(playLast)
  }

  function handleDownload() {
    startDownload(artist.id)
  }

  function handleRabbitHole() {
    startRabbitHole({
      type: 'artist',
      artistName: artist.name,
      artistId: artist.id,
    })
  }

  return (
    <>
      <DropdownMenuGroup>
        <OptionsButtons.PlayNext onClick={handlePlayNext} />
        <OptionsButtons.PlayLast onClick={handlePlayLast} />
        <DownloadOptionHandler group={false}>
          <OptionsButtons.Download onClick={handleDownload} />
        </DownloadOptionHandler>
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
    </>
  )
}
