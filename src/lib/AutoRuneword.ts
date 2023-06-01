import {PickitResult, Qualities, Runes, StorageLocations} from "../enums";
import sdk from "../sdk";
import {mercAutoEquip, personalAutoEquip} from "./AutoEquip";
import charData from "./CharData";
import {MockItem} from "./Mock";
import {Runeword, Runewords} from "./Runewords";

const dependencies = {};
dependencies[sdk.itemtype.bow] = sdk.items.arrows;
dependencies[sdk.items.arrows] = sdk.itemtype.bow;
dependencies[sdk.itemtype.crossbow] = sdk.items.bolts;
dependencies[sdk.items.bolts] = sdk.itemtype.crossbow;

const hasDependency = item => {
  let dep = dependencies[item.classid] || dependencies[item.itemType];
  return !!dep;
};

enum WantType {
  Merc, Me
}

export class RunewordStrategy {
  runeword: Runeword;
  baseGid?: number;
  runesGid: number[];
  tier?: number;

  constructor(runeword: Runeword, runesGid: number[] = [], baseGid?: number) {
    this.runeword = runeword;
    this.runesGid = runesGid;
    this.baseGid = baseGid;
  }

  get base(): ItemUnit | undefined {
    if (!this.baseGid) {
      return undefined;
    }
    return me.getItem(-1, -1, this.baseGid) || undefined;
  }

  hasBase: (gid: number) => boolean = (gid) => {
    return this.base?.gid === gid;
  }

  needBase: (item: ItemUnit) => boolean = (item) => {
    return !this.hasBase(item.gid) && this.runeword.itemTypes.includes(item.itemType);
  }

  get runes(): ItemUnit[] {
    return this.runesGid
      .compactMap(id => me.getItem(-1, -1, id));
  }

  get runesClassId(): number[] {
    return this.runes.map(r => r.classid);
  }

  hasRune: (gid: number) => boolean = (gid) => {
    return !!this.runes.find(r => r.gid === gid);
  }

  needRune: (classid: number) => boolean = (classid) => {
    return !this.runesClassId.includes(classid) && this.runeword.runes.includes(classid);
  }

  hasItem: (gid: number) => boolean = (gid) => {
    return this.hasBase(gid) || this.hasRune(gid);
  }

  needItem: (item: ItemUnit) => boolean = item => {
    return this.needBase(item) || this.needRune(item.classid);
  }

  addItem = (item: ItemUnit) => {
    if (item.itemType === sdk.itemtype.rune) {
      this.runesGid.push(item.gid);
    } else {
      this.baseGid = item.gid;
    }
  }

  removeItem = (item: ItemUnit) => {
    if (item.itemType === sdk.itemtype.rune) {
      this.runesGid = this.runesGid.filter(id => id !== item.gid);
    } else if (this.baseGid === item.gid) {
      this.baseGid = null;
    }
  }

  get isComplete(): boolean {
    if (!this.base) {
      // don't have base
      return false;
    }
    if (this.runeword.runes.difference(this.runesClassId).length !== 0) {
      // don't have all runes
      return false;
    }
    return true;
  }

  get isDone(): boolean {
    return this.base?.isRuneword ?? false;
  }

  private runeRariness = (classid: number, inverse = false) => {
    // calculate the rariness of runes
    let el = Runes.El;
    let zod = Runes.Zod;
    let min = 0;
    let max = 9; // 8.55
    // map the value between min and max (el = 0, zod = 9) linear
    let map = x => (max - min) * (x - el) / (zod - el) + min;
    // apply exponential (el = 1, zod = 8103)
    let exp = x => Math.exp(map(x));
    // apply inverse factor
    let f = x => 1 / exp(x);
    // el = 1, zod = 0.0001234
    return inverse ? exp(classid) : f(classid);
  }

