import {Events} from "./Events";
import Worker from "./worker";

export interface CopyDataEvent {
  on<S = this>(msg: string, handler: (this: S, mode: number) => void): this

  once<S = this>(msg: string, handler: (this: S, mode: number) => void): this

  off<S = this>(msg: string, handler: (this: S, mode: number) => void): this

  emit<S = this>(msg: string, value: number): this

  on<S = this>(key: number, handler: (this: S, msg: string) => void): this

  once<S = this>(key: number, handler: (this: S, msg: string) => void): this

  off<S = this>(key: number, handler: (this: S, msg: string) => void): this

  emit<S = this>(key: number, msg: string): this
}

export class CopyDataEvent extends Events {
  constructor() {
    super()


    const self = this; // d2bs dont care about this scoping in events, so, we need an old school self argument here
    addEventListener('copydata', (...args) => Worker.push(() => self.d2bsEvent(...args)));
  }

  private d2bsEvent(mode, msg) {
    this.emit(msg, mode);
    this.emit(mode, msg);
  }
}