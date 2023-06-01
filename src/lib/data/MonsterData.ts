/**
 * @author Nishimura-Katsuo, Jaenster
 */

import {LocaleStringName} from "./LocaleStringID";

/**
 *  MonsterData[classID]
 *  .Index = Index of this monster
 *  .Level = Level of this monster in normal (use GameData.monsterLevel to find monster levels)
 *  .Ranged = if monster is ranged
 *  .Rarity = weight of this monster in level generation
 *  .Threat = threat level used by mercs
 *  .Align = alignment of unit (determines what it will attack)
 *  .Melee = if monster is melee
 *  .NPC = if unit is NPC
 *  .Demon = if monster is demon
 *  .Flying = if monster is flying
 *  .Boss = if monster is a boss
 *  .ActBoss = if monster is act boss
 *  .Killable = if monster can be killed
 *  .Convertable = if monster is affected by convert or mind blast
 *  .NeverCount = if not counted as a minion
 *  .DeathDamage = explodes on death
 *  .Regeneration = hp regeneration
 *  .LocaleString = locale string index for getLocaleString
 *  .ExperienceModifier = percent of base monster exp this unit rewards when killed
 *  .Undead = 2 if greater undead, 1 if lesser undead, 0 if neither
 *  .Drain = drain effectiveness percent
 *  .Block = block percent
 *  .Physical = physical resist
 *  .Magic = magic resist
 *  .Fire = fire resist
 *  .Lightning = lightning resist
 *  .Poison = poison resist
 *  .Minions = array of minions that can spawn with this unit
 *  .MinionCount.Min = minimum number of minions that can spawn with this unit
 *  .MinionCount.Max = maximum number of minions that can spawn with this unit
 */
const MONSTER_INDEX_COUNT = 770;

type MonsterDataInstance = {
  Index: number,
  ClassID: number,
  Level: number,
  Ranged: number,
  Rarity: number,
  Threat: number,
  PetIgnore: number,
  Align: number,
  Melee: number,
  NPC: number,
  Demon: number,
  Flying: number,
  Boss: number,
  ActBoss: number,
  Killable: number,
  Convertable: number,
  NeverCount: number,
  DeathDamage: number,
  Regeneration: number,
  LocaleString: string,
  InternalName: string,
  ExperienceModifier: number,
  Undead: number,
  Drain: number,
  Block: number,
  Physical: number,
  Magic: number,
  Fire: number,
  Lightning: number,
  Cold: number,
  Poison: number,
  Minions: number[],
  GroupCount: {
    Max: number,
    Min: number,
  },
  MinionCount: {
    Max: number,
    Min: number,
  },
  Velocity: number,
  Run: number,
  SizeX: number,
  SizeY: number,
  Attack1MinDmg: number,
  Attack1MaxDmg: number,
  Attack2MinDmg: number,
  Attack2MaxDmg: number,
  Skill1MinDmg: number,
  Skill1MaxDmg: number,
  ColdEffect: number,
}
const MonsterData = new class extends Array<MonsterDataInstance> {
  findByName(whatToFind) {
    let matches = this.map(mon => [Math.min(whatToFind.diffCount(mon.LocaleString), whatToFind.diffCount(mon.InternalName)), mon] as const)
      .sort(([a], [b]) => a - b);

    return matches[0][1];
  };
}

