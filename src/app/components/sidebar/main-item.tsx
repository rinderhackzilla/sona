import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MainSidebarMenuButton } from '@/app/components/ui/main-sidebar'
import { useRouteIsActive } from '@/app/hooks/use-route-is-active'
import { ISidebarItem, SidebarItems } from '@/app/layout/sidebar'
import { safeStorageSet } from '@/utils/safe-storage'

export function SidebarMainItem({ item }: { item: ISidebarItem }) {
  const { t } = useTranslation()
  const { isActive, isExactActive } = useRouteIsActive()
  const isItemActive = isActive(item.route)
  const isItemExactActive = isExactActive(item.route)

  return (
    <MainSidebarMenuButton
      asChild
      isActive={isItemActive}
      tooltip={t(item.title)}
    >
      <Link
        to={item.route}
        className={clsx(isItemExactActive && 'pointer-events-none')}
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
