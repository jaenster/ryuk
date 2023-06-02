import {Override} from "./Override";
import sdk from "../sdk";
import {PickitResult, StorageLocations} from "../enums";
import {Events} from "../lib/Events";
import {sortInventory} from "../lib/utilities";
import {AutoRunewords} from "../lib/AutoRuneword";
import {getWp, getWpPreset, gotoWp, talkTo} from "../scripts/util";

// Additions
declare global {
    interface TownInstance {
        doChoresGoldNeeded(): number

        buyPotionsPrice(): number

        buyStaminaPotions(): void

        getIdTool(): ItemUnit | null

        getTpTool(): ItemUnit | null

        staminaPotions(): { count: number, totalNeeded: number, needed: number }
    }
}

Town.staminaPotions = function (this: TownInstance) {
    let count = me.findItems(sdk.items.staminapotion, 0, StorageLocations.Inventory).length;
    let needed = ~~(50 / me.staminaMaxDuration);
    return {
        count,
        totalNeeded: needed,
        needed: Math.max(0, needed - count)
    }
};

Town.getIdTool = function (this: TownInstance) {
    const scroll = me.getItemsEx().find(i => i.isInInventory && i.classid === sdk.items.idScroll);
    const tome = me.getItemsEx().find(i => i.isInInventory && i.classid === sdk.items.idtome);
    if (scroll) {
        return scroll;
    }
    if (tome && tome.getStat(sdk.stats.Quantity) > 0) {
        return tome;
    }
    return null;
};

Town.getTpTool = function (this: TownInstance) {
    const scroll = me.getItemsEx().filter(i => i.isInInventory && i.classid === sdk.items.tpScroll).first();
    const tome = me.getItemsEx().filter(i => i.isInInventory && i.classid === sdk.items.tptome).first();
    if (scroll) {
        return scroll;
    }
    if (tome && tome.getStat(sdk.stats.Quantity) > 0) {
        return tome;
    }
    return null;
};

Town.doChoresGoldNeeded = function (this: TownInstance) {
    var low = false;
    var total = 0;

    // TODO: take lower merchant prices stat into account, sdk.stats.Goldbonus
    const TPTomePrice = 450;
    const IDTomePrice = 280;
    const TPScrollPrice = 100;
    const IDScrollPrice = 80;

    var tomes = [
        {id: sdk.items.tptome, price: TPTomePrice, scrollPrice: TPScrollPrice, defaultQuantity: 4},
        {id: sdk.items.idtome, price: IDTomePrice, scrollPrice: IDScrollPrice, defaultQuantity: 2}
    ];

    // you are low in gold if you don't have and can't buy tome or can't refill it
    for (var tome of tomes) {
        //TODO : maybe we have tome elsewhere, should we use it ? what if we are doing cow level with tp tome ?
        var have = me.findItem(tome.id, sdk.itemmode.inStorage, sdk.storage.Inventory);
        let missing = have ? 20 - have.getStat(sdk.stats.Quantity) : tome.defaultQuantity;
        let price = missing * tome.scrollPrice + (have ? 0 : tome.price);
        total += price;
        if (me.gold < price) {
            low = true;
        }
    }


    // you are low in gold if you can't buy potions you need to fill belt and buffer
    let missingPotsInBelt = Town.checkColumns(Storage.BeltSize()).reduce((acc, c) => acc + c, 0);
    //TODO: get price of each pot type that should go in belt, for now easy calculation
    let price = missingPotsInBelt * 450; // price of greater mana potion
    total += price;
    if (me.gold < price) {
        low = true;
    }


    // you are low in gold if you can't repair
    var repairCost = me.getRepairCost();
    total += repairCost;
    if (me.gold < repairCost) {
        low = true;
    }

    // you are low in gold if you can't revive merc
    var mercCost = me.mercrevivecost;
    total += mercCost;
    if (me.gold < mercCost) {
        low = true;
    }

    return total;
}

