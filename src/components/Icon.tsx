type IconName =
  | 'arrow'
  | 'arrow-up'
  | 'menu'
  | 'close'
  | 'play'
  | 'pause'
  | 'volume'
  | 'volume-off'
  | 'plus'
  | 'check'
  | 'linkedin'
  | 'mail'
  | 'github'
  | 'instagram'
  | 'location'
  | 'sparkle'
  | 'external'
  | 'cube'

const paths: Record<IconName, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  'arrow-up': 'M12 19V5M6 11l6-6 6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  play: 'M8 5.5v13l11-6.5-11-6.5z',
  pause: 'M9 5v14M15 5v14',
  volume: 'M11 5 6.5 9H3v6h3.5L11 19V5zM15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10',
  'volume-off': 'M11 5 6.5 9H3v6h3.5L11 19V5zM16 10l5 4M21 10l-5 4',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 13l4 4L19 7',
  linkedin:
    'M4.5 9.5v10M4.5 5.2v.2M9.5 19.5v-5.5a3.5 3.5 0 0 1 7 0v5.5M9.5 9.5v10',
  mail: 'M3 7.5 12 13l9-5.5M3.5 6h17a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
  github:
    'M9 19c-4 1.5-4-2.5-5-3m10 5v-3.2a2.8 2.8 0 0 0-.8-2.2c2.7-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C5.5 2.4 4.5 2.7 4.5 2.7a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 3 9.1c0 4.6 2.8 5.7 5.5 6a2.8 2.8 0 0 0-.8 2.2V21',
  instagram:
    'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM17.2 6.8v.01',
  location: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  cube: 'M12 2.8 20.4 7.4v9.2L12 21.2 3.6 16.6V7.4L12 2.8zM12 12l8.4-4.6M12 12v9.2M12 12 3.6 7.4',
}

type Props = {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}

export function Icon({ name, size = 18, strokeWidth = 1.7, className }: Props) {
  const filled = name === 'play'
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}

export type { IconName }
