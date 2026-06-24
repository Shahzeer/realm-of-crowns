import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, PrestigeRecord } from '@/types/game';

const PRESTIGE_KEY = 'realm_of_crowns_prestige_records';

export function calculatePrestigeScore(state: GameState, outcome: PrestigeRecord['outcome']): number {
  let score = 0;

  score += state.turn * 8;

  const peakProvinces = state.rulerPeakProvinces ?? state.provinces.filter(p => p.owner === 'player').length;
  score += peakProvinces * 120;

  const outcomeBonus: Record<PrestigeRecord['outcome'], number> = {
    conquest:   3000,
    domination: 2200,
    cultural:   1800,
    faith:      1500,
    defeat:     0,
  };
  score += outcomeBonus[outcome];

  const diffMult: Record<string, number> = { easy: 0.7, normal: 1.0, hard: 1.4 };
  score = Math.round(score * (diffMult[state.difficulty] ?? 1.0));

  const techResearched = state.technologies.filter(t => t.researched).length;
  score += techResearched * 80;

  const battlesWon = state.rulerBattlesWon ?? 0;
  score += battlesWon * 50;

  const allies = state.kingdoms.filter(k => k.attitude === 'allied').length;
  score += allies * 100;

  const councilStats = state.council.reduce((s, c) => s + (c.skill ?? 0), 0);
  score += councilStats * 15;

  const achievementsUnlocked = state.achievements.filter(a => a.unlocked).length;
  score += achievementsUnlocked * 60;

  if (outcome !== 'defeat' && state.turn < 80) {
    const efficiencyBonus = Math.max(0, (80 - state.turn) * 30);
    score += efficiencyBonus;
  }

  return Math.max(0, score);
}

export function buildPrestigeRecord(
  state: GameState,
  outcome: PrestigeRecord['outcome'],
  victoryType?: string,
  causeOfDeath?: string,
): PrestigeRecord {
  const peakProvinces = state.rulerPeakProvinces ?? state.provinces.filter(p => p.owner === 'player').length;
  return {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dynastyName: state.ruler.dynasty,
    rulerName: state.ruler.name,
    outcome,
    victoryType,
    causeOfDeath,
    turnCount: state.turn,
    peakProvinces,
    finalScore: calculatePrestigeScore(state, outcome),
    datePlayed: new Date().toLocaleDateString(),
    difficulty: state.difficulty,
  };
}

export async function savePrestigeRecord(record: PrestigeRecord): Promise<void> {
  try {
    const existing = await loadPrestigeRecords();
    const updated = [record, ...existing].slice(0, 50);
    await AsyncStorage.setItem(PRESTIGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[Prestige] Failed to save record:', e);
  }
}

export async function loadPrestigeRecords(): Promise<PrestigeRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(PRESTIGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrestigeRecord[];
  } catch (e) {
    console.warn('[Prestige] Failed to load records:', e);
    return [];
  }
}
