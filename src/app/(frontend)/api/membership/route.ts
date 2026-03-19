import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendMembershipNotification } from '@/lib/mail'

export async function POST(request: Request) {
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
      // Don't fail the request — the submission is saved in Payload
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Membership submission error:', error)
    return NextResponse.json({ error: 'Si è verificato un errore. Riprova più tardi.' }, { status: 500 })
  }
}
