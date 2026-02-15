import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { ExternalLink, Save, Check } from 'lucide-react'

const STORAGE_KEY = 'lastfm_config'

interface LastFmConfig {
  username: string
  apiKey: string
}

export function Integrations() {
  const [username, setUsername] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  // Load existing config
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const config: LastFmConfig = JSON.parse(stored)
        setUsername(config.username || '')
        setApiKey(config.apiKey || '')
      }
    } catch (error) {
      console.error('Failed to load Last.fm config:', error)
    }
  }, [])

  const handleSave = () => {
    const config: LastFmConfig = {
      username,
      apiKey,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const isValid = username.trim() !== '' && apiKey.trim() !== ''

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
            Connect your Last.fm account to enable personalized music recommendations
            and Discover Weekly playlists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lastfm-username">Username</Label>
            <Input
              id="lastfm-username"
              placeholder="Your Last.fm username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastfm-apikey">API Key</Label>
            <Input
              id="lastfm-apikey"
              type="password"
              placeholder="Your Last.fm API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
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

          <Button
            onClick={handleSave}
            disabled={!isValid || saved}
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
