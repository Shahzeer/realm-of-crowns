# Realm of Crowns

Realm of Crowns is a cross-platform medieval grand strategy game built with React Native, Expo, and Supabase. Players manage kingdoms through warfare, diplomacy, trade, espionage, dynastic succession, and resource management across a dynamic map of rival AI kingdoms.

The project focuses heavily on interconnected gameplay systems including province management, army combat, diplomacy, technology progression, council management, random events, dynasty mechanics, cloud saves, and seasonal strategy systems.

Built using:

* React Native + Expo SDK 54
* Expo Router
* React Context state architecture
* AsyncStorage persistence
* Supabase cloud sync
* Cross-platform support for iOS, Android, and Web
  
<img width="250" alt="image 1" src="https://github.com/user-attachments/assets/1e5e5a39-b66d-4807-b37f-6f08edb7bc5a" /> <img width="250" alt="image 2" src="https://github.com/user-attachments/assets/ff8e69db-217c-409a-b959-e533085656f1" /> <img width="250" alt="image 3" src="https://github.com/user-attachments/assets/6cb1e924-317f-4d4f-8a44-eef2ba08f518" /> <img width="250" alt="image 4" src="https://github.com/user-attachments/assets/18a92dbe-89fe-407d-9e6d-d4b6223dae90" /> <img width="250" alt="image 5" src="https://github.com/user-attachments/assets/c60d8182-d857-47ae-b723-c4925d94e3f4" />






## Game Overview

You are the ruler of a medieval kingdom. Your objective is to grow your realm from a handful of provinces into a dominant empire — through conquest, diplomacy, trade, espionage, and faith. Manage resources, train armies, research technologies, and navigate political events to secure your dynasty's legacy.

The game ends in **victory** if you conquer enough territory or achieve dominance, and in **defeat** if your kingdom falls — whether by losing all provinces, running out of resources, or your ruler dying without an heir.

## Gameplay

### Turn-Based Rounds

Each turn advances the calendar by one season (Spring → Summer → Autumn → Winter). Seasons affect gameplay — for example, winter may reduce food production or slow army movement.

On each turn you can:

- **Manage provinces** — construct and upgrade buildings to boost gold, food, military, and faith income.
- **Raise and command armies** — recruit troops, assign commanders, choose combat tactics, march on enemy territory, or merge armies.
- **Conduct diplomacy** — improve or worsen relations with rival kingdoms, form alliances, or declare war.
- **Trade** — negotiate trade deals with other kingdoms for ongoing resource exchange.
- **Research technology** — invest in military, economic, cultural, or governance advancements.
- **Manage your council** — assign councilors (marshal, steward, spymaster, chaplain, chancellor) to tasks that boost your kingdom.
- **Launch spy missions** — send agents to rival kingdoms to sabotage, steal, or gather intelligence.
- **Invoke faith actions** — spend faith points on powerful divine blessings with cooldown timers.
- **Respond to events** — handle random political, military, religious, economic, and personal events with meaningful choices.
- **Educate your heir** — train the next generation in key stats to prepare for succession.

After taking your actions, press **End Turn** to advance. A turn summary shows resources gained, battles fought, provinces conquered or lost, AI kingdom actions, revolts, spy results, and more.

### Win Conditions

- **Conquest** — control a dominant share of all provinces on the map.
- **Domination** — achieve overwhelming military and economic strength compared to all rivals.

### Loss Conditions

- Losing all provinces.
- Your ruler dies with no heir or an heir with a weak claim.
- Kingdom collapses from unrest, famine, or bankruptcy.

## Features

### Core Systems

- **Province management** — 7 province types (capital, city, castle, temple, farmland, forest, mountain) each with unique buildings and upgrade paths.
- **Army warfare** — recruit armies, choose from 7 combat tactics (balanced, aggressive, shield wall, flanking, guerrilla, cavalry charge, siege specialist), fight battles with detailed results.
- **Diplomacy** — manage relations with AI kingdoms across a spectrum from allied to at war, with attitudes that shift based on your actions.
- **Technology tree** — 4 categories (military, economy, culture, governance) with prerequisites and research timers.
- **Royal council** — 5 councilor roles with individual skill, loyalty, and assignable tasks.
- **Espionage** — covert spy missions against rival kingdoms and provinces.
- **Trade system** — negotiate resource exchanges with duration-based trade agreements.
- **Faith & religion** — spend faith on powerful actions with cooldown mechanics.
- **Dynamic events** — random events with multiple choices that have real consequences on resources and relations.
- **Achievements** — unlock achievements across military, economy, diplomacy, expansion, and survival categories.

### Ruler & Dynasty

- **Ruler stats** — diplomacy, martial, stewardship, intrigue, and learning with trait modifiers.
- **Traits system** — 16 traits (brave, genius, cruel, cunning, etc.) that modify ruler stats and gameplay.
- **Heir system** — raise and educate your heir, manage claim strength and succession.
- **Spouse bonuses** — marriage provides stat and income bonuses.

### UI & Experience

- **Interactive kingdom map** — visual map with province colors, army indicators, and siege markers.
- **Resource bar** — always-visible gold, food, military, and faith with per-turn income.
- **Season & year display** — track the passage of time with seasonal effects.
- **War banner** — animated alerts when at war.
- **Turn summary modal** — detailed end-of-turn report.
- **Chronicle** — timeline view of your kingdom's history and stats.
- **Achievement popups** — celebratory animations when milestones are reached.
- **Kingdom selection** — choose from multiple starting kingdoms with different difficulties and bonuses.
- **Difficulty settings** — easy, normal, and hard modes.
- **Cloud saves** — sync game state via Supabase.
- **Rankings** — compare your kingdom's standing against AI rivals.

### Technical

- Built with **React Native** and **Expo** (SDK 54).
- File-based routing with **Expo Router**.
- State management via React Context with `@nkzw/create-context-hook`.
- Persistent game state with **AsyncStorage** and cloud sync via **Supabase**.
- Cross-platform — runs on iOS, Android, and web.
