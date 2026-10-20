/**
 * End-to-end encryption primitives for Hebri team chat.
 *
 * Identity keys use ECDH P-256. A per-room AES-256-GCM key encrypts message
 * content and is wrapped separately for each member using an ECDH secret fed
 * through HKDF-SHA-256. Private keys and plaintext never leave the renderer.
 */

const ECDH_CURVE = 'P-256' as const
const AES_LENGTH = 256 as const
const HKDF_CONTEXT = new TextEncoder().encode('hebri-team-chat-v1')

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('')

  return btoa(binary)
}

function base64ToArrayBuffer(value: string): ArrayBuffer {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes.buffer
}

export async function keyFingerprint(jwk: JsonWebKey): Promise<string> {
  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y })
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))

  return arrayBufferToBase64(hash).slice(0, 12)
}

export interface TeamIdentity {
  name: string
  publicKey: JsonWebKey
  privateKey: JsonWebKey
  created: number
}

export async function generateTeamIdentity(name: string): Promise<TeamIdentity> {
  const keyPair = (await globalThis.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: ECDH_CURVE },
    true,
    ['deriveBits']
  )) as CryptoKeyPair

  return {
    name: name || 'Hebri user',
    publicKey: await globalThis.crypto.subtle.exportKey('jwk', keyPair.publicKey),
    privateKey: await globalThis.crypto.subtle.exportKey('jwk', keyPair.privateKey),
    created: Date.now()
  }
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: ECDH_CURVE }, true, [])
}

export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: ECDH_CURVE },
    false,
    ['deriveBits']
  )
}

export async function generateRoomKey(): Promise<CryptoKey> {
  return globalThis.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function importRoomKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: AES_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function exportRoomKey(key: CryptoKey): Promise<ArrayBuffer> {
  return globalThis.crypto.subtle.exportKey('raw', key)
}

async function deriveWrappingKey(myPrivateKey: CryptoKey, peerJwk: JsonWebKey): Promise<CryptoKey> {
  const peerPublicKey = await importPublicKey(peerJwk)

  const sharedSecret = await globalThis.crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    myPrivateKey,
    256
  )

  const hkdfKey = await globalThis.crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey'])

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: HKDF_CONTEXT
    },
    hkdfKey,
    { name: 'AES-GCM', length: AES_LENGTH },
    false,
    ['wrapKey', 'unwrapKey']
  )
}

export interface RoomKeyEnvelope {
  forKey: string
  encrypted: string
  iv: string
}

export interface RoomInvite {
  name: string
  roomId: string
  fromKey: JsonWebKey
  envelope: RoomKeyEnvelope
}

export async function createRoomInvite(
  roomKey: CryptoKey,
  roomName: string,
  roomId: string,
  myPrivateKey: CryptoKey,
  myPublicJwk: JsonWebKey,
  peerJwk: JsonWebKey
): Promise<RoomInvite> {
  const wrappingKey = await deriveWrappingKey(myPrivateKey, peerJwk)
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await globalThis.crypto.subtle.wrapKey('raw', roomKey, wrappingKey, {
    name: 'AES-GCM',
    iv
  })

  return {
    name: roomName,
    roomId,
    fromKey: myPublicJwk,
    envelope: {
      forKey: await keyFingerprint(peerJwk),
      encrypted: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv.buffer)
    }
  }
}

export async function acceptRoomInvite(invite: RoomInvite, myPrivateKey: CryptoKey): Promise<CryptoKey> {
  const wrappingKey = await deriveWrappingKey(myPrivateKey, invite.fromKey)

  return globalThis.crypto.subtle.unwrapKey(
    'raw',
    base64ToArrayBuffer(invite.envelope.encrypted),
    wrappingKey,
    { name: 'AES-GCM', iv: base64ToArrayBuffer(invite.envelope.iv) },
    { name: 'AES-GCM', length: AES_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export interface EncryptedMessage {
  c: string
  iv: string
}

export async function encryptMessage(text: string, roomKey: CryptoKey): Promise<EncryptedMessage> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    roomKey,
    new TextEncoder().encode(text)
  )

  return { c: arrayBufferToBase64(ciphertext), iv: arrayBufferToBase64(iv.buffer) }
}

export async function decryptMessage(encrypted: EncryptedMessage, roomKey: CryptoKey): Promise<string> {
  const plaintext = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(encrypted.iv) },
    roomKey,
    base64ToArrayBuffer(encrypted.c)
  )

  return new TextDecoder().decode(plaintext)
}
