import {getWp, haveWp, moveToExit} from "../util";
import sdk from "../../sdk";
import moveTo from "../../lib/MoveTo";

export = function () {


  if (!haveWp(sdk.areas.ArcaneSanctuary) && me.diff === 0) {
    if (!haveWp(sdk.areas.PalaceCellarLvl1)) {
      Town.goToTown(2);
      moveToExit(sdk.areas.HaremLvl1);
      moveToExit(sdk.areas.HaremLvl2);
      moveToExit(sdk.areas.PalaceCellarLvl1);
      getWp();
    } else {
      Pather.useWaypoint(sdk.areas.PalaceCellarLvl1);
    }

    moveToExit(sdk.areas.PalaceCellarLvl2);
    moveToExit(sdk.areas.PalaceCellarLvl3);
    const ps = getPresetUnit(sdk.areas.PalaceCellarLvl3, 2, 298);
    if (!ps) throw new Error('Couldnt find portal to palace');
    moveTo(ps);
    const portal = getUnits(2).filter(unit => unit.classid === 298).first();
    Pather.usePortal(null, null, portal);
    getWp();
  }

  if (me.area !== sdk.areas.ArcaneSanctuary) {
    Pather.useWaypoint(sdk.areas.ArcaneSanctuary);
  }


  const preset = getPresetUnit(sdk.areas.ArcaneSanctuary, 2, sdk.units.Journal)
  if (!preset) throw new Error('Couldnt find journal, wtf');

  if (me.diff === 0) {
    const callback = () => {
      // const unit = getUnit(1, 250);
      // return (unit?.attackable && unit.distance < 40);
      return Pather.useTeleport() || getUnit(2, 357);
    }

    // safe move util you can teleport
    moveTo(preset, {callback});
  }


  var i = 0;
  while (i < 3 && !Pather.moveTo(preset.roomx * 5 + preset.x, preset.roomy * 5 + preset.y)) {
    i += 1
  }

  // const summoner = getUnit(1, 250);
  // do {
  //     ClassAttack.doAttack(summoner);
  // } while(!summoner.dead || !me.dead)


  // Now for the hard part, actually do the summoner
  let journal = getUnit(2, 357);
  if (!journal) return true;

  var i = 0;
  while (i < 3 && !Pather.moveToUnit(journal, undefined, undefined, true)) {
    i += 1
  }

  journal.interact();

  const portal = Misc.poll(() => {
    me.cancel();
    return getUnit(2, sdk.units.RedPortal);
  }, 3000, 20);

  Pather.usePortal(null, null, portal);
  if (!Pather.usePortal(46)) throw new Error('Failed to use journal');
  delay(1000);

  getWp();
  return true;
}