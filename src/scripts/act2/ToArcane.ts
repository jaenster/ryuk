import sdk from "../../sdk";
import {getExit, getWpPreset, gotWp} from "../util";
import moveTo from "../../lib/MoveTo";


export = function () {

  const areas = [sdk.areas.LutGholein, sdk.areas.HaremLvl1, sdk.areas.HaremLvl2, sdk.areas.PalaceCellarLvl1, sdk.areas.PalaceCellarLvl2, sdk.areas.PalaceCellarLvl3, sdk.areas.ArcaneSanctuary];

  if (gotWp(sdk.areas.PalaceCellarLvl1)) {
    // Remove haram 1 and 2
    areas.splice(0, 2);
    Pather.useWaypoint(sdk.areas.PalaceCellarLvl1);
  }

  areas.forEach((el, idx, self) => {
    const nextArea = self[idx+1];
    if (!nextArea) return; // There

    // Go to area by waypoint (either lut or palace 1) depending on above
    if (Pather.wpAreas.includes(el) && gotWp(el)) {
      Pather.useWaypoint(el);
    }

    const nodes: PathNode[] = [];

    // Grab palace wp 1
    if (sdk.areas.PalaceCellarLvl1 === el && !gotWp(el)) {
      const preset = getWpPreset(sdk.areas.PalaceCellarLvl1);
      if (preset) nodes.push({x: preset.roomx * 5 + preset.x, y: preset.roomy * 5 + preset.y})
    }

    const exit = getExit(el, nextArea);
    nodes.push({x: exit.x, y: exit.y})

    moveTo(nodes);
    Pather.moveToExit(nextArea, true); // Should be next to it but relay this makes it more easy to take the stairs
  })
}