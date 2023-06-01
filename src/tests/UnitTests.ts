import _gems from "../lib/data/GemData";
import sdk from "../sdk";

export default function () {
  console.log('Starting Unit Tests');

  // @ts-ignore
  require("./d2bs.test");

  // @ts-ignore
  require("./Runewords.test");

  /*
  me.getItemsEx().forEach(i => {
      console.log(i.fname);
      console.log(i.getStat(sdk.stats.EnhancedDamage, 0, 0xAB))
      console.log(i.getStat(sdk.stats.SecondaryMindamage, 0, 0xAB))
      console.log(i.getStat(sdk.stats.SecondaryMaxdamage, 0, 0xAB))
      console.log(i.getStat(-1))
      console.log(i.getStat(-2))
  })
  */

  /*
  console.log(me.rawDexterity);
  console.log(me.rawStrength);
  console.log(me.getMerc().rawDexterity);
  console.log(me.getMerc().rawStrength);
  */

  _gems

  while (true) {
    /*
    var area = me.area;
    revealLevel(true);
    if (me.area !== area) {
        area = me.area;
        revealLevel(true);
    }
    const nearMissiles = getUnits(sdk.unittype.Missiles)
        .filter(unit => !!unit.getParent() && (unit.getParent() as Unit)?.gid !== me.gid && (unit.getParent() as Unit)?.gid !== me.getMerc()?.gid)
        .map(m => ({ missile: m as Missile, data: _missiles[m.classid] }))
        .filter(m => !!m.data)
        .filter(m => m.data.velocity === 0);
    nearMissiles.forEach(m => {
        console.log(m.missile);
        console.log(m.data);
    })
    */
    delay(1000);
  }
}