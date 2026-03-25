import * as migration_20260323_090532 from './20260323_090532';
import * as migration_20260325_232248_add_slug_to_events from './20260325_232248_add_slug_to_events';

export const migrations = [
  {
    up: migration_20260323_090532.up,
    down: migration_20260323_090532.down,
    name: '20260323_090532',
  },
  {
    up: migration_20260325_232248_add_slug_to_events.up,
    down: migration_20260325_232248_add_slug_to_events.down,
    name: '20260325_232248_add_slug_to_events'
  },
];
