import { Clock, Disc } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  HeaderFallback,
  PreviewListFallback,
} from '@/app/components/fallbacks/home-fallbacks'
import AlbumHeader from '@/app/components/home/carousel/album-header'
import PreviewList from '@/app/components/home/preview-list'
import GenreDiscovery from '@/app/components/home/genre-discovery'
import { DiscoverWeeklyCard } from '@/app/components/home/discover-weekly-card'
import { ThisIsArtist } from '@/app/components/home/this-is-artist'
import { useAppStore } from '@/store/app.store'
import {
  useGetRecentlyAdded,
  useGetRecentlyPlayed,
  useGetSimilarArtistsDiscovery,
} from '@/app/hooks/use-home'
import { ROUTES } from '@/routes/routesList'

export default function Home() {
  const { t } = useTranslation()
  const showThisIsArtist = useAppStore((state) => state.integrations.lastfm.showThisIsArtist)

  const similarArtists = useGetSimilarArtistsDiscovery()
  const recentlyPlayed = useGetRecentlyPlayed()
  const recentlyAdded = useGetRecentlyAdded()

  return (
    <div className="w-full px-4 sm:px-8 py-6">
      {/* Hero Carousel */}
      <div className="mb-6">
        {similarArtists.isFetching || similarArtists.isLoading ? (
          <HeaderFallback />
        ) : (
          <AlbumHeader albums={similarArtists.data?.list || []} />
        )}
      </div>

      {/* Discover Weekly + This Is Artist */}
      {showThisIsArtist && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="min-h-[220px] sm:min-h-[260px]">
              <DiscoverWeeklyCard />
            </div>
            <div className="min-h-[220px] sm:min-h-[260px]">
              <ThisIsArtist />
            </div>
          </div>
        </div>
      )}

      {/* Genre Discovery */}
      <GenreDiscovery />

      {/* Recently Played */}
      {recentlyPlayed.isLoading && <PreviewListFallback />}
      {recentlyPlayed.data?.list && (
        <PreviewList
          title={t('home.recentlyPlayed')}
          icon={<Clock className="w-6 h-6 text-muted-foreground" />}
          moreRoute={ROUTES.ALBUMS.RECENTLY_PLAYED}
          list={recentlyPlayed.data.list}
        />
      )}

      {/* Recently Added */}
      {recentlyAdded.isLoading && <PreviewListFallback />}
      {recentlyAdded.data?.list && (
        <PreviewList
          title={t('home.recentlyAdded')}
          icon={<Disc className="w-6 h-6 text-muted-foreground" />}
          moreRoute={ROUTES.ALBUMS.RECENTLY_ADDED}
          list={recentlyAdded.data.list}
        />
      )}
    </div>
  )
}
