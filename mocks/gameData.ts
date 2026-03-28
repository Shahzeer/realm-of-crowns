import { Ruler, Resources, Province, Army, Kingdom, GameEvent, Building, Trait, Technology, Councilor, Heir, BuildingBlueprint, CombatTactic, KingdomChoice, SpyMission, FaithAction, Achievement, AIPersonality, AIPersonalityProfile, RumorCategory } from '@/types/game';

export const TRAITS: Trait[] = [
  { id: 'brave', name: 'Brave', icon: '⚔️', effect: '+3 Martial, +10 Army Morale', modifier: { martial: 3 } },
  { id: 'just', name: 'Just', icon: '⚖️', effect: '+2 Diplomacy, +2 Stewardship', modifier: { diplomacy: 2, stewardship: 2 } },
  { id: 'ambitious', name: 'Ambitious', icon: '👑', effect: '+2 to all stats', modifier: { diplomacy: 2, martial: 2, stewardship: 2, intrigue: 2, learning: 2 } },
  { id: 'pious', name: 'Pious', icon: '🙏', effect: '+4 Learning, +1 Faith/turn', modifier: { learning: 4 } },
  { id: 'cruel', name: 'Cruel', icon: '🗡️', effect: '+3 Intrigue, -2 Diplomacy', modifier: { intrigue: 3, diplomacy: -2 } },
  { id: 'greedy', name: 'Greedy', icon: '💰', effect: '+3 Stewardship, -1 Diplomacy', modifier: { stewardship: 3, diplomacy: -1 } },
  { id: 'genius', name: 'Genius', icon: '🧠', effect: '+5 Learning, +2 Stewardship', modifier: { learning: 5, stewardship: 2 } },
  { id: 'strong', name: 'Strong', icon: '💪', effect: '+4 Martial, +10 Health', modifier: { martial: 4 } },
  { id: 'cunning', name: 'Cunning', icon: '🦊', effect: '+4 Intrigue, +2 Stewardship', modifier: { intrigue: 4, stewardship: 2 } },
  { id: 'charismatic', name: 'Charismatic', icon: '✨', effect: '+4 Diplomacy, +2 Intrigue', modifier: { diplomacy: 4, intrigue: 2 } },
  { id: 'paranoid', name: 'Paranoid', icon: '👁️', effect: '+2 Intrigue, -3 Diplomacy', modifier: { intrigue: 2, diplomacy: -3 } },
  { id: 'drunkard', name: 'Drunkard', icon: '🍷', effect: '-2 Stewardship, -1 Martial', modifier: { stewardship: -2, martial: -1 } },
  { id: 'strategist', name: 'Strategist', icon: '🗺️', effect: '+3 Martial, +2 Learning', modifier: { martial: 3, learning: 2 } },
  { id: 'diplomat', name: 'Diplomat', icon: '🤝', effect: '+5 Diplomacy', modifier: { diplomacy: 5 } },
  { id: 'zealot', name: 'Zealot', icon: '🔥', effect: '+3 Martial, +3 Faith, -2 Diplomacy', modifier: { martial: 3, diplomacy: -2 } },
];

export const COMBAT_TACTICS: CombatTactic[] = [
  { id: 'balanced', name: 'Balanced Formation', description: 'Standard formation with no special bonuses or penalties.', icon: '⚖️', attackModifier: 0, defenseModifier: 0, moraleModifier: 0, casualtyModifier: 0 },
  { id: 'aggressive', name: 'Aggressive Assault', description: 'All-out attack. Higher damage but more casualties taken.', icon: '🗡️', attackModifier: 25, defenseModifier: -15, moraleModifier: 5, casualtyModifier: 10 },
  { id: 'defensive', name: 'Shield Wall', description: 'Tighten formations. Fewer casualties but less attack power.', icon: '🛡️', attackModifier: -10, defenseModifier: 30, moraleModifier: 0, casualtyModifier: -20 },
  { id: 'flanking', name: 'Flanking Maneuver', description: 'Split forces to attack from sides. High risk, high reward.', icon: '🔄', attackModifier: 35, defenseModifier: -20, moraleModifier: -5, casualtyModifier: 15 },
  { id: 'guerrilla', name: 'Guerrilla Tactics', description: 'Hit-and-run style. Lower casualties but slower progress.', icon: '🌿', attackModifier: -5, defenseModifier: 15, moraleModifier: 10, casualtyModifier: -25 },
  { id: 'cavalry_charge', name: 'Cavalry Charge', description: 'Lead with cavalry for devastating initial impact.', icon: '🐴', attackModifier: 40, defenseModifier: -25, moraleModifier: 15, casualtyModifier: 20 },
  { id: 'siege_tactics', name: 'Siege Specialist', description: 'Optimized for breaking fortifications. Slower in open field.', icon: '🏰', attackModifier: 10, defenseModifier: 20, moraleModifier: -5, casualtyModifier: -10 },
];

const IRONFORGE_RULER: Ruler = {
  id: 'player_ruler',
  name: 'King Aldric',
  dynasty: 'House Ironforge',
  age: 32,
  health: 85,
  maxHealth: 100,
  diplomacy: 14,
  martial: 16,
  stewardship: 12,
  intrigue: 10,
  learning: 11,
  traits: [TRAITS[0], TRAITS[1], TRAITS[2]],
  avatar: '👤',
};

export const INITIAL_RULER: Ruler = IRONFORGE_RULER;

export const INITIAL_HEIR: Heir = {
  id: 'heir_1',
  name: 'Prince Edric',
  age: 12,
  diplomacy: 8,
  martial: 10,
  stewardship: 7,
  intrigue: 6,
  learning: 9,
  traits: [TRAITS[6]],
  claimStrength: 90,
};

export const INITIAL_RESOURCES: Resources = {
  gold: 500,
  food: 300,
  military: 200,
  faith: 100,
  goldPerTurn: 30,
  foodPerTurn: 20,
  militaryPerTurn: 8,
  faithPerTurn: 3,
};

const BUILDINGS: Record<string, Building[]> = {
  ironhold: [
    { id: 'b1', name: 'Castle Keep', level: 2, maxLevel: 10, description: 'Fortified seat of power', cost: { gold: 200 }, production: { militaryPerTurn: 2 }, icon: '🏰' },
    { id: 'b2', name: 'Market Square', level: 1, maxLevel: 10, description: 'Hub of trade and commerce', cost: { gold: 150 }, production: { goldPerTurn: 4 }, icon: '🏪' },
  ],
  thornvale: [
    { id: 'b4', name: 'Watchtower', level: 1, maxLevel: 10, description: 'Scouts approaching enemies', cost: { gold: 80 }, production: { militaryPerTurn: 1 }, icon: '🗼' },
  ],
  goldmere: [
    { id: 'b6', name: 'Gold Mine', level: 1, maxLevel: 10, description: 'Rich veins of gold ore', cost: { gold: 250 }, production: { goldPerTurn: 5 }, icon: '⛏️' },
  ],
  ashford: [
    { id: 'b9', name: 'Farmstead', level: 1, maxLevel: 10, description: 'Fertile farmlands', cost: { gold: 120 }, production: { foodPerTurn: 5 }, icon: '🌻' },
  ],
  stormwatch: [
    { id: 'b10', name: 'Fortress Wall', level: 1, maxLevel: 10, description: 'Massive stone fortifications', cost: { gold: 200 }, production: { militaryPerTurn: 2 }, icon: '🧱' },
  ],
  ravenspire: [],
  dragonfall: [
    { id: 'b14', name: 'War Forge', level: 2, maxLevel: 10, description: 'Forge of mighty weapons', cost: { gold: 200 }, production: { militaryPerTurn: 3 }, icon: '🔨' },
    { id: 'b15', name: 'Blood Arena', level: 1, maxLevel: 10, description: 'Warriors prove their worth', cost: { gold: 150 }, production: { militaryPerTurn: 2 }, icon: '🏟️' },
  ],
  blackmoor: [
    { id: 'b16', name: 'Iron Mine', level: 1, maxLevel: 10, description: 'Deep mountain mines', cost: { gold: 200 }, production: { goldPerTurn: 4 }, icon: '⛏️' },
  ],
  sunspear: [
    { id: 'b17', name: 'Grand Bazaar', level: 2, maxLevel: 10, description: 'Wealthy trade hub', cost: { gold: 250 }, production: { goldPerTurn: 6 }, icon: '🏪' },
  ],
  highgarden: [
    { id: 'b20', name: 'Great Farmstead', level: 1, maxLevel: 10, description: 'Bountiful harvests', cost: { gold: 100 }, production: { foodPerTurn: 5 }, icon: '🌻' },
  ],
  crimsonkeep: [
    { id: 'b21', name: 'War Pits', level: 1, maxLevel: 10, description: 'Brutal training grounds', cost: { gold: 180 }, production: { militaryPerTurn: 2 }, icon: '⚔️' },
  ],
  wolfden: [
    { id: 'b22', name: 'Hunter Lodge', level: 1, maxLevel: 10, description: 'Wolf pelts and provisions', cost: { gold: 100 }, production: { foodPerTurn: 3 }, icon: '🐺' },
  ],
  blazefort: [
    { id: 'b23', name: 'Fire Pit Forge', level: 1, maxLevel: 10, description: 'Desert weapons smithing', cost: { gold: 200 }, production: { militaryPerTurn: 2 }, icon: '🔥' },
  ],
  palmharbor: [
    { id: 'b24', name: 'Dockyard', level: 1, maxLevel: 10, description: 'Bustling harbor trade', cost: { gold: 200 }, production: { goldPerTurn: 4 }, icon: '⚓' },
  ],
  mosshollow: [
    { id: 'b25', name: 'Herbalist Hut', level: 1, maxLevel: 10, description: 'Rare healing herbs', cost: { gold: 120 }, production: { faithPerTurn: 2 }, icon: '🌿' },
  ],
};

