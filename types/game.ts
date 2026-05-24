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
  legacyTitles?: LegacyTitle[];
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

export type HeirPath = 'warrior' | 'scholar' | 'diplomat';

export type LegacyTitle = 
  | 'The Conqueror'
  | 'The Wise'
  | 'The Cruel'
  | 'The Diplomat'
  | 'The Pious'
  | 'The Builder'
  | 'The Wealthy'
  | 'The Survivor'
  | 'The Beloved'
  | 'The Feared';

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
  path?: HeirPath;
  comingOfAgeTriggered?: boolean;
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
  baseGoldPerTurn?: number;
  baseFoodPerTurn?: number;
  baseMilitaryPerTurn?: number;
  baseFaithPerTurn?: number;
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
  marchPath?: string[];
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
  marriageProposal?: {
    proposedTurn: number;
  };
  isVassal?: boolean;
  diplomaticHook?: {
    type: 'rejected_call_to_war' | 'intercepted_correspondence' | 'bribed_councillor';
    turn: number;
    description: string;
  };
}

export type VictoryTitle = 
  | 'Glorious Victory'
  | 'Against All Odds'
  | 'Decisive Victory'
  | 'Hard-Won Victory'
  | 'Pyrrhic Victory'
  | 'Devastating Rout'
  | 'Crushing Defeat'
  | 'Narrow Defeat'
  | 'Tactical Retreat';

export interface BattleCommander {
  name: string;
  role: string;
  contribution: string;
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
  narrative?: string;
  victoryTitle?: VictoryTitle;
  attackerCommander?: BattleCommander;
  defenderCommander?: BattleCommander;
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
  type: 'political' | 'military' | 'religious' | 'economic' | 'personal' | 'dynasty' | 'seasonal';
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

export type RumorCategory = 'war' | 'economy' | 'politics' | 'espionage' | 'diplomacy';

export interface Rumor {
  id: string;
  kingdomId: string;
  kingdomName: string;
  description: string;
  category: RumorCategory;
  accuracy: number;
  isTrue: boolean;
  turn: number;
  investigated: boolean;
  fromSpy: boolean;
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
  rumorsHeard: string[];
  breakdown?: {
    base: { gold: number; food: number; military: number; faith: number };
    season: { gold: number; food: number; military: number };
    trade: number;
    tech: { gold: number; food: number; military: number; faith: number };
    council: { gold: number; food: number; military: number; faith: number };
    diff: { gold: number; food: number; military: number; faith: number };
    pressure: { gold: number; food: number; military: number };
    vassal?: number;
  };
}

export interface KingdomPressures {
  corruption: number;
  overstretch: number;
  famine: number;
  plague: PlagueState;
  nobleDisputes: NobleDispute[];
  warExhaustion: number;
}

export interface PlagueState {
  active: boolean;
  severity: number;
  infectedProvinces: string[];
  turnStarted: number;
  contained: boolean;
}

export interface NobleDispute {
  id: string;
  nobleName: string;
  demand: string;
  province: string;
  turnCreated: number;
  resolved: boolean;
  loyaltyPenalty: number;
}

export interface ReignEvent {
  turn: number;
  year: number;
  description: string;
  type: 'military' | 'diplomacy' | 'economy' | 'dynasty' | 'religion' | 'conquest';
}

export interface ReignChronicle {
  rulerId: string;
  rulerName: string;
  dynasty: string;
  legacyTitle: string;
  startYear: number;
  endYear: number;
  startTurn: number;
  endTurn: number;
  yearsRuled: number;
  warsFought: number;
  battlesWon: number;
  battlesLost: number;
  provincesConquered: number;
  provincesLost: number;
  buildingsConstructed: number;
  technologiesResearched: number;
  peakProvinces: number;
  peakGold: number;
  traits: Trait[];
  legacyTitles: LegacyTitle[];
  narrative: string;
  keyEvents: ReignEvent[];
  causeOfDeath: string;
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
  rumors: Rumor[];
  pressures: KingdomPressures;
  reignChronicles: ReignChronicle[];
  rulerStartTurn?: number;
  rulerStartYear?: number;
  rulerPeakProvinces?: number;
  rulerPeakGold?: number;
  rulerBuildingsConstructed?: number;
  rulerTechResearched?: number;
  rulerWarsFought?: number;
  rulerBattlesWon?: number;
  rulerBattlesLost?: number;
  rulerProvincesConquered?: number;
  rulerProvincesLost?: number;
  latestReignChronicle?: ReignChronicle;
  pendingChainEvents?: PendingChainEvent[];
  unlockedBlueprints: string[];
  rulerTitle?: string;
  rulerGender?: 'male' | 'female';
  isCustomKingdom?: boolean;
  dailyQuests?: DailyQuest[];
  lastQuestDate?: string;
  vassalOfferPending?: { overlordId: string; capitalProvinceId: string };
  isPlayerVassal?: boolean;
  playerOverlordId?: string;
}

export interface PendingChainEvent {
  eventId: string;
  triggerTurn: number;
}

export type DailyQuestType =
  | 'end_turns'
  | 'collect_gold'
  | 'win_battle'
  | 'build'
  | 'recruit'
  | 'gain_faith';

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: DailyQuestType;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward: { gold?: number; military?: number; faith?: number; food?: number };
}
