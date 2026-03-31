import { NextResponse } from 'next/server'
import { sendContactNotification } from '@/lib/mail'

export async function POST(request: Request) {
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
