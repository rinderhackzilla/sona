import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getRabbitHoleService } from '@/service/rabbit-hole'
import { usePlayerActions } from '@/store/player.store'
import { useSettingsStore } from '@/store/settings.store'
import type { ISong } from '@/types/responses/song'

interface RabbitHoleParams {
  type: 'artist' | 'album' | 'song'
  artistName: string
  artistId?: string
  albumName?: string
  albumId?: string
  trackName?: string
}

export function useRabbitHole() {
  const { t } = useTranslation()
  const { setSongList } = usePlayerActions()
  const lastfmApiKey = useSettingsStore((state) => state.lastfm.apiKey)

  const mutation = useMutation({
    mutationFn: async (params: RabbitHoleParams) => {
      if (!lastfmApiKey) {
        throw new Error('Last.fm API key not configured')
      }

      const rabbitHoleService = getRabbitHoleService(lastfmApiKey)
      let songs: ISong[] = []

      switch (params.type) {
        case 'artist':
          songs = await rabbitHoleService.generateForArtist(
            params.artistName,
            params.artistId,
          )
          break
        case 'album':
          if (!params.albumName || !params.albumId) {
            throw new Error('Album name and ID required')
          }
          songs = await rabbitHoleService.generateForAlbum(
            params.artistName,
            params.albumName,
            params.albumId,
          )
          break
        case 'song':
          if (!params.trackName) {
            throw new Error('Track name required')
          }
          songs = await rabbitHoleService.generateForSong(
            params.artistName,
            params.trackName,
          )
          break
      }

      return songs
    },
    onSuccess: (songs) => {
      if (songs.length === 0) {
        toast.error(t('rabbitHole.noSongsFound'))
        return
      }

      // Set the queue and start playing
      setSongList(songs, 0, true) // Start at index 0, shuffle enabled
      
      toast.success(
        t('rabbitHole.queueCreated', { count: songs.length }),
      )
    },
    onError: (error) => {
      console.error('Rabbit Hole error:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Last.fm API key')) {
          toast.error(t('rabbitHole.apiKeyMissing'))
        } else {
          toast.error(t('rabbitHole.error'))
        }
      } else {
        toast.error(t('rabbitHole.error'))
      }
    },
  })

  return {
    startRabbitHole: mutation.mutate,
    isLoading: mutation.isPending,
  }
}
