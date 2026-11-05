# DopoTurno Academy v2.2 · Microlearning professionale

**Data:** 5 novembre 2026.  
**Stato:** prototipo locale con contenuti didattici **non certificati**.

## Cosa è stato sviluppato

I **6 corsi** di Sala, Cucina e Bar (Fondamenta e Intermedio) hanno ora un formato a microlezioni. Le **72 lezioni/capitoli preesistenti** vengono presentate in **360 attività brevi**, cinque per capitolo. Non sono 360 lezioni nuove scritte indipendentemente: sono una **riorganizzazione guidata** dei materiali professionali già presenti e delle banche di verifica.

| Attività per capitolo | Durata indicativa | Scopo |
|---|---:|---|
| 1. Contesto e obiettivo | 5 minuti | Problema, fattori da considerare, obiettivo operativo |
| 2. Decisione e controlli | 6 minuti | Criterio di scelta, verifica e conseguenze |
| 3. Procedura operativa | 7 minuti | Sequenza, responsabilità, errori da prevenire |
| 4. Caso sul campo | 11 minuti | Scenario realistico con risposta argomentata e rubrica |
| 5. Verifica ragionata | 5 minuti | Due domande formative, correzione **solo dopo la consegna** |

I tempi sono **stime di progettazione, non misurazioni automatiche né promesse di completamento**. Le attività più complesse possono richiedere maggiore tempo, senza essere spezzate artificialmente.

## Esperienza dell'utente

- **Vista per capitoli e attività:** programmi con progressi reali di ciascuna microattività, non solo una percentuale di corso.
- **Continua:** consente di riprendere il capitolo e il singolo passaggio. Il percorso classico rimane consultabile.
- **Skill Check e placement:** la prova diagnostica resta senza feedback e suggerimenti durante il test; il risultato dopo la consegna indica quali capitoli approfondire e, nei casi di buona preparazione, propone l'accesso al corso Intermedio. Gli errori critici conservano priorità.
- **Accesso mirato a un'attività:** quando la diagnosi mostra conoscenze già solide, il sistema può indirizzare direttamente al caso applicativo; se emergono criticità, parte dalla decisione e dai controlli. Le attività saltate **non vengono segnate come completate**.
- **Caso operativo:** l'utente scrive almeno 40 caratteri di decisione argomentata. La risposta è **privata, salvata localmente e non corretta da un docente né valutata automaticamente**.
- **Verifica formativa:** due scelte per capitolo, con alternative credibili e spiegazioni dopo la consegna. Passaggio con entrambe corrette e nessun errore critico. Tentativi ripetibili, senza vite, penalità o classifiche.
- **Ripasso distribuito:** dopo un quiz riuscito è suggerito un ripasso dopo 1 giorno, poi 3, 7, 14 e 30 giorni dopo successivi risultati corretti. Gli errori non sbloccano la scadenza successiva. Si tratta di **suggerimenti all'apertura dell'app**, non di notifiche push.
- **Privacy e backup:** `microProgress`, `microReviews`, `microResponses` e `microLast` sono salvati nel browser e inclusi nel backup privato; in fase di importazione sono filtrati per identificativi dei corsi, limiti di lunghezza e formati consentiti. I contenuti della risposta possono includere dati personali se l'utente li scrive: è richiesto di evitare nomi e dettagli identificativi.

## Limitazioni da non occultare

- Nessuna microattività o valutazione equivale a prova pratica osservata, qualifica ufficiale, attestazione o certificazione.
- Le due domande formative **non sostituiscono lo Skill Check o le verifiche di modulo**, e non sono sufficienti a certificare la padronanza di un argomento.
- Le soglie di accesso mirato derivate dallo Skill Check sono **sperimentali**, non validate psicometricamente.
- L'app non usa ancora un servizio multiutente; il progresso non si sincronizza fra dispositivi e può essere perso cancellando i dati del browser. Il backup rimane responsabilità dell'utente.
- Le durate, il linguaggio, la difficoltà e l'accessibilità richiedono test reali con professionisti di Sala, Cucina e Bar, soprattutto su iPhone. Non dichiarare una prova pratica supervisionata che non esiste.
- Nessun sistema di notifiche, premi monetari, ranking o gamification coercitiva.

## Implementazione

- `microlearning.js`: motore di suddivisione, posizionamento per attività, progressione, verifica formativa e ripasso.
- `microlearning.css`: vista del percorso e lettore mobile-first, responsive, con accessibilità di base.
- `academy-app.js`: integrazione con catalogo, navigazione, interruttore di modalità libera, risultati, import/export e cronologia.
- `tests/microlearning-smoke.cjs`: percorso end-to-end simulato, scrittura e correzione, salto per Skill Check, ripassi, backup e rotte.

## Prove e verifica

Eseguire dalla radice del repository:

```bash
node --test tests/security-smoke.cjs tests/placement-smoke.cjs tests/intermediate-smoke.cjs tests/microlearning-smoke.cjs
```

I test automatizzati non sostituiscono il collaudo da browser reale, la revisione professionale e la verifica tecnica di accessibilità. Il progetto conserva una Content Security Policy che non permette l'esecuzione di script inline.

## Fasi successive

1. Osservare una sessione reale di apprendimento con professionisti di ciascun reparto.
2. Misurare il tempo effettivo per attività e correggere frammentazione, leggibilità e difficoltà.
3. Aggiungere valutazioni pratiche realmente osservabili ed evidenze coerenti con gli obiettivi, senza automatizzare attestazioni.
4. Attivare backend dedicato e sincronizzazione solo dopo RLS, moderazione, procedure privacy e sicurezza verificati.
