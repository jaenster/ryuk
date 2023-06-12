import sdk from "../../sdk";
import Shopper from "../../lib/town/actions";

export = function () {
  Town.goToTown();
  Shopper.run()

  Pather.journeyTo(sdk.areas.DenOfEvil);
  Attack.clearLevel();

  sendPacket(1, 0x40);
  Town.goToTown();
  delay(500);
}