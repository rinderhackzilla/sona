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
import { useAppIntegrations } from '@/store/app.store'

export function LastFM() {
  const { t } = useTranslation()
  const { lastfm } = useAppIntegrations()

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
      </Content>
      <ContentSeparator />
    </Root>
  )
}
