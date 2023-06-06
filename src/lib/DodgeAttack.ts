import Worker from "../lib/worker";
import sdk from "../sdk";
import moveTo from "./MoveTo";

type Spot = { x: number, y: number }
export = function (settings: { spots: { [data: string]: Spot }, default: string, skill: number, monsterId: number }) {

  let done = false, ___recusion = 0;
  print('dodgy attack');

  const safeSpots = settings.spots;
  const center = safeSpots[settings.default]; // the default is the center

  const shouldDodge = (coord) => {
    return monster && getUnits(3)
      // for every missle that isnt from our merc
      .filter(missile => missile && monster && monster.gid === missile.owner)
      // if any
      .some(missile => {
        let xoff = Math.abs(coord.x - missile.targetx),
          yoff = Math.abs(coord.y - missile.targety),
          xdist = Math.abs(coord.x - missile.x),
          ydist = Math.abs(coord.y - missile.y);

        // If missile wants to hit is and is close to us
        return xoff < 10 && yoff < 10 && xdist < 15 && ydist < 15;
      });
  };

  let monster;
  const calcNewSpot = () => {
    let result = Object.keys(safeSpots)
      // Exclude a spot
      .filter(spot => getDistance(safeSpots[spot], monster || center) > 15)
      .filter(spot => getDistance(safeSpots[spot], monster || center) < 37)
      // Do not choose a spot i wanna dodge anyway
      .filter(spot => !shouldDodge(safeSpots[spot]))
      // Sort on least distance of diablo (or the center if he didnt spawned yet)
      .sort((a, b) => {
        return getDistance(safeSpots[a], monster || center) - getDistance(safeSpots[b], monster || center)
      });

    switch (true) {
      case result.length === 1:
      case result.length > 1 && getDistance(safeSpots[result[0]], monster) > 10:
        return result[0];
      case result.length > 1:
        return result[1]; // second best is best if the best is too close
    }
    return settings.default;
  };

  Worker.runInBackground('avoidMonster', function () {

    // Avoid double code runningz
    if (___recusion) return true; // keep on looping
    ___recusion++;

    return ___recusion-- || !done;
  });


  let spot, line;
  const manaTP = Skill.getManaCost(sdk.skills.Teleport),
    manaSK = Skill.getManaCost(settings.skill);
  const originalPacketCasting = Config.PacketCasting;
  Config.PacketCasting = 1;
  try {
    do {
      monster = getUnit(1, settings.monsterId);
      monster && (line = new Line(me.x, me.y, monster.x, monster.y, 0x84, true));

      // Get the second closest spot to diablo, so if he moves to you, you move away, but not far, so he keeps on chasing you
      if (!spot || monster && (monster.distance < 20 || monster.distance > 35)) {
        spot = safeSpots[calcNewSpot()];
      }

      if (spot && spot.distance > 3) {
        Pather.moveTo(spot.x, spot.y);
      }

      // If dia is there and dia is alive
      let dodge = monster && !monster.dead && shouldDodge(me/*depends on me*/);

      if (dodge) {
        spot = safeSpots[calcNewSpot()];
        if (getUnit(3, 172)) {
          console.log('For diablos lighting we rather walk to the other spot to avoid getting pwned with the lighting');
          moveTo(spot, {
            allowTeleport: false,
            rangeOverride: 0,
          })
        } else {
          Pather.moveTo(spot.x, spot.y) // move to this new found spot
        }
      }

      if (me.mp < manaSK + manaTP) {
        me.overhead('Dont attack, safe mana for teleport')
        delay(10);
        continue;
      }

      if (monster) {
        Skill.cast(settings.skill, 0, monster)
      } else {
        Skill.cast(settings.skill, 0, center.x, center.y);
      }
      delay(10);
    } while (!monster || !monster.dead);
  } finally {
    Config.PacketCasting = originalPacketCasting;
  }

}