import {ShopAction} from "../actions";
import {NpcFlags} from "../npcs";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import sdk from "../../../sdk";
import {StorageLocations} from "../../../enums";

const TPTomePrice = 450;
const IDTomePrice = 280;
const TPScrollPrice = 100;
const IDScrollPrice = 80;
const tomes = {
  tp: {id: sdk.items.tptome, price: TPTomePrice, scrollPrice: TPScrollPrice, defaultQuantity: 4},
  id: {id: sdk.items.idtome, price: IDTomePrice, scrollPrice: IDScrollPrice, defaultQuantity: 2},
} as const;

const getTome = (type: 'tp' | 'id') => {
  const tome = tomes[type];
  if (!tome) return false;
  return me.findItem(tome.id, sdk.itemmode.inStorage, sdk.storage.Inventory);
}
const getCostToBuy = (type: 'tp' | 'id') => {
  const tome = tomes[type];
  if (!tome) return {};
  const unit = getTome(type);
  const missing = unit ? 20 - unit.getStat(sdk.stats.Quantity) : tome.defaultQuantity;

  return {
    missing,
    price: missing * tome.scrollPrice + (unit ? 0 : tome.price),
  }
}

new class Scroll extends ShopAction {
  readonly type: string = 'scroll';
  readonly npcFlag: number = NpcFlags.SCROLL;

  check(): Urgency {

    // Simple check, cant afford it
    {
      const has = getTome('tp')
      const {price, missing} = getCostToBuy('tp')
      if (!has) { // Either buy it or not
        console.log('Price? ', price, me.gold)
        return price > me.gold ? Urgency.Not : Urgency.Needed;
      }

      // Buy if we only got 5 left, otherwise meh if we are there anyway
      if (missing > 15 && price < me.gold) return Urgency.Needed;
    }

    // Check id
    { // ToDo Check if needed anyway
      const has = getTome('tp');
      const {price, missing} = getCostToBuy('tp')
      if (!has) { // Cant afford it
        return price > me.gold ? Urgency.Not : Urgency.Needed;
      }

      // If we can afford and missing more as 15, its needed
      if (missing > 15 && price < me.gold) return Urgency.Needed;
    }

    return Urgency.Convenience;
  }

  needTown(task: ShopTask): boolean {
    return task.urgency === Urgency.Needed;
  }

  checkScrolls(id: number): number {
    const tome = me.findItem(id, 0, StorageLocations.Inventory);

    if (!tome) {
      return me.findItems(id + 11, 0, StorageLocations.Inventory).length;
    }

    return tome.getStat(sdk.stats.Quantity);
  }

  run(task: ShopTask): boolean {
    const npc = this.goto(task.npc).interact().openShop();

    if (!npc) {
      return false;
    }

    this.fillTome(npc, sdk.items.tptome);
    this.fillTome(npc, sdk.items.idtome);

    return true;
  }

  fillTome(npc: Monster, code: number) {
    const cost = {
      [sdk.items.tptome]: 400,
      [sdk.items.idtome]: 280,
      [sdk.items.tpScroll]: 100,
      [sdk.items.idScroll]: 80
    };

    if (me.gold < cost[sdk.items.idScroll]) {
      return false;
    }

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
  }
}