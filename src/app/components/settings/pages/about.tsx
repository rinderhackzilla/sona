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
    <div>

      {/* App header row */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <AppIcon size={44} className="shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-base leading-tight">{name}</span>
            <span className="text-sm text-muted-foreground font-mono">v{version}</span>
          </div>
        </div>

        {isDesktop() && (
          <div className="flex items-center gap-3">
            {upToDate && (
              <span className="text-sm text-green-500 flex items-center gap-1.5">
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
                ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" />
                : <RefreshCw className="h-3.5 w-3.5 mr-2" />
              }
              Check for Updates
            </Button>
          </div>
        )}
      </div>

      <hr className="border-border" />

      {/* Settings import/export */}
      <div className="py-6">
        <p className="text-sm font-medium text-foreground mb-4">Settings</p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <FileUp className="h-3.5 w-3.5 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSettings}>
            <FileDown className="h-3.5 w-3.5 mr-2" />
            Export
          </Button>
        </div>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportSettings}
        />
      </div>

      <hr className="border-border" />

      {/* GitHub */}
      <div className="flex items-center justify-between py-6">
        <span className="text-sm font-medium">GitHub</span>
        <a
          href={url}
          target="_blank"
          rel="nofollow noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
        >
          {url.replace(/^https?:\/\//, '')}
        </a>
      </div>

    </div>
  )
}
