/**
 * @name Dep收集器
 * @decs 每个响应式属性有一个 dep 收集器（属性就是被观察者，watcher就是观察者），属性变化了会通知观察者来更新 -》 这就是我们的观察者模式
 * @decs 需要给每个响应式属性增加一个 dep， 目的就是收集watcher，当响应式数据发生变化时，更新收集的所有 watcher
 * @todo 1. dep 和 watcher 是一个多对多的关系
 * @todo 2. 一个属性可以在多个组件中使用 （一个 dep 对应多个 watcher）
 * @todo 3. 一个组件中由多个属性组成 （一个 watcher 对应多个 dep）
 * @split 计算属性---------
 * @todo 1. pushTarget
 * @todo 2. popTarget
 */

let id = 0

class Dep {
  constructor() {
    this.id = id++
    // 依赖收集，收集当前属性对应的观察者 watcher
    this.subs = []
  }
  // 通知 watcher 收集 dep
  depend() {
    console.log('双向依赖收集')
    Dep.target.addDep(this)
  }
  // 让当前的 dep收集 watcher
  addSub(watcher) {
    this.subs.push(watcher)
  }
  // 通知当前 dep关联的所有 watcher 去更新
  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}

// 当前渲染的 watcher，静态变量，类似于全局变量，只有一份
Dep.target = null

// 存放 watcher 的栈， 目的：用于洋葱模型中计算属性watcher订阅的dep去收集上层watcher
let stack = []
// 当前 watcher 入栈， Dep.target 指向 当前 watcher
export function pushTarget(watcher) {
  stack.push(watcher)
  Dep.target = watcher
}
// 栈中最后一个 watcher 出栈，Dep.target指向栈中 最后一个 watcher，若栈为空，则为 undefined
export function popTarget() {
  stack.pop()
  Dep.target = stack[stack.length - 1]
}

export default Dep
