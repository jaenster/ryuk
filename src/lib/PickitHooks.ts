import sdk from "../sdk";
import {PickitResult, StorageLocations} from "../enums";
import {amountOfPotsNeeded} from "../overrides/Pickit";


Pickit.on('checkItem', (item, rval) => {
  const potTypes = [sdk.itemtype.healingpotion, sdk.itemtype.manapotion, sdk.itemtype.rejuvpotion];

  // let parent = item.getParent() || undefined;
  // let merc = me.getMerc() || undefined;

  // let isWorldItem = item.mode === sdk.itemmode.dropping || item.mode === sdk.itemmode.onGround;
  // let isMercItem = merc === parent;
  // let isMyItem = isMercItem || parent === me;


  // Special shit for low level pots
  if (potTypes.includes(item.itemType)) {
    let pots = amountOfPotsNeeded();

    if (pots[item.itemType][StorageLocations.Belt] + pots[item.itemType][StorageLocations.Inventory] < 1) {
      let pot = me.getItemsEx()
        .filter(i => i.itemType === item.itemType && (i.isInInventory || i.isInBelt) && i.classid < item.classid)
        .first();
      // drink lower potion and pickup higher one
      if (pot && pot.interact()) {
        pots[item.itemType][item.location] += 1;
      }
    }

    // console.log('Should pick pot?', pots);
    if (pots[item.itemType][StorageLocations.Belt] + pots[item.itemType][StorageLocations.Inventory] > 0) {
      // console.log('Should pick pot');
      return rval.result = PickitResult.PICKIT;
    }
  }


  if (item.classid === sdk.items.gold && item.distance < 5) {
    return rval.result = PickitResult.PICKIT;
  }

  if (item.isQuestItem) {
    return rval.result = PickitResult.PICKIT;
  }

  // todo: refactor. we just want scrolls, the check for tome and quantity should be elsewhere, like in Pickit.canPick
  if (item.classid === sdk.items.idScroll || item.classid === sdk.items.tpScroll) {
    let tome = me.findItem(item.classid - 11, 0, StorageLocations.Inventory);
    if (!tome) {
      let count = me.findItems(item.classid, 0, StorageLocations.Inventory).length;
      if (item.classid === sdk.items.idScroll) {
        let itemsToId = me.getItemsEx().filter(i => i.isInInventory && Pickit.checkItem(i).result === PickitResult.TO_IDENTIFY);
        count = Math.max(count, itemsToId.length);
      }
      if (count < 2) {
        return rval.result = PickitResult.PICKIT;
      }
    } else if (tome.getStat(sdk.stats.Quantity) < 20) { // if tome not full, pickit
      return rval.result = PickitResult.PICKIT;
    }
  }

  if (item.classid === sdk.items.staminapotion) {
    if (Town.staminaPotions().needed > 0) {
      return rval.result = PickitResult.PICKIT;
    }
  }


  return false;
})