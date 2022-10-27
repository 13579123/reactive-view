# Rvw (reactive view)一款极简的javascript响应式库
### 编译方式
```
    npm install -s -d
    npm run translate
```
### 目录信息
```
    dist                  // 编译后的代码
    src                   // 源代码
    |___ component        // 一些组合api
    |    |___ computed.ts // 计算属性
    |    |___ watch.ts    // 监视属性
    |___ effect           // 数据响应模块
    |    |___ effect.ts   // 数据响应实现
    |___ reactive         // 响应式数据模块
    |    |___ reactive.ts // 获取响应式对象
    |    |___ ref.ts      // 获取响应式数据
    |    |___ toRow.ts    // 获取原始数据
    |___ util             // 一些工具函数
    |___ config.ts        // 一些配置
    |___ index.ts         // 导出入口
```
### 简介
reactive-vie 是一个抽离的了 virtual dom 的响应式工具库，实现了基本数据改变调用指定函数的
响应式功能，导出模块为rvw。目前在尝试用它开发cocos游戏，希望有大佬可以帮忙看看
有没有什么问题或可以改进的地方。

### 核心api文档

#### 函数定义: ref &lt;T&gt; ( target: T ) : T
传入一个基本数据类型或者数组，返回一个包含该数据的响应式的对象
```javascript
// 基本示例
const count = rvw.ref(0)

rvw.effect(() => {
    console.log(`count.value 改变了，改变后的数据是 ${count.value}`)
})

setInterval(() => count.value++ , 1500)

// 执行结果
// 每隔1.5s输出 count.value 改变了，改变后的数据是 xxx
```

#### 函数定义: reactive &lt;T&gt; ( target: T ): T
传入一个对象，返回一个该对象的响应式代理
```javascript
// 基本示例
const state = rvw.reactive({
    name: '我是名字',
    age: 18
})

rvw.effect(() => {
    console.log(`name : ${state.name} age: ${state.age}`)
})

setInterval(() => {
    state.age++
} , 1500)

// 执行结果
// 每隔1.5s输出 name : 我是名字 age: xxx
```

#### 函数定义: effect &lt;T&gt; ( run: () => T , option: EffectOption&lt;T&gt; = {} ): Runner&lt;T&gt;
定义一个回调函数，每当回调函数内使用的数据改变时，调用该回调函数，用法见 ref 和 reactive
```javascript
// 基本示例
const runner = rvw.effect(() => {
    console.log('runner')
})

runner() // 输出 runner

runner.stop() // 调用该函数后，当数据发生变化时，将不再响应，并且它不会再收集依赖

// option 参数配置
// {
//     lazy: boolean 判断是否懒启动
//     scheduler: (runner: Runner<T>) => T 用户定义响应回调
//     onStop: () => void 当调用stop时调用
// }
```
