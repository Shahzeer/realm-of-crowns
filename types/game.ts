export interface Trait {
  id: string;
  name: string;
  icon: string;
  effect: string;
  modifier: Record<string, number>;
}

export interface StatUpgrade {
  stat: 'diplomacy' | 'martial' | 'stewardship' | 'intrigue' | 'learning';
  turnsRemaining: number;
  totalTurns: number;
}

export interface CouncilorUpgrade {
  councilorId: string;
  turnsRemaining: number;
  totalTurns: number;
}

export interface CombatTactic {
  id: string;
  name: string;
  description: string;
  icon: string;
  attackModifier: number;
  defenseModifier: number;
  moraleModifier: number;
  casualtyModifier: number;
}

export interface Ruler {
  id: string;
  name: string;
  dynasty: string;
  age: number;
  health: number;
  maxHealth: number;
  diplomacy: number;
  martial: number;
  stewardship: number;
  intrigue: number;
  learning: number;
  traits: Trait[];
  avatar: string;
  activeUpgrade?: StatUpgrade;
  spouse?: string;
  spouseBonuses?: {
    diplomacy?: number;
    martial?: number;
    stewardship?: number;
    intrigue?: number;
    learning?: number;
    goldPerTurn?: number;
    militaryPerTurn?: number;
    faithPerTurn?: number;
  };
}

export interface HeirEducation {
  stat: 'diplomacy' | 'martial' | 'stewardship' | 'intrigue' | 'learning';
  turnsRemaining: number;
  totalTurns: number;
  bonus: number;
}

export interface Heir {
  id: string;
  name: string;
  age: number;
  diplomacy: number;
  martial: number;
  stewardship: number;
  intrigue: number;
  learning: number;
  traits: Trait[];
  claimStrength: number;
  activeEducation?: HeirEducation;
}

export interface Resources {
  gold: number;
  food: number;
  military: number;
  faith: number;
  goldPerTurn: number;
  foodPerTurn: number;
  militaryPerTurn: number;
  faithPerTurn: number;
}

export interface Building {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  cost: Partial<Resources>;
  production: Partial<Resources>;
  icon: string;
}

export interface BuildingBlueprint {
  id: string;
  name: string;
  maxLevel: number;
  description: string;
  baseCost: number;
  production: Partial<Resources>;
  icon: string;
  requiredType?: string[];
}

export interface Province {
  id: string;
  name: string;
  type: 'capital' | 'city' | 'castle' | 'temple' | 'farmland' | 'forest' | 'mountain';
  owner: string;
  population: number;
  development: number;
  buildings: Building[];
  garrison: number;
  color: string;
  x: number;
  y: number;
  connectedTo: string[];
  underSiege?: boolean;
  siegeProgress?: number;
  siegeAttacker?: string;
  loyalty?: number;
  unrest?: number;
}

export interface Army {
  id: string;
  name: string;
  owner: string;
  troops: number;
  maxTroops: number;
  morale: number;
  commander: string;
  location: string;
  status: 'idle' | 'marching' | 'sieging' | 'fighting' | 'retreating';
  destination?: string;
  marchTurnsLeft?: number;
  tactic?: string;
}

export type AIPersonality = 'expansionist' | 'diplomatic' | 'religious' | 'trade_focused' | 'espionage_focused';

export interface AIPersonalityProfile {
  type: AIPersonality;
  warLikelihood: number;
  allianceLikelihood: number;
  tradePriority: number;
  buildPreference: 'military' | 'economy' | 'faith' | 'balanced';
  techPreference: 'military' | 'economy' | 'culture' | 'governance';
  diplomacyResponseModifier: number;
  expansionAggression: number;
  spyActivity: number;
}

export interface KingdomIntel {
  personalityGuesses: AIPersonality[];
  confidence: number;
  rumors: string[];
  lastUpdatedTurn: number;
}

export interface Kingdom {
  id: string;
  name: string;
  ruler: Ruler;
  provinces: string[];
  relation: number;
  attitude: 'friendly' | 'neutral' | 'hostile' | 'allied' | 'war';
  color: string;
  strength: number;
  armies: Army[];
  treasury: number;
  crest: string;
  description: string;
  tradeOpen?: boolean;
  warScore?: number;
  allyOf?: string[];
  personality?: AIPersonality;
  intel?: KingdomIntel;
}

