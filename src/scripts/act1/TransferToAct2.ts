import sdk from "../../sdk";

export = function () {
  Town.goToTown(1);
  Town.move(NPC.Warriv);

  const npc = getUnit(1, NPC.Warriv);

  if (!npc || !npc.openMenu()) return false;

  Misc.useMenu(sdk.menu.GoEast);
}
