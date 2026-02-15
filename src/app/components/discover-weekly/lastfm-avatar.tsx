import { useState, useEffect } from 'react'
import { User } from 'lucide-react'

interface LastfmAvatarProps {
  username: string
  apiKey: string
  size?: number
}

interface LastfmUserInfo {
  image: Array<{ '#text': string; size: string }>
}

export function LastfmAvatar({ username, apiKey, size = 256 }: LastfmAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${apiKey}&format=json`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch user info')
        }

        const data = await response.json()
        const userInfo: LastfmUserInfo = data.user
        
        // Get largest image (usually 'extralarge' or 'large')
        const images = userInfo.image
        const largeImage = images.find(img => img.size === 'extralarge') || 
                          images.find(img => img.size === 'large') ||
                          images[images.length - 1]
        
        if (largeImage?.['#text']) {
          setAvatarUrl(largeImage['#text'])
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Failed to fetch Last.fm avatar:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (username && apiKey) {
      fetchUserInfo()
    }
  }, [username, apiKey])

  if (loading) {
    return (
      <div 
        className="w-full h-full bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-lg flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div className="animate-pulse">
          <User className="w-1/3 h-1/3 text-white/50" />
        </div>
      </div>
    )
  }

  if (error || !avatarUrl) {
    return (
      <div 
        className="w-full h-full bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-lg flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <User className="w-1/3 h-1/3 text-white/70" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <img
        src={avatarUrl}
        alt={`${username}'s Last.fm avatar`}
        className="w-full h-full object-cover"
        style={{ width: size, height: size }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-indigo-600/25 to-blue-600/30" />
      {/* Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 80%)'
        }}
      />
    </div>
  )
}
