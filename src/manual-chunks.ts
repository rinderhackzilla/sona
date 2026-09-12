export function createManualChunks(id: string): string | undefined {
  const normalizedId = id.replace(/\\/g, '/')

  if (!normalizedId.includes('/node_modules/')) {
    return undefined
  }

  // React core
  if (
    normalizedId.includes('/node_modules/react/') ||
    normalizedId.includes('/node_modules/react-dom/') ||
    normalizedId.includes('/node_modules/scheduler/')
  ) {
    return 'vendor-react'
  }

  // Router
  if (
    normalizedId.includes('/node_modules/react-router/') ||
    normalizedId.includes('/node_modules/react-router-dom/') ||
    normalizedId.includes('/node_modules/@remix-run/router/')
  ) {
    return 'vendor-router'
  }

  // UI primitives, floating-ui & dialog/command ecosystem
  if (
    normalizedId.includes('/node_modules/@radix-ui/') ||
    normalizedId.includes('/node_modules/@floating-ui/') ||
    normalizedId.includes('/node_modules/aria-hidden/') ||
    normalizedId.includes('/node_modules/react-remove-scroll') ||
    normalizedId.includes('/node_modules/cmdk/') ||
    normalizedId.includes('/node_modules/vaul/')
  ) {
    return 'vendor-ui'
  }

  // TanStack (React Query & Virtual / Table)
  if (normalizedId.includes('/node_modules/@tanstack/')) {
    return 'vendor-tanstack'
  }

  // Icons
  if (normalizedId.includes('/node_modules/lucide-react/')) {
    return 'vendor-icons'
  }

  // Forms & validation
  if (
    normalizedId.includes('/node_modules/react-hook-form/') ||
    normalizedId.includes('/node_modules/zod/') ||
    normalizedId.includes('/node_modules/@hookform/resolvers/')
  ) {
    return 'vendor-forms'
  }

  // Internationalization
  if (
    normalizedId.includes('/node_modules/i18next/') ||
    normalizedId.includes('/node_modules/react-i18next/') ||
    normalizedId.includes('/node_modules/i18next-browser-languagedetector/')
  ) {
    return 'vendor-i18n'
  }

  // Date/Time
  if (normalizedId.includes('/node_modules/dayjs/')) {
    return 'vendor-dayjs'
  }

  // Crypto
  if (normalizedId.includes('/node_modules/crypto-js/')) {
    return 'vendor-crypto'
  }

  // Audio context
  if (normalizedId.includes('/node_modules/standardized-audio-context/')) {
    return 'vendor-audio'
  }

  // Markdown ecosystem
  if (
    normalizedId.includes('/node_modules/react-markdown/') ||
    normalizedId.includes('/node_modules/remark-') ||
    normalizedId.includes('/node_modules/micromark') ||
    normalizedId.includes('/node_modules/mdast-') ||
    normalizedId.includes('/node_modules/unist-') ||
    normalizedId.includes('/node_modules/unified') ||
    normalizedId.includes('/node_modules/vfile') ||
    normalizedId.includes('/node_modules/property-information') ||
    normalizedId.includes('/node_modules/hast-') ||
    normalizedId.includes('/node_modules/bail') ||
    normalizedId.includes('/node_modules/trough') ||
    normalizedId.includes('/node_modules/is-plain-obj') ||
    normalizedId.includes('/node_modules/zwitch') ||
    normalizedId.includes('/node_modules/character-entities') ||
    normalizedId.includes('/node_modules/decode-named-character-reference')
  ) {
    return 'vendor-markdown'
  }

  // Drag & drop
  if (normalizedId.includes('/node_modules/@dnd-kit/')) {
    return 'vendor-dnd'
  }

  // Carousel
  if (normalizedId.includes('/node_modules/embla-carousel')) {
    return 'vendor-carousel'
  }

  // State management
  if (
    normalizedId.includes('/node_modules/zustand/') ||
    normalizedId.includes('/node_modules/immer/') ||
    normalizedId.includes('/node_modules/idb-keyval/')
  ) {
    return 'vendor-state'
  }

  // Styling & helpers
  if (
    normalizedId.includes('/node_modules/react-toastify/') ||
    normalizedId.includes('/node_modules/fast-average-color/') ||
    normalizedId.includes('/node_modules/tailwind-merge/') ||
    normalizedId.includes('/node_modules/clsx/') ||
    normalizedId.includes('/node_modules/class-variance-authority/')
  ) {
    return 'vendor-styling'
  }

  // Utility
  if (normalizedId.includes('/node_modules/lodash/')) {
    return 'vendor-lodash'
  }

  return 'vendor'
}
