/**
 * Rewrite from the async behavior worker included in kolbot to make it stand alone and not depend on any requires
 */
type WorkerType = ((worker?: Worker) => any) | WorkerType[];

class Worker {

  private workList: WorkerType[] = [];
  private workLowList: WorkerType[] = [];
  private workDisabled: boolean = false;

  push(newWork) {
    this.workList.push(newWork)
  }

  pushLow(newWork) {
    this.workLowList.push(newWork);
  }

  work(work: WorkerType) {
    try {
      if (Array.isArray(work)) {
        work.forEach(this.work.bind(this));
      } else {
        work(this);
      }
    } catch (error) {
      if (!error.message.endsWith('too much recursion')) {
        throw error;
      }
      print('[ÿc9Warningÿc0] Too much recursion');
    }
  }

  /** @internal */
  checkLowPrio() {
    if (!this.workDisabled) {
      const {workLowList: arr} = this;
      if (arr.length) {
        arr.splice(0, arr.length).forEach(this.work.bind(this));
      }
    }
  }

  /** @internal */
  checkNormal() {
    if (!this.workDisabled) {
      const {workList: arr} = this;
      if (arr.length) {
        arr.splice(0, arr.length).forEach(this.work.bind(this));
      }
    }
  }

  private runMap: Record<string, boolean> = {};

  runInBackground(name: string, cb: () => any) {
    const runner = () => {
      if (!this.runMap[name] || !cb()) {
        delete this.runMap[name];
      } else {
        this.workLowList.push(runner);
      }
    }
    this.workLowList.push(runner);
    this.runMap[name] = true;
  }

  static recursiveCheck(stackNumber?: number) {
    let stack = new Error().stack.match(/[^\r\n]+/g),
      functionName = stack[stackNumber || 1].substr(0, stack[stackNumber || 1].indexOf('@'));

    for (let i = (stackNumber || 1) + 1; i < stack.length; i++) {
      let curFunc = stack[i].substr(0, stack[i].indexOf('@'));

      if (functionName === curFunc) {
        return true;
      } // recursion appeared
    }

    return false;
  };

}

const worker = new Worker();

((globalThis) => {
  globalThis.await = function (promise: Promise<any>) {
    while (delay(1) && !(promise as any).stopped) {

    }
    return (promise as any).value;
  }
  globalThis.__delay = delay;
  globalThis.delay = function (amount: number): true {
    const recursive = Worker.recursiveCheck();
    const start = getTickCount();

    amount ||= 0;
    do {
      worker.checkNormal();
      const ms = getTickCount() - start > 3 ? 3 : 1;
      globalThis.__delay(ms)
      !recursive && worker.checkLowPrio();
    } while (getTickCount() - start <= amount);


    return true;
  }
})([].filter.constructor("return this")())
export default worker;