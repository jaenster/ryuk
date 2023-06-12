import sdk from "../../sdk";
import {calculateSpots} from "../util";
import {isBlockedBetween} from "../../lib/Coords";
import Shopper from "../../lib/town/actions";

export = function () {
  var portal, tick;

  const preattack = function () {
    if (getTickCount() - tick > 8e3 && getTickCount() - tick < 14e3) {
      if (me.getState(121)) {
        while (me.getState(121)) delay(50);
      }
      Skill.cast(sdk.skills.Blizzard, 0, 15094 + rand(-1, 1), 5028);
    }
  };

  const checkThrone = function () {
    var monster = getUnit(1);

    if (monster) {
      do {
        if (monster.attackable && monster.y < 5080) {
          switch (monster.classid) {
            case 23:
            case 62:
              return 1;
            case 105:
            case 381:
              return 2;
            case 557:
              return 3;
            case 558:
              return 4;
            case 571:
              return 5;
            default:
              clearThrone();

              return 0;
          }
        }
      } while (monster.getNext());
    }

    return 0;
  };

  const clearThrone = function () {

    const safeSpots = [
      ...calculateSpots({x: 15093, y: 5029}, 25),
      ...calculateSpots({x: 15093, y: 5029}, 20),
    ];
    const between = {
      x1: 15070, y1: 5000,
      x2: 15120, y2: 5075,
    };


    console.log('clearing throne');

    let units: Monster[], mySpot: { x: number, y: number }, missiles: Unit[];
    const manaTP = Skill.getManaCost(sdk.skills.Teleport);

    const calcBestSpot = () => safeSpots
      .filter((spot, idx, self) =>
        37 <= spot.distance && !isBlockedBetween(units[0].x, units[0].y, spot.x, spot.y)
        || self.length - 1 == idx // or, its the last one
      )
      .sort(
        (a, b) => {
          const distanceA = units.reduce((acc, cur) => acc + getDistance(a, cur), 0),
            distanceB = units.reduce((acc, cur) => acc + getDistance(b, cur), 0);
          return distanceB - distanceA;
        }
      );

    const getChamberUnits = () => getUnits(1).filter(unit => {
      return !unit.dead && unit.attackable &&
        unit.x >= between.x1 && unit.x <= between.x2 &&
        unit.y >= between.y1 && unit.y <= between.y2;
    });

    while ((units = getChamberUnits()).length) {
      const imumn = getUnits(1).filter(el => el.attackable && el.getStat(sdk.stats.Coldresist) >= 100 && getDistance(el, me) < 30);
      if (imumn.length) {
        throw new Error('Cold imumns, stop');
      }

      missiles = getUnits(3).filter(el => el.distance < 10 && (el.getParent() as Unit)?.gid !== me.gid);
      if (missiles.length > 2 || units.some(a => a && a.distance < 7) || !mySpot) {
        console.debug('eh someone is too close =O, move away as soon as possible');

        let possibleSpots = calcBestSpot();
        mySpot = possibleSpots.first();
        if (mySpot.distance > 43) {
          Pather.moveTo(mySpot.x, mySpot.y);
        } else {
          Pather.teleportTo(mySpot.x, mySpot.y)
        }
      }

      // console.debug('here');
      try {
        // that one that is near
        const near = units.filter(a => a && !a.dead).sort((a, b) => a.distance - b.distance).first();
        if (near) {
          const [skill] = ClassAttack.decideSkill(near)
          if (skill) {
            const manaUse = Skill.getManaCost(skill);

            if (me.mp < manaUse + manaTP) {
              me.overhead('Dont attack, safe mana for teleport')
              delay(10);
              continue;
            }
            ClassAttack.doCast(near, skill, undefined)
          }
        }
        delay(10);
      } catch (e) {
        if (e.message.indexOf('undefined') === -1) throw e; // Unit can suddenly be gone on death
      }
    }
    Pickit.pickItems();
  };

  const checkHydra = function () {
    var hydra = getUnit(1, getLocaleString(3325));
    if (hydra) {
      do {
        if (hydra.mode !== 12 && hydra.getStat(172) !== 2) {
          Pather.moveTo(15072, 5002);
          while (hydra.mode !== 12) {
            delay(500);
            if (!copyUnit(hydra).x) {
              break;
            }
          }

          break;
        }
      } while (hydra.getNext());
    }

    return true;
  };

  if (me.area !== sdk.areas.ThroneOfDestruction) {
    Shopper.run()
    Pather.journeyTo(sdk.areas.ThroneOfDestruction);
    //@ts-ignore
    Precast.doPrecast(true);
  }

  Pather.moveTo(15106, 5040);

  clearThrone();

  tick = getTickCount();
  Pather.moveTo(15106, 5040);

  while (true) {
    if (getDistance(me, 15106, 5040) > 3) {
      Pather.moveTo(15106, 5040);
    }

    if (!getUnit(1, 543)) {
      break;
    }

    let wave = checkThrone();
    console.log(wave);
    if (wave < 5 && wave > 0) {
      clearThrone();

      checkHydra();
      tick = getTickCount();

      //@ts-ignore
      Precast.doPrecast(true);

    } else if (wave === 5) {
      if (me.diff || me.charlvl > 30) {
        clearThrone();
      }
      break; // stop attacking after wave 5
    } else {
      preattack();
    }

    delay(10);
  }

  if (checkThrone() !== 5 && (me.diff === 0 && me.charlvl > 30
    || me.diff === 1 && me.charlvl > 50)) {

    Pather.moveTo(15090, 5008);
    delay(5000);
    // @ts-ignore
    Precast.doPrecast(true);

    while (getUnit(1, 543)) {
      delay(500);
    }

    portal = getUnit(2, 563);

    if (portal) {
      Pather.usePortal(null, null, portal);
    } else {
      throw new Error("Couldn't find portal.");
    }

    Pather.moveTo(15134, 5923);
    Attack.kill(544); // Baal
    Pickit.pickItems();
  }
}