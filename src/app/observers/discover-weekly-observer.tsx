import { useEffect } from 'react'
import { checkAndCatchUp } from '@/service/discover-weekly-manager'
import { useAppIntegrations } from '@/store/app.store'
import { usePlaylistDialog } from '@/app/context/playlist-dialog-context'
import { isDesktop } from '@/utils/desktop'
import { runWithRetry } from '@/utils/background-task-runner'

/**
 * Observer component that listens to Electron IPC events
 * for Discover Weekly scheduler notifications
 * 
 * Note: This observer only handles scheduled events from Electron Main Process.
 * It does NOT perform catch-up on mount (the hook handles that).
 */
export function DiscoverWeeklyObserver() {
  const { lastfm } = useAppIntegrations()
  const { showPlaylistSaved } = usePlaylistDialog()

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
        const wasGenerated = await runWithRetry(
          () =>
            checkAndCatchUp({
              username: lastfm.username,
              apiKey: lastfm.apiKey,
              targetArtists: 50,
              songsPerArtist: 1,
            }),
          {
            taskName: 'discover-weekly-catchup',
            policy: {
              retries: 2,
              baseDelayMs: 800,
              maxDelayMs: 6000,
            },
            onRetry: ({ attempt, delayMs }) => {
              console.warn(
                `[DiscoverWeekly Observer] Retry ${attempt} in ${delayMs}ms`,
              )
            },
          },
        )

        if (wasGenerated) {
          console.log('[DiscoverWeekly Observer] ✓ Playlist generated successfully')
          
          // Show modal instead of system notification
          showPlaylistSaved('Discover Weekly', 50)
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
  }, [lastfm.username, lastfm.apiKey, showPlaylistSaved])

  // This is an observer component, it doesn't render anything
  return null
}
