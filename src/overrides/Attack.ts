// @ts-ignore
import moveTo, {MovingPath} from "../lib/MoveTo";

// @ts-ignore
if (getScript(true).name.toLowerCase() === 'default.dbj') include("common/Attacks/Sorceress.js");
import sdk from "../sdk";
import {Override} from "./Override";
import {Collision, findCastingSpotSkill} from "../lib/Coords";
import _missiles from "../lib/data/MissileData";
import GameData from "../lib/data/GameData";

// @ts-ignore
Unit.prototype.__defineGetter__('attackable', function () {
  if (this.type === 0 && this.mode !== 17 && this.mode !== 0) { //ToDo: build in here a check if player is hostiled
    return true;
  }


  if (this.hp === 0 || this.mode === 0 || this.mode === 12) { // Dead monster
    return false;
  }

  if (this.getStat(172) === 2) {	// Friendly monster/NPC
    return false;
  }

  if (this.charlvl < 1) { // catapults were returning a level of 0 and hanging up clear scripts
    return false;
  }

  if (getBaseStat("monstats", this.classid, "neverCount")) { // neverCount base stat - hydras, traps etc.
    return false;
  }


  // Monsters that are in flight
  if ([110, 111, 112, 113, 144, 608].indexOf(this.classid) > -1 && this.mode === 8) {
    return false;
  }

  // Monsters that are Burrowed/Submerged
  if ([68, 69, 70, 71, 72, 258, 258, 259, 260, 261, 262, 263].indexOf(this.classid) > -1 && this.mode === 14) {
    return false;
  }

  return [sdk.monsters.ThroneBaal].indexOf(this.classid) <= -1;
});

new Override(Attack, Attack.init, function (original) {

  // Dont load any files, as we already load it the starter

  if (me.gametype === 1) {
    this.checkInfinity();
    this.getCharges();
    this.getPrimarySlot();
  }
});

// New kolbot dont have this method
Attack.weaponSwitch ||= function (...args) {
  // @ts-ignore
  me.switchWeapons(...args)
}

new Override(Attack, Attack.clear, function (original, range = 25, spectype = 0, bossId = false, sortfunc = this.sortMonsters, pickit = true) { // probably going to change to passing an object
  while (!me.gameReady) {
    delay(40);
  }

  if (typeof (range) !== "number") {
    throw new Error("Attack.clear: range must be a number.");
  }

  let i, boss, orgx, orgy, result, start, coord, skillCheck, secAttack,
    retry = 0,
    gidAttack = [],
    attackCount = 0;

  if (bossId) {
    for (i = 0; !boss && i < 5; i += 1) {
      boss = bossId > 999 ? getUnit(1, -1, -1, bossId) : getUnit(1, bossId);

      delay(200);
    }

    if (!boss) {
      throw new Error("Attack.clear: " + bossId + " not found");
    }

    orgx = boss.x;
    orgy = boss.y;
  } else {
    orgx = me.x;
    orgy = me.y;
  }

  const monsterList: Monster[] = [];
  let target: Monster = getUnit(1);
  if (target) {
    do {
      if ((!spectype || (target.spectype & spectype)) && target.attackable) {
        // Speed optimization - don't go through monster list until there's at least one within clear range
        if (!start && getDistance(target, orgx, orgy) <= range &&
          (me.getSkill(54, 1) || !Scripts.Follower || !checkCollision(me, target, 0x1))) {
          start = true;
        }

        monsterList.push(copyUnit(target));
      }
    } while (target.getNext());
  }

  while (start && monsterList.length > 0 && attackCount < 300) {
    if (boss) {
      orgx = boss.x;
      orgy = boss.y;
    }

    if (me.dead) {
      return false;
    }

    //monsterList.sort(Sort.units);
    monsterList.sort(sortfunc);

    target = copyUnit(monsterList[0]);

    if (target.x !== undefined && (getDistance(target, orgx, orgy) <= range || (this.getScarinessLevel(target) > 7 && getDistance(me, target) <= range)) && target.attackable) {
      if (Config.Dodge && me.hp * 100 / me.hpmax <= Config.DodgeHP) {
        this.deploy(target, Config.DodgeRange, 5, 9);
      }

      Misc.townCheck(true);
      //me.overhead("attacking " + target.name + " spectype " + target.spectype + " id " + target.classid);

      result = ClassAttack.doAttack(target, attackCount % 15 === 0);

      if (result) {
        retry = 0;

        if (result === 2) {
          monsterList.shift();

          continue;
        }

        for (i = 0; i < gidAttack.length; i += 1) {
          if (gidAttack[i].gid === target.gid) {
            break;
          }
        }

        if (i === gidAttack.length) {
          gidAttack.push({gid: target.gid, attacks: 0, name: target.name});
        }

        gidAttack[i].attacks += 1;
        attackCount += 1;

        // Skip non-unique monsters after 15 attacks, except in Throne of Destruction
        if (me.area !== 131 && !(target.spectype & 0x7) && gidAttack[i].attacks > 15) {
          print("ÿc1Skipping " + target.name + " " + target.gid + " " + gidAttack[i].attacks);
          monsterList.shift();
        }

        if (target.mode === 0 || target.mode === 12 || Config.FastPick === 2) {
          Pickit.fastPick();
        }
      } else {
        if (retry++ > 3) {
          monsterList.shift();
          retry = 0;
        }
      }
    } else {
      monsterList.shift();
    }
  }

  ClassAttack.afterAttack(pickit);
  this.openChests(range, orgx, orgy);

  if (attackCount > 0 && pickit) {
    Pickit.pickItems();
  }

  return true;
})

