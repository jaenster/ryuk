import sdk from "../../sdk";

export = function () {
  Town.goToTown();
  Town.doChores();

  Pather.journeyTo(sdk.areas.DenOfEvil);
  Attack.clearLevel();

  sendPacket(1, 0x40);
  Town.goToTown();
  delay(500);
}