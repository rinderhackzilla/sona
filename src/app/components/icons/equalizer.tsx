export function EqualizerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <rect x="2" y="8" width="2" height="8" rx="1" />
      <rect x="6" y="4" width="2" height="16" rx="1" />
      <rect x="10" y="2" width="2" height="20" rx="1" />
      <rect x="14" y="4" width="2" height="16" rx="1" />
      <rect x="18" y="8" width="2" height="8" rx="1" />
    </svg>
  )
}
