import sdk from "../../sdk";
import moveTo from "../../lib/MoveTo";
import {getQuestItem} from "../util";
import {BodyLocations} from "../../enums";
import {Collision, getCollisionBetweenCoords} from "../../lib/Coords";

export = function () {

  const parts: [number[], number, number, number, number][] = [
    [[76, 85], sdk.items.KhalimsEye, 407, 2, 0],
    [[80, 92, 93], sdk.items.KhalimHeart, 405, 2, 1],
    [[78, 88, 89, 91], sdk.items.KhalimBrain, 406, 2, 2],
  ];

  const cube = me.getItem('box') || undefined;
  if (!cube) throw Error('Failed to get a cube');

  !me.getItem(sdk.items.KhalimsWill) && parts    // We only want those that we dont have
    .filter(([, classid]) => !me.getItem(classid))
    .forEach(([area, id, chestid, x, y]) => {
      if (area.includes(me.area)) {
        console.debug('Already at ' + me.area);
        // Some how already in one of the areas we wanna go to
        area.splice(0, area.indexOf(me.area)) // remove these elements
      }
      area.forEach(_ => Pather.journeyTo(_));
      delay(100);

      const goTo = area.pop();
      /*
                  if (me.diff === 0) {
                      const ps = getPresetUnit(goTo, 2, chestid) || undefined;
                      if (!ps) throw new Error('Preset not found');
                      moveTo(ps);
                  }
      */
      if (Pather.moveToPreset(goTo, 2, chestid)) {
        me.diff && Skill.cast(sdk.skills.FrostNova, 0);
        getQuestItem(id, chestid);
        const item = me.getItem(id);
        Town.goToTown();
        Town.openStash();
        Cubing.openCube();
        clickItemAndWait(0, item);
        clickItemAndWait(0, x, y, sdk.storage.Cube);
      }
    });


  Pather.useWaypoint(sdk.areas.Travincal);

  const wp = (() => {
    const ps = getPresetUnit(sdk.areas.Travincal, 2, 237/*wp of travincal*/) || undefined;
    return {x: ps.roomx * 5 + ps.x, y: ps.roomy * 5 + ps.y};
  })();

  // If we dont have the flail, we need to pwn Ismail Vilehand
  if (!me.getItem(sdk.items.KhalimsWill)) {

    // If we dont have the plainFlail, fetch it
    if (!me.getItem(sdk.items.KhalimsFlail)) {
      const name = getLocaleString(2863);

      // move to a safe distance away from everything
      Pather.moveTo(wp.x + 85, wp.y - 139);

      const ismail = (function recursive(_) {
        let unit = getUnits(1).filter(unit => unit.name === name).first();
        if (unit) return unit;
        if (_ > 10) {
          throw Error('ismail not found after 10 attempts');
        }

        // if ismail is hiding, we need to stand more close in the pack and search
        const orb = getUnit(2, 404);
        Pather.moveToUnit(orb, rand(-5, 5), rand(-5, 5));

        return recursive(_++); // try again
      })(0);

      console.log('Found ismail?');
      if (me.diff === 0) {
        Attack.kill(ismail);
      } else {
        const orb = getUnit(2, 404),
          behind = {x: wp.x + 85, y: wp.y - 139},
          safeSpots = {
            rightTop: {x: 52, y: -9},
            rightBottom: {x: 52, y: 12},
            rightNextToDoor: {x: 32, y: 12},

            leftNextToDoor: {x: 12, y: 12},
            leftBottom: {x: 12, y: -9},
            leftTop: {x: -9, y: -9},

            leftOutside: {x: -14, y: 28},
            leftOutsideDoor: {x: 13, y: 28},

            rightOutsideDoor: {x: 30, y: 28},
            rightOutside: {x: 63, y: 28},

            inDoor: {x: 20, y: 8},
          };
        // Make spots relative to orb
        Object.keys(safeSpots).forEach(spot => Object.keys(safeSpots[spot]).forEach(key => safeSpots[spot][key] += orb[key]));
        const manaTP = Skill.getManaCost(sdk.skills.Teleport);

        while (ismail && !ismail.dead) {
          console.log('Life --', ~~(ismail.hp * 100 / 128));
          const [skill] = ClassAttack.decideSkill(ismail),
            manaUse = Skill.getManaCost(skill);

          const bestSpots = Object.keys(safeSpots)
            .filter(spot => getDistance(ismail, safeSpots[spot]) < 45)
            .filter(spot => !(getCollisionBetweenCoords(safeSpots[spot], ismail) & Collision.BLOCK_MISSILE))
            .sort((a, b) => getDistance(ismail, safeSpots[b]) - getDistance(ismail, safeSpots[a]))

          if (bestSpots.first()) {
            console.log(bestSpots.map(el => safeSpots[el].distance));
            const spot = safeSpots[bestSpots.find((el, idx, self) => {
              // last one is prefered one
              if (self.length - 1 === idx) return true;
              const cur = safeSpots[el], next = safeSpots[self[idx + 1]];
              if (next.distance < 40 && cur.distance > 40) return true;
              return true;
            })]
            console.log('Going for spot ', spot.distance);

            const teleportsNeeded = spot.distance > 55 ? ~~(spot.distance / 40) + 1 : 1;
            // we need to teleport, attack, teleport, which costs us 2x tp + skill
            if (me.mp < manaUse + (manaTP * (teleportsNeeded * 2))) {
              me.overhead('Dont attack, safe mana for teleport')
              continue;
            }

            Pather[spot.distance < 45 ? 'teleportTo' : 'moveTo'](spot.x, spot.y);
            Skill.cast(skill, 0, ismail);
            Pather[behind.distance < 45 ? 'teleportTo' : 'moveTo'](behind.x, behind.y);
          }
        }
      }

      getQuestItem(sdk.items.KhalimsFlail);
    }

    // move away to be a bit more safe
    Pather.moveTo(wp.x + 85, wp.y - 139);

    Town.goToTown(3);
    Town.openStash();
    Cubing.openCube();

    // place in cube
    const flail = me.getItem(sdk.items.KhalimsFlail);

    clickItemAndWait(0, flail);
    clickItemAndWait(0, 0, 0, sdk.storage.Cube);
    if (!parts.every(([, id, , x, y]) => {
      const item = me.getItem(id);
      if (!item) return false;

      if (item.location !== sdk.storage.Cube) {
        clickItemAndWait(0, item);
        clickItemAndWait(0, x, y, sdk.storage.Cube);
      }

      return item.location === sdk.storage.Cube;
    })) {
      throw Error('Not all needed items are in cube');
    }

    // transmute
    transmute();
    const finishedFlail = Misc.poll(() => me.getItem(sdk.items.KhalimsWill), 4000, 3) || undefined;

    Storage.Inventory.MoveTo(finishedFlail);
    Pather.usePortal(sdk.areas.Travincal, null);
  }


  // If we got the finished flail now
  let finishedFlail = me.getItem(sdk.items.KhalimsWill);
  if (finishedFlail) {
    let old;

    // move to our safe location
    Pather.moveTo(wp.x + 85, wp.y - 139);

    // if in cube open the cube
    (finishedFlail.location === sdk.storage.Cube) && !getUIFlag(sdk.uiflags.Cube) && Cubing.openCube();

    // Equip if we havent equiped it yet
    if (finishedFlail.location !== sdk.storage.Equipment) {
      Attack.weaponSwitch(1);
      old = finishedFlail.equip();
    }

    // Somehow its on our "other" slot
    finishedFlail.bodylocation === BodyLocations.LeftArmSecondary || finishedFlail.bodylocation === BodyLocations.RightArmSecondary && Attack.weaponSwitch();

    getUIFlag(sdk.uiflags.Cube) && me.cancel(); // close cube

    // find the orb
    const orb = getUnit(2, 404);
    Attack.getIntoPosition(orb, 5, 0x7/*los*/);

    const beforeMode = orb.mode;
    Misc.poll(() => {
      Pather.moveTo(orb.x - 9, orb.y - 9);
      Skill.cast(sdk.skills.Telekinesis, 0, orb); // spam the thing with telekenis
      return orb.mode !== beforeMode;
    }, 5000, 3);

    // move to a safe distance away from everything
    Pather.moveTo(wp.x + 85, wp.y - 139);

    // did we have to equip it for this, and if so, can we unequip it?
    old && old.rollback(); // put old gear back
    Attack.weaponSwitch(0);

    // Wait until exit pops open
    Misc.poll(() => getUnit(2, 386).mode === 2, 10000);

    // Move close to the exit
    const exit = getUnit(2, 386);

    // Since d2 sucks, move around the thingy
    Pather.moveToUnit(exit, 7, 7);

    // keep on clicking the exit until we are not @ travincal anymore
    Misc.poll(() => {
      if (me.area === sdk.areas.Travincal) {
        Pather.moveToUnit(exit);
        Misc.click(2, 0, exit) as any;
      }
      return me.area === sdk.areas.DuranceOfHateLvl1;
    }, 10000, 40);

    if (me.area !== sdk.areas.DuranceOfHateLvl1) {
      Pather.moveToExit([sdk.areas.DuranceOfHateLvl1, sdk.areas.DuranceOfHateLvl2]);
    } else {
      Pather.journeyTo(sdk.areas.DuranceOfHateLvl2);
    }

    Pather.getWP(sdk.areas.DuranceOfHateLvl2);
    Pather.useWaypoint(sdk.areas.KurastDocktown);
  }


}