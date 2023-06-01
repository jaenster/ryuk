import sdk from "../../sdk";
import moveTo from "../../lib/MoveTo";
import {getQuestItem, moveToExit} from "../util";

export = function () {
  const safeWalk = !Pather.useTeleport();
  let callback = () => {
    return Pather.useTeleport();
  }
  if (safeWalk) {
    Pather.useWaypoint(sdk.areas.FarOasis);
    moveToExit(sdk.areas.MaggotLairLvl1, me.area, {callback});
    moveToExit(sdk.areas.MaggotLairLvl2, me.area, {callback});
    moveToExit(sdk.areas.MaggotLairLvl3, me.area, {callback});
  }

  var i = 0;
  while (i < 3 && !Pather.journeyTo(sdk.areas.MaggotLairLvl3)) {
    i += 1;
  }

  const ps = getPresetUnit(me.area, 2, sdk.units.HoradricStaffChest);
  if (!ps) throw new Error('Cant find preset of staff');
  if (safeWalk) moveTo(ps);
  else Pather.moveToPreset(me.area, 2, sdk.units.HoradricStaffChest);

  getQuestItem(sdk.items.IncompleteStaff, sdk.units.HoradricStaffChest);
  Town.goToTown();
}