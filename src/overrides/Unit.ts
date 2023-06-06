import {Override, removeExistingProp} from "./Override";
import sdk from "../sdk";
import {findSpotOrClear, sortInventory} from "../lib/utilities";
import {MonsterModes, SpecType} from "../enums";
import MonsterData from "../lib/data/MonsterData";
import _missiles from "../lib/data/MissileData";

// @ts-ignore // openMenu isn't defined on the unit, as its a npc(aka monster) only function
new Override(Unit.prototype, Unit.prototype.openMenu, function (original, addDelay = 0) {
  // if (Config.PacketShopping) {
  //     return Packet.openMenu(this);
  // }

  if (this.type !== 1) throw new Error("Unit.openMenu: Must be used on NPCs.");

  if (getUIFlag(sdk.uiflags.NPCMenu)) {

  }

  var i, tick;

  BigLoop:
    for (i = 0; i < 5; i += 1) {
      if (getDistance(me, this) > 4) {
        Pather.moveToUnit(this);
      }

      Misc.poll(() => {
        Misc.click(0, 0, this);
        return getIsTalkingNPC() || getUIFlag(0x08);
      })

      tick = getTickCount();

      while (getTickCount() - tick < 1500) {
        if (getIsTalkingNPC()) break;

        if (getUIFlag(0x08)) {
          delay(Math.max(700 + me.ping, 500 + me.ping * 2 + addDelay * 500));

          return true;
        }

        if (getInteractedNPC() && getTickCount() - tick > 1000) {
          me.cancel();
        }

        delay(100);
      }
      if (getIsTalkingNPC()) {
        me.cancel();
        continue;
      }

      sendPacket(1, 0x2f, 4, 1, 4, this.gid);
      delay(me.ping * 2 + 1);
      sendPacket(1, 0x30, 4, 1, 4, this.gid);
      delay(me.ping * 2 + 1);
    }

  return false;
});

