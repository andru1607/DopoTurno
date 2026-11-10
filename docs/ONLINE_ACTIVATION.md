# DopoTurno · attivazione online 2.9

## Stato effettivo

La preview v2.9 rimane **locale di default**, anche se contiene il codice per account, discussioni condivise, backup espliciti e curriculum con autorizzazione.

Non usare il progetto Supabase **Nexo** (pzspfhyvywboswhathuh): è dedicato a un'altra applicazione. Occorre un **nuovo progetto esclusivo** per DopoTurno, un'organizzazione scelta dall'utente, conferma di eventuali costi e un passaggio di revisione della sicurezza prima dell'attivazione.

La preview non fa chiamate esterne se le variabili non sono configurate; /api/status restituisce {"configured":false,"mode":"local"}. Nessun dato della demo viene importato o pubblicato automaticamente.

## Preparazione della nuova istanza

1. L'utente sceglie l'organizzazione Supabase di destinazione e approva eventuali costi preventivati.
2. Creare un **nuovo** progetto Supabase, preferibilmente regione europea, senza riutilizzare altri database di produzione.
3. Abilitare **email confirmation** in Auth; configurare Site URL, link di conferma, SMTP appropriato, restrizioni anti-abuso, privacy e trattamento dati. Non consentire registrazioni anonime per i dati di CV.
4. Applicare db/dopoturno_online_schema.sql sul solo progetto DopoTurno tramite una migrazione Supabase revisata. La nuova Data API richiede grant espliciti; lo schema crea le tabelle con RLS e i GRANT minimi.
5. Eseguire advisors SQL/security, poi testare con **due utenti verificati**: un utente non deve poter leggere CV, progressi o modificare post di altri utenti. La lettura del CV deve funzionare esclusivamente dopo un invito a email confermata e scadere immediatamente con revoca.
6. In **Vercel > DopoTurno > Environment Variables**, aggiungere:
   - DT_SUPABASE_URL: es. https://[nuovo-project-ref].supabase.co.
   - DT_SUPABASE_PUBLISHABLE_KEY: la chiave **publishable** sb_publishable_..., non service_role e non chiave segreta.
   Le variabili devono restare server-side. Nessuna chiave è inclusa nei file JS client.
7. Ridistribuire DopoTurno e verificare /api/status, /api/auth, /api/community, /api/progress, /api/cv con test browser su dominio definitivo.
8. Predisporre **moderazione reale**, gestione delle segnalazioni, protezione rate-limit, policy retention/cancellazione, termini e privacy validati, prima di consentire il lancio aperto al pubblico.

Non pubblicare contenuti generati dagli utenti prima dei test di moderazione e privacy.

## Contratti applicativi

- GET /api/status: nessuna sessione, configured true/false.
- POST /api/auth: login, signup, logout; i token restano in cookie HttpOnly, Secure, SameSite=Lax; GET identifica la sessione.
- GET /api/community?kind=messaggio|confronto: post e commenti reali di utenti autenticati, separati dai dati illustrativi.
- POST /api/community: post, comment, report; DELETE per post/commenti propri. Non esiste una casella messaggi privati uno-a-uno.
- GET /api/progress: snapshot privato. POST con azione save: **solo su conferma esplicita**; il payload non include CV, test sospeso o post locali.
- GET /api/cv: proprio CV e inviti attivi; scope=received: CV accessibili in base a grant. POST: save privato, grant a un indirizzo email scelto (7/30/90 giorni), revoke.
- Sessioni/server: l'API parla con Supabase via Vercel Functions, restituisce solo dati strettamente necessari. Nessuna service_role key richiesta.

**Accessi RLS**
- dt_posts e dt_comments: lettura autenticata; scrittura e cancellazione solo dell'autore.
- dt_reports: scrittura autenticata, nessuna lettura pubblica (dashboard moderatori non ancora implementata).
- dt_progress: proprietà esclusiva di auth.uid().
- dt_cv: privato, salvo autorizzazione attiva e non scaduta per email dell'utente verificato in Auth.
- dt_cv_grants: solo proprietario può creare, rinnovare o revocare. La scadenza è limitata a 90 giorni da ogni autorizzazione.

## Test di accettazione obbligatori prima dell'apertura

- Visitando senza configurazione, nessun form consente una falsa registrazione; app/Academy/Community locale/CV funzionano invariati.
- Due utenti confermati (A e B): post visibile a entrambi, A può eliminare solo post propri, B non può forzare cancellazione di A.
- Post/commenti HTML vengono codificati come testo, senza esecuzione JavaScript.
- Dati del CV di A e progressi di A non accessibili a B di default, neppure chiamando direttamente Data API.
- A autorizza l'email di B a leggere il CV; B legge il CV; A revoca; B non lo vede più. Un terzo utente non lo vede mai.
- Salvataggio progressi solo su click, ripristino richiede conferma; nessuna risposta di test concluso è resa pubblica.
- Ripresa della sessione da refresh cookie, logout, email non confermata, password errata, scadenza, ripristino dopo rete assente.
- Protezione da spam e abuso con tempi di risposta della moderazione, controllo formati, backup/restore, qualità mobile fisico iOS e Android.

## Limiti

Lezioni, valutazioni e simulazioni sono contenuti prototipali. La piattaforma non rilascia attestati né certificazioni professionali. Prima di pubblicare in produzione verificare anche contenuti safety-critical (allergeni, HACCP, procedure) con professionisti competenti.

La sincronizzazione è **manuale**, non realtime. Il modello è progettato per minimizzare i dati e lasciare la scelta all'utente.
