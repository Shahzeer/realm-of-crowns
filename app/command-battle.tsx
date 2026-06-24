import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Shield, Swords, ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/providers/GameProvider";

type UnitType = 'infantry' | 'cavalry' | 'archers';
type Lane = 0 | 1 | 2;
type Phase = 'select_unit' | 'select_action' | 'select_target' | 'select_lane' | 'processing' | 'battle_end';
type Action = 'attack' | 'move' | 'defend';

interface BattleUnit {
  id: string;
  type: UnitType;
  lane: Lane;
  hp: number;
  maxHp: number;
  isDefending: boolean;
  side: 'player' | 'enemy';
  acted: boolean;
}

const UNIT_META: Record<UnitType, { icon: string; name: string; color: string; desc: string }> = {
  infantry: { icon: '⚔️', name: 'Infantry', color: '#e2b84a', desc: 'Beats Cavalry' },
  cavalry:  { icon: '🐎', name: 'Cavalry',  color: '#a78bfa', desc: 'Beats Archers' },
  archers:  { icon: '🏹', name: 'Archers',  color: '#34d399', desc: 'Beats Infantry' },
};

const LANE_NAMES: Record<Lane, string> = { 0: 'Left Flank', 1: 'Center', 2: 'Right Flank' };

const COUNTERS: Record<UnitType, UnitType> = {
  infantry: 'cavalry',
  cavalry:  'archers',
  archers:  'infantry',
};

function getCounterMult(attacker: UnitType, target: UnitType): number {
  if (COUNTERS[attacker] === target) return 1.45;
  if (COUNTERS[target] === attacker) return 0.65;
  return 1.0;
}

function calcMorale(units: BattleUnit[], side: 'player' | 'enemy'): number {
  const side_units = units.filter(u => u.side === side);
  const total = side_units.reduce((s, u) => s + u.maxHp, 0);
  const current = side_units.filter(u => u.hp > 0).reduce((s, u) => s + u.hp, 0);
  return total > 0 ? Math.round((current / total) * 100) : 0;
}

function calcHpPct(units: BattleUnit[], side: 'player' | 'enemy'): number {
  const side_units = units.filter(u => u.side === side);
  const total = side_units.reduce((s, u) => s + u.maxHp, 0);
  const current = side_units.filter(u => u.hp > 0).reduce((s, u) => s + u.hp, 0);
  return total > 0 ? Math.round((current / total) * 100) : 0;
}

function initUnits(attackerMorale: number, defenderMorale: number): BattleUnit[] {
  const pMult = Math.min(1.1, Math.max(0.6, attackerMorale / 100));
  const eMult = Math.min(1.1, Math.max(0.6, defenderMorale / 100));
  return [
    { id: 'p0', type: 'cavalry',  lane: 0, hp: Math.round(100 * pMult), maxHp: Math.round(100 * pMult), isDefending: false, side: 'player', acted: false },
    { id: 'p1', type: 'infantry', lane: 1, hp: Math.round(100 * pMult), maxHp: Math.round(100 * pMult), isDefending: false, side: 'player', acted: false },
    { id: 'p2', type: 'archers',  lane: 2, hp: Math.round(100 * pMult), maxHp: Math.round(100 * pMult), isDefending: false, side: 'player', acted: false },
    { id: 'e0', type: 'archers',  lane: 0, hp: Math.round(100 * eMult), maxHp: Math.round(100 * eMult), isDefending: false, side: 'enemy',  acted: false },
    { id: 'e1', type: 'infantry', lane: 1, hp: Math.round(100 * eMult), maxHp: Math.round(100 * eMult), isDefending: false, side: 'enemy',  acted: false },
    { id: 'e2', type: 'cavalry',  lane: 2, hp: Math.round(100 * eMult), maxHp: Math.round(100 * eMult), isDefending: false, side: 'enemy',  acted: false },
  ];
}

