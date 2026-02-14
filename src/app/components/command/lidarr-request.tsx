import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CommandItemProps } from './command-menu'
import { CommandGroup } from './command-group'
import { CommandItem } from './command-item'
import { lidarr } from '@/service/lidarr'
import { useAppIntegrations } from '@/store/app.store'

interface CommandLidarrRequestProps extends CommandItemProps {
  searchQuery: string
}

export function CommandLidarrRequest({
  searchQuery,
  runCommand,
}: CommandLidarrRequestProps) {
  const { t } = useTranslation()
  const [isRequesting, setIsRequesting] = useState(false)
  const { lidarr: lidarrConfig } = useAppIntegrations((state) => state)

  // Don't show if Lidarr is not configured
  if (!lidarrConfig.url || !lidarrConfig.apiKey) {
    return null
  }

  // Don't show if search query is empty
  if (!searchQuery || searchQuery.trim().length === 0) {
    return null
  }

  const handleRequest = async () => {
    setIsRequesting(true)

    try {
      await lidarr.addArtist(searchQuery.trim())
      toast.success(t('command.lidarr.success', { artist: searchQuery }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(t('command.lidarr.error', { message }))
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <CommandGroup heading={t('command.lidarr.group')}>
      <CommandItem
        onSelect={() => runCommand(handleRequest)}
        disabled={isRequesting}
      >
        <Download className="mr-2 h-4 w-4" />
        <span>
          {isRequesting
            ? t('command.lidarr.requesting')
            : t('command.lidarr.request', { artist: searchQuery })}
        </span>
      </CommandItem>
    </CommandGroup>
  )
}