for (let i = 0; i < MONSTER_INDEX_COUNT; i++) {
  let index = i;
  MonsterData.push({
    Index: index,
    ClassID: index,
    Level: getBaseStat('monstats', index, 'Level') as any, // normal only, nm/hell are determined by area's LevelEx
    Ranged: getBaseStat('monstats', index, 'RangedType') as any,
    Rarity: getBaseStat('monstats', index, 'Rarity') as any,
    Threat: getBaseStat('monstats', index, 'threat') as any,
    PetIgnore: getBaseStat('monstats', index, 'petignore') as any,
    Align: getBaseStat('monstats', index, 'Align') as any,
    Melee: getBaseStat('monstats', index, 'isMelee') as any,
    NPC: getBaseStat('monstats', index, 'npc') as any,
    Demon: getBaseStat('monstats', index, 'demon') as any,
    Flying: getBaseStat('monstats', index, 'flying') as any,
    Boss: getBaseStat('monstats', index, 'boss') as any,
    ActBoss: getBaseStat('monstats', index, 'primeevil') as any,
    Killable: getBaseStat('monstats', index, 'killable') as any,
    Convertable: getBaseStat('monstats', index, 'switchai') as any,
    NeverCount: getBaseStat('monstats', index, 'neverCount') as any,
    DeathDamage: getBaseStat('monstats', index, 'deathDmg') as any,
    Regeneration: getBaseStat('monstats', index, 'DamageRegen') as any,
    LocaleString: getLocaleString(getBaseStat('monstats', index, 'NameStr') as any as number),
    InternalName: LocaleStringName[getBaseStat('monstats', index, 'NameStr') as any],
    ExperienceModifier: getBaseStat('monstats', index, ['Exp', 'Exp(N)', 'Exp(H)'][me.diff]) as any,
    Undead: (getBaseStat('monstats', index, 'hUndead') as any && 2) | (getBaseStat('monstats', index, 'lUndead') as any && 1),
    Drain: getBaseStat('monstats', index, ["Drain", "Drain(N)", "Drain(H)"][me.diff]) as any,
    Block: getBaseStat('monstats', index, ["ToBlock", "ToBlock(N)", "ToBlock(H)"][me.diff]) as any,
    Physical: getBaseStat('monstats', index, ["ResDm", "ResDm(N)", "ResDm(H)"][me.diff]) as any,
    Magic: getBaseStat('monstats', index, ["ResMa", "ResMa(N)", "ResMa(H)"][me.diff]) as any,
    Fire: getBaseStat('monstats', index, ["ResFi", "ResFi(N)", "ResFi(H)"][me.diff]) as any,
    Lightning: getBaseStat('monstats', index, ["ResLi", "ResLi(N)", "ResLi(H)"][me.diff]) as any,
    Cold: getBaseStat('monstats', index, ["ResCo", "ResCo(N)", "ResCo(H)"][me.diff]) as any,
    Poison: getBaseStat('monstats', index, ["ResPo", "ResPo(N)", "ResPo(H)"][me.diff]) as any,
    Minions: ([getBaseStat('monstats', index, 'minion1') as any, getBaseStat('monstats', index, 'minion2') as any].filter(mon => mon !== 65535)),
    GroupCount: ({
      Min: getBaseStat('monstats', index, 'MinGrp') as any,
      Max: getBaseStat('monstats', index, 'MaxGrp') as any
    }),
    MinionCount: ({
      Min: getBaseStat('monstats', index, 'PartyMin') as any,
      Max: getBaseStat('monstats', index, 'PartyMax') as any
    }),
    Velocity: getBaseStat('monstats', index, 'Velocity') as any,
    Run: getBaseStat('monstats', index, 'Run') as any,
    SizeX: getBaseStat('monstats2', getBaseStat('monstats', index, 'MonStatsEx') as number, 'SizeX') as any,
    SizeY: getBaseStat('monstats2', getBaseStat('monstats', index, 'MonStatsEx') as number, 'SizeY') as any,
    Attack1MinDmg: getBaseStat('monstats', index, ["A1MinD", "A1MinD(N)", "A1MinD(H)"][me.diff]) as any,
    Attack1MaxDmg: getBaseStat('monstats', index, ["A1MaxD", "A1MaxD(N)", "A1MaxD(H)"][me.diff]) as any,
    Attack2MinDmg: getBaseStat('monstats', index, ["A2MinD", "A2MinD(N)", "A2MinD(H)"][me.diff]) as any,
    Attack2MaxDmg: getBaseStat('monstats', index, ["A2MaxD", "A2MaxD(N)", "A2MaxD(H)"][me.diff]) as any,
    Skill1MinDmg: getBaseStat('monstats', index, ["S1MinD", "S1MinD(N)", "S1MinD(H)"][me.diff]) as any,
    Skill1MaxDmg: getBaseStat('monstats', index, ["S1MaxD", "S1MaxD(N)", "S1MaxD(H)"][me.diff]) as any,
    ColdEffect: getBaseStat('monstats', index, ["ColdEffect", "ColdEffect(N)", "ColdEffect(H)"][me.diff]) as any
  });
}

export default MonsterData;
