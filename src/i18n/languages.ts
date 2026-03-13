import de from './locales/de.json'
import en from './locales/en.json'

export const resources = {
  de: { translation: de },
  'en-US': { translation: en },
}

export const languages = [
  {
    nativeName: 'Deutsch',
    langCode: 'de',
    flag: 'DE',
    dayjsLocale: 'de',
  },
  {
    nativeName: 'English (US)',
    langCode: 'en-US',
    flag: 'US',
    dayjsLocale: 'en',
  },
]
