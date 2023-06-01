// @ts-ignore
const Worker = require('../lib/worker');


let counter = 0;
export default class BackgroundWorker {

  running: boolean = true;

  constructor(checker: (this: BackgroundWorker) => void) {
    Worker.runInBackground['___backgroundWorker' + (counter++)] = () => {
      checker.apply(this);
      return this.running;
    }
  }
}