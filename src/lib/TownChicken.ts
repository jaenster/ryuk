import worker from "../lib/worker";
import {SkipScript} from "../decisions/Throwables";

const lastChickens: [number, number, number, number][] = [];
const Config = {
  chicken: 45,
  checkPots: true,
  disabled: false,
}

let recursion = true;

// @ts-ignore // Only load this shit in global scope
if (getScript(true).name.toLowerCase() === 'default.dbj') {
  worker.runInBackground('townChicken', function () {
    if (Config.disabled) return true;
    if (recursion) return true;

    let potionsPrice = Town.buyPotionsPrice();
    // town chicken if you have enough gold to buy potions, this is the goal of town chickening
    let chicken = !me.inTown && (
      me.hp * 100 / me.hpmax < Config.chicken
    ); //&& me.gold >= potionsPrice;

    if (chicken && me.gold < potionsPrice) {
      // we need to chicken, but we don't have gold to buy potions, should we quit ?
      // no need to loose a tp
      me.overhead("not enough gold to town chicken, quit ?");
      return true;
    }

    // If we dont need to chicken, calculate if we need pots, and have some decent gold base
    if (!chicken && !me.inTown && me.gold >= potionsPrice) {
      const pots = me.getItemsEx().filter(item =>
        (item.location === 3 || item.location === 2)
        && (item.itemType === 76 || item.itemType === 77)
      );
      if (!pots.some(item => item.itemType === 76)) {
        console.log('Need hp pots');
        chicken = true;
      }

      if (!chicken && !pots.some(item => item.itemType === 77)) {
        console.log('Need mp pots');
        chicken = true;
      }
    }


    if (chicken) {

      let tpTool = Town.getTpTool();
      if (!tpTool) {
        console.log('Cant chicken without portalz');
        return true;
      }

      console.log('fuck this, town chicken');

      // If this is the third chicken this minute, skip it all together

      const recentChicks = lastChickens
        .slice(Math.max(lastChickens.length - 3), lastChickens.length - 1);

      const stopCurrentScript = recentChicks.length >= 2 && recentChicks
        .every(([count]) => getTickCount() - count < 60e3);

      lastChickens.push([getTickCount(), me.area, me.x, me.y]);

      try {
        recursion = true;
        try {
          Pather.makePortal(true);
        } catch (e) {
          console.warn("Town chicken catch");
          throw e;
        }
        const [act, x, y] = [me.act, me.x, me.y];
        const tick = getTickCount();

        if (stopCurrentScript) throw new SkipScript("Too many town chickens on this script, next");

        Town.doChores();
        Town.goToTown(act);
        Pather.moveTo(x, y)

        while (getTickCount() - tick < 4500) delay(10);
        Pather.usePortal(null, me.name);
      } finally {
        recursion = false;
      }
    }

    return true;
  })
}
export = Config;