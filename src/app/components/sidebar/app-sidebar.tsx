import { HomeIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import CommandMenu from '@/app/components/command/command-menu'
import { Button } from '@/app/components/ui/button'
import {
  MainSidebar,
  MainSidebarContent,
  MainSidebarHeader,
  MainSidebarRail,
} from '@/app/components/ui/main-sidebar'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { SimpleTooltip } from '@/app/components/ui/simple-tooltip'
import { useRouteIsActive } from '@/app/hooks/use-route-is-active'
import { ROUTES } from '@/routes/routesList'
import { MiniSidebarSearch } from './mini-search'
import { SidebarMiniSeparator } from './mini-separator'
import { MobileCloseButton } from './mobile-close-button'
import { NavLibrary } from './nav-library'
import { NavPlaylists } from './nav-playlists'

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof MainSidebar>) {
  const { t } = useTranslation()
  const { isActive } = useRouteIsActive()

  return (
    <MainSidebar collapsible="icon" {...props}>
      <MobileCloseButton />
      <MainSidebarHeader className="border-b border-border/45 pb-3">
        <div className="flex items-center gap-2.5">
          <SimpleTooltip text={t('sidebar.home')} side="right" delay={50}>
            <Button
              asChild
              variant="outline"
              className={`h-10 w-10 p-0 rounded-lg hover:bg-background-foreground/80 ${isActive(ROUTES.LIBRARY.HOME) ? 'bg-accent/70' : ''}`}
            >
              <Link
                to={ROUTES.LIBRARY.HOME}
                className={
                  isActive(ROUTES.LIBRARY.HOME) ? 'pointer-events-none' : ''
                }
              >
                <HomeIcon className="h-5 w-5" />
              </Link>
            </Button>
          </SimpleTooltip>
          <CommandMenu compact />
        </div>
      </MainSidebarHeader>
      <MiniSidebarSearch />

      <MainSidebarContent className="overflow-hidden">
        <ScrollArea className="h-full">
          <SidebarMiniSeparator />
          <NavLibrary />
          <NavPlaylists />
        </ScrollArea>
      </MainSidebarContent>

      <MainSidebarRail />
    </MainSidebar>
  )
}
