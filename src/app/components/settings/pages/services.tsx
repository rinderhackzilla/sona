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
  ContentSeparator,
  Header,
  HeaderDescription,
  HeaderTitle,
  Root,
} from '@/app/components/settings/section'
import { Switch } from '@/app/components/ui/switch'
import { Input } from '@/app/components/ui/input'
import { useAppIntegrations } from '@/store/app.store'
import { useLrcLibSettings } from '@/store/player.store'

const { DISABLE_LRCLIB } = window

const lrclibSchema = z.object({
  customUrl: z.string().url({ message: 'login.form.validations.url' }).optional(),
})

type LrclibSchemaType = z.infer<typeof lrclibSchema>

export function ServicesPage() {
  const { t } = useTranslation()

  // Last.fm
  const { lastfm, lidarr } = useAppIntegrations()

  // LRCLIB
  const {
    enabled,
    setEnabled,
    customUrlEnabled,
    setCustomUrlEnabled,
    customUrl,
    setCustomUrl,
  } = useLrcLibSettings()

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(lrclibSchema),
    defaultValues: {
      customUrl: customUrl,
    },
  })

  const debounce = useDebouncedCallback((data: Partial<LrclibSchemaType>) => {
    if (data.customUrl !== undefined) {
      setCustomUrl(data.customUrl)
    }
  }, 500)

  watch((data) => {
    debounce(data)
  })

  const isLrclibEnabled = DISABLE_LRCLIB ? false : enabled

  return (
    <div className="space-y-6">
      {/* Last.fm */}
      <Root>
        <Header>
          <HeaderTitle>{t('settings.integrations.lastfm.group', 'Last.fm')}</HeaderTitle>
          <HeaderDescription>
            {t('settings.integrations.lastfm.description', 'Enable personalized music recommendations and playlists')}
          </HeaderDescription>
        </Header>
        <Content>
          <ContentItem>
            <ContentItemTitle>
              {t('settings.integrations.lastfm.username.label', 'Username')}
            </ContentItemTitle>
            <ContentItemForm>
              <Input
                type="text"
                placeholder="Last.fm Username"
                value={lastfm.username}
                onChange={(e) => lastfm.setUsername(e.target.value)}
                className="h-8"
              />
            </ContentItemForm>
          </ContentItem>
          <ContentItem>
            <ContentItemTitle>
              {t('settings.integrations.lastfm.apiKey.label', 'API Key')}
            </ContentItemTitle>
            <ContentItemForm>
              <Input
                type="password"
                placeholder="API Key"
                value={lastfm.apiKey}
                onChange={(e) => lastfm.setApiKey(e.target.value)}
                className="h-8"
              />
            </ContentItemForm>
          </ContentItem>
          <p className="text-xs text-muted-foreground">
            Get your API key from{' '}
            <a
              href="https://www.last.fm/api/account/create"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Last.fm API
            </a>
          </p>
        </Content>
        <ContentSeparator />
      </Root>

      {/* Lidarr */}
      <Root>
        <Header>
          <HeaderTitle>{t('settings.integrations.lidarr.group', 'Lidarr')}</HeaderTitle>
          <HeaderDescription>
            {t('settings.integrations.lidarr.description', 'Automatically download missing albums and artists')}
          </HeaderDescription>
        </Header>
        <Content>
          <ContentItem>
            <ContentItemTitle>
              {t('settings.integrations.lidarr.url.label', 'Server URL')}
            </ContentItemTitle>
            <ContentItemForm>
              <Input
                type="url"
                placeholder="http://localhost:8686"
                value={lidarr.url}
                onChange={(e) => lidarr.setUrl(e.target.value)}
                className="h-8"
              />
            </ContentItemForm>
          </ContentItem>
          <ContentItem>
            <ContentItemTitle>
              {t('settings.integrations.lidarr.apiKey.label', 'API Key')}
            </ContentItemTitle>
            <ContentItemForm>
              <Input
                type="password"
                placeholder="API Key"
                value={lidarr.apiKey}
                onChange={(e) => lidarr.setApiKey(e.target.value)}
                className="h-8"
              />
            </ContentItemForm>
          </ContentItem>
        </Content>
        <ContentSeparator />
      </Root>

      {/* LRCLIB */}
      <Root>
        <Header>
          <HeaderTitle>{t('settings.privacy.services.lrclib.label', 'LRCLIB')}</HeaderTitle>
          <HeaderDescription>
            {t('settings.privacy.services.lrclib.info', 'External lyrics provider for synced lyrics')}
          </HeaderDescription>
        </Header>
        <Content>
          <ContentItem>
            <ContentItemTitle>
              {t('settings.privacy.services.lrclib.enabled', 'Enable LRCLIB')}
            </ContentItemTitle>
            <ContentItemForm>
              <Switch
                checked={isLrclibEnabled}
                onCheckedChange={setEnabled}
                disabled={DISABLE_LRCLIB}
              />
            </ContentItemForm>
          </ContentItem>

          {isLrclibEnabled && (
            <>
              <ContentItem>
                <ContentItemTitle info={t('settings.privacy.services.lrclib.customUrl.info')}>
                  {t('settings.privacy.services.lrclib.customUrl.toggle', 'Use Custom URL')}
                </ContentItemTitle>
                <ContentItemForm>
                  <Switch
                    checked={customUrlEnabled}
                    onCheckedChange={setCustomUrlEnabled}
                  />
                </ContentItemForm>
              </ContentItem>

              {customUrlEnabled && (
                <ContentItem>
                  <ContentItemTitle>
                    {t('settings.privacy.services.lrclib.customUrl.label', 'Custom Server URL')}
                  </ContentItemTitle>
                  <ContentItemForm>
                    <Input
                      {...register('customUrl')}
                      className={clsx('h-8', errors.customUrl && 'border-destructive')}
                      onChange={(e) => {
                        setValue('customUrl', e.target.value, { shouldValidate: true })
                      }}
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="https://lrclib.net"
                    />
                  </ContentItemForm>
                </ContentItem>
              )}
            </>
          )}
        </Content>
        <ContentSeparator />
      </Root>
    </div>
  )
}
