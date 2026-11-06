# DopoTurno Academy 2.5 · Qualità d'uso, mobile e accessibilità

**Data:** 6 novembre 2026  
**Stato:** correzioni al codice e controlli automatici. Le prove manuali su un vero iPhone, con VoiceOver e con professionisti del settore **non sono state eseguite**.

## Obiettivo

L'Academy deve poter essere studiata fra i turni e durante le pause, senza interfacce complicate né microinterazioni che fanno perdere il punto di lettura.

### Migliorie implementate

| Area | Comportamento |
|---|---|
| Decisioni nelle simulazioni | Dopo la risposta, focus e scorrimento raggiungono il feedback. Quando si prosegue, si raggiunge la nuova domanda e, al termine, il debriefing. |
| Didattica | Una decisione debole presenta anche **l'intervento preferibile** e la motivazione. Nessun suggerimento prima della scelta. |
| Mappe su mobile | Lo schema delle cinque postazioni compare **prima delle decisioni sui telefoni** e rimane affiancato su desktop. La legenda testuale mantiene accessibili i punti e la pagina lascia spazio alle barre di navigazione mobili. |
| Touch | Controlli principali e pin da almeno **44×44 CSS px**; campi di ricerca a 16 CSS px per evitare lo zoom indesiderato su Safari iOS. |
| Percorsi | Link per passare al successivo caso dello stesso reparto o approfondire la tecnica collegata. Chi affronta un rischio critico vede prima l'invito a riprovare. |
| Continuità | Le bozze dei diversi scenari sono indipendenti: cambiare scenario non cancella automaticamente quello precedente. |
| Backup | `shiftSimDrafts` è esportato e ripristinato con whitelist dei 18 scenari e validazione delle risposte. Supporto ai vecchi `shiftSimDraft`. |
| Navigazione | L'Academy resta selezionata nella barra mobile e desktop anche durante microlezioni, consigli e simulazioni. Un fragment URL malformato non interrompe l'intera app. |

Il progetto rimane un **prototipo con dati nel browser**. Non offre sincronizzazione fra dispositivi, notifiche push, autentica certificazione delle competenze o community realmente multiutente.

## Collaudo automatico

```bash
node --test tests/*.cjs
```

Suite dedicata alle regressioni ergonomiche:

```bash
node --test tests/mobile-accessibility-smoke.cjs
```

Le verifiche su codice e DOM simulato controllano dimensioni dichiarate nei CSS, navigazione, focus programmato, mappa mobile, salvataggi multipli, backup e scelta del passo successivo. **Non misurano i pixel realmente renderizzati**, il contrasto percepito, la correttezza di VoiceOver o gli esiti pratici sul lavoro.

## Checklist manuale ancora da completare

1. Aprire `https://dopoturno-academy-preview.vercel.app/#simulazioni` in Safari su un iPhone reale; provare almeno larghezze 320, 375, 390 e 430 CSS px, anche in orizzontale.
2. Verificare l'assenza di scorrimento orizzontale, sovrapposizioni fra testo e pulsanti, elementi tagliati dalla barra inferiore o dalla zona sicura del dispositivo.
3. Iniziare un caso, toccare una delle tre scelte: controllare che il feedback entri nella zona visibile senza saltare all'inizio della pagina.
4. Proseguire due volte e terminare: verificare che la nuova domanda e il titolo del debriefing siano raggiungibili senza dover ricercare il punto nel testo.
5. Verificare che lo schema sia raggiungibile prima delle decisioni su mobile; toccare ogni pin e controllare la leggibilità della postazione, senza sovrapposizioni con la barra inferiore.
6. Attivare VoiceOver e navigare usando intestazioni, pulsanti e stato della mappa. Verificare che il feedback si annunci una volta, senza saltare contesto o ripetere la pagina intera.
7. Usare tastiera esterna: Tab, Shift+Tab, Invio, Spazio. Il focus non deve sparire dopo una selezione.
8. Iniziare due scenari diversi, chiudere la scheda, ricaricare e riprendere ciascuno dal suo punto salvato.
9. Provare a importare un backup vecchio e uno nuovo. Confermare che i progressi originali siano conservati, senza duplicati né dati di casi sconosciuti.
10. Provare le microlezioni e lo Skill Check: le modifiche alle simulazioni non devono mostrare suggerimenti durante le prove diagnostiche.
11. Testare lo zoom di testo al 200%, le dimensioni di testo aumentate in iOS, modalità alto contrasto e preferenze di movimento ridotto.
12. Richiedere un esame redazionale a un professionista per ciascun reparto, specialmente sulle decisioni critiche relative ad allergeni, conservazione, attrezzature e somministrazione di alcolici.

### Criteri di rilascio pubblico

**Blocca il rilascio** se un test diagnostico rivela risposte, una procedura rischiosa viene marcata corretta, il browser perde progressi senza segnalazione, un controllo non è raggiungibile o l'utente non può leggere il feedback sul suo dispositivo. La validazione professionale è indispensabile prima di trasformare queste simulazioni in valutazioni utilizzate da aziende.

I controlli e la checklist costituiscono un piano verificabile, non una dichiarazione di collaudo fisico o di certificazione.
