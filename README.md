# Duel — Counter per Yu-Gi-Oh!

https://ilgentz.github.io/duel-counter/

Un contatore Life Points per due persone che condividono lo stesso smartphone. Interfaccia originale scura, ambra e azzurro, senza artwork, carte o loghi ufficiali. Progetto indipendente, non affiliato a Konami.

**Pronto all'uso: apri `index.html`.** HTML, CSS e JavaScript vanilla: nessun framework, installazione di pacchetti, backend, account, database o servizio esterno. Tutti gli asset sono locali.

## Funzionalità

- Due giocatori, inizialmente a **8000 LP**.
- Portrait: Player 1 sopra e Player 2 sotto. **Ruota P1** ruota di 180° pannello, controlli e finestre personali del primo giocatore, per chi siede di fronte. La rotazione è inizialmente disattivata.
- Landscape: Player 1 a sinistra e Player 2 a destra, entrambi dritti. La preferenza di rotazione torna attiva passando in portrait. Non serve ricaricare.
- Sottrazioni immediate di 100, 500 e 1000 LP; tastierino per sottrarre o aggiungere importi personalizzati. Anche toccare il numero apre il tastierino.
- **÷2 · Dimezza LP** prepara il dimezzamento dei LP attuali del giocatore selezionato (8000 → 4000), indipendentemente dall'importo digitato e dalla modalità Aggiungi/Sottrai. Funziona anche con il tastierino vuoto: mostra l'importo da sottrarre e l'anteprima, poi **Conferma** applica la modifica. I LP risultanti vengono arrotondati per difetto se dispari (1251 → 625).
- Anteprima del risultato prima della conferma. Sei cifre al massimo; intervallo LP 0–999999. Gli importi eccessivi si fermano al limite, annunciato nel tastierino.
- Nomi modificabili toccandoli, fino a 24 caratteri.
- Undo consecutivi e cronologia delle variazioni effettive con nome al momento dell'azione, orario e risultato.
- A 0 LP: vincitore evidenziato, animazione breve, nessun valore negativo. Le modifiche LP si fermano; **Undo** permette di correggere e riprendere il duello.
- **Nuovo duello** chiede conferma, ripristina i LP e cancella lo storico. Conserva nomi e preferenze. Il reset non è annullabile.
- Audio sintetizzato con Web Audio API, inizialmente disattivato e sempre opzionale.
- Salvataggio automatico locale di LP, cronologia, nomi, audio e rotazione dopo ogni modifica. Nessun dato viene inviato a un server.
- PWA installabile, offline dopo il primo caricamento completo tramite HTTPS o localhost.
- Layout a piena finestra con aree di sicurezza per Dynamic Island e indicatore Home. I punteggi si adattano allo spazio effettivo dei pannelli; nomi, stato del duello e pulsanti occupano righe separate. Pulsanti touch, focus visibile, dialoghi con gestione del focus e supporto a movimento ridotto.

## Struttura

```text
index.html                  Interfaccia e dialoghi accessibili
style.css                   Tema e layout portrait/landscape
app.js                      Stato, LP, Undo, cronologia, audio e salvataggio
manifest.json               Installazione PWA e percorsi relativi
sw.js                       Cache offline isolata per percorso del progetto
.nojekyll                   Pubblicazione statica senza elaborazione Jekyll
icons/
  icon.svg                  Favicon originale
  icon-192.png              Icona PWA
  icon-512.png              Icona PWA grande
  icon-maskable-512.png     Icona adattabile Android
  apple-touch-icon.png      Icona Home iOS
README.md                   Questa guida
```

## Uso e test locali

### Apertura diretta, senza strumenti

1. Mantieni tutti i file nella stessa cartella, compresa `icons`.
2. Fai doppio clic su `index.html` per aprirlo nel browser.
3. Puoi usare immediatamente il contatore, anche senza rete.