Town.buyPotionsPrice = function (this: TownInstance) {
    const cost = {
        hp: [30, 75, 112, 225, 500],
        mp: [60, 150, 270, 450, 1000],
        rv: [0, 0, 0, 0, 0]
    };
    let act = me.diff == 0 ? me.highestAct : 5;

    let col = this.checkColumns(Storage.BeltSize());

    let beltCost = col
      .filter((v, i) => ["hp", "mp"].indexOf(Config.BeltColumn[i]) > -1)
      .reduce((acc, v, i) => acc + cost[Config.BeltColumn[i]][act - 1] * v, 0);

    let hpConfig = (Array.isArray(Config.HPBuffer) ? Config.HPBuffer[1] : Config.HPBuffer);
    let mpConfig = (Array.isArray(Config.MPBuffer) ? Config.MPBuffer[1] : Config.MPBuffer);
    let bufferCost = 0;
    if (hpConfig > 0 || mpConfig > 0) {
        const inInventory = me.getItemsEx()
          .filter(i => i.mode == sdk.itemmode.inStorage && i.location == sdk.storage.Inventory);
        let currentHPBuffer = inInventory.filter(i => i.itemType == sdk.itemtype.healingpotion).length;
        let currentMPBuffer = inInventory.filter(i => i.itemType == sdk.itemtype.manapotion).length;
        bufferCost += hpConfig - currentHPBuffer > 0 ? (hpConfig - currentHPBuffer) * cost.hp[act - 1] : 0;
        bufferCost += mpConfig - currentMPBuffer > 0 ? (mpConfig - currentMPBuffer) * cost.mp[act - 1] : 0;
    }

    return beltCost + bufferCost;
};


Town.buyStaminaPotions = function (this: TownInstance) {
    if (me.gold < 200) {
        return false;
    }

    let potions = this.staminaPotions();
    if (potions.needed < 1) {
        return false;
    }

    const npc = this.initNPC("Shop", "buyPotions");
    if (!npc) {
        return false;
    }

    let potion = npc.getItem(sdk.items.staminapotion);
    if (!potion) {
        return false;
    }

    while (potions.needed > 0 && potion.buy(false)) {
        potions = this.staminaPotions();
    }

    return true;
};


new Override(Town, Town.doChores, (original, ...args) => {
    original()
})

new Override(Town, Town.clearScrolls, function () {

    me.getItemsEx()
      .filter(i =>
        i.location === sdk.storage.Inventory &&
        i.mode === sdk.itemmode.inStorage &&
        (i.classid === sdk.items.tpScroll || i.classid === sdk.items.idScroll)
      )
      .forEach(s => {
          let tome = me.getItemsEx().find(i => i.classid === s.classid - 11 && i.mode === sdk.itemmode.inStorage && i.location === sdk.storage.Inventory);
          if (tome) {
              if (tome.getStat(sdk.stats.Quantity) < 20) {
                  if (s.toCursor()) {
                      clickItemAndWait(0, tome.x, tome.y, tome.location); // put scroll in tome
                  } else {
                      console.warn("Cant pick up scroll to place in tome");
                  }
              } else {
                  s.sellOrDrop();
              }
          } else {
              let total = me.getItemsEx().filter(i =>
                i.location === sdk.storage.Inventory &&
                i.mode === sdk.itemmode.inStorage &&
                i.classid === s.classid
              ).length;
              if (total > 2) { //ToDo; hardcode scroll to keep in inventory ?
                  s.sellOrDrop();
              }
          }
      });
    return true;
},)


new Override(Town, Town.doChores, function (original, repair?: boolean) {
    if (!me.inTown) this.goToTown();
    if (me.act === 2 && getDistance(5153, 5203, me.x, me.y) < 30) {
        if (talkTo(NPC.Warriv, false)) {
            Misc.useMenu(sdk.menu.GoWest);
            Misc.poll(() => me.area === 1);
        }
    }

    let i, cancelFlags = [0x01, 0x02, 0x04, 0x08, 0x14, 0x16, 0x0c, 0x0f, 0x19, 0x1a];

    Attack.weaponSwitch(Attack.getPrimarySlot());

    this.heal();
    this.identify();
    AutoRunewords.makeRunewords();
    Item.autoEquip();
    this.clearInventory();
    this.buyPotions();
    this.buyStaminaPotions();
    this.fillTome(sdk.items.tptome);
    this.fillTome(sdk.items.idtome);
    this.buyKeys();
    sortInventory();

    this.shopItems();
    this.clearInventory();
    this.repair(repair);
    this.reviveMerc();
    AutoRunewords.makeRunewords();
    Item.autoEquip();

    this.gamble();
    Cubing.doCubing();
    AutoRunewords.makeRunewords();
    Item.autoEquip();
    this.stash(true);
    this.clearInventory();

    for (i = 0; i < cancelFlags.length; i += 1) {
        if (getUIFlag(cancelFlags[i])) {
            delay(500);
            me.cancel();

            break;
        }
    }

    me.cancel();

    return true;
});

