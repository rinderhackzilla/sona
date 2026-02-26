import { useQueries, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Actions } from '@/app/components/actions'
import { AlbumGridCard } from '@/app/components/albums/album-grid-card'
import { AlbumsFallback } from '@/app/components/fallbacks/album-fallbacks'
import { GridViewWrapper } from '@/app/components/grid-view-wrapper'
import ListWrapper from '@/app/components/list-wrapper'
import { getAlbumList } from '@/queries/albums'
import { subsonic } from '@/service/subsonic'
import { usePlayerActions } from '@/store/player.store'
import { AlbumsFilters } from '@/utils/albumsFilter'
import {
  getConstituentGenres,
  isGenreUsable,
  normalizeGenreName,
} from '@/utils/genreNormalization'
import { queryKeys } from '@/utils/queryKeys'

export default function Genre() {
  const { genre: genreParam } = useParams() as { genre: string }
  const genre = decodeURIComponent(genreParam)
  const { t } = useTranslation()
  const { setSongList } = usePlayerActions()
  const [isPlayLoading, setIsPlayLoading] = useState(false)
  const [isShuffleLoading, setIsShuffleLoading] = useState(false)

  // Fetch the full genre list to find all server genres that map to this canonical name
  const { data: allGenres, isLoading: isGenresLoading } = useQuery({
    queryKey: [queryKeys.genre.all],
    queryFn: subsonic.genres.get,
  })

  // All genre names on the server that normalize to this canonical genre
  const constituentGenres = useMemo(() => {
    if (!allGenres) return [genre]
    const found = getConstituentGenres(
      genre,
      allGenres.map((g) => g.value).filter(isGenreUsable),
    )
    // If nothing maps to this canonical name, fall back to the raw URL param
    return found.length > 0 ? found : [genre]
  }, [allGenres, genre])

  // Fetch albums for each constituent genre
  const albumQueries = useQueries({
    queries: constituentGenres.map((g) => ({
      queryKey: [queryKeys.album.byGenre, g],
      queryFn: () =>
        getAlbumList({
          type: AlbumsFilters.ByGenre,
          size: 500,
          offset: 0,
          fromYear: '',
          toYear: '',
          genre: g,
        }),
      enabled: !isGenresLoading,
    })),
  })

  const isLoading =
    isGenresLoading || albumQueries.some((q) => q.isLoading)

  // Merge and deduplicate albums from all constituent genres
  const albums = useMemo(() => {
    const seen = new Set<string>()
    return albumQueries
      .flatMap((q) => q.data?.albums ?? [])
      .filter((album) => {
        if (seen.has(album.id)) return false
        seen.add(album.id)
        return true
      })
  }, [albumQueries])

  const handlePlay = async () => {
    setIsPlayLoading(true)
    const allSongs = await Promise.all(
      constituentGenres.map((g) =>
        subsonic.songs.getRandomSongs({ genre: g, size: 500 }),
      ),
    )
    setIsPlayLoading(false)
    const songs = allSongs.flat().filter(Boolean) as NonNullable<
      Awaited<ReturnType<typeof subsonic.songs.getRandomSongs>>
    >[number][]
    if (songs.length) setSongList(songs, 0)
  }

  const handleShuffle = async () => {
    setIsShuffleLoading(true)
    const allSongs = await Promise.all(
      constituentGenres.map((g) =>
        subsonic.songs.getRandomSongs({ genre: g, size: 500 }),
      ),
    )
    setIsShuffleLoading(false)
    const songs = allSongs.flat().filter(Boolean) as NonNullable<
      Awaited<ReturnType<typeof subsonic.songs.getRandomSongs>>
    >[number][]
    if (songs.length) setSongList(songs, 0, true)
  }

  if (isLoading) return <AlbumsFallback />

  // Show the canonical name (normalized), with a subtitle listing merged genres if there are multiple
  const canonicalName = normalizeGenreName(genre)
  const isGrouped = constituentGenres.length > 1

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="w-full px-8 py-4 flex items-center justify-between border-b border-border/40">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
            {t('sidebar.genres', 'Genre')}
          </p>
          <h1 className="text-2xl font-bold">{canonicalName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('genres.albumCount', { count: albums.length })}
          </p>
          {isGrouped && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {constituentGenres.join(' · ')}
            </p>
          )}
        </div>
      </div>

      <ListWrapper>
        {/* Play / Shuffle buttons */}
        <Actions.Container>
          <Actions.Button
            tooltip={t('genres.buttons.play', { genre: canonicalName })}
            buttonStyle="primary"
            onClick={handlePlay}
            disabled={isPlayLoading || albums.length === 0}
          >
            <Actions.PlayIcon />
          </Actions.Button>

          <Actions.Button
            tooltip={t('genres.buttons.shuffle', { genre: canonicalName })}
            onClick={handleShuffle}
            disabled={isShuffleLoading || albums.length === 0}
          >
            <Actions.ShuffleIcon />
          </Actions.Button>
        </Actions.Container>

        {/* Albums grid */}
        {albums.length > 0 && (
          <GridViewWrapper list={albums} type="genres">
            {(album) => <AlbumGridCard album={album} />}
          </GridViewWrapper>
        )}
      </ListWrapper>
    </div>
  )
}
