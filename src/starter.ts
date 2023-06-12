// fool typescript
if (typeof global === "undefined") var global = [].filter.constructor('return this')();
global['globalThis'] = [].filter.constructor('return this')();

import "./overrides/Console";
import {Override} from "./overrides/Override";

// All the hacky stuff to load ryuk properly

//@ts-ignore
const isDefault = (getScript(true).name.toLowerCase() === 'default.dbj');

const stack = new Error().stack.match(/[^\r\n]+/g);
let directory = stack[1].match(/.*?@.*?d2bs\\(kolbot\\?.*)\\.*(\.js|\.dbj):/)[1].replace('\\', '/') + '/';
if (directory.indexOf('kolbot') === 0) directory = directory.substr('kolbot'.length);


///////////////////////////////////
// overrides
///////////////////////////////

if (isDefault) {
  // @ts-expect-error
  const fileList = dopen(directory + '/overrides').getFiles();
  if (fileList) fileList.filter(filename => filename.substr(-3) === '.js').forEach(function (filename) {
    const shortFilename = filename.substr(filename, filename.length - 3);
    // @ts-expect-error
    require('./overrides/' + shortFilename)
  });

  Override.all.forEach(override => override.apply());
}

//////////////////////////////
// Load all threads
/////////////////////////////

if (isDefault) {
  // @ts-expect-error
  const fileList = dopen(directory + '/threads').getFiles();
  if (fileList) fileList.filter(filename => filename.substr(-3) === '.js').forEach(function (filename) {
    const shortFilename = filename.substr(filename, filename.length - 3);
    // @ts-expect-error
    require('./threads/' + shortFilename)
  });
}

///////////////////////////////////
// config file
///////////////////////////////
globalThis['LoadConfig'] = function () {
  console.log('Loading config file');

  {
    // @ts-expect-error
    const fileList = dopen(directory + '/config').getFiles();
    if (fileList) fileList.filter(filename => filename.substr(-3) === '.js').forEach(function (filename) {
      const shortFilename = filename.substr(filename, filename.length - 3);
      // @ts-expect-error
      const config = require('./config/' + shortFilename);
      config();
    });
  }

  // Make sure ryuk.js exists in bots folder
  Scripts.Ryuk = true;
  Scripts.Test = true; // Makes default.dbj skip all kinds of in town healing and shit
}

///////////////////////////////////
// entry script
///////////////////////////////

if (isDefault) {
// @ts-ignore global var
  globalThis['Ryuk'] = require('./Ryuk').default;

  // @ts-expect-error
  const fileList = dopen(directory + '/lib/town/actions').getFiles();
  print('----------------------------------------Loading town stuff');
  if (fileList) fileList.filter(filename => filename.substr(-3) === '.js').forEach(function (filename) {
    const shortFilename = filename.substr(filename, filename.length - 3);
    // @ts-expect-error
    require('./lib/town/actions/' + shortFilename)
  });

}

