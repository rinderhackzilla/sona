import { useQuery } from '@tanstack/react-query'
import { SearchIcon } from 'lucide-react'
import { KeyboardEvent, useCallback, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTranslation } from 'react-i18next'
import { useDebouncedCallback } from 'use-debounce'
import { Keyboard } from '@/app/components/command/keyboard-key'
import { Button } from '@/app/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/app/components/ui/command'
import { useMainSidebar } from '@/app/components/ui/main-sidebar'
import { subsonic } from '@/service/subsonic'
import { useAppStore } from '@/store/app.store'
import { ISimilarArtist } from '@/types/responses/artist'
import { byteLength } from '@/utils/byteLength'
import { convertMinutesToMs } from '@/utils/convertSecondsToTime'
import { queryKeys } from '@/utils/queryKeys'
import { CommandAlbumResult } from './album-result'
import { CommandArtistResult } from './artist-result'
import { CommandSongResult } from './song-result'

export type CommandItemProps = {
  runCommand: (command: () => unknown) => void
}

type CommandMenuProps = {
  compact?: boolean
}

export default function CommandMenu({ compact = false }: CommandMenuProps) {
  const { t } = useTranslation()
  const { state: sidebarState } = useMainSidebar()
  const { open, setOpen } = useAppStore((state) => state.command)

  const [inputValue, setInputValue] = useState('')
  const [query, setQuery] = useState('')
  const enableQuery = Boolean(byteLength(query) >= 2)
  const hasInput = Boolean(inputValue.trim().length > 0)

  const { data: searchResult } = useQuery({
    queryKey: [queryKeys.search, query],
    queryFn: () =>
      subsonic.search.get({
        query,
        albumCount: 5,
        artistCount: 5,
        songCount: 5,
      }),
    enabled: enableQuery,
    staleTime: convertMinutesToMs(5),
  })

  const { data: artistOnlyResult } = useQuery({
    queryKey: [queryKeys.search, 'artists-only', query],
    queryFn: () =>
      subsonic.search.get({
        query,
        albumCount: 0,
        songCount: 0,
        artistCount: 5,
      }),
    enabled: enableQuery,
    staleTime: convertMinutesToMs(5),
  })

  const albums = (searchResult?.album ?? []).slice(0, 5)
  const artists = mergeArtists(searchResult?.artist, artistOnlyResult?.artist)
    .slice(0, 5)
  const songs = (searchResult?.song ?? []).slice(0, 5)

  const showAlbumGroup = Boolean(query && albums.length > 0)
  const showArtistGroup = Boolean(query && artists.length > 0)
  const showSongGroup = Boolean(query && songs.length > 0)

  useHotkeys(['/', 'mod+f', 'mod+k'], () => setOpen(!open), {
    preventDefault: true,
  })

  const clear = useCallback(() => {
    setInputValue('')
    setQuery('')
  }, [])

  const runCommand = useCallback(
    (command: () => unknown) => {
      setOpen(false)
      clear()
      command()
    },
    [clear, setOpen],
  )

  const debounced = useDebouncedCallback((value: string) => {
    setQuery(value)
  }, 500)

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === '/') {
      event.preventDefault()
    }
  }

  function handleSearchChange(value: string) {
    setInputValue(value)
    debounced(value)
  }

  const sidebarOpen = sidebarState === 'expanded'

  return (
    <>
      {sidebarOpen && (
        <Button
          variant="outline"
          className={
            compact
              ? 'h-10 w-10 p-0 flex items-center justify-center rounded-lg active:scale-[98%] transition hover:bg-background-foreground/80'
              : 'flex justify-start w-full px-2 gap-2 relative min-w-max active:scale-[98%] transition hover:bg-background-foreground/80'
          }
          onClick={() => setOpen(true)}
        >
          <SearchIcon
            className={
              compact
                ? 'h-5 w-5 text-muted-foreground'
                : 'h-4 w-4 text-muted-foreground'
            }
          />
          {!compact && (
            <>
              <span className="inline-flex text-muted-foreground text-sm">
                {t('sidebar.search')}
              </span>
              <div className="absolute right-2">
                <Keyboard text="/" />
              </div>
            </>
          )}
        </Button>
      )}
      <CommandDialog
        contentClassName={
          hasInput
            ? 'top-[36%] translate-y-[-36%] h-[70vh] max-h-[70vh]'
            : 'top-[24%] translate-y-[-24%] h-auto max-h-none'
        }
        open={open}
        onOpenChange={(state) => {
          setOpen(state)
          if (!state) clear()
        }}
      >
        <Command
          shouldFilter={false}
          id="main-command"
          className={hasInput ? 'h-full max-h-full' : 'h-auto'}
        >
          <CommandInput
            data-testid="command-menu-input"
            placeholder={t('command.inputPlaceholder')}
            className="h-12 text-[15px]"
            autoCorrect="false"
            autoCapitalize="false"
            spellCheck="false"
            onValueChange={(value) => handleSearchChange(value)}
            onKeyDown={handleInputKeyDown}
          />
          {hasInput && (
            <CommandList>
              {!enableQuery && (
                <div className="mx-3 mt-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {t('command.typeMore')}
                </div>
              )}

              {enableQuery && showArtistGroup && (
                <CommandArtistResult artists={artists} runCommand={runCommand} />
              )}

              {enableQuery && showAlbumGroup && (
                <CommandAlbumResult
                  query={query}
                  albums={albums}
                  runCommand={runCommand}
                />
              )}

              {enableQuery && showSongGroup && (
                <CommandSongResult
                  query={query}
                  songs={songs}
                  runCommand={runCommand}
                />
              )}

              {enableQuery && (
                <CommandEmpty>{t('command.noResults')}</CommandEmpty>
              )}
            </CommandList>
          )}
        </Command>
      </CommandDialog>
    </>
  )
}

function mergeArtists(
  primary?: ISimilarArtist[],
  fallback?: ISimilarArtist[],
) {
  const merged = [...(primary ?? []), ...(fallback ?? [])]
  const byId = new Map<string, ISimilarArtist>()
  const byName = new Map<string, ISimilarArtist>()

  for (const artist of merged) {
    if (!artist?.name) continue

    if (artist.id) {
      if (!byId.has(artist.id)) byId.set(artist.id, artist)
      continue
    }

    const key = artist.name.trim().toLowerCase()
    if (!key) continue
    if (!byName.has(key)) byName.set(key, artist)
  }

  return [...byId.values(), ...byName.values()]
}
