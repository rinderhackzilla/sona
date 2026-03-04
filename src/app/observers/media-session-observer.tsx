import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getRadioStationImageFallback } from '@/service/radio-now-playing'
import {
  usePlayerIsPlaying,
  usePlayerMediaType,
  usePlayerSonglist,
} from '@/store/player.store'
import { useRadioNowPlaying } from '@/store/radio-now-playing.store'
import { appName } from '@/utils/appName'
import { manageMediaSession } from '@/utils/setMediaSession'

export function MediaSessionObserver() {
  const { t } = useTranslation()
  const isPlaying = usePlayerIsPlaying()
  const { isRadio, isSong, isPodcast } = usePlayerMediaType()
  const { currentList, radioList, currentSongIndex, podcastList } =
    usePlayerSonglist()
  const radioNowPlaying = useRadioNowPlaying()
  const radioLabel = t('radios.label')

  const song = currentList[currentSongIndex] ?? null
  const radio = radioList[currentSongIndex] ?? null
  const episode = podcastList[currentSongIndex] ?? null

  const hasNothingPlaying =
    currentList.length === 0 &&
    radioList.length === 0 &&
    podcastList.length === 0

  const resetAppTitle = useCallback(() => {
    document.title = appName
  }, [])

  useEffect(() => {
    manageMediaSession.setPlaybackState(isPlaying)

    if (hasNothingPlaying) {
      manageMediaSession.removeMediaSession()
    }

    if (hasNothingPlaying || !isPlaying) {
      resetAppTitle()
      return
    }

    let title = ''

    if (isRadio && radio) {
      const stationCoverUrl = getRadioStationImageFallback({
        homePageUrl: radio.homePageUrl,
        streamUrl: radio.streamUrl,
      })
      const nowPlayingTitle =
        radioNowPlaying?.radioId === radio.id
          ? radioNowPlaying.artist && radioNowPlaying.track
            ? `${radioNowPlaying.artist} - ${radioNowPlaying.track}`
            : radioNowPlaying.rawTitle
          : ''
      title = nowPlayingTitle
        ? `${radio.name} - ${nowPlayingTitle}`
        : `${radioLabel} - ${radio.name}`
      manageMediaSession.setRadioMediaSession(
        radioLabel,
        radio.name,
        nowPlayingTitle || null,
        radioNowPlaying?.radioId === radio.id
          ? radioNowPlaying.coverUrl
          : stationCoverUrl,
      )
    }
    if (isSong && song) {
      title = `${song.artist} - ${song.title}`
      manageMediaSession.setMediaSession(song)
    }
    if (isPodcast && episode) {
      title = `${episode.title} - ${episode.podcast.title}`
      manageMediaSession.setPodcastMediaSession(episode)
    }

    document.title = title
  }, [
    episode,
    hasNothingPlaying,
    isPlaying,
    isPodcast,
    isRadio,
    isSong,
    radio,
    radioNowPlaying,
    radioLabel,
    song,
    resetAppTitle,
  ])

  return null
}
