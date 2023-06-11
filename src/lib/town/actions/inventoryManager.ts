import {sleep} from "../../async/async-utils";
import {PickitResult} from "../../../enums";
import {ShopAction} from "../actions";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {NpcFlags} from "../npcs";

export const inventoryManager = new class InventoryManager extends ShopAction {
  readonly npcFlag: NpcFlags = NpcFlags.NONE;
  readonly type: string = 'inventory-manager';

  getItems() {
    return (Storage.Inventory.Compare(Config.Inventory) || [])
  }

  override async background() {
    while(true) {
      await sleep(5000);

      // Dont do this in town
      if (me.inTown) continue;


      const items = this.getItems()
        .filter(el => !el.identified)
        .filter(el => Pickit.checkItem(el)?.result === PickitResult.TO_IDENTIFY);


    }
  }


  // ToDO; in the future do some stuff with this
  check(storage: Partial<any> | undefined): Urgency {
    return Urgency.Not;
  }

  needTown(task: ShopTask<any>): boolean {
    return false;
  }

  run(task: ShopTask<any>): boolean {
    return true;
  }

}