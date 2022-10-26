import {toRow} from "../reactive/toRow";

/**
 * the option of effect function
 * lazy default is false
 * scheduler default is null
 * onStop default is null
 * onTrack default is null
 * onTrigger default is null
 * */
interface EffectOption<T> {
    lazy?: boolean,
    scheduler?: ( _runner: ()=>T ) => T,
    onStop?: () => void,
    onTrack?: (e: TrackEvent) => void,
    onTrigger?: (e: TriggerEvent) => void,
}

/** track event type */
type TrackEvent = {
    target: any,
    key: string|symbol,
    type: string,
    effect: Runner<any>,
}
/** trigger event type */
type TriggerEvent = {
    target: any,
    key: string|symbol,
    type: string,
    oldValue: any,
    newValue: any,
    effect: Runner<any>,
}

export class Runner<T> extends Function {
    stop() {}
}

/**
 * effect class
 * all reactive data change will notice the object
 * uuid is the effect id
 * */
class ReactiveEffect<T> {
    static uuid = 0
    static CurrentEffect: ReactiveEffect<any>|null = null
    private activity: boolean = true
    public parent: ReactiveEffect<any>|null = null
    public readonly id: number
    public readonly runner: (() => any)
    public readonly scheduler: (( _runner: ()=>any ) => any)|null
    public readonly onTrack: ((e: TrackEvent) => any)|null
    public readonly onTrigger: ((e: TriggerEvent) => any)|null
    public readonly onStop: (() => any)|null
    public callRunner: Runner<T>|undefined
    public depth: Set<ReactiveEffect<any>>[] = []
    constructor(runner: () => any , option: EffectOption<T> = {}) {
        this.id = ++ReactiveEffect.uuid
        this.runner = runner
        this.scheduler = option.scheduler || null
        this.onTrack = option.onTrack || null
        this.onTrigger = option.onTrigger || null
        this.onStop = option.onStop || null
    }
    private clearDepth() {
        for (let i = 0; i < this.depth.length; i++)
            this.depth[i].delete(this)
        this.depth = []
    }
    private pushStack() {
        // bind current effect object
        this.parent = ReactiveEffect.CurrentEffect
        ReactiveEffect.CurrentEffect = this
    }
    private popStack() {
        // unbind current effect object
        ReactiveEffect.CurrentEffect = this.parent
        this.parent = null
    }
    public run() {
        if (!this.activity) return this.runner()
        this.pushStack()
        // clear depths
        this.clearDepth()
        // execute runner
        try { return this.runner() }catch (e) { console.log(e) }
        finally { this.popStack() }
    }
    public stop() {
        if(!this.activity) return
        this.activity = false
        this.clearDepth()
        if (this.onStop) this.onStop()
    }
}

/**
 * core effect function
 * Call run to re-render when data within run changes
 * */
export function effect<T>(run: () => T , option: EffectOption<T> = {}): Runner<T> {
    const _effect = new ReactiveEffect(run , option)

    if (!option.lazy && _effect.scheduler)
        _effect.scheduler(_effect.run.bind(_effect))
    else if (!option.lazy) _effect.run()

    let result: Runner<T>

    if (_effect.scheduler)
        // @ts-ignore
        result = () => _effect.scheduler(_effect.run.bind(_effect))
    else
        // @ts-ignore
        result = _effect.run.bind(_effect)

    result.stop = _effect.stop.bind(_effect)

    _effect.callRunner = result

    return _effect.callRunner
}

/**
 * All dependent storage containers
 * */
const DependentStorageWeakMap = new WeakMap<any,Map< string|symbol , Set< ReactiveEffect<any> > > >()

/**
 * Collect all dependencies and bind them to the current effect
 * if current Effect is null , do not anything
 * */
export function track(target: any, key: string | symbol) {
    if (!ReactiveEffect.CurrentEffect) return
    const effect = ReactiveEffect.CurrentEffect
    let map: Map<string | symbol , Set<ReactiveEffect<any>>>|undefined,set: Set<ReactiveEffect<any>>|undefined
    map = DependentStorageWeakMap.get(target)
    if (!map) DependentStorageWeakMap.set(target , map = new Map)
    set = map.get(key)
    if (!set) map.set(key , set = new Set)
    set.add(effect)
    effect.depth.push(set)
    if (!effect.callRunner) return;
    if (effect.onTrack) {
        effect.onTrack({
            target: toRow(target),
            key,
            type: 'get',
            effect: effect.callRunner
        })
    }
}

/**
 * Data change monitoring detects
 * and executes the response function
 * */
export function trigger(target: any, key: string | symbol,
                        newValue: any, oldValue: any) {
    let map:
        Map<string|symbol,Set<ReactiveEffect<any>>>|undefined,set:Set<ReactiveEffect<any>>
        |
        undefined
    map = DependentStorageWeakMap.get(target)
    if (!map) return
    set = map.get(key)
    if (!set) return
    new Set(set).forEach(effect => {
        if (effect === ReactiveEffect.CurrentEffect || !effect.callRunner) return
        if (effect.onTrigger) {
            effect.onTrigger({
                target: toRow(target),
                key,
                type: 'set',
                oldValue,
                newValue,
                effect: effect.callRunner
            })
        }
        effect.callRunner()
    })
}
