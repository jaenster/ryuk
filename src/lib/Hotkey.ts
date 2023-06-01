/**
 * @author Jaenster
 * @description Simple module to hook upon keys
 */


import {Events} from "./Events";
import worker from '../lib/worker'


interface Hotkey {
  emit<S = this>(key: number, pressedKey?: number): this

  on<S = this>(key: number, handler: (this: S, key?: number) => void): this

  once<S = this>(key: number, handler: (this: S, key?: number) => void): this
}

const event: Hotkey = new Events;

addEventListener('keyup', key => (key = parseInt(key as string)) && key && worker.push(event.emit.bind(event, key)));

export default event;