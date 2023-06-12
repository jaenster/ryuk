/**
 * @description Polyfill for setTimeout, as the version of d2bs isn't thread safe
 * @author Jaenster
 */
import worker from "../lib/worker";
import sdk from "../sdk";
import {CharClasses} from "enums";
import {removeExistingProp} from "./Override";

(function (global, _original) {
  global['_setTimeout'] = _original;

  /**
   * @param {function} cb
   * @param {number} time
   * @param args
   * @constructor
   */
  function Timer(cb, time = 0, args = []) {
    Timer.instances.push(this);

    worker.runInBackground('__setTimeout__' + (Timer.counter++), (startTick => () => {
      let finished = getTickCount() - startTick >= time;

      if (finished) {
        let index = Timer.instances.indexOf(this);

        // only if not removed from the time list
        if (index > -1) {
          Timer.instances.splice(index, 1);
          cb.apply(undefined, args);
        }
      }


      return !finished;
    })(getTickCount()));
  }

  Timer.instances = [];
  Timer.counter = 0;

  global['setTimeout'] = function (cb, time = 0, ...args) {
    if (typeof cb === 'string') {
      console.debug('Warning: Do not use raw code @ setTimeout and does not support lexical scoping');
      cb = [].filter.constructor(cb);
    }

    if (typeof cb !== 'function') throw new TypeError('setTimeout callback needs to be a function');

    return new Timer(cb, time, args);
  };

  /**
   *
   * @param {Timer} timer
   */
  global['clearTimeout'] = function (timer) {
    const index = Timer.instances.indexOf(timer);
    if (index > -1) {
      Timer.instances.splice(index, 1)
    }
  };

  // getScript(true).name.toString() !== 'default.dbj' && setTimeout(function () {/* test code*/}, 1000)

// @ts-ignore // Set time out does exists
})([].filter.constructor('return this')(), setTimeout);


(function (global, original) {
  let firstRun = true;
  global['getUnit'] = function (...args) {
    const test = original(1);
    // Stupid reference thing

    if (firstRun) {
      delay(30);
      firstRun = false;
    }


    let [first] = args, second = args.length >= 2 ? args[1] : undefined;

    const ret = original.apply(this, args);

    // deal with fucking bug
    if (first === 1 && typeof second === 'string' && ret && ((me.act === 1 && ret.classid === 149) || me.act === 2 && ret.classid === 268)) {
      D2Bot.printToConsole('Annoying d2 bug - getUnit not working');
      // @ts-ignore
      require("../lib/CharData").gameData.log.push('Annoying d2 bug - getUnit not working. Dont count this game');

      delay(2500);
      scriptBroadcast('quit');
      //@ts-ignore
      getScript(true).stop();
    }

    return original.apply(this, args);
  }
})([].filter.constructor('return this')(), getUnit);

if (me.ingame) {
  (Unit.prototype as ItemUnit).getBodyLoc = function (this: ItemUnit) {
    let types = {
      1: [37, 71, 75], // helm
      2: [12], // amulet
      3: [3], // armor
      4: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 42, 43, 44, 67, 68, 69, 72, 85, 86, 87, 88], // weapons
      5: [2, 5, 6, 70], // shields / Arrows / bolts
      6: [10], // ring slot 1
      7: [10], // ring slot 2
      8: [19], // belt
      9: [15], // boots
      10: [16], // gloves
      /*[sdk.body.RightArmSecondary]: [], // secondary right
      [sdk.body.LeftArmSecondary]: [], // secondary left*/
    }, bodyLoc = [];

    for (let i in types) {
      this.itemType && types[i].includes(this.itemType) && bodyLoc.push(i);
      if (parseInt(i) === sdk.body.RightArm && this.twoHanded) {
        bodyLoc.push(sdk.body.LeftArm); // two handed weapons take both slots
      }
    }
    return bodyLoc.map(loc => parseInt(loc));
  };
}


//
removeExistingProp(Unit.prototype, {
  rawStrength: {
    get() {
      let lvl = this.getStat(sdk.stats.Level);
      let rawBonus = (i: ItemUnit) => i.getStat(sdk.stats.Strength);
      let perLvlBonus = (i: ItemUnit) => lvl * i.getStat(sdk.stats.PerLevelStrength) / 8;
      let bonus = ~~(this.getItemsEx()
        .filter(i => i.isEquipped)
        .map(i => rawBonus(i) + perLvlBonus(i))
        .reduce((acc, v) => acc + v, 0));
      return this.getStat(sdk.stats.Strength) - bonus;
    },
    enumerable: true
  },
  rawDexterity: {
    get() {
      let lvl = this.getStat(sdk.stats.Level);
      let rawBonus = (i: ItemUnit) => i.getStat(sdk.stats.Dexterity);
      let perLvlBonus = (i: ItemUnit) => lvl * i.getStat(sdk.stats.PerLevelDexterity) / 8;
      let bonus = ~~(this.getItemsEx()
        .filter(i => i.isEquipped)
        .map(i => rawBonus(i) + perLvlBonus(i))
        .reduce((acc, v) => acc + v, 0));
      return this.getStat(sdk.stats.Dexterity) - bonus;
    },
    enumerable: true
  }
});