new Override(Town, Town.identify, function () {
    let item, idTool, scroll, npc, timer, tpTome, result, tpTomePos = {};

    //ToDo future fix
    // this.cainID();

    let list: ItemUnit[] = (Storage.Inventory.Compare(Config.Inventory) || [])
      .filter(i => i.isInInventory && !i.identified && !this.ignoredItemTypes.includes(i.itemType));

    if (list.length === 0) {
        return false;
    }

    // Avoid unnecessary NPC visits
    // go to npc if need id or need to sell to make some gold
    let processNPC = list.some(i => [PickitResult.TO_IDENTIFY, PickitResult.GOLD].includes(Pickit.checkItem(i).result));

    if (!processNPC) {
        return false;
    }

    npc = this.initNPC("Shop", "identify");

    if (!npc) {
        return false;
    }

    idTool = this.getIdTool();
    if (!idTool) {
        this.fillTome(sdk.items.idtome);
        idTool = this.getIdTool();
    }

    const identifiedItems: [ItemUnit, { result: PickitResult, line: null | number }][] = [];
    MainLoop:
      while (list.length > 0) {
          item = list.pop();

          result = Pickit.checkItem(item);

          if (typeof result.result === 'string') {
              identifiedItems.push([item, result])
              continue;
          }

          switch (result.result) {
            // Items for gold, will sell magics, etc. w/o id, but at low levels
            // magics are often not worth iding.
              case PickitResult.GOLD:
                  Misc.itemLogger("Sold", item);
                  item.sell();

                  break;
              case PickitResult.TO_IDENTIFY:
                  if (!idTool) {
                      scroll = npc.getItem(sdk.items.idScroll);

                      if (scroll) {
                          if (!Storage.Inventory.CanFit(scroll)) {
                              tpTome = me.findItem(518, 0, 3);

                              if (tpTome) {
                                  tpTomePos = {x: tpTome.x, y: tpTome.y};

                                  console.log("selling tp tome to buy id scroll");
                                  tpTome.sell();
                                  delay(500);
                              } else {
                                  console.log("drinking pot to buy id scroll");
                                  me.getItemsEx()
                                    .filter(i => i.isInInventory && i.itemType >= sdk.itemtype.healingpotion && i.itemType <= sdk.itemtype.thawingpotion)
                                    .sort((a, b) => a.classid - b.classid)
                                    .first()?.sellOrDrop();
                              }
                          }

                          if (Storage.Inventory.CanFit(scroll)) {
                              if (!scroll.buy()) {
                                  console.log("cannot buy id scroll");
                              }
                          }
                      }

                      idTool = this.getIdTool();

                      if (!idTool) {
                          console.log("cannot find id scroll or tome");
                          break MainLoop;
                      }

                      if (!this.identifyItem(item, idTool)) {
                          console.warn("unable to id item !");
                          continue;
                      }
                  } else {
                      if (!this.identifyItem(item, idTool)) {
                          console.warn("unable to id item !");
                          continue;
                      }
                  }

                  result = Pickit.checkItem(item);

                  // If the result isnt any of the simplistic id's, annoy the event system with it
                  if (typeof result.result === 'string') {
                      identifiedItems.push([item, result])
                      break;
                  }

                  switch (result.result) {
                      case PickitResult.PICKIT:
                          // Couldn't id autoEquip item. Don't log it.

                          Misc.itemLogger("Kept", item);
                          Misc.logItem("Kept", item, result.line);

                          break;
                      case PickitResult.TO_IDENTIFY:
                          break;
                      case PickitResult.CUBING:
                          Misc.itemLogger("Kept", item, "Cubing-Town");
                          Cubing.update();

                          break;
                      case PickitResult.RUNEWORDS: // (doesn't trigger normally)
                          Misc.itemLogger("Kept for runewords", item);
                          Misc.logItem("Kept runewords", item, result.line);

                          break;

                    //ToDo fix crafting
                    // case 5: // Crafting System
                    //     Misc.itemLogger("Kept", item, "CraftSys-Town");
                    //     CraftingSystem.update(item);
                    //     break;

                      default:
                          Misc.itemLogger("Sold", item);
                          item.sell();

                          timer = getTickCount();

                          if (timer > 0 && timer < 500) {
                              delay(timer);
                          }

                          break;
                  }

                  break;
          }
          // refresh id tool for next loop
          idTool = this.getIdTool();
      }
    identifiedItems.forEach(obj => Pickit.emit('identifiedItem', ...obj));

    this.fillTome(sdk.items.tptome); // Check for TP tome in case it got sold for ID scrolls

    return true;
});

