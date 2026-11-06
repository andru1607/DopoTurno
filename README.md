# DopoTurno · Academy, Community, Confronti e Carriera

Applicazione dimostrativa mobile-first per le persone che lavorano o si formano nella ristorazione.

**Anteprima iPhone e desktop:** https://dopoturno-academy-preview.vercel.app

## v2.5 · Esperienza professionale e continuità su smartphone

Migliorata l'usabilità delle simulazioni mantenendo i collaudi **Chromium già introdotti nelle versioni 2.4.1 e 2.4.2**: mappa prima delle decisioni su mobile, 44 CSS px per i controlli principali, attenzione al focus dopo ogni risposta, migliore leggibilità e ricerca che non interrompe la tastiera.

**Una simulazione interrotta non viene più persa quando ne apri un'altra.** Ogni caso mantiene la propria bozza; il backup ne valida e ripristina gli stati conservando compatibilità con il vecchio formato. Dopo una decisione debole, l'esercizio mostra il metodo preferibile e la relativa motivazione. Il debriefing propone il passo utile successivo: riprovare, affrontare un altro caso dello stesso reparto o leggere il consiglio tecnico collegato.

Test aggiuntivi: `node --test tests/mobile-accessibility-smoke.cjs`. La pipeline già presente esegue le suite di regressione e i controlli Chromium. **La verifica fisica su Safari/iPhone e la revisione professionale dei casi restano da completare**.

