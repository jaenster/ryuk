import {Decision} from "../decisions/decision";

const handler = {
  get: function (target, p) {
    //transfer hasOwnProperty to has
    if (p === 'hasOwnProperty') return this.has.bind(this, target);


    if (typeof target[p] !== 'undefined') return target[p];

    // If we can get this straight out of a file
    if (includePath.hasOwnProperty(p)) {
      // @ts-ignore   - Require is a thing
      return target[p] = require(includePath[p]);
    }
    return undefined;
  },
  set: function (target, p, v) {
    target[p] = v;
    return true;
  },

  has: function (target, p) {
    return target.hasOwnProperty(p) || includePath.hasOwnProperty(p);
  }
}

const target = {};
const includePath = {};
const lazyLoading = new Proxy(target, handler);

const stack = new Error().stack.match(/[^\r\n]+/g);
let directory = stack[1].match(/.*?@.*?d2bs\\(kolbot\\?.*)\\.*(\.js|\.dbj):/)[1].replace('\\', '/') + '/';
if (directory.indexOf('kolbot') === 0) directory = directory.substr('kolbot'.length);


const readDir = path => {
  // @ts-ignore
  const fileList = dopen(directory + '/' + path).getFiles();
  if (fileList) fileList.filter(filename => filename.substr(-3) === '.js')
    .forEach(function (filename) {
      const shortFilename = filename.substr(filename, filename.length - 3);
      includePath[shortFilename] = './' + path + '/' + shortFilename;
    });
}

for (let i = 1; i <= 5; i++) readDir('/act' + i); // all act files
readDir('/general'); // Main files (attack/ intown)


export default class Script extends Decision {
  public run() {
    lazyLoading[this.type]();
    this.markAsDone();
  }
}