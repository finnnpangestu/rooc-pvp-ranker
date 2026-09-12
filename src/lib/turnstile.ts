export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  // Allow bypass in test environment or if explicitly skipped
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_TURNSTILE === 'true') {
    return true
  }

  const secretKey =
    process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAExaPaawL7yEQrXvtMRHQY0J1qc'

  // Jika token kosong, langsung tolak
  if (!token) {
    console.warn('[turnstile] No token provided in submission')
    return false
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const outcome = await res.json()
    if (!outcome.success) {
      console.warn('[turnstile] Verification failed:', outcome['error-codes'])
    }
    return outcome.success === true
  } catch (error) {
    console.error('[turnstile] API verification error:', error)
    return false
  }
}
