import { produce } from 'immer'
import clamp from 'lodash/clamp'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import { subsonic } from '@/service/subsonic'
import { IPlayerContext, ISongList, LoopState, } from '@/types/playerContext'
import { ISong } from '@/types/responses/song'
import { areSongListsEqual } from '@/utils/compareSongLists'
import { isDesktop } from '@/utils/desktop'
import { discordRpc } from '@/utils/discordRpc'
import { addNextSongList, shuffleSongList } from '@/utils/songListFunctions'
import { idbStorage } from './idb'
import { getSonaDjMode, SonaDjMode } from './sona-dj.store'

const miniStores = {
  songlist: 'player_songlist',
}

const blurSettings = {
  min: 20,
  max: 100,
  step: 10,
}

const SONA_DJ_POOL_SIZE = 30
const SONA_DJ_INJECTED_KEY = '__sonaDjInjected'
let runtimeSonaDjMode: SonaDjMode | null = null
let runtimeShuffleAllEnabled = false

function clearSonaDjInjectedSongIds() {}

function setRuntimeSonaDjMode(mode: SonaDjMode) {
  runtimeSonaDjMode = mode
}

function getRuntimeSonaDjMode() {
  return runtimeSonaDjMode ?? getSonaDjMode()
}

function setRuntimeShuffleAllEnabled(value: boolean) {
  runtimeShuffleAllEnabled = value
}

function getRuntimeShuffleAllEnabled() {
  return runtimeShuffleAllEnabled
}

function asInjectedSong(song: ISong): ISong {
  return {
    ...song,
    [SONA_DJ_INJECTED_KEY]: true,
  } as ISong
}

function isInjectedSong(song?: ISong): boolean {
  if (!song) return false
  return Boolean((song as Record<string, unknown>)[SONA_DJ_INJECTED_KEY])
}

function normalizeGenre(value?: string) {
  return (value ?? '').trim().toLowerCase()
}

function getDecade(year?: number) {
  if (!year || Number.isNaN(year)) return null
  return Math.floor(year / 10) * 10
}

async function getSonaDjCandidate(
  mode: SonaDjMode,
  currentSong: ISong,
  currentList: ISong[],
) {
  const sourceGenre = normalizeGenre(currentSong.genre)
  const sourceDecade = getDecade(currentSong.year)
  const sourceArtist = (currentSong.artist ?? '').trim().toLowerCase()
  const currentIds = new Set(currentList.map((song) => song.id))

  const randomSongs = await subsonic.songs.getRandomSongs({
    size: SONA_DJ_POOL_SIZE,
  })

  let candidatePool = randomSongs ?? []

  if (candidatePool.length === 0) {
    const fallbackSongs = await subsonic.songs.getAllSongs(500)
    candidatePool = fallbackSongs
      .sort(() => Math.random() - 0.5)
      .slice(0, SONA_DJ_POOL_SIZE)
  }

  const candidates = candidatePool.filter(
    (song) => !currentIds.has(song.id) && song.id !== currentSong.id,
  )

  let songToInject: ISong | undefined

  if (mode === SonaDjMode.Era && sourceDecade !== null) {
    songToInject = candidates.find((song) => {
      const candidateDecade = getDecade(song.year)
      return candidateDecade === sourceDecade
    })
  } else if (mode === SonaDjMode.Adventure || mode === SonaDjMode.Drift) {
    songToInject = candidates.find((song) => {
      const candidateGenre = normalizeGenre(song.genre)
      return (
        candidateGenre.length > 0 &&
        sourceGenre.length > 0 &&
        candidateGenre !== sourceGenre
      )
    })
  }

  // Fallback order for stronger contrast when tags are sparse.
  if (!songToInject && (mode === SonaDjMode.Adventure || mode === SonaDjMode.Drift)) {
    if (sourceDecade !== null) {
      const byLargestDecadeDistance = [...candidates]
        .filter((song) => getDecade(song.year) !== null)
        .sort((a, b) => {
          const aDistance = Math.abs((getDecade(a.year) ?? sourceDecade) - sourceDecade)
          const bDistance = Math.abs((getDecade(b.year) ?? sourceDecade) - sourceDecade)
          return bDistance - aDistance
        })

      songToInject = byLargestDecadeDistance[0]
    }
  }

  if (!songToInject && (mode === SonaDjMode.Adventure || mode === SonaDjMode.Drift)) {
    songToInject = candidates.find((song) => {
      const artist = (song.artist ?? '').trim().toLowerCase()
      return artist.length > 0 && sourceArtist.length > 0 && artist !== sourceArtist
    })
  }

  if (songToInject) return songToInject
  if (candidates[0]) return candidates[0]

  // If the whole library is already present in queue, allow reuse (except current song)
  const reusable = candidatePool.filter((song) => song.id !== currentSong.id)
  return reusable[0]
}

