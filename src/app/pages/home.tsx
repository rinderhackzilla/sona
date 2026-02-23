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
      <div className="mx-auto w-full max-w-[3400px] space-y-5 sm:space-y-6 xl:space-y-7">
        {showThisIsArtist ? (
          <section className="-mt-1 grid grid-cols-12 gap-4 min-[2300px]:gap-5">
            {/* Layout A: 1300-1599 -> Hero full width, cards 1:1 below */}
            {/* Layout B: 1600-2299 -> Hero left (row-span 2), cards stacked right */}
            {/* Layout C: 2300+ -> three columns in one row (6/3/3) */}
            <div className="col-span-12 h-[268px] min-[1600px]:col-span-8 min-[1600px]:row-span-2 min-[1600px]:h-[344px] min-[2300px]:col-span-6 min-[2300px]:row-span-1 min-[2300px]:h-[278px]">
              {similarArtists.isFetching || similarArtists.isLoading ? (
                <HeaderFallback />
              ) : (
                <AlbumHeader albums={similarArtists.data?.list || []} />
              )}
            </div>

            <div className="col-span-6 h-[214px] min-[1600px]:col-span-4 min-[1600px]:h-[164px] min-[2300px]:col-span-3 min-[2300px]:h-[278px]">
              <DiscoverWeeklyCard />
            </div>
            <div className="col-span-6 h-[214px] min-[1600px]:col-span-4 min-[1600px]:h-[164px] min-[2300px]:col-span-3 min-[2300px]:h-[278px]">
              <ThisIsArtist />
            </div>
          </section>
        ) : (
          <section>
            {similarArtists.isFetching || similarArtists.isLoading ? (
              <HeaderFallback />
            ) : (
              <AlbumHeader albums={similarArtists.data?.list || []} />
            )}
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
