import sdk from "../../sdk";
import {Build} from "./Build";
import {Override} from "../../overrides/Override";
import {BlockBits, isBlockedBetween} from "../Coords";
import {calculateBlizzardDamage, calculateKillableFallensByFrostNova, calculateRawStaticDamage} from "../utilities";
import GameData from "../data/GameData";
import {BlockingUnit} from "../BlockingGfx";

const build: Build = {
  get usedSkills() {
    return [sdk.skills.Blizzard, sdk.skills.IceBlast, sdk.skills.GlacialSpike, sdk.skills.FrostNova]
      .filter(el => me.getSkill(el, 1));
  },
  name: 'Freeze',
  skills: [

    // Some level specific skills. Like telekinesis, we can skill at lvl 16, but we dont want until lvl 17
    {skill: sdk.skills.Teleport, amount: 1},
    {skill: sdk.skills.ColdMastery, amount: 1},
    {skill: sdk.skills.StaticField, amount: 5},
    {skill: sdk.skills.Warmth, amount: 1},

    {skill: sdk.skills.Blizzard, amount: 20},
    {skill: sdk.skills.IceBlast, amount: 20},
    {skill: sdk.skills.ColdMastery, amount: 5, softSkills: true},
    {skill: sdk.skills.GlacialSpike, amount: 20},
    {skill: sdk.skills.ColdMastery, amount: 8, softSkills: true},
    {skill: sdk.skills.IceBolt, amount: 20},
    {skill: sdk.skills.ColdMastery, amount: 13, softSkills: true},

  ],
  stats: {
    strength: [35, 1],
    dexterity: [0, 0],
    vitality: [300, 3],
    energy: [100, 1],
  },
  overrides: [
    new Override(ClassAttack, 'decideSkill', function (original, monster: Monster, skipSkill: number[] = []) {
      let generatedSkill = -1;

      const avgDmg = (obj: { min: number, max: number }) => (obj.min + obj.max) / 2

      const data = {
        static: {
          have: me.getSkill(sdk.skills.StaticField, 1),
          range: Skill.getRange(sdk.skills.StaticField),
          mana: Skill.getManaCost(sdk.skills.StaticField),
          dmg: skipSkill.includes(sdk.skills.StaticField) ? 0 : calculateRawStaticDamage(),
        },
        frost: {
          have: me.getSkill(sdk.skills.FrostNova, 1),
          range: 7,
          mana: Skill.getManaCost(sdk.skills.FrostNova)
        },
        iceBolt: {
          have: me.getSkill(sdk.skills.IceBolt, 1),
          range: Skill.getRange(sdk.skills.IceBolt),
          mana: Skill.getManaCost(sdk.skills.IceBolt),
          dmg: skipSkill.includes(sdk.skills.IceBolt) ? 0 : avgDmg(GameData.skillDamage(sdk.skills.IceBolt)),
        },
        iceBlast: {
          have: me.getSkill(sdk.skills.IceBlast, 1),
          range: Skill.getRange(sdk.skills.IceBlast),
          mana: Skill.getManaCost(sdk.skills.IceBlast),
          dmg: skipSkill.includes(sdk.skills.IceBlast) ? 0 : avgDmg(GameData.skillDamage(sdk.skills.IceBlast)),
        },
        // ToDO; add gladical spike here
        blizzard: {
          have: me.getSkill(sdk.skills.Blizzard, 1),
          range: Skill.getRange(sdk.skills.Blizzard),
          mana: Skill.getManaCost(sdk.skills.Blizzard),
          dmg: 0,
        }
      }

      if (monster) {
        if (!skipSkill.includes(sdk.skills.Blizzard)) {
          // blizzard only does damage if we can cast it, and is not on lava
          if (!me.getState(sdk.states.SkillDelay) && !(getCollision(monster.area, monster.x, monster.y) & BlockBits.IsOnFloor)) {
            data.blizzard.dmg = calculateBlizzardDamage(monster);
          }
        }
        //
      }


      { // Frozen
        const {frost: sk} = data;
        if (sk.have && !skipSkill.includes(sdk.skills.FrostNova)) {
          if (me.mp > sk.mana) {
            const monsters = getUnits(1)
              .filter(unit => unit.attackable && unit.distance < sk.range && !unit.isChilled)
              .filter(unit => Attack.checkResist(unit, 'cold'))

            if (monsters.length > 0) {
              Skill.cast(sdk.skills.FrostNova, 0);
              return [generatedSkill, 1]; // Freeze those
            }


            // if the nova cause the death of any monsters around us, its worth it
            if (calculateKillableFallensByFrostNova() > 0) {
              console.log('frost nova will kill fallens');
              Skill.cast(sdk.skills.FrostNova, 0);
              return [generatedSkill, 1]; // Frozen those
            }
          }
        }
      }

      // For now, dont static duriel
      if (![sdk.monsters.Duriel, sdk.monsters.Diablo, sdk.monsters.ListerTheTormenter].includes(monster.classid)) {

        if (monster && Attack.checkResist(monster, "lightning") && data.static.dmg > Math.max(data.iceBlast.dmg, data.iceBolt.dmg, data.blizzard.dmg)) {
          // Actually make the bot walk to up to the monster and static, as this is the best decision
          if (me.mp > data.static.mana && !isBlockedBetween(me, monster)) {
            return [sdk.skills.StaticField, 0];
          }
        }
      }

      if (!monster || Attack.checkResist(monster, 'cold')) {
        // icey skills
        const {iceBlast: ib} = data;
        const {iceBolt: il} = data;
        const {blizzard: bl} = data;


        const shouldSpike = monster && !skipSkill.includes(sdk.skills.GlacialSpike)
          && monster.distance < 10
          && getUnits(1).filter(el => getDistance(el, monster) < 4
            && el.attackable                         // those that we can attack
            && !el.isFrozen  // those that are not frozen yet
            && !el.getStat(sdk.stats.Cannotbefrozen) // those that can be frozen
            && el.classid !== 510
          ).length > 1

        const monsterOnLava = monster && !(getCollision(monster.area, monster.x, monster.y) & BlockBits.IsOnFloor);
        if (monsterOnLava) {
          console.log('Monster is on lava, dont use blizzard');
        }

        switch (true) {
          case !monsterOnLava && bl.have && me.mp > bl.mana && !me.getState(sdk.states.SkillDelay):
            generatedSkill = sdk.skills.Blizzard;
            break;
          case shouldSpike && me.mp > Skill.getManaCost(sdk.skills.GlacialSpike):
            generatedSkill = sdk.skills.GlacialSpike;
            break;
          case ib.have && me.mp > ib.mana * 1.5:
            generatedSkill = sdk.skills.IceBlast;
            break;
          case il.have && me.mp > il.mana:
            generatedSkill = sdk.skills.IceBolt
            break;
          default:
            generatedSkill = 0;
        }
      } else {
        generatedSkill = 0;
      }
      return [generatedSkill, generatedSkill === -1 ? 2 : 0];
    }),
    new Override(ClassAttack, ClassAttack.doAttack, function (original, unit: Monster, preattack: boolean) {

      BlockingUnit.splice(0, BlockingUnit.length);
      BlockingUnit.push(unit.type, unit.classid);

      let [generatedSkill, ret] = this.decideSkill(unit)
      if (ret) return ret;

      let result = this.doCast(unit, generatedSkill, 0);

      if (result === 2) {
        //ToDo; telestomp merc
        // if (failed) return 2;

        return 2;
      }

      return result;
    }),
  ],
  valid: function () {
    return true;
  },
  // Function to see if this is the build we currently have
  active: function () {
    // If we got hardcoded skills in firebolt, this is not the current active build
    if (me.getSkill(sdk.skills.FireBolt, 0) > me.getSkill(sdk.skills.Blizzard, 0)) return false;

    // If we got blizzard, this is the build we currently run
    if (me.getSkill(sdk.skills.Blizzard, 0)) return true;

    // If we got more as half of our skill points left over, its most likely we just respeced
    if (me.getStat(sdk.stats.Newskills) > (me.charlvl / 2)) {
      // we are level 24 to 30 with more as half of our skills available, we are respecing
      if (me.charlvl >= 24 && me.charlvl <= 50) return true;
    }

    return false;
  },
  respec() {
    if (me.charlvl >= 24 && !me.getSkill(sdk.skills.Blizzard, 0) && me.charlvl < 30) return 'normal';
    return false;
  },
  hotkeys: [
    {
      key: 0, // F1
      skill: sdk.skills.Telekinesis,
      hand: 0,
    },
    {
      key: 1, // F2
      skill: sdk.skills.Blizzard,
      hand: 0,
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
};
export default build;