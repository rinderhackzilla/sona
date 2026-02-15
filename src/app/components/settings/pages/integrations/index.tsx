import { LastFM } from './lastfm'
import { Lidarr } from './lidarr'

export function Integrations() {
  return (
    <div className="space-y-4">
      <LastFM />
      <Lidarr />
    </div>
  )
}
