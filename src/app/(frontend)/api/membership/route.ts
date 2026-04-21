import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendMembershipNotification } from '@/lib/mail'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const { allowed } = rateLimit({ key: `membership:${ip}`, limit: 5, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova più tardi.' }, { status: 429 })
  }
  try {
    const body = await request.json()

    const { firstName, lastName, address, city, email, phone, membershipType, notes } = body

    // Validate required fields
    if (!firstName || !lastName || !address || !city || !email || !phone || !membershipType) {
      return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere compilati.' }, { status: 400 })
    }

    // Save to Payload
    const payload = await getPayload({ config })

    await payload.create({
      collection: 'membership-submissions',
      data: {
        firstName,
        lastName,
        address,
        city,
        email,
        phone,
        membershipType,
        notes: notes || '',
      },
    })

    // Send emails
    try {
      await sendMembershipNotification({ firstName, lastName, address, city, email, phone, membershipType, notes })
    } catch (emailError) {
      console.error('Failed to send membership email:', emailError)
      // Don't fail the request - the submission is saved in Payload
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Membership submission error:', error)
    return NextResponse.json({ error: 'Si è verificato un errore. Riprova più tardi.' }, { status: 500 })
  }
}
