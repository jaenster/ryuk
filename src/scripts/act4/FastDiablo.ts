import DodgeAttack from "../../lib/DodgeAttack";
import Worker from "../../lib/worker";
import sdk from "../../sdk";
import moveTo from "../../lib/MoveTo";
import {calculateSpots} from "../util";
import {BlockBits} from "../../lib/Coords";
import Shopper from "../../lib/town/actions";


// Just fast diablo, stfu
export = function () {
  this.getLayout = function (seal, value) {
    var sealPreset = getPresetUnit(108, 2, seal) || undefined;

    if (!seal) {
      throw new Error("Seal preset not found");
    }

    if (sealPreset.roomy * 5 + sealPreset.y === value || sealPreset.roomx * 5 + sealPreset.x === value) {
      return 1;
    }

    return 2;
  };

  this.initLayout = function () {
    this.vizLayout = this.getLayout(396, 5275);
    this.seisLayout = this.getLayout(394, 7773);
    this.infLayout = this.getLayout(392, 7893);
  };

  this.getBoss = function (name) {
    var i, boss,
      glow = getUnit(2, 131);

    for (i = 0; i < 24; i += 1) {
      boss = getUnit(1, name);

      if (boss) {
        this.chaosPreattack(name, 8);

        try {
          Attack.kill(name);
        } catch (e) {
          Attack.clear(10, 0, name);
        }

        Pickit.pickItems();

        return true;
      }

      delay(250);
    }

    return !!glow;
  };

  this.chaosPreattack = function (name, amount) {
    var i, n, target, positions;

    switch (me.classid) {
      case 0:
        break;
      case 1:
        break;
      case 2:
        break;
      case 3:
        target = getUnit(1, name);

        if (!target) {
          return;
        }

        positions = [[6, 11], [0, 8], [8, -1], [-9, 2], [0, -11], [8, -8]];

        for (i = 0; i < positions.length; i += 1) {
          if (Attack.validSpot(target.x + positions[i][0], target.y + positions[i][1])) { // check if we can move there
            Pather.moveTo(target.x + positions[i][0], target.y + positions[i][1]);
            Skill.setSkill(Config.AttackSkill[2], 0);

            for (n = 0; n < amount; n += 1) {
              Skill.cast(Config.AttackSkill[1], 1);
            }

            break;
          }
        }

        break;
      case 4:
        break;
      case 5:
        break;
      case 6:
        break;
    }
  };
  this.openSeal = function (classid) {
    var i, j, seal;

    for (i = 0; i < 5; i += 1) {
      Pather.moveToPreset(108, 2, classid, classid === 394 ? 5 : 2, classid === 394 ? 5 : 0);

      if (i > 1) {
        Attack.clear(10);
      }

      for (j = 0; j < 3; j += 1) {
        seal = getUnit(2, classid);

        if (seal) {
          break;
        }

        delay(100);
      }

      if (!seal) {
        throw new Error("Seal not found (id " + classid + ")");
      }

      if (seal.mode) {
        return true;
      }

      if (classid === 394) {
        Misc.click(0, 0, seal);
      } else {
        seal.interact();
      }

      delay(classid === 394 ? 1000 : 500);

      if (!seal.mode) {
        if (classid === 394 && Attack.validSpot(seal.x + 15, seal.y)) { // de seis optimization
          Pather.moveTo(seal.x + 15, seal.y);
        } else {
          Pather.moveTo(seal.x - 5, seal.y - 5);
        }

        delay(500);
      } else {
        return true;
      }
    }

    throw new Error("Failed to open seal (id " + classid + ")");
  };

  Shopper.run()
  Pather.useWaypoint(107);
  this.initLayout();
  this.openSeal(395);
  this.openSeal(396);

  if (this.vizLayout === 1) {
    Pather.moveTo(7691, 5292);
  } else {
    Pather.moveTo(7695, 5316);
  }

  if (!this.getBoss(getLocaleString(2851))) {
    throw new Error("Failed to kill Vizier");
  }

  this.openSeal(394);

  if (this.seisLayout === 1) {
    Pather.moveTo(7771, 5196);
  } else {
    Pather.moveTo(7798, 5186);
  }

  if (!this.getBoss(getLocaleString(2852))) {
    throw new Error("Failed to kill de Seis");
  }

  this.openSeal(392);
  this.openSeal(393);

  if (this.infLayout === 1) {
    delay(1);
  } else {
    Pather.moveTo(7928, 5295); // temp
  }

  if (!this.getBoss(getLocaleString(2853))) {
    throw new Error("Failed to kill Infector");
  }

  Pather.moveTo(7788, 5292);

  const saveSpots = {
    one: {x: 7777, y: 5277},
    two: {x: 7792, y: 5315},
    three: {x: 7814, y: 5300},
    four: {x: 7808, y: 5276},
    default: {x: 7779, y: 5275},
  };

  pwnDia();
};

