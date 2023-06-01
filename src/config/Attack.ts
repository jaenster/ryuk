import {skills} from "../sdk"

export = function () {
  switch (true) {
    case me.charlvl < 12:
      Config.LowManaSkill = [0, 0];
      Config.AttackSkill = [0, skills.FireBolt, 0, skills.FireBolt, 0, 0];
      break;

    case me.charlvl < 24:
      Config.LowManaSkill = [0, 0];
      Config.AttackSkill = [0, skills.FireBall, 0, skills.FireBall, 0, 0];
      break;

    case me.charlvl < 50:
      Config.LowManaSkill = [skills.IceBolt, skills.IceBolt];
      Config.AttackSkill = [0, skills.Blizzard, skills.IceBlast, skills.Blizzard, skills.IceBlast];
      break;
  }
}