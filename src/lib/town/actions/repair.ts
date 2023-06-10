import {ShopAction} from "../actions";
import {NpcFlags} from "../npcs";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import sdk from "../../../sdk";


new class Repair extends ShopAction {
  readonly type: string = 'repair';
  readonly npcFlag: number = NpcFlags.REPAIR;

  check(): Urgency {
    // Weird bug, if interacting with npc but not in shop, getRepairCost crashes d2
    if (getInteractedNPC() && !getUIFlag(sdk.uiflags.Shop)) {
      me.cancel();
    }

    let canAfford = me.gold >= me.getRepairCost();

    if (!canAfford) {
      console.warn("Can't afford repairs.");
      return Urgency.Not; // Cant repair due lack of gold
    }

    // Repair durability/quantity/charges
    const items = Town.getItemsForRepair(Config.RepairPercent, true);
    return items.length > 0 ? Urgency.Needed : Urgency.Convenience;
  }

  needTown(task: ShopTask): boolean {
    return task.urgency === Urgency.Needed;
  }

  run(task: ShopTask): boolean {
    console.log('Running repairing');

    const unit = this
      .goto(task.npc)
      .interact()
      .openShop();

    if (!unit || !unit.itemcount) {
      return false;
    }

    console.log('repairing')
    me.repair();

    return true;
  }
}
