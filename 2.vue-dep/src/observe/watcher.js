
/**
 * @name Watcher
 * @decs 每个响应式属性有一个dep 收集器（属性就是被观察者，watcher就是观察者），属性变化了会通知观察者来更新 -》 这就是我们的观察者模式
 * @decs 不同组件有不同的 watcher，目前我们只有一个渲染根实例的 watcher
 * @todo 1. 当我们创建渲染 watcher 的时候，我们会把当前的渲染 watcher 放到 Dep.target 上
 * @todo 2. 调用_render() 会取值，走到 getter 上，调用 dep.depend() 进行双向依赖收集操作
 */

import Dep from './dep'
import { queueWatcher } from './scheduler'

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


export default Watcher