export const BUILDING_BLUEPRINTS: BuildingBlueprint[] = [
  { id: 'bp_keep', name: 'Castle Keep', maxLevel: 10, description: 'Fortified seat of power', baseCost: 200, production: { militaryPerTurn: 2 }, icon: '🏰', requiredType: ['capital', 'castle'] },
  { id: 'bp_barracks', name: 'Barracks', maxLevel: 10, description: 'Train soldiers for your army', baseCost: 200, production: { militaryPerTurn: 2 }, icon: '⚔️' },
  { id: 'bp_farm', name: 'Farmstead', maxLevel: 10, description: 'Grow food for your people', baseCost: 120, production: { foodPerTurn: 3 }, icon: '🌻', requiredType: ['farmland', 'forest'] },
  { id: 'bp_market', name: 'Marketplace', maxLevel: 10, description: 'Boost local trade revenue', baseCost: 180, production: { goldPerTurn: 3 }, icon: '🏪' },
  { id: 'bp_temple', name: 'Temple', maxLevel: 10, description: 'A house of worship', baseCost: 160, production: { faithPerTurn: 2 }, icon: '🕯️' },
  { id: 'bp_walls', name: 'Stone Walls', maxLevel: 10, description: 'Fortify the province (+garrison)', baseCost: 250, production: { militaryPerTurn: 1 }, icon: '🧱', requiredType: ['castle', 'capital', 'city'] },
  { id: 'bp_mine', name: 'Mine', maxLevel: 10, description: 'Extract valuable ores', baseCost: 220, production: { goldPerTurn: 4 }, icon: '⛏️', requiredType: ['mountain'] },
  { id: 'bp_library', name: 'Library', maxLevel: 10, description: 'Advance knowledge and learning', baseCost: 300, production: { faithPerTurn: 1 }, icon: '📚' },
  { id: 'bp_tavern', name: 'Tavern', maxLevel: 10, description: 'Rest and recruitment hub', baseCost: 80, production: { goldPerTurn: 2 }, icon: '🍺' },
  { id: 'bp_cathedral', name: 'Grand Cathedral', maxLevel: 10, description: 'Center of worship and faith', baseCost: 280, production: { faithPerTurn: 3 }, icon: '⛪' },
  { id: 'bp_granary', name: 'Granary', maxLevel: 10, description: 'Stores food for the population', baseCost: 140, production: { foodPerTurn: 4 }, icon: '🌾' },
  { id: 'bp_lumber', name: 'Lumber Mill', maxLevel: 10, description: 'Processes timber for gold', baseCost: 100, production: { goldPerTurn: 2 }, icon: '🪵', requiredType: ['forest'] },
  { id: 'bp_monastery', name: 'Monastery', maxLevel: 10, description: 'Sacred place of learning', baseCost: 240, production: { faithPerTurn: 3 }, icon: '📿', requiredType: ['temple'] },
];

export const STARTER_BLUEPRINT_IDS: string[] = ['bp_keep', 'bp_barracks', 'bp_farm'];

export const BLUEPRINT_UNLOCK_MAP: Record<string, string> = {
  bp_market: 'tech_taxation',
  bp_tavern: 'tech_taxation',
  bp_mine: 'tech_ironworking',
  bp_walls: 'tech_fortification',
  bp_temple: 'tech_theology',
  bp_cathedral: 'tech_theology',
  bp_monastery: 'tech_theology',
  bp_library: 'tech_diplomacy',
  bp_granary: 'tech_farming',
  bp_lumber: 'tech_trade',
};

export function getUnlockedBlueprintIds(researchedTechIds: string[]): string[] {
  const unlocked = [...STARTER_BLUEPRINT_IDS];
  for (const [bpId, techId] of Object.entries(BLUEPRINT_UNLOCK_MAP)) {
    if (researchedTechIds.includes(techId)) {
      unlocked.push(bpId);
    }
  }
  return unlocked;
}

