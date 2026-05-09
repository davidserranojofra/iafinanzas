export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const { inicializarCola, sincronizarCola } = useColaTickets()

  void inicializarCola()

  supabase.auth.onAuthStateChange((_evento, sesion) => {
    if (sesion && navigator.onLine) {
      void sincronizarCola()
    }
  })
})
