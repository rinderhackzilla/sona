import { useTranslation } from 'react-i18next'
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
import { Input } from '@/app/components/ui/input'
import { Switch } from '@/app/components/ui/switch'
import { useAppIntegrations } from '@/store/app.store'

export function LastFM() {
  const { t } = useTranslation()
  const { lastfm } = useAppIntegrations()

  const isConfigured = Boolean(lastfm.username && lastfm.apiKey)

  return (
    <Root>
      <Header>
        <HeaderTitle>{t('settings.integrations.lastfm.group')}</HeaderTitle>
        <HeaderDescription>
          {t('settings.integrations.lastfm.description')}
        </HeaderDescription>
      </Header>
      <Content>
        <ContentItem>
          <ContentItemTitle>
            {t('settings.integrations.lastfm.username.label')}
          </ContentItemTitle>
          <ContentItemForm>
            <Input
              type="text"
              placeholder="Last.fm Username"
              value={lastfm.username}
              onChange={(e) => lastfm.setUsername(e.target.value)}
            />
          </ContentItemForm>
        </ContentItem>
        <ContentItem>
          <ContentItemTitle>
            {t('settings.integrations.lastfm.apiKey.label')}
          </ContentItemTitle>
          <ContentItemForm>
            <Input
              type="password"
              placeholder="API Key"
              value={lastfm.apiKey}
              onChange={(e) => lastfm.setApiKey(e.target.value)}
            />
          </ContentItemForm>
        </ContentItem>
        <ContentSeparator />
        <ContentItem>
          <ContentItemTitle>
            Show "This is [Artist]" on Homepage
          </ContentItemTitle>
          <ContentItemForm>
            <div className="flex items-center gap-3">
              <Switch
                checked={lastfm.showThisIsArtist}
                onCheckedChange={lastfm.setShowThisIsArtist}
                disabled={!isConfigured}
              />
              <span className="text-sm text-muted-foreground">
                {isConfigured 
                  ? 'Display daily artist playlist on homepage' 
                  : 'Configure Last.fm credentials first'
                }
              </span>
            </div>
          </ContentItemForm>
        </ContentItem>
      </Content>
      <ContentSeparator />
    </Root>
  )
}
