import sdk from "../../sdk";
import {Override} from "../../overrides/Override";
import {Build} from "./Build";
import {BlockBits, getCollisionBetweenCoords, isBlockedBetween} from "../Coords";
import {BlockingUnit} from '../BlockingGfx';
import {startBuild} from "../../GlobalConfig";

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
    new Override(ClassAttack, 'decideSkill', function (original, monster: Monster) {
      let generatedSkill = -1;

      const data = {
        static: {
          have: me.getSkill(sdk.skills.StaticField, 1),
          range: Skill.getRange(sdk.skills.StaticField),
          mana: Skill.getManaCost(sdk.skills.StaticField),
          cap: [25, 33, 50][me.diff],
        },
        frost: {
          have: me.getSkill(sdk.skills.FrostNova, 1),
          range: 7,
          mana: Skill.getManaCost(sdk.skills.FrostNova)
        },
        nova: {
          have: me.getSkill(sdk.skills.Nova, 1),
          range: 7,
          mana: Skill.getManaCost(sdk.skills.Nova)
        },
        lightBolt: {
          have: me.getSkill(sdk.skills.ChargedBolt, 1),
          range: Skill.getRange(sdk.skills.ChargedBolt),
          mana: Skill.getManaCost(sdk.skills.ChargedBolt)
        }
      }

      { // Frozen
        const {frost: sk} = data;
        if (sk.have) {
          if (me.mp > sk.mana) {
            const monsters = getUnits(1).filter(unit => unit.attackable && unit.distance < sk.range && !unit.getState(sdk.states.Frozen))

            if (monsters.length > 0) {
              Skill.cast(sdk.skills.FrostNova, 0);
              return [generatedSkill, 1]; // Freeze those
            }
          }
        }
      }

      if (!monster || Attack.checkResist(monster, "lightning")) {
        const {static: sk} = data;
        if (sk.have && me.mp > sk.mana * 1.5) {
          const monsters = getUnits(1).filter(unit => {
            if (!unit.attackable) return false;
            if (unit.distance > sk.range) return false;
            return (unit.hp / 128 * 100) > sk.cap;
          })

          if (monsters.length > 1) {
            Skill.cast(sdk.skills.StaticField, 0);
            return [generatedSkill, 1]; // Static that bitch
          }
        }
      }

      if (!monster || Attack.checkResist(monster, "lightning")) {
        // Fireball/bolt
        const {nova} = data;
        const {lightBolt} = data;

        if (nova.have && me.mp > nova.mana) {
          generatedSkill = sdk.skills.Nova
        } else if (lightBolt.have && me.mp > lightBolt.mana) {
          generatedSkill = sdk.skills.ChargedBolt;
        } else {
          generatedSkill = 0;
        }
      } else {
        return [generatedSkill, 2];
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

    // 4224


    // Returns: 0 - fail, 1 - success, 2 - no valid attack skills
    new Override(ClassAttack, ClassAttack.doCast, (original, unit, skillId) => {
      // print(getCollision(me.area, me.x, me.y, unit.x, unit.y).toString(2));

      console.debug('>' + (getCollisionBetweenCoords(me.x, me.y, unit.x, unit.y).toString(2)));
      if (isBlockedBetween(me, unit) || unit.distance > 30) {
        Attack.getIntoPosition(unit, Skill.getRange(skillId) / 3, 0
          | BlockBits.LineOfSight
          | BlockBits.Ranged
          | BlockBits.Casting
          | BlockBits.ClosedDoor
          // | BlockBits.Players // This excludes our own spot
          | BlockBits.Objects
        );
        console.log('Get into position? ', unit, ' -> ' + Skill.getRange(skillId));
      }

      if (skillId > -1) {
        if (!unit.dead && !checkCollision(me, unit, 0x4)) {
          Skill.cast(skillId, Skill.getHand(skillId), unit);
        }

        return 1;
      }

      return 2;
    })
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