  private get progress(): number {
    let totalRunesRariness = this.runeword.runes.map(r => this.runeRariness(r)).reduce((acc, v) => acc + v, 0);
    let currentRunesRariness = this.runesClassId.map(r => this.runeRariness(r)).reduce((acc, v) => acc + v, 0);

    let baseRariness = this.runeRariness(Runes.Tal); // todo calculate, currently it has default rariness of tal rune, why not ?
    let currentBaseRariness = !!this.base ? baseRariness : 0;

    let currentProgress = (currentBaseRariness + currentRunesRariness) / (totalRunesRariness + baseRariness);
    return currentProgress;
  }

  get priority(): number {
    // todo: what if we don't have base ? the autoequip formula will always be -inf
    if (!this.base) {
      return this.progress;
    }
    let mock = new MockItem({...this.base, ...this.runeword.mock});
    let equipScore = personalAutoEquip.formula(mock);
    let mercEquipScore = (mercAutoEquip && mercAutoEquip.formula(mock)) | 0;
    if (equipScore === -Infinity && mercEquipScore === -Infinity) {
      // me and merc don't want
      return -Infinity;
    }

    //todo: compare with current item and add a difference malus
    // aka, the better the runeword is compared to current item, the more it will be replaced
    // case 1 : tier = 10000, current = 500, diff = 9500
    // case 2 : tier = 15000, current = 12000, diff = 3000
    // prefer case 1, even if tier is lower than case 2
    // make a percentage ?

    let lvlReq = mock.getStat(sdk.stats.Levelreq);
    if (equipScore === -Infinity) {
      let diffLvl = lvlReq - charData.merc.level;
      if (diffLvl > 0) {
        mercEquipScore -= diffLvl;
      }
      return mercEquipScore * this.progress;
    }

    let diffLvl = lvlReq - me.charlvl;
    if (diffLvl > 0) {
      equipScore -= diffLvl;
    }
    return equipScore * this.progress;
  }

  make = () => {
    if (!this.isComplete) {
      return false;
    }
    if (!Town.openStash()) {
      return false;
    }
    for (let runeId of this.runeword.runes) {
      let rune = me.findItem(runeId, 0);
      if (!rune || !rune.toCursor()) {
        return false;
      }
      for (var i = 0; i < 3 && !this.base.isRuneword && me.itemoncursor; i += 1) {
        clickItem(0, this.base.x, this.base.y, this.base.location);

        var tick = getTickCount();
        while (getTickCount() - tick < 2000 && me.itemoncursor) {
          delay(10);
        }
      }
    }
    return this.isDone;
    /*if (this.base.isRuneword) {
        // remove strategy
        //AutoRunewords.strategies = AutoRunewords.strategies.filter(s => s !== this);
        return true;
    }
    return false;*/
  }
}

export class AutoRunewords {
  public readonly wantType: WantType;
  public readonly formula: (item: ItemUnit) => number;

  private readonly forUnit: WantType;
  private readonly cachedWanted: Map<ItemUnit, WantType | 0 | -1> = new Map();
  private readonly cacheCalced: Map<ItemUnit, number> = new Map();
  static strategies: RunewordStrategy[] = [];

  static strategyForRuneword(runeword: Runeword): RunewordStrategy {
    let strategy = this.strategies.find(s => s.runeword.name === runeword.name);
    if (!strategy) {
      // console.log("No strategy to make "+r.name+", creating a new one");
      strategy = new RunewordStrategy(runeword);
      this.strategies.push(strategy);
    } else {
      // console.log("A strategy already exists for "+ strategy.runeword.name);
    }
    return strategy;
  }

