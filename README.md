# Power App VSC Base

Herbruikbaar startpunt voor Power Apps **Code Apps** met React + Fluent UI, gebouwd met Vite en de `pac` CLI.
Bevat twee pagina's:

- **Home** — overzichtspagina met kaart(en) die doorlinken naar de voorbeelden.
- **Office 365** — live gekoppeld aan de Office 365 Users-connector (profiel, foto, gebruikers zoeken).

Gebruik dit project als kopie/startpunt voor nieuwe Power Apps code apps.

---

## 1. Vereisten installeren

### 1.1 .NET SDK (6.0 of hoger)

De `pac` CLI vereist de .NET SDK. Controleer of deze al is geïnstalleerd:

```bash
dotnet --info
```

Zo niet, installeer de laatste SDK (macOS voorbeeld via de officiële installer, of gebruik de VS Code ".NET Install Tool" als die beschikbaar is).

### 1.2 Power Platform CLI (`pac`)

Installeer de VS Code-extensie **"Power Platform Tools"** (`microsoft-isvexptools.powerplatform-vscode`). Deze installeert `pac` automatisch in:

```
~/Library/Application Support/Code/User/globalStorage/microsoft-isvexptools.powerplatform-vscode/pac/
```

Controleer daarna in een **nieuwe terminal** (belangrijk, zie Bekende valkuilen hieronder):

```bash
pac --version
```

### 1.3 Node.js

Zorg voor een recente Node.js LTS-versie (`node -v`).

---

## 2. Inloggen bij Power Platform

```bash
pac auth create --name <naam-voor-profiel>
```

Dit opent een browser om in te loggen. Controleer je actieve profiel/omgeving met:

```bash
pac auth list
pac org list
```

Zorg dat de gewenste omgeving actief is (kolom `Active` met `*`). Wissel eventueel met:

```bash
pac org select --environment <environment-id-of-url>
```

