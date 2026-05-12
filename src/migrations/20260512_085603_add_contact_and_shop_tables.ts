import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

async function safeCreateTable(db: any, tableName: string, ddl: string) {
  const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${tableName};`)
  if (result.rows?.length) return
  await db.run(sql.raw(ddl))
}

async function safeAddColumn(db: any, table: string, column: string, type: string) {
  const result = await db.run(sql`PRAGMA table_info(${sql.raw(table)});`)
  const exists = result.rows?.some((row: any) => row.name === column)
  if (exists) return
  await db.run(sql`ALTER TABLE ${sql.raw(table)} ADD ${sql.raw(column)} ${sql.raw(type)};`)
}

async function safeCreateIndex(db: any, indexName: string, ddl: string) {
  const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='index' AND name=${indexName};`)
  if (result.rows?.length) return
  await db.run(sql.raw(ddl))
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await safeCreateTable(db, 'contact_submissions', `CREATE TABLE \`contact_submissions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`full_name\` text,
  	\`last_name\` text NOT NULL,
  	\`first_name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`message\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`)
  await safeCreateIndex(db, 'contact_submissions_updated_at_idx', `CREATE INDEX \`contact_submissions_updated_at_idx\` ON \`contact_submissions\` (\`updated_at\`);`)
  await safeCreateIndex(db, 'contact_submissions_created_at_idx', `CREATE INDEX \`contact_submissions_created_at_idx\` ON \`contact_submissions\` (\`created_at\`);`)

  await safeCreateTable(db, 'shop_orders', `CREATE TABLE \`shop_orders\` (
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
  );`)
  await safeCreateIndex(db, 'shop_orders_order_ref_idx', `CREATE UNIQUE INDEX \`shop_orders_order_ref_idx\` ON \`shop_orders\` (\`order_ref\`);`)
  await safeCreateIndex(db, 'shop_orders_updated_at_idx', `CREATE INDEX \`shop_orders_updated_at_idx\` ON \`shop_orders\` (\`updated_at\`);`)
  await safeCreateIndex(db, 'shop_orders_created_at_idx', `CREATE INDEX \`shop_orders_created_at_idx\` ON \`shop_orders\` (\`created_at\`);`)

  await safeAddColumn(db, 'photo_albums', 'slug', 'text')
  await safeCreateIndex(db, 'photo_albums_slug_idx', `CREATE UNIQUE INDEX \`photo_albums_slug_idx\` ON \`photo_albums\` (\`slug\`);`)

  await safeAddColumn(db, 'media', 'sizes_thumbnail_url', 'text')
  await safeAddColumn(db, 'media', 'sizes_thumbnail_width', 'numeric')
  await safeAddColumn(db, 'media', 'sizes_thumbnail_height', 'numeric')
  await safeAddColumn(db, 'media', 'sizes_thumbnail_mime_type', 'text')
  await safeAddColumn(db, 'media', 'sizes_thumbnail_filesize', 'numeric')
  await safeAddColumn(db, 'media', 'sizes_thumbnail_filename', 'text')
  await safeAddColumn(db, 'media', 'sizes_medium_url', 'text')
  await safeAddColumn(db, 'media', 'sizes_medium_width', 'numeric')
  await safeAddColumn(db, 'media', 'sizes_medium_height', 'numeric')
  await safeAddColumn(db, 'media', 'sizes_medium_mime_type', 'text')
  await safeAddColumn(db, 'media', 'sizes_medium_filesize', 'numeric')
  await safeAddColumn(db, 'media', 'sizes_medium_filename', 'text')
  await safeCreateIndex(db, 'media_sizes_thumbnail_sizes_thumbnail_filename_idx', `CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`)
  await safeCreateIndex(db, 'media_sizes_medium_sizes_medium_filename_idx', `CREATE INDEX \`media_sizes_medium_sizes_medium_filename_idx\` ON \`media\` (\`sizes_medium_filename\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`contact_submissions\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`shop_orders\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`photo_albums_slug_idx\`;`)
  await safeAddColumn(db, 'photo_albums', 'slug', 'text')
  await db.run(sql`DROP INDEX IF EXISTS \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`media_sizes_medium_sizes_medium_filename_idx\`;`)
}
