import {Override, removeExistingProp} from "./Override";
import sdk from "../sdk";
import CharData from "../lib/CharData";
import Worker from "../lib/worker";
import GameData from "../lib/data/GameData";
import {Collision} from "../lib/Coords";


// Store the global waypoint information
(original => {
  const currentMode = (['normal', 'nightmare', 'hell'] as const)[me.diff];
  const currentWaypoints = CharData[currentMode].waypoints;

  Worker.runInBackground('getWaypointData', function () {

    if (!getUIFlag(sdk.uiflags.Waypoint)) return true;

    // Waypoint data is open
    currentWaypoints.splice(0, currentWaypoints.length);
    Pather.wpAreas.forEach((area, idx) => currentWaypoints.push(original(idx)));

    return true;
  })


  globalThis['getWaypoint'] = function (id: number) {
    return id > -1 && currentWaypoints.length > id && currentWaypoints[id];
  }
})(getWaypoint);

{
  let coords = function () {
    if (Array.isArray(this) && this.length > 1) {
      return [this[0], this[1]];
    }

    if (typeof this.x !== 'undefined' && typeof this.y !== 'undefined') {
      return this instanceof PresetUnit && [this.roomx * 5 + this.x, this.roomy * 5 + this.y] || [this.x, this.y]
    }

    return [undefined, undefined];
  };

  const wk = new WeakMap<Object, any>();
  removeExistingProp(Object.prototype, {
    distance: {
      get: function () {
        return !me.gameReady ? NaN : getDistance.apply(null, [me, ...coords.apply(this)]);
      },
      enumerable: false,
    },
    path: {
      get: function () {
        if (wk.get(this)) return wk.get(this);
        let useTeleport = Pather.useTeleport();
        return getPath.apply(this, [typeof this.area !== 'undefined' ? this.area : me.area, me.x, me.y, ...coords.apply(this), useTeleport ? 1 : 0, useTeleport ? ([62, 63, 64].indexOf(me.area) > -1 ? 30 : Pather.teleDistance) : Pather.walkDistance])
      },
      set: function (v) {
        wk.set(this, v);
        return true;
      },
      enumerable: false,
    },
  });
}


// Small override to give the ability to override the run command, useful when we run away from monsters
export const settings = {
  forceRun: false,
};

new Override(Pather, Pather.walkTo, function (this: typeof Pather, original, x: number, y: number, minDist: number) {
  while (!me.gameReady) {
    delay(100);
  }

  if (minDist === undefined) {
    minDist = me.inTown ? 2 : 4;
  }

  var i, angle, angles, nTimer, whereToClick, tick,
    nFail = 0,
    attemptCount = 0;

  // Stamina handler and Charge
  if (!me.inTown && !me.dead) {
    if (me.stamina / me.staminamax * 100 <= 20) {
      me.getItemsEx()
        .filter(i => i.classid === sdk.items.staminapotion &&
          i.isInInventory)
        .first()?.interact();
    }

    if (me.runwalk === 1 && me.stamina / me.staminamax * 100 <= 15) {
      me.runwalk = 0;
    }

    // the less stamina you have, the more you wait to recover
    let recover = me.staminaMaxDuration < 30 ? 80 : 50;
    if (me.runwalk === 0 && me.stamina / me.staminamax * 100 >= recover) {
      me.runwalk = 1;
    }

    if (Config.Charge && me.classid === 3 && me.mp >= 9 && getDistance(me.x, me.y, x, y) > 8 && Skill.setSkill(107, 1)) {
      if (Config.Vigor) {
        Skill.setSkill(115, 0);
      }

      Misc.click(0, 1, x, y);

      while (me.mode !== 1 && me.mode !== 5 && !me.dead) {
        delay(40);
      }
    }
  }

  if (settings.forceRun || me.inTown && me.runwalk === 0) {
    me.runwalk = 1;
  }

  while (getDistance(me.x, me.y, x, y) > minDist && !me.dead) {
    if (me.classid === 3 && Config.Vigor) {
      Skill.setSkill(115, 0);
    }

    if (this.openDoors(x, y) && getDistance(me.x, me.y, x, y) <= minDist) {
      return true;
    }

    Misc.click(0, 0, x, y);

    attemptCount += 1;
    nTimer = getTickCount();

    ModeLoop:
      while (me.mode !== 2 && me.mode !== 3 && me.mode !== 6) {
        if (me.dead) {
          return false;
        }

        if ((getTickCount() - nTimer) > 500) {
          nFail += 1;

          if (nFail >= 3) {
            return false;
          }

          angle = Math.atan2(me.y - y, me.x - x);
          angles = [Math.PI / 2, -Math.PI / 2];

          for (i = 0; i < angles.length; i += 1) {
            // TODO: might need rework into getnearestwalkable
            whereToClick = {
              x: Math.round(Math.cos(angle + angles[i]) * 5 + me.x),
              y: Math.round(Math.sin(angle + angles[i]) * 5 + me.y)
            };

            if (Attack.validSpot(whereToClick.x, whereToClick.y)) {
              Misc.click(0, 0, whereToClick.x, whereToClick.y);

              tick = getTickCount();

              while (getDistance(me, whereToClick) > 2 && getTickCount() - tick < 1000) {
                delay(40);
              }

              break;
            }
          }

          break ModeLoop;
        }

        delay(10);
      }

    // Wait until we're done walking - idle or dead
    while (getDistance(me.x, me.y, x, y) > minDist && me.mode !== 1 && me.mode !== 5 && !me.dead) {
      delay(10);
    }

    if (attemptCount >= 3) {
      return false;
    }
  }

  return !me.dead && getDistance(me.x, me.y, x, y) <= minDist;
} as typeof Pather.walkTo)


