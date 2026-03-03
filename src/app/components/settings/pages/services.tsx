import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { Input } from '@/app/components/ui/input'
import { Switch } from '@/app/components/ui/switch'
import { useDebouncedFormSync } from '@/app/hooks/use-debounced-form-sync'
import { useAppIntegrations } from '@/store/app.store'
import { useLrcLibSettings } from '@/store/player.store'

const { DISABLE_LRCLIB } = window

const lrclibSchema = z.object({
  customUrl: z
    .string()
    .url({ message: 'login.form.validations.url' })
    .optional(),
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

  useDebouncedFormSync(
    watch,
    (data: Partial<LrclibSchemaType>) => {
      if (data.customUrl !== undefined) {
        setCustomUrl(data.customUrl)
      }
    },
    500,
  )

  const isLrclibEnabled = DISABLE_LRCLIB ? false : enabled

  return (
    <div className="space-y-4">
      {/* Last.fm */}
      <Root>
        <Header>
          <HeaderTitle>
            {t('settings.integrations.lastfm.group', 'Last.fm')}
          </HeaderTitle>
        </Header>
        <Content>
          <p className="text-xs text-muted-foreground px-2 pb-1">
            {t(
              'settings.integrations.lastfm.description',
              'Connect your Last.fm account to enable personalized music recommendations.',
            )}
          </p>
          <ContentItem>
            <ContentItemTitle>
              {t('settings.integrations.lastfm.username.label', 'Username')}
            </ContentItemTitle>
            <ContentItemForm>
              <Input
                type="text"
                placeholder={t(
                  'settings.integrations.lastfm.username.placeholder',
                  'Last.fm username',
                )}
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
                placeholder={t(
                  'settings.integrations.lastfm.apiKey.placeholder',
                  'Last.fm API key',
                )}
                value={lastfm.apiKey}
                onChange={(e) => lastfm.setApiKey(e.target.value)}
                className="h-8"
              />
            </ContentItemForm>
          </ContentItem>
          <p className="text-xs text-muted-foreground">
            {t(
              'settings.integrations.lastfm.apiKey.helpPrefix',
              'Get your API key from',
            )}{' '}
            <a
              href="https://www.last.fm/api/account/create"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('settings.integrations.lastfm.apiKey.helpLink', 'Last.fm API')}
            </a>
          </p>
        </Content>
      </Root>

      {/* Lidarr */}
      <Root>
        <Header>
          <HeaderTitle>
            {t('settings.integrations.lidarr.group', 'Lidarr')}
          </HeaderTitle>
        </Header>
        <Content>
          <p className="text-xs text-muted-foreground px-2 pb-1">
            {t(
              'settings.integrations.lidarr.description',
              'Connect to your Lidarr instance for album requests.',
            )}
          </p>
          <ContentItem>
            <ContentItemTitle>
              {t('settings.integrations.lidarr.url.label', 'Server URL')}
            </ContentItemTitle>
            <ContentItemForm>
              <Input
                type="url"
                placeholder={t(
                  'settings.integrations.lidarr.url.placeholder',
                  'http://localhost:8686',
                )}
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
                placeholder={t(
                  'settings.integrations.lidarr.apiKey.placeholder',
                  'Lidarr API key',
                )}
                value={lidarr.apiKey}
                onChange={(e) => lidarr.setApiKey(e.target.value)}
                className="h-8"
              />
            </ContentItemForm>
          </ContentItem>
        </Content>
      </Root>

      {/* LRCLIB */}
      <Root>
        <Header>
          <HeaderTitle>
            {t('settings.privacy.services.lrclib.label', 'LRCLIB')}
          </HeaderTitle>
        </Header>
        <Content>
          <p className="text-xs text-muted-foreground px-2 pb-1">
            {t(
              'settings.privacy.services.lrclib.info',
              'LRCLIB is used to find song lyrics.',
            )}
          </p>
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
                <ContentItemTitle
                  info={t('settings.privacy.services.lrclib.customUrl.info')}
                >
                  {t(
                    'settings.privacy.services.lrclib.customUrl.toggle',
                    'Use Custom URL',
                  )}
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
                    {t(
                      'settings.privacy.services.lrclib.customUrl.label',
                      'Custom Server URL',
                    )}
                  </ContentItemTitle>
                  <ContentItemForm>
                    <Input
                      {...register('customUrl')}
                      className={clsx(
                        'h-8',
                        errors.customUrl && 'border-destructive',
                      )}
                      onChange={(e) => {
                        setValue('customUrl', e.target.value, {
                          shouldValidate: true,
                        })
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
      </Root>
    </div>
  )
}
