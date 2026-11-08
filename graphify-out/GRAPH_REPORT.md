# Graph Report - french_fried  (2026-11-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 642 nodes · 1915 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1eee3b89`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Vector Art & Drawing
- Lab, Breeding & Worlds
- Kitchen, Recipes & Achievements
- App Shell, Saves & Shop
- Music & Sound
- Build & Steam Art Scripts
- Web Deploy Workflow
- Fryer Tournaments
- Desktop Build Workflow
- Desktop Packaging Config
- Dev Dependencies
- npm Scripts
- Package Info & Steam
- Electron Desktop Shell
- Lint Setup
- Prettier Settings
- ../src/data/recipes.js?again

## God Nodes (most connected - your core abstractions)
1. `$` - 49 edges
2. `esc()` - 34 edges
3. `sfx()` - 33 edges
4. `renderLab()` - 32 edges
5. `f()` - 30 edges
6. `makeRng()` - 29 edges
7. `toast()` - 28 edges
8. `fmt()` - 26 edges
9. `getFry()` - 24 edges
10. `renderKitchen()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `showcaseSave()` --calls--> `makeRng()`  [EXTRACTED]
  scripts/steam-screenshots.mjs → src/game/rng.js
- `showcaseSave()` --calls--> `newFry()`  [EXTRACTED]
  scripts/steam-screenshots.mjs → src/game/lab/breeding.js
- `showcaseSave()` --calls--> `defaultState()`  [EXTRACTED]
  scripts/steam-screenshots.mjs → src/game/state.js
- `showAchievements()` --calls--> `achievementIcon()`  [EXTRACTED]
  src/main.js → src/art/achievementIcons.js
- `art()` --calls--> `renderFryGuy()`  [EXTRACTED]
  src/art/achievementIcons.js → src/art/fryguy.js

## Import Cycles
- 2-file cycle: `src/ui/cosmos.js -> src/ui/labScreen.js -> src/ui/cosmos.js`
- 3-file cycle: `src/ui/cosmos.js -> src/ui/worldsScreen.js -> src/ui/labScreen.js -> src/ui/cosmos.js`
- 3-file cycle: `src/ui/cosmos.js -> src/ui/worldsScreen.js -> src/ui/fryerScreen.js -> src/ui/cosmos.js`
- 4-file cycle: `src/ui/cosmos.js -> src/ui/worldsScreen.js -> src/ui/fryerScreen.js -> src/ui/labScreen.js -> src/ui/cosmos.js`

## Communities (17 total, 1 thin omitted)

### Community 0 - "Vector Art & Drawing"
Cohesion: 0.06
Nodes (82): out, root, achievementIcon(), art(), CATEGORY, place(), SYMBOLS, ART_TYPES (+74 more)

### Community 1 - "Lab, Breeding & Worlds"
Cohesion: 0.06
Nodes (86): creatureBody(), body(), crinkleBody(), curlyBody(), face(), r1(), renderFryGuy(), run0() (+78 more)

### Community 2 - "Kitchen, Recipes & Achievements"
Cohesion: 0.06
Nodes (64): SFX, ALL_INGREDIENTS, BASIC_INGREDIENTS, PREMIUM_INGREDIENTS, OBJECTS, BLURBS, buildRecipes(), byKey (+56 more)

### Community 3 - "App Shell, Saves & Shop"
Cohesion: 0.08
Nodes (73): configureAudio(), sfx(), acceptLetter(), difficultyUnlocked(), buyThrift(), freshness(), openPack(), PACKS (+65 more)

### Community 4 - "Music & Sound"
Cohesion: 0.10
Nodes (47): ensure(), noise(), PIECES, setMusicScene(), settings, tone(), unlockAudio(), unmuteIOS() (+39 more)

### Community 5 - "Build & Steam Art Scripts"
Cohesion: 0.06
Nodes (28): fontCss(), fonts, fragment, r(), root, script, ART, { chromium } (+20 more)

### Community 6 - "Web Deploy Workflow"
Cohesion: 0.05
Nodes (39): env, outputs, runs-on, steps, concurrency, cancel-in-progress, group, environment (+31 more)

### Community 7 - "Fryer Tournaments"
Cohesion: 0.12
Nodes (35): LAB_TRAITS, TRAITS, ALL_LEAGUES, canEnter(), champPrize(), currentMatch(), DIFFICULTY, difficultyKey() (+27 more)

### Community 8 - "Desktop Build Workflow"
Cohesion: 0.08
Nodes (23): CSC_IDENTITY_AUTO_DISCOVERY, jobs, package, os, name, on, push, workflow_dispatch (+15 more)

### Community 9 - "Desktop Packaging Config"
Cohesion: 0.11
Nodes (18): build, appId, asarUnpack, directories, files, linux, mac, productName (+10 more)

### Community 10 - "Dev Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, electron-builder@25.1.8, esbuild@0.24.2, eslint@9.14.0, @fontsource/lilita-one@5.2.5, @fontsource/nunito@5.2.5, http-server@14.1.1, prettier@3.4.2 (+7 more)

### Community 11 - "npm Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dist, dist:linux, dist:mac, dist:win, electron (+7 more)

### Community 12 - "Package Info & Steam"
Cohesion: 0.17
Nodes (12): author, description, license, main, name, optionalDependencies, steamworks.js@0.4.0, private (+4 more)

### Community 13 - "Electron Desktop Shell"
Cohesion: 0.17
Nodes (6): { app, BrowserWindow, ipcMain, Menu }, fs, path, { contextBridge, ipcRenderer }, electron@33.4.11, electron

### Community 14 - "Lint Setup"
Cohesion: 0.40
Nodes (4): @eslint/js@9.14.0, globals@15.12.0, @eslint/js, globals

### Community 15 - "Prettier Settings"
Cohesion: 0.50
Nodes (3): printWidth, singleQuote, trailingComma

## Knowledge Gaps
- **1 isolated node(s):** `../src/data/recipes.js?again`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 200 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `esbuild` connect `Dev Dependencies` to `Package Info & Steam`, `Build & Steam Art Scripts`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **What connects `../src/data/recipes.js?again` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `Vector Art & Drawing` be split into smaller, more focused modules?**
  _Cohesion score 0.05919191919191919 - nodes in this community are weakly interconnected._
- **Why does `makeRng()` connect `Vector Art & Drawing` to `Kitchen, Recipes & Achievements`, `App Shell, Saves & Shop`, `Build & Steam Art Scripts`, `Fryer Tournaments`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `Lab, Breeding & Worlds` be split into smaller, more focused modules?**
  _Cohesion score 0.059751735745844727 - nodes in this community are weakly interconnected._
- **Why does `build` connect `Desktop Packaging Config` to `Package Info & Steam`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Kitchen, Recipes & Achievements` be split into smaller, more focused modules?**
  _Cohesion score 0.06330532212885154 - nodes in this community are weakly interconnected._