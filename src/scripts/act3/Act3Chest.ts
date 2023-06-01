import sdk from "../../sdk";

export = function () {

  Pather.journeyTo(sdk.areas.LowerKurast);
  Misc.openChestsInArea();

  Pather.journeyTo(sdk.areas.KurastBazaar);
  Misc.openChestsInArea();

  Pather.journeyTo(sdk.areas.UpperKurast);
  Misc.openChestsInArea();

  Pather.getWP(sdk.areas.UpperKurast);
}