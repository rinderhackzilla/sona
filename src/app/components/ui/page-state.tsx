import { AlertCircle, Inbox } from 'lucide-react'
import { ReactNode } from 'react'
import { Button } from '@/app/components/ui/button'
import { cn } from '@/lib/utils'

interface PageStateProps {
  variant?: 'empty' | 'error'
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
  className?: string
}

export function PageState({
  variant = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: PageStateProps) {
  const defaultIcon =
    variant === 'error' ? (
      <AlertCircle className="h-5 w-5 text-destructive" />
    ) : (
      <Inbox className="h-5 w-5 text-muted-foreground" />
    )

  return (
    <div
      className={cn(
        'flex min-h-[240px] w-full items-center justify-center px-5 py-8',
        className,
      )}
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/30 p-6 text-center">
        <div className="rounded-full border border-border/60 bg-background/70 p-2.5">
          {icon ?? defaultIcon}
        </div>
        <h2 className="text-lg font-semibold leading-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button
            variant={variant === 'error' ? 'destructive' : 'outline'}
            size="sm"
            className="mt-1"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

interface PageLoadingProps {
  label: string
  className?: string
}

export function PageLoading({ label, className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        'flex min-h-[220px] w-full items-center justify-center px-5 py-8',
        className,
      )}
    >
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/30 px-5 py-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
    </div>
  )
}
