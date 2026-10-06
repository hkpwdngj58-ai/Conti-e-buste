CONTI & BUSTE — versione 1

Cosa fa
- Gestisce più conti reali (precaricati ING e BBVA, modificabili).
- Crea buste/sottoconti virtuali con saldo assegnato.
- Registra spese ed entrate.
- Una spesa può scalare sia dal conto reale sia dalla busta virtuale.
- Ricerca e filtri movimenti.
- Importazione CSV.
- Backup JSON e export movimenti CSV.
- Funziona offline quando installata come PWA.
- Nessun account, nessun server, nessun abbonamento.

IMPORTANTE
Questa versione NON si collega automaticamente a ING o BBVA e NON chiede credenziali bancarie.
I dati restano nel browser del dispositivo. La memoria locale del browser non è un archivio cifrato dedicato: usa il backup JSON e proteggi l'iPhone con codice/Face ID.

CSV supportato
Intestazioni minime: data, descrizione, importo
Opzionali: conto, busta, tipo
Esempio:
data,descrizione,importo,conto,busta,tipo
2026-10-06,Supermercato,54.20,BBVA,Spesa,spesa
2026-10-06,Stipendio,1800,ING,,entrata

Per usarla subito su computer
Apri index.html. Le funzioni principali funzionano anche senza installazione.

Per installarla su iPhone come vera icona PWA
La cartella deve essere pubblicata via HTTPS. Puoi farlo gratuitamente con GitHub Pages, Cloudflare Pages o Netlify. Poi apri l'URL in Safari > Condividi > Aggiungi alla schermata Home.
