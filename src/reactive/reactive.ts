import {track, trigger} from "../effect/effect";
import {getSymbolByName, warn} from "../util";
import {__DEV__} from "../config";

/**
 * has been proxied object WeakMap
 * All registered proxies are stored here
 * */
export const ProxyTableWeakMap = new WeakMap<any,any>()

/**
 * Reactive handlers
 * Call the get method when you get a property
 * Call the set method when you set a property
 * The ReflectAPI is called to solve the 'this' problem of the getter function
 * */
const PROXY_HANDLER = {
    get(target: any, key: string | symbol, receiver: any): any {
        // The object has been proxy if it has this property
        if (key === getSymbolByName('HAS_PROXY')) return true
        // get original object
        if (key === getSymbolByName('ORIGINAL_ROW')) return target
        // get data
        const result = Reflect.get(target,key,receiver)
        // Get the corresponding dependency
        track(target , key)
        // deal array
        if (result instanceof Array) return proxyArray(result , target , key)
        // began depth proxy , Proxy Result if it is an object
        if (typeof result === 'object') return reactive(result)
        return result
    },
    set(target: any, key: string | symbol, value: any, receiver: any): boolean {
        const oldValue = target[key]
        const result = Reflect.set(target,key,value,receiver)
        const newValue = target[key]
        // Executing dependent response
        if (newValue !== oldValue)
            trigger(target , key , newValue , oldValue)
        return result
    }
}

/**
 * Work with data of array type
 * Make it available for response
 * */
const arrayPrototypeMethods: string[]
    = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']
export function proxyArray<T extends Array<any>>(arr: T, original: any, key: string|symbol): T {
    let proxy
    if (proxy = ProxyTableWeakMap.get(arr)) return proxy
    for (const name of arrayPrototypeMethods) {
        // @ts-ignore
        arr[name] = function (...arg){
            // @ts-ignore
            const result = Array.prototype[name].call(arr , ...arg)
            trigger(original , key , arr , arr)
            return result
        }
    }
    proxy = new Proxy(arr , PROXY_HANDLER)
    ProxyTableWeakMap.set(arr , proxy)
    return proxy
}

/**
 * Create reactive data
 * @param target : Object
 * */
export function reactive<T extends object>(target: T): T {
    if (!(typeof target === 'object') || (target instanceof Array)) {
        if (__DEV__) warn('the type of target is ' +
            typeof target + 'or array may you can' +
            ' try use ref')
        return target
    }
    // @ts-ignore If it has been proxied, return it
    if (isProxy(target)) return target
    // If the object has been proxied, return its proxy
    let proxy: T
    if (proxy = ProxyTableWeakMap.get(target)) return proxy
    proxy = new Proxy(target , PROXY_HANDLER)
    // set into proxy WeakMap
    ProxyTableWeakMap.set(target , proxy)
    return proxy
}

/** has been proxy or not */
export function isProxy<T extends object>(target: T): boolean {
    // @ts-ignore
    return !!(target[getSymbolByName('HAS_PROXY')])
}
