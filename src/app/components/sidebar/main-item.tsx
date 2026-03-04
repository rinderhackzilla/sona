import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MainSidebarMenuButton } from '@/app/components/ui/main-sidebar'
import { useRouteIsActive } from '@/app/hooks/use-route-is-active'
import { ISidebarItem, SidebarItems } from '@/app/layout/sidebar'
import { safeStorageSet } from '@/utils/safe-storage'

export function SidebarMainItem({ item }: { item: ISidebarItem }) {
  const { t } = useTranslation()
  const { isActive } = useRouteIsActive()

  return (
    <MainSidebarMenuButton
      asChild
      tooltip={t(item.title)}
      className={clsx(isActive(item.route) && 'bg-accent')}
    >
      <Link
        to={item.route}
        className={clsx(isActive(item.route) && 'pointer-events-none')}
        onClick={() => {
          if (item.id === SidebarItems.Albums) {
            safeStorageSet('albums_force_top_once', '1')
          }
        }}
      >
        <item.icon />
        <span>{t(item.title)}</span>
      </Link>
    </MainSidebarMenuButton>
  )
}
