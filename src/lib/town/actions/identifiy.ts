import {ShopAction} from "../actions";
import {NpcFlags} from "../npcs";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {PickitResult} from "../../../enums";
import sdk from "../../../sdk";


export class Identify extends ShopAction {
  static {
    new Identify();
  }

  readonly type: string = 'identify';
  readonly npcFlag: number = NpcFlags.SCROLL;

  protected getItems() {
    return Storage.Inventory.Compare(Config.Inventory) || [];
  }

  check(): Urgency {
    const inventory: ItemUnit[] = (Storage.Inventory.Compare(Config.Inventory) || [])
      .filter(i => i.isInInventory && !i.identified);

    // ToDo; check if x% of space is taken to consider if its needed or convenience
    return inventory.length === 0 ? Urgency.Not : Urgency.Needed;
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


    for (const item of this.getItems()) {
      this.perItem(item);
    }

    return false;
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
    console.log('Per item run '+item.name+' - Identified: '+item.identified);
    if (!item.isInInventory) return false;
    const npc = getInteractedNPC();
    //ToDO ignored types

    const nip = Pickit.checkItem(item);
    console.log(item.name+' -- pickit result ', nip);

    switch (nip.result) {
      case PickitResult.TO_IDENTIFY:
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
        if (this.identify(item, idTool)) {
          console.log('Running pickit again');
          // now that this item is identified
          const nip = Pickit.checkItem(item);
          if (nip.result === PickitResult.NONE || nip.result === PickitResult.GOLD) {

            //ToDo; figure out if it can sell this
            console.log('Sold '+item.name+' as its unwanted after id');
            item.sell();
          }
        }
        break;
      case PickitResult.GOLD:
        // Sell for money
        item.sell();
        return true;
    }

    return true;
  }
}