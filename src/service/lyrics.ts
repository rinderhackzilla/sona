import { get, set } from 'idb-keyval'
import { httpClient } from '@/api/httpClient'
import { usePlayerStore } from '@/store/player.store'
import {
  ILyric,
  IStructuredLine,
  IStructuredLyric,
  LyricsResponse,
  StructuredLyricsResponse,
} from '@/types/responses/song'
import { lrclibClient } from '@/utils/appName'
import { checkServerType, getServerExtensions } from '@/utils/servers'

interface GetLyricsData {
  id: string
  artist: string
  title: string
  album?: string
  duration?: number
}

interface LRCLibResponse {
  id: number
  trackName: string
  artistName: string
  plainLyrics: string
  syncedLyrics: string
}

type LyricsDebugSource =
  | 'cache'
  | 'server_songlyrics_synced'
  | 'server_songlyrics_plain'
  | 'server_legacy'
  | 'lrclib'
  | 'none'

function withDebugSource(lyric: ILyric, source: LyricsDebugSource): ILyric {
  return {
    ...lyric,
    debugSource: source,
  } as ILyric
}

async function getLyrics(getLyricsData: GetLyricsData) {
  const { preferSyncedLyrics } = usePlayerStore.getState().settings.lyrics
  const { songLyricsEnabled } = getServerExtensions()

  const cacheKey = getLyricsCacheKey(
    getLyricsData,
    preferSyncedLyrics,
    songLyricsEnabled,
  )

  const cachedLyrics = await get(cacheKey)

  if (cachedLyrics) {
    const lyric = cachedLyrics as ILyric

    if (!preferSyncedLyrics || isSyncedLyricsValue(lyric.value)) {
      return withDebugSource(lyric, 'cache')
    }
  }

  // First attempt to retrieve lyrics from the server.
  // If we know it supports the OpenSubsonic songLyrics extension with timing info, use that.
  // If the server does not support the extension or the lyrics returned from the server did
  // not include timing information, fetch them from the LrcLib

  let osUnsyncedLyricsFound: ILyric | undefined

  if (songLyricsEnabled) {
    const response = await httpClient<StructuredLyricsResponse>(
      '/getLyricsBySongId',
      {
        method: 'GET',
        query: {
          id: getLyricsData.id,
        },
      },
    )

    if (response && preferSyncedLyrics) {
      const { structuredLyrics } = response.data.lyricsList

      if (structuredLyrics && structuredLyrics.length > 0) {
        const syncedLyrics = structuredLyrics.find((lyrics) => lyrics.synced)

        if (syncedLyrics) {
          const serverSyncedLyrics = withDebugSource(
            osStructuredLyricsToILyric(syncedLyrics),
            'server_songlyrics_synced',
          )

          set(cacheKey, serverSyncedLyrics)

          return serverSyncedLyrics
        }
      }

      const plainLyrics = structuredLyrics?.find((lyrics) => !lyrics.synced)

      if (plainLyrics) {
        osUnsyncedLyricsFound = withDebugSource(
          osStructuredLyricsToILyric(plainLyrics),
          'server_songlyrics_plain',
        )
      }
    }
  }

  if (preferSyncedLyrics) {
    const lyrics = await getLyricsFromLRCLib(getLyricsData)

    if (lyrics.value !== '' && isSyncedLyricsValue(lyrics.value)) {
      const lrclibLyrics = withDebugSource(lyrics, 'lrclib')
      set(cacheKey, lrclibLyrics)

      return lrclibLyrics
    }
  }

  // if the server supported the songLyrics extension and lrc did not have lyrics, we don't need to query the server and lrc again.
  // so return the plain lyrics if we found them
  if (osUnsyncedLyricsFound) {
    set(cacheKey, osUnsyncedLyricsFound)

    return osUnsyncedLyricsFound
  }

  const response = await httpClient<LyricsResponse>('/getLyrics', {
    method: 'GET',
    query: {
      artist: getLyricsData.artist,
      title: getLyricsData.title,
    },
  })

  const lyricNotFound =
    !response || !response?.data.lyrics || !response.data.lyrics.value

  // If the Subsonic API did not return lyrics and the user does not prefer synced lyrics,
  // fallback to fetching lyrics from the LrcLib.
  // Note: If `preferSyncedLyrics` is true and we reached this point, it means the LrcLib
  // does not contains lyrics for the track, so the fallback is unnecessary in that case.
  if (lyricNotFound && !preferSyncedLyrics) {
    const lyrics = await getLyricsFromLRCLib(getLyricsData)

    if (lyrics.value !== '') {
      const lrclibLyrics = withDebugSource(lyrics, 'lrclib')
      set(cacheKey, lrclibLyrics)
      return lrclibLyrics
    }

    return withDebugSource(lyrics, 'none')
  }

  if (response?.data.lyrics) {
    const serverLegacyLyrics = withDebugSource(
      response.data.lyrics,
      'server_legacy',
    )
    set(cacheKey, serverLegacyLyrics)
    return serverLegacyLyrics
  }

  if (response?.data.lyrics) {
    return withDebugSource(response.data.lyrics, 'server_legacy')
  }

  return withDebugSource(
    { artist: getLyricsData.artist, title: getLyricsData.title, value: '' },
    'none',
  )
}

