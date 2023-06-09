import {ShopTask} from "./task";
import {Npc, Urgency} from "./enums";
import {Plan} from "./plan";
import {NpcFlags} from "./npcs";
import {talkTo} from "../../scripts/util";
import {acts} from "./act";
import sdk from "../../sdk";

export default class Shopper {
  private static actions: ShopAction[] = [];

  static create() {
    while (!me.gameReady) delay(3);

    const tasks: ShopTask[] = [];
    for (const action of this.actions) {
      const storage = {};
      const urgency = action.check(storage);
      if (urgency > Urgency.Not) {
        tasks.push(new ShopTask(urgency, action, storage));
      }
    }

    return new Plan(tasks);
  }

  static register(action: ShopAction) {
    this.actions.push(action);
  }

  static run() {
    this.create().calculate().executeIf(Urgency.Needed);
  }
}

export abstract class ShopAction<T=any> {
  public abstract readonly type: string
  public abstract readonly npcFlag: NpcFlags


  public constructor() {
    Shopper.register(this);
  }

  abstract check(storage?: Partial<T>): Urgency

  abstract needTown(task: ShopTask<T>): boolean

  abstract run(task: ShopTask<T>): boolean

  sort(other: ShopAction): -1 | 0 | 1 {
    return 0;
  }

  private isAlreadyInteractedWith(npc: Npc){
    const interactedNPC = getInteractedNPC();
    return interactedNPC && interactedNPC.name.toLocaleLowerCase() === npc.toLocaleLowerCase()
  }

  protected goto(...args: [npc: Npc, act: number]|[{npc: Npc, act: number}]) {
    const [npc, act] = args.length === 2 ? args : [args[0].npc, args[0].act];

    // Skip goto and if already interacting with the npc
    if (!this.isAlreadyInteractedWith(npc)) {

      // Only move to the npc if it's not in target
      const unit = getUnit(1, npc);
      if (!unit) {
        console.log('Going to '+npc+'@act#'+act);
        acts[act-1].goTo(npc);
      }
    }

    return {
      interact: () => {
        return this.interact(npc);
      }
    }
  }

  protected interact(npc: Npc) {

    if (!this.isAlreadyInteractedWith(npc)) {
      talkTo(npc, false);
    }

    return {
      openShop: () => {
        return this.openShop(npc);
      }
    }
  }

  protected openShop(npc: Npc) {
    const unit = getUnit(1, npc);

    const interactedWith = getInteractedNPC();
    if (unit && interactedWith && interactedWith.classid === unit.classid) {
      const menuId = this.getMenuId();
      console.log('menuid -- '+menuId);
      Misc.useMenu(menuId);

      if (Misc.poll(() => getUIFlag(sdk.uiflags.Shop) && interactedWith.itemcount > 0, 1000, 25)) {
        return interactedWith;
      }

      console.log('Retry interacting with NPC');
      me.cancel();
      talkTo(npc);
    }

    return undefined
  }

  private getMenuId() {
    const npc = getInteractedNPC();
    if (!npc) return 0;
    switch (npc.classid) {
      case sdk.monsters.Charsi:
      case sdk.monsters.Fara:
      case sdk.monsters.Hratli:
      case sdk.monsters.Halbu:
      case sdk.monsters.Larzuk:
        return sdk.menu.TradeRepair;
      case sdk.monsters.Gheed:
      case sdk.monsters.Elzix:
      case sdk.monsters.Alkor:
      case sdk.monsters.Jamella:
      case sdk.monsters.Anya:
        return sdk.menu.Trade
    }
    return sdk.menu.Trade;
  }
}

