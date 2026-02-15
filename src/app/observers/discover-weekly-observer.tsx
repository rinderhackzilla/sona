import { useEffect } from 'react'
import { checkAndCatchUp } from '@/service/discover-weekly-manager'
import { useAppIntegrations } from '@/store/app.store'
import { isDesktop } from '@/utils/desktop'

/**
 * Observer component that listens to Electron IPC events
 * for Discover Weekly scheduler notifications
 * 
 * Note: This observer only handles scheduled events from Electron Main Process.
 * It does NOT perform catch-up on mount (the hook handles that).
 */
export function DiscoverWeeklyObserver() {
  const { lastfm } = useAppIntegrations()

  useEffect(() => {
    // Only run in Electron desktop app
    if (!isDesktop()) return

    const handleScheduleEvent = async (_event: unknown, data: {
      event: 'check' | 'monday-trigger'
      timestamp: string
      weekKey: string
    }) => {
      console.log('[DiscoverWeekly Observer] Received event:', data.event, data.weekKey)

      // Check if Last.fm is configured
      if (!lastfm.username || !lastfm.apiKey) {
        console.log('[DiscoverWeekly Observer] Last.fm not configured, skipping')
        return
      }

      // Only handle 'monday-trigger' events, skip 'check' events
      // The hook handles catch-up on mount to avoid conflicts
      if (data.event === 'check') {
        console.log('[DiscoverWeekly Observer] Ignoring check event (hook handles catch-up)')
        return
      }

      try {
        const wasGenerated = await checkAndCatchUp({
          username: lastfm.username,
          apiKey: lastfm.apiKey,
          targetArtists: 15,
          songsPerArtist: 4,
        })

        if (wasGenerated) {
          console.log('[DiscoverWeekly Observer] ✓ Playlist generated successfully')
          
          // Optionally show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Discover Weekly', {
              body: 'Your personalized playlist has been updated!',
              icon: '/icon.png',
            })
          }
        } else {
          console.log('[DiscoverWeekly Observer] No generation needed')
        }
      } catch (error) {
        console.error('[DiscoverWeekly Observer] Generation failed:', error)
      }
    }

    // Register IPC listener
    const removeListener = window.electron?.ipcRenderer?.on(
      'discover-weekly:schedule-event',
      handleScheduleEvent
    )

    // Cleanup on unmount
    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [lastfm.username, lastfm.apiKey])

  // This is an observer component, it doesn't render anything
  return null
}
