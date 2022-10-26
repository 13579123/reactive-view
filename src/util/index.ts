import {__DEV__} from "../config";

export function warn(...rest: any): void {
    if (!__DEV__) return
    if (!console) throw rest
    console.warn(...rest)
}

export function error(...rest: any): void {
    if (!__DEV__) return
    if (!console) throw rest
    console.error(...rest)
}

export function log(...rest: any): void {
    if (!__DEV__) return
    if (!console) throw rest
    console.log(...rest)
}

/**
 * get symbol by string
 * */
const SymbolNameTable = new Map<string , symbol>()
export function getSymbolByName(name: string): symbol {
    let s = SymbolNameTable.get(name)
    if (s) return s
    s = Symbol()
    SymbolNameTable.set(name , s)
    return s
}

/**
 * Traversing an object in depth
 * */
export function readObject(obj: any, deal?: (key: string|symbol) => void) {
    const ReadPointerSet = new Set<any>()
    function read(obj: any) {
        Object.keys(obj).forEach((k) => {
            if (ReadPointerSet.has(obj[k])) return
            deal && deal(k)
            ReadPointerSet.add(obj[k])
            if (typeof obj[k] === 'object') read(obj[k])
        })
    }
    return read(obj)
}
