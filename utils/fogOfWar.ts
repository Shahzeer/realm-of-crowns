import { Province, Army, ActiveSpyMission } from '@/types/game';

export interface VisibilityMap {
  [provinceId: string]: boolean;
}

export function computeVisibility(
  provinces: Province[],
  armies: Army[],
  activeSpyMission: ActiveSpyMission | undefined,
): VisibilityMap {
  const visible: VisibilityMap = {};

  const playerProvinceIds = new Set<string>();
  provinces.forEach(p => {
    if (p.owner === 'player') {
      playerProvinceIds.add(p.id);
    }
  });

  const armyLocationIds = new Set<string>();
  armies.forEach(a => {
    if (a.owner === 'player') {
      armyLocationIds.add(a.location);
      if (a.destination) {
        armyLocationIds.add(a.destination);
      }
    }
  });

  const spyTargetIds = new Set<string>();
  if (activeSpyMission) {
    spyTargetIds.add(activeSpyMission.targetId);
  }

  const adjacentIds = new Set<string>();
  provinces.forEach(p => {
    if (playerProvinceIds.has(p.id) || armyLocationIds.has(p.id)) {
      p.connectedTo.forEach(cid => adjacentIds.add(cid));
    }
  });

  provinces.forEach(p => {
    const isVisible =
      playerProvinceIds.has(p.id) ||
      armyLocationIds.has(p.id) ||
      adjacentIds.has(p.id) ||
      spyTargetIds.has(p.id);
    visible[p.id] = isVisible;
  });

  return visible;
}

export function isProvinceVisible(
  provinceId: string,
  visibilityMap: VisibilityMap,
): boolean {
  return visibilityMap[provinceId] ?? false;
}
