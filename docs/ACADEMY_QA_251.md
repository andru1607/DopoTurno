# DopoTurno Academy 2.5.1 — qualità e criteri di pubblicazione

**Stato:** prototipo didattico verificabile. Non costituisce certificazione professionale, accreditamento o audit indipendente di sicurezza. Aggiornato il 6 novembre 2026.

## Copertura funzionale

La versione comprende sei corsi (Fondamenti e Intermedio per Sala, Cucina e Bar), 72 capitoli, cinque attività per capitolo (360 attività), percorsi consigliati dallo Skill Check, 18 simulazioni con 54 decisioni, 76 consigli pratici e ripassi programmati. Non assegna competenze pratiche osservate o attestati riconosciuti.

## Percorso utente verificabile

1. **Academy:** panoramica per reparto, prossimo passaggio e progressi personali.
2. **Skill Check:** diagnostico senza soluzioni, suggerimenti o feedback prima della consegna. L'esito orienta, non certifica.
3. **Corsi:** due livelli per reparto, quattro moduli apribili per corso e tre capitoli per modulo. L'accesso è libero anche senza test.
4. **Simulazioni:** feedback formativo dopo ogni scelta, debriefing, una bozza distinta per scenario.
5. **Ripassi e progressi:** consultazione locale, esportazione/importazione volontaria nel Profilo.

## Condizioni di qualità

- Lo Skill Check non marca automaticamente capitoli come completati; il posizionamento mirato non cancella l'accesso ai contenuti.
- Le simulazioni sono distinte dalle prove diagnostiche.
- Liste, preferenze e note non conformi nel browser non devono impedire l'avvio.
- Ogni modulo ha un controllo nativo che segnala lo stato aperto/chiuso. I contenuti nascosti non devono essere percorribili con la tastiera.
- Le attività mostrano un solo landmark HTML main per pagina.
- Due o più bozze di simulazioni devono sopravvivere a navigazioni, reload e backup.
- La ricerca mobile non deve perdere il focus mentre si scrive.
- I controlli verificati hanno area tattile di almeno 44 CSS px, con focus visibile.
- Nessun dato è pubblicato verso datori o Community automaticamente.

## Prove automatiche

La pipeline GitHub in .github/workflows/academy-qa.yml esegue:

- Node: test di regressione su contenuti, percorsi, storage, simulazioni, sicurezza e struttura.
- Chromium: viewport 320, 375, 390, 430, 768 e 1280 CSS px; mappe, filtri, salvataggi, focus e overflow.
- WebKit e Chromium: scelta del reparto, moduli espandibili, attività, ripresa dopo reload, dati locali danneggiati.

Il test automatico WebKit **non equivale** a Safari su un iPhone fisico.

## Collaudo manuale necessario

- iPhone fisico aggiornato e Android recente: verticale, orizzontale, dimensione testo, browser e tastiera.
- VoiceOver, TalkBack, ordine del focus, contrasto e zoom a 200%.
- Backup, import, almeno due scenari incompleti, recupero Skill Check, spazio locale esaurito o disabilitato.
- Valutare con utenti reali se individuano il primo passo e recuperano una lezione senza istruzioni.
- Registrare ogni errore: dispositivo, versione OS, sequenza, gravità, correzione, verifica.

## Validazione professionale ancora necessaria

Prima di presentare la Academy come validata, revisionare con professionisti documentati i casi e i moduli più sensibili: allergeni Sala S02/S05 e Bar B02/B03, temperature e lotti Cucina C02/C04/C06, comunicazioni di ricetta Cucina C03/C05 e controllo età Bar B05.

Sospendere contenuti che sembrino autorizzare promesse infondate sugli allergeni, manipolazioni rischiose, aggiramenti di obblighi o false conformità. Le procedure operative vincolanti restano quelle applicabili al locale e aggiornate. Le soglie dello Skill Check richiedono prove pilota osservabili per verificarne efficacia e attendibilità.

## Limiti infrastrutturali

I dati sono conservati sul dispositivo, senza account reali, database centrale, sincronizzazione, server backup o verifiche multiutente. CV e Community sono ancora dimostrativi. La gestione di utenti veri richiederà autenticazione, privacy e infrastruttura dedicate.

**Regola di rilascio:** automatismi verdi per pubblicare la preview; niente etichette di Academy certificata/abilitante fino a verifiche manuali, professionali e metodologiche concluse.
