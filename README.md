# DopoTurno · Academy, Community, Confronti e Carriera

Applicazione dimostrativa mobile-first per le persone che lavorano o si formano nella ristorazione.

**Anteprima iPhone e desktop:** https://dopoturno-academy-preview.vercel.app

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