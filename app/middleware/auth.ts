export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const publicRoutes = ['/login', '/confirm']

  if (publicRoutes.includes(to.path)) {
    return
  }

  let sessionExists = false
  if (!user.value) {
    const supabase = useSupabaseClient()
    const { data } = await supabase.auth.getSession()
    if (data?.session) {
      sessionExists = true
    }
  } else {
    sessionExists = true
  }

  if (!sessionExists) {
    return navigateTo('/login')
  }
})
