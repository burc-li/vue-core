/**
 * @name Watcher
 * @decs 每个响应式属性有一个dep 收集器（属性就是被观察者，watcher就是观察者），属性变化了会通知观察者来更新 -》 这就是我们的观察者模式
 * @decs 不同组件有不同的 watcher，目前我们只有一个渲染根实例的 watcher
 * @todo 1. 当我们创建渲染 watcher 的时候，我们会把当前的渲染 watcher 放到 Dep.target 上
 * @todo 2. 调用_render() 会取值，走到 getter 上，调用 dep.depend() 进行双向依赖收集操作
 * @split 计算属性watcher---------
 * @todo 1. lazy：懒的，不会立即执行get方法
 * @todo 2. dirty：脏的，决定重新读取get返回值 还是 读取缓存值
 * @todo 3. value：存储 get返回值
 * @todo 4. evaluate 计算属性watcher为脏时，执行 evaluate，并将其标识为干净的
 * @todo 5. depend 用于洋葱模型中计算属性watcher订阅的dep 去depend收集上层watcher 即Dep.target（可能是计算属性watcher，也可能是渲染watcher)
 * @split 监听器watcher---------
 * @todo 1. user：用户watcher，即监听器watcher
 * @todo 2. cb：监听器回调
 * @todo 3. 在 queueWatcher 内部执行 run 方法时，如果是 用户watcher，则执行回调方法
 */

import { popTarget, pushTarget } from './dep'
import { queueWatcher } from './scheduler'

let id = 0

class Watcher {
  constructor(vm, exprOrFn, options, cb) {
    this.id = id++
    
    if (typeof exprOrFn === 'string') {
      this.getter = function () {
        return vm[exprOrFn]
      }
    } else {
      this.getter = exprOrFn // getter意味着调用这个函数可以发生取值操作
    }

    this.deps = [] // 存储订阅dep，用于后续我们实现计算属性洋葱模型，和一些清理工作
    this.depsId = new Set() // 用于去重

    // 计算属性watcher 用到的属性
    this.vm = vm
    this.lazy = options.lazy // 懒的，不会立即执行get方法
    this.dirty = this.lazy // 脏的，决定重新读取get返回值 还是 读取缓存值

    // 监听器watcher 用到的属性
    this.user = options.user // 标识是否是用户自己的watcher
    this.cb = cb
    this.deep = options.deep

    this.value = this.lazy ? undefined : this.get() // 存储 get返回值
  }
  // 订阅 dep，并通知 dep 收集 watcher
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
    pushTarget(this) // Dep.target 是一个静态属性
    // 执行vm._render时，去vm上取 name 和 age。vm._render -> vm.$options.render.call(vm) -> with(this){} -> _s(name) -> 就会去作用域链 即this 上取 name
    // JavaScript 查找某个未使用命名空间的变量时，会通过作用域链来查找，作用域链是跟执行代码的 context 或者包含这个变量的函数有关。'with'语句将某个对象添加到作用域链的顶部，如果在 statement 中有某个未使用命名空间的变量，跟作用域链中的某个属性同名，则这个变量将指向这个属性值
    let value = this.getter.call(this.vm) // 会去vm上取值  vm._update(vm._render) 取name 和age

    popTarget() // 渲染完毕后就清空，保证了只有在模版渲染阶段的取值操作才会进行依赖收集
    return value
  }
  // 重新渲染
  update() {
    console.log('watcher-update')
    if (this.lazy) {
      // 计算属性依赖的值发生改变，触发 setter 通知 watcher 更新，将计算属性watcher 标识为脏值即可
      // 后面还会触发渲染watcher，会走 evaluate 重新读取返回值
      this.dirty = true
    } else {
      queueWatcher(this) // 把当前的watcher 暂存起来，异步队列渲染
      // this.get(); // 重新渲染
    }
  }

  // queueWatcher 内部执行 run 方法
  run() {
    let oldValue = this.value
    let newValue = (this.value = this.get()) // 渲染的时候用的是最新的vm来渲染的，需要重新赋值啊！！！！！
    if (this.user) {
      this.cb.call(this.vm, newValue, oldValue)
    }
  }

  // 计算属性watcher为脏时，执行 evaluate，并将其标识为干净的
  evaluate() {
    this.value = this.get() // 重新获取到用户函数的返回值
    this.dirty = false
  }
  // 用于洋葱模型中计算属性watcher 订阅的dep去 depend收集上层watcher 即Dep.target（可能是计算属性watcher，也可能是渲染watcher)
  depend() {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }
}

export default Watcher
