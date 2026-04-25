export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/login', '/confirm']

  if (!user.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
