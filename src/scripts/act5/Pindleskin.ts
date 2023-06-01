import sdk from "../../sdk";

export = function () {

  Town.goToTown(5);
  Town.move(NPC.Anya);

  if (!Pather.usePortal(121)) {
    throw new Error("Failed to use portal.");
  }

  // @ts-ignore
  Precast.doPrecast(true);

  Pather.moveTo(10059, 13246);


  const ps = getUnits(1).filter(el => el.name === getLocaleString(22497)).first();
  while (ps && ps.attackable && Attack.checkResist(ps, 'cold')) {
    const [skill] = ClassAttack.decideSkill(ps);
    Skill.cast(skill, 0, ps);
  }
  Pather.teleportTo(ps.x, ps.y);
  Pickit.pickItems();
  Town.goToTown();
}