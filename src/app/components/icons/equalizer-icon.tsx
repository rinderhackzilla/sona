interface EqualizerIconProps {
  size?: number
  className?: string
}

export function EqualizerIcon({ size = 20, className }: EqualizerIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="3" y1="12" x2="3" y2="20" />
      <line x1="7" y1="8" x2="7" y2="20" />
      <line x1="11" y1="4" x2="11" y2="20" />
      <line x1="15" y1="10" x2="15" y2="20" />
      <line x1="19" y1="6" x2="19" y2="20" />
      <circle cx="3" cy="12" r="1.5" fill="currentColor" />
      <circle cx="7" cy="8" r="1.5" fill="currentColor" />
      <circle cx="11" cy="4" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <circle cx="19" cy="6" r="1.5" fill="currentColor" />
    </svg>
  )
}
