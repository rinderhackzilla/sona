import { useTranslation } from 'react-i18next'
import {
  Content,
  ContentItem,
  ContentItemForm,
  ContentItemTitle,
  Header,
  HeaderTitle,
  Root,
} from '@/app/components/settings/section'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { languages } from '@/i18n/languages'
import { useLang } from '@/store/lang.store'
import { useFullscreenPlayerSettings } from '@/store/player.store'
import { ThemeSettingsPicker } from './appearance/theme'

const appearanceLanguages = languages.filter((language) =>
  ['de', 'en-US'].includes(language.langCode),
)

export function AppearancePage() {
  const { t } = useTranslation()
  const { autoFullscreenEnabled, setAutoFullscreenEnabled } =
    useFullscreenPlayerSettings()
  const { langCode, setLang } = useLang()

  return (
    <div className="space-y-4">
      <Root>
        <Content>
          <ContentItem>
            <ContentItemTitle
              info={t('settings.appearance.general.fullscreen.info')}
            >
              {t(
                'settings.appearance.general.fullscreen.label',
                'Automatic Fullscreen',
              )}
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
                    {appearanceLanguages.map((lang) => (
                      <SelectItem key={lang.langCode} value={lang.langCode}>
                        {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </ContentItemForm>
          </ContentItem>
        </Content>
      </Root>

      <Root>
        <Header>
          <HeaderTitle>{t('theme.label', 'Theme')}</HeaderTitle>
        </Header>
        <ThemeSettingsPicker />
      </Root>
    </div>
  )
}
