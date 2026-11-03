# DopoTurno Academy | Percorso personalizzato dopo lo Skill Check

Versione: **2.0**. Funziona in locale, nel prototipo, con i corsi di Sala, Cucina e Bar.

## Problema risolto

Prima, anche chi aveva già esperienza veniva riportato alla prima lezione indipendentemente dal risultato. Ora la consegna dello **Skill Check diagnostico** produce una mappa dei quattro moduli per il reparto scelto e un percorso suggerito.

## Criteri di posizionamento

- Le 20 risposte della prova iniziale sono suddivise tra i quattro moduli del corso. Gli scenari trasversali di Cucina e Bar sono associati al modulo pertinente, con controlli specifici per allergeni, igiene e rischi.
- Ogni modulo ha uno stato: **Basi verificate** (almeno 80% delle risposte adeguate e zero errori critici), **Ripasso selettivo** (60–79%, senza errore critico), **Da approfondire** (meno del 60%, oppure anche un solo errore critico).
- I moduli che superano la soglia non devono essere ripetuti. Gli altri propongono lezioni mirate secondo le risposte sbagliate; per risultati particolarmente bassi viene consigliato l'intero modulo.
- Le risposte critiche assegnano priorità alle lezioni di sicurezza: allergeni, procedure e controlli. **Un punteggio globale elevato non annulla il bisogno di approfondire una procedura critica.**
- Se **tutti e quattro i moduli** dimostrano basi adeguate senza errori critici, il passo successivo è la **verifica finale applicativa**, non la prima lezione.
- Il risultato **non influenza le risposte durante lo Skill Check**, non espone suggerimenti né feedback prima della consegna. L'autovalutazione iniziale non modifica il posizionamento.

## Navigazione e scelta personale

La diagnosi appare alla fine dello Skill Check, nell'Academy e nel programma del corso. La progressione proposta apre una lezione concreta oppure la verifica applicativa. L'utente può disattivare il percorso guidato e tornare alla **modalità libera**, con tutto il programma disponibile. Può anche ripetere lo Skill Check; il nuovo risultato aggiorna il piano per il singolo reparto.

I dati sono separati per Sala, Cucina e Bar e salvati nel browser in `saved.placements`. La funzione di backup esporta e ripristina questi dati con validazione dei moduli, identificativi e stati.

## Distinzioni importanti

- **Basi verificate al test** NON significa **lezione studiata**. Nessuna lezione è marcata automaticamente, nessun avanzamento o badge professionale viene inventato.
- La prova riguarda **contenuti introduttivi**. Un livello di studio più alto qui significa **accesso diretto alle verifiche o ai casi applicativi già presenti**, non un corso avanzato che ancora non esiste.
- La verifica è dimostrativa, con chiavi di correzione nel browser; non è certificazione né valutazione professionale validata, non sostituisce prova pratica o formazione obbligatoria.
- Le prove alternative testuali e visive non hanno ancora un'equivalenza psicometrica certificata.
- Nessun risultato è pubblicato online o comunicato ai datori di lavoro.

## Per rendere la personalizzazione completa anche in produzione

Saranno necessari contenuti realmente **intermedi e avanzati**, validazione della banca domande e dei pesi delle competenze, calibrazione delle soglie su prove reali, backend protetto e test pratici con valutatori. Solo allora potremo attribuire livelli più specifici (ad esempio Base, Intermedio, Avanzato) senza far finta di misurare competenze che l'attuale Skill Check non copre.

## Test

Eseguire `node --test tests/placement-smoke.cjs` e `node --test tests/security-smoke.cjs`. Inoltre servono prove manuali su browser desktop e iPhone per confermare navigazione, persistenza e layout.