> **Let op:** de omgeving moet **Code Apps** ondersteunen. Als `pac code push` later een fout geeft zoals
> `CodeAppOperationNotAllowedInEnvironment`, moet een omgevingsbeheerder deze feature inschakelen via het
> [Power Platform Admin Center](https://admin.powerplatform.microsoft.com) → omgeving → Instellingen → Product → Features.

---

## 3. Project opzetten

### 3.1 Kopieer dit template

Kopieer deze hele map naar je nieuwe project locatie en hernoem de map/`name` in `package.json` naar smaak.

### 3.2 Dependencies installeren

```bash
cd <jouw-project-map>
npm install
```

### 3.3 Code app initialiseren

```bash
pac code init --displayName "<Weergavenaam van je app>"
```

Dit maakt een `power.config.json` aan met een unieke `appId` en de actieve `environmentId`.

---

## 4. Office 365-connector koppelen (live data)

De `Office365Page` verwacht een gegenereerde service op `src/generated/services/Office365UsersService.ts`.
Deze wordt aangemaakt door onderstaande stappen — **zonder deze stap geeft de pagina TypeScript-fouten.**

### 4.1 Zoek een bestaande connectie (of maak er een via de maker portal)

```bash
pac connection list
```

Zoek een regel met API `.../apis/shared_office365users` en status **Connected**. Bestaat deze nog niet, maak
hem aan via [make.powerapps.com](https://make.powerapps.com) → Connections → Nieuwe connectie → "Office 365 Users".

### 4.2 Voeg de data source toe aan het project

```bash
pac code add-data-source --apiId shared_office365users --connectionId <connection-id-uit-stap-4.1>
```

Dit genereert:
- `src/generated/services/Office365UsersService.ts`
- `src/generated/models/Office365UsersModel.ts`
- `.power/schemas/appschemas/dataSourcesInfo.ts`
- een entry onder `connectionReferences` in `power.config.json`

> Gebruik `--apiId shared_office365users` (kort formaat). De volledige pad-vorm
> (`/providers/Microsoft.PowerApps/apis/shared_office365users`) geeft een 404-fout.

---

## 5. Lokaal ontwikkelen

Start beide processen tegelijk (Vite dev server + lokale connectie-proxy van `pac`):

```bash
npm run dev
```

Dit voert uit: `concurrently -n vite,pac -c blue,green "vite" "pac code run"`.

`pac code run` print een **play-URL**, bijvoorbeeld:

```
https://apps.powerapps.com/play/e/<environment-id>/app/local?_localAppUrl=http://localhost:3000&_localConnectionUrl=http://localhost:8080
```

**Open altijd deze play-URL** in de browser om te testen — niet `http://localhost:3000` direct. De Office 365
data-client werkt alleen binnen de Power Apps player (runtime-bridge), dus los op `localhost:3000` blijft de
pagina eeuwig op "Loading" hangen.

---

## 6. Publiceren naar je Power Apps omgeving

```bash
npm run build
pac code push
```

Na een succesvolle push toont de terminal een permanente play-URL en verschijnt de app in
**Power Apps → Apps** in de gekozen omgeving. Herhaal deze twee commando's na elke wijziging die je wil delen.

---

## 7. Bekende valkuilen (opgelost tijdens ontwikkeling van dit template)

| Probleem | Oorzaak | Oplossing |
|---|---|---|
| `zsh: command not found: pac` in een terminal die al open was vóórdat `pac` werd geïnstalleerd | zsh's command hash-cache is niet ververst | `hash -r` uitvoeren, of een nieuwe terminal openen |
| Blanco pagina / `404` op elk verzoek bij het los starten van `vite` | Vite gebruikt de working directory als project-root; als je `vite` via een absoluut pad start vanuit de verkeerde map, vindt hij `index.html` niet | Start `vite` met de projectmap als argument (`vite <pad-naar-project>`) of zorg dat de terminal eerst met `cd` naar de projectmap gaat |
| `npm run dev` faalt met `sh: start: command not found` | Het originele sample-script gebruikt het Windows-only `start`-commando | Gebruik `concurrently` (zoals in dit template) in plaats van `start ... && start ...` |
| `pac code add-data-source` geeft `HTTP error status: 404` | `--apiId` met het volledige pad (`/providers/Microsoft.PowerApps/apis/...`) i.p.v. de korte naam | Gebruik het korte formaat, bv. `shared_office365users` |
| `pac code push` geeft `CodeAppOperationNotAllowedInEnvironment` | De doelomgeving heeft de Code Apps-feature niet ingeschakeld | Feature laten inschakelen door een beheerder, of naar een omgeving pushen waar dit al werkt |
| Office 365-pagina blijft op "Loading user data..." hangen | Pagina wordt los getest op `http://localhost:3000` i.p.v. via de play-URL | Test altijd via de play-URL die `pac code run` teruggeeft |

---

## 8. Projectstructuur

```
src/
  App.tsx                 # Routes: Home, Office365
  main.tsx                # React root + ThemeProvider
  components/
    Layout.tsx            # Sidebar-navigatie + header
    PageHeader.tsx         # Herbruikbare paginatitel/subtitel
    ThemedApp.tsx          # FluentProvider + Router + QueryClient
  contexts/ThemeContext.tsx # Licht/donker thema state
  hooks/useTheme.ts
  pages/
    HomePage.tsx           # Overzicht met link(s) naar voorbeelden
    Office365Page.tsx      # Live Office 365 Users-connector voorbeeld
  generated/               # (gegenereerd door pac code add-data-source, niet in dit template aanwezig)
power.config.json          # (gegenereerd door pac code init, niet in dit template aanwezig)
```

## 9. Nieuwe pagina/connector toevoegen (patroon)

1. Voeg de connector toe: `pac code add-data-source --apiId <api-id> --connectionId <connection-id>`.
2. Maak een pagina in `src/pages/`, importeer de gegenereerde service uit `src/generated/services/...`.
3. Voeg een `<Route>` toe in `src/App.tsx` en een item in `navItems`/`routeNames` in `src/components/Layout.tsx`.
4. Test lokaal via de play-URL (`npm run dev`), publiceer met `npm run build && pac code push`.