[Protocollo di qualità e test manuali](docs/MOBILE_QA.md) · [Apri le simulazioni](https://dopoturno-academy-preview.vercel.app/#simulazioni).

## v2.4.2 · Correzione layout smartphone verificata con Chromium

Il primo test browser della versione 2.4.1 ha individuato un problema reale di raggiungibilità delle stazioni della mappa, a volte coperte dalle barre di navigazione fisse. La 2.4.2 porta la **mappa prima delle scelte sui telefoni**, la mantiene di lato sui desktop, dà spazio alle barre e migliora lo scroll dei titoli per i lettori di schermo. Il controllo responsive ora verifica anche l'ordine visivo della mappa.

## v2.4.1 · Accessibilità mobile e controlli di qualità

Interventi sul percorso delle simulazioni: **focus mantenuto tra scelta, feedback e debriefing**, target tattili da **44 px** per mappe e filtri, tappe delle microlezioni più facili da utilizzare e ricerca del catalogo senza ricostruzione della schermata a ogni carattere.

Sono stati aggiunti test automatici per la navigazione con tastiera e una suite Chromium che controlla layout e interazioni su sei viewport (320–1280 px), eseguita tramite GitHub Actions. Questo **non sostituisce un test fisico su Safari/iPhone né la revisione dei contenuti da parte di professionisti**.

[Protocollo QA e limiti](docs/ACADEMY_QA_241.md) · [Simulazioni](https://dopoturno-academy-preview.vercel.app/#simulazioni).

## v2.4 · Simulazioni professionali di Sala, Cucina e Bar

Aggiunti **18 casi pratici** (6 per reparto), con **54 decisioni**, **162 alternative**, mappe interattive delle postazioni e conseguenze visibili **dopo ogni scelta**. Il risultato include debriefing tecnico, errori critici e tre principi operativi. La simulazione è formativa e separata dagli Skill Check diagnostici.

I **76 consigli «Trucchi del turno»** possono aprire un caso collegato. Per 56 consigli il collegamento è diretto; negli altri casi la UI indica esplicitamente che lo scenario riguarda soltanto lo stesso reparto. Il progresso si conserva nel browser e nei backup locali, senza qualifiche automatiche.

**Apri:** [Simulazioni](https://dopoturno-academy-preview.vercel.app/#simulazioni) · [Specifiche e limiti](docs/SHIFT_SIMULATIONS.md) · Test: `node --test tests/shift-sim-smoke.cjs`.

## v2.3 · Trucchi del turno

76 suggerimenti operativi: 28 Sala, 24 Cucina e 24 Bar, filtrabili per fase di servizio, reparto e testo. Le tecniche non sostituiscono piano HACCP, procedure aziendali o formazione obbligatoria. [Catalogo](https://dopoturno-academy-preview.vercel.app/#turnTips).

## v2.2 · Microlezioni e ripassi professionali

L'Academy presenta ora i 6 corsi (Sala, Cucina e Bar, Fondamenta e Intermedio) in **72 capitoli suddivisi in 360 microattività**. Ogni capitolo propone **contesto, analisi, procedura, caso applicativo con riflessione scritta e verifica formativa**, senza gamification infantile. L'app salva il punto esatto e propone ripassi a 1, 3, 7, 14 e 30 giorni dopo verifiche riuscite.

Lo Skill Check rimane indipendente: non mostra feedback durante la prova e può suggerire di partire direttamente da una specifica attività, senza marcare i passaggi saltati come studiati. Sono disponibili programma classico, modalità libera, backup privato e ripristino controllato. Non è prevista alcuna certificazione, valutazione professionale osservata o sincronizzazione online.

Dettagli e limiti: [Microlearning](docs/MICROLEARNING.md) · test: `node --test tests/microlearning-smoke.cjs`.

## v2.1 · Tre corsi intermedi completi

Aggiunti percorsi dedicati di **Sala, Cucina e Bar**, ciascuno con **12 lezioni / 4 moduli**, contenuti di livello operativo, procedure, casi applicativi, esercitazioni, schede e fonti. In totale **36 nuove lezioni**, portando l'Academy a **72 lezioni / 24 moduli**.

Ogni corso ha 24 quesiti di allenamento, uno **Skill Check intermedio indipendente da 16 scenari**, verifiche di modulo da 6 quesiti e una finale con 8 situazioni nuove. Il superamento dei fondamentali può suggerire direttamente il corso intermedio senza ripetere le basi. I corsi restano accessibili liberamente e non certificano competenze osservate.

Dettagli: [Programmi intermedi](docs/INTERMEDIATE_COURSES.md) · test: `node --test tests/intermediate-smoke.cjs`.

## v2.0 · Posizionamento guidato dopo lo Skill Check

Lo Skill Check ora genera un percorso personalizzato e privato per Sala, Cucina e Bar. Ogni modulo è valutato separatamente: chi dimostra di conoscere già le basi può accedere direttamente alle verifiche applicative, mentre gli errori critici (per esempio sugli allergeni) indirizzano alle lezioni specifiche. Tutti i corsi restano liberamente consultabili e nessuna lezione viene marcata come studiata dal test.

Il motore e le soglie sono **dimostrativi**, non attribuiscono livelli avanzati, certificazioni o competenze pratiche. Il test non mostra suggerimenti o correzioni fino alla consegna. Dettagli: [Percorso personalizzato](docs/LEARNING_PLACEMENT.md); prove: `node --test tests/placement-smoke.cjs`.

## v1.5 · Academy

| Corso | Lezioni | Moduli | Esercizi nel database | Skill Check | Verifica finale |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sala e ospitalità | 12 | 4 | 48 | 20 prove (16 situazionali + 4 visive) | 8 domande |
| Fondamenti di cucina | 12 | 4 | 36 | 20 scenari e decisioni | 8 domande |
| Fondamenti di bar | 12 | 4 | 36 | 20 scenari e decisioni | 8 domande |

Le lezioni hanno sezioni di comprensione, procedura, applicazione e verifica, oltre ad appunti privati. Ogni modulo di Cucina e Bar ha una verifica da **9 quesiti**. Gli esercizi di lezione mostrano spiegazioni dopo la risposta; gli Skill Check e gli esami di modulo/finali le mostrano soltanto dopo la consegna.

### Cucina

1. Brigata e flusso delle comande
2. Mise en place della partita
3. Utensili, coltelli e superfici
4. Ricevimento delle materie prime
5. Conservazione, etichettatura e rotazione
6. Allergeni e contaminazioni
7. Tagli e uniformità delle preparazioni
8. Cotture: controllo prima dell’intuizione
9. Salse, basi e consistenze
10. Gestire il pass e la sequenza delle uscite
11. Errori nelle comande e recupero qualità
12. Priorità, sprechi e chiusura partita

### Bar

1. Il bar come linea di servizio
2. Mise en place del banco
3. Ordini, tempi e coordinamento con sala
4. Espresso: variabili e controllo
5. Macinatura e regolazione della ricetta
6. Latte, bevande vegetali e igiene
7. Misurare e costruire una bevanda analcolica
8. Tecniche di miscelazione e strumenti
9. Ingredienti, allergeni e comunicazione
10. Ritmi di banco e priorità del servizio
11. Reclami e bevande non conformi
12. Pulizia, controlli e chiusura del bar

## Confronti

Otto confronti professionali strutturati su casi reali di Sala, Cucina, Bar e organizzazione del lavoro. Ogni caso presenta un contesto, due approcci, vantaggi, limiti e una domanda che richiede di motivare la scelta. La selezione e le annotazioni sono locali, non hanno risposta universalmente corretta e non generano commenti o voti di altri utenti.

## Altre sezioni

- Community dimostrativa locale: post, modifica, commenti, ricerca, filtri, salvataggi. Nessun dato è pubblicato per altri utenti.
- Carriera e CV locali: solo simulazione, nessun datore può accedere ai dati.
- Backup JSON per progressi, note, post, CV, scelta del corso e Confronti; le prove interrotte salvate nel browser non vengono ripristinate da un backup importato.
- Navigazione mobile con collegamenti ai corsi, Safari avanti/indietro, testo regolabile.

## Limiti e qualità editoriale

**Prototipo, non piattaforma multiutente e non certificazione professionale.** Non ci sono login, database, comunicazioni reali fra utenti, candidature, notifiche condivise o attestazioni professionali. Le risposte ai test e le correzioni esistono nel codice client per permettere il collaudo: non è una modalità d'esame sicura contro manipolazioni.

I testi sono contenuti didattici originali **non ancora revisionati né certificati da specialisti**. Necessitano di test con lavoratori veri, revisione per procedure di settore e controlli didattici. Non sostituiscono formazione obbligatoria HACCP, sicurezza sul lavoro o procedure dell'azienda.

**Fonti di riferimento generali** usate per evitare suggerimenti arbitrari sui principi di sicurezza alimentare:
- [OMS · Five Keys to Safer Food](https://www.who.int/publications/i/item/9789241594639)
- [Commissione europea · Reg. UE 1169/2011 informazioni alimentari e allergeni](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/food-information-consumers-legislation_en)

I dettagli operativi dipendono dal piano di autocontrollo del locale, dalle istruzioni di prodotto, dalle responsabilità aziendali e dalle regole applicabili.

## Distribuzione e sviluppo

Tutti i file utilizzati dall'anteprima sono incorporati nel singolo `index.html`. Branch `main` collegata al progetto Vercel `dopoturno-academy-preview`. Le modifiche a questa branch producono automaticamente una nuova distribuzione. Per lo sviluppo definitivo sarà opportuno separare dati, componenti, logica di valutazione e contenuti editoriali dal file HTML monolitico.

Per l'app vera servono: backend e account dedicati, RLS/privacy, CMS con workflow editoriale, moderazione delle pubblicazioni, percorsi di accessibilità validati, prove pratiche osservate e autorizzazioni verificabili al CV professionale.