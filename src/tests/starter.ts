// fool typescript
if (typeof global === "undefined") var global = [].filter.constructor('return this')();
global['globalThis'] = [].filter.constructor('return this')();

import "../overrides/Console";
import {Override} from "../overrides/Override";

//@ts-ignore
const isDefault = (getScript(true).name.toLowerCase() === 'default.dbj');


///////////////////////////////////
// overrides
///////////////////////////////

if (isDefault) {
  // @ts-expect-error
  const fileList = dopen('libs/Ryuk/overrides').getFiles();
  if (fileList) fileList.filter(filename => filename.substr(-3) === '.js').forEach(function (filename) {
    const shortFilename = filename.substr(filename, filename.length - 3);
    // @ts-expect-error
    require('../overrides/' + shortFilename)
  });

  Override.all.forEach(override => override.apply());
}

globalThis['LoadConfig'] = function () {
  Scripts.UnitTests = true;
}

if (isDefault) {
  // @ts-ignore global var
  globalThis['UnitTests'] = require('./UnitTests').default;
}
