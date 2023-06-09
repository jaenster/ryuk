import sdk from "../../sdk";
import Shopper from "../../lib/town/actions";

export = function () { // SiC-666 TODO: Rewrite this.
  print("coming barbies");
//(<3 Larryw)
  var i, qual;

  if (!Pather.useWaypoint(sdk.areas.FrigidHighlands, false)) {
    Pather.journeyTo(sdk.areas.FrigidHighlands);
  }

  let barbSpots = (getPresetUnits(me.area, 2, 473) || []);
  let coords = barbSpots.map(s => ({x: s.roomx * 5 + s.x - 3, y: s.roomy * 5 + s.y} as Unit));

  coords.forEach(c => {
    Pather.moveToUnit(c, 2, 0);
    let door = getUnit(sdk.unittype.Monsters, 434);
    if (door) {
      Pather.moveToUnit(door, sdk.unittype.Monsters, 0);
      for (i = 0; i < 20 && door.hp; i += 1) {
        if (me.getSkill(45, 1))
          Skill.cast(45, 0, door.x, door.y);
        delay(50);
        if (me.getSkill(55, 1))
          Skill.cast(55, 0, door.x, door.y);
        delay(50);
        if (me.getSkill(47, 1))
          Skill.cast(47, 0, door.x, door.y);
        delay(50);
        if (me.getSkill(49, 1))
          Skill.cast(40, 0, door.x, door.y);
        delay(50);
      }
      delay(1500 + 2 * me.ping);
    }
  });

  delay(2000);
  Town.goToTown();
  Town.move("qual-kehk");
  delay(1000 + me.ping);
  qual = getUnit(1, "qual-kehk");

  while (!me.getQuest(36, 0)) {
    qual.openMenu();
    me.cancel();
    delay(500);
    sendPacket(1, 0x40); //fresh Quest state.
    if (me.getQuest(36, 0))
      break;
  }

  Shopper.run();

  return true;
};