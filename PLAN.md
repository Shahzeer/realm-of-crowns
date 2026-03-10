# Fog of War System for Realm of Crowns

## Features

- **Visible zones**: Your own provinces, their neighbors, provinces where your armies are stationed, and provinces targeted by active spy missions are fully visible
- **Fog zones**: All other provinces appear darkened with limited information
- **Hidden details in fog**: Enemy army sizes, building levels, garrison counts, and economic data are replaced with "?" when viewing fogged provinces
- **Dynamic fog updates**: Fog lifts/returns automatically as your armies march, spies deploy, or you gain/lose provinces
- **Fog indicator on map**: Fogged province nodes appear visually dimmed with a dark overlay and reduced detail
- **Connection lines in fog**: Roads between fogged provinces appear faded
- **Province detail screen**: When tapping a fogged province, you see limited intel — name, type, and owner only — with a "No Intel" label for hidden stats

## Design

- Fogged provinces get a dark semi-transparent overlay making them appear shrouded
- Province icons in fog use muted colors and smaller opacity
- Province names in fog are dimmed to near-invisible
- Army badges, garrison badges, and troop count labels are hidden on fogged provinces
- Territory glow effects are suppressed for fogged areas
- A subtle "eye" icon appears on the map legend indicating fog of war is active
- Connection lines to/from fogged provinces use a very faint color
- The province action popup shows restricted actions for fogged provinces (only "Spy" and limited "View Info")

## How It Works

- A visibility calculation runs whenever the map renders, checking each province against your owned territories, adjacency, army positions, and spy targets
- The map applies visual fog styling per-province based on visibility
- The province detail screen checks visibility before showing stats
- The province action popup adjusts available actions for fogged vs visible provinces
