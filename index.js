import { mkdir, writeFile } from 'node:fs/promises';
import { login, getShifts } from './kadromierz.js';
import { buildIcs } from './ics.js';

const { KADRO_EMAIL, KADRO_PASSWORD, FEED_TOKEN = 'local', DEBUG } = process.env;
if (!KADRO_EMAIL || !KADRO_PASSWORD) {
  console.error('Brak KADRO_EMAIL / KADRO_PASSWORD (ustaw w .env albo GitHub Secrets)');
  process.exit(1);
}

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const session = await login(KADRO_EMAIL, KADRO_PASSWORD);
const shifts = await getShifts(session, day(-30), day(90));
if (DEBUG) console.log(JSON.stringify(shifts.slice(0, 2), null, 2));

const dir = `public/${FEED_TOKEN}`;
await mkdir(dir, { recursive: true });
await writeFile(`${dir}/grafik.ics`, buildIcs(shifts));
await writeFile('public/index.html', '<!doctype html><title>OK</title>');
console.log(`Zapisano ${shifts.length} zmian do ${dir}/grafik.ics`);
