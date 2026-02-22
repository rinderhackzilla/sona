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
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1520px] space-y-5 sm:space-y-6 xl:space-y-7">
        {/* Hero Carousel */}
        <section>
          {similarArtists.isFetching || similarArtists.isLoading ? (
            <HeaderFallback />
          ) : (
            <AlbumHeader albums={similarArtists.data?.list || []} />
          )}
        </section>

        {/* Discover Weekly + This Is Artist */}
        {showThisIsArtist && (
          <section className="grid grid-cols-1 gap-3.5 md:grid-cols-12 md:gap-4">
            <div className="md:col-span-7 min-h-[220px] sm:min-h-[246px]">
              <DiscoverWeeklyCard />
            </div>
            <div className="md:col-span-5 min-h-[220px] sm:min-h-[246px]">
              <ThisIsArtist />
            </div>
          </section>
        )}

        {/* Genre Discovery */}
        <section>
          <GenreDiscovery />
        </section>

        {/* Recently Played */}
        <section>
          {recentlyPlayed.isLoading && <PreviewListFallback />}
          {recentlyPlayed.data?.list && (
            <PreviewList
              title={t('home.recentlyPlayed')}
              icon={<Clock className="h-5 w-5 text-muted-foreground" />}
              moreRoute={ROUTES.ALBUMS.RECENTLY_PLAYED}
              list={recentlyPlayed.data.list}
            />
          )}
        </section>

        {/* Recently Added */}
        <section>
          {recentlyAdded.isLoading && <PreviewListFallback />}
          {recentlyAdded.data?.list && (
            <PreviewList
              title={t('home.recentlyAdded')}
              icon={<Disc className="h-5 w-5 text-muted-foreground" />}
              moreRoute={ROUTES.ALBUMS.RECENTLY_ADDED}
              list={recentlyAdded.data.list}
            />
          )}
        </section>
      </div>
    </div>
  )
}
