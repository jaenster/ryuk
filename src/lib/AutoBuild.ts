import worker from "../lib/worker";
import {Build} from "./builds/Build";
import Firen from "./builds/Firen";
import Freeze from "./builds/Freeze";
import Firzen from "./builds/Firzen";
import Nova from "./builds/Nova";
import CharData, {secondsToString} from "./CharData";
import sdk from "../sdk";
import {talkTo} from "../scripts/util";
import {assignSkillToHotkey} from "./utilities";
import charData from "./CharData";

const builds: Build[] = [
  Firen,
  Freeze,
  Firzen,
  Nova
]

declare global {
  interface ClassAttack {
    decideSkill(unit: Unit): number;
  }
}


export function respec() {

  const respecToBuild = builds.find(build => build.valid() && !!build.respec());
  if (!respecToBuild) return;

  const difficulty = respecToBuild.respec()
  console.log('Want to respec in ' + difficulty);

  const diff = (['normal', 'nightmare', 'hell'] as const)[me.diff];
  if (difficulty !== diff) {
    //ToDo; go to other diff
    console.warn('Respec in other difficulty');
    return;
  }

  if (!me.getQuest(sdk.quests.DenOfEvil, 0)) {
    Town.goToTown();
    Town.doChores();

    Pather.journeyTo(sdk.areas.DenOfEvil);
    Attack.clearLevel();
  }

  if (!me.getQuest(41, 0)) {
    console.log('Gonna respec');
    Town.goToTown(1);
    talkTo(NPC.Akara, false);

    const npc = getInteractedNPC();
    if (npc) {
      console.log('Respecing');
      sendPacket(1, 0x38, 4, 0, 4, npc.gid, 4, 0);
    }
  }


}

let lastBuild: Build | undefined;
export const findActiveBuild = () => {
  const curBuild = builds.find(build => build.valid() && build.active() as boolean);
  if (lastBuild !== curBuild) {
    console.log(' switch to custom shit of -> ', curBuild?.name);

    // rollback build specific overrides
    lastBuild?.overrides.forEach(override => override.rollback());

    // apply current build overrides
    (lastBuild = curBuild)?.overrides.forEach(override => override.apply());
  }
  return curBuild;
}
findActiveBuild();

me.on('levelUp', level => {
  charData.me.charlvl = level;

  D2Bot.printToConsole("Level up -- " + level);

  const now = new Date;
  const seconds = ((now.getTime() - CharData.timing.start.getTime()) / 1000) | 0;

  const lastLevel = CharData.timing.level[level - 1]?.date || CharData.timing.start;
  const splitSeconds = ((now.getTime() - lastLevel.getTime()) / 1000) | 0;

  CharData.timing.level[level] = {
    area: Object.keys(sdk.areas).find(area => me.area === sdk.areas[area]),
    time: seconds,
    humanTime: secondsToString(seconds),
    date: now,
    splitTime: splitSeconds,
    splitHumanTime: secondsToString(splitSeconds),
  };

  FileTools.appendText('data/RyukData.' + me.name + '.lvl.csv', `${me.area}\t${seconds}\t${me.charlvl}\t${splitSeconds}\n`);
});

