import { useState, useRef } from 'react'
import { RefreshCw, CheckCircle, FileDown, FileUp } from 'lucide-react'
import { toast } from 'react-toastify'
import { AppIcon } from '@/app/components/app-icon'
import { Button } from '@/app/components/ui/button'
import { useAppUpdate } from '@/store/app.store'
import { getAppInfo } from '@/utils/appName'
import { isDesktop } from '@/utils/desktop'

export function AboutPage() {
  const { name, version, url } = getAppInfo()
  const { setOpenDialog: setUpdateDialog } = useAppUpdate()
  const [isChecking, setIsChecking] = useState(false)
  const [upToDate, setUpToDate] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const handleCheckForUpdates = async () => {
    setIsChecking(true)
    setUpToDate(false)
    try {
      const info = await window.api.checkForUpdates()
      if (info?.files?.length) {
        setUpdateDialog(true)
      } else {
        setUpToDate(true)
      }
    } catch {
      toast.error('Failed to check for updates.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleExportSettings = () => {
    try {
      const raw = localStorage.getItem('app_store')
      if (!raw) {
        toast.error('No settings found to export.')
        return
      }
      const blob = new Blob([JSON.stringify(JSON.parse(raw), null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sona-settings.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export settings.')
    }
  }

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        localStorage.setItem('app_store', JSON.stringify(parsed))
        toast.success('Settings imported. Reloading...')
        setTimeout(() => window.location.reload(), 1500)
      } catch {
        toast.error('Invalid settings file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/25 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <AppIcon size={42} className="shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold leading-tight">{name}</span>
              <span className="font-mono text-sm text-muted-foreground">v{version}</span>
            </div>
          </div>

          {isDesktop() && (
            <div className="flex items-center gap-3">
              {upToDate && (
                <span className="flex items-center gap-1.5 text-sm text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  Up to date
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckForUpdates}
                disabled={isChecking}
              >
                {isChecking
                  ? <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  : <RefreshCw className="mr-2 h-3.5 w-3.5" />
                }
                Check for Updates
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/25 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Settings</p>
          <div className="flex gap-2.5">
            <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
              <FileUp className="mr-2 h-3.5 w-3.5" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSettings}>
              <FileDown className="mr-2 h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportSettings}
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card/25 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">GitHub</span>
          <a
            href={url}
            target="_blank"
            rel="nofollow noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {url.replace(/^https?:\/\//, '')}
          </a>
        </div>
      </div>

      <div className="pt-0.5">
        <p className="text-xs text-muted-foreground">
          DJ Sona icons by flaticon Freepik, justicon
        </p>
      </div>
    </div>
  )
}
