# Logboek — Training & Voeding

Persoonlijk trainings- en voedingslogboek als PWA (installeerbaar op je telefoon).
Alle data blijft lokaal in je browser (localStorage) — niets wordt naar een server gestuurd.

## Wat de app doet

- **Vandaag** — dagelijkse sets loggen (gewicht + reps via steppers), conditie-activiteiten met
  afstand/tijd, lichaamsgewicht bijhouden. Navigeer per dag en per week (vorige/volgende week,
  weeknummer + maand zichtbaar). Elke dag is volledig te loggen, ongeacht of het verleden, vandaag
  of de toekomst is. Oefeningen toevoegen of verwijderen kan direct per dag.
- **Schema** — de vaste, doorlopende structuur per dag. Wijzigingen hier gelden voortaan voor elke
  toekomstige/huidige dag met die naam; eerdere logs blijven altijd zichtbaar bij Progressie, ook als
  een oefening later uit het schema is gehaald. Verwijderde oefeningen kun je terugzetten of
  definitief wissen (inclusief bijbehorende logs).
- **Progressie** — drie tabs:
  - *Oefeningen*: filter op dag en periode, kies een oefening of conditie-activiteit, bekijk gewicht/
    herhalingen/volume/geschat 1RM (kracht) of afstand/tijd/snelheid/tempo (conditie), met
    persoonlijke records en simpele, regelgebaseerde inzichten.
  - *Lichaamsgewicht*: losse grafiek (ruwe metingen + 7-daags gemiddelde), eigen periodefilter, kern-
    cijfers (hoogste/laagste/verschil sinds start).
  - *Overzicht*: samenvatting per periode — aantal trainingen, nieuwe records, meest uitgevoerde
    oefening, sterkste progressie.
- **Voeding** — vrij invoeren wat je eet, automatisch optellen tegen je dagdoel. Schakelt zelf tussen
  bulk- en lean-doelen op basis van de ingestelde einddatum.
- **Notitieboek** — vrije reflectie, los op datum. Schrijven, bewerken, verwijderen — geen AI, geen
  vaste vragen, gewoon een plek om je gedachten bij je training kwijt te kunnen.
- **Instellingen** — basisgegevens (startgewicht), bulk-einddatum, dagdoelen per fase, en een
  back-up-export van al je data. Ook te bereiken als vaste tab onderin de app.

## Live zetten op GitHub Pages

1. Maak een nieuwe repo aan op GitHub, bijvoorbeeld `training-app`.
2. Upload alle bestanden uit deze map, met behoud van de mapstructuur:
   `css/`, `js/`, `icons/`, `index.html`, `manifest.json`, `sw.js`.
3. Ga naar **Settings → Pages** in de repo, kies branch `main`, map `/ (root)`, klik **Save**.
4. Na een minuut is de app live op `https://<jouw-gebruikersnaam>.github.io/training-app/`.
5. Open die URL op je telefoon → **Zet op beginscherm** (Safari) of **App installeren** (Chrome) voor
   de volledige PWA-ervaring.

## Je data aanpassen

- **Oefeningen toevoegen/wijzigen**: direct in de app, zowel bij **Vandaag** als bij **Schema**.
- **Startgewicht**: onder **Instellingen → Basisgegevens**.
- **Voedingsdoelen en bulk/lean-einddatum**: onder **Instellingen**.
- **Back-up**: onder **Instellingen → Data → Exporteer back-up** krijg je een JSON-bestand met al
  je logs, notities, gewicht en voeding.

## Belangrijk om te weten

- Alle 24 oefeningen uit je schema staan er al in (namen, dagen, spiergroepen), maar zonder
  vooringevulde gewichten — je eerste log per oefening is meteen je eigen startpunt.
- De app werkt volledig offline na de eerste keer laden (dankzij de service worker), behalve het
  lettertype dat de eerste keer wordt opgehaald.
