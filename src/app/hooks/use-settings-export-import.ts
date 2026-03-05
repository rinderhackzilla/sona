import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import {
  useAppAccounts,
  useAppDesktopActions,
  useAppDesktopData,
  useAppIntegrations,
  useAppPages,
  useAppPodcasts,
} from '@/store/app.store'
import { PageViewType } from '@/types/serverConfig'

export function useSettingsExportImport() {
  const { t } = useTranslation()
  const pages = useAppPages()
  const accounts = useAppAccounts()
  const integrations = useAppIntegrations()
  const podcasts = useAppPodcasts()
  const desktopData = useAppDesktopData()
  const desktopActions = useAppDesktopActions()

  const exportSettings = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        pages: {
          showInfoPanel: pages.showInfoPanel,
          hideRadiosSection: pages.hideRadiosSection,
          artistsPageViewType: pages.artistsPageViewType,
          imagesCacheLayerEnabled: pages.imagesCacheLayerEnabled,
          autoPlaylistImport: pages.autoPlaylistImport,
        },
        accounts: {
          discord: { rpcEnabled: accounts.discord.rpcEnabled },
        },
        integrations: {
          lidarr: {
            url: integrations.lidarr.url,
            apiKey: integrations.lidarr.apiKey,
          },
          lastfm: {
            username: integrations.lastfm.username,
            apiKey: integrations.lastfm.apiKey,
            showThisIsArtist: integrations.lastfm.showThisIsArtist,
          },
        },
        podcasts: {
          active: podcasts.active,
          serviceUrl: podcasts.serviceUrl,
          useDefaultUser: podcasts.useDefaultUser,
          customUser: podcasts.customUser,
          customUrl: podcasts.customUrl,
        },
        desktop: {
          minimizeToTray: desktopData.minimizeToTray,
          disableGpu: desktopData.disableGpu,
        },
      },
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sona-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importSettings = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)

        if (!json?.settings || json.version !== 1) {
          toast.error(t('settings.io.toast.importError'))
          return
        }

        const { settings } = json

        if (settings.pages) {
          const p = settings.pages
          // toggleShowInfoPanel flips the value, so only call it if different
          if (
            typeof p.showInfoPanel === 'boolean' &&
            p.showInfoPanel !== pages.showInfoPanel
          ) {
            pages.toggleShowInfoPanel()
          }
          if (typeof p.hideRadiosSection === 'boolean') {
            pages.setHideRadiosSection(p.hideRadiosSection)
          }
          if (
            p.artistsPageViewType === 'grid' ||
            p.artistsPageViewType === 'table'
          ) {
            pages.setArtistsPageViewType(p.artistsPageViewType as PageViewType)
          }
          if (typeof p.imagesCacheLayerEnabled === 'boolean') {
            pages.setImagesCacheLayerEnabled(p.imagesCacheLayerEnabled)
          }
          if (typeof p.autoPlaylistImport === 'boolean') {
            pages.setAutoPlaylistImport(p.autoPlaylistImport)
          }
        }

        if (typeof settings.accounts?.discord?.rpcEnabled === 'boolean') {
          accounts.discord.setRpcEnabled(settings.accounts.discord.rpcEnabled)
        }

        if (settings.integrations?.lidarr) {
          const l = settings.integrations.lidarr
          if (typeof l.url === 'string') integrations.lidarr.setUrl(l.url)
          if (typeof l.apiKey === 'string')
            integrations.lidarr.setApiKey(l.apiKey)
        }

        if (settings.integrations?.lastfm) {
          const lf = settings.integrations.lastfm
          if (typeof lf.username === 'string')
            integrations.lastfm.setUsername(lf.username)
          if (typeof lf.apiKey === 'string')
            integrations.lastfm.setApiKey(lf.apiKey)
          if (typeof lf.showThisIsArtist === 'boolean') {
            integrations.lastfm.setShowThisIsArtist(lf.showThisIsArtist)
          }
        }

        if (settings.podcasts) {
          const pod = settings.podcasts
          if (typeof pod.active === 'boolean') podcasts.setActive(pod.active)
          if (typeof pod.serviceUrl === 'string')
            podcasts.setServiceUrl(pod.serviceUrl)
          if (typeof pod.useDefaultUser === 'boolean')
            podcasts.setUseDefaultUser(pod.useDefaultUser)
          if (typeof pod.customUser === 'string')
            podcasts.setCustomUser(pod.customUser)
          if (typeof pod.customUrl === 'string')
            podcasts.setCustomUrl(pod.customUrl)
        }

        if (typeof settings.desktop?.minimizeToTray === 'boolean') {
          desktopActions.setMinimizeToTray(settings.desktop.minimizeToTray)
        }
        if (typeof settings.desktop?.disableGpu === 'boolean') {
          desktopActions.setDisableGpu(settings.desktop.disableGpu)
        }

        toast.success(t('settings.io.toast.importSuccess'))
      } catch {
        toast.error(t('settings.io.toast.importError'))
      }
    }

    reader.readAsText(file)
  }

  return { exportSettings, importSettings }
}
