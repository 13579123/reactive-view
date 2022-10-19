import {getSymbolByName} from "../util";

export function toRow<T = any>(proxy: T):T {
    // @ts-ignore
    return proxy[getSymbolByName('ORIGINAL_ROW')]
}
