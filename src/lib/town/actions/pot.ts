import {ShopTask} from "../task";
import {ShopAction} from "../actions";
import {NpcFlags} from "../npcs";
import {Urgency} from "../enums";
import sdk from "../../../sdk";


type PotStorage = {
  beltMaxHP: number,
  beltHaveHP: number,
  beltNeedHP: number,

  beltMaxMP: number,
  beltHaveMP: number,
  beltNeedMP: number,


  bufferMaxHP: number
  bufferHaveHP: number
  bufferNeedHP: number

  bufferMaxMP: number
  bufferHaveMP: number
  bufferNeedMP: number


  totalNeeded: number
  totalHave: number

  beltSize: number,
}

export const pot = new class Pot extends ShopAction<PotStorage> {
  readonly type: string = 'pot';
  // readonly npcFlag: number = NpcFlags.POTS;

  get npcFlag() {
    // On nightmare/hell we just need any npc that sells pots
    if (me.diff) return NpcFlags.POTS;

    // Add specific act of npc to buy pots. Since it starts at act 1, dont shift by one less
    const specificAct = NpcFlags.ACT1 << (me.highestAct-1);
    console.log('Npc flag for pots --> ', specificAct | NpcFlags.POTS)
    return specificAct | NpcFlags.POTS
  }

  calculateNeededPots(storage: Partial<PotStorage> = {}): PotStorage {
    storage.beltSize = Storage.BeltSize();

    // stats for hp belt
    storage.beltMaxHP = Config.BeltColumn.reduce((acc, cur) => cur === 'hp' ? acc + storage.beltSize : acc, 0);
    storage.beltHaveHP = me.getItemsEx().filter(i => i.isInBelt && i.itemType === sdk.itemtype.healingpotion).length;
    storage.beltNeedHP = Math.max(storage.beltMaxHP - storage.beltHaveHP , 0)

    // stats for mp belt
    storage.beltMaxMP = Config.BeltColumn.reduce((acc, cur) => cur === 'mp' ? acc + storage.beltSize : acc, 0);
    storage.beltHaveMP = me.getItemsEx().filter(i => i.isInBelt && i.itemType === sdk.itemtype.manapotion).length;
    storage.beltNeedMP = Math.max(storage.beltMaxMP - storage.beltHaveMP , 0)


    // Calculate buffer
    storage.bufferMaxHP = Array.isArray(Config.HPBuffer) ? Config.HPBuffer[1] : Config.HPBuffer;
    storage.bufferHaveHP = me.getItemsEx().filter(i => i.isInInventory && i.itemType === sdk.itemtype.healingpotion).length;
    storage.bufferNeedHP = Math.max(storage.bufferMaxHP - storage.bufferHaveHP , 0);

    storage.bufferMaxMP = Array.isArray(Config.MPBuffer) ? Config.MPBuffer[1] : Config.MPBuffer;
    storage.bufferHaveMP = me.getItemsEx().filter(i => i.isInInventory && i.itemType === sdk.itemtype.manapotion).length;
    storage.bufferNeedMP = Math.max(storage.bufferMaxMP - storage.bufferHaveMP , 0);


    // If more as half of the pots are missing, make a trip to npc
    storage.totalNeeded = storage.bufferNeedHP+storage.bufferNeedMP + storage.beltNeedMP + storage.beltNeedHP;
    storage.totalHave = storage.beltHaveHP +storage.beltHaveMP + storage.bufferHaveHP + storage.bufferHaveMP;

    return storage as PotStorage;
  }

  price(storage: PotStorage = this.calculateNeededPots()) {
    const cost = {
      hp: [30, 75, 112, 225, 500],
      mp: [60, 150, 270, 450, 1000],
    };

    // Price of act 5 is the same as all of nm/hell
    const priceIndex = me.diff == 0 ? me.highestAct : 5;

    const costOf = {
      hp: cost.hp[priceIndex],
      mp: cost.mp[priceIndex],
    }

    return (storage.beltNeedHP + storage.bufferNeedMP) * costOf.hp + (storage.beltNeedMP + storage.bufferNeedMP) * costOf.mp;
  }

  check(storage: PotStorage): Urgency {
    // Calculate pot need
    this.calculateNeededPots(storage);
    const price = this.price(storage);

    // Can not afford
    if (me.gold <= price) {
      return Urgency.Not;
    }

    // Ran out of a specific pot?
    if (
      (storage.beltMaxMP + storage.bufferMaxMP === storage.beltNeedMP + storage.bufferNeedMP)
      || (storage.beltMaxHP + storage.bufferMaxHP === storage.beltNeedHP + storage.bufferNeedHP)
    ) {
      return Urgency.Needed;
    }

    // If it has less than 66% of the needed pots, it needed pots
    if ((100 / storage.totalNeeded * storage.totalHave) < 66) {
      return Urgency.Needed;
    }

    // if any pot is needed, buy them if given a chance
    if (storage.totalNeeded > 0) {
      return Urgency.Convenience;
    }

    return Urgency.Not;
  }

  needTown(task: ShopTask): boolean {
    return true;
  }

  run(task: ShopTask<PotStorage>): boolean {
    const {storage} = task;
    const key = ['bufferNeedHP', 'bufferHaveMP', 'beltNeedMP', 'beltNeedHP'];
    console.log('Buying pots. '+key.map(key => storage[key] > 0 ? key+'='+storage[key]:'').join(''));

    const unit = this
      .goto(task.npc)
      .interact()
      .openShop();

    if (!unit || !unit.itemcount) {
      return false;
    }

    // ToDo; make proper rewrite
    let col = Town.checkColumns(storage.beltSize);
    Config.BeltColumn.forEach((column, index) => {
      let useShift, pot;
      if (col[index] > 0) {
        useShift = Town.shiftCheck(col, storage.beltSize);
        pot = Town.getPotion(getInteractedNPC(), column);

        if (pot) {
          print("ÿc2column ÿc0" + index + "ÿc2 needs ÿc0" + col[index] + " ÿc2potions");

          // Shift+buy will trigger if there's no empty columns or if only the current column is empty
          if (useShift) {
            if (!pot.buy(true)) {
              while (col[index] > 0 && pot.buy(false)) { // a for loop here may miss some potions...
                col = Town.checkColumns(storage.beltSize); // Re-initialize columns (needed because 1 shift-buy can fill multiple columns)
              }
            }
          } else {
            while (col[index] > 0 && pot.buy(false)) { // a for loop here may miss some potions...
              col = Town.checkColumns(storage.beltSize); // Re-initialize columns (needed because 1 shift-buy can fill multiple columns)
            }
          }
        }
      }
      col = Town.checkColumns(storage.beltSize); // Re-initialize columns (needed because 1 shift-buy can fill multiple columns)
    });

    // Buy buffer pots
    for (const [type, amount] of [['hp', storage.bufferNeedHP], ['mp', storage.bufferNeedMP]] as const) {
      console.log('Buying '+type+' '+amount+' buffer pots');
      for (let i = 0; i < amount; i++) {
        const pot = Town.getPotion(getInteractedNPC(), type);
        if (!pot || !Storage.Inventory.CanFit(pot) || !pot.buy(false)) {
          break;
        }
      }
    }
  }
}