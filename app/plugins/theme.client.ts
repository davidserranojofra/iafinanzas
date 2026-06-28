export default defineNuxtPlugin(() => {
  const { isDark } = useTheme()

  const saved = localStorage.getItem('theme')
  const dark = saved ? saved === 'dark' : true

  isDark.value = dark
  document.documentElement.classList.toggle('light', !dark)
})
