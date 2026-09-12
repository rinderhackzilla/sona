import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

export function useDownload() {
  const { t } = useTranslation()

  const started = useCallback(() => {
    toast(t('downloads.started'), {
      autoClose: false,
      type: 'default',
      isLoading: true,
      toastId: 'download',
    })
  }, [t])

  function downloadBrowser(url: string, id = '') {
    const element = document.createElement('a')
    element.setAttribute('href', url)
    element.setAttribute('target', '_blank')
    element.setAttribute('download', id)

    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast.success(t('downloads.started'))
  }

  function downloadDesktop(url: string, id: string) {
    started()
    window.api.downloadFile({
      url,
      fileId: id,
    })
  }

  return {
    downloadBrowser,
    downloadDesktop,
  }
}
