import Worker from "../lib/worker";
import Messaging from "./Messaging";
import {Hotkey} from "./builds/Build";
import {recursiveSearch, updateRecursively} from "./utilities";
import settings from "../settings/settings";

let oldData = '{}';

export type DifficultyStats = {
  waypoints: boolean[],
  quests: {
    [data: string]: {
      flags: number,
      finishTime?: Date,
      charLvl?: number,
    }
  }
}

export type GameData = {
  charLvl: number,
  startTime: Date,
  log: string[],
  scripts: { startTime: Date, name: string }[],
}

export type CharData = {
  normal: DifficultyStats,
  nightmare: DifficultyStats,
  hell: DifficultyStats,
  timing: {
    start: Date,
    level: {
      [data: number]: {
        area: string,
        time: number,
        humanTime: string,
        splitTime: number,
        splitHumanTime: string,
        date: Date,
      },
    },
  },
  hotkeys: Hotkey[],
  merc: {
    type: 0 | 1 | 2, // act 1/2 or 0
    id: number;
    name: string;
    level: number;
    hireling: any;
    typeid: number;
    subtype: number;
    skills: { name: string, lvl: number }[];
    cost: number;
    hp: number;
    defense: number;
    strength: number;
    dexterity: number;
    experience: number;
    attackrating: number;
    dmg_min: number;
    dmg_max: number;
    resists: number;
  },
  gameData: GameData[],
  me: {
    charlvl: number,
  }
}

const wp = [1, 3, 4, 5, 6, 27, 29, 32, 35, 40, 48, 42, 57, 43, 44, 52, 74, 46, 75, 76, 77, 78, 79, 80, 81, 83, 101, 103, 106, 107, 109, 111, 112, 113, 115, 123, 117, 118, 129];
const defaults: CharData = {
  normal: {waypoints: wp.map(() => false), quests: {}},
  nightmare: {waypoints: wp.map(() => false), quests: {}},
  hell: {waypoints: wp.map(() => false), quests: {}},
  timing: {
    start: new Date(),
    level: {},
  },
  hotkeys: [],
  merc: {
    type: 0,
    id: 0,
    name: '',
    level: 0,
    hireling: 0,
    typeid: 0,
    subtype: 0,
    skills: [],
    cost: 0,
    hp: 0,
    defense: 0,
    strength: 0,
    dexterity: 0,
    experience: 0,
    attackrating: 0,
    dmg_min: 0,
    dmg_max: 0,
    resists: 0,
  },
  gameData: [],
  me: {
    charlvl: 0,
  }
}


const charData: CharData = Object.assign({}, defaults);

export const gameData: GameData = {
  charLvl: me.charlvl,
  startTime: new Date(),
  log: [],
  scripts: [],
};

export function secondsToString(actualSeconds) {
  let hours = (Math.floor(((actualSeconds % 31536000) % 86400) / 3600)).toString();
  let minutes = (Math.floor((((actualSeconds % 31536000) % 86400) % 3600) / 60)).toString();
  let seconds = ((((actualSeconds % 31536000) % 86400) % 3600) % 60).toString();

  if (hours.length === 1) hours = '0' + hours;
  if (minutes.length === 1) minutes = '0' + minutes;
  if (seconds.length === 1) seconds = '0' + seconds;

  return hours + ":" + minutes + ":" + seconds;
}

// @ts-ignore // Only load this shit in global scope

try {
  const newContent = FileTools.readText('data/RyukData.' + settings.charName + '.json');
  if (newContent) {
    let newData = {};
    try {
      newData = JSON.parse(newContent);
      oldData = newContent;
    } catch (e) {
      newData = {};
      console.error(e.message);
    }
    Object.assign(charData, newData);

    // convert json'd string to date
    charData.timing.start = new Date((charData.timing.start) as any as string);
    Object.keys(charData.timing.level).forEach(key => {
      charData.timing.level[key].date = new Date((charData.timing.level[key].date) as any as string)
    })
  }
} catch (e) {
  Object.assign(charData, defaults);
}
let timer = getTickCount();
Worker.runInBackground('charData', function () {
  if (getTickCount() - timer < 1000) return true;

  timer = getTickCount();
  const newData = JSON.stringify(charData);
  if (newData && newData !== oldData) {
    try {
      const result = recursiveSearch(JSON.parse(oldData), charData)
      FileTools.writeText('data/RyukData.' + settings.charName + '.json', newData)
      Messaging.send({CharDataUpdate: result})
      oldData = newData;
    } catch (e) {
      console.error(e.message);
    }
  }
  return true;
})

//@ts-ignore
if (getScript(true).name.toString() === 'default.dbj') {
  charData.me.charlvl = me.charlvl;
  // add new game object to char data
  charData.gameData.push(gameData);
}

Messaging.on('CharDataUpdate', (updatedCharData: Partial<CharData>) => {
  // @ts-ignore
  console.debug(getScript(true).name, 'Updated -> ', updatedCharData)
  updateRecursively(charData, updatedCharData);
  oldData = JSON.stringify(charData);
})


export default charData;