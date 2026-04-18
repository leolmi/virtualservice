/**
 * backup-old-db.js
 *
 * Scarica tutte le collection dal vecchio cluster Atlas (VIRTUALSERVICE_MONGO_URI_OLD)
 * e le salva in un file JSON nella cartella backups/.
 *
 * Uso:
 *   node scripts/backup-old-db.js
 *
 * Opzionale — URI custom:
 *   node scripts/backup-old-db.js "mongodb+srv://..."
 */

const { MongoClient } = require('mongoose').mongo;
const fs = require('fs');
const path = require('path');

// ── config ────────────────────────────────────────────────────────────────────

const MONGO_URI = process.argv[2] || process.env.VIRTUALSERVICE_MONGO_URI_OLD;

const OUTPUT_DIR = path.join(__dirname, '..', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUTPUT_FILE = path.join(OUTPUT_DIR, `backup-old-${TIMESTAMP}.json`);

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to:', MONGO_URI.replace(/:([^@]+)@/, ':***@'));

  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const db = client.db();
  console.log(`Connected to database: ${db.databaseName}`);

  const collectionInfos = await db.listCollections().toArray();
  const collectionNames = collectionInfos.map((c) => c.name);
  console.log(`Collections found: ${collectionNames.join(', ') || '(none)'}`);

  const collections = {};
  let totalDocs = 0;

  for (const name of collectionNames) {
    const docs = await db.collection(name).find({}).toArray();
    collections[name] = docs;
    totalDocs += docs.length;
    console.log(`  ${name}: ${docs.length} documents`);
  }

  await client.close();

  const backup = {
    meta: {
      createdAt: new Date().toISOString(),
      version: 1,
      dbName: db.databaseName,
      uri: MONGO_URI.replace(/:([^@]+)@/, ':***@'),
      totalDocuments: totalDocs,
      collections: collectionNames,
    },
    collections,
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(backup, null, 2), 'utf-8');

  console.log(`\nBackup saved to: ${OUTPUT_FILE}`);
  console.log(`Total documents: ${totalDocs}`);
}

main().catch((err) => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});
