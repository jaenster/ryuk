import sdk from "../../sdk";
import {Npc} from "./enums";

export enum NpcFlags {
  TALK = 1 << 0,
  TRADE = 1 << 2,
  HEAL = 1 << 3,
  REPAIR = 1 << 4,
  GAMBLE = 1 << 5,
  RESURRECT = 1 << 6,
  RESPEC = 1 << 7,
  HIRE = 1 << 8,

  // Specific items it sells
  POTS = 1 << 9,
  SCROLL = 1 << 10,
  KEYS = 1 << 11,
  CAIN_ID = 1 << 12,

  TRAVEL = 1 << 19,
  ACT1 = 1 << 20,
  ACT2 = 1 << 21,
  ACT3 = 1 << 22,
  ACT4 = 1 << 23,
  ACT5 = 1 << 24,

  // Not really a NPC but it is a target in town
  STASH = 1 << 25,

  NONE = 0,

  REPAIR_TRADE = TRADE | REPAIR,
  KEYPOTS = POTS | KEYS,
  ALLSHOP = POTS | KEYS | SCROLL,
}

export const NpcStats = {
  // Act 1
  get [Npc.Akara]() {
    return NpcFlags.ACT1 | NpcFlags.TALK | NpcFlags.HEAL | NpcFlags.TRADE | (me.getQuest(41, 0) ? NpcFlags.RESPEC : 0) | NpcFlags.ALLSHOP;
  },
  [Npc.Gheed]: NpcFlags.ACT1 | NpcFlags.TALK | NpcFlags.GAMBLE | NpcFlags.TRADE | NpcFlags.KEYS,
  [Npc.Charsi]: NpcFlags.ACT1 | NpcFlags.TALK | NpcFlags.REPAIR | NpcFlags.TRADE,
  get [Npc.Kashya]() {
    return NpcFlags.ACT1 | NpcFlags.TALK | NpcFlags.RESURRECT | (me.getQuest(sdk.quests.SistersBurialGrounds, 0) || me.charlvl >= 8 ? NpcFlags.HIRE : 0);
  },

  [Npc.Fara]: NpcFlags.ACT2 | NpcFlags.TALK | NpcFlags.REPAIR | NpcFlags.TRADE,
  [Npc.Drognan]: NpcFlags.ACT2 | NpcFlags.TALK | NpcFlags.TRADE | NpcFlags.SCROLL | NpcFlags.POTS,
  [Npc.Elzix]: NpcFlags.ACT2 | NpcFlags.TALK | NpcFlags.TRADE | NpcFlags.GAMBLE,
  [Npc.Greiz]: NpcFlags.ACT2 | NpcFlags.TALK | NpcFlags.RESURRECT | NpcFlags.HIRE,
  [Npc.Lysander]: NpcFlags.ACT2 | NpcFlags.TALK | NpcFlags.KEYPOTS,
  [Npc.Jerhyn]: NpcFlags.ACT2 | NpcFlags.TALK,
  [Npc.Atma]: NpcFlags.ACT2 | NpcFlags.TALK | NpcFlags.HEAL,

  [Npc.Ormus]: NpcFlags.ACT3 | NpcFlags.TALK | NpcFlags.KEYPOTS | NpcFlags.SCROLL,
  [Npc.Alkor]: NpcFlags.ACT3 | NpcFlags.TALK | NpcFlags.TRADE | NpcFlags.GAMBLE,
  [Npc.Hratli]: NpcFlags.ACT3 | NpcFlags.TALK | NpcFlags.REPAIR | NpcFlags.TRADE,
  [Npc.Asheara]: NpcFlags.ACT3 | NpcFlags.TALK | NpcFlags.TRADE | NpcFlags.HIRE | NpcFlags.RESURRECT,

  [Npc.Jamella]: NpcFlags.ACT4 | NpcFlags.REPAIR | NpcFlags.TRADE,
  [Npc.Halbu]: NpcFlags.ACT4 | NpcFlags.TRADE | NpcFlags.GAMBLE | NpcFlags.KEYPOTS | NpcFlags.SCROLL,
  [Npc.Tyrael]: NpcFlags.ACT4 | NpcFlags.TALK | NpcFlags.RESURRECT | NpcFlags.TRAVEL,

  [Npc.Malah]: NpcFlags.ACT5 | NpcFlags.TALK | NpcFlags.HEAL | NpcFlags.ALLSHOP,
  [Npc.Larzuk]: NpcFlags.ACT5 | NpcFlags.TALK | NpcFlags.REPAIR | NpcFlags.TRADE,
  [Npc.Qual_Kehk]: NpcFlags.ACT5 | NpcFlags.TALK | NpcFlags.HIRE,
  // Switch between anya and nihla
  get [Npc.Anya]() {
    return me.getQuest(sdk.quests.PrisonOfIce, 0) ? NpcFlags.ACT5 | NpcFlags.TALK | NpcFlags.GAMBLE | NpcFlags.TRADE : 0;
  },
  get [Npc.Nihlathak]() {
    return this[Npc.Anya] ? 0 : NpcFlags.ACT5 | NpcFlags.TALK | NpcFlags.GAMBLE;
  },


  get [Npc.Cain]() { // Cain is only available in act 1 if the quest is done
    return (me.getQuest(sdk.quests.TheSearchForCain, 0) ? NpcFlags.ACT1 : 0) | NpcFlags.ACT2 | NpcFlags.ACT3 | NpcFlags.ACT4 | NpcFlags.ACT5 | NpcFlags.TALK | NpcFlags.CAIN_ID;
  },
  [Npc.Meshif]: NpcFlags.ACT2 | NpcFlags.ACT3 | NpcFlags.TALK | NpcFlags.TRAVEL,
  [Npc.Warriv]: NpcFlags.ACT1 | NpcFlags.ACT2 | NpcFlags.TALK | NpcFlags.TRAVEL,

  [Npc.Stash]: NpcFlags.STASH | NpcFlags.ACT1 | NpcFlags.ACT2 | NpcFlags.ACT3 | NpcFlags.ACT4 | NpcFlags.ACT5,
}

