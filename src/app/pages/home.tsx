import { useTranslation } from 'react-i18next'
import {
  HeaderFallback,
  PreviewListFallback,
} from '@/app/components/fallbacks/home-fallbacks'
import AlbumHeader from '@/app/components/home/carousel/album-header'
import PreviewList from '@/app/components/home/preview-list'
import GenreDiscovery from '@/app/components/home/genre-discovery'
import {
  useGetMostPlayed,
  useGetRandomAlbums,
  useGetRecentlyAdded,
  useGetRecentlyPlayed,
  useGetSimilarArtistsDiscovery,
} from '@/app/hooks/use-home'
import { ROUTES } from '@/routes/routesList'

export default function Home() {
  const { t } = useTranslation()

  const similarArtists = useGetSimilarArtistsDiscovery()

  const recentlyPlayed = useGetRecentlyPlayed()
  const mostPlayed = useGetMostPlayed()
  const recentlyAdded = useGetRecentlyAdded()
  const randomAlbums = useGetRandomAlbums()

  const sections = [
    {
      title: t('home.recentlyPlayed'),
      data: recentlyPlayed.data,
      loader: recentlyPlayed.isLoading,
      route: ROUTES.ALBUMS.RECENTLY_PLAYED,
    },
    {
      title: t('home.mostPlayed'),
      data: mostPlayed.data,
      loader: mostPlayed.isLoading,
      route: ROUTES.ALBUMS.MOST_PLAYED,
    },
    {
      title: t('home.recentlyAdded'),
      data: recentlyAdded.data,
      loader: recentlyAdded.isLoading,
      route: ROUTES.ALBUMS.RECENTLY_ADDED,
    },
    {
      title: t('home.explore'),
      data: randomAlbums.data,
      loader: randomAlbums.isLoading,
      route: ROUTES.ALBUMS.RANDOM,
    },
  ]

  return (
    <div className="w-full px-8 py-6">
      {/* Hero Section - Similar Artists Discovery */}
      {similarArtists.isFetching || similarArtists.isLoading ? (
        <HeaderFallback />
      ) : (
        <AlbumHeader
          albums={similarArtists.data?.list || []}
          title="Discover Similar Artists"
          subtitle="Albums from artists similar to what you listen to"
        />
      )}

      {/* Genre Discovery Section */}
      <GenreDiscovery />

      {/* Library Sections - 2 Column Grid on Desktop */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Your Library</h2>
        <p className="text-muted-foreground">Recent and popular albums</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        {sections.map((section) => {
          if (section.loader) {
            return (
              <div key={section.title} className="lg:col-span-1">
                <PreviewListFallback />
              </div>
            )
          }

          if (!section.data || !section.data?.list) return null

          return (
            <div key={section.title} className="lg:col-span-1">
              <PreviewList
                title={section.title}
                moreRoute={section.route}
                list={section.data.list}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