(Unit.prototype as ItemUnit).getColor = function () {
  var i, colors,
    Color = {
      black: 3,
      lightblue: 4,
      darkblue: 5,
      crystalblue: 6,
      lightred: 7,
      darkred: 8,
      crystalred: 9,
      darkgreen: 11,
      crystalgreen: 12,
      lightyellow: 13,
      darkyellow: 14,
      lightgold: 15,
      darkgold: 16,
      lightpurple: 17,
      orange: 19,
      white: 20
    };

  // check type
  if ([2, 3, 15, 16, 19, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 42, 43, 44, 67, 68, 71, 72, 85, 86, 87, 88].indexOf(this.itemType) === -1) {
    return -1;
  }

  // check quality
  if ([4, 5, 6, 7].indexOf(this.quality) === -1) {
    return -1;
  }

  if (this.quality === 4 || this.quality === 6) {
    colors = {
      "Screaming": Color.orange,
      "Howling": Color.orange,
      "Wailing": Color.orange,
      "Sapphire": Color.lightblue,
      "Snowy": Color.lightblue,
      "Shivering": Color.lightblue,
      "Boreal": Color.lightblue,
      "Hibernal": Color.lightblue,
      "Ruby": Color.lightred,
      "Amber": Color.lightyellow,
      "Static": Color.lightyellow,
      "Glowing": Color.lightyellow,
      "Buzzing": Color.lightyellow,
      "Arcing": Color.lightyellow,
      "Shocking": Color.lightyellow,
      "Emerald": Color.crystalgreen,
      "Saintly": Color.darkgold,
      "Holy": Color.darkgold,
      "Godly": Color.darkgold,
      "Visionary": Color.white,
      "Mnemonic": Color.crystalblue,
      "Bowyer's": Color.lightgold,
      "Gymnastic": Color.lightgold,
      "Spearmaiden's": Color.lightgold,
      "Archer's": Color.lightgold,
      "Athlete's": Color.lightgold,
      "Lancer's": Color.lightgold,
      "Charged": Color.lightgold,
      "Blazing": Color.lightgold,
      "Freezing": Color.lightgold,
      "Glacial": Color.lightgold,
      "Powered": Color.lightgold,
      "Volcanic": Color.lightgold,
      "Blighting": Color.lightgold,
      "Noxious": Color.lightgold,
      "Mojo": Color.lightgold,
      "Cursing": Color.lightgold,
      "Venomous": Color.lightgold,
      "Golemlord's": Color.lightgold,
      "Warden's": Color.lightgold,
      "Hawk Branded": Color.lightgold,
      "Commander's": Color.lightgold,
      "Marshal's": Color.lightgold,
      "Rose Branded": Color.lightgold,
      "Guardian's": Color.lightgold,
      "Veteran's": Color.lightgold,
      "Resonant": Color.lightgold,
      "Raging": Color.lightgold,
      "Echoing": Color.lightgold,
      "Furious": Color.lightgold,
      "Master's": Color.lightgold, // there's 2x masters...
      "Caretaker's": Color.lightgold,
      "Terrene": Color.lightgold,
      "Feral": Color.lightgold,
      "Gaean": Color.lightgold,
      "Communal": Color.lightgold,
      "Keeper's": Color.lightgold,
      "Sensei's": Color.lightgold,
      "Trickster's": Color.lightgold,
      "Psychic": Color.lightgold,
      "Kenshi's": Color.lightgold,
      "Cunning": Color.lightgold,
      "Shadow": Color.lightgold,
      "Faithful": Color.white,
      "Priest's": Color.crystalgreen,
      "Dragon's": Color.crystalblue,
      "Vulpine": Color.crystalblue,
      "Shimmering": Color.lightpurple,
      "Rainbow": Color.lightpurple,
      "Scintillating": Color.lightpurple,
      "Prismatic": Color.lightpurple,
      "Chromatic": Color.lightpurple,
      "Hierophant's": Color.crystalgreen,
      "Berserker's": Color.crystalgreen,
      "Necromancer's": Color.crystalgreen,
      "Witch-hunter's": Color.crystalgreen,
      "Arch-Angel's": Color.crystalgreen,
      "Valkyrie's": Color.crystalgreen,
      "Massive": Color.darkgold,
      "Savage": Color.darkgold,
      "Merciless": Color.darkgold,
      "Ferocious": Color.black,
      "Grinding": Color.white,
      "Cruel": Color.black,
      "Gold": Color.lightgold,
      "Platinum": Color.lightgold,
      "Meteoric": Color.lightgold,
      "Strange": Color.lightgold,
      "Weird": Color.lightgold,
      "Knight's": Color.darkgold,
      "Lord's": Color.darkgold,
      "Fool's": Color.white,
      "King's": Color.darkgold,
      //"Master's": Color.darkgold,
      "Elysian": Color.darkgold,
      "Fiery": Color.darkred,
      "Smoldering": Color.darkred,
      "Smoking": Color.darkred,
      "Flaming": Color.darkred,
      "Condensing": Color.darkred,
      "Septic": Color.darkgreen,
      "Foul": Color.darkgreen,
      "Corrosive": Color.darkgreen,
      "Toxic": Color.darkgreen,
      "Pestilent": Color.darkgreen,
      "of Quickness": Color.darkyellow,
      "of the Glacier": Color.darkblue,
      "of Winter": Color.darkblue,
      "of Burning": Color.darkred,
      "of Incineration": Color.darkred,
      "of Thunder": Color.darkyellow,
      "of Storms": Color.darkyellow,
      "of Carnage": Color.black,
      "of Slaughter": Color.black,
      "of Butchery": Color.black,
      "of Evisceration": Color.black,
      "of Performance": Color.black,
      "of Transcendence": Color.black,
      "of Pestilence": Color.darkgreen,
      "of Anthrax": Color.darkgreen,
      "of the Locust": Color.crystalred,
      "of the Lamprey": Color.crystalred,
      "of the Wraith": Color.crystalred,
      "of the Vampire": Color.crystalred,
      "of Icebolt": Color.lightblue,
      "of Nova": Color.crystalblue,
      "of the Mammoth": Color.crystalred,
      "of Frost Shield": Color.lightblue,
      "of Nova Shield": Color.crystalblue,
      "of Wealth": Color.lightgold,
      "of Fortune": Color.lightgold,
      "of Luck": Color.lightgold,
      "of Perfection": Color.darkgold,
      "of Regrowth": Color.crystalred,
      "of Spikes": Color.orange,
      "of Razors": Color.orange,
      "of Swords": Color.orange,
      "of Stability": Color.darkyellow,
      "of the Colosuss": Color.crystalred,
      "of the Squid": Color.crystalred,
      "of the Whale": Color.crystalred,
      "of Defiance": Color.darkred,
      "of the Titan": Color.darkgold,
      "of Atlas": Color.darkgold,
      "of Wizardry": Color.darkgold
    };

    switch (this.itemType) {
      case 15: // boots
        colors["of Precision"] = Color.darkgold;

        break;
      case 16: // gloves
        colors["of Alacrity"] = Color.darkyellow;
        colors["of the Leech"] = Color.crystalred;
        colors["of the Bat"] = Color.crystalred;
        colors["of the Giant"] = Color.darkgold;

        break;
    }
  } else if (this.quality === 5) { // Set
    if (this.getFlag(0x10)) {
      for (i = 0; i < 127; i += 1) {
        if (this.fname.split("\n").reverse()[0].indexOf(getBaseStat("setitems", i, "index")) > -1) {
          return (getBaseStat("setitems", i, "invtransform") as number) > 20 ? -1 : getBaseStat("setitems", i, "invtransform");
        }
      }
    } else {
      return Color.lightyellow; // Unidentified set item
    }
  } else if (this.quality === 7) { // Unique
    for (i = 0; i < 401; i += 1) {
      if (this.code === (getBaseStat("uniqueitems", i, "code") as string).replace(/^\s+|\s+$/g, "") && this.fname.split("\n").reverse()[0].indexOf(getBaseStat("uniqueitems", i, "index")) > -1) {
        return (getBaseStat("uniqueitems", i, "invtransform") as number) > 20 ? -1 : getBaseStat("uniqueitems", i, "invtransform");
      }
    }
  }

  for (i = 0; i < this.suffixes.length; i += 1) {
    if (colors.hasOwnProperty(this.suffixes[i])) {
      return colors[this.suffixes[i]];
    }
  }

  for (i = 0; i < this.prefixes.length; i += 1) {
    if (colors.hasOwnProperty(this.prefixes[i])) {
      return colors[this.prefixes[i]];
    }
  }

  return -1;
};

