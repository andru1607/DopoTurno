# DopoTurno · Academy, Community e Carriera

Prototipo mobile-first per la formazione e la community professionale della ristorazione.

**Anteprima:** https://dopoturno-academy-preview.vercel.app

## Stato attuale (v1.4.1)

- Academy Sala: 12 lezioni, quattro moduli, esercizi, Skill Check e laboratorio visivo.
- Test con risultati visualizzati solo dopo la consegna; possibilità di sospendere e riprendere una prova sullo stesso dispositivo.
- Community di prova **privata e locale** con post, modifica, commenti, ricerca, filtri, preferiti e post salvati. Due contenuti dimostrativi dichiarati.
- Carriera: profili e annunci fittizi, editor di CV locale con stampa PDF e consensi simulati, nessuna condivisione effettiva.
- Backup JSON esportabile e ripristinabile di progressi, note, post e CV.
- Navigazione browser (indietro/avanti) e impaginazione responsive.

## Distribuzione

Il sito è un singolo `index.html` con immagini, CSS e JavaScript incorporati. Non servono pacchetti né variabili d'ambiente. Il repository è collegato a Vercel e la branch `main` genera la distribuzione corrente.

## Importante

**Non è ancora un prodotto pubblico multiutente.** Non ci sono login, database, notifiche reali, comunicazioni con altri utenti, candidature o credenziali formative ufficiali. I dati vengono salvati localmente nel browser: prima di cancellarli è possibile esportare un backup, che va conservato privatamente.

Le prove devono essere validate prima dell'uso come valutazione professionale; i risultati digitali non certificano competenze osservate sul lavoro. Nessun curriculum è visibile ai datori di lavoro senza una futura autorizzazione esplicita e verificabile.

## Prossimi passaggi per il prodotto reale

1. Account e backend dedicato con isolamento degli utenti, politiche di accesso e gestione dei consensi.
2. Community condivisa con segnalazioni, moderazione, limiti antiabuso, privacy e cancellazione.
3. CMS editoriale Academy, versioni delle lezioni e verifica tecnica dei test.
4. Carriera con offerte reali, autorizzazioni puntuali alla visibilità del CV e audit degli accessi.
5. Collaudo con utenti veri, accessibilità, compatibilità iOS/Android e verifiche di sicurezza.

Nessun dato sensibile dovrebbe essere inserito nella demo.
