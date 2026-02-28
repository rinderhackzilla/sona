import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Button } from '@/app/components/ui/button'
import { ROUTES } from '@/routes/routesList'

interface IError {
  status?: number
  statusText?: string
  internal?: boolean
  data?: string
}

export default function ErrorPage({ status, statusText }: IError) {
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
    <div className="w-full h-content flex flex-col justify-center items-center">
      <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
        Oops!
      </h1>

      <p className="leading-7 text-left mt-6">
        Status Code:{' '}
        <strong className="font-semibold">
          {resolvedStatus}
        </strong>
      </p>
      <p className="leading-7 mt-2 text-left">
        Description:{' '}
        <strong className="font-semibold">
          {resolvedText}
        </strong>
      </p>

      <Link to={ROUTES.LIBRARY.HOME}>
        <Button className="mt-6">Back to home</Button>
      </Link>
    </div>
  )
}
