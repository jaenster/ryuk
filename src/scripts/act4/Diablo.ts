import moveTo from '../../lib/MoveTo';
import sdk from "../../sdk";
import {calculateSpots, inverseSpotDistance, spotOnDistance} from "../util";
import {BlockBits} from "../../lib/Coords";


function Diablo() {
  let vizLayout, seisLayout, infLayout;

  function customMoveTo(x, y) {
    moveTo({x, y});
  }

  // Sort function
  this.sort = function (a, b) {
    if (Config.BossPriority) {
      if ((a.spectype & 0x5) && (b.spectype & 0x5)) {
        return getDistance(me, a) - getDistance(me, b);
      }

      if (a.spectype & 0x5) {
        return -1;
      }

      if (b.spectype & 0x5) {
        return 1;
      }
    }

    // Entrance to Star / De Seis
    if (me.y > 5325 || me.y < 5260) {
      if (a.y > b.y) {
        return -1;
      }

      return 1;
    }

    // Vizier
    if (me.x < 7765) {
      if (a.x > b.x) {
        return -1;
      }

      return 1;
    }

    // Infector
    if (me.x > 7825) {
      if (!checkCollision(me, a, 0x1) && a.x < b.x) {
        return -1;
      }

      return 1;
    }

    return getDistance(me, a) - getDistance(me, b);
  };

  // general functions
  function getLayout(seal, value) {
    const sealPreset = getPresetUnit(108, 2, seal) || undefined;

    if (!seal) {
      throw new Error("Seal preset not found. Can't continue.");
    }

    if (sealPreset.roomy * 5 + sealPreset.y === value || sealPreset.roomx * 5 + sealPreset.x === value) {
      return 1;
    }

    return 2;
  }

  function initLayout() {
    vizLayout = getLayout(396, 5275);
    seisLayout = getLayout(394, 7773);
    infLayout = getLayout(392, 7893);
  }

  function openSeal(classid) {
    var i, seal, warn;

    switch (classid) {
      case 396:
      case 394:
      case 392:
        warn = true;

        break;
      default:
        warn = false;

        break;
    }

    for (i = 0; i < 5; i += 1) {
      Pather.moveToPreset(108, 2, classid, classid === 394 ? 5 : 2, classid === 394 ? 5 : 0);

      seal = getUnit(2, classid);

      if (!seal) {
        return false;
      }

      if (seal.mode) { // for pubbies
        if (warn) {
          say(Config.Diablo.SealWarning);
        }

        return true;
      }

      warn = false;

      if (classid === 394) {
        Misc.click(0, 0, seal);
      } else {
        seal.interact();
      }

      delay(classid === 394 ? 1000 : 500);

      if (!seal.mode) {
        if (classid === 394 && Attack.validSpot(seal.x + 15, seal.y)) { // de seis optimization
          customMoveTo(seal.x + 15, seal.y);
        } else {
          customMoveTo(seal.x - 5, seal.y - 5);
        }

        delay(500);
      } else {
        return true;
      }
    }

    return false;
  };

  function getBoss(name) {
    var i, boss,
      glow = getUnit(2, 131);

    for (i = 0; i < 16; i += 1) {
      boss = getUnit(1, name);

      if (boss) {
        customMoveTo(boss.x, boss.y);
      }

      delay(250);
    }

    return !!glow;
  }

  function vizierSeal() {
    print("Viz layout " + vizLayout);
    followPath(vizLayout === 1 ? starToVizA : starToVizB);

    if (!openSeal(395) || !openSeal(396)) {
      throw new Error("Failed to open Vizier seals.");
    }

    if (vizLayout === 1) {
      Pather.moveTo(7711, 5290);
    } else {
      Pather.moveTo(7661, 5289);
    }

    if (!getBoss(getLocaleString(2851))) {
      throw new Error("Failed to kill Vizier");
    }

    return true;
  }

  function seisSeal() {
    print("Seis layout " + seisLayout);
    followPath(seisLayout === 1 ? starToSeisA : starToSeisB);

    if (!openSeal(394)) {
      throw new Error("Failed to open de Seis seal.");
    }

    if (seisLayout === 1) {
      customMoveTo(7771, 5196);
    } else {
      customMoveTo(7798, 5186);
    }

    if (!getBoss(getLocaleString(2852))) {
      throw new Error("Failed to kill de Seis");
    }

    return true;
  }

  function infectorSeal() {
    // @ts-ignore
    Precast.doPrecast(true);
    console.log("Inf layout " + infLayout);
    followPath(infLayout === 1 ? starToInfA : starToInfB);

    if (!openSeal(392)) {
      throw new Error("Failed to open Infector seals.");
    }

    if (infLayout === 1) {
      delay(1);
    } else {
      customMoveTo(7928, 5295); // temp
    }

    if (!getBoss(getLocaleString(2853))) {
      throw new Error("Failed to kill Infector");
    }

    if (!openSeal(393)) {
      throw new Error("Failed to open Infector seals.");
    }

    return true;
  }

  const openSeals = () => {
    print("seal order: " + Config.Diablo.SealOrder);
    let seals = {
      1: () => vizierSeal(),
      2: () => seisSeal(),
      3: () => infectorSeal(),
      "vizier": () => vizierSeal(),
      "seis": () => seisSeal(),
      "infector": () => infectorSeal(),
    };
    Config.Diablo.SealOrder.forEach(seal => {
      seals[seal]()
    });
  };

  function followPath(path) {

    const pather = [];
    for (let i = 0; i < path.length; i += 2) {
      pather.push({x: path[i], y: path[i + 1]});
    }
    moveTo(pather, {
      rangeOverride: 30,
    });
  }

  const cleared = [],

    // path coordinates
    starToVizA = [7759, 5295, 7734, 5295, 7716, 5295, 7718, 5276, 7697, 5292, 7678, 5293, 7665, 5276, 7662, 5314],
    starToVizB = [7759, 5295, 7734, 5295, 7716, 5295, 7701, 5315, 7666, 5313, 7653, 5284],
    starToSeisA = [7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7775, 5205, 7804, 5193, 7814, 5169, 7788, 5153],
    starToSeisB = [7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7811, 5218, 7807, 5194, 7779, 5193, 7774, 5160, 7803, 5154],
    starToInfA = [7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5295, 7919, 5290],
    starToInfB = [7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5274, 7927, 5275, 7932, 5297, 7923, 5313];

  Pather.journeyTo(sdk.areas.ChaosSanctuary);
  initLayout();

  Pather.moveTo(7774, 5305);
  customMoveTo(7791, 5293);
  openSeals();


  let tick = getTickCount();
  Town.visitTown();
  while (getTickCount() - tick < 15e3) delay(10);

  moveTo({
    x: 7774,
    y: 5305,
  }, {
    allowTeleport: false,
    callback() {
      return getUnit(1, sdk.monsters.Diablo);
    }
  });

  Diablo.pwnDia();

  return true;
}


