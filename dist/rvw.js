(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.rvw = factory());
})(this, (function () { 'use strict';

    function warn(...rest) {
        if (!console)
            throw rest;
        console.warn(...rest);
    }
    function error(...rest) {
        if (!console)
            throw rest;
        console.error(...rest);
    }
    /**
     * get symbol by string
     * */
    const SymbolNameTable = new Map();
    function getSymbolByName(name) {
        let s = SymbolNameTable.get(name);
        if (s)
            return s;
        s = Symbol();
        SymbolNameTable.set(name, s);
        return s;
    }
    /**
     * Traversing an object in depth
     * */
    function readObject(obj, deal) {
        const ReadPointerSet = new Set();
        function read(obj) {
            Object.keys(obj).forEach((k) => {
                if (ReadPointerSet.has(obj[k]))
                    return;
                deal && deal(k);
                ReadPointerSet.add(obj[k]);
                if (typeof obj[k] === 'object')
                    read(obj[k]);
            });
        }
        return read(obj);
    }

    function toRow(proxy) {
        // @ts-ignore
        return proxy[getSymbolByName('ORIGINAL_ROW')];
    }

    /**
     * effect class
     * all reactive data change will notice the object
     * uuid is the effect id
     * */
    class ReactiveEffect {
        static uuid = 0;
        static CurrentEffect = null;
        activity = true;
        parent = null;
        id;
        runner;
        scheduler;
        onTrack;
        onTrigger;
        onStop;
        callRunner;
        depth = [];
        constructor(runner, option = {}) {
            this.id = ++ReactiveEffect.uuid;
            this.runner = runner;
            this.scheduler = option.scheduler || null;
            this.onTrack = option.onTrack || null;
            this.onTrigger = option.onTrigger || null;
            this.onStop = option.onStop || null;
        }
        clearDepth() {
            for (let i = 0; i < this.depth.length; i++)
                this.depth[i].delete(this);
            this.depth = [];
        }
        pushStack() {
            // bind current effect object
            this.parent = ReactiveEffect.CurrentEffect;
            ReactiveEffect.CurrentEffect = this;
        }
        popStack() {
            // unbind current effect object
            ReactiveEffect.CurrentEffect = this.parent;
            this.parent = null;
        }
        run() {
            if (!this.activity)
                return this.runner();
            this.pushStack();
            // clear depths
            this.clearDepth();
            // execute runner
            try {
                return this.runner();
            }
            catch (e) {
                console.log(e);
            }
            finally {
                this.popStack();
            }
        }
        stop() {
            if (!this.activity)
                return;
            this.activity = false;
            this.clearDepth();
            if (this.onStop)
                this.onStop();
        }
    }
    /**
     * core effect function
     * Call run to re-render when data within run changes
     * */
    function effect(run, option = {}) {
        const _effect = new ReactiveEffect(run, option);
        if (!option.lazy && _effect.scheduler)
            _effect.scheduler(_effect.run.bind(_effect));
        else if (!option.lazy)
            _effect.run();
        let result;
        if (_effect.scheduler)
            // @ts-ignore
            result = () => _effect.scheduler(_effect.run.bind(_effect));
        else
            // @ts-ignore
            result = _effect.run.bind(_effect);
        result.stop = _effect.stop.bind(_effect);
        _effect.callRunner = result;
        return _effect.callRunner;
    }
    /**
     * All dependent storage containers
     * */
    const DependentStorageWeakMap = new WeakMap();
    /**
     * Collect all dependencies and bind them to the current effect
     * if current Effect is null , do not anything
     * */
    function track(target, key) {
        if (!ReactiveEffect.CurrentEffect)
            return;
        const effect = ReactiveEffect.CurrentEffect;
        let map, set;
        map = DependentStorageWeakMap.get(target);
        if (!map)
            DependentStorageWeakMap.set(target, map = new Map);
        set = map.get(key);
        if (!set)
            map.set(key, set = new Set);
        set.add(effect);
        effect.depth.push(set);
        if (!effect.callRunner)
            return;
        if (effect.onTrack) {
            effect.onTrack({
                target: toRow(target),
                key,
                type: 'get',
                effect: effect.callRunner
            });
        }
    }
    /**
     * Data change monitoring detects
     * and executes the response function
     * */
    function trigger(target, key, newValue, oldValue) {
        let map, set;
        map = DependentStorageWeakMap.get(target);
        if (!map)
            return;
        set = map.get(key);
        if (!set)
            return;
        new Set(set).forEach(effect => {
            if (effect === ReactiveEffect.CurrentEffect || !effect.callRunner)
                return;
            if (effect.onTrigger) {
                effect.onTrigger({
                    target: toRow(target),
                    key,
                    type: 'set',
                    oldValue,
                    newValue,
                    effect: effect.callRunner
                });
            }
            effect.callRunner();
        });
    }

    /**
     * has been proxied object WeakMap
     * All registered proxies are stored here
     * */
    const ProxyTableWeakMap = new WeakMap();
    /**
     * Reactive handlers
     * Call the get method when you get a property
     * Call the set method when you set a property
     * The ReflectAPI is called to solve the 'this' problem of the getter function
     * */
    const PROXY_HANDLER = {
        get(target, key, receiver) {
            // The object has been proxy if it has this property
            if (key === getSymbolByName('HAS_PROXY'))
                return true;
            // get original object
            if (key === getSymbolByName('ORIGINAL_ROW'))
                return target;
            // get data
            const result = Reflect.get(target, key, receiver);
            // Get the corresponding dependency
            track(target, key);
            // deal array
            if (result instanceof Array)
                return proxyArray(result, target, key);
            // began depth proxy , Proxy Result if it is an object
            if (typeof result === 'object')
                return reactive(result);
            return result;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            const result = Reflect.set(target, key, value, receiver);
            const newValue = target[key];
            // Executing dependent response
            if (newValue !== oldValue)
                trigger(target, key, newValue, oldValue);
            return result;
        }
    };
    /**
     * Work with data of array type
     * Make it available for response
     * */
    const arrayPrototypeMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
    function proxyArray(arr, original, key) {
        let proxy;
        if (proxy = ProxyTableWeakMap.get(arr))
            return proxy;
        for (const name of arrayPrototypeMethods) {
            // @ts-ignore
            arr[name] = function (...arg) {
                // @ts-ignore
                const result = Array.prototype[name].call(arr, ...arg);
                trigger(original, key, arr, arr);
                return result;
            };
        }
        proxy = new Proxy(arr, PROXY_HANDLER);
        ProxyTableWeakMap.set(arr, proxy);
        return proxy;
    }
    /**
     * Create reactive data
     * @param target : Object
     * */
    function reactive(target) {
        if (!(typeof target === 'object') || (target instanceof Array)) {
            warn('the type of target of reactive argument is \'' +
                (typeof target === 'object' ? 'array' : typeof target)
                + '\', may you can' + ' try use ref');
            return target;
        }
        // @ts-ignore If it has been proxied, return it
        if (isProxy(target))
            return target;
        // If the object has been proxied, return its proxy
        let proxy;
        if (proxy = ProxyTableWeakMap.get(target))
            return proxy;
        proxy = new Proxy(target, PROXY_HANDLER);
        // set into proxy WeakMap
        ProxyTableWeakMap.set(target, proxy);
        return proxy;
    }
    /** has been proxy or not */
    function isProxy(target) {
        // @ts-ignore
        return !!(target[getSymbolByName('HAS_PROXY')]);
    }

    class Ref {
        data;
        get [getSymbolByName('ORIGINAL_ROW')]() { return this.data; }
        get value() {
            return this.get();
        }
        set value(v) {
            this.set(v);
        }
        get() {
            track(this, 'value');
            return this.data;
        }
        set(v) {
            const oldValue = this.data;
            if (v === this.data)
                return;
            this.data = v;
            trigger(this, 'value', this.data, oldValue);
        }
        constructor(data, option = {}) {
            if (data instanceof Array)
                this.data = proxyArray(data, this, 'value');
            // @ts-ignore
            else if (typeof data === 'object')
                this.data = reactive(data);
            else
                this.data = data;
            if (option.get)
                this.get = option.get;
            if (option.set)
                this.set = option.set;
        }
    }
    function ref(data) {
        return new Ref(data);
    }

    function computed(fn) {
        let option = { get() { } };
        if (typeof fn === "function")
            option.get = fn;
        else
            option = fn;
        const data = new Ref(null, {
            set(v) {
                if (option.set)
                    option.set(v);
                else
                    error('this property is not define "setter"');
            }
        });
        effect(option.get, {
            scheduler(runner) {
                const oldValue = data.value;
                data.data = runner();
                trigger(data, 'value', data.value, oldValue);
            }
        });
        return data;
    }

    function getWatchArgument(arg) {
        if (typeof arg === 'object')
            return arg;
        else
            return {
                handler: arg,
                depth: false
            };
    }
    function watch(args, callback) {
        const option = getWatchArgument(callback);
        let getter;
        let run;
        // @ts-ignore set getters
        if (typeof args === "function")
            getter = args;
        else {
            let result = reactive(args);
            run = option.handler;
            getter = () => {
                if (option.depth)
                    readObject(result);
                return result;
            };
        }
        /** Make a change response */
        let oldValue, first = true;
        effect(getter, {
            scheduler(runner) {
                let newValue = runner();
                if (!first)
                    run(newValue, oldValue);
                oldValue = newValue;
                first = false;
                return newValue;
            }
        });
        return;
    }

    var index = {
        ref,
        toRow,
        effect,
        reactive,
        computed,
        watch,
        isProxy,
    };

    return index;

}));
