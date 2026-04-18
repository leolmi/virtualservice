## Management Page

Rotta prevista `/management`;

Componente: `apps/frontend/src/app/management/management.component.ts`;
Servizio: `apps/frontend/src/app/management/management.service.ts`;

Rotta attivabile solo da ruolo `admin` (protetta da `adminGuard`).

Permette di gestire l'applicazione e gli utenti.


## Toolbar

Pulsante attivato in toolbar:
- `services`: icona `view_module`, tooltip `My services list` — torna alla lista servizi;


## Struttura della pagina

### Header

Contiene:
- campo di ricerca per filtrare gli utenti per email;
- indicatore del numero di utenti con cancellazione richiesta (`deletionCount`);
- pulsante **Backup** (con `mat-progress-spinner` durante il download): esegue il download del backup JSON completo del database via `GET /users/backup`;
- pulsante **Send email**: apre il dialog `SendMailDialogComponent` per inviare una mail a tutti gli utenti o ai selezionati;
- checkbox "select all" per selezionare/deselezionare tutti gli utenti filtrati;


## Lista utenti

Ogni utente (`ManagedUser`) è mostrato come riga espandibile con:

**Header riga** (sempre visibile):
- checkbox di selezione;
- avatar (se disponibile) o icona placeholder;
- email;
- badge del ruolo (`admin`/`user`);
- metodo di autenticazione (`Google` se ha `googleId`, altrimenti `Local`);
- stato verifica email;
- data di creazione;
- numero di servizi;

**Sezione espansa** (visibile al click sulla riga):
- lista dei servizi dell'utente con nome, path, stato attivo, stato starred;
- per ogni servizio: pulsante **Open** (apre l'editor) e pulsante **Download** (scarica il JSON del servizio).
- pulsante **Change email** — apre il dialog `EditEmailDialogComponent` per cambiare l'email dell'utente; sul backend l'azione azzera anche la password e invia un link di reset al nuovo indirizzo via `PATCH /users/:id/email`;
- pulsante **Reset password** — invia un'email di reset password all'utente (nessuna password viene impostata): `POST /users/:id/reset-password` (con conferma dialog);
- pulsante **Force password** — apre il dialog `SetPasswordDialogComponent` per impostare direttamente una nuova password. Nessuna mail viene inviata: l'admin si fa carico di comunicarla all'utente. `PATCH /users/:id/password`;
- pulsante **Restore** (visibile solo se `deletionRequestedAt` è valorizzato) — ripristina l'utente annullando la richiesta di cancellazione via `PATCH /users/:id/restore` (con conferma dialog);
- pulsante **Delete permanently** — elimina l'utente e tutti i suoi servizi via `DELETE /users/:id` (con conferma dialog).


## Dialog: Edit Email (`EditEmailDialogComponent`)

Percorso: `apps/frontend/src/app/management/edit-email-dialog/`;

Permette all'admin di modificare l'email di un utente. Mostra l'email corrente in sola lettura e un campo per la nuova email (validazione `email` + `required`). Alla conferma il backend verifica l'unicità della nuova email, azzera la password dell'utente, marca l'email come verificata e genera un token di reset password che viene inviato al nuovo indirizzo. L'utente dovrà quindi reimpostare la password (o usare OAuth) per accedere.


## Dialog: Set Password (`SetPasswordDialogComponent`)

Percorso: `apps/frontend/src/app/management/set-password-dialog/`;

Permette all'admin di forzare una nuova password sull'utente. Mostra l'email dell'utente e un campo password (con toggle visibilità) validato `MinLength(8)`. Nessuna mail viene inviata: spetta all'admin comunicare la password all'utente. Sul backend l'azione hasha la password, marca l'email come verificata e invalida eventuali token di reset/verifica pendenti.


## Dialog: Send Mail (`SendMailDialogComponent`)

Percorso: `apps/frontend/src/app/management/send-mail-dialog/`;

Permette di comporre una email da inviare a:
- tutti gli utenti (se nessuno selezionato nella lista);
- solo agli utenti selezionati.

Campi:
- **subject**: oggetto dell'email;
- **body**: testo del corpo.

Dopo la conferma, la mail viene inviata via `POST /users/send-mail` con `{ subject, body, userIds? }`.
La response restituisce `{ sent: number, failed: number }` mostrati in un dialog di feedback.


## Interfacce dati

```typescript
interface ManagedUser {
  _id: string;
  email: string;
  googleId?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isMigrated?: boolean;
  deletionRequestedAt?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  services: UserService[];
  serviceCount: number;
}

interface UserService {
  _id: string;
  name: string;
  path: string;
  active: boolean;
  starred: boolean;
}
```


## API backend coinvolte

- `GET /users` — lista di tutti gli utenti con i loro servizi (solo admin);
- `GET /users/backup` — download backup JSON completo (solo admin);
- `DELETE /users/:id` — elimina utente e relativi servizi (solo admin);
- `PATCH /users/:id/restore` — annulla richiesta di cancellazione (solo admin);
- `POST /users/:id/reset-password` — invia email di reset password all'utente (solo admin);
- `PATCH /users/:id/email` — aggiorna email utente, azzera la password e invia link di reset al nuovo indirizzo (solo admin);
- `PATCH /users/:id/password` — forza una password sull'utente, nessuna mail inviata (solo admin);
- `POST /users/send-mail` — invia email a utenti (solo admin);
- `GET /services/:id` — recupera servizio singolo (per download).
