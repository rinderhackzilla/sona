import { AonsokuStore } from './store'

export interface ISettingPayload {
  minimizeToTray: boolean
  disableGpu: boolean
}

const settingsStore = new AonsokuStore<ISettingPayload>({
  name: 'settings',
  defaults: {
    minimizeToTray: false,
    disableGpu: false,
  },
})

export function saveAppSettings(payload: ISettingPayload) {
  try {
    settingsStore.set(payload)
  } catch (error) {
    console.error('Unable to save app settings to store.', error)
  }
}

export function getAppSetting<T extends keyof ISettingPayload>(
  item: T,
): ISettingPayload[T] {
  return settingsStore.get(item)
}
