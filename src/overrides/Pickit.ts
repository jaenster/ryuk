import {Override} from "./Override";
import {Events} from "../lib/Events";
import {PickitResult, Qualities, CharClasses, StorageLocations} from "../enums";
import {MovingPath} from "../lib/MoveTo";
import sdk from "../sdk";
import {sortInventory} from "../lib/utilities";

export function amountOfPotsNeeded() {
  const potTypes = [sdk.itemtype.healingpotion, sdk.itemtype.manapotion, sdk.itemtype.rejuvpotion];
  const hpMax = (Array.isArray(Config.HPBuffer) ? Config.HPBuffer[1] : Config.HPBuffer);
  const mpMax = (Array.isArray(Config.MPBuffer) ? Config.MPBuffer[1] : Config.MPBuffer);
  const rvMax = (Array.isArray(Config.RejuvBuffer) ? Config.RejuvBuffer[1] : Config.RejuvBuffer);
  let needed = {
    [sdk.itemtype.healingpotion]: {
      [StorageLocations.Belt]: 0,
      [StorageLocations.Inventory]: hpMax
    },
    [sdk.itemtype.manapotion]: {
      [StorageLocations.Belt]: 0,
      [StorageLocations.Inventory]: mpMax
    },
    [sdk.itemtype.rejuvpotion]: {
      [StorageLocations.Belt]: 0,
      [StorageLocations.Inventory]: rvMax
    }
  }

  if (hpMax > 0 || mpMax > 0 || rvMax > 0) {
    me.getItemsEx()
      .filter(pot => potTypes.includes(pot.itemType) && (pot.isInBelt || pot.isInInventory))
      .forEach(pot => {
        needed[pot.itemType][pot.location] -= 1;
      });
  }

  let belt = Storage.BeltSize();
  let missing = Town.checkColumns(belt);
  Config.BeltColumn.forEach((column, index) => {
    if (column === 'hp') needed[sdk.itemtype.healingpotion][StorageLocations.Belt] = missing[index];
    if (column === 'mp') needed[sdk.itemtype.manapotion][StorageLocations.Belt] = missing[index];
    if (column === 'rv') needed[sdk.itemtype.rejuvpotion][StorageLocations.Belt] = missing[index];
  });

  return needed;
};


// Additions
declare global {
  interface PickitInstance {
    pickOnPath(path: MovingPath): void

    canFit(item: ItemUnit): boolean
  }
}

let innerRecursion = 0;
Pickit.pickOnPath = function (this: PickitInstance, path) {

  // Array with the next 30 nodes
  let smallPath = [];
  for (let i = path.index + 5; i < path.length && i < path.index + 30; i++) {
    smallPath.push(path[i]);
  }

  const listModifier = function (items: ItemUnit[]) {

    const current = path[path.index];
    for (let i = 0; i < items.length; i++) {
      let item = items[i];

      // If any of the future paths are more close to this item, dont get it now
      if (smallPath.some(path => getDistance(item, current)+10 > getDistance(item, path))) {
        // console.log('Skip item, '+item.name+' for a future path');
        items.splice(i--, 1);
      } else {
        // console.log('Checking item now, '+item.name);
      }
    }
  }

  try {
    innerRecursion++;
    this.on('pickList', listModifier);
    const {x, y} = me;
    this.pickItems();

    // if the bot moved for picking items, rerun it
    if (getDistance(me, x, y) > 5 && innerRecursion < 3) {
      this.pickOnPath(path);
    }
  } finally {
    innerRecursion--;
    this.off('pickList', listModifier);
  }

};

Pickit.canFit = function (this: PickitInstance, item) {
  switch (item.itemType) {
    case sdk.itemtype.gold:
      return true;

    case sdk.itemtype.scroll:
      let tome = me.findItem(item.classid - 11, 0, StorageLocations.Inventory);
      return (tome && tome.getStat(sdk.stats.Quantity) < 20) || Storage.Inventory.CanFit(item);

    case sdk.itemtype.healingpotion:
    case sdk.itemtype.manapotion:
    case sdk.itemtype.rejuvpotion:
      let pots = amountOfPotsNeeded();
      if (pots[item.itemType][StorageLocations.Belt] > 0) {
        // this potion can go in belt
        return true;
      }
      return Storage.Inventory.CanFit(item);

    default:
      return Storage.Inventory.CanFit(item);
  }
};

