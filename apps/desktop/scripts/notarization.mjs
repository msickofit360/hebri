import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'

export function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        // Arguments may contain Apple credential identifiers and key paths.
        reject(new Error(`${command} failed: ${stderr?.trim() || stdout?.trim() || error.message}`))
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

function inlineKeyLooksValid(value) {
  return value.includes('BEGIN PRIVATE KEY') && value.includes('END PRIVATE KEY')
}

export function resolveApiKeyPath(rawValue) {
  const value = String(rawValue || '').trim()
  if (!value) return { keyPath: '', cleanup: () => {} }

  if (fs.existsSync(value)) {
    return { keyPath: value, cleanup: () => {} }
  }

  if (!inlineKeyLooksValid(value)) {
    throw new Error('APPLE_API_KEY must be a file path or inline .p8 key content')
  }

  const tempPath = path.join(os.tmpdir(), `hebri-notary-${Date.now()}-${process.pid}.p8`)
  fs.writeFileSync(tempPath, value, { encoding: 'utf8', mode: 0o600 })
  return {
    keyPath: tempPath,
    cleanup: () => fs.rmSync(tempPath, { force: true })
  }
}

export function requireAcceptedNotarization(stdout) {
  let result
  try {
    result = JSON.parse(String(stdout || ''))
  } catch {
    throw new Error('Apple notarization returned an unreadable response')
  }

  if (result?.status !== 'Accepted') {
    const status = result?.status || 'unknown'
    const id = result?.id ? ` (submission ${result.id})` : ''
    throw new Error(`Apple notarization was not accepted: ${status}${id}`)
  }

  return result
}

export async function assertDeveloperIdSignature(appPath, runCommand = run) {
  await runCommand('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath])
  const { stdout, stderr } = await runCommand('codesign', ['-dv', '--verbose=4', appPath])
  const details = `${stdout || ''}\n${stderr || ''}`

  if (!/^Authority=Developer ID Application:/m.test(details)) {
    throw new Error('Refusing to notarize an app that is not signed with a Developer ID Application certificate')
  }
  if (!/^Identifier=com\.synapsek\.hebri$/m.test(details)) {
    throw new Error('Refusing to notarize an app whose signing identifier is not com.synapsek.hebri')
  }
}

export async function stapleWithRetry(
  artifactPath,
  {
    runCommand = run,
    delay = ms => new Promise(resolve => setTimeout(resolve, ms)),
    attempts = 6,
    delayMs = 15_000
  } = {}
) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await runCommand('xcrun', ['stapler', 'staple', '-v', artifactPath])
      await runCommand('xcrun', ['stapler', 'validate', artifactPath])
      return
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      console.log(`Apple ticket is not available yet; retrying stapling (${attempt}/${attempts})...`)
      await delay(delayMs)
    }
  }
  throw lastError
}

export async function submitAndStaple({ submissionPath, staplePath, credentialArgs, runCommand = run }) {
  const { stdout } = await runCommand('xcrun', [
    'notarytool',
    'submit',
    submissionPath,
    ...credentialArgs,
    '--wait',
    '--output-format',
    'json'
  ])
  const result = requireAcceptedNotarization(stdout)
  console.log(`Apple notarization accepted (submission ${result.id || 'unknown'})`)
  await stapleWithRetry(staplePath, { runCommand })
}