new Override(Town, Town.fieldID, function (original) { // not exactly a town function but whateva

    console.log("Field id !");

    const list = me.getItemsEx()
      .filter(i => i.isInInventory && !i.identified && Pickit.checkItem(i).result === PickitResult.TO_IDENTIFY);

    let tool = this.getIdTool();

    if (!tool) {
        return false;
    }

    const identifiedItems: [ItemUnit, { result: PickitResult, line: null | number }][] = [];
    while (list.length > 0 && tool) {
        const item = list.shift();

        this.identifyItem(item, tool);
        delay(me.ping + 1);

        const result = Pickit.checkItem(item);

        if (typeof result.result === 'string') {
            identifiedItems.push([item, result]);
        }

        switch (result.result) {
            case PickitResult.NONE:
                Misc.itemLogger("Dropped", item, "fieldID");

                if (Config.DroppedItemsAnnounce.Enable && Config.DroppedItemsAnnounce.Quality.indexOf(item.quality) > -1) {
                    say("Dropped: [" + Pickit.itemQualityToName(item.quality).charAt(0).toUpperCase() + Pickit.itemQualityToName(item.quality).slice(1) + "] " + item.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, "").trim());

                    if (Config.DroppedItemsAnnounce.LogToOOG && Config.DroppedItemsAnnounce.OOGQuality.indexOf(item.quality) > -1) {
                        Misc.logItem("Field Dropped", item, result.line);
                    }
                }

                console.log("field id - item drop " + item.fname);

                item.sellOrDrop();

                break;
            case PickitResult.PICKIT:
                Misc.itemLogger("Field Kept", item);
                Misc.logItem("Field Kept", item, result.line);

                break;
            default:
                console.log("field id result = " + result.result)
                if (result.result === PickitResult.TO_IDENTIFY) {
                    console.log("item is identified ? " + item.identified);
                }
                break;
        }

        tool = this.getIdTool(); // refresh id tool for next loop
    }
    identifiedItems.forEach(tuple => Pickit.emit('identifiedItem', ...tuple));

    delay(200);
    me.cancel();

    return true;
})


