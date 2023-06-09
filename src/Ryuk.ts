//@ts-expect-error
require('./lib/AutoEquip');

// @ts-ignore
['eventEmitter', 'AutoBuild', 'PickitHooks', 'Quests', 'AutoRuneword'].forEach(key => require("./lib/" + key));
import {respec} from "./lib/AutoBuild"

import decisions from "./decisions/index";
import {Decision} from "./decisions/decision";
import {gameData} from "./lib/CharData";

console.log('Loaded Ryuk base files');
export default function () {
  console.log('Starting Ryuk');

  me.automap = true;

  Cubing.cursorCheck();

  // So we can override this
  ClassAttack['dangerAttack'] = () => void 2;

  // @ts-ignore Load once all is loaded
  ['TownChicken'].forEach(key => require("./lib/" + key));

  let decision: Decision;
  do {

    respec();

    decision = decisions();
    if (decision) {


      console.log('here', decision.type);
      gameData.scripts.push({
        startTime: new Date,
        name: decision.type,
      })

      try {
        decision.run();
      } catch (e) {
        console.log(e.stack);
        Misc.errorReport(e);
      } finally {
        decision.markAsDone();
      }
    }
  } while (decision);
}
