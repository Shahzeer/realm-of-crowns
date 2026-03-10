import { BattleResult, VictoryTitle, BattleCommander } from '@/types/game';

const TERRAIN_DESCRIPTORS = [
  'through the morning mist', 'across the muddy fields', 'under a blood-red sky',
  'at the break of dawn', 'as thunder rolled overhead', 'beneath a pale winter sun',
  'through sheets of rain', 'in the dead of night', 'as snow began to fall',
  'under scorching heat', 'through dense forest', 'across the river crossing',
];

const ATTACK_VERBS = [
  'charged', 'surged forward', 'advanced relentlessly', 'swept across the field',
  'unleashed a devastating assault', 'stormed the defenses', 'pressed the attack',
  'launched a fierce offensive', 'crashed into enemy lines', 'bore down upon',
];

const DEFENSE_VERBS = [
  'held firm against', 'mounted a stubborn defense', 'rallied their forces',
  'braced for the onslaught', 'formed a desperate shield wall', 'dug in and resisted',
  'stood their ground against', 'fought back with fury',
];

const FLANKING_PHRASES = [
  'led a devastating flanking maneuver that broke the enemy lines',
  'executed a brilliant pincer movement',
  'outmaneuvered the defenders with a bold cavalry charge',
  'split the forces to strike from multiple angles',
  'found a weakness in the left flank and exploited it ruthlessly',
];

const VICTORY_PHRASES = [
  'The enemy broke and fled, leaving the field strewn with the fallen.',
  'Victory was seized as the last defenders surrendered their arms.',
  'The banner was raised over the conquered stronghold as cheers erupted.',
  'The routing army scattered into the wilderness, their cause lost.',
  'As dust settled, the victorious army stood triumphant amid the carnage.',
];

const DEFEAT_PHRASES = [
  'The assault faltered under withering resistance, forcing a bitter retreat.',
  'Despite valor shown, the defenders held and the attackers withdrew in disorder.',
  'The walls held firm, and the attacking force was driven back with heavy losses.',
  'Outnumbered and outmaneuvered, the army was forced to sound the retreat.',
  'The battle was lost, and surviving soldiers limped back to friendly territory.',
];

const COMMANDER_CONTRIBUTIONS_VICTORY = [
  'led the decisive charge that shattered enemy morale',
  'rallied wavering troops with an inspiring battlecry',
  'personally led the vanguard into the thickest fighting',
  'orchestrated a masterful battle plan executed to perfection',
  'cut down the enemy commander in single combat',
  'held the center line against overwhelming odds',
];

const COMMANDER_CONTRIBUTIONS_DEFEAT = [
  'fought bravely but was overwhelmed by superior numbers',
  'organized an orderly retreat, saving many lives',
  'was wounded in the fighting but continued to command',
  'held the rearguard to allow the army to escape',
  'clashed with enemy captains in fierce melee',
];

const COMMANDER_ROLES = [
  'Commanding General', 'War Leader', 'Marshal', 'Captain-General',
  'Lord Commander', 'Battle Commander', 'Field Marshal',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getVictoryTitle(battle: BattleResult): VictoryTitle {
  const ratio = battle.attackerTroops / Math.max(battle.defenderTroops, 1);
  const totalLosses = battle.attackerLosses + battle.defenderLosses;
  const totalTroops = battle.attackerTroops + battle.defenderTroops;
  const casualtyRate = totalLosses / Math.max(totalTroops, 1);

  if (battle.winner === 'attacker') {
    if (ratio <= 0.5) return 'Against All Odds';
    if (ratio <= 0.75) return 'Glorious Victory';
    if (casualtyRate > 0.6) return 'Pyrrhic Victory';
    if (ratio >= 2) return 'Decisive Victory';
    return 'Hard-Won Victory';
  } else {
    if (ratio >= 2) return 'Devastating Rout';
    if (casualtyRate > 0.5) return 'Crushing Defeat';
    if (ratio >= 1.5) return 'Narrow Defeat';
    return 'Tactical Retreat';
  }
}

export function generateBattleNarrative(battle: BattleResult): string {
  const terrain = pick(TERRAIN_DESCRIPTORS);
  const isVictory = battle.winner === 'attacker';
  const ratio = battle.attackerTroops / Math.max(battle.defenderTroops, 1);

  let narrative = '';

  if (isVictory) {
    if (ratio <= 0.75) {
      narrative = `Against overwhelming odds, the ${battle.attackerName} ${pick(ATTACK_VERBS)} ${terrain} at ${battle.provinceName}. `;
      narrative += `Commander ${battle.attackerCommander?.name ?? 'Unknown'} ${pick(FLANKING_PHRASES)}. `;
    } else {
      narrative = `The ${battle.attackerName} ${pick(ATTACK_VERBS)} ${terrain} at ${battle.provinceName}. `;
      if (battle.tacticUsed === 'flanking' || battle.tacticUsed === 'cavalry_charge') {
        narrative += `${battle.attackerCommander?.name ?? 'The commander'} ${pick(FLANKING_PHRASES)}. `;
      } else {
        narrative += `${battle.attackerCommander?.name ?? 'The commander'} ${pick(COMMANDER_CONTRIBUTIONS_VICTORY)}. `;
      }
    }
    narrative += pick(VICTORY_PHRASES);
  } else {
    narrative = `The ${battle.attackerName} ${pick(ATTACK_VERBS)} ${terrain} at ${battle.provinceName}, but the ${battle.defenderName} ${pick(DEFENSE_VERBS)} the assault. `;
    narrative += `${battle.defenderCommander?.name ?? 'The defending commander'} ${pick(COMMANDER_CONTRIBUTIONS_VICTORY)}. `;
    narrative += pick(DEFEAT_PHRASES);
  }

  return narrative;
}

export function generateCommander(name: string): BattleCommander {
  return {
    name,
    role: pick(COMMANDER_ROLES),
    contribution: '',
  };
}

export function enrichBattleResult(battle: BattleResult): BattleResult {
  const attackerCmd: BattleCommander = {
    name: battle.attackerName.replace(/^The\s+/i, '').split(' ')[0] + ' Commander',
    role: pick(COMMANDER_ROLES),
    contribution: battle.winner === 'attacker'
      ? pick(COMMANDER_CONTRIBUTIONS_VICTORY)
      : pick(COMMANDER_CONTRIBUTIONS_DEFEAT),
  };

  const defenderCmd: BattleCommander = {
    name: battle.defenderName.replace(/^Garrison of\s+/i, '').split(' ')[0] + ' Commander',
    role: pick(COMMANDER_ROLES),
    contribution: battle.winner === 'defender'
      ? pick(COMMANDER_CONTRIBUTIONS_VICTORY)
      : pick(COMMANDER_CONTRIBUTIONS_DEFEAT),
  };

  const enriched = {
    ...battle,
    attackerCommander: attackerCmd,
    defenderCommander: defenderCmd,
    victoryTitle: getVictoryTitle(battle),
  };

  enriched.narrative = generateBattleNarrative(enriched);

  return enriched;
}
