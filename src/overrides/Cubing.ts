import {Override} from "./Override";

new Override(Cubing, Cubing.openCube, function () {
  if (getUIFlag(0x1a)) return true;


  const cube = me.getItem(549);

  if (!cube) return false;

  if (cube.location === 7 && !Town.openStash()) return false;

  for (let i = 0; i < 3 && !getUIFlag(0x1a); i += 1) {
    cube.interact();
    Misc.poll(() => getUIFlag(0x1a))
    delay(300 + me.ping * 2); // allow UI to initialize
  }

  return getUIFlag(0x1a);
})