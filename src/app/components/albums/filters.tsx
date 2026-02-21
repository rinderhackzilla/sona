import { Shuffle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/app/components/ui/button'
import { ExpandableSearchInput } from '@/app/components/search/expandable-input'
import { songs } from '@/service/songs'
import { usePlayerActions } from '@/store/player.store'
import { AlbumListType } from '@/types/responses/album'
import { AlbumsFilters, AlbumsSearchParams } from '@/utils/albumsFilter'
import { SearchParamsHandler } from '@/utils/searchParamsHandler'
import { AlbumsFilterByGenre } from './filters/by-genre'
import { AlbumsFilterByYear } from './filters/by-year'
import { AlbumsMainFilter } from './filters/main'

export function AlbumsFilter() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { getSearchParam } = new SearchParamsHandler(searchParams)
  const { setSongList } = usePlayerActions()
  const [isShuffling, setIsShuffling] = useState(false)

  const currentFilter = getSearchParam<AlbumListType>(
    AlbumsSearchParams.MainFilter,
    AlbumsFilters.RecentlyAdded,
  )

  const handleShuffleAll = async () => {
    if (isShuffling) return
    setIsShuffling(true)
    try {
      const randomSongs = await songs.getRandomSongs({ size: 500 })
      if (randomSongs && randomSongs.length > 0) {
        setSongList(randomSongs, 0, true)
      }
    } finally {
      setIsShuffling(false)
    }
  }

  return (
    <div className="flex gap-2 flex-1 justify-end">
      {currentFilter === AlbumsFilters.ByYear && <AlbumsFilterByYear />}

      {currentFilter === AlbumsFilters.ByGenre && <AlbumsFilterByGenre />}

      <Button
        variant="outline"
        size="sm"
        className="text-green-500 hover:text-green-400 border-green-500/30 hover:border-green-500/60"
        onClick={handleShuffleAll}
        disabled={isShuffling}
      >
        <Shuffle className="w-4 h-4 mr-2" />
        {t('album.list.shuffleAll')}
      </Button>

      <AlbumsMainFilter />

      <ExpandableSearchInput placeholder={t('album.list.search.placeholder')} />
    </div>
  )
}
