import sdk from "../../sdk";
import {filterNormalMonsters, getExit, getFurthestSpot, getWp, haveWp, moveToExit} from "../util";
import moveTo from "../../lib/MoveTo";
import Clear from "../../lib/clear";
import {Delta} from "../../lib/delta";

export = function () {
  if (me.diff === 0) {
    if (me.area !== sdk.areas.DarkWood && haveWp(sdk.areas.DarkWood) && !haveWp(sdk.areas.BlackMarsh)) {
      Town.goToTown(1);
      Pather.useWaypoint(sdk.areas.DarkWood);
    }

    if (me.area === sdk.areas.DarkWood) {
      moveToExit(sdk.areas.BlackMarsh);
      if (!haveWp(sdk.areas.BlackMarsh)) {
        getWp(sdk.areas.BlackMarsh);
      }
    }

    if (me.area !== sdk.areas.BlackMarsh) {
      Town.goToTown();
      Pather.useWaypoint(sdk.areas.BlackMarsh);
    }

    try {
      Clear.on('sorting', filterNormalMonsters);

      // Whatever happens, always do the countress runs on act 1 runs
      moveToExit(sdk.areas.ForgottenTower, sdk.areas.BlackMarsh);
      moveToExit(sdk.areas.TowerCellarLvl1, sdk.areas.ForgottenTower);

      [sdk.areas.TowerCellarLvl2,
        sdk.areas.TowerCellarLvl3,
        sdk.areas.TowerCellarLvl4,
        sdk.areas.TowerCellarLvl5]
        .forEach(to => {
          Attack.clear(10); // clear at entry, sometimes there are monsters that struck you while calculating path
          let seenChampionPack = false;
          const exit = getExit(me.area, to);
          const path = getPath(me.area, me.x, me.y, exit.x, exit.y, 2, 5) || undefined;
          if (!path) throw new Error('Cant find path');

          const nearChamps = () => getUnits(1).filter(el => el.spectype !== 0 && el.distance < 15);
          const delta = new Delta();
          try {
            delta.track(
              () => !!nearChamps().length,
              (n) => seenChampionPack ||= n
            );
            {
              const farDistance = getFurthestSpot([{x: me.x, y: me.y}, exit]);
              console.log(farDistance);

              // Find the nearest node and search to it
              const node = path.slice()
                .map((node: { x, y, d, hook?: () => void }) => {
                  node.d = Pather.getWalkDistance(node.x, node.y, me.area, farDistance.x, farDistance.y);
                  return node;
                })
                .sort(({d: a}, {d: b}) => a - b)
                .first();

              if (node && getDistance(node, farDistance) > 30) {
                // just for debug
                [].filter.constructor('return this')()['randomline'] = new Line(farDistance.x, farDistance.y, node.x, node.y, 0x99, true);

                node.hook = function () {
                  if (seenChampionPack) {
                    console.log('already found champion pack, dont take scenic route');
                    return;
                  }
                  console.log('Taking scenic route - Covering an extra ' + getDistance(node, farDistance))
                  moveTo(farDistance, {
                    callback() { // stop once we find dead spec monsters with spec type nearby
                      return !!nearChamps().length;
                    },
                    rangeOverride: 30,
                  })

                  // if it found any champs, pwn them
                  const champs = nearChamps();
                  if (champs.length) {
                    champs.sort(({distance: a}, {distance: b}) => b - a);

                    moveTo(champs.first(), {
                      callback() { // Stop moving once there are no living champs left
                        return nearChamps().filter(el => el.attackable).length === 0;
                      },
                      rangeOverride: 30,
                    });
                  }


                }
              }
            }
            revealLevel(true);
            moveTo(path, {rangeOverride: 30});
            Pather.moveToExit(to, true)
          } finally {
            delta.destroy();
          }
        });
    } finally {
      Clear.off('sorting', filterNormalMonsters);
    }
  } else {
    Pather.journeyTo(sdk.areas.TowerCellarLvl5);
  }

  let poi = getPresetUnit(me.area, 2, 580);

  if (poi) {
    // Go to
    moveTo(poi, {
      rangeOverride: 30, // bigger range catches more monsters and more distanced attacking
      callback() {
        return getUnit(1, getLocaleString(2875))?.dead;
      }
    })
  }
  Pickit.pickItems();
  Town.goToTown();
}
