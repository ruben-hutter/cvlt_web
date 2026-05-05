export type NavSubLink = {
  href: string
  label: string
}

export const VENTO_SECTION_IDS = [
  'stazioni',
  'pressione',
  'laghi',
  'radiosondaggi',
] as const

export const VENTO_PRESSURE_SECTION_IDS = ['pressione'] as const

export const VENTO_SUB_LINKS = [
  { href: '/vento#stazioni', label: 'Stazioni' },
  { href: '/vento#pressione', label: 'Pressione' },
  { href: '/vento#laghi', label: 'Laghi' },
  { href: '/vento#radiosondaggi', label: 'Radiosondaggi' },
] as const satisfies readonly NavSubLink[]

export const GARE_SUB_LINKS = [
  { href: '/gare#ccc', label: 'CCC' },
  { href: '/gare#hike-and-fly', label: 'Hike & Fly' },
  { href: '/gare#regio-sud', label: 'Regio Sud' },
] as const satisfies readonly NavSubLink[]

export const INFO_VOLO_SUB_LINKS = [
  { href: '/info-volo#spazio-aereo', label: 'Spazio aereo' },
  { href: '/info-volo#meteo-vento', label: 'Meteo & Vento' },
  { href: '/info-volo#link-meteo', label: 'Link meteo' },
  { href: '/info-volo#webcam', label: 'Webcam' },
  { href: '/info-volo#link-utili', label: 'Link utili' },
] as const satisfies readonly NavSubLink[]
