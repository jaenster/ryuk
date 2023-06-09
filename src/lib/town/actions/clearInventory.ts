import {NpcFlags} from "../npcs";
import {Identify} from "./identifiy";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {PickitResult} from "../../../enums";

new class ClearInventory extends Identify {

  readonly type: string = 'clear-inventory';
  readonly npcFlag: number = NpcFlags.SCROLL;

  check(): Urgency {
    const parent= super.check();
    if (parent === Urgency.Needed) {
      return Urgency.Convenience;
    }
  }



  run(task: ShopTask): boolean {

    const unit = this.goto(task.npc).interact().openShop();

    if (!unit || !unit.itemcount) {
      return false;
    }

    const items = this.getItems();
    for(const item of items) {
      const nip = Pickit.checkItem(item);

      switch(nip.result) {
        case PickitResult.TO_IDENTIFY:

      }
    }

    return true;
  }



}