# Graph Report - French_Fried  (2026-11-08)

## Corpus Check
- 56 files · ~179,840 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .ico 1, .csv 1)

## Summary
- 665 nodes · 1938 edges · 17 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0522202c`
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
- steps
- Desktop Build Workflow
- Desktop Packaging Config
- Dev Dependencies
- npm Scripts
- Package Info & Steam
- Electron Desktop Shell
- Lint Setup
- Prettier Settings
- fryguy.js

## God Nodes (most connected - your core abstractions)
1. `$$` - 49 edges
2. `esc()` - 34 edges
3. `sfx()` - 33 edges
4. `renderLab()` - 32 edges
5. `../src/data/recipes.js?again` - 31 edges
6. `f()` - 30 edges
7. `makeRng()` - 29 edges
8. `toast()` - 28 edges
9. `fmt()` - 26 edges
10. `getFry()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `showcaseSave()` --calls--> `newFry()`  [EXTRACTED]
  scripts/steam-screenshots.mjs → src/game/lab/breeding.js
- `showcaseSave()` --calls--> `makeRng()`  [EXTRACTED]
  scripts/steam-screenshots.mjs → src/game/rng.js
- `showcaseSave()` --calls--> `defaultState()`  [EXTRACTED]
  scripts/steam-screenshots.mjs → src/game/state.js
- `art()` --calls--> `cardArtSvg()`  [EXTRACTED]
  src/art/achievementIcons.js → src/art/cards.js
- `art()` --calls--> `renderFryGuy()`  [EXTRACTED]
  src/art/achievementIcons.js → src/art/fryguy.js

## Import Cycles
- 2-file cycle: `src/ui/cosmos.js -> src/ui/labScreen.js -> src/ui/cosmos.js`
- 3-file cycle: `src/ui/cosmos.js -> src/ui/worldsScreen.js -> src/ui/labScreen.js -> src/ui/cosmos.js`
- 3-file cycle: `src/ui/cosmos.js -> src/ui/worldsScreen.js -> src/ui/fryerScreen.js -> src/ui/cosmos.js`
- 4-file cycle: `src/ui/cosmos.js -> src/ui/worldsScreen.js -> src/ui/fryerScreen.js -> src/ui/labScreen.js -> src/ui/cosmos.js`

## Communities (17 total, 0 thin omitted)

### Community 0 - "Vector Art & Drawing"
Cohesion: 0.07
Nodes (76): achievementIcon(), art(), place(), SYMBOLS, ART_TYPES, cardArtInner(), OBJ, OBJECT_ART (+68 more)

### Community 1 - "Lab, Breeding & Worlds"
Cohesion: 0.05
Nodes (108): planet(), worldScene(), SPECIES_LABEL, SPECIES_STRENGTH, SPECIES_TRAINING, SPECIES_TRAITS, TRAINING_COST_MULT, CREATURE_MAP (+100 more)

### Community 2 - "Kitchen, Recipes & Achievements"
Cohesion: 0.05
Nodes (78): ALL_INGREDIENTS, BASIC_INGREDIENTS, PREMIUM_INGREDIENTS, OBJECTS, ../src/data/recipes.js?again, BLURBS, buildRecipes(), byKey (+70 more)

### Community 3 - "App Shell, Saves & Shop"
Cohesion: 0.10
Nodes (60): cardArtSvg(), configureAudio(), SFX, sfx(), recipes, found(), difficultyUnlocked(), PACKS (+52 more)

### Community 4 - "Music & Sound"
Cohesion: 0.10
Nodes (47): ensure(), noise(), PIECES, setMusicScene(), settings, tone(), unlockAudio(), unmuteIOS() (+39 more)

### Community 5 - "Build & Steam Art Scripts"
Cohesion: 0.05
Nodes (31): fontCss(), fonts, fragment, r(), root, script, out, root (+23 more)

### Community 6 - "Web Deploy Workflow"
Cohesion: 0.05
Nodes (39): env, outputs, runs-on, steps, concurrency, cancel-in-progress, group, environment (+31 more)

### Community 7 - "steps"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GRAPHIFY_BACKEND, GRAPHIFY_FORCE, runs-on, steps, jobs (+15 more)

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

### Community 16 - "fryguy.js"
Cohesion: 0.23
Nodes (16): creatureBody(), body(), crinkleBody(), curlyBody(), face(), r1(), renderFryGuy(), run0() (+8 more)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `esbuild` connect `Dev Dependencies` to `Package Info & Steam`, `Build & Steam Art Scripts`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Should `Vector Art & Drawing` be split into smaller, more focused modules?**
  _Cohesion score 0.06764346764346764 - nodes in this community are weakly interconnected._
- **Why does `makeRng()` connect `Vector Art & Drawing` to `Lab, Breeding & Worlds`, `Kitchen, Recipes & Achievements`, `App Shell, Saves & Shop`, `Build & Steam Art Scripts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `Lab, Breeding & Worlds` be split into smaller, more focused modules?**
  _Cohesion score 0.05013530836063239 - nodes in this community are weakly interconnected._
- **Why does `build` connect `Desktop Packaging Config` to `Package Info & Steam`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `Kitchen, Recipes & Achievements` be split into smaller, more focused modules?**
  _Cohesion score 0.05232323232323232 - nodes in this community are weakly interconnected._
- **Should `App Shell, Saves & Shop` be split into smaller, more focused modules?**
  _Cohesion score 0.10396270396270396 - nodes in this community are weakly interconnected._