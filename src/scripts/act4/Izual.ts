import sdk from "../../sdk";
import moveTo from "../../lib/MoveTo";

export = function () {

  Pather.journeyTo(sdk.areas.PlainsOfDespair);

  const izualPreset = getPresetUnit(105, 1, 256) || undefined;

  moveTo(izualPreset, {
    callback() {
      return getUnit(1, 256)?.dead;
    }
  });

}