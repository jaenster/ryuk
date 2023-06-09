import sdk from "../sdk";
import GameData from './data/GameData'
import {Collision} from "./Coords";

export const isValidSpot = (x: number, y: number, item: ItemUnit) => {
  //Loop the item size to make sure we can fit it.
  for (let nx = 0; nx < item.sizey; nx++) {
    for (let ny = 0; ny < item.sizex; ny++) {
      if (Storage.Inventory.buffer[x + nx][y + ny]) {
        return false;
      }
    }
  }
  return true;
}

// Based on Container.FindSpot
export const findSpot = (item: ItemUnit, desc = false) => {
  if (!desc) {
    const yStart = 10 - (item.sizex - 1) - 1,
      xStart = 4 - (item.sizey - 1) - 1;

    for (let y = yStart; y >= 0; y--) {
      for (let x = xStart; x >= 0; x--) {
        //Check if there is something in this spot.
        if (Storage.Inventory.buffer[x][y] > 0) continue;

        if (!isValidSpot(x, y, item)) continue;

        // noinspection JSSuspiciousNameCombination
        return {x: y, y: x};
      }
    }
    return false;
  }
  const yEnd = 10 - (item.sizex - 1),
    xEnd = 4 - (item.sizey - 1);

  for (let y = 0; y < yEnd; y++) {
    for (let x = 0; x < xEnd; x++) {
      //Check if there is something in this spot.
      if (Storage.Inventory.buffer[x][y] > 0) continue;

      if (!isValidSpot(x, y, item)) continue;

      // noinspection JSSuspiciousNameCombination
      return {x: y, y: x};
    }
  }
  return false;
}

export const findSpotOrClear = (item: ItemUnit, desc = false) => {
  let spot = findSpot(item, desc);
  if (!spot) {
    me.getItemsEx()
      .filter(item => item.location === 3 && item.itemType === 76 || item.itemType === 77)
      .sort((a, b) => a.x - b.x)
      .some(item => {
        console.log('drinking pot to make space');
        item.interact();
        spot = findSpot(item, desc);
      });
  }
  return spot;
}

export function sortInventory() {


  // If we can find a space of 4x4, we dont need to clear out the inventory
  if (findSpot({sizex: 4, sizey: 4} as ItemUnit)) return true;

  if (getUIFlag(sdk.uiflags.NPCMenu) && !getUIFlag(sdk.uiflags.Shop)) {
    // Cant move items when interacting with a npc but not in trade
    me.cancel();
  }

  let movedSomething;
  do {
    movedSomething = false

    const items = me.getItemsEx()
      .filter(item => item.isInInventory)
      .sort((a, b) => {
        const asize = a.sizex * a.sizey,
          bsize = b.sizex * b.sizey;

        if (asize === bsize) return 0;
        return bsize - asize;
      });

    const onebyone = items
      .filter(el => el.sizex * el.sizey === 1)
      .sort((a, b) => a.x - b.x)

    const doneSpots = [];
    onebyone.some(item => {
      const x = item.x, y = item.y;
      const spot = findSpot(item);
      if (spot && !doneSpots.find((other) => other.x !== spot.x && other.y !== spot.y)) {
        if (spot.x < x) return false;
        if (spot.x == x) return false;
        // console.log('small item -> From;', {x, y}, 'to;', spot);
        doneSpots.push(spot, {x, y});
        movedSomething = true;
        clickItemAndWait(0, item);
        // console.log('Clicking on spot - Small items');
        clickItemAndWait(0, spot.x, spot.y, 3)
        Storage.Reload();
        return true;
      }
      return false;
    });

    const biggerAsOne = items
      .filter(el => el.sizex * el.sizey > 1)
      .sort((a, b) => a.x - b.x);

    // console.log(biggerAsOne.map(({name}) => name));

    doneSpots.splice(0, doneSpots.length);
    biggerAsOne.some(item => {
      const x = item.x, y = item.y;
      const spot = findSpot(item, true);
      if (spot && !doneSpots.find((other) => other.x !== spot.x && other.y !== spot.y)) {
        if (spot.x > x) return false;
        if (spot.x == x) return false;
        movedSomething = true;

        // console.log('big item -> From;', {x, y}, 'to;', spot);
        doneSpots.push(spot, {x, y});

        clickItemAndWait(0, item);
        // console.log('Clicking on spot - Small items');
        clickItemAndWait(0, spot.x, spot.y, 3)
        Storage.Reload();
        return true;
      }
      return false;
    });

  } while (movedSomething);
  console.log('Done sorting');
}