new Override(Attack, Attack.kill, function (original, classId) {
  let i, target, gid, result,
    retry = 0,
    errorInfo = "",
    attackCount = 0;

  if (typeof classId === "object" && classId /*notnull*/) {
    target = classId;
  }

  for (i = 0; !target && i < 5; i += 1) {
    target = getUnit(1, classId);

    delay(200);
  }

  if (!target) {
    throw new Error("Attack.kill: Target not found");
  }

  gid = target.gid;

  while (attackCount < Config.MaxAttackCount && target.attackable) {
    Misc.townCheck();

    if (!target || !copyUnit(target).x) { // Check if unit got invalidated, happens if necro raises a skeleton from the boss's corpse.
      target = getUnit(1, -1, -1, gid);

      if (!target) {
        break;
      }
    }

    result = ClassAttack.doAttack(target, attackCount % 15 === 0);

    if (result === 0) {
      if (retry++ > 3) {
        errorInfo = " (doAttack failed)";

        break;
      }

    } else if (result === 2) {
      errorInfo = " (No valid attack skills)";

      break;
    } else {
      retry = 0;
    }

    attackCount += 1;
  }
  console.log('attack kill end loop');

  if (attackCount === Config.MaxAttackCount) {
    errorInfo = " (attackCount exceeded)";
  }

  if (Config.MFSwitchPercent) {
    this.weaponSwitch(this.getPrimarySlot());
  }

  ClassAttack.afterAttack();

  if (!target || !copyUnit(target).x) {
    return true;
  }

  if (target.hp > 0 && target.mode !== 0 && target.mode !== 12) {
    console.log(target, target.name, errorInfo);
    throw new Error("Failed to kill " + target.name + errorInfo);
  }

  return true;
})
const tmpLines = [];
// Returns: 0 - fail, 1 - success, 2 - no valid attack skills
new Override(ClassAttack, ClassAttack.doCast, (original, unit, skillId, moveToPath?: MovingPath) => {
  // print(getCollision(me.area, me.x, me.y, unit.x, unit.y).toString(2));

  // console.debug('>' + (getCollisionBetweenCoords(me.x, me.y, unit.x, unit.y).toString(2)));
  if (checkCollisionBetween(me.x, me.y, unit.x, unit.y, 5, Collision.BLOCK_MISSILE)) {
    console.log('Need to move?');
    const spot = findCastingSpotSkill(skillId, unit);
    // skip this monster
    if (!spot) {
      console.log('Cant find spot?');
      return 2;
    }

    console.log(spot);
    if (spot.distance > 2) {
      console.log('Getting into position', spot.distance);
      tmpLines.push(new Line(spot.x, spot.y, me.x, me.y, 0x99, true));
      // If there is a moveToPath, skip towards that moveToPath
      if (moveToPath) {
        const resetNodeIndex = moveToPath.findIndex(el => el.distance < 5);
        if (resetNodeIndex > moveToPath.index) {
          console.log('Moving', resetNodeIndex - moveToPath.index, 'nodes forward');
          // run path hooks
          for (let i = moveToPath.index; i <= resetNodeIndex; i++) {
            if (typeof moveToPath[i].hook === 'function') {
              moveToPath[i].hook();
            }
          }
          moveToPath.index = resetNodeIndex;
        }
      }
      Pather.moveTo(spot.x, spot.y);

    } else {
      console.log('Skip this monster?');
      return 2;
    }
  }

  if (skillId > -1) {
    if (!unit.dead && !checkCollision(me, unit, 0x4)) {
      let target = targetPointForSkill(skillId, unit);
      if (target) {
        Skill.cast(skillId, Skill.getHand(skillId), target.x, target.y);
      } else {
        Skill.cast(skillId, Skill.getHand(skillId), unit);
      }
    }

    return 1;
  }

  return 2;
});


