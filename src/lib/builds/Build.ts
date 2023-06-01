import {Override} from "../../overrides/Override";


export type Hotkey = {
  skill: number,
  key: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16,
  hand: 0 | 1,
}
export type Build = {
  name: string,
  skills: { skill: number, amount: number, minLevel?: number, softSkills?: true }[],
  stats: {
    strength: number[],
    dexterity: number[],
    vitality: number[],
    energy: number[],
  },
  overrides: Override<any, any>[],
  valid(): boolean;
  active(): boolean;
  respec(): 'normal' | 'nightmare' | 'hell' | false;
  usedSkills: number[],
  hotkeys?: Hotkey[],
};