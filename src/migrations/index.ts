import * as migration_20260323_090532 from './20260323_090532';

export const migrations = [
  {
    up: migration_20260323_090532.up,
    down: migration_20260323_090532.down,
    name: '20260323_090532'
  },
];
