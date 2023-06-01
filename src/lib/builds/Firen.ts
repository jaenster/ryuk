import sdk from "../../sdk";
import {Override} from "../../overrides/Override";
import {Build} from "./Build";
import {BlockBits, Collision, findCastingSpotSkill, getCollisionBetweenCoords, isBlockedBetween} from "../Coords";
import {BlockingUnit} from '../BlockingGfx';
import {startBuild} from "../../GlobalConfig";
import {calculateKillableFallensByFrostNova, calculateRawFireballDamage, calculateRawStaticDamage} from "../utilities";
import GameData from "../data/GameData";

const staticMap = new WeakMap<Monster, number>();

const build: Build = {
  get usedSkills() {
    return [sdk.skills.FireBolt, sdk.skills.FireBall, sdk.skills.FrostNova]
      .filter(el => me.getSkill(el, 1));
  },
  name: 'Firen',
  skills: [

    // Some level specific skills. Like telekinesis, we can skill at lvl 16, but we dont want until lvl 17
    {skill: sdk.skills.Telekinesis, amount: 1, minLevel: 17},
    {skill: sdk.skills.FrozenArmor, amount: 1, minLevel: 3},

    // Skills we want as soon as possible
    {skill: sdk.skills.Teleport, amount: 1},
    {skill: sdk.skills.FrostNova, amount: 1, minLevel: 6},
    {skill: sdk.skills.StaticField, amount: 4},

    // Skill fire ball as high as we can, then worry about fire bolt
    {skill: sdk.skills.FireBall, amount: 20},
    {skill: sdk.skills.FireBolt, amount: 20},

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
        fireBall: {
          have: me.getSkill(sdk.skills.FireBall, 1),
          range: Skill.getRange(sdk.skills.FireBall),
          mana: Skill.getManaCost(sdk.skills.FireBall),
          dmg: calculateRawFireballDamage(monster),
        },
        fireBolt: {
          have: me.getSkill(sdk.skills.FireBolt, 1),
          range: Skill.getRange(sdk.skills.FireBolt),
          mana: Skill.getManaCost(sdk.skills.FireBolt),
          dmg: ((dmg) => {
            return (dmg.min + dmg.max) / 2;
          })(GameData.skillDamage(sdk.skills.FireBolt, monster)),
        }
      }

      // todo: don't use frost nova if 1 fireball will kill
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


            // if the nova cause the death of any monsters around us, its worth it
            if (calculateKillableFallensByFrostNova() > 0) {
              Skill.cast(sdk.skills.FrostNova, 0);
              return [generatedSkill, 1]; // Frozen those
            }
          }
        }
      }

      // For now, dont static duriel
      if (monster && ![sdk.monsters.Duriel, sdk.monsters.Diablo].includes(monster.classid)) {

        let count; // Avoid static'ing monsters an entire group of monsters for ever, every 4th static, want something else
        if (!staticMap.has(monster)) staticMap.set(monster, count = 0);
        count = staticMap.get(monster) + 1;

        if (count < 4 && monster && Attack.checkResist(monster, "lightning") && data.static.dmg > Math.max(data.fireBolt.dmg, data.fireBall.dmg)) {
          // Actually make the bot walk to up to the monster and static, as this is the best decision
          if (me.mp > data.static.mana && !isBlockedBetween(me, monster)) {
            staticMap.set(monster, count + 1);
            return [sdk.skills.StaticField, 0];
          }
        } else {
          // If we dont decide to static, remove the counter
          staticMap.delete(monster)
        }
      }

      if (!monster || Attack.checkResist(monster, "fire")) {
        // Fireball/bolt
        const {fireBall: fa} = data;
        const {fireBolt: fo} = data;

        if (fa.have && me.mp > fa.mana * 1.5) {
          generatedSkill = sdk.skills.FireBall
        } else if (fo.have && me.mp > fo.mana) {
          generatedSkill = sdk.skills.FireBolt;
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
  ],
  valid: function () { // this build works up to lvl 30
    return me.charlvl < 30 && startBuild === this.name;
  },
  // Function to see if this is the build we currently have
  active: function () {
    if (me.getSkill(sdk.skills.Blizzard, 0)) return false;

    if (me.charlvl < 6) return true;

    // If we have Charged bolt skilled, and not LightingMastery. This build is active
    return !!me.getSkill(sdk.skills.FireBolt, 0) || (!!me.getSkill(sdk.skills.ChargedBolt, 0) && !me.getSkill(sdk.skills.LightningMastery, 0));
  },
  respec() {
    return false; // We cant respec to this build, as this _is_ the build
  },
  hotkeys: [
    {
      key: 0, // F1
      skill: sdk.skills.FireBolt,
      hand: 1,
    },
    {
      key: 1, // F2
      skill: sdk.skills.FireBall,
      hand: 1,
    },
    {
      key: 2, // F3
      skill: sdk.skills.StaticField,
      hand: 0,
    },
    {
      key: 3, // F4
      skill: sdk.skills.Teleport,
      hand: 0,
    },
    {
      key: 4, // F5
      skill: sdk.skills.FrozenArmor,
      hand: 0,
    },
    {
      key: 5, // F6
      skill: sdk.skills.FrostNova,
      hand: 0,
    },
    {
      key: 6, // F7
      skill: sdk.skills.TownPortal,
      hand: 0,
    },
  ]
}

export default build;
