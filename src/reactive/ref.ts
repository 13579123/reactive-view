import {track, trigger} from "../effect/effect";
import {getSymbolByName} from "../util";

export class Ref<T> {
    public data: T

    get [getSymbolByName('ORIGINAL_ROW')] () { return this.data }

    get value(): T {
        return this.get()
    }

    set value(v: T) {
        this.set(v)
    }

    private get() {
        track(this , 'value')
        return this.data
    }
    private set(v: T) {
        const oldValue = this.data
        this.data = v
        trigger(this , 'value' , this.data , oldValue)
    }

    constructor(data: T , option: {get?: () => T , set?: (v: T) => void} = {}) {
        this.data = data
        if (option.get) this.get = option.get
        if (option.set) this.set = option.set
    }
}

export function ref<T = any>(data: T): Ref<T> {
    return new Ref(data)
}
