// Decodes a JWT's payload (no signature verification — that's the server's job).
// Returns the expiry time in milliseconds since epoch, or null if it can't be read.
export function getTokenExpiry(token) {
  try {
    const payloadBase64 = token.split('.')[1]
    // JWTs use base64url encoding — convert to standard base64 before decoding
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const payloadJson = atob(normalized)
    const payload = JSON.parse(payloadJson)

    if (!payload.exp) return null
    return payload.exp * 1000 // JWT 'exp' is in seconds; convert to ms
  } catch {
    return null
  }
}