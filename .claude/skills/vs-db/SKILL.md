---
name: vs-db
description: >
  Skill per il progetto virtualservice (NX monorepo in C:\Leo\sviluppo\virtualservice).
  Gestisce operazioni sul database MongoDB tramite gli script Node.js del progetto.
  Usala quando l'utente chiede di: fare un backup del vecchio db, scaricare dati dal db,
  migrare un backup, importare dati nel nuovo db, eseguire la migrazione da vecchio a nuovo schema.
  Trigger tipici: "fai un backup del vecchio db", "backup old db", "migra il backup",
  "esegui la migrazione", "migra questo backup sul nuovo db", "importa il backup".
---

# vs-db — Operazioni Database VirtualService

Questa skill gestisce due operazioni sul database del progetto `virtualservice`:
1. **Backup** del vecchio DB tramite `scripts/backup-old-db.js`
2. **Migrazione** di un backup al nuovo schema tramite `scripts/migrate-db.js`

Tutte le operazioni si eseguono dalla root del progetto: `C:\Leo\sviluppo\virtualservice`.
Il file `.env` con le connessioni è in `apps/backend/.env`.

---

## Regola generale: non mostrare mai le URI in chiaro

Quando leggi le URI dal `.env` e le mostri all'utente, maschera sempre la password:
sostituisci la parte `:<password>@` con `:***@`.

Esempio: `mongodb+srv://user:***@cluster0.xyz.mongodb.net/db`

---

## Operazione 1: Backup

### Quando usarla
L'utente vuole scaricare/salvare i dati da un cluster MongoDB (tipicamente il vecchio DB).

### Procedura

**Step 1 — Chiedi la connessione**

Leggi `apps/backend/.env` ed estrai tutte le variabili che contengono `MONGO_URI` nel nome.
Mostra all'utente solo i **nomi** delle variabili (non i valori) e chiedi quale usare.

Esempio di output:
```
Connessioni disponibili nel .env:
  1. VIRTUALSERVICE_MONGO_URI       (locale)
  2. VIRTUALSERVICE_MONGO_URI_REAL  (produzione)
  3. VIRTUALSERVICE_MONGO_URI_OLD   (vecchio cluster)

Quale connessione vuoi usare per il backup?
```

**Step 2 — Esegui il backup**

Una volta che l'utente ha scelto, leggi il valore corrispondente dal `.env` ed esegui:

```bash
node scripts/backup-old-db.js "<uri>"
```

dalla root del progetto (`C:\Leo\sviluppo\virtualservice`).

**Step 3 — Mostra il risultato**

Mostra l'output dello script e il path completo del file generato nella cartella `backups/`.

---

## Operazione 2: Migrazione

### Quando usarla
L'utente vuole importare dati da un file di backup JSON nel formato prodotto da `backup-old-db.js`
verso un cluster MongoDB con il nuovo schema del progetto.

### Procedura

**Step 1 — Identifica il file di backup**

Se il file di backup non è già chiaro dal contesto della conversazione, elenca i file
presenti in `backups/` (ordinati per data, più recente prima) e chiedi all'utente quale usare.

**Step 2 — Chiedi la connessione di destinazione**

Leggi `apps/backend/.env`, estrai le variabili con `MONGO_URI` nel nome e mostra solo i nomi.
Suggerisci `VIRTUALSERVICE_MONGO_URI` come default.

Esempio:
```
Connessioni disponibili:
  1. VIRTUALSERVICE_MONGO_URI       (locale) ← default
  2. VIRTUALSERVICE_MONGO_URI_REAL  (produzione)
  3. VIRTUALSERVICE_MONGO_URI_OLD   (vecchio cluster)

Su quale DB eseguire la migrazione? [invio = VIRTUALSERVICE_MONGO_URI]
```

**Step 3 — Dry run obbligatorio**

Prima di qualsiasi scrittura, esegui sempre il dry run:

```bash
node scripts/migrate-db.js "<backup-file>" --dry-run
```

Mostra l'output completo all'utente: numero di utenti, servizi, endpoint, servizi orfani, ecc.

**Step 4 — Chiedi conferma esplicita**

Dopo il dry run, mostra un riepilogo e chiedi conferma esplicita prima di procedere.
Non procedere se l'utente non conferma chiaramente.

Esempio:
```
Dry run completato. Verranno migrati:
  - 20 utenti (3 con Google OAuth)
  - 129 servizi (87 attivi, 12 con stella)
  - 342 endpoint totali

Destinazione: VIRTUALSERVICE_MONGO_URI_REAL (mongodb+srv://***@cluster0.xyz.net)

Procedo con la migrazione reale? (sì/no)
```

**Step 5 — Esegui la migrazione**

Se l'utente conferma, leggi l'URI scelto dal `.env` ed esegui:

```bash
node scripts/migrate-db.js "<backup-file>" --mongo-uri "<uri>"
```

**Step 6 — Mostra il risultato**

Mostra l'output completo dello script con i contatori di documenti inseriti/saltati.

---

## Note sugli script

### backup-old-db.js
- Scarica **tutte** le collection (inclusi i log, a differenza del backup via UI).
- Salva in `backups/backup-old-<timestamp>.json`.
- L'URI è passato come primo argomento; se omesso usa il valore hardcoded nel file.

### migrate-db.js
- Trasforma i dati dal vecchio schema al nuovo (utenti, servizi, call, parametri, regole).
- Usa `upsert` con `$setOnInsert`: idempotente, i documenti già presenti vengono saltati.
- Gli utenti migrati hanno `password: null` (hashing PBKDF2 incompatibile con bcrypt):
  dovranno reimpostare la password, ma gli utenti Google OAuth funzionano subito.
- I servizi orfani (owner non presente tra gli utenti) vengono riassegnati all'admin.
- Documentazione completa in `claude/tools.md`.