const targetPointForSkill = (skillId: number, monster: Monster): PathNode | null => {
  let missileName = getBaseStat("skills", skillId, "cltmissile");
  let missile = _missiles[missileName];
  if (missile && missile.velocity > 0) {
    if (monster.isMoving && (monster.targetx !== me.x || monster.targety !== me.y)) {
      let startX = monster.x;
      let startY = monster.y;
      // tiles per second velocities
      // ToDo: is monster slowed by freeze or something ?
      let monsterVelocityTPS = monster.currentVelocity;
      let missileVelocityTPS = missile.velocity;

      // tiles per frame velocities
      let monsterVelocityTPF = monsterVelocityTPS / 25;
      let missileVelocityTPF = missileVelocityTPS / 25;

      //console.log("monster is moving to "+monster.targetx+", "+monster.targety + " at speed "+monsterVelocity);
      let path = getPath(monster.area, startX, startY, monster.targetx, monster.targety, 2, 1);
      if (path && path.length) {
        // path is reversed from target to monster, we will check from last path position (target) to monster position
        path.reverse();
        let diffS: number;
        let diffF: number;
        let found: PathNode;
        let time: {
          missile: { seconds?: number, frames?: number },
          monster: { seconds?: number, frames?: number }
        } = {
          missile: {},
          monster: {}
        };
        for (let i = 0; i < path.length; i++) {
          let pos = path[i];

          // ToDo : does missing spawn at me position ?
          let distanceForMissile = getDistance(me, pos);
          if (distanceForMissile > missile.range) {
            // too far for missile to reach this position
            continue;
          }
          let distanceForMonster = getDistance({x: startX, y: startY}, pos);

          let timeForMonsterF = distanceForMonster / monsterVelocityTPF;

          // time in seconds
          // let castTimeS = GameData.castingDuration(skillId);
          // let timeForMissileS = distanceForMissile / missileVelocityTPS + castTimeS;

          // time in frames
          let castTimeF = GameData.castingFrames(skillId);
          let timeForMissileF = distanceForMissile / missileVelocityTPF + castTimeF;
          // let timeForMonsterS = distanceForMonster / monsterVelocityTPS;

          // Todo: missile and monster size

          // diff seconds
          // diffS = timeForMissileS-timeForMonsterS;

          // diff frames
          diffF = timeForMissileF - timeForMonsterF;

          // diff > 0 : missile will reach pos after monster
          // diff < 0 : missile will reach pos before monster
          // console.log("time for monster to reach "+pos+" = "+timeForMonster);
          // console.log("time for missile to reach "+pos+" = "+timeForMissile);
          // console.log("diff = "+diff)
          if (i === 0 && diffF >= 0) {
            // last path position and missile is late, we can't predict next monster target, shoot at last path position
            // it may fail because monster may be moving at other target while missile is arriving
            // console.log("missile will be too late");
            found = pos;
            // time.missile.seconds = timeForMissileS;
            time.missile.frames = timeForMissileF;
            // time.monster.seconds = timeForMonsterS;
            time.monster.frames = timeForMonsterF;
            break;
          }

          // the number of frames needed for unit to move 1 tile
          let timeToMoveOneTileMonsterF = 1 / monsterVelocityTPF;
          // let timeToMoveOneTileMissileF = 1 / missileVelocityTPF;

          // while missile is travelling, monster will continue to move
          // if the difference is greater than the time a monster will move 1 tile, the missile will miss
          // todo: monster size, missile size
          if (diffF >= -1 * timeToMoveOneTileMonsterF && diffF <= 1 * timeToMoveOneTileMonsterF) {
            found = pos;
            // time.missile.seconds = timeForMissileS;
            time.missile.frames = timeForMissileF;
            // time.monster.seconds = timeForMonsterS;
            time.monster.frames = timeForMonsterF;
            break;
          }
        }
        if (found) {
          /*console.log("missile will hit monster in "+time.missile.seconds+" ("+time.missile.frames+") at "+found.x+", "+found.y);
          console.log("time for monster = "+time.monster.seconds+ " ("+time.monster.frames+")")
          console.log("diff missile-monster = "+diffS+ " ("+diffF+")");*/
          return found;
        }
      }
    }
  }
  return null;
}