import {ShopAction} from "../actions";
import {Urgency} from "../enums";
import {ShopTask} from "../task";
import {NpcFlags} from "../npcs";

new class Heal extends ShopAction {
  readonly type = 'heal';
  readonly npcFlag: NpcFlags = NpcFlags.HEAL;

  check(): Urgency {
    // @ts-ignore
    const hp = me.hpPercent;
    switch(true) {
      case hp <= 75:
        return Urgency.Needed
      case hp <= 90:
        return Urgency.Convenience
    }
    return Urgency.Not;
  }

  needTown(task: ShopTask<any>): boolean {
    return task.urgency === Urgency.Needed;
  }

  run(task: ShopTask<any>): boolean {

    // @ts-ignore
    const hp = me.hpPercent;
    // if its needed
    if (hp > 90) return true;

    this.goto(task.npc).interact();
    return true;
  }

}