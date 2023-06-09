import {NpcFlags} from "../npcs";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {PickitResult} from "../../../enums";
import {ShopAction} from "../actions";
import {identify} from "./identifiy";
import sdk from "../../../sdk";

type Storage = {
  hasUnids: boolean
  hasStash: boolean
}

export interface ClearHook {
  handleItem(item: ItemUnit, pickit: PickitResult): void
}

const ignoreTypes = [sdk.itemtype.book, sdk.itemtype.key, sdk.itemtype.healingpotion, sdk.itemtype.manapotion, sdk.itemtype.rejuvpotion];
export const clear = new class ClearInventory extends ShopAction<Storage> {
  private readonly hooks = new Map<PickitResult, ClearHook[]>();

  check(storage: Storage): Urgency {
    const items = this.getItems();

    // Need to identify
    const unids: ItemUnit[] = items
      .filter(i => i.isInInventory && !i.identified)
      .filter(i => Pickit.checkItem(i).result === PickitResult.TO_IDENTIFY)

    const {gold, drop, custom} = this.getGroups();

    storage.hasUnids = unids.length > 0;

    const needsCustom = custom.reduce((acc, item) => {
      if (acc) return acc;
      const nip = Pickit.checkItem(item);
      const hooks = this.hooks.get(nip.result);
      return hooks.length > 0;
    }, false)

    // ToDo; make it a convenience if certain free space is still available
    if (gold.length + drop.length > 0 || needsCustom) {
      return Urgency.Needed;
    }
  }

  needTown(task: ShopTask<Storage>): boolean {
    // ToDo; make depend if everything can be dropped / field id
    return true;
  }

  run(task: ShopTask<Storage>): boolean {
    // ToDo; create so it doesnt need a shop
    console.log(task.npc);
    const unit = this.goto(task.npc).interact().openShop();
    if (!unit || !unit.itemcount) {
      return false;
    }

    const {drop, gold, identify, custom} = this.getGroups();

    // Custom handlers for pickit lines
    for(const item of custom) {
      const nip = Pickit.checkItem(item);
      const hooks = this.hooks.get(nip.result);
      if (hooks.length) {
        console.log('Calling special handlers for item '+item.name)
        hooks.forEach(hook => hook.handleItem(item, nip.result));
      }
    }

    let inShop = unit && unit.itemcount;
    for(const item of drop.concat(gold)) {
      console.log('Getting rid of item'+item.name, inShop);
      if (inShop) {
        item.sell();
      } else {
        item.drop();
      }
    }

    if (identify.length) {
      console.error('It has items to be identified, should not happen');
      return false;
    }

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

  getItems() {
    return (Storage.Inventory.Compare(Config.Inventory) || [])
      .filter(item => !ignoreTypes.includes(item.itemType))
  }

  getGroups() {
    const items = this.getItems();
    const groups = items.groupBy(item => {
      const nip = Pickit.checkItem(item);
      console.log('Pickit - '+item.name+' - '+nip.result);
      switch (nip.result) {
        case PickitResult.TO_IDENTIFY:
          return 'identify'
        case PickitResult.NONE:
          return 'drop';
        case PickitResult.GOLD:
          return 'gold';
        case PickitResult.PICKIT:
          return 'stash';
        case PickitResult.CRAFTING:
        case PickitResult.RUNEWORDS:
        case PickitResult.REPAIR:
        default:
          return 'custom';
      }
    })
    const {
      gold = [],
      drop = [],
      identify = [],
      stash = [],
      custom = [],
    } = groups ?? {};
    return {gold, drop, identify, stash, custom};
  }

}