import {randomString} from "../lib/utilities";

export enum Mode {
  CLASSIC = 1 << 0,
  XPAC = 1 << 1,
  SOFTCORE = 1 << 2,
  HARDCORE = 1 << 3,
  EUROPE = 1 << 4,
  USEAST = 1 << 5,
  USWEST = 1 << 6,
  ASIA = 1 << 7
}

const defaultSettings = {
  mode: Mode.SOFTCORE | Mode.XPAC,
  charName: '',
  username: '',
  password: '',
}

const stack = new Error().stack.match(/[^\r\n]+/g);
let directory = stack[1].match(/.*?@.*?d2bs\\(kolbot\\?.*)\\.*(\.js|\.dbj):/)[1].replace('\\', '/') + '/';
if (directory.indexOf('kolbot') === 0) directory = directory.substr('kolbot'.length);
if (!FileTools.exists(directory + me.windowtitle + '.js')) {
  const copy = JSON.parse(JSON.stringify(defaultSettings)) as typeof defaultSettings;

  copy.charName = copy.username = randomString(8, 10);
  copy.password = randomString(8, 10);

  FileTools.writeText(directory + me.windowtitle + '.js',
    `module.exports = ` + JSON.stringify(copy) + ``
  )
}
// @ts-ignore
const localSettings = require('./' + me.windowtitle);

class SettingsProto {
  getRealmNumber(this: SettingsProto & typeof defaultSettings) {
    if (this.mode & Mode.USWEST) return 0;
    if (this.mode & Mode.USEAST) return 1;
    if (this.mode & Mode.ASIA) return 2;
    if (this.mode & Mode.EUROPE) return 3;
  }
}

const settings: typeof defaultSettings & SettingsProto = Object.assign(Object.create(SettingsProto), defaultSettings, localSettings);

export default settings;

