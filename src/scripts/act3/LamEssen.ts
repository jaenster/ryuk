import sdk from "../../sdk";
import {spotOnDistance} from "../util";

export = function () {
  Pather.journeyTo(sdk.areas.RuinedTemple);
  Pather.moveToPreset(me.area, 2, 193, undefined, undefined, undefined, true);
  const tome = Misc.poll(() => getUnit(2, 193));
  const spot = spotOnDistance(tome, 15);
  Pather.teleportTo(spot.x, spot.y);


  Misc.poll(() => {
    Skill.cast(sdk.skills.Telekinesis, 0, tome);
    Skill.cast(sdk.skills.FrostNova, 0);
    return tome.mode;
  });

  Skill.cast(sdk.skills.Teleport, 0, tome);
  Pather.makePortal();
  const book = Misc.poll(() => getUnit(4, sdk.items.LamEsensTome));
  Pickit.pickItem(book);
  Pather.usePortal(sdk.areas.KurastDocktown, me.name);
  sendPacket(1, 0x40);
  delay(600);
}