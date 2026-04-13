import nodemailer from 'nodemailer'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
  auth: {
    user: requireEnv('SMTP_USER'),
    pass: requireEnv('SMTP_PASS'),
  },
})

const from = requireEnv('SMTP_FROM')
const contactRecipient = requireEnv('CONTACT_EMAIL')
const membershipRecipient = requireEnv('MEMBERSHIP_EMAIL')
const shopRecipient = requireEnv('SHOP_EMAIL')

type ContactData = {
  firstName: string
  lastName: string
  email: string
  message: string
}

export async function sendContactNotification(data: ContactData) {
  await transporter.sendMail({
    from,
    replyTo: data.email,
    to: contactRecipient,
    subject: `Messaggio dal sito: ${data.lastName} ${data.firstName}`,
    text: `Nuovo messaggio dal modulo di contatto sul sito cvlt.ch

Cognome: ${data.lastName}
Nome: ${data.firstName}
Email: ${data.email}

Messaggio:
${data.message}
`,
    html: `
<h2>Nuovo messaggio dal modulo di contatto</h2>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Cognome</td><td>${data.lastName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Nome</td><td>${data.firstName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
</table>
<h3 style="margin-top:16px;">Messaggio</h3>
<p style="white-space:pre-wrap;">${data.message}</p>
`,
  })

  await transporter.sendMail({
    from,
    to: data.email,
    subject: 'Messaggio ricevuto - CVLT',
    text: `Gentile ${data.firstName} ${data.lastName},

Abbiamo ricevuto il tuo messaggio e ti risponderemo al più presto.

Il tuo messaggio:
${data.message}

Cordiali saluti,
Club Volo Libero Ticino
https://cvlt.ch
`,
    html: `
<p>Gentile ${data.firstName} ${data.lastName},</p>
<p>Abbiamo ricevuto il tuo messaggio e ti risponderemo al più presto.</p>
<h3 style="margin-top:16px;">Il tuo messaggio</h3>
<p style="white-space:pre-wrap;">${data.message}</p>
<p style="margin-top:20px;">Cordiali saluti,<br>Club Volo Libero Ticino<br><a href="https://cvlt.ch">cvlt.ch</a></p>
`,
  })
}

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
  active: 'Socio attivo - CHF 40.–',
  family: 'Famiglia - CHF 45.–',
  supporter: 'Sostenitore - contributo libero',
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

Riepilogo dei dati inviati:
  Cognome: ${data.lastName}
  Nome: ${data.firstName}
  Indirizzo: ${data.address}
  NPA / Domicilio: ${data.city}
  Email: ${data.email}
  Telefono: ${data.phone}
  Tipo di iscrizione: ${typeLabel}
${data.notes ? `  Osservazioni: ${data.notes}\n` : ''}
Se noti un errore nei dati, contattaci a ${membershipRecipient}.

Cordiali saluti,
Club Volo Libero Ticino
https://cvlt.ch
`,
    html: `
<p>Gentile ${data.firstName} ${data.lastName},</p>
<p>Abbiamo ricevuto la tua richiesta di adesione al Club Volo Libero Ticino.<br>Ti contatteremo al più presto.</p>
<h3 style="margin-top:20px;">Riepilogo dei dati inviati</h3>
<table style="border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Cognome</td><td>${data.lastName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Nome</td><td>${data.firstName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Indirizzo</td><td>${data.address}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">NPA / Domicilio</td><td>${data.city}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email</td><td>${data.email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Telefono</td><td>${data.phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Tipo di iscrizione</td><td>${typeLabel}</td></tr>
  ${data.notes ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Osservazioni</td><td>${data.notes}</td></tr>` : ''}
</table>
<p style="margin-top:16px;font-size:14px;color:#666;">Se noti un errore nei dati, contattaci a <a href="mailto:${membershipRecipient}">${membershipRecipient}</a>.</p>
<p style="margin-top:20px;">Cordiali saluti,<br>Club Volo Libero Ticino<br><a href="https://cvlt.ch">cvlt.ch</a></p>
`,
  })
}

type ShopOrderItem = {
  productName: string
  edition: string
  variant: string
  size: string
  quantity: number
  unitPrice: number
}

type ShopOrderData = {
  orderRef: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
  notes?: string
  total: number
  createdAt: string
  items: ShopOrderItem[]
}

function formatCurrency(value: number) {
  return `CHF ${value}.-`
}