new Override(Pickit, Pickit.init, function (original, notify) {
  var i, filename;

  for (i = 0; i < Config.PickitFiles.length; i += 1) {
    filename = "pickit/" + Config.PickitFiles[i];

    NTIP.OpenFile(filename, notify);
  }

  this.beltSize = Storage.BeltSize();
});


new Override(Pickit, Pickit.checkItem, function (original, unit: ItemUnit) {
  var rval = NTIP.CheckItem(unit, false, true);

  this.emit('checkItem', unit, rval);

  if ((unit.classid === 617 || unit.classid === 618) && Town.repairIngredientCheck(unit)) {
    return {
      result: PickitResult.REPAIR,
      line: null
    };
  }

  // if (CraftingSystem.checkItem(unit)) {
  //     return {
  //         result: PickitResult.CRAFTING,
  //         line: null
  //     };
  // }

  if (Cubing.checkItem(unit)) {
    return {
      result: PickitResult.CUBING,
      line: null
    };
  }

  if (Runewords.checkItem(unit)) {
    return {
      result: PickitResult.RUNEWORDS,
      line: null
    };
  }

  // If total gold is less than 10k pick up anything worth 10 gold per
  // square to sell in town.
  if (rval.result === PickitResult.NONE && Town.ignoredItemTypes.indexOf(unit.itemType) === -1 && me.gold < Town.doChoresGoldNeeded() && !unit.isQuestItem) {
    const minimumCost = me.charlvl < 10 ? 3 : 10;
    if (unit.getItemCost(1) / (unit.sizex * unit.sizey) >= minimumCost) {
      return {
        result: PickitResult.GOLD, // todo: identify item if possible to get better gold
        line: null
      };
    }
  }

  return rval;
});
new Override(Pickit, Pickit.pickItems, function (original, range = Config.PickRange, once: boolean = false) {
  var canFit,
    needMule = false;

  if (me.dead) return false;

  const pickList = getUnits(4).filter(item => (item.mode === 3 || item.mode === 5) && getDistance(me, item) <= range);
  this.emit('pickList', pickList);

  while (pickList.length > 0) {
    if (me.dead) return false;

    pickList.sort(this.sortItems);

    // Check if the item unit is still valid and if it's on ground or being dropped
    if (copyUnit(pickList[0]).x !== undefined && (pickList[0].mode === 3 || pickList[0].mode === 5) &&
      // Don't pick items behind walls/obstacles when walking
      (Pather.useTeleport() || me.inTown || !checkCollision(me, pickList[0], 0x1))) {
      // Check if the item should be picked
      const status = this.checkItem(pickList[0]);

      if (status.result !== PickitResult.NONE && this.canPick(pickList[0])) {
        canFit = this.canFit(pickList[0]);

        // Try to make room with FieldID
        if (!canFit && Config.FieldID && Town.fieldID()) {
          canFit = this.canFit(pickList[0]);
        }

        if (!canFit) {
          Town.clearBelt();
          canFit = this.canFit(pickList[0]);
        }

        if (!canFit) {
          sortInventory();
          canFit = this.canFit(pickList[0]);
        }

        // Try to make room by selling items in town
        if (!canFit) {
          // Check if any of the current inventory items can be stashed or need to be identified and eventually sold to make room
          if (this.canMakeRoom()) {
            print("ÿc7Trying to make room for " + this.itemColor(pickList[0]) + pickList[0].name);

            // Go to town and do town chores
            if (Town.visitTown()) {
              // Recursive check after going to town. We need to remake item list because gids can change.
              // Called only if room can be made so it shouldn't error out or block anything.

              return this.pickItems(range, once);
            }

            // Town visit failed - abort
            print("ÿc7Not enough room for " + this.itemColor(pickList[0]) + pickList[0].name);

            return false;
          } else {
            console.log("Cannot make room");
          }

          // Can't make room - trigger automule
          Misc.itemLogger("No room for", pickList[0]);
          print("ÿc7Not enough room for " + this.itemColor(pickList[0]) + pickList[0].name);

          needMule = true;
        }

        // Item can fit - pick it up
        if (canFit) {
          const did = this.pickItem(pickList[0], status.result, status.line);
          // If only a single item wanted to pick
          if (did && once) return true;
        }
      }
    }

    pickList.shift();
  }

  // Quit current game and transfer the items to mule
  if (needMule && AutoMule.getInfo() && AutoMule.getInfo().hasOwnProperty("muleInfo") && AutoMule.getMuleItems().length > 0) {
    scriptBroadcast("mule");
    scriptBroadcast("quit");
  }

  return true;
});
new Override(Pickit, Pickit.canMakeRoom, function (original) {
  // you can make room if you have tp tool to go to town and have some items to sell
  if (!Town.getTpTool()) {
    return false;
  }

  let items = Storage.Inventory.Compare(Config.Inventory);

  if (items) {
    return items.some(i => {
      switch (this.checkItem(i).result) {
        // you can make room if you can id item
        case PickitResult.TO_IDENTIFY:
          // you can id item if you have id tool or have gold to buy one
          return !!Town.getIdTool() || me.gold >= 100;

        // you can make room if you should sell or drop the item
        case PickitResult.NONE:
        case PickitResult.GOLD:
          return true;

        // you can make room if you can stash the item
        default:
          return Town.canStash(i);
      }
    })
  }

  return false;
});
new Override(Pickit, Pickit.pickItem, function (original, unit, status: PickitResult, keptLine) {
  function ItemStats(unit) {
    const self: any = this; // to avoid an inline class
    self.ilvl = unit.ilvl;
    self.type = unit.itemType;
    self.classid = unit.classid;
    self.name = unit.name;
    self.color = Pickit.itemColor(unit);
    self.gold = unit.getStat(14);
    // this.useTk = Config.UseTelekinesis && me.classid === 1 && me.getSkill(43, 1) && (this.type === 4 || this.type === 22 || (this.type > 75 && this.type < 82)) &&
    //     getDistance(me, unit) > 5 && getDistance(me, unit) < 20 && !checkCollision(me, unit, 0x4);

    const canTk = me.classid === 1 && me.getSkill(43, 1) && (this.type === 4 || this.type === 22 || (this.type > 75 && this.type < 82)) &&
      getDistance(me, unit) > 5 && getDistance(me, unit) < 20 && !checkCollision(me, unit, 0x4);

    // Use tk if we have it _and_ can cast it
    self.useTk = canTk && ((me.mp * 100 / me.mpmax) > 50);
    self.picked = false;
  }

  let item: ItemUnit;
  var i, tick, gid, stats,
    cancelFlags = [0x01, 0x08, 0x14, 0x0c, 0x19, 0x1a],
    itemCount = me.itemcount;

  if (unit.gid) {
    gid = unit.gid;
    item = getUnit(4, -1, -1, gid);
  }

  if (!item) {
    return false;
  }

  for (i = 0; i < cancelFlags.length; i += 1) {
    if (getUIFlag(cancelFlags[i])) {
      delay(500);
      me.cancel(0);

      break;
    }
  }

  stats = new ItemStats(item);

  MainLoop:
    for (i = 0; i < 3; i += 1) {
      if (!getUnit(4, -1, -1, gid)) {
        break MainLoop;
      }

      if (me.dead) {
        return false;
      }

      while (!me.idle) {
        delay(40);
      }

      if (item.mode !== 3 && item.mode !== 5) {
        break MainLoop;
      }

      if (stats.useTk) {
        Skill.cast(43, 0, item);
      } else {
        if (getDistance(me, item) > (Config.FastPick === 2 && i < 1 ? 6 : 4) || checkCollision(me, item, 0x1)) {
          if (Pather.useTeleport()) {
            Pather.moveToUnit(item);
          } else if (!Pather.moveTo(item.x, item.y, 0)) {
            continue MainLoop;
          }
        }

        if (Config.FastPick < 2) {
          Misc.click(0, 0, item);
        } else {
          sendPacket(1, 0x16, 4, 0x4, 4, item.gid, 4, 0);
        }
      }

      tick = getTickCount();

      while (getTickCount() - tick < 1000) {
        item = copyUnit(item);

        if (stats.classid === 523) {
          if (!item.getStat(14) || item.getStat(14) < stats.gold) {
            print("ÿc7Picked up " + stats.color + (item.getStat(14) ? (item.getStat(14) as number - stats.gold) : stats.gold) + " " + stats.name);

            this.emit('pickedItem', item, status);
            return true;
          }
        }

        if (item.mode !== 3 && item.mode !== 5) {
          switch (stats.classid) {
            case 543: // Key
              print("ÿc7Picked up " + stats.color + stats.name + " ÿc7(" + Town.checkKeys() + "/12)");

              return true;
            case 529: // Scroll of Town Portal
            case 530: // Scroll of Identify
              print("ÿc7Picked up " + stats.color + stats.name + " ÿc7(" + Town.checkScrolls(stats.classid === 529 ? "tbk" : "ibk") + "/20)");

              this.emit('pickedItem', item, status);
              return true;
          }

          break MainLoop;
        }

        delay(20);
      }

      // TK failed, disable it
      stats.useTk = false;

      //print("pick retry");
    }

  stats.picked = me.itemcount > itemCount || !!me.getItem(-1, -1, gid);

  if (stats.picked) {
    DataFile.updateStats("lastArea");

    switch (status) {
      case PickitResult.TO_IDENTIFY:
      case PickitResult.NONE:
        break;
      case PickitResult.PICKIT:
        print("ÿc7Picked up " + stats.color + stats.name + " ÿc0(ilvl " + stats.ilvl + (keptLine ? ") (" + keptLine + ")" : ")"));

        if (this.ignoreLog.indexOf(stats.type) === -1) {
          Misc.itemLogger("Kept", item);
          Misc.logItem("Kept", item, keptLine);
        }

        break;
      case PickitResult.CUBING:
        print("ÿc7Picked up " + stats.color + stats.name + " ÿc0(ilvl " + stats.ilvl + ")" + " (Cubing)");
        Misc.itemLogger("Kept", item, "Cubing " + me.findItems(item.classid).length);
        Misc.logItem("Kept for cubing", item, keptLine);
        Cubing.update();

        break;
      case PickitResult.RUNEWORDS:
        print("ÿc7Picked up " + stats.color + stats.name + " ÿc0(ilvl " + stats.ilvl + ")" + " (Runewords)");
        Misc.itemLogger("Kept", item, "Runewords");
        Misc.logItem("Kept for runewords", item, keptLine);
        Runewords.update(stats.classid, gid);

        break;
      // case PickitResult.CRAFTING: // Crafting System
      //     print("ÿc7Picked up " + stats.color + stats.name + " ÿc0(ilvl " + stats.ilvl + ")" + " (Crafting System)");
      //     CraftingSystem.update(item);
      //
      //     break;
      default:
        print("ÿc7Picked up " + stats.color + stats.name + " ÿc0(ilvl " + stats.ilvl + (keptLine ? ") (" + keptLine + ")" : ")"));

        break;
    }
    this.emit('pickedItem', item, status);
  }

  return true;
});
new Override(Pickit, Pickit.itemQualityToName, function (original, quality) {
  var qualNames = ["", "lowquality", "normal", "superior", "magic", "set", "rare", "unique", "crafted"];

  return qualNames[quality];
});
new Override(Pickit, Pickit.itemColor, function (original, unit, type) {
  if (type === undefined) {
    type = true;
  }

  if (type) {
    switch (unit.itemType) {
      case 4: // gold
        return "ÿc4";
      case 74: // runes
        return "ÿc8";
      case 76: // healing potions
        return "ÿc1";
      case 77: // mana potions
        return "ÿc3";
      case 78: // juvs
        return "ÿc;";
    }
  }

  switch (unit.quality) {
    case 4: // magic
      return "ÿc3";
    case 5: // set
      return "ÿc2";
    case 6: // rare
      return "ÿc9";
    case 7: // unique
      return "ÿc4";
    case 8: // crafted
      return "ÿc8";
  }

  return "ÿc0";
});
new Override(Pickit, Pickit.canPick, function (original, unit) {
  if (unit.isQuestItem && me.getItem(unit.classid)) {
    return false;
  }

  switch (unit.itemType) {
    case 4: // Gold
      if (me.getStat(14) === (me.getStat(12) as number) * 10000) { // Check current gold vs max capacity (cLvl*10000)
        return false; // Skip gold if full
      }

      break;
    case 41: // Key (new 26.1.2013)
      if (me.classid === CharClasses.Assassin) { // Assassins don't ever need keys
        return false;
      }

      let myKeys = me.getItemsEx()
        .filter(i => i.isInInventory && i.classid === sdk.items.key)
        .reduce((sum, keyStack) => sum + (keyStack.getStat(sdk.stats.Quantity) as number), 0);
      let keys = getUnit(sdk.unittype.Item, -1, -1, unit.gid).getStat(sdk.stats.Quantity) as number;
      if ((myKeys + keys) > 12) {
        return false;
      }

      break;
    case 82: // Small Charm
    case 83: // Large Charm
    case 84: // Grand Charm
      let found = me.getItemsEx()
        .filter(i => i.isInInventory && i.classid === unit.classid && i.quality === Qualities.Unique)
        .first()
      if (found) {
        return false;
      }

      break;

    case sdk.itemtype.healingpotion:
    case sdk.itemtype.manapotion:
    case sdk.itemtype.rejuvpotion:
      let pots = amountOfPotsNeeded();
      return pots[unit.itemType][StorageLocations.Belt] + pots[unit.itemType][StorageLocations.Inventory] > 0;

    case undefined: // Yes, it does happen
      print("undefined item (!?)");

      return false;
  }

  return true;
});

