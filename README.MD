<p align="center">
  <img src="assets/logo.png" alt="Logo aplikacije" width="80">
</p>

# Orodje za analizo komunikacijskih protokolov

![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vue.js&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?logo=d3.js&logoColor=white)
![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue)

Namizna aplikacija, razvita v okviru diplomskega dela  
**Razvoj orodja za analizo komunikacijskih protokolov**.

Aplikacija je zgrajena z uporabo ogrodja **Electron** in omogoča formalno
modeliranje ter analizo komunikacijskih protokolov po metodi PGSS.

<p float="center" style="text-align: center">
  <img src="screenshots/ui_states.png" width="49%" />
  <img src="screenshots/s2.png" width="49%" />
</p>

## Prenos

👉 [Prenesi macOS (.dmg)](https://github.com/majdev25/LPA/releases/download/1.0/LPA-1.0.0-arm64.dmg)

Aplikacija ni podpisana z Apple Developer certifikatom.
Ob prvem zagonu je potrebno odstraniti karanteno:

```bash
xattr -rd com.apple.quarantine /Applications/LPA.app
```

## Zahteve

- Node.js (LTS)
- npm

## Namestitev

```bash
npm install
```

## Zagon v razvojnem načinu

```bash
npm run dev
```

Zažene aplikacijo v razvojnem okolju Electron.

## Gradnja aplikacije

```bash
npm run build
```

Zgradi produkcijsko različico aplikacije. Izhodne datoteke se ustvarijo v mapi dist/.

## Opomba

Projekt je bil razvit izključno za raziskovalne in izobraževalne namene
v okviru diplomskega dela.
