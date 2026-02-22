import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDebouncedCallback } from 'use-debounce'
import { z } from 'zod'
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
import { useLyricsSettings } from '@/store/player.store'
import { useAppPodcasts, useAppIntegrations } from '@/store/app.store'
import { cn } from '@/lib/utils'
import { ComponentPropsWithoutRef } from 'react'

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

  const debounce = useDebouncedCallback((data: Partial<PodcastSchemaType>) => {
    if (data.active !== undefined) setActive(data.active)
    if (data.serviceUrl !== undefined) setServiceUrl(data.serviceUrl)
    if (data.useDefaultUser !== undefined) setUseDefaultUser(data.useDefaultUser)
    if (data.customUser !== undefined) setCustomUser(data.customUser)
    if (data.customUrl !== undefined) setCustomUrl(data.customUrl)
  }, 500)

  watch((data) => {
    debounce(data)
  })

  // Homepage Playlists
  const { lastfm } = useAppIntegrations()
  const isLastfmConfigured = Boolean(lastfm.username && lastfm.apiKey)

  return (
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
  )
}
