# vue2-core

### 介绍
本仓库用于学习Vue2设计思想和理念，手写部分核心源码
### 安装
```
cd 1.vue-render (2.vue-dep ...)
npm install
```
### 启动
```
npm run dev
```
>可使用浏览器打开 dist 目录下的 html 测试文件 （vscode 推荐使用 Live Server 插件）

### 章节介绍
#### 1.vue-render
主要介绍 响应式原理，模版编译，数据驱动渲染

详情可参考掘金地址：

[【Vue2.x源码系列01】响应式原理](https://juejin.cn/post/7205141492264566845)
  
[【Vue2.x源码系列02】模版编译（AST、Optimize 、Render）](https://juejin.cn/post/7208112485763907642)

[【Vue2.x源码系列03】数据驱动渲染（Render、Update）](https://juejin.cn/post/7208907027842007096)

#### 2.vue-dep
主要介绍 依赖收集，异步更新及nextTick原理

详情可参考掘金地址：

[【Vue2.x源码系列04】依赖收集（Dep、Watcher、Observer）](https://juejin.cn/post/7213672268152324151)

[【Vue2.x源码系列05】异步更新及nextTick原理](https://juejin.cn/post/7215568891125022778)

#### 3.vue-set
主要介绍 Vue.set原理

详情可参考掘金地址：
[【Vue2.x源码系列04】依赖收集（Dep、Watcher、Observer）](https://juejin.cn/post/7213672268152324151)
>本篇文章提及了 Vue.set原理

#### 4.vue-mixin
主要介绍 Vue.mixin混入原理

#### 5.vue-computed
主要介绍 计算属性原理

详情可参考掘金地址：
[【Vue2.x源码系列06】计算属性computed原理](https://juejin.cn/post/7220020535299539002)

#### 6.vue-watch
主要介绍 侦听器原理

详情可参考掘金地址：
[【Vue2.x源码系列07】侦听器watch原理](https://juejin.cn/post/7220035506989514809)

#### 7.vue-diff
主要介绍 Diff算法原理

详情可参考掘金地址：
[【Vue2.x源码系列08】Diff算法原理](https://juejin.cn/post/7233324859932803128)

#### 8.vue-componet
主要介绍 Vue.component组件注册原理

