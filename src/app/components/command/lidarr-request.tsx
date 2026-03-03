import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CommandGroup, CommandItem } from '@/app/components/ui/command'
import { lidarr } from '@/service/lidarr'
import { useAppIntegrations } from '@/store/app.store'
import { CommandItemProps } from './command-menu'

interface CommandLidarrRequestProps extends CommandItemProps {
  searchQuery: string
}

export function CommandLidarrRequest({
  searchQuery,
  runCommand,
}: CommandLidarrRequestProps) {
  const { t } = useTranslation()
  const [isRequesting, setIsRequesting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
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
    setStatus('idle')

    try {
      await lidarr.addArtist(searchQuery.trim())
      setStatus('success')
      // Reset success status after 2 seconds
      setTimeout(() => setStatus('idle'), 2000)
    } catch (error) {
      setStatus('error')
      console.error('Lidarr request failed:', error)
      // Reset error status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setIsRequesting(false)
    }
  }

  const getDisplayText = () => {
    if (isRequesting) {
      return t('command.lidarr.requesting')
    }
    if (status === 'success') {
      return t('command.lidarr.success', { artist: searchQuery })
    }
    if (status === 'error') {
      return t('command.lidarr.error', { message: 'Connection failed' })
    }
    return t('command.lidarr.request', { artist: searchQuery })
  }

  return (
    <CommandGroup heading={t('command.lidarr.group')}>
      <CommandItem
        onSelect={() => runCommand(handleRequest)}
        disabled={isRequesting}
      >
        <Download className="mr-2 h-4 w-4" />
        <span className={status === 'error' ? 'text-red-500' : ''}>
          {getDisplayText()}
        </span>
      </CommandItem>
    </CommandGroup>
  )
}
