#!/usr/bin/env node

/**
 * Script di migrazione dal vecchio DB (backup JSON) al nuovo schema MongoDB.
 *
 * Uso:
 *   node scripts/migrate-db.js <backup.json> [--dry-run] [--drop] [--mongo-uri <uri>]
 *
 * Opzioni:
 *   --dry-run   Mostra cosa verrebbe inserito senza scrivere sul DB
 *   --drop      Elimina le collection 'users' e 'services' prima di migrare (richiesto se già migrato con _id stringa)
 *   --mongo-uri URI di connessione MongoDB (default: env VIRTUALSERVICE_MONGO_URI)
 *
 * Differenze principali tra vecchio e nuovo schema:
 *
 * USERS:
 *   - salt + hashedPassword (PBKDF2) → password: null (incompatibile, gli utenti dovranno reimpostare la password)
 *   - name → rimosso (non presente nel nuovo schema)
 *   - image → avatarUrl
 *   - userId "google_XXXX" → googleId "XXXX"
 *   - provider, lock, __v → rimossi
 *   - Nuovi campi: isEmailVerified (true per utenti migrati), emailVerificationToken, emailVerificationExpires, deletionRequestedAt
 *
 * SERVICES:
 *   - starred: 0/1 → boolean
 *   - author, callsCount, functions → rimossi
 *   - Nuovo campo: schedulerFn (default '')
 *
 * CALLS:
 *   - verb: lowercase → UPPERCASE
 *   - respType: 'object' → 'json'
 *   - _id, parameters_str → rimossi
 *   - Nuovi campi: file, headers, cookies
 *
 * PARAMETERS:
 *   - id → code
 *   - _id → rimosso
 *   - Nuovo campo: key (default '')
 *
 * RULES:
 *   - _id → rimosso
 */

const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dropFirst = args.includes('--drop');
const mongoUriIdx = args.indexOf('--mongo-uri');
const mongoUri = mongoUriIdx !== -1 ? args[mongoUriIdx + 1] : process.env.VIRTUALSERVICE_MONGO_URI;
const backupFile = args.find(a => !a.startsWith('--') && (mongoUriIdx === -1 || a !== args[mongoUriIdx + 1]));

if (!backupFile) {
  console.error('Uso: node scripts/migrate-db.js <backup.json> [--dry-run] [--mongo-uri <uri>]');
  process.exit(1);
}

