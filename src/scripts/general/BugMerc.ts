import sdk from "../../sdk";
import worker from '../../lib/worker'

enum State {
  CLOSED,
  BLOCKED, // Player/monster walking through, but not sure
  OPEN,
}

const toggleDoor = (door, preferedState: State.CLOSED | State.OPEN) => {
  while (door.mode !== preferedState) {
    if (me.getSkill(sdk.skills.Telekinesis, 1)) {
      Skill.cast(sdk.skills.Telekinesis, 0, door);
    } else {
      Misc.click(0, 0, door);
    }
    delay(100);
  }
}

export = function () {
  const merc = me.getMerc();
  // Can only bug a guard
  if (!merc || merc.classid !== sdk.monsters.Guard) {
    return;
  }


  const magicLine = 20020;
  let done = false;
  let lastMercSettings: { x: number, y: number };
  let mercWarped = false;


  const inside = Pather.teleportTo.bind(Pather, 20004, 5020);
  const outside = Pather.moveTo.bind(Pather, 20026, 5032);

  const originalTeleport = Pather.useTeleport;
  const openDoors = Pather.openDoors;
  try {
    Pather.openDoors = Pather.useTeleport = () => false;
    Pather.useWaypoint(sdk.areas.InnerCloister);

    worker.runInBackground('warpedMerc', function () {
      const merc = me.getMerc();

      if (merc) {
        if (typeof lastMercSettings === 'undefined') {
          const {x, y} = merc;
          lastMercSettings = {x, y}
        }
        let init = typeof lastMercSettings === 'undefined';
        if (!init && getDistance(lastMercSettings, merc) > 30 || typeof lastMercSettings === 'undefined') {
          console.log('Merc warped');
          mercWarped = true;
        }
        const {x, y} = merc;
        lastMercSettings = {x, y}
      }

      return !done;
    })

    while (!mercWarped) {
      inside();
      const merc = me.getMerc();
      if (!Misc.poll(() => merc?.x < magicLine, 2e3, 30)) {
        outside();
        continue;
      }

      do {
        inside();
        const door = getUnit(2, 23);
        toggleDoor(door, State.OPEN)
        outside();
        toggleDoor(door, State.CLOSED)
      } while (merc?.x > magicLine);

      mercWarped = false;
      console.log('Merc is trapped');
      Pather.moveTo(20088, 5039);
      Pather.moveTo(20085, 5098)
      while (!mercWarped) delay(100);
    }
    console.log('Merc is warped');
  } finally {
    Pather.useTeleport = originalTeleport;
    Pather.openDoors = openDoors;
    done = true;
  }
  Pather.getWP(sdk.areas.InnerCloister);
  Pather.useWaypoint(sdk.areas.RogueEncampment);
}

