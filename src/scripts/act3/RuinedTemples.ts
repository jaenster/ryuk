// Since the entire area is readable upon entry, we can skim trough the listing and see whats available
import sdk from "../../sdk";
import {Collision, getCollisionBetweenCoords} from "../../lib/Coords";
import moveTo from "../../lib/MoveTo";
import {getWp, haveWp, toPackOfMonsters} from "../util";

export = function () {

  type AreaSetup = {
    area: number,
  }

  const areas: { [key: string]: AreaSetup[] } = {
    KurastBazaar: [
      {
        area: sdk.areas.DisusedFane,
      },
      {
        area: sdk.areas.RuinedTemple,
      },
    ],
    UpperKurast: [
      {
        area: sdk.areas.ForgottenReliquary,
      },
      {
        area: sdk.areas.ForgottenTemple,
      },
    ],
    KurastCauseway: [
      {
        area: sdk.areas.DisusedReliquary,
      },
      {
        area: sdk.areas.RuinedFane,
      }
    ]
  }


  Object.keys(areas).forEach(key => areas[key].forEach(({area}) => {
    // fetch the waypoint in case we dont have it yet

    if (me.area !== area) {
      if (Pather.wpAreas.includes(sdk.areas[key]) && !haveWp(sdk.areas[key])) {
        getWp(sdk.areas[key]);
      }

      var i = 0;
      while (i < 3 && !Pather.journeyTo(sdk.areas[key])) {
        i += 1;
      }
      i = 0;
      while (i < 3 && !Pather.journeyTo(area)) {
        i += 1;
      }
    }

    // Cast a frost nova on entry if monsters are near
    if (getUnits(1).filter(el => el.distance < 7 && el.attackable).length) {
      Skill.cast(sdk.skills.FrostNova);
    }

    const filter = (monster: Monster, node: PathNode) => {
      return monster.isSpecial || [94, 95].includes(monster.classid) || monster.distance < 5;
    }

    const packLocations = toPackOfMonsters(getUnits(1)
      .filter(m => filter(m, me)));

    const lines = packLocations.map(({x, y}) => new Line(x, y, me.x, me.y, 0x9B, true));

    Attack.clear(10); // clear at entry, sometimes there are monsters that struck you while calculating path

    // For each pack
    packLocations
      .forEach((pack) => {

        const path = getPath(me.area, me.x, me.y, pack.x, pack.y, 2, 5);
        if (!path) return;

        // find the first node that is on a distance of 40 and proper check collision
        const node = path.find(node => {
          const dist = getDistance(node.x, node.y, pack.x, pack.y);
          // if there isn't any nice collision path
          if (dist < 30) return true;

          // If a spot if found where we are on a distance 40 and without collisions, stand here
          return dist < 40 && !(getCollisionBetweenCoords(node, pack) & Collision.BLOCK_MISSILE);
        });

        if (!node) return;
        Pather.moveTo(node.x, node.y);

        // walk and clear this monster pack
        moveTo(pack, {
          callback() {
            pack.monsters.length && pack.monsters.every(monster => monster?.dead);
          },
          clearFilter: filter
        });
      });


    //@ts-ignore  -- Dont use exit at the very last area
    if (areas[Object.keys(areas).last()].last() !== arguments[2].last()) {
      // Go back up
      const exit = (getArea() || undefined)?.exits.first();
      if (exit) Pather.moveToExit(exit.target, true);
    }

  }))
}