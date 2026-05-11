import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

import { computeVisibility, VisibilityMap } from '@/utils/fogOfWar';
import {
  GameState,
  Resources,
  Province,
  Army,
  Kingdom,
  GameEvent,
  EventChoice,
  BattleResult,
  Heir,
  HeirEducation,
  HeirPath,
  LegacyTitle,
  Building,
  StatUpgrade,
  CombatTactic,
  KingdomChoice,
  ActiveTrade,
  ActiveSpyMission,
  TurnSummary,
  Achievement,
  AIPersonality,
  Rumor,
  KingdomPressures,
  NobleDispute,
  Councilor,
  ReignChronicle,
  ReignEvent,
  PendingChainEvent,
} from '@/types/game';
import {
  INITIAL_RULER,
  INITIAL_HEIR,
  INITIAL_RESOURCES,
  INITIAL_PROVINCES,
  INITIAL_ARMIES,
  INITIAL_KINGDOMS,
  INITIAL_EVENTS,
  INITIAL_TECHNOLOGIES,
  INITIAL_COUNCIL,
  SEASONS,
  SEASON_EFFECTS,
  RANDOM_EVENTS,
  HEIR_NAMES,
  COMMANDER_NAMES,
  TRAITS,
  BUILDING_BLUEPRINTS,
  COMBAT_TACTICS,
  KINGDOM_CHOICES,
  AI_BUILDING_POOL,
  ALL_PROVINCES,
  SPY_MISSIONS,
  INITIAL_ACHIEVEMENTS,
  MARRIAGE_CANDIDATES,
  AI_PERSONALITY_PROFILES,
  DEFAULT_KINGDOM_PERSONALITIES,
  PERSONALITY_RUMORS,
  RUMOR_TEMPLATES,
  STARTER_BLUEPRINT_IDS,
  getUnlockedBlueprintIds,
} from '@/mocks/gameData';
import { getStandaloneNarrativeEvents, getFollowUpEvent } from '@/mocks/narrativeEvents';
import { enrichBattleResult } from '@/utils/battleNarrative';

const STORAGE_KEY = 'realm_of_crowns_save';
const CLOUD_SAVE_DEBOUNCE_MS = 2000;

function getEmptyPressures(): KingdomPressures {
  return {
    corruption: 0,
    overstretch: 0,
    famine: 0,
    plague: { active: false, severity: 0, infectedProvinces: [], turnStarted: 0, contained: false },
    nobleDisputes: [],
  };
}

function getBuildingBoosts(buildings: Building[]): Partial<Resources> {
  return buildings.reduce((acc, building) => {
    Object.entries(building.production).forEach(([key, value]) => {
      const resourceKey = key as keyof Resources;
      acc[resourceKey] = ((acc[resourceKey] ?? 0) + ((value ?? 0) * building.level)) as never;
    });
    return acc;
  }, {} as Partial<Resources>);
}

function formatResourceBoosts(boosts: Partial<Resources>): string {
  const labels: Record<keyof Resources, string> = {
    gold: 'gold', food: 'food', military: 'military', faith: 'faith',
    goldPerTurn: 'gold/turn', foodPerTurn: 'food/turn', militaryPerTurn: 'military/turn', faithPerTurn: 'faith/turn',
  };
  return (Object.entries(boosts) as Array<[keyof Resources, number]>)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `+${value} ${labels[key]}`)
    .join(', ');
}

function applyResourceBoosts(resources: Resources, boosts: Partial<Resources>): Resources {
  const next = { ...resources };
  (Object.entries(boosts) as Array<[keyof Resources, number]>).forEach(([key, value]) => {
    next[key] = ((next[key] ?? 0) + value) as never;
  });
  return next;
}

function claimProvinceForPlayer(province: Province): Province {
  return { ...province, owner: 'player', garrison: 50, underSiege: false, siegeProgress: 0, siegeAttacker: undefined, loyalty: province.owner === 'neutral' ? 55 : 30, unrest: province.owner === 'neutral' ? 15 : 40 };
}

const defaultState: GameState = {
  turn: 1,
  year: 1066,
  season: 'Spring',
  ruler: INITIAL_RULER,
  heir: INITIAL_HEIR,
  resources: INITIAL_RESOURCES,
  provinces: INITIAL_PROVINCES,
  armies: INITIAL_ARMIES,
  kingdoms: INITIAL_KINGDOMS,
  events: INITIAL_EVENTS,
  battles: [],
  technologies: INITIAL_TECHNOLOGIES,
  council: INITIAL_COUNCIL,
  log: ['Year 1066, Spring — Your reign begins.'],
  gameOver: false,
  victory: false,
  gameStarted: false,
  activeTactic: 'balanced',
  activeTrades: [],
  achievements: INITIAL_ACHIEVEMENTS,
  faithCooldowns: {},
  tutorialSeen: false,
  difficulty: 'normal',
  rumors: [],
  pressures: getEmptyPressures(),
  reignChronicles: [],
  rulerStartTurn: 1,
  rulerStartYear: 1066,
  rulerPeakProvinces: 0,
  rulerPeakGold: 0,
  rulerBuildingsConstructed: 0,
  rulerTechResearched: 0,
  rulerWarsFought: 0,
  rulerBattlesWon: 0,
  rulerBattlesLost: 0,
  rulerProvincesConquered: 0,
  rulerProvincesLost: 0,
  unlockedBlueprints: [...STARTER_BLUEPRINT_IDS],
};

const NOBLE_NAMES = [
  'Duke Aldhelm', 'Baron Rothgar', 'Count Edric', 'Lord Theron', 'Marquess Valdan',
  'Earl Brynden', 'Viscount Geralt', 'Lord Oswin', 'Baron Halsted', 'Duke Fenwick',
  'Count Alaric', 'Lord Stavros', 'Baron Isolde', 'Duke Marlowe', 'Earl Sigmund',
];

const NOBLE_DEMANDS = [
  'demands a seat on the council',
  'demands tax exemption for their lands',
  'demands command of the provincial garrison',
  'threatens to withhold military levies',
  'demands recognition of ancient land claims',
  'demands increased trade privileges',
  'threatens to support a rival claimant',
  'demands autonomy for their province',
];

function processKingdomPressures(
  pressures: KingdomPressures,
  provinces: Province[],
  resources: Resources,
  turn: number,
  council: Array<{ role: string; skill: number; loyalty: number; task?: string }>,
): {
  pressures: KingdomPressures;
  events: GameEvent[];
  logs: string[];
  resourcePenalties: Partial<Resources>;
  loyaltyPenalties: Record<string, number>;
} {
  const playerProvinces = provinces.filter(p => p.owner === 'player');
  const provCount = playerProvinces.length;
  const events: GameEvent[] = [];
  const logs: string[] = [];
  const resourcePenalties: Partial<Resources> = {};
  const loyaltyPenalties: Record<string, number> = {};

  let corruption = pressures.corruption;
  const corruptionGrowth = 0.5 + (provCount * 0.15);
  const steward = council.find(c => c.role === 'steward');
  const stewardReduction = steward && steward.task === 'fight_corruption' ? (steward.skill * 0.3) : 0;
  corruption = Math.max(0, Math.min(100, corruption + corruptionGrowth - stewardReduction));
  const goldPenalty = Math.floor(resources.goldPerTurn * (corruption / 200));
  if (goldPenalty > 0) {
    resourcePenalties.gold = -goldPenalty;
    if (corruption > 30) logs.push(`🏛️ Corruption costs ${goldPenalty}g this turn`);
  }

  let overstretch = 0;
  if (provCount > 10) {
    overstretch = Math.min(100, (provCount - 10) * 8);
    const upkeepPenalty = Math.floor((provCount - 10) * 15);
    resourcePenalties.gold = (resourcePenalties.gold ?? 0) - upkeepPenalty;
    if (overstretch > 0) logs.push(`⚠️ Empire overstretch! +${upkeepPenalty}g upkeep, loyalty penalties`);
    const loyaltyHit = Math.floor(overstretch / 10);
    playerProvinces.forEach(p => {
      if (p.type !== 'capital') loyaltyPenalties[p.id] = (loyaltyPenalties[p.id] ?? 0) - loyaltyHit;
    });
  }

  let famine = 0;
  if (resources.food <= 0) {
    famine = Math.min(100, 40 + Math.abs(resources.food));
  } else if (resources.food < 50) {
    famine = Math.floor((50 - resources.food) / 2);
  }
  if (famine > 20) {
    const unrestBonus = Math.floor(famine / 5);
    playerProvinces.forEach(p => {
      loyaltyPenalties[p.id] = (loyaltyPenalties[p.id] ?? 0) - unrestBonus;
    });
    logs.push(`🌾 Food shortages cause unrest across ${provCount} provinces`);
  }

  let plague = { ...pressures.plague };
  if (plague.active) {
    const chaplain = council.find(c => c.role === 'chaplain');
    const containChance = chaplain && chaplain.task === 'contain_plague' ? 0.15 + (chaplain.skill * 0.02) : 0.05;
    if (plague.contained || Math.random() < containChance) {
      plague.contained = true;
      plague.severity = Math.max(0, plague.severity - 10);
      if (plague.severity <= 0) {
        plague = { active: false, severity: 0, infectedProvinces: [], turnStarted: 0, contained: false };
        logs.push('💚 The plague has been eradicated!');
      } else {
        logs.push(`🩺 Plague contained, severity declining (${plague.severity}%)`);
      }
    } else {
      plague.severity = Math.min(100, plague.severity + 5);
      const spreadCandidates = playerProvinces.filter(p =>
        !plague.infectedProvinces.includes(p.id) &&
        p.connectedTo.some(c => plague.infectedProvinces.includes(c))
      );
      if (spreadCandidates.length > 0 && Math.random() < 0.4) {
        const victim = spreadCandidates[Math.floor(Math.random() * spreadCandidates.length)];
        plague.infectedProvinces = [...plague.infectedProvinces, victim.id];
        logs.push(`☠️ Plague spreads to ${victim.name}!`);
      }
      plague.infectedProvinces.forEach(pid => {
        loyaltyPenalties[pid] = (loyaltyPenalties[pid] ?? 0) - Math.floor(plague.severity / 8);
      });
      const popLoss = Math.floor(plague.severity * 2);
      logs.push(`☠️ Plague rages (${plague.severity}%), -${popLoss} pop in infected provinces`);
    }
  } else if (turn > 10 && Math.random() < 0.03) {
    const startProvince = playerProvinces[Math.floor(Math.random() * playerProvinces.length)];
    if (startProvince) {
      plague = {
        active: true,
        severity: 15 + Math.floor(Math.random() * 15),
        infectedProvinces: [startProvince.id],
        turnStarted: turn,
        contained: false,
      };
      logs.push(`☠️ Plague outbreak in ${startProvince.name}!`);
      events.push({
        id: `plague_outbreak_${turn}`,
        title: 'Plague Outbreak!',
        description: `A terrible plague has appeared in ${startProvince.name}! Disease spreads through the streets. You must act quickly to contain it before it spreads to neighboring provinces.`,
        type: 'economic',
        turn,
        seen: false,
        choices: [
          { id: `pq1_${turn}`, text: 'Quarantine immediately', effects: 'Contains plague, -100g', cost: { gold: 100 } },
          { id: `pq2_${turn}`, text: 'Pray for divine intervention', effects: 'Costs faith, may help', cost: { faith: 50 } },
          { id: `pq3_${turn}`, text: 'Ignore it', effects: 'Plague may spread unchecked' },
        ],
      });
    }
  }

  let nobleDisputes = pressures.nobleDisputes.filter(d => !d.resolved);
  if (nobleDisputes.length < 3 && provCount > 3 && Math.random() < 0.08) {
    const targetProvince = playerProvinces.filter(p => p.type !== 'capital')[Math.floor(Math.random() * Math.max(1, playerProvinces.length - 1))];
    if (targetProvince) {
      const nobleName = NOBLE_NAMES[Math.floor(Math.random() * NOBLE_NAMES.length)];
      const demand = NOBLE_DEMANDS[Math.floor(Math.random() * NOBLE_DEMANDS.length)];
      const dispute: NobleDispute = {
        id: `noble_${turn}_${Math.random().toString(36).slice(2, 6)}`,
        nobleName,
        demand,
        province: targetProvince.id,
        turnCreated: turn,
        resolved: false,
        loyaltyPenalty: 8 + Math.floor(Math.random() * 12),
      };
      nobleDisputes.push(dispute);
      logs.push(`👑 ${nobleName} of ${targetProvince.name} ${demand}`);
      events.push({
        id: `noble_dispute_${dispute.id}`,
        title: `Noble Demands: ${nobleName}`,
        description: `${nobleName}, a powerful noble in ${targetProvince.name}, ${demand}. Refusing may cause unrest, but conceding sets a dangerous precedent.`,
        type: 'political',
        turn,
        seen: false,
        choices: [
          { id: `nd_grant_${dispute.id}`, text: 'Grant their demands', effects: '+Loyalty, costs gold', cost: { gold: 150 }, reward: { food: 10 } },
          { id: `nd_refuse_${dispute.id}`, text: 'Refuse outright', effects: '-Loyalty in province' },
          { id: `nd_imprison_${dispute.id}`, text: 'Arrest the noble', effects: '-Loyalty but ends dispute', cost: { military: 30 } },
        ],
      });
    }
  }
  nobleDisputes.forEach(d => {
    if (!d.resolved && turn - d.turnCreated > 5) {
      loyaltyPenalties[d.province] = (loyaltyPenalties[d.province] ?? 0) - d.loyaltyPenalty;
    }
  });

  return {
    pressures: { corruption, overstretch, famine, plague, nobleDisputes },
    events,
    logs,
    resourcePenalties,
    loyaltyPenalties,
  };
}

const TRAIT_EVENT_MAP: Record<string, string[]> = {
  cruel: ['narr_trait_cruel_peasant_fear', 'narr_trait_cruel_torture_chamber'],
  genius: ['narr_trait_genius_research_breakthrough', 'narr_trait_genius_invention'],
  brave: ['narr_trait_brave_duel_challenge'],
  pious: ['narr_trait_pious_divine_vision'],
  ambitious: ['narr_trait_ambitious_power_play'],
  paranoid: ['narr_trait_paranoid_shadow_conspiracy'],
  charismatic: ['narr_trait_charismatic_grand_speech'],
  strong: ['narr_trait_strong_feats_of_strength'],
  cunning: ['narr_trait_cunning_blackmail'],
  greedy: ['narr_trait_greedy_hidden_treasure'],
};

const COUNCIL_BETRAYAL_MAP: Record<string, string> = {
  marshal: 'narr_council_betrayal_marshal',
  steward: 'narr_council_betrayal_steward',
  spymaster: 'narr_council_betrayal_spymaster',
  chaplain: 'narr_council_betrayal_chaplain',
  chancellor: 'narr_council_betrayal_chancellor',
};

function computeLegacyTitles(state: GameState): LegacyTitle[] {
  const titles: LegacyTitle[] = [];
  const playerProvCount = state.provinces.filter(p => p.owner === 'player').length;
  const battlesWon = state.battles.filter(b => b.conquered).length;
  const hasCruelTrait = state.ruler.traits.some(t => t.id === 'cruel');
  const hasGeniusTrait = state.ruler.traits.some(t => t.id === 'genius');
  const hasPiousTrait = state.ruler.traits.some(t => t.id === 'pious');
  const totalBuildings = state.provinces.filter(p => p.owner === 'player').reduce((s, p) => s + p.buildings.length, 0);
  const avgLoyalty = state.provinces.filter(p => p.owner === 'player').length > 0
    ? state.provinces.filter(p => p.owner === 'player').reduce((s, p) => s + (p.loyalty ?? 80), 0) / state.provinces.filter(p => p.owner === 'player').length
    : 0;

  if (battlesWon >= 5 && playerProvCount >= 10) titles.push('The Conqueror');
  if ((hasGeniusTrait || state.ruler.learning >= 18) && state.technologies.filter(t => t.researched).length >= 8) titles.push('The Wise');
  if (hasCruelTrait && battlesWon >= 3) titles.push('The Cruel');
  if (state.ruler.diplomacy >= 16 && state.kingdoms.filter(k => k.attitude === 'allied').length >= 2) titles.push('The Diplomat');
  if (hasPiousTrait && state.resources.faith >= 300) titles.push('The Pious');
  if (totalBuildings >= 15) titles.push('The Builder');
  if (state.resources.gold >= 3000) titles.push('The Wealthy');
  if (state.turn >= 80) titles.push('The Survivor');
  if (avgLoyalty >= 85 && playerProvCount >= 5) titles.push('The Beloved');
  if (hasCruelTrait && avgLoyalty < 40 && playerProvCount >= 8) titles.push('The Feared');

  return titles;
}

