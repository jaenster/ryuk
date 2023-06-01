import {MockItem} from "./Mock";
import {Qualities, Runes} from "../enums";
import sdk from "../sdk";

export type Runeword = {
  name: string,
  mock: MockItem,
  itemTypes: number[],
  runes: number[]
};

const _runewords: { [name: string]: Runeword } = {};

const size = getTableSize('runes');
for (let i = 0; i < size; i++) {
  const runeword = getTableRow('runes', i);
  if (!runeword.complete) continue;

  let stats: { min: number, max: number, minor: number, stats: number[] }[] = [];

  for (let j = 1; j < 8; j++) {
    const code = runeword['t1code' + j];
    if (code > -1) {
      let [min, max, minor] = [runeword['t1min' + j], runeword['t1max' + j], runeword['t1param' + j]];

      // todo: some stat code does not have properties ?
      // this will fix tests/Runewords.test.ts:81
      const property = getTableRow('properties', code);
      let subStats = [property.stat1,
        property.stat2,
        property.stat3,
        property.stat4,
        property.stat5,
        property.stat6,
        property.stat7,].filter(el => el !== 0 && el !== 65535);
      if (subStats.length === 0) {
        switch (code) {
          case 27: // + min damage
            subStats = [sdk.stats.SecondaryMindamage];
            break;
          case 28: // + max damage
            subStats = [sdk.stats.SecondaryMaxdamage];
            break;
          case 29: // enhanced damage
            subStats = [sdk.stats.EnhancedDamage];
            break;
        }
      }
      stats.push({
        min,
        max,
        minor,
        stats: subStats
      });
    }
  }

  const runes = [runeword.rune1, runeword.rune2, runeword.rune3, runeword.rune4, runeword.rune5, runeword.rune6].filter(r => Object.values(Runes).filter(v => !isNaN(v)).includes(r))

  const mock = new MockItem({
    overrides: {
      stats: stats.reduce((acc, {stats, minor, min}) => {
        stats.forEach(stat => acc.push([stat, minor, min]));
        return acc;
      }, []) as number[][],
      items: runes.map(r => new MockItem({
        classid: r, itemType: sdk.itemtype.rune, overrides: {
          stats: [[sdk.stats.Levelreq, 0, getBaseStat('items', r, 'level') as number]]
        }
      }))
    },
  } as Partial<MockItem>);

  const itemTypes = [runeword.itype1, runeword.itype2, runeword.itype3, runeword.itype4, runeword.itype5, runeword.itype6].filter(el => el && el !== 65535);

  _runewords[runeword.rune] = {
    name: runeword.rune,
    mock,
    itemTypes,
    runes
  }
}
delete _runewords.default;

// console.log(Object.keys(_runewords).sort().join("\n"));

export class Runewords {
  static get all(): { [name: string]: Runeword } {
    return _runewords;
  }

  static possibleRunewordsWithItem(item: ItemUnit): Runeword[] {
    if (item.isRuneword) {
      return [];
    }
    return Object.values(Runewords.all).filter(runeword => {
      let testRunes = runeword.runes.includes(item.classid);
      if (testRunes) {
        // if it is a rune, no need to test anything else
        return true;
      }
      let testQuality = item.quality && [Qualities.Low, Qualities.Normal, Qualities.Superior].includes(item.quality);
      if (!testQuality) {
        // if item is not low, normal, superior, no need to test anything else
        return false;
      }
      let testSockets = item.getStat(sdk.stats.Numsockets) === runeword.runes.length;
      if (!testSockets) {
        // if sockets don't match, no need to test anything else
        return false;
      }
      let testType = item.itemType && runeword.itemTypes.includes(item.itemType);
      let isShield = [sdk.itemtype.shield, sdk.itemtype.auricshields, sdk.itemtype.voodooheads].includes(item.itemType);
      if (isShield && !testType) {
        // if it is a shield, test if runeword accepts any shield
        testType = runeword.itemTypes.includes(sdk.itemtype.anyshield);
      }
      let isHelm = [sdk.itemtype.primalhelm, sdk.itemtype.pelt, sdk.itemtype.circlet].includes(item.itemType);
      if (isHelm && !testType) {
        // if it is a druid pelt or barb helm or circlet, test if runeword accepts any helm
        testType = runeword.itemTypes.includes(sdk.itemtype.helm);
      }
      // ToDo: same for helms, barb helms, druid pelts, circlets
      // ToDo: same for weapons, missile weapons (bows, crossbows), melee weapons
      return testType;
    })
  }

  static possibleRunewordsWithItems(items: ItemUnit[]): Runeword[] {
    return items.map(this.possibleRunewordsWithItem)
      .reduce((a, b) => a.intersection(b));
  }

  static mockItem(classid: number, sockets: number, itemType: number, quality = Qualities.Normal): MockItem {
    return new MockItem({
      overrides: {
        stats: [[sdk.stats.Numsockets, 0, sockets]]
      },
      classid: classid, quality: quality, itemType: itemType
    });
  }

  static mockBodyArmor(classid: number, sockets: number, quality = Qualities.Normal): MockItem {
    return this.mockItem(classid, sockets, sdk.itemtype.armor, quality);
  }

  static mockWeapon(classid: number, sockets: number, itemType = sdk.itemtype.weapon, quality = Qualities.Normal): MockItem {
    return this.mockItem(classid, sockets, itemType, quality);
  }

  static mockShield(classid: number, sockets: number, itemType = sdk.itemtype.anyshield, quality = Qualities.Normal): MockItem {
    return this.mockItem(classid, sockets, itemType, quality);
  }

  static mockHelm(classid: number, sockets: number, itemType = sdk.itemtype.helm, quality = Qualities.Normal): MockItem {
    return this.mockItem(classid, sockets, itemType, quality);
  }

  /**
   * Creates a mock enigma with mage plate normal base and 750 defense stat
   */
  static mockEnigma(classid: number = 373, quality = Qualities.Normal): MockItem {
    return new MockItem({
      ...this.mockBodyArmor(classid, 3, quality),
      ...Runewords.all["Enigma"].mock
    });
  }

  static mockNadir(classid = 306, quality = Qualities.Normal): MockItem {
    return new MockItem({
      ...this.mockHelm(classid, 2, quality),
      ...Runewords.all["Nadir"].mock
    });
  }
}