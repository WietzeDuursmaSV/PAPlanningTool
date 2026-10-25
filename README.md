# Planning Tool (Power Apps Code App)

Power Apps **Code App** (React + Fluent UI, gebouwd met Vite en de `pac` CLI) die de ClockWise
Planning Tool API ontsluit. De app opent direct op één pagina, zonder menu:

- **Planning Tool** — weekplanning van medewerkers: filters (week, aantal weken, zoeken, department,
  fully-assigned verbergen), een kleurgecodeerd rooster (🟢 beschikbaar · 🔵 ingezet · 🟠 verlof · 🔴 feestdag)
  en een detailweergave per medewerker.

De planningdata wordt opgehaald via de Power Platform custom connector **Planning API**. De API-key is
opgeslagen in de connectorverbinding en wordt niet vanuit de browsercode meegestuurd. Deze app is
voortgekomen uit het generieke `PowerAppVSCBase`-template.

---

## 1. Vereisten installeren

### 1.1 .NET SDK (6.0 of hoger)

De `pac` CLI vereist de .NET SDK. Controleer of deze al is geïnstalleerd:

```bash
dotnet --info
```

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

### 1.4 Planning API-verbinding

Zorg dat de custom connector **Planning API** een geldige verbinding heeft in dezelfde omgeving als de
Code App. De connector beheert de API-key; er is geen lokale FastAPI-service of API-key in `.env.local` nodig.

---

## 2. Inloggen bij Power Platform

```bash
ac auth clear
pac auth create --name <naam-voor-profiel>
pac auth list
pac org list
pac org select --environment <environment-id-of-url>
```

> **Let op:** de omgeving moet **Code Apps** ondersteunen. Als `pac code push` een fout geeft zoals
> `CodeAppOperationNotAllowedInEnvironment`, moet een omgevingsbeheerder deze feature inschakelen via het
> [Power Platform Admin Center](https://admin.powerplatform.microsoft.com) → omgeving → Instellingen → Product → Features.

---

## 3. Project opzetten

```bash
npm install
```

`power.config.json` bestaat al in dit project (`appDisplayName: "Planning Tool"`, environment
`87f264fa-239c-eee5-a7f6-58a7e77c4353`). Bij een eerste `pac code init` in een nieuwe omgeving wordt dit
bestand met een nieuwe `appId` opnieuw aangemaakt.

---

## 4. Connectors

### 4.1 Office 365 Users (aanwezig, momenteel ongebruikt in de UI)

Gegenereerd via:

```bash
pac connection list   # zoek connectie met API .../apis/shared_office365users
pac code add-data-source --apiId shared_office365users --connectionId <connection-id>
```

Dit zette `src/generated/services/Office365UsersService.ts` en
`src/generated/models/Office365UsersModel.ts` neer. Deze connector wordt nu niet meer vanuit een pagina
aangeroepen, maar blijft staan als voorbeeld/referentie.

### 4.2 Planning API

De bestaande custom connector **Planning API** gebruikt `https://planning-api.sharevalue.nl` en authenticeert
met een API-key die in Power Platform als `X-API-Key` wordt beheerd. De gegenereerde client staat in
`src/generated/services/PlanningAPIService.ts` en biedt `GetAvailability`, `GetEmployeeAvailability`,
`GetEmployeeDetails` en `GetDepartments`.

[`src/services/planningToolService.ts`](src/services/planningToolService.ts) vertaalt de bestaande UI-service
naar deze connectoroperaties. De connectorrequests lopen via de Power Apps-connectorruntime; test daarom
via de play-URL en niet door `http://localhost:3000` rechtstreeks te openen.

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

Voor dit project is de lokale URL:

```
https://apps.powerapps.com/play/e/87f264fa-239c-eee5-a7f6-58a7e77c4353/app/local?_localAppUrl=http://localhost:3000&_localConnectionUrl=http://localhost:8080
```

**Open altijd deze play-URL** in de browser om te testen — niet `http://localhost:3000` direct. De Office 365 Users- en Planning API-connectors werken binnen de Power Apps-player met de lokale connection-proxy op poort `8080`.

---

## 6. Publiceren naar je Power Apps omgeving

```bash
npm run build
pac code push
```

Na een succesvolle push toont de terminal een permanente play-URL en verschijnt de app als **Planning Tool**
in **Power Apps → Apps** in de gekozen omgeving. Herhaal deze twee commando's na elke wijziging die je wil delen.

---

## 7. Bekende valkuilen

| Probleem                                                                                       | Oorzaak                                                                                          | Oplossing                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `zsh: command not found: pac` in een terminal die al open was vóórdat `pac` werd geïnstalleerd | zsh's command hash-cache is niet ververst                                                        | `hash -r` uitvoeren, of een nieuwe terminal openen                                                                                |
| `npm run dev` faalt met `sh: start: command not found`                                         | Het originele sample-script gebruikt het Windows-only `start`-commando                           | Gebruik `concurrently` (zoals in dit project) in plaats van `start ... && start ...`                                              |
| `pac code add-data-source` geeft `HTTP error status: 404`                                      | `--apiId` met het volledige pad (`/providers/Microsoft.PowerApps/apis/...`) i.p.v. de korte naam | Gebruik het korte formaat, bv. `shared_office365users`                                                                            |
| `pac code push` geeft `CodeAppOperationNotAllowedInEnvironment`                                | De doelomgeving heeft de Code Apps-feature niet ingeschakeld                                     | Feature laten inschakelen door een beheerder, of naar een omgeving pushen waar dit al werkt                                       |
| Planning Tool-pagina toont "Failed to load data"                                               | De lokale FastAPI-service (`uvicorn api.main:app --reload`) draait niet                          | Start de API zoals beschreven in §1.4                                                                                             |
| Fluent UI-componenten tonen nog "Segoe UI" i.p.v. Open Sans                                    | Fluent UI leest `fontFamilyBase` uit het `theme`-object, niet uit CSS                            | Override `fontFamilyBase` op het theme dat aan `FluentProvider` wordt doorgegeven ([ThemedApp.tsx](src/components/ThemedApp.tsx)) |

---

## 8. Projectstructuur

```
src/
  App.tsx                     # Route: "/" -> PlanningToolPage
  main.tsx                    # React root + ThemeProvider
  components/
    Layout.tsx                # Header (logo + thema-toggle) + footer, geen menu
    ThemedApp.tsx              # FluentProvider (met Open Sans override) + Router + QueryClient
  contexts/ThemeContext.tsx    # Licht/donker thema state
  hooks/useTheme.ts
  pages/
    PlanningToolPage.tsx       # Filters, weekrooster, legenda, medewerker-detail
  services/
    planningToolService.ts     # Adapter op de gegenereerde Planning API-connector
  generated/                   # Gegenereerde Office 365 Users- en Planning API-clients
power.config.json              # App-metadata (appDisplayName: "Planning Tool", environmentId, connectionReferences)
```

## 9. Status

De connector is gekoppeld en de gegenereerde client bevat alle vier operaties met response-types. Voer na wijzigingen `npm run build` uit en publiceer met `pac code push`.
