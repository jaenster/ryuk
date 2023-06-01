import {Events} from "./Events";

export function Watch(event) {
  return function <T extends Events>(target: T, key) {
    const wkm = new WeakMap<typeof target, string>()
    Object.defineProperty(target, key, {
      get() {
        return wkm.get(this)
      },
      set(v: any) {
        const old = wkm.get(this);
        wkm.set(this, v);
        this.emit(event, v, old)
      }
    })
  }
}