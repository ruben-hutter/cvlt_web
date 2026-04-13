import * as migration_20260323_090532 from './20260323_090532';
import * as migration_20260325_232248_add_slug_to_events from './20260325_232248_add_slug_to_events';
import * as migration_20260326_193538_add_totp_fields from './20260326_193538_add_totp_fields';
import * as migration_20260413_120000_add_news_tag from './20260413_120000_add_news_tag';

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
    name: '20260326_193538_add_totp_fields'
  },
  {
    up: migration_20260413_120000_add_news_tag.up,
    down: migration_20260413_120000_add_news_tag.down,
    name: '20260413_120000_add_news_tag'
  },
];
