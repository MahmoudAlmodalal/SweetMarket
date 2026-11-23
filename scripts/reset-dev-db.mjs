#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const targetPath = process.env.CANDY_LOZ_DB_PATH
  ? path.resolve(process.env.CANDY_LOZ_DB_PATH)
  : path.join(os.tmpdir(), 'candy-loz-backend-db.json');

if (fs.existsSync(targetPath)) {
  fs.unlinkSync(targetPath);
  console.log(`[dev:reset-db] Removed local DB file: ${targetPath}`);
  console.log('[dev:reset-db] Fresh seed data will be generated automatically on the next API request.');
} else {
  console.log(`[dev:reset-db] No local DB file found at: ${targetPath} (already clean).`);
}