function queueSonaDjTrack(mode: SonaDjMode, songToInject: ISong) {
  const { currentList, currentSongIndex, currentSong, originalList } =
    usePlayerStore.getState().songlist
  const injectedSong = asInjectedSong(songToInject)

  if (mode === SonaDjMode.Drift || mode === SonaDjMode.Era) {
    // Keep user queue intact and inject dynamically as the immediate next track.
    const nextList = addNextSongList(currentSongIndex, currentList, [injectedSong])

    const indexOnOriginalList = originalList.findIndex(
      (song) => song.id === currentSong.id,
    )
    const nextOriginalList =
      indexOnOriginalList >= 0
        ? addNextSongList(indexOnOriginalList, originalList, [songToInject])
        : [...originalList, songToInject]

    usePlayerStore.setState((state) => {
      state.songlist.currentList = nextList
      state.songlist.originalList = nextOriginalList
    })
    return
  }

  // Wildcard keeps alternating with the user's queue.
  // Insert directly to allow duplicates when the library is small.
  const newCurrentList = addNextSongList(currentSongIndex, currentList, [
    injectedSong,
  ])

  const indexOnOriginalList = originalList.findIndex(
    (song) => song.id === currentSong.id,
  )
  const newOriginalList =
    indexOnOriginalList >= 0
      ? addNextSongList(indexOnOriginalList, originalList, [songToInject])
      : [...originalList, songToInject]

  usePlayerStore.setState((state) => {
    state.songlist.currentList = newCurrentList
    state.songlist.originalList = newOriginalList
  })
}

function getEmergencySonaDjFallback(currentSong: ISong) {
  const { currentList, originalList } = usePlayerStore.getState().songlist
  const pool = [...currentList, ...originalList]
  return pool.find((song) => song.id !== currentSong.id)
}

let sonaDjPlannerInFlight = false

async function ensureSonaDjNextTrack() {
  if (sonaDjPlannerInFlight) return

  const state = usePlayerStore.getState()
  const mode = getRuntimeSonaDjMode()
  if (mode === SonaDjMode.Off) return
  if (state.playerState.mediaType !== 'song') return

  const { currentSong, currentList, currentSongIndex } = state.songlist
  if (!currentSong?.id) return

  const nextSong = currentList[currentSongIndex + 1]
  const currentSongIsInjected = isInjectedSong(currentSong)
  const nextSongIsInjected = isInjectedSong(nextSong)

  if (mode === SonaDjMode.Adventure && currentSongIsInjected) return
  if (nextSongIsInjected) return

  sonaDjPlannerInFlight = true
  try {
    const songToInject = await getSonaDjCandidate(mode, currentSong, currentList)
    const fallback =
      mode === SonaDjMode.Adventure
        ? songToInject ?? getEmergencySonaDjFallback(currentSong)
        : songToInject ?? getEmergencySonaDjFallback(currentSong) ?? currentSong

    if (fallback) {
      queueSonaDjTrack(mode, fallback)
    }
  } catch {
    const fallback =
      mode === SonaDjMode.Adventure
        ? getEmergencySonaDjFallback(currentSong)
        : getEmergencySonaDjFallback(currentSong) ?? currentSong
    if (fallback) {
      queueSonaDjTrack(mode, fallback)
    }
  } finally {
    sonaDjPlannerInFlight = false
  }
}

let runtimeShufflePlannerInFlight = false

async function getRuntimeRandomSong(currentSong?: ISong, excludedIds?: Set<string>) {
  const randomSongs = await subsonic.songs.getRandomSongs({
    size: SONA_DJ_POOL_SIZE,
  })
  const randomSong = randomSongs?.find(
    (song) => song.id !== currentSong?.id && !excludedIds?.has(song.id),
  )
  if (randomSong) return randomSong

  const fallbackSongs = await subsonic.songs.getAllSongs(200)
  return fallbackSongs.find(
    (song) => song.id !== currentSong?.id && !excludedIds?.has(song.id),
  )
}

async function ensureRuntimeShuffleNextTrack() {
  if (runtimeShufflePlannerInFlight) return
  if (!getRuntimeShuffleAllEnabled()) return

  const state = usePlayerStore.getState()
  if (state.playerState.mediaType !== 'song') return

  const { currentList, currentSongIndex, currentSong, originalList } = state.songlist
  if (!currentSong?.id) return

  const hasNext = currentSongIndex + 1 < currentList.length
  if (hasNext) return

  runtimeShufflePlannerInFlight = true
  try {
    const randomSong = await getRuntimeRandomSong(currentSong)
    if (!randomSong) return

    const newCurrentList = addNextSongList(currentSongIndex, currentList, [randomSong])
    const indexOnOriginalList = originalList.findIndex((song) => song.id === currentSong.id)
    const newOriginalList =
      indexOnOriginalList >= 0
        ? addNextSongList(indexOnOriginalList, originalList, [randomSong])
        : [...originalList, randomSong]

    usePlayerStore.setState((nextState) => {
      nextState.songlist.currentList = newCurrentList
      nextState.songlist.originalList = newOriginalList
    })
  } finally {
    runtimeShufflePlannerInFlight = false
  }
}

