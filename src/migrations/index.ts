import * as migration_20260323_090532 from './20260323_090532';
import * as migration_20260325_232248_add_slug_to_events from './20260325_232248_add_slug_to_events';
import * as migration_20260326_193538_add_totp_fields from './20260326_193538_add_totp_fields';
import * as migration_20260413_120000_add_news_tag from './20260413_120000_add_news_tag';
import * as migration_20260512_085603_add_contact_and_shop_tables from './20260512_085603_add_contact_and_shop_tables';
import * as migration_20260519_161500_add_attachment_block from './20260519_161500_add_attachment_block';

export const migrations = [
  {
    up: migration_20260323_090532.up,
    down: migration_20260323_090532.down,
    name: '20260323_090532',
  },
  {
    up: migration_20260325_232248_add_slug_to_events.up,
    down: migration_20260325_232248_add_slug_to_events.down,
    name: '20260325_232248_add_slug_to_events',
  },
  {
    up: migration_20260326_193538_add_totp_fields.up,
    down: migration_20260326_193538_add_totp_fields.down,
    name: '20260326_193538_add_totp_fields',
  },
  {
    up: migration_20260413_120000_add_news_tag.up,
    down: migration_20260413_120000_add_news_tag.down,
    name: '20260413_120000_add_news_tag',
  },
  {
    up: migration_20260512_085603_add_contact_and_shop_tables.up,
    down: migration_20260512_085603_add_contact_and_shop_tables.down,
    name: '20260512_085603_add_contact_and_shop_tables'
  },
  {
    up: migration_20260519_161500_add_attachment_block.up,
    down: migration_20260519_161500_add_attachment_block.down,
    name: '20260519_161500_add_attachment_block',
  },
];
