import { CompactEncrypt, compactDecrypt } from 'jose'
import { SsoError } from './security.js'

export function tokenEncryption(encryptionKey, product) {
    const key = Buffer.from(encryptionKey, 'base64url')
    if (key.length !== 32) throw new SsoError(503, 'Invalid session encryption configuration.', 'sso_configuration')
    return {
        async seal(record) {
            return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(record)))
                .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', typ: 'icraft-session+jwe', product })
                .encrypt(key)
        },
        async open(ciphertext) {
            try {
                const { plaintext, protectedHeader } = await compactDecrypt(ciphertext, key, { keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] })
                if (protectedHeader.typ !== 'icraft-session+jwe' || protectedHeader.product !== product) throw Error('Invalid envelope')
                return JSON.parse(new TextDecoder().decode(plaintext))
            } catch { throw new SsoError(503, 'Stored session is unavailable.', 'session_storage') }
        },
    }
}