export const usePlayerStore = createWithEqualityFn<IPlayerContext>()(
  subscribeWithSelector(
    persist(
      devtools(
        immer((set, get) => ({
          songlist: {
            shuffledList: [],
            originalList: [],
            originalSongIndex: 0,
            currentSong: {} as ISong,
            currentList: [],
            currentSongIndex: 0,
            radioList: [],
            podcastList: [],
            podcastListProgresses: [],
          },
          playerState: {
            isPlaying: false,
            loopState: LoopState.Off,
            isShuffleActive: false,
            isSongStarred: false,
            volume: 100,
            currentDuration: 0,
            mediaType: 'song',
            audioPlayerRef: null,
            mainDrawerState: false,
            queueState: false,
            lyricsState: false,
            currentPlaybackRate: 1,
            hasPrev: false,
            hasNext: false,
          },
          playerProgress: {
            progress: 0,
          },
          settings: {
            privacy: {
              lrclib: {
                enabled: true,
                setEnabled(value) {
                  set((state) => {
                    state.settings.privacy.lrclib.enabled = value
                  })
                },
                customUrlEnabled: false,
                setCustomUrlEnabled(value) {
                  set((state) => {
                    state.settings.privacy.lrclib.customUrlEnabled = value
                  })
                },
                customUrl: 'https://lrclib.net',
                setCustomUrl(value) {
                  set((state) => {
                    state.settings.privacy.lrclib.customUrl = value
                  })
                },
              },
            },
            volume: {
              min: 0,
              max: 100,
              step: 1,
              wheelStep: 5,
            },
            fullscreen: {
              autoFullscreenEnabled: false,
              setAutoFullscreenEnabled: (value) => {
                set((state) => {
                  state.settings.fullscreen.autoFullscreenEnabled = value
                })
              },
            },
            lyrics: {
              preferSyncedLyrics: false,
              setPreferSyncedLyrics: (value) => {
                set((state) => {
                  state.settings.lyrics.preferSyncedLyrics = value
                })
              },
            },
            replayGain: {
              values: {
                enabled: false,
                type: 'track',
                preAmp: 0,
                error: false,
                defaultGain: -6,
              },
              actions: {
                setReplayGainEnabled: (value) => {
                  set((state) => {
                    state.settings.replayGain.values.enabled = value
                  })
                },
                setReplayGainType: (value) => {
                  set((state) => {
                    state.settings.replayGain.values.type = value
                  })
                },
                setReplayGainPreAmp: (value) => {
                  set((state) => {
                    state.settings.replayGain.values.preAmp = value
                  })
                },
                setReplayGainError: (value) => {
                  set((state) => {
                    state.settings.replayGain.values.error = value
                  })
                },
                setReplayGainDefaultGain: (value) => {
                  set((state) => {
                    state.settings.replayGain.values.defaultGain = value
                  })
                },
              },
            },
            crossfade: {
              enabled: false,
              setEnabled: (value) => {
                set((state) => {
                  state.settings.crossfade.enabled = value
                })
              },
            },
            colors: {
              currentSongColor: null,
              currentSongColorPalette: null,
              currentSongColorIntensity: 0.65,
              bigPlayer: {
                useSongColor: false,
                blur: {
                  value: 40,
                  settings: blurSettings,
                },
              },
              queue: {
                useSongColor: false,
              },
            },
          },
          actions: {
            setSongList: (songlist, index, shuffle = false) => {
              clearSonaDjInjectedSongIds()
              setRuntimeShuffleAllEnabled(false)
              const { currentList, currentSongIndex } = get().songlist

              const listsAreEqual = areSongListsEqual(currentList, songlist)
              const songHasChanged = currentSongIndex !== index

              if (!listsAreEqual || (listsAreEqual && songHasChanged)) {
                get().actions.resetProgress()
              }

              if (listsAreEqual && songHasChanged && !shuffle) {
                set((state) => {
                  state.playerState.isPlaying = true
                  state.songlist.currentSongIndex = index
                })
                return
              }

              set((state) => {
                state.songlist.originalList = songlist
                state.songlist.originalSongIndex = index
                state.playerState.mediaType = 'song'
                state.songlist.radioList = []
                state.songlist.podcastList = []
              })

              if (shuffle) {
                const shuffledList = shuffleSongList(songlist, index, true)

                set((state) => {
                  state.songlist.shuffledList = shuffledList
                  state.songlist.currentList = shuffledList
                  state.songlist.currentSongIndex = 0
                  state.playerState.isShuffleActive = true
                  state.playerState.isPlaying = true
                })
              } else {
                set((state) => {
                  state.songlist.currentList = songlist
                  state.songlist.currentSongIndex = index
                  state.playerState.isShuffleActive = false
                  state.playerState.isPlaying = true
                })
              }
            },
            setCurrentSong: () => {
              const { currentList, currentSongIndex } = get().songlist

              if (currentList.length > 0) {
                set((state) => {
                  state.songlist.currentSong = currentList[currentSongIndex]
                })
              }
            },
            playSong: (song) => {
              clearSonaDjInjectedSongIds()
              setRuntimeShuffleAllEnabled(false)
              const { isPlaying } = get().playerState
              const songIsAlreadyPlaying = get().actions.checkActiveSong(
                song.id,
              )
              if (songIsAlreadyPlaying && !isPlaying) {
                set((state) => {
                  state.playerState.isPlaying = true
                })
              } else {
                get().actions.resetProgress()
                set((state) => {
                  state.playerState.mediaType = 'song'
                  state.songlist.currentList = [song]
                  state.songlist.currentSongIndex = 0
                  state.playerState.isShuffleActive = false
                  state.playerState.isPlaying = true
                  state.songlist.radioList = []
                  state.songlist.podcastList = []
                })
              }
            },
            setNextOnQueue: (list) => {
              const {
                currentList,
                currentSongIndex,
                currentSong,
                originalList,
              } = get().songlist

              const currentListIds = new Set(currentList.map((song) => song.id))
              const uniqueList = list.filter(
                (song) => !currentListIds.has(song.id),
              )

              const newCurrentList = addNextSongList(
                currentSongIndex,
                currentList,
                uniqueList,
              )

              const indexOnOriginalList = originalList.findIndex(
                (song) => song.id === currentSong.id,
              )
              const newOriginalList = addNextSongList(
                indexOnOriginalList,
                originalList,
                uniqueList,
              )

              set((state) => {
                state.songlist.currentList = newCurrentList
                state.songlist.originalList = newOriginalList
              })

              const { isPlaying } = get().playerState

              if (!isPlaying) {
                get().actions.setPlayingState(true)
              }
            },
            seedSonaDjTrack: async (mode) => {
              const selectedMode = mode ?? getSonaDjMode()
              setRuntimeSonaDjMode(selectedMode)
              setRuntimeShuffleAllEnabled(false)
              if (selectedMode === SonaDjMode.Off) return
              await ensureSonaDjNextTrack()
            },
            startRuntimeShuffleAll: async () => {
              setRuntimeSonaDjMode(SonaDjMode.Off)
              setRuntimeShuffleAllEnabled(true)
              clearSonaDjInjectedSongIds()

              const firstSong = await getRuntimeRandomSong()
              if (!firstSong) {
                setRuntimeShuffleAllEnabled(false)
                return
              }
              const secondSong = await getRuntimeRandomSong(
                firstSong,
                new Set([firstSong.id]),
              )
              const initialList = secondSong ? [firstSong, secondSong] : [firstSong]

              get().actions.resetProgress()
              set((state) => {
                state.playerState.mediaType = 'song'
                state.songlist.currentList = initialList
                state.songlist.originalList = initialList
                state.songlist.currentSongIndex = 0
                state.playerState.isShuffleActive = false
                state.playerState.isPlaying = true
                state.songlist.radioList = []
                state.songlist.podcastList = []
              })
            },
            setLastOnQueue: (list) => {
              const { currentList, originalList } = get().songlist

              const currentListIds = new Set(currentList.map((song) => song.id))
              const uniqueList = list.filter(
                (song) => !currentListIds.has(song.id),
              )

              const newCurrentList = [...currentList, ...uniqueList]
              const newOriginalList = [...originalList, ...uniqueList]

              set((state) => {
                state.songlist.currentList = newCurrentList
                state.songlist.originalList = newOriginalList
              })

              const { isPlaying } = get().playerState

              if (!isPlaying) {
                get().actions.setPlayingState(true)
              }
            },
            setPlayRadio: (list, index) => {
              const { mediaType } = get().playerState
              const { radioList, currentSongIndex } = get().songlist

              if (
                mediaType === 'radio' &&
                radioList.length > 0 &&
                list[index].id === radioList[currentSongIndex].id
              ) {
                set((state) => {
                  state.playerState.isPlaying = true
                })
                return
              }

              get().actions.clearPlayerState()
              set((state) => {
                state.playerState.mediaType = 'radio'
                state.songlist.radioList = list
                state.songlist.currentSongIndex = index
                state.playerState.isPlaying = true
              })
            },
            setPlayPodcast: (list, index, progress) => {
              const { mediaType } = get().playerState
              const { podcastList, currentSongIndex } = get().songlist

              if (
                mediaType === 'podcast' &&
                podcastList.length > 0 &&
                list[index].id === podcastList[currentSongIndex].id
              ) {
                set((state) => {
                  state.playerState.isPlaying = true
                })
                return
              }

              get().actions.clearPlayerState()
              set((state) => {
                state.playerState.mediaType = 'podcast'
                state.songlist.podcastList = list
                state.songlist.currentSongIndex = index
                state.playerState.isPlaying = true
                state.songlist.podcastListProgresses[index] = progress
              })
            },
            setUpdatePodcastProgress: (progress) => {
              const { mediaType } = get().playerState
              if (mediaType !== 'podcast') return

              const { currentSongIndex } = get().songlist

              set((state) => {
                state.songlist.podcastListProgresses[currentSongIndex] =
                  progress
              })
            },
            getCurrentPodcastProgress: () => {
              const { mediaType } = get().playerState
              if (mediaType !== 'podcast') return 0

              const { podcastListProgresses, currentSongIndex } = get().songlist

              return podcastListProgresses[currentSongIndex] ?? 0
            },
            setNextPodcast: (episode, progress) => {
              const { podcastList, currentSongIndex } = get().songlist

              const currentListIds = new Set(
                podcastList.map((episode) => episode.id),
              )
              if (currentListIds.has(episode.id)) {
                return
              }

              const newPodcastList = addNextSongList(
                currentSongIndex,
                podcastList,
                [episode],
              )

              const nextIndex = currentSongIndex + 1

              set((state) => {
                state.songlist.podcastList = newPodcastList
                state.playerState.mediaType = 'podcast'
                state.songlist.podcastListProgresses[nextIndex] = progress
              })

              const { isPlaying } = get().playerState

              if (!isPlaying) {
                get().actions.setPlayingState(true)
              }
            },
            setLastPodcast: (episode, progress) => {
              const { podcastList } = get().songlist

              const currentListIds = new Set(
                podcastList.map((episode) => episode.id),
              )
              if (currentListIds.has(episode.id)) {
                return
              }

              const newPodcastList = [...podcastList, episode]

              const lastIndex = newPodcastList.length - 1

              set((state) => {
                state.songlist.podcastList = newPodcastList
                state.playerState.mediaType = 'podcast'
                state.songlist.podcastListProgresses[lastIndex] = progress
              })

              const { isPlaying } = get().playerState

              if (!isPlaying) {
                get().actions.setPlayingState(true)
              }
            },
            setPlayingState: (status) => {
              set((state) => {
                state.playerState.isPlaying = status
              })
            },
            togglePlayPause: () => {
              set((state) => {
                state.playerState.isPlaying = !state.playerState.isPlaying
              })
            },
            toggleLoop: () => {
              const { loopState } = get().playerState

              // Cycles to the next state
              const newState =
                (loopState + 1) % (Object.keys(LoopState).length / 2)

              set((state) => {
                state.playerState.loopState = newState
              })
            },
            toggleShuffle: () => {
              const { isShuffleActive } = get().playerState
              const { currentList, currentSongIndex } = get().songlist

              const listLength = currentList.length
              const isPlayingOneOrLess = listLength <= 1
              const isPlayingLastSong = currentSongIndex === listLength - 1

              if (isPlayingOneOrLess || isPlayingLastSong) return

              if (isShuffleActive) {
                const currentSongId = get().songlist.currentSong.id
                const index = get().songlist.originalList.findIndex(
                  (song) => song.id === currentSongId,
                )

                set((state) => {
                  state.songlist.currentList = state.songlist.originalList
                  state.songlist.currentSongIndex = index
                  state.playerState.isShuffleActive = false
                })
              } else {
                const { currentList, currentSongIndex } = get().songlist
                const songListToShuffle = currentList.slice(currentSongIndex)
                const shuffledList = shuffleSongList(songListToShuffle, 0)

                set((state) => {
                  state.songlist.shuffledList = shuffledList
                  state.songlist.currentList = shuffledList
                  state.songlist.currentSongIndex = 0
                  state.playerState.isShuffleActive = true
                })
              }
            },
            playNextSong: () => {
              const { loopState } = get().playerState
              const { hasNextSong, resetProgress, playFirstSongInQueue } =
                get().actions

              if (hasNextSong()) {
                resetProgress()
                set((state) => {
                  state.songlist.currentSongIndex += 1
                })
              } else if (loopState === LoopState.All) {
                resetProgress()
                playFirstSongInQueue()
              }
            },
            playPrevSong: () => {
              if (get().actions.hasPrevSong()) {
                get().actions.resetProgress()
                set((state) => {
                  state.songlist.currentSongIndex -= 1
                })
              }
            },
            clearPlayerState: () => {
              clearSonaDjInjectedSongIds()
              setRuntimeShuffleAllEnabled(false)
              set((state) => {
                state.songlist.originalList = []
                state.songlist.shuffledList = []
                state.songlist.currentList = []
                state.songlist.currentSong = {} as ISong
                state.songlist.radioList = []
                state.songlist.podcastList = []
                state.songlist.podcastListProgresses = []
                state.songlist.originalSongIndex = 0
                state.songlist.currentSongIndex = 0
                state.playerState.mediaType = 'song'
                state.playerState.isPlaying = false
                state.playerState.loopState = LoopState.Off
                state.playerState.isShuffleActive = false
                state.playerState.mainDrawerState = false
                state.playerState.queueState = false
                state.playerState.lyricsState = false
                state.playerState.currentDuration = 0
                state.playerState.audioPlayerRef = null
                state.settings.colors.currentSongColor = null
                state.settings.colors.currentSongColorPalette = null
              })
            },
            resetProgress: () => {
              set((state) => {
                state.playerProgress.progress = 0
              })
            },
            setProgress: (progress) => {
              set((state) => {
                state.playerProgress.progress = progress
              })
            },
            setVolume: (volume) => {
              set((state) => {
                state.playerState.volume = volume
              })
            },
            handleVolumeWheel: (isScrollingDown) => {
              const { min, max, wheelStep } = get().settings.volume
              const { volume } = get().playerState

              if (isScrollingDown && volume === min) return
              if (!isScrollingDown && volume === max) return

              const volumeAdjustment = isScrollingDown ? -wheelStep : wheelStep
              const adjustedVolume = volume + volumeAdjustment
              const finalVolume = clamp(adjustedVolume, min, max)

              set((state) => {
                state.playerState.volume = finalVolume
              })
            },
            setCurrentDuration: (duration) => {
              set((state) => {
                state.playerState.currentDuration = duration
              })
            },
            hasNextSong: () => {
              const { mediaType } = get().playerState
              const { currentList, currentSongIndex, radioList, podcastList } =
                get().songlist

              const nextIndex = currentSongIndex + 1

              if (mediaType === 'song') {
                return nextIndex < currentList.length
              }
              if (mediaType === 'radio') {
                return nextIndex < radioList.length
              }
              if (mediaType === 'podcast') {
                return nextIndex < podcastList.length
              }

              return false
            },
            hasPrevSong: () => {
              const { currentSongIndex } = get().songlist
              return currentSongIndex > 0
            },
            isPlayingOneSong: () => {
              const { currentList } = get().songlist
              return currentList.length === 1
            },
            checkActiveSong: (id: string) => {
              const currentSong = get().songlist.currentSong
              if (currentSong) {
                return id === currentSong.id
              } else {
                return false
              }
            },
            checkIsSongStarred: () => {
              const { currentList, currentSongIndex } = get().songlist
              const { mediaType } = get().playerState
              const song = currentList[currentSongIndex]

              if (mediaType === 'song' && song) {
                const isStarred = typeof song.starred === 'string'

                set((state) => {
                  state.playerState.isSongStarred = isStarred
                })
              } else {
                set((state) => {
                  state.playerState.isSongStarred = false
                })
              }
            },
            starSongInQueue: (id) => {
              const { currentList } = get().songlist
              const { mediaType } = get().playerState

              if (currentList.length === 0 && mediaType !== 'song') return

              const songIndex = currentList.findIndex((song) => song.id === id)
              if (songIndex === -1) return

              const songList = [...currentList]
              const isSongStarred =
                typeof songList[songIndex].starred === 'string'

              songList[songIndex] = {
                ...songList[songIndex],
                starred: isSongStarred ? undefined : new Date().toISOString(),
              }

              set((state) => {
                state.songlist.currentList = songList
              })
            },
            starCurrentSong: async () => {
              const { currentList, currentSongIndex } = get().songlist
              const { mediaType } = get().playerState

              if (currentList.length === 0 && mediaType !== 'song') return

              const { id, starred } = get().songlist.currentSong
              const isSongStarred = typeof starred === 'string'
              await subsonic.star.handleStarItem({
                id,
                starred: isSongStarred,
              })

              const songList = [...currentList]
              songList[currentSongIndex] = {
                ...songList[currentSongIndex],
                starred: isSongStarred ? undefined : new Date().toISOString(),
              }

              set((state) => {
                state.songlist.currentList = songList
              })
            },
            setPlaybackRate: (value) => {
              set((state) => {
                state.playerState.currentPlaybackRate = value
              })
            },
            setAudioPlayerRef: (audioPlayer) => {
              set(
                produce((state: IPlayerContext) => {
                  state.playerState.audioPlayerRef = audioPlayer
                }),
              )
            },
            removeSongFromQueue: (id) => {
              const {
                currentList,
                originalList,
                shuffledList,
                currentSongIndex,
                originalSongIndex,
              } = get().songlist

              // Get the removed song index to adjust the current one.
              const removedSongIndex = currentList.findIndex(
                (song) => song.id === id,
              )
              const newCurrentList = currentList.filter(
                (song) => song.id !== id,
              )

              // Clear player state if list is empty
              if (newCurrentList.length === 0) {
                get().actions.clearPlayerState()
                return
              }

              // In case of removing current song, resets the progress
              if (removedSongIndex === currentSongIndex) {
                get().actions.resetProgress()
              }

              const newOriginalList = originalList.filter(
                (song) => song.id !== id,
              )
              const newShuffledList = shuffledList.filter(
                (song) => song.id !== id,
              )

              // Update index to fit new current list
              const updatedCurrentIndex = Math.min(
                currentSongIndex -
                  (removedSongIndex < currentSongIndex ? 1 : 0),
                newCurrentList.length - 1,
              )

              // Update original index
              const removedOriginalIndex = originalList.findIndex(
                (song) => song.id === id,
              )
              const updatedOriginalIndex = Math.min(
                originalSongIndex -
                  (removedOriginalIndex < originalSongIndex ? 1 : 0),
                newOriginalList.length - 1,
              )

              set((state) => {
                state.songlist.currentList = newCurrentList
                state.songlist.originalList = newOriginalList
                state.songlist.shuffledList = newShuffledList
                state.songlist.currentSongIndex = updatedCurrentIndex
                state.songlist.originalSongIndex = updatedOriginalIndex
              })
            },
            reorderQueue: (fromIndex, toIndex) => {
              const { currentList, currentSongIndex } = get().songlist

              const newList = [...currentList]
              const [moved] = newList.splice(fromIndex, 1)
              newList.splice(toIndex, 0, moved)

              // Adjust currentSongIndex so the playing song stays correct
              let newSongIndex = currentSongIndex
              if (fromIndex === currentSongIndex) {
                newSongIndex = toIndex
              } else if (
                fromIndex < currentSongIndex &&
                toIndex >= currentSongIndex
              ) {
                newSongIndex = currentSongIndex - 1
              } else if (
                fromIndex > currentSongIndex &&
                toIndex <= currentSongIndex
              ) {
                newSongIndex = currentSongIndex + 1
              }

              set((state) => {
                state.songlist.currentList = newList
                state.songlist.currentSongIndex = newSongIndex
              })
            },
            setMainDrawerState: (status) => {
              set((state) => {
                state.playerState.mainDrawerState = status
              })
            },
            setQueueState: (status) => {
              set((state) => {
                state.playerState.queueState = status
              })
            },
            toggleQueueAction: () => {
              const { mainDrawerState, lyricsState, queueState } =
                get().playerState
              const {
                toggleQueueAndLyrics,
                setQueueState,
                setMainDrawerState,
              } = get().actions

              if (mainDrawerState && lyricsState) {
                toggleQueueAndLyrics()
              } else {
                setQueueState(!queueState)
                setMainDrawerState(!mainDrawerState)
              }
            },
            setLyricsState: (status) => {
              set((state) => {
                state.playerState.lyricsState = status
              })
            },
            toggleLyricsAction: () => {
              const { mainDrawerState, lyricsState, queueState } =
                get().playerState
              const {
                toggleQueueAndLyrics,
                setLyricsState,
                setMainDrawerState,
              } = get().actions

              if (mainDrawerState && queueState) {
                toggleQueueAndLyrics()
              } else {
                setLyricsState(!lyricsState)
                setMainDrawerState(!mainDrawerState)
              }
            },
            toggleQueueAndLyrics: () => {
              const { queueState, lyricsState } = get().playerState

              set((state) => {
                state.playerState.queueState = !queueState
                state.playerState.lyricsState = !lyricsState
              })
            },
            closeDrawer: () => {
              set((state) => {
                state.playerState.mainDrawerState = false
                state.playerState.queueState = false
                state.playerState.lyricsState = false
              })
            },
            playFirstSongInQueue: () => {
              set((state) => {
                state.songlist.currentSongIndex = 0
              })
            },
            handleSongEnded: async () => {
              const { loopState } = get().playerState
              const {
                hasNextSong,
                playNextSong,
                setPlayingState,
                clearPlayerState,
              } = get().actions

              const mode = getRuntimeSonaDjMode()
              const isSonaDjEnabled = mode !== SonaDjMode.Off
              await ensureSonaDjNextTrack()
              await ensureRuntimeShuffleNextTrack()

              if (isSonaDjEnabled && !hasNextSong()) {
                await ensureSonaDjNextTrack()
              }
              if (getRuntimeShuffleAllEnabled() && !hasNextSong()) {
                await ensureRuntimeShuffleNextTrack()
              }

              if (hasNextSong() || loopState === LoopState.All) {
                playNextSong()
                setPlayingState(true)
              } else {
                clearPlayerState()
                setPlayingState(false)
              }
            },
            getCurrentProgress: () => {
              return get().playerProgress.progress
            },
            updateQueueChecks: () => {
              const { hasPrevSong, hasNextSong } = get().actions

              set((state) => {
                state.playerState.hasPrev = hasPrevSong()
                state.playerState.hasNext = hasNextSong()
              })
            },
            resetConfig: () => {
              set((state) => {
                state.settings.colors.queue.useSongColor = false
                state.settings.colors.bigPlayer.useSongColor = false
                state.settings.colors.bigPlayer.blur.value = 40
                state.settings.colors.bigPlayer.blur.settings = blurSettings
                state.settings.colors.currentSongColorIntensity = 0.65
                state.settings.fullscreen.autoFullscreenEnabled = false
                state.settings.lyrics.preferSyncedLyrics = false
                state.settings.replayGain.values = {
                  enabled: false,
                  type: 'track',
                  preAmp: 0,
                  error: false,
                  defaultGain: -6,
                }
              })
            },
            setCurrentSongColor: (value) => {
              set((state) => {
                state.settings.colors.currentSongColor = value
              })
            },
            setCurrentSongColorPalette: (value) => {
              set((state) => {
                state.settings.colors.currentSongColorPalette = value
              })
            },
            setCurrentSongIntensity: (value) => {
              set((state) => {
                state.settings.colors.currentSongColorIntensity = value
              })
            },
            setUseSongColorOnQueue: (value) => {
              set((state) => {
                state.settings.colors.queue.useSongColor = value
              })
            },
            setUseSongColorOnBigPlayer: (value) => {
              set((state) => {
                state.settings.colors.bigPlayer.useSongColor = value
              })
            },
            setBigPlayerBlurValue: (value) => {
              set((state) => {
                state.settings.colors.bigPlayer.blur.value = value
              })
            },
            setRuntimeSonaDjMode: (mode) => {
              setRuntimeSonaDjMode(mode as SonaDjMode)
            },
          },
        })),
        { name: 'player_store' },
      ),
      {
        name: 'player_store',
        version: 1,
        merge: (persistedState, currentState) => {
          let merged = merge(currentState, persistedState)

          idbStorage.getItem<ISongList>(miniStores.songlist, (value) => {
            if (!value) return

            const newState = {
              songlist: value,
            }

            merged = merge(merged, newState)
          })

          return merged
        },
        partialize: (state) => {
          const appStore = omit(state, [
            'songlist',
            'actions',
            'playerState.isPlaying',
            'playerState.audioPlayerRef',
            'playerState.mainDrawerState',
            'playerState.queueState',
            'playerState.lyricsState',
            'state.settings.colors.bigPlayer.blur.settings',
          ])

          return appStore
        },
      },
    ),
  ),
  shallow,
)

