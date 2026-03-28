# Starter Buildings & Research-Based Blueprint Unlocks

## Overview

When starting a new game, the player will only have **3 starter buildings** across their capital province. All other building types must be **unlocked through research** before they can be built. 

Also need to fix an issue user mentioned, "when sieging using multiple armies, after the siege is complete all armies attacking should march back".

After each turn the summary should also show updates on what has been completed in building and others, as well as mentioning hints.

---

## Features

### Starter Buildings (New Game)

- **Castle Keep** — already built in the player's capital (level 1)
- **Barracks** — already built in the player's capital (level 1)
- **Farmstead** — already built in the player's capital (level 1)
- All other provinces owned by the player start with **no buildings** (empty)
- AI kingdoms keep their existing building setups 

### Blueprint Unlock System

- A new "Unlocked Blueprints" list is tracked per game save
- Only **Castle Keep, Barracks, and Farmstead** are unlocked from the start
- The remaining blueprints (Marketplace, Temple, Stone Walls, Mine, Library, Tavern, Grand Cathedral, Granary, Lumber Mill, Monastery) are **locked** by default
- Each blueprint is tied to a specific **research technology** — once that tech is researched, the blueprint becomes available to build

### Blueprint ↔ Research Mapping

### Province Building Screen Changes

- Locked blueprints show as **greyed out** with a 🔒 lock icon
- Tapping a locked blueprint shows which research is needed to unlock it
- Unlocked blueprints work exactly as they do now (pay gold to build)

### AI Kingdoms

- AI kingdoms are **not restricted** by this system — they use their own separate building pool as before, so they can still build and claim freely

---

## Design

- Locked blueprints appear in the build menu with a dark, dimmed style and a lock icon overlay
- A small tag under each locked blueprint says something like *"Requires: Iron Working"*
- When a tech is researched that unlocks new blueprints, the turn summary log mentions *"🔓 New blueprint unlocked: Marketplace"*

