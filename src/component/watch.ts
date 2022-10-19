import {effect} from "../effect/effect";
import {reactive} from "../reactive/reactive";
import {readObject} from "../util";

type WatchCallback<T> = (newValue: T, oldValue: T) => void

type WatchOption<T> = {
    handler: WatchCallback<T>,
    depth: boolean,
}

function getWatchArgument<T>(arg: WatchCallback<T>|WatchOption<T>): WatchOption<T> {
    if (typeof arg === 'object') return arg
    else return {
        handler: arg,
        depth: false
    }
}

export function watch<T extends object>(args: (() => T)|T,
                                        callback: WatchCallback<T>): void {
    const option = getWatchArgument(callback)
    let getter: () => T
    // @ts-ignore set getters
    if (typeof args === "function") getter = args
    else {
        let result = reactive(args)
        callback = option.handler
        getter = () => {
            if (option.depth) readObject(result)
            return result
        }
    }
    /** Make a change response */
    let oldValue: T , first = true
    effect(getter , {
        scheduler(runner) {
            let newValue = runner()
            if (!first) callback(newValue , oldValue)
            oldValue = newValue
            first = false
        }
    })
    return
}