export const ALL_PROVINCES: Province[] = [
  // ═══════════════════════════════════════════
  // IRONFORGE KINGDOM (8 provinces) — Center-North
  // ═══════════════════════════════════════════
  { id: 'ironhold', name: 'Ironhold', type: 'capital', owner: 'ironforge', population: 12000, development: 75, buildings: BUILDINGS.ironhold, garrison: 500, color: '#d4a574', x: 0.38, y: 0.22, connectedTo: ['thornvale', 'goldmere', 'ashford', 'kingsbridge'] },
  { id: 'thornvale', name: 'Thornvale', type: 'forest', owner: 'ironforge', population: 5500, development: 40, buildings: BUILDINGS.thornvale, garrison: 200, color: '#4a8c3f', x: 0.26, y: 0.15, connectedTo: ['ironhold', 'stormwatch', 'frostpeak', 'greymarch'] },
  { id: 'goldmere', name: 'Goldmere', type: 'city', owner: 'ironforge', population: 8000, development: 60, buildings: BUILDINGS.goldmere, garrison: 300, color: '#e8b94a', x: 0.52, y: 0.16, connectedTo: ['ironhold', 'ashford', 'silverdale', 'millhaven'] },
  { id: 'ashford', name: 'Ashford', type: 'farmland', owner: 'ironforge', population: 6500, development: 50, buildings: BUILDINGS.ashford, garrison: 150, color: '#7bc96a', x: 0.45, y: 0.32, connectedTo: ['ironhold', 'goldmere', 'stormwatch', 'thecrossing'] },
  { id: 'stormwatch', name: 'Stormwatch', type: 'castle', owner: 'ironforge', population: 4000, development: 55, buildings: BUILDINGS.stormwatch, garrison: 450, color: '#6b7b95', x: 0.28, y: 0.30, connectedTo: ['thornvale', 'ashford', 'blackmoor', 'kingsbridge'] },
  { id: 'ravenspire', name: 'Ravenspire', type: 'temple', owner: 'ironforge', population: 3500, development: 65, buildings: BUILDINGS.ravenspire, garrison: 100, color: '#9b6fd0', x: 0.58, y: 0.25, connectedTo: ['goldmere', 'millhaven', 'highgarden'] },
  { id: 'kingsbridge', name: 'Kingsbridge', type: 'city', owner: 'ironforge', population: 7000, development: 55, buildings: [], garrison: 250, color: '#c4956a', x: 0.32, y: 0.25, connectedTo: ['ironhold', 'stormwatch', 'thornvale'] },
  { id: 'millhaven', name: 'Millhaven', type: 'farmland', owner: 'ironforge', population: 5000, development: 45, buildings: [], garrison: 180, color: '#8bc47a', x: 0.62, y: 0.18, connectedTo: ['goldmere', 'ravenspire', 'silverdale'] },

  // ═══════════════════════════════════════════
  // VALKORIAN EMPIRE (7 provinces) — West/Southwest
  // ═══════════════════════════════════════════
  { id: 'blackmoor', name: 'Blackmoor', type: 'mountain', owner: 'valkorian', population: 7000, development: 45, buildings: BUILDINGS.blackmoor, garrison: 600, color: '#555e6e', x: 0.14, y: 0.40, connectedTo: ['stormwatch', 'dragonfall', 'shadowfen', 'greymarch'] },
  { id: 'dragonfall', name: 'Dragonfall', type: 'capital', owner: 'valkorian', population: 11000, development: 70, buildings: BUILDINGS.dragonfall, garrison: 800, color: '#c41e3a', x: 0.22, y: 0.52, connectedTo: ['blackmoor', 'shadowfen', 'bloodhollow', 'crimsonkeep', 'thecrossing'] },
  { id: 'shadowfen', name: 'Shadowfen', type: 'forest', owner: 'valkorian', population: 4500, development: 35, buildings: [], garrison: 350, color: '#3a4a3a', x: 0.08, y: 0.55, connectedTo: ['blackmoor', 'dragonfall', 'ashenmarsh'] },
  { id: 'bloodhollow', name: 'Bloodhollow', type: 'castle', owner: 'valkorian', population: 5000, development: 50, buildings: [], garrison: 550, color: '#8a2233', x: 0.28, y: 0.64, connectedTo: ['dragonfall', 'dusthaven', 'ironclad', 'hollowmere'] },
  { id: 'crimsonkeep', name: 'Crimson Keep', type: 'castle', owner: 'valkorian', population: 6000, development: 55, buildings: BUILDINGS.crimsonkeep, garrison: 700, color: '#a82030', x: 0.16, y: 0.48, connectedTo: ['dragonfall', 'ashenmarsh'] },
  { id: 'ashenmarsh', name: 'Ashen Marsh', type: 'forest', owner: 'valkorian', population: 3500, development: 25, buildings: [], garrison: 250, color: '#4a3a3a', x: 0.05, y: 0.46, connectedTo: ['shadowfen', 'crimsonkeep'] },
  { id: 'ironclad', name: 'Ironclad Pass', type: 'mountain', owner: 'valkorian', population: 4000, development: 40, buildings: [], garrison: 500, color: '#6a5e5e', x: 0.18, y: 0.62, connectedTo: ['bloodhollow', 'dragonfall'] },

  // ═══════════════════════════════════════════
  // SOLARIAN DOMINION (6 provinces) — Center/Southeast
  // ═══════════════════════════════════════════
  { id: 'sunspear', name: 'Sunspear', type: 'capital', owner: 'solarian', population: 13000, development: 80, buildings: BUILDINGS.sunspear, garrison: 400, color: '#e8a832', x: 0.48, y: 0.48, connectedTo: ['thecrossing', 'highgarden', 'oasisrest', 'gildedreach'] },
  { id: 'highgarden', name: 'Highgarden', type: 'farmland', owner: 'solarian', population: 7500, development: 55, buildings: BUILDINGS.highgarden, garrison: 200, color: '#56b849', x: 0.62, y: 0.38, connectedTo: ['sunspear', 'ravenspire', 'silverdale', 'seabreeze'] },
  { id: 'oasisrest', name: 'Oasis Rest', type: 'city', owner: 'solarian', population: 6000, development: 50, buildings: [], garrison: 250, color: '#d4a040', x: 0.55, y: 0.58, connectedTo: ['sunspear', 'dusthaven', 'coralport', 'palmharbor'] },
  { id: 'gildedreach', name: 'Gilded Reach', type: 'city', owner: 'solarian', population: 8000, development: 60, buildings: [], garrison: 300, color: '#daa520', x: 0.40, y: 0.42, connectedTo: ['sunspear', 'thecrossing', 'hollowmere'] },
  { id: 'palmharbor', name: 'Palm Harbor', type: 'city', owner: 'solarian', population: 7000, development: 55, buildings: BUILDINGS.palmharbor, garrison: 280, color: '#c8963a', x: 0.62, y: 0.55, connectedTo: ['oasisrest', 'coralport', 'seabreeze'] },
  { id: 'sandcitadel', name: 'Sandstone Citadel', type: 'castle', owner: 'solarian', population: 5500, development: 50, buildings: [], garrison: 400, color: '#b8862d', x: 0.50, y: 0.55, connectedTo: ['sunspear', 'oasisrest', 'hollowmere'] },

  // ═══════════════════════════════════════════
  // NORDHEIM CONFEDERACY (6 provinces) — Northwest
  // ═══════════════════════════════════════════
  { id: 'frostpeak', name: 'Frostpeak', type: 'capital', owner: 'nordheim', population: 8000, development: 50, buildings: [], garrison: 700, color: '#4488cc', x: 0.12, y: 0.10, connectedTo: ['thornvale', 'glacierhold', 'windshear', 'wolfden'] },
  { id: 'glacierhold', name: 'Glacierhold', type: 'mountain', owner: 'nordheim', population: 4000, development: 35, buildings: [], garrison: 500, color: '#6699bb', x: 0.05, y: 0.25, connectedTo: ['frostpeak', 'windshear', 'frostveil'] },
  { id: 'windshear', name: 'Windshear', type: 'castle', owner: 'nordheim', population: 5000, development: 45, buildings: [], garrison: 600, color: '#3377aa', x: 0.18, y: 0.04, connectedTo: ['frostpeak', 'glacierhold', 'icereach'] },
  { id: 'wolfden', name: 'Wolfden', type: 'forest', owner: 'nordheim', population: 3500, development: 30, buildings: BUILDINGS.wolfden, garrison: 350, color: '#5588aa', x: 0.20, y: 0.12, connectedTo: ['frostpeak', 'greymarch', 'icereach'] },
  { id: 'frostveil', name: 'Frostveil', type: 'mountain', owner: 'nordheim', population: 3000, development: 25, buildings: [], garrison: 400, color: '#779cc0', x: 0.04, y: 0.14, connectedTo: ['glacierhold', 'icereach'] },
  { id: 'icereach', name: 'Icereach', type: 'castle', owner: 'nordheim', population: 4500, development: 40, buildings: [], garrison: 550, color: '#4477aa', x: 0.10, y: 0.04, connectedTo: ['windshear', 'wolfden', 'frostveil'] },

  // ═══════════════════════════════════════════
  // CRIMSON HORDE (5 provinces) — South
  // ═══════════════════════════════════════════
  { id: 'dusthaven', name: 'Dusthaven', type: 'capital', owner: 'crimsonhorde', population: 9000, development: 40, buildings: [], garrison: 650, color: '#cc5533', x: 0.38, y: 0.72, connectedTo: ['bloodhollow', 'oasisrest', 'scorchlands', 'emberwaste', 'hollowmere'] },
  { id: 'scorchlands', name: 'Scorchlands', type: 'farmland', owner: 'crimsonhorde', population: 5500, development: 30, buildings: [], garrison: 300, color: '#aa4422', x: 0.28, y: 0.80, connectedTo: ['dusthaven', 'redthorn'] },
  { id: 'emberwaste', name: 'Ember Wastes', type: 'farmland', owner: 'crimsonhorde', population: 4000, development: 25, buildings: [], garrison: 280, color: '#b54428', x: 0.48, y: 0.78, connectedTo: ['dusthaven', 'blazefort'] },
  { id: 'redthorn', name: 'Redthorn', type: 'forest', owner: 'crimsonhorde', population: 3500, development: 30, buildings: [], garrison: 320, color: '#993322', x: 0.20, y: 0.76, connectedTo: ['scorchlands', 'ironclad'] },
  { id: 'blazefort', name: 'Blazefort', type: 'castle', owner: 'crimsonhorde', population: 5000, development: 45, buildings: BUILDINGS.blazefort, garrison: 500, color: '#cc4422', x: 0.55, y: 0.75, connectedTo: ['emberwaste', 'oldwatch'] },

  // ═══════════════════════════════════════════
  // EMERALD LEAGUE (6 provinces) — East
  // ═══════════════════════════════════════════
  { id: 'silverdale', name: 'Silverdale', type: 'capital', owner: 'emeraldleague', population: 10000, development: 65, buildings: [], garrison: 350, color: '#33aa66', x: 0.78, y: 0.22, connectedTo: ['goldmere', 'millhaven', 'highgarden', 'jadecrest', 'tidecrest'] },
  { id: 'coralport', name: 'Coral Port', type: 'city', owner: 'emeraldleague', population: 8500, development: 60, buildings: [], garrison: 280, color: '#44bb77', x: 0.82, y: 0.48, connectedTo: ['silverdale', 'oasisrest', 'palmharbor', 'seabreeze', 'mosshollow'] },
  { id: 'jadecrest', name: 'Jade Crest', type: 'temple', owner: 'emeraldleague', population: 4500, development: 55, buildings: [], garrison: 200, color: '#228855', x: 0.88, y: 0.12, connectedTo: ['silverdale', 'tidecrest'] },
  { id: 'mosshollow', name: 'Mosshollow', type: 'forest', owner: 'emeraldleague', population: 4000, development: 40, buildings: BUILDINGS.mosshollow, garrison: 220, color: '#2a8844', x: 0.92, y: 0.38, connectedTo: ['coralport', 'tidecrest'] },
  { id: 'seabreeze', name: 'Seabreeze', type: 'farmland', owner: 'emeraldleague', population: 5500, development: 50, buildings: [], garrison: 200, color: '#55cc88', x: 0.75, y: 0.38, connectedTo: ['highgarden', 'coralport', 'palmharbor'] },
  { id: 'tidecrest', name: 'Tidecrest', type: 'city', owner: 'emeraldleague', population: 6500, development: 55, buildings: [], garrison: 260, color: '#44aa77', x: 0.92, y: 0.25, connectedTo: ['silverdale', 'jadecrest', 'mosshollow'] },

  // ═══════════════════════════════════════════
  // NEUTRAL / UNCLAIMED TERRITORIES (7 provinces)
  // ═══════════════════════════════════════════
  { id: 'greymarch', name: 'Greymarch', type: 'farmland', owner: 'neutral', population: 2500, development: 20, buildings: [], garrison: 150, color: '#666666', x: 0.18, y: 0.28, connectedTo: ['thornvale', 'blackmoor', 'wolfden'] },
  { id: 'thecrossing', name: 'The Crossing', type: 'city', owner: 'neutral', population: 4000, development: 35, buildings: [], garrison: 200, color: '#777777', x: 0.36, y: 0.40, connectedTo: ['ashford', 'dragonfall', 'sunspear', 'gildedreach'] },
  { id: 'oldwatch', name: 'Oldwatch', type: 'castle', owner: 'neutral', population: 3000, development: 30, buildings: [], garrison: 300, color: '#888888', x: 0.65, y: 0.68, connectedTo: ['blazefort', 'coralport', 'palmharbor'] },
  { id: 'hollowmere', name: 'Hollowmere', type: 'forest', owner: 'neutral', population: 2000, development: 15, buildings: [], garrison: 120, color: '#5a5a5a', x: 0.40, y: 0.58, connectedTo: ['bloodhollow', 'dusthaven', 'gildedreach', 'sandcitadel'] },
  { id: 'wyrmrest', name: 'Wyrmrest', type: 'temple', owner: 'neutral', population: 2800, development: 25, buildings: [], garrison: 180, color: '#707070', x: 0.50, y: 0.08, connectedTo: ['goldmere', 'millhaven', 'windshear'] },
  { id: 'duskwood', name: 'Duskwood', type: 'forest', owner: 'neutral', population: 1800, development: 15, buildings: [], garrison: 100, color: '#606060', x: 0.08, y: 0.35, connectedTo: ['glacierhold', 'blackmoor', 'greymarch'] },
  { id: 'stonehearth', name: 'Stonehearth', type: 'mountain', owner: 'neutral', population: 3200, development: 30, buildings: [], garrison: 250, color: '#7a7a7a', x: 0.72, y: 0.60, connectedTo: ['coralport', 'oldwatch', 'palmharbor'] },
];