  static checkItem(item: ItemUnit, forUnit = WantType.Me): PickitResult {
    if (!item) {
      return PickitResult.NONE; // We dont want an item that doesnt exists
    }

    if (item.itemType === sdk.itemtype.rune) {
      if (this.need(item)) {
        this.updateStrategies(item);
        return PickitResult.RUNEWORDS;
      }
      return PickitResult.NONE;
    }

    // fuck 2 handed items for now
    if (item.twoHanded && forUnit === WantType.Me) {
      return PickitResult.NONE;
    }

    if (item.getStat(sdk.stats.Maxdurability) > 0 && item.getStat(sdk.stats.Durability) === 0) {
      //ToDo: item is broken, should we repair it ?
      return PickitResult.NONE;
    }

    const bodyLoc = item.getBodyLoc();
    if (!bodyLoc.length) {
      return PickitResult.NONE; // Only items that we can wear
    }

    // todo: when merc is dead
    if (forUnit === WantType.Merc && !me.getMerc()) {
      return PickitResult.NONE;
    }

    let canWear = forUnit !== WantType.Merc ||
      // a act 2 merc
      (me.getMerc()?.classid === sdk.monsters.Guard && (item.itemType === sdk.itemtype.spear || item.itemType === sdk.itemtype.polearm))

      // a act 1 merc
      || (me.getMerc()?.classid === sdk.monsters.RogueScout && item.itemType === sdk.itemtype.bow);

    if (!canWear) {
      return PickitResult.NONE;
    }

    // if this is for a class, and its not our class or we are a merc
    const forClass = item.charclass;
    if (forClass !== 255) {
      // ToDo; see if this properly handles a act 5 merc
      // console.log('??');
      if (this.reference(forUnit)?.classid > 6) return PickitResult.NONE // merc

      if ((forClass >= 0 && forClass <= 6 && forClass !== this.reference(forUnit)?.classid)) {
        return PickitResult.NONE;
      }
    }

    //ToDo; fix act 1 merc
    if (hasDependency(item)) {
      // TODO: item require an other item to be used (bow, crossbow)
      return PickitResult.NONE;
      //quantity * 100 / getBaseStat("items", quiver.classid, "maxstack")
      /*const stock = me.getItemsEx()
          .filter(i => i.classid == dependency && ((i.mode == sdk.itemmode.inStorage && i.location == sdk.storage.Inventory) || i.mode == sdk.itemmode.equipped));
      if (stock.length) {
          return 1;
      }
      // can't use this item as we don't have the dependency
      return -1;*/
    }
    /*
            const rating = this.formula(item);
            if (rating === -Infinity) {
                return PickitResult.NONE;
            }
    */
    // if a unit has no items, it returns the function getItems itself.. weird
    let itsItems = (this.reference(forUnit)?.getItems() || []);
    if (!Array.isArray(itsItems)) itsItems = [];

    // Current items are either -Infinity, or the actual item
    const currentItems: ItemUnit[] = bodyLoc.compactMap(slot => {
      const current = itsItems.find(item => item.isEquipped && item.bodylocation === slot);
      if (!current && slot === sdk.body.LeftArm) {
        const currentWeapon = itsItems
          .find(item => item.isEquipped && item.bodylocation === sdk.body.RightArm && item.twoHanded);
        // if current weapon is two handed, remove this as current slot
        if (currentWeapon) {
          return null;
        }
      }
      return current;
    });

    // no point in wanting items we cant equip
    let currentInSlot = currentItems.find(i => i.getBodyLoc().intersection(item.getBodyLoc()).length > 0);
    let currentStrBonus = currentInSlot?.getStatEx(sdk.stats.Strength) ?? 0;
    let currentDexBonus = currentInSlot?.getStatEx(sdk.stats.Dexterity) ?? 0;
    let realDex = this.reference(forUnit)?.getStat(sdk.stats.Dexterity) - currentDexBonus;
    let realStr = this.reference(forUnit)?.getStat(sdk.stats.Strength) - currentStrBonus;
    let levelShift = 2; // try to make a runeword 2 levels before you can wear it, the time to collect all runes and base
    let levelReq = item.getStat(sdk.stats.Levelreq) - levelShift;
    if (levelReq > this.reference(forUnit)?.getStat(sdk.stats.Level) || item.dexreq > realDex || item.strreq > realStr) {
      return PickitResult.NONE;
    }

    let autoEquip = this.autoEquip(forUnit);
    let runewords = Runewords.possibleRunewordsWithItems([item])//.filter(r => r);
    if (runewords.length > 0) {
      let currentItem = this.reference(forUnit)?.getItemsEx().find(i => i.isEquipped && item.getBodyLoc().includes(i.bodylocation));
      let currentTier = -Infinity;
      if (currentItem) {
        currentTier = autoEquip && autoEquip.formula(currentItem) | 0;
      }

      // example: body armor with 2 sox, we can make stealth or smoke or prudence, should we keep 3 body armor 2 sox ?
      // or only one with the best runeword ? what if I have all the runes to make stealth, but the best is smoke ?

      // if it is a rune or the runeword is better than current equipped item, process
      let betterRunewords = runewords.map(r => ({runeword: r, mock: new MockItem({...item, ...r.mock})}))
        .map(r => ({...r, tier: autoEquip && autoEquip.formula(r.mock) | 0}))
        .filter(r => r.tier > 0 && r.tier > currentTier);
      let process = item.itemType === sdk.itemtype.rune || betterRunewords.length > 0;
      if (process) {
        /*
        if (betterRunewords.length > 0) {
            console.log("Some runewords are better than current item: " + currentItem?.fname + " (" + currentTier + ")");
            betterRunewords.forEach(r => {
                console.log(r.runeword.name + " (" + r.tier + ")")
            });
        }
        */
        if (this.need(item)) {
          this.updateStrategies(item, betterRunewords.map(r => r.runeword));
          return PickitResult.RUNEWORDS;
        }
      }
    }

    return PickitResult.NONE;
  }