removeExistingProp(Unit.prototype as ItemUnit, {
  dexreq: {
    get() {
      var finalReq,
        ethereal = this.getFlag(0x400000),
        reqModifier = this.getStat(91),
        baseReq = getBaseStat("items", this.classid, "reqdex") as number;

      finalReq = baseReq + Math.floor(baseReq * reqModifier / 100);

      if (ethereal) {
        finalReq -= 10;
      }

      return Math.max(finalReq, 0);
    },
    enumerable: true
  },
  strreq: {
    get() {
      var finalReq,
        ethereal = this.getFlag(0x400000),
        reqModifier = this.getStat(91),
        baseReq = getBaseStat("items", this.classid, "reqstr") as number;

      finalReq = baseReq + Math.floor(baseReq * reqModifier / 100);

      if (ethereal) {
        finalReq -= 10;
      }

      return Math.max(finalReq, 0);
    },
    enumerable: true
  },
  charclass: {
    get() {
      return getBaseStat("itemtypes", this.itemType, "class") as CharClasses;
    },
    enumerable: true
  },
  identified: {
    get() {
      if (this.type !== sdk.unittype.Item) return undefined; // Can't tell, as it isn't an item

      return this.getFlag(0x10); // is also true for white items
    }
  },
  ethereal: {
    get() {
      if (this.type !== sdk.unittype.Item) return undefined; // Can't tell, as it isn't an item
      return this.getFlag(0x400000);
    }
  },
  twoHanded: {
    get() {
      return getBaseStat("items", this.classid, "2handed") === 1;
    }
  },
  isEquipped: {
    get() {
      if (this.type !== sdk.unittype.Item) return false;
      return this.location === sdk.storage.Equipment;
    }
  },
  isInInventory: {
    get() {
      return this.location === sdk.storage.Inventory && this.mode === sdk.itemmode.inStorage;
    }
  },
  isInBelt: {
    get() {
      return this.location === sdk.storage.Belt && this.mode === sdk.itemmode.inBelt;
    }
  },
  isInStash: {
    get() {
      return this.location === sdk.storage.Stash && this.mode === sdk.itemmode.inStorage;
    }
  },
  isRuneword: {
    get() {
      if (this.type !== sdk.unittype.Item) return false;
      return !!this.getFlag(0x4000000);
    }
  },
  isQuestItem: {
    get() {
      return this.itemType === sdk.itemtype.quest ||
        [sdk.items.KhalimsFlail, sdk.items.KhalimsWill, sdk.items.IncompleteStaff, sdk.items.FinishedStaff, sdk.items.ViperAmulet].includes(this.classid);
    }
  }
});

removeExistingProp(me, {
  highestAct: {
    get: function () {
      let acts = [true,
        me.getQuest(sdk.quests.AbleToGotoActII, 0),
        me.getQuest(sdk.quests.AbleToGotoActIII, 0),
        me.getQuest(sdk.quests.AbleToGotoActIV, 0),
        me.getQuest(sdk.quests.AbleToGotoActV, 0)];

      let index = acts.findIndex(i => !i); // find first false, returns between 1 and 5
      return index == -1 ? 5 : index;
    }
  },
  staminaDrainPerSec: { // stamina drain per second when running
    get: function () {
      var bonusReduction = me.getStat(sdk.stats.Staminarecoverybonus) as number;
      var armorMalusReduction = 0; // TODO
      return 25 * Math.max(40 * (1 + armorMalusReduction / 10) * (100 - bonusReduction) / 100, 1) / 256;
    }
  },
  staminaTimeLeft: { // seconds before I run out of stamina with current stamina (assuming we are running)
    get: function () {
      return me.stamina / me.staminaDrainPerSec;
    }
  },
  staminaMaxDuration: { // seconds before I run out of stamina when at max (assuming we are running)
    get: function () {
      return me.staminamax / me.staminaDrainPerSec;
    }
  },
});

