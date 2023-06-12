import {settings as PatherSettings} from "../overrides/Pather";
import sdk from "../sdk";
import {Events} from "./Events";
import {Collision, isBlockedBetween} from "./Coords";
import _missiles from "./data/MissileData";

globalThis['__________ignoreMonster'] = [];
const defaults = {
  range: 14,
  spectype: 0,
  once: false,
  nodes: [] as { x, y }[] & { index: number },
  callback: undefined,
  filter: undefined,
  dryRun: false,
};

const shamans = [sdk.monsters.FallenShaman, sdk.monsters.CarverShaman2, sdk.monsters.DevilkinShaman2, sdk.monsters.DarkShaman1, sdk.monsters.WarpedShaman, sdk.monsters.CarverShaman, sdk.monsters.DevilkinShaman, sdk.monsters.DarkShaman2],
  fallens = [sdk.monsters.Fallen, sdk.monsters.Carver2, sdk.monsters.Devilkin2, sdk.monsters.DarkOne1, sdk.monsters.WarpedFallen, sdk.monsters.Carver1, sdk.monsters.Devilkin, sdk.monsters.DarkOne2];

const clearDistance = function (x, y, xx, yy) {

  getUnits(1).forEach((monster) => {
    if (typeof monster['beendead'] === 'undefined') monster.beendead = false;
    monster.beendead = monster.beendead || monster.dead
  });

  let path = getPath(me.area, x, y, xx, yy, 0, 4);
  if (!path || !path.length) return Infinity;

  return path.reduce((acc, v, i, arr) => {
    let prev = i ? arr[i - 1] : v;
    return acc + Math.sqrt((prev.x - v.x) * (prev.x - v.x) + (prev.y - v.y) * (prev.y - v.y));
  }, 0);
};

