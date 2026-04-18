# Tools & Scripts

Tutti gli script si trovano nella cartella `scripts/` alla radice del monorepo e si eseguono con Node.js dalla root del progetto (dove `node_modules` è disponibile).

---

## backup-old-db.js

Scarica il backup completo del vecchio cluster Atlas (o qualsiasi MongoDB URI) e lo salva come file JSON nella cartella `backups/`.

A differenza del backup disponibile nell'interfaccia admin (che esclude i log), questo script scarica **tutte** le collection senza eccezioni.

**Uso:**

```bash
# URI hardcoded nel file (VIRTUALSERVICE_MONGO_URI_OLD)
node scripts/backup-old-db.js

# URI custom passato come argomento
node scripts/backup-old-db.js "mongodb+srv://user:pass@host/db"
```

**Output:**

File JSON in `backups/backup-old-<timestamp>.json` con struttura:

```json
{
  "meta": {
    "createdAt": "2026-04-18T07:51:09.000Z",
    "version": 1,
    "dbName": "vs",
    "uri": "mongodb+srv://***@cluster0.ay5wl.mongodb.net/vs",
    "totalDocuments": 149,
    "collections": ["users", "services", "logs", "test"]
  },
  "collections": {
    "users":    [...],
    "services": [...],
    "logs":     [...],
    "test":     [...]
  }
}
```

**Note:**
- La cartella `backups/` è in `.gitignore` — i file non vengono committati.
- L'URI del vecchio cluster è salvato in `apps/backend/.env` come `VIRTUALSERVICE_MONGO_URI_OLD`.

---

## migrate-db.js

Migra i dati dal vecchio schema (backup JSON prodotto da `backup-old-db.js` o dall'export del vecchio DB) al nuovo schema MongoDB.

Gestisce le differenze tra i due schemi:

| Entità | Trasformazioni principali |
|--------|--------------------------|
| `User` | `salt`+`hashedPassword` (PBKDF2) → `password: null`; `image` → `avatarUrl`; `userId: "google_XXX"` → `googleId: "XXX"`; aggiunge `isEmailVerified: true`, `role` |
| `Service` | `starred: 0/1` → `boolean`; rimuove `author`, `callsCount`, `functions`; aggiunge `schedulerFn: ''` |
| `ServiceCall` | `verb` lowercase → UPPERCASE; `respType: 'object'` → `'json'`; aggiunge `file`, `headers`, `cookies` |
| `ServiceCallParameter` | `id` → `code`; aggiunge `key: ''` |
| `ServiceCallRule` | rimuove `_id` spurio |

I servizi il cui `owner` non corrisponde ad alcun utente nel backup (servizi orfani) vengono automaticamente riassegnati all'utente admin.

**Uso:**

```bash
# Dry run — mostra cosa verrebbe inserito senza scrivere sul DB
node scripts/migrate-db.js backups/backup-old-2026-04-18T07-51-09.json --dry-run

# Migrazione effettiva sul DB locale (legge VIRTUALSERVICE_MONGO_URI dall'env)
node scripts/migrate-db.js backups/backup-old-2026-04-18T07-51-09.json

# Migrazione su URI specifico
node scripts/migrate-db.js backups/backup-old-2026-04-18T07-51-09.json --mongo-uri "mongodb://localhost:27017/virtualservice"
```

**Argomenti:**

| Argomento | Descrizione |
|-----------|-------------|
| `<backup.json>` | Percorso del file JSON di backup (obbligatorio) |
| `--dry-run` | Mostra statistiche ed esempi senza scrivere sul DB |
| `--mongo-uri <uri>` | URI MongoDB di destinazione (se non passato, usa `VIRTUALSERVICE_MONGO_URI` dall'env) |

**Comportamento in caso di documenti già esistenti:**

La migrazione usa `upsert` con `$setOnInsert`: i documenti con `_id` già presente nel DB di destinazione vengono saltati, quelli nuovi vengono inseriti. È quindi idempotente e sicura da rieseguire.

**Flusso tipico di migrazione:**

```bash
# 1. Eseguire il backup dal vecchio DB
node scripts/backup-old-db.js

# 2. Verificare il risultato con dry run
node scripts/migrate-db.js backups/backup-old-<timestamp>.json --dry-run

# 3. Eseguire la migrazione effettiva
node scripts/migrate-db.js backups/backup-old-<timestamp>.json
```

**Note:**
- Gli utenti migrati hanno `password: null` perché il vecchio hashing (PBKDF2+salt) è incompatibile con bcrypt. Dovranno reimpostare la password tramite "Forgot password".
- Gli utenti Google OAuth vengono migrati correttamente e possono accedere subito.

---

## deploy.js (gulpfile)

Script gulp per la build di produzione completa. Viene invocato tramite `npm run build`.

```bash
npm run build
# equivale a:
npx gulp deploy
```

**Fasi eseguite in sequenza:**

1. **clean** — elimina la cartella `dist/`
2. **build** — esegue `nx run-many -t build -p frontend backend --configuration=production`
3. **compileSamples** — compila i file TypeScript dei samples del worker (`apps/backend/src/app/mock-server/workers/samples/index.ts`) in `dist/apps/backend/samples/`

**Avvio in produzione dopo la build:**

```bash
npm start
# equivale a:
node dist/apps/backend/main.js
```

---

## Backup via UI (admin)

Oltre agli script, il backup del DB corrente è disponibile dall'interfaccia web alla pagina `/management` (solo ruolo admin), tramite il pulsante **Backup**.

Differenze rispetto a `backup-old-db.js`:

| | Script `backup-old-db.js` | Backup UI |
|---|---|---|
| Collection `logs` | inclusa | **esclusa** |
| DB sorgente | configurabile (default: vecchio cluster) | DB corrente dell'app |
| Formato | JSON (tutte le collection) | JSON (solo `users` + `services`) |
| Autenticazione | nessuna (accesso diretto MongoDB) | richiede login admin |