export namespace Npcs {
  //https://stackoverflow.com/a/37580979/14190818
  function permute<T>(permutation: T[]): T[][] {
    let length = permutation.length,
      result = [permutation.slice()],
      c = new Array(length).fill(0),
      i = 1, k, p;

    while (i < length) {
      if (c[i] < i) {
        k = i % 2 && c[i];
        p = permutation[i];
        permutation[i] = permutation[k];
        permutation[k] = p;
        ++c[i];
        i = 1;
        result.push(permutation.slice());
      } else {
        c[i] = 0;
        ++i;
      }
    }
    return result;
  }

  export function getGroups(neededFlags: number) {
    const npcArray = [] as [Npc, NpcFlags][];
    for (const npc of Object.values(Npc)) {
      npcArray.push([npc, NpcStats[npc]]);
    }

    let index = 0;

    const groups = [] as Npc[][];
    do {
      const check = npcArray.slice(index).concat(npcArray.slice(0, index));
      let groupFlags = 0;
      const group = [] as Npc[];

      for (let i = 0; i < check.length; i++) {
        const [npc, npcFlags] = check[i]

        // This npc has one of the flags we still need
        const npcNeededAbilities = npcFlags & neededFlags;
        const alreadyHaveEverything = (groupFlags | npcNeededAbilities) === groupFlags;
        const addThisNpc = npcNeededAbilities > 0 && !alreadyHaveEverything;
        if (addThisNpc) {
          group.push(npc);
          groupFlags |= npcFlags;

          check.splice(i, 1); // remove this option now
          i--;

          // All flags are found in current group. Stop finding more npc's
          if ((groupFlags & neededFlags) === neededFlags) {
            const possibilities = permute(group)
            groups.push(...possibilities);
            break; // Stop the loop
          }
        } else if (i === index) {
          // This is the first npc it's checking, and it has no needed flags. Skip this entire loop
          break;
        }
      }
      index += 1;
    } while (index < npcArray.length)

    return groups;
  }

  export function actsOf(npc: Npc): (1|2|3|4|5)[] {
    const acts = [];

    if ((NpcStats[npc] & NpcFlags.ACT1) === NpcFlags.ACT1) acts.push(1)
    if ((NpcStats[npc] & NpcFlags.ACT2) === NpcFlags.ACT2) acts.push(2)
    if ((NpcStats[npc] & NpcFlags.ACT3) === NpcFlags.ACT3) acts.push(3)
    if ((NpcStats[npc] & NpcFlags.ACT4) === NpcFlags.ACT4) acts.push(4)
    if ((NpcStats[npc] & NpcFlags.ACT5) === NpcFlags.ACT5) acts.push(5)

    return acts;
  }
}