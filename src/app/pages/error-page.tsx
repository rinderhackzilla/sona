import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { PageState } from '@/app/components/ui/page-state'
import { ROUTES } from '@/routes/routesList'

interface IError {
  status?: number
  statusText?: string
  internal?: boolean
  data?: string
}

export default function ErrorPage({ status, statusText }: IError) {
  const { t } = useTranslation()
  const routeError = useRouteError()

  let resolvedStatus = status ?? 500
  let resolvedText = statusText ?? 'Something went wrong'

  if (isRouteErrorResponse(routeError)) {
    resolvedStatus = routeError.status
    resolvedText =
      typeof routeError.data === 'string'
        ? routeError.data
        : routeError.statusText || resolvedText
  } else if (routeError instanceof Error) {
    resolvedText = routeError.message || resolvedText
  } else if (routeError && typeof routeError === 'object') {
    const maybe = routeError as IError
    resolvedStatus = maybe.status ?? resolvedStatus
    resolvedText = maybe.data ?? maybe.statusText ?? resolvedText
  }

  return (
    <PageState
      variant="error"
      title={t('states.error.title')}
      description={t('states.error.description', {
        status: resolvedStatus,
        detail: resolvedText,
      })}
      actionLabel={t('states.error.backHome')}
      onAction={() => window.location.assign(ROUTES.LIBRARY.HOME)}
    />
  )
}
