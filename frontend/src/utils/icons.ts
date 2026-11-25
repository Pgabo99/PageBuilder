/**
 * A szerkesztőben, az előnézetben és a publikált oldalon használható előre definiált ikonok.
 * Forrás: Feather (https://feathericons.com, MIT, Copyright (c) 2013-2023 Cole Bemis), lásd
 * docs/third-party-licenses.md. A backend `Icons.php` ugyanezt a készletet tartalmazza; a két oldal
 * tesztje azonos ellenőrző összeget vár. Az elemek leírók (nem HTML), így a megjelenítés `v-html` nélkül történik.
 */
export type IconElement = readonly [tag: string, attrs: Readonly<Record<string, string>>]

export interface IconDefinition {
  name: string
  label: string
  elements: readonly IconElement[]
}

export const icons: readonly IconDefinition[] = [
  {
    name: 'star',
    label: 'Csillag',
    elements: [
      [
        'polygon',
        {
          points:
            '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2',
        },
      ],
    ],
  },
  {
    name: 'heart',
    label: 'Szív',
    elements: [
      [
        'path',
        {
          d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
        },
      ],
    ],
  },
  {
    name: 'check-circle',
    label: 'Pipa',
    elements: [
      ['path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }],
      ['polyline', { points: '22 4 12 14.01 9 11.01' }],
    ],
  },
  {
    name: 'mail',
    label: 'Levél',
    elements: [
      [
        'path',
        { d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' },
      ],
      ['polyline', { points: '22,6 12,13 2,6' }],
    ],
  },
  {
    name: 'phone',
    label: 'Telefon',
    elements: [
      [
        'path',
        {
          d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
        },
      ],
    ],
  },
  {
    name: 'map-pin',
    label: 'Helyjelölő',
    elements: [
      ['path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }],
      ['circle', { cx: '12', cy: '10', r: '3' }],
    ],
  },
  {
    name: 'clock',
    label: 'Óra',
    elements: [
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['polyline', { points: '12 6 12 12 16 14' }],
    ],
  },
  {
    name: 'calendar',
    label: 'Naptár',
    elements: [
      ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }],
      ['line', { x1: '16', y1: '2', x2: '16', y2: '6' }],
      ['line', { x1: '8', y1: '2', x2: '8', y2: '6' }],
      ['line', { x1: '3', y1: '10', x2: '21', y2: '10' }],
    ],
  },
  {
    name: 'user',
    label: 'Felhasználó',
    elements: [
      ['path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }],
      ['circle', { cx: '12', cy: '7', r: '4' }],
    ],
  },
  {
    name: 'users',
    label: 'Felhasználók',
    elements: [
      ['path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }],
      ['circle', { cx: '9', cy: '7', r: '4' }],
      ['path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }],
      ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
    ],
  },
  {
    name: 'home',
    label: 'Otthon',
    elements: [
      ['path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }],
      ['polyline', { points: '9 22 9 12 15 12 15 22' }],
    ],
  },
  {
    name: 'settings',
    label: 'Beállítások',
    elements: [
      ['circle', { cx: '12', cy: '12', r: '3' }],
      [
        'path',
        {
          d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
        },
      ],
    ],
  },
  {
    name: 'shield',
    label: 'Pajzs',
    elements: [['path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }]],
  },
  {
    name: 'lock',
    label: 'Zár',
    elements: [
      ['rect', { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' }],
      ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' }],
    ],
  },
  {
    name: 'zap',
    label: 'Villám',
    elements: [['polygon', { points: '13 2 3 14 12 14 11 22 21 10 12 10 13 2' }]],
  },
  {
    name: 'globe',
    label: 'Földgömb',
    elements: [
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['line', { x1: '2', y1: '12', x2: '22', y2: '12' }],
      [
        'path',
        {
          d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
        },
      ],
    ],
  },
  {
    name: 'info',
    label: 'Infó',
    elements: [
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['line', { x1: '12', y1: '16', x2: '12', y2: '12' }],
      ['line', { x1: '12', y1: '8', x2: '12.01', y2: '8' }],
    ],
  },
  {
    name: 'help-circle',
    label: 'Kérdőjel',
    elements: [
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }],
      ['line', { x1: '12', y1: '17', x2: '12.01', y2: '17' }],
    ],
  },
  {
    name: 'award',
    label: 'Kitüntetés',
    elements: [
      ['circle', { cx: '12', cy: '8', r: '7' }],
      ['polyline', { points: '8.21 13.89 7 23 12 20 17 23 15.79 13.88' }],
    ],
  },
  {
    name: 'gift',
    label: 'Ajándék',
    elements: [
      ['polyline', { points: '20 12 20 22 4 22 4 12' }],
      ['rect', { x: '2', y: '7', width: '20', height: '5' }],
      ['line', { x1: '12', y1: '22', x2: '12', y2: '7' }],
      ['path', { d: 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z' }],
      ['path', { d: 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z' }],
    ],
  },
]

/**
 * Közösségi platformok márkaikonjai (Feather v4.29.2, MIT): a `social` komponens használja, az
 * ikonválasztó `icons` készletétől külön. A backend `Icons::BRAND_MARKUP` ugyanezt tartalmazza.
 */
export const brandIcons: readonly IconDefinition[] = [
  {
    name: 'facebook',
    label: 'Facebook',
    elements: [
      ['path', { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' }],
    ],
  },
  {
    name: 'instagram',
    label: 'Instagram',
    elements: [
      ['rect', { x: '2', y: '2', width: '20', height: '20', rx: '5', ry: '5' }],
      ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }],
      ['line', { x1: '17.5', y1: '6.5', x2: '17.51', y2: '6.5' }],
    ],
  },
  {
    name: 'twitter',
    label: 'Twitter / X',
    elements: [
      [
        'path',
        {
          d: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z',
        },
      ],
    ],
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    elements: [
      [
        'path',
        { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' },
      ],
      ['rect', { x: '2', y: '9', width: '4', height: '12' }],
      ['circle', { cx: '4', cy: '4', r: '2' }],
    ],
  },
  {
    name: 'youtube',
    label: 'YouTube',
    elements: [
      [
        'path',
        {
          d: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z',
        },
      ],
      ['polygon', { points: '9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02' }],
    ],
  },
  {
    name: 'github',
    label: 'GitHub',
    elements: [
      [
        'path',
        {
          d: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
        },
      ],
    ],
  },
  {
    name: 'twitch',
    label: 'Twitch',
    elements: [['path', { d: 'M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7' }]],
  },
  {
    name: 'gitlab',
    label: 'GitLab',
    elements: [
      [
        'path',
        {
          d: 'M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z',
        },
      ],
    ],
  },
]

export const brandIconNames: readonly string[] = brandIcons.map((icon) => icon.name)

export function findBrandIcon(name: unknown): IconDefinition | undefined {
  return brandIcons.find((icon) => icon.name === name)
}

export const iconNames: readonly string[] = icons.map((icon) => icon.name)

export function isIconName(value: unknown): value is string {
  return typeof value === 'string' && iconNames.includes(value)
}

export function findIcon(name: unknown): IconDefinition | undefined {
  return icons.find((icon) => icon.name === name)
}

/** Az ikon kanonikus SVG-belseje (a backend `Icons::markup()` formátuma); az egyezés ellenőrzéséhez. */
export function iconMarkup(icon: IconDefinition): string {
  return icon.elements
    .map(([tag, attrs]) => {
      const list = Object.entries(attrs)
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('')
      return `<${tag}${list}/>`
    })
    .join('')
}
