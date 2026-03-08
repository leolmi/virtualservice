
Per le definizioni delle classi si fa riferimento al file **./model.md**.

L'host dell'applicazione distribuita è al momento: "https://virtualservice.herokuapp.com"

## Espressioni e dati string-js

Le espressioni sono considerate nell'ambito dell'applicazione script javascript.

Ogni proprietà stringa di tipo string-js è di fatto un'espressione quindi una porzione di script javascript.

Il calcolo di un'espressione è demandato a del codice eseguito in uno Worker dedicato. 

La classe per l'esecuzione "calc.ts" è qualcosa del tipo:
````
import { Worker } from 'worker_threads';
import * as path from 'path';

/**
 * ENV VARIABLES:
 *
 *    CALC_CODE_EXECUTING_TIMEOUT           The script execution timeout in milliseconds (10000).
 *    CALC_MAX_YOUNG_GENERATION_SIZE_MB     The maximum size of the main heap in MB (64).
 *    CALC_MAX_OLD_GENERATION_SIZE_MB       The maximum size of a heap space for recently created objects (64).
 *    CALC_CODE_RANGE_SIZE_MB               The size of a pre-allocated memory range used for generated code (64).
 */


export interface CalcResult {
  value?: any;
  db?: any;
  error?: any;
}

export default (exp: string, scope: any, tmo: number = 0) => {
  return new Promise((res, rej) => {
    const timeout: number = tmo||(parseInt(process.env.CALC_CODE_EXECUTING_TIMEOUT, 10)||10000)+1000;
    const o: any = {
      workerData: {
        exp: exp,
        scope: scope,
        timeout: timeout
      },
      resourceLimits: {
        maxYoungGenerationSizeMb: process.env.CALC_MAX_YOUNG_GENERATION_SIZE_MB||64,
        maxOldGenerationSizeMb : process.env.CALC_MAX_OLD_GENERATION_SIZE_MB||64,
        codeRangeSizeMb: process.env.CALC_CODE_RANGE_SIZE_MB||64,
      }
    };
    const calc_source = path.join(__dirname,'calc.js');
    // console.log('RUN CALC', o);
    let tm = null;
    const worker = new Worker(calc_source, o);
    worker.on('message', (m) => {
      clearTimeout(tm);
      res(m);
    });
    worker.on('error', (err) => {
      clearTimeout(tm);
      rej(err);
    });
    worker.on('exit', (code) => {
      clearTimeout(tm);
      if (code !== 0)
        rej(new Error(`Calc stopped with exit code ${code}`));
    });
    tm = setTimeout(() => {
      rej(new Error(`Calc execution timed out!`));
      worker.terminate();
    }, timeout);
  });
};
````

mentre il codice eseguito nello Worker è in una classe "calc.js" del tipo:

````
const _ = require('lodash');
const { isMainThread, parentPort, workerData } = require('worker_threads');
const vm = require('vm');

const _guid = (mask) => (mask || 'xx-x-x-x-xxx').replace(/[x]/g, () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1));

const _isPromiseLike = (prm) => _.isObject(prm) && _.isFunction(prm.then);