new Override(Pather, Pather.useTeleport, function (original) {
  return original();
  if (!original()) return false;

  const manaTP = Skill.getManaCost(sdk.skills.Teleport);
  let numberOfTeleport = ~~(me.mpmax / manaTP);
  return numberOfTeleport > 2 && (me.mp > manaTP * 1.5);
});

new Override(Pather, Pather.moveTo, function (original, x: number, y: number, retry?, clearPath?, pop?) {

  if (me.dead) { // Abort if dead
    return false;
  }

  var i, adjustedNode, cleared, useTeleport,
    node = {x: x, y: y},
    fail = 0;

  for (i = 0; i < this.cancelFlags.length; i += 1) {
    if (getUIFlag(this.cancelFlags[i])) {
      me.cancel();
    }
  }

  if (getDistance(me, x, y) < 2 && !checkCollisionBetween(me.x, me.y, x, y, 5, Collision.BLOCK_MISSILE)) {
    console.log('Distance and check collision ok ', getDistance(me, x, y), !checkCollisionBetween(me.x, me.y, x, y, 5, Collision.BLOCK_MISSILE));
    return true;
  }

  if (x === undefined || y === undefined) {
    throw new Error("moveTo: Function must be called with at least 2 arguments.");
  }

  if (typeof x !== "number" || typeof y !== "number") {
    throw new Error("moveTo: Coords must be numbers");
  }

  if (retry === undefined) {
    retry = 3;
  }

  if (clearPath === undefined) {
    clearPath = false;
  }

  if (pop === undefined) {
    pop = false;
  }

  // Custom shit -> If node is futher as 20, we think about using teleport
  useTeleport = (getDistance(me, x, y) > 15 || me.diff || me.act > 3) && this.useTeleport();

  let path = getPath(me.area, x, y, me.x, me.y, useTeleport ? 1 : 0, useTeleport ? ([62, 63, 64].indexOf(me.area) > -1 ? 30 : this.teleDistance) : this.walkDistance);

  if (!path) {
    throw new Error("moveTo: Failed to generate path.");
  }

  if (!useTeleport) {
    const inTheWayShit = getUnits().filter(el => [7].includes(el.classid) && el.distance < 3);
    inTheWayShit.length && inTheWayShit.forEach(obj => Misc.click(0, 0, obj));
  }

  path.reverse();

  // teleport rewrite
  if (useTeleport && path.length >= 2 && !pop) {
    // If we are teleporting just with a distance of 2 nodes, try to teleport straight away
    if (path.last().distance < 65) {
      const node = path.last();
      const isNeighbour = (getRoom() || undefined)?.getNearby().filter(room => room.isInRoom(node)).length > 0;

      // Since its a neighbour, teleport straight to the next node
      if (isNeighbour) {
        const teleportFrames = GameData.castingFrames(sdk.skills.Teleport);
        console.log('Attempting long teleport node');
        Skill.setSkill(54, 0);
        const dist = path.last().distance;
        // @ts-ignore
        Packet.castSkill(0, x, y);
        const success = Misc.poll(() => getDistance(me, x, y) < 5, (40 * teleportFrames) + (me.ping * 2), 3);
        if (success) {
          console.log('Long node teleportation -- Distance ' + ((dist + .5) | 0));
          return true;
        }
        console.log('Failed to teleport long distance  -- Distance ' + ((dist + .5) | 0));
      }
    }
    /*
            if (path.length === 2) {
                // for short distance teleportation, its better to rewrite if the first node is nearly next to us.
                // as any dodge dies instantly if we teleport almost next to us, specially at low fcr
                if (path.first()?.distance < 15) {
                    let teleDistance = getDistance(path.last(), me) / 3 * 2;
                    const tmpPath = getPath(me.area, me.x, me.y, x, y, 1, teleDistance);

                    if (tmpPath) {
                        //ToDo check if this is shorter/better
                        console.log('better tele? before ', path.map(el => el.distance), 'after', tmpPath.map(el => el.distance))
                        // console.log('rewritten teleport path for safety');
                        // path = tmpPath;
                    }
                }
            }*/
  }

  if (pop) {
    path.pop();
  }

  // PathDebug.drawPath(path);

  // if (useTeleport && Config.TeleSwitch && path.length > 5) {
  //     Attack.weaponSwitch(Attack.getPrimarySlot() ^ 1);
  // }

  while (path.length > 0) {
    if (me.dead) { // Abort if dead
      return false;
    }

    for (i = 0; i < this.cancelFlags.length; i += 1) {
      if (getUIFlag(this.cancelFlags[i])) {
        me.cancel();
      }
    }

    node = path.shift();

    /* Right now getPath's first node is our own position so it's not necessary to take it into account
        This will be removed if getPath changes
    */
    if (getDistance(me, node) > 2) {
      // Make life in Maggot Lair easier
      if ([62, 63, 64].indexOf(me.area) > -1) {
        adjustedNode = this.getNearestWalkable(node.x, node.y, 15, 3, 0x1 | 0x4 | 0x800 | 0x1000);

        if (adjustedNode) {
          node.x = adjustedNode[0];
          node.y = adjustedNode[1];
        }
      }

      const tpMana = Skill.getManaCost(sdk.skills.Teleport);
      if (useTeleport && tpMana <= me.mp ? this.teleportTo(node.x, node.y) : this.walkTo(node.x, node.y, (fail > 0 || me.inTown) ? 2 : 4)) {
        if (!me.inTown) {
          if (this.recursion) {
            this.recursion = false;

            // NodeAction.go({clearPath: clearPath});

            if (getDistance(me, node.x, node.y) > 5) {
              this.moveTo(node.x, node.y, retry, clearPath, pop);
            }

            this.recursion = true;
          }

          Misc.townCheck();
        }
      } else {
        if (fail > 0 && !useTeleport && !me.inTown) {
          // Don't go berserk on longer paths
          if (!cleared) {
            Attack.clear(5);

            cleared = true;
          }

          if (fail > 1 && me.getSkill(143, 1)) {
            Skill.cast(143, 0, node.x, node.y);
          }
        }

        // Reduce node distance in new path
        path = getPath(me.area, x, y, me.x, me.y, useTeleport ? 1 : 0, useTeleport ? rand(25, 35) : rand(10, 15));
        fail += 1;

        if (!path) {
          throw new Error("moveTo: Failed to generate path.");
        }

        path.reverse();
        // PathDebug.drawPath(path);

        if (pop) {
          path.pop();
        }

        print("move retry " + fail);

        if (fail > 0) {
          // Packet.flash(me.gid);
          if (fail >= retry) {
            break;
          }
        }
      }
    }

    delay(5);
  }

  if (useTeleport && Config.TeleSwitch) {
    Attack.weaponSwitch(Attack.getPrimarySlot());
  }

  // PathDebug.removeHooks();

  return getDistance(me, node.x, node.y) < 5;
})