new Override(Pickit, Pickit.checkBelt, function (original,) {
  // potions in belt does not have y position (always 0)
  // potions position is x only, from bottom left to top right
  /*
  12  13  14  15
   8   9  10  11
   4   5   6   7
   0   1   2   3
  */

  // this function returns true if belt has a potion at bottom in each column (0 to 3)

  return me.getItemsEx(-1, StorageLocations.Belt)
    .filter(i => i.x < 4)
    .length === 4;
});
new Override(Pickit, Pickit.sortItems, function (original, unitA, unitB) {
  return getDistance(me, unitA) - getDistance(me, unitB);
});
new Override(Pickit, Pickit.sortFastPickItems, function (original, unitA, unitB) {
  if (unitA.itemType === 74 || unitA.quality === 7) {
    return -1;
  }

  if (unitB.itemType === 74 || unitB.quality === 7) {
    return 1;
  }

  return getDistance(me, unitA) - getDistance(me, unitB);
});

new Override(Pickit, Pickit.fastPick, function (original,) {
  var item, gid, status,
    itemList = [];

  while (this.gidList.length > 0) {
    gid = this.gidList.shift();
    item = getUnit(4, -1, -1, gid);

    if (item && (item.mode === 3 || item.mode === 5) && (Town.ignoredItemTypes.indexOf(item.itemType) === -1 || (item.itemType >= 76 && item.itemType <= 78)) && item.itemType !== 4 && getDistance(me, item) <= Config.PickRange) {
      itemList.push(copyUnit(item));
    }
  }

  while (itemList.length > 0) {
    itemList.sort(this.sortFastPickItems);

    item = copyUnit(itemList.shift());

    // Check if the item unit is still valid
    if (item.x !== undefined) {
      status = this.checkItem(item);

      if (status.result && this.canPick(item) && (Storage.Inventory.CanFit(item) || [4, 22, 76, 77, 78].indexOf(item.itemType) > -1)) {
        this.pickItem(item, status.result, status.line);
      }
    }
  }

  return true;
});

// Add events to pickit
Object.keys(Events.prototype).forEach(key => Pickit[key] = Events.prototype[key]);
