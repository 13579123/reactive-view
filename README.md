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
reactive-vie 是我学习之余编写的javascript极简(所谓的极简，就是极度简单的意思T^T。)
工具库，实现了基本的类似于vue的数据改变调用指定函数的
响应式功能，导出模块为rvw。目前在尝试用它开发cocos游戏，希望有大佬可以帮忙看看
有没有什么问题或可以改进的地方。