export interface BattleResult {
  id: string;
  turn: number;
  attackerName: string;
  defenderName: string;
  attackerTroops: number;
  defenderTroops: number;
  attackerLosses: number;
  defenderLosses: number;
  winner: 'attacker' | 'defender';
  provinceName: string;
  provinceId: string;
  conquered: boolean;
  tacticUsed?: string;
}

export interface Technology {
  id: string;
  name: string;
  description: string;
  category: 'military' | 'economy' | 'culture' | 'governance';
  cost: number;
  turnsToResearch: number;
  turnsRemaining: number;
  researched: boolean;
  researching: boolean;
  effects: Record<string, number>;
  icon: string;
  requires?: string[];
}

export interface Councilor {
  id: string;
  name: string;
  role: 'marshal' | 'steward' | 'spymaster' | 'chaplain' | 'chancellor';
  skill: number;
  loyalty: number;
  trait: Trait;
  task?: string;
  avatar: string;
  activeUpgrade?: CouncilorUpgrade;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: 'political' | 'military' | 'religious' | 'economic' | 'personal' | 'dynasty';
  choices: EventChoice[];
  turn: number;
  seen: boolean;
  chainId?: string;
  chainStep?: number;
  isChainEvent?: boolean;
}

export interface EventChoice {
  id: string;
  text: string;
  effects: string;
  cost?: Partial<Resources>;
  reward?: Partial<Resources>;
  followUpEventId?: string;
  followUpDelay?: number;
}

export interface KingdomChoice {
  id: string;
  name: string;
  dynasty: string;
  description: string;
  color: string;
  crest: string;
  ruler: Ruler;
  difficulty: 'easy' | 'medium' | 'hard';
  startingProvinces: string[];
  bonuses: string;
}

export interface SpyMission {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  turnsToComplete: number;
  successChance: number;
  targetType: 'kingdom' | 'province';
  effects: string;
}

export interface ActiveSpyMission {
  missionId: string;
  targetId: string;
  turnsRemaining: number;
  totalTurns: number;
}

export interface TradeOffer {
  id: string;
  kingdomId: string;
  give: Partial<Resources>;
  receive: Partial<Resources>;
  duration: number;
  turnsRemaining?: number;
}

export interface ActiveTrade {
  id: string;
  kingdomId: string;
  kingdomName: string;
  give: Partial<Resources>;
  receive: Partial<Resources>;
  turnsRemaining: number;
}

export interface FaithAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  faithCost: number;
  effects: string;
  cooldown: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'military' | 'economy' | 'diplomacy' | 'expansion' | 'survival';
  condition: string;
  unlocked: boolean;
  unlockedTurn?: number;
}

export interface TurnSummary {
  turn: number;
  year: number;
  season: string;
  goldGained: number;
  foodGained: number;
  militaryGained: number;
  faithGained: number;
  provincesConquered: string[];
  provincesLost: string[];
  battlesWon: number;
  battlesLost: number;
  eventsTriggered: string[];
  techCompleted?: string;
  aiActions: string[];
  revolts: string[];
  tradeIncome: number;
  spyResults: string[];
}

export interface GameState {
  turn: number;
  year: number;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  ruler: Ruler;
  heir: Heir | null;
  resources: Resources;
  provinces: Province[];
  armies: Army[];
  kingdoms: Kingdom[];
  events: GameEvent[];
  battles: BattleResult[];
  technologies: Technology[];
  council: Councilor[];
  log: string[];
  gameOver: boolean;
  gameOverReason?: string;
  victory: boolean;
  victoryType?: string;
  selectedKingdom?: string;
  gameStarted: boolean;
  activeTactic: string;
  activeTrades: ActiveTrade[];
  activeSpyMission?: ActiveSpyMission;
  achievements: Achievement[];
  lastTurnSummary?: TurnSummary;
  faithCooldowns: Record<string, number>;
  tutorialSeen: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}