export function mixin(target: { prototype: object }, ...sources: { prototype: object }[]) {
  sources.forEach(source => Object.getOwnPropertyNames(source.prototype)
    .forEach(key => Object.defineProperty(
        target.prototype,
        key,
        Object.getOwnPropertyDescriptor(source.prototype, key),
      )
    )
  );
}

export function mixinFunctions(target: { prototype: object }, ...sources: { prototype: object }[]) {
  sources.forEach(source => Object.getOwnPropertyNames(source.prototype)
    .forEach(key => {
        const propertyDescriptor = Object.getOwnPropertyDescriptor(source.prototype, key);
        const current = Object.getOwnPropertyDescriptor(target.prototype, key);
        if (!current && propertyDescriptor.hasOwnProperty('value') && typeof propertyDescriptor.value === 'function') {
          Object.defineProperty(
            target.prototype,
            key,
            Object.getOwnPropertyDescriptor(source.prototype, key),
          )
        }
      }
    )
  );
}

export function calculateRawStaticDamage(distanceUnit: { x: number, y: number } = me) {
  if (!me.getSkill(sdk.skills.StaticField, 1)) return 0;
  const range = Skill.getRange(sdk.skills.StaticField),
    cap = [1, 25, 50][me.diff];

  return getUnits(1)
    .filter(mon => mon.attackable
        && getDistance(mon, distanceUnit) < range
      // && !isBlockedBetween(distanceUnit, mon)
    ).reduce((acc, unit) => {
      const {classid: classId, area: areaId} = unit,
        maxHealth = GameData.monsterAvgHP(classId, areaId, unit.charlvl - GameData.monsterLevel(classId, areaId)),
        currentHealth = maxHealth / 100 * (unit.hp * 100 / unit.hpmax),
        baseDamage = currentHealth * 0.25;

      // monsterRes already considers conviction state
      const monsterRes = unit.getStat(sdk.stats.Lightresist) as number,
        pierce = me.getStat(sdk.stats.PierceLtng) as number,
        totalRes = Math.min(100, Math.max(-100, monsterRes - pierce));

      // calculate the actual damage we do
      const potentialDamage = baseDamage / (100 / (100 - totalRes)),
        cappedAtHealth = maxHealth / 100 * cap;

      // cap max damage
      const actualDamage = currentHealth - Math.max(cappedAtHealth, (currentHealth - potentialDamage));
      return acc + (actualDamage);
    }, 0);
}

export function calculateSplashDamage(skill: number, splash: number, target: Monster) {
  return getUnits(1)
    .filter(mon => mon.attackable
        && getDistance(target, mon) < splash
      // && !isBlockedBetween(target, mon)
    ).reduce((acc, cur) => {
      const {min, max} = GameData.skillDamage(skill, cur);
      return acc + ((min + max) / 2);
    }, 0);
}

export function calculateKillableFallensByFrostNova() {
  const fallens = [sdk.monsters.Fallen, sdk.monsters.Carver2, sdk.monsters.Devilkin2, sdk.monsters.DarkOne1, sdk.monsters.WarpedFallen, sdk.monsters.Carver1, sdk.monsters.Devilkin, sdk.monsters.DarkOne2];
  return getUnits(1)
    .filter(unit =>
      unit.attackable
      && typeof unit.x === 'number' // happens if monster despawns
      && !checkCollisionBetween(me.x, me.y, unit.x, unit.y, 5, Collision.BLOCK_MISSILE)
      && unit.distance < 7
      && unit.getStat(sdk.stats.Coldresist) < 100
      && !unit.getState(sdk.states.Frozen)
      && fallens.includes(unit.classid)
    )
    .reduce((acc, cur) => {
      const {classid: classId, area: areaId} = cur,
        minDmg = GameData.skillDamage(sdk.skills.FrostNova, cur).min,
        currentHealth = GameData.monsterMaxHP(classId, areaId, cur.charlvl - GameData.monsterLevel(classId, areaId)) / 100 * (cur.hp * 100 / cur.hpmax);

      if (currentHealth < minDmg) acc++;
      return acc;
    }, 0);
}

