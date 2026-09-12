import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { isDesktop } from '@/utils/desktop'
import { logger } from '@/utils/logger'

export function DownloadObserver() {
  const { t } = useTranslation()

  useEffect(() => {
    if (!isDesktop()) return

    window.api.downloadCompletedListener((_fileId) => {
      toast.update('download', {
        render: t('downloads.completed'),
        type: 'success',
        autoClose: 5000,
        isLoading: false,
      })
    })

    window.api.downloadFailedListener((fileId) => {
      logger.error('[DownloadObserver] - Failed to download fileId:', fileId)
      toast.update('download', {
        render: t('downloads.failed'),
        type: 'error',
        autoClose: 5000,
        isLoading: false,
      })
    })
  }, [t])

  return null
}
