import {filterNormalMonsters, getWp, gotWp, moveToExit} from "../util";
import sdk from "../../sdk";
import Clear from '../../lib/clear'

export = function () {

  Clear.on('sorting', filterNormalMonsters);
  try {
    if (!gotWp(sdk.areas.OuterCloister)) {
      Pather.useWaypoint(sdk.areas.BlackMarsh);
      moveToExit(sdk.areas.OuterCloister, sdk.areas.MonasteryGate);
      getWp();
    }

    if (!gotWp(sdk.areas.JailLvl1)) {
      Pather.useWaypoint(sdk.areas.OuterCloister);
      moveToExit(sdk.areas.JailLvl1, sdk.areas.Barracks);
      getWp();
    }

    if (!gotWp(sdk.areas.InnerCloister)) {
      Pather.useWaypoint(sdk.areas.JailLvl1);
      moveToExit(sdk.areas.JailLvl2);
      moveToExit(sdk.areas.JailLvl3);
      moveToExit(sdk.areas.InnerCloister);
      getWp();
    }

    if (!gotWp(sdk.areas.CatacombsLvl2)) {
      Pather.useWaypoint(sdk.areas.InnerCloister);
      moveToExit(sdk.areas.CatacombsLvl1, sdk.areas.Cathedral);
      moveToExit(sdk.areas.CatacombsLvl2);
      getWp();
    }

    if (!me.getQuest(sdk.quests.SistersToTheSlaughter, 0)) {
      if (me.area !== sdk.areas.CatacombsLvl2) {
        Pather.useWaypoint(sdk.areas.CatacombsLvl2);
      }
      // Do andy in its designed script
      moveToExit(sdk.areas.CatacombsLvl3);
      moveToExit(sdk.areas.CatacombsLvl4);
    }
  } finally {
    Clear.off('sorting', filterNormalMonsters);
  }
}