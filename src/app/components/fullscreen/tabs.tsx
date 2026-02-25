import { clsx } from 'clsx'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { LyricsTab } from './lyrics'
import { FullscreenSongQueue } from './queue'
import { SongInfo } from './song-info'

const MemoSongQueue = memo(FullscreenSongQueue)
const MemoSongInfo = memo(SongInfo)
const MemoLyricsTab = memo(LyricsTab)

enum TabsEnum {
  Queue = 'queue',
  Playing = 'playing',
  Lyrics = 'lyrics',
}

type TabValue = TabsEnum

const getTransform = (currentTab: TabValue, tabValue: TabValue) => {
  const positions = {
    queue: {
      queue: '0',
      playing: '-120%',
      lyrics: '-240%',
    },
    playing: {
      queue: '120%',
      playing: '0',
      lyrics: '-120%',
    },
    lyrics: {
      queue: '240%',
      playing: '120%',
      lyrics: '0',
    },
  }

  const translation = positions[tabValue][currentTab]
  return `translate3d(${translation}, 0, 0)`
}

const tabStyles =
  'absolute inset-0 mt-0 h-[calc(100%-64px)] overflow-y-auto transition-transform duration-300'
const playingTabStyles =
  'absolute inset-0 mt-0 h-[calc(100%-64px)] overflow-hidden transition-transform duration-300'

const triggerStyles =
  'w-full rounded-full text-foreground/78 data-[state=active]:text-foreground data-[state=active]:bg-primary/15 data-[state=active]:shadow-[0_6px_14px_hsl(var(--primary)/0.12)] hover:text-foreground transition-all duration-300'

interface FullscreenTabsProps {
  isChromeVisible: boolean
}

export function FullscreenTabs({ isChromeVisible }: FullscreenTabsProps) {
  const [tab, setTab] = useState<TabValue>(TabsEnum.Playing)
  const { t } = useTranslation()

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as TabValue)}
      className="w-full h-full min-h-full"
    >
      <TabsList
        className={clsx(
          'w-full mb-4 p-1 rounded-full border border-primary/15 bg-primary/10 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-all duration-300',
          !isChromeVisible && 'opacity-0 -translate-y-2 pointer-events-none',
        )}
      >
        <TabsTrigger value={TabsEnum.Queue} className={triggerStyles}>
          {t('fullscreen.queue')}
        </TabsTrigger>
        <TabsTrigger value={TabsEnum.Playing} className={triggerStyles}>
          {t('fullscreen.playing')}
        </TabsTrigger>
        <TabsTrigger value={TabsEnum.Lyrics} className={triggerStyles}>
          {t('fullscreen.lyrics')}
        </TabsTrigger>
      </TabsList>
      <div className="relative w-full h-full">
        <TabsContent
          value={TabsEnum.Queue}
          className={tabStyles}
          style={{
            backfaceVisibility: 'hidden',
            transform: getTransform(tab, TabsEnum.Queue),
          }}
          forceMount={true}
        >
          <MemoSongQueue />
        </TabsContent>
        <TabsContent
          value={TabsEnum.Playing}
          className={playingTabStyles}
          style={{
            backfaceVisibility: 'hidden',
            transform: getTransform(tab, TabsEnum.Playing),
          }}
          forceMount={true}
        >
          <MemoSongInfo isChromeVisible={isChromeVisible} />
        </TabsContent>
        <TabsContent
          value={TabsEnum.Lyrics}
          className={tabStyles}
          style={{
            backfaceVisibility: 'hidden',
            transform: getTransform(tab, TabsEnum.Lyrics),
          }}
          forceMount={true}
        >
          <MemoLyricsTab />
        </TabsContent>
      </div>
    </Tabs>
  )
}