new Override(Town, Town.clearInventory, function () {
    this.checkQuestItems(); // only golden bird quest for now

    let bufferHp = Array.isArray(Config.HPBuffer) ? Config.HPBuffer : [Config.HPBuffer, Config.HPBuffer],
      bufferMp = Array.isArray(Config.MPBuffer) ? Config.MPBuffer : [Config.MPBuffer, Config.MPBuffer],
      bufferRejuv = Array.isArray(Config.RejuvBuffer) ? Config.RejuvBuffer : [Config.RejuvBuffer, Config.RejuvBuffer];

    // Return potions to belt
    this.clearBelt();

    // Cleanup remaining potions
    (function () {
        let beltSize = Storage.BeltSize();

        let potsInInventory = me.getItemsEx()
          .filter(p => p.isInInventory && [sdk.itemtype.healingpotion, sdk.itemtype.manapotion, sdk.itemtype.rejuvpotion].indexOf(p.itemType) > -1)
          .sort((a, b) => a.itemType - b.itemType); // Sort from HP to RV

        // Return potions from inventory to belt
        potsInInventory.forEach(p => {
            let freeSpace = Town.checkColumns(beltSize);
            let moved = false;
            for (var i = 0; i < 4 && !moved; i += 1) {
                if (p.code && Config.BeltColumn[i].startsWith(p.code) && freeSpace[i] > 0) {
                    console.log(p.code + " pot is in " + Config.BeltColumn[p.x % 4] + " column (" + (p.x % 4) + ")")
                    if (freeSpace[i] === beltSize) { // Pick up the potion and put it in belt if the column is empty
                        if (p.toCursor()) {
                            clickItem(sdk.clicktypes.click.Left, i, 0, StorageLocations.Belt);
                        }
                    } else {
                        clickItem(sdk.clicktypes.click.ShiftLeft, p.x, p.y, p.location); // Shift-click potion
                    }
                    moved = Town.checkColumns(beltSize)[i] === freeSpace[i] - 1;
                    console.log(p.code + " pot is now in " + Config.BeltColumn[p.x % 4] + " column (" + (p.x % 4) + "), moved ? " + moved)
                }
            }
        });

        // Cleanup remaining hp potions
        potsInInventory
          .filter((p, i) => p.itemType == sdk.itemtype.healingpotion)
          .filter((_, i) => i >= bufferHp[1])
          .forEach(p => {
              p.sellOrDrop();
          });

        // Cleanup remaining mp potions
        potsInInventory
          .filter((p, i) => p.itemType == sdk.itemtype.manapotion)
          .filter((_, i) => i >= bufferMp[1])
          .forEach(p => {
              p.sellOrDrop();
          });

        // Cleanup remaining rejuv potions
        potsInInventory
          .filter((p, i) => p.itemType == sdk.itemtype.rejuvpotion)
          .filter((_, i) => i >= bufferRejuv[1])
          .forEach(p => {
              p.sellOrDrop();
          });
    })();

    // Cleanup stamina potions
    (function () {
        let potions = Town.staminaPotions();
        while (potions.count > potions.totalNeeded) {
            if (!me.getItemsEx()
              .filter(i => i.isInInventory && i.classid === sdk.items.staminapotion)
              .first()?.interact()) {
                break;
            }
            potions = Town.staminaPotions();
        }
    })();


    this.clearScrolls();


    // Clear keys
    (function () {
        (Storage.Inventory.Compare(Config.Inventory) || undefined)
          .filter(item => item.classid == sdk.items.key)
          .sort((a, b) => (a.getStat(sdk.stats.Quantity) as number) - (b.getStat(sdk.stats.Quantity) as number))
          .filter((_, idx, keys) => idx < keys.length - 1) // keep only last keys stack, which has higher quantity due to sort
          .forEach(key => key.sellOrDrop());
    })();


    // Any leftover items from a failed ID (crashed game, disconnect etc.)
    let items = Storage.Inventory.Compare(Config.Inventory) || [];
    items.filter(i => ![18, 22, 41, 76, 77, 78, 79].includes(i.itemType) &&
      !i.isQuestItem &&
      !Cubing.keepItem(i) &&
      !Runewords.keepItem(i))
      .forEach(item => {
          const result = Pickit.checkItem(item);

          switch (result.result) {
            /*case PickitResult.TO_IDENTIFY:
                let idtool = this.getIdTool();
                if (idtool) {
                    this.identifyItem(items[i], idtool);
                }
                break;*/
              case PickitResult.NONE: // Drop item
                  if ((getUIFlag(0x0C) || getUIFlag(0x08)) && (item.getItemCost(1) <= 1 || item.isQuestItem)) { // Quest items and such
                      me.cancel();
                      delay(200);
                  }
                  item.sellOrDrop();
                  break;
              case PickitResult.GOLD: // Sell item
                  try {
                      print("LowGold sell " + item.name);
                      this.initNPC("Shop", "clearInventory");
                      Misc.itemLogger("Sold", item);
                      item.sell();
                  } catch (e) {
                      print(e);
                  }
                  break;
          }
      });
    return true;
});

new Override(Town, Town.move, function (original, spot) {
    if (!me.inTown) {
        this.goToTown();
    }

    var i, path;

    if (!this.act[me.act - 1].initialized) {
        this.initialize();
    }

    // Act 5 wp->portalspot override - ActMap.cpp crash
    if (me.act === 5 && spot === "portalspot" && getDistance(me.x, me.y, 5113, 5068) <= 8) {
        path = [5113, 5068, 5108, 5051, 5106, 5046, 5104, 5041, 5102, 5027, 5098, 5018];

        for (i = 0; i < path.length; i += 2) {
            Pather.walkTo(path[i], path[i + 1]);
        }

        return true;
    }

    for (i = 0; i < 3; i += 1) {
        if (this.moveToSpot(spot)) return true;
    }

    return false;
})

