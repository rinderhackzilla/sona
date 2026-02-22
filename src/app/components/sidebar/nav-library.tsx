import { useTranslation } from 'react-i18next'
import {
  MainSidebarGroup,
  MainSidebarGroupLabel,
  MainSidebarMenu,
  MainSidebarMenuItem,
} from '@/app/components/ui/main-sidebar'
import { libraryItems, SidebarItems } from '@/app/layout/sidebar'
import { useAppStore } from '@/store/app.store'
import { SidebarMainItem } from './main-item'
import { SidebarPodcastItem } from './podcast-item'

const discoverItems = libraryItems.filter(
  (item) =>
    item.id === SidebarItems.DiscoverWeekly ||
    item.id === SidebarItems.Top50Year ||
    item.id === SidebarItems.Favorites,
)

const browseItems = libraryItems.filter(
  (item) =>
    item.id !== SidebarItems.DiscoverWeekly &&
    item.id !== SidebarItems.Top50Year &&
    item.id !== SidebarItems.Favorites,
)

export function NavLibrary() {
  const { t } = useTranslation()
  const hideRadiosSection = useAppStore().pages.hideRadiosSection
  const isPodcastsActive = useAppStore().podcasts.active

  return (
    <>
      {/* Curated section */}
      <MainSidebarGroup className="px-4 pt-2 pb-0">
        <div className="mb-1.5 flex items-center gap-2 px-1">
          <MainSidebarGroupLabel className="h-6 px-0 text-[10px] uppercase tracking-[0.14em] text-foreground/55">
            {t('home.explore')}
          </MainSidebarGroupLabel>
          <div className="h-px flex-1 bg-border/55" />
        </div>
        <MainSidebarMenu>
          {discoverItems.map((item) => (
            <MainSidebarMenuItem key={item.id}>
              <SidebarMainItem item={item} />
            </MainSidebarMenuItem>
          ))}
        </MainSidebarMenu>
      </MainSidebarGroup>

      {/* Standard library section */}
      <MainSidebarGroup className="px-4 pt-2 pb-0">
        <div className="mb-1.5 flex items-center gap-2 px-1">
          <MainSidebarGroupLabel className="h-6 px-0 text-[10px] uppercase tracking-[0.14em] text-foreground/55">
            {t('sidebar.library')}
          </MainSidebarGroupLabel>
          <div className="h-px flex-1 bg-border/55" />
        </div>
        <MainSidebarMenu>
          {browseItems.map((item) => {
            if (hideRadiosSection && item.id === SidebarItems.Radios) return null
            if (!isPodcastsActive && item.id === SidebarItems.Podcasts) return null

            if (item.id === SidebarItems.Podcasts) {
              return <SidebarPodcastItem key={item.id} item={item} />
            }

            return (
              <MainSidebarMenuItem key={item.id}>
                <SidebarMainItem item={item} />
              </MainSidebarMenuItem>
            )
          })}
        </MainSidebarMenu>
      </MainSidebarGroup>
    </>
  )
}
