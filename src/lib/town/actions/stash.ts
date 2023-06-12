import {ShopAction} from "../actions";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {NpcFlags} from "../npcs";
import {clear} from "./clearInventory";
import {identify} from "./identifiy";
import {acts} from "../act";
import sdk from "../../../sdk";

type Storage = {
  afterIdentify: boolean
  afterClear: boolean
}

export const stash = new class Stash extends ShopAction<Storage> {
  readonly type: string = 'stash';
  readonly npcFlag: NpcFlags = NpcFlags.STASH;

  check(storage: Storage): Urgency {
    const {stash, identify, drop, gold} = this.getGroups();

    if (stash.length > 0) {
      storage.afterIdentify = identify.length > 0
      storage.afterClear = drop.length > 0 || gold.length > 0;

      return Urgency.Needed;
    }

    // If need to stash gold
    if (me.getStat(sdk.stats.Gold) >= Config.StashGold && me.getStat(sdk.stats.Goldbank) < 25e5) {
      return Urgency.Needed;
    }
  }

  needTown(task: ShopTask<Storage>): boolean {
    return task.urgency === Urgency.Needed;
  }

  run(task: ShopTask<Storage>): boolean {
    const {stash} = this.getGroups();
    if (stash.length === 0 && me.getStat(sdk.stats.Gold) < Config.StashGold) return false;

    acts[task.npc.act-1].goTo('stash');

    if (getUIFlag(sdk.uiflags.Cube) && !Cubing.closeCube()) return false;

    const unit = Misc.poll(() => getUnit(2, sdk.units.Stash));
    if (!Misc.poll(() => {
      Misc.click(0, 0, unit);
      return getUIFlag(sdk.uiflags.Stash);
    })) {
      return false;
    }

    // Store big items first
    stash.sort((a,b) => b.sizex*b.sizey-a.sizex*a.sizey);

    for(const item of stash) {
      Storage.Stash.MoveTo(item);
    }

    // Stash gold if possible
    if (me.getStat(sdk.stats.Goldbank) < 25e5) {
      gold(me.getStat(sdk.stats.Gold), 3);
    }
  }

  override dependencies(storage: Storage): string[] {
    const deps = [];

    // If stuff needs to be stored, and identify is needed, there is a chance it needs to store again
    // Do not store until after identify
    if (storage.afterIdentify) deps.push(identify.type);
    if (storage.afterClear) deps.push(clear.type);

    return deps;
  }
}