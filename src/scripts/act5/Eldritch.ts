import moveTo from "../../lib/MoveTo";
import sdk from "../../sdk";


export = function () {

  Town.goToTown();
  Pather.useWaypoint(sdk.areas.FrigidHighlands);

  if (me.diff === 0) { // Cold imumn on nightmare/hell
    moveTo({x: 3726, y: 5058}, {
      callback() {
        return getUnits(1).filter(unit => unit.name === getLocaleString(22500)).first()?.dead;
      }
    });
  }

  moveTo({x: 3909, y: 5113}, {
    callback() {
      return getUnits(1).filter(unit => unit.name === getLocaleString(22435)).first()?.dead;
    }
  })

  Pickit.pickItems();

}