function pwnDia() {

  const getDia = () => getUnit(1, sdk.monsters.Diablo);

  console.log('Waiting for dia');
  do {
    delay(100)
  } while (!getDia());

  let dia;

  const manaTP = Skill.getManaCost(sdk.skills.Teleport),
    manaSK = Skill.getManaCost(sdk.skills.Blizzard);

  Skill.cast(sdk.skills.StaticField, 0);
  Skill.cast(sdk.skills.StaticField, 0);

  while ((dia = getDia())?.attackable) {

    if (dia.distance < 43) {
      const spot = calculateSpots(dia, 43)
        .filter(spot => spot.distance < 58 /*todo, in neighbour room*/)
        .filter(
          (spot) => {
            const collision = getCollision(me.area, spot.x, spot.y);

            // noinspection JSBitwiseOperatorUsage
            const isLava = !!(collision & BlockBits.IsOnFloor);
            if (isLava) return false; // this spot is on lava, fuck this

            // noinspection JSBitwiseOperatorUsage
            return !(collision & (BlockBits.BlockWall));
          })
        .sort((a, b) => a.distance - b.distance)
        .first();

      Pather.teleportTo(spot.x, spot.y);
    }

    if (me.mp < manaSK + manaTP) {
      me.overhead('Dont attack, safe mana for teleport')
      delay(10);
      continue;
    }


    Skill.cast(sdk.skills.Blizzard, 0, dia)
  }

  Pather.teleportTo(dia.x, dia.y);
  Pickit.pickItems();
}

type Spot = { x: number, y: number }

function DiaDodge(settings: { spots: { [data: string]: Spot }, default: string, skill: number, monsterId: number }) {

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

      // Get the second-closest spot to diablo, so if he moves to you, you move away, but not far, so he keeps on chasing you
      if (!spot || monster && (monster.distance < 20 || monster.distance > 35)) {
        spot = safeSpots[calcNewSpot()];
      }

      if (spot && spot.distance > 3) {
        Pather.moveTo(spot.x, spot.y);
      }

      // If dia is there and dia is alive
      let dodge = monster && !monster.dead && shouldDodge(me/*depends on me*/);

      if (dodge) {
        print('DODGE');

        if (getUnit(3, 172/*dia light*/)) {
          console.log('For diablos lighting we rather walk to the other spot to avoid getting pwned with the lighting');

          // find spot that is near us, very near us,
          const spot = safeSpots[
            Object.keys(safeSpots)
              // get these spots closest to us
              .sort((a, b) => (safeSpots[a].distance - safeSpots[b].distance))
              // get our neighbours (element 0 current spot)
              .slice(1, 3)
              // sort of the remaining 2 spots the most far form dia (we dont want to walk towards dia)
              .sort((a, b) => {
                const dia = getUnit(1, settings.monsterId);
                return dia && getDistance(safeSpots[b], dia) - getDistance(safeSpots[b], dia)
              })
              // get the best location
              .first()
            ];

          let tmp = Pather.useTeleport;
          Pather.useTeleport = () => {
            const gate = getUnit(1, 340/*dia gate*/);
            gate && console.log('near gate? ', gate.distance);
            return gate && gate.distance < 5;
          }
          console.log('Move to weird spot -->' + spot.distance);
          Pather.moveTo(spot.x, spot.y);
          Pather.useTeleport = tmp;
        } else {
          spot = safeSpots[calcNewSpot()];
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
      }
      delay(10);
    } while (!monster || !monster.dead);
  } finally {
    Config.PacketCasting = originalPacketCasting;
  }
}