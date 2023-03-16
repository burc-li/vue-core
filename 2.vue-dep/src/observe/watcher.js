
/**
 * @name Watcher
 * @decs 每个响应式属性有一个dep 收集器（属性就是被观察者，watcher就是观察者），属性变化了会通知观察者来更新 -》 这就是我们的观察者模式
 * @decs 不同组件有不同的 watcher，目前我们只有一个渲染根实例的 watcher
 * @todo 1. 当我们创建渲染 watcher 的时候，我们会把当前的渲染 watcher 放到 Dep.target 上
 * @todo 2. 调用_render() 会取值，走到 get 上
 */

import Dep from './dep'

let id = 0

class Watcher {
  constructor(vm, fn) {
    this.id = id++
    this.getter = fn
    this.deps = [] // 用于后续我们实现计算属性，和一些清理工作
    this.depsId = new Set()
    this.get()
  }
  addDep(dep) {
    // 一个组件 对应 多个属性 重复的属性不用记录，去重操作
    let id = dep.id
    if (!this.depsId.has(id)) {
      this.deps.push(dep)
      this.depsId.add(id)
      dep.addSub(this) // watcher已经记住了dep，而且已经去重了，此时让 dep 也记住 watcher
    }
  }
  get() {
    Dep.target = this // Dep.target 是一个静态属性

    // 执行vm._render时，去vm上取 name 和 age。vm._render -> vm.$options.render.call(vm) -> with(this){} -> _s(name) -> 就会去作用域链 即this 上取 name
    // JavaScript 查找某个未使用命名空间的变量时，会通过作用域链来查找，作用域链是跟执行代码的 context 或者包含这个变量的函数有关。'with'语句将某个对象添加到作用域链的顶部，如果在 statement 中有某个未使用命名空间的变量，跟作用域链中的某个属性同名，则这个变量将指向这个属性值
    this.getter()

    Dep.target = null // 渲染完毕后就清空，保证了只有在模版渲染阶段的取值操作才会进行依赖收集
  }
  // // 重新渲染
  // update() {
  //   console.log('watcher-update')
  //   this.get()
  // }
  // 重新渲染
  update() {
    console.log('watcher-update')
    queueWatcher(this) // 把当前的 watcher 暂存起来
    // this.get(); // 重新渲染
  }
  run() {
    this.get() // 渲染的时候用的是最新的 vm 来渲染的
  }
}

/** 实现内部 watcher 异步更新 - nextTick */
let queue = []
let has = {}
let pending = false // 防抖
function flushSchedulerQueue() {
  let flushQueue = queue.slice(0)
  queue = []
  has = {}
  pending = false
  flushQueue.forEach(q => q.run()) // 在刷新的过程中可能还有新的 watcher，重新放到 queue 中
}
function queueWatcher(watcher) {
  const id = watcher.id
  if (!has[id]) {
    queue.push(watcher)
    has[id] = true
    // 不管我们的 update 执行多少次 ，但是最终只执行一轮刷新操作
    if (!pending) {
      nextTick(flushSchedulerQueue)
      pending = true
    }
  }
}

/** 实现暴露给用户API回调的异步更新 - nextTick */
let callbacks = [] // 存储 nextTick 回调
let waiting = false // 防抖
function flushCallbacks() {
  let cbs = callbacks.slice(0)
  waiting = false
  callbacks = []
  cbs.forEach(cb => cb()) // 按照顺序依次执行
}
// vue2中 nextTick 没有直接使用某个api 而是采用优雅降级的方式
// 内部先采用的是 promise(IE不兼容，微任务)  MutationObserver(H5的api，微任务)  setImmediate(IE专享，宏任务)  setTimeout（宏任务)
// let timerFunc;
// if (Promise) {
//     timerFunc = () => {
//         Promise.resolve().then(flushCallbacks)
//     }
// }else if(MutationObserver){
//     let observer = new MutationObserver(flushCallbacks); // 这里传入的回调是异步执行的
//     let textNode = document.createTextNode(1);
//     observer.observe(textNode,{
//         characterData:true
//     });
//     timerFunc = () => {
//         textNode.textContent = 2;
//     }
// }else if(setImmediate){
//     timerFunc = () => {
//        setImmediate(flushCallbacks);
//     }
// }else{
//     timerFunc = () => {
//         setTimeout(flushCallbacks);
//      }
// }
export function nextTick(cb) {
  // 先内部还是先用户的？按照顺序依次执行
  callbacks.push(cb) // 维护 nextTick 中的 cakllback 方法
  if (!waiting) {
    // timerFunc()
    Promise.resolve().then(flushCallbacks)
    waiting = true
  }
}

export default Watcher
