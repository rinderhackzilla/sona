import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Globe, PlayIcon, PlusIcon, RadioIcon, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShadowHeader } from '@/app/components/album/shadow-header'
import { EmptyWrapper } from '@/app/components/albums/empty-wrapper'
import { SongListFallback } from '@/app/components/fallbacks/song-fallbacks'
import { HeaderTitle } from '@/app/components/header-title'
import { EqualizerBars } from '@/app/components/icons/equalizer-bars'
import ListWrapper from '@/app/components/list-wrapper'
import { RadioActionButton } from '@/app/components/radios/action-button'
import { EmptyRadiosInfo } from '@/app/components/radios/empty-message'
import { RadioFormDialog } from '@/app/components/radios/form-dialog'
import { RemoveRadioDialog } from '@/app/components/radios/remove-dialog'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { PageState } from '@/app/components/ui/page-state'
import { subsonic } from '@/service/subsonic'
import {
  usePlayerActions,
  usePlayerIsPlaying,
  usePlayerMediaType,
  usePlayerSonglist,
} from '@/store/player.store'
import { useRadios } from '@/store/radios.store'
import { Radio } from '@/types/responses/radios'
import { queryKeys } from '@/utils/queryKeys'

export default function Radios() {
  const { setDialogState, setData } = useRadios()
  const { t } = useTranslation()
  const { setPlayRadio } = usePlayerActions()
  const { isRadio } = usePlayerMediaType()
  const isPlaying = usePlayerIsPlaying()
  const { radioList, currentSongIndex } = usePlayerSonglist()
  const [search, setSearch] = useState('')

  const {
    data: radios,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [queryKeys.radio.all],
    queryFn: subsonic.radios.getAll,
  })

  function handleAddRadio() {
    setData({} as Radio)
    setDialogState(true)
  }

  const filteredRadios = useMemo(() => {
    const list = radios ?? []
    const query = search.trim().toLowerCase()
    if (!query) return list

    return list.filter((radio) => {
      const host = getHostLabel(radio.homePageUrl || radio.streamUrl)
      return (
        radio.name.toLowerCase().includes(query) ||
        host.toLowerCase().includes(query)
      )
    })
  }, [radios, search])

  if (isLoading) return <SongListFallback />
  if (isError) {
    return (
      <PageState
        variant="error"
        title={t('states.error.title')}
        description={t('states.error.description', {
          status: 500,
          detail: t('generic.error'),
        })}
        actionLabel={t('states.error.retry')}
        onAction={() => {
          refetch().catch(() => undefined)
        }}
      />
    )
  }

  const showGrid = filteredRadios.length > 0

  return (
    <div className={clsx('w-full', showGrid ? 'h-full' : 'h-empty-content')}>
      <ShadowHeader>
        <div className="w-full flex items-center justify-between gap-3">
          <HeaderTitle
            title={t('sidebar.radios')}
            count={radios?.length ?? 0}
          />

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('sidebar.search')}
                className="pl-9 h-9"
              />
            </div>
            <Button
              size="sm"
              variant="default"
              className="h-9 px-3.5"
              onClick={handleAddRadio}
            >
              <PlusIcon className="w-5 h-5 -ml-[3px]" />
              <span className="ml-2">{t('radios.addRadio')}</span>
            </Button>
          </div>
        </div>
      </ShadowHeader>

      {showGrid && (
        <ListWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-2">
            {filteredRadios.map((radio) => {
              const sourceLabel = getHostLabel(
                radio.homePageUrl || radio.streamUrl,
              )
              const radioIndex =
                radios?.findIndex((item) => item.id === radio.id) ?? -1
              const isActive =
                isRadio &&
                isPlaying &&
                radioList[currentSongIndex]?.id === radio.id

              return (
                <div
                  key={radio.id}
                  className={clsx(
                    'group relative rounded-xl border bg-card/70 backdrop-blur-sm p-4 transition-colors',
                    isActive
                      ? 'border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.45)]'
                      : 'border-border/60 hover:border-primary/35',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-lg border flex items-center justify-center shrink-0',
                          isActive
                            ? 'bg-primary/15 border-primary/50 text-primary'
                            : 'bg-muted/40 border-border/60 text-foreground/80',
                        )}
                      >
                        <RadioIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{radio.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sourceLabel}
                        </p>
                      </div>
                    </div>
                    <RadioActionButton row={radio} />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => {
                        if (!radios || radioIndex < 0) return
                        setPlayRadio(radios, radioIndex)
                      }}
                    >
                      {isActive ? (
                        <EqualizerBars size={14} className="mr-1.5" />
                      ) : (
                        <PlayIcon className="w-4 h-4 mr-1.5 fill-current" />
                      )}
                      {isActive ? t('options.playing') : t('options.play')}
                    </Button>
                    {!!radio.homePageUrl && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={radio.homePageUrl}
                          target="_blank"
                          rel="nofollow noreferrer"
                          aria-label={t('radios.table.homepage')}
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ListWrapper>
      )}

      {!showGrid && (
        <ListWrapper className="h-full">
          <EmptyWrapper>
            <EmptyRadiosInfo />
          </EmptyWrapper>
        </ListWrapper>
      )}

      <RadioFormDialog />
      <RemoveRadioDialog />
    </div>
  )
}

function getHostLabel(urlLike: string) {
  try {
    const parsed = new URL(urlLike)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
