import { useAppStore } from '@/store/app.store'
import { usePlayerStore } from '@/store/player.store'
import { ISong } from '@/types/responses/song'
import { isDesktop } from './desktop'

async function fetchLastFmCoverArt(
  artist: string,
  album: string,
  apiKey: string,
): Promise<string | null> {
  if (!apiKey || !artist || !album) return null

  try {
    const url = new URL('https://ws.audioscrobbler.com/2.0/')
    url.searchParams.set('method', 'album.getinfo')
    url.searchParams.set('artist', artist)
    url.searchParams.set('album', album)
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('format', 'json')

    const response = await fetch(url.toString())
    if (!response.ok) return null

    const data = await response.json()

    // Last.fm gibt Bilder in verschiedenen Größen zurück, wir nehmen 'extralarge'
    const images: Array<{ '#text': string; size: string }> =
      data.album?.image ?? []

    const image =
      images.find((i) => i.size === 'extralarge') ||
      images.find((i) => i.size === 'large')

    const imageUrl = image?.['#text']

    // Last.fm gibt manchmal leere Strings zurück
    return imageUrl && imageUrl.length > 0 ? imageUrl : null
  } catch {
    return null
  }
}

async function send(song: ISong, currentTime = 0, duration = 0) {
  if (!isDesktop()) return

  const { rpcEnabled } = useAppStore.getState().accounts.discord
  if (!rpcEnabled) return

  const currentTimeInMs = currentTime * 1000
  const durationInMs = duration * 1000

  const artist = song.artists
    ? song.artists.map((artist) => artist.name).join(', ')
    : song.artist

  const startTime = Math.floor(Date.now() - currentTimeInMs)
  const endTime = Math.floor(Date.now() - currentTimeInMs + durationInMs)

  const { apiKey } = useAppStore.getState().integrations.lastfm
  const coverArtUrl = await fetchLastFmCoverArt(artist, song.album, apiKey)

  window.api.setDiscordRpcActivity({
    trackName: song.title,
    albumName: song.album,
    artist,
    startTime,
    endTime,
    duration,
    coverArtUrl: coverArtUrl ?? undefined,
  })
}

function clear() {
  if (!isDesktop()) return

  window.api.clearDiscordRpcActivity()
}

function sendCurrentSong() {
  if (!isDesktop()) return

  const { playerState, songlist, actions } = usePlayerStore.getState()

  const { mediaType } = playerState
  if (mediaType !== 'song') return

  const { currentSong } = songlist
  const currentTime = actions.getCurrentProgress()
  const { isPlaying, currentDuration } = playerState

  // Clear activity if paused or there is no song
  if (!currentSong || !isPlaying) discordRpc.clear()

  if (currentSong && isPlaying) {
    discordRpc.send(currentSong, currentTime, currentDuration)
  }
}

export const discordRpc = {
  send,
  clear,
  sendCurrentSong,
}
