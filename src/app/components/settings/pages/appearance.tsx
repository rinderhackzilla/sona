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
import { Switch } from '@/app/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { useFullscreenPlayerSettings } from '@/store/player.store'
import { useLang } from '@/store/lang.store'
import { ThemeSettingsPicker } from './appearance/theme'

const languages = [
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'en', name: 'English', flag: 'US' },
]

export function AppearancePage() {
  const { t } = useTranslation()
  const { autoFullscreenEnabled, setAutoFullscreenEnabled } = useFullscreenPlayerSettings()
  const { langCode, setLang } = useLang()

  return (
    <div className="space-y-6">
      <Root>
        <Header>
          <HeaderTitle>{t('settings.appearance.general.group', 'General')}</HeaderTitle>
          <HeaderDescription>
            {t('settings.appearance.general.description', 'Customize the appearance of the app')}
          </HeaderDescription>
        </Header>
        <Content>
          <ContentItem>
            <ContentItemTitle info={t('settings.appearance.general.fullscreen.info')}>
              {t('settings.appearance.general.fullscreen.label', 'Automatic Fullscreen')}
            </ContentItemTitle>
            <ContentItemForm>
              <Switch
                checked={autoFullscreenEnabled}
                onCheckedChange={setAutoFullscreenEnabled}
              />
            </ContentItemForm>
          </ContentItem>

          <ContentItem>
            <ContentItemTitle>
              {t('menu.language', 'Language')}
            </ContentItemTitle>
            <ContentItemForm>
              <Select value={langCode} onValueChange={setLang}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </ContentItemForm>
          </ContentItem>
        </Content>
        <ContentSeparator />
      </Root>

      <Root>
        <Header>
          <HeaderTitle>{t('theme.label', 'Theme')}</HeaderTitle>
          <HeaderDescription>
            {t('theme.description', 'Choose your color theme')}
          </HeaderDescription>
        </Header>
        <ThemeSettingsPicker />
      </Root>
    </div>
  )
}
