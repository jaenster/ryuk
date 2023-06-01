import {talkTo} from "../util";
import sdk from "../../sdk";

export = function () {

  Pather.useWaypoint(sdk.areas.A2SewersLvl2);
  Pather.moveToExit(sdk.areas.A2SewersLvl3, true);


  Pather.moveToPreset(sdk.areas.A2SewersLvl3, 2, 355)

  Attack.kill(sdk.monsters.Radament);
  Pickit.pickItems();
  const unit = Misc.poll(() => getUnit(4, sdk.items.BookOfSkill));
  if (unit) Pickit.pickItem(unit);
  Town.goToTown(2);

  talkTo(NPC.Atma);
}