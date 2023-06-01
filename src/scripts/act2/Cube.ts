import moveTo from "../../lib/MoveTo";
import sdk from "../../sdk";
import {getExit, getQuestItem, getWp, getWpPreset, haveWp, moveToExit, talkTo} from "../util";

export = function () {

  // dont run if we got cube
  if (me.getItemsEx().find(el => el.classid === 549)) return;

  Town.goToTown();
  if (me.getSkill(sdk.skills.Teleport, 1)) {
    Cubing.getCube();


  } else {

    throw new Error('Not implemented yet; Cube getting without teleport');

  }
}