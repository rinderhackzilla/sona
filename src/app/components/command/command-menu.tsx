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

  const [query, setQuery] = useState('')
  const enableQuery = Boolean(byteLength(query) >= 2)

  const { data: searchResult } = useQuery({
    queryKey: [queryKeys.search, query],
    queryFn: () =>
      subsonic.search.get({
        query,
        albumCount: 4,
        artistCount: 4,
        songCount: 4,
      }),
    enabled: enableQuery,
    staleTime: convertMinutesToMs(5),
  })

  const albums = searchResult?.album ?? []
  const artists = searchResult?.artist ?? []
  const songs = searchResult?.song ?? []

  const showAlbumGroup = Boolean(query && albums.length > 0)
  const showArtistGroup = Boolean(query && artists.length > 0)
  const showSongGroup = Boolean(query && songs.length > 0)

  useHotkeys(['/', 'mod+f', 'mod+k'], () => setOpen(!open), {
    preventDefault: true,
  })

  const clear = useCallback(() => {
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
    debounced(value)
  }

  const showNotFoundMessage = Boolean(
    enableQuery && !showAlbumGroup && !showArtistGroup && !showSongGroup,
  )

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
        open={open}
        onOpenChange={(state) => {
          setOpen(state)
          if (!state) clear()
        }}
      >
        <Command
          shouldFilter={false}
          id="main-command"
          className="h-full max-h-full"
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
          <CommandList className="pr-1">
            <CommandEmpty>{t('command.noResults')}</CommandEmpty>

            {showNotFoundMessage && (
              <div className="flex justify-center items-center p-4 mt-2 mx-2 bg-accent/40 rounded border border-border">
                <p className="text-sm">{t('command.noResults')}</p>
              </div>
            )}

            {showAlbumGroup && (
              <CommandAlbumResult
                query={query}
                albums={albums}
                runCommand={runCommand}
              />
            )}

            {showSongGroup && (
              <CommandSongResult
                query={query}
                songs={songs}
                runCommand={runCommand}
              />
            )}

            {showArtistGroup && (
              <CommandArtistResult artists={artists} runCommand={runCommand} />
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
