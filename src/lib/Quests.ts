import CharData from "./CharData";
import sdk from "../sdk";

export enum questBits {
  DONE = (1 << 1),
  JUSTDONE = (1 << 2),


  LONG_FINISHED = (1 << 12),
}


const diff = (['normal', 'nightmare', 'hell'] as const)[me.diff];

me.on('quest', function (no, flags, old) {

  const questName = Object.keys(sdk.quests).find(key => sdk.quests[key] === no);
  if (typeof CharData[diff].quests[questName] !== 'object') CharData[diff].quests[questName] = {flags: 0};

  CharData[diff].quests[questName].flags = flags;

  // If quest changed from not done to done
  if (flags & questBits.DONE && typeof CharData[diff].quests[questName].charLvl === 'undefined') {
    D2Bot.printToConsole('Finished quest -> ' + questName + '@' + diff);
    CharData[diff].quests[questName].finishTime = new Date();
    CharData[diff].quests[questName].charLvl = me.charlvl;
  }
})