import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`reset_totp\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`totp_secret\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`reset_totp\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`totp_secret\`;`)
}