function runEnemyAI(units: BattleUnit[], enemyMoraleMult: number): { newUnits: BattleUnit[]; logs: string[] } {
  const logs: string[] = [];
  let cur = units.map(u => ({ ...u }));
  const aliveEnemies = cur.filter(u => u.side === 'enemy' && u.hp > 0);

  for (const enemy of aliveEnemies) {
    const targetsInLane = cur.filter(u => u.side === 'player' && u.hp > 0 && u.lane === enemy.lane);
    const adjTargets = cur.filter(u => u.side === 'player' && u.hp > 0 && Math.abs(u.lane - enemy.lane) === 1);

    if (targetsInLane.length > 0) {
      // Prefer the unit we counter, otherwise pick weakest
      const target = targetsInLane.find(t => COUNTERS[enemy.type] === t.type) ?? targetsInLane.sort((a, b) => a.hp - b.hp)[0];
      const mult = getCounterMult(enemy.type, target.type);
      const defMult = target.isDefending ? 0.55 : 1.0;
      const dmg = Math.max(4, Math.round((18 + Math.floor(Math.random() * 18)) * mult * defMult * enemyMoraleMult));
      cur = cur.map(u => u.id === target.id ? { ...u, hp: Math.max(0, u.hp - dmg) } : u);
      logs.push(`${UNIT_META[enemy.type].icon} Enemy ${UNIT_META[enemy.type].name} attacks ${UNIT_META[target.type].name} for ${dmg} dmg`);
    } else if (adjTargets.length > 0) {
      // Move toward closest player unit
      const tgt = adjTargets[Math.floor(Math.random() * adjTargets.length)];
      const newLane = (enemy.lane < tgt.lane ? enemy.lane + 1 : enemy.lane - 1) as Lane;
      cur = cur.map(u => u.id === enemy.id ? { ...u, lane: newLane } : u);
      logs.push(`${UNIT_META[enemy.type].icon} Enemy ${UNIT_META[enemy.type].name} advances to ${LANE_NAMES[newLane]}`);
    } else {
      // Move toward any player unit
      const anyPlayer = cur.find(u => u.side === 'player' && u.hp > 0);
      if (anyPlayer) {
        const newLane = (enemy.lane < anyPlayer.lane ? Math.min(2, enemy.lane + 1) : enemy.lane > anyPlayer.lane ? Math.max(0, enemy.lane - 1) : enemy.lane) as Lane;
        cur = cur.map(u => u.id === enemy.id ? { ...u, lane: newLane } : u);
        if (newLane !== enemy.lane) logs.push(`${UNIT_META[enemy.type].icon} Enemy ${UNIT_META[enemy.type].name} repositions to ${LANE_NAMES[newLane]}`);
      }
    }
  }

  // Reset defending and acted flags
  cur = cur.map(u => ({ ...u, isDefending: u.side === 'player' ? false : u.isDefending, acted: false }));
  return { newUnits: cur, logs };
}

function UnitCard({
  unit, isSelected, isTargetable, onPress, showCounter
}: {
  unit: BattleUnit;
  isSelected: boolean;
  isTargetable: boolean;
  onPress: () => void;
  showCounter?: boolean;
}) {
  const meta = UNIT_META[unit.type];
  const hpPct = (unit.hp / unit.maxHp) * 100;
  const hpColor = hpPct > 60 ? Colors.status.success : hpPct > 30 ? Colors.status.warning : Colors.status.danger;
  const isDead = unit.hp <= 0;

  return (
    <TouchableOpacity
      style={[
        cb.unitCard,
        isSelected && cb.unitCardSelected,
        isTargetable && cb.unitCardTargetable,
        isDead && cb.unitCardDead,
        unit.acted && !isDead && cb.unitCardActed,
      ]}
      onPress={onPress}
      disabled={isDead}
      activeOpacity={0.75}
    >
      <Text style={[cb.unitIcon, isDead && { opacity: 0.3 }]}>{isDead ? '💀' : meta.icon}</Text>
      {!isDead && (
        <>
          <View style={cb.hpBarBg}>
            <View style={[cb.hpBarFill, { width: `${hpPct}%` as any, backgroundColor: hpColor }]} />
          </View>
          <Text style={[cb.unitHp, { color: hpColor }]}>{unit.hp}</Text>
          {unit.isDefending && <Text style={cb.defIcon}>🛡</Text>}
          {isSelected && <View style={cb.selectedRing} />}
          {isTargetable && <View style={cb.targetRing} />}
        </>
      )}
    </TouchableOpacity>
  );
}