Object.defineProperty(Unit.prototype, 'itemclass', {
  get() {
    if (getBaseStat("items", this.classid, 'code') === undefined) {
      return 0;
    }

    if (getBaseStat("items", this.classid, 'code') === getBaseStat("items", this.classid, 'ultracode')) {
      return 2;
    }

    if (getBaseStat("items", this.classid, 'code') === getBaseStat("items", this.classid, 'ubercode')) {
      return 1;
    }

    return 0;
  }
});

// @ts-ignore
Unit.prototype.equip = function (destLocation: number | number[] = undefined, item: ItemUnit) {
  if (!item && this.type === 4) item = this;
  if (this.type === 1 && me.getMerc()?.gid !== this.gid) throw new TypeError('Cant equip an item on a monster');
  if (this.type === 0 && me !== this) throw new TypeError('Can only equip on yourself');
  if (this.type > 1 && this.type !== 4) throw new TypeError('Invalid unit to call equip on')
  if (!item) throw new TypeError('No item to equip')

  let targetUnit = this.type === 1 ? me.getMerc() : me;
  sortInventory();
  if (this.type === 1) console.debug('Merc equipping');
  if (this.type !== 1) console.debug('personal equiping');

  // click on a merc, its location 4 with body loc
  let button = this.type === sdk.unittype.Monsters ? 4 : 0;
  if (item.isEquipped) {
    return true;
  }

  // Not an item, or unidentified, or not enough stats
  if (item.type !== sdk.unittype.Item
    || !item.identified
    || item.getStat(sdk.stats.Levelreq) > targetUnit.getStat(12)
    || item.dexreq > targetUnit.getStat(2)
    || item.strreq > targetUnit.getStat(0)) {
    console.debug('Cannot wear item?');
    return false;
  }

  // If not a specific location is given, figure it out (can be useful to equip a double weapon)
  if (!destLocation) {
    destLocation = item.getBodyLoc();
  }

  // If destLocation isnt an array, make it one
  if (!Array.isArray(destLocation)) destLocation = [destLocation]


  console.debug('equiping ' + item.name);
  // console.debug(targetUnit.getItemsEx().map(i => i.fname));

  const loc = (destLocation as number[]);
  const currentEquiped = targetUnit.getItemsEx()
    .filter(i => i.isEquipped)
    .filter(checkItem => {
      // If its the right spot, give it bcak
      if (loc.includes(checkItem.bodylocation)) return true;

      // In the weird case, we want to equip, or unequip a twohanded item
      if ((checkItem.twoHanded || item.twoHanded) && loc.includes(sdk.body.LeftArm) && loc.includes(sdk.body.RightArm)) {
        return checkItem.bodylocation === sdk.body.RightArm || checkItem.bodylocation === sdk.body.LeftArm;
      }

      return false;
    })
    .sort((a, b) => b.bodylocation - a.bodylocation)

  // if nothing is equipped at the moment, just equip it
  if (!currentEquiped.length) {
    console.debug('Just equip');
    clickItemAndWait(0, item);
    clickItemAndWait(button, loc.first());
  } else { // unequip / swap items
    currentEquiped.forEach((other, index) => {

      // Last item, so swap instead of putting off first
      console.debug(index, currentEquiped.length - 1);
      if (index === (currentEquiped.length - 1)) {
        console.debug('swap ' + item.name + ' for ' + other.name);
        let oldLoc = {x: item.x, y: item.y, location: item.location};
        clickItemAndWait(0, item);

        // Custom behaviour for mercs, d2bs only reads these item properties properly if you read them all before picking from a merc.
        // the quickest way for reading an entire item, is
        if (this.type === 1) JSON.stringify(other);
        clickItemAndWait(button, loc.first()); // the swap of items

        Storage.Reload();
        // Find a spot for the current item
        let spot = findSpotOrClear(other, true);

        if (!spot) { // If no spot is found for the item, rollback
          // clickItemAndWait(button, loc.first()); // swap again
          // clickItemAndWait(0, oldLoc.x, oldLoc.y, oldLoc.location); // put item back on old spot
          other.drop();
          throw Error('cant find spot for unequipped item, dropped it');
        }

        clickItemAndWait(0, spot.x, spot.y, Storage.Inventory.location); // put item on the found spot
        return;
      }

      console.debug('Unequip item first ' + item.name);
      // Incase multiple items are equipped
      let spot = findSpotOrClear(item, true); // Find a spot for the current item

      if (!spot) {
        item.drop();
        throw Error('cant find spot for unequipped item, dropped it');
      }

      clickItemAndWait(button, item.bodylocation);
      clickItemAndWait(0, spot.x, spot.y, Storage.Inventory.location);
    });
  }

  return {
    success: item.bodylocation === destLocation.first(),
    unequiped: currentEquiped,
    rollback: () => currentEquiped.forEach(item => item.equip()) // Note; rollback only works if you had other items equipped before.
  };
};