const _isJson = (exp) => /^[\{\[]/g.test((exp||'').trim());

if (isMainThread) {
  console.warn('Calc is available on secondary thread only!');
} else {
  const data = workerData;
  const scope = _.cloneDeep(data.scope);
  scope._ = _;
  scope.setTimeout = setTimeout;
  scope.guid = _guid;
  let exp = (data.exp || '').trim();
  if (_.startsWith(exp, '=')) exp = exp.substr(1);
  if (_isJson(exp)) exp = `return ${exp}`;
  exp = `result = (function(){${exp}})();`;
  scope.result = null;
  if (!!data.verbose) console.log('EVAL EXP', exp);

  const script = new vm.Script(exp);
  const context = vm.createContext(scope, {
    codeGeneration: {
      strings: false,
      wasm: false
    }
  });
  try {
    script.runInNewContext(context, {
      timeout: data.timeout||10000,
      contextCodeGeneration: {
        strings: false,
        wasm: false
      }
    });
    if (_isPromiseLike(scope.result)) {
      scope.result.then(
        (r) => parentPort.postMessage({ value: r, db: scope.db }),
        (err) => parentPort.postMessage({ error: err })
      )
    } else {
      parentPort.postMessage({ value: scope.result, db: scope.db });
    }
  } catch (err) {
    if (!!data.verbose) console.log('EXPRESSION ERROR: ', err);
    parentPort.postMessage({ error: err });
  }
}
````




## Entry-Points

un url di questo tipo 'https://virtualservice.herokuapp.com/service/... ' rappresenta al momento il punto di ingresso per le chimate ai mock definite dagli utenti.

Questo entry-point del server, identificabile dalla regex:
/^([^?]{2,})\/service\/(.{2,})/gm
effettuata sull'url della request, intercetta tutte le richieste che arrivano sugli endpoint del servizio
		
Quindi si deve ricercare il servizio a cui fa riferimento tra quelli salvati dagli utenti su mongodb;
	
Il resto del path quindi sarà qualcosa del tipo:
/service/service-path/call-path/...
dove 
	- **service-path** indica quella porzione di path che l'utente ha specificato nella property **path** della classe **Service** e che contestualizza la chiamata su quello specifico servizio, questo è sempre e solo il primo segmento dopo "service";
	- **call-path** insieme al methodo permettono di trovare nel servizio la specifica chiamata **ServiceCall**, altre informazioni nella sezione *call-path*. Nell'url rappresenta la parte successiva dopo il service-path fino all'eventuale query-string;
	
Caso particolare: se il metodo della request è **OPTIONS** è sufficiente che esista una qualsiasi chiamata nel servizio attivo (proprietà del servizio **active** = true) con quel valore di path per restituire una risposta positiva ma priva di dati;

Se il servizio individuato ha il valore della property **active** a false è necessario rispondere con un errore 500 con descrizione "Service not active!"

Se non viene individuato o il servizio o la chiamata deve essere restituito un errore 404;
	
La prima volta che il servizio viene invocato su una chiamata che da risposta deve essere inizializzata la cache dei dati del servizio e attivato l'avvio della funzione **schedulerFn**, se definita, con il timeout espresso nella proprietà **interval**;
La cache dati del servizio non è altro che il valore calcolato del **dbo** come espressione.
Tale cache vive soltanto in memoria fin tanto che il server è attivo e si resetta quindi al suo riavvio. Così pure la schedulerFn sarà attuata da un timer fintanto che il servizio è attivo.
	
Quindi si verificano le regole associate alla chiamata e per ogni regola **ServiceCallRule**:
	si calcola lo scope (vedi sezione *scope d'espressione*) per eseguire l'espressione **expression** definita nella regola;
	si calcola l'espressione e se risulta verificata (restituisce true) deve essere restituita una response con il code definito nella property **code** della regola ed il messaggio d'errore presente in **error**

Se infine nessuna regola è verificata si restituisce la response, vedi sezione *response*


## scope d'espressione
Lo scope (oggetto generico javascript) per l'esecuzione delle espressioni deve essere esattamente coerente con quello utilizzato dal client nella fase di costruzione del mock da parte dell'utente, quindi dovrà in entrambi i casi contenere sempre le stesse proprietà.

Al momento contiene queste proprietà:
- params: oggetto js che ha come proprietà i nomi dei parametri presenti nella query-params (solo parametri con target `query`) dell'url;
- data: oggetto js creato con il body della request;
- db: oggetto js valorizzato con la cache dei dati del servizio;
- headers: corrisponde all'oggetto headers della request;
- cookies: corrisponde all'oggetto cookies della request;
- pathValue: oggetto js con tutti i valori presenti in path (non nel query-string, solo parametri con target `path`);
- value: valorizzato solo per la validazione delle regole riporta il risultato di:
	`get(rule.path, _getData(req))`
	dove 
	  - `get`: metodo della libreria lodash;
	  - `_getData = (req: Request) => ['POST','PUT','PATCH'].includes(req.method) ? req.body : req.query;`

## calcolo espressioni

L'esecuzione della funzione **schedulerFn** non è legata alla request eventuale ma solo al contesto attivo quindi conosce il db oltre agli elementi standard aggiunti autonomamente dal worker e può aggiornarlo (il db) ogni volta. Il responsabile è **system** ossia il superutente che impersona il servizio e non è legato a nessun utente reale;

In caso di **interval** <= 0 oppure per qualsiasi valore non numerico si considera disabilitato l'aggiornamento temporale del db e quindi l'esecuzione della **schedulerFn**;

L'esecuzione della **schedulerFn** sarà reiterato con un setTimeout al termine dell'esecuzione precedente a prescindere dall'esito del calcolo, quindi non sarà pilotato da un setInterval;

Nell'editor sarà validato il valore nel range >= 0;

se il calcolo restituisce errore per le property `string-js`:
per la classe `Service`:
	- **dbo** se genera errore viene notificato in console e generato un oggetto js vuoto `{}`;
	- **schedulerFn** avviene la stessa cosa: non viene eseguito alcun aggiornamento del db ma notificato l'errore in console dell'applicazione;
per la classe `ServiceCall`:
	- **response** in caso di error viene restituito errore 500 all'utente con il messaggio d'errore originale del calcolo;
	- **body** viene restituito errore direttamente sul componente che gestirà il test;
per la classe `ServiceCallRule`:
	- **expression** nell'ambito delle regole viene notificato l'errore solo il console dell'applicazione e viene considerato il risultato `false` nel calcolo della validità (per l'utente finale non c'è percezione);
	
Il db aggiornato (se non in presenza di errori) deve andare sempre a sostituire quello nella cache.

## CORS

Per quanto riguarda il cors l'applicazione, intendendo gli endpoint pubblici del backend, deve essere invocabile da qualsiasi contesto esterno quindi il cors deve poter permettere ogni possibile interazione da domini esterni.


## call-path
La call-path, come parte dell'url, in fase di analisi della chiamata utente è una porzione di url che può contenere separatori "/", ma non query-string;
In fase di editing della call da parte dell'utente questa può definire dei marcatori. Per fare un esempio, l'utente può inserire qualcosa del tipo: "my/route/{detail}/{value}"
intendendo che 
 - "my": parte fissa del path;
 - "route": parte fissa del path;
 - "{detail}": parte dinamica del path;
 - "{value}": parte dinamica del path;

in questo caso quindi si definirebbero 2 parametri per la call:
- un parametro "detail" con target "path";
- un parametro "value" con target "path";

Se l'url parziale ricevuto in corrispondenza della call-path è qualcosa del tipo "my/route/sector/6", nel calcolo dello scope d'espressione quindi il valore di **pathValue** sarebbe in questo caso:
````
pathValue = {
  detail: 'sector',
  value: '6'
}
````

Se due call-path di uno stesso servizio collidono si verificano prima i path espliciti ossia quelli senza marcatori.

## response
La response potrà essere un download di file se la proprietà **respType** della chiamata ha il valore "file", oppure calcolata col valore della proprietà **response** negli altri casi.

La response per la specifica ServiceCall dovrà contenere gli headers ed i cookies specificati nella classe `ServiceCall`;

Calcolo dell'espressione **response** (value si intende il risultato dell'esecuzione):
- in caso di errore deve restituire un 500 con l'errore scaturito;
- nel caso di valore risultante non stringa sarà utilizzato il codice:
	`res.status(200).json(value);` dove res è la Response express;
- nel caso di valore stringa secondo il respType indicato:
	- json → JSON.stringify(value) con Content-Type: application/json;
	- text → .toString() con Content-Type: text/plain
	- html → stringa con Content-Type: text/html


## file download

I path inseriti sono path relativi per le risorse disponibili nell'applicazione (solo i doc presenti in assets sono utilizzabili).

Ogni altro path o nel caso il file non esistesse in quel path, deve generare un errore 500 notificando all'utente l'impossibilità di consegnare il file indicato.

Gli headers sono onere dell'utente che crea e valorizza la classe `ServiceCall`, magari degli warning in fare di editing possono indicare la strada corretta in relazione al documento scelto.

