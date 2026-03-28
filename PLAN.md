# Expand the Realm Map with Many More Regions & Larger Territories

## Overview

Massively expand the game map from **21 provinces to ~50 provinces**, giving each kingdom more territory and adding unclaimed/neutral regions to conquer. The map itself gets bigger so everything has room to breathe and no overlapping.

---

## Current → New Province Counts

---

## New Provinces (examples of what gets added)

- **Valkorian** gains: Crimson Keep, Ashen Marsh, Ironclad Pass, plus additional frontier lands
- **Solarian** gains: Gilded Reach, Palm Harbor, Sandstone Citadel, and desert outskirts
- **Nordheim** gains: Wolfden, Frostveil, Icereach — deeper into the frozen north
- **Crimson Horde** gains: Ember Wastes, Redthorn, Blazefort — filling out the southern desert
- **Emerald League** gains: Mosshollow, Seabreeze, Tidecrest — expanding the eastern coast
- **Ironforge** gains: Millhaven, Kingsbridge — filling gaps between existing provinces
- **Neutral lands** scattered across the map (e.g. Greymarch, The Crossing, Oldwatch, Hollowmere) — unclaimed and available for any kingdom to seize

---

## Map Changes

- The map area increases from **520px tall to ~800px tall**, and becomes **wider** (scrollable both horizontally and vertically)
- All existing province positions are re-spaced so they don't feel cramped
- New provinces are placed logically — each kingdom's territory forms a coherent region on the map
- Neutral provinces sit at border zones between kingdoms, creating natural battlegrounds
- Connection lines between provinces are updated to form a proper road/route network

---

## Kingdom & Army Updates

- Each AI kingdom gets **1–2 additional armies** stationed in their new provinces
- New provinces come with appropriate buildings, garrisons, and population based on their type
- Kingdom `startingProvinces` lists are updated for the kingdom selection screen
- Kingdom `strength` values are rebalanced to reflect their larger territories

---

## Design

- The map stays the same visual style (dark background, glowing territory nodes, colored borders)
- Scrollable in both directions so the larger map fits on any screen
- Province nodes stay the same size — capitals slightly larger, regular provinces standard
- Neutral/unclaimed provinces appear with a **grey** color and no owner badge

