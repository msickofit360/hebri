import { existsSync } from 'node:fs'
import { resolveApiKeyPath, submitAndStaple } from './notarization.mjs'

async function main() {
  const artifactPath = process.argv[2]
  if (!artifactPath || !existsSync(artifactPath)) {
    throw new Error(`Missing artifact to notarize: ${artifactPath || '(none)'}`)
  }

  const profile = String(process.env.APPLE_NOTARY_PROFILE || '').trim()
  if (profile) {
    await submitAndStaple({
      submissionPath: artifactPath,
      staplePath: artifactPath,
      credentialArgs: ['--keychain-profile', profile]
    })
    return
  }

  const keyId = String(process.env.APPLE_API_KEY_ID || '').trim()
  const issuer = String(process.env.APPLE_API_ISSUER || '').trim()
  const rawApiKey = process.env.APPLE_API_KEY
  if (!rawApiKey || !keyId || !issuer) {
    throw new Error('APPLE_API_KEY, APPLE_API_KEY_ID, and APPLE_API_ISSUER are required')
  }

  const { keyPath, cleanup } = resolveApiKeyPath(rawApiKey)
  try {
    await submitAndStaple({
      submissionPath: artifactPath,
      staplePath: artifactPath,
      credentialArgs: ['--key', keyPath, '--key-id', keyId, '--issuer', issuer]
    })
  } finally {
    cleanup()
  }
}

main().catch(() => {
  console.error('Notarization failed. Check configuration and command output in secure CI logs.')
  process.exit(1)
})
