import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendMembershipNotification } from '@/lib/mail'
import { rateLimit } from '@/lib/rate-limit'
import { extractClientIp, isBlockedEmailDomain, validateAntispamFields } from '@/lib/antispam'

export async function POST(request: Request) {
  const ip = extractClientIp(request)
  const { allowed } = rateLimit({ key: `membership:${ip}`, limit: 3, windowMs: 60_000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova più tardi.' }, { status: 429 })
  }
  try {
    const body = await request.json()

    const { firstName, lastName, address, city, email, phone, membershipType, notes, website, renderTs } = body

    const antispam = validateAntispamFields({ honeypot: website, renderTs })
    if (!antispam.ok) {
      if (antispam.reason === 'honeypot') {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ error: 'Verifica anti-spam non superata. Ricarica la pagina e riprova.' }, { status: 400 })
    }

    if (!firstName || !lastName || !address || !city || !email || !phone || !membershipType) {
      return NextResponse.json({ error: 'Tutti i campi obbligatori devono essere compilati.' }, { status: 400 })
    }

    if (isBlockedEmailDomain(email)) {
      return NextResponse.json({ error: 'Indirizzo email non valido.' }, { status: 400 })
    }

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

    try {
      await sendMembershipNotification({ firstName, lastName, address, city, email, phone, membershipType, notes })
    } catch (emailError) {
      console.error('Failed to send membership email:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Membership submission error:', error)
    return NextResponse.json({ error: 'Si è verificato un errore. Riprova più tardi.' }, { status: 500 })
  }
}
