import './overrides/Console'
import './overrides/D2BSImprovements'
import './lib/Promise';
import {Events} from "./lib/Events";
import {Watch} from "./lib/Decorators";
import {CopyDataEvent} from "./lib/CopyDataEvent";


const Starter = (function () {
  class StarterClass extends Events {

    @Watch('handle')
    handle: number;

    @Watch('gameInfo')
    gameInfo: {
      error: string,
      crashInfo: {
        currScript: number,
        area: number,
      },
      switchKeys: boolean,
    }

    @Watch('crashInfo')
    crashInfo: object
    copyData = new CopyDataEvent;

    constructor() {
      super();

      if (!FileTools.exists("data/" + me.profile + ".json")) DataFile.create();

      this.copyData.on('Handle', handle => this.handle = handle);
      this.copyData.once(2, string => {
        console.log('sdafklklfasdjafsdlkjafsd');
        return this.gameInfo = JSON.parse(string);
      });
      this.copyData.once(0xf124, string => this.crashInfo = JSON.parse(string));
    }

    async init() {
      this.once('handle', setupHeartbeat);

      await Promise.all([
        this.waitForHandle(),
        this.waitGameInfo(),
      ])

      initOOGHandlers();
      this.emit('init');
    }

    private waitGameInfo() {
      return new Promise(resolve => {
        if (this.gameInfo) resolve(this.gameInfo);
        this.once('gameInfo', () => resolve());
      })
    }

    private waitForHandle() {
      return new Promise(resolve => {
        if (this.handle) resolve(this.handle);
        this.once('handle', (handle) => resolve(handle));
      })
    }
  }

  return new StarterClass;
})();

//@ts-ignore
setTimeout(() => Starter.init(), 0);

function initOOGHandlers() {
  const stack = new Error().stack.match(/[^\r\n]+/g);
  let directory = stack[1].match(/.*?@.*?d2bs\\(kolbot\\?.*)\\.*(\.js|\.dbj):/)[1].replace('\\', '/') + '/';
  if (directory.indexOf('kolbot') === 0) directory = directory.substr('kolbot'.length);
  // @ts-ignore
  const fileList = dopen(directory + '/lib/oog/init').getFiles();
  if (fileList) fileList.filter(filename => filename.substr(-3) === '.js').forEach(function (filename) {
    const shortFilename = filename.substr(filename, filename.length - 3);
    // @ts-expect-error
    require('./lib/oog/init/' + shortFilename)
  });
}

function setupHeartbeat(handle) {
  DataFile.updateStats("handle", handle);
  load("tools/heartbeat.js");
  D2Bot.init();
  D2Bot.requestGameInfo();
}

{
  const globalThis = [].filter.constructor('return this')();
  // Override global starter
  globalThis.RyukStarter = Starter;
}

