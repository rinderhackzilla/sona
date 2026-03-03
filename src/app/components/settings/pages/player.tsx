import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EqualizerModal } from '@/app/components/player/equalizer-modal'
import {
  Content,
  ContentItem,
  ContentItemForm,
  ContentItemTitle,
  Header,
  HeaderTitle,
  Root,
} from '@/app/components/settings/section'
import { Button } from '@/app/components/ui/button'
import { NumericInput } from '@/app/components/ui/numeric-input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import {
  useAppAccounts,
  useAppDesktopActions,
  useAppDesktopData,
  useAppImagesCacheLayer,
  useAppListDensity,
  useAppPages,
} from '@/store/app.store'
import {
  useCrossfadeSettings,
  useListeningMemorySettings,
  useReplayGainActions,
  useReplayGainState,
} from '@/store/player.store'
import { ReplayGainType } from '@/types/playerContext'
import { ListDensity } from '@/types/serverConfig'
import { isDesktop } from '@/utils/desktop'

const { HIDE_RADIOS_SECTION, DISABLE_IMAGE_CACHE_TOGGLE } = window

const replayGainModes: ReplayGainType[] = ['track', 'album']
const listDensityModes: ListDensity[] = ['compact', 'default', 'cozy']

export function PlayerPage() {
  const { t } = useTranslation()
  const [equalizerOpen, setEqualizerOpen] = useState(false)

  // Replay Gain
  const {
    replayGainEnabled,
    replayGainType,
    replayGainPreAmp,
    replayGainDefaultGain,
    replayGainError,
  } = useReplayGainState()
  const {
    setReplayGainEnabled,
    setReplayGainType,
    setReplayGainPreAmp,
    setReplayGainDefaultGain,
    setReplayGainError,
  } = useReplayGainActions()

  // Crossfade
  const { enabled: crossfadeEnabled, setEnabled: setCrossfadeEnabled } =
    useCrossfadeSettings()
  const {
    enabled: listeningMemoryEnabled,
    setEnabled: setListeningMemoryEnabled,
  } = useListeningMemorySettings()

  // Sidebar & Playlists
  const {
    hideRadiosSection,
    setHideRadiosSection,
    autoPlaylistImport,
    setAutoPlaylistImport,
  } = useAppPages()

  // Cache
  const { imagesCacheLayerEnabled, setImagesCacheLayerEnabled } =
    useAppImagesCacheLayer()
  const { listDensity, setListDensity } = useAppListDensity()

  // Rich Presence
  const { discord } = useAppAccounts()

  // Tray
  const { minimizeToTray } = useAppDesktopData()
  const { setMinimizeToTray } = useAppDesktopActions()

  const handleResetError = () => {
    setReplayGainError(false)
    setReplayGainEnabled(true)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Audio Processing */}
      <Root>
        <Header>
          <HeaderTitle>
            {t('settings.player.audioProcessing.group', 'Audio Processing')}
          </HeaderTitle>
        </Header>
        <Content>
          <ContentItem>
            <ContentItemTitle>
              {t('settings.player.equalizer.label', 'Equalizer')}
            </ContentItemTitle>
            <ContentItemForm>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => setEqualizerOpen(true)}
              >
                {t('settings.player.equalizer.open', 'Open')}
              </Button>
            </ContentItemForm>
          </ContentItem>

          {/* Replay Gain toggle */}
          <ContentItem>
            <ContentItemTitle>
              {t('settings.audio.replayGain.group', 'Replay Gain')}
            </ContentItemTitle>
            <ContentItemForm>
              <Switch
                checked={replayGainEnabled}
                onCheckedChange={setReplayGainEnabled}
                disabled={replayGainError}
              />
            </ContentItemForm>
          </ContentItem>

          {replayGainError && (
            <ContentItem>
              <ContentItemTitle className="text-xs text-muted-foreground text-balance">
                {t('settings.audio.replayGain.error.message')}
              </ContentItemTitle>
              <ContentItemForm>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8"
                  onClick={handleResetError}
                >
                  {t('settings.audio.replayGain.error.button')}
                </Button>
              </ContentItemForm>
            </ContentItem>
          )}

          {replayGainEnabled && (
            <>
              <ContentItem>
                <ContentItemTitle>
                  {t('settings.audio.replayGain.mode.label', 'Mode')}
                </ContentItemTitle>
                <ContentItemForm>
                  <Select
                    value={replayGainType}
                    onValueChange={(value) =>
                      setReplayGainType(value as ReplayGainType)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue>
                        <span className="text-sm">
                          {t(
                            'settings.audio.replayGain.mode.' + replayGainType,
                          )}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {replayGainModes.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {t('settings.audio.replayGain.mode.' + mode)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </ContentItemForm>
              </ContentItem>

              <ContentItem>
                <ContentItemTitle>
                  {t('settings.audio.replayGain.preAmp', 'Pre-Amplification')}
                </ContentItemTitle>
                <ContentItemForm>
                  <NumericInput
                    value={replayGainPreAmp}
                    onChange={setReplayGainPreAmp}
                    min={-15}
                    max={15}
                  />
                </ContentItemForm>
              </ContentItem>

              <ContentItem>
                <ContentItemTitle
                  info={t('settings.audio.replayGain.defaultGain.info')}
                >
                  {t(
                    'settings.audio.replayGain.defaultGain.label',
                    'Default Gain',
                  )}
                </ContentItemTitle>
                <ContentItemForm>
                  <NumericInput
                    value={replayGainDefaultGain}
                    onChange={setReplayGainDefaultGain}
                    min={-10}
                    max={-1}
                  />
                </ContentItemForm>
              </ContentItem>
            </>
          )}

          {/* Crossfade toggle */}
          <ContentItem>
            <ContentItemTitle info={t('settings.player.crossfade.info')}>
              {t('settings.player.crossfade.label', 'Crossfade')}
            </ContentItemTitle>
            <ContentItemForm>
              <Switch
                checked={crossfadeEnabled}
                onCheckedChange={setCrossfadeEnabled}
              />
            </ContentItemForm>
          </ContentItem>

          <ContentItem>
            <ContentItemTitle info={t('settings.player.listeningMemory.info')}>
              {t('settings.player.listeningMemory.label', 'Listening Memory')}
            </ContentItemTitle>
            <ContentItemForm>
              <Switch
                checked={listeningMemoryEnabled}
                onCheckedChange={setListeningMemoryEnabled}
              />
            </ContentItemForm>
          </ContentItem>
        </Content>
      </Root>

      {/* Playlists */}
      <Root>
        <Header>
          <HeaderTitle>
            {t('settings.player.playlists.group', 'Playlists')}
          </HeaderTitle>
        </Header>
        <Content>
          <ContentItem>
            <ContentItemTitle>
              {t(
                'settings.player.playlists.autoImport.label',
                'Automatic Playlist Import',
              )}
            </ContentItemTitle>
            <ContentItemForm>
              <Switch
                checked={autoPlaylistImport}
                onCheckedChange={setAutoPlaylistImport}
              />
            </ContentItemForm>
          </ContentItem>
        </Content>
      </Root>

      {/* Interface */}
      <Root>
        <Header>
          <HeaderTitle>
            {t('settings.player.interface.group', 'Interface')}
          </HeaderTitle>
        </Header>
        <Content>
          <ContentItem>
            <ContentItemTitle>
              {t(
                'settings.content.sidebar.radios.section',
                'Hide radios section',
              )}
            </ContentItemTitle>
            <ContentItemForm>
              <Switch
                checked={hideRadiosSection}
                onCheckedChange={setHideRadiosSection}
                disabled={HIDE_RADIOS_SECTION}
              />
            </ContentItemForm>
          </ContentItem>

          <ContentItem>
            <ContentItemTitle>
              {t('settings.player.density.label', 'List density')}
            </ContentItemTitle>
            <ContentItemForm>
              <Select
                value={listDensity}
                onValueChange={(value) => setListDensity(value as ListDensity)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {listDensityModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {t(`settings.player.density.options.${mode}`)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </ContentItemForm>
          </ContentItem>

          <ContentItem>
            <ContentItemTitle
              info={t('settings.content.images.cacheLayer.info')}
            >
              {t('settings.player.cache.label', 'Cache Album Artwork')}
            </ContentItemTitle>
            <ContentItemForm>
              <Switch
                checked={imagesCacheLayerEnabled}
                onCheckedChange={setImagesCacheLayerEnabled}
                disabled={DISABLE_IMAGE_CACHE_TOGGLE}
              />
            </ContentItemForm>
          </ContentItem>
        </Content>
      </Root>

      {/* Desktop Features */}
      {isDesktop() && (
        <Root>
          <Header>
            <HeaderTitle>
              {t('settings.player.desktop.group', 'Desktop')}
            </HeaderTitle>
          </Header>
          <Content>
            <ContentItem>
              <ContentItemTitle>
                {t(
                  'settings.accounts.discord.enabled.label',
                  'Discord Rich Presence',
                )}
              </ContentItemTitle>
              <ContentItemForm>
                <Switch
                  checked={discord.rpcEnabled}
                  onCheckedChange={discord.setRpcEnabled}
                />
              </ContentItemForm>
            </ContentItem>

            <ContentItem>
              <ContentItemTitle info={t('settings.desktop.general.tray.info')}>
                {t('settings.player.tray.label', 'Close to System Tray')}
              </ContentItemTitle>
              <ContentItemForm>
                <Switch
                  checked={minimizeToTray}
                  onCheckedChange={setMinimizeToTray}
                />
              </ContentItemForm>
            </ContentItem>
          </Content>
        </Root>
      )}

      <EqualizerModal open={equalizerOpen} onOpenChange={setEqualizerOpen} />
    </div>
  )
}