usePlayerStore.subscribe(
  (state) => [state.songlist],
  ([songlist]) => {
    idbStorage.setItem(miniStores.songlist, songlist)
  },
  {
    equalityFn: shallow,
  },
)

usePlayerStore.subscribe(
  (state) => [state.songlist.currentList, state.songlist.currentSongIndex],
  () => {
    const playerStore = usePlayerStore.getState()
    const { mediaType } = playerStore.playerState
    if (mediaType === 'radio' || mediaType === 'podcast') return

    playerStore.actions.checkIsSongStarred()
    playerStore.actions.setCurrentSong()

    const { currentList } = playerStore.songlist
    const { progress } = playerStore.playerProgress

    if (currentList.length === 0 && progress > 0) {
      playerStore.actions.resetProgress()
    }
  },
  {
    equalityFn: shallow,
  },
)

usePlayerStore.subscribe(
  ({ songlist }) => [
    songlist.currentList,
    songlist.radioList,
    songlist.podcastList,
    songlist.currentSongIndex,
  ],
  () => {
    usePlayerStore.getState().actions.updateQueueChecks()
  },
  {
    equalityFn: shallow,
  },
)

usePlayerStore.subscribe(
  (state) => [
    state.songlist.currentSongIndex,
    state.songlist.currentSong?.id,
    state.songlist.currentList.length,
    state.playerState.mediaType,
  ],
  () => {
    void ensureSonaDjNextTrack()
    void ensureRuntimeShuffleNextTrack()
  },
  {
    equalityFn: shallow,
  },
)

