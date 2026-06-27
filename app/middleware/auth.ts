export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/login', '/confirm']

  if (publicRoutes.includes(to.path)) {
    return
  }

  if (!user.value) {
    const supabase = useSupabaseClient()
    await supabase.auth.getSession()
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})
