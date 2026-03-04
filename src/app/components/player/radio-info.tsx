import { RadioIcon } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  findLibrarySongIdForRadioTrack,
  getRadioStationImageFallback,
  resolveRadioNowPlaying,
} from '@/service/radio-now-playing'
import { subsonic } from '@/service/subsonic'
import { useAppIntegrations } from '@/store/app.store'
import { useRadioNowPlayingStore } from '@/store/radio-now-playing.store'
import { Radio } from '@/types/responses/radios'

export function RadioInfo({ radio }: { radio: Radio | undefined }) {
  const { t } = useTranslation()
  const { lastfm } = useAppIntegrations()
  const setGlobalNowPlaying = useRadioNowPlayingStore(
    (state) => state.setCurrent,
  )
  const clearGlobalNowPlaying = useRadioNowPlayingStore((state) => state.clear)
  const [nowPlaying, setNowPlaying] = useState<{
    artist: string | null
    track: string | null
    rawTitle: string
    coverUrl: string | null
  } | null>(null)
  const [coverLoadFailed, setCoverLoadFailed] = useState(false)
  const scrobbledTrackKeysRef = useRef<Set<string>>(new Set())
  const latestTrackKeyRef = useRef<string>('')

  useEffect(() => {
    if (!radio) {
      setNowPlaying(null)
      clearGlobalNowPlaying()
      latestTrackKeyRef.current = ''
      return
    }

    let active = true
    let intervalId: ReturnType<typeof setInterval> | null = null

    const poll = async () => {
      const stationCoverUrl = getRadioStationImageFallback({
        homePageUrl: radio.homePageUrl,
        streamUrl: radio.streamUrl,
      })
      const data = await resolveRadioNowPlaying({
        streamUrl: radio.streamUrl,
        homePageUrl: radio.homePageUrl,
        stationName: radio.name,
        lastFmApiKey: lastfm.apiKey,
      })
      if (!active) return
      setCoverLoadFailed(false)
      setNowPlaying(
        data
          ? {
              artist: data.artist,
              track: data.track,
              rawTitle: data.rawTitle,
              coverUrl: data.coverUrl ?? stationCoverUrl,
            }
          : null,
      )
      setGlobalNowPlaying(
        data
          ? {
              radioId: radio.id,
              artist: data.artist,
              track: data.track,
              rawTitle: data.rawTitle,
              // Keep global state track-cover only.
              // UI can use station fallback, but Discord/metadata should not.
              coverUrl: data.coverUrl,
              sourceUrl: data.sourceUrl,
            }
          : null,
      )
    }

    poll().catch(() => undefined)
    intervalId = setInterval(() => {
      poll().catch(() => undefined)
    }, 15000)

    return () => {
      active = false
      if (intervalId) clearInterval(intervalId)
      clearGlobalNowPlaying()
    }
  }, [clearGlobalNowPlaying, lastfm.apiKey, radio, setGlobalNowPlaying])

  useEffect(() => {
    if (!radio || !nowPlaying) return
    const key = `${radio.id}|${nowPlaying.artist ?? ''}|${nowPlaying.track ?? nowPlaying.rawTitle}`
    latestTrackKeyRef.current = key

    if (scrobbledTrackKeysRef.current.has(key)) return

    const timeout = setTimeout(async () => {
      if (latestTrackKeyRef.current !== key) return

      const songId = await findLibrarySongIdForRadioTrack(nowPlaying)
      if (!songId) return

      try {
        await subsonic.scrobble.send(songId)
        scrobbledTrackKeysRef.current.add(key)
      } catch {
        // ignore
      }
    }, 35000)

    return () => clearTimeout(timeout)
  }, [nowPlaying, radio])

  return (
    <Fragment>
      <div className="w-[70px] h-[70px] flex justify-center items-center bg-foreground/20 rounded overflow-hidden">
        {nowPlaying?.coverUrl && !coverLoadFailed ? (
          <img
            src={nowPlaying.coverUrl}
            alt={nowPlaying.track ?? nowPlaying.rawTitle}
            className="h-full w-full object-cover"
            onError={() => setCoverLoadFailed(true)}
          />
        ) : (
          <RadioIcon
            className="w-12 h-12"
            strokeWidth={1}
            data-testid="radio-icon"
          />
        )}
      </div>
      <div className="flex flex-col justify-center">
        {radio ? (
          <Fragment>
            <span className="text-sm font-medium" data-testid="radio-name">
              {radio.name}
            </span>
            <span
              className="text-xs font-light text-muted-foreground"
              data-testid="radio-label"
            >
              {nowPlaying
                ? nowPlaying.artist && nowPlaying.track
                  ? `${nowPlaying.artist} - ${nowPlaying.track}`
                  : nowPlaying.rawTitle
                : t('radios.label')}
            </span>
          </Fragment>
        ) : (
          <span className="text-sm font-medium" data-testid="radio-no-playing">
            {t('player.noRadioPlaying')}
          </span>
        )}
      </div>
    </Fragment>
  )
}