export const INITIAL_PROVINCES: Province[] = ALL_PROVINCES;

export const INITIAL_ARMIES: Army[] = [
  { id: 'army1', name: 'Royal Guard', owner: 'player', troops: 800, maxTroops: 1200, morale: 90, commander: 'King Aldric', location: 'ironhold', status: 'idle' },
  { id: 'army2', name: 'Northern Vanguard', owner: 'player', troops: 450, maxTroops: 800, morale: 75, commander: 'Lord Cedric', location: 'stormwatch', status: 'idle' },
];

const VALKORIAN_RULER: Ruler = {
  id: 'valk_ruler', name: 'Warlord Krath', dynasty: 'Blood Wolves', age: 45,
  health: 70, maxHealth: 100, diplomacy: 6, martial: 20, stewardship: 8,
  intrigue: 15, learning: 5, traits: [TRAITS[4], TRAITS[7]], avatar: '👤',
};

const SOLARIAN_RULER: Ruler = {
  id: 'sol_ruler', name: 'Empress Lyanna', dynasty: 'House Solaris', age: 38,
  health: 90, maxHealth: 100, diplomacy: 18, martial: 10, stewardship: 16,
  intrigue: 12, learning: 14, traits: [TRAITS[1], TRAITS[5]], avatar: '👤',
};

const NORDHEIM_RULER: Ruler = {
  id: 'nord_ruler', name: 'Jarl Bjorn', dynasty: 'Frostborn Clan', age: 50,
  health: 60, maxHealth: 100, diplomacy: 8, martial: 18, stewardship: 10,
  intrigue: 7, learning: 6, traits: [TRAITS[0], TRAITS[12]], avatar: '👤',
};

const CRIMSON_RULER: Ruler = {
  id: 'crim_ruler', name: 'Khan Darius', dynasty: 'Crimson Dynasty', age: 42,
  health: 75, maxHealth: 100, diplomacy: 5, martial: 22, stewardship: 7,
  intrigue: 11, learning: 4, traits: [TRAITS[4], TRAITS[14]], avatar: '👤',
};

const EMERALD_RULER: Ruler = {
  id: 'emer_ruler', name: 'Archon Selene', dynasty: 'Jade Council', age: 35,
  health: 95, maxHealth: 100, diplomacy: 16, martial: 8, stewardship: 18,
  intrigue: 14, learning: 16, traits: [TRAITS[6], TRAITS[13]], avatar: '👤',
};

export const INITIAL_KINGDOMS: Kingdom[] = [
  {
    id: 'valkorian', name: 'Valkorian Empire', ruler: VALKORIAN_RULER,
    provinces: ['blackmoor', 'dragonfall', 'shadowfen', 'bloodhollow', 'crimsonkeep', 'ashenmarsh', 'ironclad'], relation: -40,
    attitude: 'hostile', color: '#c41e3a', strength: 4200,
    armies: [
      { id: 'valk_army1', name: 'Blood Wolves', owner: 'valkorian', troops: 900, maxTroops: 1200, morale: 85, commander: 'Warlord Krath', location: 'dragonfall', status: 'idle' },
      { id: 'valk_army2', name: 'Blackmoor Raiders', owner: 'valkorian', troops: 500, maxTroops: 800, morale: 70, commander: 'Captain Vex', location: 'blackmoor', status: 'idle' },
      { id: 'valk_army3', name: 'Shadow Stalkers', owner: 'valkorian', troops: 350, maxTroops: 600, morale: 65, commander: 'Lord Shade', location: 'shadowfen', status: 'idle' },
      { id: 'valk_army4', name: 'Crimson Vanguard', owner: 'valkorian', troops: 450, maxTroops: 700, morale: 75, commander: 'Warchief Rook', location: 'crimsonkeep', status: 'idle' },
    ],
    treasury: 1000,
    crest: '🐺',
    description: 'A brutal military empire built on conquest and blood.',
  },
  {
    id: 'solarian', name: 'Solarian Dominion', ruler: SOLARIAN_RULER,
    provinces: ['sunspear', 'highgarden', 'oasisrest', 'gildedreach', 'palmharbor', 'sandcitadel'], relation: 25,
    attitude: 'neutral', color: '#e8a832', strength: 2400,
    armies: [
      { id: 'sol_army1', name: 'Sunguard', owner: 'solarian', troops: 500, maxTroops: 700, morale: 80, commander: 'Empress Lyanna', location: 'sunspear', status: 'idle' },
      { id: 'sol_army2', name: 'Golden Legion', owner: 'solarian', troops: 350, maxTroops: 500, morale: 75, commander: 'Commander Theron', location: 'highgarden', status: 'idle' },
      { id: 'sol_army3', name: 'Dune Wardens', owner: 'solarian', troops: 400, maxTroops: 600, morale: 78, commander: 'Captain Soraya', location: 'sandcitadel', status: 'idle' },
    ],
    treasury: 2000,
    crest: '☀️',
    description: 'A wealthy dominion of trade, diplomacy, and golden cities.',
  },
  {
    id: 'nordheim', name: 'Nordheim Confederacy', ruler: NORDHEIM_RULER,
    provinces: ['frostpeak', 'glacierhold', 'windshear', 'wolfden', 'frostveil', 'icereach'], relation: 10,
    attitude: 'neutral', color: '#58a6ff', strength: 3200,
    armies: [
      { id: 'nord_army1', name: 'Frost Raiders', owner: 'nordheim', troops: 600, maxTroops: 900, morale: 75, commander: 'Jarl Bjorn', location: 'frostpeak', status: 'idle' },
      { id: 'nord_army2', name: 'Ice Wardens', owner: 'nordheim', troops: 400, maxTroops: 600, morale: 70, commander: 'Thane Erik', location: 'glacierhold', status: 'idle' },
      { id: 'nord_army3', name: 'Wolf Hunters', owner: 'nordheim', troops: 350, maxTroops: 550, morale: 72, commander: 'Huskarl Sven', location: 'wolfden', status: 'idle' },
    ],
    treasury: 800,
    crest: '❄️',
    description: 'Hardy northern warriors united by frost and steel.',
  },
  {
    id: 'crimsonhorde', name: 'Crimson Horde', ruler: CRIMSON_RULER,
    provinces: ['dusthaven', 'scorchlands', 'emberwaste', 'redthorn', 'blazefort'], relation: -20,
    attitude: 'hostile', color: '#cc5533', strength: 2800,
    armies: [
      { id: 'crim_army1', name: 'Scorched Legion', owner: 'crimsonhorde', troops: 700, maxTroops: 1000, morale: 80, commander: 'Khan Darius', location: 'dusthaven', status: 'idle' },
      { id: 'crim_army2', name: 'Desert Riders', owner: 'crimsonhorde', troops: 400, maxTroops: 600, morale: 70, commander: 'Warlord Zara', location: 'scorchlands', status: 'idle' },
      { id: 'crim_army3', name: 'Ember Guard', owner: 'crimsonhorde', troops: 350, maxTroops: 550, morale: 68, commander: 'Chieftain Raze', location: 'blazefort', status: 'idle' },
    ],
    treasury: 700,
    crest: '🔥',
    description: 'Fierce nomadic warriors from the scorched southern wastes.',
  },
  {
    id: 'emeraldleague', name: 'Emerald League', ruler: EMERALD_RULER,
    provinces: ['silverdale', 'coralport', 'jadecrest', 'mosshollow', 'seabreeze', 'tidecrest'], relation: 30,
    attitude: 'friendly', color: '#33aa66', strength: 1800,
    armies: [
      { id: 'emer_army1', name: 'Jade Sentinels', owner: 'emeraldleague', troops: 400, maxTroops: 600, morale: 85, commander: 'Archon Selene', location: 'silverdale', status: 'idle' },
      { id: 'emer_army2', name: 'Coral Marines', owner: 'emeraldleague', troops: 300, maxTroops: 500, morale: 80, commander: 'Admiral Kai', location: 'coralport', status: 'idle' },
      { id: 'emer_army3', name: 'Tide Wardens', owner: 'emeraldleague', troops: 280, maxTroops: 450, morale: 82, commander: 'Warden Lira', location: 'tidecrest', status: 'idle' },
    ],
    treasury: 2500,
    crest: '💎',
    description: 'A league of scholar-merchants who value knowledge and gold.',
  },
];

