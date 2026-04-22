export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/login']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
