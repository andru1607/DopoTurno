# DopoTurno Academy v2.4.1 · Collaudo, accessibilità e revisione didattica

**Preparato il 6 novembre 2026.** Documento di rilascio per il prototipo. Non è un certificato di accessibilità o una validazione professionale indipendente.

## Interventi correttivi inclusi

1. **Orientamento da tastiera e lettori di schermo.** Dopo una scelta, l'interfaccia porta il focus sul feedback; «Prosegui» porta alla domanda successiva; il completamento porta al titolo del debriefing. L'apertura del caso e l'ispezione della mappa mantengono un riferimento di focus accessibile. I filtri conservano il focus sul pulsante scelto.
2. **Pulsanti leggibili al tocco.** Le stazioni delle mappe, i filtri e le azioni principali delle simulazioni hanno un target di almeno 44 × 44 CSS px. Anche le tappe delle microlezioni sono state portate a 44 × 44 CSS px, con layout che va a capo quando lo spazio manca.
3. **Ricerca stabile mentre si digita.** Il catalogo delle simulazioni filtra gli elementi già presenti nel DOM senza ricreare la pagina a ogni tasto; ciò evita la perdita del focus e riduce le probabilità che la tastiera mobile si chiuda.
4. **Supporto a movimento ridotto e focus visibile.** L'UI mantiene un'indicazione del focus sufficientemente riconoscibile, lo spostamento è immediato e non introduce animazioni forzate.
5. **Privacy invariata.** Risultati e sessioni restano nel browser e nei backup volontari. Nessun risultato viene condiviso automaticamente con datori di lavoro.

## Test automatici

- `node --test tests/*-smoke.cjs`: test di integrità delle 18 simulazioni, sicurezza e escaping, 72 capitoli, Skill Check e progressi, import/export e posizionamento formativo.
- `tests/mobile-browser.e2e.cjs`: controlli in **Chromium** con viewport **320, 375, 390, 430, 768 e 1280 px**; overflow orizzontale, 44px minimi per pulsanti delle mappe e dei filtri, ricerca senza perdita del focus, navigazione, mappa, feedback soltanto dopo la scelta, focus dopo avanzamento e risultato, assenza di eccezioni JavaScript.
- `.github/workflows/academy-qa.yml`: esecuzione dei test ad ogni push su `main` e pull request, con server statico locale e Chromium headless.

La simulazione di viewport mobile **non equivale** a un test fisico su iPhone né usa WebKit/Safari. I risultati effettivi sono consultabili nella scheda Actions di GitHub dopo l'esecuzione.

## Verifica manuale obbligatoria su iPhone

Dispositivo di riferimento: iPhone con Safari e iOS aggiornati. Controllare **verticale e orizzontale**, zoom del testo, tastiera a schermo e VoiceOver. Registrare per ogni controllo dispositivo, versione OS, problema rilevato, screenshot senza dati privati, gravità, correzione e verifica successiva.

| Area | Passaggio manuale | Risultato atteso |
|---|---|---|
| Catalogo | Apri `/#simulazioni`, cerca «allergeni», elimina il testo | Tastiera stabile, elenco coerente, nessun salto orizzontale |
| Filtri | Seleziona Sala, Cucina e Bar e ciascuna fase | Filtri raggiungibili, feedback sul numero dei casi, testo leggibile |
| Mappa | Apri S02, tocca i cinque punti | Nessun punto si sovrappone in modo ingestibile, lettura della zona corretta |
| Scelta | Seleziona una risposta, osserva il feedback | Il feedback compare **soltanto dopo** l'azione ed è interamente leggibile |
| Sequenza | Completa tre decisioni, poi il debriefing | Nessuna perdita di stato, nessun salto di scroll che faccia perdere il contesto |
| VoiceOver | Muoviti fra titoli, pulsanti, opzioni e mappe | Ordine logico, nomi comprensibili, stato della scelta annunciato |
| Testo | Ingrandisci i caratteri dalle impostazioni iOS | Contenuto leggibile, pulsanti non nascosti o tagliati |
| Microlezione | Apri un capitolo e le cinque tappe | Target utilizzabili, righe che vanno a capo senza overlay |
| Persistenza | Interrompi lo scenario a metà e riapri Safari | Ripresa dal passaggio corretto sullo stesso dispositivo |
| Backup | Esporta e reimporta un backup senza dati reali | Solo i dati autorizzati riappaiono, senza errori o duplicazioni |
| Skill Check | Avvia e svolgi una prova senza consegnarla | Nessuna soluzione o aiuto viene mostrato durante il test |
| Rete | Prova modalità aereo dopo il primo caricamento | Documentare il comportamento reale; **non promettere modalità offline** |

## Revisione professionale ancora necessaria

I casi sono esercizi editoriali **non revisionati da un docente esterno**. Non dichiarare che Sala, Cucina o Bar siano stati validati sul campo fino alla raccolta di un riscontro documentato e consensuale da professionisti dei rispettivi reparti.

Per ogni scenario serve una scheda firmata o registrata dal revisore con:
- pertinenza reale al reparto e al livello intermedio;
- plausibilità della sequenza temporale e delle decisioni;
- esistenza di una risposta preferibile verificabile, senza ambiguità irrisolvibili;
- sicurezza degli allergeni, degli alimenti, delle attrezzature e delle persone;
- correttezza del criterio di risposta, senza semplificazioni che dipendano da procedure aziendali non specificate;
- linguaggio professionale e assenza di affermazioni di certificazione;
- raccomandazione: **approva / modifica / sospendi** e motivazione.

### Priorità della revisione per rischio

| Scenari | Rischio più sensibile | Domanda decisiva per il revisore |
|---|---|---|
| Sala S02 e S05 | Allergeni e possibile esposizione | La procedura evita qualsiasi promessa non verificabile? |
| Sala S04 e S06 | Varianti di menu, consegne fra turni | Le richieste vengono riconfermate anche al cambio di persona? |
| Cucina C02, C04, C06 | Cottura, conservazione, lotti | Sono rispettati i controlli previsti dal piano specifico? |
| Cucina C03 e C05 | Variazione ingredienti e uscita | La ricetta aggiornata arriva a sala senza perdita di informazioni? |
| Bar B02, B03 e B06 | Proteine del latte, batch, refrigerazione | L'attrezzatura e i prodotti vengono verificati separatamente? |
| Bar B05 | Somministrazione alcolici ai minori | Il processo rispetta obblighi di controllo dell'età e comunicazione? |

**Criterio di blocco:** qualsiasi ambiguità che possa suggerire una preparazione non sicura, una promessa infondata sugli allergeni o un aggiramento di norme va corretta **prima di usare il corso come formazione operativa pubblica**.

## Limiti delle evidenze

Una suite automatica può verificare DOM, navigazione e logica delle risposte. Non può dimostrare tempi di apprendimento reali, efficacia formativa, compliance normativa in uno specifico locale, idoneità professionale, usabilità in un servizio vero o comportamento identico di Safari/VoiceOver.

## Sviluppi successivi

1. Registrare l'esito del test reale su Safari/iPhone, con eventuali bug riproducibili.
2. Far revisionare i 18 scenari a persone competenti nei tre reparti.
3. Rivedere le soglie del posizionamento e le verifiche con prove pilota non certificate.
4. Solo dopo, decidere il perimetro dei corsi avanzati e del futuro backend multiutente.
