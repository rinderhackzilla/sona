import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()

const appIdTsPath = resolve(root, 'electron/main/core/app-id.ts')
const builderPath = resolve(root, 'electron-builder.yml')

const appIdTs = readFileSync(appIdTsPath, 'utf8')
const builderYml = readFileSync(builderPath, 'utf8')

const tsMatch = appIdTs.match(/APP_ID\s*=\s*['"]([^'"]+)['"]/)
if (!tsMatch?.[1]) {
  console.error(`[verify-app-id] Could not read APP_ID from ${appIdTsPath}`)
  process.exit(1)
}

const ymlMatch = builderYml.match(/^\s*appId:\s*([^\s#]+)\s*$/m)
if (!ymlMatch?.[1]) {
  console.error(`[verify-app-id] Could not read appId from ${builderPath}`)
  process.exit(1)
}

const appIdTsValue = tsMatch[1].trim()
const appIdYmlValue = ymlMatch[1].trim()

if (appIdTsValue !== appIdYmlValue) {
  console.error('[verify-app-id] App ID mismatch detected:')
  console.error(`  electron/main/core/app-id.ts: ${appIdTsValue}`)
  console.error(`  electron-builder.yml:        ${appIdYmlValue}`)
  console.error('Please keep both values identical to avoid Windows taskbar icon grouping issues.')
  process.exit(1)
}

console.log(`[verify-app-id] OK: ${appIdTsValue}`)
