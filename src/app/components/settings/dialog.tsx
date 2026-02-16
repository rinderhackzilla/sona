import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { useAppSettings } from '@/store/app.store'
import { Paintbrush, Music, FileText, Globe } from 'lucide-react'
import { AppearancePage } from './pages/appearance'
import { PlayerPage } from './pages/player'
import { ContentPage } from './pages/content'
import { ServicesPage } from './pages/services'
import { getAppInfo } from '@/utils/appName'

const tabs = [
  { value: 'appearance', label: 'Appearance', icon: Paintbrush, component: AppearancePage },
  { value: 'player', label: 'Player', icon: Music, component: PlayerPage },
  { value: 'content', label: 'Content', icon: FileText, component: ContentPage },
  { value: 'services', label: 'Services', icon: Globe, component: ServicesPage },
] as const

export function SettingsDialog() {
  const { t } = useTranslation()
  const { openDialog, setOpenDialog, currentPage, setCurrentPage } = useAppSettings()
  const { version } = getAppInfo()

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent
        className="overflow-hidden p-0 max-w-3xl flex flex-col"
        style={{ height: '600px', maxHeight: '85vh' }}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{t('settings.label')}</DialogTitle>
        
        <Tabs 
          value={currentPage} 
          onValueChange={(value) => setCurrentPage(value as any)}
          className="flex flex-col h-full"
        >
          <div className="border-b px-6 pt-6 pb-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4 h-auto gap-2">
              {tabs.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary/10"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {tabs.map(({ value, component: Component }) => (
                <TabsContent key={value} value={value} className="mt-0">
                  <Component />
                </TabsContent>
              ))}
            </div>
          </div>

          <div className="border-t px-6 py-3 bg-background-foreground flex-shrink-0">
            <p className="text-xs text-muted-foreground text-center">
              Sona v{version}
            </p>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
