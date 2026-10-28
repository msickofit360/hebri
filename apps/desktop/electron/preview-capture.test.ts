import assert from 'node:assert/strict'

import { test } from 'vitest'

import {
  captureOwnedPreviewContents,
  capturePreviewContents,
  mapViewportRectToImage,
  normalizeCaptureRect
} from './preview-capture'

test('capture is restricted to the owning window main frame, including after an async capture', async () => {
  const sender = { mainFrame: {} }
  const event = { sender, senderFrame: sender.mainFrame }
  let captures = 0
  let host: unknown = sender

  const guest = {
    get hostWebContents() {
      return host
    },
    isDestroyed: () => false,
    capturePage: async () => {
      captures++

      return { isEmpty: () => false, toPNG: () => Buffer.from('png') }
    }
  }

  assert.match(await captureOwnedPreviewContents(event, guest), /^data:image\/png;base64,/)
  await assert.rejects(captureOwnedPreviewContents({ ...event, senderFrame: {} }, guest))
  await assert.rejects(captureOwnedPreviewContents({ ...event, sender: { mainFrame: {} } }, guest))
  assert.equal(captures, 1)
  const pending = captureOwnedPreviewContents(event, guest)
  host = null
  await assert.rejects(pending, /owner changed/)
})

test('normalizeCaptureRect floors origin and ceils size, never zero', () => {
  assert.deepEqual(normalizeCaptureRect({ height: 10.2, width: 0.4, x: -3.2, y: 1.8 }), {
    height: 11,
    width: 1,
    x: 0,
    y: 1
  })
})

test('mapViewportRectToImage scales CSS pixels onto a DPR bitmap and clamps', () => {
  assert.deepEqual(
    mapViewportRectToImage(
      { height: 20, width: 40, x: 10, y: 8 },
      { height: 100, width: 200 },
      { height: 200, width: 400 }
    ),
    { height: 40, width: 80, x: 20, y: 16 }
  )
  assert.equal(
    mapViewportRectToImage(
      { height: 20, width: 40, x: 500, y: 8 },
      { height: 100, width: 200 },
      { height: 200, width: 400 }
    ),
    null
  )
})

test('capturePreviewContents captures the visible page then crops in bitmap space', async () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])

  const dataUrl = await capturePreviewContents(
    {
      capturePage: async rect => {
        assert.equal(rect, undefined)

        return {
          crop: mapped => {
            assert.deepEqual(mapped, { height: 40, width: 80, x: 4, y: 8 })

            return { isEmpty: () => false, toPNG: () => png }
          },
          getSize: () => ({ height: 200, width: 400 }),
          isEmpty: () => false,
          toPNG: () => {
            throw new Error('should crop first')
          }
        }
      },
      isDestroyed: () => false
    },
    { height: 20, width: 40, x: 2, y: 4 },
    { height: 100, width: 200 }
  )

  assert.equal(dataUrl, `data:image/png;base64,${png.toString('base64')}`)
})

test('capturePreviewContents keeps the visible page when the CSS rect misses the bitmap', async () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])

  const dataUrl = await capturePreviewContents(
    {
      capturePage: async () => ({
        crop: () => {
          throw new Error('should not crop an off-screen rect')
        },
        getSize: () => ({ height: 200, width: 400 }),
        isEmpty: () => false,
        toPNG: () => png
      }),
      isDestroyed: () => false
    },
    { height: 20, width: 40, x: 10, y: 800 },
    { height: 100, width: 200 }
  )

  assert.equal(dataUrl, `data:image/png;base64,${png.toString('base64')}`)
})

test('capturePreviewContents fails closed on a destroyed guest', async () => {
  await assert.rejects(
    capturePreviewContents({
      capturePage: async () => {
        throw new Error('should not run')
      },
      isDestroyed: () => true
    }),
    /gone/
  )
})
