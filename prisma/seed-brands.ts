process.env.LOG_LEVELS = 'error';
import { db } from '../src/lib/db';

const brands = [
  { name: 'NSK', slug: 'nsk', visible: true },
  { name: 'W&H', slug: 'wh', visible: true },
  { name: 'Kavo', slug: 'kavo', visible: true },
  { name: 'Siemens', slug: 'siemens', visible: true },
  { name: 'Dentsply', slug: 'dentsply', visible: true },
  { name: 'Maillefer', slug: 'maillefer', visible: true },
  { name: 'VDW', slug: 'vdw', visible: true },
  { name: 'Meta Biomed', slug: 'meta-biomed', visible: true },
  { name: 'Coltene', slug: 'coltene', visible: true },
  { name: 'Ultradent', slug: 'ultradent', visible: true },
  { name: '3M ESPE', slug: '3m-espe', visible: true },
  { name: 'Ivoclar Vivadent', slug: 'ivoclar-vivadent', visible: true },
  { name: 'GC', slug: 'gc', visible: true },
  { name: 'Kerr', slug: 'kerr', visible: true },
  { name: 'Shofu', slug: 'shofu', visible: true },
  { name: 'Tokuyama', slug: 'tokuyama', visible: true },
  { name: 'Voco', slug: 'voco', visible: true },
  { name: 'Septodont', slug: 'septodont', visible: true },
  { name: 'Dentsply Sirona', slug: 'dentsply-sirona', visible: true },
  { name: 'Mani', slug: 'mani', visible: true },
  { name: 'Edenta', slug: 'edenta', visible: true },
  { name: 'Anthogyr', slug: 'anthogyr', visible: true },
  { name: 'Straumann', slug: 'straumann', visible: true },
  { name: 'Nobel Biocare', slug: 'nobel-biocare', visible: true },
  { name: 'Osstem', slug: 'osstem', visible: true },
  { name: 'Dio', slug: 'dio', visible: true },
  { name: 'MIS', slug: 'mis', visible: true },
  { name: 'Biohorizons', slug: 'biohorizons', visible: true },
  { name: 'Zimmer', slug: 'zimmer', visible: true },
  { name: 'Neobiotech', slug: 'neobiotech', visible: true },
  { name: 'Dentium', slug: 'dentium', visible: true },
  { name: 'Megagen', slug: 'megagen', visible: true },
  { name: 'frasaco', slug: 'frasaco', visible: true },
  { name: 'Nakanishi', slug: 'nakanishi', visible: true },
  { name: 'Satelec', slug: 'satelec', visible: true },
  { name: 'Acteon', slug: 'acteon', visible: true },
  { name: 'Woodpecker', slug: 'woodpecker', visible: true },
  { name: 'Being Foshan', slug: 'being-foshan', visible: true },
  { name: 'Coxo', slug: 'coxo', visible: true },
  { name: 'Sinol', slug: 'sinol', visible: true },
  { name: 'Faraz Mehr', slug: 'faraz-mehr', visible: true },
  { name: 'Pars Dantal', slug: 'pars-dantal-brand', visible: true },
  { name: 'Dentus', slug: 'dentus-brand', visible: true },
  { name: 'Fakhre Sina', slug: 'fakhre-sina-brand', visible: true },
  { name: 'Vesal Gostar', slug: 'vesal-gostar-brand', visible: true },
];

async function main() {
  console.log('🌱 شروع seeding برندها...');
  await db.brand.deleteMany({});
  let count = 0;
  for (const b of brands) {
    await db.brand.create({ data: b });
    count++;
  }
  console.log(`✅ ${count} برند ایجاد شد`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
