import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@cvlt.ch'
const membershipRecipient = process.env.MEMBERSHIP_EMAIL || 'adesione@cvlt.ch'

type MembershipData = {
  firstName: string
  lastName: string
  address: string
  city: string
  email: string
  phone: string
  membershipType: string
  notes?: string
}

const typeLabels: Record<string, string> = {
  active: 'Socio attivo — CHF 40.–',
  family: 'Famiglia — CHF 45.–',
  supporter: 'Sostenitore — contributo libero',
}

export async function sendMembershipNotification(data: MembershipData) {
  const typeLabel = typeLabels[data.membershipType] || data.membershipType

  // Email to the club
  await transporter.sendMail({
    from,
    to: membershipRecipient,
    subject: `Nuova richiesta di adesione: ${data.lastName} ${data.firstName}`,
    text: `Nuova richiesta di adesione al CVLT

Cognome: ${data.lastName}
Nome: ${data.firstName}
Indirizzo: ${data.address}
NPA / Domicilio: ${data.city}
Email: ${data.email}
Telefono: ${data.phone}
Tipo di iscrizione: ${typeLabel}
${data.notes ? `\nOsservazioni: ${data.notes}` : ''}
`,
    html: `
<h2>Nuova richiesta di adesione al CVLT</h2>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Cognome</td><td>${data.lastName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Nome</td><td>${data.firstName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Indirizzo</td><td>${data.address}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">NPA / Domicilio</td><td>${data.city}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Telefono</td><td>${data.phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Tipo di iscrizione</td><td>${typeLabel}</td></tr>
  ${data.notes ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Osservazioni</td><td>${data.notes}</td></tr>` : ''}
</table>
`,
  })

  // Confirmation to the applicant
  await transporter.sendMail({
    from,
    to: data.email,
    subject: 'Richiesta di adesione al CVLT ricevuta',
    text: `Gentile ${data.firstName} ${data.lastName},

Abbiamo ricevuto la tua richiesta di adesione al Club Volo Libero Ticino.
Ti contatteremo al più presto.

Cordiali saluti,
Club Volo Libero Ticino
https://cvlt.ch
`,
  })
}