(Unit.prototype as Monster).startTrade = function (mode) {
  // if (Config.PacketShopping) {
  //     return Packet.startTrade(this, mode);
  // }

  if (this.type !== 1) {
    throw new Error("Unit.startTrade: Must be used on NPCs.");
  }

  if (getUIFlag(0x0C)) {
    return true;
  }

  const getMenuId = () => {
    const npc = getInteractedNPC();
    if (!npc) return 0;
    switch(npc.classid) {
      case sdk.monsters.Charsi:
      case sdk.monsters.Fara:
      case sdk.monsters.Hratli:
      case sdk.monsters.Halbu:
      case sdk.monsters.Larzuk:
        return sdk.menu.TradeRepair;
      case sdk.monsters.Gheed:
      case sdk.monsters.Elzix:
      case sdk.monsters.Alkor:
      case sdk.monsters.Jamella:
      case sdk.monsters.Anya:
        return mode === 'Gamble' ? sdk.menu.Gabmle : sdk.menu.Trade
    }
    return sdk.menu.Trade;
  };


  var i, tick,
    menuId = mode === "Gamble" ? 0x0D46 : mode === "Repair" ? 0x0D06 : 0x0D44;

  for (i = 0; i < 3; i += 1) {
    if (this.openMenu(i)) { // Incremental delay on retries
      Misc.useMenu(getMenuId());

      if (Misc.poll(() => getUIFlag(sdk.uiflags.Shop) && this.itemcount > 0, 1000, 25)) {
        return true;
      }

      console.log('Retry interacting with NPC');
      me.cancel();
    }
  }

  return false;
};

