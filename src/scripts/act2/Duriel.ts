import sdk from "../../sdk";
import {moveToExit} from "../util";
import moveTo from "../../lib/MoveTo";

export = function () {


  if (!getUnit(2, sdk.units.HoradricstaffHolder)) {
    if (me.area !== sdk.areas.CanyonOfMagi) {
      Town.goToTown();
      Pather.useWaypoint(sdk.areas.CanyonOfMagi);
    }
    const correctTomb = (getRoom() || undefined)?.correcttomb;
    if (me.diff === 0 && !Pather.useTeleport()) {
      moveToExit(correctTomb);
    } else {
      Pather.moveToExit(correctTomb, true);
    }
  }


  if (me.diff === 0) {
    const ps = getPresetUnit(me.area, 2, sdk.units.HoradricstaffHolder);
    if (!ps) throw new Error('Didnt find the preset unit');

    moveTo(ps, {
      callback() {
        return Pather.useTeleport() || getUnit(2, sdk.units.PortaltoDurielsLair);
      }
    });

    if (!getUnit(2, sdk.units.PortaltoDurielsLair)) {
      Pather.moveToPreset(me.area, 2, sdk.units.HoradricstaffHolder);
    }
  }

  Pather.moveToPreset(me.area, 2, sdk.units.HoradricstaffHolder);

  if (me.getItem(sdk.items.FinishedStaff)) {
    Pather.makePortal();
    const orifince = Misc.poll(() => getUnit(2, sdk.units.HoradricstaffHolder))

    // cast tk on orifince
    Skill.cast(sdk.skills.Telekinesis, 0, orifince);

    const fullStaff = me.getItem(sdk.items.FinishedStaff);
    if (!fullStaff) throw new Error('Couldnt find fullstaff wtf');

    console.log('full staff to cursor')
    clickItemAndWait(0, fullStaff);
    submitItem();
    console.log('submit item');
    delay(500);

    {
      const portal = getUnit(2, sdk.units.BluePortal);
      Pather.usePortal(null, null, portal);
    }

    // Clear cursor of staff
    const item = (me.getItems() || []).filter(el => el.location === 3).first();
    const [x, y, loc] = [item.x, item.y, item.location];
    clickItemAndWait(0, item);
    clickItemAndWait(0, x, y, loc);

    delay(15e3); // Wait until duriel is open

    {
      const portal = getUnit(2, sdk.units.BluePortal);
      Pather.usePortal(null, null, portal);
    }
  }

  console.log('here');
  // Warp to duriel
  let unit = Misc.poll(() => getUnit(2, 100));

  if (unit) {
    for (let i = 0; i < 3; i += 1) {
      if (me.area === unit.area) Skill.cast(43, 0, unit);

      if (me.area === 73) break;
    }
  }

  if (me.area !== 73 && !Pather.useUnit(2, 100, 73)) {
    Attack.clear(10);
    Pather.useUnit(2, 100, 73);
  }


  // Actually pwn duriel lol
  const duriel = Misc.poll(() => getUnit(1, sdk.monsters.Duriel));

  const saveSpots = [
    {x: 22648, y: 15688},
    {x: 22624, y: 15725},
  ];


  const manaTP = Skill.getManaCost(sdk.skills.Teleport);

  while (!duriel.dead) {

    //ToDo; figure out static
    if (duriel.getState(sdk.states.Frozen) && duriel.distance < 7 || duriel.distance < 12) {
      const safeSpot = saveSpots.sort((a, b) => getDistance(duriel, b) - getDistance(duriel, a))[0];
      Pather.teleportTo(safeSpot.x, safeSpot.y);
    }

    const [skill] = ClassAttack.decideSkill(duriel),
      manaUse = Skill.getManaCost(skill);

    if (me.mp < manaUse + manaTP) {
      me.overhead('Dont attack, safe mana for teleport')
      continue;
    }

    Skill.cast(skill, 0, duriel);
  }

  Pickit.pickItems();


  // Once beaten
  Pather.walkTo(22621, 15711);
  Pather.moveTo(22602, 15705);
  Pather.moveTo(22579, 15704);
  Pather.moveTo(22575, 15675);
  Pather.moveTo(22579, 15655);
  Pather.walkTo(22578, 15642); // walk trough door
  Pather.moveTo(22578, 15618);
  Pather.moveTo(22576, 15591); // tyreal

  {
    let unit = getUnit(1, "tyrael");
    if (getDistance(me, unit) > 3) {
      Pather.moveToUnit(unit);
    }

    unit.interact();
    me.cancel();
    me.cancel();
    sendPacket(1, 0x40);
    delay((me.ping || 0) * 2 + 200);


    let portal = Pather.getPortal(sdk.areas.LutGholein, undefined);
    portal && Pather.usePortal(null, null, portal) || Pather.makePortal(true);

  }

}