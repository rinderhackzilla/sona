import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { useAppSettings } from '@/store/app.store'
import { Paintbrush, Music, FileText, Globe, Info } from 'lucide-react'
import { AppearancePage } from './pages/appearance'
import { PlayerPage } from './pages/player'
import { ContentPage } from './pages/content'
import { ServicesPage } from './pages/services'
import { AboutPage } from './pages/about'

const tabs = [
  { value: 'appearance', icon: Paintbrush, component: AppearancePage },
  { value: 'player', icon: Music, component: PlayerPage },
  { value: 'content', icon: FileText, component: ContentPage },
  { value: 'services', icon: Globe, component: ServicesPage },
  { value: 'about', icon: Info, component: AboutPage },
] as const

export function SettingsDialog() {
  const { t } = useTranslation()
  const { openDialog, setOpenDialog, currentPage, setCurrentPage } = useAppSettings()

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent
        className="overflow-hidden p-0 max-w-2xl flex flex-col"
        style={{ height: '580px', maxHeight: '85vh' }}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{t('settings.label')}</DialogTitle>

        <Tabs
          value={currentPage}
          onValueChange={(value) => setCurrentPage(value as any)}
          className="flex flex-col h-full"
        >
          {/* Header: title row + tab bar, with right padding to clear the X button */}
          <div className="flex-shrink-0 border-b bg-muted/20">
            <div className="px-6 pt-4 pb-1 pr-12">
              <span className="text-base font-semibold text-foreground tracking-tight">
                {t('settings.label')}
              </span>
            </div>

            <TabsList className="flex w-full bg-transparent rounded-none h-auto p-0 px-2 gap-0 justify-start">
              {tabs.map(({ value, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="
                    flex items-center gap-2 px-4 py-2.5
                    rounded-none bg-transparent shadow-none
                    border-b-2 border-transparent
                    text-muted-foreground text-sm font-medium
                    transition-colors
                    hover:text-foreground hover:bg-muted/40
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
            <div className="p-6">
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