export default function CommandBattleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, resolvePendingBattle, dismissPendingBattle } = useGame();
  const pb = state.pendingBattle;

  const [units, setUnits] = useState<BattleUnit[]>(() =>
    pb ? initUnits(pb.attackerMorale, pb.defenderMorale) : []
  );
  const [phase, setPhase] = useState<Phase>('select_unit');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [turn, setTurn] = useState(1);
  const [combatLog, setCombatLog] = useState<string[]>(['Battle begins! Select a unit to command.']);
  const [battleWinner, setBattleWinner] = useState<'player' | 'enemy' | null>(null);
  const [processing, setProcessing] = useState(false);
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pb) { router.back(); }
  }, []);

  const addLog = useCallback((entries: string[]) => {
    setCombatLog(prev => [...entries, ...prev].slice(0, 8));
  }, []);

  const flashScreen = useCallback((color: string) => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [flashAnim]);

  const checkWinCondition = useCallback((currentUnits: BattleUnit[], currentTurn: number): 'player' | 'enemy' | null => {
    const playerMorale = calcMorale(currentUnits, 'player');
    const enemyMorale = calcMorale(currentUnits, 'enemy');
    if (enemyMorale <= 0) return 'player';
    if (playerMorale <= 0) return 'enemy';
    if (currentTurn > 10) return playerMorale >= enemyMorale ? 'player' : 'enemy';
    return null;
  }, []);

  const endBattle = useCallback((winner: 'player' | 'enemy', currentUnits: BattleUnit[]) => {
    setBattleWinner(winner);
    setPhase('battle_end');
    const playerHpPct = calcHpPct(currentUnits, 'player');
    const enemyHpPct = calcHpPct(currentUnits, 'enemy');
    addLog([winner === 'player' ? '🏆 VICTORY! Your forces prevail!' : '💀 DEFEAT! Your army is routed!']);
    setTimeout(() => {
      resolvePendingBattle({ winner, playerHpPct, enemyHpPct });
    }, 2000);
  }, [resolvePendingBattle, addLog]);

  const runEnemyTurn = useCallback((currentUnits: BattleUnit[], nextTurn: number) => {
    setProcessing(true);
    const enemyMoraleMult = Math.min(1.1, Math.max(0.6, (pb?.defenderMorale ?? 70) / 100));
    setTimeout(() => {
      const { newUnits, logs } = runEnemyAI(currentUnits, enemyMoraleMult);
      setUnits(newUnits);
      addLog(logs.length > 0 ? logs : ['Enemy holds their position.']);
      flashScreen('#ef4444');
      setProcessing(false);
      const winner = checkWinCondition(newUnits, nextTurn);
      if (winner) {
        endBattle(winner, newUnits);
      } else {
        setTurn(nextTurn);
        setPhase('select_unit');
        setSelectedUnitId(null);
        setSelectedAction(null);
        addLog([`— Turn ${nextTurn} —`]);
      }
    }, 700);
  }, [pb, addLog, flashScreen, checkWinCondition, endBattle]);

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const playerMorale = calcMorale(units, 'player');
  const enemyMorale = calcMorale(units, 'enemy');

  const canAct = (unit: BattleUnit) =>
    unit.side === 'player' && unit.hp > 0 && !unit.acted && phase === 'select_unit';

  const canAttack = useCallback((unit: BattleUnit): boolean => {
    return units.some(u => u.side === 'enemy' && u.hp > 0 && (u.lane === unit.lane || Math.abs(u.lane - unit.lane) === 1));
  }, [units]);

  const handleUnitPress = useCallback((unit: BattleUnit) => {
    if (phase === 'battle_end' || processing) return;

    if (phase === 'select_unit' && canAct(unit)) {
      setSelectedUnitId(unit.id);
      setPhase('select_action');
      return;
    }

    if (phase === 'select_target' && unit.side === 'enemy' && unit.hp > 0 && selectedUnit) {
      // Perform attack
      const mult = getCounterMult(selectedUnit.type, unit.type);
      const defMult = unit.isDefending ? 0.55 : 1.0;
      const pMult = Math.min(1.1, Math.max(0.6, (pb?.attackerMorale ?? 75) / 100));
      const dmg = Math.max(5, Math.round((20 + Math.floor(Math.random() * 16)) * mult * defMult * pMult));
      const newUnits = units.map(u => u.id === unit.id ? { ...u, hp: Math.max(0, u.hp - dmg) } : u)
        .map(u => u.id === selectedUnitId ? { ...u, acted: true } : u);
      setUnits(newUnits);
      flashScreen(Colors.status.success);
      addLog([`${UNIT_META[selectedUnit.type].icon} Your ${UNIT_META[selectedUnit.type].name} strikes ${UNIT_META[unit.type].name} for ${dmg} dmg${mult > 1 ? ' (counter!)' : mult < 1 ? ' (weak)' : ''}`]);
      setSelectedUnitId(null);
      setSelectedAction(null);

      const allActed = newUnits.filter(u => u.side === 'player' && u.hp > 0).every(u => u.acted);
      if (allActed) {
        const winner = checkWinCondition(newUnits, turn);
        if (winner) { endBattle(winner, newUnits); } else { setPhase('processing'); runEnemyTurn(newUnits, turn + 1); }
      } else {
        setPhase('select_unit');
      }
    }
  }, [phase, processing, selectedUnit, selectedUnitId, units, pb, canAct, addLog, flashScreen, checkWinCondition, endBattle, runEnemyTurn, turn]);

  const handleActionSelect = useCallback((action: Action) => {
    if (!selectedUnit) return;
    setSelectedAction(action);

    if (action === 'defend') {
      const newUnits = units
        .map(u => u.id === selectedUnitId ? { ...u, isDefending: true, acted: true } : u);
      setUnits(newUnits);
      addLog([`🛡 Your ${UNIT_META[selectedUnit.type].name} takes a defensive stance`]);
      setSelectedUnitId(null);
      setSelectedAction(null);
      const allActed = newUnits.filter(u => u.side === 'player' && u.hp > 0).every(u => u.acted);
      if (allActed) {
        const winner = checkWinCondition(newUnits, turn);
        if (winner) { endBattle(winner, newUnits); } else { setPhase('processing'); runEnemyTurn(newUnits, turn + 1); }
      } else {
        setPhase('select_unit');
      }
    } else if (action === 'attack') {
      setPhase('select_target');
    } else if (action === 'move') {
      setPhase('select_lane');
    }
  }, [selectedUnit, selectedUnitId, units, addLog, checkWinCondition, endBattle, runEnemyTurn, turn]);

  const handleEndTurn = useCallback(() => {
    const newUnits = units.map(u => u.side === 'player' ? { ...u, acted: true } : u);
    setUnits(newUnits);
    setPhase('processing');
    setSelectedUnitId(null);
    setSelectedAction(null);
    runEnemyTurn(newUnits, turn + 1);
  }, [units, runEnemyTurn, turn]);

  const handleLaneSelect = useCallback((lane: Lane) => {
    if (!selectedUnit || phase !== 'select_lane') return;
    const newUnits = units
      .map(u => u.id === selectedUnitId ? { ...u, lane, acted: true } : u);
    setUnits(newUnits);
    addLog([`${UNIT_META[selectedUnit.type].icon} Your ${UNIT_META[selectedUnit.type].name} moves to ${LANE_NAMES[lane]}`]);
    setSelectedUnitId(null);
    setSelectedAction(null);
    const allActed = newUnits.filter(u => u.side === 'player' && u.hp > 0).every(u => u.acted);
    if (allActed) {
      const winner = checkWinCondition(newUnits, turn);
      if (winner) { endBattle(winner, newUnits); } else { setPhase('processing'); runEnemyTurn(newUnits, turn + 1); }
    } else {
      setPhase('select_unit');
    }
  }, [selectedUnit, selectedUnitId, units, phase, addLog, checkWinCondition, endBattle, runEnemyTurn, turn]);

  const targetableEnemies = phase === 'select_target' && selectedUnit
    ? units.filter(u => u.side === 'enemy' && u.hp > 0 && (u.lane === selectedUnit.lane || Math.abs(u.lane - selectedUnit.lane) === 1)).map(u => u.id)
    : [];

  const availableLanes: Lane[] = selectedUnit && phase === 'select_lane'
    ? ([0, 1, 2] as Lane[]).filter(l => l !== selectedUnit.lane && Math.abs(l - selectedUnit.lane) === 1)
    : [];

  if (!pb) {
    return (
      <View style={[cb.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.text.secondary }}>No battle in progress.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.gold.bright }}>Return</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[cb.root, { paddingTop: insets.top, opacity: flashAnim }]}>
      <LinearGradient colors={['#0a0f1a', '#12192a', '#0a0f1a']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={cb.header}>
        <View style={cb.bannerBox}>
          <Swords size={14} color={Colors.crimson.bright} />
          <Text style={cb.bannerText} numberOfLines={1}>{pb.attackerName}</Text>
          <Text style={cb.troopCount}>{pb.attackerTroops.toLocaleString()} troops</Text>
        </View>
        <View style={cb.turnBox}>
          <Text style={cb.turnLabel}>TURN</Text>
          <Text style={cb.turnNum}>{turn}</Text>
          <Text style={cb.turnLabel}>of 10</Text>
        </View>
        <View style={[cb.bannerBox, cb.bannerBoxRight]}>
          <Shield size={14} color={Colors.status.info} />
          <Text style={cb.bannerText} numberOfLines={1}>{pb.defenderName}</Text>
          <Text style={cb.troopCount}>{pb.defenderTroops.toLocaleString()} troops</Text>
        </View>
      </View>

      {/* Morale bars */}
      <View style={cb.moraleRow}>
        <View style={cb.moraleSection}>
          <Text style={cb.moraleLabel}>Your Morale</Text>
          <View style={cb.moraleBarBg}>
            <View style={[cb.moraleBarFill, {
              width: `${playerMorale}%` as any,
              backgroundColor: playerMorale > 50 ? Colors.status.success : playerMorale > 25 ? Colors.status.warning : Colors.status.danger
            }]} />
          </View>
          <Text style={cb.moralePct}>{playerMorale}%</Text>
        </View>
        <View style={cb.moraleDivider}>
          <Text style={cb.vsLabel}>VS</Text>
        </View>
        <View style={[cb.moraleSection, { alignItems: 'flex-end' }]}>
          <Text style={cb.moraleLabel}>Enemy Morale</Text>
          <View style={[cb.moraleBarBg, { transform: [{ scaleX: -1 }] }]}>
            <View style={[cb.moraleBarFill, {
              width: `${enemyMorale}%` as any,
              backgroundColor: enemyMorale > 50 ? Colors.status.danger : enemyMorale > 25 ? Colors.status.warning : Colors.status.success
            }]} />
          </View>
          <Text style={[cb.moralePct, { color: Colors.status.danger }]}>{enemyMorale}%</Text>
        </View>
      </View>

      {/* Lane grid */}
      <View style={cb.laneGrid}>
        {([0, 1, 2] as Lane[]).map(lane => {
          const playerUnits = units.filter(u => u.side === 'player' && u.lane === lane);
          const enemyUnits  = units.filter(u => u.side === 'enemy'  && u.lane === lane);
          const isAvailableLane = availableLanes.includes(lane);

          return (
            <TouchableOpacity
              key={lane}
              style={[cb.laneRow, isAvailableLane && cb.laneRowHighlight]}
              onPress={() => isAvailableLane ? handleLaneSelect(lane) : undefined}
              activeOpacity={isAvailableLane ? 0.7 : 1}
            >
              <View style={cb.lanePlayerSide}>
                {playerUnits.length > 0 ? playerUnits.map(u => (
                  <UnitCard
                    key={u.id}
                    unit={u}
                    isSelected={u.id === selectedUnitId}
                    isTargetable={false}
                    onPress={() => handleUnitPress(u)}
                  />
                )) : <View style={cb.emptySlot} />}
              </View>
              <View style={cb.laneLabel}>
                <Text style={cb.laneLabelText}>{LANE_NAMES[lane]}</Text>
                {isAvailableLane && <Text style={cb.laneArrow}>↔</Text>}
              </View>
              <View style={cb.laneEnemySide}>
                {enemyUnits.length > 0 ? enemyUnits.map(u => (
                  <UnitCard
                    key={u.id}
                    unit={u}
                    isSelected={false}
                    isTargetable={targetableEnemies.includes(u.id)}
                    onPress={() => handleUnitPress(u)}
                  />
                )) : <View style={cb.emptySlot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Combat log */}
      <View style={cb.logBox}>
        {combatLog.slice(0, 3).map((entry, i) => (
          <Text key={i} style={[cb.logEntry, i === 0 && cb.logEntryLatest]} numberOfLines={1}>{entry}</Text>
        ))}
      </View>

      {/* Action panel */}
      <View style={cb.actionPanel}>
        {phase === 'battle_end' && (
          <View style={cb.battleEndBox}>
            <Text style={[cb.battleEndTitle, { color: battleWinner === 'player' ? Colors.status.success : Colors.status.danger }]}>
              {battleWinner === 'player' ? '🏆 VICTORY!' : '💀 DEFEAT!'}
            </Text>
            <Text style={cb.battleEndDesc}>Returning to kingdom...</Text>
          </View>
        )}

        {phase === 'select_unit' && (
          <View style={cb.phasePanel}>
            <Text style={cb.phaseInstruction}>
              {units.filter(u => u.side === 'player' && u.hp > 0 && !u.acted).length > 0
                ? `Select a unit to command (${units.filter(u => u.side === 'player' && u.hp > 0 && !u.acted).length} remaining)`
                : 'All units have acted'}
            </Text>
            <View style={cb.unitLegend}>
              {(['infantry', 'cavalry', 'archers'] as UnitType[]).map(type => (
                <View key={type} style={cb.legendItem}>
                  <Text style={cb.legendIcon}>{UNIT_META[type].icon}</Text>
                  <Text style={cb.legendDesc}>{UNIT_META[type].desc}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={cb.endTurnBtn} onPress={handleEndTurn} activeOpacity={0.8}>
              <Text style={cb.endTurnBtnText}>End Turn →</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'select_action' && selectedUnit && (
          <View style={cb.phasePanel}>
            <Text style={cb.phaseInstruction}>
              {UNIT_META[selectedUnit.type].icon} {UNIT_META[selectedUnit.type].name} — {LANE_NAMES[selectedUnit.lane]} — Choose action:
            </Text>
            <View style={cb.actionBtns}>
              <TouchableOpacity
                style={[cb.actionBtn, cb.actionBtnAttack, !canAttack(selectedUnit) && cb.actionBtnDisabled]}
                onPress={() => canAttack(selectedUnit) && handleActionSelect('attack')}
                activeOpacity={0.8}
              >
                <Text style={cb.actionBtnIcon}>⚔️</Text>
                <Text style={cb.actionBtnLabel}>Attack</Text>
                <Text style={cb.actionBtnSub}>Strike enemy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cb.actionBtn, cb.actionBtnMove]}
                onPress={() => handleActionSelect('move')}
                activeOpacity={0.8}
              >
                <Text style={cb.actionBtnIcon}>↔</Text>
                <Text style={cb.actionBtnLabel}>Move</Text>
                <Text style={cb.actionBtnSub}>Shift lane</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cb.actionBtn, cb.actionBtnDefend]}
                onPress={() => handleActionSelect('defend')}
                activeOpacity={0.8}
              >
                <Text style={cb.actionBtnIcon}>🛡</Text>
                <Text style={cb.actionBtnLabel}>Defend</Text>
                <Text style={cb.actionBtnSub}>-45% damage</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { setSelectedUnitId(null); setPhase('select_unit'); }} style={cb.cancelLink}>
              <Text style={cb.cancelLinkText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'select_target' && (
          <View style={cb.phasePanel}>
            <Text style={cb.phaseInstruction}>Tap a highlighted enemy unit to attack</Text>
            <View style={cb.counterGuide}>
              <Text style={cb.counterGuideText}>
                {selectedUnit ? `${UNIT_META[selectedUnit.type].icon} ${UNIT_META[selectedUnit.type].name} counters ${UNIT_META[COUNTERS[selectedUnit.type]].name} ${UNIT_META[COUNTERS[selectedUnit.type]].icon} (×1.45 dmg)` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setSelectedAction(null); setPhase('select_action'); }} style={cb.cancelLink}>
              <Text style={cb.cancelLinkText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'select_lane' && (
          <View style={cb.phasePanel}>
            <Text style={cb.phaseInstruction}>Tap a highlighted lane to move into</Text>
            <TouchableOpacity onPress={() => { setSelectedAction(null); setPhase('select_action'); }} style={cb.cancelLink}>
              <Text style={cb.cancelLinkText}>← Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'processing' && (
          <View style={cb.phasePanel}>
            <Text style={[cb.phaseInstruction, { color: Colors.status.danger }]}>⚔️ Enemy forces respond...</Text>
          </View>
        )}
      </View>

      {/* Province name bar */}
      <View style={[cb.provinceBar, { paddingBottom: insets.bottom + 6 }]}>
        <Text style={cb.provinceText}>Battle for {pb.provinceName}</Text>
        <TouchableOpacity
          onPress={() => Alert.alert(
            'Retreat?',
            'Your army will fall back. The battle will be auto-resolved against you.',
            [
              { text: 'Keep Fighting', style: 'cancel' },
              { text: 'Retreat', style: 'destructive', onPress: () => {
                const playerHpPct = calcHpPct(units, 'player');
                const enemyHpPct = calcHpPct(units, 'enemy');
                resolvePendingBattle({ winner: 'enemy', playerHpPct, enemyHpPct });
                router.back();
              }},
            ]
          )}
          style={cb.retreatBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={12} color={Colors.text.dim} />
          <Text style={cb.retreatBtnText}>Retreat</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const cb = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.primary, gap: 8 },
  bannerBox: { flex: 1, gap: 2 },
  bannerBoxRight: { alignItems: 'flex-end' },
  bannerText: { fontSize: 12, fontWeight: '700' as const, color: Colors.text.primary },
  troopCount: { fontSize: 10, color: Colors.text.dim },
  turnBox: { alignItems: 'center', paddingHorizontal: 12 },
  turnLabel: { fontSize: 8, color: Colors.text.dim, textTransform: 'uppercase' as const, letterSpacing: 1 },
  turnNum: { fontSize: 22, fontWeight: '900' as const, color: Colors.gold.bright },
  moraleRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.border.primary },
  moraleSection: { flex: 1, gap: 3 },
  moraleLabel: { fontSize: 9, color: Colors.text.dim, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  moraleBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.bg.card, overflow: 'hidden' as const },
  moraleBarFill: { height: '100%' as any, borderRadius: 3 },
  moralePct: { fontSize: 11, fontWeight: '700' as const, color: Colors.status.success },
  moraleDivider: { width: 32, alignItems: 'center' },
  vsLabel: { fontSize: 10, fontWeight: '900' as const, color: Colors.gold.dim },
  laneGrid: { flex: 1, paddingHorizontal: 8, gap: 4, paddingVertical: 8 },
  laneRow: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card + '60', borderRadius: 12, overflow: 'hidden' as const, borderWidth: 1, borderColor: Colors.border.primary },
  laneRowHighlight: { borderColor: Colors.status.info + '80', backgroundColor: Colors.status.info + '08' },
  lanePlayerSide: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', gap: 4, flexWrap: 'wrap' as const },
  laneLabel: { width: 80, alignItems: 'center', gap: 2 },
  laneLabelText: { fontSize: 9, color: Colors.text.dim, textTransform: 'uppercase' as const, letterSpacing: 0.5, textAlign: 'center' as const },
  laneArrow: { fontSize: 14, color: Colors.status.info },
  laneEnemySide: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' as const },
  emptySlot: { width: 56, height: 64 },
  unitCard: { width: 56, height: 64, borderRadius: 10, backgroundColor: Colors.bg.tertiary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border.primary, gap: 2, position: 'relative' as const },
  unitCardSelected: { borderColor: Colors.gold.bright, backgroundColor: Colors.gold.dim + '20' },
  unitCardTargetable: { borderColor: Colors.status.danger, backgroundColor: Colors.status.danger + '15' },
  unitCardDead: { opacity: 0.3, backgroundColor: Colors.bg.primary },
  unitCardActed: { opacity: 0.55 },
  unitIcon: { fontSize: 22 },
  hpBarBg: { width: 44, height: 3, borderRadius: 2, backgroundColor: Colors.bg.primary, overflow: 'hidden' as const },
  hpBarFill: { height: '100%' as any, borderRadius: 2 },
  unitHp: { fontSize: 9, fontWeight: '700' as const },
  defIcon: { position: 'absolute' as const, top: 2, right: 2, fontSize: 10 },
  selectedRing: { position: 'absolute' as const, top: -2, left: -2, right: -2, bottom: -2, borderRadius: 12, borderWidth: 2, borderColor: Colors.gold.bright },
  targetRing: { position: 'absolute' as const, top: -2, left: -2, right: -2, bottom: -2, borderRadius: 12, borderWidth: 2, borderColor: Colors.status.danger },
  logBox: { paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.border.primary, gap: 2, backgroundColor: Colors.bg.card + '40', minHeight: 56 },
  logEntry: { fontSize: 10, color: Colors.text.secondary, lineHeight: 15 },
  logEntryLatest: { color: Colors.text.primary, fontWeight: '600' as const },
  actionPanel: { borderTopWidth: 1, borderTopColor: Colors.border.primary, backgroundColor: Colors.bg.card },
  phasePanel: { padding: 12, gap: 8 },
  phaseInstruction: { fontSize: 12, color: Colors.text.primary, fontWeight: '600' as const, textAlign: 'center' as const },
  unitLegend: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  legendItem: { alignItems: 'center', gap: 2 },
  legendIcon: { fontSize: 16 },
  legendDesc: { fontSize: 9, color: Colors.text.dim },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', gap: 3, borderWidth: 1 },
  actionBtnAttack: { backgroundColor: Colors.crimson.dark + '40', borderColor: Colors.crimson.bright + '60' },
  actionBtnMove: { backgroundColor: Colors.status.info + '20', borderColor: Colors.status.info + '60' },
  actionBtnDefend: { backgroundColor: '#1a2a1a', borderColor: Colors.status.success + '60' },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnIcon: { fontSize: 18 },
  actionBtnLabel: { fontSize: 12, fontWeight: '700' as const, color: Colors.text.primary },
  actionBtnSub: { fontSize: 9, color: Colors.text.dim },
  cancelLink: { alignSelf: 'center' as const, paddingVertical: 4 },
  cancelLinkText: { fontSize: 11, color: Colors.text.dim },
  counterGuide: { backgroundColor: Colors.bg.tertiary, borderRadius: 8, padding: 8, alignItems: 'center' as const },
  counterGuideText: { fontSize: 11, color: Colors.gold.dim, textAlign: 'center' as const },
  endTurnBtn: { backgroundColor: Colors.gold.dim + '20', borderWidth: 1, borderColor: Colors.gold.dim + '60', borderRadius: 10, paddingVertical: 10, alignItems: 'center' as const },
  endTurnBtnText: { fontSize: 13, fontWeight: '800' as const, color: Colors.gold.dim },
  battleEndBox: { padding: 20, alignItems: 'center', gap: 8 },
  battleEndTitle: { fontSize: 24, fontWeight: '900' as const },
  battleEndDesc: { fontSize: 13, color: Colors.text.secondary },
  provinceBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border.primary },
  provinceText: { fontSize: 11, color: Colors.text.dim, fontStyle: 'italic' as const },
  retreatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: Colors.border.primary },
  retreatBtnText: { fontSize: 10, color: Colors.text.dim },
});
