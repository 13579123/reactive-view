import {effect, trigger} from "../effect/effect";
import {Ref} from "../reactive/ref";
import {error} from "../util";

type ComputedOption = {
    get: () => any ,
    set?: (d: any) => void
}

export function computed<T>(fn: (() => T)|ComputedOption)
    : Ref<T> {
    let option: ComputedOption = {get() {}}
    if (typeof fn === "function") option.get = fn
    else option = fn
    const data = new Ref<any>(null , {
        set(v) {
            if (option.set) option.set(v)
            else error('this property is not define "setter"')
        }
    })
    effect(option.get , {
        scheduler(runner) {
            const oldValue = data.value
            data.data = runner()
            trigger(data , 'value' , data.value , oldValue)
        }
    })
    return data
}