function generateReignNarrative(chronicle: Omit<ReignChronicle, 'narrative'>): string {
  const { rulerName, legacyTitle, yearsRuled, warsFought, battlesWon, provincesConquered, provincesLost, buildingsConstructed, technologiesResearched, peakProvinces, traits } = chronicle;
  const displayName = legacyTitle !== rulerName ? legacyTitle : rulerName;
  let narrative = `${displayName} ruled for ${yearsRuled} year${yearsRuled !== 1 ? 's' : ''}`;

  if (warsFought > 0) {
    narrative += `, fighting in ${warsFought} war${warsFought !== 1 ? 's' : ''}`;
    if (battlesWon > 0) narrative += ` and winning ${battlesWon} battle${battlesWon !== 1 ? 's' : ''}`;
    narrative += '.';
  } else {
    narrative += ' in relative peace.';
  }

  if (provincesConquered > 0) {
    narrative += ` Under their banner, ${provincesConquered} province${provincesConquered !== 1 ? 's were' : ' was'} conquered`;
    if (provincesLost > 0) narrative += `, though ${provincesLost} ${provincesLost !== 1 ? 'were' : 'was'} lost`;
    narrative += '.';
  } else if (provincesLost > 0) {
    narrative += ` Sadly, ${provincesLost} province${provincesLost !== 1 ? 's were' : ' was'} lost during this reign.`;
  }

  if (buildingsConstructed > 0) {
    narrative += ` ${buildingsConstructed} building${buildingsConstructed !== 1 ? 's were' : ' was'} erected across the realm.`;
  }
  if (technologiesResearched > 0) {
    narrative += ` ${technologiesResearched} technolog${technologiesResearched !== 1 ? 'ies were' : 'y was'} discovered by the realm's scholars.`;
  }
  if (peakProvinces >= 10) {
    narrative += ` At its zenith, the realm encompassed ${peakProvinces} provinces.`;
  }

  const traitNames = traits.map(t => t.name.toLowerCase());
  if (traitNames.includes('cruel')) {
    narrative += ' The people lived in fear of their sovereign\'s wrath.';
  } else if (traitNames.includes('genius')) {
    narrative += ' The court flourished with learning and invention.';
  } else if (traitNames.includes('pious')) {
    narrative += ' Faith was the cornerstone of this reign.';
  } else if (traitNames.includes('charismatic')) {
    narrative += ' The ruler\'s charm won hearts across the realm.';
  }

  return narrative;
}

function buildReignChronicle(
  prev: GameState,
  endTurn: number,
  endYear: number,
  causeOfDeath: string,
): ReignChronicle {
  const startTurn = prev.rulerStartTurn ?? 1;
  const startYear = prev.rulerStartYear ?? prev.year;
  const yearsRuled = endYear - startYear;
  const legacyTitles = prev.ruler.legacyTitles ?? computeLegacyTitles(prev);
  const primaryTitle = legacyTitles.length > 0 ? `${prev.ruler.name} ${legacyTitles[0]}` : prev.ruler.name;

  const keyEvents: ReignEvent[] = [];
  const logEntries = prev.log.slice().reverse();
  for (const entry of logEntries) {
    if (keyEvents.length >= 5) break;
    let evtType: ReignEvent['type'] = 'dynasty';
    if (entry.includes('⚔️') || entry.includes('Conquered') || entry.includes('siege')) evtType = 'military';
    else if (entry.includes('🤝') || entry.includes('alliance') || entry.includes('☮️') || entry.includes('Trade')) evtType = 'diplomacy';
    else if (entry.includes('🏗️') || entry.includes('Built') || entry.includes('💰')) evtType = 'economy';
    else if (entry.includes('⛪') || entry.includes('faith') || entry.includes('Faith')) evtType = 'religion';
    else if (entry.includes('👑') || entry.includes('heir') || entry.includes('married') || entry.includes('💍')) evtType = 'dynasty';
    else continue;

    const turnMatch = entry.match(/Turn (\d+)/);
    const yearMatch = entry.match(/Year (\d+)/);
    keyEvents.push({
      turn: turnMatch ? parseInt(turnMatch[1], 10) : startTurn,
      year: yearMatch ? parseInt(yearMatch[1], 10) : startYear,
      description: entry.replace(/^[^a-zA-Z]+/, '').substring(0, 120),
      type: evtType,
    });
  }

  const partialChronicle = {
    rulerId: prev.ruler.id,
    rulerName: prev.ruler.name,
    dynasty: prev.ruler.dynasty,
    legacyTitle: primaryTitle,
    startYear,
    endYear,
    startTurn,
    endTurn,
    yearsRuled,
    warsFought: prev.rulerWarsFought ?? 0,
    battlesWon: prev.rulerBattlesWon ?? 0,
    battlesLost: prev.rulerBattlesLost ?? 0,
    provincesConquered: prev.rulerProvincesConquered ?? 0,
    provincesLost: prev.rulerProvincesLost ?? 0,
    buildingsConstructed: prev.rulerBuildingsConstructed ?? 0,
    technologiesResearched: prev.rulerTechResearched ?? 0,
    peakProvinces: prev.rulerPeakProvinces ?? prev.provinces.filter(p => p.owner === 'player').length,
    peakGold: prev.rulerPeakGold ?? prev.resources.gold,
    traits: prev.ruler.traits,
    legacyTitles,
    keyEvents,
    causeOfDeath,
  };

  return {
    ...partialChronicle,
    narrative: generateReignNarrative(partialChronicle),
  };
}

function generateTraitEvent(ruler: { traits: Array<{ id: string }> }, existingEvents: GameEvent[], turn: number): GameEvent | null {
  if (Math.random() > 0.15) return null;

  for (const trait of ruler.traits) {
    const eventIds = TRAIT_EVENT_MAP[trait.id];
    if (!eventIds) continue;
    const available = eventIds.filter(eid => !existingEvents.some(e => e.id.startsWith(eid)));
    if (available.length === 0) continue;
    if (Math.random() > 0.4) continue;

    const eventId = available[Math.floor(Math.random() * available.length)];
    const template = getFollowUpEvent(eventId);
    if (!template) continue;

    return {
      ...template,
      id: `${eventId}_${turn}`,
      turn,
      seen: false,
    };
  }
  return null;
}

function checkCouncilBetrayal(council: Councilor[], existingEvents: GameEvent[], turn: number): { event: GameEvent | null; betrayerId: string | null } {
  for (const c of council) {
    if (c.loyalty < 20 && Math.random() < 0.25) {
      const eventId = COUNCIL_BETRAYAL_MAP[c.role];
      if (!eventId) continue;
      if (existingEvents.some(e => e.id.startsWith(eventId))) continue;

      const template = getFollowUpEvent(eventId);
      if (!template) continue;

      console.log(`[Game] Council betrayal triggered: ${c.name} (loyalty: ${c.loyalty})`);
      return {
        event: {
          ...template,
          id: `${eventId}_${turn}`,
          turn,
          seen: false,
          description: template.description.replace(/Your (marshal|steward|spymaster|chaplain|chancellor)/, `${c.name}, your ${c.role},`),
        },
        betrayerId: c.id,
      };
    }
  }
  return { event: null, betrayerId: null };
}

function getTacticModifiers(tacticId: string): CombatTactic {
  return COMBAT_TACTICS.find(t => t.id === tacticId) || COMBAT_TACTICS[0];
}

function resolveBattle(
  attacker: Army,
  defender: Army,
  defenderGarrison: number,
  province: Province,
  attackerTacticId?: string
): BattleResult {
  const tactic = getTacticModifiers(attackerTacticId || 'balanced');
  const attackMod = 1 + tactic.attackModifier / 100;
  const defenseMod = 1 + tactic.defenseModifier / 100;
  const casualtyMod = 1 + tactic.casualtyModifier / 100;

  const attackPower = attacker.troops * (attacker.morale / 100) * (1 + Math.random() * 0.3) * attackMod;
  const totalDefenders = defender.troops + defenderGarrison;
  const defendPower = totalDefenders * ((defender.morale || 70) / 100) * (1 + Math.random() * 0.3) * 1.1;

  const attackerLossRate = (0.15 + Math.random() * 0.2) * casualtyMod;
  const defenderLossRate = 0.12 + Math.random() * 0.18;

  const attackerLosses = Math.min(attacker.troops - 1, Math.floor(attacker.troops * defenderLossRate * (defendPower / (attackPower + 1))));
  const defenderLosses = Math.min(totalDefenders - 1, Math.floor(totalDefenders * attackerLossRate * (attackPower / (defendPower + 1))));

  const effectiveAttackPower = attackPower * (defenseMod > 0 ? 1 : 1 + defenseMod / 100);
  const winner = effectiveAttackPower > defendPower * 0.9 ? 'attacker' : 'defender';

  const result: BattleResult = {
    id: `battle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    turn: 0,
    attackerName: attacker.name,
    defenderName: defender.name || `Garrison of ${province.name}`,
    attackerTroops: attacker.troops,
    defenderTroops: totalDefenders,
    attackerLosses,
    defenderLosses,
    winner,
    provinceName: province.name,
    provinceId: province.id,
    conquered: winner === 'attacker',
    tacticUsed: attackerTacticId,
  };

  return enrichBattleResult(result);
}

function checkAchievements(state: GameState): Achievement[] {
  const playerProvCount = state.provinces.filter(p => p.owner === 'player').length;
  const totalTroops = state.armies.reduce((s, a) => s + a.troops, 0);
  const victoriesCount = state.battles.filter(b => b.conquered).length;
  const alliances = state.kingdoms.filter(k => k.attitude === 'allied').length;
  const totalBuildings = state.provinces.filter(p => p.owner === 'player').reduce((s, p) => s + p.buildings.length, 0);
  const allTechResearched = state.technologies.every(t => t.researched);

  return state.achievements.map(ach => {
    if (ach.unlocked) return ach;
    let unlocked = false;
    switch (ach.condition) {
      case 'battles_won_1': unlocked = victoriesCount >= 1; break;
      case 'battles_won_10': unlocked = victoriesCount >= 10; break;
      case 'provinces_10': unlocked = playerProvCount >= 10; break;
      case 'provinces_15': unlocked = playerProvCount >= 15; break;
      case 'gold_2000': unlocked = state.resources.gold >= 2000; break;
      case 'alliances_2': unlocked = alliances >= 2; break;
      case 'turns_50': unlocked = state.turn >= 50; break;
      case 'turns_100': unlocked = state.turn >= 100; break;
      case 'all_tech': unlocked = allTechResearched; break;
      case 'troops_3000': unlocked = totalTroops >= 3000; break;
      case 'faith_500': unlocked = state.resources.faith >= 500; break;
      case 'buildings_10': unlocked = totalBuildings >= 10; break;
      case 'trades_3': unlocked = state.activeTrades.length >= 3; break;
      case 'spy_5': unlocked = state.log.filter(l => l.includes('Spy mission') && l.includes('succeeded')).length >= 5; break;
      case 'succession_1': unlocked = (state.reignChronicles?.length ?? 0) >= 1; break;
    }
    if (unlocked) return { ...ach, unlocked: true, unlockedTurn: state.turn };
    return ach;
  });
}

function processProvinceUnrest(provinces: Province[], turn: number): { provinces: Province[]; revoltLogs: string[]; revoltEvents: GameEvent[] } {
  const revoltLogs: string[] = [];
  const revoltEvents: GameEvent[] = [];

  const updated = provinces.map(p => {
    if (p.owner !== 'player') return p;
    let loyalty = p.loyalty ?? 80;
    let unrest = p.unrest ?? 0;

    if (p.type !== 'capital') {
      const loyaltyDrift = -1 + Math.floor(Math.random() * 3);
      loyalty = Math.max(0, Math.min(100, loyalty + loyaltyDrift));
    }

    if (p.garrison < 100) unrest = Math.min(100, unrest + 5);
    if (p.development < 30) unrest = Math.min(100, unrest + 3);
    if (loyalty < 30) unrest = Math.min(100, unrest + 8);

    if (p.garrison >= 300) unrest = Math.max(0, unrest - 5);
    if (loyalty > 70) unrest = Math.max(0, unrest - 3);

    if (unrest >= 80 && Math.random() > 0.6) {
      const troopsLost = Math.floor(p.garrison * 0.3);
      revoltLogs.push(`🔥 Revolt in ${p.name}! ${troopsLost} garrison lost!`);
      revoltEvents.push({
        id: `revolt_${p.id}_${turn}`,
        title: `Revolt in ${p.name}!`,
        description: `The people of ${p.name} have risen in rebellion! Unrest has reached a breaking point.`,
        type: 'political',
        turn,
        seen: false,
        choices: [
          { id: `rev1_${p.id}_${turn}`, text: 'Crush the revolt', effects: 'Restore order, -garrison', cost: { military: 50 } },
          { id: `rev2_${p.id}_${turn}`, text: 'Make concessions', effects: '+Loyalty, costs gold', cost: { gold: 150 }, reward: { food: 20 } },
        ],
      });
      return { ...p, loyalty: Math.max(10, loyalty - 20), unrest: Math.max(0, unrest - 30), garrison: Math.max(20, p.garrison - troopsLost) };
    }

    return { ...p, loyalty, unrest };
  });

  return { provinces: updated, revoltLogs, revoltEvents };
}

function getPersonalityProfile(kingdom: Kingdom) {
  const personality = kingdom.personality ?? DEFAULT_KINGDOM_PERSONALITIES[kingdom.id] ?? 'diplomatic';
  return AI_PERSONALITY_PROFILES[personality];
}

function getPersonalityBuildingPool(profile: ReturnType<typeof getPersonalityProfile>) {
  const pool = [...AI_BUILDING_POOL];
  switch (profile.buildPreference) {
    case 'military':
      return pool.sort((a, b) => (b.production.militaryPerTurn ?? 0) - (a.production.militaryPerTurn ?? 0));
    case 'economy':
      return pool.sort((a, b) => (b.production.goldPerTurn ?? 0) - (a.production.goldPerTurn ?? 0));
    case 'faith':
      return pool.sort((a, b) => (b.production.faithPerTurn ?? 0) - (a.production.faithPerTurn ?? 0));
    default:
      return pool;
  }
}

function generateRumors(kingdoms: Kingdom[], provinces: Province[], turn: number, hasActiveSpy: boolean, spyTargetId?: string): Rumor[] {
  const rumors: Rumor[] = [];
  const categories: Array<keyof typeof RUMOR_TEMPLATES> = ['war', 'economy', 'politics', 'espionage', 'diplomacy'];
  const rumorCount = 1 + Math.floor(Math.random() * 3);

  for (let i = 0; i < rumorCount; i++) {
    const targetKingdom = kingdoms[Math.floor(Math.random() * kingdoms.length)];
    if (!targetKingdom) continue;

    const category = categories[Math.floor(Math.random() * categories.length)];
    const templates = RUMOR_TEMPLATES[category];
    if (!templates || templates.length === 0) continue;

    const template = templates[Math.floor(Math.random() * templates.length)];
    const borderProvinces = provinces.filter(p =>
      p.owner === 'player' &&
      p.connectedTo.some(c => provinces.find(cp => cp.id === c)?.owner === targetKingdom.id)
    );
    const borderName = borderProvinces.length > 0
      ? borderProvinces[Math.floor(Math.random() * borderProvinces.length)].name
      : 'the frontier';

    const description = template.description
      .replace(/{kingdom}/g, targetKingdom.name)
      .replace(/{border}/g, borderName);

    let baseAccuracy = template.trueChance;
    const isSpyTarget = spyTargetId === targetKingdom.id;
    if (hasActiveSpy && isSpyTarget) {
      baseAccuracy = Math.min(0.95, baseAccuracy + 0.25);
    }

    const isTrue = Math.random() < baseAccuracy;
    const displayAccuracy = hasActiveSpy && isSpyTarget
      ? Math.floor(60 + Math.random() * 35)
      : Math.floor(20 + Math.random() * 50);

    rumors.push({
      id: `rumor_${turn}_${i}_${Date.now()}`,
      kingdomId: targetKingdom.id,
      kingdomName: targetKingdom.name,
      description,
      category: template.category,
      accuracy: displayAccuracy,
      isTrue,
      turn,
      investigated: false,
      fromSpy: hasActiveSpy && isSpyTarget,
    });
  }

  return rumors;
}

function generateIntelRumor(kingdom: Kingdom, _turn: number): string | null {
  const personality = kingdom.personality ?? DEFAULT_KINGDOM_PERSONALITIES[kingdom.id];
  if (!personality) return null;
  if (Math.random() > 0.25) return null;
  const rumors = PERSONALITY_RUMORS[personality];
  if (!rumors || rumors.length === 0) return null;
  const rumor = rumors[Math.floor(Math.random() * rumors.length)];
  return `🔍 Rumors from ${kingdom.name}: ${rumor}`;
}

function updateKingdomIntel(kingdom: Kingdom, turn: number): Kingdom {
  const personality = kingdom.personality ?? DEFAULT_KINGDOM_PERSONALITIES[kingdom.id];
  if (!personality) return kingdom;
  const currentIntel = kingdom.intel ?? { personalityGuesses: [], confidence: 0, rumors: [], lastUpdatedTurn: 0 };
  if (turn - currentIntel.lastUpdatedTurn < 3) return kingdom;
  if (Math.random() > 0.35) return kingdom;

  const allTypes: AIPersonality[] = ['expansionist', 'diplomatic', 'religious', 'trade_focused', 'espionage_focused'];
  let guesses = [...currentIntel.personalityGuesses];
  let confidence = currentIntel.confidence;

  if (Math.random() < 0.6 && !guesses.includes(personality)) {
    guesses.push(personality);
    confidence = Math.min(100, confidence + 15 + Math.floor(Math.random() * 10));
  } else if (Math.random() < 0.3) {
    const wrongGuess = allTypes.filter(t => t !== personality && !guesses.includes(t));
    if (wrongGuess.length > 0) {
      guesses.push(wrongGuess[Math.floor(Math.random() * wrongGuess.length)]);
      confidence = Math.min(100, confidence + 5);
    }
  } else {
    confidence = Math.min(100, confidence + 8);
  }

  if (guesses.length > 3) guesses = guesses.slice(-3);

  const newRumors = [...currentIntel.rumors];
  const rumor = generateIntelRumor(kingdom, turn);
  if (rumor) {
    newRumors.push(rumor);
    if (newRumors.length > 5) newRumors.shift();
  }

  return {
    ...kingdom,
    intel: { personalityGuesses: guesses, confidence, rumors: newRumors, lastUpdatedTurn: turn },
  };
}

function processAIKingdomGrowth(kingdom: Kingdom, provinces: Province[], turn: number, difficulty: string): {
  kingdom: Kingdom;
  provinces: Province[];
  logs: string[];
} {
  let updatedKingdom = { ...kingdom };
  let updatedProvinces = [...provinces];
  const logs: string[] = [];
  const ownedProvinces = updatedProvinces.filter(p => p.owner === kingdom.id);
  const profile = getPersonalityProfile(kingdom);

  const diffMod = difficulty === 'hard' ? 1.4 : difficulty === 'easy' ? 0.7 : 1.0;
  const scaleMod = 1 + (turn / 100) * diffMod;

  const buildChance = profile.buildPreference === 'military' ? 0.3 : profile.buildPreference === 'economy' ? 0.25 : 0.4;
  if (updatedKingdom.treasury >= 200 * (1 / diffMod) && Math.random() > buildChance) {
    const buildTarget = ownedProvinces.find(p => p.buildings.length < 4);
    if (buildTarget) {
      const sortedPool = getPersonalityBuildingPool(profile);
      const bp = sortedPool[Math.floor(Math.random() * Math.min(2, sortedPool.length))];
      if (!buildTarget.buildings.some(b => b.name === bp.name)) {
        const newBuilding: Building = {
          id: `ai_b_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          name: bp.name, level: 1, maxLevel: bp.maxLevel,
          description: bp.description, cost: { gold: bp.baseCost },
          production: bp.production, icon: bp.icon,
        };
        updatedProvinces = updatedProvinces.map(p =>
          p.id === buildTarget.id
            ? { ...p, buildings: [...p.buildings, newBuilding], development: Math.min(100, p.development + 3) }
            : p
        );
        updatedKingdom = { ...updatedKingdom, treasury: updatedKingdom.treasury - bp.baseCost };
      }
    }
  }

  if (updatedKingdom.treasury >= 150 && Math.random() > 0.5) {
    const upgradeTarget = ownedProvinces.find(p => p.buildings.some(b => b.level < b.maxLevel));
    if (upgradeTarget) {
      const building = upgradeTarget.buildings.find(b => b.level < b.maxLevel);
      if (building) {
        const cost = Math.floor((building.cost.gold ?? 100) * (1 + building.level * 0.5));
        if (updatedKingdom.treasury >= cost) {
          updatedProvinces = updatedProvinces.map(p =>
            p.id === upgradeTarget.id
              ? { ...p, buildings: p.buildings.map(b => b.id === building.id ? { ...b, level: b.level + 1 } : b), development: Math.min(100, p.development + 2) }
              : p
          );
          updatedKingdom = { ...updatedKingdom, treasury: updatedKingdom.treasury - cost };
        }
      }
    }
  }

  const personalityRecruitMod = profile.type === 'expansionist' ? -0.15 : profile.type === 'trade_focused' ? 0.15 : 0;
  const recruitChance = (difficulty === 'hard' ? 0.5 : difficulty === 'easy' ? 0.8 : 0.65) + personalityRecruitMod;
  if (updatedKingdom.treasury >= 300 && Math.random() > recruitChance) {
    const maxTroopsArmy = updatedKingdom.armies.find(a => a.troops < a.maxTroops - 100);
    if (maxTroopsArmy) {
      const recruit = Math.min(Math.floor(150 * scaleMod), maxTroopsArmy.maxTroops - maxTroopsArmy.troops);
      updatedKingdom = {
        ...updatedKingdom,
        armies: updatedKingdom.armies.map(a =>
          a.id === maxTroopsArmy.id ? { ...a, troops: a.troops + recruit } : a
        ),
        treasury: updatedKingdom.treasury - recruit * 2,
      };
    }
  }

  const raiseArmyChance = profile.type === 'expansionist' ? 0.55 : profile.type === 'diplomatic' ? 0.85 : 0.75;
  if (updatedKingdom.treasury >= 500 && updatedKingdom.armies.length < 3 && Math.random() > raiseArmyChance) {
    const capitalProvince = ownedProvinces[0];
    if (capitalProvince) {
      const newArmy: Army = {
        id: `ai_army_${kingdom.id}_${turn}`,
        name: `${kingdom.name} Levy`,
        owner: kingdom.id,
        troops: Math.floor(300 * scaleMod),
        maxTroops: Math.floor(600 * scaleMod),
        morale: 65,
        commander: `Captain of ${kingdom.name}`,
        location: capitalProvince.id,
        status: 'idle',
      };
      updatedKingdom = {
        ...updatedKingdom,
        armies: [...updatedKingdom.armies, newArmy],
        treasury: updatedKingdom.treasury - 300,
      };
      logs.push(`📢 ${kingdom.name} has raised a new army!`);
    }
  }

  if (Math.random() > 0.75) {
    const statIdx = Math.floor(Math.random() * 5);
    const stats: Array<keyof Pick<typeof kingdom.ruler, 'diplomacy' | 'martial' | 'stewardship' | 'intrigue' | 'learning'>> = ['diplomacy', 'martial', 'stewardship', 'intrigue', 'learning'];
    const stat = stats[statIdx];
    updatedKingdom = {
      ...updatedKingdom,
      ruler: { ...updatedKingdom.ruler, [stat]: updatedKingdom.ruler[stat] + 1 },
    };
  }

  return { kingdom: updatedKingdom, provinces: updatedProvinces, logs };
}

