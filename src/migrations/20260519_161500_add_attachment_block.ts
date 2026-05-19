import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`news_blocks_attachment\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer NOT NULL,
  	\`label\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_blocks_attachment_order_idx\` ON \`news_blocks_attachment\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_blocks_attachment_parent_id_idx\` ON \`news_blocks_attachment\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_blocks_attachment_path_idx\` ON \`news_blocks_attachment\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_blocks_attachment_file_idx\` ON \`news_blocks_attachment\` (\`file_id\`);`)

  await db.run(sql`DROP TABLE IF EXISTS \`news_blocks_quote\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`news_blocks_quote_order_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`news_blocks_quote_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`news_blocks_quote_path_idx\`;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`news_blocks_attachment\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`news_blocks_attachment_order_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`news_blocks_attachment_parent_id_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`news_blocks_attachment_path_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`news_blocks_attachment_file_idx\`;`)

  await db.run(sql`CREATE TABLE IF NOT EXISTS \`news_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	\`author\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_blocks_quote_order_idx\` ON \`news_blocks_quote\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_blocks_quote_parent_id_idx\` ON \`news_blocks_quote\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`news_blocks_quote_path_idx\` ON \`news_blocks_quote\` (\`_path\`);`)
}
