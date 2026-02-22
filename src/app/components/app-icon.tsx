import { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type AppIconProps = ImgHTMLAttributes<HTMLImageElement> & {
  size?: number
}

export function AppIcon({ size = 48, className, ...props }: AppIconProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo/suno_logo.png`}
      alt="Sona"
      width={size}
      height={size}
      className={cn('rounded-[22%] object-cover', className)}
      {...props}
    />
  )
}
