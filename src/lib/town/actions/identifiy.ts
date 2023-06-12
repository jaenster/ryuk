import {ShopAction} from "../actions";
import {NpcFlags} from "../npcs";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {PickitResult} from "../../../enums";
import sdk from "../../../sdk";


export const identify = new class Identify<T = object> extends ShopAction<T> {

  readonly type: string = 'identify';
  readonly npcFlag: number = NpcFlags.SCROLL;

  check(): Urgency {
    const {identify} = this.getGroups();

    // ToDo; check if x% of space is taken to consider if its needed or convenience
    return identify.length === 0 ? Urgency.Not : Urgency.Needed;
  }

  needTown(task: ShopTask): boolean {
    // Don't go to town if it's not 100% needed right now
    if (task.urgency < Urgency.Needed) return false;

    // Always id in town for now, later check if enough scrolls are there and fieldid enabled
    return true;
  }

  run(task: ShopTask): boolean {
    const unit = this
      .goto(task.npc)
      .interact()
      .openShop();

    if (!unit || !unit.itemcount) {
      return false;
    }


    const {identify} = this.getGroups();
    for (const item of identify) {
      this.perItem(item);
    }

    return true;
  }

  get idTool() {
    let items = me.getItemsEx().filter((i) => i.isInInventory && [sdk.items.idScroll, sdk.items.idtome].includes(i.classid));
    if (!items.length) return null;
    let tome = items.find((i) => i.isInInventory && i.classid === sdk.items.idtome && i.getStat(sdk.stats.Quantity) > 0);
    if (tome) return tome;
    let scroll = items.find((i) => i.isInInventory && i.classid === sdk.items.idScroll);
    if (scroll) return scroll;
    return null;
  }

  identify(item: ItemUnit, scroll: ItemUnit): boolean {
    //@ts-ignore // ToDo; proper fix
    return Packet.identifyItem(item, scroll)
  }

  perItem(item: ItemUnit) {
    if (!item.isInInventory || item.identified) return false;
    const npc = getInteractedNPC();
    //ToDO ignored types

    const nip = Pickit.checkItem(item);

    if (nip.result === PickitResult.TO_IDENTIFY) {
      let {idTool} = this;
      if (!idTool) {

        // buy scroll from npc
        const vendorScroll = npc && npc.getItem(sdk.items.idScroll);
        if (!vendorScroll) return false; // cant id as it cant buy a scroll

        // Buy scroll
        if (Storage.Inventory.CanFit(vendorScroll)) vendorScroll.buy();
        idTool = this.idTool;
      }

      // Cant id this
      if (!idTool) return false;

      // It sounds logical to sell or drop the item here, but this is the task of clear inventory, and not identify.
      this.identify(item, idTool);
    }

    return true;
  }
}