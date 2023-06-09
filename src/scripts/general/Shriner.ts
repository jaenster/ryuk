import sdk from "../../sdk";
import {getWpPreset, haveWp} from "../util";

export = function () {
  Town.goToTown(1);
  delay(500);

  // dont search for a shrine if we got one
  if (me.getState(sdk.states.ShrineExperience)) return;


  const shrines = [
    sdk.areas.ColdPlains,
    sdk.areas.StonyField,
    sdk.areas.DarkWood,
    sdk.areas.BlackMarsh,
    sdk.areas.OuterCloister,
    // sdk.areas.JailLvl1,
    // sdk.areas.CatacombsLvl2,

  ]
    .filter(el => haveWp(el))
    .map(area => {
      const wpPreset = getWpPreset(area);
      const wp = {x: wpPreset.roomx * 5 + wpPreset.x, y: wpPreset.roomy * 5 + wpPreset.y}

      return (getPresetUnits(area) || undefined)
        ?.filter(el => el.id === 2)
        .map(ps => ({x: ps.roomx * 5 + ps.x, y: ps.roomy * 5 + ps.y, area}))
      // .filter(shrine => getDistance(shrine, wp) < 200)

    }).reduce((acc, cur) => {
      cur.forEach(el => acc.push(el));
      return acc;
    }, []);

  shrines.some(shrine => {
    Pather.useWaypoint(shrine.area);

    const xpshrine = getUnits(2, "shrine")
      .filter(el => el.objtype === sdk.shrines.Experience && !el.mode)
      .sort((a, b) => a.distance - b.distance)
      .first();

    // This shouldnt be part of the shriner to be honest, but its the easiest way to hack this in there
    // The monsters of "the tree" come running towards the char from time to time
    if (shrine.area === sdk.areas.DarkWood && me.charlvl > 6 && me.charlvl < 12) {
      const treehead = getUnit(1, getLocaleString(sdk.locale.monsters.TreeheadWoodFist));

      // Treehead is coming towards us or is close
      if (treehead && (treehead.distance < 40 || getDistance(me, treehead.targetx, treehead.targety) < 10)) {
      }
    }

    if (xpshrine) {
      const [x, y] = [me.x, me.y];
      Pather.moveToUnit(xpshrine);
      Misc.getShrine(xpshrine);
      Pather.moveTo(x, y);
    }
    return me.getState(sdk.states.ShrineExperience);
  })
}