usePlayerStore.subscribe(
  (state) => [
    state.songlist.currentSong,
    state.playerState.isPlaying,
    state.playerState.currentDuration,
  ],
  () => {
    discordRpc.sendCurrentSong()
  },
  {
    equalityFn: shallow,
  },
)

function desktopStateListener() {
  if (!isDesktop()) return

  const { togglePlayPause, playPrevSong, playNextSong } =
    usePlayerStore.getState().actions

  window.api.playerStateListener((action) => {
    if (action === 'togglePlayPause') togglePlayPause()
    if (action === 'skipBackwards') playPrevSong()
    if (action === 'skipForward') playNextSong()
  })
}

desktopStateListener()

function updateDesktopState() {
  if (!isDesktop()) return

  const { isPlaying, hasPrev, hasNext } = usePlayerStore.getState().playerState
  const { currentList, podcastList, radioList } =
    usePlayerStore.getState().songlist

  const hasSongs = currentList.length >= 1
  const hasPodcasts = podcastList.length >= 1
  const hasRadios = radioList.length >= 1

  window.api.updatePlayerState({
    isPlaying,
    hasPrevious: hasPrev,
    hasNext,
    hasSonglist: hasSongs || hasPodcasts || hasRadios,
  })
}

updateDesktopState()

usePlayerStore.subscribe(
  (state) => [
    state.playerState.isPlaying,
    state.playerState.hasPrev,
    state.playerState.hasNext,
    state.songlist.currentList,
  ],
  () => {
    updateDesktopState()
  },
  {
    equalityFn: shallow,
  },
)