  /*
      static needRune(rune: ItemUnit): boolean {
          // the problem is, when I check a rune, I create all runewords possible with this rune, but I don't know the base
          // so my mock runeword score is -infinity because I can't wear it
          // so for now, I keep all runes that I don't have to create any runeword
          // I need to generate a mock base for each runeword
          // I need to generate a mock base of each type a runeword can be made in
          // to create a mock base, I need the itemType which is from runeword required type
          // but I also need a classid
          // I don't want to generate each base classid of each base type of each runeword...
          let runewords = Runewords.possibleRunewordsWithItems([rune]);
          let mockRunewords = runewords.map(r => {
              let mockBase = Runewords.mockItem()
              return new MockItem({ ... mockBase, ...r.mock })
          })
          return false;
      }
  */
  static need(item: ItemUnit): boolean {
    let sameBase = me.getItemsEx()
      .find(i => i.gid !== item.gid && !i.isEquipped && i.itemType !== sdk.itemtype.rune && i.itemType === item.itemType && i.getStatEx(sdk.stats.Numsockets) === item.getStatEx(sdk.stats.Numsockets));
    if (!!sameBase && !this.strategies.some(s => s.needItem(item))) {
      // don't need if already have same base or no strategy need it
      // only keep one base of each pair (type, sockets)
      // only one body armor 2 sox
      // only one body armor 3 sox
      // only one body armor 4 sox
      // only one helm 2 sox
      // ...
      // todo: we need to keep only the best base, based on best runeword for this type
      //       only one body armor for the next runeword you will wear
      //       no need to keep armor 2 sox and armor 3 sox if you will use 4 sox runeword
      return false;
    }
    return true;
  }