// Fix annoying bug in d2bs, if a unit has no actual items to return, it returns the *function* getItems. Solve that by returning an empty array
(original => {
  Unit.prototype.getItemsEx = function (...args) {
    const result = original.apply(this, args);
    if (!Array.isArray(result)) return [];
    return result;
  }
})(Unit.prototype.getItems);


(Unit.prototype as ItemUnit).sellOrDrop = function (log = true) {
  const npc = getInteractedNPC() || undefined;
  const inShop = getUIFlag(0xC) || (Config.PacketShopping && npc && npc.itemcount > 0);

  if (inShop) {
    log && Misc.itemLogger("Sold", this);
    this.sell();
  } else if (this.itemType >= sdk.itemtype.healingpotion && this.itemType <= sdk.itemtype.thawingpotion) {
    log && Misc.itemLogger('Drank', this);
    this.interact();
  } else {
    log && Misc.itemLogger("Dropped", this);
    this.drop();
  }
};

new Override(me, me.findItems, function (original, ...args) {
  let items = original.apply(this, args);
  return items || [];
});

removeExistingProp((Unit.prototype as Monster), {
  isChampion: {
    get(): boolean {
      return (this.spectype & SpecType.Champion) > 0;
    },
    enumerable: true
  },
  isUnique: {
    get(): boolean {
      return (this.spectype & SpecType.Unique) > 0;
    },
    enumerable: true
  },
  isMinion: {
    get(): boolean {
      return (this.spectype & SpecType.Minion) > 0;
    },
    enumerable: true
  },
  isSuperUnique: {
    get(): boolean {
      return (this.spectype & (SpecType.Super | SpecType.Unique)) > 0;
    },
    enumerable: true
  },
  isSpecial: {
    get(): boolean {
      return this.isChampion || this.isUnique || this.isSuperUnique;
    },
    enumerable: true
  },
  isWalking: {
    get(): boolean {
      return this.mode === MonsterModes.Walking && (this.targetx !== this.x || this.targety !== this.y);
    }
  },
  isRunning: {
    get(): boolean {
      return this.mode === MonsterModes.Running && (this.targetx !== this.x || this.targety !== this.y);
    }
  },
  isMoving: {
    get(): boolean {
      return this.isWalking || this.isRunning;
    },
    enumerable: true
  },
  isChilled: {
    get(): boolean {
      return this.getState(sdk.states.Frozen);
    },
    enumerable: true
  },
  isFrozen: {
    get(): boolean {
      return this.getState(sdk.states.FrozenSolid);
    },
    enumerable: true
  },
  currentVelocity: {
    get(): number {
      if (!this.isMoving) {
        return 0;
      }
      if (this.isFrozen) {
        return 0;
      }
      let velocity = this.isRunning ? MonsterData[this.classid].Run : MonsterData[this.classid].Velocity;
      if (this.isChilled) {
        let malus = MonsterData[this.classid].ColdEffect;
        if (malus > 0) {
          malus = malus - 256;
        }
        return Math.max(1, ~~(velocity * (1 + malus)));
      }
      return velocity;
    }
  }
});


(Unit.prototype as Missile).hits = function (position: PathNode) {
  if (!this || !this.x) {
    return false;
  }
  let data = _missiles[this.classid];
  if (!data) {
    return false;
  }
  let sizeShift = data.size - 1;
  if (sizeShift === 0) {
    return this.x === position.x && this.y === position.y;
  }
  return this.x >= position.x - sizeShift && this.x <= position.x + sizeShift && this.y >= position.y - sizeShift && this.y <= position.y + sizeShift;
};

/*
new Override(Unit.prototype, Unit.prototype.getStat, function (original, id, subid, extra) {
    if (this.type === 4) {
        if ((this as ItemUnit).isRuneword) {
            return original(id, subid, 0xAB);
        }
    }
    return original(id, subid, extra);
});
*/