import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle } from '@/app/components/ui/dialog'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { useAppSettings } from '@/store/app.store'
import { Paintbrush, Music, FileText, Globe } from 'lucide-react'
import { AppearancePage } from './pages/appearance'
import { PlayerPage } from './pages/player'
import { ContentPage } from './pages/content'
import { ServicesPage } from './pages/services'

const tabs = [
  { value: 'appearance', label: 'Appearance', icon: Paintbrush, component: AppearancePage },
  { value: 'player', label: 'Player', icon: Music, component: PlayerPage },
  { value: 'content', label: 'Content', icon: FileText, component: ContentPage },
  { value: 'services', label: 'Services', icon: Globe, component: ServicesPage },
] as const

export function SettingsDialog() {
  const { t } = useTranslation()
  const { openDialog, setOpenDialog, currentPage, setCurrentPage } = useAppSettings()

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent
        className="overflow-hidden p-0 h-[600px] max-h-[700px] max-w-3xl"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{t('settings.label')}</DialogTitle>
        
        <Tabs 
          value={currentPage} 
          onValueChange={(value) => setCurrentPage(value as any)}
          className="flex flex-col h-full"
        >
          <div className="border-b px-6 pt-6 pb-4">
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

          <ScrollArea className="flex-1 overflow-auto">
  <div className="p-6 pb-8">
              {tabs.map(({ value, component: Component }) => (
                <TabsContent key={value} value={value} className="mt-0">
                  <Component />
                </TabsContent>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