export async function sendShopOrderNotification(data: ShopOrderData) {
  const itemsText = data.items
    .map(
      (item) =>
        `- ${item.productName} (${item.edition}) | ${item.variant} | Taglia ${item.size} | Qta ${item.quantity} | ${formatCurrency(item.unitPrice)} | Subtotale ${formatCurrency(item.quantity * item.unitPrice)}`,
    )
    .join('\n')

  const itemsHtml = data.items
    .map(
      (item) => `
  <tr>
    <td style="padding:6px 8px;border:1px solid #ddd;">${item.productName}</td>
    <td style="padding:6px 8px;border:1px solid #ddd;">${item.edition}</td>
    <td style="padding:6px 8px;border:1px solid #ddd;">${item.variant}</td>
    <td style="padding:6px 8px;border:1px solid #ddd;">${item.size}</td>
    <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${item.quantity}</td>
    <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${formatCurrency(item.unitPrice)}</td>
    <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${formatCurrency(item.quantity * item.unitPrice)}</td>
  </tr>`,
    )
    .join('')

  // Email to the shop manager
  await transporter.sendMail({
    from,
    to: shopRecipient,
    subject: `Nuovo ordine shop (${data.orderRef})`,
    text: `Nuovo ordine shop

Riferimento ordine: ${data.orderRef}
Data: ${data.createdAt}

Cliente:
Nome: ${data.firstName} ${data.lastName}
Email: ${data.email}
Telefono: ${data.phone}
Via: ${data.address}
NPA: ${data.postalCode}
Domicilio: ${data.city}
${data.notes ? `Note: ${data.notes}` : ''}

Articoli:
${itemsText}

Totale: ${formatCurrency(data.total)}
`,
    html: `
<h2>Nuovo ordine shop</h2>
<p><strong>Riferimento ordine:</strong> ${data.orderRef}<br>
<strong>Data:</strong> ${data.createdAt}</p>

<h3>Cliente</h3>
<p><strong>Nome:</strong> ${data.firstName} ${data.lastName}<br>
<strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a><br>
<strong>Telefono:</strong> ${data.phone}<br>
<strong>Via:</strong> ${data.address}<br>
<strong>NPA:</strong> ${data.postalCode}<br>
<strong>Domicilio:</strong> ${data.city}
${data.notes ? `<br><strong>Note:</strong> ${data.notes}` : ''}</p>

<h3>Articoli</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;">
  <thead>
    <tr>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Prodotto</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Edizione</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Variante</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Taglia</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Qta</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Prezzo</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Subtotale</th>
    </tr>
  </thead>
  <tbody>
    ${itemsHtml}
  </tbody>
</table>

<p style="margin-top:16px;"><strong>Totale:</strong> ${formatCurrency(data.total)}</p>
`,
  })

  // Confirmation email to the customer
  await transporter.sendMail({
    from,
    to: data.email,
    subject: `Conferma ordine CVLT Shop (${data.orderRef})`,
    text: `Gentile ${data.firstName} ${data.lastName},

Il tuo ordine è stato registrato con successo.

Riferimento ordine: ${data.orderRef}

Articoli ordinati:
${itemsText}

Totale: ${formatCurrency(data.total)}

Indirizzo di spedizione:
${data.firstName} ${data.lastName}
${data.address}
${data.postalCode} ${data.city}

Ti contatteremo per la spedizione.

Cordiali saluti,
Club Volo Libero Ticino
https://cvlt.ch
`,
    html: `
<p>Gentile ${data.firstName} ${data.lastName},</p>
<p>Il tuo ordine è stato registrato con successo.</p>
<p><strong>Riferimento ordine:</strong> ${data.orderRef}</p>

<h3>Articoli ordinati</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;">
  <thead>
    <tr>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Prodotto</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Edizione</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Variante</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">Taglia</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Qta</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Prezzo</th>
      <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;">Subtotale</th>
    </tr>
  </thead>
  <tbody>
    ${itemsHtml}
  </tbody>
</table>

<p style="margin-top:16px;"><strong>Totale:</strong> ${formatCurrency(data.total)}</p>

<h3>Indirizzo di spedizione</h3>
<p>${data.firstName} ${data.lastName}<br>${data.address}<br>${data.postalCode} ${data.city}</p>

<p>Ti contatteremo per la spedizione.</p>
<p style="margin-top:20px;">Cordiali saluti,<br>Club Volo Libero Ticino<br><a href="https://cvlt.ch">cvlt.ch</a></p>
`,
  })
}