export const KINGDOM_CHOICES: KingdomChoice[] = [
  {
    id: 'ironforge',
    name: 'Kingdom of Ironforge',
    dynasty: 'House Ironforge',
    description: 'A balanced kingdom with strong military tradition and rich farmlands. The heart of the realm.',
    color: '#d4a574',
    crest: '⚔️',
    ruler: IRONFORGE_RULER,
    difficulty: 'easy',
    startingProvinces: ['ironhold', 'thornvale', 'goldmere', 'ashford', 'stormwatch', 'ravenspire', 'kingsbridge', 'millhaven'],
    bonuses: '+10% Gold income, Balanced stats',
  },
  {
    id: 'valkorian',
    name: 'Valkorian Empire',
    dynasty: 'Blood Wolves',
    description: 'A fearsome empire built on martial prowess. Strong armies but weak economy.',
    color: '#c41e3a',
    crest: '🐺',
    ruler: VALKORIAN_RULER,
    difficulty: 'medium',
    startingProvinces: ['blackmoor', 'dragonfall', 'shadowfen', 'bloodhollow', 'crimsonkeep', 'ashenmarsh', 'ironclad'],
    bonuses: '+20% Army strength, -10% Gold income',
  },
  {
    id: 'solarian',
    name: 'Solarian Dominion',
    dynasty: 'House Solaris',
    description: 'A wealthy trade nation. Excellent economy but fewer soldiers.',
    color: '#e8a832',
    crest: '☀️',
    ruler: SOLARIAN_RULER,
    difficulty: 'medium',
    startingProvinces: ['sunspear', 'highgarden', 'oasisrest', 'gildedreach', 'palmharbor', 'sandcitadel'],
    bonuses: '+30% Gold income, High diplomacy',
  },
  {
    id: 'nordheim',
    name: 'Nordheim Confederacy',
    dynasty: 'Frostborn Clan',
    description: 'Northern warriors with strong garrison defenses. Cold lands limit food.',
    color: '#58a6ff',
    crest: '❄️',
    ruler: NORDHEIM_RULER,
    difficulty: 'hard',
    startingProvinces: ['frostpeak', 'glacierhold', 'windshear', 'wolfden', 'frostveil', 'icereach'],
    bonuses: '+25% Garrison defense, -15% Food',
  },
  {
    id: 'crimsonhorde',
    name: 'Crimson Horde',
    dynasty: 'Crimson Dynasty',
    description: 'Ferocious desert warriors. Fastest army recruitment but small territory.',
    color: '#cc5533',
    crest: '🔥',
    ruler: CRIMSON_RULER,
    difficulty: 'hard',
    startingProvinces: ['dusthaven', 'scorchlands', 'emberwaste', 'redthorn', 'blazefort'],
    bonuses: '+30% Army speed, Fierce warriors',
  },
  {
    id: 'emeraldleague',
    name: 'Emerald League',
    dynasty: 'Jade Council',
    description: 'Scholar-merchants with the richest treasury. Research faster but weaker military.',
    color: '#33aa66',
    crest: '💎',
    ruler: EMERALD_RULER,
    difficulty: 'medium',
    startingProvinces: ['silverdale', 'coralport', 'jadecrest', 'mosshollow', 'seabreeze', 'tidecrest'],
    bonuses: '-2 turns on research, Highest starting gold',
  },
];

export const INITIAL_TECHNOLOGIES: Technology[] = [
  { id: 'tech_ironworking', name: 'Iron Working', description: 'Master smiths forge superior blades and armor from refined iron ore. Soldiers equipped with ironwork deal more damage and your provinces produce troops faster.', category: 'military', cost: 150, turnsToResearch: 4, turnsRemaining: 0, researched: false, researching: false, effects: { militaryPerTurn: 3, armyStrength: 10 }, icon: '⚒️' },
  { id: 'tech_taxation', name: 'Tax Reform', description: 'Overhaul the feudal tax system with centralized ledgers and appointed collectors. Each province contributes more efficiently to the royal treasury.', category: 'economy', cost: 120, turnsToResearch: 3, turnsRemaining: 0, researched: false, researching: false, effects: { goldPerTurn: 10 }, icon: '📊' },
  { id: 'tech_farming', name: 'Crop Rotation', description: 'Introduce three-field farming that alternates crops seasonally, preventing soil exhaustion and dramatically increasing food yields across your realm.', category: 'economy', cost: 100, turnsToResearch: 3, turnsRemaining: 0, researched: false, researching: false, effects: { foodPerTurn: 8 }, icon: '🌱' },
  { id: 'tech_theology', name: 'Theology', description: 'Establish a formal school of religious thought that deepens the faith of your subjects. Temples and monasteries generate more piety each turn.', category: 'culture', cost: 130, turnsToResearch: 4, turnsRemaining: 0, researched: false, researching: false, effects: { faithPerTurn: 5 }, icon: '📿' },
  { id: 'tech_fortification', name: 'Advanced Fortification', description: 'Construct concentric castle walls with arrow slits, murder holes, and deep moats. Garrisons in fortified provinces gain a massive defensive bonus.', category: 'military', cost: 200, turnsToResearch: 5, turnsRemaining: 0, researched: false, researching: false, effects: { garrisonBonus: 100 }, icon: '🏰', requires: ['tech_ironworking'] },
  { id: 'tech_trade', name: 'Trade Routes', description: 'Charter merchant guilds and establish protected caravan routes between provinces. Trade agreements become far more lucrative for your kingdom.', category: 'economy', cost: 180, turnsToResearch: 4, turnsRemaining: 0, researched: false, researching: false, effects: { goldPerTurn: 15 }, icon: '🚢', requires: ['tech_taxation'] },
  { id: 'tech_siege', name: 'Siege Warfare', description: 'Develop trebuchets, battering rams, and siege towers that can breach even the mightiest walls. Siege progress advances faster each turn.', category: 'military', cost: 250, turnsToResearch: 6, turnsRemaining: 0, researched: false, researching: false, effects: { siegeSpeed: 2 }, icon: '🪨', requires: ['tech_ironworking'] },
  { id: 'tech_diplomacy', name: 'Diplomatic Corps', description: 'Train a cadre of skilled ambassadors fluent in foreign customs and court etiquette. All diplomatic actions receive a bonus to their effectiveness.', category: 'governance', cost: 160, turnsToResearch: 4, turnsRemaining: 0, researched: false, researching: false, effects: { diplomacyBonus: 5 }, icon: '🕊️' },
  { id: 'tech_espionage', name: 'Espionage Network', description: 'Build a network of spies, informants, and double agents embedded in foreign courts. Spy missions have higher success rates and reveal deeper intelligence.', category: 'governance', cost: 200, turnsToResearch: 5, turnsRemaining: 0, researched: false, researching: false, effects: { intrigueBonus: 5 }, icon: '🕵️', requires: ['tech_diplomacy'] },
  { id: 'tech_medicine', name: 'Medicine', description: 'Advance the healing arts with herbal pharmacology and early surgical techniques. Your ruler lives longer and province populations grow faster.', category: 'culture', cost: 170, turnsToResearch: 4, turnsRemaining: 0, researched: false, researching: false, effects: { healthBonus: 15, populationGrowth: 200 }, icon: '🩺', requires: ['tech_theology'] },
  { id: 'tech_professional_army', name: 'Professional Army', description: 'Transform your feudal levies into a standing professional force with standardized training, supply chains, and discipline. Armies no longer lose morale while marching.', category: 'military', cost: 280, turnsToResearch: 5, turnsRemaining: 0, researched: false, researching: false, effects: { marchMoralePreserve: 1, armyStrength: 5 }, icon: '🎖️', requires: ['tech_ironworking'] },
  { id: 'tech_banking_guild', name: 'Banking Guild', description: 'Establish chartered banking houses that facilitate credit, currency exchange, and investment across your realm. All trade income is boosted by 25%.', category: 'economy', cost: 220, turnsToResearch: 5, turnsRemaining: 0, researched: false, researching: false, effects: { tradeIncomeBonus: 25, goldPerTurn: 5 }, icon: '🏦', requires: ['tech_trade'] },
  { id: 'tech_royal_archives', name: 'Royal Archives', description: 'Construct a grand repository of knowledge housing historical records, intelligence reports, and scholarly works. Improves rumor accuracy and unlocks hidden event bonuses.', category: 'governance', cost: 240, turnsToResearch: 5, turnsRemaining: 0, researched: false, researching: false, effects: { rumorAccuracyBonus: 20, learningBonus: 3 }, icon: '📚', requires: ['tech_espionage'] },
  { id: 'tech_siege_engineering', name: 'Siege Engineering', description: 'Employ master engineers who design devastating siege weapons and efficient fortification-breaking techniques. All sieges complete 50% faster.', category: 'military', cost: 300, turnsToResearch: 6, turnsRemaining: 0, researched: false, researching: false, effects: { siegeSpeedBonus: 50, armyStrength: 3 }, icon: '⚙️', requires: ['tech_siege'] },
  { id: 'tech_divine_right', name: 'Divine Right', description: 'Proclaim your dynasty\'s rule as ordained by the heavens. Subjects across all provinces gain deep reverence for the crown, boosting loyalty by 20 and greatly reducing revolt risk.', category: 'culture', cost: 260, turnsToResearch: 6, turnsRemaining: 0, researched: false, researching: false, effects: { loyaltyBonus: 20, revoltReduction: 15 }, icon: '👑', requires: ['tech_theology'] },
];

