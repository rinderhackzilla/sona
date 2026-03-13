import { FileText, Globe, Info, Music, Paintbrush } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { useAppSettings } from '@/store/app.store'
import type { SettingsPage } from '@/types/settings'
import { AboutPage } from './pages/about'
import { AppearancePage } from './pages/appearance'
import { ContentPage } from './pages/content'
import { PlayerPage } from './pages/player'
import { ServicesPage } from './pages/services'

const tabs = [
  { value: 'appearance', icon: Paintbrush, component: AppearancePage },
  { value: 'player', icon: Music, component: PlayerPage },
  { value: 'content', icon: FileText, component: ContentPage },
  { value: 'services', icon: Globe, component: ServicesPage },
  { value: 'about', icon: Info, component: AboutPage },
] as const
const settingsPages = tabs.map((tab) => tab.value) as SettingsPage[]

function isSettingsPage(value: string): value is SettingsPage {
  return settingsPages.includes(value as SettingsPage)
}

export function SettingsDialog() {
  const { t } = useTranslation()
  const { openDialog, setOpenDialog, currentPage, setCurrentPage } =
    useAppSettings()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      if (event.code !== 'Comma') return
      event.preventDefault()
      setOpenDialog(true)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpenDialog])

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent
        className="flex max-w-2xl flex-col overflow-hidden p-0"
        style={{ height: '580px', maxHeight: '85vh' }}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{t('settings.label')}</DialogTitle>

        <Tabs
          value={currentPage}
          onValueChange={(value) => {
            if (!isSettingsPage(value)) return
            setCurrentPage(value)
          }}
          className="flex flex-col h-full"
        >
          {/* Header: title row + tab bar, with right padding to clear the X button */}
          <div className="flex-shrink-0 border-b border-border/55 bg-card/35 backdrop-blur-sm">
            <div className="px-6 pb-2 pr-12 pt-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-base font-semibold text-foreground tracking-tight">
                  {t('settings.label')}
                </span>
              </div>
            </div>

            <TabsList className="h-auto w-full justify-start gap-1 rounded-none bg-transparent px-2 pb-2 pt-1">
              {tabs.map(({ value, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="
                    flex items-center gap-1.5 px-2.5 py-1.5
                    rounded-none bg-transparent shadow-none
                    border-b-2 border-transparent
                    text-muted-foreground text-sm font-medium
                    transition-colors
                    hover:text-foreground hover:bg-muted/45
                    data-[state=active]:border-primary
                    data-[state=active]:text-foreground
                    data-[state=active]:bg-transparent
                    data-[state=active]:shadow-none
                  "
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t(`settings.tabs.${value}`)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 sm:p-6">
              {tabs.map(({ value, component: Component }) => (
                <TabsContent key={value} value={value} className="mt-0">
                  <Component />
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