new Override(Town, Town.moveToSpot, function (original, spot) {

    // Invalid spot to move to
    if (!this.act[me.act - 1].hasOwnProperty("spot") || !this.act[me.act - 1].spot.hasOwnProperty(spot)) return false;
    // spot doesnt exists
    if (typeof (this.act[me.act - 1].spot[spot]) !== "object" && this.act[me.act - 1].spot[spot]) return false;

    let townSpot = this.act[me.act - 1].spot[spot];

    if (spot === "waypoint") {
        const path = getPath(me.area, townSpot[0], townSpot[1], me.x, me.y, 1, 8);

        if (path && path[1]) {
            townSpot = [path[1].x, path[1].y];
        }
    }

    for (let i = 0; i < townSpot.length; i += 2) {
        //print("moveToSpot: " + spot + " from " + me.x + ", " + me.y);


        // Custom behavior. if we are moving in act 2, we can use some shortcuts instead
        if (me.act === 2) {

            // const presetWarriv = {x: 5152, y: 5201}; // Warriv
            // const waypoint = {x: 5158, y: 5050};
            //
            // const obj = {
            //     x: townSpot[i],
            //     y: townSpot[i + 1],
            // }
            //
            //
            // if (presetWarriv.distance < obj.distance + getDistance(obj, waypoint)) {
            //     console.log('traveling via warriv makes sense');
            //     const npc = getUnit(1, NPC.Warriv);
            //
            //     if (me.area === sdk.areas.LutGholein) {
            //         if (npc && npc.openMenu()) {
            //             Misc.useMenu(0x0D37);
            //
            //             if (!Misc.poll(function () {
            //                 return me.area === 1;
            //             }, 2000, 100)) {
            //                 throw new Error("Failed to go to act 1 using Warriv");
            //             }
            //         }
            //     }
            //     // @ts-ignore // Yes, it can change
            //     if (me.area === sdk.areas.RogueEncampment) {
            //         Pather.useWaypoint(sdk.areas.LutGholein);
            //     }
            // }


        }

        if (getDistance(me, townSpot[i], townSpot[i + 1]) > 2) {
            Pather.moveTo(townSpot[i], townSpot[i + 1], 3, false, true);
        }

        switch (spot) {
            case "stash":
                if (!!getUnit(2, 267)) {
                    return true;
                }

                break;
            case "palace":
                if (!!getUnit(1, NPC.Jerhyn)) {
                    return true;
                }

                break;
            case "portalspot":
            case "sewers":
                if (getDistance(me, townSpot[i], townSpot[i + 1]) < 10) {
                    return true;
                }

                break;
            case "waypoint":
                if (!!getUnit(2, "waypoint")) {
                    return true;
                }

                break;
            default:
                if (!!getUnit(1, spot)) {
                    return true;
                }

                break;
        }
    }

    return false;
})

new Override(Town, Town.goToTown, function (original, ...args) {

    if (!me.inTown) {
        const preset = getWpPreset(me.area);
        if (preset && preset.distance < 40) {
            const townArea = [0, sdk.areas.RogueEncampment, sdk.areas.LutGholein, sdk.areas.KurastDocktown, sdk.areas.PandemoniumFortress, sdk.areas.Harrogath]
            const town = sdk.areas.townOf(me.area)
            gotoWp(me.area);
            Pather.useWaypoint(townArea[town]);
        }
    }

    return original(...args);
})

