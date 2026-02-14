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

export function Lidarr() {
  const { t } = useTranslation()
  const { lidarr } = useAppIntegrations()

  return (
    <Root>
      <Header>
        <HeaderTitle>{t('settings.integrations.lidarr.group')}</HeaderTitle>
        <HeaderDescription>
          {t('settings.integrations.lidarr.description')}
        </HeaderDescription>
      </Header>
      <Content>
        <ContentItem>
          <ContentItemTitle>
            {t('settings.integrations.lidarr.url.label')}
          </ContentItemTitle>
          <ContentItemForm>
            <Input
              type="url"
              placeholder="http://localhost:8686"
              value={lidarr.url}
              onChange={(e) => lidarr.setUrl(e.target.value)}
            />
          </ContentItemForm>
        </ContentItem>
        <ContentItem>
          <ContentItemTitle>
            {t('settings.integrations.lidarr.apiKey.label')}
          </ContentItemTitle>
          <ContentItemForm>
            <Input
              type="password"
              placeholder="API Key"
              value={lidarr.apiKey}
              onChange={(e) => lidarr.setApiKey(e.target.value)}
            />
          </ContentItemForm>
        </ContentItem>
      </Content>
      <ContentSeparator />
    </Root>
  )
}