async function getLyricsFromLRCLib(getLyricsData: GetLyricsData) {
  const { lrclib } = usePlayerStore.getState().settings.privacy
  const { isLms } = checkServerType()

  const { title, album, duration } = getLyricsData

  // LMS server tends to join all artists into a single string
  // Ex: "Cartoon, Jeja, Daniel Levi, Time To Talk"
  // To LRCLIB work correctly, we have to send only one
  const artist = isLms
    ? getLyricsData.artist.split(',')[0]
    : getLyricsData.artist

  if (!lrclib.enabled || window.DISABLE_LRCLIB) {
    return {
      artist,
      title,
      value: '',
    }
  }

  try {
    let defaultLrcLibUrl = 'https://lrclib.net/api/get'

    if (lrclib.customUrlEnabled && lrclib.customUrl !== '') {
      defaultLrcLibUrl = `${lrclib.customUrl}/api/get`
    }

  const response = await fetchBestLRCLibMatch(defaultLrcLibUrl, {
      artist,
      title,
      album,
      duration,
    })

    if (response) {
      const { syncedLyrics, plainLyrics } = response

      let finalLyric = ''

      if (syncedLyrics) {
        finalLyric = syncedLyrics
      } else if (plainLyrics) {
        finalLyric = plainLyrics
      }

      return {
        artist,
        title,
        value: formatLyrics(finalLyric),
      }
    }
  } catch {}

  return {
    artist,
    title,
    value: '',
  }
}

interface LRCLibSearchData {
  artist: string
  title: string
  album?: string
  duration?: number
}

async function fetchBestLRCLibMatch(
  baseUrl: string,
  data: LRCLibSearchData,
): Promise<LRCLibResponse | null> {
  let plainFallback: LRCLibResponse | null = null
  const attempts = [
    { album: data.album, duration: data.duration },
    { album: undefined, duration: data.duration },
    { album: data.album, duration: undefined },
    { album: undefined, duration: undefined },
  ]

  for (const attempt of attempts) {
    const params = new URLSearchParams({
      artist_name: data.artist,
      track_name: data.title,
    })

    if (attempt.duration) params.append('duration', attempt.duration.toString())
    if (attempt.album) params.append('album_name', attempt.album)

    const url = new URL(baseUrl)
    url.search = params.toString()

    const response = await fetchLRCLibLyrics(url)
    if (response?.syncedLyrics) return response
    if (response?.plainLyrics && !plainFallback) plainFallback = response
  }

  return plainFallback
}

async function fetchLRCLibLyrics(url: URL): Promise<LRCLibResponse | null> {
  try {
    const browserResponse = await fetch(url.toString(), {
      headers: {
        'Lrclib-Client': lrclibClient,
      },
    })

    if (browserResponse.ok) {
      return browserResponse.json()
    }
  } catch {
    // Installed Electron builds can hit CORS from file://; fall back to main.
  }

  const electronResponse = await fetchLRCLibLyricsFromMain(url)
  return electronResponse
}

async function fetchLRCLibLyricsFromMain(
  url: URL,
): Promise<LRCLibResponse | null> {
  if (!window.api?.fetchExternalText) return null

  const response = await window.api.fetchExternalText(url.toString())
  if (!response.ok || !response.text) return null

  return JSON.parse(response.text) as LRCLibResponse
}

function formatLyrics(lyrics: string) {
  return lyrics.trim().replaceAll('\r\n', '\n')
}

function getLyricsCacheKey(
  getLyricsData: GetLyricsData,
  preferSyncedLyrics: boolean,
  songLyricsEnabled?: boolean,
) {
  const { artist, title, album, duration } = getLyricsData

  const type = preferSyncedLyrics ? 'synced' : 'plain'
  const serverExtension = songLyricsEnabled ? 'internal' : 'external'
  const roundedDuration = duration ? Math.round(duration) : ''

  const keys = [
    'lyrics-v2',
    artist,
    title,
    album ?? '',
    roundedDuration,
    type,
    serverExtension,
  ]

  return keys.join(':')
}

function isSyncedLyricsValue(value?: string) {
  return /^\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/m.test(value?.trim() ?? '')
}

function osStructuredLyricsToILyric(lyrics: IStructuredLyric): ILyric {
  return {
    artist: lyrics.displayArtist,
    title: lyrics.displayTitle,
    value: formatLyrics(lyrics.line.map(osLineToILyricLine).join('\n')),
  }
}

function osLineToILyricLine(line: IStructuredLine): string {
  if (line.start !== undefined) {
    return `[${osStartMsToSongTimestamp(line.start)}] ${line.value}`
  }
  return line.value
}

function osStartMsToSongTimestamp(startTime: number): string {
  // Date() isoString is formatted as:
  // YYYY-MM-DDTHH:mm:ss.sssZ -> mm:ss.ss
  // 2011-10-05T14:48:00.000Z -> 48:00.00
  return new Date(startTime).toISOString().slice(14, -2)
}

export const lyrics = {
  getLyrics,
  getLyricsFromLRCLib,
}
