// Type S is just so we can tell reference back to what the this type is @ the handler
export interface EventHandler<S = any> {
  (this: S, ...args): any;
}


const handlers = new WeakMap<Events, Map<PropertyKey, EventHandler[]>>();
const onceHandlers = new WeakMap<Events, Map<PropertyKey, EventHandler[]>>();

export class Events {
  // Generic type S to give to EventHandler<S> to typehint this function gets the same this as where the event is registered
  public on<S = this>(key: PropertyKey, handler: EventHandler<S>, handlerType = handlers): this {

    let map, set;
    !handlerType.has(this) ? handlerType.set(this, map = new Map) : map = handlerType.get(this);
    !map.has(key) ? map.set(key, set = []) : set = map.get(key);

    // Add this handler, since it has to be unique we dont need to check if it exists
    set.push(handler);

    return this;
  }

  public once<S = this>(key: PropertyKey, handler: EventHandler<S>): this {
    return this.on(key, handler, onceHandlers);
  }

  public off(key: PropertyKey, handler: EventHandler): this {
    [handlers, onceHandlers].forEach(handlerType => {
      let map, set, index;

      !handlerType.has(this) ? handlerType.set(this, map = new Map) : map = handlerType.get(this);
      !map.has(key) ? map.set(key, set = []) : set = map.get(key);

      index = set.indexOf(handler);
      if (index > -1) set.splice(index, 1);
    });

    return this;
  }

  public emit(key: PropertyKey, ...args: any): this {
    const onceSet = (onceHandlers.get(this)?.get(key));
    const restSet = (handlers.get(this)?.get(key));

    // store callbacks in a set to avoid duplicate handlers
    const callbacks = [
      ...(onceSet && onceSet.splice(0, onceSet.length) || []),
      ...restSet ? restSet : []
    ];

    callbacks.forEach(el => el.apply(this, args))


    return this;
  }
}