import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`contact_submissions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`full_name\` text,
  	\`last_name\` text NOT NULL,
  	\`first_name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`message\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_submissions_updated_at_idx\` ON \`contact_submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`contact_submissions_created_at_idx\` ON \`contact_submissions\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`shop_orders\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order_ref\` text NOT NULL,
  	\`full_name\` text,
  	\`last_name\` text NOT NULL,
  	\`first_name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text NOT NULL,
  	\`address\` text NOT NULL,
  	\`postal_code\` text NOT NULL,
  	\`city\` text NOT NULL,
  	\`notes\` text,
  	\`payment_method\` text NOT NULL,
  	\`payment_status\` text NOT NULL,
  	\`total\` numeric NOT NULL,
  	\`items\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`shop_orders_order_ref_idx\` ON \`shop_orders\` (\`order_ref\`);`)
  await db.run(sql`CREATE INDEX \`shop_orders_updated_at_idx\` ON \`shop_orders\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`shop_orders_created_at_idx\` ON \`shop_orders\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`photo_albums\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`photo_albums_slug_idx\` ON \`photo_albums\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_thumbnail_url\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_thumbnail_width\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_thumbnail_height\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_thumbnail_mime_type\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_thumbnail_filesize\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_thumbnail_filename\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_medium_url\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_medium_width\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_medium_height\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_medium_mime_type\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_medium_filesize\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_medium_filename\` text;`)
  await db.run(sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_medium_sizes_medium_filename_idx\` ON \`media\` (\`sizes_medium_filename\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`contact_submissions\`;`)
  await db.run(sql`DROP TABLE \`shop_orders\`;`)
  await db.run(sql`DROP INDEX \`photo_albums_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`photo_albums\` DROP COLUMN \`slug\`;`)
  await db.run(sql`DROP INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\`;`)
  await db.run(sql`DROP INDEX \`media_sizes_medium_sizes_medium_filename_idx\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_thumbnail_url\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_thumbnail_width\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_thumbnail_height\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_thumbnail_mime_type\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_thumbnail_filesize\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_thumbnail_filename\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_medium_url\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_medium_width\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_medium_height\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_medium_mime_type\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_medium_filesize\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_medium_filename\`;`)
}
