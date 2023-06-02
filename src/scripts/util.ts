import MoveTo from "../lib/MoveTo";
import sdk from "../sdk";

export const getExit = (from: number, to: number) => {
  let area, exits, exit: Exit;
  (area = getArea(from)) && (exits = area.exits) && (exit = exits.find(exit => exit.target === to));
  return exit;
}


export const moveToExit = (to: number, from: number = me.area, settings?: object) => {
  console.log('Going to -' + Pather.getAreaName(to));
  const exit = getExit(from, to);
  if (!exit) return;
  const path = getPath(from, me.x, me.y, exit.x, exit.y, 2, 40);
  if (!path) return;
  MoveTo(path, settings);
  while (!me.idle) delay(100);
  if (me.area !== to) {
    Pather.moveToExit(to, true);
  }
}

const wpIDs = [119, 145, 156, 157, 237, 238, 288, 323, 324, 398, 402, 429, 494, 496, 511, 539];
export const getWpPreset = (area: number = me.area) => {
  for (let i = 0; i < wpIDs.length; i += 1) {
    if (sdk.areas.townOf(area) !== me.act) {
      console.log('To get preset we need to be in the correct act');
      Town.goToTown(sdk.areas.townOf(area));
    }
    let preset = getPresetUnit(area, 2, wpIDs[i]);
    if (preset) return preset;
  }
  return undefined;
}
export const gotoWp = (area = me.area) => {
  const preset = getWpPreset(area);
  if (!preset) return false
  MoveTo(preset);
  return true;
}

export const gotWp = (area) => getWaypoint(Pather.wpAreas.indexOf(area))
export const getWp = (area = me.area) => {
  if (getWaypoint(Pather.wpAreas.indexOf(area))) return true;
  gotoWp(area);

  const wp = getUnit(2, "waypoint");

  if (wp) for (let j = 0; j < 10; j += 1) {
    Misc.click(0, 0, wp);

    if (getUIFlag(0x14)) {
      delay(500);
      me.cancel();

      return true;
    }

    delay(500);
  }
  return false;
}

export const getQuestItem = function (classid: number, chestid?: number) {
  let chest, tick = getTickCount();

  if (me.getItem(classid)) return true;
  if (me.inTown) return false;

  if (chestid) {
    chest = getUnit(2, chestid);
    if (!chest) return false;

    Misc.openChest(chest);
  }
  let item = getUnit(4, classid);

  if (!item) {
    if (getTickCount() - tick < 500) {
      delay(500 - (getTickCount() - tick));
    }

    return false;
  }

  return Pickit.pickItem(item) && delay(1000);
};


export const talkTo = function (npc: string, cancel: boolean = true) {

  switch (npc) {
    case NPC.Jerhyn:
      Town.move('palace');
      break;
    case NPC.Hratli:
      if (!me.getQuest(sdk.quests.SpokeToHratli, 0)) {
        Town.move(NPC.Meshif);
        break;
      }
    // No break
    default:
      Town.move(npc);
  }

  let target = getUnit(1, npc);
  if (target && target.openMenu()) {
    cancel && me.cancel();
    return true;
  }
  return false;
}

export const haveWp = function (id: number) {
  const idx = Pather.wpAreas.indexOf(id);
  return idx > -1 && getWaypoint(idx);
}

export const calculateSpots = function (center, skillRange): { x: number, y: number }[] {
  let coords: { x: number, y: number }[] = [];
  for (let i = 0; i < 360; i++) {
    coords.push({
      x: Math.floor(center.x + skillRange * Math.cos(i) + .5),
      y: Math.floor(center.y + skillRange * Math.sin(i) + .5),
    });
  }
  return coords.filter((e, i, s) => s.indexOf(e) === i)// only unique spots
    .filter(el => Attack.validSpot(el.x, el.y));
};


export const spotOnDistance = function (spot: PathNode, distance: number, area: number = me.area) {
  const nodes = getPath(area, me.x, me.y, spot.x, spot.y, 2, 5);
  if (!nodes) return {x: me.x, y: me.y};

  return nodes.find(node => getDistance(spot, node) < distance) || {x: me.x, y: me.y};
}

// Its the inverse of spotOnDistance, its a spot going in the direction of the spot
export const inverseSpotDistance = function (spot: PathNode, distance: number, otherSpot: PathNode & {
  area: number
} = me) {
  const {x, y, area} = otherSpot;
  const nodes = getPath(area, x, y, spot.x, spot.y, 2, 5);

  return nodes && nodes.find(node => node.distance > distance) || {x, y};
}

export const toPackOfMonsters = function (monsters: Monster[]) {

  const packLocations: { x: number, y: number, monsters: Monster[] }[] = [];


  monsters.filter(el => !el.dead).forEach((monster) => {

    const pack = packLocations.find(loc => {
      console.log('Found pack is ', getDistance(loc.x, loc.y, monster.x, monster.y));
      return getDistance(loc.x, loc.y, monster.x, monster.y) < 15
    });
    if (!pack) {
      packLocations.push({monsters: [monster], x: monster.x, y: monster.y})
      return;
    }

    pack.monsters.push(monster);

    // re-center of boss packs
    // pack.x = pack.monsters.reduce((acc, {x}) => acc+(x|0), 0)/pack.monsters.length;
    // pack.y = pack.monsters.reduce((acc, {y}) => acc+(y|0), 0)/pack.monsters.length;

  });
  return packLocations;
}

export function filterNormalMonsters(monsters: Monster[]) {
  for (let i = monsters.length; i-- > 0;) {
    const monster = monsters[i];

    // delete non special monsters
    if (!monster.isSpecial && monster.distance > 7) monsters.splice(i, 1);
  }
}

export function filterMonster(cb: (monster: Monster) => any) {
  return function (monsters: Monster[]) {
    for (let i = monsters.length; i-- > 0;) {
      if (!cb(monsters[i])) monsters.splice(i, 1);
    }
  }

}

export function getRooms() {
  const room = (getRoom() || undefined), rooms = [];
  do {
    rooms.push({x: room.x * 5 + room.xsize / 2, y: room.y * 5 + room.xsize / 2})
  } while (room.getNext());
  return rooms;
}

export function getFurthestSpot(spots: { x, y }[], possibleLocations: { x, y }[] = getRooms()) {
  // Get the node that is the most far away from all spots
  const farAway = possibleLocations.sort((A, B) => {
    const [a, b] = [A, B].map(f => spots.reduce((t, c) => (t + getDistance(c, f)) | 0, 0));
    return b - a;
  }).first();

  const [x, y] = Pather.getNearestWalkable(farAway.x, farAway.y, 40, 3, 0x1 | 0x4 | 0x800 | 0x1000) as [number, number];
  return {x, y};
}

export function getClosestSpot(spots: PathNode[]) {
  return [...spots].sort((a, b) => a.distance - b.distance).first();
}

export function getMedianSpot(spots: { [data: string]: { x: number, y: number } }) {
  const center = {x: 0, y: 0}, keys = Object.keys(spots);
  keys.map(key => spots[key]).forEach(({x, y}) => void (center.x + x, center.y + y));
  center.x = center.x / keys.length;
  center.y = center.y / keys.length;
  return center;
}