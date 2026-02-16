import { DEFAULT_LARGE_IMAGE, DEFAULT_SMALL_IMAGE, RPC } from './discord'

export type RpcPayload = {
  trackName: string
  albumName: string
  artist: string
  startTime: number
  endTime: number
  duration: number
  coverArtUrl?: string  // öffentliche Last.fm URL, optional
}

export async function setDiscordRpcActivity(payload: RpcPayload) {
  try {
    RPC.init()
    RPC.set({
      details: payload.trackName,
      state: `${payload.artist} • ${payload.albumName}`,
      timestamps: {
        start: payload.startTime,
        end: payload.endTime,
      },
      assets: {
        large_image: payload.coverArtUrl ?? DEFAULT_LARGE_IMAGE,
        small_image: DEFAULT_SMALL_IMAGE,
        large_text: payload.albumName,
      },
    })
  } catch {}
}

export function clearDiscordRpcActivity() {
  RPC.set(null)
}
