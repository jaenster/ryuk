/**
 * @author Nishimura-Katsuo, Jaenster, Ryan
 */
import AreaData from "./AreaData";
import ExperienceData from "./ExperienceData";
import MonsterData from "./MonsterData";
import sdk from "../../sdk";
import PotData from "./PotData";


export function isAlive(unit) {
  return Boolean(unit && unit.hp);
}

export function isEnemy(unit) {
  return Boolean(unit && isAlive(unit) && unit.getStat(sdk.stats.Alignment) !== 2 && typeof unit.classid === 'number' && MonsterData[unit.classid].Killable);
}

export function onGround(item) {
  return item.mode === 3 || item.mode === 5;
}

export type resistances = 'Physical'
  | 'Fire'
  | 'Lightning'
  | 'Cold'
  | 'Poison'
  | 'Magic'


const GameData = {
  myReference: (me as Unit),
  townAreas: [0, 1, 40, 75, 103, 109],
  HPLookup: [["1", "1", "1"], ["7", "107", "830"], ["9", "113", "852"], ["12", "120", "875"], ["15", "125", "897"], ["17", "132", "920"], ["20", "139", "942"], ["23", "145", "965"], ["27", "152", "987"], ["31", "157", "1010"], ["35", "164", "1032"], ["36", "171", "1055"], ["40", "177", "1077"], ["44", "184", "1100"], ["48", "189", "1122"], ["52", "196", "1145"], ["56", "203", "1167"], ["60", "209", "1190"], ["64", "216", "1212"], ["68", "221", "1235"], ["73", "228", "1257"], ["78", "236", "1280"], ["84", "243", "1302"], ["89", "248", "1325"], ["94", "255", "1347"], ["100", "261", "1370"], ["106", "268", "1392"], ["113", "275", "1415"], ["120", "280", "1437"], ["126", "287", "1460"], ["134", "320", "1482"], ["142", "355", "1505"], ["150", "388", "1527"], ["158", "423", "1550"], ["166", "456", "1572"], ["174", "491", "1595"], ["182", "525", "1617"], ["190", "559", "1640"], ["198", "593", "1662"], ["206", "627", "1685"], ["215", "661", "1707"], ["225", "696", "1730"], ["234", "729", "1752"], ["243", "764", "1775"], ["253", "797", "1797"], ["262", "832", "1820"], ["271", "867", "1842"], ["281", "900", "1865"], ["290", "935", "1887"], ["299", "968", "1910"], ["310", "1003", "1932"], ["321", "1037", "1955"], ["331", "1071", "1977"], ["342", "1105", "2000"], ["352", "1139", "2030"], ["363", "1173", "2075"], ["374", "1208", "2135"], ["384", "1241", "2222"], ["395", "1276", "2308"], ["406", "1309", "2394"], ["418", "1344", "2480"], ["430", "1379", "2567"], ["442", "1412", "2653"], ["454", "1447", "2739"], ["466", "1480", "2825"], ["477", "1515", "2912"], ["489", "1549", "2998"], ["501", "1583", "3084"], ["513", "1617", "3170"], ["525", "1651", "3257"], ["539", "1685", "3343"], ["552", "1720", "3429"], ["565", "1753", "3515"], ["579", "1788", "3602"], ["592", "1821", "3688"], ["605", "1856", "3774"], ["618", "1891", "3860"], ["632", "1924", "3947"], ["645", "1959", "4033"], ["658", "1992", "4119"], ["673", "2027", "4205"], ["688", "2061", "4292"], ["702", "2095", "4378"], ["717", "2129", "4464"], ["732", "2163", "4550"], ["746", "2197", "4637"], ["761", "2232", "4723"], ["775", "2265", "4809"], ["790", "2300", "4895"], ["805", "2333", "4982"], ["821", "2368", "5068"], ["837", "2403", "5154"], ["853", "2436", "5240"], ["868", "2471", "5327"], ["884", "2504", "5413"], ["900", "2539", "5499"], ["916", "2573", "5585"], ["932", "2607", "5672"], ["948", "2641", "5758"], ["964", "2675", "5844"], ["982", "2709", "5930"], ["999", "2744", "6017"], ["1016", "2777", "6103"], ["1033", "2812", "6189"], ["1051", "2845", "6275"], ["1068", "2880", "6362"], ["1085", "2915", "6448"], ["1103", "2948", "6534"], ["1120", "2983", "6620"], ["1137", "3016", "6707"], ["10000", "10000", "10000"]],
  monsterLevel: function (monsterID, areaID) {
    return me.diff ? AreaData.hasOwnProperty(areaID) && AreaData[areaID].Level : MonsterData.hasOwnProperty(monsterID) && MonsterData[monsterID].Level; // levels on nm/hell are determined by area, not by monster data
  },
  monsterExp: function (monsterID, areaID, adjustLevel = 0) {
    return ExperienceData.monsterExp[Math.min(ExperienceData.monsterExp.length - 1, this.monsterLevel(monsterID, areaID) + adjustLevel)][me.diff] * MonsterData[monsterID].ExperienceModifier / 100;
  },
  eliteExp: function (monsterID, areaID) {
    return this.monsterExp(monsterID, areaID, 2) * 3;
  },
  monsterAvgHP: function (monsterID, areaID, adjustLevel = 0) {
    return this.HPLookup[Math.min(this.HPLookup.length - 1, this.monsterLevel(monsterID, areaID) + adjustLevel)][me.diff] * (getBaseStat('monstats', monsterID, 'minHP') as any + getBaseStat('monstats', monsterID, 'maxHP') as any) / 200;
  },
  monsterMaxHP: function (monsterID, areaID, adjustLevel = 0) {
    return this.HPLookup[Math.min(this.HPLookup.length - 1, this.monsterLevel(monsterID, areaID) + adjustLevel)][me.diff] * (getBaseStat('monstats', monsterID, 'maxHP') as any) / 100;
  },
  eliteAvgHP: function (monsterID, areaID) {
    return (6 - me.diff) / 2 * this.monsterAvgHP(monsterID, areaID, 2);
  },
  monsterDamageModifier: function () {
    return 1 + (this.multiplayerModifier() - 1) * 0.0625;
  },
  monsterMaxDmg: function (monsterID, areaID, adjustLevel = 0) {
    let level = this.monsterLevel(monsterID, areaID) + adjustLevel;
    return Math.max.apply(null, [MonsterData[monsterID].Attack1MaxDmg, MonsterData[monsterID].Attack2MaxDmg, MonsterData[monsterID].Skill1MaxDmg]) * level / 100 * this.monsterDamageModifier();
  },
  // https://www.diabloii.net/forums/threads/monster-damage-increase-per-player-count.570346/
  monsterAttack1AvgDmg: function (monsterID, areaID, adjustLevel = 0) {
    let level = this.monsterLevel(monsterID, areaID) + adjustLevel;
    return ((MonsterData[monsterID].Attack1MinDmg + MonsterData[monsterID].Attack1MaxDmg) / 2) * level / 100 * this.monsterDamageModifier();
  },
  monsterAttack2AvgDmg: function (monsterID, areaID, adjustLevel = 0) {
    let level = this.monsterLevel(monsterID, areaID) + adjustLevel;
    return ((MonsterData[monsterID].Attack2MinDmg + MonsterData[monsterID].Attack2MaxDmg) / 2) * level / 100 * this.monsterDamageModifier();
  },
  monsterSkill1AvgDmg: function (monsterID, areaID, adjustLevel = 0) {
    let level = this.monsterLevel(monsterID, areaID) + adjustLevel;
    return ((MonsterData[monsterID].Skill1MinDmg + MonsterData[monsterID].Skill1MaxDmg) / 2) * level / 100 * this.monsterDamageModifier();
  },
  monsterAvgDmg: function (monsterID, areaID, adjustLevel = 0) {
    let attack1 = this.monsterAttack1AvgDmg(monsterID, areaID, adjustLevel);
    let attack2 = this.monsterAttack2AvgDmg(monsterID, areaID, adjustLevel);
    let skill1 = this.monsterSkill1AvgDmg(monsterID, areaID, adjustLevel);
    let dmgs = [attack1, attack2, skill1].filter(x => x > 0);
    // ignore 0 dmg to avoid reducing average
    if (!dmgs.length) return 0;
    return dmgs.reduce((acc, v) => acc + v) / dmgs.length;
  },
  averagePackSize: monsterID => (MonsterData[monsterID].GroupCount.Min + MonsterData[monsterID].MinionCount.Min + MonsterData[monsterID].GroupCount.Max + MonsterData[monsterID].MinionCount.Max) / 2,
  areaLevel: function (areaID) {
    let levels = 0, total = 0;

    if (me.diff) { // levels on nm/hell are determined by area, not by monster data
      return AreaData[areaID].Level;
    }

    AreaData[areaID].forEachMonsterAndMinion((mon, rarity) => {
      levels += mon.Level * rarity;
      total += rarity;
    });

    return Math.round(levels / total);
  },
  areaImmunities: function (areaID) {
    let resists = {Physical: 0, Magic: 0, Fire: 0, Lightning: 0, Cold: 0, Poison: 0};

    AreaData[areaID].forEachMonsterAndMinion(mon => {
      for (let k in resists) {
        resists[k] = Math.max(resists[k], mon[k]);
      }
    });

    return Object.keys(resists).filter(key => resists[key] >= 100);
  },
  levelModifier: function (clvl, mlvl) {
    let bonus;

    if (clvl < 25 || mlvl < clvl) {
      bonus = ExperienceData.expCurve[Math.min(20, Math.max(0, Math.floor(mlvl - clvl + 10)))] / 255;
    } else {
      bonus = clvl / mlvl;
    }

    return bonus * ExperienceData.expPenalty[Math.min(30, Math.max(0, Math.round(clvl - 69)))] / 1024;
  },
  multiplayerModifier: function (count) {
    if (!count) {
      let party = getParty(GameData.myReference);

      if (!party) {
        return 1;
      }

      count = 1;

      while (party.getNext()) {
        count++;
      }
    }

    return (count + 1) / 2;
  },
  partyModifier: function (playerID) {
    let party = getParty(GameData.myReference), partyid = -1, level = 0, total = 0;

    if (!party) {
      return 1;
    }

    partyid = party.partyid;

    do {
      if (party.partyid === partyid) {
        total += party.level;

        if (playerID === party.name || playerID === party.gid) {
          level = party.level;
        }
      }
    } while (party.getNext());

    return level / total;
  },
  killExp: function (playerID, monsterID, areaID) {
    let exp = this.monsterExp(monsterID, areaID), party = getParty(GameData.myReference), partyid = -1,
      level = 0, total = 0,
      gamesize = 0;

    if (!party) {
      return 0;
    }

    partyid = party.partyid;

    do {
      gamesize++;

      if (party.partyid === partyid) {
        total += party.level;

        if (playerID === party.name || playerID === party.gid) {
          level = party.level;
        }
      }
    } while (party.getNext());

    return Math.floor(exp * this.levelModifier(level, this.monsterLevel(monsterID, areaID)) * this.multiplayerModifier(gamesize) * level / total);
  },
  baseLevel: function (...skillIDs) {
    return skillIDs.reduce((total, skillID) => total + GameData.myReference.getSkill(skillID, 0), 0);
  },
  skillLevel: function (...skillIDs) {
    return skillIDs.reduce((total, skillID) => total + GameData.myReference.getSkill(skillID, 1), 0);
  },
  skillCooldown: function (skillID) {
    return getBaseStat('Skills', skillID, 'delay') as any !== -1;
  },
  stagedDamage: function (l, a, b, c, d, e, f, hitshift = 0, mult = 1) {
    if (l > 28) {
      a += f * (l - 28);
      l = 28;
    }

    if (l > 22) {
      a += e * (l - 22);
      l = 22;
    }

    if (l > 16) {
      a += d * (l - 16);
      l = 16;
    }

    if (l > 8) {
      a += c * (l - 8);
      l = 8;
    }

    a += b * (Math.max(0, l) - 1);

    return (mult * a) << hitshift;
  },
  damageTypes: ["Physical", "Fire", "Lightning", "Magic", "Cold", "Poison", "?", "?", "?", "Physical"], // 9 is Stun, but stun isn't an element
  synergyCalc: { // TODO: add melee skill damage and synergies - they are poop

    // sorc fire spells
    36: [47, 0.16, 56, 0.16],			// fire bolt
    41: [37, 0.13],	// inferno
    46: [37, 0.04, 51, 0.01],	// blaze
    47: [36, 0.14, 56, 0.14],			// fire ball
    51: [37, 0.04, 41, 0.01],	// fire wall
    52: [37, 0.09],						// enchant
    56: [36, 0.05, 47, 0.05],			// meteor
    62: [36, 0.03, 47, 0.03],			// hydra

    // sorc lightning spells
    38: [49, 0.06],						// charged bolt
    49: [38, 0.08, 48, 0.08, 53, 0.08], // lightning
    53: [38, 0.04, 48, 0.04, 49, 0.04], // chain lightning

    // sorc cold spells
    39: [44, 0.15, 45, 0.15, 55, 0.15, 59, 0.15, 64, 0.15],	// ice bolt
    44: [59, 0.10, 64, 0.10],			// frost nova
    45: [39, 0.08, 59, 0.08, 64, 0.08],	// ice blast
    55: [39, 0.05, 45, 0.05, 64, 0.05],	// glacial spike
    59: [39, 0.05, 45, 0.05, 55, 0.05],	// blizzard
    64: [39, 0.02],						// frozen orb

    // assassin traps
    251: [256, 0.09, 261, 0.09, 262, 0.09, 271, 0.09, 272, 0.09, 276, 0.09],	// fireblast
    256: [261, 0.11, 271, 0.11, 276, 0.11],	// shock web
    261: [251, 0.06, 271, 0.06, 276, 0.06],	// charged bolt sentry
    262: [251, 0.08, 272, 0.08],	// wake of fire sentry
    271: [256, 0.12, 261, 0.12, 276, 0.12],	// lightning sentry
    272: [251, 0.10, 276, 0.10, 262, 0.07],	// inferno sentry
    276: [271, 0.12],	// death sentry

    // necro bone spells
    67: [78, 0.15, 84, 0.15, 88, 0.15, 93, 0.15],	// teeth
    73: [83, 0.20, 92, 0.20],	// poison dagger
    83: [73, 0.15, 92, 0.15], // poison explosion
    84: [67, 0.07, 78, 0.07, 88, 0.07, 93, 0.07], // bone spear
    92: [73, 0.10, 83, 0.10], // poison nova
    93: [67, 0.06, 78, 0.06, 84, 0.06, 88, 0.06], // bone spirit

    // barb war cry
    154: [130, 0.06, 137, 0.06, 146, 0.06], // war cry

    // paladin combat spells
    101: [112, 0.50, 121, 0.50], // holy bolt
    112: [108, 0.14, 115, 0.14], // blessed hammer
    121: [118, 0.07], // fist of heavens

    // paladin auras
    102: [100, 0.18, 125, 0.06],	// holy fire
    114: [105, 0.15, 125, 0.07],	// holy freeze
    118: [110, 0.12, 125, 0.04],	// holy shock

    // durid elemental skills
    225: [229, 0.23, 234, 0.23],	// firestorm
    229: [244, 0.10, 225, 0.08],	// molten boulder
    234: [225, 0.12, 244, 0.12],	// fissure (eruption)
    244: [229, 0.12, 234, 0.12, 249, 0.12],	// volcano
    249: [225, 0.14, 229, 0.14, 244, 0.14],	// armageddon
    230: [250, 0.15, 235, 0.15],	// arctic blast
    240: [245, 0.10, 250, 0.10],	// twister
    245: [235, 0.09, 240, 0.09, 250, 0.09],	// tornado
    250: [240, 0.09, 245, 0.09],	// hurricane

    // durid feral skills
    238: [222, 0.18],	// rabies
    239: [225, 0.22, 229, 0.22, 234, 0.22, 244, 0.22],	// fire claws

    // amazon bow/xbow skills
    11: [21, 0.12], // cold arrow
    21: [11, 0.08],	// ice arrow
    31: [11, 0.12],	// freezing arrow
    7: [16, 0.12],	// fire arrow
    16: [7, 0.12],	// exploding arrow
    27: [16, 0.10],	// immolation arrow

    // amazon spear/javalin skills
    14: [20, 0.10, 24, 0.10, 34, 0.10, 35, 0.10],	// power strike
    20: [14, 0.03, 24, 0.03, 34, 0.03, 35, 0.03], // lightning bolt
    24: [14, 0.10, 20, 0.10, 34, 0.10, 35, 0.10],	// charged strike
    34: [14, 0.08, 20, 0.08, 24, 0.10, 35, 0.10],	// lightning strike
    35: [14, 0.01, 20, 0.01, 24, 0.01, 34, 0.01],	// lightning fury
    15: [25, 0.12],	// poison javalin
    25: [15, 0.10],	// plague javalin
  },
  noMinSynergy: [14, 20, 24, 34, 35, 49, 53, 118, 256, 261, 271, 276],
  skillMult: {
    15: 25,
    25: 25,
    41: 25,
    46: 75,
    51: 75,
    73: 25,
    83: 25,
    92: 25,
    222: 25,
    225: 75,
    230: 25,
    238: 25,
    272: 25 / 3
  },
  baseSkillDamage: function (skillID) { // TODO: rework skill damage to use both damage fields
    let l = this.skillLevel(skillID), m = this.skillMult[skillID] || 1;
    let dmgFields = [['MinDam', 'MinLevDam1', 'MinLevDam2', 'MinLevDam3', 'MinLevDam4', 'MinLevDam5', 'MaxDam', 'MaxLevDam1', 'MaxLevDam2', 'MaxLevDam3', 'MaxLevDam4', 'MaxLevDam5'], ['EMin', 'EMinLev1', 'EMinLev2', 'EMinLev3', 'EMinLev4', 'EMinLev5', 'EMax', 'EMaxLev1', 'EMaxLev2', 'EMaxLev3', 'EMaxLev4', 'EMaxLev5']];

    if (skillID === 70) {
      return {
        type: "Physical",
        pmin: this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[1][0]) as any, getBaseStat('skills', skillID, dmgFields[1][1]) as any, getBaseStat('skills', skillID, dmgFields[1][2]) as any, getBaseStat('skills', skillID, dmgFields[1][3]) as any, getBaseStat('skills', skillID, dmgFields[1][4]) as any, getBaseStat('skills', skillID, dmgFields[1][5]) as any, getBaseStat('skills', skillID, 'HitShift') as any, m),
        pmax: this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[1][0]) as any, getBaseStat('skills', skillID, dmgFields[1][1]) as any, getBaseStat('skills', skillID, dmgFields[1][2]) as any, getBaseStat('skills', skillID, dmgFields[1][3]) as any, getBaseStat('skills', skillID, dmgFields[1][4]) as any, getBaseStat('skills', skillID, dmgFields[1][5]) as any, getBaseStat('skills', skillID, 'HitShift') as any, m),
        min: 0, max: 0
      };
    } else {
      let type = getBaseStat('skills', skillID, 'EType') as any;

      return {
        type: this.damageTypes[type],
        pmin: this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[0][0]) as any, getBaseStat('skills', skillID, dmgFields[0][1]) as any, getBaseStat('skills', skillID, dmgFields[0][2]) as any, getBaseStat('skills', skillID, dmgFields[0][3]) as any, getBaseStat('skills', skillID, dmgFields[0][4]) as any, getBaseStat('skills', skillID, dmgFields[0][5]) as any, getBaseStat('skills', skillID, 'HitShift') as any, m),
        pmax: this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[0][6]) as any, getBaseStat('skills', skillID, dmgFields[0][7]) as any, getBaseStat('skills', skillID, dmgFields[0][8]) as any, getBaseStat('skills', skillID, dmgFields[0][9]) as any, getBaseStat('skills', skillID, dmgFields[0][10]) as any, getBaseStat('skills', skillID, dmgFields[0][11]) as any, getBaseStat('skills', skillID, 'HitShift') as any, m),
        min: type ? this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[1][0]) as any, getBaseStat('skills', skillID, dmgFields[1][1]) as any, getBaseStat('skills', skillID, dmgFields[1][2]) as any, getBaseStat('skills', skillID, dmgFields[1][3]) as any, getBaseStat('skills', skillID, dmgFields[1][4]) as any, getBaseStat('skills', skillID, dmgFields[1][5]) as any, getBaseStat('skills', skillID, 'HitShift') as any, m) : 0,
        max: type ? this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[1][6]) as any, getBaseStat('skills', skillID, dmgFields[1][7]) as any, getBaseStat('skills', skillID, dmgFields[1][8]) as any, getBaseStat('skills', skillID, dmgFields[1][9]) as any, getBaseStat('skills', skillID, dmgFields[1][10]) as any, getBaseStat('skills', skillID, dmgFields[1][11]) as any, getBaseStat('skills', skillID, 'HitShift') as any, m) : 0
      };
    }
  },
  skillRadius: {
    //47: 8,
    //48: 5, // Nova
    55: 3,
    56: 12,
    92: 24,
    154: 12,
    249: 24,
    250: 24,
    251: 3,
  },
  novaLike: {
    44: true,
    48: true,
    92: true,
    112: true,
    154: true,
    249: true,
    250: true,
  },
  wolfBanned: {
    225: true,
    229: true,
    230: true,
    233: true,
    234: true,
    235: true,
    240: true,
    243: true,
    244: true,
    245: true,
    250: true,
  },
  bearBanned: {
    225: true,
    229: true,
    230: true,
    232: true,
    234: true,
    235: true,
    238: true,
    240: true,
    244: true,
    245: true,
    248: true,
  },
  humanBanned: {
    232: true,
    233: true,
    238: true,
    239: true,
    242: true,
    243: true,
    248: true,
  },
  nonDamage: {
    // Some fakes to avoid these

    54: true, // teleport
    217: true, // scroll identify
    218: true, // portal scroll
    219: true, // I assume this is the book of scroll
    220: true, // book portal. Not really a skill you want to use, do you
    117: true, // Holy shield. Holy shield it self doesnt give damage
    278: true, // venom adds damage, but doesnt do damage on its own

    // Remove all the trap skills, as we prefer to calculate this upon demand
    261: true, // lighting bolt
    271: true, // lighting sentry
    276: true, // Death sentry only works on corpses, we calculate this within attack
    262: true, // wake of fire
    272: true, // inferno
  },
  shiftState: function () {
    if (GameData.myReference.getState(139)) {
      return "wolf";
    }

    if (GameData.myReference.getState(140)) {
      return "bear";
    }

    return "human";
  },
  bestForm: function (skillID) {
    if (this.shiftState() === "human" && this.humanBanned[skillID]) {
      let highest = {ID: 0, Level: 0};

      if (!this.wolfBanned[skillID] && this.skillLevel(223) > highest.Level) {
        highest.ID = 223;
        highest.Level = this.skillLevel(223);
      }

      if (!this.bearBanned[skillID] && this.skillLevel(228) > highest.Level) {
        highest.ID = 228;
        highest.Level = this.skillLevel(228);
      }

      return highest.ID;
    } else if (this.shiftState() === "wolf" && this.wolfBanned[skillID]) {
      return 223;
    } else if (this.shiftState() === "bear" && this.bearBanned[skillID]) {
      return 228;
    }

    return 0;
  },
  dmgModifier: function (skillID, target) {
    let aps = (typeof target === 'number' ? this.averagePackSize(target) : 1),
      eliteBonus = (target.spectype && target.spectype & 0x7) ? 1 : 0, hitcap = 1;

    switch (skillID) { // charged bolt/strike excluded, it's so unreliably random
      case 15: // poison javalin
      case 25: // plague javalin
      case 16: // exploding arrow
      case 27: // immolation arrow
      case 31: // freezing arrow
      case 35: // lightning fury
      case 44: // frost nova
      case 48: // nova
      case 56: // meteor
      case 59: // blizzard
      case 64: // frozen orb
      case 83: // poison explosion
      case 92: // poison nova
      case 112: // blessed hammer
      case 154: // war cry
      case 229: // molten boulder
      case 234: // fissure
      case 249: // armageddon
      case 244: // volcano
      case 250: // hurricane
      case 251: // fireblast
      case 261: // charged bolt sentry
      case 262: // wake of fire
      case 55: // glacial spike
      case 47: // fire ball
      case 42: // Static field.
        hitcap = Infinity;
        break;
      case 34: // lightning strike
        hitcap = 1 + this.skillLevel(34);
        break;
      case 38: // charged bolt
        hitcap = 2 + this.skillLevel(38);
        break;
      case 67: // teeth
        hitcap = 1 + this.skillLevel(67);
        break;
      case 53: // chain lightning
        hitcap = 5 + ((this.skillLevel(53) / 5) | 0);
        break;
      case 24:
        hitcap = 3 + ((this.skillLevel(24) / 5) | 0);
        break;
      case 49: // lightning
      case 84: // bone spear
      case 271: // lightning sentry
      case 276: // death sentry
        hitcap = aps ? Math.sqrt(aps / Math.PI) * 2 : 1;
        break;
      default:
        hitcap = 1;
        break;
    }

    if (typeof target !== 'number') {
      let unit = getUnit(1);
      let radius = this.skillRadius[skillID] || 18;

      if (unit) {
        do {
          if (aps >= hitcap) {
            break;
          }

          if (target.gid !== unit.gid && getDistance(unit, this.novaLike[skillID] ? GameData.myReference : target) <= radius && isEnemy(unit)) {
            aps++;

            if (unit.spectype & 0x7) {
              eliteBonus++;
            }
          }
        } while (unit.getNext());
      }
    } else {
      aps = Math.min(aps, hitcap);
    }

    aps += eliteBonus * (4 - me.diff) / 2;

    return aps;
  },
  skillDamage: function (skillID, unit: Monster) {
    if (skillID === 0) {
      return {type: "Physical", pmin: 2, pmax: 8, min: 0, max: 0}; // short sword, no reqs
    }

    if (this.skillLevel(skillID) < 1) {
      return {
        type: this.damageTypes[getBaseStat('skills', skillID, 'EType') as any],
        pmin: 0,
        pmax: 0,
        min: 0,
        max: 0
      };
    }

    let dmg = this.baseSkillDamage(skillID), mastery = 1, psynergy = 1, synergy = 1, shots = 1, sl = 0;

    if (this.synergyCalc[skillID]) {
      let sc = this.synergyCalc[skillID];

      for (let c = 0; c < sc.length; c += 2) {
        sl = this.baseLevel(sc[c]);

        if (skillID === 229 || skillID === 244) {
          if (sc[c] === 229 || sc[c] === 244) { // molten boulder and volcano
            psynergy += sl * sc[c + 1]; // they only synergize physical with each other
          } else {
            synergy += sl * sc[c + 1]; // all other skills synergize only fire with these skills
          }
        } else {
          psynergy += sl * sc[c + 1];
          synergy += sl * sc[c + 1];
        }
      }
    }

    if (skillID === 227 || skillID === 237 || skillID === 247) {
      sl = this.skillLevel(247);
      psynergy += 0.15 + sl * 0.10;
      synergy += 0.15 + sl * 0.10;
    }

    switch (dmg.type) {
      case "Fire": // fire mastery
        mastery = 1 + GameData.myReference.getStat(329) / 100;
        dmg.min *= mastery;
        dmg.max *= mastery;
        break;
      case "Lightning": // lightning mastery
        mastery = 1 + GameData.myReference.getStat(330) / 100;
        dmg.min *= mastery;
        dmg.max *= mastery;
        break;
      case "Cold": // cold mastery
        mastery = 1 + GameData.myReference.getStat(331) / 100;
        dmg.min *= mastery;
        dmg.max *= mastery;
        break;
      case "Poison": // poison mastery
        mastery = 1 + GameData.myReference.getStat(332) / 100;
        dmg.min *= mastery;
        dmg.max *= mastery;
        break;
      case "Magic": // magic mastery
        mastery = 1 + GameData.myReference.getStat(357) / 100;
        dmg.min *= mastery;
        dmg.max *= mastery;
        break;
    }

    dmg.pmin *= psynergy;
    dmg.pmax *= psynergy;

    if (this.noMinSynergy.indexOf(skillID) < 0) {
      dmg.min *= synergy;
    }

    dmg.max *= synergy;

    switch (skillID) {
      case 102: // holy fire
        dmg.min *= 6; // weapon damage is 6x the aura damage
        dmg.max *= 6;
        break;
      case 114: // holy freeze
        dmg.min *= 5; // weapon damage is 5x the aura damage
        dmg.max *= 5;
        break;
      case 118: // holy shock
        dmg.min *= 6; // weapon damage is 6x the aura damage
        dmg.max *= 6;
        break;
      case 249: // armageddon
        dmg.pmin = dmg.pmax = 0;
        break;
      case 24: // charged strike
        dmg.max *= 3 + ((this.skillLevel(24) / 5) | 0);
    }

    dmg.pmin >>= 8;
    dmg.pmax >>= 8;
    dmg.min >>= 8;
    dmg.max >>= 8;

    switch (skillID) {
      case 59: // blizzard - on average hits twice
        dmg.min *= 2;
        dmg.max *= 2;
        break;
      case 62: // hydra - 3 heads
        dmg.min *= 3;
        dmg.max *= 3;
        break;
      case 64: // frozen orb - on average hits ~5 times
        dmg.min *= 5;
        dmg.max *= 5;
        break;
      case 70: // skeleton - a hit per skeleton
        sl = this.skillLevel(70);
        shots = sl < 4 ? sl : (2 + sl / 3) | 0;
        sl = Math.max(0, sl - 3);
        dmg.pmin = shots * (dmg.pmin + 1 + this.skillLevel(69) * 2) * (1 + sl * 0.07);
        dmg.pmax = shots * (dmg.pmax + 2 + this.skillLevel(69) * 2) * (1 + sl * 0.07);
        break;
      case 94: // fire golem
        sl = this.skillLevel(94);
        dmg.min = [10, 15, 18][me.diff] + dmg.min + (this.stagedDamage(sl + 7, 2, 1, 2, 3, 5, 7) >> 1) * 6; // basically holy fire added
        dmg.max = [27, 39, 47][me.diff] + dmg.max + (this.stagedDamage(sl + 7, 6, 1, 2, 3, 5, 7) >> 1) * 6;
        break;
      case 101: // holy bolt
        dmg.undeadOnly = true;
        break;
      case 112: // blessed hammer
        sl = this.skillLevel(113);

        if (sl > 0) {
          mastery = (100 + ((45 + this.skillLevel(113) * 15) >> 1)) / 100;	// hammer gets half concentration dmg bonus
          dmg.min *= mastery;
          dmg.max *= mastery;
        }

        break;
      case 221: // raven - a hit per raven
        shots = Math.min(5, this.skillLevel(221)); // 1-5 ravens
        dmg.pmin *= shots;
        dmg.pmax *= shots;
        break;
      case 227: // spirit wolf - a hit per wolf
        shots = Math.min(5, this.skillLevel(227));
        dmg.pmin *= shots;
        dmg.pmax *= shots;
        break;
      case 237: // dire wolf - a hit per wolf
        shots = Math.min(3, this.skillLevel(237));
        dmg.pmin *= shots;
        dmg.pmax *= shots;
        break;
      case 240: // twister
        dmg.pmin *= 3;
        dmg.pmax *= 3;
        break;
      case 261: // charged bolt sentry
      case 262: // wake of fire
      case 271: // lightning sentry
      case 272: // inferno sentry
      case 276: // death sentry
        dmg.min *= 5;	// can have 5 traps out at a time
        dmg.max *= 5;
        break;

      case sdk.skills.StaticField:
        if (!(unit instanceof Unit)) {
          break;
        }
        let staticCap = [0, 33, 50][me.diff];
        const [monsterId, areaId] = [unit.classid, unit.area],
          percentLeft = (unit.hp * 100 / unit.hpmax);
        if (staticCap > percentLeft) {
          break;
        }

        const maxReal = this.monsterMaxHP(monsterId, areaId, unit.charlvl - this.monsterLevel(monsterId, areaId)),
          hpReal = maxReal / 100 * percentLeft,
          potencialDmg = (hpReal / 100 * percentLeft) * .25;

        let tmpDmg = (maxReal / 100 * percentLeft) * (0.25);

        // We do need to calculate the extra damage, or less damage due to resistance
        let resist = this.monsterResist(unit, 'Lightning');
        let pierce = GameData.myReference.getStat(this.pierceMap['Lightning']);

        let conviction = this.getConviction();
        // if (conviction && !unit.getState(sdk.states.Conviction)) conviction = 0; //ToDo; enable when fixed telestomp
        resist -= (resist >= 100 ? conviction / 5 : conviction);

        if (resist < 100) {
          resist = Math.max(-100, resist - pierce);
        } else {
          resist = 100;
        }
        tmpDmg = potencialDmg * ((100 - resist) / 100);
        const percentageDamage = 100 / maxReal * tmpDmg;

        let avgDmg = tmpDmg;
        let overCap = percentLeft - staticCap - percentageDamage;
        if (overCap < 0) {
          let maxDmgPercentage = percentageDamage - Math.abs(overCap);
          avgDmg = maxReal / 100 * maxDmgPercentage;
        }
        avgDmg = avgDmg > 0 && avgDmg || 0;
        //print('Static will chop off -> ' + (100 / maxReal * avgDmg) + '%');
        dmg.min = avgDmg;
        dmg.max = avgDmg;
        break;
    }

    dmg.pmin |= 0;
    dmg.pmax |= 0;
    dmg.min |= 0;
    dmg.max |= 0;

    return dmg;
  },
  allSkillDamage: function (unit) {
    let skills = {};
    let self = this;
    GameData.myReference.getSkill(4).forEach(function (skill) {
      if (self.nonDamage.hasOwnProperty(skill[0])) {
        return false; // Doesnt do damage
      }
      return skills[skill[0]] = self.skillDamage(skill[0], unit);
    });

    return skills;
  },
  convictionEligible: {
    Fire: true,
    Lightning: true,
    Cold: true,
  },
  lowerResistEligible: {
    Fire: true,
    Lightning: true,
    Cold: true,
    Poison: true,
  },
  resistMap: {
    Physical: 36,
    Fire: 39,
    Lightning: 41,
    Cold: 43,
    Poison: 45,
    Magic: 37,
  },
  masteryMap: {
    Fire: 329,
    Lightning: 330,
    Cold: 331,
    Poison: 332,
    Magic: 357,
  },
  pierceMap: {
    Fire: 333,
    Lightning: 334,
    Cold: 335,
    Poison: 336,
    Magic: 358,
  },
  ignoreSkill: {
    40: true,
    50: true,
    60: true,
  },
  buffs: {
    8: 1,
    9: 1,
    13: 1,
    17: 1,
    18: 1,
    23: 1,
    28: 1,
    29: 1,
    32: 1,
    37: 1,
    40: 2,
    46: 1,
    50: 2,
    52: 1,
    57: 1,
    58: 1,
    60: 2,
    61: 1,
    63: 1,
    65: 1,
    68: 1,
    69: 1,
    79: 1,
    89: 1,
    98: 3,
    99: 3,
    100: 3,
    102: 3,
    103: 3,
    104: 3,
    105: 3,
    108: 3,
    109: 3,
    110: 3,
    113: 3,
    114: 3,
    115: 3,
    118: 3,
    119: 3,
    120: 3,
    122: 3,
    123: 3,
    124: 3,
    125: 3,
    127: 1,
    128: 1,
    129: 1,
    134: 1,
    135: 1,
    136: 1,
    138: 1,
    141: 1,
    145: 1,
    148: 1,
    149: 1,
    153: 1,
    155: 1,
    221: 1,
    222: 4,
    223: 5,
    224: 1,
    226: 6,
    227: 7,
    228: 5,
    231: 4,
    235: 1,
    236: 6,
    237: 7,
    241: 4,
    246: 6,
    247: 7,
    249: 1,
    250: 1,
    258: 8,
    267: 8,
    268: 9,
    279: 9,
  },
  preAttackable: [
    sdk.skills.MagicArrow, sdk.skills.FireArrow, sdk.skills.MultipleShot, sdk.skills.ExplodingArrow, sdk.skills.IceArrow, sdk.skills.GuidedArrow, sdk.skills.ImmolationArrow, sdk.skills.Strafe,
    sdk.skills.PlagueJavelin, sdk.skills.LightningFury,

    sdk.skills.FireBolt, sdk.skills.Inferno, sdk.skills.Blaze, sdk.skills.FireBall, sdk.skills.FireWall, sdk.skills.Meteor, sdk.skills.Hydra,

    sdk.skills.ChargedBolt, sdk.skills.Nova, sdk.skills.Lightning, sdk.skills.ChainLightning,

    sdk.skills.IceBolt, sdk.skills.FrostNova, sdk.skills.IceBlast, sdk.skills.Blizzard, sdk.skills.FrozenOrb,

    sdk.skills.AmplifyDamage, sdk.skills.DimVision, sdk.skills.Weaken, sdk.skills.IronMaiden, sdk.skills.Terror, sdk.skills.Confuse, sdk.skills.LifeTap, sdk.skills.Attract, sdk.skills.Decrepify, sdk.skills.LowerResist,

    sdk.skills.Teeth, sdk.skills.BoneSpear, sdk.skills.PoisonNova,

    sdk.skills.BlessedHammer,

    sdk.skills.WarCry,

    sdk.skills.Twister, sdk.skills.Tornado,

    sdk.skills.FireBlast, sdk.skills.ShockWeb,

  ],
  monsterResist(unit: Monster | number, type: resistances): number {
    let stat = this.resistMap[type];

    //@todo; fix
    //@ts-ignore
    return stat ? ((unit as Unit)?.getStat(stat) || MonsterData[(unit as number)][type]) : 0;
  },
  getConviction: function () {
    let merc = GameData.myReference.getMerc(), sl = this.skillLevel(123); // conviction
    if (( // Either me, or merc is wearing a conviction
      merc && merc.getItemsEx().filter(item => item.getPrefix(sdk.locale.items.Infinity)).first()
      || GameData.myReference.getItemsEx().filter(item => item.getPrefix(sdk.locale.items.Infinity)).first())) {
      sl = 12;
    }
    return sl > 0 ? Math.min(150, 30 + (sl - 1) * 5) : 0;
  },
  getAmp: function () {
    return this.skillLevel(66) ? 100 : (this.skillLevel(87) ? 50 : 0);
  },
  monsterEffort: function (unit, areaID, skillDamageInfo = undefined, parent = undefined, preattack = false, all = false) {
    let eret = {effort: Infinity, skill: -1, type: "Physical", name: ''};
    let useCooldown = (typeof unit === 'number' ? false : Boolean(me.getState(121))),
      hp = this.monsterMaxHP(typeof unit === 'number' ? unit : unit.classid, areaID);
    let conviction = this.getConviction(), ampDmg = this.getAmp(),
      isUndead = (typeof unit === 'number' ? MonsterData[unit].Undead : MonsterData[unit.classid].Undead);
    skillDamageInfo = skillDamageInfo || this.allSkillDamage(unit);
    const allData = [];
    // if (conviction && unit instanceof Unit && !unit.getState(sdk.states.Conviction)) conviction = 0; //ToDo; enable when fixed telestomp

    let buffDmg = [], buffDamageInfo = {}, newSkillDamageInfo = {};

    for (let sk in skillDamageInfo) {
      if (this.buffs[sk]) {
        if (typeof unit === 'number') {
          buffDmg[this.buffs[sk]] = 0;
          buffDamageInfo[sk] = skillDamageInfo[sk];
        }
      } else {
        newSkillDamageInfo[sk] = skillDamageInfo[sk];
      }
    }

    skillDamageInfo = newSkillDamageInfo;

    for (let _sk in buffDamageInfo) {
      let sk: number = _sk as any;
      // static field has a fix'd ceiling, calculated already
      if ([sdk.skills.StaticField].indexOf(sk) !== -1) continue;

      let avgPDmg = (buffDamageInfo[sk].pmin + buffDamageInfo[sk].pmax) / 2;
      let avgDmg = (buffDamageInfo[sk].min + buffDamageInfo[sk].max) / 2;
      let tmpDmg = 0;

      if (avgPDmg > 0) {
        let presist = this.monsterResist(unit, "Physical");

        presist -= (presist >= 100 ? ampDmg / 5 : ampDmg);
        presist = Math.max(-100, Math.min(100, presist));
        tmpDmg += avgPDmg * (100 - presist) / 100;
      }

      if (avgDmg > 0 && (!isUndead || !buffDamageInfo[sk].undeadOnly) && sk !== sdk.skills.StaticField) {
        let resist = this.monsterResist(unit, buffDamageInfo[sk].type);
        let pierce = GameData.myReference.getStat(this.pierceMap[buffDamageInfo[sk].type]);

        if (this.convictionEligible[buffDamageInfo[sk].type]) {
          resist -= (resist >= 100 ? conviction / 5 : conviction);
        }

        if (resist < 100) {
          resist = Math.max(-100, resist - pierce);
        } else {
          resist = 100;
        }

        tmpDmg += avgDmg * (100 - resist) / 100;
      }

      if (this.buffs[sk] === 1) {
        buffDmg[this.buffs[sk]] += tmpDmg;
      } else {
        buffDmg[this.buffs[sk]] = Math.max(buffDmg[this.buffs[sk]], tmpDmg);
      }
    }

    let tmpBuffDmg = buffDmg.reduce((t, v) => t + v, 0)


    for (let sk in skillDamageInfo) {
      const intsk = parseInt(sk);
      if (preattack && this.preAttackable.indexOf(intsk) === -1) continue; // cant preattack this skill
      if (!this.ignoreSkill[intsk] && (!useCooldown || !this.skillCooldown(intsk | 0))) {
        let avgPDmg = (skillDamageInfo[intsk].pmin + skillDamageInfo[intsk].pmax) / 2,
          totalDmg = tmpBuffDmg,
          avgDmg = (skillDamageInfo[intsk].min + skillDamageInfo[intsk].max) / 2;

        if (avgPDmg > 0 && intsk !== sdk.skills.StaticField) {
          let presist: number = this.monsterResist(unit, "Physical");

          presist -= (presist >= 100 ? ampDmg / 5 : ampDmg);
          presist = Math.max(-100, Math.min(100, presist));
          totalDmg += avgPDmg * (100 - presist) / 100;
        }

        if (avgDmg > 0 && (!isUndead || !skillDamageInfo[intsk].undeadOnly)) {
          let resist = this.monsterResist(unit, skillDamageInfo[intsk].type);
          let pierce = GameData.myReference.getStat(this.pierceMap[skillDamageInfo[intsk].type]);

          if (this.convictionEligible[skillDamageInfo[intsk].type]) {
            resist -= (resist >= 100 ? conviction / 5 : conviction);
          }

          if (resist < 100) {
            resist = Math.max(-100, resist - pierce);
          } else {
            resist = 100;
          }

          totalDmg += intsk !== sdk.skills.StaticField
            && 0
            || avgDmg * (100 - resist) / 100;


        }

        let tmpEffort = Math.ceil(hp / totalDmg);

        tmpEffort /= this.dmgModifier(intsk | 0, parent || unit);

        // care for mana
        if (GameData.myReference.mp < Skill.getManaCost(intsk)) {
          tmpEffort *= 5; // More effort in a skill we dont have mana for
        }

        // Use less cool down spells, if something better is around
        if (this.skillCooldown(intsk | 0)) {
          tmpEffort *= 5;
        }
        if (tmpEffort <= eret.effort) {
          eret.effort = tmpEffort;
          eret.skill = intsk | 0;
          eret.type = skillDamageInfo[eret.skill].type;
          eret.name = getSkillById(eret.skill);
          if (all) {
            allData.unshift(Misc.copy(eret));
          }
        }
      }
    }
    if (all && allData.length) {
      return allData;
    }
    if (eret.skill >= 0) {
      return eret;
    }
    return null;
  },
  areaEffort: function (areaID, skills) {
    let effortpool = 0, raritypool = 0, dmgAcc = 0;

    skills = skills || this.allSkillDamage();

    AreaData[areaID].forEachMonsterAndMinion((mon, rarity, parent) => {
      effortpool += rarity * this.monsterEffort(mon.Index, areaID, skills, parent && parent.Index).effort;
      raritypool += rarity;

      dmgAcc += rarity * this.monsterAvgDmg(mon.Index, areaID);
    });

    // console.debug('avg dmg '+ AreaData[areaID].LocaleString+' -- ' + dmgAcc+' -- ' + avgDmg);

    return (raritypool ? effortpool / raritypool : Infinity);
  },
  areaSoloExp: function (areaID, skills) {
    let procentageBroke = ((100 - Math.min(100, Math.max(0, (100 / (Config.LowGold || 1) * me.gold)))));

    let brokeness = 1 + (procentageBroke / 100 / 3 * 1);

    let effortpool = 0, raritypool = 0, dmgAcc = 0;

    skills = skills || this.allSkillDamage();
    AreaData[areaID].forEachMonsterAndMinion((mon, rarity, parent) => {
      effortpool += rarity * this.monsterExp(mon.Index, areaID) * this.levelModifier(GameData.myReference.charlvl, this.monsterLevel(mon.Index, areaID)) / this.monsterEffort(mon.Index, areaID, skills, parent && parent.Index).effort;
      raritypool += rarity;

      dmgAcc += (rarity * this.monsterAvgDmg(mon.Index, areaID));
    });


    let log = 1, avgDmg = 0;
    if (brokeness !== 1) {
      log = ((5 - Math.log(areaID)) * (brokeness * 0.6));
      avgDmg = (raritypool ? dmgAcc / raritypool : Infinity) * log;
    }


    return (raritypool ? effortpool / raritypool : 0) - (avgDmg);
  },
  mostUsedSkills: function (force = false) {
    if (!force && GameData.myReference.hasOwnProperty('__cachedMostUsedSkills') && GameData.myReference.__cachedMostUsedSkills) return GameData.myReference.__cachedMostUsedSkills;

    const effort = [], uniqueSkills = [];
    for (let i = 50; i < 120; i++) {
      try {
        effort.push(GameData.monsterEffort(i, sdk.areas.ThroneOfDestruction))
      } catch (e) {/*dontcare*/
      }
    }

    effort
      .filter(e => e !== null && typeof e === 'object' && e.hasOwnProperty('skill'))
      .filter(x => GameData.myReference.getSkill(x.skill, 0)) // Only skills where we have hard points in
      .filter(x => Skill.getClass(x.skill) < 7) // Needs to be a skill of a class, not my class but a class
      .map(x =>
        // Search for this unique skill
        (
          uniqueSkills.find(u => u.skillId === x.skill)
          // Or add it and return the value
          || (
            (
              uniqueSkills.push({skillId: x.skill, used: 0})
              && false
            )
            || uniqueSkills[uniqueSkills.length - 1]
          )
        ).used++ && false
        // In the end always return x
        || x
      );


    return (GameData.myReference.__cachedMostUsedSkills = uniqueSkills.sort((a, b) => b.used - a.used));
  },

  // returns the amount of life or mana (as absolute value, not percent) a potion gives
  potionEffect: function (potionClassId, charClass = GameData.myReference.classid) {
    let potion = PotData[potionClassId];
    if (!potion) {
      return 0;
    }
    let effect = potion.effect[charClass] || 0;
    if (!effect) {
      return 0;
    }
    return [515, 516].indexOf(potionClassId) > -1 ? GameData.myReference.hpmax / effect * 100 : effect;
  },

  // returns the amount of life or mana (as absolute value, not percent) a potion gives
  potionEffectPerSecond: function (potionClassId, charClass = GameData.myReference.classid) {
    let effect = this.potionEffect(potionClassId, charClass);
    let potion = PotData[potionClassId];
    if (!potion) {
      return 0;
    }
    let duration = potion.duration;
    if (duration) {
      return effect / duration;
    }
    return 0;
  },

  // Returns the number of frames needed to cast a given skill at a given FCR for a given char.
  castingFrames: function (skillId, fcr = GameData.myReference.getStat(sdk.stats.Fastercastrate), charClass = GameData.myReference.classid) {
    // https://diablo.fandom.com/wiki/Faster_Cast_Rate
    let effectiveFCR = Math.min(75, (fcr * 120 / (fcr + 120)) | 0);
    let isLightning = skillId === sdk.skills.Lightning || skillId === sdk.skills.ChainLightning;
    let baseCastRate = [20, isLightning ? 19 : 14, 16, 16, 14, 15, 17][charClass];
    if (isLightning) {
      return Math.round(256 * baseCastRate / (256 * (100 + effectiveFCR) / 100));
    }

    let animationSpeed = {
      normal: 256,
      human: 208,
      wolf: 229,
      bear: 228
    }[charClass === sdk.charclass.Druid ? this.shiftState() : "normal"];
    return Math.ceil(256 * baseCastRate / Math.floor(animationSpeed * (100 + effectiveFCR) / 100)) - 1;
  },

  // Returns the duration in seconds needed to cast a given skill at a given FCR for a given char.
  castingDuration: function (skillId, fcr = GameData.myReference.getStat(sdk.stats.Fastercastrate), charClass = GameData.myReference.classid) {
    return this.castingFrames(skillId, fcr, charClass) / 25;
  }
};
export default GameData;