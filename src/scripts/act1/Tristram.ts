import sdk from "../../sdk";
import {filterNormalMonsters, talkTo} from "../util";
import moveTo from "../../lib/MoveTo";
import Clear from "../../lib/clear";

export = function () { // Got some stuff out of original trist

  if (!me.getQuest(sdk.quests.TheSearchForCain, 3)) {
    Town.goToTown(1);
    Pather.journeyTo(sdk.areas.DarkWood);
    if (!Pather.moveToPreset(me.area, 2, 30, 5, 5)) {
      throw new Error("Failed to move to Tree of Inifuss");
    }

    const tree = Misc.poll(() => getUnit(2, 30))
    Misc.openChest(tree);
    const scroll = Misc.poll(() => getUnit(4, sdk.items.ScrollOfInifuss));
    Pickit.pickItem(scroll);
    Town.goToTown(1);
  }

  // take scroll to akara
  if (me.getItem(sdk.items.ScrollOfInifuss)) {
    Town.goToTown(1);
    talkTo(NPC.Akara);
    Misc.poll(() => !me.getItem(sdk.items.ScrollOfInifussActive));
  }

  if (!me.getItem(sdk.items.ScrollOfInifussActive) && !me.getQuest(sdk.quests.TheSearchForCain, 4)) {
    throw new Error('Should have scroll but dont. Next time try again')
  }

  if (me.area !== sdk.areas.StonyField) {
    Pather.useWaypoint(sdk.areas.StonyField);
  }

  const ps = getPresetUnit(me.area, 2, 61) || undefined;
  if (!ps) return;

  moveTo(ps);

  if (!me.getQuest(sdk.quests.TheSearchForCain, 4)) {

    const stones = [
      getUnit(2, 17),
      getUnit(2, 18),
      getUnit(2, 19),
      getUnit(2, 20),
      getUnit(2, 21)
    ]
    while (stones.some(stone => !stone.mode)) {
      for (let i = 0, stone; i < stones.length; i++) {
        stone = stones[i];
        Pather.moveTo(stone.x, stone.y, 3, 0, 0);
        Misc.click(0, 0, stone);
        Attack.securePosition(me.x, me.y, 10, 0);
        delay(10);
      }
    }
  }

  while (!Pather.usePortal(38)) {
    Attack.securePosition(me.x, me.y, 10, 1000);
  }

  // Wait until init in trist
  Misc.poll(() => me.area === 38);

  Clear.on('sorting', filterNormalMonsters);
  try {
    moveTo([
        {x: 25132, y: 5070},
        {x: 25092, y: 5054},
        {x: 25046, y: 5080},
        {x: 25048, y: 5126},
        {x: 25050, y: 5163},
        {x: 25052, y: 5192},
        {x: 25074, y: 5183},
        {x: 25081, y: 5155},
        {x: 25119, y: 5124},
        {
          x: 25139, y: 5142,
          hook() { // save cain
            const gibbet = getUnit(2, 26)
            if (!gibbet.mode) {
              Pather.moveTo(gibbet.x, gibbet.y);
              Misc.openChest(gibbet);
            }
          }
        }, // safe the bitch
        {x: 25156, y: 5156},
        {x: 25130, y: 5196}]
      ,
      {
        callback() {
          return getUnit(1, sdk.monsters.Griswold)?.dead;
        }
      })
  } finally {
    Clear.off('sorting', filterNormalMonsters);
  }
  return;
}