import { NextResponse } from 'next/server'
import { sendContactNotification } from '@/lib/mail'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const { allowed } = rateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova più tardi.' }, { status: 429 })
  }
  try {
    const body = await request.json()
    const { firstName, lastName, email, message } = body

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere compilati.' }, { status: 400 })
    }

    await sendContactNotification({ firstName, lastName, email, message })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Si è verificato un errore. Riprova più tardi.' }, { status: 500 })
  }
}