export const INITIAL_COUNCIL: Councilor[] = [
  { id: 'council_1', name: 'Sir Garrett', role: 'marshal', skill: 14, loyalty: 80, trait: TRAITS[0], avatar: '🛡️' },
  { id: 'council_2', name: 'Lord Percival', role: 'steward', skill: 12, loyalty: 90, trait: TRAITS[5], avatar: '💼' },
  { id: 'council_3', name: 'Shadow Mira', role: 'spymaster', skill: 16, loyalty: 55, trait: TRAITS[8], avatar: '🎭' },
  { id: 'council_4', name: 'Bishop Aldwin', role: 'chaplain', skill: 13, loyalty: 85, trait: TRAITS[3], avatar: '⛪' },
  { id: 'council_5', name: 'Lady Elara', role: 'chancellor', skill: 15, loyalty: 75, trait: TRAITS[9], avatar: '📜' },
];

export const INITIAL_EVENTS: GameEvent[] = [
  {
    id: 'evt_1', title: 'Border Dispute',
    description: 'Valkorian scouts have been spotted near Stormwatch. Your border lords request reinforcements to deter further incursions.',
    type: 'military',
    choices: [
      { id: 'c1', text: 'Send reinforcements', effects: '+200 garrison at Stormwatch', cost: { gold: 100, military: 50 } },
      { id: 'c2', text: 'Send a diplomatic envoy', effects: '+10 relations with Valkorian Empire', cost: { gold: 50 } },
      { id: 'c3', text: 'Ignore the reports', effects: 'No immediate cost, risk of raid' },
    ],
    turn: 1, seen: false,
  },
  {
    id: 'evt_2', title: 'Harvest Festival',
    description: 'The autumn harvest has been bountiful this year. Your steward suggests organizing a grand festival to boost morale.',
    type: 'economic',
    choices: [
      { id: 'c4', text: 'Host a grand feast', effects: '+50 Food, +20 Faith', cost: { gold: 80 }, reward: { food: 50, faith: 20 } },
      { id: 'c5', text: 'Store the surplus', effects: '+100 Food reserves', reward: { food: 100 } },
    ],
    turn: 1, seen: false,
  },
];

export const SEASONS: Array<'Spring' | 'Summer' | 'Autumn' | 'Winter'> = ['Spring', 'Summer', 'Autumn', 'Winter'];

export const SEASON_EFFECTS: Record<string, { food: number; gold: number; military: number; description: string }> = {
  Spring: { food: 5, gold: 0, military: 0, description: 'Fields bloom, food production rises' },
  Summer: { food: 8, gold: 3, military: 0, description: 'Peak harvest, trade thrives' },
  Autumn: { food: 0, gold: 0, military: 2, description: 'Levies gather before winter' },
  Winter: { food: -10, gold: -5, military: -3, description: 'Harsh cold drains resources' },
};

export const PROVINCE_TYPE_ICONS: Record<string, string> = {
  capital: '🏰', city: '🏘️', castle: '⚔️', temple: '⛪', farmland: '🌾', forest: '🌲', mountain: '⛰️',
};

export const RANDOM_EVENTS: Omit<GameEvent, 'turn' | 'seen'>[] = [
  { id: 'rand_1', title: 'Plague Outbreak', description: 'A mysterious plague has broken out in one of your provinces. The people look to you for guidance.', type: 'personal', choices: [{ id: 'rc1', text: 'Quarantine the province', effects: '-500 population, prevents spread', cost: { gold: 100 } }, { id: 'rc2', text: 'Pray for divine intervention', effects: 'Unpredictable outcome', cost: { faith: 30 } }, { id: 'rc3', text: 'Send physicians', effects: 'Slow recovery', cost: { gold: 200 } }] },
  { id: 'rand_2', title: 'Merchant Caravan', description: 'A wealthy merchant caravan from distant lands seeks passage through your realm.', type: 'economic', choices: [{ id: 'rc4', text: 'Grant passage for tribute', effects: '+150 Gold', reward: { gold: 150 } }, { id: 'rc5', text: 'Tax them heavily', effects: '+250 Gold, -10 relations', reward: { gold: 250 } }, { id: 'rc6', text: 'Seize the caravan', effects: '+400 Gold, -30 relations', reward: { gold: 400 } }] },
  { id: 'rand_3', title: 'Knight Tournament', description: 'Your court marshal proposes hosting a tournament to attract skilled warriors.', type: 'military', choices: [{ id: 'rc7', text: 'Host grand tournament', effects: '+50 Military, +10 Morale', cost: { gold: 150 }, reward: { military: 50 } }, { id: 'rc8', text: 'Hold a modest contest', effects: '+20 Military', cost: { gold: 50 }, reward: { military: 20 } }] },
  { id: 'rand_4', title: 'Religious Vision', description: 'A holy figure claims to have received a divine vision about your dynasty\'s great destiny.', type: 'religious', choices: [{ id: 'rc9', text: 'Embrace the prophecy', effects: '+40 Faith, +5 Diplomacy opinion', reward: { faith: 40 } }, { id: 'rc10', text: 'Dismiss as nonsense', effects: '-10 Faith, seen as pragmatic' }] },
  { id: 'rand_5', title: 'Rebel Uprising', description: 'Dissatisfied peasants have taken up arms demanding lower taxes and better conditions.', type: 'political', choices: [{ id: 'rc11', text: 'Crush the rebellion', effects: '-100 Military, restore order', cost: { military: 100 } }, { id: 'rc12', text: 'Negotiate terms', effects: '-20 Gold/turn for 3 turns', cost: { gold: 60 } }, { id: 'rc13', text: 'Grant their demands', effects: '-10 Gold/turn, +loyalty', cost: { gold: 30 }, reward: { food: 20 } }] },
  { id: 'rand_6', title: 'Alliance Proposal', description: 'A foreign kingdom offers a formal alliance through marriage.', type: 'political', choices: [{ id: 'rc14', text: 'Accept the alliance', effects: '+50 relations, alliance formed', reward: { gold: 100 } }, { id: 'rc15', text: 'Decline politely', effects: '-10 relations' }] },
  { id: 'rand_7', title: 'Bandit Raids', description: 'Bandits have been raiding trade caravans along your roads. Merchants demand protection.', type: 'military', choices: [{ id: 'rc16', text: 'Send soldiers to patrol', effects: '+Gold/turn, costs military', cost: { military: 40 }, reward: { gold: 80 } }, { id: 'rc17', text: 'Hire mercenaries', effects: 'Quick solution, costly', cost: { gold: 200 } }, { id: 'rc18', text: 'Ignore the problem', effects: '-5 Gold/turn' }] },
  { id: 'rand_8', title: 'Heir\'s Education', description: 'Your heir has shown aptitude for learning. A renowned scholar offers to be their tutor.', type: 'personal', choices: [{ id: 'rc19', text: 'Accept the scholar', effects: 'Heir gains +2 Learning', cost: { gold: 150 } }, { id: 'rc20', text: 'Train in martial arts instead', effects: 'Heir gains +2 Martial', cost: { gold: 100 } }, { id: 'rc21', text: 'Focus on statecraft', effects: 'Heir gains +2 Stewardship', cost: { gold: 120 } }] },
  { id: 'rand_9', title: 'Famine Threat', description: 'A drought threatens your farmlands. Without action, starvation will follow.', type: 'economic', choices: [{ id: 'rc22', text: 'Import food from abroad', effects: 'Prevents famine', cost: { gold: 300 } }, { id: 'rc23', text: 'Ration supplies', effects: '-2000 population, saves gold', cost: { food: 100 } }, { id: 'rc24', text: 'Pray for rain', effects: '50% chance of relief', cost: { faith: 50 } }] },
  { id: 'rand_10', title: 'Court Intrigue', description: 'Your spymaster uncovers a plot against you. One of your councilors may be disloyal.', type: 'political', choices: [{ id: 'rc25', text: 'Arrest the conspirators', effects: '+Stability, risk of unrest', cost: { gold: 50 } }, { id: 'rc26', text: 'Observe silently', effects: '+Intrigue information' }, { id: 'rc27', text: 'Bribe them to loyalty', effects: 'Peace restored', cost: { gold: 200 } }] },
  { id: 'rand_11', title: 'Foreign Scholars', description: 'Scholars from a distant land offer to share their knowledge in exchange for patronage.', type: 'personal', choices: [{ id: 'rc28', text: 'Welcome them', effects: '+2 Learning for ruler', cost: { gold: 200 }, reward: { faith: 20 } }, { id: 'rc29', text: 'Reject the foreigners', effects: 'No cost, potential lost opportunity' }] },
  { id: 'rand_12', title: 'Trade Embargo', description: 'A rival kingdom has imposed a trade embargo on your merchants.', type: 'economic', choices: [{ id: 'rc30', text: 'Find alternative routes', effects: '-50 Gold short-term, long-term gain', cost: { gold: 150 } }, { id: 'rc31', text: 'Threaten retaliation', effects: '-20 relations, may lift embargo' }, { id: 'rc32', text: 'Smuggle goods', effects: '+100 Gold, risk of scandal', cost: { gold: 50 }, reward: { gold: 100 } }] },
];