if (!dryRun && !mongoUri) {
  console.error('Errore: specificare VIRTUALSERVICE_MONGO_URI tramite env o --mongo-uri');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Trasformazioni
// ---------------------------------------------------------------------------

/**
 * Mappa un utente dal vecchio schema al nuovo.
 */
function migrateUser(old) {
  const googleId = old.userId
    ? old.userId.replace(/^google_/, '')
    : null;

  return {
    _id: new ObjectId(old._id), // preserva l'ObjectId originale come tipo corretto
    email: old.email,
    password: null, // vecchio formato (salt+PBKDF2) incompatibile con bcrypt
    googleId: googleId,
    avatarUrl: old.image || null,
    isEmailVerified: true, // utenti esistenti considerati verificati
    emailVerificationToken: null,
    emailVerificationExpires: null,
    deletionRequestedAt: null,
    role: old.role || 'user',
  };
}

/**
 * Mappa un parametro dal vecchio schema al nuovo.
 */
function migrateParameter(old) {
  return {
    code: old.id || `${old.name}@${old.target}`, // vecchio 'id' → nuovo 'code'
    name: old.name,
    key: '', // campo nuovo, default vuoto
    target: old.target,
    value: old.value,
  };
}

/**
 * Mappa una regola dal vecchio schema al nuovo.
 */
function migrateRule(old) {
  return {
    expression: old.expression || '',
    path: old.path || '',
    error: old.error || '',
    code: old.code || 400,
  };
}

/**
 * Mappa il respType dal vecchio formato al nuovo.
 */
function migrateRespType(respType) {
  if (!respType || respType === 'object') return 'json';
  const valid = ['json', 'text', 'file', 'html'];
  return valid.includes(respType) ? respType : 'json';
}

/**
 * Mappa una call dal vecchio schema al nuovo.
 */
function migrateCall(old) {
  return {
    path: old.path || '',
    verb: (old.verb || 'get').toUpperCase(),
    description: old.description || '',
    response: old.response || '',
    file: '', // campo nuovo
    respType: migrateRespType(old.respType),
    rules: (old.rules || []).map(migrateRule),
    body: old.body || '',
    parameters: (old.parameters || []).map(migrateParameter),
    headers: {}, // campo nuovo
    cookies: {}, // campo nuovo
  };
}

/**
 * Mappa un servizio dal vecchio schema al nuovo.
 */
function migrateService(old) {
  return {
    _id: new ObjectId(old._id),
    owner: String(old.owner), // owner è string nel schema NestJS, non ObjectId
    lastChange: old.lastChange || Date.now(),
    creationDate: old.creationDate || Date.now(),
    name: old.name,
    description: old.description || '',
    starred: Boolean(old.starred), // 0/1 → false/true
    active: Boolean(old.active),
    dbo: old.dbo || '',
    path: old.path,
    calls: (old.calls || []).map(migrateCall),
    schedulerFn: '', // campo nuovo
    interval: old.interval || 0,
  };
}

// ---------------------------------------------------------------------------
// Esecuzione
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n📄 Lettura backup: ${backupFile}`);
  let raw;
  try {
    raw = fs.readFileSync(path.resolve(backupFile), 'utf-8');
  } catch (err) {
    console.error(`❌ Impossibile leggere il file: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Il file non contiene JSON valido: ${err.message}`);
    process.exit(1);
  }

  // Supporta sia il formato flat {users, services} sia il formato {collections: {users, services}}
  const rawUsers = data.users || data.collections?.users || [];
  const rawServices = data.services || data.collections?.services || [];
  const users = rawUsers.map(migrateUser);
  const services = rawServices.map(migrateService);

  // Riassegnazione servizi orfani all'admin
  const userIds = new Set(users.map(u => u._id.toString()));
  const adminUser = users.find(u => u.role === 'admin');
  const orphanServices = services.filter(s => !userIds.has(s.owner));

  if (orphanServices.length > 0) {
    if (!adminUser) {
      console.error('❌ Trovati servizi orfani ma nessun utente admin nel backup.');
      process.exit(1);
    }
    console.log(`\n🔄 Riassegnazione ${orphanServices.length} servizi orfani all'admin (${adminUser.email}):`);
    for (const svc of orphanServices) {
      const note = `[Migrato: owner originale ${svc.owner}]`;
      console.log(`   - ${svc.name} (owner: ${svc.owner} → ${adminUser._id})`);
      svc.description = svc.description
        ? `${svc.description}\n${note}`
        : note;
      svc.owner = adminUser._id;
    }
  }

  console.log(`\n👤 Utenti da migrare: ${users.length}`);
  console.log(`📦 Servizi da migrare: ${services.length}`);

  // Statistiche
  const totalCalls = services.reduce((sum, s) => sum + s.calls.length, 0);
  const googleUsers = users.filter(u => u.googleId).length;
  console.log(`   - Utenti con Google OAuth: ${googleUsers}`);
  console.log(`   - Totale endpoint (calls): ${totalCalls}`);
  console.log(`   - Servizi attivi: ${services.filter(s => s.active).length}`);
  console.log(`   - Servizi con stella: ${services.filter(s => s.starred).length}`);
  if (orphanServices.length > 0) {
    console.log(`   - Servizi riassegnati all'admin: ${orphanServices.length}`);
  }

  if (dryRun) {
    console.log('\n🔍 === DRY RUN — Nessuna scrittura sul DB ===\n');

    console.log('--- ESEMPIO UTENTE MIGRATO ---');
    console.log(JSON.stringify(users[0], null, 2));

    const sampleService = services.find(s => s.calls.length > 0) || services[0];
    if (sampleService) {
      console.log('\n--- ESEMPIO SERVIZIO MIGRATO ---');
      const { calls, ...rest } = sampleService;
      console.log(JSON.stringify(rest, null, 2));
      console.log(`calls: [${calls.length} endpoint]`);
      if (calls.length > 0) {
        console.log('\n--- ESEMPIO CALL MIGRATA ---');
        console.log(JSON.stringify(calls[0], null, 2));
      }
    }

    // Verifica path univoci
    const paths = services.map(s => s.path);
    const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Path duplicati trovati: ${[...new Set(duplicates)].join(', ')}`);
    } else {
      console.log('✅ Tutti i path dei servizi sono univoci');
    }

    console.log('\n✅ Dry run completato. Rilanciare senza --dry-run per eseguire la migrazione.');
    return;
  }

  // Connessione a MongoDB e inserimento
  let mongoose;
  try {
    mongoose = require('mongoose');
  } catch {
    console.error('Errore: mongoose non trovato. Eseguire da dentro il progetto (dove node_modules è disponibile).');
    process.exit(1);
  }

  console.log(`\n🔗 Connessione a MongoDB...`);
  await mongoose.connect(mongoUri);
  console.log('✅ Connesso');

  const db = mongoose.connection.db;

  // --- Drop collection se richiesto ---
  if (dropFirst) {
    console.log('\n🗑️  --drop: eliminazione collection esistenti...');
    await db.collection('users').drop().catch(() => {});
    await db.collection('services').drop().catch(() => {});
    console.log('   ✅ Collection users e services eliminate.');
  }

  // --- Migrazione utenti ---
  console.log('\n👤 Migrazione utenti...');
  const usersCollection = db.collection('users');

  const existingUsers = await usersCollection.countDocuments();
  if (existingUsers > 0) {
    console.log(`⚠️  La collection 'users' contiene già ${existingUsers} documenti.`);
    console.log('   I documenti con _id già esistente verranno saltati (upsert).');
  }

  let usersInserted = 0;
  let usersSkipped = 0;
  for (const user of users) {
    try {
      await usersCollection.updateOne(
        { _id: user._id },
        { $setOnInsert: user },
        { upsert: true }
      );
      usersInserted++;
    } catch (err) {
      console.error(`   ❌ Errore utente ${user.email}: ${err.message}`);
      usersSkipped++;
    }
  }
  console.log(`   ✅ Inseriti: ${usersInserted}, Saltati/Errori: ${usersSkipped}`);

  // --- Migrazione servizi ---
  console.log('\n📦 Migrazione servizi...');
  const servicesCollection = db.collection('services');

  const existingServices = await servicesCollection.countDocuments();
  if (existingServices > 0) {
    console.log(`⚠️  La collection 'services' contiene già ${existingServices} documenti.`);
    console.log('   I documenti con _id già esistente verranno saltati.');
  }

  let servicesInserted = 0;
  let servicesSkipped = 0;
  for (const service of services) {
    try {
      await servicesCollection.updateOne(
        { _id: service._id },
        { $setOnInsert: service },
        { upsert: true }
      );
      servicesInserted++;
    } catch (err) {
      console.error(`   ❌ Errore servizio ${service.name}: ${err.message}`);
      servicesSkipped++;
    }
  }
  console.log(`   ✅ Inseriti: ${servicesInserted}, Saltati/Errori: ${servicesSkipped}`);

  await mongoose.disconnect();
  console.log('\n🎉 Migrazione completata!\n');
}

main().catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});
