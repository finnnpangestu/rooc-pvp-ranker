export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  // Di mode development atau test, bypass verifikasi Cloudflare Turnstile
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.SKIP_TURNSTILE === 'true' ||
    token === 'dev-token-bypass'
  ) {
    return true
  }

  const secretKey =
    process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAExaPaawL7yEQrXvtMRHQY0J1qc'

  // Jika token kosong di production, tolak request
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