export const usePlayerActions = () => usePlayerStore((state) => state.actions)

export const usePlayerSonglist = () =>
  usePlayerStore((state) => {
    const {
      currentList,
      currentSong,
      currentSongIndex,
      podcastList,
      radioList,
    } = state.songlist

    return {
      currentList,
      currentSong,
      currentSongIndex,
      podcastList,
      radioList,
    }
  })

export const usePlayerCurrentSong = () =>
  usePlayerStore((state) => state.songlist.currentSong)

export const usePlayerCurrentSongIndex = () =>
  usePlayerStore((state) => state.songlist.currentSongIndex)

export const usePlayerProgress = () =>
  usePlayerStore((state) => state.playerProgress.progress)

export const usePlayerVolume = () => ({
  volume: usePlayerStore((state) => state.playerState.volume),
  setVolume: usePlayerStore((state) => state.actions.setVolume),
  handleVolumeWheel: usePlayerStore((state) => state.actions.handleVolumeWheel),
})

export const useVolumeSettings = () =>
  usePlayerStore((state) => state.settings.volume)

export const useReplayGainState = () => {
  const { enabled, type, preAmp, error, defaultGain } = usePlayerStore(
    (state) => state.settings.replayGain.values,
  )

  return {
    replayGainEnabled: enabled,
    replayGainType: type,
    replayGainPreAmp: preAmp,
    replayGainError: error,
    replayGainDefaultGain: defaultGain,
  }
}

