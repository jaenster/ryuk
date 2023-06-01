import {getWp, gotWp, moveToExit} from "../util";
import sdk from "../../sdk";

export = function () {
  if (me.area === sdk.areas.BurialGrounds) {
    Town.goToTown(1);
  }
  if (me.area !== sdk.areas.StonyField) {

    if (!gotWp(sdk.areas.StonyField) && me.area !== sdk.areas.ColdPlains) {
      Pather.useWaypoint(sdk.areas.ColdPlains);
    }
    if (me.area === sdk.areas.ColdPlains) {
      getWp(sdk.areas.StonyField);
    }


    if (me.area !== sdk.areas.StonyField) {
      Pather.useWaypoint(sdk.areas.StonyField);
    }

    if (me.area !== sdk.areas.StonyField) return;
  }

  moveToExit(sdk.areas.UndergroundPassageLvl1, sdk.areas.StonyField, {
    rangeOverride: 5, // Dont care about the monsters, just clear what is in the way, walk
  });
  moveToExit(sdk.areas.DarkWood, sdk.areas.UndergroundPassageLvl1, {
    rangeOverride: 5, // Dont care about the monsters, just clear what is in the way, walk
  });
  getWp(sdk.areas.DarkWood);
}