import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packageJsonPath = path.join(__dirname, 'package.json')

try {
  const fileContent = fs.readFileSync(packageJsonPath, 'utf8')
  const pkg = JSON.parse(fileContent)

  const version = pkg.version || '0.1.0'
  const parts = version.split('.')
  if (parts.length === 3) {
    const patch = parseInt(parts[2], 10)
    if (!isNaN(patch)) {
      parts[2] = (patch + 1).toString()
      pkg.version = parts.join('.')
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
      console.log(`[bump-version] Versión incrementada a v${pkg.version}`)
    } else {
      console.error(`[bump-version] El patch de versión no es un número: ${parts[2]}`)
    }
  } else {
    console.error(`[bump-version] Formato de versión inválido en package.json: ${version}`)
  }
} catch (error) {
  console.error('[bump-version] Error al actualizar la versión:', error)
}