export const HEIR_NAMES = [
  'Prince Edric', 'Prince Alaric', 'Princess Isolde', 'Prince Theodric',
  'Princess Rowena', 'Prince Gareth', 'Princess Elaine', 'Prince Osric',
  'Princess Morrigan', 'Prince Cedric', 'Prince Valerius', 'Princess Astrid',
];

export const COMMANDER_NAMES = [
  'Lord Cedric', 'Sir Marcus', 'Lady Brenna', 'Captain Finn',
  'Marshal Hector', 'Knight-Commander Sera', 'Lord Tybalt', 'Sir Gareth',
  'Dame Cassandra', 'General Aldous', 'Captain Rhea', 'Lord Blackwood',
];

export const AI_BUILDING_POOL: BuildingBlueprint[] = [
  { id: 'ai_barracks', name: 'Barracks', maxLevel: 10, description: 'Train soldiers', baseCost: 200, production: { militaryPerTurn: 2 }, icon: '⚔️' },
  { id: 'ai_market', name: 'Marketplace', maxLevel: 10, description: 'Trade hub', baseCost: 180, production: { goldPerTurn: 3 }, icon: '🏪' },
  { id: 'ai_farm', name: 'Farmstead', maxLevel: 10, description: 'Food production', baseCost: 120, production: { foodPerTurn: 3 }, icon: '🌻' },
  { id: 'ai_walls', name: 'Stone Walls', maxLevel: 10, description: 'Fortification', baseCost: 250, production: { militaryPerTurn: 1 }, icon: '🧱' },
  { id: 'ai_temple', name: 'Temple', maxLevel: 10, description: 'Place of worship', baseCost: 160, production: { faithPerTurn: 2 }, icon: '🕯️' },
  { id: 'ai_mine', name: 'Mine', maxLevel: 10, description: 'Gold extraction', baseCost: 220, production: { goldPerTurn: 4 }, icon: '⛏️' },
];

export const SPY_MISSIONS: SpyMission[] = [
  { id: 'spy_steal_gold', name: 'Steal Treasury', description: 'Infiltrate enemy vaults and steal gold from their treasury.', icon: '💰', cost: 150, turnsToComplete: 3, successChance: 60, targetType: 'kingdom', effects: '+200-400 Gold stolen' },
  { id: 'spy_sabotage', name: 'Sabotage Defenses', description: 'Weaken fortifications in an enemy province before an assault.', icon: '🔥', cost: 200, turnsToComplete: 2, successChance: 55, targetType: 'province', effects: '-50% garrison in target province' },
  { id: 'spy_assassinate', name: 'Assassination Attempt', description: 'Send an assassin to target the enemy ruler. Extremely risky.', icon: '🗡️', cost: 400, turnsToComplete: 4, successChance: 25, targetType: 'kingdom', effects: 'Enemy ruler loses health, kingdom weakened' },
  { id: 'spy_incite_revolt', name: 'Incite Revolt', description: 'Spread propaganda to cause unrest in an enemy province.', icon: '📢', cost: 250, turnsToComplete: 3, successChance: 50, targetType: 'province', effects: 'Province loyalty drops, possible revolt' },
  { id: 'spy_intelligence', name: 'Gather Intelligence', description: 'Learn details about enemy army positions and strength.', icon: '🔍', cost: 100, turnsToComplete: 2, successChance: 80, targetType: 'kingdom', effects: 'Reveal army details for 5 turns' },
  { id: 'spy_counter', name: 'Counter-Espionage', description: 'Root out enemy spies in your own court.', icon: '🛡️', cost: 120, turnsToComplete: 2, successChance: 70, targetType: 'kingdom', effects: 'Block enemy spy actions for 5 turns' },
];

export const FAITH_ACTIONS: FaithAction[] = [
  { id: 'faith_bless_army', name: 'Bless the Armies', description: 'Holy blessings boost your soldiers\' morale and fighting spirit.', icon: '✨', faithCost: 50, effects: '+20 morale to all armies', cooldown: 3 },
  { id: 'faith_holy_war', name: 'Declare Holy War', description: 'Call a holy war against an infidel kingdom. Your troops fight with zealous fervor.', icon: '⚔️', faithCost: 100, effects: '+30% attack for 5 turns', cooldown: 10 },
  { id: 'faith_heal_ruler', name: 'Divine Healing', description: 'Pray for divine intervention to restore your ruler\'s health.', icon: '💚', faithCost: 60, effects: '+25 ruler health', cooldown: 5 },
  { id: 'faith_consecrate', name: 'Consecrate Province', description: 'Bless a province to increase loyalty and reduce unrest.', icon: '🕯️', faithCost: 40, effects: '+30 loyalty in all provinces', cooldown: 4 },
  { id: 'faith_pilgrimage', name: 'Royal Pilgrimage', description: 'The ruler undertakes a holy pilgrimage, gaining wisdom and renown.', icon: '🛤️', faithCost: 80, effects: '+2 Learning, +1 Diplomacy', cooldown: 8 },
  { id: 'faith_tithe', name: 'Collect Tithes', description: 'Demand tithes from the faithful to fill your coffers.', icon: '💰', faithCost: 20, effects: '+200 Gold from faithful subjects', cooldown: 3 },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach_first_blood', name: 'First Blood', description: 'Win your first battle', icon: '⚔️', category: 'military', condition: 'battles_won_1', unlocked: false },
  { id: 'ach_conqueror', name: 'Conqueror', description: 'Conquer 5 provinces', icon: '🏴', category: 'expansion', condition: 'provinces_10', unlocked: false },
  { id: 'ach_empire', name: 'Empire Builder', description: 'Control 15 provinces', icon: '👑', category: 'expansion', condition: 'provinces_15', unlocked: false },
  { id: 'ach_warlord', name: 'Warlord', description: 'Win 10 battles', icon: '🗡️', category: 'military', condition: 'battles_won_10', unlocked: false },
  { id: 'ach_rich', name: 'Golden Crown', description: 'Accumulate 2000 gold', icon: '💰', category: 'economy', condition: 'gold_2000', unlocked: false },
  { id: 'ach_diplomat', name: 'Master Diplomat', description: 'Form 2 alliances', icon: '🤝', category: 'diplomacy', condition: 'alliances_2', unlocked: false },
  { id: 'ach_survivor', name: 'Survivor', description: 'Survive 50 turns', icon: '🛡️', category: 'survival', condition: 'turns_50', unlocked: false },
  { id: 'ach_century', name: 'Century Reign', description: 'Survive 100 turns', icon: '⏳', category: 'survival', condition: 'turns_100', unlocked: false },
  { id: 'ach_tech', name: 'Enlightened', description: 'Research all technologies', icon: '📚', category: 'economy', condition: 'all_tech', unlocked: false },
  { id: 'ach_army', name: 'Grand Army', description: 'Have 3000+ total troops', icon: '🏟️', category: 'military', condition: 'troops_3000', unlocked: false },
  { id: 'ach_spy', name: 'Shadowmaster', description: 'Complete 5 spy missions', icon: '🕵️', category: 'diplomacy', condition: 'spy_5', unlocked: false },
  { id: 'ach_faith', name: 'Chosen of the Gods', description: 'Accumulate 500 faith', icon: '🙏', category: 'survival', condition: 'faith_500', unlocked: false },
  { id: 'ach_builder', name: 'Master Builder', description: 'Construct 10 buildings', icon: '🏗️', category: 'economy', condition: 'buildings_10', unlocked: false },
  { id: 'ach_succession', name: 'The Dynasty Continues', description: 'Survive a ruler death and succession', icon: '👶', category: 'survival', condition: 'succession_1', unlocked: false },
  { id: 'ach_trader', name: 'Trade Magnate', description: 'Have 3 active trade deals', icon: '🚢', category: 'economy', condition: 'trades_3', unlocked: false },
];

export const SPOUSE_NAMES = [
  'Lady Seraphina', 'Lady Constance', 'Lady Morgana', 'Lady Beatrice',
  'Lady Evangeline', 'Princess Celeste', 'Lady Rosalind', 'Lady Vivienne',
  'Lord Darian', 'Lord Edmund', 'Prince Lucian', 'Lord Theron',
  'Lady Alessandra', 'Lady Isadora', 'Lord Maximilian', 'Lady Helena',
];

export const MARRIAGE_CANDIDATES = [
  { name: 'Lady Seraphina of Solaris', kingdom: 'solarian', diplomacyBonus: 3, goldBonus: 50, description: 'A charming diplomat with connections to Solarian trade.' },
  { name: 'Lady Constance of Ironhold', kingdom: 'ironforge', stewardshipBonus: 2, goldBonus: 30, description: 'A shrewd administrator known for her financial acumen.' },
  { name: 'Princess Celeste of Nordheim', kingdom: 'nordheim', martialBonus: 2, militaryBonus: 50, description: 'A fierce shield-maiden respected by warriors.' },
  { name: 'Lady Vivienne of Emerald Court', kingdom: 'emeraldleague', learningBonus: 3, faithBonus: 20, description: 'A scholar and patron of the arts.' },
  { name: 'Lady Morgana of the Wildlands', kingdom: 'crimsonhorde', intrigueBonus: 3, militaryBonus: 30, description: 'A cunning woman with ties to shadowy networks.' },
];

