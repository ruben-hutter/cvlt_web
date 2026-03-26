import { buildConfig } from 'payload'
import { payloadTotp } from 'payload-totp'
import type { EmailAdapter } from 'payload'
import nodemailer from 'nodemailer'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import {
  lexicalEditor,
  FixedToolbarFeature,
  HeadingFeature,
  LinkFeature,
  AlignFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  OrderedListFeature,
  UnorderedListFeature,
  ChecklistFeature,
  IndentFeature,
  InlineCodeFeature,
} from '@payloadcms/richtext-lexical'
import { it } from '@payloadcms/translations/languages/it'
import { fileURLToPath } from 'url'
import path from 'path'
import sharp from 'sharp'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { MembershipSubmissions } from './collections/MembershipSubmissions'
import { News } from './collections/News'
import { PhotoAlbums } from './collections/PhotoAlbums'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  graphQL: { disable: true },
  admin: {
    user: Users.slug,
    livePreview: {
      url: ({ data, collectionConfig }) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        if (collectionConfig?.slug === 'news') {
          return `${base}/notizie/preview/${data.id}?live=true`
        }
        return base
      },
      collections: ['news'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  collections: [News, Events, PhotoAlbums, MembershipSubmissions, Media, Users],
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./db/payload.db',
    },
  }),
  editor: lexicalEditor({
    features: [
      FixedToolbarFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      InlineCodeFeature(),
      LinkFeature(),
      AlignFeature(),
      BlockquoteFeature(),
      HorizontalRuleFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      ChecklistFeature(),
      IndentFeature(),
    ],
  }),
  i18n: {
    supportedLanguages: { it },
    fallbackLanguage: 'it',
  },
  email: (() => {
    const transporter = nodemailer.createTransport({
      host: 'mail.infomaniak.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    return {
      name: 'nodemailer',
      defaultFromAddress: process.env.SMTP_FROM || 'no-reply@cvlt.ch',
      defaultFromName: 'CVLT',
      sendEmail: async (message) => {
        await transporter.sendMail(message)
      },
    }
  }) as EmailAdapter,
  plugins: [
    payloadTotp({
      collection: 'users',
      totp: {
        issuer: 'CVLT',
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
})