me.on('canSkill', function () {
  const build = findActiveBuild();
  if (!build) {
    console.warn('No active build');
    return;
  }

  if (getUIFlag(0x17)) return; // cant skill while in trade

  const getPrerequisites = (skId) => ["reqskill3", "reqskill2", "reqskill1"].map(item => getBaseStat('skills', skId, item)).filter(el => {
    return typeof el === 'number' && el > 0 && el < 356 && !me.getSkill(el as number, 0);
  }) as number[];

  const skills = build.skills;

  let wantToSkillId: number = undefined;
  let canSkill = skills.some(function testSkill(level) {
    const {amount, skill, minLevel} = level;
    wantToSkillId = skill;

    // Cant skill this because our level is too low
    if (minLevel > me.charlvl) return false;
    // console.log(getSkillById(wantToSkillId), 'Min level -> '+minLevel+' -> '+(getBaseStat('skills', skill, 176) as number));

    let currentPoints = me.getSkill(skill, 0);

    // If we got hard points, also calculate the soft points if this skill requires that
    if (currentPoints && level.hasOwnProperty('softSkills') && level.softSkills) {
      currentPoints = me.getSkill(skill, 1);
    }

    if (currentPoints >= Math.min(amount, 20)) return false;

    // Cant put 2 points in fireball at lvl 12. Single point per char level with a max of 20
    // console.log(getSkillById(wantToSkillId), getBaseStat('skills', skill, 176) as number + currentPoints, '>', me.charlvl)
    if (getBaseStat('skills', skill, 'reqlevel') as number + currentPoints > me.charlvl) return false;

    // See if we got any skills that we need before this skill
    let prerequisites = getPrerequisites(skill);
    if (prerequisites.length) return testSkill({amount: 1, skill: prerequisites[0], minLevel: 0})

    // Yep we want this
    return true;
  });

  if (canSkill && wantToSkillId) {
    const skillPlan = skills.filter(({skill}) => skill === wantToSkillId);
    if (skillPlan.length) {
      console.log('Skilling ' + getSkillById(wantToSkillId) + ' (' + (me.getSkill(wantToSkillId, 0) + 1) + '/' + skillPlan.reduce((acc, cur) => acc + cur.amount, 0) + ')');
    } else {
      const parent = skills.filter(({skill}) => getPrerequisites(skill)[0] === wantToSkillId).first()?.skill;
      console.log('Skilling ' + getSkillById(wantToSkillId) + ' as prerequisites of ' + (parent ? getSkillById(parent) : 'unknown'));
    }
    useSkillPoint(wantToSkillId);

    if (typeof build.hotkeys !== 'undefined') {
      build.hotkeys.some(hotkey => {
        // If this is the first skill put on it, put the
        if (hotkey.skill === wantToSkillId && me.getSkill(wantToSkillId, 0) === 0) {
          CharData.hotkeys.push(hotkey);
          assignSkillToHotkey(wantToSkillId, hotkey.hand, hotkey.key)
        }
      })
    }
  }
})

me.on('canStat', function statHandler(availablePoints) {

  const build = findActiveBuild();
  if (!build) {
    console.warn('No active build')
    return;
  }
  console.log('Statting?');

  // credits to dzik for a big part of original code
  const checkStat = (stat, items) => {
    let bonus = 0, i;
    for (i = 0; i < items.length; i++) {
      bonus += items[i].getStatEx(stat);
    }
    return (me.getStat(stat) as number | 0) - bonus;
  };


  // Stat the char to a specified build. Thanks dzik <3
  var i, j, points, stat, items, charms, one, before, tick,
    missing = [0, 0, 0, 0],
    send = [0, 0, 0, 0],
    names = ["strength", "energy", "dexterity", "vitality"];

  if (!me.ingame || !me.getStat(4)) {
    return; // Pointless to check without points or when we are not in game
  }
  points = me.getStat(4); // how many points we can use.

  // Get items
  items = me.findItems(null, 1, 1); // mode 1 = equipped, location 1 = body

  // In case of xpac we want to look for charms too (they can give +str/dex)
  if (!!me.gametype) { // expansion
    for (j = 603; j <= 605; j++) { // charms in inventory
      charms = me.findItems(j, null, 3);
      if (!!charms.length) items = items.concat(charms);
    }
  }

  // check for the stats at the items
  for (i = 0; i < 4; i++) {
    stat = checkStat(i, items);
    if (stat < build.stats[names[i]][0]) {
      missing[i] = build.stats[names[i]][0] - stat;
    }
  }

  let lastPoints = points;
  while (!!points) { // in case we have more than one level at once.
    for (i = 0; i < 4; i++) {
      one = Math.max(Math.min(build.stats[names[i]][1], missing[i] - send[i], points), 0);
      send[i] += one;
      points -= one;
    }
  }
  for (i = 0; i < 4; i++) {
    if (send[i] > 32) { // i cannot explain that ...
      points += send[i] - 32;
      send[i] = 32;
    }
  }


  // first async stat, disable the checks for now
  // @ts-ignore
  statHandler.disabled = true;


  console.log('Statting 1234?');
  // async stat
  worker.runInBackground('___tempstat', (() => {
    let i = 0, state = 0, before; // stat we are checking right now

    return function () {
      // noinspection FallThroughInSwitchStatementJS
      switch (state) {
        case 0: {

          // Do we need to stat this?
          if (!send[i]) {
            i++; // next in line
            break;
          }

          before = me.getStat(i);
          // @ts-ignore
          sendPacket(1, 0x3A, 1, i, 1, send[i] - 1); // <3 dzik
          state++;
        }

        // no break
        case 1: {

          // Did the stat change yet?
          if (before === me.getStat(i)) break;

          console.debug("Added +" + send[i] + " to " + names[i]);
          state++;
        }
      }

      if (state === 2) {
        i++;
        before = state = 0;
      }

      let done = !(i > -1 && i < 5);

      // Once we are done, we can check for stats again
      if (done) {
        // @ts-ignore
        statHandler.disabled = false;
      }

      return !done;
    }
  })());
});
