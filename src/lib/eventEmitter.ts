import {stats} from "../sdk";
import worker from '../lib/worker'
import {Events} from "./Events";

type oldType = {
  level: number
  stats: number,
  skills: number,
}
const old: oldType = {
  level: me.charlvl,
  stats: 0,
  skills: 0
};


let statSkillTimeout = getTickCount();
let questTicker = getTickCount();
let firstTime = true;
const questBits = Array.apply(null, Array(41));

worker.runInBackground('eventEmitter', function () {

  let tmp: any;
  if (old.level !== (tmp = me.charlvl)) {
    old.level = tmp;
    me.emit('levelUp', tmp);
  }

  if (getTickCount() - statSkillTimeout > 300 && !getInteractedNPC() && !getIsTalkingNPC()) {
    statSkillTimeout = getTickCount();
    if (old.stats !== (tmp = me.getStat(stats.Statpts))) {
      old.stats = tmp;
      console.log('canStat');
      tmp && me.emit('canStat', tmp);
    }

    if (old.skills !== (tmp = me.getStat(stats.Newskills))) {
      old.skills = tmp;
      console.log('canSkill');
      tmp && me.emit('canSkill', tmp);
    }
  }
  if (getTickCount() - questTicker > 3000) {
    questTicker = getTickCount();

    for (let i = 0; i < 41; i++) {
      let questShort = 0;
      for (let j = 0; j < 16; j++) {
        if (me.getQuest(i, j)) {
          questShort |= (1 << j);
        }
      }
      if (questShort !== questBits[i]) {
        me.emit('quest', i, questShort, questBits[i]);
        questBits[i] = questShort;
      }
    }

    sendPacket(1, 0x40);

    firstTime = false;
  }

  return true;
})

// @ts-ignore
Unit.prototype.on = Events.prototype.on;
// @ts-ignore
Unit.prototype.off = Events.prototype.off;
// @ts-ignore
Unit.prototype.once = Events.prototype.once;
// @ts-ignore
Unit.prototype.emit = Events.prototype.emit;