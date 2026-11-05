# DopoTurno / Sicurezza di Confronti

Stato: **v1.9, prototipo solo locale. Non è una community multiutente e non garantisce anonimato assoluto.**

## Quali misure sono già attive

- L'interfaccia non effettua richieste per inviare post, commenti o segnalazioni a server. Non ha account, moderatori remoti o database proprio.
- Racconti, risposte, voti, segnalazioni e preferenze restano nel **localStorage** del browser. La lettura da un dispositivo condiviso, da un'altra persona con accesso fisico o da codice che già gira nello stesso sito resta possibile. Evitare dati personali e sensibili.
- Le stringhe dei post e commenti sono sottoposte a escaping HTML prima del rendering. La CSP impedisce JavaScript inline e script da origini esterne. **style-src contiene ancora unsafe-inline** perché alcuni componenti richiedono stili inline.
- Form e commenti effettuano un controllo preliminare locale di email, telefoni, link, profili social, indirizzi e alcuni nomi di locali. In caso di rilevamento evidente, il salvataggio viene bloccato. Non è un sistema automatico affidabile per eliminare tutti i rischi di reidentificazione.
- Prima di pubblicare un episodio, viene richiesta una conferma esplicita di aver tolto riferimenti identificativi. Non caricare foto o screenshot contenenti dati personali.
- L'utente può eliminare i contenuti **di Confronti** senza cancellare i progressi dei corsi. I file di backup eventualmente esportati rimangono separati e devono essere eliminati manualmente.
- Le segnalazioni presenti nel prototipo sono dimostrative: **NON vengono inviate a moderatori e NON generano interventi reali**.

## Minacce e limiti attuali

| Rischio | Stato |
|---|---|
| Inserimento di script in un post | Encoding HTML + CSP senza inline script |
| Origini/script terzi | Blocchi CSP; script serviti dalla stessa origine |
| Clickjacking / embed | CSP frame-ancestors none e X-Frame-Options DENY |
| Accidentalmente pubblicare contatti | Scanner locale, incompleto; review obbligatoria |
| Esposizione di dati da un dispositivo condiviso | Non risolto: localStorage in chiaro; cancellazione manuale |
| Accesso anonimo a dati di altri utenti | Non applicabile al prototipo; nessun account o backend |
| Impersonificazione, molestie e spam online | **Non risolto**; protezioni server e moderazione necessarie |
| Moderazione delle segnalazioni | **Non disponibile**; solo simulazione locale |
| Diritto alla cancellazione online, data retention | **Non disponibile**; richiederà backend e procedure dedicate |

## Architettura prima di abilitare una community online

1. **Database autonomo di DopoTurno**. Non riusare database o utenti di altre app personali senza una decisione esplicita e una separazione dimostrabile.
2. **Autenticazione reale e conferma di accesso**. Usare ID account privati, mai mostrarli nei post. "Anonimo agli altri utenti" è diverso da "anonimo per la piattaforma": comunicarlo chiaramente prima della prima pubblicazione.
3. **Ruoli e RLS server-side**. Ogni POST, modifica, voto, report e cancellazione deve essere autorizzata lato server. L'utente vede i thread pubblicati ma può modificare solo i contenuti di cui è proprietario. Nessun identificativo proprietario o indirizzo email deve comparire nel feed/API pubblica.
4. **Modello dati separato**. Tabelle per `profiles_private`, `threads`, `comments`, `votes`, `reports`, `moderation_actions`, `blocks`, con campi di proprietario e audit riservati. Le query pubbliche devono restituire solo la vista sicura del feed, mai l'owner ID, gli IP o gli identificativi di moderazione.
5. **Moderazione funzionante**. Segnalazione server-side, coda di revisione, rimozione e ricorso. Escludere attivamente doxxing, divulgazione di clienti/colleghi, diffamazione, minacce e dati privati.
6. **Rate limiting verificabile lato server**. Limiti per account e contesto di abuso, protezioni anti-bot, controlli di lunghezza e normalizzazione; mai fidarsi delle sole validazioni JavaScript lato client.
7. **Privacy e lifecycle**. Trasparenza GDPR su basi giuridiche, tempi di conservazione, operatori, log e backup; diritto di accesso ed eliminazione. Minimizzare i dati e limitare accesso del personale. Policy separata per minori quando applicabile.
8. **Security QA**. Test automatici RLS multi-account, tentativi di leggere/modificare record di altri, injection/XSS, bypass dei limiti, moderation workflow, accessibilità, responsive e ripristino backup.
9. **Deploy gate**. Prima dell'apertura reale: database separato con sicurezza attiva, protezioni RLS testate, segnalazioni gestite realmente e informativa privacy, revisione e test da browser reali.

## Regole non negoziabili

- Mai chiamare una segnalazione "inviata" o un contenuto "moderato" quando esiste solo nel browser.
- Mai definire il sistema "anonimo in assoluto": gli episodi possono essere identificabili anche senza nomi.
- Mai memorizzare service role keys nel frontend o nel repository.
- Mai abilitare feed pubblici finché autorizzazioni e moderazione non siano verificate.

## Verifica di questa fase

`node --test tests/security-smoke.cjs` (Node.js, nessuna dipendenza esterna). I test coprono CSP, assenza di script HTML inline, escaping e controllo privacy di base; **non sostituiscono pentest, audit privacy, test reale su iPhone o test RLS del futuro backend**.

## v2.2: risposte ai casi e ripassi locali

Il sistema conserva anche **microProgress, microReviews, microResponses e microLast** nel browser, ed esporta tali dati nel backup privato. Gli utenti sono invitati a non scrivere nomi di clienti/colleghi o informazioni aziendali sensibili nelle risposte libere. L'importatore valida gli identificativi prima di ripristinare i nuovi dati. Questa misura non equivale alla cifratura dei contenuti nel browser o a un sistema di autenticazione; il dispositivo condiviso resta un rischio.