{

  // Cant use this from Util.ts as this bugs the recursive imports. Need to fix this, ToDo
  const wpIDs = [119, 145, 156, 157, 237, 238, 288, 323, 324, 398, 402, 429, 494, 496, 511, 539];
  const getWpPreset = (area: number = me.area) => {
    for (let i = 0; i < wpIDs.length; i += 1) {
      let preset = getPresetUnit(area, 2, wpIDs[i]);
      if (preset) return preset;
    }
    return undefined;
  }

  new Override(Pather, Pather.useWaypoint, function (original, ...args) {
    if (!me.inTown) {
      let wp = getWpPreset();
      if (!wp) {
        Town.goToTown();
        wp = getWpPreset();
      }
      if (!wp) {
        console.log('Waypoint not found in area, take tp to town')
        return original.apply(Pather, args);
      }

      //ToDo; figure out if walking path in town is further as walking path here, or teleport time
      if (!getUnit(2, "waypoint")) {
        console.log('Waypoint not found near me, go to town');
        Town.goToTown();
      }
    }
    return original.apply(Pather, args);
  });
}

new Override(Pather, 'getWalkDistance', function (original, x, y, area = me.area, xx = me.x, yy = me.y, reductionType: 0 | 1 | 2 = 2, radius: number = 5) {
  return (getPath(area, x, y, xx, yy, reductionType, radius) || [])
    // distance between node x and x-1
    .map((e, i, s) => i && getDistance(s[i - 1], e) || 0)
    .reduce((acc, cur) => acc + cur, 0) || Infinity;
});

