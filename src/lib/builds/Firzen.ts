import sdk from "../../sdk";
import {Build} from "./Build";

const build: Build = {
  name: 'Firzen', // little fighter 2 reference. If you melt the 2 chars Firen and Freeze you get Firzen
  skills: [

    {skill: sdk.skills.Teleport, amount: 1},
    {skill: sdk.skills.StaticField, amount: 1},
    {skill: sdk.skills.Blizzard, amount: 20},
    {skill: sdk.skills.FireBall, amount: 20},
    {skill: sdk.skills.FireMastery, amount: 1},
    {skill: sdk.skills.ColdMastery, amount: 1},

  ],
  stats: {
    strength: [35, 1],
    dexterity: [0, 0],
    vitality: [200, 3],
    energy: [100, 1],
  },
  overrides: [],
  valid: function () {
    return me.diff === 0;
  },
  // Function to see if this is the build we currently have
  active: function () {
    // If we got hardcoded skills in firebolt, this is not the current active build
    if (me.getSkill(sdk.skills.FireBolt, 0)) return false;

    // If we got blizzard, this is the build we currently run
    if (me.getSkill(sdk.skills.Blizzard, 0)) return true;

    // If we got more as half of our skill points left over, its most likely we just respeced
    if (me.getStat(sdk.stats.Newskills) > (me.charlvl / 2)) {
      // we are level 24 to 30 with more as half of our skills available, we are respecing
      if (me.charlvl >= 24 && me.charlvl <= 30) return true;
    }

    return false;
  },
  respec() {
    if (me.charlvl >= 24 && !me.getSkill(sdk.skills.Blizzard, 0) && me.charlvl < 30) return 'normal';
    return false;
  },
  usedSkills: [sdk.skills.Blizzard, sdk.skills.FireBall]
};
export default build;