if (!Object.setPrototypeOf) {
  // Only works in Chrome and FireFox, does not work in IE:
  Object.defineProperty(Object.prototype, 'setPrototypeOf', {
    value: function (obj, proto) {
      // @ts-ignore
      if (obj.__proto__) {
        // @ts-ignore
        obj.__proto__ = proto;
        return obj;
      } else {
        // If you want to return prototype of Object.create(null):
        var Fn = function () {
          for (var key in obj) {
            Object.defineProperty(this, key, {
              value: obj[key],
            });
          }
        };
        Fn.prototype = proto;
        return new Fn();
      }
    },
    enumerable: false,
  })
}

if (!Object.values) {
  Object.values = function (source: object) {
    return Object.keys(source).map(k => source[k]);
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is#polyfill
// @ts-ignore
if (!Object.is) {
  Object.defineProperty(Object, "is", {
    value: function (x, y) {
      // SameValue algorithm
      if (x === y) {
        // return true if x and y are not 0, OR
        // if x and y are both 0 of the same sign.
        // This checks for cases 1 and 2 above.
        return x !== 0 || 1 / x === 1 / y;
      } else {
        // return true if both x AND y evaluate to NaN.
        // The only possibility for a variable to not be strictly equal to itself
        // is when that variable evaluates to NaN (example: Number.NaN, 0/0, NaN).
        // This checks for case 3.
        return x !== x && y !== y;
      }
    }
  });
}


Array.prototype.groupBy ??= function <T, K extends (string | symbol)>(
  callback: (value: T, index: number, array: Array<T>) => K,
  thisArg?: any
): { [P in K]: T[] } {
  const obj: { [P in K]: T[] } = {} as any;
  this.forEach((value, idx, self) => {
    // Always using apply will break #private values
    const ret = thisArg ? callback.call(thisArg, value, idx, self) : callback(value, idx, self);

    (obj[ret] ??= []).push(value);
  });

  return obj;
}

Array.prototype.groupByToMap ??= function <T, K>(
  callback: (value: T, index: number, array: Array<T>) => K,
  thisArg?: any
): Map<K, Array<T>> {
  const map = new Map<K, Array<T>>();
  this.forEach((value, idx, self) => {
    // Always using apply will break #private values
    const ret = thisArg ? callback.call(thisArg, value, idx, self) : callback(value, idx, self);

    // Upsert
    const group = map.get(ret) || [];
    if (group.push(value) === 1) map.set(ret, group);

  });
  return map;
}

declare global {
  interface Set<T> {
    values(): T[]

    keys(): T[]
  }

  interface Map<K, V> {
    forEach<V, K>(predicate: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void,

    keys(): K[]

    values(): V[]

    entries(): [K, V][]
  }

  interface Array<T> {
    fill(value: number): T[]
  }
}

if (typeof Map.prototype.forEach !== "function") {
  Map.prototype.forEach = function <V, K>(predicate: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    thisArg = thisArg || this;
    for (const [key, value] of this.entries()) {
      predicate.call(thisArg, value, key, this);
    }
  };
}

// @ts-ignore
Map.prototype.keys = function <K, V>(): Iterable<K> {
  for (const [key] of this.entries()) {
    // @ts-ignore -- Old spidermonkey supports yield in normal functions, see legacy generators
    yield key;
  }
};

// @ts-ignore
Map.prototype.values = function <K, V>(): Iterable<V> {
  for (const [, value] of this.entries()) {
    // @ts-ignore -- Old spidermonkey supports yield in normal functions, see legacy generators
    yield value;
  }
};

// @ts-ignore
Set.prototype.values = Set.prototype.keys = function <K>(): Iterable<K> {
  for (const key of this.entries()) {
    // @ts-ignore -- Old spidermonkey supports yield in normal functions, see legacy generators
    yield key;
  }
};

if (typeof Set.prototype.forEach !== "function") {
  Set.prototype.forEach = function <K>(predicate: (value: K, key: K, map: Set<K>) => void, thisArg?: any): void {
    thisArg = thisArg || this;
    for (const [key, value] of this.values()) {
      predicate.call(thisArg, value, key, this);
    }
  };
}

Array.prototype.fill = function (value) {
  var O = Object(this);
  var len = parseInt(O.length, 10);
  var start = arguments[1];
  var relativeStart = parseInt(start, 10) || 0;
  var k = relativeStart < 0
    ? Math.max(len + relativeStart, 0)
    : Math.min(relativeStart, len);
  var end = arguments[2];
  var relativeEnd = end === undefined
    ? len
    : (parseInt(end) || 0);
  var final = relativeEnd < 0
    ? Math.max(len + relativeEnd, 0)
    : Math.min(relativeEnd, len);

  for (; k < final; k++) {
    O[k] = value;
  }

  return O;
};