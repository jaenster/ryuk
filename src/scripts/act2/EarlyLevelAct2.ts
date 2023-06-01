import moveTo from "../../lib/MoveTo";
import sdk from "../../sdk";
import Clear from "../../lib/clear";
import {filterMonster, getExit, getQuestItem, getWp, getWpPreset, haveWp, moveToExit, talkTo} from "../util";

export = function () {
  //ToDo; use warriv to hack back to act 1
  Town.goToTown(2);

  const startingPoint = sdk.areas.LutGholein;

  const waypointAreas = [sdk.areas.DryHills, sdk.areas.FarOasis, sdk.areas.LostCity];

  let totalTargetPath = [];
  [sdk.areas.RockyWaste, sdk.areas.DryHills, sdk.areas.FarOasis, sdk.areas.LostCity, sdk.areas.ValleyOfSnakes, sdk.areas.ClawViperTempleLvl1]
    .forEach((area, idx, self) => {
      // Dont walk all the way to valley of the snakes if we got the amulet, no beetles in lost city
      if (sdk.areas.ClawViperTempleLvl1 === area && (me.getItem(sdk.items.ViperAmulet) || me.getItem(sdk.items.FinishedStaff))) {
        return false;
      }
      let from = !idx ? startingPoint : self[idx - 1];
      const exit = getExit(from, area);
      totalTargetPath.push(exit);

      if (waypointAreas.includes(area) && !haveWp(area)) {
        let wpPreset = getWpPreset(area);
        if (wpPreset instanceof PresetUnit) {
          totalTargetPath.push({
            x: wpPreset.roomx * 5 + wpPreset.x,
            y: wpPreset.roomy * 5 + wpPreset.y,
            hook: () => {
              // once here, fetch the waypoint
              getWp()
            },
          })
        }
      }
    });

  const filter = (monster: Monster, node: PathNode = me) =>
    monster.spectype > 0
    // beetles give a ton of xp
    || [91 /* dung soldier*/, 92 /* death beetle*/].includes(monster.classid)
    || getDistance(node, monster) < 6 // those that are close


  const customMonsterFilter = filterMonster(monster => filter(monster));
  Clear.on('sorting', customMonsterFilter)
  try {
    // This can be a very long way
    moveTo(totalTargetPath, {
      rangeOverride: 35, // On insanely high range
      clearFilter: filter,
      callback: () => {
        return Pather.useTeleport();
      }
    });
  } finally {
    Clear.off('sorting', customMonsterFilter);
  }


  if (!me.getItem(sdk.items.ViperAmulet) && !me.getItem(sdk.items.FinishedStaff)) {
    moveToExit(sdk.areas.ClawViperTempleLvl1, sdk.areas.ValleyOfSnakes);
    moveToExit(sdk.areas.ClawViperTempleLvl2);

    // To the correct nodes
    moveTo({x: 15044, y: 14045});
    getQuestItem(sdk.items.ViperAmulet, sdk.units.ViperChest)
    sendPacket(1, 0x40); // Quest packet
    delay(700);
    Town.goToTown();
    talkTo(NPC.Drognan);
  }

  return true;


}
