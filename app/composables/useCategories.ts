const DARK: Record<string, string> = {
  'Alimentación':  '#50fa7b',
  'Transporte':    '#8be9fd',
  'Ropa':          '#ff79c6',
  'Restaurantes':  '#ffb86c',
  'Suscripciones': '#bd93f9',
  'Salud':         '#ff5555',
  'Hogar':         '#f1fa8c',
  'Ocio':          '#bd93f9',
  'Tecnología':    '#8be9fd',
  'Otro':          '#6272a4',
}

// Matches the html.light overrides in main.css — darker/saturated for readability on light bg
const LIGHT: Record<string, string> = {
  'Alimentación':  '#2daa54',
  'Transporte':    '#3aabcc',
  'Ropa':          '#c44d96',
  'Restaurantes':  '#e07b20',
  'Suscripciones': '#7c4dce',
  'Salud':         '#e02020',
  'Hogar':         '#b5a500',
  'Ocio':          '#7c4dce',
  'Tecnología':    '#3aabcc',
  'Otro':          '#5a6890',
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Alimentación':  '🛒',
  'Transporte':    '🚗',
  'Ropa':          '👗',
  'Restaurantes':  '🍽️',
  'Suscripciones': '📺',
  'Salud':         '💊',
  'Hogar':         '🏠',
  'Ocio':          '🎮',
  'Tecnología':    '💻',
  'Otro':          '📄',
}

export function useCategories() {
  const { isDark } = useTheme()

  function getCategoryColor(categoria: string): string {
    const map = isDark.value ? DARK : LIGHT
    return map[categoria] ?? (isDark.value ? '#6272a4' : '#5a6890')
  }

  function getCategoryBg(categoria: string): string {
    // Slightly more opaque in light mode so the tint is visible on light cards
    const opacity = isDark.value ? '20' : '26'
    return getCategoryColor(categoria) + opacity
  }

  function getCategoryIcon(categoria: string): string {
    return CATEGORY_ICONS[categoria] ?? '📄'
  }

  return { getCategoryColor, getCategoryBg, getCategoryIcon }
}
