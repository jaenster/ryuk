/**
 * @description An savable/transferable item you can test with as if it where real
 * @author Jaenster
 *
 */
import {mixinFunctions} from "./utilities";
import sdk from "../sdk";


export abstract class Mockable<T extends Unit> {
  public overrides: Partial<{
    stats: number[][],
    skills: number[],
    flags: number,
    items: ItemUnit[],
    states: { [id: number]: number }
  }> = {stats: [], skills: [], flags: 0, items: [], states: {}};
  protected settingKeys = [];

  constructor(settings: Partial<Mockable<T> & T> = {}) {
    this.settingKeys = Object.keys(settings);
    Object.assign(this, settings);
  }


  protected internalGetStat(major: number, minor?: number) {
    const stat = (this.overrides.stats ?? []).find(([main, sub]) => main === major && sub === (minor | 0));
    return stat?.[2] || 0;
  }

  getStat(major: number, minor?: number, extra?: number) {

    const selfValue = this.internalGetStat(major, minor);
    const inventory = (this.getItems() || undefined);

    // Level requirement is the max of all items (so including sockets)
    if (major === sdk.stats.Levelreq) {
      return Math.max(selfValue, ...inventory.map(el => el.getStat(sdk.stats.Levelreq) as number));
    }

    const socketedStats = inventory.reduce((a, c) => a + c.getStat.call(c, major, minor, extra), 0);
    return selfValue + socketedStats;
  }

  getItems() {
    return this.overrides.items || [];
  };

  toJSON() {
    const obj = {};
    this.settingKeys.forEach(key => {
      obj[key] = this[key];
    })
    return JSON.stringify(obj);
  }

  getState(id: number): number {
    return this.overrides.states?.[id] || 0;
  }

  getFlag(flags?: number): boolean {
    return !!((this.overrides.flags ?? 0) & (flags | 0));
  }
}

// Put entire prototype of Unit in Mockable
mixinFunctions(Mockable, Unit)

/**
 * @class MockItem
 * @description gives us the ability to mock items, therefore test with items if we would own them
 */
//@ts-expect-error // Yes we can extend an ItemUnit even through our super class extends a Unit which don't have perfect overlapping types
export interface MockItem extends ItemUnit {

}

export class MockItem extends Mockable<ItemUnit> {
  static getAllItemStats(item: ItemUnit): [number, number, number][] {
    const stats = [];
    if (!item.isRuneword) {
      // since getStat(-1) is a perfect copy from item.getStat(major, minor), loop over it and get the real value
      // example, item.getStat(7, 0) != item.getStat(-1).find(([major])=> major === 7)[2]
      // its shifted with 8 bytes
      return (item.getStat(-1) as any as [number, number, number][] || [])
        .map(([major, minor, value]) => [major, minor, item.getStat(major, minor) as number]);
    }
    for (let x = 0; x < 358; x++) {
      const zero = item.getStatEx(x, 0);
      zero && stats.push([x, 0, zero]);
      for (let y = 1; y < 281; y++) {
        const second = item.getStatEx(x, y);
        second && second !== zero && stats.push([x, y, second]);
      }
    }
    return stats;
  }

  static settingsGenerator(item: ItemUnit, settings: Partial<MockItem> = {}): Partial<MockItem> {
    // Add to settings
    const initializer = Object.keys(item)
      .filter(key => typeof item[key] !== 'function')
      .reduce((acc, key) => {
        acc[key] = item[key];
        return acc;
      }, {} as MockItem);

    const stats = MockItem.getAllItemStats(item);
    initializer.overrides = {
      stats: stats.reduce((accumulator, [major, minor, value]) => {
        const socketable = item.getItemsEx().map(item => item.getStat(major, minor) as number).reduce((a, c) => a + c, 0) || 0;

        let realValue = value;
        if (major !== sdk.stats.Levelreq) {
          realValue = value - socketable;
        }

        if (realValue > 0) { // Only if this stat isn't given by a socketable
          accumulator.push([major, minor, value]);
        }
        return accumulator;
      }, []),
      flags: item.getFlags(),
    }

    return initializer;
  }

  static fromItem(item: ItemUnit, settings: Partial<MockItem> = {}): MockItem {
    const initializer = this.settingsGenerator(item, settings);
    initializer.overrides.items = item.getItemsEx().map(item => MockItem.fromItem(item));
    return new MockItem(initializer);
  }

  static fromPlayer(from: Unit = me): MockItem[] {
    return from.getItemsEx()
      .filter(item => item.location === sdk.storage.Equipment
        || (item.location === sdk.storage.Inventory && [603, 604, 605].indexOf(item.classid) > -1))
      .map(x => MockItem.fromItem(x));
  }
}

/**
 * @class MockPlayer
 * @description gives us the ability to mock an entire player, so we can test for example auto equipment with another player
 */
//@ts-expect-error Typescript dont understand fully the build in stuff of the game
export interface MockPlayer extends MeType {

}

export class MockPlayer extends Mockable<MeType> {
  get maxhp() {
    return this.getStat(sdk.stats.Maxhp) * (1 + (this.getStat(sdk.stats.MaxhpPercent) / 100));
  }

  get maxmp() {
    return this.getStat(sdk.stats.Maxhp) * (1 + (this.getStat(sdk.stats.MaxmanaPercent) / 100));
  }
}


//@ts-expect-error
export interface MockMonster extends Monster {

}

export class MockMonster extends Mockable<Monster> {

}