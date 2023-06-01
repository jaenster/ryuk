import worker from "./worker";

class Tracker<T> {

  constructor(
    public readonly fn: () => T,
    public readonly cb: (n: T, o: T) => any,
    public value: T = fn(),
  ) {
  }
}

export class Delta {
  public readonly trackers: Tracker<any>[] = [];


  track<T>(fn: () => T, cb: (n: T, o: T) => any) {
    this.trackers.push(new Tracker<any>(fn, cb));
  }

  check() {
    for (const tracker of this.trackers) {
      const val = tracker.fn();

      if (val != tracker.value) {
        tracker.cb(val, tracker.value);
        tracker.value = val;
      }
    }
  }

  destroy() {
    this.active = false;
    this.trackers.splice(0, this.trackers.length);
  }

  private static ids = 0;
  private active: boolean = true;

  constructor() {
    worker.runInBackground('__deltas-' + (Delta.ids++), () => {


      return this.active;
    })
  }
}