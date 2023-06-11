import {ShopAction} from "../actions";
import {NpcFlags} from "../npcs";
import {PickitResult} from "../../../enums";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {AutoRunewords} from "../../AutoRuneword";

new class AutoRuneword extends ShopAction {
  readonly npcFlag: NpcFlags = NpcFlags.STASH;
  readonly type: string = 'runewords';

  getInventoryItems() {
    const items = super.getItems();
    return items.filter(item => Pickit.checkItem(item)?.result === PickitResult.RUNEWORDS);
  }

  check(storage: Partial<any> | undefined): Urgency {
    // Make runewords
    if (AutoRunewords.wantToMakeRunewords()) {
      return Urgency.Needed;
    }

    const items = this.getInventoryItems();

    // If more as 4 slots in our inventory are occupied by runeword items, time to do something with it
    const size = items.reduce((acc, cur) => acc + ((cur.sizex * cur.sizey) | 0), 0);
    if (size > 4) {
      return Urgency.Needed;
    }

    return items.length ? Urgency.Convenience : Urgency.Not;
  }

  needTown(task: ShopTask): boolean {
    return task.urgency === Urgency.Needed;
  }

  run(task: ShopTask): boolean {
    this.openStash(task.npc.act);

    AutoRunewords.makeRunewords()

    // What is left, put it to items
    const items = this.getInventoryItems();
    for(const item of items) {
      Storage.Stash.MoveTo(item);
    }


    return true;
  }
}