function processAITurn(kingdoms: Kingdom[], provinces: Province[], playerArmies: Army[], turn: number, difficulty: string): {
  kingdoms: Kingdom[];
  provinces: Province[];
  newBattles: BattleResult[];
  logs: string[];
  newEvents: GameEvent[];
  turn: number;
} {
  let updatedKingdoms = [...kingdoms];
  let updatedProvinces = [...provinces];
  const newBattles: BattleResult[] = [];
  const logs: string[] = [];
  const newEvents: GameEvent[] = [];

  updatedKingdoms = updatedKingdoms.map(k => {
    const growthResult = processAIKingdomGrowth(k, updatedProvinces, turn, difficulty);
    updatedProvinces = growthResult.provinces;
    logs.push(...growthResult.logs);

    const profile = getPersonalityProfile(growthResult.kingdom);
    const dipMod = Math.floor(profile.diplomacyResponseModifier / 10);
    const drift = Math.floor(Math.random() * 7) - 3 + dipMod;
    const newRelation = Math.max(-100, Math.min(100, growthResult.kingdom.relation + drift));
    let newAttitude = growthResult.kingdom.attitude;
    if (growthResult.kingdom.attitude !== 'war' && growthResult.kingdom.attitude !== 'allied') {
      if (newRelation < -60) newAttitude = 'hostile';
      else if (newRelation < 0) newAttitude = 'hostile';
      else if (newRelation < 40) newAttitude = 'neutral';
      else newAttitude = 'friendly';
    }

    const updatedArmies = growthResult.kingdom.armies.map(a => ({
      ...a,
      troops: Math.min(a.maxTroops, a.troops + Math.floor(Math.random() * 20 + 5)),
      morale: Math.min(100, a.morale + Math.floor(Math.random() * 5)),
    }));

    const incomeFromProvinces = updatedProvinces
      .filter(p => p.owner === growthResult.kingdom.id)
      .reduce((sum, p) => {
        const buildingIncome = p.buildings.reduce((bSum, b) => bSum + (b.production.goldPerTurn ?? 0) * b.level, 0);
        return sum + 30 + buildingIncome;
      }, 0);

    const newTreasury = growthResult.kingdom.treasury + incomeFromProvinces;
    return { ...growthResult.kingdom, relation: newRelation, attitude: newAttitude, armies: updatedArmies, treasury: newTreasury };
  });

  updatedKingdoms = updatedKingdoms.map(k => updateKingdomIntel(k, turn));

  const allianceRolls = updatedKingdoms.filter(k => {
    const p = getPersonalityProfile(k);
    return Math.random() < p.allianceLikelihood * 0.15;
  });
  if (allianceRolls.length > 0 || Math.random() > 0.85) {
    const candidates = updatedKingdoms.filter(k => k.attitude !== 'war' && !k.allyOf?.length);
    if (candidates.length >= 2) {
      const k1 = candidates[Math.floor(Math.random() * candidates.length)];
      const k2 = candidates.find(k => k.id !== k1.id);
      if (k2) {
        updatedKingdoms = updatedKingdoms.map(k => {
          if (k.id === k1.id) return { ...k, allyOf: [...(k.allyOf || []), k2.id] };
          if (k.id === k2.id) return { ...k, allyOf: [...(k.allyOf || []), k1.id] };
          return k;
        });
        logs.push(`📜 ${k1.name} and ${k2.name} formed an alliance!`);
      }
    }
  }

  updatedKingdoms.forEach(kingdom => {
    if (kingdom.attitude === 'war') {
      let warScore = kingdom.warScore ?? 0;
      const playerBorderProvinces = updatedProvinces.filter(p =>
        p.owner === 'player' &&
        p.connectedTo.some(c => {
          const connected = updatedProvinces.find(cp => cp.id === c);
          return connected && connected.owner === kingdom.id;
        })
      );

      const warProfile = getPersonalityProfile(kingdom);
      const attackChance = 0.5 - (warProfile.expansionAggression * 0.2);
      if (playerBorderProvinces.length > 0 && Math.random() > attackChance) {
        const target = playerBorderProvinces[Math.floor(Math.random() * playerBorderProvinces.length)];
        const attackingArmy = kingdom.armies.find(a => a.troops > 200 && a.status === 'idle');

        if (attackingArmy) {
          const defendingArmy = playerArmies.find(a => a.location === target.id) || {
            id: 'garrison', name: `Garrison of ${target.name}`, owner: 'player',
            troops: 0, maxTroops: 0, morale: 60, commander: 'Local Captain',
            location: target.id, status: 'idle' as const,
          };

          const battle = resolveBattle(
            { ...attackingArmy, name: `${kingdom.name} ${attackingArmy.name}` },
            defendingArmy, target.garrison, target
          );
          newBattles.push(battle);

          const kingdomIdx = updatedKingdoms.findIndex(k => k.id === kingdom.id);
          if (kingdomIdx >= 0) {
            updatedKingdoms[kingdomIdx] = {
              ...updatedKingdoms[kingdomIdx],
              armies: updatedKingdoms[kingdomIdx].armies.map(a =>
                a.id === attackingArmy.id
                  ? { ...a, troops: Math.max(50, a.troops - battle.attackerLosses), morale: Math.max(20, a.morale - 15) }
                  : a
              ),
            };
          }

          if (battle.conquered) {
            updatedProvinces = updatedProvinces.map(p =>
              p.id === target.id ? { ...p, owner: kingdom.id, garrison: Math.max(50, target.garrison - battle.defenderLosses), loyalty: 40, unrest: 30 } : p
            );
            updatedKingdoms = updatedKingdoms.map(k =>
              k.id === kingdom.id ? { ...k, provinces: [...k.provinces, target.id], warScore: (k.warScore ?? 0) + 25 } : k
            );
            logs.push(`⚠️ ${kingdom.name} conquered ${target.name}!`);
            warScore += 25;
          } else {
            logs.push(`🛡️ Your garrison at ${target.name} repelled ${kingdom.name}'s attack!`);
            warScore -= 10;
          }

          const kIdx = updatedKingdoms.findIndex(k => k.id === kingdom.id);
          if (kIdx >= 0) {
            updatedKingdoms[kIdx] = { ...updatedKingdoms[kIdx], warScore };
          }
        }
      }

      if (warScore <= -50 && Math.random() > 0.5) {
        const kIdx = updatedKingdoms.findIndex(k => k.id === kingdom.id);
        if (kIdx >= 0) {
          updatedKingdoms[kIdx] = { ...updatedKingdoms[kIdx], attitude: 'hostile', warScore: 0 };
          logs.push(`☮️ ${kingdom.name} has sued for peace!`);
        }
      }
    }

    const myProvinces = updatedProvinces.filter(p => p.owner === kingdom.id);
    const adjacentNeutrals = updatedProvinces.filter(p =>
      p.owner === 'neutral' &&
      p.connectedTo.some(c => myProvinces.some(mp => mp.id === c))
    );
    if (adjacentNeutrals.length > 0 && Math.random() > 0.55) {
      const target = adjacentNeutrals[Math.floor(Math.random() * adjacentNeutrals.length)];
      const claimArmy = kingdom.armies.find(a => a.troops > 150 && a.status === 'idle');
      if (claimArmy) {
        const defArmy: Army = {
          id: 'neutral_def', name: `Militia of ${target.name}`, owner: 'neutral',
          troops: target.garrison, maxTroops: target.garrison, morale: 40,
          commander: 'Local Elder', location: target.id, status: 'fighting',
        };
        const battle = resolveBattle(claimArmy, defArmy, 0, target);
        if (battle.conquered) {
          updatedProvinces = updatedProvinces.map(p =>
            p.id === target.id ? { ...p, owner: kingdom.id, garrison: 80 } : p
          );
          logs.push(`🏴 ${kingdom.name} claimed the unclaimed territory of ${target.name}!`);
        }
        const kidx = updatedKingdoms.findIndex(k => k.id === kingdom.id);
        if (kidx >= 0) {
          updatedKingdoms[kidx] = {
            ...updatedKingdoms[kidx],
            armies: updatedKingdoms[kidx].armies.map(a =>
              a.id === claimArmy.id ? { ...a, troops: Math.max(50, a.troops - battle.attackerLosses) } : a
            ),
          };
        }
      }
    }

    const expansionProfile = getPersonalityProfile(kingdom);
    const aiWarChance = 0.92 - (expansionProfile.expansionAggression * 0.15);
    if (kingdom.attitude !== 'war' && Math.random() > aiWarChance) {
      const otherKingdoms = updatedKingdoms.filter(k => k.id !== kingdom.id && k.id !== 'player');
      const enemyCandidate = otherKingdoms.find(k => {
        const kProvinces = updatedProvinces.filter(p => p.owner === k.id);
        const myProvinces = updatedProvinces.filter(p => p.owner === kingdom.id);
        return myProvinces.some(mp => mp.connectedTo.some(c => kProvinces.some(kp => kp.id === c)));
      });

      if (enemyCandidate && kingdom.armies.reduce((s, a) => s + a.troops, 0) > 500) {
        const borderProvince = updatedProvinces.find(p =>
          p.owner === enemyCandidate.id &&
          p.connectedTo.some(c => updatedProvinces.find(cp => cp.id === c)?.owner === kingdom.id)
        );
        if (borderProvince) {
          const attackArmy = kingdom.armies.find(a => a.troops > 250 && a.status === 'idle');
          if (attackArmy) {
            const defArmy: Army = {
              id: 'ai_def', name: `Garrison of ${borderProvince.name}`, owner: enemyCandidate.id,
              troops: borderProvince.garrison, maxTroops: borderProvince.garrison, morale: 60,
              commander: 'Local Captain', location: borderProvince.id, status: 'fighting',
            };
            const battle = resolveBattle(attackArmy, defArmy, 0, borderProvince);
            if (battle.conquered) {
              updatedProvinces = updatedProvinces.map(p =>
                p.id === borderProvince.id ? { ...p, owner: kingdom.id, garrison: 100 } : p
              );
              logs.push(`⚔️ ${kingdom.name} conquered ${borderProvince.name} from ${enemyCandidate.name}!`);
            }
            const kidx = updatedKingdoms.findIndex(k => k.id === kingdom.id);
            if (kidx >= 0) {
              updatedKingdoms[kidx] = {
                ...updatedKingdoms[kidx],
                armies: updatedKingdoms[kidx].armies.map(a =>
                  a.id === attackArmy.id ? { ...a, troops: Math.max(50, a.troops - battle.attackerLosses) } : a
                ),
              };
            }
          }
        }
      }
    }

    const declareProfile = getPersonalityProfile(kingdom);
    const personalityWarMod = declareProfile.warLikelihood * 0.15;
    const warThreshold = (difficulty === 'hard' ? 0.6 : difficulty === 'easy' ? 0.85 : 0.7) - personalityWarMod;
    if (kingdom.attitude === 'hostile' && kingdom.relation < -70 && Math.random() > warThreshold) {
      const kIdx = updatedKingdoms.findIndex(k => k.id === kingdom.id);
      if (kIdx >= 0) {
        updatedKingdoms[kIdx] = { ...updatedKingdoms[kIdx], attitude: 'war', warScore: 0 };
        logs.push(`🔥 ${kingdom.name} has DECLARED WAR on you!`);
        newEvents.push({
          id: `war_${kingdom.id}_${Date.now()}`,
          title: `${kingdom.name} Declares War!`,
          description: `${kingdom.ruler.name} of ${kingdom.name} has declared war upon your realm! Prepare your armies for battle.`,
          type: 'military',
          choices: [
            { id: `wc1_${kingdom.id}`, text: 'Rally our forces!', effects: '+20 army morale', reward: { military: 30 } },
            { id: `wc2_${kingdom.id}`, text: 'Fortify our borders', effects: '+100 garrison in border provinces', cost: { gold: 100 } },
          ],
          turn: 0,
          seen: false,
        });
      }
    }
  });

  return { kingdoms: updatedKingdoms, provinces: updatedProvinces, newBattles, logs, newEvents, turn: 0 };
}

