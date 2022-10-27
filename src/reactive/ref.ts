import {track, trigger} from "../effect/effect";
import {getSymbolByName} from "../util";
import {proxyArray, reactive} from "./reactive";

type RefOption<T> = {get?: () => T , set?: (v: T) => void}

export class Ref<T> {
    public data: T

    get [getSymbolByName('ORIGINAL_ROW')] () { return this.data }

    get value(): T {
        return this.get()
    }

    set value(v: T) {
        if (v instanceof Array) v = proxyArray(v , this , 'value')
        this.set(v)
    }

    private get() {
        track(this , 'value')
        return this.data
    }
    private set(v: T) {
        const oldValue = this.data
        if(v === this.data) return
        this.data = v
        trigger(this , 'value' , this.data , oldValue)
    }

    constructor(data: T , option: RefOption<T> = {}) {
        if (data instanceof Array) this.data = proxyArray(data , this , 'value')
        // @ts-ignore
        else if (typeof data === 'object') this.data = reactive(data)
        else this.data = data

        if (option.get) this.get = option.get
        if (option.set) this.set = option.set
    }
}

export function ref<T = any>(data: T): Ref<T> {
    return new Ref(data)
}
