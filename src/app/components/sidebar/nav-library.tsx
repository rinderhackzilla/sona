import { useTranslation } from 'react-i18next'
import {
  MainSidebarGroup,
  MainSidebarGroupLabel,
  MainSidebarMenu,
  MainSidebarMenuItem,
} from '@/app/components/ui/main-sidebar'
import { Separator } from '@/app/components/ui/separator'
import { libraryItems, SidebarItems } from '@/app/layout/sidebar'
import { useAppStore } from '@/store/app.store'
import { SidebarMainItem } from './main-item'
import { SidebarPodcastItem } from './podcast-item'

// First 2 items are curated (Discover Weekly, Your Top 50); rest is the standard library
const discoverItems = libraryItems.slice(0, 2)
const browseItems = libraryItems.slice(2)

export function NavLibrary() {
  const { t } = useTranslation()
  const hideRadiosSection = useAppStore().pages.hideRadiosSection
  const isPodcastsActive = useAppStore().podcasts.active

  return (
    <>
      {/* Curated section — no label */}
      <MainSidebarGroup className="px-4 pt-1 pb-0">
        <MainSidebarMenu>
          {discoverItems.map((item) => (
            <MainSidebarMenuItem key={item.id}>
              <SidebarMainItem item={item} />
            </MainSidebarMenuItem>
          ))}
        </MainSidebarMenu>
      </MainSidebarGroup>

      {/* Separator — fades out in icon mode */}
      <div className="px-6 py-1 transition-opacity group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
        <Separator />
      </div>

      {/* Standard library section */}
      <MainSidebarGroup className="px-4 py-0">
        <MainSidebarGroupLabel>{t('sidebar.library')}</MainSidebarGroupLabel>
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