export const useReplayGainActions = () =>
  usePlayerStore((state) => state.settings.replayGain.actions)

export const useCrossfadeSettings = () =>
  usePlayerStore((state) => state.settings.crossfade)

export const useFullscreenPlayerSettings = () =>
  usePlayerStore((state) => state.settings.fullscreen)

export const useLrcLibSettings = () =>
  usePlayerStore((state) => state.settings.privacy.lrclib)

export const useLyricsSettings = () =>
  usePlayerStore((state) => state.settings.lyrics)

export const usePlayerSettings = () => usePlayerStore((state) => state.settings)

export const usePlayerMediaType = () => {
  const mediaType = usePlayerStore((state) => state.playerState.mediaType)
  const isSong = mediaType === 'song'
  const isRadio = mediaType === 'radio'
  const isPodcast = mediaType === 'podcast'

  return {
    isSong,
    isRadio,
    isPodcast,
  }
}

export const usePlayerIsPlaying = () =>
  usePlayerStore((state) => state.playerState.isPlaying)

export const usePlayerDuration = () =>
  usePlayerStore((state) => state.playerState.currentDuration)

export const usePlayerSongStarred = () =>
  usePlayerStore((state) => state.playerState.isSongStarred)

export const usePlayerShuffle = () =>
  usePlayerStore((state) => state.playerState.isShuffleActive)

