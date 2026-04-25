export default defineNuxtPlugin(() => {
  const { isDark } = useTheme()

  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = saved ? saved === 'dark' : prefersDark

  isDark.value = dark
  document.documentElement.classList.toggle('light', !dark)
})
