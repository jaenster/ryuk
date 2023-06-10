import {NpcFlags} from "../npcs";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {PickitResult} from "../../../enums";
import {ShopAction} from "../actions";
import {sortInventory} from "../../utilities";
import {identify} from "./identifiy";

type Storage = {
  hasUnids: boolean
  hasStash: boolean
}

export interface ClearHook {
  handleItems(item: ItemUnit[], pickit: PickitResult): void
}

export const clear = new class ClearInventory extends ShopAction<Storage> {
  private readonly hooks = new Map<PickitResult, ClearHook[]>();

  check(storage: Storage): Urgency {
    const items = this.getItems();

    // Need to identify
    const unids: ItemUnit[] = items
      .filter(i => i.isInInventory && !i.identified)
      .filter(i => Pickit.checkItem(i).result === PickitResult.TO_IDENTIFY)

    const {gold, drop, custom, identify} = this.getGroups();

    storage.hasUnids = unids.length > 0;

    const needsCustom = custom.reduce((acc, item) => {
      if (acc) return acc;
      const nip = Pickit.checkItem(item);
      const hooks = this.hooks.get(nip.result);
      return hooks?.length > 0;
    }, false)

    // ToDo; make it a convenience if certain free space is still available
    if (gold.length + drop.length + identify.length > 0 || needsCustom) {
      return Urgency.Needed;
    }
  }

  needTown(task: ShopTask<Storage>): boolean {
    // ToDo; make depend if everything can be dropped / field id
    return true;
  }

  run(task: ShopTask<Storage>): boolean {
    // ToDo; create so it doesnt need a shop
    const unit = this.goto(task.npc).interact().openShop();
    if (!unit || !unit.itemcount) {
      return false;
    }

    let group = this.getGroups();

    const custom = group.custom;
    if (custom.length > 0) {
      // Custom handlers for pickit lines
      const hooks = custom.groupBy(item => {
        const nip = Pickit.checkItem(item);
        return nip.result as 'AE' | 'AEM';
      });

      for (const [key, items] of Object.entries(hooks)) {
        this.hooks.get(key)?.forEach(hook => hook.handleItems(items, key));
      }

      // Re-run it to, as hooks can change the items
      group = this.getGroups();
    }

    const {drop, gold, identify} = group;

    const inShop = unit && unit.itemcount;
    const toDropAfterShop: ItemUnit[] = [];
    for (const item of drop.concat(gold)) {
      console.log('Getting rid of item' + item.name, inShop);
      if (inShop) {
        if (item.sellable) {
          item.sell();
        } else {
          toDropAfterShop.push(item);
        }
      } else {
        item.drop();
      }
    }

    if (inShop && toDropAfterShop.length) {
      // Not sure if you can drop from shop
      me.cancel();
      toDropAfterShop.forEach(el => el.drop());
    }

    if (identify.length) {
      console.error('It has items to be identified, should not happen');
      return false;
    }

    // With what is left, sort the inventory
    sortInventory();
    return true;
  }

  override dependencies(storage?: Partial<Storage>): string[] {
    const deps = [];
    if (storage.hasUnids) deps.push(identify.type);
    return deps;
  }


  registerHook(type: PickitResult, ch: ClearHook) {
    let arr = this.hooks.get(type);
    if (!arr) this.hooks.set(type, arr = []);
    arr.push(ch);
  }

  readonly type: string = 'clear-inventory';
  readonly npcFlag: number = NpcFlags.TRADE;
}