# DopoTurno Academy | Percorso personalizzato dopo lo Skill Check

Versione: **2.1**. Funziona in locale, nel prototipo, nei corsi Fondamenta e Intermedio di Sala, Cucina e Bar.

## Problema risolto

Prima, anche chi aveva già esperienza veniva riportato alla prima lezione indipendentemente dal risultato. Ora la consegna dello **Skill Check diagnostico** produce una mappa dei quattro moduli per il reparto scelto e un percorso suggerito.

## Criteri di posizionamento

- Le 20 risposte della prova iniziale sono suddivise tra i quattro moduli del corso. Gli scenari trasversali di Cucina e Bar sono associati al modulo pertinente, con controlli specifici per allergeni, igiene e rischi.
- Ogni modulo ha uno stato: **Basi verificate** (almeno 80% delle risposte adeguate e zero errori critici), **Ripasso selettivo** (60–79%, senza errore critico), **Da approfondire** (meno del 60%, oppure anche un solo errore critico).
- I moduli che superano la soglia non devono essere ripetuti. Gli altri propongono lezioni mirate secondo le risposte sbagliate; per risultati particolarmente bassi viene consigliato l'intero modulo.
- Le risposte critiche assegnano priorità alle lezioni di sicurezza: allergeni, procedure e controlli. **Un punteggio globale elevato non annulla il bisogno di approfondire una procedura critica.**
- Se **tutti e quattro i moduli** dimostrano basi adeguate senza errori critici, il passo successivo è il **corso intermedio dello stesso reparto**, non la prima lezione. La verifica finale delle fondamenta resta accessibile nel programma.
- Il risultato **non influenza le risposte durante lo Skill Check**, non espone suggerimenti né feedback prima della consegna. L'autovalutazione iniziale non modifica il posizionamento.

## Navigazione e scelta personale

La diagnosi appare alla fine dello Skill Check, nell'Academy e nel programma del corso. La progressione proposta apre una lezione concreta oppure la verifica applicativa. L'utente può disattivare il percorso guidato e tornare alla **modalità libera**, con tutto il programma disponibile. Può anche ripetere lo Skill Check; il nuovo risultato aggiorna il piano per il singolo reparto.

I dati sono separati per sei percorsi (Fondamenta e Intermedio nei tre reparti) e salvati nel browser in `saved.placements`. La funzione di backup esporta e ripristina questi dati con validazione dei moduli, identificativi e stati.

## Distinzioni importanti

- **Basi verificate al test** NON significa **lezione studiata**. Nessuna lezione è marcata automaticamente, nessun avanzamento o badge professionale viene inventato.
- La prova dei Fondamentali misura **contenuti introduttivi** e può proporre l'accesso al corso intermedio reale ora disponibile. Lo Skill Check intermedio, invece, analizza situazioni professionali complesse e propone moduli mirati. Nessuno dei due dimostra da solo una competenza pratica osservata.
- La verifica è dimostrativa, con chiavi di correzione nel browser; non è certificazione né valutazione professionale validata, non sostituisce prova pratica o formazione obbligatoria.
- Le prove alternative testuali e visive non hanno ancora un'equivalenza psicometrica certificata.
- Nessun risultato è pubblicato online o comunicato ai datori di lavoro.

## Per rendere la personalizzazione completa anche in produzione

I contenuti **intermedi** sono stati aggiunti nella versione 2.1. Per estendere il modello serviranno contenuti **avanzati e specialistici**, validazione della banca domande e dei pesi delle competenze, calibrazione delle soglie su prove reali, backend protetto e test pratici con valutatori. Solo allora potremo attribuire livelli più specifici (ad esempio Base, Intermedio, Avanzato) senza far finta di misurare competenze che l'attuale Skill Check non copre.

## Test

Eseguire `node --test tests/placement-smoke.cjs` e `node --test tests/security-smoke.cjs`. Inoltre servono prove manuali su browser desktop e iPhone per confermare navigazione, persistenza e layout.

## Corsi intermedi aggiunti

I programmi con 36 lezioni nuove, Skill Check intermedi, verifiche di modulo e prove finali sono descritti in [INTERMEDIATE_COURSES.md](INTERMEDIATE_COURSES.md). Le soglie restano sperimentali; i test non attribuiscono qualifiche professionali.

## Accesso diretto alle microattività (v2.2)

La diagnosi può ora proporre la prima microattività realmente necessaria: in presenza di errori critici il percorso parte da decisione e controlli; con un modulo parzialmente consolidato può proporre direttamente il caso applicativo. Una microattività saltata per posizionamento **non è segnata come studiata**. I progressi delle microlezioni sono salvati in uno stato separato, con ripresa del punto esatto. [Dettagli](MICROLEARNING.md).
