import {getExit, getWp, getWpPreset, gotWp, haveWp, moveToExit} from "../util";
import sdk from "../../sdk";
import moveTo from "../../lib/MoveTo";

export = function () {

  const plot = [];

  if (me.area !== sdk.areas.ColdPlains) {
    Town.goToTown(1);

    if (haveWp(sdk.areas.ColdPlains)) {
      Pather.useWaypoint(sdk.areas.ColdPlains);
    } else {
      const ps = getWpPreset(sdk.areas.ColdPlains);
      console.log('Doing it via waypoint');

      plot.push({
        x: ps.roomx * 5 + ps.x,
        y: ps.roomy * 5 + ps.y,
        hook() { // Fetch cold plains waypoint now that we are here
          if (!gotWp(sdk.areas.ColdPlains)) getWp(sdk.areas.ColdPlains);
        }
      });
    }
  }

  // Walk via burial grounds to farm some extra easy xp
  if (me.charlvl < 5) {
    const moor = getExit(sdk.areas.ColdPlains, sdk.areas.BloodMoor);

    {
      const exit = getExit(sdk.areas.ColdPlains, sdk.areas.BurialGrounds);
      const {x, y} = (getPath(sdk.areas.ColdPlains, moor.x, moor.y, exit.x, exit.y, 1, 20) || undefined)?.slice(-6)[0];
      exit && plot.push({x, y})
    }

    {
      const exit = getExit(sdk.areas.ColdPlains, sdk.areas.StonyField);
      const {x, y} = (getPath(sdk.areas.ColdPlains, moor.x, moor.y, exit.x, exit.y, 1, 20) || undefined)?.slice(-6)[0];
      exit && plot.push({x, y})
    }
  }

  console.log('Walking?');
  const exit = getExit(sdk.areas.ColdPlains, sdk.areas.CaveLvl1);
  plot.push(exit);
  plot.map(el => console.log(el));
  moveTo(plot);
  Pather.moveToExit(sdk.areas.CaveLvl1, true)

  {
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

    moveTo([{
      x,
      y
    }, exitLvl2], {clearFilter: (monster, node) => monster.isSpecial ? getDistance(monster, node) <= 30 : getDistance(monster, node) <= 15});

    Pather.moveToExit(sdk.areas.CaveLvl2, true);
  }

  moveToExit(sdk.areas.CaveLvl2, sdk.areas.CaveLvl1);
  Town.goToTown();
}