export = Diablo;

Diablo.pwnDia = function () {

  const getDia = () => getUnit(1, sdk.monsters.Diablo);

  {
    const nearSpot = spotOnDistance({x: 7792, y: 5292}, 35);
    Pather.moveToUnit(nearSpot);
  }

  console.log('Waiting for dia');
  let dia = Misc.poll(getDia, 15e3, 30);
  if (!dia) return;

  const manaTP = Skill.getManaCost(sdk.skills.Teleport),
    manaSK = Skill.getManaCost(sdk.skills.Blizzard),
    manaStatic = Skill.getManaCost(sdk.skills.StaticField),
    rangeStatic = Skill.getRange(sdk.skills.StaticField);

  let tick = getTickCount();
  let lastPosition = {x: 7791, y: 5293};
  let line = new Line(me.x, me.y, lastPosition.x, lastPosition.y, 0x70, true);
  do {
    // give up in 7 minutes
    if (getTickCount() - tick > 60 * 1000 * 7) break;

    while ((dia = getDia())) {
      if (dia.dead) break;
      line.x2 = lastPosition.x = dia.x;
      line.y2 = lastPosition.y = dia.y;
      line.x = me.x;
      line.y = me.y;

      if (dia.distance < 40 || dia.distance > 45 || getTickCount() - tick > 25e3) {
        const spot = calculateSpots(dia, 42.5)
          .filter(spot => spot.distance > 15 && spot.distance < 58 /*todo, in neighbour room*/)
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

        tick = getTickCount();
        Pather.teleportTo(spot.x, spot.y);
      }

      if (me.mp < manaSK + manaTP) {
        me.overhead('Dont attack, safe mana for teleport')
        delay(10);
        continue;
      }

      // If we got enough mana to teleport close to diablo, static the bitch, and jump back

      const diabloMissiles = getUnits(3).filter(unit => (unit.getParent() as Unit)?.gid === dia.gid)
      console.log('Diablo missiles: ' + diabloMissiles.length);
      console.log('Diablo mode:' + dia.mode);
      me.overhead('Dia life ' + (~~(dia.hp / 128 * 100)).toString() + '%')

      if (me.mp > manaStatic + manaTP + manaTP && diabloMissiles.length < 3 && ![4, 5, 7, 8, 9, 10, 11].includes(dia.mode)) {
        const {x, y} = me;


        // Find a spot close to Diablo
        const spot = spotOnDistance(dia, rangeStatic * (2 / 3));
        Pather.moveTo(spot.x, spot.y);
        Skill.cast(sdk.skills.StaticField);

        // Walk randomly away from diablo
        const randFn = (v) => () => v + rand(0, 20) - 10;
        const rX = randFn(x), rY = randFn(y);
        [

          inverseSpotDistance({x, y}, 3),
          inverseSpotDistance({x: rX(), y: rY()}, 5),
          inverseSpotDistance({x: rX(), y: rY()}, 7),
          inverseSpotDistance({x: rX(), y: rY()}, 10),

        ].forEach(({x, y}) => Misc.click(0, 0, x, y));
        Pather.moveTo(x, y);
      }

      Skill.cast(sdk.skills.Blizzard, 0, dia)
    }

    console.log(dia);
    if (dia && dia.dead) break;
    if (!dia) {
      console.log('lost sight of diablo, relocate the bastered');
      const path = getPath(me.area, me.x, me.y, lastPosition.x, lastPosition.y, 1, 5);
      if (!path) break; // failed to make a path from me to the old spot

      // walk close to old node, if we dont find dia continue
      if (!path.some(node => {
        Pather.walkTo(node.x, node.y);
        return getDia();
      })) break;

      console.log('relocated diablo')
    }
  } while (true);

  if (dia) {
    Pather.teleportTo(dia.x, dia.y);
  } else {
    Pather.moveTo(7774, 5305)
  }
  Pickit.pickItems();
}