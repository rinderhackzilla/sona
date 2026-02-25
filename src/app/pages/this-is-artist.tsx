import { Info, Music, Play, RefreshCw, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ImageHeader from '@/app/components/album/image-header'
import ListWrapper from '@/app/components/list-wrapper'
import { Button } from '@/app/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { DataTable } from '@/app/components/ui/data-table'
import { useThisIsArtist } from '@/app/hooks/use-this-is-artist'
import { songsColumns } from '@/app/tables/songs-columns'
import { usePlayerActions } from '@/store/player.store'
import { ColumnFilter } from '@/types/columnFilter'
import { convertSecondsToHumanRead } from '@/utils/convertSecondsToTime'

export default function ThisIsArtistPage() {
  const columns = songsColumns()
  const { t } = useTranslation()
  const {
    playlist,
    artist,
    isGenerating,
    error,
    generate,
    isConfigured,
  } = useThisIsArtist()
  const { setSongList } = usePlayerActions()

  if (!isConfigured) {
    return (
      <div className="w-full px-8 py-6">
        <Card className="mx-auto mt-12 max-w-2xl border-dashed">
          <CardHeader>
            <div className="flex items-start gap-4">
              <Info className="mt-0.5 h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <CardTitle className="mb-3 text-xl">
                  {t('home.thisIsArtist')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('home.configureLastfm')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full px-8 py-6">
        <Card className="mx-auto mt-12 max-w-2xl border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('generic.error')}</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="w-full px-8 py-6">
        <div className="mt-12 flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-lg">{t('home.generating')}</span>
        </div>
      </div>
    )
  }

  if (playlist.length === 0 || !artist) {
    return (
      <div className="w-full px-8 py-6">
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-4 text-2xl font-semibold">{t('home.thisIsArtist')}</h2>
          <p className="mb-6 text-muted-foreground">{t('home.generatePlaylist')}</p>
          <Button size="lg" onClick={generate} disabled={isGenerating}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('home.generate')}
          </Button>
        </div>
      </div>
    )
  }

  const columnsToShow: ColumnFilter[] = [
    'index',
    'title',
    'album',
    'duration',
    'select',
  ]

  const totalDuration = playlist.reduce((acc, song) => acc + song.duration, 0)
  const duration = convertSecondsToHumanRead(totalDuration)

  const badges = [
    { content: t('playlist.songCount', { count: playlist.length }), type: 'text' as const },
    { content: duration, type: 'text' as const },
  ]

  const handlePlayAll = () => {
    setSongList(playlist, 0)
  }

  const handlePlayShuffle = () => {
    const shuffled = [...playlist].sort(() => Math.random() - 0.5)
    setSongList(shuffled, 0)
  }

  return (
    <div className="w-full">
      <ImageHeader
        type={t('home.thisIsPrefix')}
        title={artist.name}
        subtitle={t('home.thisIsArtist')}
        coverArtId={artist.coverArt || playlist[0]?.coverArt}
        coverArtType={artist.coverArt ? 'artist' : 'album'}
        coverArtSize="700"
        coverArtAlt={artist.name}
        badges={badges}
        isPlaylist
      />

      <ListWrapper>
        <div className="mb-4 flex gap-2">
          <Button variant="default" size="default" onClick={handlePlayAll}>
            <Play className="mr-2 h-4 w-4" />
            {t('generic.playAll')}
          </Button>
          <Button variant="outline" size="default" onClick={handlePlayShuffle}>
            <Shuffle className="mr-2 h-4 w-4" />
            {t('generic.shuffle')}
          </Button>
          <Button variant="outline" size="default" onClick={generate} disabled={isGenerating}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={playlist}
          handlePlaySong={(row) => setSongList(playlist, row.index)}
          columnFilter={columnsToShow}
          noRowsMessage={t('discoverWeekly.noSongs')}
          variant="modern"
        />
      </ListWrapper>
    </div>
  )
}
