import sdk from "../../sdk";
import moveTo from "../../lib/MoveTo";
import {moveToExit, talkTo} from "../util";
import clear from "../../lib/clear";

export = function () {
  if (me.area !== sdk.areas.CatacombsLvl4) {
    if (me.area !== sdk.areas.CatacombsLvl2) Pather.useWaypoint(sdk.areas.CatacombsLvl2);


    moveToExit(sdk.areas.CatacombsLvl3);
    moveToExit(sdk.areas.CatacombsLvl4);
  }

  // Move andy up
  const sorter = monsters => monsters.sort(function (a: Monster, b: Monster) {
    if (a.distance < 5 && a.classid === sdk.monsters.Andariel && !checkCollision(me, a, 0x4)) return -1;
    return a.distance - b.distance;
  });


  clear.on('sorting', sorter)
  try {

    const doingForQuest = (!me.getQuest(sdk.quests.SistersToTheSlaughter, 0) && !me.getQuest(sdk.quests.SistersToTheSlaughter, 1));

    if (doingForQuest) {
      // Fuck items if this is for quest, just to bug andy
      Pickit.pickItem = () => false;
    }

    // This moves until the end of catacombs 4, so we are 100% sure we seen andy on this route
    moveTo({x: 22549, y: 9520}, {
      callback() { // stop once andy is dead
        return getUnit(1, sdk.monsters.Andariel)?.dead;
      }
    });

    Pickit.pickItems();

    if (doingForQuest) {
      Town.goToTown(1);
      talkTo(NPC.Warriv, false);
      Misc.useMenu(sdk.menu.GoEast);
      scriptBroadcast('quit');
    }

  } finally {
    clear.off('sorting', sorter);
  }

  Town.goToTown(1);
}