function buildInitialStateForKingdom(choice: KingdomChoice, difficulty: 'easy' | 'normal' | 'hard'): GameState {
  const capitalId = ALL_PROVINCES.find(p => choice.startingProvinces.includes(p.id) && p.type === 'capital')?.id || choice.startingProvinces[0];

  const starterBuildings: Building[] = [
    { id: 'starter_keep', name: 'Castle Keep', level: 1, maxLevel: 10, description: 'Fortified seat of power', cost: { gold: 200 }, production: { militaryPerTurn: 2 }, icon: '\ud83c\udff0' },
    { id: 'starter_barracks', name: 'Barracks', level: 1, maxLevel: 10, description: 'Train soldiers for your army', cost: { gold: 200 }, production: { militaryPerTurn: 2 }, icon: '\u2694\ufe0f' },
    { id: 'starter_farm', name: 'Farmstead', level: 1, maxLevel: 10, description: 'Grow food for your people', cost: { gold: 120 }, production: { foodPerTurn: 3 }, icon: '\ud83c\udf3b' },
  ];

  let provinces = ALL_PROVINCES.map(p => {
    if (choice.startingProvinces.includes(p.id)) {
      const buildings = p.id === capitalId ? [...starterBuildings] : [];
      return { ...p, owner: 'player', loyalty: 90, unrest: 0, buildings };
    }
    if (choice.id !== 'ironforge' && p.owner === 'ironforge') {
      return { ...p, owner: choice.id };
    }
    return p;
  });

  if (choice.id !== 'ironforge') {
    const ironforgeProvinces = KINGDOM_CHOICES.find(k => k.id === 'ironforge')?.startingProvinces || [];
    provinces = provinces.map(p => {
      if (ironforgeProvinces.includes(p.id) && p.owner === 'player') {
        return { ...p, owner: 'ironforge' };
      }
      if (choice.startingProvinces.includes(p.id)) {
        return { ...p, owner: 'player', loyalty: 90, unrest: 0 };
      }
      return p;
    });
  }

  const kingdoms = INITIAL_KINGDOMS.filter(k => k.id !== choice.id).map(k => {
    if (choice.id !== 'ironforge' && k.id === 'ironforge') return { ...k, personality: DEFAULT_KINGDOM_PERSONALITIES[k.id] };
    return { ...k, provinces: provinces.filter(p => p.owner === k.id).map(p => p.id), personality: DEFAULT_KINGDOM_PERSONALITIES[k.id] };
  });

  if (choice.id !== 'ironforge') {
    const ironforgeKingdom = {
      id: 'ironforge', name: 'Kingdom of Ironforge',
      ruler: { ...INITIAL_RULER, id: 'iron_ruler' },
      provinces: provinces.filter(p => p.owner === 'ironforge').map(p => p.id),
      relation: 0, attitude: 'neutral' as const, color: '#d4a574', strength: 1500,
      armies: [
        { id: 'iron_army1', name: 'Royal Guard', owner: 'ironforge', troops: 800, maxTroops: 1200, morale: 90, commander: 'King Aldric', location: 'ironhold', status: 'idle' as const },
        { id: 'iron_army2', name: 'Northern Vanguard', owner: 'ironforge', troops: 450, maxTroops: 800, morale: 75, commander: 'Lord Cedric', location: 'stormwatch', status: 'idle' as const },
      ],
      treasury: 800, crest: '⚔️', description: 'A balanced kingdom with strong military tradition.',
      personality: DEFAULT_KINGDOM_PERSONALITIES['ironforge'] as AIPersonality,
    };
    kingdoms.push(ironforgeKingdom);
  }

  let resources = { ...INITIAL_RESOURCES };
  if (choice.id === 'solarian') { resources.gold = 800; resources.goldPerTurn = 60; }
  else if (choice.id === 'emeraldleague') { resources.gold = 1000; resources.goldPerTurn = 50; }
  else if (choice.id === 'crimsonhorde') { resources.gold = 350; resources.militaryPerTurn = 15; }
  else if (choice.id === 'nordheim') { resources.food = 200; resources.foodPerTurn = 20; resources.military = 300; }
  else if (choice.id === 'valkorian') { resources.military = 350; resources.militaryPerTurn = 15; resources.goldPerTurn = 35; }

  if (difficulty === 'easy') { resources.gold += 200; resources.goldPerTurn += 10; }
  if (difficulty === 'hard') { resources.gold -= 100; resources.goldPerTurn -= 5; }

  const capitalProvince = provinces.find(p => choice.startingProvinces.includes(p.id) && p.type === 'capital');
  const startArmies: Army[] = [
    {
      id: 'army1', name: `${choice.name} Royal Guard`, owner: 'player',
      troops: 700, maxTroops: 1200, morale: 85,
      commander: choice.ruler.name, location: capitalProvince?.id || choice.startingProvinces[0],
      status: 'idle',
    },
    {
      id: 'army2', name: `${choice.name} Vanguard`, owner: 'player',
      troops: 400, maxTroops: 800, morale: 70,
      commander: COMMANDER_NAMES[Math.floor(Math.random() * COMMANDER_NAMES.length)],
      location: choice.startingProvinces[choice.startingProvinces.length > 1 ? 1 : 0],
      status: 'idle',
    },
  ];

  return {
    turn: 1, year: 1066, season: 'Spring',
    ruler: { ...choice.ruler, id: 'player_ruler' },
    heir: { ...INITIAL_HEIR, name: HEIR_NAMES[Math.floor(Math.random() * HEIR_NAMES.length)] },
    resources,
    provinces,
    armies: startArmies,
    kingdoms: kingdoms.map(k => ({ ...k, provinces: provinces.filter(p => p.owner === k.id).map(p => p.id) })),
    events: INITIAL_EVENTS,
    battles: [],
    technologies: INITIAL_TECHNOLOGIES,
    council: INITIAL_COUNCIL,
    log: [`Year 1066, Spring — The ${choice.name} rises. Your reign begins.`],
    gameOver: false, victory: false,
    selectedKingdom: choice.id,
    gameStarted: true,
    activeTactic: 'balanced',
    activeTrades: [],
    achievements: INITIAL_ACHIEVEMENTS,
    faithCooldowns: {},
    tutorialSeen: false,
    difficulty,
    rumors: [],
    pressures: getEmptyPressures(),
    reignChronicles: [],
    rulerStartTurn: 1,
    rulerStartYear: 1066,
    rulerPeakProvinces: 0,
    rulerPeakGold: 0,
    rulerBuildingsConstructed: 0,
    rulerTechResearched: 0,
    rulerWarsFought: 0,
    rulerBattlesWon: 0,
    rulerBattlesLost: 0,
    rulerProvincesConquered: 0,
    rulerProvincesLost: 0,
    pendingChainEvents: [],
    unlockedBlueprints: [...STARTER_BLUEPRINT_IDS],
  };
}

