import sdk from "../../sdk";
import {talkTo} from "../util";
import moveTo from "../../lib/MoveTo";

export = function () {

  Pather.journeyTo(sdk.areas.FrozenRiver)


  const anyaLoc = (target => ({
    x: target.roomx * 5 + target.x,
    y: target.roomy * 5 + target.y
  }))(getPresetUnit(me.area, 2, 460) || undefined);


  // 528 are the movements in the water
  const path = getPath(me.area, me.x, me.y, anyaLoc.x, anyaLoc.y, 2, 5) || undefined;
  if (!path) return;

  const startingPoint = path.find(node => getDistance(anyaLoc, node) < 70);
  Pather.moveTo(startingPoint.x, startingPoint.y);

  moveTo(anyaLoc, ((once, arr) => ({
      callback() {
        if (!once) {
          const unit = getUnits(1, 449).filter(el => el.name === getLocaleString(22504)).first();
          console.log('Checking', unit)
          if (unit) {
            once = true;
            console.log('Found frozenstein, lets ignore him');
            arr.push(unit.gid);
          }
        }
        const anya = getUnit(2, 558);
        if (anya) {
          const nearUnits = getUnits(1).filter(unit => !unit.dead && getDistance(anya, unit) < 40);
          if (nearUnits.length < 3) {
            return true; // Stop attacking if anya is relatively safe
          }
        }

      }
    }))(false, globalThis['__________ignoreMonster']),
  );
  Pather.moveTo(anyaLoc.x, anyaLoc.y);

  Pather.makePortal();
  let anya = Misc.poll(() => getUnit(2, 558));
  console.log('Found anya');

  Misc.poll(() => {
    Skill.cast(sdk.skills.Telekinesis, 0, anya);
    return getIsTalkingNPC();
  }, 1000, (me.ping) || 50);
  console.log('tked the bitch');

  me.cancel();
  console.log('back to town');
  // use my portal to town
  Pather.usePortal(sdk.areas.Harrogath, null);

  talkTo(NPC.Malah);
  Pather.usePortal(sdk.areas.FrozenRiver, null);

  anya = Misc.poll(() => getUnit(2, 558));
  Misc.poll(() => {
    Skill.cast(sdk.skills.Telekinesis, 0, anya);
    return anya.mode !== 2;
  }, 1000, (me.ping) || 50);


  const exit = (getPresetUnits(me.area, 2, 481) || []).map(target => ({
    x: target.roomx * 5 + target.x,
    y: target.roomy * 5 + target.y
  }))
    .filter(el => el.distance > 180)
    .sort((a, b) => a.distance - b.distance)
    .first();

  Town.goToTown();
}