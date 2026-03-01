import { Clock, Disc } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  HeaderFallback,
  PreviewListFallback,
} from '@/app/components/fallbacks/home-fallbacks'
import AlbumHeader from '@/app/components/home/carousel/album-header'
import { DiscoverWeeklyCard } from '@/app/components/home/discover-weekly-card'
import GenreDiscovery from '@/app/components/home/genre-discovery'
import PreviewList from '@/app/components/home/preview-list'
import { ThisIsArtist } from '@/app/components/home/this-is-artist'
import { useHomeDashboardData } from '@/app/hooks/use-home'
import { useRenderCounter } from '@/app/hooks/use-render-counter'
import { ROUTES } from '@/routes/routesList'
import { useAppStore } from '@/store/app.store'

export default function Home() {
  useRenderCounter('HomePage')
  const { t } = useTranslation()
  const showThisIsArtist = useAppStore(
    (state) => state.integrations.lastfm.showThisIsArtist,
  )

  const {
    similarArtists,
    recentlyPlayed,
    recentlyAdded,
    genres,
    isGenresLoading,
  } = useHomeDashboardData()

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto w-full max-w-[3400px] space-y-5 sm:space-y-6 xl:space-y-7">
        {showThisIsArtist ? (
          <section className="-mt-1 grid grid-cols-12 gap-4 min-[2100px]:gap-5">
            <div className="col-span-8 h-[424px] min-[1700px]:h-[468px] min-[2600px]:h-[520px]">
              {similarArtists.isFetching || similarArtists.isLoading ? (
                <HeaderFallback />
              ) : (
                <AlbumHeader albums={similarArtists.data?.list || []} />
              )}
            </div>

            <div className="col-span-4 grid h-[424px] grid-rows-2 gap-4 min-[1700px]:h-[468px] min-[2600px]:h-[520px] min-[2100px]:gap-5">
              <div className="h-full">
                <DiscoverWeeklyCard />
              </div>
              <div className="h-full">
                <ThisIsArtist />
              </div>
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
          <GenreDiscovery genres={genres} isLoading={isGenresLoading} />
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
