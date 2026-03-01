import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/app/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog'
import {
  Content,
  ContentItem,
  ContentItemForm,
  ContentItemTitle,
  Header,
  HeaderTitle,
  Root,
} from '@/app/components/settings/section'
import { Switch } from '@/app/components/ui/switch'
import { Input } from '@/app/components/ui/input'
import { subsonic } from '@/service/subsonic'
import {
  DEFAULT_FOCUS_GENRES,
  DEFAULT_NIGHT_GENRES,
  useLyricsSettings,
  useSessionModeSettings,
} from '@/store/player.store'
import { useAppPodcasts, useAppIntegrations } from '@/store/app.store'
import { cn } from '@/lib/utils'
import { ComponentPropsWithoutRef } from 'react'
import { isGenreUsable, normalizeGenreName } from '@/utils/genreNormalization'
import { queryKeys } from '@/utils/queryKeys'
import { useDebouncedFormSync } from '@/app/hooks/use-debounced-form-sync'

const podcastSchema = z
  .object({
    serviceUrl: z.string().url({ message: 'login.form.validations.url' }),
    customUser: z.string().optional(),
    customUrl: z.string().url({ message: 'login.form.validations.url' }).optional(),
    useDefaultUser: z.boolean(),
    active: z.boolean(),
  })
  .refine(
    (data) => {
      const customUser = data.customUser?.length ?? 0
      const customUrl = data.customUrl?.length ?? 0
      return data.useDefaultUser === true || (customUser > 0 && customUrl > 0)
    },
    {
      message: 'settings.content.podcast.credentials.error',
      path: ['useDefaultUser'],
    },
  )

type PodcastSchemaType = z.infer<typeof podcastSchema>

function ErrorMessage({ className, children, ...rest }: ComponentPropsWithoutRef<'p'>) {
  return (
    <p {...rest} className={cn('text-destructive text-xs mt-1', className)}>
      {children}
    </p>
  )
}

