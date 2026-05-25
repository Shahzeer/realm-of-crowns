---
name: Lord/Province Assignment System
description: How lords govern provinces, pay taxes, and interact with turn processing in GameProvider.tsx
---

## Implementation

Lords are stored as `Lord[]` in `GameState.lords` (types/game.ts). Province has optional `assignedLordId?: string`.

## Key design decisions

- `taxRate = 0.5 + skill/50` (skill 5 = 0.60, skill 15 = 0.80) — lord remits this fraction to king
- Lord **cut** = `buildingGold * (1 - taxRate)` — deducted from `newResources.gold` each turn
- Lord levy replaces base +5 garrison/turn; lord-held provinces get +`skill * 3` garrison/turn instead
- Lord reduces province unrest by `Math.floor(skill / 8)` per turn
- Stewardship cap = `Math.floor(ruler.stewardship / 2) + 3` crown provinces before corruption penalty
- Loyalty drifts -2 to +1 per turn; +1 if diplomacy >= 14

## Lord processing location in advanceTurn

Inserted right after province garrison/population update (the `newProvinces = prev.provinces.map(...)` block). Uses `prev.lords` not `updatedLords` for the hasLord check in garrison base gain (lord-held provinces skip the base +5 since levy replaces it).

**Why:** processProvinceUnrest happens after lord processing, so lord unrest reduction is correctly applied before revolt checks.

## assignLord / dismissLord

Both use `setState` + `saveMutation.mutate` pattern. assignLord costs 50g, uses NOBLE_NAMES pool, creates Lord with random skill 5-15. dismissLord raises province unrest +20.