export const AI_PERSONALITY_PROFILES: Record<AIPersonality, AIPersonalityProfile> = {
  expansionist: {
    type: 'expansionist',
    warLikelihood: 0.8,
    allianceLikelihood: 0.2,
    tradePriority: 0.3,
    buildPreference: 'military',
    techPreference: 'military',
    diplomacyResponseModifier: -15,
    expansionAggression: 0.9,
    spyActivity: 0.4,
  },
  diplomatic: {
    type: 'diplomatic',
    warLikelihood: 0.15,
    allianceLikelihood: 0.85,
    tradePriority: 0.7,
    buildPreference: 'economy',
    techPreference: 'governance',
    diplomacyResponseModifier: 25,
    expansionAggression: 0.2,
    spyActivity: 0.2,
  },
  religious: {
    type: 'religious',
    warLikelihood: 0.45,
    allianceLikelihood: 0.5,
    tradePriority: 0.4,
    buildPreference: 'faith',
    techPreference: 'culture',
    diplomacyResponseModifier: 10,
    expansionAggression: 0.5,
    spyActivity: 0.3,
  },
  trade_focused: {
    type: 'trade_focused',
    warLikelihood: 0.1,
    allianceLikelihood: 0.7,
    tradePriority: 0.95,
    buildPreference: 'economy',
    techPreference: 'economy',
    diplomacyResponseModifier: 20,
    expansionAggression: 0.15,
    spyActivity: 0.25,
  },
  espionage_focused: {
    type: 'espionage_focused',
    warLikelihood: 0.35,
    allianceLikelihood: 0.4,
    tradePriority: 0.5,
    buildPreference: 'balanced',
    techPreference: 'governance',
    diplomacyResponseModifier: -5,
    expansionAggression: 0.5,
    spyActivity: 0.9,
  },
};

export const DEFAULT_KINGDOM_PERSONALITIES: Record<string, AIPersonality> = {
  valkorian: 'expansionist',
  solarian: 'trade_focused',
  nordheim: 'religious',
  crimsonhorde: 'expansionist',
  emeraldleague: 'diplomatic',
  ironforge: 'diplomatic',
};

export const PERSONALITY_RUMORS: Record<AIPersonality, string[]> = {
  expansionist: [
    'Their generals are seen studying maps of neighboring lands.',
    'Massive troop recruitments have been reported near the border.',
    'Their ruler speaks openly of manifest destiny.',
    'War banners are being sewn in great quantities.',
    'Foreign envoys are turned away at their gates.',
  ],
  diplomatic: [
    'Their court hosts lavish feasts for foreign dignitaries.',
    'Trade agreements are being drafted with multiple kingdoms.',
    'Their chancellor travels frequently to foreign courts.',
    'They maintain embassies in every known capital.',
    'Their ruler prefers the pen over the sword.',
  ],
  religious: [
    'Grand temples are rising across their lands.',
    'Holy processions march through their cities daily.',
    'Their ruler consults with priests before every decision.',
    'Pilgrims flock to their sacred sites from distant lands.',
    'They speak of a divine mandate to rule.',
  ],
  trade_focused: [
    'Merchant caravans flow endlessly through their roads.',
    'Their markets overflow with exotic foreign goods.',
    'Gold seems to matter more than glory in their court.',
    'Their treasury grows fatter with each passing season.',
    'They invest heavily in roads and trade infrastructure.',
  ],
  espionage_focused: [
    'Shadowy figures have been spotted near your court.',
    'Their spymaster is said to know every secret in the realm.',
    'Mysterious disappearances occur around their enemies.',
    'They maintain a vast network of informants and agents.',
    'No secret is safe from their watchful eyes.',
  ],
};

export const PERSONALITY_LABELS: Record<AIPersonality, { name: string; icon: string; color: string }> = {
  expansionist: { name: 'Expansionist', icon: '⚔️', color: '#ff4444' },
  diplomatic: { name: 'Diplomatic', icon: '🤝', color: '#58a6ff' },
  religious: { name: 'Zealous', icon: '🙏', color: '#d4a574' },
  trade_focused: { name: 'Mercantile', icon: '💰', color: '#e8b94a' },
  espionage_focused: { name: 'Shadowy', icon: '🕵️', color: '#8b5cf6' },
};

export interface RumorTemplate {
  description: string;
  category: RumorCategory;
  trueChance: number;
}

export const RUMOR_TEMPLATES: Record<string, RumorTemplate[]> = {
  war: [
    { description: '{kingdom} is massing troops near {border}.', category: 'war', trueChance: 0.7 },
    { description: '{kingdom} generals have been seen studying maps of your lands.', category: 'war', trueChance: 0.5 },
    { description: 'War banners fly over the camps of {kingdom}.', category: 'war', trueChance: 0.65 },
    { description: '{kingdom} has recalled all border patrols — something is brewing.', category: 'war', trueChance: 0.6 },
    { description: 'Mercenaries are flocking to {kingdom}\'s banner in great numbers.', category: 'war', trueChance: 0.55 },
    { description: '{kingdom} forges are working day and night on new weapons.', category: 'war', trueChance: 0.45 },
    { description: 'A {kingdom} deserter claims their armies march within the fortnight.', category: 'war', trueChance: 0.4 },
    { description: '{kingdom} has been stockpiling siege equipment near {border}.', category: 'war', trueChance: 0.6 },
  ],
  economy: [
    { description: 'Whispers say {kingdom}\'s treasury is nearly empty.', category: 'economy', trueChance: 0.5 },
    { description: '{kingdom}\'s merchants are hoarding grain — a famine may be near.', category: 'economy', trueChance: 0.45 },
    { description: 'Gold flows freely in {kingdom} — their coffers overflow.', category: 'economy', trueChance: 0.55 },
    { description: '{kingdom} has imposed new taxes, angering their populace.', category: 'economy', trueChance: 0.6 },
    { description: 'Trade caravans from {kingdom} have stopped arriving at the border.', category: 'economy', trueChance: 0.5 },
    { description: '{kingdom} mines have struck a rich new vein of gold.', category: 'economy', trueChance: 0.35 },
    { description: 'Counterfeit coins bearing {kingdom}\'s seal flood the markets.', category: 'economy', trueChance: 0.4 },
  ],
  politics: [
    { description: 'A conspiracy brews within the {kingdom} court.', category: 'politics', trueChance: 0.55 },
    { description: '{kingdom}\'s nobles grow restless — succession talk fills the halls.', category: 'politics', trueChance: 0.5 },
    { description: 'The ruler of {kingdom} has fallen gravely ill.', category: 'politics', trueChance: 0.4 },
    { description: 'A powerful lord in {kingdom} seeks to defect to your realm.', category: 'politics', trueChance: 0.3 },
    { description: '{kingdom}\'s council is divided — a rift grows between advisors.', category: 'politics', trueChance: 0.6 },
    { description: 'Peasant unrest simmers in the provinces of {kingdom}.', category: 'politics', trueChance: 0.55 },
    { description: '{kingdom}\'s heir has been disinherited in favor of a younger sibling.', category: 'politics', trueChance: 0.35 },
  ],
  espionage: [
    { description: 'Shadowy agents from {kingdom} have been spotted near your borders.', category: 'espionage', trueChance: 0.6 },
    { description: '{kingdom}\'s spymaster has placed informants in every court.', category: 'espionage', trueChance: 0.5 },
    { description: 'A double agent offers secrets of {kingdom} for a price.', category: 'espionage', trueChance: 0.45 },
    { description: '{kingdom} intercepted a message meant for your spymaster.', category: 'espionage', trueChance: 0.4 },
    { description: 'Mysterious fires in {kingdom}\'s archives — someone is covering tracks.', category: 'espionage', trueChance: 0.5 },
  ],
  diplomacy: [
    { description: '{kingdom} seeks a secret alliance with another power against you.', category: 'diplomacy', trueChance: 0.5 },
    { description: 'Envoys from {kingdom} have been visiting every capital except yours.', category: 'diplomacy', trueChance: 0.55 },
    { description: '{kingdom} is open to a marriage pact to strengthen ties.', category: 'diplomacy', trueChance: 0.45 },
    { description: 'A border treaty between {kingdom} and a neighbor is about to collapse.', category: 'diplomacy', trueChance: 0.5 },
    { description: '{kingdom} has secretly offered tribute to avoid conflict.', category: 'diplomacy', trueChance: 0.35 },
    { description: '{kingdom}\'s ruler speaks of eternal peace — but their armies say otherwise.', category: 'diplomacy', trueChance: 0.6 },
  ],
};

export const RUMOR_CATEGORY_ICONS: Record<RumorCategory, string> = {
  war: '⚔️',
  economy: '💰',
  politics: '👑',
  espionage: '🕵️',
  diplomacy: '🤝',
};

export const TRADE_TEMPLATES = [
  { give: { gold: 100 }, receive: { food: 80 }, label: 'Buy Food' },
  { give: { gold: 150 }, receive: { military: 60 }, label: 'Buy Arms' },
  { give: { food: 80 }, receive: { gold: 100 }, label: 'Sell Food' },
  { give: { gold: 200 }, receive: { faith: 40 }, label: 'Buy Relics' },
  { give: { military: 50 }, receive: { gold: 120 }, label: 'Sell Mercenaries' },
];