export function ContentPage() {
  const { t } = useTranslation()

  // Lyrics
  const { preferSyncedLyrics, setPreferSyncedLyrics } = useLyricsSettings()

  // Podcasts
  const {
    active,
    setActive,
    serviceUrl,
    setServiceUrl,
    useDefaultUser,
    setUseDefaultUser,
    customUser,
    setCustomUser,
    customUrl,
    setCustomUrl,
  } = useAppPodcasts()

  const {
    register,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(podcastSchema),
    defaultValues: {
      active,
      serviceUrl: serviceUrl || 'http://',
      useDefaultUser,
      customUser,
      customUrl,
    },
  })

  useDebouncedFormSync(watch, (data: Partial<PodcastSchemaType>) => {
    if (data.active !== undefined) setActive(data.active)
    if (data.serviceUrl !== undefined) setServiceUrl(data.serviceUrl)
    if (data.useDefaultUser !== undefined) setUseDefaultUser(data.useDefaultUser)
    if (data.customUser !== undefined) setCustomUser(data.customUser)
    if (data.customUrl !== undefined) setCustomUrl(data.customUrl)
  }, 500)

  // Homepage Playlists
  const { lastfm } = useAppIntegrations()
  const isLastfmConfigured = Boolean(lastfm.username && lastfm.apiKey)
  const {
    focusGenres,
    nightGenres,
    setFocusGenres,
    setNightGenres,
  } = useSessionModeSettings()

  const [activeGenreMode, setActiveGenreMode] = useState<'focus' | 'night' | null>(null)
  const [draftGenres, setDraftGenres] = useState<string[]>([])

  const { data: genres = [], isLoading: genresLoading } = useQuery({
    queryKey: [queryKeys.genre.all, 'session-mode-genres'],
    queryFn: subsonic.genres.get,
    staleTime: 1000 * 60 * 10,
  })

  const availableGenres = useMemo(() => {
    const canonical = new Set<string>()
    for (const genre of genres) {
      if (!isGenreUsable(genre.value)) continue
      const normalized = normalizeGenreName(genre.value).trim().toLowerCase()
      if (!normalized) continue
      canonical.add(normalized)
    }
    return [...canonical].sort((a, b) => a.localeCompare(b))
  }, [genres])

  const availableGenreSet = useMemo(() => new Set(availableGenres), [availableGenres])

  const getDefaultsForMode = (mode: 'focus' | 'night') =>
    (mode === 'focus' ? DEFAULT_FOCUS_GENRES : DEFAULT_NIGHT_GENRES)
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0)
      .filter((value) => availableGenreSet.has(value))

  const getConfiguredForMode = (mode: 'focus' | 'night') => {
    const source = mode === 'focus' ? focusGenres : nightGenres
    const cleaned = [...new Set(source.map((value) => value.trim().toLowerCase()))]
      .filter((value) => value.length > 0)
      .filter((value) => availableGenreSet.size === 0 || availableGenreSet.has(value))
    return cleaned
  }

  const openGenreModal = (mode: 'focus' | 'night') => {
    const configured = getConfiguredForMode(mode)
    const defaults = getDefaultsForMode(mode)
    setDraftGenres(configured.length > 0 ? configured : defaults)
    setActiveGenreMode(mode)
  }

  const toggleDraftGenre = (value: string) => {
    setDraftGenres((prev) =>
      prev.includes(value) ? prev.filter((genre) => genre !== value) : [...prev, value],
    )
  }

  const handleGenreReset = () => {
    if (!activeGenreMode) return
    const defaults = getDefaultsForMode(activeGenreMode)
    setDraftGenres(defaults)
  }

  const handleGenreSave = () => {
    if (!activeGenreMode) return

    const sanitized = [...new Set(draftGenres.map((value) => value.trim().toLowerCase()))]
      .filter((value) => value.length > 0)
      .filter((value) => availableGenreSet.size === 0 || availableGenreSet.has(value))

    const fallbackDefaults = getDefaultsForMode(activeGenreMode)
    const nextValue = sanitized.length > 0 ? sanitized : fallbackDefaults

    if (activeGenreMode === 'focus') {
      setFocusGenres(nextValue)
    } else {
      setNightGenres(nextValue)
    }

    setActiveGenreMode(null)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Lyrics */}
        <Root>
          <Content>
            <ContentItem>
              <ContentItemTitle info={t('settings.audio.lyrics.preferSynced.info')}>
                {t('settings.audio.lyrics.preferSynced.label', 'Prefer Synced Lyrics')}
              </ContentItemTitle>
              <ContentItemForm>
                <Switch
                  checked={preferSyncedLyrics}
                  onCheckedChange={setPreferSyncedLyrics}
                />
              </ContentItemForm>
            </ContentItem>
          </Content>
        </Root>

        {/* Podcasts */}
        <Root>
          <Header>
            <HeaderTitle>{t('settings.content.podcast.group', 'Podcasts')}</HeaderTitle>
          </Header>
          <Content>
            <ContentItem>
              <ContentItemTitle>
                {t('settings.content.podcast.enabled.label', 'Enable Podcasts')}
              </ContentItemTitle>
              <ContentItemForm>
                <Switch
                  {...register('active')}
                  checked={watch('active')}
                  onCheckedChange={(checked) => {
                    setValue('active', checked)
                    trigger('active')
                  }}
                />
              </ContentItemForm>
            </ContentItem>

            {watch('active') && (
              <>
                <ContentItem>
                  <ContentItemTitle>
                    {t('settings.content.podcast.service.url', 'Service URL')}
                    {errors.serviceUrl?.message && (
                      <ErrorMessage>{t(errors.serviceUrl.message)}</ErrorMessage>
                    )}
                  </ContentItemTitle>
                  <ContentItemForm>
                    <Input
                      {...register('serviceUrl')}
                      className={clsx('h-8', errors.serviceUrl && 'border-destructive')}
                      onChange={(e) => {
                        setValue('serviceUrl', e.target.value, { shouldValidate: true })
                      }}
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </ContentItemForm>
                </ContentItem>

                <ContentItem>
                  <ContentItemTitle>
                    {t('settings.content.podcast.credentials.label', 'Use Default Credentials')}
                    {errors.useDefaultUser?.message && (
                      <ErrorMessage>{t(errors.useDefaultUser.message)}</ErrorMessage>
                    )}
                  </ContentItemTitle>
                  <ContentItemForm>
                    <Switch
                      {...register('useDefaultUser')}
                      checked={watch('useDefaultUser')}
                      onCheckedChange={(checked) => {
                        setValue('useDefaultUser', checked)
                        trigger('useDefaultUser')
                      }}
                    />
                  </ContentItemForm>
                </ContentItem>

                {!watch('useDefaultUser') && (
                  <>
                    <ContentItem>
                      <ContentItemTitle>
                        {t('settings.content.podcast.credentials.user', 'Username')}
                      </ContentItemTitle>
                      <ContentItemForm>
                        <Input
                          {...register('customUser')}
                          className="h-8"
                          onChange={(e) => {
                            setValue('customUser', e.target.value, { shouldValidate: true })
                            trigger('useDefaultUser')
                          }}
                        />
                      </ContentItemForm>
                    </ContentItem>
                    <ContentItem>
                      <ContentItemTitle>
                        {t('settings.content.podcast.credentials.url', 'Server URL')}
                      </ContentItemTitle>
                      <ContentItemForm>
                        <Input
                          {...register('customUrl')}
                          className="h-8"
                          onChange={(e) => {
                            setValue('customUrl', e.target.value, { shouldValidate: true })
                            trigger('useDefaultUser')
                          }}
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          autoComplete="off"
                        />
                      </ContentItemForm>
                    </ContentItem>
                  </>
                )}
              </>
            )}
          </Content>
        </Root>

        {/* Session mode genres */}
        <Root>
          <Header>
            <HeaderTitle>{t('settings.content.sessionModes.group', 'Session Modes')}</HeaderTitle>
          </Header>
          <Content>
            <ContentItem>
              <ContentItemTitle>
                {t('settings.content.sessionModes.focusGenres.label', 'Focus Mode Genres')}
              </ContentItemTitle>
              <ContentItemForm>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => openGenreModal('focus')}
                >
                  {t('settings.content.sessionModes.genresButton', 'Genres')}
                </Button>
              </ContentItemForm>
            </ContentItem>
            <ContentItem>
              <ContentItemTitle>
                {t('settings.content.sessionModes.nightGenres.label', 'Night Mode Genres')}
              </ContentItemTitle>
              <ContentItemForm>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => openGenreModal('night')}
                >
                  {t('settings.content.sessionModes.genresButton', 'Genres')}
                </Button>
              </ContentItemForm>
            </ContentItem>
          </Content>
        </Root>

        {/* Homepage Playlists */}
        <Root>
          <Header>
            <HeaderTitle>{t('settings.content.homepage.group', 'Homepage Features')}</HeaderTitle>
          </Header>
          <Content>
            <ContentItem>
              <ContentItemTitle>
                {t('settings.content.homepage.thisIsArtist.label', 'Show "This is [Artist]" Playlist')}
              </ContentItemTitle>
              <ContentItemForm>
                <Switch
                  checked={lastfm.showThisIsArtist}
                  onCheckedChange={lastfm.setShowThisIsArtist}
                  disabled={!isLastfmConfigured}
                />
              </ContentItemForm>
            </ContentItem>
            {!isLastfmConfigured && (
              <p className="text-xs text-muted-foreground">
                {t('settings.content.homepage.requiresLastfm', 'Configure Last.fm in Services to enable this feature')}
              </p>
            )}
          </Content>
        </Root>
      </div>

      <Dialog
        open={activeGenreMode !== null}
        onOpenChange={(open) => {
          if (!open) setActiveGenreMode(null)
        }}
      >
        <DialogContent
          className="max-w-[980px] h-[640px] max-h-[92vh] overflow-hidden p-0"
          aria-describedby={undefined}
        >
          <DialogHeader className="border-b px-6 pb-3 pt-6 pr-12 text-left">
            <DialogTitle>
              {activeGenreMode === 'focus'
                ? t('settings.content.sessionModes.focusGenres.modalTitle', 'Focus Mode Genres')
                : t('settings.content.sessionModes.nightGenres.modalTitle', 'Night Mode Genres')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'settings.content.sessionModes.modalDescription',
                'Choose which genres are allowed for this session mode.',
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {genresLoading ? (
              <div className="text-sm text-muted-foreground">
                {t('generic.loading', 'Loading…')}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pr-1 md:grid-cols-3 lg:grid-cols-4">
                {availableGenres.map((genre) => {
                  const active = draftGenres.includes(genre)
                  return (
                    <button
                      key={genre}
                      type="button"
                      className={cn(
                        'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        active
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border/60 bg-background/60 text-muted-foreground hover:text-foreground hover:border-border',
                      )}
                      onClick={() => toggleDraftGenre(genre)}
                    >
                      {genre}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-background/95 px-6 py-4 backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              onClick={handleGenreReset}
              disabled={genresLoading}
            >
              {t('settings.content.sessionModes.reset', 'Reset')}
            </Button>
            <Button
              type="button"
              onClick={handleGenreSave}
              disabled={genresLoading}
            >
              {t('settings.content.sessionModes.save', 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