export const [GameProvider, useGame] = createContextHook(() => {
  const [state, setState] = React.useState<GameState>(defaultState);
  const [isLoaded, setIsLoaded] = React.useState(false);

  function mergeLoadedState(loaded: Partial<GameState>): GameState {
    return {
      ...defaultState,
      ...loaded,
      technologies: loaded.technologies ?? INITIAL_TECHNOLOGIES,
      council: loaded.council ?? INITIAL_COUNCIL,
      battles: loaded.battles ?? [],
      heir: loaded.heir ?? null,
      gameOver: loaded.gameOver ?? false,
      victory: loaded.victory ?? false,
      gameStarted: loaded.gameStarted ?? false,
      activeTactic: loaded.activeTactic ?? 'balanced',
      activeTrades: loaded.activeTrades ?? [],
      achievements: loaded.achievements ?? INITIAL_ACHIEVEMENTS,
      faithCooldowns: loaded.faithCooldowns ?? {},
      tutorialSeen: loaded.tutorialSeen ?? false,
      difficulty: loaded.difficulty ?? 'normal',
      rumors: loaded.rumors ?? [],
      pressures: loaded.pressures ?? getEmptyPressures(),
      reignChronicles: loaded.reignChronicles ?? [],
      rulerStartTurn: loaded.rulerStartTurn ?? 1,
      rulerStartYear: loaded.rulerStartYear ?? loaded.year ?? 1066,
      rulerPeakProvinces: loaded.rulerPeakProvinces ?? 0,
      rulerPeakGold: loaded.rulerPeakGold ?? 0,
      rulerBuildingsConstructed: loaded.rulerBuildingsConstructed ?? 0,
      rulerTechResearched: loaded.rulerTechResearched ?? 0,
      rulerWarsFought: loaded.rulerWarsFought ?? 0,
      rulerBattlesWon: loaded.rulerBattlesWon ?? 0,
      rulerBattlesLost: loaded.rulerBattlesLost ?? 0,
      rulerProvincesConquered: loaded.rulerProvincesConquered ?? 0,
      rulerProvincesLost: loaded.rulerProvincesLost ?? 0,
      pendingChainEvents: loaded.pendingChainEvents ?? [],
      unlockedBlueprints: loaded.unlockedBlueprints ?? [...STARTER_BLUEPRINT_IDS],
    };
  }

  const saveMutation = useMutation({
    mutationFn: async (gameState: GameState) => {
      console.log('[Game] Saving to AsyncStorage, turn:', gameState.turn);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    },
  });

  useEffect(() => {
    if (isLoaded) return;
    console.log('[Game] Loading save from AsyncStorage...');
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as GameState;
            console.log('[Game] Found local save, turn:', parsed.turn, 'gameStarted:', parsed.gameStarted);
            const merged = mergeLoadedState(parsed);
            setState(merged);
          } catch (e) {
            console.warn('[Game] Failed to parse local save:', e);
          }
        } else {
          console.log('[Game] No save found, using defaults');
        }
        setIsLoaded(true);
      })
      .catch((e) => {
        console.warn('[Game] AsyncStorage load error:', e);
        setIsLoaded(true);
      });
  }, [isLoaded]);

  const selectKingdom = useCallback((kingdomId: string, difficulty?: 'easy' | 'normal' | 'hard') => {
    const choice = KINGDOM_CHOICES.find(k => k.id === kingdomId);
    if (!choice) return;
    console.log(`[Game] Selected kingdom: ${choice.name}`);
    const newState = buildInitialStateForKingdom(choice, difficulty || 'normal');
    setState(newState);
    saveMutation.mutate(newState);
  }, [saveMutation]);

  const setActiveTactic = useCallback((tacticId: string) => {
    setState(prev => {
      const newState = { ...prev, activeTactic: tacticId };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const startRulerUpgrade = useCallback((stat: 'diplomacy' | 'martial' | 'stewardship' | 'intrigue' | 'learning') => {
    setState(prev => {
      if (prev.ruler.activeUpgrade) return prev;
      const cost = 150;
      if (prev.resources.gold < cost) return prev;
      const upgrade: StatUpgrade = { stat, turnsRemaining: 5, totalTurns: 5 };
      const newState: GameState = {
        ...prev,
        ruler: { ...prev.ruler, activeUpgrade: upgrade },
        resources: { ...prev.resources, gold: prev.resources.gold - cost },
        log: [`📈 Began training ${stat} (5 turns)`, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const startCouncilorUpgrade = useCallback((councilorId: string) => {
    setState(prev => {
      const councilor = prev.council.find(c => c.id === councilorId);
      if (!councilor || councilor.activeUpgrade) return prev;
      const cost = 100;
      if (prev.resources.gold < cost) return prev;
      const newCouncil = prev.council.map(c =>
        c.id === councilorId
          ? { ...c, activeUpgrade: { councilorId, turnsRemaining: 3, totalTurns: 3 } }
          : c
      );
      const newState: GameState = {
        ...prev,
        council: newCouncil,
        resources: { ...prev.resources, gold: prev.resources.gold - cost },
        log: [`📈 ${councilor.name} began skill training (3 turns)`, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const startSpyMission = useCallback((missionId: string, targetId: string, isUndiscovered?: boolean) => {
    setState(prev => {
      if (prev.activeSpyMission) return prev;
      const mission = SPY_MISSIONS.find(m => m.id === missionId);
      if (!mission || prev.resources.gold < mission.cost) return prev;
      const spymaster = prev.council.find(c => c.role === 'spymaster');
      const intrigueBonus = Math.max(0, (prev.ruler.intrigue - 10) + ((spymaster?.skill ?? 0) - 10));
      const baseTurns = Math.max(1, mission.turnsToComplete - Math.floor(intrigueBonus / 5));
      const adjustedTurns = isUndiscovered ? baseTurns + 2 : baseTurns;
      const activeMission: ActiveSpyMission = {
        missionId, targetId, turnsRemaining: adjustedTurns, totalTurns: adjustedTurns,
      };
      const label = isUndiscovered ? `🕵️ Launched spy mission: ${mission.name} (undiscovered region, +2 turns)` : `🕵️ Launched spy mission: ${mission.name}`;
      const newState: GameState = {
        ...prev,
        activeSpyMission: activeMission,
        resources: { ...prev.resources, gold: prev.resources.gold - mission.cost },
        log: [label, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const proposeTrade = useCallback((kingdomId: string, give: Partial<Resources>, receive: Partial<Resources>, duration: number) => {
    setState(prev => {
      const kingdom = prev.kingdoms.find(k => k.id === kingdomId);
      if (!kingdom || kingdom.attitude === 'war') return prev;
      if (kingdom.relation < -20) return prev;
      const giveGold = give.gold ?? 0;
      const giveFood = give.food ?? 0;
      const giveMilitary = give.military ?? 0;
      if (prev.resources.gold < giveGold || prev.resources.food < giveFood || prev.resources.military < giveMilitary) return prev;
      const acceptChance = 40 + kingdom.relation + (kingdom.attitude === 'allied' ? 20 : 0) + (kingdom.attitude === 'friendly' ? 10 : 0);
      if (Math.random() * 100 > acceptChance) {
        const newState: GameState = {
          ...prev,
          log: [`❌ ${kingdom.name} rejected your trade offer`, ...prev.log].slice(0, 50),
        };
        saveMutation.mutate(newState);
        return newState;
      }
      const trade: ActiveTrade = {
        id: `trade_${Date.now()}`, kingdomId, kingdomName: kingdom.name,
        give, receive, turnsRemaining: duration,
      };
      const newState: GameState = {
        ...prev,
        activeTrades: [...prev.activeTrades, trade],
        log: [`🤝 Trade deal with ${kingdom.name} established!`, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const useFaithAction = useCallback((actionId: string) => {
    setState(prev => {
      const cooldown = prev.faithCooldowns[actionId] ?? 0;
      if (cooldown > 0) return prev;
      let newResources = { ...prev.resources };
      let newRuler = { ...prev.ruler };
      let newArmies = [...prev.armies];
      let newProvinces = [...prev.provinces];
      let logMsg = '';
      const newCooldowns = { ...prev.faithCooldowns };

      switch (actionId) {
        case 'faith_bless_army':
          if (newResources.faith < 50) return prev;
          newResources.faith -= 50;
          newArmies = newArmies.map(a => ({ ...a, morale: Math.min(100, a.morale + 20) }));
          logMsg = '✨ Armies blessed! +20 morale to all armies';
          newCooldowns[actionId] = 3;
          break;
        case 'faith_holy_war':
          if (newResources.faith < 100) return prev;
          newResources.faith -= 100;
          logMsg = '⚔️ Holy war declared! +30% attack for next battles';
          newCooldowns[actionId] = 10;
          break;
        case 'faith_heal_ruler':
          if (newResources.faith < 60) return prev;
          newResources.faith -= 60;
          newRuler = { ...newRuler, health: Math.min(newRuler.maxHealth, newRuler.health + 25) };
          logMsg = '💚 Divine healing restored ruler health';
          newCooldowns[actionId] = 5;
          break;
        case 'faith_consecrate':
          if (newResources.faith < 40) return prev;
          newResources.faith -= 40;
          newProvinces = newProvinces.map(p =>
            p.owner === 'player' ? { ...p, loyalty: Math.min(100, (p.loyalty ?? 80) + 30), unrest: Math.max(0, (p.unrest ?? 0) - 20) } : p
          );
          logMsg = '🕯️ Provinces consecrated! +30 loyalty, -20 unrest';
          newCooldowns[actionId] = 4;
          break;
        case 'faith_pilgrimage':
          if (newResources.faith < 80) return prev;
          newResources.faith -= 80;
          newRuler = { ...newRuler, learning: newRuler.learning + 2, diplomacy: newRuler.diplomacy + 1 };
          logMsg = '🛤️ Royal pilgrimage complete! +2 Learning, +1 Diplomacy';
          newCooldowns[actionId] = 8;
          break;
        case 'faith_tithe':
          if (newResources.faith < 20) return prev;
          newResources.faith -= 20;
          newResources.gold += 200;
          logMsg = '💰 Tithes collected! +200 gold';
          newCooldowns[actionId] = 3;
          break;
        default:
          return prev;
      }

      const newState: GameState = {
        ...prev,
        resources: newResources,
        ruler: newRuler,
        armies: newArmies,
        provinces: newProvinces,
        faithCooldowns: newCooldowns,
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const dismissTutorial = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, tutorialSeen: true };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const investigateRumor = useCallback((rumorId: string) => {
    setState(prev => {
      if (prev.activeSpyMission) return prev;
      const rumor = prev.rumors.find(r => r.id === rumorId);
      if (!rumor || rumor.investigated) return prev;
      const cost = 50;
      if (prev.resources.gold < cost) return prev;
      const spymaster = prev.council.find(c => c.role === 'spymaster');
      const intrigueBonus = Math.max(0, (prev.ruler.intrigue - 10) + ((spymaster?.skill ?? 0) - 10));
      const newAccuracy = Math.min(95, rumor.accuracy + 20 + Math.floor(intrigueBonus / 2));
      const updatedRumors = prev.rumors.map(r =>
        r.id === rumorId ? { ...r, investigated: true, accuracy: newAccuracy } : r
      );
      const logMsg = `🔍 Investigated rumor about ${rumor.kingdomName} — reliability now ${newAccuracy}%`;
      const newState: GameState = {
        ...prev,
        rumors: updatedRumors,
        resources: { ...prev.resources, gold: prev.resources.gold - cost },
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const dismissRumor = useCallback((rumorId: string) => {
    setState(prev => {
      const newState: GameState = {
        ...prev,
        rumors: prev.rumors.filter(r => r.id !== rumorId),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const arrangeMarriage = useCallback((candidateIndex: number) => {
    setState(prev => {
      if (prev.ruler.spouse) return prev;
      const candidate = MARRIAGE_CANDIDATES[candidateIndex];
      if (!candidate) return prev;
      const cost = 300;
      if (prev.resources.gold < cost) return prev;
      const bonuses: Record<string, number> = {};
      if (candidate.diplomacyBonus) bonuses.diplomacy = candidate.diplomacyBonus;
      if (candidate.martialBonus) bonuses.martial = candidate.martialBonus;
      if (candidate.stewardshipBonus) bonuses.stewardship = candidate.stewardshipBonus;
      if (candidate.intrigueBonus) bonuses.intrigue = candidate.intrigueBonus;
      if (candidate.learningBonus) bonuses.learning = candidate.learningBonus;
      const resourceBonuses: Record<string, number> = {};
      if (candidate.goldBonus) resourceBonuses.goldPerTurn = candidate.goldBonus;
      if (candidate.militaryBonus) resourceBonuses.militaryPerTurn = candidate.militaryBonus;
      if (candidate.faithBonus) resourceBonuses.faithPerTurn = candidate.faithBonus;
      const relKingdom = candidate.kingdom;
      const newKingdoms = prev.kingdoms.map(k =>
        k.id === relKingdom ? { ...k, relation: Math.min(100, k.relation + 20) } : k
      );
      const newRuler = {
        ...prev.ruler,
        spouse: candidate.name,
        spouseBonuses: {
          ...bonuses,
          ...resourceBonuses,
        },
      };
      const newResources = {
        ...prev.resources,
        gold: prev.resources.gold - cost,
        goldPerTurn: prev.resources.goldPerTurn + (resourceBonuses.goldPerTurn || 0),
        militaryPerTurn: prev.resources.militaryPerTurn + (resourceBonuses.militaryPerTurn || 0),
        faithPerTurn: prev.resources.faithPerTurn + (resourceBonuses.faithPerTurn || 0),
      };
      const logMsg = `💍 ${prev.ruler.name} married ${candidate.name}! +20 relations with ${relKingdom}`;
      const newState: GameState = {
        ...prev,
        ruler: newRuler,
        resources: newResources,
        kingdoms: newKingdoms,
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const advanceTurn = useCallback(() => {
    setState(prev => {
      if (prev.gameOver || prev.victory) return prev;

      const summary: TurnSummary = {
        turn: prev.turn + 1, year: prev.year, season: prev.season,
        goldGained: 0, foodGained: 0, militaryGained: 0, faithGained: 0,
        provincesConquered: [], provincesLost: [], battlesWon: 0, battlesLost: 0,
        eventsTriggered: [], aiActions: [], revolts: [], tradeIncome: 0, spyResults: [], rumorsHeard: [],
      };

      const seasonIndex = SEASONS.indexOf(prev.season);
      const nextSeasonIndex = (seasonIndex + 1) % 4;
      const nextSeason = SEASONS[nextSeasonIndex];
      const nextYear = nextSeasonIndex === 0 ? prev.year + 1 : prev.year;
      const nextTurn = prev.turn + 1;
      summary.season = nextSeason;
      summary.year = nextYear;

      const seasonEffect = SEASON_EFFECTS[nextSeason];
      const newResources: Resources = {
        ...prev.resources,
        gold: Math.max(0, prev.resources.gold + prev.resources.goldPerTurn + seasonEffect.gold),
        food: Math.max(0, prev.resources.food + prev.resources.foodPerTurn + seasonEffect.food),
        military: Math.max(0, prev.resources.military + prev.resources.militaryPerTurn + seasonEffect.military),
        faith: Math.max(0, prev.resources.faith + prev.resources.faithPerTurn),
      };
      summary.goldGained = prev.resources.goldPerTurn + seasonEffect.gold;
      summary.foodGained = prev.resources.foodPerTurn + seasonEffect.food;
      summary.militaryGained = prev.resources.militaryPerTurn + seasonEffect.military;
      summary.faithGained = prev.resources.faithPerTurn;

      let activeTrades = prev.activeTrades.map(t => ({ ...t, turnsRemaining: t.turnsRemaining - 1 }));
      const hasBankingGuild = prev.technologies.find(t => t.id === 'tech_banking_guild')?.researched ?? false;
      const tradeIncomeMultiplier = hasBankingGuild ? 1.25 : 1.0;
      activeTrades.forEach(trade => {
        if (trade.turnsRemaining >= 0) {
          const receiveGold = trade.receive.gold ?? 0;
          const receiveFood = trade.receive.food ?? 0;
          const receiveMilitary = trade.receive.military ?? 0;
          const receiveFaith = trade.receive.faith ?? 0;
          const giveGold = trade.give.gold ?? 0;
          const giveFood = trade.give.food ?? 0;
          const giveMilitary = trade.give.military ?? 0;
          const goldFromTrade = Math.floor((receiveGold - giveGold) * tradeIncomeMultiplier);
          newResources.gold += goldFromTrade;
          newResources.food += receiveFood - giveFood;
          newResources.military += receiveMilitary - giveMilitary;
          newResources.faith += receiveFaith;
          summary.tradeIncome += goldFromTrade;
        }
      });
      activeTrades = activeTrades.filter(t => t.turnsRemaining > 0);

      let newRuler = { ...prev.ruler };
      if (newRuler.activeUpgrade) {
        const upgrade = { ...newRuler.activeUpgrade };
        upgrade.turnsRemaining -= 1;
        if (upgrade.turnsRemaining <= 0) {
          newRuler = { ...newRuler, [upgrade.stat]: newRuler[upgrade.stat] + 2, activeUpgrade: undefined };
        } else {
          newRuler = { ...newRuler, activeUpgrade: upgrade };
        }
      }

      if (nextSeasonIndex === 0) {
        newRuler.age += 1;
        const agePenalty = newRuler.age > 60 ? (newRuler.age - 60) * 2 : newRuler.age > 45 ? (newRuler.age - 45) : 0;
        const healthLoss = Math.floor(Math.random() * 5) + agePenalty;
        newRuler.health = Math.max(0, newRuler.health - healthLoss);
        if (nextSeason === 'Winter' || Math.random() > 0.8) {
          newRuler.health = Math.max(0, newRuler.health - Math.floor(Math.random() * 3));
        }
      }

      let newHeir = prev.heir ? { ...prev.heir } : null;
      if (newHeir && nextSeasonIndex === 0) {
        newHeir.age += 1;
        if (Math.random() > 0.7) {
          const statIdx = Math.floor(Math.random() * 5);
          const stats: Array<keyof Pick<Heir, 'diplomacy' | 'martial' | 'stewardship' | 'intrigue' | 'learning'>> = ['diplomacy', 'martial', 'stewardship', 'intrigue', 'learning'];
          newHeir[stats[statIdx]] += 1;
        }
      }

      let heirComingOfAge = false;
      if (newHeir && newHeir.age >= 16 && !newHeir.comingOfAgeTriggered && !newHeir.path) {
        newHeir = { ...newHeir, comingOfAgeTriggered: true };
        heirComingOfAge = true;
        console.log(`[Game] Heir coming-of-age triggered for ${newHeir.name}`);
      }

      let heirEduCompleteLog: string | null = null;
      if (newHeir?.activeEducation) {
        const edu = { ...newHeir.activeEducation };
        edu.turnsRemaining -= 1;
        if (edu.turnsRemaining <= 0) {
          newHeir = { ...newHeir, [edu.stat]: newHeir[edu.stat] + edu.bonus, activeEducation: undefined };
          heirEduCompleteLog = `📖 Heir ${newHeir.name} completed ${edu.stat} education (+${edu.bonus})`;
        } else {
          newHeir = { ...newHeir, activeEducation: edu };
        }
      }

      if (!newHeir && newRuler.spouse && Math.random() > 0.85) {
        const name = HEIR_NAMES[Math.floor(Math.random() * HEIR_NAMES.length)];
        newHeir = {
          id: `heir_${nextTurn}`, name, age: 0,
          diplomacy: 3 + Math.floor(Math.random() * 5),
          martial: 3 + Math.floor(Math.random() * 5),
          stewardship: 3 + Math.floor(Math.random() * 5),
          intrigue: 3 + Math.floor(Math.random() * 5),
          learning: 3 + Math.floor(Math.random() * 5),
          traits: Math.random() > 0.5 ? [TRAITS[Math.floor(Math.random() * TRAITS.length)]] : [],
          claimStrength: 70 + Math.floor(Math.random() * 30),
        };
      }

      let newTechnologies = prev.technologies.map(tech => {
        if (tech.researching && tech.turnsRemaining > 0) {
          const remaining = tech.turnsRemaining - 1;
          if (remaining <= 0) {
            summary.techCompleted = tech.name;
            return { ...tech, researched: true, researching: false, turnsRemaining: 0 };
          }
          return { ...tech, turnsRemaining: remaining };
        }
        return tech;
      });

      const researchedTechIds = newTechnologies.filter(t => t.researched).map(t => t.id);
      const newUnlocked = getUnlockedBlueprintIds(researchedTechIds);
      const freshlyUnlocked = newUnlocked.filter(id => !prev.unlockedBlueprints.includes(id));
      const unlockLogs: string[] = [];
      freshlyUnlocked.forEach(bpId => {
        const bp = BUILDING_BLUEPRINTS.find(b => b.id === bpId);
        if (bp) {
          unlockLogs.push(`\ud83d\udd13 New blueprint unlocked: ${bp.name}`);
          console.log(`[Game] Blueprint unlocked: ${bp.name}`);
        }
      });

      const techBonuses = newTechnologies.filter(t => t.researched).reduce((acc, t) => {
        Object.entries(t.effects).forEach(([key, val]) => { acc[key] = (acc[key] || 0) + val; });
        return acc;
      }, {} as Record<string, number>);

      newResources.gold += (techBonuses.goldPerTurn || 0);
      newResources.food += (techBonuses.foodPerTurn || 0);
      newResources.military += (techBonuses.militaryPerTurn || 0);
      newResources.faith += (techBonuses.faithPerTurn || 0);

      const hasProfessionalArmy = newTechnologies.find(t => t.id === 'tech_professional_army')?.researched ?? false;
      let newArmies = prev.armies.map(army => {
        if (army.status === 'marching' && army.destination && army.marchTurnsLeft !== undefined) {
          const turnsLeft = army.marchTurnsLeft - 1;
          if (turnsLeft <= 0) {
            return { ...army, location: army.destination, status: 'idle' as const, destination: undefined, marchTurnsLeft: undefined };
          }
          if (hasProfessionalArmy && army.owner === 'player') {
            return { ...army, marchTurnsLeft: turnsLeft };
          }
          return { ...army, marchTurnsLeft: turnsLeft, morale: Math.max(10, army.morale - 3) };
        }
        if (army.status === 'idle') {
          return { ...army, morale: Math.min(100, army.morale + 3), troops: Math.min(army.maxTroops, army.troops + 5) };
        }
        return army;
      });

      let newProvinces = prev.provinces.map(p => {
        if (p.owner === 'player') {
          const popGrowth = Math.floor(p.population * 0.01 * (p.development / 100));
          return { ...p, population: p.population + popGrowth, garrison: Math.min(1000, p.garrison + 5) };
        }
        return p;
      });

      const siegingArmies = newArmies.filter(a => a.owner === 'player' && a.status === 'sieging');
      const newBattlesFromSiege: BattleResult[] = [];
      const resolvedSiegeProvinces = new Set<string>();
      siegingArmies.forEach(army => {
        if (resolvedSiegeProvinces.has(army.location)) return;
        const targetProvince = newProvinces.find(p => p.id === army.location && p.owner !== 'player');
        if (targetProvince) {
          const allSiegersHere = newArmies.filter(a => a.owner === 'player' && a.status === 'sieging' && a.location === army.location);
          const totalSiegeTroops = allSiegersHere.reduce((sum, a) => sum + a.troops, 0);
          const hasSiegeEngineering = newTechnologies.find(t => t.id === 'tech_siege_engineering')?.researched ?? false;
          const baseSiegeGain = 20 + Math.floor(totalSiegeTroops / 100);
          const siegeGain = hasSiegeEngineering ? Math.floor(baseSiegeGain * 1.5) : baseSiegeGain;
          const newSiegeProgress = (targetProvince.siegeProgress || 0) + siegeGain;
          if (newSiegeProgress >= 100) {
            resolvedSiegeProvinces.add(army.location);
            const defenderArmy: Army = {
              id: 'garrison_def', name: `Garrison of ${targetProvince.name}`, owner: targetProvince.owner,
              troops: targetProvince.garrison, maxTroops: targetProvince.garrison, morale: 50,
              commander: 'Local Captain', location: targetProvince.id, status: 'fighting',
            };
            const leadArmy = allSiegersHere.reduce((best, a) => a.troops > best.troops ? a : best, allSiegersHere[0]);
            const combinedArmy: Army = { ...leadArmy, troops: totalSiegeTroops, maxTroops: totalSiegeTroops };
            const battle = resolveBattle(combinedArmy, defenderArmy, 0, targetProvince, prev.activeTactic);
            battle.turn = nextTurn;
            newBattlesFromSiege.push(battle);

            if (battle.conquered) {
              const buildingBoosts = getBuildingBoosts(targetProvince.buildings);
              newResources = applyResourceBoosts(newResources, buildingBoosts);
              const boostText = formatResourceBoosts(buildingBoosts);
              newProvinces = newProvinces.map(p =>
                p.id === targetProvince.id ? claimProvinceForPlayer(p) : p
              );
              if (boostText) allLogs.unshift(`🏗️ Captured ${targetProvince.name}'s buildings: ${boostText}`);
              const lossPerArmy = Math.ceil(battle.attackerLosses / allSiegersHere.length);
              const siegeArmyIds = new Set(allSiegersHere.map(a => a.id));
              newArmies = newArmies.map(a =>
                siegeArmyIds.has(a.id) ? { ...a, status: 'idle' as const, troops: Math.max(50, a.troops - lossPerArmy), morale: Math.max(20, a.morale - 10) } : a
              );
              summary.provincesConquered.push(targetProvince.name);
              summary.battlesWon++;
            } else {
              const lossPerArmy = Math.ceil(battle.attackerLosses / allSiegersHere.length);
              const siegeArmyIds = new Set(allSiegersHere.map(a => a.id));
              newArmies = newArmies.map(a =>
                siegeArmyIds.has(a.id) ? { ...a, status: 'retreating' as const, troops: Math.max(50, a.troops - lossPerArmy), morale: Math.max(10, a.morale - 25) } : a
              );
              newProvinces = newProvinces.map(p =>
                p.id === targetProvince.id ? { ...p, underSiege: false, siegeProgress: 0, siegeAttacker: undefined, garrison: Math.max(20, p.garrison - battle.defenderLosses) } : p
              );
              summary.battlesLost++;
            }
          } else {
            newProvinces = newProvinces.map(p =>
              p.id === targetProvince.id ? { ...p, siegeProgress: newSiegeProgress } : p
            );
          }
        }
      });

      newArmies = newArmies.map(a => a.status === 'retreating' ? { ...a, status: 'idle' as const } : a);

      const hasDivineRight = newTechnologies.find(t => t.id === 'tech_divine_right')?.researched ?? false;
      if (hasDivineRight) {
        newProvinces = newProvinces.map(p => {
          if (p.owner === 'player') {
            return {
              ...p,
              loyalty: Math.min(100, (p.loyalty ?? 80) + 2),
              unrest: Math.max(0, (p.unrest ?? 0) - 2),
            };
          }
          return p;
        });
      }
      const { provinces: unrestProvinces, revoltLogs, revoltEvents } = processProvinceUnrest(newProvinces, nextTurn);
      newProvinces = unrestProvinces;
      summary.revolts = revoltLogs;

      const aiResult = processAITurn(prev.kingdoms, newProvinces, newArmies, nextTurn, prev.difficulty);
      let newKingdoms = aiResult.kingdoms;
      newProvinces = aiResult.provinces;
      const aiBattles = aiResult.newBattles.map(b => ({ ...b, turn: nextTurn }));
      summary.aiActions = aiResult.logs;

      aiBattles.forEach(battle => {
        const defArmy = newArmies.find(a => a.location === battle.provinceId);
        if (defArmy) {
          newArmies = newArmies.map(a =>
            a.id === defArmy.id ? { ...a, troops: Math.max(10, a.troops - battle.defenderLosses), morale: Math.max(10, a.morale - 15) } : a
          );
        }
        if (battle.conquered) {
          summary.provincesLost.push(battle.provinceName);
          summary.battlesLost++;
        } else {
          summary.battlesWon++;
        }
      });

      newKingdoms = newKingdoms.map(k => ({
        ...k,
        provinces: newProvinces.filter(p => p.owner === k.id).map(p => p.id),
        strength: k.armies.reduce((sum, a) => sum + a.troops, 0) + newProvinces.filter(p => p.owner === k.id).reduce((sum, p) => sum + p.garrison, 0),
      }));

      let newCouncil = prev.council.map(c => {
        const loyaltyDrift = Math.floor(Math.random() * 5) - 2;
        let updatedCouncilor = { ...c, loyalty: Math.max(0, Math.min(100, c.loyalty + loyaltyDrift)) };
        if (updatedCouncilor.activeUpgrade) {
          const upgrade = { ...updatedCouncilor.activeUpgrade };
          upgrade.turnsRemaining -= 1;
          if (upgrade.turnsRemaining <= 0) {
            updatedCouncilor = { ...updatedCouncilor, skill: updatedCouncilor.skill + 2, activeUpgrade: undefined };
          } else {
            updatedCouncilor = { ...updatedCouncilor, activeUpgrade: upgrade };
          }
        }
        return updatedCouncilor;
      });

      let newEvents = [...prev.events, ...aiResult.newEvents.map(e => ({ ...e, turn: nextTurn })), ...revoltEvents];

      const pendingChains: PendingChainEvent[] = prev.pendingChainEvents ?? [];
      const triggeredChains = pendingChains.filter(pc => pc.triggerTurn <= nextTurn);
      const remainingChains = pendingChains.filter(pc => pc.triggerTurn > nextTurn);
      triggeredChains.forEach(pc => {
        const followUp = getFollowUpEvent(pc.eventId);
        if (followUp) {
          const chainEvt: GameEvent = {
            ...followUp,
            id: `${followUp.id}_${nextTurn}`,
            turn: nextTurn,
            seen: false,
          };
          newEvents.push(chainEvt);
          summary.eventsTriggered.push(followUp.title);
          console.log(`[Game] Chain event triggered: ${followUp.title}`);
        }
      });

      if (Math.random() > 0.4) {
        const classicPool = RANDOM_EVENTS.filter(e => !prev.events.some(ex => ex.id === e.id));
        const narrativePool = getStandaloneNarrativeEvents().filter(e => !prev.events.some(ex => ex.id.startsWith(e.id)));
        const combinedPool = [...classicPool, ...narrativePool];
        if (combinedPool.length > 0) {
          const picked = combinedPool[Math.floor(Math.random() * combinedPool.length)];
          newEvents.push({ ...picked, id: `${picked.id}_${nextTurn}`, turn: nextTurn, seen: false });
          summary.eventsTriggered.push(picked.title);
        }
      }

      const traitEvent = generateTraitEvent(newRuler, newEvents, nextTurn);
      if (traitEvent) {
        newEvents.push(traitEvent);
        summary.eventsTriggered.push(traitEvent.title);
        console.log(`[Game] Trait event triggered: ${traitEvent.title}`);
      }

      const betrayalResult = checkCouncilBetrayal(newCouncil, newEvents, nextTurn);
      if (betrayalResult.event) {
        newEvents.push(betrayalResult.event);
        summary.eventsTriggered.push(betrayalResult.event.title);
        console.log(`[Game] Council betrayal event triggered`);
      }

      if (heirComingOfAge && newHeir) {
        const coaTemplate = getFollowUpEvent('narr_heir_coming_of_age');
        if (coaTemplate) {
          newEvents.push({
            ...coaTemplate,
            id: `narr_heir_coming_of_age_${nextTurn}`,
            turn: nextTurn,
            seen: false,
            description: `${newHeir.name} has reached their sixteenth nameday. The realm watches with anticipation as the young royal must choose their path in life. This decision will shape their future and your dynasty.`,
          });
          summary.eventsTriggered.push('Coming of Age');
        }
      }

      if (newResources.food <= 0) {
        newEvents.push({
          id: `famine_${nextTurn}`, title: 'Famine!', description: 'Your people are starving! Food reserves have been depleted.',
          type: 'economic', turn: nextTurn, seen: false,
          choices: [
            { id: `fam1_${nextTurn}`, text: 'Buy emergency supplies', effects: '+50 Food', cost: { gold: 200 }, reward: { food: 50 } },
            { id: `fam2_${nextTurn}`, text: 'Endure the suffering', effects: '-1000 population across provinces' },
          ],
        });
      }

      // Spy mission progress
      let activeSpyMission = prev.activeSpyMission;
      if (activeSpyMission) {
        activeSpyMission = { ...activeSpyMission, turnsRemaining: activeSpyMission.turnsRemaining - 1 };
        if (activeSpyMission.turnsRemaining <= 0) {
          const mission = SPY_MISSIONS.find(m => m.id === activeSpyMission!.missionId);
          const spymaster = newCouncil.find(c => c.role === 'spymaster');
          const intrigueBonus = (prev.ruler.intrigue + (spymaster?.skill ?? 0)) / 2;
          const successChance = (mission?.successChance ?? 50) + intrigueBonus;
          const success = Math.random() * 100 < successChance;

          if (success && mission) {
            let spyLog = `🕵️ Spy mission "${mission.name}" succeeded!`;
            switch (mission.id) {
              case 'spy_steal_gold': {
                const stolen = 200 + Math.floor(Math.random() * 200);
                newResources.gold += stolen;
                spyLog += ` Stole ${stolen} gold!`;
                break;
              }
              case 'spy_sabotage': {
                newProvinces = newProvinces.map(p =>
                  p.id === activeSpyMission!.targetId ? { ...p, garrison: Math.floor(p.garrison * 0.5) } : p
                );
                spyLog += ' Garrison halved!';
                break;
              }
              case 'spy_assassinate': {
                const targetKingdom = newKingdoms.find(k => k.id === activeSpyMission!.targetId);
                if (targetKingdom) {
                  newKingdoms = newKingdoms.map(k =>
                    k.id === targetKingdom.id
                      ? { ...k, ruler: { ...k.ruler, health: Math.max(10, k.ruler.health - 40) } }
                      : k
                  );
                  spyLog += ` ${targetKingdom.ruler.name} was wounded!`;
                }
                break;
              }
              case 'spy_incite_revolt': {
                newProvinces = newProvinces.map(p =>
                  p.id === activeSpyMission!.targetId ? { ...p, unrest: Math.min(100, (p.unrest ?? 0) + 50), loyalty: Math.max(0, (p.loyalty ?? 80) - 30) } : p
                );
                spyLog += ' Unrest rising!';
                break;
              }
              case 'spy_intelligence':
                spyLog += ' Enemy army details revealed!';
                break;
              case 'spy_counter':
                spyLog += ' Enemy spies rooted out!';
                break;
            }
            summary.spyResults.push(spyLog);
          } else {
            const failLog = `🕵️ Spy mission "${mission?.name}" failed! Relations damaged.`;
            summary.spyResults.push(failLog);
            if (activeSpyMission.targetId) {
              newKingdoms = newKingdoms.map(k =>
                k.id === activeSpyMission!.targetId ? { ...k, relation: Math.max(-100, k.relation - 15) } : k
              );
            }
          }
          activeSpyMission = undefined;
        }
      }

      const councilBonuses = newCouncil.reduce((acc, c) => {
        if (c.loyalty > 60) {
          const bonus = Math.floor(c.skill / 5);
          switch (c.role) {
            case 'marshal': acc.military = (acc.military || 0) + bonus; break;
            case 'steward': acc.gold = (acc.gold || 0) + bonus; break;
            case 'chaplain': acc.faith = (acc.faith || 0) + bonus; break;
            case 'chancellor': acc.diplomacy = (acc.diplomacy || 0) + bonus; break;
          }
        }
        return acc;
      }, {} as Record<string, number>);
      newResources.gold += councilBonuses.gold || 0;
      newResources.faith += councilBonuses.faith || 0;
      newResources.military += councilBonuses.military || 0;

      const newFaithCooldowns: Record<string, number> = {};
      Object.entries(prev.faithCooldowns).forEach(([key, val]) => {
        if (val > 1) newFaithCooldowns[key] = val - 1;
      });

      const pressureResult = processKingdomPressures(
        prev.pressures,
        newProvinces,
        newResources,
        nextTurn,
        newCouncil,
      );
      newResources.gold = Math.max(0, newResources.gold + (pressureResult.resourcePenalties.gold ?? 0));
      newResources.food = Math.max(0, newResources.food + (pressureResult.resourcePenalties.food ?? 0));
      newResources.military = Math.max(0, newResources.military + (pressureResult.resourcePenalties.military ?? 0));
      newProvinces = newProvinces.map(p => {
        const loyaltyHit = pressureResult.loyaltyPenalties[p.id];
        if (loyaltyHit && p.owner === 'player') {
          return { ...p, loyalty: Math.max(0, Math.min(100, (p.loyalty ?? 80) + loyaltyHit)), unrest: Math.min(100, (p.unrest ?? 0) + Math.abs(loyaltyHit)) };
        }
        if (pressureResult.pressures.plague.active && pressureResult.pressures.plague.infectedProvinces.includes(p.id) && p.owner === 'player') {
          const popLoss = Math.floor(pressureResult.pressures.plague.severity * 2);
          return { ...p, population: Math.max(100, p.population - popLoss) };
        }
        return p;
      });
      newEvents.push(...pressureResult.events);

      const allBattles = [...prev.battles, ...newBattlesFromSiege, ...aiBattles].slice(-20);
      const allLogs = [
        ...unlockLogs,
        ...(heirEduCompleteLog ? [heirEduCompleteLog] : []),
        ...(heirComingOfAge && newHeir ? [`🎂 ${newHeir.name} has come of age! Choose their path.`] : []),
        ...(betrayalResult.event ? [`⚠️ A councilor has betrayed you!`] : []),
        ...(summary.techCompleted ? [`📚 Research complete: ${summary.techCompleted}`] : []),
        ...pressureResult.logs,
        ...summary.spyResults,
        ...aiResult.logs,
        ...revoltLogs,
        ...newBattlesFromSiege.map(b => b.conquered ? `⚔️ Conquered ${b.provinceName}!` : `❌ Siege of ${b.provinceName} failed`),
        `Year ${nextYear}, ${nextSeason} — Turn ${nextTurn}. +${prev.resources.goldPerTurn}g, +${prev.resources.foodPerTurn}f ${seasonEffect.description}`,
        ...prev.log,
      ].slice(0, 50);

      const playerProvCount = newProvinces.filter(p => p.owner === 'player').length;
      let gameOver = false;
      let gameOverReason: string | undefined;
      let victory = false;
      let victoryType: string | undefined;

      if (playerProvCount === 0) {
        gameOver = true;
        gameOverReason = 'All your provinces have been conquered. Your dynasty has fallen.';
      }

      let newReignChronicles = prev.reignChronicles ?? [];
      let latestReignChronicle: ReignChronicle | undefined;
      let rulerStartTurn = prev.rulerStartTurn ?? 1;
      let rulerStartYear = prev.rulerStartYear ?? 1066;
      let rulerPeakProvinces = Math.max(prev.rulerPeakProvinces ?? 0, playerProvCount);
      let rulerPeakGold = Math.max(prev.rulerPeakGold ?? 0, newResources.gold);
      let rulerBuildingsConstructed = prev.rulerBuildingsConstructed ?? 0;
      let rulerTechResearched = prev.rulerTechResearched ?? 0;
      let rulerWarsFought = prev.rulerWarsFought ?? 0;
      let rulerBattlesWon = (prev.rulerBattlesWon ?? 0) + summary.battlesWon;
      let rulerBattlesLost = (prev.rulerBattlesLost ?? 0) + summary.battlesLost;
      let rulerProvincesConquered = (prev.rulerProvincesConquered ?? 0) + summary.provincesConquered.length;
      let rulerProvincesLost = (prev.rulerProvincesLost ?? 0) + summary.provincesLost.length;

      const newWarsThisTurn = prev.kingdoms.filter(k => k.attitude !== 'war').filter(k2 => {
        const updated = newKingdoms.find(nk => nk.id === k2.id);
        return updated && updated.attitude === 'war';
      }).length;
      rulerWarsFought += newWarsThisTurn;

      if (summary.techCompleted) rulerTechResearched += 1;

      let freshPressures: KingdomPressures | undefined;
      if (newRuler.health <= 0) {
        const chronicle = buildReignChronicle(
          { ...prev, rulerPeakProvinces, rulerPeakGold, rulerBuildingsConstructed, rulerTechResearched, rulerWarsFought, rulerBattlesWon, rulerBattlesLost, rulerProvincesConquered, rulerProvincesLost },
          nextTurn, nextYear,
          prev.ruler.age >= 65 ? 'old age' : prev.ruler.health <= 10 ? 'illness' : 'natural causes',
        );
        newReignChronicles = [...newReignChronicles, chronicle];
        latestReignChronicle = chronicle;
        console.log(`[Game] Reign chronicle generated for ${chronicle.legacyTitle}`);

        if (newHeir && newHeir.age >= 16 && newHeir.claimStrength > 40) {
          const heirName = newHeir.name;
          newRuler = {
            id: `ruler_${nextTurn}`, name: heirName, dynasty: prev.ruler.dynasty,
            age: newHeir.age, health: 80 + Math.floor(Math.random() * 20), maxHealth: 100,
            diplomacy: newHeir.diplomacy, martial: newHeir.martial,
            stewardship: newHeir.stewardship, intrigue: newHeir.intrigue, learning: newHeir.learning,
            traits: newHeir.traits, avatar: '👤',
          };
          newHeir = null;
          newEvents = newEvents.filter(e => e.id.startsWith(`succession_${nextTurn}`) || e.turn >= nextTurn);
          newCouncil = newCouncil.map(c => ({ ...c, task: undefined }));
          freshPressures = getEmptyPressures();
          allLogs.unshift(`👑 ${prev.ruler.name} has died. Long live ${newRuler.name}! Pressures and ruler tasks have been cleared for a fresh reign.`);
          newEvents.push({
            id: `succession_${nextTurn}`, title: 'Succession',
            description: `${prev.ruler.name} has passed away. ${newRuler.name} ascends to the throne.`,
            type: 'personal', turn: nextTurn, seen: false,
            choices: [
              { id: `suc1_${nextTurn}`, text: 'Hold a grand coronation', effects: '+30 Faith, +relations', cost: { gold: 200 }, reward: { faith: 30 } },
              { id: `suc2_${nextTurn}`, text: 'A quiet ceremony', effects: 'Save gold, less prestige' },
            ],
          });
          rulerStartTurn = nextTurn;
          rulerStartYear = nextYear;
          rulerPeakProvinces = playerProvCount;
          rulerPeakGold = newResources.gold;
          rulerBuildingsConstructed = 0;
          rulerTechResearched = 0;
          rulerWarsFought = 0;
          rulerBattlesWon = 0;
          rulerBattlesLost = 0;
          rulerProvincesConquered = 0;
          rulerProvincesLost = 0;
        } else {
          gameOver = true;
          gameOverReason = `${prev.ruler.name} has died with no suitable heir. Your dynasty has ended.`;
        }
      }

      const totalProvinces = newProvinces.length;
      if (playerProvCount >= totalProvinces) {
        victory = true;
        victoryType = 'Conquest Victory — You have united all lands under your banner!';
      } else if (playerProvCount >= Math.ceil(totalProvinces * 0.7) && prev.turn >= 50) {
        victory = true;
        victoryType = 'Domination Victory — Your realm is the greatest power in the land!';
      } else if (newTechnologies.every(t => t.researched) && nextTurn >= 50) {
        victory = true;
        victoryType = 'Cultural Victory — Your scholars have mastered all knowledge!';
      } else if (newResources.faith >= 1000) {
        victory = true;
        victoryType = 'Faith Victory — The divine light of your realm illuminates all!';
      }

      let newAchievements = prev.achievements;
      const tempState: GameState = {
        ...prev, turn: nextTurn, resources: newResources, provinces: newProvinces, armies: newArmies,
        kingdoms: newKingdoms, battles: allBattles, technologies: newTechnologies, activeTrades,
        achievements: newAchievements,
      };
      newAchievements = checkAchievements(tempState);

      const hasRoyalArchives = newTechnologies.find(t => t.id === 'tech_royal_archives')?.researched ?? false;
      const newRumors = generateRumors(
        newKingdoms, newProvinces, nextTurn,
        !!prev.activeSpyMission,
        prev.activeSpyMission?.targetId
      );
      const boostedRumors = hasRoyalArchives
        ? newRumors.map(r => ({ ...r, accuracy: Math.min(100, r.accuracy + 20) }))
        : newRumors;
      const allRumors = [...boostedRumors, ...prev.rumors].slice(0, 15);
      summary.rumorsHeard = boostedRumors.map(r => r.description);

      const legacyState: GameState = {
        ...prev,
        turn: nextTurn, ruler: newRuler, provinces: newProvinces,
        resources: newResources, kingdoms: newKingdoms, battles: allBattles,
        technologies: newTechnologies, armies: newArmies,
      } as GameState;
      newRuler = { ...newRuler, legacyTitles: computeLegacyTitles(legacyState) };

      const newState = {
        ...prev,
        turn: nextTurn, year: nextYear, season: nextSeason,
        ruler: newRuler, heir: newHeir,
        resources: newResources, provinces: newProvinces, armies: newArmies,
        kingdoms: newKingdoms, events: newEvents, battles: allBattles,
        technologies: newTechnologies, council: newCouncil,
        log: allLogs, gameOver, gameOverReason, victory, victoryType,
        activeTrades, activeSpyMission,
        achievements: newAchievements,
        lastTurnSummary: summary,
        faithCooldowns: newFaithCooldowns,
        pendingChainEvents: remainingChains,
        rumors: allRumors,
        pressures: typeof freshPressures !== 'undefined' ? freshPressures : pressureResult.pressures,
        reignChronicles: newReignChronicles,
        latestReignChronicle: latestReignChronicle,
        rulerStartTurn,
        rulerStartYear,
        rulerPeakProvinces,
        rulerPeakGold,
        rulerBuildingsConstructed,
        rulerTechResearched,
        rulerWarsFought,
        rulerBattlesWon,
        rulerBattlesLost,
        rulerProvincesConquered,
        rulerProvincesLost,
        unlockedBlueprints: newUnlocked,
      } as GameState;
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const resolveEvent = useCallback((eventId: string, choice: EventChoice) => {
    setState(prev => {
      const newResources = { ...prev.resources };
      if (choice.cost) {
        if (choice.cost.gold) newResources.gold -= choice.cost.gold;
        if (choice.cost.food) newResources.food -= choice.cost.food;
        if (choice.cost.military) newResources.military -= choice.cost.military;
        if (choice.cost.faith) newResources.faith -= choice.cost.faith;
      }
      if (choice.reward) {
        if (choice.reward.gold) newResources.gold += choice.reward.gold;
        if (choice.reward.food) newResources.food += choice.reward.food;
        if (choice.reward.military) newResources.military += choice.reward.military;
        if (choice.reward.faith) newResources.faith += choice.reward.faith;
      }
      const newEvents = prev.events.map(e => e.id === eventId ? { ...e, seen: true } : e);
      const evt = prev.events.find(e => e.id === eventId);
      const logEntry = `Event: ${evt?.title ?? 'Unknown'} — chose "${choice.text}"`;

      let newHeir = prev.heir ? { ...prev.heir } : null;
      let newRuler = { ...prev.ruler };
      let newCouncil = [...prev.council];
      let newProvinces = [...prev.provinces];

      if (choice.id === 'hcoa_warrior' && newHeir) {
        newHeir = { ...newHeir, path: 'warrior' as HeirPath, martial: newHeir.martial + 5, claimStrength: Math.min(100, newHeir.claimStrength + 3) };
      } else if (choice.id === 'hcoa_scholar' && newHeir) {
        newHeir = { ...newHeir, path: 'scholar' as HeirPath, learning: newHeir.learning + 5, stewardship: newHeir.stewardship + 2 };
      } else if (choice.id === 'hcoa_diplomat' && newHeir) {
        newHeir = { ...newHeir, path: 'diplomat' as HeirPath, diplomacy: newHeir.diplomacy + 5, intrigue: newHeir.intrigue + 2 };
      }

      if (choice.id.startsWith('cbm_') || choice.id.startsWith('cbs_') || choice.id.startsWith('cbspy_') || choice.id.startsWith('cbc_') || choice.id.startsWith('cbch_')) {
        const roleMap: Record<string, string> = { cbm: 'marshal', cbs: 'steward', cbspy: 'spymaster', cbc: 'chaplain', cbch: 'chancellor' };
        const prefix = choice.id.split('_')[0];
        const targetRole = roleMap[prefix];
        if (targetRole) {
          if (choice.id.includes('execute') || choice.id.includes('arrest') || choice.id.includes('eliminate') || choice.id.includes('trial') || choice.id.includes('dismiss') || choice.id.includes('punish') || choice.id.includes('replace')) {
            const betrayer = newCouncil.find(c => c.role === targetRole);
            if (betrayer) {
              const replacementNames: Record<string, string> = {
                marshal: 'Sir Roland', steward: 'Lord Ambrose', spymaster: 'Shadow Kael',
                chaplain: 'Father Benedict', chancellor: 'Lady Meridia',
              };
              newCouncil = newCouncil.map(c =>
                c.id === betrayer.id
                  ? { ...c, name: replacementNames[targetRole] ?? 'New Councilor', skill: Math.max(5, c.skill - 4), loyalty: 60 + Math.floor(Math.random() * 30), activeUpgrade: undefined, task: undefined }
                  : c
              );
            }
          } else if (choice.id.includes('forgive') || choice.id.includes('deal') || choice.id.includes('turn') || choice.id.includes('confront') || choice.id.includes('reform') || choice.id.includes('demote') || choice.id.includes('leverage')) {
            const betrayer = newCouncil.find(c => c.role === targetRole);
            if (betrayer) {
              const newLoyalty = choice.id.includes('demote') ? 40 : choice.id.includes('confront') ? 35 : 50;
              const skillPenalty = choice.id.includes('demote') ? Math.floor(betrayer.skill / 2) : choice.id.includes('confront') ? 3 : 0;
              newCouncil = newCouncil.map(c =>
                c.id === betrayer.id
                  ? { ...c, loyalty: newLoyalty, skill: Math.max(3, c.skill - skillPenalty) }
                  : c
              );
            }
          }
        }
      }

      let pendingChains: PendingChainEvent[] = [...(prev.pendingChainEvents ?? [])];
      if (choice.followUpEventId && choice.followUpDelay) {
        pendingChains.push({
          eventId: choice.followUpEventId,
          triggerTurn: prev.turn + choice.followUpDelay,
        });
        console.log(`[Game] Scheduled chain event: ${choice.followUpEventId} in ${choice.followUpDelay} turns`);
      }

      const newState = {
        ...prev, resources: newResources, events: newEvents,
        heir: newHeir, ruler: newRuler, council: newCouncil, provinces: newProvinces,
        log: [logEntry, ...prev.log].slice(0, 50),
        pendingChainEvents: pendingChains,
      } as GameState;
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const recruitArmy = useCallback((provinceId: string, troops: number) => {
    setState(prev => {
      const cost = troops * 2;
      if (prev.resources.gold < cost || prev.resources.military < troops) return prev;
      const province = prev.provinces.find(p => p.id === provinceId);
      const commander = COMMANDER_NAMES[Math.floor(Math.random() * COMMANDER_NAMES.length)];
      const newArmy: Army = {
        id: `army_${Date.now()}`, name: `Levy of ${province?.name ?? 'Unknown'}`,
        owner: 'player', troops, maxTroops: troops + 200, morale: 70,
        commander, location: provinceId, status: 'idle',
      };
      const newState: GameState = {
        ...prev,
        resources: { ...prev.resources, gold: prev.resources.gold - cost, military: prev.resources.military - troops },
        armies: [...prev.armies, newArmy],
        log: [`Recruited ${troops} soldiers at ${newArmy.name}`, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const moveArmy = useCallback((armyId: string, destinationId: string) => {
    setState(prev => {
      const army = prev.armies.find(a => a.id === armyId);
      if (!army || army.status !== 'idle') return prev;
      const currentProvince = prev.provinces.find(p => p.id === army.location);
      if (!currentProvince || !currentProvince.connectedTo.includes(destinationId)) return prev;
      const destination = prev.provinces.find(p => p.id === destinationId);
      if (!destination) return prev;

      const isEnemyTerritory = destination.owner !== 'player';
      const newStatus = isEnemyTerritory ? 'sieging' as const : 'marching' as const;
      const newArmies = prev.armies.map(a =>
        a.id === armyId
          ? { ...a, status: newStatus, destination: destinationId, marchTurnsLeft: isEnemyTerritory ? 0 : 1, location: isEnemyTerritory ? destinationId : a.location }
          : a
      );
      let newProvinces = prev.provinces;
      if (isEnemyTerritory) {
        newProvinces = prev.provinces.map(p =>
          p.id === destinationId ? { ...p, underSiege: true, siegeProgress: 0, siegeAttacker: 'player' } : p
        );
      }
      const logMsg = isEnemyTerritory
        ? `⚔️ ${army.name} begins siege of ${destination.name}!`
        : `🚶 ${army.name} marches to ${destination.name}`;
      const newState: GameState = { ...prev, armies: newArmies, provinces: newProvinces, log: [logMsg, ...prev.log].slice(0, 50) };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const attackProvince = useCallback((armyId: string, provinceId: string) => {
    setState(prev => {
      const army = prev.armies.find(a => a.id === armyId);
      const province = prev.provinces.find(p => p.id === provinceId);
      if (!army || !province || province.owner === 'player') return prev;

      const defenderArmy: Army = {
        id: 'def_garrison', name: `Garrison of ${province.name}`, owner: province.owner,
        troops: province.garrison, maxTroops: province.garrison, morale: 60,
        commander: 'Local Captain', location: province.id, status: 'fighting',
      };
      const ownerKingdom = prev.kingdoms.find(k => k.id === province.owner);
      const ownerArmy = ownerKingdom?.armies.find(a => a.location === province.id);
      const totalDefender = ownerArmy
        ? { ...ownerArmy, troops: ownerArmy.troops + province.garrison }
        : defenderArmy;

      const battle = resolveBattle(army, totalDefender, 0, province, prev.activeTactic);
      battle.turn = prev.turn;

      let newArmies = prev.armies.map(a =>
        a.id === armyId
          ? {
              ...a, troops: Math.max(50, a.troops - battle.attackerLosses),
              morale: Math.max(10, a.morale - (battle.conquered ? 5 : 20)),
              status: battle.conquered ? 'idle' as const : 'retreating' as const,
              location: battle.conquered ? province.id : a.location,
            }
          : a
      );
      let newProvinces = prev.provinces;
      let newKingdoms = prev.kingdoms;

      if (battle.conquered) {
        const buildingBoosts = getBuildingBoosts(province.buildings);
        const boostText = formatResourceBoosts(buildingBoosts);
        const boostedResources = applyResourceBoosts(prev.resources, buildingBoosts);
        newProvinces = prev.provinces.map(p =>
          p.id === province.id ? claimProvinceForPlayer(p) : p
        );
        newKingdoms = prev.kingdoms.map(k =>
          k.id === province.owner ? { ...k, provinces: k.provinces.filter(pid => pid !== province.id), warScore: (k.warScore ?? 0) - 25 } : k
        );
        if (ownerKingdom && ownerArmy) {
          newKingdoms = newKingdoms.map(k =>
            k.id === ownerKingdom.id
              ? { ...k, armies: k.armies.map(a => a.id === ownerArmy.id ? { ...a, troops: Math.max(20, a.troops - battle.defenderLosses) } : a) }
              : k
          );
        }
      }

      const logMsg = battle.conquered
        ? `⚔️ VICTORY! ${army.name} conquered ${province.name}!${boostText ? ` Captured building boosts: ${boostText}.` : ''}`
        : `❌ ${army.name} failed to take ${province.name}`;

      const newState: GameState = {
        ...prev, armies: newArmies, provinces: newProvinces, kingdoms: newKingdoms,
        resources: battle.conquered ? boostedResources : prev.resources,
        battles: [...prev.battles, battle].slice(-20),
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const upgradeBuilding = useCallback((provinceId: string, buildingId: string) => {
    setState(prev => {
      const province = prev.provinces.find(p => p.id === provinceId);
      const building = province?.buildings.find(b => b.id === buildingId);
      if (!province || !building || building.level >= building.maxLevel) return prev;
      const upgradeCost = Math.floor((building.cost.gold ?? 100) * (1 + building.level * 0.5));
      if (prev.resources.gold < upgradeCost) return prev;
      const newProvinces = prev.provinces.map(p => {
        if (p.id !== provinceId) return p;
        return { ...p, buildings: p.buildings.map(b => b.id !== buildingId ? b : { ...b, level: b.level + 1 }), development: Math.min(100, p.development + 2) };
      });
      const logEntry = `🏗️ Upgraded ${building.name} to level ${building.level + 1} in ${province.name}`;
      const newState: GameState = {
        ...prev, resources: { ...prev.resources, gold: prev.resources.gold - upgradeCost },
        provinces: newProvinces, log: [logEntry, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const constructBuilding = useCallback((provinceId: string, blueprintId: string) => {
    setState(prev => {
      const province = prev.provinces.find(p => p.id === provinceId);
      const blueprint = BUILDING_BLUEPRINTS.find(b => b.id === blueprintId);
      if (!province || !blueprint) return prev;
      if (province.owner !== 'player') return prev;
      if (prev.resources.gold < blueprint.baseCost) return prev;
      if (province.buildings.length >= 5) return prev;
      const newBuilding: Building = {
        id: `built_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name: blueprint.name, level: 1, maxLevel: blueprint.maxLevel,
        description: blueprint.description, cost: { gold: blueprint.baseCost },
        production: blueprint.production, icon: blueprint.icon,
      };
      const newProvinces = prev.provinces.map(p =>
        p.id === provinceId ? { ...p, buildings: [...p.buildings, newBuilding], development: Math.min(100, p.development + 3) } : p
      );
      const logEntry = `🏗️ Built ${blueprint.name} in ${province.name}`;
      const newState: GameState = {
        ...prev, resources: { ...prev.resources, gold: prev.resources.gold - blueprint.baseCost },
        provinces: newProvinces, log: [logEntry, ...prev.log].slice(0, 50),
        rulerBuildingsConstructed: (prev.rulerBuildingsConstructed ?? 0) + 1,
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const startResearch = useCallback((techId: string) => {
    setState(prev => {
      const tech = prev.technologies.find(t => t.id === techId);
      if (!tech || tech.researched || tech.researching) return prev;
      if (prev.resources.gold < tech.cost) return prev;
      const alreadyResearching = prev.technologies.some(t => t.researching);
      if (alreadyResearching) return prev;
      if (tech.requires) {
        const prereqsMet = tech.requires.every(reqId => prev.technologies.find(t => t.id === reqId)?.researched);
        if (!prereqsMet) return prev;
      }
      const learningBonus = Math.max(0, Math.floor((prev.ruler.learning - 10) / 3));
      const adjustedTurns = Math.max(1, tech.turnsToResearch - learningBonus);
      const newTechnologies = prev.technologies.map(t =>
        t.id === techId ? { ...t, researching: true, turnsRemaining: adjustedTurns } : t
      );
      const logEntry = `📚 Began researching ${tech.name} (${adjustedTurns} turns)`;
      const newState: GameState = {
        ...prev, resources: { ...prev.resources, gold: prev.resources.gold - tech.cost },
        technologies: newTechnologies, log: [logEntry, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const sendDiplomacy = useCallback((kingdomId: string, action: 'gift' | 'threaten' | 'ally' | 'declare_war' | 'peace' | 'demand_tribute' | 'propose_marriage' | 'call_to_war') => {
    setState(prev => {
      const kingdom = prev.kingdoms.find(k => k.id === kingdomId);
      if (!kingdom) return prev;
      let relationChange = 0;
      let goldCost = 0;
      let logMsg = '';
      let goldGain = 0;

      switch (action) {
        case 'gift': goldCost = 100; relationChange = 15; logMsg = `Sent gifts to ${kingdom.name} (+${relationChange} relations)`; break;
        case 'threaten': relationChange = -20; logMsg = `Threatened ${kingdom.name} (${relationChange} relations)`; break;
        case 'ally': goldCost = 200; relationChange = 30; logMsg = `Proposed alliance to ${kingdom.name}`; break;
        case 'declare_war': relationChange = -50; logMsg = `🔥 DECLARED WAR on ${kingdom.name}!`; break;
        case 'peace': goldCost = 150; relationChange = 20; logMsg = `☮️ Offered peace to ${kingdom.name}`; break;
        case 'demand_tribute':
          if (kingdom.attitude === 'war' && (kingdom.warScore ?? 0) <= -30) {
            goldGain = 300;
            relationChange = -10;
            logMsg = `💰 Demanded tribute from ${kingdom.name} (+${goldGain}g)`;
          } else {
            return prev;
          }
          break;
        case 'propose_marriage':
          if (prev.ruler.spouse) return prev;
          goldCost = 150;
          relationChange = 25;
          logMsg = `💍 Marriage pact sealed with ${kingdom.name}. Heirs may now be born.`;
          break;
        case 'call_to_war':
          if (kingdom.attitude !== 'allied') return prev;
          relationChange = -10;
          logMsg = `📯 Called ${kingdom.name} to war. Your ally musters against your enemies.`;
          break;
      }
      if (prev.resources.gold < goldCost) return prev;
      const warTargets = prev.kingdoms.filter(k => k.attitude === 'war').map(k => k.id);
      const marriageBonus = action === 'propose_marriage' ? {
        spouse: `Consort of ${kingdom.name}`,
        spouseBonuses: { diplomacy: 2, goldPerTurn: 3 },
      } : {};
      const newKingdoms = prev.kingdoms.map(k => {
        if (k.id !== kingdomId) return k;
        const newRelation = Math.max(-100, Math.min(100, k.relation + relationChange));
        let newAttitude = k.attitude;
        if (action === 'declare_war') { newAttitude = 'war'; }
        else if (action === 'call_to_war') { newAttitude = 'allied'; }
        else if (action === 'peace' && k.attitude === 'war' && newRelation > -30) { newAttitude = 'hostile'; }
        else if ((action === 'ally' || action === 'propose_marriage') && newRelation > 30) { newAttitude = 'allied'; }
        else if (action !== 'demand_tribute') {
          if (newRelation > 50) newAttitude = 'friendly';
          else if (newRelation > 0) newAttitude = 'neutral';
          else if (newRelation > -50) newAttitude = 'hostile';
        }
        return { ...k, relation: newRelation, attitude: newAttitude, warScore: action === 'peace' ? 0 : k.warScore, allyOf: action === 'call_to_war' ? [...new Set([...(k.allyOf ?? []), ...warTargets])] : k.allyOf };
      });
      const newState: GameState = {
        ...prev,
        resources: { ...prev.resources, gold: prev.resources.gold - goldCost + goldGain, goldPerTurn: prev.resources.goldPerTurn + (action === 'propose_marriage' ? 3 : 0) },
        ruler: { ...prev.ruler, ...marriageBonus },
        kingdoms: newKingdoms,
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const claimNeutralProvince = useCallback((provinceId: string, method: 'lay_claim' | 'send_troops') => {
    setState(prev => {
      const province = prev.provinces.find(p => p.id === provinceId);
      if (!province || province.owner !== 'neutral') return prev;
      const cost = method === 'lay_claim' ? { gold: 120, faith: 20, military: 0 } : { gold: 40, faith: 0, military: Math.max(80, Math.floor(province.garrison * 0.75)) };
      if (prev.resources.gold < cost.gold || prev.resources.faith < cost.faith || prev.resources.military < cost.military) return prev;
      const successChance = method === 'lay_claim'
        ? Math.min(90, 55 + Math.floor(prev.ruler.diplomacy * 1.5) + Math.floor(prev.ruler.stewardship))
        : Math.min(95, 65 + Math.floor(prev.ruler.martial * 1.2));
      const success = Math.random() * 100 <= successChance;
      const newResources: Resources = { ...prev.resources, gold: prev.resources.gold - cost.gold, faith: prev.resources.faith - cost.faith, military: prev.resources.military - cost.military };
      const newProvinces = success
        ? prev.provinces.map(p => p.id === provinceId ? claimProvinceForPlayer(p) : p)
        : prev.provinces.map(p => p.id === provinceId ? { ...p, unrest: Math.min(100, (p.unrest ?? 0) + 10), garrison: Math.max(25, p.garrison - Math.floor(cost.military / 2)) } : p);
      const logMsg = success
        ? (method === 'lay_claim' ? `⚑ Your envoys laid lawful claim to ${province.name}.` : `⚔️ Troops secured unclaimed ${province.name}.`)
        : (method === 'lay_claim' ? `⚑ ${province.name} rejected your claim for now.` : `⚔️ Your troops failed to secure ${province.name}.`);
      const newState: GameState = { ...prev, resources: newResources, provinces: newProvinces, log: [logMsg, ...prev.log].slice(0, 50) };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const reinforceArmy = useCallback((armyId: string, troops: number) => {
    setState(prev => {
      const army = prev.armies.find(a => a.id === armyId);
      if (!army) return prev;
      const maxReinforce = army.maxTroops - army.troops;
      const actual = Math.min(troops, maxReinforce);
      if (actual <= 0) return prev;
      const goldCost = actual * 2;
      if (prev.resources.gold < goldCost || prev.resources.military < actual) return prev;
      const newArmies = prev.armies.map(a =>
        a.id === armyId ? { ...a, troops: a.troops + actual } : a
      );
      const logMsg = `🛡️ Reinforced ${army.name} with ${actual} troops`;
      const newState: GameState = {
        ...prev,
        armies: newArmies,
        resources: { ...prev.resources, gold: prev.resources.gold - goldCost, military: prev.resources.military - actual },
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const disbandArmy = useCallback((armyId: string) => {
    setState(prev => {
      const army = prev.armies.find(a => a.id === armyId);
      if (!army) return prev;
      const recovered = Math.floor(army.troops * 0.3);
      const newArmies = prev.armies.filter(a => a.id !== armyId);
      const logMsg = `🏳️ Disbanded ${army.name}. Recovered ${recovered} military points.`;
      const newState: GameState = {
        ...prev,
        armies: newArmies,
        resources: { ...prev.resources, military: prev.resources.military + recovered },
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const reinforceGarrison = useCallback((provinceId: string, amount: number) => {
    setState(prev => {
      const province = prev.provinces.find(p => p.id === provinceId);
      if (!province || province.owner !== 'player') return prev;
      const goldCost = amount;
      if (prev.resources.gold < goldCost || prev.resources.military < amount) return prev;
      const newProvinces = prev.provinces.map(p =>
        p.id === provinceId ? { ...p, garrison: Math.min(1000, p.garrison + amount) } : p
      );
      const logMsg = `🏰 Reinforced garrison at ${province.name} with ${amount} troops`;
      const newState: GameState = {
        ...prev,
        provinces: newProvinces,
        resources: { ...prev.resources, gold: prev.resources.gold - goldCost, military: prev.resources.military - amount },
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const mergeArmies = useCallback((armyId1: string, armyId2: string) => {
    setState(prev => {
      const army1 = prev.armies.find(a => a.id === armyId1);
      const army2 = prev.armies.find(a => a.id === armyId2);
      if (!army1 || !army2) return prev;
      if (army1.location !== army2.location) return prev;
      if (army1.status !== 'idle' || army2.status !== 'idle') return prev;
      const mergedTroops = army1.troops + army2.troops;
      const mergedMaxTroops = army1.maxTroops + army2.maxTroops;
      const mergedMorale = Math.round((army1.morale * army1.troops + army2.morale * army2.troops) / mergedTroops);
      const mergedArmy: Army = {
        ...army1,
        troops: mergedTroops,
        maxTroops: mergedMaxTroops,
        morale: mergedMorale,
        name: `${army1.name} (Combined)`,
      };
      const newArmies = prev.armies.filter(a => a.id !== armyId2).map(a => a.id === armyId1 ? mergedArmy : a);
      const logMsg = `⚔️ Merged ${army2.name} into ${army1.name} (${mergedTroops} troops)`;
      const newState: GameState = { ...prev, armies: newArmies, log: [logMsg, ...prev.log].slice(0, 50) };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const educateHeir = useCallback((stat: 'diplomacy' | 'martial' | 'stewardship' | 'intrigue' | 'learning') => {
    setState(prev => {
      if (!prev.heir) return prev;
      if (prev.heir.activeEducation) return prev;
      const cost = 120;
      if (prev.resources.gold < cost) return prev;
      const bonus = 3;
      const turns = 4;
      const education: HeirEducation = { stat, turnsRemaining: turns, totalTurns: turns, bonus };
      const newHeir = { ...prev.heir, activeEducation: education };
      const logMsg = `📖 Began heir education: ${stat} (+${bonus}, ${turns} turns)`;
      const newState: GameState = {
        ...prev,
        heir: newHeir,
        resources: { ...prev.resources, gold: prev.resources.gold - cost },
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const assignCouncilTask = useCallback((councilId: string, task: string) => {
    setState(prev => {
      const newCouncil = prev.council.map(c => c.id === councilId ? { ...c, task } : c);
      const logEntry = `📋 Assigned ${prev.council.find(c => c.id === councilId)?.name ?? 'councilor'} to ${task}`;
      const newState: GameState = { ...prev, council: newCouncil, log: [logEntry, ...prev.log].slice(0, 50) };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const reduceCorruption = useCallback((method: 'gold' | 'faith') => {
    setState(prev => {
      if (method === 'gold') {
        const cost = 200;
        if (prev.resources.gold < cost) return prev;
        const reduction = 15 + Math.floor(prev.ruler.stewardship / 3);
        const newCorruption = Math.max(0, prev.pressures.corruption - reduction);
        const logMsg = `🏛️ Anti-corruption measures enacted (-${reduction}% corruption, -${cost}g)`;
        const newState: GameState = {
          ...prev,
          resources: { ...prev.resources, gold: prev.resources.gold - cost },
          pressures: { ...prev.pressures, corruption: newCorruption },
          log: [logMsg, ...prev.log].slice(0, 50),
        };
        saveMutation.mutate(newState);
        return newState;
      } else {
        const cost = 40;
        if (prev.resources.faith < cost) return prev;
        const reduction = 10 + Math.floor(prev.ruler.learning / 4);
        const newCorruption = Math.max(0, prev.pressures.corruption - reduction);
        const logMsg = `🕯️ Religious purification reduces corruption (-${reduction}%)`;
        const newState: GameState = {
          ...prev,
          resources: { ...prev.resources, faith: prev.resources.faith - cost },
          pressures: { ...prev.pressures, corruption: newCorruption },
          log: [logMsg, ...prev.log].slice(0, 50),
        };
        saveMutation.mutate(newState);
        return newState;
      }
    });
  }, [saveMutation]);

  const resolveNobleDispute = useCallback((disputeId: string, action: 'grant' | 'refuse' | 'imprison') => {
    setState(prev => {
      const dispute = prev.pressures.nobleDisputes.find(d => d.id === disputeId);
      if (!dispute || dispute.resolved) return prev;
      let logMsg = '';
      let newProvinces = [...prev.provinces];
      let newResources = { ...prev.resources };
      switch (action) {
        case 'grant':
          if (newResources.gold < 150) return prev;
          newResources.gold -= 150;
          newProvinces = newProvinces.map(p =>
            p.id === dispute.province ? { ...p, loyalty: Math.min(100, (p.loyalty ?? 80) + 15) } : p
          );
          logMsg = `👑 Granted ${dispute.nobleName}'s demands (+loyalty, -150g)`;
          break;
        case 'refuse':
          newProvinces = newProvinces.map(p =>
            p.id === dispute.province ? { ...p, loyalty: Math.max(0, (p.loyalty ?? 80) - dispute.loyaltyPenalty), unrest: Math.min(100, (p.unrest ?? 0) + 15) } : p
          );
          logMsg = `👑 Refused ${dispute.nobleName}'s demands (-loyalty)`;
          break;
        case 'imprison':
          if (newResources.military < 30) return prev;
          newResources.military -= 30;
          newProvinces = newProvinces.map(p =>
            p.id === dispute.province ? { ...p, loyalty: Math.max(0, (p.loyalty ?? 80) - 10), unrest: Math.min(100, (p.unrest ?? 0) + 10) } : p
          );
          logMsg = `⛓️ Imprisoned ${dispute.nobleName}! Order restored.`;
          break;
      }
      const updatedDisputes = prev.pressures.nobleDisputes.map(d =>
        d.id === disputeId ? { ...d, resolved: true } : d
      );
      const newState: GameState = {
        ...prev,
        resources: newResources,
        provinces: newProvinces,
        pressures: { ...prev.pressures, nobleDisputes: updatedDisputes },
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const setHeirPath = useCallback((path: HeirPath) => {
    setState(prev => {
      if (!prev.heir) return prev;
      let newHeir = { ...prev.heir, path };
      let logMsg = '';
      switch (path) {
        case 'warrior':
          newHeir = { ...newHeir, martial: newHeir.martial + 5, claimStrength: Math.min(100, newHeir.claimStrength + 3) };
          logMsg = `⚔️ ${newHeir.name} chose the Path of the Warrior! (+5 Martial, +3 claim)`;
          break;
        case 'scholar':
          newHeir = { ...newHeir, learning: newHeir.learning + 5, stewardship: newHeir.stewardship + 2 };
          logMsg = `📖 ${newHeir.name} chose the Path of the Scholar! (+5 Learning, +2 Stewardship)`;
          break;
        case 'diplomat':
          newHeir = { ...newHeir, diplomacy: newHeir.diplomacy + 5, intrigue: newHeir.intrigue + 2 };
          logMsg = `🤝 ${newHeir.name} chose the Path of the Diplomat! (+5 Diplomacy, +2 Intrigue)`;
          break;
      }
      const newState: GameState = {
        ...prev,
        heir: newHeir,
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const containPlague = useCallback(() => {
    setState(prev => {
      if (!prev.pressures.plague.active) return prev;
      const cost = 150;
      if (prev.resources.gold < cost) return prev;
      const newPlague = { ...prev.pressures.plague, contained: true, severity: Math.max(0, prev.pressures.plague.severity - 15) };
      let logMsg = '🩺 Quarantine measures enacted! Plague containment efforts underway.';
      if (newPlague.severity <= 0) {
        const clearedPlague = { active: false, severity: 0, infectedProvinces: [] as string[], turnStarted: 0, contained: false };
        logMsg = '💚 Plague successfully eradicated through quarantine!';
        const newState: GameState = {
          ...prev,
          resources: { ...prev.resources, gold: prev.resources.gold - cost },
          pressures: { ...prev.pressures, plague: clearedPlague },
          log: [logMsg, ...prev.log].slice(0, 50),
        };
        saveMutation.mutate(newState);
        return newState;
      }
      const newState: GameState = {
        ...prev,
        resources: { ...prev.resources, gold: prev.resources.gold - cost },
        pressures: { ...prev.pressures, plague: newPlague },
        log: [logMsg, ...prev.log].slice(0, 50),
      };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const dismissReignChronicle = useCallback(() => {
    setState(prev => {
      if (!prev.latestReignChronicle) return prev;
      const newState: GameState = { ...prev, latestReignChronicle: undefined };
      saveMutation.mutate(newState);
      return newState;
    });
  }, [saveMutation]);

  const resetGame = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({ ...defaultState, gameStarted: false });
  }, []);

  const unseenEvents = useMemo(() => state.events.filter(e => !e.seen), [state.events]);
  const playerProvinces = useMemo(() => state.provinces.filter(p => p.owner === 'player'), [state.provinces]);
  const activeWars = useMemo(() => state.kingdoms.filter(k => k.attitude === 'war'), [state.kingdoms]);
  const recentBattles = useMemo(() => state.battles.filter(b => b.turn >= state.turn - 3), [state.battles, state.turn]);
  const currentResearch = useMemo(() => state.technologies.find(t => t.researching), [state.technologies]);
  const newAchievements = useMemo(() => state.achievements.filter(a => a.unlocked && a.unlockedTurn === state.turn), [state.achievements, state.turn]);

  const winProbability = useMemo(() => {
    const tactic = getTacticModifiers(state.activeTactic);
    const baseWinRate = 50;
    const attackBonus = tactic.attackModifier * 0.3;
    const defBonus = tactic.defenseModifier * 0.2;
    return Math.max(5, Math.min(95, Math.round(baseWinRate + attackBonus + defBonus)));
  }, [state.activeTactic]);

  const visibilityMap = useMemo<VisibilityMap>(() => {
    return computeVisibility(state.provinces, state.armies, state.activeSpyMission);
  }, [state.provinces, state.armies, state.activeSpyMission]);

  return useMemo(() => ({
    state, isLoaded, advanceTurn, resolveEvent, recruitArmy, moveArmy,
    attackProvince, upgradeBuilding, constructBuilding, startResearch,
    sendDiplomacy, claimNeutralProvince, assignCouncilTask, resetGame, unseenEvents,
    playerProvinces, activeWars, recentBattles, currentResearch,
    selectKingdom, setActiveTactic, startRulerUpgrade, startCouncilorUpgrade,
    winProbability, startSpyMission, proposeTrade, useFaithAction,
    dismissTutorial, newAchievements, reinforceArmy, disbandArmy, reinforceGarrison,
    arrangeMarriage, mergeArmies, educateHeir,
    visibilityMap, investigateRumor, dismissRumor,
    reduceCorruption, resolveNobleDispute, containPlague, setHeirPath,
    dismissReignChronicle,
  }), [
    state, isLoaded, advanceTurn, resolveEvent, recruitArmy, moveArmy,
    attackProvince, upgradeBuilding, constructBuilding, startResearch,
    sendDiplomacy, claimNeutralProvince, assignCouncilTask, resetGame, unseenEvents,
    playerProvinces, activeWars, recentBattles, currentResearch,
    selectKingdom, setActiveTactic, startRulerUpgrade, startCouncilorUpgrade,
    winProbability, startSpyMission, proposeTrade, useFaithAction,
    dismissTutorial, newAchievements, reinforceArmy, disbandArmy, reinforceGarrison,
    arrangeMarriage, mergeArmies, educateHeir,
    visibilityMap, investigateRumor, dismissRumor,
    reduceCorruption, resolveNobleDispute, containPlague, setHeirPath,
    dismissReignChronicle,
  ]);
});