new Override(Town, Town.buyPotions, function (original) {
    if (me.gold < 30) {
        return false;
    }
    // if (me.gold < this.buyPotionsPrice()) { // Should we buy some potions even if we can't offer all potions ?
    //     return false;
    // }

    let i, j, npc, useShift, pot,
      buffer = {
          hp: 0,
          mp: 0
      };
    let needBuffer = false;

    this.clearBelt();

    const beltSize = Storage.BeltSize();
    let col = this.checkColumns(beltSize);

    // Check if we need to buy potions based on Config.MinColumn
    let needPots = Config.BeltColumn.some((column, index) =>
      ["hp", "mp"].includes(column) && col[index] > (beltSize - Math.min(Config.MinColumn[index], beltSize))
    );

    let bufferHp = Array.isArray(Config.HPBuffer) ? Config.HPBuffer : [Config.HPBuffer, Config.HPBuffer],
      bufferMp = Array.isArray(Config.MPBuffer) ? Config.MPBuffer : [Config.MPBuffer, Config.MPBuffer]

    if (bufferHp[0] > 0 || bufferMp[0] > 0) {
        buffer = {
            hp: me.getItemsEx()
              .filter(i => i.isInInventory && i.itemType === sdk.itemtype.healingpotion)
              .length,
            mp: me.getItemsEx()
              .filter(i => i.isInInventory && i.itemType === sdk.itemtype.manapotion)
              .length
        };
        needBuffer = buffer.hp < bufferHp[0] || buffer.mp < bufferMp[0];
    }

    // No columns to fill
    if (!needPots && !needBuffer) {
        return true;
    }

    if (me.diff === 0 && me.act < 4) {
        this.goToTown(me.highestAct);
    }

    npc = this.initNPC("Shop", "buyPotions");

    if (!npc) {
        return false;
    }

    if (needPots) {
        Config.BeltColumn.forEach((column, index) => {
            if (col[index] > 0) {
                useShift = this.shiftCheck(col, beltSize);
                pot = this.getPotion(npc, column);

                if (pot) {
                    //print("ÿc2column ÿc0" + i + "ÿc2 needs ÿc0" + col[i] + " ÿc2potions");

                    // Shift+buy will trigger if there's no empty columns or if only the current column is empty
                    if (useShift) {
                        if (!pot.buy(true)) {
                            while (col[index] > 0 && pot.buy(false)) { // a for loop here may miss some potions...
                                col = this.checkColumns(beltSize); // Re-initialize columns (needed because 1 shift-buy can fill multiple columns)
                            }
                        }
                    } else {
                        while (col[index] > 0 && pot.buy(false)) { // a for loop here may miss some potions...
                            col = this.checkColumns(beltSize); // Re-initialize columns (needed because 1 shift-buy can fill multiple columns)
                        }
                    }
                }
            }
            col = this.checkColumns(beltSize); // Re-initialize columns (needed because 1 shift-buy can fill multiple columns)
        });
    }

    //todo: buy mana first ?
    if (needBuffer && buffer.mp < bufferMp[0]) {
        while (buffer.mp < bufferMp[1]) {
            pot = this.getPotion(npc, "mp");

            if (Storage.Inventory.CanFit(pot) && pot.buy(false)) {
                buffer.mp = me.getItemsEx()
                  .filter(i => i.isInInventory && i.itemType === sdk.itemtype.manapotion)
                  .length;
            } else {
                break;
            }
        }
    }

    if (needBuffer && buffer.hp < bufferHp[0]) {
        while (buffer.hp < bufferHp[1]) { // a for loop here may miss some potions... desync ? missing delay ?
            pot = this.getPotion(npc, "hp");

            if (Storage.Inventory.CanFit(pot) && pot.buy(false)) {
                buffer.hp = me.getItemsEx()
                  .filter(i => i.isInInventory && i.itemType === sdk.itemtype.healingpotion)
                  .length;
            } else {
                break;
            }
        }
    }

    return true;
})

