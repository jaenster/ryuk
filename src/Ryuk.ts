import './lib/AutoEquip'
import './lib/eventEmitter'
import './lib/AutoBuild'
import './lib/PickitHooks'
import './lib/Quests'
import './lib/AutoRuneword'

import {respec} from "./lib/AutoBuild"

import decisions from "./decisions/index";
import {Decision} from "./decisions/decision";
import {gameData} from "./lib/CharData";

console.log('Loaded Ryuk base files');
export default function () {
  console.log('Starting Ryuk');

  me.automap = true;
  if (me.inTown) {
    Town.getCorpse();
  }

  Cubing.cursorCheck();

  // So we can override this
  ClassAttack['dangerAttack'] = () => void 2;

  // @ts-ignore Load once all is loaded
  ['TownChicken'].forEach(key => require("./lib/" + key));

  let decision: Decision;
  try {
    do {

      respec();

      decision = decisions();
      if (decision) {

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
  } catch (e) {
    console.error(e.stack);
    console.log(e.message);
    throw e;
  }
}
