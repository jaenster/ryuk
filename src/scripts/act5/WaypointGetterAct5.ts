import sdk from "../../sdk";
import {haveWp} from "../util";

export = function () {
  [
    sdk.areas.FrigidHighlands,
    sdk.areas.ArreatPlateau,
    sdk.areas.CrystalizedPassage,
    sdk.areas.GlacialTrail,
    sdk.areas.FrozenTundra,
    sdk.areas.AncientsWay,
  ].forEach(area => {
    if (!haveWp(area)) {
      Pather.getWP(area);
      Pather.useWaypoint(sdk.areas.PandemoniumFortress);
      Town.doChores();
    }
  });

}