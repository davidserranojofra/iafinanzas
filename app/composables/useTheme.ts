export const useTheme = () => {
  const isDark = useState('theme-is-dark', () => true)

  function apply(dark: boolean) {
    isDark.value = dark
    if (import.meta.client) {
      document.documentElement.classList.toggle('light', !dark)
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    }
  }

  return {
    isDark,
    setDark: () => apply(true),
    setLight: () => apply(false),
  }
}
