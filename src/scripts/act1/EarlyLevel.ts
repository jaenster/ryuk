import moveTo from "../../lib/MoveTo";
import sdk from "../../sdk";
import {getExit, getQuestItem, getWp, gotWp, haveWp, moveToExit, talkTo} from "../util";

export = function () {
  Town.goToTown(1);

  const lvl = me.charlvl;
  const skips = {
    get moor() {
      return lvl >= 3
    },
    get cave() {
      return lvl >= 7
    },
    get walkToStony() {
      return lvl >= 8
    },
    get rave() {
      return lvl >= 6
    },
    trist: {
      get stones() {
        return !!me.getQuest(sdk.quests.TheSearchForCain, 4)
      },

      get rescued() {
        return !!me.getQuest(sdk.quests.TheSearchForCain, 13)
      },

      get scroll() {
        return !!me.getItem(sdk.items.ScrollOfInifuss) && !!me.getItem(sdk.items.ScrollOfInifussActive)
      },

      get akaraScroll() {
        return !!me.getQuest(sdk.quests.TheSearchForCain, 3);
      },
      get run() { // Do trist if we got did the scroll
        return me.charlvl > 14 || !this.scroll;
      }
    },
    get darkWoods() {
      return lvl >= 12
    },

    // If we have the waypoint skip it
    get underground() {
      return getWaypoint(Pather.wpAreas.indexOf(sdk.areas.DarkWood))
    },
  } as const;


  const tristrun = () => { // Got some stuff out of original trist

    // take scroll to akara
    if (me.getItem(sdk.items.ScrollOfInifuss)) {
      Town.goToTown(1);
      talkTo(NPC.Akara);
    }

    if (me.area !== sdk.areas.StonyField) {
      Pather.useWaypoint(sdk.areas.StonyField);
    }

    const ps = getPresetUnit(me.area, 2, 61) || undefined;
    console.log('here?');
    if (!ps) return;

    console.log('here? -- 2');
    moveTo(ps);

    if (!me.getQuest(sdk.quests.TheSearchForCain, 4)) {

      const stones = [
        getUnit(2, 17),
        getUnit(2, 18),
        getUnit(2, 19),
        getUnit(2, 20),
        getUnit(2, 21)
      ]
      while (stones.some(stone => !stone.mode)) {
        for (let i = 0, stone; i < stones.length; i++) {
          stone = stones[i];
          Pather.moveTo(stone.x, stone.y, 3, 0, 0);
          Misc.click(0, 0, stone);
          Attack.securePosition(me.x, me.y, 10, 0);
          delay(10);
        }
      }
    }

    while (!Pather.usePortal(38)) {
      Attack.securePosition(me.x, me.y, 10, 1000);
    }

    // Wait until init in trist
    Misc.poll(() => me.area === 38);

    moveTo([
        {x: 25132, y: 5070},
        {x: 25092, y: 5054},
        {x: 25046, y: 5080},
        {x: 25048, y: 5126},
        {x: 25050, y: 5163},
        {x: 25052, y: 5192},
        {x: 25074, y: 5183},
        {x: 25081, y: 5155},
        {x: 25119, y: 5124},
        {
          x: 25139, y: 5142,
          hook() { // save cain
            const gibbet = getUnit(2, 26)
            if (!gibbet.mode) {
              Pather.moveTo(gibbet.x, gibbet.y);
              Misc.openChest(gibbet);
            }
          }
        }, // safe the bitch
        {x: 25156, y: 5156},
        {x: 25130, y: 5196}]
      ,
      {
        callback() {
          return getUnit(1, sdk.monsters.Griswold)?.dead;
        }
      })

    if (!skips.underground) {
      Pather.moveTo(5106, 5185);
      Pather.usePortal(sdk.areas.StonyField);
      return;
    }

    Town.goToTown();
    Pather.useWaypoint(!skips.darkWoods ? sdk.areas.DarkWood : sdk.areas.BlackMarsh);
    return;
  }


  console.log(JSON.stringify(skips));

  // Use coldplains if we skip moor and do cave / raven
  if (skips.moor && (!skips.cave || !skips.rave)) {
    Pather.useWaypoint(sdk.areas.ColdPlains);
  } else {
    if ((!skips.cave || !skips.rave)) {
      moveToExit(sdk.areas.ColdPlains, sdk.areas.BloodMoor);
      if (!haveWp(sdk.areas.ColdPlains)) getWp(sdk.areas.ColdPlains);
    }
  }

  if (!skips.cave) {
    // Town to cave lvl 1          // We can be in town, so use cold plains as base
    moveToExit(sdk.areas.CaveLvl1, sdk.areas.ColdPlains);


    // make a triangle path. From entrance to cave level 2, via the coronor of the map that lays the furthes of them all
    const exitBack = getExit(sdk.areas.CaveLvl1, sdk.areas.ColdPlains);
    const exitLvl2 = getExit(sdk.areas.CaveLvl1, sdk.areas.CaveLvl2);
    if (!exitBack || !exitLvl2) return;
    const room = (getRoom() || undefined), rooms = [];
    do {
      rooms.push({x: room.x * 5 + room.xsize / 2, y: room.y * 5 + room.xsize / 2})
    } while (room.getNext());
    const farAway = rooms.sort((a, b) => (getDistance(exitBack, b) + getDistance(exitLvl2, b)) - (getDistance(exitBack, a) + getDistance(exitLvl2, a))).first();

    const [x, y] = Pather.getNearestWalkable(farAway.x, farAway.y, 40, 3, 0x1 | 0x4 | 0x800 | 0x1000) as [number, number];
    const line = new Line(x, y, me.x, me.y, 0x99, true);

    console.log('Moving =o')
    moveTo([{x, y}, exitLvl2]);

    Pather.moveToExit(sdk.areas.CaveLvl2, true);

    moveToExit(sdk.areas.CaveLvl2, sdk.areas.CaveLvl1);

    Town.goToTown(); // ToDo; quit if no way to go to town
    Pather.useWaypoint(sdk.areas.ColdPlains);
  }

  if (!skips.rave) {
    moveToExit(sdk.areas.BurialGrounds, sdk.areas.ColdPlains);
    //ToDO; do the bitch
    moveToExit(sdk.areas.ColdPlains);
  }

  if (!skips.trist.run || !skips.underground) {
    if (!skips.walkToStony) {
      if (skips.moor && me.area === sdk.areas.RogueEncampment) {
        Pather.useWaypoint(sdk.areas.ColdPlains);
      }
      moveToExit(sdk.areas.StonyField, sdk.areas.ColdPlains);
      if (!haveWp(sdk.areas.StonyField)) getWp(sdk.areas.StonyField);
    } else {
      Pather.useWaypoint(sdk.areas.StonyField);
    }

    if (!skips.trist.run && skips.trist.scroll) {
      tristrun();
    }

    if (!skips.underground) {
      moveToExit(sdk.areas.UndergroundPassageLvl1);
      moveToExit(sdk.areas.DarkWood);
      getWp()
    }
  } else if (!skips.darkWoods || !skips.trist.scroll) {
    Pather.useWaypoint(sdk.areas.DarkWood);
  }

  if (!skips.trist.scroll && !skips.trist.stones) {
    //ToDO; pick scroll

    console.log('Getting scroll!');
    const ps = getPresetUnit(sdk.areas.DarkWood, 1, 738) || undefined
    if (ps) {

      console.log(ps);
      const line = new Line(ps.roomx * 5 + ps.x, ps.roomy * 5 + ps.y, me.x, me.y, 0x99, true);
      // Walk to the tree without attacking
      moveTo({
          x: ps.roomx * 5 + ps.x,
          y: ps.roomy * 5 + ps.y
        }, {
          callback() {
            return getUnits(1).filter(unit => unit.name === getLocaleString(2873)).length !== 0;
          }
        }
      );

      Pather.moveToPreset(sdk.areas.DarkWood, 2, 30);
      let unit = getUnit(2, 30);

      // its not really a chest but.. well.. it works
      getQuestItem(sdk.items.ScrollOfInifuss, 30);


      // quest update
      new PacketBuilder().byte(0x40).send();
      Town.goToTown();
      delay(500);
      tristrun();
    }
  }

  if (!skips.darkWoods) {
    moveToExit(sdk.areas.BlackMarsh)
    getWp()
  } else {
    Pather.useWaypoint(sdk.areas.BlackMarsh);
  }

  // Whatever happens, always do the countress runs on act 1 runs
  moveToExit(sdk.areas.ForgottenTower, sdk.areas.BlackMarsh);

  [sdk.areas.TowerCellarLvl1,
    sdk.areas.TowerCellarLvl2,
    sdk.areas.TowerCellarLvl3,
    sdk.areas.TowerCellarLvl4,
    sdk.areas.TowerCellarLvl5].forEach(exit => moveToExit(exit));

  let poi = getPresetUnit(me.area, 2, 580);

  if (poi) {
    // Go to
    moveTo(poi, {
      callback() {
        return getUnit(1, getLocaleString(2875))?.dead;
      }
    })
  }


  return true;
}