export function getTownForQuest(quest: number): 1 | 2 | 3 | 4 | 5 {
  if (quest <= sdk.quests.AbleToGotoActII) return 1;
  if (quest <= sdk.quests.AbleToGotoActIII) return 2;
  if (quest <= sdk.quests.AbleToGotoActIV) return 3;
  if (quest <= sdk.quests.AbleToGotoActV) return 4;
  if (quest <= sdk.quests.EveOfDestruction) return 5;
  return 1; // cow/respec are act 1 quests
}

export const calculateRawFireballDamage: (unit: Monster) => number = calculateSplashDamage.bind(void 2, 4, sdk.skills.FireBall);
export const calculateBlizzardDamage: (unit: Monster) => number = calculateSplashDamage.bind(void 2, 4, sdk.skills.Blizzard);

export function assignSkillToHotkey(skill: number, hand: number, hotkey: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16, item?: ItemUnit) {
  const buffer = new ArrayBuffer(9);
  const view = new DataView(buffer);
  const args = [];

  // clear current hotkey
  sendPacket(1, 0x51, 2, 0xFFFF, 1, hotkey & 0xFF, 1, 0x0, 4, 0xFFFF_FFFF);

  view.setUint8(0, 0x51); // assign hotkey
  view.setUint16(1, (skill & 0x7fff) | ((+!!hand) << 0xf), true)
  view.setUint16(3, hotkey & 0xFF, true)
  view.setUint32(5, item?.gid || 0xFFFFFFFF);

  for (let i = 0; i < 9; i++) args.push(1, view.getUint8(i));

  // send the actual packet
  sendPacket(...(args.splice(0, args.length)));

  // Since d2(bs) dont know a hotkey is changed, fake the recv packet from entering the game
  view.setInt8(0, 0x7B)
  view.setInt8(1, hotkey & 0xFF);
  view.setUint16(2, (skill & 0x7fff) | ((+!!hand) << 0xf), true);
  view.setUint32(4, item?.gid || 0xFFFFFFFF)
  for (let i = 0; i < 9; i++) args.push(1, view.getUint8(i));

  getPacket(...args);
}

export function updateRecursively<M extends {}, N extends Partial<M>>(oldObj: M, newObj: N, path = []) {
  Object.keys(newObj).forEach(key => {
    if (typeof newObj[key] !== 'object') {
      if (!oldObj.hasOwnProperty(key) || oldObj[key] !== newObj[key]) {
        oldObj[key] = newObj[key];
      }

    } else {
      if (typeof oldObj[key] !== 'object') {
        oldObj[key] = {};
      }
      path.push(key);
      updateRecursively(oldObj[key], newObj[key], path);
    }
  })
}

export function recursiveSearch<M extends {}, N extends {}>(o: M, n: N, changed: Partial<M & N> = {}): Partial<M & N> {
  Object.keys(n).forEach(key => {
    if (typeof n[key] !== 'object') {
      if (!o.hasOwnProperty(key) || o[key] !== n[key]) {
        changed[key] = n[key];
      }

    } else {
      if (typeof changed[key] !== 'object' || !changed[key]) {
        changed[key] = {};
      }
      recursiveSearch(o?.[key] || {}, n?.[key] || {}, changed[key]);
      if (!Object.keys(changed[key]).length) delete changed[key];
    }
  });
  return changed;
}

export function randomString(min: number, max: number) {
  return Array.apply(null, {length: min + ~~(rand(0, max - min))})
    .map(_ => 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26)))
    .join('');
}