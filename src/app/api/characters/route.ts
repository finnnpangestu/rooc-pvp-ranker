import { NextResponse } from 'next/server'
import { createCharacter } from '@/actions/stats/createCharacter'
import { formatErrorMessage } from '@/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await createCharacter(body)
    if (!result.success) {
      return NextResponse.json({ errors: [{ message: result.error }] }, { status: 400 })
    }
    return NextResponse.json({ doc: result.data.doc }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ errors: [{ message: formatErrorMessage(err) }] }, { status: 500 })
  }
}
