import sdk from "../../sdk";
import {getQuestItem, talkTo} from "../util";

export = function () {
  Pather.journeyTo(sdk.areas.ClawViperTempleLvl2);
  Pather.moveTo(15044, 14045);
  getQuestItem(sdk.items.ViperAmulet, sdk.units.ViperChest);
  Town.goToTown();
  sendPacket(1, 0x40); // Quest packet
}