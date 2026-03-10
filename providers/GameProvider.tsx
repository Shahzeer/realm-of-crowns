import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { getDeviceId, loadCloudSave, saveToCloud, deleteCloudSave } from '@/utils/supabase';
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
  Building,
  StatUpgrade,
  CombatTactic,
  KingdomChoice,
  ActiveTrade,
  ActiveSpyMission,
  TurnSummary,
  Achievement,
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
} from '@/mocks/gameData';

const STORAGE_KEY = 'realm_of_crowns_save';
const CLOUD_SAVE_DEBOUNCE_MS = 2000;

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
};

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

  return {
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

function processAIKingdomGrowth(kingdom: Kingdom, provinces: Province[], turn: number, difficulty: string): {
  kingdom: Kingdom;
  provinces: Province[];
  logs: string[];
} {
  let updatedKingdom = { ...kingdom };
  let updatedProvinces = [...provinces];
  const logs: string[] = [];
  const ownedProvinces = updatedProvinces.filter(p => p.owner === kingdom.id);

  const diffMod = difficulty === 'hard' ? 1.4 : difficulty === 'easy' ? 0.7 : 1.0;
  const scaleMod = 1 + (turn / 100) * diffMod;

  if (updatedKingdom.treasury >= 200 * (1 / diffMod) && Math.random() > 0.4) {
    const buildTarget = ownedProvinces.find(p => p.buildings.length < 4);
    if (buildTarget) {
      const bp = AI_BUILDING_POOL[Math.floor(Math.random() * AI_BUILDING_POOL.length)];
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
        const cost = (building.cost.gold ?? 100) * (building.level + 1);
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

  const recruitChance = difficulty === 'hard' ? 0.5 : difficulty === 'easy' ? 0.8 : 0.65;
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

  if (updatedKingdom.treasury >= 500 && updatedKingdom.armies.length < 3 && Math.random() > 0.75) {
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

    const drift = Math.floor(Math.random() * 7) - 3;
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

  // AI alliances
  if (Math.random() > 0.85) {
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

      if (playerBorderProvinces.length > 0 && Math.random() > 0.5) {
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

    if (kingdom.attitude !== 'war' && Math.random() > 0.92) {
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

    const warThreshold = difficulty === 'hard' ? 0.6 : difficulty === 'easy' ? 0.85 : 0.7;
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
  let provinces = ALL_PROVINCES.map(p => {
    if (choice.startingProvinces.includes(p.id)) {
      return { ...p, owner: 'player', loyalty: 90, unrest: 0 };
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
    if (choice.id !== 'ironforge' && k.id === 'ironforge') return k;
    return { ...k, provinces: provinces.filter(p => p.owner === k.id).map(p => p.id) };
  });

  if (choice.id !== 'ironforge') {
    const ironforgeKingdom: Kingdom = {
      id: 'ironforge', name: 'Kingdom of Ironforge',
      ruler: { ...INITIAL_RULER, id: 'iron_ruler' },
      provinces: provinces.filter(p => p.owner === 'ironforge').map(p => p.id),
      relation: 0, attitude: 'neutral', color: '#d4a574', strength: 1500,
      armies: [
        { id: 'iron_army1', name: 'Royal Guard', owner: 'ironforge', troops: 800, maxTroops: 1200, morale: 90, commander: 'King Aldric', location: 'ironhold', status: 'idle' },
        { id: 'iron_army2', name: 'Northern Vanguard', owner: 'ironforge', troops: 450, maxTroops: 800, morale: 75, commander: 'Lord Cedric', location: 'stormwatch', status: 'idle' },
      ],
      treasury: 800, crest: '⚔️', description: 'A balanced kingdom with strong military tradition.',
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
  };
}

export const [GameProvider, useGame] = createContextHook(() => {
  const [state, setState] = React.useState<GameState>(defaultState);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [cloudStatus, setCloudStatus] = React.useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
  const deviceIdRef = useRef<string | null>(null);
  const cloudSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<GameState | null>(null);

  function mergeLoadedState(loaded: Partial<GameState>): GameState {
    return {
      ...defaultState,
      ...loaded,
      technologies: loaded.technologies ?? INITIAL_TECHNOLOGIES,
      council: loaded.council ?? INITIAL_COUNCIL,
      battles: loaded.battles ?? [],
      heir: loaded.heir ?? INITIAL_HEIR,
      gameOver: loaded.gameOver ?? false,
      victory: loaded.victory ?? false,
      gameStarted: loaded.gameStarted ?? false,
      activeTactic: loaded.activeTactic ?? 'balanced',
      activeTrades: loaded.activeTrades ?? [],
      achievements: loaded.achievements ?? INITIAL_ACHIEVEMENTS,
      faithCooldowns: loaded.faithCooldowns ?? {},
      tutorialSeen: loaded.tutorialSeen ?? false,
      difficulty: loaded.difficulty ?? 'normal',
    };
  }

  const loadQuery = useQuery({
    queryKey: ['game-save'],
    queryFn: async () => {
      const devId = await getDeviceId();
      deviceIdRef.current = devId;
      console.log('[Game] Device ID:', devId);

      let cloudState: Record<string, unknown> | null = null;
      try {
        cloudState = await loadCloudSave(devId);
        if (cloudState) {
          console.log('[Game] Found cloud save, turn:', (cloudState as { turn?: number }).turn);
          setCloudStatus('synced');
        }
      } catch (e) {
        console.warn('[Game] Cloud load failed, falling back to local:', e);
        setCloudStatus('offline');
      }

      let localState: GameState | null = null;
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) localState = JSON.parse(saved) as GameState;
      } catch (e) {
        console.warn('[Game] Local load failed:', e);
      }

      if (cloudState && localState) {
        const cloudTurn = (cloudState as { turn?: number }).turn ?? 0;
        const localTurn = localState.turn ?? 0;
        console.log(`[Game] Cloud turn: ${cloudTurn}, Local turn: ${localTurn}`);
        return cloudTurn >= localTurn ? (cloudState as unknown as GameState) : localState;
      }

      if (cloudState) return cloudState as unknown as GameState;
      if (localState) return localState;
      return null;
    },
  });

  const debouncedCloudSave = useCallback((gameState: GameState) => {
    pendingSaveRef.current = gameState;
    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = setTimeout(async () => {
      const toSave = pendingSaveRef.current;
      if (!toSave || !deviceIdRef.current) return;
      pendingSaveRef.current = null;
      setCloudStatus('syncing');
      const ok = await saveToCloud(deviceIdRef.current, toSave as unknown as Record<string, unknown>);
      setCloudStatus(ok ? 'synced' : 'offline');
      if (!ok) {
        console.warn('[Game] Cloud save failed, will retry on next save');
      }
    }, CLOUD_SAVE_DEBOUNCE_MS);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (gameState: GameState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
      debouncedCloudSave(gameState);
    },
  });

  useEffect(() => {
    if (loadQuery.data && !isLoaded) {
      console.log('[Game] Loaded save');
      const merged = mergeLoadedState(loadQuery.data);
      setState(merged);
      setIsLoaded(true);
    } else if (loadQuery.isSuccess && !loadQuery.data && !isLoaded) {
      console.log('[Game] No save found, using defaults');
      setIsLoaded(true);
    }
  }, [loadQuery.data, loadQuery.isSuccess, isLoaded]);

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

  const startSpyMission = useCallback((missionId: string, targetId: string) => {
    setState(prev => {
      if (prev.activeSpyMission) return prev;
      const mission = SPY_MISSIONS.find(m => m.id === missionId);
      if (!mission || prev.resources.gold < mission.cost) return prev;
      const spymaster = prev.council.find(c => c.role === 'spymaster');
      const intrigueBonus = Math.max(0, (prev.ruler.intrigue - 10) + ((spymaster?.skill ?? 0) - 10));
      const adjustedTurns = Math.max(1, mission.turnsToComplete - Math.floor(intrigueBonus / 5));
      const activeMission: ActiveSpyMission = {
        missionId, targetId, turnsRemaining: adjustedTurns, totalTurns: adjustedTurns,
      };
      const newState: GameState = {
        ...prev,
        activeSpyMission: activeMission,
        resources: { ...prev.resources, gold: prev.resources.gold - mission.cost },
        log: [`🕵️ Launched spy mission: ${mission.name}`, ...prev.log].slice(0, 50),
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
      if (candidate.learningBonus) bonuses.learningBonus = candidate.learningBonus;
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
        eventsTriggered: [], aiActions: [], revolts: [], tradeIncome: 0, spyResults: [],
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
      activeTrades.forEach(trade => {
        if (trade.turnsRemaining >= 0) {
          const receiveGold = trade.receive.gold ?? 0;
          const receiveFood = trade.receive.food ?? 0;
          const receiveMilitary = trade.receive.military ?? 0;
          const receiveFaith = trade.receive.faith ?? 0;
          const giveGold = trade.give.gold ?? 0;
          const giveFood = trade.give.food ?? 0;
          const giveMilitary = trade.give.military ?? 0;
          newResources.gold += receiveGold - giveGold;
          newResources.food += receiveFood - giveFood;
          newResources.military += receiveMilitary - giveMilitary;
          newResources.faith += receiveFaith;
          summary.tradeIncome += receiveGold - giveGold;
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

      if (newHeir?.activeEducation) {
        const edu = { ...newHeir.activeEducation };
        edu.turnsRemaining -= 1;
        if (edu.turnsRemaining <= 0) {
          newHeir = { ...newHeir, [edu.stat]: newHeir[edu.stat] + edu.bonus, activeEducation: undefined };
          allLogs.unshift(`📖 Heir ${newHeir.name} completed ${edu.stat} education (+${edu.bonus})`);
        } else {
          newHeir = { ...newHeir, activeEducation: edu };
        }
      }

      if (!newHeir && Math.random() > 0.85) {
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

      const techBonuses = newTechnologies.filter(t => t.researched).reduce((acc, t) => {
        Object.entries(t.effects).forEach(([key, val]) => { acc[key] = (acc[key] || 0) + val; });
        return acc;
      }, {} as Record<string, number>);

      newResources.gold += (techBonuses.goldPerTurn || 0);
      newResources.food += (techBonuses.foodPerTurn || 0);
      newResources.military += (techBonuses.militaryPerTurn || 0);
      newResources.faith += (techBonuses.faithPerTurn || 0);

      let newArmies = prev.armies.map(army => {
        if (army.status === 'marching' && army.destination && army.marchTurnsLeft !== undefined) {
          const turnsLeft = army.marchTurnsLeft - 1;
          if (turnsLeft <= 0) {
            return { ...army, location: army.destination, status: 'idle' as const, destination: undefined, marchTurnsLeft: undefined };
          }
          return { ...army, marchTurnsLeft: turnsLeft };
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
      siegingArmies.forEach(army => {
        const targetProvince = newProvinces.find(p => p.id === army.location && p.owner !== 'player');
        if (targetProvince) {
          const newSiegeProgress = (targetProvince.siegeProgress || 0) + 20 + Math.floor(army.troops / 100);
          if (newSiegeProgress >= 100) {
            const defenderArmy: Army = {
              id: 'garrison_def', name: `Garrison of ${targetProvince.name}`, owner: targetProvince.owner,
              troops: targetProvince.garrison, maxTroops: targetProvince.garrison, morale: 50,
              commander: 'Local Captain', location: targetProvince.id, status: 'fighting',
            };
            const battle = resolveBattle(army, defenderArmy, 0, targetProvince, prev.activeTactic);
            battle.turn = nextTurn;
            newBattlesFromSiege.push(battle);

            if (battle.conquered) {
              newProvinces = newProvinces.map(p =>
                p.id === targetProvince.id ? { ...p, owner: 'player', garrison: 50, underSiege: false, siegeProgress: 0, siegeAttacker: undefined, loyalty: 30, unrest: 40 } : p
              );
              newArmies = newArmies.map(a =>
                a.id === army.id ? { ...a, status: 'idle' as const, troops: Math.max(50, a.troops - battle.attackerLosses), morale: Math.max(20, a.morale - 10) } : a
              );
              summary.provincesConquered.push(targetProvince.name);
              summary.battlesWon++;
            } else {
              newArmies = newArmies.map(a =>
                a.id === army.id ? { ...a, status: 'retreating' as const, troops: Math.max(50, a.troops - battle.attackerLosses), morale: Math.max(10, a.morale - 25) } : a
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
      if (Math.random() > 0.4) {
        const pool = RANDOM_EVENTS.filter(e => !prev.events.some(ex => ex.id === e.id));
        if (pool.length > 0) {
          const picked = pool[Math.floor(Math.random() * pool.length)];
          newEvents.push({ ...picked, id: `${picked.id}_${nextTurn}`, turn: nextTurn, seen: false });
          summary.eventsTriggered.push(picked.title);
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

      const allBattles = [...prev.battles, ...newBattlesFromSiege, ...aiBattles].slice(-20);
      const allLogs = [
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

      if (newRuler.health <= 0) {
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
          allLogs.unshift(`👑 ${prev.ruler.name} has died. Long live ${newRuler.name}!`);
          newEvents.push({
            id: `succession_${nextTurn}`, title: 'Succession',
            description: `${prev.ruler.name} has passed away. ${newRuler.name} ascends to the throne.`,
            type: 'personal', turn: nextTurn, seen: false,
            choices: [
              { id: `suc1_${nextTurn}`, text: 'Hold a grand coronation', effects: '+30 Faith, +relations', cost: { gold: 200 }, reward: { faith: 30 } },
              { id: `suc2_${nextTurn}`, text: 'A quiet ceremony', effects: 'Save gold, less prestige' },
            ],
          });
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

      const newState: GameState = {
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
      };
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
      const newState: GameState = {
        ...prev, resources: newResources, events: newEvents,
        log: [logEntry, ...prev.log].slice(0, 50),
      };
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
        newProvinces = prev.provinces.map(p =>
          p.id === province.id ? { ...p, owner: 'player', garrison: 50, underSiege: false, siegeProgress: 0, siegeAttacker: undefined, loyalty: 30, unrest: 40 } : p
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
        ? `⚔️ VICTORY! ${army.name} conquered ${province.name}!`
        : `❌ ${army.name} failed to take ${province.name}`;

      const newState: GameState = {
        ...prev, armies: newArmies, provinces: newProvinces, kingdoms: newKingdoms,
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
      const upgradeCost = (building.cost.gold ?? 100) * (building.level + 1);
      if (prev.resources.gold < upgradeCost) return prev;
      const newProvinces = prev.provinces.map(p => {
        if (p.id !== provinceId) return p;
        return { ...p, buildings: p.buildings.map(b => b.id !== buildingId ? b : { ...b, level: b.level + 1 }), development: Math.min(100, p.development + 5) };
      });
      const logEntry = `Upgraded ${building.name} to level ${building.level + 1} in ${province.name}`;
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

  const sendDiplomacy = useCallback((kingdomId: string, action: 'gift' | 'threaten' | 'ally' | 'declare_war' | 'peace' | 'demand_tribute') => {
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
      }
      if (prev.resources.gold < goldCost) return prev;
      const newKingdoms = prev.kingdoms.map(k => {
        if (k.id !== kingdomId) return k;
        const newRelation = Math.max(-100, Math.min(100, k.relation + relationChange));
        let newAttitude = k.attitude;
        if (action === 'declare_war') { newAttitude = 'war'; }
        else if (action === 'peace' && k.attitude === 'war' && newRelation > -30) { newAttitude = 'hostile'; }
        else if (action === 'ally' && newRelation > 30) { newAttitude = 'allied'; }
        else if (action !== 'demand_tribute') {
          if (newRelation > 50) newAttitude = 'friendly';
          else if (newRelation > 0) newAttitude = 'neutral';
          else if (newRelation > -50) newAttitude = 'hostile';
        }
        return { ...k, relation: newRelation, attitude: newAttitude, warScore: action === 'peace' ? 0 : k.warScore };
      });
      const newState: GameState = {
        ...prev,
        resources: { ...prev.resources, gold: prev.resources.gold - goldCost + goldGain },
        kingdoms: newKingdoms,
        log: [logMsg, ...prev.log].slice(0, 50),
      };
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

  const resetGame = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    if (deviceIdRef.current) {
      await deleteCloudSave(deviceIdRef.current);
    }
    setState({ ...defaultState, gameStarted: false });
  }, []);

  const forceCloudSync = useCallback(async () => {
    if (!deviceIdRef.current) return false;
    setCloudStatus('syncing');
    const ok = await saveToCloud(deviceIdRef.current, state as unknown as Record<string, unknown>);
    setCloudStatus(ok ? 'synced' : 'offline');
    return ok;
  }, [state]);

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
    sendDiplomacy, assignCouncilTask, resetGame, unseenEvents,
    playerProvinces, activeWars, recentBattles, currentResearch,
    selectKingdom, setActiveTactic, startRulerUpgrade, startCouncilorUpgrade,
    winProbability, startSpyMission, proposeTrade, useFaithAction,
    dismissTutorial, newAchievements, reinforceArmy, disbandArmy, reinforceGarrison,
    arrangeMarriage, cloudStatus, forceCloudSync, mergeArmies, educateHeir,
    visibilityMap,
  }), [
    state, isLoaded, advanceTurn, resolveEvent, recruitArmy, moveArmy,
    attackProvince, upgradeBuilding, constructBuilding, startResearch,
    sendDiplomacy, assignCouncilTask, resetGame, unseenEvents,
    playerProvinces, activeWars, recentBattles, currentResearch,
    selectKingdom, setActiveTactic, startRulerUpgrade, startCouncilorUpgrade,
    winProbability, startSpyMission, proposeTrade, useFaithAction,
    dismissTutorial, newAchievements, reinforceArmy, disbandArmy, reinforceGarrison,
    arrangeMarriage, cloudStatus, forceCloudSync, mergeArmies, educateHeir,
    visibilityMap,
  ]);
});
