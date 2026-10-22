import { describe, expect, it, vi } from 'vitest'
import {
  assertDeveloperIdSignature,
  requireAcceptedNotarization,
  requireNotarizationSubmission,
  stapleWithRetry,
  submitAndStaple,
  waitForAcceptedNotarization
} from './notarization.mjs'

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

  it('requires Apple to return a submission ID', () => {
    expect(requireNotarizationSubmission('{"id":"submission-id","message":"Successfully uploaded file"}')).toEqual({
      id: 'submission-id',
      message: 'Successfully uploaded file'
    })
    expect(() => requireNotarizationSubmission('{"message":"missing id"}')).toThrow(
      'Apple notarization submission did not return a submission ID'
    )
  })

  it('reconnects while polling the same submission instead of uploading it again', async () => {
    const statusRun = vi
      .fn()
      .mockRejectedValueOnce(new Error('The Internet connection appears to be offline'))
      .mockResolvedValueOnce({ stdout: '{"id":"submission-id","status":"In Progress"}', stderr: '' })
      .mockResolvedValueOnce({ stdout: '{"id":"submission-id","status":"Accepted"}', stderr: '' })
    const delay = vi.fn().mockResolvedValue(undefined)

    await expect(
      waitForAcceptedNotarization('submission-id', ['--keychain-profile', 'hebri'], {
        runCommand: statusRun,
        delay,
        attempts: 3,
        delayMs: 1
      })
    ).resolves.toEqual({ id: 'submission-id', status: 'Accepted' })

    expect(delay).toHaveBeenCalledTimes(2)
    expect(statusRun).toHaveBeenCalledTimes(3)
    expect(statusRun).toHaveBeenLastCalledWith('xcrun', [
      'notarytool',
      'info',
      'submission-id',
      '--keychain-profile',
      'hebri',
      '--output-format',
      'json'
    ])
  })

  it('fails immediately when Apple rejects a submission', async () => {
    const statusRun = vi.fn().mockResolvedValue({ stdout: '{"id":"submission-id","status":"Invalid"}', stderr: '' })
    const delay = vi.fn().mockResolvedValue(undefined)

    await expect(
      waitForAcceptedNotarization('submission-id', ['--keychain-profile', 'hebri'], {
        runCommand: statusRun,
        delay,
        attempts: 3,
        delayMs: 1
      })
    ).rejects.toThrow('Apple notarization was not accepted: Invalid')

    expect(statusRun).toHaveBeenCalledOnce()
    expect(delay).not.toHaveBeenCalled()
  })

  it('submits once, polls by ID, then staples the accepted application', async () => {
    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: '{"id":"submission-id","message":"Successfully uploaded file"}', stderr: '' })
      .mockResolvedValueOnce({ stdout: '{"id":"submission-id","status":"Accepted"}', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' })

    await submitAndStaple({
      submissionPath: '/tmp/Hebri.zip',
      staplePath: '/tmp/Hebri.app',
      credentialArgs: ['--keychain-profile', 'hebri'],
      runCommand,
      pollOptions: { delay: vi.fn(), attempts: 1, delayMs: 1 },
      stapleOptions: { delay: vi.fn(), attempts: 1, delayMs: 1 }
    })

    expect(runCommand).toHaveBeenCalledTimes(4)
    expect(runCommand.mock.calls[0]).toEqual([
      'xcrun',
      ['notarytool', 'submit', '/tmp/Hebri.zip', '--keychain-profile', 'hebri', '--output-format', 'json']
    ])
    expect(runCommand.mock.calls[1][1]).toContain('submission-id')
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
