import sdk from "../../sdk";
import {Override} from "../../overrides/Override";
import {Build} from "./Build";
import {Collision, isBlockedBetween} from "../Coords";
import {BlockingUnit} from '../BlockingGfx';
import {startBuild} from "../../GlobalConfig";
import {
  calculateKillableFallensByFrostNova,
  calculateNovaDamage,
  calculateRawFireballDamage,
  calculateRawStaticDamage
} from "../utilities";
import GameData from "../data/GameData";

const staticMap = new WeakMap<Monster, number>();

const build: Build = {
  get usedSkills() {
    return [sdk.skills.FireBolt, sdk.skills.FireBall, sdk.skills.FrostNova]
      .filter(el => me.getSkill(el, 1));
  },
  name: 'Nova',
  skills: [

    // Some level specific skills. Like telekinesis, we can skill at lvl 16, but we dont want until lvl 17
    {skill: sdk.skills.Telekinesis, amount: 1, minLevel: 17},
    {skill: sdk.skills.FrozenArmor, amount: 1, minLevel: 3},
    {skill: sdk.skills.Teleport, amount: 1},

    // Skills we want as soon as possible
    {skill: sdk.skills.FrostNova, amount: 1},
    {skill: sdk.skills.StaticField, amount: 5, minLevel: 7},
    {skill: sdk.skills.Nova, amount: 6},
    {skill: sdk.skills.ChargedBolt, amount: 6},

  ],
  stats: {
    strength: [35, 1],
    dexterity: [0, 0],
    vitality: [200, 3],
    energy: [100, 1],
  },
  overrides: [
    new Override(ClassAttack, 'decideSkill', function (original, monster: Monster, skipSkill: number[] = []) {
      let generatedSkill = -1;

      // console.log('raw static dmg:', calculateRawStaticDamage(monster));
      // console.log('raw fireball dmg:', calculateRawFireballDamage(monster));
      //
      // const fireBoltDmg = GameData.skillDamage(sdk.skills.FireBolt, monster);
      // console.log('raw firebolt dmg:', (fireBoltDmg.min + fireBoltDmg.max) / 2);

      const data = {
        static: {
          have: me.getSkill(sdk.skills.StaticField, 1),
          range: Skill.getRange(sdk.skills.StaticField),
          mana: Skill.getManaCost(sdk.skills.StaticField),
          cap: [25, 33, 50][me.diff],
          dmg: skipSkill.includes(sdk.skills.StaticField) ? 0 : calculateRawStaticDamage(),
        },
        frost: {
          have: me.getSkill(sdk.skills.FrostNova, 1),
          range: 7,
          mana: Skill.getManaCost(sdk.skills.FrostNova)
        },
        nova: {
          have: me.getSkill(sdk.skills.FireBall, 1),
          range: Skill.getRange(sdk.skills.FireBall),
          mana: Skill.getManaCost(sdk.skills.FireBall),
          dmg: calculateNovaDamage(),
        },
        fireBolt: {
          have: me.getSkill(sdk.skills.FireBolt, 1),
          range: Skill.getRange(sdk.skills.FireBolt),
          mana: Skill.getManaCost(sdk.skills.FireBolt),
          dmg: ((dmg) => {
            return (dmg.min + dmg.max) / 2;
          })(GameData.skillDamage(sdk.skills.FireBolt, monster)),
        },
        chargedBolt: {
          have: me.getSkill(sdk.skills.ChargedBolt, 1),
          range: Skill.getRange(sdk.skills.ChargedBolt),
          mana: Skill.getManaCost(sdk.skills.ChargedBolt),
          dmg: ((dmg) => {
            return (dmg.min + dmg.max) / 2;
          })(GameData.skillDamage(sdk.skills.ChargedBolt, monster)),
        }
      }

      //ToDo calculate if everyone dies with a single nova, its pointless to frost nova
      { // Frozen
        const {frost: sk} = data;
        if (sk.have) {
          if (me.mp > sk.mana) {
            const monsters = getUnits(1)
              .filter(unit => unit.attackable
                && unit.distance < sk.range
                && unit.getStat(sdk.stats.Coldresist) < 100
                && !unit.isChilled
                && unit.x
                && !checkCollisionBetween(me.x, me.y, unit.x, unit.y, 5, Collision.BLOCK_MISSILE)
              )

            if (monsters.length > 0) {
              Skill.cast(sdk.skills.FrostNova, 0);
              return [generatedSkill, 1]; // Freeze those
            }

            //ToDo calculate if everyone dies with a single nova, its pointless to frost nova

            // if the nova cause the death of any monsters around us, its worth it
            if (calculateKillableFallensByFrostNova() > 0) {
              Skill.cast(sdk.skills.FrostNova, 0);
              return [generatedSkill, 1]; // Frozen those
            }
          }
        }
      }

      if (monster) {
        let count; // Avoid static'ing monsters an entire group of monsters for ever, every 4th static, want something else
        count = (staticMap.get(monster) | 0) + 1;
        staticMap.set(monster, count);

        if (count < 4 && monster && Attack.checkResist(monster, "lightning") && data.static.dmg > Math.max(data.nova.dmg, data.chargedBolt.dmg)) {
          // Actually make the bot walk to up to the monster and static, as this is the best decision
          if (me.mp > data.static.mana && !isBlockedBetween(me, monster)) {
            staticMap.set(monster, count + 1);
            return [sdk.skills.StaticField, 0];
          }
        } else {
          // If we don't decide to static, remove the counter
          staticMap.delete(monster)
        }
      }

      if (!monster) {
        const {nova} = data;
        if (nova.have && me.mp > nova.mana) {
          generatedSkill = sdk.skills.Nova;
        } else {
          generatedSkill = sdk.skills.ChargedBolt;
        }
      }

      return [generatedSkill, 0];
    }),

    new Override(ClassAttack, ClassAttack.doAttack, function (original, unit: Monster, preattack: boolean) {
      // No merc
      // no energy shield
      // no preattack

      BlockingUnit.splice(0, BlockingUnit.length);
      BlockingUnit.push(unit.type, unit.classid);

      let [generatedSkill, ret] = this.decideSkill(unit)
      if (ret) return ret;

      let result = this.doCast(unit, generatedSkill, 0);

      if (result === 2) {
        //ToDo; telestomp merc
        // if (failed) return 2;

        return 1;
      }

      return result;

    }),
  ],
  valid: function () {
    return me.charlvl < 30 && startBuild === this.name;
  },
  // Function to see if this is the build we currently have
  active: function () {
    if (me.getSkill(sdk.skills.Blizzard, 0)) return false;

    if (me.charlvl < 6) return true;

    //If we have charge bolt atleast lvl 3, and above lvl 13, nova
    return !!(me.getSkill(sdk.skills.ChargedBolt, 0) > 3 && (me.charlvl < 13 || me.getSkill(sdk.skills.Nova, 0))) && !!me.getSkill(sdk.skills.Lightning, 0);
  },
  respec() {
    return false; // We cant respec to this build, as this _is_ the build
  }
}

export default build;