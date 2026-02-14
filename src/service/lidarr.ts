import { useAppStore } from '@/store/app.store'

export interface LidarrArtistSearchResult {
  artistName: string
  foreignArtistId: string
  overview?: string
  images?: Array<{
    url: string
    coverType: string
  }>
}

export interface LidarrArtistAddRequest {
  artistName: string
  foreignArtistId: string
  qualityProfileId: number
  metadataProfileId: number
  rootFolderPath: string
  monitored: boolean
  searchForMissingAlbums: boolean
  addOptions?: {
    searchForMissingAlbums: boolean
  }
}

class LidarrService {
  private getConfig() {
    const state = useAppStore.getState()
    return {
      url: state.integrations.lidarr.url,
      apiKey: state.integrations.lidarr.apiKey,
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const { url, apiKey } = this.getConfig()

    if (!url || !apiKey) {
      throw new Error('Lidarr URL and API Key must be configured')
    }

    const response = await fetch(`${url}/api/v1/${endpoint}`, {
      ...options,
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Lidarr API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async searchArtist(term: string): Promise<LidarrArtistSearchResult[]> {
    return this.request<LidarrArtistSearchResult[]>(
      `search?term=${encodeURIComponent(term)}`,
    )
  }

  async addArtist(artistName: string): Promise<void> {
    // First search for the artist
    const searchResults = await this.searchArtist(artistName)
    
    console.log('🔍 Lidarr Search Results:', searchResults)

    if (searchResults.length === 0) {
      throw new Error(`Artist "${artistName}" not found in MusicBrainz`)
    }

    const artist = searchResults[0]
    console.log('🎵 Selected Artist:', artist)

    // Get quality profiles and root folders
    const [qualityProfiles, rootFolders] = await Promise.all([
      this.request<Array<{ id: number }>>('qualityprofile'),
      this.request<Array<{ path: string }>>('rootfolder'),
    ])
    
    console.log('⚙️ Quality Profiles:', qualityProfiles)
    console.log('📁 Root Folders:', rootFolders)

    if (qualityProfiles.length === 0 || rootFolders.length === 0) {
      throw new Error('No quality profiles or root folders configured in Lidarr')
    }

    const addRequest: LidarrArtistAddRequest = {
      artistName: artist.artistName,
      foreignArtistId: artist.foreignArtistId,
      qualityProfileId: qualityProfiles[0].id,
      metadataProfileId: 1, // Default metadata profile
      rootFolderPath: rootFolders[0].path,
      monitored: true,
      searchForMissingAlbums: true,
      addOptions: {
        searchForMissingAlbums: true,
      },
    }
    
    console.log('📤 Sending Add Request:', addRequest)

    await this.request('artist', {
      method: 'POST',
      body: JSON.stringify(addRequest),
    })
  }

  async checkConfig(): Promise<boolean> {
    try {
      const { url, apiKey } = this.getConfig()
      if (!url || !apiKey) return false

      await this.request('system/status')
      return true
    } catch {
      return false
    }
  }
}

export const lidarr = new LidarrService()
