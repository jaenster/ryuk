import {Npc, Urgency} from "./enums";
import type {ShopAction} from "./actions";

export class ShopTask<T=any> {
  constructor(
    public readonly urgency: Urgency,
    public readonly action: ShopAction<T>,
    public readonly storage: Partial<T>,
    public readonly dependencies: string[],
  ) {
  }

  public readonly npc = {} as {
    act: number,
    npc: Npc,
  };

  isTownNeeded() {
    return this.action.needTown(this)
  }

  run() {
    return this.action.run(this);
  }

  sort(other: ShopTask) {
    return this.action.sort(other.action);
  }
}
