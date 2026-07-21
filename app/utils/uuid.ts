/**
 * Genera un UUID v4 compatible tanto en contextos seguros (HTTPS, localhost) 
 * como en contextos no seguros (HTTP por IP local para pruebas en móviles).
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback clásico RFC4122 para contextos no seguros
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
