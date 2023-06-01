/**
 * @description Easy communication between threads
 * @Author Jaenster
 */
import {Events} from "./Events";
import worker from "./worker";

const message = new class extends Events {
  send(what) {
    scriptBroadcast(what);
  }
}
export default message;


worker.runInBackground('messaging', (() => {
  const workBench = [];
  addEventListener('scriptmsg', data => workBench.push(data));

  return function () {
    if (!workBench.length) return true;

    let work = workBench.splice(0, workBench.length);
    work.filter(data => typeof data === 'object' && data)
      .forEach(function (data) {
        Object.keys(data).forEach(function (item) {
          message.emit(item, data[item]); // Trigger those events
        })
      });

    return true; // always, to keep looping;
  }
})());

