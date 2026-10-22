import fs from 'node:fs'
import path from 'node:path'
import { assertDeveloperIdSignature, resolveApiKeyPath, run, submitAndStaple } from './notarization.mjs'

export default async function notarize(context) {
  const { electronPlatformName, appOutDir, packager } = context
  if (electronPlatformName !== 'darwin') return

  const appName = packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot notarize missing app bundle: ${appPath}`)
  }

  const profile = String(process.env.APPLE_NOTARY_PROFILE || '').trim()
  const keyId = String(process.env.APPLE_API_KEY_ID || '').trim()
  const issuer = String(process.env.APPLE_API_ISSUER || '').trim()
  const rawApiKey = process.env.APPLE_API_KEY
  if (!profile && (!rawApiKey || !keyId || !issuer)) {
    console.log(
      'Skipping notarization: APPLE_API_KEY, APPLE_API_KEY_ID, and APPLE_API_ISSUER are not fully configured.'
    )
    return
  }

  await assertDeveloperIdSignature(appPath)

  const { keyPath, cleanup } = profile ? { keyPath: '', cleanup: () => {} } : resolveApiKeyPath(rawApiKey)
  const zipPath = path.join(appOutDir, `${appName}.zip`)
  try {
    await run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', appPath, zipPath])
    const credentialArgs = profile
      ? ['--keychain-profile', profile]
      : ['--key', keyPath, '--key-id', keyId, '--issuer', issuer]
    await submitAndStaple({ submissionPath: zipPath, staplePath: appPath, credentialArgs })
  } finally {
    fs.rmSync(zipPath, { force: true })
    cleanup()
  }
}
