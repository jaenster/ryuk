import sdk from "../../sdk";
import TownChicken from '../../lib/TownChicken'

export = function () {

  Pather.teleport = true;
  // Town.doChores();
  // Pather.useWaypoint(118, true);
  Pather.journeyTo(sdk.areas.ArreatSummit);

  //@ts-ignore
  Precast.doPrecast(true);
  Pather.moveToExit(120, true);
  delay(500);
  Pather.moveTo(10048, 12634);


  const locations = [
    {x: 10048, y: 12634},
    {x: 10033, y: 12609},
    {x: 10061, y: 12605},
  ]
  for (let i = 0; i < locations.length; i++) {
    Pather.moveTo(locations[i].x, locations[i].y);
    me.getItemsEx()
      .filter(item => [77, 76].includes(item.itemType) && [2].includes(item.location))
      .forEach(item => item.drop());

    Town.goToTown(5);
    const [x, y] = [me.x, me.y];
    Town.doChores();
    Town.goToTown(5);
    Pather.moveTo(x, y);
    Pather.usePortal(sdk.areas.ArreatSummit, null);
  }

  const altar = getUnit(2, 546);
  Pather.moveToUnit(altar);
  //@ts-ignore
  Precast.doPrecast(true);
  let wasDisabled = TownChicken.disabled;
  TownChicken.disabled = true;
  try {
    delay(500 + me.ping * 3);
    sendPacket(1, 0x31, 4, altar.gid, 4, 20002);
    sendPacket(1, 0x13, 4, altar.type, 4, altar.gid);
    Misc.poll(() => getIsTalkingNPC());
    me.cancel();

    while (!getUnit(1, 542)) delay(3);

    const calculateBestSpot = function (center, skillRange): { x: number, y: number }[] {
      let coords: { x: number, y: number }[] = [];
      for (let i = 0; i < 360; i++) {
        coords.push({
          x: Math.floor(center.x + (skillRange / 3 * 2.5) * Math.cos(i) + .5),
          y: Math.floor(center.y + (skillRange / 3 * 2.5) * Math.sin(i) + .5),
        });
      }
      return coords
        .filter((e, i, s) => s.indexOf(e) === i)// only unique spots
        .filter(el => Attack.validSpot(el.x, el.y));
    };

    const safeSpots = calculateBestSpot(altar, 30);

    let mySpot = safeSpots[0];
    const manaTP = Skill.getManaCost(sdk.skills.Teleport);
    const manaTK = Skill.getManaCost(sdk.skills.Telekinesis);

    const mpmax = Array.isArray(Config.MPBuffer) ? Config.MPBuffer.last() : Config.MPBuffer;
    const hpmax = Array.isArray(Config.HPBuffer) ? Config.HPBuffer.last() : Config.HPBuffer;

    const getAmount = (type: 76 | 77) => me.getItemsEx().filter(el => el.itemType === type && el.location === 3).length;

    while (getUnits(2, 475).length !== 3 /*as long there are no statues*/) {
      const units = getUnits(1).filter(unit => [540, 541, 542].includes(unit.classid)).filter(unit => !unit.dead);
      if (!units.length) {
        break;
      } // they arent here?

      // In case our spot is invaded by any of the ancients
      if (units.filter(a => a && !a.dead && a.distance < 10).length) {
        print('eh someone is too close =O');

        // let avgdis = safeSpots.reduce((acc, cur) => acc + cur.distance, 0) / safeSpots.length;

        let possibleSpots = safeSpots.filter(spot => 37 < spot.distance).sort(
          (a, b) => {
            const distanceA = units.reduce((acc, cur) => acc + getDistance(a, cur), 0),
              distanceB = units.reduce((acc, cur) => acc + getDistance(b, cur), 0);
            return distanceB - distanceA;
          }
        );
        mySpot = possibleSpots[~~rand(0, possibleSpots.length - 1)];

        print(mySpot.x + ',' + mySpot.y);
      }

      if (manaTK + manaTP > me.mp) {
        // max tk distance is 25, but 20 to be safe

        let tkablePot;
        if (getAmount(77) < mpmax) tkablePot = getUnits(4).filter(el => el.itemType === 77 && el.distance < 20).first();
        else if (getAmount(76) < hpmax) tkablePot = getUnits(4).filter(el => el.itemType === 76 && el.distance < 20).first();

        console.log('tking pot');
        Skill.cast(sdk.skills.Telekinesis, 0, tkablePot);
      }

      if (mySpot.distance > 3) {
        print('moving to my new spot?');
        Pather.teleportTo(mySpot.x, mySpot.y)
      }
      try {
        // that one that is near
        const nearst = units.filter(a => a && !a.dead).sort((a, b) => a.distance - b.distance).first();

        if (nearst) {
          const [skill] = ClassAttack.decideSkill(nearst)
          if (skill) {
            const manaUse = Skill.getManaCost(skill);

            if (me.mp < manaUse + manaTP) {
              me.overhead('Dont attack, safe mana for teleport')
              delay(10);
              continue;
            }
            Skill.cast(skill, 0, nearst);
          }
        }
        delay(10);
      } catch (e) {
        if (e.message.indexOf('undefined') === -1) throw e; // Unit can suddenly be gone on death
      }
    }

    Misc.poll(() => getIsTalkingNPC());
    me.cancel();

    // take back your potions
    for (let i = 0; i < locations.length; i++) {
      Pather.moveTo(locations[i].x, locations[i].y);
      Pickit.pickItems();
    }

    Pather.getWP(129); // get waypoint of wp2
    return !!me.getQuest(39, 0) || !!me.getQuest(39, 1);
  } finally {
    TownChicken.disabled = wasDisabled;
  }
}
