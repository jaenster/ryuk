import sdk from "../../sdk";
import moveTo from "../../lib/MoveTo";
import {getExit, talkTo} from "../util";
import clear from "../../lib/clear";

export = function () {

  if (me.area !== sdk.areas.ColdPlains && me.area !== sdk.areas.BurialGrounds) {
    Town.goToTown(1);
    Pather.useWaypoint(sdk.areas.ColdPlains);
  }


  const ps = getPresetUnit(sdk.areas.BurialGrounds, 1, 805) || undefined;
  const [mausoleum, crypt] = [sdk.areas.Mausoleum, sdk.areas.Crypt]
    .map(area => getExit(sdk.areas.BurialGrounds, area));

  // Move andy up
  const sorter = monsters => monsters.sort(function (a: Monster, b: Monster) {
    if (a.distance < 10 && a.classid === sdk.monsters.Bloodraven && !checkCollision(me, a, 0x4)) return -1;
    return a.distance - b.distance;
  });

  clear.on('sorting', sorter)
  try {
    let bloodraven: Monster;
    // Give us some path way to walk
    /*moveTo(
        [mausoleum,
            {
                x: ps.roomx * 5 + ps.x,
                y: ps.roomy * 5 + ps.y,
            },
            crypt
        ],
        {
            callback() {
                return getUnit(1, sdk.monsters.Bloodraven)?.dead;
            }
        }
    );*/
    let preset = getPresetUnit(sdk.areas.BurialGrounds, sdk.unittype.Monsters, 805);
    if (preset) {
      moveTo(preset);
    } else {
      Pather.moveToPreset(17, 1, 805);
    }
    while ((bloodraven = getUnit(sdk.unittype.Monsters, sdk.monsters.Bloodraven) as Monster) && !bloodraven.dead) {
      let monstersAround = getUnits(sdk.unittype.Monsters)
        .filter(m => m.classid !== sdk.monsters.Bloodraven)
        .filter(m => m.distance <= 6)
      if (bloodraven.distance > 6) {
        Pather.moveToUnit(bloodraven, 0, 0, monstersAround.length > 3);
      } else if (monstersAround.length > 3) {
        Attack.clear(5);
      }
      ClassAttack.doAttack(bloodraven);
    }

    Pickit.pickItems();

    Town.goToTown();

    talkTo(NPC.Kashya);

    me.cancel();
  } finally {
    clear.off('sorting', sorter);
  }

}