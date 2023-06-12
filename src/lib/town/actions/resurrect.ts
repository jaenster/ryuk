import {ShopAction} from "../actions";
import {NpcFlags} from "../npcs";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import sdk from "../../../sdk";


new class Resurrect extends ShopAction {
  readonly type: string = 'resurrect';
  readonly npcFlag: number = NpcFlags.RESURRECT;

  check(): Urgency {

    // @ts-expect-error classic exists
    if (me.classic || !Config.UseMerc || me.gold < me.mercrevivecost || me.mercrevivecost === 0) {
      return Urgency.Not;
    }

    Misc.poll(() => me.gameReady, 1000, 100);

    // me.getMerc() might return null if called right after taking a portal, that's why there's retry attempts
    const merc = Misc.poll(() => me.getMerc(), 300, 10);
    if (merc && !merc.dead) {
      return Urgency.Not;
    }

    return Urgency.Needed;
  }

  needTown(task: ShopTask): boolean {
    return task.urgency === Urgency.Needed;
  }

  run(task: ShopTask): boolean {
    this.goto(task.npc).interact();

    if (!getInteractedNPC()) {
      return false;
    }

    for (let i = 0; i < 3; i += 1) {
      let dialog = getDialogLines();
      if (!dialog) continue

      for (let lines = 0; lines < dialog.length; lines += 1) {
        if (dialog[lines].text.match(/:/gi)) {
          dialog[lines].handler();

          // Wait for dialog lines to be gone, or have no text with : in it
          Misc.poll(() => getDialogLines() === false || !(getDialogLines() as {
            text: string
          }[])?.some?.(el => el.text.match(/:/gi)), Math.max(750, me.ping * 3), 10)
          break;
        }

        // "You do not have enough gold for that."
        if (dialog[lines].text.toLocaleLowerCase().match(getLocaleString(sdk.locale.dialog.youDoNotHaveEnoughGoldForThat).toLocaleLowerCase())) {
          return false;
        }
      }
    }
    const gotMerc = Misc.poll(() => me.getMerc(), Math.max(750, me.ping * 3), 10);
    return !!gotMerc;
  }

  override dependencies(): string[] {
    return [];
  }
}