const exporting: {
  (_settings: Partial<typeof defaults>): boolean


  // Make exporting hookable
  on<S = any>(key: "sorting", handler: (this: S, monsters?: Monster[]) => void): any
  once<S = any>(key: "sorting", handler: (this: S, monsters?: Monster[]) => void): any
  off<S = any>(key: "sorting", handler: (this: S, monsters?: Monster[]) => void): any
  emit<S = any>(key: "sorting", monsters?: Monster[]): any

} = (function (_settings = {}) {
  const settings = Object.assign({}, defaults, _settings);
  // The bigger
  const smallStepRange = settings.range / 3 * 2;

  // Get an array with arrays going away from you (what we gonna walk after clearing, within range)
  let nearestNode = settings.nodes[settings.nodes.index];

  const backTrack = (units: Monster[], missiles: Missile[]) => {
    if (settings.nodes.index < 2) return false;

    //ToDo; backtrack further if that is a safer bet
    let nodesBack = Math.min(settings.nodes.index, 5);

    me.overhead('backtracking ' + nodesBack + ' nodes')
    settings.nodes.index -= nodesBack;
    nearestNode = settings.nodes[settings.nodes.index];

    // stationary missiles that deal damages
    let enhancedMissiles = missiles.map(m => ({missile: m, data: _missiles[m.classid]}))
    let missilesOnFloor = enhancedMissiles.filter(m => !!m.data)
      .filter(m => m.data.velocity === 0 && (m.data.minDamage > 0 || m.data.eMin > 0) && m.missile.hits(nearestNode));
    while (missilesOnFloor.length > 0 && settings.nodes.index > 0) {
      // console.log("missilesOnFloor");
      // console.log(missilesOnFloor);
      nodesBack += 1;
      settings.nodes.index -= 1;
      nearestNode = settings.nodes[settings.nodes.index];
      missilesOnFloor = enhancedMissiles.filter(m => !!m.data)
        .filter(m => m.data.velocity === 0 && (m.data.minDamage > 0 || m.data.eMin > 0) && m.missile.hits(nearestNode));
    }

    let old = PatherSettings.forceRun;
    PatherSettings.forceRun = true;
    try {
      const {x, y} = nearestNode;
      // If the path between me and the node we wanna run back to is blocked dont do it
      if (checkCollisionBetween(me.x, me.y, x, y, 3, Collision.BLOCK_MISSILE)) {
        me.overhead('Before backtracking, clear near me')
        const unit = units.first()
        unit && ClassAttack.doAttack(unit);
        settings.nodes.index += nodesBack;
        return true;
      }

      me.overhead('backtracking ' + nodesBack + ' nodes')
      if (Pather.getWalkDistance(x, y) > getDistance(me, nearestNode) * 1.5) {
        if (getDistance(me, nearestNode) > 35) {
          Pather.moveTo(x, y);
        } else {
          Pather.teleportTo(x, y);
        }
      } else {
        Pather.walkTo(x, y);
      }
      start = [x, y];

    } finally {
      PatherSettings.forceRun = old;
    }

    return true;
  };

  const forwardTrack = (units: Monster[]) => {
    console.debug(settings.nodes.index - 2, settings.nodes.length)
    if (settings.nodes.index - 2 > settings.nodes.length) {
      return false;
    }

    const mostNear = units.reduce((acc, cur) => !acc ? cur : (acc.distance > cur.distance) ? cur : acc, void 0)
    if (mostNear && mostNear.distance < 5 && !isBlockedBetween(mostNear, me)) {
      return true;
    }

    me.overhead('forward tracking');

    const nextNode = settings.nodes[settings.nodes.index + 1];
    if (nextNode) {
      settings.nodes.index++;
      console.log('Forward tracking');
      Pather.walkTo(nextNode.x, nextNode.y);
    }
  }

  let start = [], startArea = me.area, cachedNodes: { x; y }[] = undefined;
  const getUnits_filtered = () => {
    let monsters = getUnits(1, -1)
      .filter(m => m.area === me.area && m.attackable && !globalThis['__________ignoreMonster'].includes(m.gid))
      .filter(unit => ( // Shamaans have a higher range
            (range =>
                start.length // If start has a length
                  ? getDistance(start[0], start[1], unit) < range // If it has a range smaller than from the start point (when using me.clear)
                  : getDistance(me, unit) < range // if "me" move, the object doesn't move. So, check distance of object
            )(shamans.includes(unit.classid) ? settings.range * 1.6 : settings.range)

            // clear monsters on the path
            || (
              ( /* cache the nodes*/ cachedNodes = cachedNodes || settings.nodes
                  .slice(settings.nodes.index, settings.nodes.index + 5)
                  .filter(el => el.distance < 30)
              )
                .some(node => getDistance(unit, node.x, node.y) < smallStepRange)
            )
          )
          && !isBlockedBetween(me, unit)
      )
      .filter(unit => {
        if (!settings.spectype || typeof settings.spectype !== 'number') return true; // No spectype =  all monsters
        // noinspection JSBitwiseOperatorUsage
        return unit.spectype & settings.spectype;
      })

    if (settings.filter) {
      monsters = monsters.filter(settings.filter);
    } else {
      // Fuck fallen's on bigger range, they are totally pointless to pwn
      monsters = monsters.filter((monster) => {
        let isFallenB = fallens.includes(monster.classid);
        if (!isFallenB) return true;
        if (monster.isSpecial) return true;
        const {targetx, targety} = monster;
        // Only if fallens are close by and not walking away
        return getDistance(me, monster) < 5 && !targetx || getDistance(me.x, me.y, targetx, targety) < 5;
      })
    }

    // too much monsters, quick sort
    if (monsters.length > 7) {
      return monsters.sort((a, b) => a.distance - b.distance);
    }
    return monsters.sort((a, b) => {
      // shamans are a mess early game
      let isShamanA = shamans.includes(a.classid);
      let isFallenB = fallens.includes(b.classid);
      if (isShamanA && isFallenB && !checkCollision(me, a, 0x7)/*line of sight*/) {
        // return shaman first, if we have a direct line of sight
        return -1;
      }
      if (typeof a['beendead'] !== 'undefined' && typeof b['beendead'] === 'undefined' && a['beendead'] && !b['beendead']) {
        return 1; // those that been dead before (aka fallens) will be moved up from the list, so we are more likely to pwn shamans on a safe moment
      }
      return clearDistance(me.x, me.y, a.x, a.y) - (clearDistance(me.x, me.y, b.x, b.y));
    });
  }

  // If we clear around _me_ we move around, but just clear around where we started
  let units;
  let lastUnitGid: number = 0;
  let casts = 0;
  if (me === this) start = [me.x, me.y];
  let backtracked = false;
  while ((units = getUnits_filtered()).length) {
    exporting.emit('sorting', units);
    // sorting algorithm can also take out monsters
    if (!units.length) break;
    if (settings.dryRun) return false;

    // near monsters, we can handle kinda depends on our health.
    // let nearMonsters = Math.floor((5 * (1 / me.hpmax * me.hp)) + 1);
    const maxNearMonsters = Math.floor((4 * (1 / me.hpmax * me.hp)) + 1);

    if (!backtracked) {
      const nearUnits = units.filter(unit => unit.attackable && unit.distance < 10);
      const nearMissiles = (getUnits(sdk.unittype.Missiles)
        .filter(unit => unit.distance < 10 && (unit.getParent() as Unit)?.gid !== me.gid && (unit.getParent() as Unit)?.gid !== me.getMerc()?.gid) as Missile[])
        .filter(m => _missiles[m.classid] && (_missiles[m.classid].velocity > 0 || m.hits(me)) && (_missiles[m.classid].minDamage > 0 || _missiles[m.classid].eMin > 0))
      me.overhead('backtrack counter (' + nearUnits.length + '+' + nearMissiles.length + '=' + (nearUnits.length + nearMissiles.length) + '/' + maxNearMonsters + ')');
      if ((nearUnits.length + nearMissiles.length) >= maxNearMonsters && ((me.mp / me.mpmax) > 0.2 || me.getItemsEx().filter(i => (i.isInBelt || i.isInInventory) && i.itemType === sdk.itemtype.manapotion).length > 0)) {
        me.overhead('Want to backtrack');
        if (backTrack(units, nearMissiles)) {
          backtracked = true;
          continue; // we maybe want to attack someone else now
        }
      }
    }
    backtracked = false;
    if (settings.callback && settings.callback()) return;

    const unit = units.shift();
    if (lastUnitGid !== unit.gid) {
      lastUnitGid = unit.gid;
      casts = 0;
    }

    // Do something with the effort to not kill monsters that are too harsh
    const result = ClassAttack.doAttack(unit);
    if (typeof unit.casts === 'undefined') unit.casts = 0;
    if (rand(0, 100) < 7) { // move about every 4th attack
      // console.log('random move - '+unit.casts);
      Pather.walkTo(me.x + rand(-4, 4), me.y + rand(-4, 4));
    } else {
      if (unit.distance > 15) {
        forwardTrack(units);
      }
    }


    // cant attack this monsters, skip it
    if (result === 2 || casts++ > 50) {
      console.log('Skip this monster');
      globalThis['__________ignoreMonster'].push(unit.gid);
    }

    if (settings.once || startArea !== me.area) {
      return true;
    }
    Pickit.pickItems(3, true);
  }
  return true;
}).bind(me);

Object.keys(Events.prototype).forEach(key => exporting[key] = Events.prototype[key]);

export = exporting;