export const usePlayerLoop = () =>
  usePlayerStore((state) => state.playerState.loopState)

export const usePlayerPrevAndNext = () =>
  usePlayerStore((state) => ({
    hasPrev: state.playerState.hasPrev,
    hasNext: state.playerState.hasNext,
  }))

export const usePlayerRef = () =>
  usePlayerStore((state) => state.playerState.audioPlayerRef)

export const getVolume = () => usePlayerStore.getState().playerState.volume

export const useMainDrawerState = () =>
  usePlayerStore((state) => ({
    mainDrawerState: state.playerState.mainDrawerState,
    setMainDrawerState: state.actions.setMainDrawerState,
    toggleQueueAndLyrics: state.actions.toggleQueueAndLyrics,
    closeDrawer: state.actions.closeDrawer,
  }))

export const useQueueState = () =>
  usePlayerStore((state) => ({
    queueState: state.playerState.queueState,
    setQueueState: state.actions.setQueueState,
    toggleQueueAction: state.actions.toggleQueueAction,
  }))

export const useLyricsState = () =>
  usePlayerStore((state) => ({
    lyricsState: state.playerState.lyricsState,
    setLyricsState: state.actions.setLyricsState,
    toggleLyricsAction: state.actions.toggleLyricsAction,
  }))

export const useSongColor = () =>
  usePlayerStore((state) => {
    const { currentSongColor, currentSongColorPalette, currentSongColorIntensity, queue } =
      state.settings.colors
    const { useSongColor, blur } = state.settings.colors.bigPlayer
    const {
      setCurrentSongColor,
      setCurrentSongColorPalette,
      setUseSongColorOnQueue,
      setUseSongColorOnBigPlayer,
      setBigPlayerBlurValue,
      setCurrentSongIntensity,
    } = state.actions

    return {
      currentSongColor,
      currentSongColorPalette,
      setCurrentSongColor,
      setCurrentSongColorPalette,
      currentSongColorIntensity,
      setCurrentSongIntensity,
      useSongColorOnQueue: queue.useSongColor,
      useSongColorOnBigPlayer: useSongColor,
      setUseSongColorOnQueue,
      setUseSongColorOnBigPlayer,
      bigPlayerBlur: blur,
      setBigPlayerBlurValue,
    }
  })

export const usePlayerCurrentList = () =>
  usePlayerStore((state) => state.songlist.currentList)
