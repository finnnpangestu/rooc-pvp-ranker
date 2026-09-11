import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      {
        authenticated: false,
        error: 'jwt_expired',
        message: 'Sesi login Anda telah berakhir atau token JWT tidak valid. Silakan login kembali.',
      },
      { status: 401 },
    )
  }

  return NextResponse.json({
    authenticated: true,
    user,
  })
}