new Override(Town, Town.fillTome, function (original, code) {
    const cost = {
        [sdk.items.tptome]: 400,
        [sdk.items.idtome]: 280,
        [sdk.items.tpScroll]: 100,
        [sdk.items.idScroll]: 80
    };

    if (me.gold < cost[sdk.items.idScroll]) {
        return false;
    }

    if (this.checkScrolls(code) >= 13) {
        return true;
    }

    const npc = this.initNPC("Shop", "fillTome");

    if (!npc) {
        return false;
    }

    let price = cost[code];
    if (!me.findItem(code, 0, 3)) {
        if (me.gold >= price) {
            // buy tome first
            let tome = npc.getItem(code);
            if (tome && Storage.Inventory.CanFit(tome)) {
                try {
                    tome.buy();
                } catch (e1) {
                    print(e1);
                }
            }
        }
    }

    // now fill scrolls, maybe you couldn't buy tome. If so try to buy at least one
    let myTome = me.findItem(code, 0, StorageLocations.Inventory);
    let missing = (myTome ? 20 : 1) - this.checkScrolls(code);
    if (missing <= 0) {
        return false;
    }
    price += missing * cost[code + 11];

    let scroll = npc.getItem(code + 11) as ItemUnit;
    if (!scroll || (!myTome && !Storage.Inventory.CanFit(scroll))) {
        return false;
    }

    try {
        // try shift buy if have tome, else buy one by one
        if ((myTome && !scroll.buy(true))) {
            if (!scroll.buy()) {
                return false;
            }
        }
    } catch (e2) {
        print(e2.message);
        return false;
    }

    return true;
});

new Override(Town, Town.checkScrolls, function (original, id) {
    var tome = me.findItem(id, 0, StorageLocations.Inventory);

    if (!tome) {
        return me.findItems(id + 11, 0, StorageLocations.Inventory);
    }

    return tome.getStat(sdk.stats.Quantity);
});

new Override(Town, Town.clearBelt, function (original) {
    while (!me.gameReady) {
        delay(100);
    }

    // move potions that are in wrong belt column
    me.getItemsEx()
      .filter(p => p.isInBelt && [sdk.itemtype.healingpotion, sdk.itemtype.manapotion, sdk.itemtype.rejuvpotion].indexOf(p.itemType) > -1 && !p.code.startsWith(Config.BeltColumn[p.x % 4]))
      .forEach((p, _) => {
          var countInInventory = me.getItemsEx()
            .filter(pp => pp.isInInventory && pp.itemType === p.itemType)
            .length;

          let beltSize = Storage.BeltSize();
          var moved = false;
          let freeSpace = Town.checkColumns(beltSize);
          for (var i = 0; i < 4 && !moved; i += 1) {
              if (Config.BeltColumn[i].startsWith(p.code) && freeSpace[i] > 0) {
                  // Pick up the potion and put it in the good column
                  console.log(p.code + " pot is in " + Config.BeltColumn[p.x % 4] + " column (" + (p.x % 4) + ")")
                  if (p.toCursor()) {
                      clickItem(sdk.clicktypes.click.Left, i, 0, sdk.storage.Belt);
                  }
                  moved = Town.checkColumns(beltSize)[i] === freeSpace[i] - 1;
                  console.log(p.code + " pot is now in " + Config.BeltColumn[p.x % 4] + " column (" + (p.x % 4) + "), moved ? " + moved)
                  // if (p.code.startsWith(Config.BeltColumn[p.x % 4])) {
                  //     moved = true;
                  // }
              }
          }

          if (!moved) {
              const hpMax = (Array.isArray(Config.HPBuffer) ? Config.HPBuffer[1] : Config.HPBuffer);
              const mpMax = (Array.isArray(Config.MPBuffer) ? Config.MPBuffer[1] : Config.MPBuffer);
              switch (p.itemType) {
                  case sdk.itemtype.healingpotion:
                      if (countInInventory >= hpMax || !Storage.Inventory.MoveTo(p)) {
                          p.sellOrDrop();
                      }
                      break;

                  case sdk.itemtype.manapotion:
                      if (countInInventory >= mpMax || !Storage.Inventory.MoveTo(p)) {
                          p.sellOrDrop();
                      }
                      break;

                  case sdk.itemtype.rejuvpotion:
                      if (countInInventory >= Config.RejuvBuffer || !Storage.Inventory.MoveTo(p)) {
                          p.sellOrDrop();
                      }
                      break;
              }
          }
      });

    return true;
});

Object.defineProperty(Town.tasks[1], 'Shop', {
    get() {

        const filledTomes = [me.findItem(519, 0, 3), me.findItem(518, 0, 3)]
          .every(el => !el || el.getStat(sdk.stats.Quantity) > 15);

        // If we got full tome's, we can try to
        if (filledTomes) return NPC.Lysander;

        return NPC.Drognan;
    }
})

// Add events to town
Object.keys(Events.prototype).forEach(key => Town[key] = Events.prototype[key]);