In modalità `file://` il service worker e l'installazione PWA non si attivano. La disponibilità e la persistenza di `localStorage` per i file locali dipendono dal browser: per una prova attendibile del salvataggio usa localhost o GitHub Pages. Se il browser nega il salvataggio, l'app continua in memoria e mostra **Salvataggio non disponibile**. La navigazione privata o la cancellazione dei dati del sito possono eliminare la partita.

### Test PWA con un server statico facoltativo

Un server statico serve solo a consegnare i file; l'app rimane completamente client-side. Se hai Python installato, apri un terminale nella cartella del progetto ed esegui:

```sh
python -m http.server 8080
```

Apri [localhost:8080](http://localhost:8080). In alternativa usa l'estensione Live Server del tuo editor. Non è necessario Node.js.

Per simulare una sottocartella GitHub Pages, avvia il server dalla cartella che contiene `duel-counter`, quindi apri [localhost:8080/duel-counter/](http://localhost:8080/duel-counter/).

L'indirizzo HTTP della rete locale su uno smartphone non equivale a localhost: per provare installazione e service worker sul telefono usa il sito HTTPS pubblicato.

## Pubblicare gratuitamente su GitHub Pages

1. Crea un account su [GitHub](https://github.com), se non ne hai già uno.
2. Premi **+ → New repository**. Scegli un nome, per esempio `duel-counter`.
3. Seleziona **Public** per utilizzare GitHub Pages con un account gratuito. Puoi inizializzare il repository con un README per creare il branch `main`, poi sostituirlo con quello del progetto.
4. Apri il repository e seleziona **Add file → Upload files** (in un repository vuoto trovi anche il collegamento per caricare file esistenti).
5. Trascina **il contenuto** della cartella del progetto, inclusa la cartella `icons`. `index.html` deve essere visibile nella pagina principale del repository, non dentro un'altra cartella. Se il sistema nasconde `.nojekyll`, puoi crearlo con **Add file → Create new file**, usando esattamente quel nome e contenuto vuoto.
6. Premi **Commit changes** per salvare su `main`.
7. Vai nella scheda **Settings** del repository e scegli **Pages** nel menu laterale.
8. In **Build and deployment**, alla voce **Source**, scegli **Deploy from a branch**.
9. In **Branch**, seleziona **main** e la cartella **/(root)**. Questa è la radice del repository: non devi creare una cartella chiamata `root`.
10. Premi **Save**. Attendi il completamento della pubblicazione; puoi seguirlo nella scheda **Actions**.
11. Torna a **Settings → Pages** e apri l'indirizzo indicato da GitHub, normalmente `https://username.github.io/duel-counter/`.
12. Apri lo stesso link sullo smartphone. Per condividere l'app basta inviare questo indirizzo.

Se appare un errore 404, controlla che `index.html` sia nella radice di `main`, che Pages usi `main` e `/(root)`, e che la pubblicazione in **Actions** sia conclusa. Non cambiare i collegamenti relativi in percorsi che iniziano con `/`.

Riferimento: [documentazione ufficiale GitHub sulla sorgente di pubblicazione](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Installazione e offline

1. Apri il sito HTTPS online e attendi il primo caricamento completo. Su schermi larghi lo stato diventa **Pronto offline** quando il service worker è attivo.
2. Su Android, usa **Installa app** o **Aggiungi a schermata Home** nel menu del browser compatibile.
3. Su iPhone, apri il sito in Safari e usa **Condividi → Aggiungi alla schermata Home**; le diciture dipendono dalla versione del sistema.
4. Avvia l'app dall'icona Home. Dopo il primo caricamento completo puoi usarla in modalità aereo. Anche il browser normale può usare la cache offline: l'installazione non è indispensabile.

Il manifest non blocca l'orientamento. `start_url`, `scope`, icone e registrazione del service worker usano percorsi relativi: funzionano anche nella sottocartella di un repository. Il nome della cache include lo scope, così l'app non cancella le cache di altri repository sullo stesso dominio. Anche i dati locali sono separati per percorso. Installa/apri sempre lo stesso URL per ritrovare la partita; browser o contesti di installazione diversi possono avere archivi separati.

I browser possono rimuovere i dati locali e la cache per liberare spazio: non sono un backup permanente. Per verificare offline, carica prima online, chiudi e riapri l'app in modalità aereo. Il primo accesso assoluto senza rete non può installare la PWA.

Riferimenti: [service worker e cache offline](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [scope del manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope).

## Tastiera e accessibilità

- **Tab / Shift+Tab**: naviga tra i controlli; **Invio / Spazio**: attiva i pulsanti.
- Nel tastierino: cifre **0–9**, **Backspace**, **Delete** per cancellare tutto, **+ / −** per scegliere l'operazione, **/** per preparare il dimezzamento dei LP attuali, **Invio** per confermare.
- **Esc** chiude un dialogo senza applicare modifiche. I dialoghi mantengono il focus al loro interno e lo restituiscono al controllo di apertura.
- I lettori di schermo ricevono gli aggiornamenti LP e il risultato. Il significato dei comandi è espresso anche tramite testo, non solo colore.
- Non viene disabilitato lo zoom di accessibilità. `touch-action: manipulation` riduce il doppio tap accidentale sui pulsanti. Nelle finestre lunghe lo scorrimento è consentito; la superficie di gioco usa l'altezza disponibile senza scroll ordinario.

## Modifiche al codice

- **LP iniziali:** modifica `INITIAL_LP` all'inizio di `app.js`. I duelli già salvati continuano dal proprio stato; **Nuovo duello** applica il nuovo valore. Mantieni un intero positivo non superiore a `MAX_LP`.
- **Limite numerico:** `MAX_LP` è 999999; per aumentarlo adegua anche il limite di sei cifre del tastierino e la dimensione dei numeri.
- **Colori e dimensioni:** modifica le variabili in `:root` in `style.css`.
- **Logica:** `changeLP` è l'unico punto che applica una variazione; salva valore prima/dopo nello storico. `render` aggiorna l'interfaccia. Lo storico danneggiato viene scartato; i valori validi e le preferenze vengono conservati.
- **Aggiornamenti PWA:** quando modifichi un file dell'app, incrementa il suffisso di `CACHE_NAME` in `sw.js`, per esempio da `v2` a `v3`, e carica tutti i file aggiornati. Il nuovo worker attende la chiusura delle schede/app precedenti prima di attivarsi, evitando di mescolare versioni durante un duello. Riapri online; se necessario chiudi tutte le istanze e riapri. I LP restano in `localStorage`.

## Casi di verifica

1. Apri a 390×844 e 320×568: Player 1 sopra, Player 2 sotto, controlli visibili.
2. Passa a 844×390 e ritorna: pannelli affiancati/incolonnati senza perdita di stato.
3. Attiva **Ruota P1**: in portrait ruotano il pannello in alto, il tastierino e la modifica nome di P1; P2 resta dritto. In landscape tutto torna dritto.
4. Premi **−100**: 8000 → 7900.
5. Nuovo duello; inserisci 1250 nel tastierino Sottrai: 8000 → 6750.
6. Aggiungi 500: 6750 → 7250.
7. Sottrai esattamente i LP rimasti: 0, avversario vincitore, controlli LP bloccati.
8. Dopo Undo, sottrai più LP del totale: risultato 0, mai negativo; cronologia con la variazione effettiva.
9. Esegui Undo più volte: valori ripristinati in ordine inverso, fino alla cronologia vuota.
10. Annulla la conferma di reset: nessun dato cambia. Confermala: LP iniziali e cronologia vuota, nomi e preferenze conservati.
11. Modifica nomi e preferenze, fai alcune mosse e ricarica: stato e Undo ancora disponibili.
12. Carica via HTTPS/localhost, attendi il service worker, passa offline e ricarica anche dalla sottocartella: pagina, icone e controlli disponibili.
13. Prova tastiera, Esc, focus, audio disattivato e impostazione di sistema per ridurre le animazioni.

Verifica anche **÷2** in un nuovo duello: con il tastierino vuoto, premi **Dimezza LP**. L'importo da sottrarre diventa 4000 e l'anteprima 8000 → 4000; solo **Conferma** modifica i LP. Prova anche dopo aver digitato 1250 e dalla modalità Aggiungi: l'anteprima deve sempre essere 8000 → 4000. Dopo la conferma, verifica cronologia e Undo. Prova entrambi i giocatori, un secondo dimezzamento confermato (4000 → 2000), LP dispari (1251 → 625) e 1 LP → 0 con fine duello.

Per la verifica finale sul dispositivo reale controlla anche notch, barre di Safari, tastiera virtuale e installazione Home: il loro comportamento dipende da browser e sistema operativo.

### Layout mobile e app installata

Il layout mantiene `html`, `body` e `.app-shell` nel flusso normale, con un'altezza esplicita: `100dvh` nel browser e `100vh` nell'app installata. Un controllo nel `<head>` imposta la modalità installata prima del caricamento CSS tramite `navigator.standalone` o `display-mode`, inclusi i casi iOS in cui la media query non corrisponde. Questo evita che un contenitore principale `fixed` venga limitato al viewport più corto riportato da alcune versioni iOS al primo avvio dalla Home. Le safe area vengono applicate una sola volta. Vedi la [segnalazione WebKit sul viewport standalone](https://www2.webkit.org/show_bug.cgi?id=313800).

Le dimensioni dei punteggi dipendono dalla riga disponibile nel pannello, tramite container query CSS, anziché dall'altezza totale dello schermo. L'etichetta Life Points è nell'intestazione e lo stato del duello ha una riga dedicata sopra i comandi. In portrait i comandi rapidi hanno tre colonne uguali, Sottrai/Aggiungi due colonne uguali e la barra inferiore quattro colonne uguali. Il titolo, il sottotitolo e il nome proposto per una nuova icona Home sono **Counter**; un'icona già installata può conservare il nome assegnato al momento dell'aggiunta.

Verificato in WebKit e Chromium su nove dimensioni, inclusi 393×852 con safe area simulate di 59 px sopra e 34 px sotto, Safari a 393×659 e landscape a 852×393. Controllati centratura, assenza di sovrapposizioni, pulsanti di almeno 44 px, rotazione, nomi lunghi e punteggi a sei cifre. La verifica WebKit riproduceva la sovrapposizione del layout precedente; la versione corretta supera gli stessi controlli. Questa emulazione non sostituisce una prova dell'app installata su un iPhone fisico.

Verificati anche tre avvii WebKit (browser, icona iOS rilevata da `navigator.standalone` e installazione rilevata da `display-mode`), con scelta dell'altezza prima del caricamento CSS, pulsanti uniformi, rinomina, dimezzamento, rotazione durante l'inserimento e ripristino della partita. L'aggiornamento della cache da v6 a v7 conserva LP, nome e Undo e funziona offline. L'anomalia nativa per cui iOS riporta un viewport più corto dello schermo non è riproducibile fedelmente in Playwright desktop: la correzione specifica richiede conferma sull'iPhone.

### Verifiche eseguite sulla prima versione

Verificata automaticamente in Microsoft Edge/Chromium con emulazione touch a 320×568, 360×640, 390×844, 568×320, 667×375, 844×390 e 1280×800, incluse transizioni di orientamento. Controllati anche visivamente portrait, landscape, tastierino orizzontale e valori a sei cifre.

Superati: calcoli rapidi e personalizzati, limite inferiore/superiore, vittoria, Undo multipli, reset annullato/confermato, nomi contenenti caratteri HTML, preferenze, ripristino dopo refresh, tastierino ruotato con orientamento cambiato durante l'inserimento, uso da file locale, salvataggio negato dal browser e ricaricamento realmente offline dalla sottocartella `/duel-counter/`. Tutte le dieci risorse della cache offline risultano presenti; nessun errore JavaScript o di console nei flussi verificati. L'installazione Home e Safari iOS su hardware reale non sono stati verificati in questo ambiente.