  static updateStrategies(item: ItemUnit, runewords: Runeword[] = Runewords.possibleRunewordsWithItems([item])) {
    let itemName = item.fname + (item.itemType !== sdk.itemtype.rune ? " " + item.getStatEx(sdk.stats.Numsockets) + " sox" : "") + " (" + item.gid + ")";
    // console.log("Updating strategies with : " + itemName);
    // console.log("           for runewords : " + runewords.map(r => r.name));
    runewords.map(r => this.strategyForRuneword(r))
      .filter(s => !s.isComplete && !s.isDone)
      .forEach(strategy => {
        if (strategy.needItem(item)) {
          let otherUsing = this.strategies.find(s => s.hasItem(item.gid));
          if (!otherUsing) {
            // console.log(itemName + " will be used to make " + strategy.runeword.name);
            strategy.addItem(item)
          } else {
            // console.log(itemName + " is already needed for " + otherUsing.runeword.name + ", may also be used for " + strategy.runeword.name);
            // test the priority
            strategy.addItem(item);
            let priority = strategy.priority;
            let otherPriority = otherUsing.priority;
            if (priority >= otherPriority || (strategy.isComplete && !otherUsing.isComplete)) {
              // console.log("... but " + strategy.runeword.name + " (" + priority + ") is better than " + otherUsing.runeword.name + " (" + otherPriority + ") to use " + itemName);
              // otherUsing.removeItem(item);
              // check if the priorities have changed with the new item
              otherPriority = otherUsing.priority;
              if (otherPriority > priority && !strategy.isComplete) {
                // hmm ? the item has changed priorities, go back
                // strategy.removeItem(item);
                // otherUsing.addItem(item);
              } else {
                // ok still in same order, leave this way
              }
            } else {
              // it is not better
              // strategy.removeItem(item);
            }
          }
        } else {
          // console.log(itemName + " is not needed to make " + strategy.runeword.name);
        }
      });

    // higher priority come first, index 0 > index 1 > ...
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  static buildStrategies() {
    me.getItemsEx()
      .forEach(i => {
        if (i.isRuneword) {
          // todo: what to do with an item that is already a runeword ?

          // 1: create a strategy and mark it done
          // this will disable making this runeword again

          // 2: don't create a strategy
          // this will enable making this runeword again with other runes and other base of same type

          // 3: create a strategy with the base only
          // this will enable making other runewords (maybe the same) with this base by rerolling it
          // need reroll implementation : cube hel + tp scroll

          // the runes are lost anyway
        }
        // if i is runeword, checkItem will return PickitResult.NONE because you can't make any runewords with a runeword
        this.checkItem(i);
      });
  }

  static handleItem(item: ItemUnit): boolean {
    if (this.strategies.length === 0) {
      this.buildStrategies();
    }

    return [WantType.Me, WantType.Merc]
      .map(wt => this.checkItem(item, wt))
      .some(res => res === PickitResult.RUNEWORDS);
  }


  private static reference(forUnit: WantType): MercUnit | MeType {
    if (forUnit === WantType.Me) return me;
    if (forUnit === WantType.Merc) return me.getMerc() || undefined;
  }

  private static autoEquip(forUnit: WantType) {
    if (forUnit === WantType.Me) return personalAutoEquip;
    if (forUnit === WantType.Merc) return mercAutoEquip;
  }

  static makeRunewords() {
    if (this.strategies.length === 0) {
      this.buildStrategies();
    }
    this.strategies.filter(s => s.isComplete)
      .forEach(r => {
        console.log("trying to make " + r.runeword.name);
        if (r.make()) {
          console.log("made runeword " + r.runeword.name);
        }
      });

    // update the items in stash if not needed anymore
    me.getItemsEx()
      .filter(i => i.isInStash && (i.itemType === sdk.itemtype.rune || [Qualities.Low, Qualities.Normal, Qualities.Superior].includes(i.quality)))
      .forEach(i => {
        if (Pickit.checkItem(i).result === PickitResult.NONE) {
          i.sellOrDrop();
        }
      });
  }
};

Pickit.on('checkItem', function (item, result) {
  // override result.result to keep or whatever
  if (AutoRunewords.handleItem(item)) {
    return result.result = PickitResult.RUNEWORDS;
  }
});