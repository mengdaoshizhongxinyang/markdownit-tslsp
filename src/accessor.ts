
export enum GlobalKey {
  JSS = '__Jss',
  Memory = '__Memory',
  Builder = '__Builder',
  ModuleLoader = '__ModuleLoader',
}

export type Memory = Map<string, any>;


export interface GlobalContext {
  [GlobalKey.Memory]: Memory;
}

export function getGlobalContext(): GlobalContext {
  return (globalThis ?? global) as any;
}

function isDef(val: unknown) {
  return val !== null && val !== undefined
}
export interface Accessor<T> {
  get(): T;

  set(val: T): void;
}

export function getAccessor<T = any>(name: string): Accessor<T | undefined>;
export function getAccessor<T = any>(name: string, defaultValue: T): Accessor<T>;
export function getAccessor<T = any>(name: string, defaultValue?: T): Accessor<T> {
  const key = `var::${name}`;
  const memory = getGlobalContext()[GlobalKey.Memory] as Memory;

  if (memory && !memory.has(key) && isDef(defaultValue)) {
    memory.set(key, defaultValue);
  }

  return {
    get() {
      return memory?.get?.(key);
    },
    set(val: T) {
      memory?.set?.(key, val);
    },
  };
}

export function getReference<T = any>(name: string, initVal: T) {
  const key = `ref::${name}`;
  const memory = getGlobalContext()[GlobalKey.Memory] as Memory;

  if (memory && !memory.has(key) && isDef(initVal)) {
    memory.set(key, initVal);
  }

  return initVal;
}