/*
    Pather.makePortal(use);
    use - use the portal that was made
*/
new Override(Pather, Pather.makePortal, function (original, use) {
  if (me.inTown) {
    return true;
  }

  var i, portal, oldPortal, oldGid, tick, tpTome;

  for (i = 0; i < 5; i += 1) {
    if (me.dead) {
      break;
    }

    let tpTool = Town.getTpTool();

    if (!tpTool) {
      throw new Error("makePortal: No TP tomes or scrolls.");
    }

    oldPortal = getUnits(sdk.unittype.Objects, "portal")
      .filter(p => p.getParent() === me.name)
      .first();

    if (oldPortal) {
      oldGid = oldPortal.gid;
    }

    tpTool.interact();

    tick = getTickCount();

    MainLoop:
      while (getTickCount() - tick < Math.max(500 + i * 100, me.ping * 2 + 100)) {
        portal = getUnits(sdk.unittype.Objects, "portal")
          .filter(p => p.getParent() === me.name && p.gid !== oldGid)
          .first();
        if (portal) {
          if (use) {
            if (this.usePortal(null, null, copyUnit(portal))) {
              return true;
            }
            break MainLoop; // don't spam usePortal
          } else {
            return copyUnit(portal);
          }
        }

        delay(10);
      }

    // Packet.flash(me.gid);
  }

  return false;
})

// new Override(Pather, Pather.useUnit, function (original, type, id, targetArea) {
//     const preArea = me.area;
//
//     // Fix obscure bug in jail lvl 3 where jail lvl 2 exit has the same id as inner cloister, but jail 2 gets selected instead
//     let unit = Misc.poll(() => getUnits(type, id).sort((a, b) => a.distance - b.distance).first());
//
//     if (!unit) {
//         throw new Error("useUnit: Unit not found. ID: " + id);
//     }
//
//     if (
//         (me.area === sdk.areas.Travincal && targetArea === sdk.areas.DuranceOfHateLvl1 && me.getQuest(sdk.quests.KhalimsWill, 0) !== 1)
//         || (me.area === sdk.areas.ArreatSummit && targetArea === sdk.areas.WorldstoneLvl1 && me.getQuest(sdk.quests.RiteOfPassage, 0) !== 1)) {
//         throw new Error("useUnit: Incomplete quest.");
//     }
//
//     for (let i = 0; i < 3; i++) {
//         if (unit.distance > 5) this.moveToUnit(unit);
//         if (unit.distance > 5) this.moveToUnit(unit);
//
//         if (type === 2 && unit.mode === 0) {
//             if (me.area === sdk.areas.A3SewersLvl1) {
//                 this.openUnit(2, 367);
//             } else {
//                 this.openUnit(2, id);
//             }
//         }
//
//         if (type === 5) {
//             Misc.click(0, 0, unit);
//         } else {
//             sendPacket(1, 0x13, 4, unit.type, 4, unit.gid);
//         }
//
//         if (Misc.poll((() => (!targetArea && me.area !== preArea) || me.area === targetArea), 3000, 10)) {
//             break;
//         }
//
//         //@ts-ignore
//         const coord = CollMap.getRandCoordinate(me.x, -1, 1, me.y, -1, 1, 3);
//         coord && this.moveTo(coord.x, coord.y);
//     }
//
//     return targetArea ? me.area === targetArea : me.area !== preArea;
// })
