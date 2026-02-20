import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { ExternalLink, Save, Check } from 'lucide-react'
import { useAppStore } from '@/store/app.store'

const STORAGE_KEY = 'lastfm_config' // For migration only

export function Integrations() {
  const lastfmConfig = useAppStore((state) => state.integrations.lastfm)
  const [localUsername, setLocalUsername] = useState(lastfmConfig.username)
  const [localApiKey, setLocalApiKey] = useState(lastfmConfig.apiKey)
  const [saved, setSaved] = useState(false)

  // One-time migration from localStorage to Zustand
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && !lastfmConfig.username && !lastfmConfig.apiKey) {
        const config = JSON.parse(stored)
        if (config.username || config.apiKey) {
          lastfmConfig.setUsername(config.username || '')
          lastfmConfig.setApiKey(config.apiKey || '')
          setLocalUsername(config.username || '')
          setLocalApiKey(config.apiKey || '')
          console.log('[Integrations] Migrated Last.fm config from localStorage to Zustand')
          // Remove old localStorage key after migration
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to migrate Last.fm config:', error)
    }
  }, [lastfmConfig.apiKey, lastfmConfig.setApiKey, lastfmConfig.setUsername, lastfmConfig.username])

  // Sync local state with store
  useEffect(() => {
    setLocalUsername(lastfmConfig.username)
    setLocalApiKey(lastfmConfig.apiKey)
  }, [lastfmConfig.username, lastfmConfig.apiKey])

  const handleSave = () => {
    lastfmConfig.setUsername(localUsername.trim())
    lastfmConfig.setApiKey(localApiKey.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const isValid = localUsername.trim() !== '' && localApiKey.trim() !== ''
  const hasChanges = 
    localUsername !== lastfmConfig.username || 
    localApiKey !== lastfmConfig.apiKey

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-muted-foreground mt-1">
          Connect external services to enhance your experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last.fm</CardTitle>
          <CardDescription>
            Connect your Last.fm account to enable personalized music recommendations,
            Discover Weekly playlists, and the daily "This is [Artist]" feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lastfm-username">Username</Label>
            <Input
              id="lastfm-username"
              placeholder="Your Last.fm username"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastfm-apikey">API Key</Label>
            <Input
              id="lastfm-apikey"
              type="password"
              placeholder="Your Last.fm API key"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://www.last.fm/api/account/create"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Last.fm API
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          <div className="flex items-center justify-between py-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="show-this-is-artist" className="text-base">
                Show "This is [Artist]" on Homepage
              </Label>
              <p className="text-sm text-muted-foreground">
                Display a daily playlist featuring a random artist's top tracks.
                Requires Last.fm API key.
              </p>
            </div>
            <Switch
              id="show-this-is-artist"
              checked={lastfmConfig.showThisIsArtist}
              onCheckedChange={lastfmConfig.setShowThisIsArtist}
              disabled={!isValid}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!isValid || !hasChanges || saved}
            className="w-full sm:w-auto"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
