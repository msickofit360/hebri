import { describe, expect, it, vi } from 'vitest'
import { assertDeveloperIdSignature, requireAcceptedNotarization, stapleWithRetry } from './notarization.mjs'

describe('macOS notarization', () => {
  it('accepts only a completed Apple notarization result', () => {
    expect(requireAcceptedNotarization('{"id":"submission-id","status":"Accepted"}')).toEqual({
      id: 'submission-id',
      status: 'Accepted'
    })
    expect(() => requireAcceptedNotarization('{"id":"submission-id","status":"Invalid"}')).toThrow(
      'Apple notarization was not accepted: Invalid'
    )
  })

  it('requires the Hebri Developer ID signature and retries delayed tickets', async () => {
    const signatureRun = vi.fn().mockResolvedValueOnce({ stdout: '', stderr: '' }).mockResolvedValueOnce({
      stdout: '',
      stderr: 'Identifier=com.synapsek.hebri\nAuthority=Developer ID Application: Synapsek Labs Pty Ltd (PW62A82X6W)'
    })
    await expect(assertDeveloperIdSignature('/tmp/Hebri.app', signatureRun)).resolves.toBeUndefined()

    const unsignedRun = vi
      .fn()
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: 'Identifier=Electron' })
    await expect(assertDeveloperIdSignature('/tmp/Hebri.app', unsignedRun)).rejects.toThrow(
      'not signed with a Developer ID Application certificate'
    )

    const stapleRun = vi
      .fn()
      .mockRejectedValueOnce(new Error('ticket unavailable'))
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
    const delay = vi.fn().mockResolvedValue(undefined)
    await stapleWithRetry('/tmp/Hebri.app', { runCommand: stapleRun, delay, attempts: 2, delayMs: 1 })
    expect(delay).toHaveBeenCalledOnce()
    expect(stapleRun).toHaveBeenLastCalledWith('xcrun', ['stapler', 'validate', '/tmp/Hebri.app'])
  })
})
