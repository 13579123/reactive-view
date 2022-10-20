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
                                        callback: WatchCallback<T>|WatchOption<T>): void {
    const option = getWatchArgument(callback)
    let getter: () => T
    let run: WatchCallback<T>
    // @ts-ignore set getters
    if (typeof args === "function") getter = args
    else {
        let result = reactive(args)
        run = option.handler
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
            if (!first) run(newValue , oldValue)
            oldValue = newValue
            first = false
        }
    })
    return
}
