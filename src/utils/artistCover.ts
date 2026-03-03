import { Albums } from '@/types/responses/album'

function parseCreated(value?: string) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function getNewestAlbumCoverArt(albums?: Albums[]) {
  if (!albums || albums.length === 0) return undefined

  const sorted = [...albums]
    .filter((album) => Boolean(album.coverArt))
    .sort((left, right) => {
      const yearDelta = (right.year ?? -Infinity) - (left.year ?? -Infinity)
      if (yearDelta !== 0) return yearDelta

      const createdDelta =
        parseCreated(right.created) - parseCreated(left.created)
      if (createdDelta !== 0) return createdDelta

      return right.songCount - left.songCount
    })

  return sorted[0]?.coverArt
}
